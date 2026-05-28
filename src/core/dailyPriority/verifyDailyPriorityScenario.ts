import { createDay1Seed } from '@/core/content/day1Seed';
import { buildDailyReport } from '@/core/game/buildDailyReport';
import { buildMetricChanges } from '@/features/events/utils/decisionResultModel';
import { normalizePersistedSave, SAVE_VERSION } from '@/store/gamePersist';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialPersonnelState } from '@/core/personnel/personnelSeed';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import { createDailyGoalsForDay } from '@/core/dailyGoals/dailyGoalEngine';
import { getPriorityGoalWeight } from '@/core/dailyPriority/dailyPriorityEngine';
import {
  buildMetricSnapshot,
  ensureDailyPriorityForDay,
  evaluateDecisionImpactOnPriority,
  finalizeDailyPriority,
  resolveDay1AutoPriorityKey,
  selectDailyPriority,
} from '@/core/dailyPriority/dailyPriorityEngine';
import { buildDailyPriorityReportResult } from '@/core/dailyPriority/dailyPriorityPresentation';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { EventCard, EventDecision } from '@/core/models/EventCard';

export type VerifyDailyPriorityOutcome = {
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

const MOCK_METRICS: GameMetrics = {
  publicSatisfaction: 55,
  staffMorale: 60,
  budget: 80_000,
};

export function verifyDailyPriorityScenario(): VerifyDailyPriorityOutcome {
  const checks: string[] = [];
  let ok = true;
  const bundle = createDay1Seed();
  const day = bundle.gameState.city.day;
  const metricInput = {
    gameState: bundle.gameState,
    containerState: createInitialContainerState(day),
    vehicleState: createInitialVehicleState(day),
    personnelState: createInitialPersonnelState(),
    socialPulseState: createInitialSocialPulseState(day),
  };
  const snapshot = buildMetricSnapshot(metricInput);

  const featured = bundle.gameState.events[0];
  const day1 = ensureDailyPriorityForDay({
    day: 1,
    isDay1Tutorial: true,
    featuredEvent: featured,
    metricSnapshot: snapshot,
  });
  ok =
    assert(
      checks,
      !!day1.selectedKey && day1.isDay1Auto === true,
      'Day 1 auto priority',
      'Day 1 auto priority başarısız',
    ) && ok;

  const day2 = ensureDailyPriorityForDay({ day: 2 });
  ok =
    assert(
      checks,
      day2.status === 'not_selected' && !day2.selectedKey,
      'Day 2+ not_selected',
      'Day 2 not_selected hatalı',
    ) && ok;

  const selected = selectDailyPriority(day2, 'operation_stability', snapshot);
  ok =
    assert(
      checks,
      selected.status === 'active' && selected.selectedKey === 'operation_stability',
      'selectDailyPriority active',
      'select başarısız',
    ) && ok;

  const reselect = selectDailyPriority(selected, 'public_relief', snapshot);
  ok =
    assert(
      checks,
      reselect.selectedKey === 'operation_stability',
      'aynı gün ikinci seçim değişmez',
      'idempotent select bozuk',
    ) && ok;

  const v7 = normalizePersistedSave({
    saveVersion: 7,
    gameState: bundle.gameState,
    neighborhoods: bundle.neighborhoods,
    resources: bundle.resources,
    eventPool: bundle.eventPool,
    decisionHistory: [],
    snapshots: [],
    playerProgress: { level: 1, totalXp: 0, xpIntoLevel: 0, xpToNextLevel: 100 },
    updatedAt: new Date().toISOString(),
  });
  ok =
    assert(
      checks,
      v7 != null && v7.saveVersion === SAVE_VERSION,
      `v7 save hydrate → v${SAVE_VERSION}`,
      'v7 migrate başarısız',
    ) && ok;

  ok =
    assert(
      checks,
      getPriorityGoalWeight('public_relief', 'socialPulse') > 1,
      'priority goal weight public_relief',
      'goal weight hatalı',
    ) && ok;

  const goalsWithPriority = createDailyGoalsForDay({
    ...metricInput,
    day: 2,
    gameState: bundle.gameState,
    neighborhoods: bundle.neighborhoods,
    isDay1Tutorial: false,
    dailyPriorityKey: 'operation_stability',
  });
  ok =
    assert(
      checks,
      goalsWithPriority.goals.length >= 3,
      'daily goals priority input ile üretilir',
      'daily goals priority üretimi başarısız',
    ) && ok;

  const mockDecision: EventDecision = {
    id: 'd1',
    title: 'İletişim kur',
    description: 'communicate',
    style: 'balanced',
    effects: {
      publicSatisfaction: 5,
      risk: -2,
      budget: 0,
      morale: 0,
      xp: 0,
    },
  };

  const mockEvent = {
    id: 'ev-priority-test',
    title: 'Sosyal şikayet',
    description: 'Test',
    category: 'social',
    eventType: 'social_media',
    district: 'Merkez',
    neighborhoodId: 'merkez',
    priority: 2,
    riskLevel: 'medium',
    contextTag: 'test',
    urgencyHours: 4,
    decisions: [mockDecision],
    previewEffects: { publicSatisfaction: 5, risk: -2, xp: 0 },
  } satisfies EventCard;

  const reliefState = selectDailyPriority(day2, 'public_relief', snapshot);
  const before = reliefState.score;
  const metricChanges = buildMetricChanges(
    { publicSatisfaction: 50, budget: 80_000, morale: 55, riskScore: 50 },
    { publicSatisfaction: 58, budget: 79_000, morale: 54, riskScore: 48 },
  );
  const decisionEval = evaluateDecisionImpactOnPriority({
    state: reliefState,
    event: mockEvent,
    decision: mockDecision,
    metricChanges,
    subsystemOutcomes: [
      {
        key: 'social',
        title: 'Sosyal',
        status: 'good',
        primaryText: 'Baskı azaldı',
      },
    ],
  });
  ok =
    assert(
      checks,
      decisionEval.impact != null && decisionEval.state.score >= before,
      'public_relief karar score artışı',
      'public_relief score artışı başarısız',
    ) && ok;

  const dup = evaluateDecisionImpactOnPriority({
    state: decisionEval.state,
    event: mockEvent,
    decision: mockDecision,
    metricChanges,
    subsystemOutcomes: [],
  });
  ok =
    assert(
      checks,
      dup.impact == null && dup.state.score === decisionEval.state.score,
      'duplicate karar score değiştirmez',
      'duplicate guard bozuk',
    ) && ok;

  const opState = selectDailyPriority(day2, 'operation_stability', snapshot);
  const opEval = evaluateDecisionImpactOnPriority({
    state: opState,
    event: mockEvent,
    decision: {
      id: 'd2',
      title: 'Rota düzenle',
      description: 'dispatch route',
      style: 'bold',
      effects: {
        publicSatisfaction: 0,
        risk: -3,
        budget: 0,
        morale: 0,
        xp: 0,
      },
    },
    metricChanges: buildMetricChanges(
      { publicSatisfaction: 50, budget: 80_000, morale: 55, riskScore: 55 },
      { publicSatisfaction: 50, budget: 80_000, morale: 55, riskScore: 42 },
    ),
    subsystemOutcomes: [
      {
        key: 'container',
        title: 'Konteyner',
        status: 'good',
        primaryText: 'Baskı düştü',
      },
    ],
  });
  ok =
    assert(
      checks,
      opEval.state.score >= opState.score,
      'operation_stability risk düşüşü score artışı',
      'operation score başarısız',
    ) && ok;

  const resState = selectDailyPriority(day2, 'resource_protection', snapshot);
  const resEval = evaluateDecisionImpactOnPriority({
    state: resState,
    event: mockEvent,
    decision: {
      id: 'd3',
      title: 'Dengeli izle',
      description: 'monitor balanced',
      style: 'balanced',
      effects: {
        publicSatisfaction: 0,
        risk: 0,
        budget: 500,
        morale: 2,
        xp: 0,
      },
    },
    metricChanges: buildMetricChanges(
      { publicSatisfaction: 50, budget: 80_000, morale: 55, riskScore: 50 },
      { publicSatisfaction: 50, budget: 82_000, morale: 58, riskScore: 50 },
    ),
    subsystemOutcomes: [
      {
        key: 'personnel',
        title: 'Personel',
        status: 'good',
        primaryText: 'Moral korundu',
      },
    ],
  });
  ok =
    assert(
      checks,
      resEval.state.score >= resState.score,
      'resource_protection budget/moral koruma',
      'resource score başarısız',
    ) && ok;

  const finalized = finalizeDailyPriority({
    state: { ...resEval.state, score: 72 },
    ...metricInput,
    resolvedEventCount: 1,
    focalNeighborhoodId: 'merkez',
  });
  ok =
    assert(
      checks,
      finalized.finalResult?.status === 'fulfilled',
      'end_of_day fulfilled',
      'finalize fulfilled başarısız',
    ) && ok;

  const reportResult = buildDailyPriorityReportResult(finalized);
  ok =
    assert(
      checks,
      reportResult != null && reportResult.text.length > 0,
      'report priority result',
      'report result boş',
    ) && ok;

  const report = buildDailyReport({
    day: 2,
    metrics: MOCK_METRICS,
    decisionHistory: [],
    activeEvents: [],
    resolvedEventIds: [],
    snapshots: [],
    dailyPriorityResult: reportResult ?? undefined,
  });
  ok =
    assert(
      checks,
      (report.dailyPriorityResult?.text.length ?? 0) > 0,
      'buildDailyReport snapshot priority',
      'buildDailyReport priority eksik',
    ) && ok;

  ok =
    assert(
      checks,
      resolveDay1AutoPriorityKey(featured) != null,
      'Day 1 auto key fallback',
      'Day 1 auto key başarısız',
    ) && ok;

  return { ok, checks };
}
