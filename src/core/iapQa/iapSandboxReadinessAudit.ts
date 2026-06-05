import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  IAP_STORE_PRODUCT_IDS,
  MAIN_OPERATION_ENTITLEMENT_ID,
} from '@/core/iap/iapProductConstants';
import { getIapRuntimeConfig } from '@/core/iap/iapRuntimeConfig';

import {
  IAP_INTEGRATION_DOCS_PATH,
  IAP_SANDBOX_QA_DOCS_PATH,
  IAP_SANDBOX_QA_ENV_KEYS,
} from './iapSandboxQaConstants';
import { runIapSandboxQaAudit } from './iapSandboxQaAudit';
import type { IapSandboxQaFinding } from './iapSandboxQaTypes';
import {
  IAP_SANDBOX_SMOKE_TEST_DOCS_PATH,
  REVENUECAT_DEFAULT_OFFERING_ID,
  REVENUECAT_PACKAGE_PRODUCT_ID,
} from './iapSandboxReadinessConstants';
import type {
  CreviaIapSandboxBlocker,
  CreviaIapSandboxChecklistItem,
  CreviaIapSandboxPlatformStatus,
  CreviaIapSandboxReadinessHealth,
  CreviaIapSandboxReadinessMode,
  CreviaIapSandboxReadinessResult,
  CreviaRevenueCatConfigStatus,
  CreviaSandboxSmokeTestCase,
  CreviaSandboxSmokeTestPlan,
  CreviaStoreProductStatus,
} from './iapSandboxReadinessTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function readEnv(key: string): string | undefined {
  const raw = process.env[key];
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 && !trimmed.includes('REPLACE_WITH') ? trimmed : undefined;
}

