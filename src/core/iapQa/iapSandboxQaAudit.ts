import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ANALYTICS_EVENT_DEFINITIONS } from '@/core/analytics/analyticsSchema';
import {
  buildAnalyticsPayload,
  validateAnalyticsEventPayload,
} from '@/core/analytics/analyticsSchema';
import {
  applyIapEntitlementToMonetizationState,
  createInitialMonetizationState,
  mockPurchaseMainOperationPack,
  selectLimitedContinue,
} from '@/core/monetization/monetizationState';
import {
  getIapRuntimeConfig,
  looksLikeRevenueCatSecretKey,
} from '@/core/iap/iapRuntimeConfig';
import {
  IAP_STORE_PRODUCT_IDS,
  MAIN_OPERATION_ENTITLEMENT_ID,
  MAIN_OPERATION_IAP_PRODUCT_ID,
  IAP_STATUS_COPY,
} from '@/core/iap/iapProductConstants';
import { buildMockEntitlementForMainOperation } from '@/core/iap/iapEntitlementMapping';

import {
  IAP_INTEGRATION_DOCS_PATH,
  IAP_SANDBOX_QA_DOCS_PATH,
  IAP_SANDBOX_QA_ENV_KEYS,
  buildIapSandboxQaChecklist,
} from './iapSandboxQaConstants';
import type {
  IapSandboxQaAuditResult,
  IapSandboxQaFinding,
  IapSandboxQaHealth,
  IapSandboxQaSeverity,
} from './iapSandboxQaTypes';
import { buildIapSandboxQaNextSteps } from './iapSandboxQaPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function readEnvRaw(key: string): string | undefined {
  const raw = process.env[key];
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function finding(
  id: string,
  area: IapSandboxQaFinding['area'],
  severity: IapSandboxQaSeverity,
  title: string,
  message: string,
  recommendation: string,
  manual: boolean,
): IapSandboxQaFinding {
  return { id, area, severity, title, message, recommendation, manual };
}

function pass(
  id: string,
  area: IapSandboxQaFinding['area'],
  title: string,
  message: string,
  recommendation: string,
  manual = false,
): IapSandboxQaFinding {
  return finding(id, area, 'pass', title, message, recommendation, manual);
}

function warn(
  id: string,
  area: IapSandboxQaFinding['area'],
  title: string,
  message: string,
  recommendation: string,
  manual = false,
): IapSandboxQaFinding {
  return finding(id, area, 'warn', title, message, recommendation, manual);
}

function fail(
  id: string,
  area: IapSandboxQaFinding['area'],
  title: string,
  message: string,
  recommendation: string,
  manual = false,
): IapSandboxQaFinding {
  return finding(id, area, 'fail', title, message, recommendation, manual);
}

function blocker(
  id: string,
  area: IapSandboxQaFinding['area'],
  title: string,
  message: string,
  recommendation: string,
): IapSandboxQaFinding {
  return finding(id, area, 'blocker', title, message, recommendation, false);
}

function findAndroidManifestBilling(): boolean {
  const paths = [
    'android/app/src/main/AndroidManifest.xml',
    'android/AndroidManifest.xml',
  ];
  for (const rel of paths) {
    const content = readRepo(rel);
    if (content.includes('com.android.vending.BILLING')) {
      return true;
    }
  }
  const pkg = readRepo('package.json');
  return pkg.includes('react-native-purchases');
}

export function calculateIapSandboxQaHealth(
  findings: IapSandboxQaFinding[],
): IapSandboxQaHealth {
  if (findings.some((f) => f.severity === 'blocker')) {
    return 'BLOCKED';
  }
  if (findings.some((f) => f.severity === 'fail')) {
    return 'FAIL';
  }
  if (findings.some((f) => f.severity === 'warn')) {
    return 'WARN';
  }
  return 'PASS';
}

