import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { getIapRuntimeConfig } from '@/core/iap/iapRuntimeConfig';

import { IAP_SANDBOX_QA_ENV_KEYS } from './iapSandboxQaConstants';
import { IAP_SANDBOX_SMOKE_TEST_DOCS_PATH } from './iapSandboxReadinessConstants';
import {
  IAP_SANDBOX_SMOKE_BLOCKER_CASE_IDS,
  IAP_SANDBOX_SMOKE_DEV_ONLY_CASE_IDS,
  IAP_SANDBOX_SMOKE_EXECUTION_CONSTANTS,
  IAP_SANDBOX_SMOKE_EXECUTION_DOCS_PATH,
  IAP_SANDBOX_SMOKE_MIN_CASE_COUNT,
} from './iapSandboxSmokeExecutionConstants';
import type {
  CreviaIapSandboxSmokeBlocker,
  CreviaIapSandboxSmokeDecision,
  CreviaIapSandboxSmokeExecutionPlan,
  CreviaIapSandboxSmokeExecutionResult,
  CreviaIapSandboxSmokeHealthStatus,
  CreviaIapSandboxSmokeObservation,
  CreviaIapSandboxSmokePlatformResult,
  CreviaIapSandboxSmokeTestCase,
  CreviaIapSandboxSmokeTestStatus,
} from './iapSandboxSmokeExecutionTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readEnv(key: string): boolean {
  const raw = process.env[key];
  if (typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  return trimmed.length > 0 && !trimmed.includes('REPLACE_WITH');
}

function manualFields(): string[] {
  return [
    'observedResult',
    'logs',
    'notes',
    'screenshotPath',
    'videoPath',
    'severity',
  ];
}

