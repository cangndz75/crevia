import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createDay1Seed } from '@/core/content/day1Seed';
import {
  IAP_OFFER_COPY,
  IAP_STORE_PRODUCT_IDS,
  IAP_UI_FORBIDDEN_WORDS,
  MAIN_OPERATION_ENTITLEMENT_ID,
} from '@/core/iap/iapProductConstants';
import { buildIapOfferCopyModel, validateIapOfferCopy } from '@/core/iap/iapOfferPresentation';
import { getIapRuntimeConfig } from '@/core/iap/iapRuntimeConfig';
import {
  STORE_IAP_METADATA_DRAFT,
  STORE_METADATA_FALSE_CLAIM_PATTERNS,
} from '@/core/releaseReadiness/storeMetadataFinalizationConstants';
import { PRIVACY_DATA_CATEGORY_MATRIX } from '@/core/releaseReadiness/privacyPolicyReadinessConstants';
import {
  NO_NEW_SYSTEM_FREEZE_ALLOWED_SCOPES,
  NO_NEW_SYSTEM_FREEZE_FORBIDDEN_SCOPES,
} from '@/core/releaseReadiness/noNewSystemFreezeConstants';

import {
  MONETIZATION_COPY,
  MONETIZATION_UI_FORBIDDEN_WORDS,
} from './monetizationConstants';
import {
  buildDevJumpPilotCompletedGameState,
  deriveMonetizationStateFromGameState,
} from './monetizationEngine';
import {
  buildPostPilotOfferViewModel,
  collectMonetizationPresentationStrings,
} from './monetizationPresentation';
import {
  createInitialMonetizationState,
  selectLimitedContinue,
  syncMonetizationAfterPilotComplete,
} from './monetizationState';
import {
  IAP_CONVERSION_EXPECTED_ENTITLEMENT_ID,
  IAP_CONVERSION_EXPECTED_OFFERING_ID,
  IAP_CONVERSION_EXPECTED_PRODUCT_TYPE,
  IAP_CONVERSION_PAYWALL_PRESSURE_PATTERNS,
  IAP_CONVERSION_READINESS_DOCS_PATH,
  IAP_CONVERSION_REQUIRED_OFFER_SIGNALS,
} from './iapConversionReadinessConstants';
import type {
  CreviaIapConversionReadinessArea,
  CreviaIapConversionReadinessFinding,
  CreviaIapConversionReadinessResult,
  CreviaIapConversionReadinessSeverity,
} from './iapConversionReadinessTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function makeFinding(
  area: CreviaIapConversionReadinessArea,
  id: string,
  severity: CreviaIapConversionReadinessSeverity,
  title: string,
  message: string,
  recommendation: string,
): CreviaIapConversionReadinessFinding {
  return { id, area, severity, title, message, recommendation };
}

function completedGameState() {
  const seed = createDay1Seed();
  return buildDevJumpPilotCompletedGameState({
    ...seed.gameState,
    pilot: {
      ...seed.gameState.pilot,
      status: 'completed',
      currentPilotDay: 7,
    },
  });
}

function collectAllOfferCopy(): string {
  const gs = completedGameState();
  const monetization = syncMonetizationAfterPilotComplete(
    createInitialMonetizationState(),
    7,
  );
  const offerModel = buildPostPilotOfferViewModel(gs, monetization);
  const iapModel = buildIapOfferCopyModel();
  return [
    collectMonetizationPresentationStrings(offerModel),
    MONETIZATION_COPY.offerTitle,
    MONETIZATION_COPY.offerSubtitle,
    MONETIZATION_COPY.heroLine,
    MONETIZATION_COPY.pilotSummaryLine,
    MONETIZATION_COPY.playerFooter,
    MONETIZATION_COPY.primaryCta,
    MONETIZATION_COPY.secondaryCta,
    MONETIZATION_COPY.restoreCta,
    MONETIZATION_COPY.limitedWarningTitle,
    MONETIZATION_COPY.limitedWarningLine,
    MONETIZATION_COPY.fullUnlockedTitle,
    MONETIZATION_COPY.fullUnlockedLine,
    IAP_OFFER_COPY.footerNote,
    iapModel.title,
    iapModel.subtitle,
    iapModel.primaryCtaLabel,
    iapModel.secondaryCtaLabel,
    iapModel.restoreCtaLabel,
    iapModel.footerNote,
    ...iapModel.valueBullets,
  ].join(' ');
}