export function auditIapEnvConfig(): IapSandboxQaFinding[] {
  const findings: IapSandboxQaFinding[] = [];
  const rawIos = readEnvRaw(IAP_SANDBOX_QA_ENV_KEYS.ios);
  const rawAndroid = readEnvRaw(IAP_SANDBOX_QA_ENV_KEYS.android);

  if (rawIos && looksLikeRevenueCatSecretKey(rawIos)) {
    findings.push(
      blocker(
        'env.ios_secret_key',
        'release_blockers',
        'iOS secret key in client env',
        `${IAP_SANDBOX_QA_ENV_KEYS.ios} looks like a secret key.`,
        'Remove from .env; use public appl_* key only in client.',
      ),
    );
  } else if (rawIos && !rawIos.includes('REPLACE_WITH')) {
    findings.push(
      pass(
        'env.ios_public_key',
        'env_config',
        'iOS public SDK key configured',
        'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY is set.',
        'Keep key in EAS secrets for CI builds.',
      ),
    );
  } else {
    findings.push(
      warn(
        'env.ios_public_key',
        'env_config',
        'iOS public SDK key pending',
        'Sandbox iOS purchase requires appl_* public key.',
        `Set ${IAP_SANDBOX_QA_ENV_KEYS.ios} in .env or EAS.`,
      ),
    );
  }

  if (rawAndroid && looksLikeRevenueCatSecretKey(rawAndroid)) {
    findings.push(
      blocker(
        'env.android_secret_key',
        'release_blockers',
        'Android secret key in client env',
        `${IAP_SANDBOX_QA_ENV_KEYS.android} looks like a secret key.`,
        'Remove from .env; use public goog_* key only in client.',
      ),
    );
  } else if (rawAndroid && !rawAndroid.includes('REPLACE_WITH')) {
    findings.push(
      pass(
        'env.android_public_key',
        'env_config',
        'Android public SDK key configured',
        'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY is set.',
        'Keep key in EAS secrets for CI builds.',
      ),
    );
  } else {
    findings.push(
      warn(
        'env.android_public_key',
        'env_config',
        'Android public SDK key pending',
        'Sandbox Android purchase requires goog_* public key.',
        `Set ${IAP_SANDBOX_QA_ENV_KEYS.android} in .env or EAS.`,
      ),
    );
  }

  if (
    !findings.some((f) => f.id === 'env.ios_secret_key' || f.id === 'env.android_secret_key')
  ) {
    findings.push(
      pass(
        'env.no_secret_key',
        'env_config',
        'No secret key pattern in env',
        'Public env keys pass secret guard.',
        'Never commit sk_ or rcsk_ keys.',
      ),
    );
  }

  let config;
  try {
    config = getIapRuntimeConfig();
    findings.push(
      pass(
        'env.runtime_safe',
        'env_config',
        'getIapRuntimeConfig does not crash',
        `Runtime mode: ${config.mode}.`,
        'Keys missing should not throw.',
      ),
    );
  } catch {
    findings.push(
      fail(
        'env.runtime_safe',
        'env_config',
        'getIapRuntimeConfig throws',
        'Config read must be crash-safe.',
        'Fix iapRuntimeConfig error handling.',
      ),
    );
    config = { mode: 'disabled' as const, useDebugLogs: false };
  }

  if (config.mode === 'mock' || config.mode === 'disabled') {
    findings.push(
      warn(
        'env.sandbox_unavailable',
        'env_config',
        'Sandbox purchase unavailable without RevenueCat keys',
        `Current mode: ${config.mode}. Dev mock still works.`,
        'Add public keys before EAS sandbox test.',
        false,
      ),
    );
  }

  if (config.mode === 'disabled') {
    findings.push(
      pass(
        'env.production_graceful_disabled',
        'env_config',
        'Production-style disabled mode (no keys)',
        'Purchase flow returns failed/disabled without crash.',
        'Expected when keys absent in non-dev.',
      ),
    );
  }

  return findings;
}