export function buildIapSandboxSmokeExecutionPlan(): CreviaIapSandboxSmokeExecutionPlan {
  const c = IAP_SANDBOX_SMOKE_EXECUTION_CONSTANTS;
  const cases: CreviaIapSandboxSmokeTestCase[] = [
    {
      id: 'app_open_no_key_dev_mock',
      title: 'App opens with no RevenueCat key in dev (mock)',
      platform: 'dev',
      requiredSetup: ['__DEV__', 'No EXPO_PUBLIC_REVENUECAT_* keys'],
      steps: ['Launch dev build', 'Open post-pilot offer'],
      expectedResult: 'Mock path; no crash; offer loads.',
      manualObservationFields: manualFields(),
      blockerIfFails: false,
      relatedVerifyScript: 'verify:iap-integration',
      countsForSandboxPass: false,
      automatedOnly: true,
    },
    {
      id: 'app_open_no_key_production_disabled',
      title: 'App opens with no key in production-safe mode',
      platform: 'both',
      requiredSetup: ['Release or production-safe config', 'No public keys'],
      steps: ['Launch app', 'Open offer screen'],
      expectedResult: 'Purchase disabled gracefully; no crash.',
      manualObservationFields: manualFields(),
      blockerIfFails: false,
      relatedVerifyScript: 'verify:iap-integration',
      countsForSandboxPass: false,
      automatedOnly: true,
    },
    {
      id: 'offer_screen_loads',
      title: 'Offer screen loads',
      platform: 'both',
      requiredSetup: ['EAS dev build', 'RC keys', 'Offering configured'],
      steps: ['Reach PostPilotOfferScreen', 'Wait for product fetch'],
      expectedResult: 'Screen loads; no native module crash.',
      manualObservationFields: manualFields(),
      blockerIfFails: true,
      relatedVerifyScript: 'verify:iap-sandbox-readiness',
      countsForSandboxPass: true,
      automatedOnly: false,
    },
    {
      id: 'product_metadata_visible',
      title: 'Product metadata visible',
      platform: 'both',
      requiredSetup: ['Store product active', 'RC mapping complete'],
      steps: ['Observe product title/price or fallback copy'],
      expectedResult: 'Product metadata or documented fallback visible.',
      manualObservationFields: manualFields(),
      blockerIfFails: false,
      relatedVerifyScript: 'verify:iap-integration',
      countsForSandboxPass: true,
      automatedOnly: false,
    },
    {
      id: 'purchase_started',
      title: 'Purchase started',
      platform: 'both',
      requiredSetup: ['Sandbox tester', 'Product active'],
      steps: ['Tap Ana Operasyonu Aç', 'Confirm store sheet'],
      expectedResult: 'iap_purchase_started; loading on CTA.',
      manualObservationFields: manualFields(),
      blockerIfFails: false,
      relatedVerifyScript: 'verify:iap-integration',
      countsForSandboxPass: true,
      automatedOnly: false,
    },
    {
      id: 'purchase_cancelled',
      title: 'Purchase cancelled',
      platform: 'both',
      requiredSetup: ['Store sheet visible'],
      steps: ['Cancel sandbox sheet'],
      expectedResult: 'Friendly cancel; limited mode intact.',
      manualObservationFields: manualFields(),
      blockerIfFails: false,
      relatedVerifyScript: 'verify:iap-integration',
      countsForSandboxPass: true,
      automatedOnly: false,
    },
    {
      id: 'purchase_failed',
      title: 'Purchase failed',
      platform: 'both',
      requiredSetup: ['Simulate billing/network error'],
      steps: ['Start purchase', 'Let store fail'],
      expectedResult: 'Controlled error; retry possible.',
      manualObservationFields: manualFields(),
      blockerIfFails: false,
      relatedVerifyScript: 'verify:iap-integration',
      countsForSandboxPass: true,
      automatedOnly: false,
    },
    {
      id: 'purchase_completed',
      title: 'Purchase completed',
      platform: 'both',
      requiredSetup: ['Valid sandbox product'],
      steps: ['Complete sandbox purchase'],
      expectedResult: 'mainOperationAccess=full; hub unlock.',
      manualObservationFields: manualFields(),
      blockerIfFails: true,
      relatedVerifyScript: 'verify:iap-integration',
      countsForSandboxPass: true,
      automatedOnly: false,
    },
    {
      id: 'entitlement_active_after_purchase',
      title: 'Entitlement active after purchase',
      platform: 'both',
      requiredSetup: ['Completed purchase'],
      steps: ['Check CustomerInfo entitlement'],
      expectedResult: `${c.entitlementId} active.`,
      manualObservationFields: manualFields(),
      blockerIfFails: true,
      relatedVerifyScript: 'verify:iap-integration',
      countsForSandboxPass: true,
      automatedOnly: false,
    },
    {
      id: 'restore_no_purchase',
      title: 'Restore no purchase',
      platform: 'both',
      requiredSetup: ['Fresh sandbox account'],
      steps: ['Tap Erişimi Geri Yükle'],
      expectedResult: 'not_found copy; limited unchanged.',
      manualObservationFields: manualFields(),
      blockerIfFails: false,
      relatedVerifyScript: 'verify:iap-integration',
      countsForSandboxPass: true,
      automatedOnly: false,
    },
    {
      id: 'restore_existing_purchase',
      title: 'Restore existing purchase',
      platform: 'both',
      requiredSetup: ['Prior purchase on account'],
      steps: ['Reinstall', 'Tap restore CTA'],
      expectedResult: 'Full access restored.',
      manualObservationFields: manualFields(),
      blockerIfFails: true,
      relatedVerifyScript: 'verify:iap-integration',
      countsForSandboxPass: true,
      automatedOnly: false,
    },
    {
      id: 'restart_entitlement_sync',
      title: 'Restart entitlement sync',
      platform: 'both',
      requiredSetup: ['Active entitlement'],
      steps: ['Kill app', 'Relaunch', 'Open hub'],
      expectedResult: 'Full mode persists; no auto restorePurchases.',
      manualObservationFields: manualFields(),
      blockerIfFails: true,
      relatedVerifyScript: 'verify:iap-integration',
      countsForSandboxPass: true,
      automatedOnly: false,
    },
    {
      id: 'limited_mode_remains_playable',
      title: 'Limited mode remains playable',
      platform: 'both',
      requiredSetup: ['Limited continue without purchase'],
      steps: ['Play Day 8 limited flow'],
      expectedResult: 'Core loop playable; no trap.',
      manualObservationFields: manualFields(),
      blockerIfFails: false,
      relatedVerifyScript: 'verify:monetization-gate',
      countsForSandboxPass: false,
      automatedOnly: true,
    },
    {
      id: 'full_mode_unlock_visible',
      title: 'Full mode unlock visible',
      platform: 'both',
      requiredSetup: ['Sandbox purchase completed'],
      steps: ['Return to hub'],
      expectedResult: 'Full operation cues; no premium wording.',
      manualObservationFields: manualFields(),
      blockerIfFails: false,
      relatedVerifyScript: 'verify:monetization-gate',
      countsForSandboxPass: true,
      automatedOnly: false,
    },
    {
      id: 'offline_offer_graceful_error',
      title: 'Offline offer graceful error',
      platform: 'both',
      requiredSetup: ['Airplane mode'],
      steps: ['Open offer', 'Tap purchase'],
      expectedResult: 'Controlled error; no crash.',
      manualObservationFields: manualFields(),
      blockerIfFails: true,
      relatedVerifyScript: 'verify:iap-integration',
      countsForSandboxPass: true,
      automatedOnly: false,
    },
  ];

  return {
    version: '1',
    docsPath: IAP_SANDBOX_SMOKE_EXECUTION_DOCS_PATH,
    readinessDocsPath: IAP_SANDBOX_SMOKE_TEST_DOCS_PATH,
    minimumCaseCount: IAP_SANDBOX_SMOKE_MIN_CASE_COUNT,
    cases,
    entitlementId: c.entitlementId,
    offeringId: c.offeringId,
    iosProductId: c.iosProductId,
    androidProductId: c.androidProductId,
  };
}

