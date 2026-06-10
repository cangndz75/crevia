import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';

import {
  REAL_DEVICE_PLAYTEST_BLOCKER_CATEGORIES,
  REAL_DEVICE_PLAYTEST_DOCS_PATH,
  REAL_DEVICE_PLAYTEST_MIN_AREAS,
  REAL_DEVICE_PLAYTEST_MIN_SCENARIOS,
} from './realDevicePlaytestConstants';
import {
  buildAllObservationTemplates,
  buildRealDevicePlaytestPlan,
} from './realDevicePlaytestPlan';
import type {
  CreviaRealDevicePlaytestDecision,
  CreviaRealDevicePlaytestHealthStatus,
  CreviaRealDevicePlaytestObservation,
  CreviaRealDevicePlaytestReadinessSummary,
  CreviaRealDevicePlaytestSeverity,
} from './playtestTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export function classifyPlaytestFinding(input: {
  category: string;
  title: string;
}): CreviaRealDevicePlaytestSeverity {
  const plan = buildRealDevicePlaytestPlan();
  const match = plan.riskTaxonomy.find(
    (r) => r.category === input.category || r.title === input.title,
  );
  if (match) return match.severity;

  if (REAL_DEVICE_PLAYTEST_BLOCKER_CATEGORIES.some((c) => input.category.includes(c))) {
    return 'blocker';
  }
  if (input.category.includes('cta') || input.category.includes('overflow')) return 'high';
  if (input.category.includes('duplicate') || input.category.includes('excess')) return 'medium';
  if (input.category.includes('spacing') || input.category.includes('animation')) return 'polish';
  return 'low';
}

export function buildPlaytestFixPrioritization(
  observations: CreviaRealDevicePlaytestObservation[] = [],
): Array<{
  severity: CreviaRealDevicePlaytestSeverity;
  scenarioId: string;
  fixRecommendation: string;
  owner: string;
}> {
  const severityOrder: CreviaRealDevicePlaytestSeverity[] = [
    'blocker',
    'high',
    'medium',
    'low',
    'polish',
  ];

  return observations
    .filter((o) => o.completed && o.observedResult.trim().length > 0)
    .sort(
      (a, b) =>
        severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
    )
    .map((o) => ({
      severity: o.severity,
      scenarioId: o.scenarioId,
      fixRecommendation: o.fixRecommendation || 'Document fix in playtest round log.',
      owner: o.owner,
    }));
}

export function summarizePlaytestReadiness(
  observations: CreviaRealDevicePlaytestObservation[] = [],
): CreviaRealDevicePlaytestReadinessSummary {
  const plan = buildRealDevicePlaytestPlan();
  const docsPresent = existsSync(join(REPO_ROOT, REAL_DEVICE_PLAYTEST_DOCS_PATH));
  const planPresent = plan.areas.length >= REAL_DEVICE_PLAYTEST_MIN_AREAS &&
    plan.scenarios.length >= REAL_DEVICE_PLAYTEST_MIN_SCENARIOS;

  const completed = observations.filter((o) => o.completed);
  const hasBlockerObservation = completed.some((o) => o.severity === 'blocker');
  const hasHighObservation = completed.some((o) => o.severity === 'high');

  let health: CreviaRealDevicePlaytestHealthStatus = 'WARN';
  let decision: CreviaRealDevicePlaytestDecision = 'continue_manual_playtest';

  if (!planPresent || !docsPresent) {
    health = 'BLOCKED';
    decision = 'blocked_for_release_candidate';
  } else if (completed.length === 0) {
    health = 'WARN';
    decision = 'ready_for_internal_device_test';
  } else if (hasBlockerObservation) {
    health = 'BLOCKED';
    decision = 'fix_required_before_iap_sandbox';
  } else if (hasHighObservation) {
    health = 'WARN';
    decision = 'fix_required_before_iap_sandbox';
  } else if (completed.length >= plan.scenarios.length) {
    health = 'PASS';
    decision = 'ready_for_internal_device_test';
  }

  const launchCandidateReady = false;

  const nextActions: string[] = [];
  if (!docsPresent) {
    nextActions.push(`Create ${REAL_DEVICE_PLAYTEST_DOCS_PATH}`);
  }
  if (completed.length === 0) {
    nextActions.push('Execute 16 scenarios on 6 device profiles; log observation sheets.');
    nextActions.push('IAP real purchase smoke test is separate — use verify:iap-sandbox-readiness.');
  }
  if (hasBlockerObservation) {
    nextActions.push('Fix blocker findings before IAP sandbox phase.');
  }
  if (nextActions.length === 0) {
    nextActions.push('Proceed to IAP sandbox smoke test pass after QA sign-off.');
  }

  return {
    health,
    decision,
    areaCount: plan.areas.length,
    scenarioCount: plan.scenarios.length,
    observationTemplateCount: buildAllObservationTemplates().length,
    completedObservationCount: completed.length,
    blockerRiskCategories: plan.riskTaxonomy.filter((r) => r.severity === 'blocker').length,
    planPresent,
    docsPresent,
    launchCandidateReady,
    nextActions,
  };
}

export function runRealDevicePlaytestAudit(
  observations: CreviaRealDevicePlaytestObservation[] = [],
): CreviaRealDevicePlaytestReadinessSummary {
  return summarizePlaytestReadiness(observations);
}

export function assertPlaytestPlanIntegrity(): {
  ok: boolean;
  areaCount: number;
  scenarioCount: number;
  saveVersion: number;
} {
  const plan = buildRealDevicePlaytestPlan();
  const templates = buildAllObservationTemplates();

  const scenariosValid = plan.scenarios.every(
    (s) =>
      s.steps.length > 0 &&
      s.expectedResult.length > 0 &&
      s.deviceProfiles.length > 0,
  );

  const templatesValid = templates.every(
    (t) =>
      t.scenarioId.length > 0 &&
      t.startState.length > 0 &&
      t.expectedResult.length > 0 &&
      t.steps.length > 0,
  );

  return {
    ok:
      plan.areas.length >= REAL_DEVICE_PLAYTEST_MIN_AREAS &&
      plan.scenarios.length >= REAL_DEVICE_PLAYTEST_MIN_SCENARIOS &&
      scenariosValid &&
      templatesValid &&
      SAVE_VERSION === 26,
    areaCount: plan.areas.length,
    scenarioCount: plan.scenarios.length,
    saveVersion: SAVE_VERSION,
  };
}
