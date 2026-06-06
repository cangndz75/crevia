import { SAVE_VERSION } from '@/store/gamePersist';

import {
  SOFT_LAUNCH_CORE_AUDIT_AREAS,
  SOFT_LAUNCH_CORE_BASE_PRELAUNCH_PASSES,
  SOFT_LAUNCH_CORE_DEFERRED_V11_SYSTEMS,
  SOFT_LAUNCH_CORE_DEFERRED_V2_SYSTEMS,
  SOFT_LAUNCH_CORE_LAUNCH_BLOCKERS,
  SOFT_LAUNCH_CORE_NON_GOALS,
} from './softLaunchCoreCompletenessConstants';
import type {
  SoftLaunchCoreAuditArea,
  SoftLaunchCoreDecision,
  SoftLaunchCoreOverallHealth,
  SoftLaunchCorePassPriority,
  SoftLaunchCorePreLaunchPass,
  SoftLaunchCoreResult,
} from './softLaunchCoreCompletenessTypes';

function cloneArea(area: SoftLaunchCoreAuditArea): SoftLaunchCoreAuditArea {
  return {
    ...area,
    evidence: [...area.evidence],
    relatedSystems: [...area.relatedSystems],
  };
}

function buildOverallHealth(areas: SoftLaunchCoreAuditArea[]): SoftLaunchCoreOverallHealth {
  if (areas.some((area) => area.status === 'BLOCKER')) return 'BLOCKED';
  if (areas.some((area) => area.status === 'FAIL')) return 'FAIL';
  if (areas.some((area) => area.status === 'WARN')) return 'WARN';
  return 'PASS';
}

function buildSoftLaunchCoreDecision(
  health: SoftLaunchCoreOverallHealth,
): SoftLaunchCoreDecision {
  if (health === 'BLOCKED') return 'blocked_for_launch_candidate';
  if (health === 'PASS') return 'ready_for_soft_launch_core';
  return 'needs_completion_pass';
}

function areaByPrompt(areas: SoftLaunchCoreAuditArea[], prompt: string): SoftLaunchCoreAuditArea | undefined {
  return areas.find((area) => area.suggestedPromptName === prompt);
}

function priorityFromArea(
  pass: SoftLaunchCorePreLaunchPass,
  areas: SoftLaunchCoreAuditArea[],
): SoftLaunchCorePassPriority {
  const linked = areaByPrompt(areas, pass.suggestedPromptName);
  if (!linked) return pass.priority;
  if (linked.status === 'BLOCKER') return 'must';
  if (linked.isImplementationRequiredBeforeSoftLaunch) return 'must';
  if (linked.status === 'WARN' && linked.recommendedTiming === 'pre_soft_launch') {
    return pass.priority === 'optional' ? 'should' : pass.priority;
  }
  return pass.priority;
}

function buildPreLaunchPasses(areas: SoftLaunchCoreAuditArea[]): SoftLaunchCorePreLaunchPass[] {
  return SOFT_LAUNCH_CORE_BASE_PRELAUNCH_PASSES.map((pass) => ({
    ...pass,
    priority: priorityFromArea(pass, areas),
  }));
}

function buildRecommendedPrompts(areas: SoftLaunchCoreAuditArea[]): string[] {
  const fromMustAreas = areas
    .filter((area) => area.isImplementationRequiredBeforeSoftLaunch)
    .map((area) => area.suggestedPromptName);
  const extras = [
    'Mahalle Karnesi Lite Review',
    'Şehir Günlüğü Lite Review',
    'Dynamic Map Reaction Lite Review',
    'Release Candidate Audit',
  ];
  return Array.from(new Set([...fromMustAreas, ...extras]));
}

function buildNetDecision(): string[] {
  return [
    'Crevia technical foundation strong.',
    'Soft launch core needs completion pass.',
    'Launch candidate remains blocked until IAP/store/manual test blockers are closed.',
    'Do not open major runtime systems before completion pass.',
    'Prioritize decision impact, tomorrow risk, echo binding, Day 8+ feel, and content visibility.',
  ];
}

export function runSoftLaunchCoreCompletenessAudit(): SoftLaunchCoreResult {
  const auditAreas = SOFT_LAUNCH_CORE_AUDIT_AREAS.map(cloneArea);
  const overallHealth = buildOverallHealth(auditAreas);
  const softLaunchCoreDecision = buildSoftLaunchCoreDecision(overallHealth);
  const mandatoryPreSoftLaunchPasses = buildPreLaunchPasses(auditAreas);

  const nonGoalsConfirmed = [
    ...SOFT_LAUNCH_CORE_NON_GOALS,
    `SAVE_VERSION remains ${SAVE_VERSION}.`,
  ];

  return {
    overallHealth,
    softLaunchCoreDecision,
    internalDeviceTestDecision: 'proceed_internal_test',
    mandatoryPreSoftLaunchPasses,
    recommendedNextPrompts: buildRecommendedPrompts(auditAreas),
    deferredV11Systems: [...SOFT_LAUNCH_CORE_DEFERRED_V11_SYSTEMS],
    deferredV2Systems: [...SOFT_LAUNCH_CORE_DEFERRED_V2_SYSTEMS],
    launchBlockers: [...SOFT_LAUNCH_CORE_LAUNCH_BLOCKERS],
    nonGoalsConfirmed,
    auditAreas,
    netDecision: buildNetDecision(),
  };
}