export function classifyIapSandboxSmokeCase(input: {
  caseId: string;
  status: CreviaIapSandboxSmokeTestStatus;
  severity?: CreviaIapSandboxSmokeObservation['severity'];
}): CreviaIapSandboxSmokeTestStatus {
  const plan = buildIapSandboxSmokeExecutionPlan();
  const testCase = plan.cases.find((c) => c.id === input.caseId);
  if (!testCase) return 'blocked';

  if (IAP_SANDBOX_SMOKE_DEV_ONLY_CASE_IDS.includes(input.caseId as (typeof IAP_SANDBOX_SMOKE_DEV_ONLY_CASE_IDS)[number])) {
    return input.status === 'passed' ? 'not_applicable' : input.status;
  }

  if (input.status === 'failed') {
    if (testCase.blockerIfFails || IAP_SANDBOX_SMOKE_BLOCKER_CASE_IDS.includes(input.caseId as (typeof IAP_SANDBOX_SMOKE_BLOCKER_CASE_IDS)[number])) {
      return 'blocked';
    }
    if (input.caseId === 'offline_offer_graceful_error') {
      return input.severity === 'blocker' ? 'blocked' : 'failed';
    }
    return 'failed';
  }

  return input.status;
}

function resolveCaseStatusForPlatform(
  testCase: CreviaIapSandboxSmokeTestCase,
  platform: 'ios' | 'android',
  observations: CreviaIapSandboxSmokeObservation[],
): CreviaIapSandboxSmokeTestStatus {
  if (testCase.automatedOnly) {
    if (testCase.id === 'app_open_no_key_dev_mock') {
      const config = getIapRuntimeConfig();
      return config.mode === 'mock' ? 'not_applicable' : 'pending_manual';
    }
    if (testCase.id === 'app_open_no_key_production_disabled') {
      const config = getIapRuntimeConfig();
      return config.mode === 'disabled' ? 'not_applicable' : 'pending_manual';
    }
    if (testCase.id === 'limited_mode_remains_playable') {
      return 'not_applicable';
    }
  }

  if (testCase.platform === 'dev') {
    return 'not_applicable';
  }

  const obs = observations.find((o) => o.caseId === testCase.id && o.platform === platform && o.completed);
  if (!obs) {
    return testCase.countsForSandboxPass ? 'pending_manual' : 'not_started';
  }

  return classifyIapSandboxSmokeCase({
    caseId: testCase.id,
    status: obs.status,
    severity: obs.severity,
  });
}

