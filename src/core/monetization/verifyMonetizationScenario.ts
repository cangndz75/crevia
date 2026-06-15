import { createDay1Seed } from '@/core/content/day1Seed';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import { normalizePersistedSave, SAVE_VERSION } from '@/store/gamePersist';

import { isPostPilotDevToolsEnabled } from '@/features/devtools/postPilotDevToolsGuard';

import { MONETIZATION_COPY, MONETIZATION_UI_FORBIDDEN_WORDS } from './monetizationConstants';
import {
  applyFullAccessToGameState,
  applyLimitedContinueToGameState,
  buildDevJumpPilotCompletedGameState,
  deriveMonetizationStateFromGameState,
  getPostPilotAccessMode,
  isFullMainOperationAccess,
  shouldRouteToPostPilotOffer,
} from './monetizationEngine';
import {
  buildPostPilotOfferViewModel,
  buildReportPilotCompletionCtaModel,
  collectMonetizationPresentationStrings,
} from './monetizationPresentation';
import {
  createInitialMonetizationState,
  getMainOperationAccess,
  isMainOperationPackOwned,
  markMainOperationOfferSeen,
  mockPurchaseMainOperationPack,
  normalizeMonetizationState,
  restoreMainOperationPlaceholder,
  selectLimitedContinue,
  syncMonetizationAfterPilotComplete,
  syncMonetizationForActivePilot,
} from './monetizationState';
import type { GameState } from '@/core/models/GameState';

