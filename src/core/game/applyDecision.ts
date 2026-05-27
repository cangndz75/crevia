import { clampMetric } from '@/core/game/clamp';
import { createId } from '@/core/game/createId';
import { createSnapshot, type CreateSnapshotParams } from '@/core/game/createSnapshot';
import type {
  DecisionAppliedCosts,
  DecisionAppliedEffects,
  DecisionRecord,
} from '@/core/models/DecisionRecord';
import type { DecisionEngineState } from '@/core/models/DecisionEngineState';
import type { DaySnapshot } from '@/core/models/DaySnapshot';
import type {
  EventCard,
  EventDecision,
  EventDecisionCost,
  EventDecisionEffect,
  EventRiskLevel,
  SolvedEvent,
} from '@/core/models/EventCard';
import type { GameResources } from '@/core/models/GameResources';
import type { Neighborhood } from '@/core/models/Neighborhood';
import { applyDecisionXp, type ApplyDecisionXpResult } from '@/core/xp/applyDecisionXp';
import { buildDecisionXpResultFromApplied } from '@/core/xp/buildDecisionXpResult';
import { createInitialPlayerProgress } from '@/core/xp/levelProgress';
import type { PlayerProgress } from '@/core/xp/types';

const BASE_DECISION_XP = 20;
const HIGH_BUDGET_SPEND_THRESHOLD = 5000;

const RISK_SEVERITY: Record<EventRiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const DEFAULT_RESOURCES: GameResources = {
  availableStaff: 12,
  availableVehicles: 6,
  overtimeHours: 0,
};

export type ApplyDecisionXpContext = {
  dailyGoalCompleted?: boolean;
  butterflyPositive?: boolean;
  tutorialBonus?: boolean;
};

export type ApplyDecisionParams = {
  state: DecisionEngineState;
  eventId: string;
  decisionId: string;
  /** Yeni XP modülü ilerlemesi; verilmezse sıfırdan başlar. */
  playerProgress?: PlayerProgress;
  xpContext?: ApplyDecisionXpContext;
};

export type ApplyDecisionResult = {
  nextState: DecisionEngineState;
  decisionRecord: DecisionRecord;
  beforeSnapshot: DaySnapshot;
  afterSnapshot: DaySnapshot;
  /** UI bağlı değil — breakdown, transaction ve level up bilgisi. */
  xp: ApplyDecisionXpResult;
};

type MetricSlice = {
  publicSatisfaction: number;
  budget: number;
  staffMorale: number;
};

type ApplyMetricEffectsResult = {
  metrics: MetricSlice;
  appliedEffects: DecisionAppliedEffects;
};

function getResources(state: DecisionEngineState): GameResources {
  return state.resources ?? DEFAULT_RESOURCES;
}

function resolveResources(state: DecisionEngineState): DecisionEngineState {
  if (state.resources) {
    return state;
  }
  return { ...state, resources: { ...DEFAULT_RESOURCES } };
}

function toSnapshotParams(
  state: DecisionEngineState,
  reason: CreateSnapshotParams['reason'],
): CreateSnapshotParams {
  const resources = state.resources ?? DEFAULT_RESOURCES;
  return {
    day: state.city.day,
    reason,
    metrics: {
      publicSatisfaction: state.city.publicSatisfaction,
      budget: state.city.budget,
      staffMorale: state.city.morale,
    },
    resources: { ...resources },
    activeEventIds: state.events.map((e) => e.id),
    resolvedEventIds: state.solvedEvents.map((e) => e.id),
    xp: state.player.xp,
    level: state.player.level,
  };
}

function findEvent(state: DecisionEngineState, eventId: string): EventCard {
  const event = state.events.find((e) => e.id === eventId);
  if (!event) {
    throw new Error('Event not found');
  }
  return event;
}

function findDecision(event: EventCard, decisionId: string): EventDecision {
  const decision = event.decisions.find((d) => d.id === decisionId);
  if (!decision) {
    throw new Error('Decision not found');
  }
  return decision;
}

function findNeighborhood(
  state: DecisionEngineState,
  event: EventCard,
): Neighborhood | undefined {
  const neighborhoods = state.neighborhoods;
  if (!neighborhoods?.length) {
    return undefined;
  }
  if (event.neighborhoodId) {
    return neighborhoods.find((n) => n.id === event.neighborhoodId);
  }
  return neighborhoods.find((n) => n.name === event.district);
}