export function collectIapSandboxSmokeBlockers(
  plan: CreviaIapSandboxSmokeExecutionPlan,
  platformResults: CreviaIapSandboxSmokePlatformResult[],
  observations: CreviaIapSandboxSmokeObservation[],
  keysConfigured: boolean,
  storeSetupPending: boolean,
): CreviaIapSandboxSmokeBlocker[] {
  const blockers: CreviaIapSandboxSmokeBlocker[] = [];

  if (!keysConfigured) {
    blockers.push({
      id: 'exec.missing_revenuecat_keys',
      platform: 'both',
      title: 'RevenueCat public SDK keys missing',
      message: 'EXPO_PUBLIC_REVENUECAT_IOS/ANDROID not configured.',
      recommendation: 'Add appl_/goog_ keys to EAS secrets before manual smoke.',
    });
  }

  if (storeSetupPending) {
    blockers.push({
      id: 'exec.missing_store_setup',
      platform: 'both',
      title: 'Store dashboard product setup pending',
      message: 'App Store Connect / Play Console products not verified.',
      recommendation: 'Complete store setup checklist in smoke execution docs.',
    });
  }

  const sandboxCases = plan.cases.filter((c) => c.countsForSandboxPass);
  const hasManualSandboxResult = observations.some(
    (o) => o.completed && sandboxCases.some((c) => c.id === o.caseId),
  );
  if (!hasManualSandboxResult) {
    blockers.push({
      id: 'exec.manual_results_missing',
      platform: 'both',
      title: 'Manual sandbox smoke results missing',
      message: 'No logged device results for sandbox purchase/restore matrix.',
      recommendation: `Fill template in ${IAP_SANDBOX_SMOKE_EXECUTION_DOCS_PATH}.`,
    });
  }

  for (const obs of observations.filter((o) => o.completed && (o.status === 'failed' || o.status === 'blocked'))) {
    const testCase = plan.cases.find((c) => c.id === obs.caseId);
    if (!testCase) continue;
    const classified = classifyIapSandboxSmokeCase({
      caseId: obs.caseId,
      status: obs.status,
      severity: obs.severity,
    });
    if (classified === 'blocked' || (classified === 'failed' && testCase.blockerIfFails)) {
      blockers.push({
        id: `exec.case_failed.${obs.caseId}.${obs.platform}`,
        platform: obs.platform,
        title: `Smoke case failed: ${testCase.title}`,
        message: obs.observedResult || obs.notes || 'Failed on device.',
        recommendation: obs.notes || 'Fix and re-run on EAS dev build.',
      });
    }
  }

  for (const pr of platformResults) {
    if (pr.pendingCount > 0 && pr.sandboxCaseCount > 0) {
      blockers.push({
        id: `exec.platform_pending.${pr.platform}`,
        platform: pr.platform,
        title: `${pr.platform.toUpperCase()} sandbox smoke pending`,
        message: `${pr.pendingCount} sandbox case(s) still pending on ${pr.platform}.`,
        recommendation: `Complete iOS/Android smoke on ${pr.platform} device.`,
      });
    }
  }

  return blockers;
}

export function buildIapSandboxSmokeDecision(input: {
  keysConfigured: boolean;
  storeSetupPending: boolean;
  manualResultsPresent: boolean;
  sandboxSmokePassed: boolean;
  hasFailedBlocker: boolean;
  blockers: CreviaIapSandboxSmokeBlocker[];
}): CreviaIapSandboxSmokeDecision {
  if (!input.keysConfigured) {
    return 'blocked_missing_revenuecat_keys';
  }
  if (input.storeSetupPending) {
    return 'blocked_missing_store_setup';
  }
  if (input.hasFailedBlocker) {
    return 'failed_smoke_test';
  }
  if (!input.manualResultsPresent) {
    return 'blocked_manual_results_missing';
  }
  if (input.sandboxSmokePassed) {
    return 'passed_sandbox_smoke';
  }
  if (input.blockers.length === 0 && input.manualResultsPresent) {
    return 'ready_to_run_manual_smoke';
  }
  return 'blocked_manual_results_missing';
}

