import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { verifyFirstTenMinutesScenario } from '@/core/onboarding/verifyFirstTenMinutesScenario';
import { verifyPerformanceSelectorPassTwoScenario } from '@/core/quality/verifyPerformanceSelectorPassTwoScenario';
import { verifyQualityAuditScenario } from '@/core/quality/verifyQualityAuditScenario';
import { runSoftLaunchReadinessReview } from '@/core/releaseReadiness/softLaunchReviewAudit';
import { verifySoftLaunchReviewScenario } from '@/core/releaseReadiness/verifySoftLaunchReviewScenario';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  REAL_DEVICE_PLAYTEST_BLOCKER_CATEGORIES,
  REAL_DEVICE_PLAYTEST_DOCS_PATH,
  REAL_DEVICE_PLAYTEST_MIN_AREAS,
  REAL_DEVICE_PLAYTEST_MIN_SCENARIOS,
  REAL_DEVICE_PLAYTEST_RISK_TAXONOMY,
} from './realDevicePlaytestConstants';
import {
  assertPlaytestPlanIntegrity,
  classifyPlaytestFinding,
  runRealDevicePlaytestAudit,
} from './realDevicePlaytestAudit';
import {
  buildAllObservationTemplates,
  buildRealDevicePlaytestPlan,
} from './realDevicePlaytestPlan';
import {
  buildRealDevicePlaytestConsoleSummary,
  buildRealDevicePlaytestMarkdown,
} from './realDevicePlaytestPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

const REQUIRED_SEVERITIES = ['blocker', 'high', 'medium', 'low', 'polish'] as const;

export type VerifyRealDevicePlaytestOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  playtestHealth: string;
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

