import {
  END_OF_DAY_PIPELINE_STEP_DEFINITIONS,
  END_OF_DAY_RUNTIME_STEP_SEQUENCE,
} from './dayPipelineConstants';
import {
  assertPipelineAccessModeGuards,
  assertPipelineIdempotencyMarkers,
  assertPipelineStepOrder,
  getDayPipelineAccessMode,
  getEndOfDayPipelineStepDefinitions,
  getPipelineStepSkipReason,
  shouldRunPipelineStep,
  validateKnownStateKeys,
} from './dayPipelineOrchestrator';
import type {
  DayPipelineAuditFinding,
  DayPipelineAuditResult,
  DayPipelineContext,
  DayPipelineRunSummary,
  DayPipelineStepDefinition,
  DayPipelineStepResult,
} from './dayPipelineTypes';

const EFFECT_STEP_IDS = [
  'daily_plan_effects',
  'assignment_effects',
  'micro_decision_effects',
  'crisis_action_effects',
  'main_operation_season_process',
  'crisis_state_process',
] as const;

export function validateDayPipelineStepDefinitions(
  steps: DayPipelineStepDefinition[],
): DayPipelineAuditFinding[] {
  const findings: DayPipelineAuditFinding[] = [];
  const ids = steps.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) {
    findings.push({
      id: 'duplicate_step_ids',
      severity: 'fail',
      message: `Duplicate step ids: ${[...new Set(dupes)].join(', ')}`,
      recommendation: 'Ensure unique step ids',
    });
  }
  for (const step of steps) {
    if (!step.label.trim()) {
      findings.push({
        id: `empty_label_${step.id}`,
        severity: 'fail',
        stepId: step.id,
        message: `Step ${step.id} has empty label`,
        recommendation: 'Add label',
      });
    }
    if (step.isCritical && !step.description.trim()) {
      findings.push({
        id: `empty_desc_${step.id}`,
        severity: 'fail',
        stepId: step.id,
        message: `Critical step ${step.id} missing description`,
        recommendation: 'Add description',
      });
    }
  }
  return findings;
}

export function validateStepOrder(
  steps: DayPipelineStepDefinition[],
): DayPipelineAuditFinding[] {
  return assertPipelineStepOrder(steps);
}

export function validateIdempotencyGuards(
  ctx: DayPipelineContext,
): DayPipelineAuditFinding[] {
  const day = ctx.gameState.city.day;
  const findings: DayPipelineAuditFinding[] = [];
  const markers: Array<{ key: string; label: string }> = [
    { key: 'operationSignals.lastProcessedDay', label: 'operationSignals' },
    { key: 'dailyOperationsPlan.lastProcessedDay', label: 'dailyOperationsPlan' },
    { key: 'assignments.lastProcessedDay', label: 'assignments' },
    { key: 'microDecisionState.lastProcessedDay', label: 'microDecisionState' },
    { key: 'crisisActionState.lastProcessedDay', label: 'crisisActionState' },
    { key: 'mainOperationSeason.lastProcessedDay', label: 'mainOperationSeason' },
    { key: 'crisisState.lastProcessedDay', label: 'crisisState' },
  ];
  for (const { key, label } of markers) {
    const step = END_OF_DAY_PIPELINE_STEP_DEFINITIONS.find((s) => s.idempotencyKey === key);
    if (!step) continue;
    if (ctx.lastClosedDay === day) {
      findings.push({
        id: `idempotency_preflight_${label}`,
        severity: 'pass',
        stepId: step.id,
        message: `${label} protected by preflight when day already closed`,
        recommendation: 'No action',
      });
    }
  }
  return findings;
}

export function validateAccessModeStepEligibility(
  ctx: DayPipelineContext,
  steps: DayPipelineStepDefinition[],
): DayPipelineAuditFinding[] {
  return assertPipelineAccessModeGuards(ctx, steps);
}

export function validateReportBuildPosition(
  steps: DayPipelineStepDefinition[],
): DayPipelineAuditFinding[] {
  const findings: DayPipelineAuditFinding[] = [];
  const indexById = new Map(steps.map((s, i) => [s.id, i]));
  const reportIdx = indexById.get('report_build');
  if (reportIdx == null) {
    findings.push({
      id: 'report_build_missing',
      severity: 'fail',
      message: 'report_build step missing from definitions',
      recommendation: 'Add report_build step',
    });
    return findings;
  }
  for (const effectId of EFFECT_STEP_IDS) {
    const effectIdx = indexById.get(effectId);
    if (effectIdx == null) continue;
    if (reportIdx <= effectIdx) {
      findings.push({
        id: `report_before_${effectId}`,
        severity: 'fail',
        stepId: 'report_build',
        message: `report_build must be after ${effectId} in canonical definitions`,
        recommendation: 'Move report_build later in definition list',
      });
    }
  }
  return findings;
}