export function buildSandboxSmokeTestPlan(): CreviaSandboxSmokeTestPlan {
  const cases: CreviaSandboxSmokeTestCase[] = [
    {
      id: 'smoke.dev_no_rc_key',
      title: 'App opens with no RevenueCat key in dev',
      platform: 'dev',
      prerequisites: ['__DEV__', 'No EXPO_PUBLIC_REVENUECAT_* keys'],
      steps: ['Launch app', 'Navigate to post-pilot offer'],
      expectedResult: 'Mock purchase path; no crash; offer screen loads.',
      logHints: ['iapRuntimeConfig mode=mock'],
      automated: true,
      status: 'pass',
    },
    {
      id: 'smoke.prod_safe_disabled',
      title: 'App opens with no RevenueCat key in production-safe mode',
      platform: 'both',
      prerequisites: ['Release build or NODE_ENV=production', 'No public keys'],
      steps: ['Launch app', 'Open offer screen'],
      expectedResult: 'Purchase disabled gracefully; friendly copy; no crash.',
      logHints: ['iapRuntimeConfig mode=disabled'],
      automated: true,
      status: 'pass',
    },
    {
      id: 'smoke.offer_loads_product',
      title: 'Offer screen loads product',
      platform: 'both',
      prerequisites: ['EAS dev build', 'RC keys + offering configured'],
      steps: ['Reach PostPilotOfferScreen', 'Wait for product fetch'],
      expectedResult: 'Product title/price or fallback copy; no native module crash.',
      logHints: ['getOfferings', 'iap_product_list_loaded'],
      automated: false,
      status: 'pending',
    },
    {
      id: 'smoke.purchase_started',
      title: 'Purchase started',
      platform: 'both',
      prerequisites: ['Sandbox tester', 'Product active'],
      steps: ['Tap Ana Operasyonu Aç', 'Confirm store sheet opens'],
      expectedResult: 'iap_purchase_started analytics; loading state on CTA.',
      logHints: ['purchasePackage', 'iap_purchase_started'],
      automated: false,
      status: 'pending',
    },
    {
      id: 'smoke.purchase_cancelled',
      title: 'Purchase cancelled',
      platform: 'both',
      prerequisites: ['Purchase sheet visible'],
      steps: ['Cancel store sheet'],
      expectedResult: 'Friendly cancel copy; no panic error; limited mode intact.',
      logHints: ['USER_CANCELLED', 'iap_purchase_failed resultBand=cancelled'],
      automated: false,
      status: 'pending',
    },
    {
      id: 'smoke.purchase_failed',
      title: 'Purchase failed',
      platform: 'both',
      prerequisites: ['Simulate billing error or network off'],
      steps: ['Start purchase', 'Let store return error'],
      expectedResult: 'Controlled failure copy; app stable; retry possible.',
      logHints: ['iap_purchase_failed', 'no raw exception in UI'],
      automated: false,
      status: 'pending',
    },
    {
      id: 'smoke.purchase_completed',
      title: 'Purchase completed',
      platform: 'both',
      prerequisites: ['Valid sandbox product'],
      steps: ['Complete sandbox purchase'],
      expectedResult: 'mainOperationAccess=full; hub unlock visible.',
      logHints: ['iap_purchase_completed', 'applyIapEntitlementToMonetization'],
      automated: false,
      status: 'pending',
    },
    {
      id: 'smoke.entitlement_active',
      title: 'Entitlement active after purchase',
      platform: 'both',
      prerequisites: ['Completed purchase'],
      steps: ['Check CustomerInfo / store state'],
      expectedResult: `Entitlement ${MAIN_OPERATION_ENTITLEMENT_ID} active.`,
      logHints: ['getCustomerInfo', 'entitlement active'],
      automated: false,
      status: 'pending',
    },
    {
      id: 'smoke.restore_no_purchase',
      title: 'Restore no purchase',
      platform: 'both',
      prerequisites: ['Fresh sandbox account'],
      steps: ['Tap Erişimi Geri Yükle'],
      expectedResult: 'not_found friendly copy; limited mode unchanged.',
      logHints: ['iap_restore_not_found'],
      automated: false,
      status: 'pending',
    },
    {
      id: 'smoke.restore_existing',
      title: 'Restore existing purchase',
      platform: 'both',
      prerequisites: ['Prior purchase on account'],
      steps: ['Reinstall app', 'Tap restore CTA'],
      expectedResult: 'Full access restored; iap_restore_completed.',
      logHints: ['restorePurchases', 'iap_restore_completed'],
      automated: false,
      status: 'pending',
    },
    {
      id: 'smoke.restart_entitlement_sync',
      title: 'App restart entitlement sync',
      platform: 'both',
      prerequisites: ['Active entitlement'],
      steps: ['Kill app', 'Relaunch', 'Open hub'],
      expectedResult: 'Full mode persists via getActiveEntitlements bootstrap.',
      logHints: ['getCustomerInfo on bootstrap', 'no auto restorePurchases'],
      automated: false,
      status: 'pending',
    },
    {
      id: 'smoke.limited_mode_playable',
      title: 'Limited mode remains playable',
      platform: 'both',
      prerequisites: ['Post-pilot without purchase'],
      steps: ['Tap Sınırlı Gündemle Devam Et', 'Play day 8'],
      expectedResult: 'Limited access; core loop playable; no paywall trap.',
      logHints: ['mainOperationAccess=limited'],
      automated: true,
      status: 'pass',
    },
    {
      id: 'smoke.full_unlock_visible',
      title: 'Full mode unlock visible',
      platform: 'both',
      prerequisites: ['Purchase or mock unlock'],
      steps: ['Return to hub after unlock'],
      expectedResult: 'Full operation UI cues visible; no premium wording.',
      logHints: ['mainOperationAccess=full'],
      automated: false,
      status: 'pending',
    },
    {
      id: 'smoke.offline_graceful',
      title: 'Offline purchase screen graceful error',
      platform: 'both',
      prerequisites: ['Airplane mode'],
      steps: ['Open offer', 'Tap purchase'],
      expectedResult: 'Controlled error; no crash; retry when online.',
      logHints: ['network error handled', 'iap_purchase_failed'],
      automated: false,
      status: 'pending',
    },
  ];

  return {
    version: '1',
    minimumCaseCount: 12,
    cases,
    manualCompletionRequired: true,
  };
}

