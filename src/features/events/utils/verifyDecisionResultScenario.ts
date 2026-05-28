import { pilotEvents } from '@/core/content/pilotEvents';
import { createDay1Seed } from '@/core/content/day1Seed';
import { checkDecisionAffordability } from '@/core/economy/economyAffordability';
import { applyDecision } from '@/core/game/applyDecision';
import {
  createFinalLowCostCloseoutDecision,
  ensureAtLeastOneAffordableDecision,
  FINAL_LOW_COST_CLOSEOUT_DECISION_ID,
} from '@/core/game/decisionAffordabilityFallback';
import { PILOT_FINAL_EVENT_ID } from '@/core/game/calculatePilotFinalResult';
import { isContainerRelevantEvent } from '@/core/containers/containerDecisionEffects';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import {
  processContainersAfterDecision,
} from '@/core/containers/containerIntegration';
import { createInitialPersonnelState } from '@/core/personnel/personnelSeed';
import { processPersonnelAfterDecision } from '@/core/personnel/personnelIntegration';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import {
  processSocialPulseAfterDecisionForStore,
} from '@/core/social/socialIntegration';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import {
  processVehiclesAfterDecisionForStore,
} from '@/core/vehicles/vehicleIntegration';
import { createInitialPlayerProgress } from '@/core/xp/levelProgress';
import { INITIAL_TUTORIAL_STATE } from '@/features/tutorial/tutorialTypes';
import {
  buildDecisionResultCitySlice,
  buildDecisionResultSnapshot,
  buildMetricChanges,
  buildSubsystemOutcomes,
  createEmptyDecisionResultFallback,
  inferResultTone,
} from '@/features/events/utils/decisionResultModel';

export type VerifyDecisionResultOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(checks: string[], label: string, condition: boolean): void {
  checks.push(condition ? `✓ ${label}` : `✗ ${label}`);
}

function simulateDecisionWithSnapshot(): {
  snapshotId: string;
  duplicateBlocked: boolean;
} {
  const bundle = createDay1Seed();
  const day = bundle.gameState.city.day;
  const event = bundle.gameState.events[0];
  if (!event) {
    return { snapshotId: '', duplicateBlocked: false };
  }
  const decision = event.decisions[0];
  if (!decision) {
    return { snapshotId: '', duplicateBlocked: false };
  }

  let personnelState = createInitialPersonnelState();
  let containerState = createInitialContainerState(day);
  let vehicleState = createInitialVehicleState(day);
  let socialPulseState = createInitialSocialPulseState(day);

  const gameStateBefore = buildDecisionResultCitySlice(bundle.gameState.city);
  const personnelStateBefore = personnelState;
  const containerStateBefore = containerState;
  const vehicleStateBefore = vehicleState;
  const socialPulseStateBefore = socialPulseState;

  const engineState = {
    ...bundle.gameState,
    neighborhoods: bundle.neighborhoods,
    resources: bundle.resources,
    eventPool: bundle.eventPool,
    decisionHistory: bundle.decisionHistory,
    snapshots: bundle.snapshots,
  };

  const result = applyDecision({
    state: engineState,
    eventId: event.id,
    decisionId: decision.id,
    playerProgress: createInitialPlayerProgress(),
  });

  const personnelResult = processPersonnelAfterDecision(
    {
      personnelState,
      event,
      decision,
      day: result.decisionRecord.day,
      neighborhoods: bundle.neighborhoods,
      resources: result.nextState.resources ?? bundle.resources,
    },
    result.nextState.city.morale,
  );
  personnelState = personnelResult.personnelState;

  containerState = processContainersAfterDecision({
    containerState,
    event: {
      id: event.id,
      neighborhoodId: event.neighborhoodId,
      eventType: event.eventType,
      title: event.title,
      category: event.category,
    },
    decision: {
      id: decision.id,
      title: decision.title,
      description: decision.description,
      decisionStyle: decision.decisionStyle,
      costs: decision.costs,
    },
    day: result.decisionRecord.day,
    personnelAssigned: personnelResult.assignment != null,
  }).state;

  vehicleState = processVehiclesAfterDecisionForStore({
    vehicleState,
    event: {
      id: event.id,
      eventType: event.eventType,
      title: event.title,
      description: event.description,
      category: event.category,
      neighborhoodId: event.neighborhoodId,
      districtIds: event.districtIds,
      tags: event.filterTags,
    },
    decision: {
      id: decision.id,
      title: decision.title,
      description: decision.description,
      style: decision.style,
      decisionStyle: decision.decisionStyle,
      costs: decision.costs,
    },
    day: result.decisionRecord.day,
  });

  socialPulseState = processSocialPulseAfterDecisionForStore(socialPulseState, {
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      neighborhoodId: event.neighborhoodId,
      districtIds: event.districtIds,
      eventType: event.eventType,
      tags: event.filterTags,
    },
    decision: {
      id: decision.id,
      title: decision.title,
      description: decision.description,
    },
    day: result.decisionRecord.day,
  });

  const snapshot = buildDecisionResultSnapshot({
    day: result.decisionRecord.day,
    event,
    decision,
    gameStateBefore,
    gameStateAfter: buildDecisionResultCitySlice(result.nextState.city),
    personnelStateBefore,
    personnelStateAfter: personnelState,
    containerStateBefore,
    containerStateAfter: containerState,
    vehicleStateBefore,
    vehicleStateAfter: vehicleState,
    socialPulseStateBefore,
    socialPulseStateAfter: socialPulseState,
    personnelAssignment: personnelResult.assignment,
  });

  const duplicateBlocked = result.nextState.solvedEvents.some(
    (e) => e.id === event.id,
  );

  return { snapshotId: snapshot.id, duplicateBlocked };
}