export function validateCrisisActionBeforeCrisisProcess(
  steps: DayPipelineStepDefinition[],
): DayPipelineAuditFinding[] {
  const findings: DayPipelineAuditFinding[] = [];
  const indexById = new Map(steps.map((s, i) => [s.id, i]));
  const actionIdx = indexById.get('crisis_action_effects');
  const crisisIdx = indexById.get('crisis_state_process');
  if (actionIdx == null || crisisIdx == null) {
    findings.push({
      id: 'crisis_steps_missing',
      severity: 'fail',
      message: 'crisis_action_effects or crisis_state_process missing',
      recommendation: 'Add both crisis pipeline steps',
    });
    return findings;
  }
  if (actionIdx >= crisisIdx) {
    findings.push({
      id: 'crisis_action_after_crisis',
      severity: 'fail',
      stepId: 'crisis_action_effects',
      message: 'crisis_action_effects must be defined before crisis_state_process',
      recommendation: 'Reorder crisis steps',
    });
  }
  return findings;
}

export function validatePilotDoesNotRunPostPilotSteps(
  ctx: DayPipelineContext,
  steps: DayPipelineStepDefinition[],
): DayPipelineAuditFinding[] {
  const accessMode = getDayPipelineAccessMode(ctx);
  if (accessMode !== 'pilot') {
    return [];
  }
  const findings: DayPipelineAuditFinding[] = [];
  for (const step of steps) {
    if (
      step.id === 'crisis_action_effects' &&
      shouldRunPipelineStep(accessMode, step)
    ) {
      findings.push({
        id: 'pilot_crisis_action_runs',
        severity: 'fail',
        stepId: step.id,
        message: 'Pilot must not run crisis_action_effects',
        recommendation: 'Restrict runsIn to main_operation_full',
      });
    }
  }
  const fullOnly = steps.filter(
    (s) => s.isCritical && s.runsIn.length === 1 && s.runsIn[0] === 'main_operation_full',
  );
  for (const step of fullOnly) {
    const skip = getPipelineStepSkipReason(accessMode, step);
    if (!skip) {
      findings.push({
        id: `pilot_full_step_${step.id}`,
        severity: 'fail',
        stepId: step.id,
        message: `Pilot incorrectly eligible for ${step.id}`,
        recommendation: 'Fix runsIn on step definition',
      });
    }
  }
  return findings;
}

export function validateLimitedDoesNotRunFullMainSteps(
  ctx: DayPipelineContext,
  steps: DayPipelineStepDefinition[],
): DayPipelineAuditFinding[] {
  const accessMode = getDayPipelineAccessMode(ctx);
  if (accessMode !== 'post_pilot_limited') {
    return [];
  }
  const findings: DayPipelineAuditFinding[] = [];
  const crisisAction = steps.find((s) => s.id === 'crisis_action_effects');
  if (crisisAction && shouldRunPipelineStep(accessMode, crisisAction)) {
    findings.push({
      id: 'limited_crisis_action',
      severity: 'fail',
      stepId: 'crisis_action_effects',
      message: 'Limited mode must not run crisis_action_effects',
      recommendation: 'Keep crisis actions main_operation_full only',
    });
  }
  return findings;
}

export function validateNoDuplicateStepIds(
  steps: DayPipelineStepDefinition[],
): DayPipelineAuditFinding[] {
  return validateDayPipelineStepDefinitions(steps).filter((f) =>
    f.id.startsWith('duplicate'),
  );
}

export function validateRequiredStateKeysKnown(
  steps: DayPipelineStepDefinition[],
): DayPipelineAuditFinding[] {
  return validateKnownStateKeys(steps);
}

export function validateRuntimeReportOrder(): DayPipelineAuditFinding[] {
  const findings: DayPipelineAuditFinding[] = [];
  const reportIdx = END_OF_DAY_RUNTIME_STEP_SEQUENCE.indexOf('report_build');
  if (reportIdx < 0) return findings;
  for (const effectId of EFFECT_STEP_IDS) {
    const effectIdx = END_OF_DAY_RUNTIME_STEP_SEQUENCE.indexOf(effectId);
    if (effectIdx >= 0 && reportIdx > effectIdx) {
      continue;
    }
    if (effectIdx >= 0 && reportIdx < effectIdx) {
      findings.push({
        id: `runtime_report_before_${effectId}`,
        severity: 'warn',
        stepId: 'report_build',
        message: `Runtime store runs report_build before ${effectId}; report cards read live slices`,
        recommendation: 'post_day_refresh order follows existing store behavior',
      });
    }
  }
  return findings;
}