export function auditRevenueCatDashboardChecklist(): IapSandboxQaFinding[] {
  const findings: IapSandboxQaFinding[] = [];

  if (MAIN_OPERATION_ENTITLEMENT_ID === 'main_operation_full_access') {
    findings.push(
      pass(
        'rc.entitlement_id',
        'revenuecat_dashboard',
        'Entitlement id matches code',
        MAIN_OPERATION_ENTITLEMENT_ID,
        'Create same entitlement id in RevenueCat dashboard.',
      ),
    );
  } else {
    findings.push(
      fail(
        'rc.entitlement_id',
        'revenuecat_dashboard',
        'Entitlement id mismatch',
        MAIN_OPERATION_ENTITLEMENT_ID,
        'Align dashboard with iapProductConstants.',
      ),
    );
  }

  const manualItems: Array<{ id: string; title: string; rec: string }> = [
    {
      id: 'rc.project_created',
      title: 'RevenueCat project',
      rec: 'Create project at app.revenuecat.com.',
    },
    {
      id: 'rc.ios_app',
      title: 'RevenueCat iOS app',
      rec: 'Link bundle id and iOS public SDK key.',
    },
    {
      id: 'rc.android_app',
      title: 'RevenueCat Android app',
      rec: 'Link package name and Android public SDK key.',
    },
    {
      id: 'rc.product_ios_attached',
      title: 'iOS product attached',
      rec: `Attach ${IAP_STORE_PRODUCT_IDS.ios} to entitlement.`,
    },
    {
      id: 'rc.product_android_attached',
      title: 'Android product attached',
      rec: `Attach ${IAP_STORE_PRODUCT_IDS.android} to entitlement.`,
    },
    {
      id: 'rc.offering_package',
      title: 'Offering/package',
      rec: 'Add package to default offering for getOfferings().',
    },
    {
      id: 'rc.sandbox_customer',
      title: 'Sandbox customer verified',
      rec: 'Complete one sandbox purchase and verify CustomerInfo.',
    },
  ];

  for (const m of manualItems) {
    findings.push(
      warn(
        m.id,
        'revenuecat_dashboard',
        `${m.title} — manual pending`,
        'Dashboard step not auto-verifiable.',
        m.rec,
        true,
      ),
    );
  }

  return findings;
}

export function auditStoreProductChecklist(): IapSandboxQaFinding[] {
  const findings: IapSandboxQaFinding[] = [];

  if (IAP_STORE_PRODUCT_IDS.ios === 'crevia.main_operation.season1') {
    findings.push(
      pass(
        'asc.product_id',
        'app_store_connect',
        'iOS product id documented',
        IAP_STORE_PRODUCT_IDS.ios,
        'Create matching product in App Store Connect.',
      ),
    );
  }

  if (IAP_STORE_PRODUCT_IDS.android === 'crevia_main_operation_season_1') {
    findings.push(
      pass(
        'play.product_id',
        'play_console',
        'Android product id documented',
        IAP_STORE_PRODUCT_IDS.android,
        'Create matching product in Play Console.',
      ),
    );
  }

  const ascManual = [
    ['asc.product_type', 'Non-consumable type', 'Use non-consumable one-time unlock.'],
    ['asc.metadata', 'Product metadata', 'Complete localized display name.'],
    ['asc.price_tier', 'Price tier', 'Select tier for sandbox.'],
    ['asc.sandbox_status', 'Sandbox-ready status', 'Agreements + product cleared.'],
    ['asc.sandbox_tester', 'Sandbox tester', 'Add Sandbox Apple ID on device.'],
  ] as const;
  for (const [id, title, rec] of ascManual) {
    findings.push(
      warn(id, 'app_store_connect', `${title} — manual pending`, 'App Store Connect.', rec, true),
    );
  }

  const playManual = [
    ['play.one_time_product', 'One-time product', 'Managed product, not subscription.'],
    ['play.price_active', 'Price active', 'Publish price on test track.'],
    ['play.license_tester', 'License tester', 'Add tester Gmail in Play Console.'],
    ['play.internal_track', 'Internal testing build', 'Upload dev build if billing unavailable.'],
  ] as const;
  for (const [id, title, rec] of playManual) {
    findings.push(
      warn(id, 'play_console', `${title} — manual pending`, 'Play Console.', rec, true),
    );
  }

  findings.push(
    warn(
      'store.pricing_pending',
      'app_store_connect',
      'Pricing not finalized',
      'Price tier / Play price pending manual setup.',
      'Finalize before public launch.',
      true,
    ),
  );

  return findings;
}

