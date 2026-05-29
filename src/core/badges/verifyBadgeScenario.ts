import { normalizePersistedSave, SAVE_VERSION } from '@/store/gamePersist';
import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialPlayerProgress } from '@/core/xp/levelProgress';

import {
  applyBadgeEvaluation,
  evaluateDailyBadges,
  evaluatePilotCompletionBadges,
  processDailyBadgeEvaluation,
  processPilotCompletionBadgeEvaluation,
} from './badgeEngine';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import { deriveBadgeEvaluationRuleFlags } from './badgeEvaluationRules';
import { evaluateAveragePilotBadgeCount } from './badgeBalanceSimulation';
import {
  buildBadgeEvaluationSnapshot,
  buildBadgeSummaryLines,
  buildBadgeTitle,
  buildReportBadgeSummaryModel,
} from './badgePresentation';
import { createInitialBadgeState, normalizeBadgeState } from './badgeSeed';
import type { BadgeState } from './badgeTypes';

export type VerifyBadgeOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(
  checks: string[],
  ok: boolean,
  pass: string,
  fail: string,
): boolean {
  checks.push(ok ? `✓ ${pass}` : `✗ ${fail}`);
  return ok;
}

function positiveDailyInput(day: number) {
  return {
    day,
    dailyOperationCompleted: true,
    positiveOperationDay: true,
    socialPulseBalanced: true,
    budgetNotSeriouslyDamaged: true,
    personnelMoraleMaintained: true,
    criticalRiskClosedWithoutGrowth: true,
    butterflyFollowUpWellManaged: true,
    vehicleDayPositive: true,
    containerRiskControlled: true,
  };
}

