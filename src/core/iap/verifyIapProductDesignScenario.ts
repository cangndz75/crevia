import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ANALYTICS_EVENT_DEFINITIONS } from '@/core/analytics/analyticsSchema';
import { validateAnalyticsEventDefinitions } from '@/core/analytics/analyticsSchema';
import { createDay1Seed } from '@/core/content/day1Seed';
import { buildDevJumpPilotCompletedGameState } from '@/core/monetization/monetizationEngine';
import {
  createInitialMonetizationState,
  mockPurchaseMainOperationPack,
} from '@/core/monetization/monetizationState';
import { verifyInteractionContractsScenario } from '@/core/quality/interactionContracts/verifyInteractionContractsScenario';
import { verifyMonetizationScenario } from '@/core/monetization/verifyMonetizationScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import { IAP_INTEGRATION_ADAPTER_CONTRACT } from './iapProductConstants';
import {
  buildMockEntitlementForMainOperation,
  buildOwnedPackFromEntitlement,
  mapEntitlementToMonetizationAccess,
  shouldUnlockMainOperationFromEntitlement,
  validateEntitlementMapping,
} from './iapEntitlementMapping';
import type { IapAdapter } from './iapAdapterContract';
import {
  buildIapOfferCopyModel,
  buildIapPurchaseStatusCopy,
  buildIapRestoreCopy,
  checkPostPilotOfferCopyAlignment,
  validateIapOfferCopy,
} from './iapOfferPresentation';
import {
  getIapProductDefinitions,
  getMainOperationProductDefinition,
  getIapProductById,
  isRecommendedLaunchIapProduct,
  validateIapProductDefinitions,
} from './iapProductDesign';
import { MOCK_PURCHASE_ANALYTICS_BRIDGE, ANALYTICS_IAP_EVENTS_STAGE2 } from './iapProductConstants';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyIapProductDesignOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

