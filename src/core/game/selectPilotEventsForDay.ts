import { pilotEvents } from '@/core/content/pilotEvents';
import { getCurrentPilotDayPlan } from '@/core/game/getCurrentPilotDayPlan';
import {
  conditionsMatch,
  type PilotEventSelectionContext,
} from '@/core/game/pilotConditions';
import {
  DEFAULT_PILOT_DISTRICT_ID,
  type PilotDistrictId,
} from '@/core/models/DistrictProfile';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { PilotDayTheme } from '@/core/models/PilotDayPlan';

export type SelectPilotEventsForDayParams = {
  gameState: GameState;
  events?: EventCard[];
  maxEvents?: number;
  /** true ise tamamlanmış eventler de aday olabilir (debug). Varsayılan: false */
  includeCompleted?: boolean;
};

export type ExplainPilotEventSelectionParams = SelectPilotEventsForDayParams;

export type ExplainPilotEventSelectionResult = {
  selectedEvents: EventCard[];
  currentDay: number;
  selectedDistrictId: PilotDistrictId;
  theme?: PilotDayTheme;
  candidateCount: number;
  completedFilteredCount: number;
  includeCompleted: boolean;
  fallbackUsed: boolean;
  reason: string;
};

type SelectionReasonKey =
  | 'no_day_plan'
  | 'non_fallback'
  | 'district_fallback'
  | 'day_fallback'
  | 'empty';

type InternalSelectionResult = {
  selected: EventCard[];
  eligibleBeforeCompletedFilter: EventCard[];
  eligible: EventCard[];
  completedFilteredCount: number;
  fallbackUsed: boolean;
  reasonKey: SelectionReasonKey;
};

function buildContext(gameState: GameState): PilotEventSelectionContext {
  const selectedDistrictId =
    gameState.pilot.selectedDistrictId ?? DEFAULT_PILOT_DISTRICT_ID;

  return {
    gameState,
    selectedDistrictId,
    pilot: gameState.pilot,
    currentDay: gameState.pilot.currentPilotDay,
    flags: gameState.pilot?.flags ?? {},
  };
}

function getCompletedEventIds(gameState: GameState): Set<string> {
  return new Set(gameState.pilot?.completedEventIds ?? []);
}

function filterCompletedEvents(
  events: EventCard[],
  completedIds: Set<string>,
  includeCompleted: boolean,
): EventCard[] {
  if (includeCompleted) {
    return events;
  }
  return events.filter((event) => !completedIds.has(event.id));
}

function eventPriority(event: EventCard): number {
  return event.priority ?? 0;
}

function sortByPriorityDesc(events: EventCard[]): EventCard[] {
  return [...events].sort((a, b) => eventPriority(b) - eventPriority(a));
}

function isEligibleForContext(
  event: EventCard,
  context: PilotEventSelectionContext,
  theme: PilotDayTheme | undefined,
): boolean {
  if (event.day !== context.currentDay) {
    return false;
  }

  if (theme != null && event.theme !== theme) {
    return false;
  }

  if (
    event.districtIds &&
    !event.districtIds.includes(context.selectedDistrictId)
  ) {
    return false;
  }

  return conditionsMatch(event.conditions, context);
}

function isDayFallbackCandidate(
  event: EventCard,
  context: PilotEventSelectionContext,
  theme: PilotDayTheme | undefined,
): boolean {
  return (
    event.day === context.currentDay &&
    event.fallback === true &&
    (event.theme == null || event.theme === theme) &&
    (event.districtIds == null ||
      event.districtIds.includes(context.selectedDistrictId)) &&
    conditionsMatch(event.conditions, context)
  );
}

function takeTop(events: EventCard[], maxEvents: number): EventCard[] {
  return sortByPriorityDesc(events).slice(0, maxEvents);
}

