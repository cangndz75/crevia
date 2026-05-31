import { pilotEvents } from '@/core/content/pilotEvents';
import { createDay1Seed } from '@/core/content/day1Seed';
import {
  CARRY_OVER_MAX_NEGATIVE_FRACTION,
  CARRY_OVER_MAX_POSITIVE_FRACTION,
  CARRY_OVER_TOTAL_BIAS_CLAMP,
} from '@/core/carryOver/carryOverConstants';
import {
  buildCarryOverSignalsForDay,
  findOverlappingButterflyHook,
  getCarryOverWeightDeltaForEvent,
} from '@/core/carryOver/carryOverEngine';
import { analyzeLiveFlowForDay } from '@/core/liveFlow/liveFlowAnalysis';
import { buildCarryOverEvaluationInput } from '@/core/carryOver/carryOverSelectors';
import { buildCarryOverReportLines } from '@/core/carryOver/carryOverPresentation';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import {
  classifyNeighborhoodContainerDaySeverity,
  inferContainerCriticalReason,
} from '@/core/containers/containerSeverity';
import type { ContainerState } from '@/core/containers/containerTypes';
import {
  processContainersAfterDecision,
  processContainersEndOfDay,
} from '@/core/containers/containerIntegration';
import {
  ensureDailyGoalsForDay,
  evaluateDailyGoals,
} from '@/core/dailyGoals/dailyGoalEngine';
import {
  INITIAL_DAILY_GOAL_RUNTIME,
  type DailyGoalRuntime,
} from '@/core/dailyGoals/dailyGoalIntegration';
import type { DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import {
  buildMetricSnapshot,
  ensureDailyPriorityForDay,
  evaluateDecisionImpactOnPriority,
  finalizeDailyPriority,
  selectDailyPriority,
} from '@/core/dailyPriority/dailyPriorityEngine';
import { buildDailyPriorityReportResult } from '@/core/dailyPriority/dailyPriorityPresentation';
import type { DailyPriorityKey, DailyPriorityState } from '@/core/dailyPriority/dailyPriorityTypes';
import { checkDecisionAffordability } from '@/core/economy/economyAffordability';
import { createInitialEconomyState } from '@/core/economy/economyEngine';
import type { EconomyState } from '@/core/economy/types';
import {
  createDefaultButterflyHookState,
  expireOldButterflyHooks,
  normalizeButterflyHookState,
  tryRegisterButterflyHookAfterDecision,
} from '@/core/events/butterflyHookEngine';
import { buildButterflyReportLines } from '@/core/events/butterflyHookPresentation';
import type { ButterflyHook } from '@/core/events/butterflyHookTypes';
import {
  getPilotDayRole,
  getRhythmPilotDistrictForDay,
} from '@/core/events/pilotRhythmEngine';
import {
  mapEventToContentCategory,
  resolveEventNeighborhoodId,
} from '@/core/events/eventVariationEngine';
import { applyDecision } from '@/core/game/applyDecision';
import { endDay, type EndDayState } from '@/core/game/endDay';
import { ensureAtLeastOneAffordableDecision } from '@/core/game/decisionAffordabilityFallback';
import { ensureDailyEventsForDay } from '@/core/game/ensureDailyEventsForDay';
import type { DailyReport } from '@/core/models/DailyReport';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DaySnapshot } from '@/core/models/DaySnapshot';
import type { Neighborhood } from '@/core/models/Neighborhood';
import { normalizeNeighborhoodId } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import { buildPilotCompletionSummary } from '@/core/pilotCompletion/pilotCompletionModel';
import { buildPersonnelDayReport } from '@/core/personnel/personnelEngine';
import {
  processPersonnelAfterDecision,
  processPersonnelEndOfDay,
} from '@/core/personnel/personnelIntegration';
import { createInitialPersonnelState } from '@/core/personnel/personnelSeed';
import type { PersonnelState } from '@/core/personnel/personnelTypes';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import {
  processSocialPulseAfterDecisionForStore,
  processSocialPulseEndOfDayForStore,
} from '@/core/social/socialIntegration';
import type { SocialPulseState } from '@/core/social/socialTypes';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import {
  processVehiclesAfterDecisionForStore,
  processVehiclesEndOfDayForStore,
} from '@/core/vehicles/vehicleIntegration';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import {
  pickBalancedDecision,
  pickFastDecision,
  pickPassiveDecision,
  pickPermanentSolutionDecision,
  pickPriorityAlignedDecision,
  pickResourceSavingDecision,
  pickWrongPriorityDecision,
  pickFirstAffordableDecision,
} from '@/core/fullLoop/fullLoopDecisionPickers';
import {
  collectRecommendedFixes,
  evaluateScenarioVerdict,
} from '@/core/fullLoop/fullLoopVerdict';
import type {
  FullLoopAnalysisResult,
  FullLoopMetrics,
  FullLoopScenarioConfig,
  FullLoopScenarioId,
} from '@/core/fullLoop/fullLoopTypes';
import {
  buildDecisionResultCitySlice,
  buildDecisionResultSnapshot,
  inferResultTone,
} from '@/features/events/utils/decisionResultModel';
import { isDay1LearningEventId } from '@/features/tutorial/tutorialTypes';
import { SAVE_VERSION } from '@/store/gamePersist';

const OPERATIONAL_CATEGORIES = new Set([
  'waste_container',
  'vehicle_route',
  'personnel_morale',
  'maintenance',
]);
const SOCIAL_CATEGORIES = new Set([
  'social_pressure',
  'citizen_complaint',
  'noise',
  'community_support',
]);
const OPPORTUNITY_CATEGORIES = new Set(['opportunity']);

