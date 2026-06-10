import { createDay1Seed } from '@/core/content/day1Seed';
import type { DailyReport } from '@/core/models/DailyReport';
import type { EventCard } from '@/core/models/EventCard';
import { normalizePersistedSave, SAVE_VERSION } from '@/store/gamePersist';

import {
  buildOperationSignal,
  createInitialOperationSignalsState,
} from '@/core/operations/operationSignalState';

import {
  ADVISOR_COPY,
  ADVISOR_DAILY_USES_BY_LEVEL,
  ADVISOR_END_OF_DAY_EXPERIENCE,
  ADVISOR_LEVEL_THRESHOLDS,
  ADVISOR_MAX_INSIGHT_BODY_LENGTH,
  ADVISOR_MAX_PENDING_PREDICTIONS,
  ADVISOR_UI_FORBIDDEN_WORDS,
  DEFAULT_RELIABILITY_SCORE,
} from './advisorConstants';
import {
  attachAdvisorPredictionAfterInsight,
  evaluateAdvisorPredictionsAgainstSignals,
  getAdvisorConfidenceForState,
  shouldCreateMissedSignal,
} from './advisorPrediction';
import {
  buildAssignmentAdvisorInsights,
  buildDailyAdvisorInsights,
  buildEndDayAdvisorInsight,
  buildEventAdvisorInsights,
  buildAdvisorContextFromStore,
} from './advisorEngine';
import {
  buildAdvisorEndDayModel,
  buildAdvisorEventHintModel,
  buildAdvisorHubCardModel,
} from './advisorPresentation';
import {
  addAdvisorPrediction,
  applyAcknowledgeMissedSignalRewards,
  createInitialAdvisorState,
  getAdvisorLevelFromExperience,
  getAdvisorReliabilityBand,
  getAdvisorReliabilityLabel,
  grantAdvisorEndOfDayExperience,
  grantAdvisorExperience,
  normalizeAdvisorDomainLearning,
  normalizeAdvisorState,
  refreshAdvisorDailyUses,
  spendAdvisorUse,
  updateAdvisorReliability,
} from './advisorState';
import type { AdvisorPrediction, AdvisorState } from './advisorTypes';