function selectPilotEventsInternal(
  params: SelectPilotEventsForDayParams,
): InternalSelectionResult {
  const {
    gameState,
    events = pilotEvents,
    maxEvents = 1,
    includeCompleted = false,
  } = params;

  const context = buildContext(gameState);
  const dayPlan = getCurrentPilotDayPlan(context.pilot);

  if (!dayPlan) {
    return {
      selected: [],
      eligibleBeforeCompletedFilter: [],
      eligible: [],
      completedFilteredCount: 0,
      fallbackUsed: false,
      reasonKey: 'no_day_plan',
    };
  }

  const theme = dayPlan.theme;
  const completedIds = getCompletedEventIds(gameState);

  const eligibleBeforeCompletedFilter = events.filter((event) =>
    isEligibleForContext(event, context, theme),
  );

  const eligible = filterCompletedEvents(
    eligibleBeforeCompletedFilter,
    completedIds,
    includeCompleted,
  );

  const completedFilteredCount = includeCompleted
    ? 0
    : eligibleBeforeCompletedFilter.filter((event) =>
        completedIds.has(event.id),
      ).length;

  const nonFallback = eligible.filter((event) => !event.fallback);
  if (nonFallback.length > 0) {
    return {
      selected: takeTop(nonFallback, maxEvents),
      eligibleBeforeCompletedFilter,
      eligible,
      completedFilteredCount,
      fallbackUsed: false,
      reasonKey: 'non_fallback',
    };
  }

  const districtFallback = eligible.filter((event) => event.fallback === true);
  if (districtFallback.length > 0) {
    return {
      selected: takeTop(districtFallback, maxEvents),
      eligibleBeforeCompletedFilter,
      eligible,
      completedFilteredCount,
      fallbackUsed: true,
      reasonKey: 'district_fallback',
    };
  }

  const anyDayFallback = filterCompletedEvents(
    events.filter((event) => isDayFallbackCandidate(event, context, theme)),
    completedIds,
    includeCompleted,
  );

  if (anyDayFallback.length > 0) {
    return {
      selected: takeTop(anyDayFallback, maxEvents),
      eligibleBeforeCompletedFilter,
      eligible,
      completedFilteredCount,
      fallbackUsed: true,
      reasonKey: 'day_fallback',
    };
  }

  return {
    selected: [],
    eligibleBeforeCompletedFilter,
    eligible,
    completedFilteredCount,
    fallbackUsed: false,
    reasonKey: 'empty',
  };
}

function reasonFromKey(
  key: SelectionReasonKey,
  internal: InternalSelectionResult,
): string {
  switch (key) {
    case 'no_day_plan':
      return 'Gün için pilot plan bulunamadı.';
    case 'non_fallback':
      return `${internal.eligible.filter((e) => !e.fallback).length} tamamlanmamış non-fallback aday; en yüksek priority seçildi.`;
    case 'district_fallback':
      return `Non-fallback yok; ${internal.eligible.filter((e) => e.fallback).length} tamamlanmamış fallback adayından seçildi.`;
    case 'day_fallback':
      return 'Tamamlanmamış gün fallback havuzundan seçildi.';
    case 'empty':
      if (internal.completedFilteredCount > 0) {
        return 'Uygun adayların tamamı completedEventIds ile elendi; tamamlanmamış fallback yok.';
      }
      return 'Uygun aday yok (gün/tema/bölge/koşul eşleşmedi veya fallback bulunamadı).';
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

/**
 * Verilen gün ve pilot bağlamına göre pilot event seçer (pure, side-effect free).
 */
export function selectPilotEventsForDay(
  params: SelectPilotEventsForDayParams,
): EventCard[] {
  return selectPilotEventsInternal(params).selected;
}

/**
 * selectPilotEventsForDay sonucunu ve seçim gerekçesini döndürür (debug).
 */
export function explainPilotEventSelection(
  params: ExplainPilotEventSelectionParams,
): ExplainPilotEventSelectionResult {
  const { gameState, includeCompleted = false } = params;
  const context = buildContext(gameState);
  const dayPlan = getCurrentPilotDayPlan(context.pilot);
  const internal = selectPilotEventsInternal(params);

  return {
    selectedEvents: internal.selected,
    currentDay: context.currentDay,
    selectedDistrictId: context.selectedDistrictId,
    theme: dayPlan?.theme,
    candidateCount: internal.eligible.length,
    completedFilteredCount: internal.completedFilteredCount,
    includeCompleted,
    fallbackUsed: internal.fallbackUsed,
    reason: reasonFromKey(internal.reasonKey, internal),
  };
}