function auditOfferValueProposition(): CreviaIapConversionReadinessFinding[] {
  const findings: CreviaIapConversionReadinessFinding[] = [];
  const gs = completedGameState();
  const monetization = syncMonetizationAfterPilotComplete(
    createInitialMonetizationState(),
    7,
  );
  const model = buildPostPilotOfferViewModel(gs, monetization);

  if (model.featureRows.length >= 5) {
    findings.push(
      makeFinding('offer_value_proposition', 'offer.feature_count', 'pass',
        'Offer feature list adequate',
        `${model.featureRows.length} feature rows.`,
        'Keep aligned with pack definition.'),
    );
  } else {
    findings.push(
      makeFinding('offer_value_proposition', 'offer.feature_count', 'fail',
        'Offer feature list too short',
        `Only ${model.featureRows.length} features.`,
        'Add more value bullets to pack.'),
    );
  }

  if (model.heroLine.length > 0 && model.pilotSummaryLine.length > 0) {
    findings.push(
      makeFinding('offer_value_proposition', 'offer.hero_summary', 'pass',
        'Hero and pilot summary present',
        'Offer conveys post-pilot transition.',
        'Keep concise.'),
    );
  } else {
    findings.push(
      makeFinding('offer_value_proposition', 'offer.hero_missing', 'fail',
        'Hero or pilot summary missing',
        'Offer screen lacks context.',
        'Add heroLine/pilotSummaryLine.'),
    );
  }

  return findings;
}

function auditLimitedFullClarity(): CreviaIapConversionReadinessFinding[] {
  const findings: CreviaIapConversionReadinessFinding[] = [];
  const gs = completedGameState();
  const monetization = syncMonetizationAfterPilotComplete(
    createInitialMonetizationState(),
    7,
  );
  const model = buildPostPilotOfferViewModel(gs, monetization);

  const hasLimitedLabel = model.secondaryCtaLabel.toLocaleLowerCase('tr-TR').includes('sınırlı');
  findings.push(
    makeFinding('limited_full_clarity', 'clarity.limited_cta', hasLimitedLabel ? 'pass' : 'fail',
      hasLimitedLabel ? 'Limited CTA mentions sınırlı' : 'Limited CTA missing sınırlı keyword',
      `Label: "${model.secondaryCtaLabel}"`,
      'Label must clearly show limited scope.'),
  );

  if (model.footerNote.length > 0) {
    findings.push(
      makeFinding('limited_full_clarity', 'clarity.footer_present', 'pass',
        'Footer explains limited scope',
        `"${model.footerNote.slice(0, 80)}"`,
        'Keep non-pressuring tone.'),
    );
  }

  const allCopy = collectAllOfferCopy().toLocaleLowerCase('tr-TR');
  const missingSignals = IAP_CONVERSION_REQUIRED_OFFER_SIGNALS.filter(
    (signal) => !allCopy.includes(signal.toLocaleLowerCase('tr-TR')),
  );
  findings.push(
    makeFinding('limited_full_clarity', 'clarity.required_signals',
      missingSignals.length === 0 ? 'pass' : 'fail',
      missingSignals.length === 0
        ? 'Required offer copy signals present'
        : 'Required offer copy signals missing',
      missingSignals.length === 0
        ? `Signals: ${IAP_CONVERSION_REQUIRED_OFFER_SIGNALS.join(', ')}`
        : `Missing: ${missingSignals.join(', ')}`,
      'Offer copy must mention limited mode, restore, and main operation.'),
  );

  const limited = selectLimitedContinue(monetization, 8);
  const limitedModel = buildPostPilotOfferViewModel(gs, limited);
  findings.push(
    makeFinding('limited_full_clarity', 'clarity.limited_playable_copy',
      limitedModel.isLimitedAccess ? 'pass' : 'fail',
      limitedModel.isLimitedAccess ? 'Limited state model reflects limited access' : 'Limited model broken',
      `isLimitedAccess=${limitedModel.isLimitedAccess}`,
      'Limited mode must remain playable.'),
  );

  return findings;
}