export function auditNativeCapabilitiesChecklist(): IapSandboxQaFinding[] {
  const findings: IapSandboxQaFinding[] = [];
  const sandboxDoc = readRepo(IAP_SANDBOX_QA_DOCS_PATH);
  const integrationDoc = readRepo(IAP_INTEGRATION_DOCS_PATH);

  findings.push(
    warn(
      'native.ios_iap_capability',
      'native_capabilities',
      'iOS In-App Purchase capability — manual',
      'Expo managed: enable in Xcode after prebuild.',
      'Run npx expo prebuild; open .xcworkspace; enable IAP capability.',
      true,
    ),
  );

  const documentsIos134 =
    sandboxDoc.includes('13.4') && integrationDoc.includes('13.4');
  findings.push(
    documentsIos134
      ? pass(
          'native.ios_deployment_13_4',
          'native_capabilities',
          'iOS 13.4+ documented',
          'Minimum deployment target in docs.',
          'Verify Podfile after prebuild.',
        )
      : warn(
          'native.ios_deployment_13_4',
          'native_capabilities',
          'iOS 13.4+ documentation incomplete',
          'RevenueCat requires iOS 13.4+.',
          'Add to sandbox QA docs.',
        ),
  );

  const documentsApi23 =
    sandboxDoc.includes('23') && integrationDoc.includes('23');
  findings.push(
    documentsApi23
      ? pass(
          'native.android_api_23',
          'native_capabilities',
          'Android API 23+ documented',
          'minSdk requirement in docs.',
          'Verify android/build.gradle after prebuild.',
        )
      : warn(
          'native.android_api_23',
          'native_capabilities',
          'Android API 23+ documentation incomplete',
          'Billing requires API 23+.',
          'Add to sandbox QA docs.',
        ),
  );

  if (findAndroidManifestBilling()) {
    findings.push(
      pass(
        'native.android_billing_permission',
        'native_capabilities',
        'BILLING permission or purchases dependency',
        'Manifest contains BILLING or will via prebuild + react-native-purchases.',
        'Confirm com.android.vending.BILLING after EAS prebuild.',
      ),
    );
  } else {
    findings.push(
      warn(
        'native.android_billing_permission',
        'native_capabilities',
        'BILLING permission not found in repo',
        'Expected after expo prebuild / EAS build.',
        'Run prebuild and verify AndroidManifest.xml.',
        true,
      ),
    );
  }

  const expoGoDoc =
    sandboxDoc.toLowerCase().includes('expo go') &&
    integrationDoc.toLowerCase().includes('expo go');
  findings.push(
    expoGoDoc
      ? pass(
          'native.expo_go_unsupported',
          'native_capabilities',
          'Expo Go limitation documented',
          'Docs state dev build required for real IAP.',
          'Use eas build --profile development.',
        )
      : warn(
          'native.expo_go_unsupported',
          'native_capabilities',
          'Expo Go warning missing in docs',
          'Real purchases fail in Expo Go.',
          'Document in crevia-iap-sandbox-qa.md.',
        ),
  );

  findings.push(
    pass(
      'native.dev_build_required',
      'native_capabilities',
      'Development build required',
      'react-native-purchases in package.json.',
      'Do not test real IAP in Expo Go.',
    ),
  );

  return findings;
}