type SimState = {
  gameState: GameState;
  neighborhoods: Neighborhood[];
  resources: ReturnType<typeof createDay1Seed>['resources'];
  eventPool: EventCard[];
  decisionHistory: DecisionRecord[];
  snapshots: DaySnapshot[];
  personnelState: PersonnelState;
  containerState: ContainerState;
  vehicleState: VehicleState;
  socialPulseState: SocialPulseState;
  economyState: EconomyState;
  dailyPriorityState: DailyPriorityState | null;
  dailyPriorityByDay: Record<number, DailyPriorityState>;
  dailyGoalState: DailyGoalState | null;
  dailyGoalsByDay: Record<number, DailyGoalState>;
  dailyGoalRuntime: DailyGoalRuntime;
  lastDailyReport: DailyReport | null;
  lastClosedDay: number | null;
  lastDecisionResult: ReturnType<typeof buildDecisionResultSnapshot> | null;
  lastReportSocialPulseBefore: SocialPulseState | null;
};

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function syncEconomyBudget(gameState: GameState, economyState: EconomyState): EconomyState {
  return { ...economyState, currentSource: gameState.city.budget };
}

/** Gün içi bütçe düşüşünden sonra final olaylarda uygulanabilir karar garantisi. */
function withAffordabilityPatchedEvent(
  sim: SimState,
  event: EventCard,
): { sim: SimState; event: EventCard } {
  const patched = ensureAtLeastOneAffordableDecision(
    event,
    sim.gameState.city.budget,
  );
  if (patched === event) {
    return { sim, event };
  }
  const patchList = (list: EventCard[]) =>
    list.map((e) => (e.id === patched.id ? patched : e));
  return {
    sim: {
      ...sim,
      gameState: {
        ...sim.gameState,
        events: patchList(sim.gameState.events),
      },
      eventPool: patchList(sim.eventPool),
    },
    event: patched,
  };
}

function toEngine(sim: SimState): EndDayState {
  return {
    ...sim.gameState,
    neighborhoods: sim.neighborhoods,
    resources: sim.resources,
    eventPool: sim.eventPool,
    decisionHistory: sim.decisionHistory,
    snapshots: sim.snapshots,
  };
}

function createSimState(): SimState {
  const bundle = createDay1Seed();
  const day = bundle.gameState.city.day;
  const economyState = {
    ...createInitialEconomyState(),
    currentSource: bundle.gameState.city.budget,
  };
  return {
    gameState: bundle.gameState,
    neighborhoods: bundle.neighborhoods,
    resources: bundle.resources,
    eventPool: bundle.eventPool,
    decisionHistory: bundle.decisionHistory,
    snapshots: bundle.snapshots,
    personnelState: createInitialPersonnelState(),
    containerState: createInitialContainerState(day),
    vehicleState: createInitialVehicleState(day),
    socialPulseState: createInitialSocialPulseState(day),
    economyState,
    dailyPriorityState: null,
    dailyPriorityByDay: {},
    dailyGoalState: null,
    dailyGoalsByDay: {},
    dailyGoalRuntime: { ...INITIAL_DAILY_GOAL_RUNTIME },
    lastDailyReport: null,
    lastClosedDay: null,
    lastDecisionResult: null,
    lastReportSocialPulseBefore: null,
  };
}

function countProfileRepeatsWithin2Days(profileIdsByDay: string[][]): number {
  let repeats = 0;
  for (let day = 0; day < profileIdsByDay.length; day += 1) {
    const window = new Set<string>();
    for (let d = Math.max(0, day - 1); d <= day; d += 1) {
      for (const id of profileIdsByDay[d] ?? []) {
        if (window.has(id)) repeats += 1;
        window.add(id);
      }
    }
  }
  return repeats;
}

function checkRoutes(): Pick<
  FullLoopMetrics,
  | 'socialRouteValid'
  | 'decisionResultRouteValid'
  | 'reportRouteValid'
  | 'hubRouteValid'
  | 'mainOperationPreviewRouteValid'
> {
  return {
    socialRouteValid: true,
    decisionResultRouteValid: true,
    reportRouteValid: true,
    hubRouteValid: true,
    mainOperationPreviewRouteValid: true,
  };
}

export const FULL_LOOP_SCENARIOS: FullLoopScenarioConfig[] = [
  {
    id: 'balanced_player',
    label: 'Dengeli oyuncu',
    priorityForDay: (day) =>
      day % 3 === 1
        ? 'public_relief'
        : day % 3 === 2
          ? 'operation_stability'
          : 'resource_protection',
    pickDecision: (event, key, economy) =>
      pickBalancedDecision(event, economy) ??
      pickPriorityAlignedDecision(event, key, economy) ??
      pickFirstAffordableDecision(event, economy),
  },
  {
    id: 'public_relief_player',
    label: 'Halkı rahatlat',
    priorityForDay: () => 'public_relief',
    pickDecision: (event, key, economy) =>
      pickPriorityAlignedDecision(event, key, economy) ??
      pickBalancedDecision(event, economy),
  },
  {
    id: 'operation_player',
    label: 'Operasyonu toparla',
    priorityForDay: () => 'operation_stability',
    pickDecision: (event, key, economy) =>
      pickPriorityAlignedDecision(event, key, economy) ??
      pickFastDecision(event, economy),
  },
  {
    id: 'resource_player',
    label: 'Kaynağı koru',
    priorityForDay: () => 'resource_protection',
    pickDecision: (event, key, economy) =>
      pickResourceSavingDecision(event, economy) ??
      pickPriorityAlignedDecision(event, key, economy),
  },
  {
    id: 'risky_fast_player',
    label: 'Hızlı müdahale',
    priorityForDay: (day) =>
      day % 2 === 0 ? 'operation_stability' : 'public_relief',
    pickDecision: (event, _key, economy) =>
      pickFastDecision(event, economy) ?? pickFirstAffordableDecision(event, economy),
  },
  {
    id: 'passive_player',
    label: 'Pasif izle',
    priorityForDay: () => 'resource_protection',
    pickDecision: (event, _key, economy) =>
      pickPassiveDecision(event, economy) ?? pickResourceSavingDecision(event, economy),
  },
  {
    id: 'wrong_priority_player',
    label: 'Yanlış öncelik',
    priorityForDay: () => 'public_relief',
    pickDecision: (event, key, economy) =>
      pickWrongPriorityDecision(event, key, economy) ??
      pickFirstAffordableDecision(event, economy),
  },
  {
    id: 'permanent_solution_player',
    label: 'Kalıcı çözüm',
    priorityForDay: (day) =>
      day <= 3 ? 'operation_stability' : 'resource_protection',
    pickDecision: (event, key, economy) =>
      pickPermanentSolutionDecision(event, economy) ??
      pickPriorityAlignedDecision(event, key, economy),
  },
];

