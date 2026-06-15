import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { verifyIapIntegrationScenario } from '@/core/iap/verifyIapIntegrationScenario';
import { verifyMonetizationScenario } from '@/core/monetization/verifyMonetizationScenario';
import { runSoftLaunchReadinessReview } from '@/core/releaseReadiness/softLaunchReviewAudit';
import { verifySoftLaunchReviewScenario } from '@/core/releaseReadiness/verifySoftLaunchReviewScenario';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  IAP_SANDBOX_SMOKE_BLOCKER_CASE_IDS,
  IAP_SANDBOX_SMOKE_EXECUTION_DOCS_PATH,
  IAP_SANDBOX_SMOKE_MIN_CASE_COUNT,
} from './iapSandboxSmokeExecutionConstants';
import {
  assertIapSandboxSmokeExecutionPlanIntegrity,
  buildIapSandboxSmokeExecutionResult,
  classifyIapSandboxSmokeCase,
  collectIapSandboxSmokeBlockers,
  buildIapSandboxSmokeExecutionPlan,
} from './iapSandboxSmokeExecutionAudit';
import { verifyIapSandboxReadinessScenario } from './verifyIapSandboxReadinessScenario';
import type { CreviaIapSandboxSmokeObservation } from './iapSandboxSmokeExecutionTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyIapSandboxSmokeExecutionOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  executionHealth: string;
  executionDecision: string;
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