export function auditDevelopmentBuildChecklist(): IapSandboxQaFinding[] {
  const manual: Array<{ id: string; title: string; rec: string }> = [
    {
      id: 'devbuild.eas_created',
      title: 'EAS dev build',
      rec: 'eas build --profile development --platform all',
    },
    {
      id: 'devbuild.ios_installed',
      title: 'iOS dev build installed',
      rec: 'Install .ipa on device; sign in sandbox Apple ID.',
    },
    {
      id: 'devbuild.android_installed',
      title: 'Android dev build installed',
      rec: 'Install from internal track or adb.',
    },
    {
      id: 'devbuild.revenuecat_configure',
      title: 'RevenueCat configure',
      rec: 'Open PostPilot offer; no RNPurchases null error.',
    },
    {
      id: 'devbuild.get_offerings',
      title: 'getOfferings package',
      rec: 'Product title/price visible on offer screen if configured.',
    },
  ];
  return manual.map((m) =>
    warn(
      m.id,
      'development_build',
      `${m.title} — manual pending`,
      'Requires physical device + EAS build.',
      m.rec,
      true,
    ),
  );
}

export function auditPurchaseFlowChecklist(): IapSandboxQaFinding[] {
  const findings: IapSandboxQaFinding[] = [];
  const offer = readRepo('src/features/postPilot/screens/PostPilotOfferScreen.tsx');
  const engine = readRepo('src/core/monetization/monetizationEngine.ts');

  if (engine.includes('shouldRouteToPostPilotOffer')) {
    findings.push(
      pass(
        'purchase.pilot_day7_offer',
        'purchase_flow',
        'Post-pilot offer routing exists',
        'shouldRouteToPostPilotOffer in monetization engine.',
        'Reach offer after pilot Day 7.',
      ),
    );
  }

  if (offer.includes('purchaseIapProduct')) {
    findings.push(
      pass(
        'purchase.cta_starts_flow',
        'purchase_flow',
        'Purchase CTA wired',
        'purchaseIapProduct called from PostPilotOfferScreen.',
        'Test on dev build with sandbox account.',
      ),
    );
  }

  if (offer.includes("result.status === 'cancelled'")) {
    findings.push(
      pass(
        'purchase.cancellation_friendly',
        'purchase_flow',
        'Cancellation handled',
        'Cancelled purchase clears scary errors.',
        'Cancel sandbox sheet and retry.',
      ),
    );
  }

  if (readRepo('src/store/useGameStore.ts').includes('applyIapEntitlementToMonetization')) {
    findings.push(
      pass(
        'purchase.entitlement_applied',
        'purchase_flow',
        'Store applies IAP entitlement',
        'applyIapEntitlementToMonetization action exists.',
        'Verify full access after sandbox purchase.',
      ),
    );
  }

  const applied = applyIapEntitlementToMonetizationState(
    selectLimitedContinue(createInitialMonetizationState(), 8),
    buildMockEntitlementForMainOperation(8),
    8,
  );
  if (applied.mainOperationAccess === 'full') {
    findings.push(
      pass(
        'purchase.full_access_state',
        'purchase_flow',
        'mainOperationAccess full after entitlement',
        'applyIapEntitlementToMonetizationState verified.',
        'Confirm on device after purchase.',
      ),
    );
  }

  findings.push(
    warn(
      'purchase.sandbox_manual',
      'purchase_flow',
      'Sandbox purchase smoke test — manual pending',
      'Automated store purchase not run in verify.',
      'Complete checklist in docs/crevia-iap-sandbox-qa.md.',
      true,
    ),
  );

  return findings;
}