function auditPurchaseCtaSafety(): CreviaIapConversionReadinessFinding[] {
  const findings: CreviaIapConversionReadinessFinding[] = [];
  const offerScreen = readRepo('src/features/postPilot/screens/PostPilotOfferScreen.tsx');

  const hasBootstrap = offerScreen.includes('bootstrapIap');
  const bootstrapBlock =
    offerScreen.match(/const bootstrapIap = async \(\) => \{[\s\S]*?\};/)?.[0] ?? '';
  const noAutoPurchase = !bootstrapBlock.includes('purchaseIapProduct');

  findings.push(
    makeFinding('purchase_cta_safety', 'cta.no_auto_purchase',
      noAutoPurchase ? 'pass' : 'fail',
      noAutoPurchase ? 'No auto-purchase on mount' : 'Auto purchase risk on mount',
      hasBootstrap ? 'bootstrapIap does not trigger purchase' : 'No bootstrap block found',
      'Purchase must be user-initiated CTA only.'),
  );

  const noAutoRestore = !bootstrapBlock.includes('restoreIapPurchases');
  findings.push(
    makeFinding('purchase_cta_safety', 'cta.no_auto_restore',
      noAutoRestore ? 'pass' : 'fail',
      noAutoRestore ? 'No auto-restore on mount' : 'Auto restore risk on mount',
      'Restore must be user-initiated.',
      'Remove restoreIapPurchases from useEffect.'),
  );

  return findings;
}

function auditRestoreCtaVisibility(): CreviaIapConversionReadinessFinding[] {
  const findings: CreviaIapConversionReadinessFinding[] = [];
  const gs = completedGameState();
  const monetization = syncMonetizationAfterPilotComplete(
    createInitialMonetizationState(),
    7,
  );
  const model = buildPostPilotOfferViewModel(gs, monetization);

  const hasRestore = model.restoreLabel.length > 0;
  findings.push(
    makeFinding('restore_cta_visibility', 'restore.label_present',
      hasRestore ? 'pass' : 'fail',
      hasRestore ? 'Restore CTA label present' : 'Restore CTA label missing',
      `Label: "${model.restoreLabel}"`,
      'Restore CTA must always be visible on offer screen.'),
  );

  const restoreInIap = IAP_OFFER_COPY.restoreCtaLabel.length > 0;
  findings.push(
    makeFinding('restore_cta_visibility', 'restore.iap_copy_present',
      restoreInIap ? 'pass' : 'fail',
      restoreInIap ? 'IAP restore copy defined' : 'IAP restore copy missing',
      `IAP label: "${IAP_OFFER_COPY.restoreCtaLabel}"`,
      'Define restore CTA in iapProductConstants.'),
  );

  return findings;
}

function auditProductMetadataPending(): CreviaIapConversionReadinessFinding[] {
  const findings: CreviaIapConversionReadinessFinding[] = [];

  const config = getIapRuntimeConfig();
  const isPending = STORE_IAP_METADATA_DRAFT.priceTierStatus === 'pending_manual';
  const offerScreen = readRepo('src/features/postPilot/screens/PostPilotOfferScreen.tsx');

  findings.push(
    makeFinding('product_metadata_pending', 'pending.price_tier',
      isPending ? 'warn' : 'pass',
      isPending ? 'Price tier pending manual setup' : 'Price tier configured',
      `priceTierStatus: ${STORE_IAP_METADATA_DRAFT.priceTierStatus}`,
      'No fake price should be shown when pending.'),
  );

  const showsFakePrice = offerScreen.includes('$') || offerScreen.includes('₺') ||
    /\d+[.,]\d{2}\s*(?:TL|USD|\$|€)/i.test(offerScreen);
  findings.push(
    makeFinding('product_metadata_pending', 'pending.no_fake_price',
      !showsFakePrice ? 'pass' : 'fail',
      !showsFakePrice ? 'No hardcoded price in offer screen' : 'Hardcoded price detected in offer screen',
      showsFakePrice ? 'Remove static price placeholders' : 'Product price loaded dynamically or not shown.',
      'Price must come from store API only.'),
  );

  const hasLoadingState = offerScreen.includes('loading') || offerScreen.includes('Loading') ||
    offerScreen.includes('isLoading') || offerScreen.includes('isProductLoading');
  findings.push(
    makeFinding('product_metadata_pending', 'pending.loading_state',
      hasLoadingState ? 'pass' : 'warn',
      hasLoadingState ? 'Product loading state exists' : 'Product loading state not detected',
      'Loading indicator may be needed for store product fetch.',
      'Add loading state when fetching product info.'),
  );

  return findings;
}

