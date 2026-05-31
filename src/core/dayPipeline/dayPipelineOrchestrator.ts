import { normalizePostPilotOperationState } from '@/core/postPilot/postPilotOperationSeed';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  DAY_PIPELINE_KNOWN_STATE_KEYS,
  END_OF_DAY_PIPELINE_STEP_DEFINITIONS,
} from './dayPipelineConstants';
import type {
  DayPipelineAccessMode,
  DayPipelineAuditFinding,
  DayPipelineContext,
  DayPipelineRunSummary,
  DayPipelineStepDefinition,
  DayPipelineStepId,
  DayPipelineStepResult,
  DayPipelineStepStatus,
} from './dayPipelineTypes';

export function getDayPipelineAccessMode(
  ctx: Pick<DayPipelineContext, 'gameState' | 'monetization'>,
): DayPipelineAccessMode {
  const { gameState, monetization } = ctx;
  if (gameState.pilot.status === 'active') {
    return 'pilot';
  }
  if (gameState.pilot.status !== 'completed') {
    return 'unknown';
  }
  const phase = normalizePostPilotOperationState(gameState.pilot.postPilotOperation, {
    pilotStatus: gameState.pilot.status,
    currentPilotDay: gameState.pilot.currentPilotDay,
  }).phase;
  if (phase === 'main_operation_full' || monetization.mainOperationAccess === 'full') {
    return 'main_operation_full';
  }
  if (
    phase === 'main_operation_light' ||
    monetization.mainOperationAccess === 'limited'
  ) {
    return 'post_pilot_limited';
  }
  if (gameState.city.day >= POST_PILOT_FIRST_OPERATION_DAY) {
    return 'post_pilot_full';
  }
  return 'unknown';
}

export function getEndOfDayPipelineStepDefinitions(
  ctx: Pick<DayPipelineContext, 'gameState' | 'monetization'>,
): DayPipelineStepDefinition[] {
  const accessMode = getDayPipelineAccessMode(ctx);
  return END_OF_DAY_PIPELINE_STEP_DEFINITIONS.filter((step) =>
    shouldRunPipelineStep(accessMode, step),
  );
}

export function shouldRunPipelineStep(
  accessMode: DayPipelineAccessMode,
  step: DayPipelineStepDefinition,
): boolean {
  if (step.runsIn.includes(accessMode)) {
    return true;
  }
  if (accessMode === 'unknown') {
    return !step.isCritical;
  }
  return false;
}

export function getPipelineStepSkipReason(
  accessMode: DayPipelineAccessMode,
  step: DayPipelineStepDefinition,
): string | undefined {
  if (shouldRunPipelineStep(accessMode, step)) {
    return undefined;
  }
  return `accessMode=${accessMode} step runsIn=[${step.runsIn.join(',')}]`;
}

export function createDayPipelineStepResult(params: {
  stepId: DayPipelineStepId;
  status: DayPipelineStepStatus;
  day: number;
  reason?: string;
  beforeSummary?: Record<string, unknown>;
  afterSummary?: Record<string, unknown>;
  warnings?: string[];
}): DayPipelineStepResult {
  return {
    stepId: params.stepId,
    status: params.status,
    day: params.day,
    reason: params.reason,
    beforeSummary: params.beforeSummary,
    afterSummary: params.afterSummary,
    warnings: params.warnings ?? [],
  };
}

export function summarizeStateForStep(
  ctx: DayPipelineContext,
  step: DayPipelineStepDefinition,
): Record<string, unknown> {
  const day = ctx.gameState.city.day;
  switch (step.id) {
    case 'preflight_guard':
      return {
        day,
        lastClosedDay: ctx.lastClosedDay ?? null,
        lastDailyReportDay: ctx.lastDailyReport?.day ?? null,
      };
    case 'operation_signals_base_eod':
      return { lastProcessedDay: ctx.operationSignals?.lastProcessedDay ?? null };
    case 'daily_plan_effects':
      return { lastProcessedDay: ctx.dailyOperationsPlan?.lastProcessedDay ?? null };
    case 'assignment_effects':
      return { lastProcessedDay: ctx.assignments?.lastProcessedDay ?? null };
    case 'micro_decision_effects':
      return { lastProcessedDay: ctx.microDecisionState?.lastProcessedDay ?? null };
    case 'crisis_action_effects':
      return { lastProcessedDay: ctx.crisisActionState?.lastProcessedDay ?? null };
    case 'main_operation_season_process':
      return { lastProcessedDay: ctx.mainOperationSeason?.lastProcessedDay ?? null };
    case 'crisis_state_process':
      return {
        lastProcessedDay: ctx.crisisState?.lastProcessedDay ?? null,
        lastIncidentDay: ctx.crisisState?.lastIncidentDay ?? null,
      };
    case 'advisor_eod_process':
      return {
        lastExperienceGrantDay: ctx.advisorState?.lastExperienceGrantDay ?? null,
        lastPredictionEvaluatedDay: ctx.advisorState?.lastPredictionEvaluatedDay ?? null,
      };
    case 'report_build':
      return { lastDailyReportDay: ctx.lastDailyReport?.day ?? null };
    default:
      return { day, stepId: step.id };
  }
}