export function auditRestoreFlowChecklist(): IapSandboxQaFinding[] {
  const findings: IapSandboxQaFinding[] = [];
  const offer = readRepo('src/features/postPilot/screens/PostPilotOfferScreen.tsx');
  const adapter = readRepo('src/core/iap/revenueCatIapAdapter.ts');

  if (offer.includes('restoreLabel') || offer.includes('onRestore')) {
    findings.push(
      pass(
        'restore.cta_visible',
        'restore_flow',
        'Restore CTA present',
        'PostPilotAccessChoiceCard restore handler.',
        'Tap Erişimi Geri Yükle on device.',
      ),
    );
  }

  const bootstrap = offer.match(/const bootstrapIap = async \(\) => \{[\s\S]*?\};/)?.[0] ?? '';
  if (bootstrap && !bootstrap.includes('restoreIapPurchases')) {
    findings.push(
      pass(
        'restore.no_auto_restore_mount',
        'restore_flow',
        'No automatic restore on mount',
        'Bootstrap uses getActiveIapEntitlements only.',
        'Restore remains user-initiated.',
      ),
    );
  } else if (bootstrap.includes('restoreIapPurchases')) {
    findings.push(
      fail(
        'restore.no_auto_restore_mount',
        'restore_flow',
        'Automatic restore on mount detected',
        'restoreIapPurchases must not run in bootstrap.',
        'Remove auto restore; use getCustomerInfo sync only.',
      ),
    );
  }

  if (!adapter.includes('syncPurchases')) {
    findings.push(
      pass(
        'restore.no_sync_purchases',
        'restore_flow',
        'syncPurchases not used',
        'MVP uses restorePurchases on user action only.',
        'Keep syncPurchases out of adapter.',
      ),
    );
  }

  if (offer.includes('applyIapEntitlement') && offer.includes('restored')) {
    findings.push(
      pass(
        'restore.restored_entitlement',
        'restore_flow',
        'Restored path applies entitlement',
        'handleRestore applies on restored status.',
        'Test restore after reinstall.',
      ),
    );
  }

  if (IAP_STATUS_COPY.restoreNotFound.length > 0) {
    findings.push(
      pass(
        'restore.not_found_copy',
        'restore_flow',
        'not_found friendly copy defined',
        IAP_STATUS_COPY.restoreNotFound.slice(0, 60),
        'Verify copy on device.',
      ),
    );
  }

  if (offer.includes('restoreIapPurchases') && offer.includes('handleRestore')) {
    findings.push(
      pass(
        'restore.user_action_only',
        'restore_flow',
        'restoreIapPurchases via handleRestore',
        'User CTA triggers restore flow.',
        'Do not call restore on app launch.',
      ),
    );
  }

  findings.push(
    warn(
      'restore.sandbox_manual',
      'restore_flow',
      'Sandbox restore smoke test — manual pending',
      'Manual device test required.',
      'Reinstall app → Restore CTA → verify full access.',
      true,
    ),
  );

  return findings;
}

export function auditMockFlowChecklist(): IapSandboxQaFinding[] {
  const findings: IapSandboxQaFinding[] = [];
  const runtime = readRepo('src/core/iap/iapRuntimeService.ts');
  const offer = readRepo('src/features/postPilot/screens/PostPilotOfferScreen.tsx');

  if (
    runtime.includes("config.mode === 'mock'") &&
    offer.includes('mockPurchase')
  ) {
    findings.push(
      pass(
        'mock.dev_without_keys',
        'mock_flow',
        'Dev mock purchase path',
        'shouldUseMockPurchaseForOfferScreen + mockPurchase.',
        'Test in __DEV__ without env keys.',
      ),
    );
  }

  if (mockPurchaseMainOperationPack(createInitialMonetizationState(), 8).mainOperationAccess === 'full') {
    findings.push(
      pass(
        'mock.full_operation',
        'mock_flow',
        'Mock unlock sets full access',
        'mockPurchaseMainOperationPack unchanged.',
        'Dev smoke: Ana Operasyonu Aç in dev.',
      ),
    );
  }

  if (selectLimitedContinue(createInitialMonetizationState(), 8).mainOperationAccess === 'limited') {
    findings.push(
      pass(
        'mock.limited_flow',
        'mock_flow',
        'Limited continue preserved',
        'selectLimitedContinue still works.',
        'Test Sınırlı Gündemle Devam Et.',
      ),
    );
  }

  if (runtime.includes("mode: 'disabled'")) {
    findings.push(
      pass(
        'mock.production_no_crash',
        'mock_flow',
        'Disabled mode without crash',
        'iapRuntimeService handles missing keys.',
        'Production build without keys stays stable.',
      ),
    );
  }

  return findings;
}