export type VerifyMonetizationOutcome = {
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

function completedGameState(): GameState {
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

export function verifyMonetizationScenario(): VerifyMonetizationOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const initial = createInitialMonetizationState();
  ok =
    assert(
      checks,
      initial.mainOperationAccess === 'none' &&
        initial.offerStatus === 'not_available',
      'Initial monetization state doğru',
      'initial state wrong',
    ) && ok;

  ok =
    assert(
      checks,
      normalizeMonetizationState(undefined).mainOperationAccess === 'none',
      'Normalize eksik monetization state onarıyor',
      'normalize failed',
    ) && ok;

  ok =
    assert(
      checks,
      normalizeMonetizationState({
        ownedPacks: [{ productId: 'bad', unlockedAtDay: 1, source: 'mock_purchase' }],
        assignments: 'x',
      }).ownedPacks.length === 0,
      'Bozuk ownedPacks temizleniyor',
      'bad packs not cleaned',
    ) && ok;

  const activeGs = createDay1Seed().gameState;
  const activeDerived = deriveMonetizationStateFromGameState(
    activeGs,
    initial,
  );
  ok =
    assert(
      checks,
      activeDerived.offerStatus === 'not_available',
      'Pilot active iken offer not_available',
      `status=${activeDerived.offerStatus}`,
    ) && ok;

  const completedGs = completedGameState();
  const offerDerived = deriveMonetizationStateFromGameState(
    completedGs,
    syncMonetizationAfterPilotComplete(initial, 7),
  );
  ok =
    assert(
      checks,
      offerDerived.mainOperationAccess === 'offer_available',
      'Pilot completed iken offer_available üretilebiliyor',
      `access=${offerDerived.mainOperationAccess}`,
    ) && ok;

  const seenOnce = markMainOperationOfferSeen(offerDerived, 7);
  const seenTwice = markMainOperationOfferSeen(seenOnce, 7);
  ok =
    assert(
      checks,
      seenOnce.hasSeenMainOperationOffer && seenTwice === seenOnce,
      'markMainOperationOfferSeen idempotent',
      'seen not idempotent',
    ) && ok;

  const limited = selectLimitedContinue(offerDerived, 8);
  ok =
    assert(
      checks,
      limited.mainOperationAccess === 'limited' &&
        limited.ownedPacks.length === 0,
      'selectLimitedContinue limited access yapıyor',
      'limited failed',
    ) && ok;

  ok =
    assert(
      checks,
      !isMainOperationPackOwned(limited),
      'limited continue ownedPacks eklemiyor',
      'limited added pack',
    ) && ok;

  const purchased = mockPurchaseMainOperationPack(limited, 8);
  ok =
    assert(
      checks,
      purchased.mainOperationAccess === 'full' &&
        isMainOperationPackOwned(purchased),
      'mockPurchase mainOperationAccess full yapıyor',
      'mock purchase failed',
    ) && ok;

  ok =
    assert(
      checks,
      purchased.ownedPacks[0]?.productId === 'main_operation_season_1',
      'mockPurchase ownedPacks main_operation_season_1 ekliyor',
      'pack id wrong',
    ) && ok;

  const purchasedTwice = mockPurchaseMainOperationPack(purchased, 8);
  ok =
    assert(
      checks,
      purchasedTwice.ownedPacks.length === 1,
      'mockPurchase idempotent, duplicate pack yok',
      `packs=${purchasedTwice.ownedPacks.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      selectLimitedContinue(purchased, 9).mainOperationAccess === 'full',
      'full access limited’e geri düşmüyor',
      'full reverted to limited',
    ) && ok;

  const restored = restoreMainOperationPlaceholder(initial, 3);
  ok =
    assert(
      checks,
      restored.restoreCheckedAtDay === 3,
      'restore placeholder restoreCheckedAtDay set ediyor',
      'restore day missing',
    ) && ok;

  ok =
    assert(
      checks,
      isMainOperationPackOwned(purchased),
      'isMainOperationPackOwned doğru çalışıyor',
      'owned check failed',
    ) && ok;

  ok =
    assert(
      checks,
      !shouldRouteToPostPilotOffer(activeGs, activeDerived),
      'shouldRouteToPostPilotOffer Day 1-6 false',
      'route true on day1',
    ) && ok;

  ok =
    assert(
      checks,
      shouldRouteToPostPilotOffer(completedGs, offerDerived),
      'shouldRouteToPostPilotOffer Day 7 completed true',
      'route false on day7',
    ) && ok;

  const reportCta = buildReportPilotCompletionCtaModel({
    gameState: completedGs,
    monetization: offerDerived,
  });
  ok =
    assert(
      checks,
      reportCta.route.includes('post-pilot-offer'),
      'Report CTA offer route model üretiyor',
      `route=${reportCta.route}`,
    ) && ok;

  const previewCta = buildReportPilotCompletionCtaModel({
    gameState: completedGs,
    monetization: purchased,
  });
  ok =
    assert(
      checks,
      previewCta.title.includes('Devam'),
      'MainOperationPreview full state CTA üretiyor',
      `cta=${previewCta.title}`,
    ) && ok;

  ok =
    assert(
      checks,
      getPostPilotAccessMode(completedGs, limited) === 'limited',
      'ProgressionBridge limited state crash olmadan okunuyor',
      'limited mode failed',
    ) && ok;

  const offerModel = buildPostPilotOfferViewModel(completedGs, offerDerived);
  ok =
    assert(
      checks,
      offerModel.title.length > 0 && offerModel.featureRows.length >= 5,
      'buildPostPilotOfferViewModel boş text üretmiyor',
      'offer model empty',
    ) && ok;

  ok =
    assert(
      checks,
      offerModel.featureRows.length >= 5,
      'Feature list en az 5 feature içeriyor',
      `features=${offerModel.featureRows.length}`,
    ) && ok;

  const copyBlob = collectMonetizationPresentationStrings(offerModel).toLowerCase();
  const forbidden = MONETIZATION_UI_FORBIDDEN_WORDS.find((w) =>
    copyBlob.includes(w),
  );
  ok =
    assert(
      checks,
      forbidden === undefined,
      'Forbidden words yok: XP, premium, satın al, kilitli',
      `forbidden=${forbidden}`,
    ) && ok;

  ok =
    assert(
      checks,
      offerModel.secondaryCtaLabel.includes('Sınırlı'),
      'Limited state copy Sınırlı Gündem içeriyor',
      'limited label missing',
    ) && ok;

  const fullModel = buildPostPilotOfferViewModel(completedGs, purchased);
  ok =
    assert(
      checks,
      fullModel.isFullAccess && fullModel.accessLabel.includes('aktif'),
      'Full state copy Ana Operasyon aktif içeriyor',
      'full copy missing',
    ) && ok;

  const jumped = buildDevJumpPilotCompletedGameState(createDay1Seed().gameState);
  ok =
    assert(
      checks,
      jumped.pilot.status === 'completed' && jumped.city.day >= 8,
      'Dev jump action pilot completed ve day >= 8 yapıyor',
      `status=${jumped.pilot.status} day=${jumped.city.day}`,
    ) && ok;

  const jumped2 = buildDevJumpPilotCompletedGameState(jumped);
  ok =
    assert(
      checks,
      jumped2.pilot.status === 'completed',
      'Dev jump idempotent',
      'dev jump not idempotent',
    ) && ok;

  ok =
    assert(
      checks,
      typeof isPostPilotDevToolsEnabled === 'function' &&
        isPostPilotDevToolsEnabled() === false,
      'Dev tools production guard var (Node’da kapalı)',
      'dev tools guard failed',
    ) && ok;

  ok =
    assert(
      checks,
      MONETIZATION_COPY.reportCtaOffer.length > 0,
      'Normal Day 7 report flow kaldırılmamış',
      'report cta missing',
    ) && ok;

  const limitedGs = applyLimitedContinueToGameState(completedGs);
  ok =
    assert(
      checks,
      limitedGs.pilot.postPilotOperation?.phase === 'main_operation_light',
      'continueWithLimitedAgenda postPilot light phase uyumlu',
      `phase=${limitedGs.pilot.postPilotOperation?.phase}`,
    ) && ok;

  const withDistrict: GameState = {
    ...completedGs,
    pilot: {
      ...completedGs.pilot,
      selectedDistrictId: completedGs.pilot.selectedDistrictId ?? 'cumhuriyet',
    },
  };
  const fullGs = applyFullAccessToGameState(withDistrict);
  ok =
    assert(
      checks,
      fullGs.pilot.run?.unlockState?.fullMainOperationUnlocked === true,
      'mockPurchase fullMainOperationUnlocked true yapıyor',
      'unlock false',
    ) && ok;

  ok =
    assert(
      checks,
      isFullMainOperationAccess(fullGs, purchased),
      'access selector full true',
      'full access selector failed',
    ) && ok;

  const seed = createDay1Seed();
  const hydratedV17 = normalizePersistedSave({
    saveVersion: 17,
    gameState: seed.gameState,
    neighborhoods: seed.neighborhoods,
    resources: seed.resources,
    eventPool: seed.eventPool,
    decisionHistory: seed.decisionHistory,
    snapshots: seed.snapshots,
  });
  ok =
    assert(
      checks,
      hydratedV17 != null &&
        hydratedV17.saveVersion === SAVE_VERSION &&
        hydratedV17.monetization != null,
      'Persist migration v17 → v18 monetization dolduruyor',
      'v17 migration failed',
    ) && ok;

  ok =
    assert(
      checks,
      isCurrentSaveVersion(SAVE_VERSION),
      'Full loop SAVE_VERSION 22 ile çalışıyor',
      `SAVE_VERSION=${SAVE_VERSION}`,
    ) && ok;

  ok =
    assert(
      checks,
      syncMonetizationForActivePilot(initial).mainOperationAccess === 'none',
      'Post-pilot UX active pilot monetization safe',
      'active sync failed',
    ) && ok;

  if (
    !warn(
      checks,
      fullGs.pilot.postPilotOperation?.phase === 'main_operation_full',
      'Full main operation loop foundation (main_operation_full phase)',
      'full phase pending — light loop may continue with full copy',
    )
  ) {
    hasWarn = true;
  }

  return { ok, warn: hasWarn, checks };
}