function applyMetricEffects(
  metrics: MetricSlice,
  effects: EventDecisionEffect,
  costs?: EventDecisionCost,
): ApplyMetricEffectsResult {
  const appliedEffects: DecisionAppliedEffects = {};

  if (effects.publicSatisfaction !== 0) {
    metrics.publicSatisfaction = clampMetric(
      metrics.publicSatisfaction + effects.publicSatisfaction,
    );
    appliedEffects.publicSatisfaction = effects.publicSatisfaction;
  }

  const moraleDelta = effects.staffMorale ?? effects.morale;
  if (moraleDelta !== 0) {
    metrics.staffMorale = clampMetric(metrics.staffMorale + moraleDelta);
    appliedEffects.staffMorale = moraleDelta;
  }

  if (effects.budget !== 0) {
    metrics.budget = Math.max(0, metrics.budget + effects.budget);
    appliedEffects.budget = effects.budget;
  }

  if (costs?.budget !== undefined && costs.budget !== 0) {
    metrics.budget = Math.max(0, metrics.budget - costs.budget);
    appliedEffects.budget = (appliedEffects.budget ?? 0) - costs.budget;
  }

  if (costs?.morale !== undefined && costs.morale !== 0) {
    metrics.staffMorale = clampMetric(metrics.staffMorale - costs.morale);
    appliedEffects.staffMorale =
      (appliedEffects.staffMorale ?? 0) - costs.morale;
  }

  if (effects.risk !== 0) {
    appliedEffects.risk = effects.risk;
  }

  if (effects.cleanliness !== undefined && effects.cleanliness !== 0) {
    appliedEffects.cleanliness = effects.cleanliness;
  }

  if (effects.trust !== undefined && effects.trust !== 0) {
    appliedEffects.trust = effects.trust;
  }

  return { metrics, appliedEffects };
}

function applyResourceCosts(
  resources: GameResources,
  costs?: EventDecisionCost,
): { resources: GameResources; appliedCosts: DecisionAppliedCosts } {
  const appliedCosts: DecisionAppliedCosts = {};
  let next = { ...resources };

  if (costs?.staffHours !== undefined && costs.staffHours > 0) {
    const overtimeDelta = Math.ceil(costs.staffHours / 4);
    next = {
      ...next,
      overtimeHours: next.overtimeHours + overtimeDelta,
    };
    appliedCosts.staffHours = costs.staffHours;
  }

  if (costs?.vehicleUsage !== undefined && costs.vehicleUsage > 0) {
    next = {
      ...next,
      availableVehicles: Math.max(
        0,
        next.availableVehicles - costs.vehicleUsage,
      ),
    };
    appliedCosts.vehicleUsage = costs.vehicleUsage;
  }

  if (costs?.budget !== undefined && costs.budget !== 0) {
    appliedCosts.budget = costs.budget;
  }

  if (costs?.morale !== undefined && costs.morale !== 0) {
    appliedCosts.morale = costs.morale;
  }

  return { resources: next, appliedCosts };
}

function applyNeighborhoodEffects(
  neighborhoods: Neighborhood[],
  neighborhoodId: string | undefined,
  effects: EventDecisionEffect,
): Neighborhood[] {
  if (!neighborhoodId) {
    return neighborhoods;
  }

  return neighborhoods.map((n) => {
    if (n.id !== neighborhoodId) {
      return n;
    }

    let cleanliness = n.cleanliness;
    let trust = n.trust;
    let longTermNeglect = n.longTermNeglect;

    if (effects.cleanliness !== undefined && effects.cleanliness !== 0) {
      cleanliness = clampMetric(cleanliness + effects.cleanliness);
    }

    if (effects.trust !== undefined && effects.trust !== 0) {
      trust = clampMetric(trust + effects.trust);
    }

    if (effects.risk !== 0) {
      longTermNeglect = clampMetric(longTermNeglect + effects.risk);
    }

    return { ...n, cleanliness, trust, longTermNeglect };
  });
}

export function calculateDecisionXp(
  event: EventCard,
  decision: EventDecision,
): number {
  let xp = BASE_DECISION_XP;

  if (RISK_SEVERITY[event.riskLevel] >= 3) {
    xp += 10;
  }

  const effectSpend =
    decision.effects.budget < 0 ? Math.abs(decision.effects.budget) : 0;
  const costSpend = decision.costs?.budget ?? 0;
  if (
    effectSpend >= HIGH_BUDGET_SPEND_THRESHOLD ||
    costSpend >= HIGH_BUDGET_SPEND_THRESHOLD
  ) {
    xp += 5;
  }

  return xp;
}