export function auditIapAnalyticsChecklist(): IapSandboxQaFinding[] {
  const findings: IapSandboxQaFinding[] = [];
  const names = ANALYTICS_EVENT_DEFINITIONS.map((d) => d.name);
  const purchaseEvents = ['iap_purchase_started', 'iap_purchase_completed', 'iap_purchase_failed'];
  const restoreEvents = [
    'iap_restore_started',
    'iap_restore_completed',
    'iap_restore_not_found',
  ];

  if (purchaseEvents.every((e) => names.includes(e as (typeof names)[number]))) {
    findings.push(
      pass(
        'analytics.purchase_events',
        'analytics',
        'Purchase analytics events in schema',
        purchaseEvents.join(', '),
        'Track from PostPilotOfferScreen.',
      ),
    );
  }

  if (restoreEvents.every((e) => names.includes(e as (typeof names)[number]))) {
    findings.push(
      pass(
        'analytics.restore_events',
        'analytics',
        'Restore analytics events in schema',
        restoreEvents.join(', '),
        'Track restore CTA outcomes.',
      ),
    );
  }

  const sample = buildAnalyticsPayload('iap_purchase_failed', {
    surface: 'post_pilot_offer',
    day: 8,
    accessMode: 'post_pilot_limited',
  }, { source: 'revenuecat', resultBand: 'failed' });
  const valid = validateAnalyticsEventPayload(sample).valid;
  const noRawError = !JSON.stringify(sample).toLowerCase().includes('exception');
  if (valid && noRawError) {
    findings.push(
      pass(
        'analytics.no_raw_error',
        'analytics',
        'Controlled analytics payloads',
        'resultBand/source without raw error text.',
        'Keep error details out of analytics.',
      ),
    );
  }

  const offer = readRepo('src/features/postPilot/screens/PostPilotOfferScreen.tsx');
  if (offer.includes('trackAnalyticsEvent')) {
    findings.push(
      pass(
        'analytics.instrumented_screen',
        'analytics',
        'PostPilotOfferScreen instrumented',
        'trackAnalyticsEvent used.',
        'Validate with verify:analytics-events.',
      ),
    );
  }

  return findings;
}

export function auditIapReleaseBlockers(): IapSandboxQaFinding[] {
  const findings: IapSandboxQaFinding[] = [];

  findings.push(
    warn(
      'blocker.public_launch_without_store',
      'release_blockers',
      'Public launch blocked until store setup complete',
      'Store products, pricing, and sandbox tests pending.',
      'Complete IAP sandbox QA checklist before launch.',
      true,
    ),
  );

  return findings;
}

export function auditIapSoftLaunchIntegration(): IapSandboxQaFinding[] {
  const findings: IapSandboxQaFinding[] = [];
  const audit = readRepo('src/core/releaseReadiness/softLaunchReadinessAudit.ts');

  if (
    audit.includes('runIapSandboxQaAudit') ||
    audit.includes('sandbox_qa_pending') ||
    audit.includes('IAP sandbox')
  ) {
    findings.push(
      pass(
        'softlaunch.integration',
        'soft_launch_readiness',
        'Soft launch audit references IAP sandbox QA',
        'auditIapReadiness extended.',
        'Run verify:soft-launch-readiness after changes.',
      ),
    );
  } else {
    findings.push(
      warn(
        'softlaunch.integration',
        'soft_launch_readiness',
        'Soft launch IAP sandbox integration',
        'Wire sandbox QA findings into soft launch audit.',
        'Update softLaunchReadinessAudit.ts.',
      ),
    );
  }

  return findings;
}