export function assertPipelineStepOrder(
  steps: DayPipelineStepDefinition[],
): DayPipelineAuditFinding[] {
  const findings: DayPipelineAuditFinding[] = [];
  const indexById = new Map(steps.map((s, i) => [s.id, i]));

  for (const step of steps) {
    if (step.mustRunBefore) {
      for (const beforeId of step.mustRunBefore) {
        const beforeIdx = indexById.get(beforeId);
        const selfIdx = indexById.get(step.id);
        if (beforeIdx == null || selfIdx == null) continue;
        if (selfIdx >= beforeIdx) {
          findings.push({
            id: `order_${step.id}_before_${beforeId}`,
            severity: 'fail',
            stepId: step.id,
            message: `${step.id} must run before ${beforeId} in definition order`,
            recommendation: 'Reorder END_OF_DAY_PIPELINE_STEP_DEFINITIONS',
          });
        }
      }
    }
    if (step.mustRunAfter) {
      for (const afterId of step.mustRunAfter) {
        const afterIdx = indexById.get(afterId);
        const selfIdx = indexById.get(step.id);
        if (afterIdx == null || selfIdx == null) continue;
        if (selfIdx <= afterIdx) {
          findings.push({
            id: `order_${step.id}_after_${afterId}`,
            severity: 'fail',
            stepId: step.id,
            message: `${step.id} must run after ${afterId} in definition order`,
            recommendation: 'Reorder END_OF_DAY_PIPELINE_STEP_DEFINITIONS',
          });
        }
      }
    }
  }
  return findings;
}

export function assertPipelineIdempotencyMarkers(
  steps: DayPipelineStepDefinition[],
): DayPipelineAuditFinding[] {
  const findings: DayPipelineAuditFinding[] = [];
  for (const step of steps) {
    if (step.isCritical && !step.idempotencyKey) {
      findings.push({
        id: `idempotency_missing_${step.id}`,
        severity: 'fail',
        stepId: step.id,
        message: `Critical step ${step.id} missing idempotencyKey`,
        recommendation: 'Add idempotencyKey to step definition',
      });
    }
    if (!step.isCritical && !step.idempotencyKey) {
      findings.push({
        id: `idempotency_optional_${step.id}`,
        severity: 'warn',
        stepId: step.id,
        message: `Non-critical step ${step.id} has no idempotencyKey`,
        recommendation: 'Consider adding idempotency marker',
      });
    }
  }
  return findings;
}

export function assertPipelineAccessModeGuards(
  ctx: DayPipelineContext,
  steps: DayPipelineStepDefinition[],
): DayPipelineAuditFinding[] {
  const accessMode = getDayPipelineAccessMode(ctx);
  const findings: DayPipelineAuditFinding[] = [];
  for (const step of steps) {
    const skip = getPipelineStepSkipReason(accessMode, step);
    if (skip && step.isCritical && step.runsIn.length === 1) {
      findings.push({
        id: `access_critical_${step.id}`,
        severity: 'warn',
        stepId: step.id,
        message: `Critical step ${step.id} not eligible for ${accessMode}`,
        recommendation: 'Verify skip reason in store matches access mode',
      });
    }
  }
  return findings;
}

export function isPipelinePreflightBlocked(ctx: DayPipelineContext): boolean {
  const day = ctx.gameState.city.day;
  if (ctx.lastClosedDay === day) return true;
  if (ctx.lastDailyReport?.day === day) return true;
  return false;
}

export function readIdempotencyMarker(
  ctx: DayPipelineContext,
  key: string,
): number | undefined {
  switch (key) {
    case 'lastClosedDay':
      return ctx.lastClosedDay ?? undefined;
    case 'lastDailyReport.day':
      return ctx.lastDailyReport?.day;
    case 'operationSignals.lastProcessedDay':
      return ctx.operationSignals?.lastProcessedDay;
    case 'dailyOperationsPlan.lastProcessedDay':
      return ctx.dailyOperationsPlan?.lastProcessedDay;
    case 'assignments.lastProcessedDay':
      return ctx.assignments?.lastProcessedDay;
    case 'microDecisionState.lastProcessedDay':
      return ctx.microDecisionState?.lastProcessedDay;
    case 'crisisActionState.lastProcessedDay':
      return ctx.crisisActionState?.lastProcessedDay;
    case 'mainOperationSeason.lastProcessedDay':
      return ctx.mainOperationSeason?.lastProcessedDay;
    case 'crisisState.lastProcessedDay':
      return ctx.crisisState?.lastProcessedDay;
    case 'advisorState.lastExperienceGrantDay':
      return ctx.advisorState?.lastExperienceGrantDay;
    default:
      return undefined;
  }
}

export function isIdempotencyMarkerSatisfied(
  ctx: DayPipelineContext,
  key: string,
  day: number,
): boolean {
  const marker = readIdempotencyMarker(ctx, key);
  return marker === day;
}

export function validateKnownStateKeys(
  steps: DayPipelineStepDefinition[],
): DayPipelineAuditFinding[] {
  const known = new Set<string>(DAY_PIPELINE_KNOWN_STATE_KEYS);
  const findings: DayPipelineAuditFinding[] = [];
  for (const step of steps) {
    for (const key of [...step.requiredStateKeys, ...step.writesStateKeys]) {
      if (!known.has(key)) {
        findings.push({
          id: `unknown_key_${step.id}_${key}`,
          severity: 'warn',
          stepId: step.id,
          message: `Unknown state key referenced: ${key}`,
          recommendation: 'Add to DAY_PIPELINE_KNOWN_STATE_KEYS or fix typo',
        });
      }
    }
  }
  return findings;
}

// Re-export audit entry from audit module to avoid circular import in orchestrator summary
import { runDayPipelineAudit } from './dayPipelineAudit';
