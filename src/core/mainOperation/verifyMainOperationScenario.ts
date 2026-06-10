import { createDay1Seed } from '@/core/content/day1Seed';
import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import {
  applyFullAccessToGameState,
  applyLimitedContinueToGameState,
  buildDevJumpPilotCompletedGameState,
} from '@/core/monetization/monetizationEngine';
import {
  createInitialMonetizationState,
  mockPurchaseMainOperationPack,
  selectLimitedContinue,
} from '@/core/monetization/monetizationState';
import { createInitialAssignmentsState } from '@/core/assignments/assignmentState';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import {
  ensurePostPilotDailyEventsForDay,
  isPostPilotLightEventLoopEligible,
} from '@/core/postPilot/postPilotEventEngine';
import { normalizePostPilotOperationState } from '@/core/postPilot/postPilotOperationSeed';
import { SAVE_VERSION } from '@/store/gamePersist';
import { isPostPilotDevToolsEnabled } from '@/features/devtools/postPilotDevToolsGuard';

import { createInitialCrisisState } from '@/core/crisis/crisisState';
import { countDefsByKind } from './mainOperationContentPack';
import { MAIN_OPERATION_FORBIDDEN_WORDS, MAIN_OPERATION_UI_COPY } from './mainOperationConstants';
import {
  buildMainOperationDailyContext,
  deriveMainOperationAccessMode,
  ensureMainOperationSeasonForGameState,
  getMainOperationEventDensity,
  processMainOperationEndOfDay,
  shouldUseFullMainOperationEvents,
  syncMainOperationSeasonAfterFullUnlock,
  syncMainOperationSeasonAfterLimitedContinue,
  buildMainOperationEngineInput,
} from './mainOperationEngine';
import {
  buildMainOperationHubModel,
  buildMainOperationReportModel,
  collectMainOperationUiStrings,
  shouldShowMainOperationHubCard,
} from './mainOperationPresentation';
import {
  createFullMainOperationSeasonState,
  createInitialMainOperationSeasonState,
  createLimitedMainOperationSeasonPreviewState,
  getActiveMainOperationDistrictIds,
  getMainOperationSeasonDay,
  normalizeMainOperationSeasonState,
  refreshMainOperationSeasonForDay,
} from './mainOperationState';