export type VerifyAdvisorOutcome = {
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

function minimalEvent(): EventCard {
  return {
    id: 'evt-test',
    title: 'Test',
    category: 'social',
    riskLevel: 'high',
    district: 'Merkez',
    description: 'Test',
    contextTag: 'test',
    urgencyHours: 4,
    decisions: [],
    previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
  };
}

function minimalReport(day: number): DailyReport {
  return {
    day,
    title: 'Gün sonu',
    stats: [],
    rewardTitle: 'Özet',
    warnings: ['Bütçe baskısı devam ediyor'],
    highlights: ['İyi koordinasyon'],
  };
}

export function verifyAdvisorScenario(): VerifyAdvisorOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const day1 = createInitialAdvisorState(1);
  ok =
    assert(
      checks,
      day1.advisorId === 'ece_operations_assistant' &&
        day1.dailyUsesRemaining === ADVISOR_DAILY_USES_BY_LEVEL[1],
      'Initial advisor state doğru oluşuyor',
      'Initial advisor state hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      day1.reliabilityScore === DEFAULT_RELIABILITY_SCORE &&
        day1.reliabilityBand === 'early_observation',
      'Initial reliabilityScore 52 ile oluşuyor',
      'Initial reliability hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      getAdvisorReliabilityBand(54) === 'early_observation' &&
        getAdvisorReliabilityBand(55) === 'developing' &&
        getAdvisorReliabilityBand(70) === 'reliable' &&
        getAdvisorReliabilityBand(85) === 'expert',
      'reliabilityBand threshold doğru çalışıyor',
      'reliabilityBand threshold hatalı',
    ) && ok;

  const v14Normalized = normalizeAdvisorState(
    { experience: 40, dailyUsesRemaining: 1, lastRefreshedDay: 4 },
    4,
  );
  ok =
    assert(
      checks,
      v14Normalized.reliabilityScore === DEFAULT_RELIABILITY_SCORE &&
        v14Normalized.pendingPredictions.length === 0 &&
        v14Normalized.domainLearning.personnel === 0,
      'Normalize v14 advisorState yeni alanları tamamlıyor',
      'v14 normalize eksik',
    ) && ok;

  ok =
    assert(
      checks,
      normalizeAdvisorDomainLearning({ personnel: 999, vehicles: -5 }).personnel ===
        100 &&
        normalizeAdvisorDomainLearning({ personnel: 999, vehicles: -5 }).vehicles === 0,
      'domainLearning bozuk input’tan güvenli dönüyor',
      'domainLearning normalize hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      updateAdvisorReliability(day1, 200).reliabilityScore === 100 &&
        updateAdvisorReliability(day1, -200).reliabilityScore === 0,
      'reliabilityScore clamp 0-100',
      'reliabilityScore clamp hatalı',
    ) && ok;

  let predState = day1;
  for (let i = 0; i < 7; i += 1) {
    predState = addAdvisorPrediction(predState, {
      id: `pred-test-${i}`,
      day: 2,
      domain: 'vehicles',
      predictedStatus: 'stable',
      confidence: 'low',
      sourceSignalScore: 30,
    });
  }
  ok =
    assert(
      checks,
      predState.pendingPredictions.length <= ADVISOR_MAX_PENDING_PREDICTIONS,
      'pendingPredictions max 5 kayıt tutuyor',
      'pendingPredictions limit aşıldı',
    ) && ok;

  const dupPred = addAdvisorPrediction(predState, {
    id: 'pred-test-0',
    day: 2,
    domain: 'vehicles',
    predictedStatus: 'stable',
    confidence: 'low',
    sourceSignalScore: 30,
  });
  ok =
    assert(
      checks,
      dupPred.pendingPredictions.filter((p) => p.id === 'pred-test-0').length === 1,
      'addAdvisorPrediction duplicate üretmiyor',
      'Duplicate prediction oluştu',
    ) && ok;

  ok =
    assert(
      checks,
      getAdvisorConfidenceForState(day1, 'vehicles') === 'low',
      'Level 1 confidence low üretebiliyor',
      'Level 1 confidence hatalı',
    ) && ok;

  const level2State: AdvisorState = {
    ...day1,
    level: 2,
    experience: 120,
    reliabilityBand: 'developing',
    reliabilityScore: 60,
  };
  ok =
    assert(
      checks,
      getAdvisorConfidenceForState(level2State, 'vehicles') === 'medium',
      'Level 2 confidence medium üretebiliyor',
      'Level 2 confidence hatalı',
    ) && ok;

  const level3State: AdvisorState = {
    ...day1,
    level: 3,
    experience: 300,
    reliabilityBand: 'expert',
    reliabilityScore: 90,
  };
  ok =
    assert(
      checks,
      getAdvisorConfidenceForState(level3State, 'vehicles') === 'high',
      'Level 3 confidence high üretebiliyor',
      'Level 3 confidence hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      normalizeAdvisorState(undefined, 3).experience === 0 &&
        normalizeAdvisorState({ experience: 50 }, 3).experience === 50,
      'Normalize eksik advisorState onarıyor',
      'Normalize başarısız',
    ) && ok;

  ok =
    assert(
      checks,
      getAdvisorLevelFromExperience(0) === 1 &&
        getAdvisorLevelFromExperience(100) === 2 &&
        getAdvisorLevelFromExperience(260) === 3,
      'Level threshold doğru çalışıyor',
      'Level threshold hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      ADVISOR_DAILY_USES_BY_LEVEL[2] === 2 && ADVISOR_DAILY_USES_BY_LEVEL[3] === 3,
      'Daily uses level’a göre atanıyor',
      'Daily uses tablosu hatalı',
    ) && ok;

  const refreshed = refreshAdvisorDailyUses(
    { ...day1, dailyUsesRemaining: 0, lastRefreshedDay: 1 },
    2,
  );
  ok =
    assert(
      checks,
      refreshed.lastRefreshedDay === 2 &&
        refreshed.dailyUsesRemaining === ADVISOR_DAILY_USES_BY_LEVEL[1],
      'Gün değişince dailyUsesRemaining refresh oluyor',
      'Gün refresh başarısız',
    ) && ok;

  const sameDayRefresh = refreshAdvisorDailyUses(
    { ...day1, dailyUsesRemaining: 0, lastRefreshedDay: 1 },
    1,
  );
  ok =
    assert(
      checks,
      sameDayRefresh.dailyUsesRemaining === 0,
      'Aynı gün refresh tekrar kullanım hakkını yanlış artırmıyor',
      'Aynı gün refresh hatalı artırıyor',
    ) && ok;

  const spent = spendAdvisorUse({ ...day1, dailyUsesRemaining: 0 });
  ok =
    assert(
      checks,
      spent.dailyUsesRemaining === 0,
      'spendAdvisorUse sıfırın altına düşmüyor',
      'spendAdvisorUse negatife düştü',
    ) && ok;

  const leveled = grantAdvisorExperience(day1, 120, 'test');
  ok =
    assert(
      checks,
      leveled.level === 2 && leveled.experience >= ADVISOR_LEVEL_THRESHOLDS[2],
      'grantAdvisorExperience level up yapabiliyor',
      'Level up başarısız',
    ) && ok;

  const seed = createDay1Seed();
  const ctxDay1 = buildAdvisorContextFromStore({
    gameState: seed.gameState,
    isDay1Tutorial: true,
  });
  const day1Insights = buildDailyAdvisorInsights(ctxDay1);
  ok =
    assert(
      checks,
      day1Insights.length > 0 && day1Insights[0]!.body.length > 0,
      'Day 1 compact insight üretilebiliyor',
      'Day 1 insight üretilemedi',
    ) && ok;

  const postPilotCtx = buildAdvisorContextFromStore({
    gameState: {
      ...seed.gameState,
      pilot: {
        ...seed.gameState.pilot,
        status: 'completed',
        postPilotOperation: {
          phase: 'main_operation_light',
          operationDay: 8,
          lastUpdatedDay: 8,
          scopes: {
            istasyon: 'agenda',
            yesilvadi: 'preview',
            main_operation: 'agenda',
          },
        },
      },
    },
  });
  const postPilotInsights = buildDailyAdvisorInsights(postPilotCtx);
  ok =
    assert(
      checks,
      postPilotInsights.some((i) => i.sourceTags.includes('post_pilot')),
      'Post-pilot light insight üretilebiliyor',
      'Post-pilot insight yok',
    ) && ok;

  const event = minimalEvent();
  ok =
    assert(
      checks,
      buildEventAdvisorInsights(postPilotCtx, event).length === 1,
      'Event hint fallback crashesız çalışıyor',
      'Event hint crash',
    ) && ok;

  ok =
    assert(
      checks,
      buildAssignmentAdvisorInsights(postPilotCtx, event).length === 1,
      'Assignment hint fallback crashesız çalışıyor',
      'Assignment hint crash',
    ) && ok;

  ok =
    assert(
      checks,
      buildEndDayAdvisorInsight(postPilotCtx, minimalReport(8)) != null,
      'End-day insight fallback crashesız çalışıyor',
      'End-day insight crash',
    ) && ok;

  const hubModel = buildAdvisorHubCardModel({
    ctx: postPilotCtx,
    advisorState: day1,
  });
  ok =
    assert(
      checks,
      hubModel.roleLabel.length > 0 &&
        hubModel.ctaLabel.length > 0 &&
        (hubModel.primaryInsight?.body.length ?? 0) > 0,
      'Presentation model textleri boş değil',
      'Presentation model boş alan',
    ) && ok;

  const eventModel = buildAdvisorEventHintModel({
    ctx: postPilotCtx,
    advisorState: day1,
    event,
  });
  const endModel = buildAdvisorEndDayModel({
    ctx: postPilotCtx,
    advisorState: day1,
    report: minimalReport(1),
    levelBefore: 1,
  });
  const uiTexts = [
    hubModel.roleLabel,
    hubModel.levelLabel,
    hubModel.progressLabel,
    hubModel.usesLabel,
    hubModel.ctaLabel,
    hubModel.primaryInsight?.title,
    hubModel.primaryInsight?.body,
    hubModel.clarityLabel,
    hubModel.primaryInsight?.confidenceLabel,
    eventModel.primaryInsight?.body,
    eventModel.ctaLabel,
    eventModel.usesLabel,
    endModel.primaryInsight?.body,
    endModel.experienceGrantLine,
    endModel.levelUpLine,
    endModel.progressLabel,
  ]
    .filter((t): t is string => typeof t === 'string')
    .join(' ')
    .toLowerCase();

  const forbiddenHit = ADVISOR_UI_FORBIDDEN_WORDS.find((w) => uiTexts.includes(w));
  ok =
    assert(
      checks,
      forbiddenHit == null,
      'UI forbidden words yok: XP, premium, kilitli, satın al',
      `Yasaklı kelime bulundu: ${forbiddenHit ?? '?'}`,
    ) && ok;

  const longBody = hubModel.primaryInsight?.body ?? '';
  ok =
    assert(
      checks,
      longBody.length <= ADVISOR_MAX_INSIGHT_BODY_LENGTH + 4,
      'Max line copy guard: insight body çok uzun değil',
      'Insight body çok uzun',
    ) && ok;

  let eodState = day1;
  eodState = grantAdvisorEndOfDayExperience(eodState, 1, ADVISOR_END_OF_DAY_EXPERIENCE);
  const again = grantAdvisorEndOfDayExperience(eodState, 1, ADVISOR_END_OF_DAY_EXPERIENCE);
  ok =
    assert(
      checks,
      again.experience === eodState.experience,
      'Idempotency: aynı gün endCurrentDay deneyimi birden fazla vermiyor',
      'Gün sonu deneyimi idempotent değil',
    ) && ok;

  const day1Eval = evaluateAdvisorPredictionsAgainstSignals({
    state: {
      ...day1,
      pendingPredictions: [
        {
          id: 'p1',
          day: 1,
          domain: 'vehicles',
          predictedStatus: 'stable',
          confidence: 'low',
          sourceSignalScore: 30,
        },
      ],
    },
    signals: createInitialOperationSignalsState(2),
    evalDay: 2,
    isDay1Tutorial: true,
  });
  ok =
    assert(
      checks,
      day1Eval.missedSignal == null,
      'Day 1 tutorial missed signal üretmiyor',
      'Day 1 missed signal oluştu',
    ) && ok;

  const baseSignals = createInitialOperationSignalsState(3);
  const strainedSignals = {
    ...baseSignals,
    vehicles: buildOperationSignal(
      'vehicles',
      75,
      30,
      3,
      'Araç',
      'Baskı arttı',
      ['test'],
    ),
  };
  const prediction: AdvisorPrediction = {
    id: 'pred-miss',
    day: 2,
    domain: 'vehicles',
    predictedStatus: 'watch',
    confidence: 'low',
    sourceSignalScore: 40,
  };
  ok =
    assert(
      checks,
      shouldCreateMissedSignal(prediction, strainedSignals.vehicles.status),
      'stable/watch → strained missed signal koşulu',
      'shouldCreateMissedSignal hatalı',
    ) && ok;

  const missEval = evaluateAdvisorPredictionsAgainstSignals({
    state: {
      ...day1,
      pendingPredictions: [prediction],
      lastRefreshedDay: 2,
    },
    signals: strainedSignals,
    evalDay: 3,
    hasCriticalEvent: true,
  });
  ok =
    assert(
      checks,
      missEval.missedSignal != null &&
        missEval.missedSignal.message.includes('hızlı yükseldi'),
      'critical durumda mesaj beklenenden hızlı yükseldi tonunda',
      'Missed signal mesaj tonu hatalı',
    ) && ok;

  const multiPredEval = evaluateAdvisorPredictionsAgainstSignals({
    state: {
      ...day1,
      pendingPredictions: [
        {
          id: 'pred-a',
          day: 2,
          domain: 'vehicles',
          predictedStatus: 'stable',
          confidence: 'low',
          sourceSignalScore: 30,
        },
        {
          id: 'pred-b',
          day: 2,
          domain: 'containers',
          predictedStatus: 'watch',
          confidence: 'low',
          sourceSignalScore: 40,
        },
      ],
    },
    signals: {
      ...strainedSignals,
      containers: buildOperationSignal(
        'containers',
        80,
        30,
        3,
        'Konteyner',
        'Baskı',
        ['test'],
      ),
    },
    evalDay: 3,
  });
  ok =
    assert(
      checks,
      multiPredEval.missedSignal != null &&
        multiPredEval.missedSignal.domain === 'vehicles',
      'Aynı gün birden fazla missed signal oluşmuyor',
      'Çoklu missed signal oluştu',
    ) && ok;

  const ackBefore = missEval.state.reliabilityScore;
  const ackLearningBefore = missEval.state.domainLearning.vehicles;
  const ackXpBefore = missEval.state.experience;
  const acked = applyAcknowledgeMissedSignalRewards(missEval.state, 3);
  ok =
    assert(
      checks,
      acked.lastMissedSignal?.acknowledged === true &&
        acked.lastMissedSignal?.acknowledgedDay === 3,
      'acknowledgeAdvisorMissedSignal acknowledged true yapıyor',
      'Acknowledge flag hatalı',
    ) && ok;
  ok =
    assert(
      checks,
      acked.domainLearning.vehicles > ackLearningBefore,
      'acknowledgeAdvisorMissedSignal domainLearning artırıyor',
      'Acknowledge domain learning artmadı',
    ) && ok;
  ok =
    assert(
      checks,
      acked.reliabilityScore > ackBefore,
      'acknowledgeAdvisorMissedSignal reliability artırıyor',
      'Acknowledge reliability artmadı',
    ) && ok;
  ok =
    assert(
      checks,
      acked.experience > ackXpBefore,
      'acknowledgeAdvisorMissedSignal experience artırıyor',
      'Acknowledge experience artmadı',
    ) && ok;

  const ackTwice = applyAcknowledgeMissedSignalRewards(acked, 3);
  ok =
    assert(
      checks,
      ackTwice.experience === acked.experience &&
        ackTwice.domainLearning.vehicles === acked.domainLearning.vehicles,
      'acknowledged signal tekrar aynı ödülü vermiyor',
      'Acknowledge tekrar ödül verdi',
    ) && ok;

  const signalsForPred = createInitialOperationSignalsState(5);
  const withPred = attachAdvisorPredictionAfterInsight({
    state: day1,
    signals: signalsForPred,
    gameState: { ...seed.gameState, city: { ...seed.gameState.city, day: 5 } },
    insightType: 'daily_summary',
  });
  ok =
    assert(
      checks,
      withPred.pendingPredictions.some((p) => p.day === 5),
      'askAdvisorForDailySummary prediction oluşturabiliyor',
      'Daily prediction oluşmadı',
    ) && ok;

  const vehicleEvent: EventCard = {
    ...minimalEvent(),
    category: 'vehicle_route',
  };
  const eventPred = attachAdvisorPredictionAfterInsight({
    state: day1,
    signals: signalsForPred,
    gameState: { ...seed.gameState, city: { ...seed.gameState.city, day: 5 } },
    insightType: 'event_plan_hint',
    event: vehicleEvent,
  });
  ok =
    assert(
      checks,
      eventPred.pendingPredictions.some((p) => p.domain === 'vehicles'),
      'askAdvisorForEventHint event domain prediction oluşturabiliyor',
      'Event prediction domain hatalı',
    ) && ok;

  const noSignalsInsights = buildDailyAdvisorInsights(postPilotCtx);
  ok =
    assert(
      checks,
      noSignalsInsights.length > 0,
      'operationSignals yokken advisor fallback çalışıyor',
      'Fallback insight yok',
    ) && ok;

  const withSignalsCtx = buildAdvisorContextFromStore({
    gameState: postPilotCtx.gameState,
    advisorState: level3State,
    operationSignals: strainedSignals,
  });
  const signalInsights = buildDailyAdvisorInsights(withSignalsCtx);
  ok =
    assert(
      checks,
      signalInsights.some((i) => i.sourceTags.includes('operation_signals')),
      'operationSignals varken insight spesifik sourceTags taşıyor',
      'Sinyal sourceTags eksik',
    ) && ok;

  ok =
    assert(
      checks,
      hubModel.clarityLabel.length > 0 && getAdvisorReliabilityLabel(52).length > 0,
      'Hub presentation reliability label boş değil',
      'Hub clarity label boş',
    ) && ok;

  ok =
    assert(
      checks,
      eventModel.clarityLabel.length > 0,
      'Event hint presentation clarity label boş değil',
      'Event clarity label boş',
    ) && ok;

  ok =
    assert(
      checks,
      endModel.levelBefore === 1 && endModel.levelAfter >= 1,
      'Report advisor model level-up davranışını bozmuyor',
      'End-day level model bozuldu',
    ) && ok;

  const hydrated = normalizePersistedSave({
    saveVersion: 12,
    gameState: seed.gameState,
    neighborhoods: seed.neighborhoods,
    resources: seed.resources,
    eventPool: seed.eventPool,
    decisionHistory: seed.decisionHistory,
    snapshots: seed.snapshots,
  });
  const persistOk =
    SAVE_VERSION === 26 &&
    hydrated != null &&
    hydrated.advisorState.advisorId === 'ece_operations_assistant' &&
    hydrated.advisorState.reliabilityScore === DEFAULT_RELIABILITY_SCORE;

  if (!warn(checks, persistOk, `Persist v${SAVE_VERSION} advisorState migration`, 'Persist migration uyarısı')) {
    hasWarn = true;
  }

  const copyBlob = JSON.stringify(ADVISOR_COPY).toLowerCase();
  if (!warn(checks, !copyBlob.includes(' xp'), 'ADVISOR_COPY xp kelimesi içermiyor', 'COPY xp içeriyor olabilir')) {
    hasWarn = true;
  }

  return { ok, warn: hasWarn, checks };
}