export function verifyIapSandboxSmokeExecutionScenario(): VerifyIapSandboxSmokeExecutionOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const plan = buildIapSandboxSmokeExecutionPlan();
  const defaultResult = buildIapSandboxSmokeExecutionResult();
  const integrity = assertIapSandboxSmokeExecutionPlanIntegrity();

  ok = assert(checks, integrity.ok, 'Execution plan integrity', 'Plan invalid') && ok;
  ok =
    assert(
      checks,
      plan.cases.length >= IAP_SANDBOX_SMOKE_MIN_CASE_COUNT,
      `Cases ${IAP_SANDBOX_SMOKE_MIN_CASE_COUNT}+`,
      `cases=${plan.cases.length}`,
    ) && ok;
  ok =
    assert(
      checks,
      plan.cases.every((c) => c.id && c.platform && c.steps.length > 0 && c.expectedResult),
      'Case id/platform/steps/expectedResult',
      'Incomplete case',
    ) && ok;
  ok =
    assert(
      checks,
      defaultResult.platformResults.length === 2,
      'iOS and Android platform results',
      `platforms=${defaultResult.platformResults.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      defaultResult.decision !== 'passed_sandbox_smoke',
      'No manual results → not passed_sandbox_smoke',
      `Decision ${defaultResult.decision}`,
    ) && ok;
  ok =
    assert(
      checks,
      defaultResult.decision === 'blocked_missing_revenuecat_keys' ||
        defaultResult.decision === 'blocked_missing_store_setup' ||
        defaultResult.decision === 'blocked_manual_results_missing',
      'Missing setup blocks manual smoke',
      defaultResult.decision,
    ) && ok;

  ok =
    assert(
      checks,
      !defaultResult.revenueCatKeysConfigured
        ? defaultResult.decision === 'blocked_missing_revenuecat_keys'
        : true,
      'Missing RC keys → blocked_missing_revenuecat_keys',
      defaultResult.decision,
    ) && ok;

  ok =
    assert(
      checks,
      defaultResult.storeSetupAssumedPending
        ? defaultResult.decision === 'blocked_missing_revenuecat_keys' ||
            defaultResult.decision === 'blocked_missing_store_setup'
        : true,
      'Store setup pending blocks ready',
      defaultResult.decision,
    ) && ok;

  ok =
    assert(
      checks,
      !defaultResult.sandboxSmokePassed,
      'Sandbox not passed without manual results',
      'Incorrectly passed',
    ) && ok;
  ok =
    assert(
      checks,
      defaultResult.devMockOnlyPassed || !defaultResult.manualResultsPresent,
      'Dev mock does not count as sandbox pass',
      'Dev mock counted as pass',
    ) && ok;

  ok =
    assert(
      checks,
      classifyIapSandboxSmokeCase({ caseId: 'purchase_completed', status: 'failed' }) === 'blocked',
      'purchase_completed fail → blocker',
      'Classification wrong',
    ) && ok;
  ok =
    assert(
      checks,
      classifyIapSandboxSmokeCase({ caseId: 'restore_existing_purchase', status: 'failed' }) ===
        'blocked',
      'restore_existing fail → blocker',
      'Classification wrong',
    ) && ok;
  ok =
    assert(
      checks,
      classifyIapSandboxSmokeCase({ caseId: 'restart_entitlement_sync', status: 'failed' }) ===
        'blocked',
      'entitlement sync fail → blocker',
      'Classification wrong',
    ) && ok;

  const failedPurchaseObs: CreviaIapSandboxSmokeObservation[] = [
    {
      caseId: 'purchase_completed',
      platform: 'ios',
      device: 'test',
      buildProfile: 'dev',
      status: 'failed',
      observedResult: 'Store error',
      logs: '',
      notes: '',
      screenshotPath: '',
      videoPath: '',
      severity: 'blocker',
      completed: true,
    },
  ];
  const failedResult = buildIapSandboxSmokeExecutionResult({ observations: failedPurchaseObs });
  ok =
    assert(
      checks,
      failedResult.decision === 'failed_smoke_test' ||
        failedResult.blockers.some((b) => b.id.includes('purchase_completed')),
      'Failed purchase produces blocker',
      failedResult.decision,
    ) && ok;

  ok =
    assert(
      checks,
      plan.cases.some((c) => c.id === 'offline_offer_graceful_error'),
      'Offline graceful error case exists',
      'Missing offline case',
    ) && ok;

  const launchReview = runSoftLaunchReadinessReview({ mode: 'launch_candidate' });
  ok =
    assert(
      checks,
      launchReview.blockerCount > 0,
      'Launch candidate still blocked',
      `blockers=${launchReview.blockerCount}`,
    ) && ok;
  ok =
    assert(
      checks,
      launchReview.blockers.some((b) => b.id.includes('device_playtest')),
      'Real device playtest blocker remains',
      'Missing playtest blocker',
    ) && ok;
  ok =
    assert(
      checks,
      launchReview.findings.some(
        (f) =>
          f.id.includes('smoke_execution') ||
          f.id.includes('smoke_test') ||
          f.id.includes('public_keys'),
      ),
      'Soft launch IAP smoke execution integrated',
      'Missing integration finding',
    ) && ok;

  const doc = readRepo(IAP_SANDBOX_SMOKE_EXECUTION_DOCS_PATH);
  ok = assert(checks, doc.length > 0, 'Execution docs exist', 'Missing docs') && ok;
  ok = assert(checks, doc.includes('RevenueCat'), 'Docs RC checklist', 'Missing RC') && ok;
  ok = assert(checks, doc.includes('App Store'), 'Docs ASC checklist', 'Missing ASC') && ok;
  ok = assert(checks, doc.includes('Play Console'), 'Docs Play checklist', 'Missing Play') && ok;
  ok = assert(checks, doc.includes('EAS'), 'Docs EAS secrets', 'Missing EAS') && ok;

  ok =
    assert(
      checks,
      IAP_SANDBOX_SMOKE_BLOCKER_CASE_IDS.includes('purchase_completed'),
      'Blocker case ids defined',
      'Missing blocker ids',
    ) && ok;

  const blockers = collectIapSandboxSmokeBlockers(
    plan,
    defaultResult.platformResults,
    [],
    false,
    true,
  );
  ok =
    assert(
      checks,
      blockers.some((b) => b.id === 'exec.missing_revenuecat_keys'),
      'collectBlockers missing keys',
      'Blocker missing',
    ) && ok;

  ok = assert(checks, verifyIapSandboxReadinessScenario().ok, 'verify:iap-sandbox-readiness', 'Readiness broken') && ok;
  ok = assert(checks, verifyIapIntegrationScenario().ok, 'verify:iap-integration', 'Integration broken') && ok;
  ok = assert(checks, verifySoftLaunchReviewScenario().ok, 'verify:soft-launch-review', 'Review broken') && ok;
  ok = assert(checks, verifyMonetizationScenario().ok, 'verify:monetization-gate', 'Monetization broken') && ok;
  ok = assert(checks, runFullLoopAnalysis().totalFAIL === 0, 'verify:full-loop', 'Full loop fail') && ok;
  ok = assert(checks, verifyFullUxFlowScenario().ok, 'verify:full-ux-flow', 'UX flow broken') && ok;

  ok = assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION 23', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  const persist = readRepo('src/store/gamePersist.ts');
  ok =
    assert(
      checks,
      !persist.includes('iapSandboxSmokeExecutionState'),
      'No persist change',
      'Persist polluted',
    ) && ok;

  if (defaultResult.health === 'BLOCKED' || defaultResult.health === 'WARN') {
    hasWarn = true;
  }

  return {
    ok,
    warn: hasWarn,
    checks,
    executionHealth: defaultResult.health,
    executionDecision: defaultResult.decision,
  };
}