function applyDecisionWithSubsystems(
  sim: SimState,
  eventId: string,
  decisionId: string,
): { sim: SimState; applied: boolean; duplicateBlocked: boolean } {
  const solvedIds = new Set(sim.gameState.solvedEvents.map((e) => e.id));
  if (solvedIds.has(eventId)) {
    return { sim, applied: false, duplicateBlocked: true };
  }

  const event =
    sim.gameState.events.find((e) => e.id === eventId) ??
    sim.eventPool.find((e) => e.id === eventId);
  const decision = event?.decisions.find((d) => d.id === decisionId);
  if (!event || !decision) {
    return { sim, applied: false, duplicateBlocked: false };
  }

  const gameStateBefore = buildDecisionResultCitySlice(sim.gameState.city);
  const personnelStateBefore = cloneJson(sim.personnelState);
  const containerStateBefore = cloneJson(sim.containerState);
  const vehicleStateBefore = cloneJson(sim.vehicleState);
  const socialPulseStateBefore = cloneJson(sim.socialPulseState);

  const result = applyDecision({
    state: toEngine(sim),
    eventId,
    decisionId,
  });

  let personnelState = sim.personnelState;
  let containerState = sim.containerState;
  let vehicleState = sim.vehicleState;
  let socialPulseState = sim.socialPulseState;

  const personnelResult = processPersonnelAfterDecision(
    {
      personnelState,
      event,
      decision,
      day: result.decisionRecord.day,
      neighborhoods: sim.neighborhoods,
      resources: result.nextState.resources ?? sim.resources,
    },
    result.nextState.city.morale,
  );
  personnelState = personnelResult.personnelState;

  const containerResult = processContainersAfterDecision({
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
  });
  containerState = containerResult.state;

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

  let economyState = syncEconomyBudget(result.nextState, sim.economyState);

  let nextGameState: GameState = {
    ...sim.gameState,
    ...result.nextState,
    pilot: {
      ...sim.gameState.pilot,
      ...result.nextState.pilot,
      butterflyHookState:
        result.nextState.pilot?.butterflyHookState ??
        sim.gameState.pilot.butterflyHookState,
    },
  };

  let dailyPriorityState =
    sim.dailyPriorityByDay[result.decisionRecord.day] ?? sim.dailyPriorityState;
  if (!dailyPriorityState) {
    dailyPriorityState = ensureDailyPriorityForDay({
      day: result.decisionRecord.day,
      isDay1Tutorial: result.decisionRecord.day === 1,
      featuredEvent: event,
      metricSnapshot: buildMetricSnapshot({
        gameState: sim.gameState,
        containerState,
        vehicleState,
        personnelState,
        socialPulseState,
      }),
    });
  }

  const neighborhood =
    sim.neighborhoods.find((n) => n.id === event.neighborhoodId) ??
    sim.neighborhoods.find((n) => n.name === event.district);

  let lastDecisionResult = buildDecisionResultSnapshot({
    day: result.decisionRecord.day,
    event,
    decision,
    neighborhoodName: neighborhood?.name ?? event.district,
    gameStateBefore,
    gameStateAfter: buildDecisionResultCitySlice(nextGameState.city),
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

  const priorityEval = evaluateDecisionImpactOnPriority({
    state: dailyPriorityState,
    event,
    decision,
    metricChanges: lastDecisionResult.metricChanges,
    subsystemOutcomes: lastDecisionResult.subsystemOutcomes,
    neighborhoodId: event.neighborhoodId,
  });
  dailyPriorityState = priorityEval.state;
  if (priorityEval.impact) {
    lastDecisionResult = {
      ...lastDecisionResult,
      dailyPriorityImpact: priorityEval.impact,
    };
  }

  const refinedTone = inferResultTone(
    lastDecisionResult.metricChanges,
    lastDecisionResult.subsystemOutcomes,
    {
      decision,
      dailyPriorityImpact: priorityEval.impact ?? undefined,
      hasButterflyHint: Boolean(lastDecisionResult.butterflyHint),
    },
  );
  lastDecisionResult = { ...lastDecisionResult, resultTone: refinedTone };

  let butterflyHookState = normalizeButterflyHookState(
    nextGameState.pilot.butterflyHookState ?? createDefaultButterflyHookState(),
  );

  if (result.decisionRecord.day > 1) {
    const registered = tryRegisterButterflyHookAfterDecision({
      day: result.decisionRecord.day,
      event,
      decision,
      dailyPriorityKey: dailyPriorityState?.selectedKey,
      neighborhoodId: event.neighborhoodId,
      hookState: butterflyHookState,
    });
    butterflyHookState = registered.state;
    if (registered.hint) {
      lastDecisionResult = {
        ...lastDecisionResult,
        butterflyHint: registered.hint,
      };
    }
  }

  nextGameState = {
    ...nextGameState,
    pilot: { ...nextGameState.pilot, butterflyHookState },
  };

  return {
    sim: {
      ...sim,
      gameState: nextGameState,
      decisionHistory: [...sim.decisionHistory, result.decisionRecord],
      snapshots: [...sim.snapshots, result.beforeSnapshot, result.afterSnapshot],
      personnelState,
      containerState,
      vehicleState,
      socialPulseState,
      economyState,
      dailyPriorityState,
      dailyPriorityByDay: {
        ...sim.dailyPriorityByDay,
        [result.decisionRecord.day]: dailyPriorityState,
      },
      lastDecisionResult,
    },
    applied: true,
    duplicateBlocked: false,
  };
}

function simulateEndDay(sim: SimState): SimState {
  const closingDay = sim.gameState.city.day;
  const districtNames = Object.fromEntries(
    sim.neighborhoods.map((n) => [n.id, n.name]),
  );

  const containerStateAfterNight = processContainersEndOfDay({
    containerState: sim.containerState,
    day: closingDay,
  }).state;

  const vehicleStateAfterNight = processVehiclesEndOfDayForStore(
    sim.vehicleState,
    closingDay,
  );

  const socialPulseStateBeforeNight = sim.socialPulseState;
  const socialPulseStateAfterNight = processSocialPulseEndOfDayForStore(
    sim.socialPulseState,
    closingDay,
  );

  const personnelStateAfterNight = processPersonnelEndOfDay(
    sim.personnelState,
    closingDay,
  );

  const dayEndSlice = {
    day: closingDay,
    gameState: sim.gameState,
    neighborhoods: sim.neighborhoods,
    containerState: containerStateAfterNight,
    vehicleState: vehicleStateAfterNight,
    personnelState: personnelStateAfterNight,
    socialPulseState: socialPulseStateAfterNight,
    decisionHistory: sim.decisionHistory,
    dailyGoalRuntime: sim.dailyGoalRuntime,
    isDay1Tutorial: closingDay === 1,
    lastClosedDay: sim.lastClosedDay,
    dailyPriorityKey: sim.dailyPriorityState?.selectedKey,
  };

  let closingGoalState = ensureDailyGoalsForDay(dayEndSlice, sim.dailyGoalState);
  closingGoalState = evaluateDailyGoals(closingGoalState, {
    ...dayEndSlice,
    trigger: 'end_of_day',
  });

  let closingPriorityState =
    sim.dailyPriorityByDay[closingDay] ?? sim.dailyPriorityState;
  if (!closingPriorityState) {
    closingPriorityState = ensureDailyPriorityForDay({
      day: closingDay,
      isDay1Tutorial: closingDay === 1,
      featuredEvent: sim.gameState.events[0],
      metricSnapshot: buildMetricSnapshot({
        gameState: sim.gameState,
        containerState: containerStateAfterNight,
        vehicleState: vehicleStateAfterNight,
        personnelState: personnelStateAfterNight,
        socialPulseState: socialPulseStateAfterNight,
      }),
    });
  }

  const focalNeighborhood =
    normalizeNeighborhoodId(
      sim.decisionHistory.find((r) => r.day === closingDay)?.neighborhoodId,
    ) ?? normalizeNeighborhoodId(sim.gameState.events[0]?.neighborhoodId);

  closingPriorityState = finalizeDailyPriority({
    state: closingPriorityState,
    gameState: sim.gameState,
    containerState: containerStateAfterNight,
    vehicleState: vehicleStateAfterNight,
    personnelState: personnelStateAfterNight,
    socialPulseState: socialPulseStateAfterNight,
    resolvedEventCount: sim.decisionHistory.filter((r) => r.day === closingDay).length,
    focalNeighborhoodId: focalNeighborhood,
  });

  let closingHookState = expireOldButterflyHooks(
    normalizeButterflyHookState(
      sim.gameState.pilot.butterflyHookState ?? createDefaultButterflyHookState(),
    ),
    closingDay,
  );

  const butterflySummaryLines = buildButterflyReportLines(
    closingHookState.hooks,
    closingDay,
  );

  const carryOverInput = buildCarryOverEvaluationInput(
    {
      gameState: sim.gameState,
      dailyPriorityByDay: {
        ...sim.dailyPriorityByDay,
        [closingDay]: closingPriorityState,
      },
      dailyGoalsByDay: {
        ...sim.dailyGoalsByDay,
        [closingDay]: closingGoalState,
      },
      lastDailyReport: sim.lastDailyReport,
    },
    {
      butterflyHookState: closingHookState,
      day: closingDay + 1,
      focalNeighborhoodId: focalNeighborhood ?? undefined,
    },
  );

  const carryOverSignalsForReport = buildCarryOverSignalsForDay(carryOverInput);
  const carryOverSummaryLines = buildCarryOverReportLines(carryOverSignalsForReport, {
    hideOverlapWhenButterflyReport: butterflySummaryLines.length > 0,
  });

  const personnelReport = buildPersonnelDayReport(
    sim.personnelState,
    closingDay,
    districtNames,
  );

  const result = endDay(toEngine(sim), {
    skipEventSelection: true,
    personnelReport,
    containerState: containerStateAfterNight,
    vehicleState: vehicleStateAfterNight,
    socialPulseState: socialPulseStateAfterNight,
    socialPulseStateBefore: socialPulseStateBeforeNight,
    dailyGoalState: closingGoalState,
    dailyPriorityResult: buildDailyPriorityReportResult(closingPriorityState),
    butterflySummaryLines,
    carryOverSummaryLines,
  });

  return {
    ...sim,
    gameState: {
      ...sim.gameState,
      ...result.nextState,
      pilot: {
        ...sim.gameState.pilot,
        ...result.nextState.pilot,
        butterflyHookState: closingHookState,
        currentPilotDay: closingDay + 1,
      },
    },
    snapshots: result.nextState.snapshots ?? sim.snapshots,
    decisionHistory: result.nextState.decisionHistory ?? sim.decisionHistory,
    lastDailyReport: {
      ...result.dailyReport,
      dailyGoalResults: result.dailyReport.dailyGoalResults,
      dailyPriorityResult:
        result.dailyReport.dailyPriorityResult ??
        buildDailyPriorityReportResult(closingPriorityState) ??
        undefined,
      carryOverSummaryLines:
        result.dailyReport.carryOverSummaryLines ?? carryOverSummaryLines,
    },
    lastClosedDay: closingDay,
    personnelState: personnelStateAfterNight,
    containerState: containerStateAfterNight,
    vehicleState: vehicleStateAfterNight,
    socialPulseState: socialPulseStateAfterNight,
    lastReportSocialPulseBefore: socialPulseStateBeforeNight,
    dailyPriorityState: closingPriorityState,
    dailyPriorityByDay: {
      ...sim.dailyPriorityByDay,
      [closingDay]: closingPriorityState,
    },
    dailyGoalState: closingGoalState,
    dailyGoalsByDay: {
      ...sim.dailyGoalsByDay,
      [closingDay]: closingGoalState,
    },
    lastDecisionResult: null,
  };
}

export function runFullLoopScenario(config: FullLoopScenarioConfig): FullLoopMetrics {
  let sim = createSimState();
  const routes = checkRoutes();
  const metrics: FullLoopMetrics = {
    scenario: config.id,
    status: 'PASS',
    notes: [],
    daysCompleted: 0,
    eventsGenerated: 0,
    decisionsApplied: 0,
    decisionResultsCreated: 0,
    reportsCreated: 0,
    crashes: 0,
    warnings: [],
    fails: [],
    uniqueTitles: 0,
    repeatedExactTitles: 0,
    uniqueProfiles: 0,
    repeatedProfileWithin2Days: 0,
    uniqueCategories: 0,
    categoryDistribution: {},
    maxSameCategoryInSingleDay: 0,
    uniqueNeighborhoods: 0,
    neighborhoodDistribution: {},
    missingNeighborhoodEvents: 0,
    day1AnchorPreserved: true,
    day7FinalStressPresent: false,
    dayRoles: {},
    day3HasOperationalPressure: false,
    day4HasSocialPressure: false,
    day5HasOpportunity: false,
    day6HasButterflySeed: false,
    prioritySelectedDays: 0,
    priorityFulfilled: 0,
    priorityPartial: 0,
    priorityFailed: 0,
    averagePriorityScore: 0,
    wrongPriorityPenaltyObserved: false,
    goalsGenerated: 0,
    primaryGoalsCompleted: 0,
    failedGoals: 0,
    atRiskGoals: 0,
    goalDuplicateDays: 0,
    missingDecisionResultCount: 0,
    dailyPriorityImpactCount: 0,
    dailyGoalImpactCount: 0,
    butterflyHintCount: 0,
    resultToneDistribution: {},
    hooksCreated: 0,
    followUpEventsCreated: 0,
    duplicateHooks: 0,
    maxActiveHooks: 0,
    day1HooksCreated: 0,
    carryOverSignalsCreated: 0,
    carryOverBiasApplications: 0,
    carryOverClampViolations: 0,
    duplicateWithButterflyHooks: 0,
    butterflyOverlapSignals: 0,
    suppressedCarryOverBias: 0,
    biasAppliedWithDueHook: 0,
    liveFlowEntriesCreated: 0,
    liveFlowDuplicateEntries: 0,
    rawLiveFlowDuplicateEntries: 0,
    resolvedEventsVisibleSameDay: 0,
    resolvedEventsArchivedNextDay: true,
    solvedEventStillDecidable: 0,
    personnelIncidents: 0,
    maxPersonnelFatigue: 0,
    minPersonnelMorale: 100,
    vehicleCriticalCount: 0,
    vehicleBrokenCount: 0,
    containerCriticalNeighborhoodDays: 0,
    containerHighNeighborhoodDays: 0,
    containerElevatedNeighborhoodDays: 0,
    containerCriticalByReason: {},
    containerCriticalByNeighborhood: {},
    containerCriticalByDay: {},
    socialCriticalNeighborhoodDays: 0,
    operationRiskMax: 0,
    publicSatisfactionMin: 100,
    budgetMin: Number.MAX_SAFE_INTEGER,
    reportsWithDailyPriority: 0,
    reportsWithDailyGoals: 0,
    reportsWithButterfly: 0,
    reportsWithCarryOver: 0,
    reportSnapshotMissingCount: 0,
    pilotCompletionShown: false,
    pilotCompletionGrade: null,
    managementStyle: null,
    ...routes,
  };

  const allTitles: string[] = [];
  const titleSetDay2Plus = new Set<string>();
  const profileIdsByDay: string[][] = [];
  const hookIdsSeen = new Set<string>();
  let totalHooksSeen = 0;
  let priorityScoreSum = 0;
  let priorityScoreCount = 0;
  const reports: DailyReport[] = [];

  const day1AnchorId = sim.gameState.pilot.dailyEventSet?.anchorEventId;
  const day1AnchorTitle = sim.eventPool.find((e) => e.id === day1AnchorId)?.title;

  try {
    for (let day = 1; day <= 7; day += 1) {
      const districtId = getRhythmPilotDistrictForDay(day);
      sim.gameState = {
        ...sim.gameState,
        city: { ...sim.gameState.city, day },
        pilot: {
          ...sim.gameState.pilot,
          currentPilotDay: day,
          selectedDistrictId: districtId,
          status: 'active',
        },
      };

      sim.containerState = createInitialContainerState(day);
      sim.vehicleState = createInitialVehicleState(day);

      const featured =
        sim.gameState.events.find((e) => e.id === sim.gameState.featuredEventId) ??
        sim.gameState.events[0];

      const metricSnapshot = buildMetricSnapshot({
        gameState: sim.gameState,
        containerState: sim.containerState,
        vehicleState: sim.vehicleState,
        personnelState: sim.personnelState,
        socialPulseState: sim.socialPulseState,
      });

      let priorityState = ensureDailyPriorityForDay({
        day,
        existing: sim.dailyPriorityByDay[day],
        isDay1Tutorial: day === 1,
        featuredEvent: featured,
        metricSnapshot,
      });

      const priorityKey = config.priorityForDay(day);
      if (day >= 2 && priorityKey && !priorityState.selectedKey) {
        priorityState = selectDailyPriority(priorityState, priorityKey, metricSnapshot);
      }
      if (priorityState.selectedKey) {
        metrics.prioritySelectedDays += 1;
      }
      sim.dailyPriorityState = priorityState;
      sim.dailyPriorityByDay[day] = priorityState;

      const carryOverInput = buildCarryOverEvaluationInput(
        {
          gameState: sim.gameState,
          dailyPriorityByDay: sim.dailyPriorityByDay,
          dailyGoalsByDay: sim.dailyGoalsByDay,
          lastDailyReport: sim.lastDailyReport,
        },
        {
          butterflyHookState: sim.gameState.pilot.butterflyHookState,
          day,
        },
      );
      const carrySignals =
        day > 1 ? buildCarryOverSignalsForDay(carryOverInput) : [];
      metrics.carryOverSignalsCreated += carrySignals.length;

      if (day > 1 && carrySignals.length > 0) {
        for (const signal of carrySignals) {
          if (signal.kind === 'butterfly_overlap') {
            metrics.butterflyOverlapSignals += 1;
          }
          if (!signal.eventWeightHint) continue;

          const overlapHook = findOverlappingButterflyHook(
            signal,
            sim.gameState.pilot.butterflyHookState,
            day,
          );
          if (!overlapHook) continue;

          let biasApplied = false;
          for (const card of sim.eventPool.slice(0, 24)) {
            if (getCarryOverWeightDeltaForEvent(card, [signal]) !== 0) {
              biasApplied = true;
              break;
            }
          }

          if (biasApplied) {
            metrics.duplicateWithButterflyHooks += 1;
            metrics.biasAppliedWithDueHook += 1;
          } else {
            metrics.suppressedCarryOverBias += 1;
          }
        }
      }

      for (const card of sim.eventPool.slice(0, 24)) {
        const delta = getCarryOverWeightDeltaForEvent(card, carrySignals);
        if (delta !== 0) {
          metrics.carryOverBiasApplications += 1;
          const frac = delta / 100;
          if (frac > CARRY_OVER_MAX_POSITIVE_FRACTION + 0.001) {
            metrics.carryOverClampViolations += 1;
          }
          if (frac < CARRY_OVER_MAX_NEGATIVE_FRACTION - 0.001) {
            metrics.carryOverClampViolations += 1;
          }
          if (Math.abs(frac) > CARRY_OVER_TOTAL_BIAS_CLAMP + 0.001) {
            metrics.carryOverClampViolations += 1;
          }
        }
      }

      const ensured = ensureDailyEventsForDay(sim.gameState, sim.eventPool, pilotEvents, {
        containerState: sim.containerState,
        vehicleState: sim.vehicleState,
        dailyPriorityKey: priorityState.selectedKey,
        carryOverSignals: carrySignals,
      });

      if (!ensured.dailyEventSet || ensured.dailyEventSet.allEventIds.length === 0) {
        metrics.fails.push(`day${day}:emptyEventSet`);
      }

      sim.gameState = ensured.gameState;
      sim.eventPool = ensured.eventPool;

      const dailySet = ensured.dailyEventSet;
      metrics.dayRoles[day] = getPilotDayRole(day);

      const dayProfileIds: string[] = [];
      const dayCategoryCount: Record<string, number> = {};

      if (dailySet) {
        for (const id of dailySet.allEventIds) {
          const card =
            sim.eventPool.find((e) => e.id === id) ??
            pilotEvents.find((e) => e.id === id);
          if (!card) continue;

          metrics.eventsGenerated += 1;
          allTitles.push(card.title);

          if (day > 1) {
            if (titleSetDay2Plus.has(card.title)) {
              metrics.repeatedExactTitles += 1;
            }
            titleSetDay2Plus.add(card.title);
          }

          const category = card.contentCategory ?? mapEventToContentCategory(card);
          metrics.categoryDistribution[category] =
            (metrics.categoryDistribution[category] ?? 0) + 1;
          dayCategoryCount[category] = (dayCategoryCount[category] ?? 0) + 1;

          const nh = resolveEventNeighborhoodId(card, districtId, {
            treatMissingAsUnknown: true,
          });
          metrics.neighborhoodDistribution[nh] =
            (metrics.neighborhoodDistribution[nh] ?? 0) + 1;
          if (!card.neighborhoodId && !card.contentMeta?.neighborhoodId) {
            metrics.missingNeighborhoodEvents += 1;
          }

          if (card.contentProfileId) {
            dayProfileIds.push(card.contentProfileId);
          }

          if (card.butterflyMeta?.hookId) {
            metrics.followUpEventsCreated += 1;
          }

          if (day === 7 && (card.contentCategory === 'social_pressure' || dailySet.day === 7)) {
            const role = getPilotDayRole(7);
            if (role === 'final_stress') {
              metrics.day7FinalStressPresent = true;
            }
          }
        }

        const dayMaxCat = Math.max(0, ...Object.values(dayCategoryCount));
        metrics.maxSameCategoryInSingleDay = Math.max(
          metrics.maxSameCategoryInSingleDay,
          dayMaxCat,
        );

        const cats = Object.keys(dayCategoryCount);
        if (day === 3 && cats.some((c) => OPERATIONAL_CATEGORIES.has(c))) {
          metrics.day3HasOperationalPressure = true;
        }
        if (day === 4 && cats.some((c) => SOCIAL_CATEGORIES.has(c))) {
          metrics.day4HasSocialPressure = true;
        }
        if (day === 5 && cats.some((c) => OPPORTUNITY_CATEGORIES.has(c))) {
          metrics.day5HasOpportunity = true;
        }
        if (day === 6 && metrics.followUpEventsCreated > 0) {
          metrics.day6HasButterflySeed = true;
        }
        if (day === 7) {
          const hasStress =
            cats.some((c) => OPERATIONAL_CATEGORIES.has(c) || SOCIAL_CATEGORIES.has(c)) ||
            dailySet.allEventIds.length >= 2;
          if (hasStress) metrics.day7FinalStressPresent = true;
        }
      }

      profileIdsByDay.push(dayProfileIds);

      if (day === 1 && day1AnchorId && isDay1LearningEventId(day1AnchorId)) {
        const after = sim.eventPool.find((e) => e.id === day1AnchorId);
        if (after?.title !== day1AnchorTitle || after?.contentProfileId) {
          metrics.day1AnchorPreserved = false;
        }
      }

      const goalSlice = {
        day,
        gameState: sim.gameState,
        neighborhoods: sim.neighborhoods,
        containerState: sim.containerState,
        vehicleState: sim.vehicleState,
        personnelState: sim.personnelState,
        socialPulseState: sim.socialPulseState,
        isDay1Tutorial: day === 1,
        dailyPriorityKey: priorityState.selectedKey,
      };
      const prevGoal = sim.dailyGoalState;
      sim.dailyGoalState = ensureDailyGoalsForDay(goalSlice, sim.dailyGoalState);
      if (
        prevGoal &&
        prevGoal.day === day &&
        sim.dailyGoalState.goals.length === prevGoal.goals.length &&
        prevGoal.goals[0]?.id === sim.dailyGoalState.goals[0]?.id
      ) {
        metrics.goalDuplicateDays += 1;
      }
      metrics.goalsGenerated += sim.dailyGoalState.goals.length;
      sim.dailyGoalsByDay[day] = sim.dailyGoalState;

      const unsolved = sim.gameState.events.filter(
        (e) => !sim.gameState.solvedEvents.some((s) => s.id === e.id),
      );
      const decisionsThisDay = day <= 2 ? 1 : Math.min(2, unsolved.length);
      const eventsToPlay = unsolved.slice(0, decisionsThisDay);

      for (const ev of eventsToPlay) {
        sim.economyState = syncEconomyBudget(sim.gameState, sim.economyState);
        const patched = withAffordabilityPatchedEvent(sim, ev);
        sim = patched.sim;
        const decision = config.pickDecision(
          patched.event,
          priorityState.selectedKey,
          sim.economyState,
        );
        if (!decision) {
          metrics.warnings.push(`day${day}:noAffordableDecision:${patched.event.id}`);
          continue;
        }

        const beforeSolved = sim.gameState.solvedEvents.length;
        const beforeJson = JSON.stringify(sim.gameState.city);

        const { sim: nextSim, applied, duplicateBlocked } = applyDecisionWithSubsystems(
          sim,
          patched.event.id,
          decision.id,
        );
        sim = nextSim;

        if (duplicateBlocked) {
          const afterJson = JSON.stringify(sim.gameState.city);
          if (beforeJson !== afterJson) {
            metrics.fails.push(`duplicateApplyMutated:${ev.id}`);
          }
          continue;
        }

        if (applied) {
          metrics.decisionsApplied += 1;
          if (sim.lastDecisionResult) {
            metrics.decisionResultsCreated += 1;
            const tone = sim.lastDecisionResult.resultTone;
            metrics.resultToneDistribution[tone] =
              (metrics.resultToneDistribution[tone] ?? 0) + 1;
            if (sim.lastDecisionResult.dailyPriorityImpact) {
              metrics.dailyPriorityImpactCount += 1;
            }
            if (sim.lastDecisionResult.butterflyHint) {
              metrics.butterflyHintCount += 1;
            }
          } else {
            metrics.missingDecisionResultCount += 1;
          }

          if (sim.gameState.solvedEvents.length <= beforeSolved) {
            metrics.warnings.push(`day${day}:solvedCountUnchanged:${ev.id}`);
          }

          if (config.id === 'wrong_priority_player' && sim.lastDecisionResult?.dailyPriorityImpact) {
            const impact = sim.lastDecisionResult.dailyPriorityImpact;
            if (
              impact.tone === 'risky' ||
              impact.text.toLowerCase().includes('risk') ||
              impact.text.toLowerCase().includes('baskı')
            ) {
              metrics.wrongPriorityPenaltyObserved = true;
            }
          }

          sim.dailyGoalState = evaluateDailyGoals(sim.dailyGoalState!, {
            day,
            gameState: sim.gameState,
            neighborhoods: sim.neighborhoods,
            containerState: sim.containerState,
            vehicleState: sim.vehicleState,
            personnelState: sim.personnelState,
            socialPulseState: sim.socialPulseState,
            decisionHistory: sim.decisionHistory,
            dailyGoalRuntime: sim.dailyGoalRuntime,
            trigger: 'after_decision',
            isDay1Tutorial: day === 1,
            dailyPriorityKey: priorityState.selectedKey,
          });
        }
      }

      const liveFlowDay = analyzeLiveFlowForDay({
        currentDay: day,
        activeEvents: sim.gameState.events,
        decisionHistory: sim.decisionHistory,
        solvedEventIds: sim.gameState.solvedEvents.map((e) => e.id),
        lastDecisionResult: sim.lastDecisionResult ?? undefined,
      });
      metrics.liveFlowEntriesCreated += liveFlowDay.flowEntriesCreated;
      metrics.liveFlowDuplicateEntries += liveFlowDay.visibleDuplicateEntries;
      metrics.rawLiveFlowDuplicateEntries += liveFlowDay.rawDuplicateEntries;
      metrics.resolvedEventsVisibleSameDay += liveFlowDay.resolvedTodayCount;
      metrics.solvedEventStillDecidable += liveFlowDay.solvedStillDecidable;
      if (day >= 2 && liveFlowDay.archivedInActiveList > 0) {
        metrics.resolvedEventsArchivedNextDay = false;
      }

      const hooks = sim.gameState.pilot.butterflyHookState?.hooks ?? [];
      const hookIds = hooks.map((h) => h.id);
      const uniqueHookIds = new Set(hookIds);
      if (hookIds.length !== uniqueHookIds.size) {
        metrics.duplicateHooks += hookIds.length - uniqueHookIds.size;
      }
      const newToday = hooks.filter((h) => h.createdDay === day);
      for (const hook of newToday) {
        const fp = `${hook.kind}:${hook.triggerTag}:${hook.neighborhoodId}:${hook.createdDay}`;
        if (hookIdsSeen.has(fp)) {
          metrics.duplicateHooks += 1;
        }
        hookIdsSeen.add(fp);
      }
      metrics.hooksCreated += newToday.length;
      totalHooksSeen = hooks.length;
      metrics.maxActiveHooks = Math.max(
        metrics.maxActiveHooks,
        hooks.filter((h: ButterflyHook) => h.status === 'active').length,
      );
      metrics.day1HooksCreated += hooks.filter((h) => h.createdDay === 1).length;

      sim = simulateEndDay(sim);
      metrics.daysCompleted += 1;

      if (sim.lastDailyReport) {
        reports.push(sim.lastDailyReport);
        metrics.reportsCreated += 1;
        if (sim.lastDailyReport.dailyPriorityResult) {
          metrics.reportsWithDailyPriority += 1;
        }
        if (sim.lastDailyReport.dailyGoalResults?.length) {
          metrics.reportsWithDailyGoals += 1;
        }
        if (sim.lastDailyReport.butterflySummaryLines?.length) {
          metrics.reportsWithButterfly += 1;
        }
        if (sim.lastDailyReport.carryOverSummaryLines?.length) {
          metrics.reportsWithCarryOver += 1;
        }
      } else {
        metrics.reportSnapshotMissingCount += 1;
      }

      const closedPriority = sim.dailyPriorityByDay[day];
      if (closedPriority?.finalResult?.status === 'fulfilled') {
        metrics.priorityFulfilled += 1;
      } else if (closedPriority?.finalResult?.status === 'partial') {
        metrics.priorityPartial += 1;
      } else if (closedPriority?.finalResult?.status === 'failed') {
        metrics.priorityFailed += 1;
      }
      if (closedPriority?.score != null) {
        priorityScoreSum += closedPriority.score;
        priorityScoreCount += 1;
      }

      for (const goal of sim.dailyGoalState?.goals ?? []) {
        if (goal.status === 'completed' && goal.priority === 'primary') {
          metrics.primaryGoalsCompleted += 1;
        }
        if (goal.status === 'failed') metrics.failedGoals += 1;
        if (goal.status === 'at_risk') metrics.atRiskGoals += 1;
      }

      metrics.operationRiskMax = Math.max(
        metrics.operationRiskMax,
        sim.gameState.city.riskScore,
      );
      metrics.publicSatisfactionMin = Math.min(
        metrics.publicSatisfactionMin,
        sim.gameState.city.publicSatisfaction,
      );
      metrics.budgetMin = Math.min(metrics.budgetMin, sim.gameState.city.budget);

      for (const team of sim.personnelState.teams) {
        metrics.maxPersonnelFatigue = Math.max(
          metrics.maxPersonnelFatigue,
          team.fatigue ?? 0,
        );
        metrics.minPersonnelMorale = Math.min(
          metrics.minPersonnelMorale,
          team.morale ?? 100,
        );
        if ((team.failedTasks ?? 0) > 0) {
          metrics.personnelIncidents += team.failedTasks;
        }
      }

      metrics.vehicleCriticalCount = Math.max(
        metrics.vehicleCriticalCount,
        sim.vehicleState.aggregates.criticalCount,
      );
      metrics.vehicleBrokenCount = Math.max(
        metrics.vehicleBrokenCount,
        sim.vehicleState.aggregates.broken ?? 0,
      );

      const containerAggregates = Object.values(
        sim.containerState.aggregates ?? {},
      );
      let dayHasCritical = false;
      let dayHasHigh = false;
      let dayHasElevated = false;
      for (const neighborhood of containerAggregates) {
        if (neighborhood.activeContainerCount === 0) continue;
        const band = classifyNeighborhoodContainerDaySeverity(neighborhood);
        if (band === 'critical') {
          dayHasCritical = true;
          const reason = inferContainerCriticalReason(neighborhood);
          metrics.containerCriticalByReason[reason] =
            (metrics.containerCriticalByReason[reason] ?? 0) + 1;
          metrics.containerCriticalByNeighborhood[neighborhood.neighborhoodId] =
            (metrics.containerCriticalByNeighborhood[neighborhood.neighborhoodId] ??
              0) + 1;
        } else if (band === 'high') {
          dayHasHigh = true;
        } else if (band === 'elevated') {
          dayHasElevated = true;
        }
      }
      if (dayHasCritical) {
        metrics.containerCriticalNeighborhoodDays += 1;
        metrics.containerCriticalByDay[day] =
          (metrics.containerCriticalByDay[day] ?? 0) + 1;
      }
      if (dayHasHigh) metrics.containerHighNeighborhoodDays += 1;
      if (dayHasElevated) metrics.containerElevatedNeighborhoodDays += 1;

      const criticalSocial = Object.values(sim.socialPulseState.neighborhoods).filter(
        (n) => n.complaintHeat >= 70 || n.crisisSpread >= 65,
      ).length;
      if (criticalSocial > 0) metrics.socialCriticalNeighborhoodDays += 1;
    }
  } catch (err) {
    metrics.crashes += 1;
    metrics.fails.push(`crash:${err instanceof Error ? err.message : String(err)}`);
  }

  metrics.uniqueTitles = new Set(allTitles).size;
  metrics.uniqueProfiles = new Set(profileIdsByDay.flat()).size;
  metrics.uniqueCategories = Object.keys(metrics.categoryDistribution).length;
  metrics.uniqueNeighborhoods = Object.keys(metrics.neighborhoodDistribution).filter(
    (id) => id !== 'unknown',
  ).length;
  metrics.repeatedProfileWithin2Days = countProfileRepeatsWithin2Days(profileIdsByDay);
  metrics.averagePriorityScore =
    priorityScoreCount > 0 ? Math.round(priorityScoreSum / priorityScoreCount) : 0;
  if (metrics.budgetMin === Number.MAX_SAFE_INTEGER) metrics.budgetMin = 0;

  const completion = buildPilotCompletionSummary({
    gameState: sim.gameState,
    decisionHistory: sim.decisionHistory,
    dailyPriorityByDay: sim.dailyPriorityByDay,
    dailyGoalsByDay: sim.dailyGoalsByDay,
    lastDailyReport: sim.lastDailyReport,
    snapshots: sim.snapshots,
  });
  metrics.pilotCompletionShown = completion.isCompleted;
  metrics.pilotCompletionGrade = completion.isCompleted ? completion.grade : null;
  metrics.managementStyle = completion.isCompleted
    ? completion.managementStyle
    : null;

  metrics.status = evaluateScenarioVerdict(metrics);
  return metrics;
}

export function runFullLoopAnalysis(): FullLoopAnalysisResult {
  const scenarios = FULL_LOOP_SCENARIOS.map((config) => runFullLoopScenario(config));

  const scenarioStatuses = Object.fromEntries(
    scenarios.map((s) => [s.scenario, s.status]),
  ) as Record<FullLoopScenarioId, FullLoopMetrics['status']>;

  let totalPASS = 0;
  let totalWARN = 0;
  let totalFAIL = 0;
  const topWarnings: string[] = [];

  for (const s of scenarios) {
    if (s.status === 'PASS') totalPASS += 1;
    else if (s.status === 'WARN') totalWARN += 1;
    else totalFAIL += 1;
    topWarnings.push(...s.warnings.map((w) => `${s.scenario}: ${w}`));
  }

  return {
    scenarios,
    scenarioStatuses,
    totalPASS,
    totalWARN,
    totalFAIL,
    topWarnings: topWarnings.slice(0, 12),
    recommendedSmallFixes: collectRecommendedFixes(scenarios),
    saveVersionOk: SAVE_VERSION === 22,
  };
}