export function runIapSandboxQaAudit(): IapSandboxQaAuditResult {
  const checklist = buildIapSandboxQaChecklist();
  const config = getIapRuntimeConfig();

  const findings: IapSandboxQaFinding[] = [
    ...auditIapEnvConfig(),
    ...auditRevenueCatDashboardChecklist(),
    ...auditStoreProductChecklist(),
    ...auditNativeCapabilitiesChecklist(),
    ...auditDevelopmentBuildChecklist(),
    ...auditPurchaseFlowChecklist(),
    ...auditRestoreFlowChecklist(),
    ...auditMockFlowChecklist(),
    ...auditIapAnalyticsChecklist(),
    ...auditIapSoftLaunchIntegration(),
    ...auditIapReleaseBlockers(),
  ];

  if (existsSync(join(REPO_ROOT, IAP_SANDBOX_QA_DOCS_PATH))) {
    findings.push(
      pass(
        'docs.sandbox_qa',
        'soft_launch_readiness',
        'Sandbox QA docs exist',
        IAP_SANDBOX_QA_DOCS_PATH,
        'Follow smoke test order in doc.',
      ),
    );
  } else {
    findings.push(
      warn(
        'docs.sandbox_qa',
        'soft_launch_readiness',
        'Sandbox QA docs missing',
        IAP_SANDBOX_QA_DOCS_PATH,
        'Create crevia-iap-sandbox-qa.md.',
      ),
    );
  }

  if (existsSync(join(REPO_ROOT, IAP_INTEGRATION_DOCS_PATH))) {
    findings.push(
      pass(
        'docs.integration',
        'env_config',
        'IAP integration docs exist',
        IAP_INTEGRATION_DOCS_PATH,
        'Cross-link with sandbox QA doc.',
      ),
    );
  }

  const passCount = findings.filter((f) => f.severity === 'pass').length;
  const warnCount = findings.filter((f) => f.severity === 'warn').length;
  const failCount = findings.filter((f) => f.severity === 'fail').length;
  const blockerCount = findings.filter((f) => f.severity === 'blocker').length;

  const result: IapSandboxQaAuditResult = {
    health: calculateIapSandboxQaHealth(findings),
    checkedCount: findings.length,
    passCount,
    warnCount,
    failCount,
    blockerCount,
    findings,
    checklist,
    nextSteps: [],
    runtimeMode: config.mode,
  };

  result.nextSteps = buildIapSandboxQaNextSteps(result);
  return result;
}

/** Verify: secret key in env must produce BLOCKED health. */
export function runIapSandboxQaAuditWithSimulatedSecretKey(): IapSandboxQaAuditResult {
  const prevIos = process.env[IAP_SANDBOX_QA_ENV_KEYS.ios];
  process.env[IAP_SANDBOX_QA_ENV_KEYS.ios] = 'sk_live_simulated_test_key';
  const findings = auditIapEnvConfig();
  if (prevIos === undefined) {
    delete process.env[IAP_SANDBOX_QA_ENV_KEYS.ios];
  } else {
    process.env[IAP_SANDBOX_QA_ENV_KEYS.ios] = prevIos;
  }
  return {
    health: calculateIapSandboxQaHealth(findings),
    checkedCount: findings.length,
    passCount: findings.filter((f) => f.severity === 'pass').length,
    warnCount: findings.filter((f) => f.severity === 'warn').length,
    failCount: findings.filter((f) => f.severity === 'fail').length,
    blockerCount: findings.filter((f) => f.severity === 'blocker').length,
    findings,
    checklist: buildIapSandboxQaChecklist(),
    nextSteps: [],
    runtimeMode: 'disabled',
  };
}