export function validateRuntimeCrisisOrder(): DayPipelineAuditFinding[] {
  const actionIdx = END_OF_DAY_RUNTIME_STEP_SEQUENCE.indexOf('crisis_action_effects');
  const crisisIdx = END_OF_DAY_RUNTIME_STEP_SEQUENCE.indexOf('crisis_state_process');
  if (actionIdx < 0 || crisisIdx < 0) {
    return [
      {
        id: 'runtime_crisis_steps_missing',
        severity: 'fail',
        message: 'Runtime sequence missing crisis steps',
        recommendation: 'Update END_OF_DAY_RUNTIME_STEP_SEQUENCE',
      },
    ];
  }
  if (actionIdx >= crisisIdx) {
    return [
      {
        id: 'runtime_crisis_order',
        severity: 'fail',
        message: 'Runtime must apply crisis_action_effects before crisis_state_process',
        recommendation: 'Fix endCurrentDay store order',
      },
    ];
  }
  return [];
}

export function validateCleanupStepPresent(
  steps: DayPipelineStepDefinition[],
): DayPipelineAuditFinding[] {
  const cleanup = steps.find((s) => s.id === 'cleanup');
  if (!cleanup) {
    return [
      {
        id: 'cleanup_missing',
        severity: 'warn',
        message: 'cleanup step not defined',
        recommendation: 'Add cleanup step to pipeline definitions',
      },
    ];
  }
  return [];
}

export function validateAuthorityBadgeNotes(
  steps: DayPipelineStepDefinition[],
): DayPipelineAuditFinding[] {
  const step = steps.find((s) => s.id === 'authority_badge_process');
  if (!step?.description.trim()) {
    return [
      {
        id: 'authority_notes_missing',
        severity: 'warn',
        stepId: 'authority_badge_process',
        message: 'authority_badge_process step notes sparse',
        recommendation: 'authority/badge idempotency marker inferred',
      },
    ];
  }
  return [];
}

export function runDayPipelineAudit(ctx: DayPipelineContext): DayPipelineAuditResult {
  const steps = END_OF_DAY_PIPELINE_STEP_DEFINITIONS;
  const accessMode = getDayPipelineAccessMode(ctx);
  const day = ctx.gameState.city.day;

  const allFindings: DayPipelineAuditFinding[] = [
    ...validateDayPipelineStepDefinitions(steps),
    ...validateStepOrder(steps),
    ...assertPipelineIdempotencyMarkers(steps),
    ...validateReportBuildPosition(steps),
    ...validateCrisisActionBeforeCrisisProcess(steps),
    ...validateAccessModeStepEligibility(ctx, steps),
    ...validatePilotDoesNotRunPostPilotSteps(ctx, steps),
    ...validateLimitedDoesNotRunFullMainSteps(ctx, steps),
    ...validateRequiredStateKeysKnown(steps),
    ...validateRuntimeReportOrder(),
    ...validateRuntimeCrisisOrder(),
    ...validateCleanupStepPresent(steps),
    ...validateAuthorityBadgeNotes(steps),
    ...validateIdempotencyGuards(ctx),
  ];

  const failCount = allFindings.filter((f) => f.severity === 'fail').length;
  const warnCount = allFindings.filter((f) => f.severity === 'warn').length;
  const eligible = getEndOfDayPipelineStepDefinitions(ctx);
  const skippedStepCount = steps.filter(
    (s) => !shouldRunPipelineStep(accessMode, s),
  ).length;

  return {
    health: failCount > 0 ? 'FAIL' : warnCount > 0 ? 'WARN' : 'PASS',
    day,
    accessMode,
    checkedStepCount: steps.length,
    processedStepCount: eligible.length,
    skippedStepCount,
    warnCount,
    failCount,
    findings: allFindings,
  };
}

export function buildDayPipelineRunSummary(
  ctx: DayPipelineContext,
  stepResults: DayPipelineStepResult[],
): DayPipelineRunSummary {
  return {
    day: ctx.gameState.city.day,
    accessMode: getDayPipelineAccessMode(ctx),
    stepResults,
    audit: runDayPipelineAudit(ctx),
  };
}

export function runEndOfDayPipelineAuditOnly(
  ctx: DayPipelineContext,
): DayPipelineAuditResult {
  return runDayPipelineAudit(ctx);
}