export function buildDecisionRecord(params: {
  state: DecisionEngineState;
  event: EventCard;
  decision: EventDecision;
  neighborhood?: Neighborhood;
  appliedEffects: DecisionAppliedEffects;
  appliedCosts?: DecisionAppliedCosts;
}): DecisionRecord {
  const { state, event, decision, neighborhood, appliedEffects, appliedCosts } =
    params;

  return {
    id: createId('decision'),
    day: state.city.day,
    eventId: event.id,
    eventTitle: event.title,
    decisionId: decision.id,
    decisionLabel: decision.title,
    neighborhoodId: neighborhood?.id ?? event.neighborhoodId,
    neighborhoodName: neighborhood?.name ?? event.district,
    appliedEffects,
    appliedCosts:
      appliedCosts && Object.keys(appliedCosts).length > 0
        ? appliedCosts
        : undefined,
    createdAt: new Date().toISOString(),
  };
}

function resolveEvent(
  state: DecisionEngineState,
  event: EventCard,
  xpEarned: number,
): Pick<DecisionEngineState, 'events' | 'solvedEvents' | 'featuredEventId'> {
  const events = state.events.filter((e) => e.id !== event.id);
  const solvedEntry: SolvedEvent = {
    id: event.id,
    title: event.title,
    xpEarned,
  };
  const solvedEvents = [...state.solvedEvents, solvedEntry];
  const featuredEventId =
    state.featuredEventId === event.id
      ? (events[0]?.id ?? state.featuredEventId)
      : state.featuredEventId;

  return { events, solvedEvents, featuredEventId };
}

function levelFromXp(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function applyDecision(params: ApplyDecisionParams): ApplyDecisionResult {
  const workingState = resolveResources(params.state);
  const event = findEvent(workingState, params.eventId);
  const decision = findDecision(event, params.decisionId);
  const neighborhood = findNeighborhood(workingState, event);

  const beforeSnapshot = createSnapshot(
    toSnapshotParams(workingState, 'before_decision'),
  );

  let metrics: MetricSlice = {
    publicSatisfaction: workingState.city.publicSatisfaction,
    budget: workingState.city.budget,
    staffMorale: workingState.city.morale,
  };

  const { metrics: nextMetrics, appliedEffects } = applyMetricEffects(
    metrics,
    decision.effects,
    decision.costs,
  );
  metrics = nextMetrics;

  const { resources: nextResources, appliedCosts: resourceCosts } =
    applyResourceCosts(getResources(workingState), decision.costs);

  const mergedAppliedCosts: DecisionAppliedCosts = {
    ...resourceCosts,
  };

  let neighborhoods = workingState.neighborhoods ?? [];
  if (neighborhood) {
    neighborhoods = applyNeighborhoodEffects(
      neighborhoods,
      neighborhood.id,
      decision.effects,
    );
  }

  const xpGain = calculateDecisionXp(event, decision);
  const nextXp = workingState.player.xp + xpGain;
  const nextLevel = levelFromXp(nextXp);

  const { events, solvedEvents, featuredEventId } = resolveEvent(
    workingState,
    event,
    xpGain,
  );

  const nextState: DecisionEngineState = {
    ...workingState,
    city: {
      ...workingState.city,
      publicSatisfaction: metrics.publicSatisfaction,
      budget: metrics.budget,
      morale: metrics.staffMorale,
      riskScore: clampMetric(
        workingState.city.riskScore + (decision.effects.risk ?? 0),
      ),
    },
    player: {
      ...workingState.player,
      xp: nextXp,
      level: nextLevel,
    },
    events,
    solvedEvents,
    featuredEventId,
    resources: nextResources,
    neighborhoods: neighborhoods.length > 0 ? neighborhoods : workingState.neighborhoods,
  };

  const afterSnapshot = createSnapshot(
    toSnapshotParams(nextState, 'after_decision'),
  );

  const decisionRecord = buildDecisionRecord({
    state: workingState,
    event,
    decision,
    neighborhood,
    appliedEffects,
    appliedCosts:
      Object.keys(mergedAppliedCosts).length > 0
        ? mergedAppliedCosts
        : undefined,
  });

  const xp = applyDecisionXp({
    playerProgress: params.playerProgress ?? createInitialPlayerProgress(),
    day: workingState.city.day,
    event,
    decision,
    decisionResult: buildDecisionXpResultFromApplied(
      appliedEffects,
      Object.keys(mergedAppliedCosts).length > 0 ? mergedAppliedCosts : undefined,
      decision,
      event.districtBonusHints,
    ),
    district: neighborhood
      ? { id: neighborhood.id }
      : workingState.pilot.selectedDistrictId
        ? { id: workingState.pilot.selectedDistrictId }
        : undefined,
    dailyGoalCompleted: params.xpContext?.dailyGoalCompleted,
    butterflyPositive: params.xpContext?.butterflyPositive,
    tutorialBonus: params.xpContext?.tutorialBonus,
  });

  return {
    nextState,
    decisionRecord,
    beforeSnapshot,
    afterSnapshot,
    xp,
  };
}