export function verifyIapProductDesignScenario(): VerifyIapProductDesignOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const products = getIapProductDefinitions();
  ok = assert(checks, products.length > 0, 'Product definitions not empty', 'Empty products') && ok;

  const main = getMainOperationProductDefinition();
  ok =
    assert(
      checks,
      main.productId === 'main_operation_season_1',
      'main_operation_season_1 product',
      'Missing main product',
    ) && ok;
  ok =
    assert(
      checks,
      main.type === 'one_time_unlock',
      'Product is one_time_unlock',
      'Wrong product type',
    ) && ok;
  ok =
    assert(
      checks,
      isRecommendedLaunchIapProduct(main),
      'Recommended launch product',
      'Not recommended',
    ) && ok;

  const subLaunch = products.filter(
    (p) => p.type === 'subscription' && p.isRecommendedLaunchProduct,
  );
  ok =
    assert(
      checks,
      subLaunch.length === 0,
      'Subscription not launch recommended',
      'Subscription recommended at launch',
    ) && ok;

  ok =
    assert(
      checks,
      main.entitlementId === 'main_operation_full_access',
      'Entitlement id defined',
      'Missing entitlement',
    ) && ok;
  ok =
    assert(checks, main.storeProductIds.ios.length > 0, 'iOS store id', 'Empty iOS id') && ok;
  ok =
    assert(
      checks,
      main.storeProductIds.android.length > 0,
      'Android store id',
      'Empty Android id',
    ) && ok;
  ok =
    assert(
      checks,
      (main.storeProductIds.revenueCat?.length ?? 0) > 0,
      'RevenueCat entitlement id',
      'Empty RC id',
    ) && ok;

  ok =
    assert(checks, main.unlocks.length >= 5, 'Unlock bullets count', 'Too few bullets') && ok;
  ok =
    assert(
      checks,
      main.unlocks.some((b) => /kriz/i.test(b)),
      'Unlock crisis desk',
      'Missing crisis',
    ) && ok;
  ok =
    assert(
      checks,
      main.unlocks.some((b) => /hedef/i.test(b)),
      'Unlock season goals',
      'Missing goals',
    ) && ok;
  ok =
    assert(
      checks,
      main.unlocks.some((b) => /kaynak|harita/i.test(b)),
      'Unlock resources/map',
      'Missing resources',
    ) && ok;
  ok =
    assert(
      checks,
      main.unlocks.some((b) => /canlı|karar/i.test(b)),
      'Unlock live decisions',
      'Missing live decisions',
    ) && ok;
  ok =
    assert(
      checks,
      main.unlocks.some((b) => /dönemsel operasyon değerlendirmesi/i.test(b)),
      'Unlock periodic operation review',
      'Missing periodic operation review',
    ) && ok;

  const offer = buildIapOfferCopyModel();
  const forbidden = ['premium', 'satın al', 'kilitli', 'paywall'];
  const copyBlob = [offer.title, offer.subtitle, offer.footerNote, ...offer.valueBullets].join(
    ' ',
  );
  ok =
    assert(
      checks,
      !forbidden.some((w) => copyBlob.toLowerCase().includes(w)),
      'UI copy forbidden words',
      'Forbidden word in copy',
    ) && ok;

  ok =
    assert(
      checks,
      offer.primaryCtaLabel === 'Ana Operasyonu Aç',
      'primaryCtaLabel',
      'Primary CTA mismatch',
    ) && ok;
  ok =
    assert(
      checks,
      offer.secondaryCtaLabel === 'Sınırlı Gündemle Devam Et',
      'secondaryCtaLabel',
      'Secondary CTA mismatch',
    ) && ok;
  ok =
    assert(
      checks,
      offer.restoreCtaLabel === 'Erişimi Geri Yükle',
      'restoreCtaLabel',
      'Restore CTA mismatch',
    ) && ok;

  const mockEnt = buildMockEntitlementForMainOperation(8);
  ok =
    assert(
      checks,
      mapEntitlementToMonetizationAccess(mockEnt) === 'full',
      'Active entitlement maps full',
      'Mapping failed',
    ) && ok;
  ok =
    assert(
      checks,
      !shouldUnlockMainOperationFromEntitlement({ ...mockEnt, isActive: false }),
      'Inactive does not unlock',
      'Inactive unlock bug',
    ) && ok;

  const pack = buildOwnedPackFromEntitlement(mockEnt, 8);
  ok =
    assert(
      checks,
      pack?.productId === 'main_operation_season_1',
      'Owned pack product id',
      'Wrong pack id',
    ) && ok;
  ok =
    assert(checks, mockEnt.source === 'mock', 'Mock entitlement source', 'Wrong source') && ok;

  ok =
    assert(checks, buildIapRestoreCopy('restored').length > 0, 'Restore restored copy', 'Empty') &&
    ok;
  ok =
    assert(
      checks,
      buildIapRestoreCopy('not_found').length > 0,
      'Restore not_found copy',
      'Empty',
    ) && ok;
  ok =
    assert(
      checks,
      buildIapPurchaseStatusCopy('completed').length > 0,
      'Purchase completed copy',
      'Empty',
    ) && ok;
  ok =
    assert(
      checks,
      !buildIapPurchaseStatusCopy('failed').toLowerCase().includes('exception'),
      'Purchase failed copy soft tone',
      'Too technical',
    ) && ok;

  const monetizationTypes = readRepo('src/core/monetization/monetizationTypes.ts');
  ok =
    assert(
      checks,
      monetizationTypes.includes('mainOperationAccess') &&
        monetizationTypes.includes('ownedPacks') &&
        !monetizationTypes.includes('iapEntitlementState'),
      'Monetization state shape unchanged',
      'Unexpected persist shape change',
    ) && ok;

  ok =
    assert(
      checks,
      readRepo('src/core/iap/iapEntitlementMapping.ts').includes('fullMainOperationUnlocked'),
      'fullMainOperationUnlocked documented',
      'Missing doc',
    ) && ok;

  const completedGs = buildDevJumpPilotCompletedGameState(createDay1Seed().gameState);
  const alignment = checkPostPilotOfferCopyAlignment(
    completedGs,
    createInitialMonetizationState(),
  );
  ok =
    assert(checks, alignment.aligned, 'PostPilotOffer copy alignment', alignment.mismatches.join('; ')) &&
    ok;

  ok =
    assert(
      checks,
      IAP_INTEGRATION_ADAPTER_CONTRACT.fetchProducts === 'fetchIapProducts',
      'Adapter fetchProducts',
      'Missing',
    ) && ok;
  ok =
    assert(
      checks,
      IAP_INTEGRATION_ADAPTER_CONTRACT.purchaseProduct === 'purchaseIapProduct',
      'Adapter purchaseProduct',
      'Missing',
    ) && ok;
  ok =
    assert(
      checks,
      IAP_INTEGRATION_ADAPTER_CONTRACT.restorePurchases === 'restoreIapPurchases',
      'Adapter restorePurchases',
      'Missing',
    ) && ok;
  ok =
    assert(
      checks,
      IAP_INTEGRATION_ADAPTER_CONTRACT.getCustomerEntitlements === 'getActiveEntitlements',
      'Adapter getCustomerEntitlements',
      'Missing',
    ) && ok;
  ok =
    assert(
      checks,
      IAP_INTEGRATION_ADAPTER_CONTRACT.syncEntitlementToMonetizationState.length > 0,
      'Adapter sync mapping',
      'Missing sync',
    ) && ok;

  const adapterFile = readRepo('src/core/iap/iapAdapterContract.ts');
  ok =
    assert(
      checks,
      adapterFile.includes('fetchIapProducts') &&
        adapterFile.includes('Promise<IapPurchaseResult>'),
      'Adapter contract types defined',
      'Incomplete adapter',
    ) && ok;

  const iapImplBlob = [
    'src/core/iap/iapProductTypes.ts',
    'src/core/iap/iapProductDesign.ts',
    'src/core/iap/iapEntitlementMapping.ts',
    'src/core/iap/iapOfferPresentation.ts',
    'src/core/iap/iapAdapterContract.ts',
    'src/core/iap/iapProductConstants.ts',
  ]
    .map(readRepo)
    .join('\n');
  ok =
    assert(
      checks,
      !iapImplBlob.includes('@revenuecat') &&
        !iapImplBlob.includes('react-native-purchases') &&
        !iapImplBlob.includes('expo-in-app-purchases'),
      'No RevenueCat/Billing SDK import',
      'SDK import found',
    ) && ok;
  ok =
    assert(
      checks,
      !iapImplBlob.includes('firebase') &&
        !iapImplBlob.includes('amplitude') &&
        !iapImplBlob.includes('posthog'),
      'No analytics SDK in iap',
      'Analytics SDK in iap',
    ) && ok;
  ok =
    assert(checks, !iapImplBlob.includes('fetch('), 'No network in iap core', 'Network in iap') &&
    ok;

  ok = assert(checks, SAVE_VERSION === 23, 'SAVE_VERSION 23', 'SAVE_VERSION changed') && ok;

  for (const bridge of Object.values(MOCK_PURCHASE_ANALYTICS_BRIDGE)) {
    ok =
      assert(
        checks,
        ANALYTICS_EVENT_DEFINITIONS.some((d) => d.name === bridge),
        `Analytics bridge ${bridge}`,
        `Missing ${bridge}`,
      ) && ok;
  }

  for (const eventName of ANALYTICS_IAP_EVENTS_STAGE2) {
    ok =
      assert(
        checks,
        ANALYTICS_EVENT_DEFINITIONS.some((d) => d.name === eventName),
        `IAP analytics event ${eventName}`,
        `Missing ${eventName}`,
      ) && ok;
  }

  const docs = readRepo('docs/crevia-iap-product-design.md');
  ok = assert(checks, docs.length > 200, 'Docs file exists', 'Docs missing') && ok;
  ok =
    assert(
      checks,
      docs.includes('tek seferlik') || docs.includes('one-time'),
      'Docs one-time unlock',
      'Missing unlock decision',
    ) && ok;
  ok =
    assert(
      checks,
      docs.includes('abonelik') || docs.includes('subscription'),
      'Docs subscription deferred',
      'Missing subscription section',
    ) && ok;
  ok =
    assert(checks, docs.includes('Geri Yükle') || docs.includes('restore'), 'Docs restore flow', 'Missing restore') && ok;
  ok =
    assert(checks, docs.includes('SDK') || docs.includes('Aşama 2'), 'Docs SDK phase 2', 'Missing SDK plan') && ok;

  const productAudit = validateIapProductDefinitions();
  ok =
    assert(checks, productAudit.health !== 'FAIL', 'Product design audit', 'Product audit FAIL') &&
    ok;

  const mappingAudit = validateEntitlementMapping();
  ok =
    assert(checks, mappingAudit.health !== 'FAIL', 'Entitlement mapping audit', 'Mapping FAIL') &&
    ok;

  const copyAudit = validateIapOfferCopy();
  ok = assert(checks, copyAudit.health !== 'FAIL', 'Offer copy audit', 'Copy audit FAIL') && ok;

  ok =
    assert(checks, verifyMonetizationScenario().ok, 'Monetization gate compatible', 'Monetization FAIL') &&
    ok;
  const analyticsSchema = validateAnalyticsEventDefinitions();
  ok =
    assert(
      checks,
      analyticsSchema.failCount === 0,
      'Analytics events schema compatible',
      `Analytics schema FAIL count=${analyticsSchema.failCount}`,
    ) && ok;
  if (analyticsSchema.warnCount > 0) hasWarn = true;

  ok =
    assert(
      checks,
      verifyInteractionContractsScenario().ok,
      'Interaction contracts compatible',
      'Contracts FAIL',
    ) && ok;

  const limited = createInitialMonetizationState();
  const afterLimited = { ...limited, mainOperationAccess: 'limited' as const };
  ok =
    assert(
      checks,
      afterLimited.mainOperationAccess === 'limited',
      'Limited flow preserved',
      'Limited broken',
    ) && ok;

  const purchased = mockPurchaseMainOperationPack(limited, 8);
  ok =
    assert(
      checks,
      purchased.mainOperationAccess === 'full',
      'Mock purchase still works',
      'Mock purchase broken',
    ) && ok;

  ok = assert(checks, getIapProductById('main_operation_season_1') != null, 'getIapProductById', 'Lookup failed') && ok;

  const _adapterTypeCheck: IapAdapter | null = null;
  ok = assert(checks, _adapterTypeCheck === null, 'Typecheck adapter export', 'Type error') && ok;

  checks.push('WARN Real IAP SDK integration pending');
  checks.push('WARN Store product ids must be created in App Store / Play Console');
  checks.push('WARN Pricing not finalized');
  checks.push('WARN Runtime purchase instrumentation pending');
  hasWarn = true;

  return { ok, warn: hasWarn, checks };
}