function buildRevenueCatConfigStatus(): CreviaRevenueCatConfigStatus {
  const pkg = readRepo('package.json');
  const adapter = readRepo('src/core/iap/revenueCatIapAdapter.ts');
  const runtime = readRepo('src/core/iap/iapRuntimeService.ts');
  const integrationDoc = readRepo(IAP_INTEGRATION_DOCS_PATH);
  const config = getIapRuntimeConfig();

  const sdkPresent = pkg.includes('react-native-purchases');
  const singleAdapter =
    adapter.includes('react-native-purchases') &&
    !runtime.includes("from 'react-native-purchases'") &&
    !readRepo('src/features/postPilot/screens/PostPilotOfferScreen.tsx').includes(
      'react-native-purchases',
    );

  return {
    sdkDependencyPresent: sdkPresent,
    singleAdapterImportPoint: singleAdapter,
    iosApiKeyEnvDocumented:
      integrationDoc.includes(IAP_SANDBOX_QA_ENV_KEYS.ios) ||
      readRepo(IAP_SANDBOX_QA_DOCS_PATH).includes(IAP_SANDBOX_QA_ENV_KEYS.ios),
    androidApiKeyEnvDocumented:
      integrationDoc.includes(IAP_SANDBOX_QA_ENV_KEYS.android) ||
      readRepo(IAP_SANDBOX_QA_DOCS_PATH).includes(IAP_SANDBOX_QA_ENV_KEYS.android),
    iosApiKeyConfigured: Boolean(readEnv(IAP_SANDBOX_QA_ENV_KEYS.ios)),
    androidApiKeyConfigured: Boolean(readEnv(IAP_SANDBOX_QA_ENV_KEYS.android)),
    entitlementId: MAIN_OPERATION_ENTITLEMENT_ID,
    offeringId: REVENUECAT_DEFAULT_OFFERING_ID,
    packageProductId: REVENUECAT_PACKAGE_PRODUCT_ID,
    runtimeMode: config.mode,
    productionFailSafe: runtime.includes("mode: 'disabled'"),
    devMockSafe: runtime.includes("mode === 'mock'"),
  };
}

function buildStoreProductStatus(): CreviaStoreProductStatus {
  return {
    iosProductId: IAP_STORE_PRODUCT_IDS.ios,
    androidProductId: IAP_STORE_PRODUCT_IDS.android,
    documentedInCode: true,
    storeDashboardCreated: false,
    pricingFinalized: false,
    revenueCatMapped: false,
  };
}

function buildPlatformStatuses(sandboxQa: IapSandboxQaFinding[]): CreviaIapSandboxPlatformStatus[] {
  const iosKey = readEnv(IAP_SANDBOX_QA_ENV_KEYS.ios);
  const androidKey = readEnv(IAP_SANDBOX_QA_ENV_KEYS.android);

  const iosNative = sandboxQa.some(
    (f) => f.id === 'native.ios_iap_capability' && f.severity === 'pass',
  );
  const androidBilling = sandboxQa.some(
    (f) => f.id === 'native.android_billing_permission' && f.severity === 'pass',
  );

  return [
    {
      platform: 'ios',
      productId: IAP_STORE_PRODUCT_IDS.ios,
      storeSetupComplete: false,
      sandboxTesterReady: false,
      nativeCapabilityReady: iosNative,
      devBuildInstalled: false,
      status: iosKey ? 'partial' : 'pending',
      notes: ['App Store Connect IAP manual setup required', 'Sandbox Apple ID required'],
    },
    {
      platform: 'android',
      productId: IAP_STORE_PRODUCT_IDS.android,
      storeSetupComplete: false,
      sandboxTesterReady: false,
      nativeCapabilityReady: androidBilling,
      devBuildInstalled: false,
      status: androidKey ? 'partial' : 'pending',
      notes: ['Play Console product manual setup required', 'License tester email required'],
    },
  ];
}

function mapChecklistFromFindings(findings: IapSandboxQaFinding[]): CreviaIapSandboxChecklistItem[] {
  return findings.map((f) => ({
    id: f.id,
    category: f.area,
    title: f.title,
    automatic: !f.manual,
    requiredForSandbox: f.severity !== 'pass' || f.manual,
    requiredForLaunch: f.severity === 'blocker' || f.severity === 'fail' || f.manual,
    status: f.severity,
    message: f.message,
  }));
}