export function summarizeIapSandboxSmokeReadiness(
  result: CreviaIapSandboxSmokeExecutionResult,
): string {
  return [
    `Health: ${result.health}`,
    `Decision: ${result.decision}`,
    `Cases: ${result.plan.cases.length}`,
    `iOS: ${result.platformResults.find((p) => p.platform === 'ios')?.status ?? 'pending'}`,
    `Android: ${result.platformResults.find((p) => p.platform === 'android')?.status ?? 'pending'}`,
    `Sandbox passed: ${result.sandboxSmokePassed}`,
    `Manual results: ${result.manualResultsPresent}`,
  ].join(' | ');
}

export function buildIapSandboxSmokeManualTemplate(): Record<string, string> {
  const c = IAP_SANDBOX_SMOKE_EXECUTION_CONSTANTS;
  return {
    platform: 'ios | android',
    device: 'e.g. Pixel 6a / iPhone 14',
    buildProfile: 'EAS development',
    revenueCatAppIdVisible: 'yes | no | n/a',
    offeringId: c.offeringId,
    entitlementId: c.entitlementId,
    productId: `${c.iosProductId} (iOS) / ${c.androidProductId} (Android)`,
    testerAccountType: 'sandbox Apple ID | Play license tester',
    testCaseResult: 'passed | failed | blocked | skipped',
    screenshotPath: 'path or link',
    videoPath: 'path or link',
    logs: 'RevenueCat / store error codes',
    notes: 'free text',
    severity: 'blocker | high | medium | low',
  };
}

export type BuildIapSandboxSmokeExecutionResultOptions = {
  observations?: CreviaIapSandboxSmokeObservation[];
};