export function verifyBadgeScenario(): VerifyBadgeOutcome {
  const checks: string[] = [];
  let ok = true;

  const initial = createInitialBadgeState(1);
  ok =
    assert(
      checks,
      initial.earnedBadgeIds.length === 0,
      'Initial badgeState boş earnedBadgeIds ile başlar',
      'Initial earnedBadgeIds hatalı',
    ) && ok;

  const duplicateState = normalizeBadgeState(
    {
      earnedBadgeIds: ['first_step', 'first_step'],
      recentlyEarnedBadgeIds: ['first_step', 'first_step'],
      badgeProgress: {},
      history: [],
      lastEvaluatedDay: 0,
    },
    1,
  );
  ok =
    assert(
      checks,
      duplicateState.earnedBadgeIds.length === 1,
      'normalizeBadgeState duplicate earnedBadgeIds temizler',
      'Duplicate earned temizleme hatalı',
    ) && ok;

  const firstEval = processDailyBadgeEvaluation({
    badgeState: createInitialBadgeState(1),
    day: 1,
    input: positiveDailyInput(1),
  });
  ok =
    assert(
      checks,
      firstEval.badgeState.earnedBadgeIds.includes('first_step'),
      'first_step ilk günlük değerlendirmede kazanılır',
      'first_step kazanımı başarısız',
    ) && ok;

  const secondEval = processDailyBadgeEvaluation({
    badgeState: firstEval.badgeState,
    day: 1,
    input: positiveDailyInput(1),
  });
  ok =
    assert(
      checks,
      secondEval.alreadyApplied &&
        secondEval.badgeState.history.length === firstEval.badgeState.history.length,
      'Aynı daily evaluation ikinci kez duplicate history oluşturmaz',
      'Daily idempotency başarısız',
    ) && ok;

  const overflowResult = evaluateDailyBadges({
    badgeState: createInitialBadgeState(3),
    ...positiveDailyInput(3),
    socialPulseBalanced: true,
  });
  let overflowState = createInitialBadgeState(3);
  for (let i = 0; i < 5; i += 1) {
    overflowState = applyBadgeEvaluation(
      overflowState,
      {
        ...overflowResult,
        progressUpdates: overflowResult.progressUpdates.map((update) =>
          update.badgeId === 'public_listener'
            ? { ...update, current: 99, completed: true }
            : update,
        ),
      },
      3,
    );
  }
  ok =
    assert(
      checks,
      overflowState.badgeProgress.public_listener.current <=
        overflowState.badgeProgress.public_listener.target,
      'Progress current target üstüne taşsa bile güvenli kalır',
      'Progress clamp hatalı',
    ) && ok;

  const earnedOnce = applyBadgeEvaluation(
    createInitialBadgeState(1),
    {
      progressUpdates: [],
      earnedBadgeIds: ['first_step'],
      reasonLines: [],
      source: 'daily_report',
    },
    1,
  );
  const earnedTwice = applyBadgeEvaluation(
    earnedOnce,
    {
      progressUpdates: [],
      earnedBadgeIds: ['first_step'],
      reasonLines: [],
      source: 'daily_report',
    },
    1,
  );
  ok =
    assert(
      checks,
      earnedTwice.earnedBadgeIds.filter((id) => id === 'first_step').length === 1,
      'earnedBadgeIds içindeki rozet tekrar kazanılmaz',
      'Duplicate earn başarısız',
    ) && ok;

  const recentState = applyBadgeEvaluation(
    createInitialBadgeState(2),
    {
      progressUpdates: [],
      earnedBadgeIds: ['crisis_cooler'],
      reasonLines: [],
      source: 'daily_report',
    },
    2,
  );
  ok =
    assert(
      checks,
      recentState.recentlyEarnedBadgeIds.length === 1 &&
        recentState.recentlyEarnedBadgeIds[0] === 'crisis_cooler',
      'recentlyEarnedBadgeIds sadece son yeni kazanımları gösterir',
      'recentlyEarnedBadgeIds hatalı',
    ) && ok;

  const pilotEval = processPilotCompletionBadgeEvaluation({
    badgeState: createInitialBadgeState(7),
    day: 7,
    pilotRunId: 'run-1',
    authorityPromoted: false,
    authorityEvaluationStatus: 'stable',
  });
  ok =
    assert(
      checks,
      pilotEval.badgeState.earnedBadgeIds.includes('pilot_finisher'),
      'pilot_finisher completePilot evaluation’da kazanılır',
      'pilot_finisher başarısız',
    ) && ok;

  const candidateEval = processPilotCompletionBadgeEvaluation({
    badgeState: createInitialBadgeState(7),
    day: 7,
    pilotRunId: 'run-candidate',
    authorityEvaluationStatus: 'promotion_candidate',
    authorityPromoted: false,
  });
  ok =
    assert(
      checks,
      candidateEval.badgeState.earnedBadgeIds.includes('authority_candidate'),
      'promotion_candidate authority evaluation varsa authority_candidate kazanılır',
      'authority_candidate başarısız',
    ) && ok;

  const promotedEval = processPilotCompletionBadgeEvaluation({
    badgeState: createInitialBadgeState(7),
    day: 7,
    pilotRunId: 'run-promoted',
    authorityEvaluationStatus: 'promoted',
    authorityPromoted: true,
  });
  ok =
    assert(
      checks,
      promotedEval.badgeState.earnedBadgeIds.includes('promoted_operator'),
      'promoted authority evaluation varsa promoted_operator kazanılır',
      'promoted_operator başarısız',
    ) && ok;

  const pilotSecond = processPilotCompletionBadgeEvaluation({
    badgeState: promotedEval.badgeState,
    day: 7,
    pilotRunId: 'run-promoted',
    authorityPromoted: true,
  });
  ok =
    assert(
      checks,
      pilotSecond.alreadyApplied &&
        pilotSecond.badgeState.history.length ===
          promotedEval.badgeState.history.length,
      'Aynı pilotRunId ile ikinci pilot completion duplicate badge üretmez',
      'Pilot idempotency başarısız',
    ) && ok;

  const snapshot = buildBadgeEvaluationSnapshot(
    evaluateDailyBadges({
      badgeState: createInitialBadgeState(2),
      ...positiveDailyInput(2),
    }),
    createInitialBadgeState(2),
  );
  ok =
    assert(
      checks,
      Array.isArray(snapshot.earnedBadgeIds) &&
        Array.isArray(snapshot.progressLines) &&
        Array.isArray(snapshot.earnedLines),
      'DailyReport badgeEvaluation snapshot güvenli üretilir',
      'Badge snapshot hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildReportBadgeSummaryModel(undefined).visible === false,
      'badgeEvaluation undefined ise model visible false',
      'Undefined evaluation visible hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildReportBadgeSummaryModel({
        earnedBadgeIds: [],
        earnedLines: [],
        progressLines: [],
      }).visible === false,
      'earnedBadgeIds boş ve progressLines boş ise visible false',
      'Boş evaluation visible hatalı',
    ) && ok;

  const singleEarnedModel = buildReportBadgeSummaryModel({
    earnedBadgeIds: ['first_step'],
    earnedLines: ['Yeni rozet kazanıldı: İlk Saha İmzası'],
    progressLines: [],
  });
  ok =
    assert(
      checks,
      singleEarnedModel.visible &&
        singleEarnedModel.mode === 'earned' &&
        singleEarnedModel.primaryBadge?.title === 'İlk Saha İmzası',
      'tek rozet kazanımında mode earned olur',
      'Tek rozet earned modeli hatalı',
    ) && ok;

  const multiEarnedModel = buildReportBadgeSummaryModel({
    earnedBadgeIds: ['first_step', 'public_listener', 'budget_guardian'],
    earnedLines: [],
    progressLines: [],
  });
  ok =
    assert(
      checks,
      multiEarnedModel.extraEarnedCount === 2,
      'birden fazla rozet kazanımında extraEarnedCount doğru hesaplanır',
      'extraEarnedCount hatalı',
    ) && ok;

  const progressModel = buildReportBadgeSummaryModel({
    earnedBadgeIds: [],
    earnedLines: [],
    progressLines: [
      'Rozet ilerlemesi: Halkın Sesi 2/3',
      'Rozet ilerlemesi: Kaynak Disiplini 1/3',
      'Rozet ilerlemesi: Personel 0/3',
    ],
  });
  ok =
    assert(
      checks,
      progressModel.mode === 'progress' &&
        progressModel.progressLines.length === 2 &&
        progressModel.progressLines[0] === 'Halkın Sesi 2/3',
      'progressLines varsa max 2 satır döner',
      'Progress lines modeli hatalı',
    ) && ok;

  const unknownEarnedModel = buildReportBadgeSummaryModel({
    earnedBadgeIds: ['unknown_badge' as never],
    earnedLines: [],
    progressLines: ['Rozet ilerlemesi: Halkın Sesi 1/3'],
  });
  ok =
    assert(
      checks,
      unknownEarnedModel.visible &&
        unknownEarnedModel.mode === 'progress' &&
        unknownEarnedModel.progressLines[0] === 'Halkın Sesi 1/3',
      'unknown badge id varsa crash olmaz',
      'Unknown badge report modeli hatalı',
    ) && ok;

  const day1CompactModel = buildReportBadgeSummaryModel({
    earnedBadgeIds: ['first_step'],
    earnedLines: ['Yeni rozet kazanıldı: İlk Saha İmzası'],
    progressLines: ['Rozet ilerlemesi: Halkın Sesi 1/3'],
  });
  ok =
    assert(
      checks,
      day1CompactModel.visible &&
        day1CompactModel.mode === 'earned' &&
        day1CompactModel.primaryBadge?.title === 'İlk Saha İmzası',
      'Day 1 compact render güvenli kalır',
      'Day 1 compact modeli hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildReportBadgeSummaryModel(null).visible === false,
      'ReportBadgeSummary badgeEvaluation yokken crash olmaz',
      'Null evaluation visible hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildBadgeSummaryLines({ earnedBadgeIds: [], earnedLines: [], progressLines: [] })
        .length === 0,
      'Boş badge summary lines güvenli',
      'Boş summary lines hatalı',
    ) && ok;

  const hydrated = normalizePersistedSave({
    saveVersion: 7,
    gameState: createDay1Seed().gameState,
    neighborhoods: createDay1Seed().neighborhoods,
    resources: createDay1Seed().resources,
    eventPool: createDay1Seed().eventPool,
    decisionHistory: [],
    snapshots: [],
    playerProgress: createInitialPlayerProgress(),
    updatedAt: new Date().toISOString(),
  });
  const normalizedBadge = normalizeBadgeState(
    hydrated?.gameState.pilot.badgeState,
    1,
  );
  ok =
    assert(
      checks,
      hydrated != null &&
        hydrated.saveVersion === SAVE_VERSION &&
        normalizedBadge.earnedBadgeIds.length === 0,
      `badgeState undefined persist fallback ile crash olmaz (v${SAVE_VERSION})`,
      'Persist fallback hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildBadgeTitle('unknown_badge' as never) === 'Bilinmeyen Rozet',
      'unknown badge id presentation güvenli fallback',
      'Unknown badge fallback hatalı',
    ) && ok;

  const streakState: BadgeState = createInitialBadgeState(1);
  let streakWorking = streakState;
  for (let day = 1; day <= 3; day += 1) {
    const daily = processDailyBadgeEvaluation({
      badgeState: streakWorking,
      day,
      input: positiveDailyInput(day),
    });
    streakWorking = daily.badgeState;
  }
  ok =
    assert(
      checks,
      streakWorking.earnedBadgeIds.includes('steady_operator'),
      'steady_operator 3 günlük streak ile kazanılır',
      'Streak rozet hatalı',
    ) && ok;

  const passiveSafeFlags = deriveBadgeEvaluationRuleFlags({
    day: 3,
    decisionHistory: [
      {
        id: 'd1',
        day: 3,
        eventId: 'event_comm',
        eventTitle: 'Bilgilendirme',
        decisionId: 'communicate',
        decisionLabel: 'Halka bilgi ver',
        appliedEffects: { publicSatisfaction: 2, budget: -500, staffMorale: 1 },
        createdAt: new Date().toISOString(),
      },
    ],
    activeEvents: [
      {
        id: 'event_comm',
        title: 'Bilgilendirme',
        category: 'communication',
        riskLevel: 'low',
        district: 'merkez',
        description: 'standart bilgilendirme',
        contextTag: 'test',
        urgencyHours: 4,
        decisions: [],
        previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
      } as never,
    ],
    metricsAfter: {
      publicSatisfaction: 55,
      staffMorale: 58,
      budget: 80_000,
    },
    socialPulseStateAfter: { globalPulseScore: 55 } as never,
    containerState: createInitialContainerState(3),
    vehicleState: createInitialVehicleState(3),
    authorityInput: {
      day: 3,
      mainEventResolved: true,
      dailyGoalsCompletedCount: 1,
      socialPulseBalanced: true,
      budgetNotSeriouslyDamaged: true,
      personnelMoraleMaintained: true,
      criticalEventUnresolved: false,
      budgetSeverelyDropped: false,
      personnelMoraleSeverelyDropped: false,
      socialCrisisGrew: false,
    },
    authorityNetGain: 12,
  });
  ok =
    assert(
      checks,
      passiveSafeFlags.vehicleDayPositive === false &&
        passiveSafeFlags.containerRiskControlled === false,
      'passive safe day route_mind/container_watch progress artırmaz',
      'Passive safe route/container hatalı',
    ) && ok;

  const mediumCrisisFlags = deriveBadgeEvaluationRuleFlags({
    day: 2,
    decisionHistory: [
      {
        id: 'd2',
        day: 2,
        eventId: 'event_medium',
        eventTitle: 'Rutin olay',
        decisionId: 'balanced',
        decisionLabel: 'Dengeli müdahale',
        appliedEffects: { publicSatisfaction: 3, budget: -1000, staffMorale: 1, risk: -2 },
        createdAt: new Date().toISOString(),
      },
    ],
    activeEvents: [],
    eventPool: [
      {
        id: 'event_medium',
        title: 'Rutin olay',
        category: 'operations',
        riskLevel: 'medium',
        district: 'merkez',
        description: 'normal operasyon',
        contextTag: 'test',
        urgencyHours: 4,
        decisions: [],
        previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
      } as never,
    ],
    metricsAfter: {
      publicSatisfaction: 55,
      staffMorale: 58,
      budget: 80_000,
    },
    authorityInput: {
      day: 2,
      mainEventResolved: true,
      dailyGoalsCompletedCount: 1,
    },
  });
  ok =
    assert(
      checks,
      mediumCrisisFlags.criticalRiskClosedWithoutGrowth === false,
      'normal non-critical event crisis_cooler kazandırmaz',
      'Medium event crisis_cooler hatalı',
    ) && ok;

  const butterflySeedFlags = deriveBadgeEvaluationRuleFlags({
    day: 4,
    decisionHistory: [],
    activeEvents: [],
    metricsAfter: {
      publicSatisfaction: 55,
      staffMorale: 58,
      budget: 80_000,
    },
    butterflyHookState: {
      hooks: [
        {
          id: 'seed-hook',
          source: 'event_content',
          kind: 'risk_signal',
          status: 'resolved',
          createdDay: 4,
          dueDay: 6,
          expiresDay: 7,
          severity: 'low',
          title: 'Butterfly seed',
          description: 'seed',
          triggerTag: 'seed',
          createdAt: Date.now(),
        },
      ],
      lastProcessedDay: 4,
    },
    authorityInput: { day: 4, mainEventResolved: true },
  });
  ok =
    assert(
      checks,
      butterflySeedFlags.butterflyFollowUpWellManaged === false,
      'butterfly seed tek başına butterfly_handler kazandırmaz',
      'Butterfly seed handler hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      !promotedEval.badgeState.earnedBadgeIds.includes('authority_candidate'),
      'promoted_operator yalnızca promoted evaluation ile kazanılır',
      'Promoted/candidate çakışması hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      !candidateEval.badgeState.earnedBadgeIds.includes('promoted_operator'),
      'authority_candidate yalnızca promotion_candidate ile kazanılır',
      'Candidate/promoted çakışması hatalı',
    ) && ok;

  const averagePilotBadgeCount = evaluateAveragePilotBadgeCount();
  ok =
    assert(
      checks,
      averagePilotBadgeCount >= 4 && averagePilotBadgeCount <= 8,
      `average_pilot simülasyonu 4-8 rozet bandında (${averagePilotBadgeCount})`,
      `average_pilot rozet sayısı band dışı: ${averagePilotBadgeCount}`,
    ) && ok;

  return { ok, checks };
}