export function verifyRealDevicePlaytestScenario(): VerifyRealDevicePlaytestOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const plan = buildRealDevicePlaytestPlan();
  const templates = buildAllObservationTemplates();
  const integrity = assertPlaytestPlanIntegrity();
  const summary = runRealDevicePlaytestAudit();

  ok = assert(checks, integrity.ok, 'Plan integrity', 'Plan invalid') && ok;
  ok =
    assert(
      checks,
      plan.areas.length >= REAL_DEVICE_PLAYTEST_MIN_AREAS,
      `Areas ${REAL_DEVICE_PLAYTEST_MIN_AREAS}+`,
      `areas=${plan.areas.length}`,
    ) && ok;
  ok =
    assert(
      checks,
      plan.scenarios.length >= REAL_DEVICE_PLAYTEST_MIN_SCENARIOS,
      `Scenarios ${REAL_DEVICE_PLAYTEST_MIN_SCENARIOS}+`,
      `scenarios=${plan.scenarios.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      plan.scenarios.every((s) => s.steps.length > 0 && s.expectedResult.length > 0),
      'Every scenario has steps and expectedResult',
      'Incomplete scenario',
    ) && ok;
  ok =
    assert(
      checks,
      plan.scenarios.every((s) => s.deviceProfiles.length > 0),
      'Every scenario has device profiles',
      'Missing device profiles',
    ) && ok;

  ok =
    assert(
      checks,
      templates.length === plan.scenarios.length,
      'Observation template per scenario',
      `templates=${templates.length}`,
    ) && ok;
  ok =
    assert(
      checks,
      templates.every(
        (t) =>
          t.scenarioId &&
          t.startState &&
          t.expectedResult &&
          t.steps.length > 0 &&
          t.owner &&
          t.relatedVerifyScript,
      ),
      'Observation form required fields',
      'Incomplete observation template',
    ) && ok;

  for (const severity of REQUIRED_SEVERITIES) {
    ok =
      assert(
        checks,
        REAL_DEVICE_PLAYTEST_RISK_TAXONOMY.some((r) => r.severity === severity),
        `Severity class ${severity}`,
        `Missing ${severity}`,
      ) && ok;
  }

  for (const category of REAL_DEVICE_PLAYTEST_BLOCKER_CATEGORIES) {
    ok =
      assert(
        checks,
        REAL_DEVICE_PLAYTEST_RISK_TAXONOMY.some((r) => r.category === category),
        `Blocker category ${category}`,
        `Missing blocker ${category}`,
      ) && ok;
  }

  ok =
    assert(
      checks,
      classifyPlaytestFinding({ category: 'crash', title: 'Crash or hard freeze' }) === 'blocker',
      'classifyPlaytestFinding crash→blocker',
      'Classification wrong',
    ) && ok;
  ok =
    assert(
      checks,
      classifyPlaytestFinding({ category: 'spacing', title: 'Spacing polish' }) === 'polish',
      'classifyPlaytestFinding spacing→polish',
      'Classification wrong',
    ) && ok;

  const doc = readRepo(REAL_DEVICE_PLAYTEST_DOCS_PATH);
  ok = assert(checks, doc.length > 0, 'Docs file exists', 'Missing docs') && ok;
  ok = assert(checks, doc.includes('Android küçük'), 'Docs device matrix Android small', 'Missing android small') && ok;
  ok = assert(checks, doc.includes('iOS'), 'Docs device matrix iOS', 'Missing iOS') && ok;
  ok = assert(checks, doc.includes('Screenshot'), 'Docs screenshot requirements', 'Missing screenshot') && ok;
  ok = assert(checks, doc.includes('video') || doc.includes('Video'), 'Docs video requirements', 'Missing video') && ok;
  ok = assert(checks, doc.includes('blocker'), 'Docs blocker classification', 'Missing blocker section') && ok;

  const launchReview = runSoftLaunchReadinessReview({ mode: 'launch_candidate' });
  ok =
    assert(
      checks,
      launchReview.blockers.some((b) => b.id.includes('device_playtest')),
      'Soft launch launch_candidate playtest still blocker',
      'Missing playtest blocker',
    ) && ok;

  ok =
    assert(
      checks,
      !summary.launchCandidateReady,
      'Launch candidate not ready without manual results',
      'Incorrectly ready',
    ) && ok;

  ok = assert(checks, plan.iapPurchaseSmokeSeparatePhase, 'IAP smoke separate phase', 'IAP not separated') && ok;

  ok = assert(checks, buildRealDevicePlaytestMarkdown(summary).includes('Scenario matrix'), 'Markdown report', 'Bad markdown') && ok;
  ok = assert(checks, buildRealDevicePlaytestConsoleSummary(summary).length > 100, 'Console summary', 'Empty console') && ok;

  ok = assert(checks, verifySoftLaunchReviewScenario().ok, 'verify:soft-launch-review compatible', 'Soft launch review broken') && ok;
  ok = assert(checks, verifyFirstTenMinutesScenario().ok, 'verify:first-10-minutes compatible', 'First 10 min broken') && ok;
  ok = assert(checks, runFullLoopAnalysis().totalFAIL === 0, 'verify:full-loop compatible', 'Full loop fail') && ok;
  ok = assert(checks, verifyFullUxFlowScenario().ok, 'verify:full-ux-flow compatible', 'UX flow broken') && ok;
  ok = assert(checks, verifyQualityAuditScenario().ok, 'verify:quality-audit compatible', 'Quality audit broken') && ok;
  ok = assert(checks, verifyPerformanceSelectorPassTwoScenario().ok, 'verify:performance-selector-pass-two compatible', 'Perf pass two broken') && ok;

  ok = assert(checks, SAVE_VERSION === 23, 'SAVE_VERSION 23', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  const persist = readRepo('src/store/gamePersist.ts');
  ok =
    assert(
      checks,
      !persist.includes('realDevicePlaytestState'),
      'No persist shape change',
      'Persist polluted',
    ) && ok;

  if (
    !warn(
      checks,
      summary.completedObservationCount === 0,
      'Manual playtest not yet logged (expected)',
      'Unexpected completed observations in verify',
    )
  ) {
    hasWarn = true;
  }

  if (summary.health === 'WARN') {
    hasWarn = true;
  }

  return {
    ok,
    warn: hasWarn,
    checks,
    playtestHealth: summary.health,
  };
}
