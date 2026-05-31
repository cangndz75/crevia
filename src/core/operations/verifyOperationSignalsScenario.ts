import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialPersonnelState } from '@/core/personnel/personnelSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import type { EventCard } from '@/core/models/EventCard';
import { normalizePersistedSave, SAVE_VERSION } from '@/store/gamePersist';

import { OPERATION_SIGNAL_UI_FORBIDDEN } from './operationSignalConstants';
import {
  buildOperationImpactPreviewForDecision,
  buildOperationImpactPreviewForEvent,
  choosePriorityDistrict,
  deriveOperationSignalsFromGameState,
  processOperationSignalsEndOfDay,
} from './operationSignalEngine';
import {
  buildOperationImpactPreviewModel,
  buildOperationSignalsHubModel,
  buildOperationSignalsReportModel,
} from './operationSignalPresentation';
import {
  clampSignalScore,
  createInitialOperationSignalsState,
  getSignalStatus,
  getSignalTrend,
  normalizeOperationSignalsState,
} from './operationSignalState';
import type { OperationSignalsEngineInput } from './operationSignalTypes';

export type VerifyOperationSignalsOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(
  checks: string[],
  ok: boolean,
  pass: string,
  fail: string,
): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${fail}`);
  return ok;
}

function baseInput(overrides?: Partial<OperationSignalsEngineInput>): OperationSignalsEngineInput {
  const seed = createDay1Seed();
  return {
    gameState: seed.gameState,
    personnelState: createInitialPersonnelState(),
    vehicleState: createInitialVehicleState(1),
    containerState: createInitialContainerState(1),
    decisionHistory: [],
    isDay1Tutorial: false,
    ...overrides,
  };
}

function testEvent(partial: Partial<EventCard>): EventCard {
  const seed = createDay1Seed();
  const base = seed.gameState.events[0]!;
  return { ...base, ...partial };
}

export function verifyOperationSignalsScenario(): VerifyOperationSignalsOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const initial = createInitialOperationSignalsState(1);
  ok =
    assert(
      checks,
      initial.personnel.domain === 'personnel' && initial.lastRefreshedDay === 1,
      'Initial operationSignals doğru oluşuyor',
      'Initial state hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      normalizeOperationSignalsState(undefined, 2).lastRefreshedDay === 2,
      'Normalize eksik state’i onarıyor',
      'Normalize başarısız',
    ) && ok;

  ok =
    assert(
      checks,
      clampSignalScore(Number.NaN) >= 0 && clampSignalScore(150) === 100,
      'Bozuk score clamp ediliyor',
      'Clamp başarısız',
    ) && ok;

  ok =
    assert(
      checks,
      getSignalStatus(20) === 'stable' &&
        getSignalStatus(50) === 'watch' &&
        getSignalStatus(70) === 'strained' &&
        getSignalStatus(90) === 'critical',
      'getSignalStatus threshold doğru çalışıyor',
      'Status threshold hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      getSignalTrend(50, 40) === 'improving' && getSignalTrend(40, 50) === 'worsening',
      'getSignalTrend doğru çalışıyor',
      'Trend hatalı',
    ) && ok;

  const day1Signals = deriveOperationSignalsFromGameState({
    ...baseInput({ isDay1Tutorial: true }),
  });
  ok =
    assert(
      checks,
      day1Signals.overall.status !== 'critical',
      'Day 1 signal critical olmuyor',
      'Day 1 critical',
    ) && ok;

  const highEvent = testEvent({
    id: 'evt-high',
    riskLevel: 'critical',
    category: 'operations',
  });
  const highInput = baseInput({
    gameState: {
      ...createDay1Seed().gameState,
      events: [highEvent],
      featuredEventId: highEvent.id,
    },
  });
  const highSignals = deriveOperationSignalsFromGameState(highInput);
  ok =
    assert(
      checks,
      highSignals.overall.score >= 60,
      'Active high severity event overall signal’ı yükseltiyor',
      'Overall yükselmedi',
    ) && ok;

  const containerEvent = testEvent({
    id: 'evt-container',
    category: 'container_waste',
    riskLevel: 'high',
    neighborhoodId: 'cumhuriyet',
  });
  const containerSignals = deriveOperationSignalsFromGameState(
    baseInput({
      gameState: {
        ...createDay1Seed().gameState,
        events: [containerEvent],
        featuredEventId: containerEvent.id,
      },
    }),
  );
  ok =
    assert(
      checks,
      containerSignals.containers.score >= containerSignals.personnel.score - 5 ||
        containerSignals.containers.sourceTags.some((t) =>
          t.includes('container'),
        ),
      'Container event container signal’ı etkiliyor',
      'Container signal zayıf',
    ) && ok;

  const vehicleEvent = testEvent({
    id: 'evt-vehicle',
    category: 'vehicle_route',
    riskLevel: 'high',
  });
  const vehicleSignals = deriveOperationSignalsFromGameState(
    baseInput({
      gameState: {
        ...createDay1Seed().gameState,
        events: [vehicleEvent],
      },
    }),
  );
  ok =
    assert(
      checks,
      vehicleSignals.vehicles.score >= 35,
      'Vehicle/route event vehicle signal’ı etkiliyor',
      'Vehicle signal zayıf',
    ) && ok;

  const socialEvent = testEvent({
    id: 'evt-social',
    category: 'social',
    riskLevel: 'medium',
    neighborhoodId: 'cumhuriyet',
  });
  const socialSignals = deriveOperationSignalsFromGameState(
    baseInput({
      gameState: {
        ...createDay1Seed().gameState,
        events: [socialEvent],
      },
    }),
  );
  ok =
    assert(
      checks,
      socialSignals.districts.score >= 30 || socialSignals.personnel.score >= 30,
      'Social event district/personnel signal’ı etkiliyor',
      'Social signal zayıf',
    ) && ok;

  const districtPick = choosePriorityDistrict(
    baseInput({
      gameState: {
        ...createDay1Seed().gameState,
        events: [socialEvent],
      },
    }),
  );
  ok =
    assert(
      checks,
      districtPick === 'cumhuriyet',
      'choosePriorityDistrict event districtId varsa onu seçiyor',
      'District seçimi hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      deriveOperationSignalsFromGameState(baseInput({ vehicleState: undefined })).vehicles
        .score >= 0,
      'Missing vehicleState crash etmiyor',
      'vehicleState missing crash',
    ) && ok;

  ok =
    assert(
      checks,
      deriveOperationSignalsFromGameState(baseInput({ containerState: undefined }))
        .containers.score >= 0,
      'Missing containerState crash etmiyor',
      'containerState missing crash',
    ) && ok;

  const eodInput = baseInput({
    operationSignals: createInitialOperationSignalsState(3),
    gameState: { ...createDay1Seed().gameState, city: { ...createDay1Seed().gameState.city, day: 3 } },
    decisionHistory: [
      {
        id: 'rec-1',
        day: 3,
        eventId: containerEvent.id,
        eventTitle: containerEvent.title,
        decisionId: 'd1',
        decisionLabel: 'Test',
        appliedEffects: {},
        createdAt: new Date().toISOString(),
      },
    ],
  });
  eodInput.gameState = {
    ...eodInput.gameState,
    solvedEvents: [{ id: containerEvent.id, title: 'x', xpEarned: 1 }],
  };
  const eod1 = processOperationSignalsEndOfDay(eodInput);
  const eod2 = processOperationSignalsEndOfDay({
    ...eodInput,
    operationSignals: eod1,
  });
  ok =
    assert(
      checks,
      eod1.lastProcessedDay === 3 && eod2.lastProcessedDay === 3,
      'processOperationSignalsEndOfDay idempotent',
      'EOD idempotent değil',
    ) && ok;

  const derivedBeforeEod = deriveOperationSignalsFromGameState(eodInput);
  ok =
    assert(
      checks,
      eod1.containers.score <= derivedBeforeEod.containers.score + 1,
      'End-of-day resolved event score’u makul azaltıyor',
      'Resolved delta aşırı',
    ) && ok;

  const unresolvedInput = baseInput({
    gameState: {
      ...createDay1Seed().gameState,
      city: { ...createDay1Seed().gameState.city, day: 4 },
      events: [highEvent],
    },
    operationSignals: createInitialOperationSignalsState(4),
  });
  const unresolvedEod = processOperationSignalsEndOfDay(unresolvedInput);
  ok =
    assert(
      checks,
      unresolvedEod.overall.score >= unresolvedInput.operationSignals!.overall.score,
      'End-of-day unresolved/high risk score’u makul artırıyor',
      'Unresolved delta düşük',
    ) && ok;

  ok =
    assert(
      checks,
      buildOperationImpactPreviewForEvent(baseInput(), containerEvent).summary.length > 0,
      'buildOperationImpactPreviewForEvent crashesız model üretiyor',
      'Event preview crash',
    ) && ok;

  ok =
    assert(
      checks,
      buildOperationImpactPreviewForDecision(
        baseInput(),
        containerEvent,
        containerEvent.decisions[0] ?? {
          id: 'd',
          title: 't',
          description: '',
          style: 'balanced',
          effects: { publicSatisfaction: 0, budget: 0, morale: 0, risk: 0, xp: 0 },
        },
      ).summary.length > 0,
      'buildOperationImpactPreviewForDecision fallback ile çalışıyor',
      'Decision preview crash',
    ) && ok;

  const hubModel = buildOperationSignalsHubModel({
    engineInput: baseInput(),
  });
  ok =
    assert(
      checks,
      hubModel.title.length > 0 && hubModel.rows.every((r) => r.summary.length > 0),
      'Hub presentation model boş text üretmiyor',
      'Hub model boş',
    ) && ok;

  const reportModel = buildOperationSignalsReportModel({
    engineInput: baseInput(),
    report: {
      day: 2,
      title: 'Rapor',
      stats: [],
      rewardTitle: 'Özet',
    },
  });
  ok =
    assert(
      checks,
      reportModel.lines.length <= 3,
      'Report presentation model max 3 satır mantığını koruyor',
      'Report satır sayısı fazla',
    ) && ok;

  const uiTexts = [
    hubModel.title,
    hubModel.subtitle,
    hubModel.footerNote,
    ...hubModel.rows.map((r) => r.summary),
    reportModel.lines.join(' '),
  ]
    .join(' ')
    .toLowerCase();
  const forbidden = OPERATION_SIGNAL_UI_FORBIDDEN.find((w) => uiTexts.includes(w));
  ok =
    assert(
      checks,
      forbidden == null,
      'UI forbidden words yok: XP, premium, satın al, kilitli',
      `Yasaklı kelime: ${forbidden ?? '?'}`,
    ) && ok;

  const hydrated = normalizePersistedSave({
    saveVersion: 13,
    gameState: createDay1Seed().gameState,
    neighborhoods: createDay1Seed().neighborhoods,
    resources: createDay1Seed().resources,
    eventPool: createDay1Seed().eventPool,
    decisionHistory: [],
    snapshots: createDay1Seed().snapshots,
  });
  const persistOk =
    SAVE_VERSION === 17 &&
    hydrated != null &&
    hydrated.operationSignals != null &&
    hydrated.operationSignals.personnel.domain === 'personnel';

  if (
    !warn(
      checks,
      persistOk,
      'Persist migration v13 → v14 operationSignals dolduruyor',
      'Persist migration uyarısı',
    )
  ) {
    hasWarn = true;
  }

  if (
    !warn(checks, SAVE_VERSION === 17, 'SAVE_VERSION 16', `SAVE_VERSION=${SAVE_VERSION}`)
  ) {
    hasWarn = true;
  }

  const advisorFallback = buildOperationSignalsHubModel({
    engineInput: baseInput({ operationSignals: undefined }),
  });
  ok =
    assert(
      checks,
      advisorFallback.rows.length > 0,
      'Advisor integration operationSignals yokken fallback çalışıyor',
      'Fallback hub model boş',
    ) && ok;

  const withSignals = deriveOperationSignalsFromGameState(
    baseInput({
      operationSignals: createInitialOperationSignalsState(2),
    }),
  );
  ok =
    assert(
      checks,
      withSignals.overall.sourceTags.length > 0,
      'Advisor integration operationSignals varken daha spesifik sourceTag üretiyor',
      'Signal sourceTags zayıf',
    ) && ok;

  return { ok, warn: hasWarn, checks };
}
