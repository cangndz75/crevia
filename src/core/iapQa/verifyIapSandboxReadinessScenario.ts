import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { verifyIapIntegrationScenario } from '@/core/iap/verifyIapIntegrationScenario';
import { mapEntitlementToMonetizationAccess } from '@/core/iap/iapEntitlementMapping';
import { buildMockEntitlementForMainOperation } from '@/core/iap/iapEntitlementMapping';
import { runSoftLaunchReadinessAudit } from '@/core/releaseReadiness/softLaunchReadinessAudit';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import { IAP_INTEGRATION_DOCS_PATH, IAP_SANDBOX_QA_DOCS_PATH } from './iapSandboxQaConstants';
import { runIapSandboxQaAuditWithSimulatedSecretKey } from './iapSandboxQaAudit';
import { IAP_SANDBOX_SMOKE_TEST_DOCS_PATH } from './iapSandboxReadinessConstants';
import { runIapSandboxReadinessAudit } from './iapSandboxReadinessAudit';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyIapSandboxReadinessOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  readinessHealth: string;
  launchCandidateHealth: string;
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

export function verifyIapSandboxReadinessScenario(): VerifyIapSandboxReadinessOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const preSdk = runIapSandboxReadinessAudit({ mode: 'pre_sdk' });
  const launch = runIapSandboxReadinessAudit({ mode: 'launch_candidate' });

  ok = assert(checks, preSdk.smokeTestPlan.cases.length >= 12, 'Smoke matrix 12+ cases', `Only ${preSdk.smokeTestPlan.cases.length}`) && ok;

  ok =
    assert(
      checks,
      preSdk.revenueCat.entitlementId === 'main_operation_full_access',
      'Entitlement id documented',
      'Wrong entitlement id',
    ) && ok;
  ok =
    assert(
      checks,
      preSdk.revenueCat.offeringId === 'default',
      'Offering id documented',
      'Missing offering id',
    ) && ok;
  ok =
    assert(
      checks,
      preSdk.storeProducts.iosProductId.length > 0 && preSdk.storeProducts.androidProductId.length > 0,
      'Product ids documented',
      'Missing product ids',
    ) && ok;

  ok =
    assert(
      checks,
      preSdk.revenueCat.sdkDependencyPresent,
      'RevenueCat SDK dependency',
      'react-native-purchases missing',
    ) && ok;
  ok =
    assert(
      checks,
      preSdk.revenueCat.singleAdapterImportPoint,
      'Single adapter import point',
      'SDK imported outside adapter',
    ) && ok;
  ok =
    assert(
      checks,
      preSdk.revenueCat.iosApiKeyEnvDocumented && preSdk.revenueCat.androidApiKeyEnvDocumented,
      'API key env names documented',
      'Env docs missing',
    ) && ok;
  ok =
    assert(
      checks,
      preSdk.revenueCat.productionFailSafe && preSdk.revenueCat.devMockSafe,
      'Production fail-safe + dev mock',
      'Runtime mode guards missing',
    ) && ok;

  const secretSim = runIapSandboxQaAuditWithSimulatedSecretKey();
  ok =
    assert(
      checks,
      secretSim.health === 'BLOCKED',
      'Secret key simulated BLOCKED (no crash)',
      `Secret sim ${secretSim.health}`,
    ) && ok;

  ok =
    assert(
      checks,
      preSdk.health !== 'FAIL' && preSdk.health !== 'BLOCKED',
      'Pre-SDK no blocker health',
      `Pre-SDK health ${preSdk.health}`,
    ) && ok;
  ok =
    assert(
      checks,
      preSdk.blockers.filter((b) => b.severity === 'blocker').length === 0,
      'Pre-SDK no launch blockers',
      `Pre-SDK blockers ${preSdk.blockers.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      launch.health === 'BLOCKED' || launch.blockerCount > 0,
      'Launch candidate BLOCKED without keys',
      `Launch health ${launch.health}`,
    ) && ok;
  ok =
    assert(
      checks,
      launch.blockers.some((b) => b.id === 'launch.missing_revenuecat_keys'),
      'Launch missing RC keys blocker',
      'Missing key blocker',
    ) && ok;

  const purchaseCta = preSdk.findings.find((f) => f.id === 'purchase.cta_starts_flow');
  const offerScreen = readRepo('src/features/postPilot/screens/PostPilotOfferScreen.tsx');
  const bootstrapBlock =
    offerScreen.match(/const bootstrapIap = async \(\) => \{[\s\S]*?\};/)?.[0] ?? '';
  const noAutoPurchaseOnMount =
    purchaseCta?.severity === 'pass' && !bootstrapBlock.includes('purchaseIapProduct');
  ok =
    assert(
      checks,
      noAutoPurchaseOnMount,
      'Purchase CTA-only guard',
      'Auto purchase risk',
    ) && ok;

  const restoreFinding = preSdk.findings.find((f) => f.id === 'restore.no_auto_restore_mount');
  ok =
    assert(
      checks,
      restoreFinding?.severity === 'pass',
      'Restore CTA-only guard',
      'Auto restore risk',
    ) && ok;

  const activeMock = buildMockEntitlementForMainOperation(8);
  ok =
    assert(
      checks,
      mapEntitlementToMonetizationAccess(activeMock) === 'full',
      'Entitlement mapping helper active→full',
      'Mapping broken',
    ) && ok;

  const placeholderWarn =
    preSdk.findings.some(
      (f) =>
        (f.id === 'env.ios_public_key' || f.id === 'env.android_public_key') &&
        f.severity === 'warn',
    ) || preSdk.revenueCat.runtimeMode === 'revenuecat';
  if (
    !warn(
      checks,
      placeholderWarn,
      'Placeholder keys WARN not FAIL',
      'Keys should warn when missing',
    )
  ) {
    hasWarn = true;
  }
  ok =
    assert(
      checks,
      !preSdk.findings.some(
        (f) =>
          (f.id === 'env.ios_public_key' || f.id === 'env.android_public_key') &&
          f.severity === 'fail',
      ),
      'Placeholder keys not FAIL',
      'Keys incorrectly FAIL',
    ) && ok;

  const smokeDoc = readRepo(IAP_SANDBOX_SMOKE_TEST_DOCS_PATH);
  ok = assert(checks, smokeDoc.length > 0, 'Smoke test doc exists', 'Missing smoke doc') && ok;
  ok = assert(checks, smokeDoc.includes('RevenueCat'), 'Smoke doc RevenueCat section', 'Missing RC') && ok;
  ok = assert(checks, smokeDoc.includes('App Store Connect'), 'Smoke doc iOS section', 'Missing iOS') && ok;
  ok = assert(checks, smokeDoc.includes('Play Console'), 'Smoke doc Android section', 'Missing Android') && ok;
  ok = assert(checks, smokeDoc.includes('EAS'), 'Smoke doc EAS section', 'Missing EAS') && ok;
  ok = assert(checks, smokeDoc.includes('Sandbox smoke test matrix'), 'Smoke matrix in doc', 'Missing matrix') && ok;

  const integrationDoc = readRepo(IAP_INTEGRATION_DOCS_PATH);
  ok =
    assert(
      checks,
      integrationDoc.includes('mock') && integrationDoc.includes('disabled'),
      'Dev mock vs production disabled documented',
      'Mode docs incomplete',
    ) && ok;

  ok = assert(checks, verifyIapIntegrationScenario().ok, 'verify:iap-integration compatible', 'IAP integration broken') && ok;

  const softPre = runSoftLaunchReadinessAudit({ mode: 'pre_sdk' });
  ok =
    assert(
      checks,
      softPre.health === 'WARN',
      'verify:soft-launch-readiness pre_sdk WARN',
      `Soft launch ${softPre.health}`,
    ) && ok;
  ok =
    assert(
      checks,
      softPre.findings.some(
        (f) =>
          f.id === 'monetization_iap.sandbox_qa_pending' ||
          f.id === 'monetization_iap.sandbox_readiness_warn' ||
          f.id === 'monetization_iap.real_sdk',
      ),
      'Soft launch IAP readiness integrated',
      'Missing soft launch IAP finding',
    ) && ok;

  const softLaunch = runSoftLaunchReadinessAudit({ mode: 'launch_candidate' });
  ok =
    assert(
      checks,
      softLaunch.blockerCount > 0,
      'Launch candidate soft launch blockers',
      `blockers=${softLaunch.blockerCount}`,
    ) && ok;

  const fullLoop = runFullLoopAnalysis();
  ok =
    assert(
      checks,
      fullLoop.scenarios.length > 0 && fullLoop.totalFAIL === 0,
      'verify:full-loop compatible',
      `Full loop FAIL=${fullLoop.totalFAIL}`,
    ) && ok;

  ok = assert(checks, verifyFullUxFlowScenario().ok, 'verify:full-ux-flow compatible', 'UX flow broken') && ok;

  ok = assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION 23 unchanged', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  const persist = readRepo('src/store/gamePersist.ts');
  ok =
    assert(
      checks,
      !persist.includes('iapSandboxReadiness') && !persist.includes('sandboxReadinessState'),
      'No persist shape change',
      'Persist polluted',
    ) && ok;

  if (preSdk.health === 'WARN') {
    hasWarn = true;
  }

  return {
    ok,
    warn: hasWarn,
    checks,
    readinessHealth: preSdk.health,
    launchCandidateHealth: launch.health,
  };
}