export function buildIapSandboxSmokeExecutionResult(
  options: BuildIapSandboxSmokeExecutionResultOptions = {},
): CreviaIapSandboxSmokeExecutionResult {
  const plan = buildIapSandboxSmokeExecutionPlan();
  const observations = options.observations ?? [];
  const keysConfigured =
    readEnv(IAP_SANDBOX_QA_ENV_KEYS.ios) && readEnv(IAP_SANDBOX_QA_ENV_KEYS.android);
  const storeSetupPending = true;

  const sandboxCases = plan.cases.filter((c) => c.countsForSandboxPass);

  const caseStatuses = plan.cases.map((testCase) => {
    const iosStatus = resolveCaseStatusForPlatform(testCase, 'ios', observations);
    const androidStatus = resolveCaseStatusForPlatform(testCase, 'android', observations);
    let overallStatus: CreviaIapSandboxSmokeTestStatus = 'pending_manual';
    if (iosStatus === 'blocked' || androidStatus === 'blocked') overallStatus = 'blocked';
    else if (iosStatus === 'failed' || androidStatus === 'failed') overallStatus = 'failed';
    else if (
      testCase.countsForSandboxPass &&
      iosStatus === 'passed' &&
      androidStatus === 'passed'
    ) {
      overallStatus = 'passed';
    } else if (!testCase.countsForSandboxPass) {
      overallStatus = iosStatus === 'not_applicable' ? 'not_applicable' : iosStatus;
    }
    return { caseId: testCase.id, iosStatus, androidStatus, overallStatus };
  });

  const platformResults: CreviaIapSandboxSmokePlatformResult[] = (['ios', 'android'] as const).map(
    (platform) => {
      const relevant = caseStatuses.filter((cs) => {
        const tc = plan.cases.find((c) => c.id === cs.caseId);
        return tc?.countsForSandboxPass;
      });
      const passedCount = relevant.filter(
        (cs) => (platform === 'ios' ? cs.iosStatus : cs.androidStatus) === 'passed',
      ).length;
      const failedCount = relevant.filter((cs) => {
        const s = platform === 'ios' ? cs.iosStatus : cs.androidStatus;
        return s === 'failed' || s === 'blocked';
      }).length;
      const pendingCount = relevant.filter((cs) => {
        const s = platform === 'ios' ? cs.iosStatus : cs.androidStatus;
        return s === 'pending_manual' || s === 'not_started';
      }).length;
      const manualResultsLogged = observations.some(
        (o) => o.platform === platform && o.completed && sandboxCases.some((c) => c.id === o.caseId),
      );
      let status: CreviaIapSandboxSmokeTestStatus = 'pending_manual';
      if (failedCount > 0) status = 'blocked';
      else if (pendingCount === 0 && passedCount === relevant.length && relevant.length > 0) {
        status = 'passed';
      } else if (!manualResultsLogged) {
        status = 'pending_manual';
      }

      return {
        platform,
        status,
        passedCount,
        failedCount,
        pendingCount,
        sandboxCaseCount: relevant.length,
        manualResultsLogged,
      };
    },
  );

  const blockers = collectIapSandboxSmokeBlockers(
    plan,
    platformResults,
    observations,
    keysConfigured,
    storeSetupPending,
  );

  const manualResultsPresent = observations.some(
    (o) => o.completed && sandboxCases.some((c) => c.id === o.caseId),
  );

  const sandboxSmokePassed =
    platformResults.every((p) => p.status === 'passed') &&
    manualResultsPresent &&
    keysConfigured &&
    !storeSetupPending;

  const devMockOnlyPassed =
    !manualResultsPresent &&
    plan.cases
      .filter((c) => c.automatedOnly)
      .every((c) => {
        const cs = caseStatuses.find((x) => x.caseId === c.id);
        return cs?.overallStatus === 'not_applicable' || cs?.overallStatus === 'passed';
      });

  const hasFailedBlocker = blockers.some((b) => b.id.startsWith('exec.case_failed'));

  const decision = buildIapSandboxSmokeDecision({
    keysConfigured,
    storeSetupPending,
    manualResultsPresent,
    sandboxSmokePassed,
    hasFailedBlocker,
    blockers,
  });

  let health: CreviaIapSandboxSmokeHealthStatus = 'WARN';
  if (
    decision === 'blocked_missing_revenuecat_keys' ||
    decision === 'blocked_missing_store_setup' ||
    decision === 'failed_smoke_test' ||
    decision === 'blocked_manual_results_missing'
  ) {
    health = 'BLOCKED';
  } else if (decision === 'passed_sandbox_smoke') {
    health = 'PASS';
  }

  const nextActions: string[] = [];
  if (!keysConfigured) {
    nextActions.push('Configure EXPO_PUBLIC_REVENUECAT_IOS_API_KEY and ANDROID_API_KEY in EAS.');
  }
  if (storeSetupPending) {
    nextActions.push('Complete App Store Connect + Play Console product setup.');
  }
  if (!manualResultsPresent) {
    nextActions.push(`Run manual smoke on EAS dev build; log results in ${plan.docsPath}.`);
  }
  if (decision === 'passed_sandbox_smoke') {
    nextActions.push('Proceed only after real device playtest Round 1 is also complete.');
  }

  return {
    health,
    decision,
    plan,
    caseStatuses,
    platformResults,
    blockers,
    observations,
    revenueCatKeysConfigured: keysConfigured,
    storeSetupAssumedPending: storeSetupPending,
    sandboxSmokePassed,
    devMockOnlyPassed,
    manualResultsPresent,
    nextActions,
  };
}

export function assertIapSandboxSmokeExecutionPlanIntegrity(): {
  ok: boolean;
  caseCount: number;
} {
  const plan = buildIapSandboxSmokeExecutionPlan();
  const valid =
    plan.cases.length >= IAP_SANDBOX_SMOKE_MIN_CASE_COUNT &&
    plan.cases.every(
      (c) => c.id && c.platform && c.steps.length > 0 && c.expectedResult.length > 0,
    ) &&
    existsSync(join(REPO_ROOT, IAP_SANDBOX_SMOKE_EXECUTION_DOCS_PATH));
  return { ok: valid, caseCount: plan.cases.length };
}