function buildLaunchCandidateBlockers(
  mode: CreviaIapSandboxReadinessMode,
  rc: CreviaRevenueCatConfigStatus,
  smoke: CreviaSandboxSmokeTestPlan,
): CreviaIapSandboxBlocker[] {
  const blockers: CreviaIapSandboxBlocker[] = [];

  if (mode === 'pre_sdk') {
    return blockers;
  }

  if (!rc.iosApiKeyConfigured || !rc.androidApiKeyConfigured) {
    blockers.push({
      id: 'launch.missing_revenuecat_keys',
      severity: 'blocker',
      title: 'RevenueCat public SDK keys missing for launch candidate',
      message: 'Both EXPO_PUBLIC_REVENUECAT_IOS_API_KEY and ANDROID key required.',
      recommendation: 'Add appl_/goog_ keys to EAS secrets before launch candidate build.',
      appliesInMode: ['launch_candidate', 'sandbox_smoke'],
    });
  }

  if (!rc.sdkDependencyPresent) {
    blockers.push({
      id: 'launch.missing_sdk',
      severity: 'blocker',
      title: 'react-native-purchases dependency missing',
      message: 'RevenueCat SDK not in package.json.',
      recommendation: 'Install react-native-purchases and verify adapter.',
      appliesInMode: ['launch_candidate'],
    });
  }

  const pendingManualSmoke = smoke.cases.filter((c) => !c.automated && c.status === 'pending');
  if (pendingManualSmoke.length > 0) {
    blockers.push({
      id: 'launch.manual_smoke_pending',
      severity: mode === 'launch_candidate' ? 'blocker' : 'warn',
      title: 'Manual sandbox smoke tests not completed',
      message: `${pendingManualSmoke.length} device smoke cases still pending.`,
      recommendation: `Complete matrix in ${IAP_SANDBOX_SMOKE_TEST_DOCS_PATH}.`,
      appliesInMode: ['launch_candidate', 'sandbox_smoke'],
    });
  }

  blockers.push({
    id: 'launch.store_setup_pending',
    severity: 'warn',
    title: 'Store dashboard setup not auto-verified',
    message: 'App Store Connect / Play Console products assumed pending.',
    recommendation: 'Complete manual setup checklist before public launch.',
    appliesInMode: ['launch_candidate', 'sandbox_smoke', 'pre_sdk'],
  });

  return blockers;
}

function calculateReadinessHealth(
  sandboxHealth: CreviaIapSandboxReadinessHealth,
  blockers: CreviaIapSandboxBlocker[],
  mode: CreviaIapSandboxReadinessMode,
): CreviaIapSandboxReadinessHealth {
  if (blockers.some((b) => b.severity === 'blocker' && b.appliesInMode.includes(mode))) {
    return 'BLOCKED';
  }
  if (sandboxHealth === 'FAIL' || sandboxHealth === 'BLOCKED') {
    return sandboxHealth;
  }
  if (blockers.some((b) => b.severity === 'warn') || sandboxHealth === 'WARN') {
    return 'WARN';
  }
  return 'PASS';
}

export type RunIapSandboxReadinessAuditOptions = {
  mode?: CreviaIapSandboxReadinessMode;
};

export function runIapSandboxReadinessAudit(
  options: RunIapSandboxReadinessAuditOptions = {},
): CreviaIapSandboxReadinessResult {
  const mode = options.mode ?? 'pre_sdk';
  const sandboxQa = runIapSandboxQaAudit();
  const smokeTestPlan = buildSandboxSmokeTestPlan();
  const revenueCat = buildRevenueCatConfigStatus();
  const storeProducts = buildStoreProductStatus();
  const platformStatus = buildPlatformStatuses(sandboxQa.findings);
  const checklist = mapChecklistFromFindings(sandboxQa.findings);
  const blockers = buildLaunchCandidateBlockers(mode, revenueCat, smokeTestPlan);

  const sandboxHealth = sandboxQa.health as CreviaIapSandboxReadinessHealth;
  const health = calculateReadinessHealth(sandboxHealth, blockers, mode);

  const nextSteps: string[] = [];
  if (health === 'BLOCKED') {
    nextSteps.push('Resolve BLOCKER items before EAS sandbox build.');
  }
  if (!revenueCat.iosApiKeyConfigured || !revenueCat.androidApiKeyConfigured) {
    nextSteps.push('Configure EXPO_PUBLIC_REVENUECAT_* public keys in .env or EAS.');
  }
  nextSteps.push(`Follow manual setup: ${IAP_SANDBOX_SMOKE_TEST_DOCS_PATH}`);
  nextSteps.push(...sandboxQa.nextSteps.slice(0, 4));

  return {
    health,
    mode,
    checkedCount: sandboxQa.checkedCount + blockers.length,
    passCount: sandboxQa.passCount,
    warnCount: sandboxQa.warnCount + blockers.filter((b) => b.severity === 'warn').length,
    failCount: sandboxQa.failCount,
    blockerCount:
      sandboxQa.blockerCount + blockers.filter((b) => b.severity === 'blocker').length,
    revenueCat,
    storeProducts,
    platformStatus,
    checklist,
    blockers,
    smokeTestPlan,
    sandboxQa,
    findings: sandboxQa.findings,
    nextSteps,
    docsPaths: {
      integration: IAP_INTEGRATION_DOCS_PATH,
      sandboxQa: IAP_SANDBOX_QA_DOCS_PATH,
      smokeTest: IAP_SANDBOX_SMOKE_TEST_DOCS_PATH,
    },
  };
}