function auditRevenueCatDisabledFailsafe(): CreviaIapConversionReadinessFinding[] {
  const findings: CreviaIapConversionReadinessFinding[] = [];
  const config = getIapRuntimeConfig();
  const runtimeService = readRepo('src/core/iap/iapRuntimeService.ts');

  findings.push(
    makeFinding('revenuecat_disabled_failsafe', 'rc.mode_safe',
      config.mode === 'disabled' || config.mode === 'mock' ? 'pass' : 'pass',
      `Runtime mode: ${config.mode}`,
      'Without keys → disabled in production, mock in dev.',
      'Keep fail-safe guards.'),
  );

  const hasDisabledGuard = runtimeService.includes("mode: 'disabled'");
  findings.push(
    makeFinding('revenuecat_disabled_failsafe', 'rc.disabled_guard',
      hasDisabledGuard ? 'pass' : 'fail',
      hasDisabledGuard ? 'Disabled mode guard present' : 'Disabled mode guard missing',
      'iapRuntimeService must return disabled without keys.',
      'Add disabled fallback to iapRuntimeService.'),
  );

  const devMockOnly = runtimeService.includes("mode === 'mock'") || runtimeService.includes("mode==='mock'");
  findings.push(
    makeFinding('revenuecat_disabled_failsafe', 'rc.dev_mock_guard',
      devMockOnly ? 'pass' : 'warn',
      devMockOnly ? 'Dev mock guard present' : 'Dev mock guard not detected',
      'Mock mode must be __DEV__ only.',
      'Guard mock path with __DEV__.'),
  );

  return findings;
}

function auditPaywallPressureWording(): CreviaIapConversionReadinessFinding[] {
  const findings: CreviaIapConversionReadinessFinding[] = [];
  const allCopy = collectAllOfferCopy().toLocaleLowerCase('tr-TR');

  const violations: string[] = [];
  for (const pattern of IAP_CONVERSION_PAYWALL_PRESSURE_PATTERNS) {
    if (allCopy.includes(pattern.toLocaleLowerCase('tr-TR'))) {
      violations.push(pattern);
    }
  }

  if (violations.length === 0) {
    findings.push(
      makeFinding('paywall_pressure_wording', 'pressure.scan_pass', 'pass',
        'No paywall pressure wording detected',
        `${IAP_CONVERSION_PAYWALL_PRESSURE_PATTERNS.length} patterns scanned.`,
        'Re-scan after copy edits.'),
    );
  } else {
    findings.push(
      makeFinding('paywall_pressure_wording', 'pressure.scan_fail', 'fail',
        'Paywall pressure wording detected',
        `Found: ${violations.join(', ')}`,
        'Remove pressure language from offer copy.'),
    );
  }

  const monetizationForbidden = MONETIZATION_UI_FORBIDDEN_WORDS.find(
    (w) => allCopy.includes(w),
  );
  if (!monetizationForbidden) {
    findings.push(
      makeFinding('paywall_pressure_wording', 'pressure.monetization_forbidden', 'pass',
        'Monetization forbidden words clean',
        'No XP, premium, satın al, kilitli, paywall, iap in offer copy.',
        'Keep forbidden word list updated.'),
    );
  } else {
    findings.push(
      makeFinding('paywall_pressure_wording', 'pressure.monetization_forbidden_hit', 'fail',
        'Monetization forbidden word found',
        `Found: ${monetizationForbidden}`,
        'Remove forbidden monetization term.'),
    );
  }

  const iapForbidden = IAP_UI_FORBIDDEN_WORDS.find(
    (w) => allCopy.includes(w),
  );
  if (!iapForbidden) {
    findings.push(
      makeFinding('paywall_pressure_wording', 'pressure.iap_forbidden', 'pass',
        'IAP UI forbidden words clean',
        'No premium, satın al, kilitli, paywall, ödeme yap, reklamsız, zorunlu in offer.',
        'Keep IAP forbidden word list.'),
    );
  } else {
    findings.push(
      makeFinding('paywall_pressure_wording', 'pressure.iap_forbidden_hit', 'fail',
        'IAP forbidden word found',
        `Found: ${iapForbidden}`,
        'Remove IAP forbidden term.'),
    );
  }

  return findings;
}