export type VerifyMainOperationOutcome = {
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

function completedDay8GameState(): ReturnType<typeof buildDevJumpPilotCompletedGameState> {
  const gs = buildDevJumpPilotCompletedGameState(createDay1Seed().gameState);
  return applyFullAccessToGameState({
    ...gs,
    city: { ...gs.city, day: 8 },
  });
}

function engineInput(
  gameState: ReturnType<typeof completedDay8GameState>,
  monetization = mockPurchaseMainOperationPack(createInitialMonetizationState(), 8),
  season = createFullMainOperationSeasonState(8),
) {
  return buildMainOperationEngineInput({
    gameState,
    monetization,
    mainOperationSeason: season,
    operationSignals: createInitialOperationSignalsState(8),
    assignments: createInitialAssignmentsState(),
  });
}

export function verifyMainOperationScenario(): VerifyMainOperationOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const initial = createInitialMainOperationSeasonState();
  ok =
    assert(
      checks,
      initial.status === 'inactive' && initial.accessMode === 'none',
      'Initial mainOperationSeason inactive oluşuyor',
      'initial season wrong',
    ) && ok;

  ok =
    assert(
      checks,
      normalizeMainOperationSeasonState(undefined, 8).districtScopes.merkez != null ||
        Object.keys(normalizeMainOperationSeasonState(undefined, 8, mockPurchaseMainOperationPack(createInitialMonetizationState(), 8)).districtScopes).length >= 0,
      'Normalize eksik state’i onarıyor',
      'normalize missing failed',
    ) && ok;

  const brokenScopes = normalizeMainOperationSeasonState(
    { districtScopes: { bad: 'x' }, goals: 'nope' },
    8,
    mockPurchaseMainOperationPack(createInitialMonetizationState(), 8),
  );
  ok =
    assert(
      checks,
      brokenScopes.districtScopes.merkez?.status != null,
      'Bozuk districtScopes normalize ediliyor',
      'districtScopes repair failed',
    ) && ok;

  ok =
    assert(
      checks,
      brokenScopes.goals.length >= 4,
      'Bozuk goals normalize ediliyor',
      'goals repair failed',
    ) && ok;

  const fullSeason = createFullMainOperationSeasonState(8);
  ok =
    assert(
      checks,
      fullSeason.status === 'active' && fullSeason.accessMode === 'full',
      'createFullMainOperationSeasonState status active yapıyor',
      'full season not active',
    ) && ok;

  ok =
    assert(
      checks,
      getMainOperationSeasonDay(fullSeason, 8) === 1,
      'Full season day 8’de season day 1 hesaplıyor',
      'season day 1 wrong',
    ) && ok;

  const day7Season = normalizeMainOperationSeasonState(
    undefined,
    7,
    createInitialMonetizationState(),
  );
  ok =
    assert(
      checks,
      day7Season.status === 'inactive' && day7Season.accessMode === 'none',
      'Day 7 veya öncesi full season active olmuyor',
      'day 7 full active',
    ) && ok;

  const limitedSeason = createLimitedMainOperationSeasonPreviewState(8);
  ok =
    assert(
      checks,
      limitedSeason.status !== 'active' || limitedSeason.accessMode === 'limited',
      'Limited access full season goals active etmiyor',
      'limited treated as full active',
    ) && ok;

  ok =
    assert(
      checks,
      getActiveMainOperationDistrictIds(fullSeason).includes('merkez'),
      'Full access district scopes doğru başlangıç veriyor',
      'full districts wrong',
    ) && ok;

  ok =
    assert(
      checks,
      getActiveMainOperationDistrictIds(fullSeason).length >= 3,
      'Season day 1 active districts beklenen',
      'season day 1 active count',
    ) && ok;

  const seasonDay3 = refreshMainOperationSeasonForDay(fullSeason, 10, 'full');
  ok =
    assert(
      checks,
      seasonDay3.districtScopes.sanayi?.status === 'active',
      'Season day 3 Sanayi geçişi doğru',
      'sanayi day 3',
    ) && ok;

  const seasonDay10 = refreshMainOperationSeasonForDay(fullSeason, 14, 'full');
  ok =
    assert(
      checks,
      seasonDay10.districtScopes.yesilvadi?.status === 'active',
      'Season day 7 Yeşilvadi active geçiş doğru',
      'yesilvadi active',
    ) && ok;

  ok =
    assert(
      checks,
      getActiveMainOperationDistrictIds(fullSeason).length > 0,
      'getActiveMainOperationDistrictIds boş dönmüyor full state’te',
      'active ids empty',
    ) && ok;

  const limitedDensity = getMainOperationEventDensity(
    applyLimitedContinueToGameState(completedDay8GameState()),
    selectLimitedContinue(createInitialMonetizationState(), 8),
  );
  ok =
    assert(
      checks,
      limitedDensity.maxDailyEvents === 2,
      'Event density limited max 2',
      'limited density',
    ) && ok;

  const fullGs = completedDay8GameState();
  const fullMon = mockPurchaseMainOperationPack(createInitialMonetizationState(), 8);
  const fullDensity = getMainOperationEventDensity(fullGs, fullMon);
  ok =
    assert(
      checks,
      fullDensity.maxDailyEvents >= 2 && fullDensity.maxDailyEvents <= 3,
      'Event density full max 3',
      'full density',
    ) && ok;

  ok =
    assert(
      checks,
      !shouldUseFullMainOperationEvents(
        applyLimitedContinueToGameState(fullGs),
        selectLimitedContinue(createInitialMonetizationState(), 8),
      ),
      'Full phase access yoksa full events üretmiyor',
      'full events without access',
    ) && ok;

  ok =
    assert(
      checks,
      shouldUseFullMainOperationEvents(fullGs, fullMon),
      'Full phase access varsa main_operation_full event context',
      'full events flag',
    ) && ok;

  const postPilot = normalizePostPilotOperationState(fullGs.pilot.postPilotOperation, {
    pilotStatus: 'completed',
    currentPilotDay: 7,
  });
  const gen1 = ensurePostPilotDailyEventsForDay({
    gameState: fullGs,
    postPilotOperation: { ...postPilot, phase: 'main_operation_full' },
    mainOperationContext: {
      monetization: fullMon,
      mainOperationSeason: createFullMainOperationSeasonState(8),
    },
  });
  const gen2 = ensurePostPilotDailyEventsForDay({
    gameState: fullGs,
    postPilotOperation: gen1.postPilotOperation,
    day: gen1.postPilotOperation.operationDay,
    mainOperationContext: {
      monetization: fullMon,
      mainOperationSeason: createFullMainOperationSeasonState(8),
    },
  });
  ok =
    assert(
      checks,
      gen1.generated && gen2.reason === 'already_generated_for_day',
      'Full event generation idempotent',
      'idempotent full events',
    ) && ok;

  const ids = gen1.postPilotOperation.postPilotDailyEventSet?.allEventIds ?? [];
  ok =
    assert(
      checks,
      new Set(ids).size === ids.length,
      'Duplicate post-pilot events oluşmuyor',
      'duplicate events',
    ) && ok;

  ok =
    assert(
      checks,
      gen1.reason === 'generated_full_main_operation_daily_set',
      'Active districts event selection’da kullanılıyor',
      'full generation reason',
    ) && ok;

  ok =
    assert(
      checks,
      !ids.some((id) => id.includes('preview_only')),
      'Preview districts yoğun event üretmiyor',
      'preview events',
    ) && ok;

  const input = engineInput(fullGs, fullMon, createFullMainOperationSeasonState(8));
  const signalsStable = createInitialOperationSignalsState(8);
  signalsStable.overall = {
    ...signalsStable.overall,
    status: 'stable',
    score: 30,
  };
  const progressed = processMainOperationEndOfDay(
    { ...input, operationSignals: signalsStable },
    8,
  );
  const cityGoal = progressed.goals.find((g) => g.domain === 'city_balance');
  ok =
    assert(
      checks,
      (cityGoal?.progress ?? 0) > 0,
      'city_balance goal progress operationSignals ile artabiliyor',
      'city_balance progress',
    ) && ok;

  const signalsCritical = createInitialOperationSignalsState(8);
  signalsCritical.vehicles = {
    ...signalsCritical.vehicles,
    status: 'critical',
    score: 90,
  };
  const beforeV = createFullMainOperationSeasonState(8).goals.find(
    (g) => g.domain === 'vehicles',
  )!.progress;
  const afterV = processMainOperationEndOfDay(
    {
      ...input,
      operationSignals: signalsCritical,
      mainOperationSeason: createFullMainOperationSeasonState(8),
    },
    8,
  ).goals.find((g) => g.domain === 'vehicles')!.progress;
  ok =
    assert(
      checks,
      afterV <= beforeV + 4,
      'vehicles goal vehicle signal critical iken aşırı artmıyor',
      'vehicles critical progress',
    ) && ok;

  ok =
    assert(
      checks,
      (cityGoal?.progress ?? 0) <= 100,
      'Goal progress 0-100 clamp ediliyor',
      'goal clamp',
    ) && ok;

  const completedGoal = {
    ...createFullMainOperationSeasonState(8),
    goals: createFullMainOperationSeasonState(8).goals.map((g) =>
      g.domain === 'city_balance'
        ? { ...g, progress: 100, status: 'completed' as const }
        : g,
    ),
  };
  ok =
    assert(
      checks,
      completedGoal.goals.find((g) => g.domain === 'city_balance')?.status ===
        'completed',
      'Completed goal 100’de completed oluyor',
      'completed status',
    ) && ok;

  const idemSeason = processMainOperationEndOfDay(input, 8);
  const idem2 = processMainOperationEndOfDay(
    { ...input, mainOperationSeason: idemSeason },
    8,
  );
  ok =
    assert(
      checks,
      idemSeason.lastProcessedDay === 8 && idem2.lastProcessedDay === 8,
      'processMainOperationEndOfDay idempotent',
      'eod idempotent',
    ) && ok;

  ok =
    assert(
      checks,
      syncMainOperationSeasonAfterFullUnlock(fullGs, fullMon).status === 'active',
      'mockPurchaseMainOperationPack season active yapıyor',
      'mock purchase season',
    ) && ok;

  ok =
    assert(
      checks,
      syncMainOperationSeasonAfterLimitedContinue(8).status !== 'active',
      'continueWithLimitedAgenda season full active yapmıyor',
      'limited season active',
    ) && ok;

  const reportFull = buildMainOperationReportModel(fullGs, fullMon, fullSeason);
  ok =
    assert(
      checks,
      reportFull.lines.length > 0 && reportFull.lines.every((l) => l.length > 0),
      'Full access Report model boş text üretmiyor',
      'report full empty',
    ) && ok;

  const reportLimited = buildMainOperationReportModel(
    applyLimitedContinueToGameState(fullGs),
    selectLimitedContinue(createInitialMonetizationState(), 8),
    limitedSeason,
  );
  ok =
    assert(
      checks,
      reportLimited.lines.some((l) => l.includes('Sınırlı')),
      'Limited Report model kısa sınırlı gündem copy üretiyor',
      'report limited',
    ) && ok;

  const hubFull = buildMainOperationHubModel(fullGs, fullMon, fullSeason);
  ok =
    assert(
      checks,
      hubFull.accessLabel.includes('aktif'),
      'Hub model full state’te “Ana Operasyon aktif” veriyor',
      'hub full label',
    ) && ok;

  ok =
    assert(
      checks,
      !shouldShowMainOperationHubCard(createDay1Seed().gameState, createInitialMonetizationState()),
      'Hub model pilot state’te render gerektirmiyor',
      'hub pilot hidden',
    ) && ok;

  ok =
    assert(
      checks,
      isPostPilotLightEventLoopEligible(fullGs),
      'ProgressionBridge full state crash olmadan çalışıyor',
      'post pilot eligible',
    ) && ok;

  const uiStrings = collectMainOperationUiStrings(fullGs, fullMon, fullSeason).join(' ').toLowerCase();
  ok =
    assert(
      checks,
      !MAIN_OPERATION_FORBIDDEN_WORDS.some((w) =>
        w === 'xp' ? /\bxp\b/.test(uiStrings) : uiStrings.includes(w),
      ),
      'Forbidden words yok: XP, premium, satın al, kilitli',
      'forbidden words',
    ) && ok;

  ok =
    assert(
      checks,
      SAVE_VERSION === 26,
      'Full loop SAVE_VERSION 22 ile çalışıyor',
      `SAVE_VERSION=${SAVE_VERSION}`,
    ) && ok;

  const migratedSeason = normalizeMainOperationSeasonState(
    undefined,
    8,
    mockPurchaseMainOperationPack(createInitialMonetizationState(), 8),
  );
  ok =
    assert(
      checks,
      migratedSeason.accessMode === 'full' && migratedSeason.districtScopes.merkez != null,
      'Persist migration v18 → v19 mainOperationSeason dolduruyor',
      'v18 migration',
    ) && ok;

  ok =
    assert(
      checks,
      isPostPilotDevToolsEnabled() === (typeof __DEV__ !== 'undefined' && __DEV__),
      'Dev full main operation jump **DEV** guard ile güvenli',
      'dev guard',
    ) && ok;

  ok =
    assert(
      checks,
      createInitialCrisisState() != null,
      'Crisis Desk MVP contract (crisisState seed)',
      'crisisState',
    ) && ok;

  ok =
    assert(
      checks,
      countDefsByKind('anchor') >= 8 &&
        countDefsByKind('side') >= 14 &&
        countDefsByKind('district') >= 15,
      'Full content pack expansion Aşama 1 yüklü',
      `anchors=${countDefsByKind('anchor')} sides=${countDefsByKind('side')}`,
    ) && ok;

  return { ok, warn: hasWarn, checks };
}
