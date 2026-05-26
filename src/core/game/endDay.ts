import { buildDailyReport } from '@/core/game/buildDailyReport';
import { clampMetric } from '@/core/game/clamp';
import { createSnapshot } from '@/core/game/createSnapshot';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DailyReport } from '@/core/models/DailyReport';
import type { DaySnapshot } from '@/core/models/DaySnapshot';
import type { DecisionEngineState } from '@/core/models/DecisionEngineState';
import type { EventCard } from '@/core/models/EventCard';
import type { GameResources } from '@/core/models/GameResources';

const UNRESOLVED_SATISFACTION_PENALTY = 2;
const UNRESOLVED_MORALE_PENALTY = 1;
const NEXT_DAY_EVENT_COUNT = 3;

const DEFAULT_RESOURCES: GameResources = {
  availableStaff: 12,
  availableVehicles: 6,
  overtimeHours: 0,
};

export type EndDayState = DecisionEngineState & {
  decisionHistory?: DecisionRecord[];
  snapshots?: DaySnapshot[];
  /** Yeni güne event seçimi için havuz; yoksa mevcut events + eventPool birleşimi kullanılır. */
  eventPool?: EventCard[];
};

export type EndDayResult = {
  nextState: EndDayState;
  dailyReport: DailyReport;
  endDaySnapshot: DaySnapshot;
};

export type EndDayOptions = {
  /** true ise yeni gün için generic havuzdan event seçilmez (pilot refresh beklenir). */
  skipEventSelection?: boolean;
};

function getMetrics(state: EndDayState) {
  return {
    publicSatisfaction: state.city.publicSatisfaction,
    budget: state.city.budget,
    staffMorale: state.city.morale,
  };
}

function toSnapshotInput(state: EndDayState, day: number) {
  const resources = state.resources ?? DEFAULT_RESOURCES;
  return {
    day,
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

function applyUnresolvedEventPenalty(state: EndDayState): EndDayState {
  if (state.events.length === 0) {
    return state;
  }

  return {
    ...state,
    city: {
      ...state.city,
      publicSatisfaction: clampMetric(
        state.city.publicSatisfaction - UNRESOLVED_SATISFACTION_PENALTY,
      ),
      morale: clampMetric(state.city.morale - UNRESOLVED_MORALE_PENALTY),
    },
  };
}

function buildEventPool(state: EndDayState): EventCard[] {
  const pool = state.eventPool ?? [];
  const merged = new Map<string, EventCard>();
  for (const event of [...pool, ...state.events]) {
    merged.set(event.id, event);
  }
  return [...merged.values()];
}

function selectNextDayEvents(
  pool: EventCard[],
  blockedIds: Set<string>,
  count: number,
): EventCard[] {
  const candidates = pool.filter((e) => !blockedIds.has(e.id));
  return candidates.slice(0, count);
}

export function endDay(
  state: EndDayState,
  options?: EndDayOptions,
): EndDayResult {
  const skipEventSelection = options?.skipEventSelection === true;
  const decisionHistory = state.decisionHistory ?? [];
  const snapshots = [...(state.snapshots ?? [])];
  const currentDay = state.city.day;

  const endDaySnapshot = createSnapshot({
    ...toSnapshotInput(state, currentDay),
    reason: 'end_day',
  });
  snapshots.push(endDaySnapshot);

  const dailyReport = buildDailyReport({
    day: currentDay,
    metrics: getMetrics(state),
    decisionHistory,
    activeEvents: state.events,
    resolvedEventIds: state.solvedEvents.map((e) => e.id),
    snapshots,
  });

  let nextState: EndDayState = applyUnresolvedEventPenalty({
    ...state,
    dailyReport,
    snapshots,
  });

  const nextDay = currentDay + 1;

  if (skipEventSelection) {
    nextState = {
      ...nextState,
      city: {
        ...nextState.city,
        day: nextDay,
      },
      events: [],
      featuredEventId: '',
    };
  } else {
    const resolvedIds = new Set(nextState.solvedEvents.map((e) => e.id));
    const todayActiveIds = new Set(state.events.map((e) => e.id));
    const blockedIds = new Set([...resolvedIds, ...todayActiveIds]);

    const pool = buildEventPool(nextState);
    const nextEvents = selectNextDayEvents(
      pool,
      blockedIds,
      NEXT_DAY_EVENT_COUNT,
    );

    nextState = {
      ...nextState,
      city: {
        ...nextState.city,
        day: nextDay,
      },
      events: nextEvents,
      featuredEventId: nextEvents[0]?.id ?? nextState.featuredEventId,
    };
  }

  return {
    nextState,
    dailyReport,
    endDaySnapshot,
  };
}