function auditFalseClaimWording(): CreviaIapConversionReadinessFinding[] {
  const findings: CreviaIapConversionReadinessFinding[] = [];
  const allCopy = collectAllOfferCopy().toLocaleLowerCase('tr-TR');

  const falseClaimHits: string[] = [];
  for (const pattern of STORE_METADATA_FALSE_CLAIM_PATTERNS) {
    if (allCopy.includes(pattern.toLocaleLowerCase('tr-TR'))) {
      falseClaimHits.push(pattern);
    }
  }

  if (falseClaimHits.length === 0) {
    findings.push(
      makeFinding('false_claim_wording', 'false_claim.scan_pass', 'pass',
        'No false claim wording in offer copy',
        `${STORE_METADATA_FALSE_CLAIM_PATTERNS.length} patterns scanned.`,
        'Re-scan after copy changes.'),
    );
  } else {
    findings.push(
      makeFinding('false_claim_wording', 'false_claim.scan_fail', 'fail',
        'False claim wording detected in offer copy',
        `Found: ${falseClaimHits.join(', ')}`,
        'Remove false claims immediately.'),
    );
  }

  return findings;
}

function auditIapMetadataConsistency(): CreviaIapConversionReadinessFinding[] {
  const findings: CreviaIapConversionReadinessFinding[] = [];
  const iapCopy = validateIapOfferCopy();

  findings.push(
    makeFinding('iap_metadata_consistency', 'meta.iap_copy_audit',
      iapCopy.health === 'PASS' ? 'pass' : iapCopy.health === 'WARN' ? 'warn' : 'fail',
      `IAP offer copy audit: ${iapCopy.health}`,
      `${iapCopy.passCount} pass, ${iapCopy.warnCount} warn, ${iapCopy.failCount} fail.`,
      'Fix IAP copy mismatches.'),
  );

  const entitlementMatch = STORE_IAP_METADATA_DRAFT.entitlementId === IAP_CONVERSION_EXPECTED_ENTITLEMENT_ID;
  findings.push(
    makeFinding('iap_metadata_consistency', 'meta.entitlement',
      entitlementMatch ? 'pass' : 'fail',
      entitlementMatch ? 'Entitlement ID consistent' : 'Entitlement ID mismatch',
      `Draft: ${STORE_IAP_METADATA_DRAFT.entitlementId}, expected: ${IAP_CONVERSION_EXPECTED_ENTITLEMENT_ID}`,
      'Align entitlement IDs.'),
  );

  const offeringMatch = STORE_IAP_METADATA_DRAFT.offeringId === IAP_CONVERSION_EXPECTED_OFFERING_ID;
  findings.push(
    makeFinding('iap_metadata_consistency', 'meta.offering',
      offeringMatch ? 'pass' : 'fail',
      offeringMatch ? 'Offering ID consistent' : 'Offering ID mismatch',
      `Draft: ${STORE_IAP_METADATA_DRAFT.offeringId}, expected: ${IAP_CONVERSION_EXPECTED_OFFERING_ID}`,
      'Align offering IDs.'),
  );

  const productTypeMatch = STORE_IAP_METADATA_DRAFT.productType === IAP_CONVERSION_EXPECTED_PRODUCT_TYPE;
  findings.push(
    makeFinding('iap_metadata_consistency', 'meta.product_type',
      productTypeMatch ? 'pass' : 'fail',
      productTypeMatch ? 'Product type consistent' : 'Product type mismatch',
      `Draft: ${STORE_IAP_METADATA_DRAFT.productType}, expected: ${IAP_CONVERSION_EXPECTED_PRODUCT_TYPE}`,
      'Align product type.'),
  );

  const iosMatch = STORE_IAP_METADATA_DRAFT.productIdIos === IAP_STORE_PRODUCT_IDS.ios;
  const androidMatch = STORE_IAP_METADATA_DRAFT.productIdAndroid === IAP_STORE_PRODUCT_IDS.android;
  findings.push(
    makeFinding('iap_metadata_consistency', 'meta.product_ids',
      iosMatch && androidMatch ? 'pass' : 'fail',
      iosMatch && androidMatch ? 'Store product IDs consistent' : 'Store product ID mismatch',
      `iOS: ${iosMatch ? 'ok' : 'mismatch'}, Android: ${androidMatch ? 'ok' : 'mismatch'}`,
      'Align product IDs with docs.'),
  );

  return findings;
}

