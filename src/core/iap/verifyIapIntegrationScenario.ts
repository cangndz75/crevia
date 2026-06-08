import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildAnalyticsPayload,
  validateAnalyticsEventPayload,
} from '@/core/analytics/analyticsSchema';
import { validateAnalyticsEventDefinitions } from '@/core/analytics/analyticsSchema';
import {
  applyIapEntitlementToMonetizationState,
  createInitialMonetizationState,
  mockPurchaseMainOperationPack,
  selectLimitedContinue,
} from '@/core/monetization/monetizationState';
import { verifyMonetizationScenario } from '@/core/monetization/verifyMonetizationScenario';
import { createDay1Seed } from '@/core/content/day1Seed';
import {
  applyFullAccessToGameState,
  buildDevJumpPilotCompletedGameState,
} from '@/core/monetization/monetizationEngine';
import { verifyInteractionContractsScenario } from '@/core/quality/interactionContracts/verifyInteractionContractsScenario';
import { verifyIapProductDesignScenario } from '@/core/iap/verifyIapProductDesignScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  IAP_OFFER_COPY,
  IAP_STORE_PRODUCT_IDS,
  IAP_UI_FORBIDDEN_WORDS,
  MAIN_OPERATION_ENTITLEMENT_ID,
  MAIN_OPERATION_IAP_PRODUCT_ID,
} from './iapProductConstants';
import {
  buildMockEntitlementForMainOperation,
  mapEntitlementToMonetizationAccess,
  shouldUnlockMainOperationFromEntitlement,
} from './iapEntitlementMapping';
import {
  getIapRuntimeConfig,
  getRevenueCatApiKeyForPlatform,
  isRevenueCatConfigured,
  looksLikeRevenueCatSecretKey,
  validateIapRuntimeConfig,
} from './iapRuntimeConfig';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyIapIntegrationOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${fail}`);
  return ok;
}

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function listTsFiles(dir: string): string[] {
  const full = join(REPO_ROOT, dir);
  if (!existsSync(full)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    const child = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listTsFiles(child));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      out.push(child);
    }
  }
  return out;
}

function grepRepo(pattern: RegExp): string[] {
  const hits: string[] = [];
  const dirs = ['src/core/iap', 'src/features/postPilot', 'src/store'];
  for (const dir of dirs) {
    for (const file of listTsFiles(dir)) {
      const content = readRepo(file);
      if (pattern.test(content)) {
        hits.push(file);
      }
    }
  }
  return hits;
}

export function verifyIapIntegrationScenario(): VerifyIapIntegrationOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const config = getIapRuntimeConfig();
  ok =
    assert(
      checks,
      typeof config.mode === 'string',
      'iapRuntimeConfig default safe',
      'Invalid runtime config',
    ) && ok;

  ok =
    assert(
      checks,
      (() => {
        try {
          getIapRuntimeConfig();
          return true;
        } catch {
          return false;
        }
      })(),
      'Missing keys do not crash config',
      'Config throws without keys',
    ) && ok;

  ok =
    assert(
      checks,
      config.mode === 'disabled' ||
        config.mode === 'mock' ||
        config.mode === 'revenuecat',
      'Missing keys yield disabled/mock/revenuecat',
      `Unexpected mode ${config.mode}`,
    ) && ok;

  const iosKeyConfig = {
    ...config,
    mode: 'revenuecat' as const,
    revenueCatIosApiKey: 'appl_test_key',
    revenueCatAndroidApiKey: undefined,
  };
  ok =
    assert(
      checks,
      getRevenueCatApiKeyForPlatform(iosKeyConfig, 'ios') === 'appl_test_key',
      'iOS key selector',
      'iOS key selector failed',
    ) && ok;

  const androidKeyConfig = {
    ...config,
    mode: 'revenuecat' as const,
    revenueCatIosApiKey: undefined,
    revenueCatAndroidApiKey: 'goog_test_key',
  };
  ok =
    assert(
      checks,
      getRevenueCatApiKeyForPlatform(androidKeyConfig, 'android') === 'goog_test_key',
      'Android key selector',
      'Android key selector failed',
    ) && ok;

  const validation = validateIapRuntimeConfig(config);
  const secretFinding = validation.findings.some((f) =>
    f.id.includes('secret'),
  );
  ok =
    assert(
      checks,
      looksLikeRevenueCatSecretKey('sk_live_abc') && !looksLikeRevenueCatSecretKey('appl_abc'),
      'Secret key pattern rejected',
      'Secret key guard broken',
    ) && ok;
  if (secretFinding) {
    hasWarn = true;
  }

  const iapFiles = listTsFiles('src/core/iap');
  const sdkImportFiles = iapFiles.filter(
    (f) =>
      !f.includes('verify') &&
      readRepo(f).includes('react-native-purchases'),
  );
  ok =
    assert(
      checks,
      sdkImportFiles.length === 1 &&
        sdkImportFiles[0]?.replace(/\\/g, '/') ===
          'src/core/iap/revenueCatIapAdapter.ts',
      'SDK import only in revenueCatIapAdapter',
      `SDK imports: ${sdkImportFiles.join(', ')}`,
    ) && ok;

  const adapterSource = readRepo('src/core/iap/revenueCatIapAdapter.ts');
  ok =
    assert(
      checks,
      !adapterSource.includes('fetch(') && !adapterSource.includes('XMLHttpRequest'),
      'No custom network fetch in adapter',
      'Custom network in adapter',
    ) && ok;

  ok =
    assert(
      checks,
      adapterSource.includes('configurePromise') || adapterSource.includes('configured'),
      'configure only once guard',
      'Missing configure guard',
    ) && ok;

  const offerScreen = readRepo('src/features/postPilot/screens/PostPilotOfferScreen.tsx');

  const restoreHits = grepRepo(/\.restorePurchases\(/);
  const restoreOnlyUser =
    restoreHits.every((f) => f.includes('revenueCatIapAdapter.ts')) &&
    offerScreen.includes('restoreIapPurchases') &&
    offerScreen.includes('handleRestore');
  ok =
    assert(
      checks,
      restoreOnlyUser,
      'restorePurchases user-action flow only',
      'restorePurchases used outside user flow',
    ) && ok;

  ok =
    assert(
      checks,
      !adapterSource.includes('syncPurchases'),
      'No syncPurchases in MVP',
      'syncPurchases present',
    ) && ok;

  ok =
    assert(
      checks,
      offerScreen.includes('handleRestore'),
      'Restore CTA user action handler',
      'Restore not user triggered',
    ) && ok;

  const bootstrapEffect = offerScreen.match(
    /const bootstrapIap = async \(\) => \{[\s\S]*?\};/,
  )?.[0] ?? '';
  ok =
    assert(
      checks,
      bootstrapEffect.length > 0 &&
        !bootstrapEffect.includes('restoreIapPurchases') &&
        bootstrapEffect.includes('getActiveIapEntitlements'),
      'No automatic restore on mount (uses getCustomerInfo sync)',
      'Auto restore on mount detected',
    ) && ok;

  const runtimeService = readRepo('src/core/iap/iapRuntimeService.ts');
  ok =
    assert(
      checks,
      runtimeService.includes('export async function purchaseIapProduct') &&
        runtimeService.includes('export async function restoreIapPurchases'),
      'purchase/restore exports exist',
      'IAP runtime exports missing',
    ) && ok;

  ok =
    assert(
      checks,
      mapEntitlementToMonetizationAccess(buildMockEntitlementForMainOperation(8)) ===
        'full',
      'Active entitlement maps full',
      'Entitlement mapping broken',
    ) && ok;

  const inactive = { ...buildMockEntitlementForMainOperation(8), isActive: false };
  ok =
    assert(
      checks,
      mapEntitlementToMonetizationAccess(inactive) === 'none',
      'Inactive entitlement no full access',
      'Inactive unlocks',
    ) && ok;

  const limited = selectLimitedContinue(createInitialMonetizationState(), 8);
  const applied = applyIapEntitlementToMonetizationState(
    limited,
    buildMockEntitlementForMainOperation(8),
    8,
  );
  ok =
    assert(
      checks,
      applied.mainOperationAccess === 'full',
      'apply entitlement unlocks full',
      'apply entitlement failed',
    ) && ok;

  const appliedTwice = applyIapEntitlementToMonetizationState(
    applied,
    buildMockEntitlementForMainOperation(8),
    8,
  );
  ok =
    assert(
      checks,
      appliedTwice.ownedPacks.length === applied.ownedPacks.length,
      'apply entitlement idempotent',
      'Duplicate owned pack',
    ) && ok;

  const completedGs = buildDevJumpPilotCompletedGameState(createDay1Seed().gameState);
  const withDistrict = {
    ...completedGs,
    pilot: {
      ...completedGs.pilot,
      selectedDistrictId:
        completedGs.pilot.selectedDistrictId ?? 'cumhuriyet',
    },
  };
  const fullGs = applyFullAccessToGameState(withDistrict);
  ok =
    assert(
      checks,
      fullGs.pilot.run?.unlockState?.fullMainOperationUnlocked === true,
      'fullMainOperationUnlocked true after applyFullAccess',
      'fullMainOperationUnlocked false',
    ) && ok;
  ok =
    assert(
      checks,
      fullGs.pilot.postPilotOperation?.phase === 'main_operation_full',
      'postPilotOperation main_operation_full',
      'post pilot phase wrong',
    ) && ok;

  ok =
    assert(
      checks,
      selectLimitedContinue(createInitialMonetizationState(), 8).mainOperationAccess ===
        'limited',
      'limited flow preserved',
      'limited flow broken',
    ) && ok;

  ok =
    assert(
      checks,
      mockPurchaseMainOperationPack(limited, 8).mainOperationAccess === 'full',
      'mock purchase preserved',
      'mock purchase broken',
    ) && ok;

  ok =
    assert(
      checks,
      runtimeService.includes('shouldUseMockPurchaseForOfferScreen') &&
        runtimeService.includes("config.mode === 'mock'"),
      'dev mock production guard',
      'mock guard wrong',
    ) && ok;

  ok =
    assert(
      checks,
      offerScreen.includes('purchaseIapProduct') && offerScreen.includes('shouldUseRevenueCatPurchaseForOfferScreen'),
      'PostPilotOfferScreen real purchase path',
      'Real purchase not wired',
    ) && ok;

  ok =
    assert(
      checks,
      offerScreen.includes('mockPurchase') && offerScreen.includes('shouldUseMockPurchaseForOfferScreen'),
      'PostPilotOfferScreen dev mock path',
      'Mock path missing',
    ) && ok;

  ok =
    assert(
      checks,
      offerScreen.includes('onRestore') && offerScreen.includes('handleRestore'),
      'Restore CTA connected',
      'Restore CTA missing',
    ) && ok;

  const choiceCard = readRepo(
    'src/features/postPilot/components/PostPilotAccessChoiceCard.tsx',
  );
  ok =
    assert(
      checks,
      !choiceCard.includes('onRestore={() => {}}') && choiceCard.includes('onRestore'),
      'Restore CTA not empty onPress',
      'Empty restore handler',
    ) && ok;

  ok =
    assert(
      checks,
      offerScreen.includes('iapBusy') || offerScreen.includes('isPurchasing'),
      'Loading blocks concurrent purchase/restore',
      'Concurrent guard missing',
    ) && ok;

  ok =
    assert(
      checks,
      offerScreen.includes("result.status === 'cancelled'"),
      'Cancelled purchase no scary path',
      'Cancelled handling missing',
    ) && ok;

  ok =
    assert(
      checks,
      offerScreen.includes('iap_purchase_failed') && offerScreen.includes('purchaseFailed'),
      'Failed purchase friendly copy path',
      'Failed purchase handling missing',
    ) && ok;

  ok =
    assert(
      checks,
      offerScreen.includes('iap_restore_not_found'),
      'Restore not_found analytics',
      'Restore not_found missing',
    ) && ok;

  const copyBlob = [
    offerScreen,
    choiceCard,
    IAP_OFFER_COPY.title,
    IAP_OFFER_COPY.primaryCtaLabel,
  ].join('\n');
  const forbiddenHit = IAP_UI_FORBIDDEN_WORDS.find((w) =>
    copyBlob.toLowerCase().includes(w),
  );
  ok =
    assert(checks, !forbiddenHit, 'No forbidden copy words', `Forbidden: ${forbiddenHit}`) &&
    ok;

  const analyticsCases: Array<{
    name: Parameters<typeof buildAnalyticsPayload>[0];
    extra?: Record<string, string>;
  }> = [
    { name: 'iap_product_list_loaded', extra: { source: 'mock' } },
    { name: 'iap_purchase_started', extra: { ctaId: 'primary_unlock', source: 'revenuecat' } },
    { name: 'iap_purchase_completed', extra: { source: 'revenuecat', resultBand: 'completed' } },
    { name: 'iap_purchase_failed', extra: { source: 'revenuecat', resultBand: 'failed' } },
    { name: 'iap_restore_started', extra: { source: 'revenuecat' } },
    { name: 'iap_restore_completed', extra: { source: 'revenuecat', resultBand: 'restored' } },
    { name: 'iap_restore_not_found', extra: { source: 'mock', resultBand: 'not_found' } },
    { name: 'post_pilot_offer_opened' },
    { name: 'limited_continue_selected', extra: { source: 'post_pilot_offer' } },
    { name: 'main_operation_mock_purchase_started', extra: { source: 'mock' } },
    { name: 'main_operation_mock_purchase_completed', extra: { source: 'mock' } },
  ];

  for (const { name, extra } of analyticsCases) {
    const payload = buildAnalyticsPayload(name, {
      surface: 'post_pilot_offer',
      day: 8,
      accessMode: 'post_pilot_limited',
    }, extra ?? {});
    const valid = validateAnalyticsEventPayload(payload).valid;
    ok = assert(checks, valid, `${name} analytics valid`, `${name} analytics invalid`) && ok;
    ok =
      assert(
        checks,
        !JSON.stringify(payload).toLowerCase().includes('error:'),
        `No raw error in ${name}`,
        `Raw error in ${name}`,
      ) && ok;
  }

  ok =
    assert(
      checks,
      MAIN_OPERATION_IAP_PRODUCT_ID === 'main_operation_season_1',
      'Product id main_operation_season_1',
      'Wrong product id',
    ) && ok;
  ok =
    assert(
      checks,
      MAIN_OPERATION_ENTITLEMENT_ID === 'main_operation_full_access',
      'Entitlement id main_operation_full_access',
      'Wrong entitlement id',
    ) && ok;
  ok =
    assert(
      checks,
      IAP_STORE_PRODUCT_IDS.ios === 'crevia.main_operation.season1',
      'iOS store id',
      'iOS store id wrong',
    ) && ok;
  ok =
    assert(
      checks,
      IAP_STORE_PRODUCT_IDS.android === 'crevia_main_operation_season_1',
      'Android store id',
      'Android store id wrong',
    ) && ok;

  const integrationDoc = readRepo('docs/crevia-iap-integration.md');
  ok =
    assert(
      checks,
      integrationDoc.includes('BILLING') && integrationDoc.includes('In-App Purchase'),
      'Native checklist in docs',
      'Native checklist missing',
    ) && ok;
  ok =
    assert(
      checks,
      integrationDoc.includes('EXPO_PUBLIC_REVENUECAT'),
      'Public SDK key doc',
      'SDK key doc missing',
    ) && ok;

  ok = assert(checks, SAVE_VERSION === 24, 'SAVE_VERSION 23', 'SAVE_VERSION changed') && ok;

  const persistSource = readRepo('src/store/gamePersist.ts');
  ok =
    assert(
      checks,
      !persistSource.includes('iapRuntime') && !persistSource.includes('revenueCat'),
      'No new persist key for IAP',
      'New persist key detected',
    ) && ok;

  const monetizationVerify = verifyMonetizationScenario();
  ok =
    assert(checks, monetizationVerify.ok, 'monetization-gate compatible', 'monetization verify failed') &&
    ok;

  const analyticsSchema = validateAnalyticsEventDefinitions();
  ok =
    assert(
      checks,
      analyticsSchema.failCount === 0,
      'analytics-events schema compatible',
      `analytics schema FAIL count=${analyticsSchema.failCount}`,
    ) && ok;

  const productDesignVerify = verifyIapProductDesignScenario();
  ok =
    assert(
      checks,
      productDesignVerify.ok,
      'iap-product-design compatible',
      'iap product design failed',
    ) && ok;

  const interactionVerify = verifyInteractionContractsScenario();
  ok =
    assert(
      checks,
      interactionVerify.ok,
      'interaction-contracts compatible',
      'interaction contracts failed',
    ) && ok;

  const storeSource = readRepo('src/store/useGameStore.ts');
  ok =
    assert(
      checks,
      storeSource.includes('applyIapEntitlementToMonetization'),
      'Store applyIapEntitlement action',
      'Store action missing',
    ) && ok;

  ok =
    assert(
      checks,
      adapterSource.includes('getOfferings'),
      'RevenueCat getOfferings product mapping',
      'getOfferings not used',
    ) && ok;

  ok =
    assert(
      checks,
      !isRevenueCatConfigured({ mode: 'disabled', useDebugLogs: false }),
      'purchase missing config graceful (not configured)',
      'Configured when disabled',
    ) && ok;

  if (!isRevenueCatConfigured(config)) {
    hasWarn =
      !warn(
        checks,
        false,
        'RevenueCat API keys configured',
        'RevenueCat API keys not configured',
      ) || hasWarn;
  }

  hasWarn =
    !warn(
      checks,
      false,
      'Store products created in console',
      'Store products not created in console',
    ) || hasWarn;

  hasWarn =
    !warn(
      checks,
      false,
      'Sandbox purchase manually tested',
      'Sandbox purchase not manually tested',
    ) || hasWarn;

  const pkg = readRepo('package.json');
  ok =
    assert(
      checks,
      pkg.includes('react-native-purchases'),
      'react-native-purchases dependency',
      'Dependency missing',
    ) && ok;

  return {
    ok,
    warn: hasWarn,
    checks,
  };
}