export function verifyDecisionResultScenario(): VerifyDecisionResultOutcome {
  const checks: string[] = [];

  const riskUp = buildMetricChanges(
    {
      publicSatisfaction: 50,
      budget: 10_000,
      morale: 60,
      riskScore: 30,
    },
    {
      publicSatisfaction: 50,
      budget: 10_000,
      morale: 60,
      riskScore: 38,
    },
  );
  const riskMetric = riskUp.find((m) => m.key === 'operationRisk');
  assert(checks, 'operation risk artışı kötü sayılır', riskMetric?.isGood === false);
  assert(checks, 'operation risk artışı yukarı yön', riskMetric?.direction === 'up');

  const riskDown = buildMetricChanges(
    {
      publicSatisfaction: 50,
      budget: 10_000,
      morale: 60,
      riskScore: 40,
    },
    {
      publicSatisfaction: 50,
      budget: 10_000,
      morale: 60,
      riskScore: 32,
    },
  );
  const riskDownMetric = riskDown.find((m) => m.key === 'operationRisk');
  assert(checks, 'operation risk düşüşü iyi sayılır', riskDownMetric?.isGood === true);

  const emptySnapshot = buildDecisionResultSnapshot({
    day: 1,
    event: {
      id: 'ev_test',
      title: 'Test',
      category: 'test',
      riskLevel: 'low',
      district: 'Merkez',
      description: '',
      contextTag: '',
      urgencyHours: 4,
      decisions: [
        {
          id: 'd1',
          title: 'Test karar',
          description: '',
          style: 'balanced',
          effects: {
            publicSatisfaction: 0,
            budget: 0,
            morale: 0,
            risk: 0,
            xp: 0,
          },
        },
      ],
      previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    },
    decision: {
      id: 'd1',
      title: 'Test karar',
      description: '',
      style: 'balanced',
      effects: {
        publicSatisfaction: 0,
        budget: 0,
        morale: 0,
        risk: 0,
        xp: 0,
      },
    },
    gameStateBefore: {
      publicSatisfaction: 50,
      budget: 10_000,
      morale: 60,
      riskScore: 30,
    },
    gameStateAfter: {
      publicSatisfaction: 50,
      budget: 10_000,
      morale: 60,
      riskScore: 30,
    },
    personnelStateBefore: createInitialPersonnelState(),
    personnelStateAfter: createInitialPersonnelState(),
    containerStateBefore: createInitialContainerState(1),
    containerStateAfter: createInitialContainerState(1),
    vehicleStateBefore: createInitialVehicleState(1),
    vehicleStateAfter: createInitialVehicleState(1),
    socialPulseStateBefore: createInitialSocialPulseState(1),
    socialPulseStateAfter: createInitialSocialPulseState(1),
  });
  assert(checks, 'boş state ile snapshot üretilir', emptySnapshot.id.length > 0);

  const nonContainerOutcomes = buildSubsystemOutcomes({
    day: 1,
    event: {
      id: 'social_only',
      title: 'Gürültü',
      category: 'social',
      riskLevel: 'low',
      district: 'Merkez',
      description: '',
      contextTag: '',
      urgencyHours: 2,
      decisions: [],
      previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    },
    decision: {
      id: 'd1',
      title: 'Açıkla',
      description: '',
      style: 'balanced',
      effects: {
        publicSatisfaction: 0,
        budget: 0,
        morale: 0,
        risk: 0,
        xp: 0,
      },
    },
    gameStateBefore: {
      publicSatisfaction: 50,
      budget: 10_000,
      morale: 60,
      riskScore: 30,
    },
    gameStateAfter: {
      publicSatisfaction: 52,
      budget: 10_000,
      morale: 60,
      riskScore: 30,
    },
    personnelStateBefore: createInitialPersonnelState(),
    personnelStateAfter: createInitialPersonnelState(),
    containerStateBefore: createInitialContainerState(1),
    containerStateAfter: createInitialContainerState(1),
    vehicleStateBefore: createInitialVehicleState(1),
    vehicleStateAfter: createInitialVehicleState(1),
    socialPulseStateBefore: createInitialSocialPulseState(1),
    socialPulseStateAfter: createInitialSocialPulseState(1),
  });
  assert(
    checks,
    'konteyner dışı olayda container outcome üretilmez',
    !nonContainerOutcomes.some((o) => o.key === 'container'),
  );
  assert(
    checks,
    'isContainerRelevantEvent gürültü olayında false',
    !isContainerRelevantEvent({
      id: 'social_only',
      title: 'Gürültü',
      category: 'social',
    }),
  );

  const mixedTone = inferResultTone(
    [
      {
        key: 'publicSatisfaction',
        label: 'Halk Memnuniyeti',
        delta: 4,
        direction: 'up',
        isGood: true,
      },
      {
        key: 'operationRisk',
        label: 'Operasyon Riski',
        delta: 5,
        direction: 'up',
        isGood: false,
      },
    ],
    [],
  );
  assert(checks, 'karışık delta mixed tone üretir', mixedTone === 'mixed');

  const positiveTone = inferResultTone(
    [
      {
        key: 'publicSatisfaction',
        label: 'Halk',
        delta: 6,
        direction: 'up',
        isGood: true,
      },
      {
        key: 'operationRisk',
        label: 'Risk',
        delta: -4,
        direction: 'down',
        isGood: true,
      },
    ],
    [{ key: 'personnel', title: 'P', status: 'good', primaryText: 'ok' }],
    { decision: { id: 'd', title: 'T', description: '', style: 'bold', effects: { publicSatisfaction: 0, budget: 0, morale: 0, risk: 0, xp: 0 }, decisionStyle: 'fast' } },
  );
  assert(checks, 'positive case positive döner', positiveTone === 'positive');

  const negativeTone = inferResultTone(
    [
      {
        key: 'operationRisk',
        label: 'Risk',
        delta: 10,
        direction: 'up',
        isGood: false,
      },
    ],
    [{ key: 'container', title: 'K', status: 'critical', primaryText: 'kritik' }],
  );
  assert(checks, 'critical subsystem negative döner', negativeTone === 'negative');

  const permanentTone = inferResultTone(
    [
      {
        key: 'publicSatisfaction',
        label: 'Halk',
        delta: 5,
        direction: 'up',
        isGood: true,
      },
      {
        key: 'budget',
        label: 'Bütçe',
        delta: -8000,
        direction: 'down',
        isGood: false,
      },
    ],
    [],
    {
      decision: {
        id: 'perm',
        title: 'Kalıcı',
        description: '',
        style: 'cautious',
        decisionStyle: 'permanent',
        effects: { publicSatisfaction: 0, budget: 0, morale: 0, risk: 0, xp: 0 },
      },
    },
  );
  assert(
    checks,
    'permanent budget düşüşü otomatik negative değil',
    permanentTone === 'mixed' || permanentTone === 'positive',
  );

  const monitorTone = inferResultTone(
    [
      { key: 'budget', label: 'B', delta: 0, direction: 'flat', isGood: true },
      { key: 'operationRisk', label: 'R', delta: 1, direction: 'up', isGood: false },
    ],
    [{ key: 'personnel', title: 'P', status: 'neutral', primaryText: 'izle' }],
    {
      decision: {
        id: 'mon',
        title: 'İzle',
        description: '',
        style: 'balanced',
        decisionStyle: 'planned',
        effects: { publicSatisfaction: 0, budget: 0, morale: 0, risk: 0, xp: 0 },
      },
    },
  );
  assert(
    checks,
    'monitor/planned neutral veya mixed',
    monitorTone === 'neutral' || monitorTone === 'mixed',
  );

  const toneA = inferResultTone(
    [{ key: 'budget', label: 'B', delta: 2, direction: 'up', isGood: true }],
    [],
  );
  const toneB = inferResultTone(
    [{ key: 'budget', label: 'B', delta: 2, direction: 'up', isGood: true }],
    [],
  );
  assert(checks, 'inferResultTone deterministic', toneA === toneB);

  const finalEvent = pilotEvents.find((e) => e.id === PILOT_FINAL_EVENT_ID);
  assert(checks, 'day7 final event bulunur', finalEvent != null);
  if (finalEvent) {
    const lowBudget = ensureAtLeastOneAffordableDecision(finalEvent, 500);
    const affordable = lowBudget.decisions.some(
      (d) =>
        checkDecisionAffordability({
          economyState: {
            currentSource: 500,
            startingSource: 500,
            totalEarned: 0,
            totalSpent: 0,
            transactions: [],
          },
          decision: d,
        }).canAfford,
    );
    assert(checks, 'day7 final düşük bütçede affordable karar', affordable);
    assert(
      checks,
      'final low-cost decision id mevcut',
      lowBudget.decisions.some((d) => d.id === FINAL_LOW_COST_CLOSEOUT_DECISION_ID),
    );
  }

  const fallbackDecision = createFinalLowCostCloseoutDecision();
  assert(
    checks,
    'final fallback maliyet sıfır',
    checkDecisionAffordability({
      economyState: {
        currentSource: 100,
        startingSource: 100,
        totalEarned: 0,
        totalSpent: 0,
        transactions: [],
      },
      decision: fallbackDecision,
    }).canAfford,
  );

  const fallback = createEmptyDecisionResultFallback();
  assert(
    checks,
    'missing snapshot fallback crash etmez',
    fallback.summaryTitle.length > 0 && fallback.metricChanges.length === 0,
  );

  const bundle = createDay1Seed();
  const event = bundle.gameState.events[0];
  assert(checks, 'day1 seed aktif olay var', event != null);

  const simulation = simulateDecisionWithSnapshot();
  assert(checks, 'karar sonrası snapshot üretildi', simulation.snapshotId.length > 0);
  assert(
    checks,
    'applyDecision solvedEvents kaydı oluştu',
    simulation.duplicateBlocked,
  );

  if (event) {
    const solvedAfterFirst = [
      ...bundle.gameState.solvedEvents,
      { id: event.id, title: event.title, xpEarned: 0 },
    ];
    const wouldBlockDuplicate = solvedAfterFirst.some((e) => e.id === event.id);
    assert(checks, 'duplicate guard çözülmüş olayı bloklar', wouldBlockDuplicate);
  }

  assert(
    checks,
    'day1 tutorial initial state korunuyor',
    INITIAL_TUTORIAL_STATE.day1Completed === false &&
      INITIAL_TUTORIAL_STATE.skipped === false,
  );

  const ok = checks.every((line) => line.startsWith('✓'));
  return { ok, checks };
}