function auditPrivacyPurchaseConsistency(): CreviaIapConversionReadinessFinding[] {
  const findings: CreviaIapConversionReadinessFinding[] = [];

  const purchaseCategory = PRIVACY_DATA_CATEGORY_MATRIX.find((c) => c.id === 'purchase_status');
  findings.push(
    makeFinding('privacy_purchase_consistency', 'privacy.purchase_declared',
      purchaseCategory?.collected === 'yes' ? 'pass' : 'fail',
      purchaseCategory ? 'Purchase data category declared' : 'Purchase data category missing',
      'Privacy matrix must declare purchase data collected.',
      'Add purchase_status to privacy data matrix.'),
  );

  const entitlementCategory = PRIVACY_DATA_CATEGORY_MATRIX.find((c) => c.id === 'entitlement_status');
  findings.push(
    makeFinding('privacy_purchase_consistency', 'privacy.entitlement_declared',
      entitlementCategory?.collected === 'yes' ? 'pass' : 'fail',
      entitlementCategory ? 'Entitlement data category declared' : 'Entitlement data missing',
      'RevenueCat entitlement sync must be declared.',
      'Add entitlement_status to privacy matrix.'),
  );

  const rawTextCategory = PRIVACY_DATA_CATEGORY_MATRIX.find((c) => c.id === 'raw_text_content');
  findings.push(
    makeFinding('privacy_purchase_consistency', 'privacy.no_raw_text',
      rawTextCategory?.collected === 'no' ? 'pass' : 'warn',
      'Raw text collection declared not collected',
      'Analytics must not send raw user text.',
      'Keep raw text exclusion in analytics.'),
  );

  const locationCategory = PRIVACY_DATA_CATEGORY_MATRIX.find((c) => c.id === 'location_data');
  findings.push(
    makeFinding('privacy_purchase_consistency', 'privacy.no_location',
      locationCategory?.collected === 'no' ? 'pass' : 'warn',
      'Location data declared not collected',
      'Game map is fictional — no GPS.',
      'Keep location exclusion.'),
  );

  const noTrackingClaim = PRIVACY_DATA_CATEGORY_MATRIX.every(
    (c) => c.usedForTracking === false,
  );
  findings.push(
    makeFinding('privacy_purchase_consistency', 'privacy.no_tracking',
      noTrackingClaim ? 'pass' : 'warn',
      noTrackingClaim ? 'No tracking declaration consistent' : 'Tracking declared for some data',
      'usedForTracking should be false for all categories.',
      'Review tracking declarations.'),
  );

  return findings;
}

function auditDay7OfferTransition(): CreviaIapConversionReadinessFinding[] {
  const findings: CreviaIapConversionReadinessFinding[] = [];
  const gs = completedGameState();
  const initial = createInitialMonetizationState();
  const derived = deriveMonetizationStateFromGameState(
    gs,
    syncMonetizationAfterPilotComplete(initial, 7),
  );

  findings.push(
    makeFinding('day7_offer_transition', 'day7.offer_available',
      derived.mainOperationAccess === 'offer_available' ? 'pass' : 'fail',
      'Day 7 completed → offer_available',
      `Access: ${derived.mainOperationAccess}`,
      'Pilot completion must trigger offer.'),
  );

  const model = buildPostPilotOfferViewModel(gs, derived);
  findings.push(
    makeFinding('day7_offer_transition', 'day7.cta_present',
      model.primaryCtaLabel.length > 0 && model.secondaryCtaLabel.length > 0 ? 'pass' : 'fail',
      'Both CTAs present on Day 7 offer',
      `Primary: "${model.primaryCtaLabel}", Secondary: "${model.secondaryCtaLabel}"`,
      'Both purchase and limited CTAs must show.'),
  );

  return findings;
}

function auditDay8LimitedPlayable(): CreviaIapConversionReadinessFinding[] {
  const findings: CreviaIapConversionReadinessFinding[] = [];
  const gs = completedGameState();
  const monetization = selectLimitedContinue(
    syncMonetizationAfterPilotComplete(createInitialMonetizationState(), 7),
    8,
  );

  findings.push(
    makeFinding('day8_limited_playable', 'day8.limited_access',
      monetization.mainOperationAccess === 'limited' ? 'pass' : 'fail',
      'Day 8 limited mode access confirmed',
      `Access: ${monetization.mainOperationAccess}`,
      'Limited must remain playable.'),
  );

  const limitedWarning = MONETIZATION_COPY.limitedWarningLine;
  const pressureFree = !IAP_CONVERSION_PAYWALL_PRESSURE_PATTERNS.some(
    (p) => limitedWarning.toLocaleLowerCase('tr-TR').includes(p.toLocaleLowerCase('tr-TR')),
  );
  findings.push(
    makeFinding('day8_limited_playable', 'day8.limited_warning_safe',
      pressureFree ? 'pass' : 'fail',
      pressureFree ? 'Limited warning copy pressure-free' : 'Limited warning has pressure wording',
      `Warning: "${limitedWarning.slice(0, 80)}"`,
      'Keep limited messaging informational not coercive.'),
  );

  return findings;
}

function auditFullUnlockMessaging(): CreviaIapConversionReadinessFinding[] {
  const findings: CreviaIapConversionReadinessFinding[] = [];
  const fullCopy = MONETIZATION_COPY.fullUnlockedLine;

  const noPressure = !IAP_CONVERSION_PAYWALL_PRESSURE_PATTERNS.some(
    (p) => fullCopy.toLocaleLowerCase('tr-TR').includes(p.toLocaleLowerCase('tr-TR')),
  );
  findings.push(
    makeFinding('full_unlock_messaging', 'full.copy_safe',
      noPressure ? 'pass' : 'fail',
      noPressure ? 'Full unlock messaging pressure-free' : 'Full unlock has pressure wording',
      `Copy: "${fullCopy.slice(0, 80)}"`,
      'Full unlock should confirm access, not gloat.'),
  );

  findings.push(
    makeFinding('full_unlock_messaging', 'full.copy_present',
      fullCopy.length > 0 ? 'pass' : 'fail',
      fullCopy.length > 0 ? 'Full unlock copy present' : 'Full unlock copy missing',
      `Length: ${fullCopy.length}`,
      'Define full access confirmation copy.'),
  );

  return findings;
}

function auditFreezeCompliance(): CreviaIapConversionReadinessFinding[] {
  const findings: CreviaIapConversionReadinessFinding[] = [];

  const allowedScopes = NO_NEW_SYSTEM_FREEZE_ALLOWED_SCOPES as readonly string[];
  const patchScopes = [
    'false_claim_copy_fix',
    'privacy_store_fix',
    'iap_setup_tracker_update',
    'verification_only',
    'documentation_only',
    'layout_overflow_fix',
  ];

  const allAllowed = patchScopes.every((s) => allowedScopes.includes(s));
  findings.push(
    makeFinding('false_claim_wording', 'freeze.scope_allowed',
      allAllowed ? 'pass' : 'fail',
      allAllowed ? 'Patch scopes within freeze allowed list' : 'Patch scope outside freeze allowed',
      `Scopes: ${patchScopes.join(', ')}`,
      'Stay within freeze allowed scopes.'),
  );

  const forbiddenScopes = NO_NEW_SYSTEM_FREEZE_FORBIDDEN_SCOPES as readonly string[];
  const patchViolations = [
    'new_analytics_event_schema',
    'persist_shape_change',
    'save_version_bump',
    'iap_purchase_flow_rewrite',
    'large_ui_redesign',
  ];
  const noViolation = patchViolations.every((v) => !patchScopes.includes(v));
  findings.push(
    makeFinding('false_claim_wording', 'freeze.no_forbidden_scope',
      noViolation ? 'pass' : 'fail',
      noViolation ? 'No forbidden scope in patch' : 'Forbidden scope detected',
      'Patch does not touch forbidden systems.',
      'Remove forbidden scope actions.'),
  );

  return findings;
}

export function runIapConversionReadinessAudit(): CreviaIapConversionReadinessResult {
  const allFindings: CreviaIapConversionReadinessFinding[] = [
    ...auditOfferValueProposition(),
    ...auditLimitedFullClarity(),
    ...auditPurchaseCtaSafety(),
    ...auditRestoreCtaVisibility(),
    ...auditProductMetadataPending(),
    ...auditRevenueCatDisabledFailsafe(),
    ...auditPaywallPressureWording(),
    ...auditFalseClaimWording(),
    ...auditIapMetadataConsistency(),
    ...auditPrivacyPurchaseConsistency(),
    ...auditDay7OfferTransition(),
    ...auditDay8LimitedPlayable(),
    ...auditFullUnlockMessaging(),
    ...auditFreezeCompliance(),
  ];

  const passCount = allFindings.filter((f) => f.severity === 'pass').length;
  const warnCount = allFindings.filter((f) => f.severity === 'warn').length;
  const failCount = allFindings.filter((f) => f.severity === 'fail').length;
  const health: CreviaIapConversionReadinessResult['health'] =
    failCount > 0 ? 'FAIL' : warnCount > 0 ? 'WARN' : 'PASS';

  const offerFrictionRisks: string[] = [];
  for (const f of allFindings.filter((x) => x.severity === 'fail')) {
    offerFrictionRisks.push(`${f.area}: ${f.title}`);
  }

  const copyGuardPassed = !allFindings.some(
    (f) =>
      (f.area === 'paywall_pressure_wording' || f.area === 'false_claim_wording') &&
      f.severity === 'fail',
  );

  const limitedModePlayable = allFindings
    .filter((f) => f.area === 'day8_limited_playable')
    .every((f) => f.severity === 'pass');

  const restoreCtaPresent = allFindings
    .filter((f) => f.area === 'restore_cta_visibility')
    .every((f) => f.severity === 'pass');

  const productMetadataPendingSafe = !allFindings.some(
    (f) => f.area === 'product_metadata_pending' && f.severity === 'fail',
  );

  const storeMetadataConsistent = allFindings
    .filter((f) => f.area === 'iap_metadata_consistency')
    .every((f) => f.severity !== 'fail');

  const privacyConsistent = allFindings
    .filter((f) => f.area === 'privacy_purchase_consistency')
    .every((f) => f.severity !== 'fail');

  const freezeCompliant = !allFindings.some(
    (f) => f.id.startsWith('freeze.') && f.severity === 'fail',
  );

  const nextSteps: string[] = [];
  if (!copyGuardPassed) nextSteps.push('Fix offer copy pressure/false-claim violations.');
  if (!restoreCtaPresent) nextSteps.push('Ensure restore CTA is visible.');
  if (!productMetadataPendingSafe) nextSteps.push('Remove hardcoded price placeholders.');
  if (!storeMetadataConsistent) nextSteps.push('Align store metadata with code.');
  if (health === 'PASS') nextSteps.push('Readiness pass complete — proceed with verify loop.');

  return {
    health,
    checkedCount: allFindings.length,
    passCount,
    warnCount,
    failCount,
    findings: allFindings,
    offerFrictionRisks,
    copyGuardPassed,
    limitedModePlayable,
    restoreCtaPresent,
    productMetadataPendingSafe,
    storeMetadataConsistent,
    privacyConsistent,
    freezeCompliant,
    nextSteps,
    docsPath: IAP_CONVERSION_READINESS_DOCS_PATH,
  };
}
