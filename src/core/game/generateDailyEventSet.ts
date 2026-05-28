import { pilotEvents } from '@/core/content/pilotEvents';
import { getPilotDayPlan } from '@/core/content/pilotDayPlan';
import { calculateEventWeight } from '@/core/game/calculateEventWeight';
import { createSeededRandom, hashSeed } from '@/core/game/createSeededRandom';
import { getDailyEventCounts } from '@/core/game/getDailyEventCounts';
import { getCurrentPilotDayPlan } from '@/core/game/getCurrentPilotDayPlan';
import {
  conditionsMatch,
  type PilotEventSelectionContext,
} from '@/core/game/pilotConditions';
import { selectPilotEventsForDay } from '@/core/game/selectPilotEventsForDay';
import type { DailyEventSet, GameEventRole, GameEventStatus } from '@/core/models/DailyEventSet';
import {
  DEFAULT_PILOT_DISTRICT_ID,
  type PilotDistrictId,
} from '@/core/models/DistrictProfile';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { enrichDailyEventSetWithDistrictEvents } from '@/core/districts/districtEventIntegration';
import type { ContainerState } from '@/core/containers/containerTypes';
import {
  applyVehicleCandidateWeightSuppression,
  createVehicleEventSignals,
  enrichDailyEventSetWithVehicleSignals,
} from '@/core/vehicles/vehicleEventSignals';
import type { VehicleEventSignal } from '@/core/vehicles/vehicleEventSignals';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import type { CarryOverSignal } from '@/core/carryOver/carryOverTypes';
import { getCarryOverWeightDeltaForEvent } from '@/core/carryOver/carryOverEngine';
import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import {
  buildEventVariationHistory,
  enrichDailyEventSetWithEventContent,
  filterEventPoolByContentVariety,
  mapEventToContentCategory,
} from '@/core/events/eventVariationEngine';
import type { EventContentCategory } from '@/core/events/eventContentTypes';
import {
  applyPilotRhythmToDailyEventSet,
  getPilotRhythmPlan,
  resolveRhythmEventNeighborhood,
  scoreEventForRhythm,
} from '@/core/events/pilotRhythmEngine';

export type GenerateDailyEventSetParams = {
  gameState: GameState;
  day: number;
  districtId: PilotDistrictId;
  events?: EventCard[];
  /** Yoksa konteyner boost uygulanmaz. */
  containerState?: ContainerState | null;
  /** Yoksa araç boost uygulanmaz. */
  vehicleState?: VehicleState | null;
  dailyPriorityKey?: DailyPriorityKey;
  /** Önceki günden türeyen hafif ağırlık sinyalleri (gün 2+). */
  carryOverSignals?: CarryOverSignal[];
};

function buildContext(
  gameState: GameState,
  day: number,
  districtId: PilotDistrictId,
): PilotEventSelectionContext {
  return {
    gameState,
    selectedDistrictId: districtId,
    pilot: gameState.pilot,
    currentDay: day,
    flags: gameState.pilot.flags ?? {},
  };
}

function eventMatchesDistrict(
  event: EventCard,
  districtId: PilotDistrictId,
): boolean {
  if (!event.districtIds?.length) {
    return true;
  }
  return event.districtIds.includes(districtId);
}

function isSharedDistrictEvent(event: EventCard): boolean {
  return (event.districtIds?.length ?? 0) > 1;
}

function cloneEventCards(events: EventCard[]): EventCard[] {
  return events.map((event) => ({
    ...event,
    decisions: event.decisions.map((decision) => ({ ...decision })),
  }));
}

/** İç pipeline catalog mutasyonlarını çağıran havuza yansıtır. */
function syncCatalogToSource(
  source: EventCard[],
  target: EventCard[],
): void {
  const byId = new Map(source.map((e) => [e.id, e]));
  for (let i = 0; i < target.length; i += 1) {
    const updated = byId.get(target[i]!.id);
    if (updated) {
      target[i] = {
        ...updated,
        decisions: updated.decisions.map((d) => ({ ...d })),
      };
    }
  }
}

function pickWeightedUnique(
  candidates: EventCard[],
  count: number,
  rng: () => number,
  getWeight: (event: EventCard) => number,
): EventCard[] {
  const pool = [...candidates];
  const picked: EventCard[] = [];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const weights = pool.map((e) => Math.max(1, getWeight(e)));
    const total = weights.reduce((sum, w) => sum + w, 0);
    let roll = rng() * total;
    let index = 0;
    for (let j = 0; j < pool.length; j++) {
      roll -= weights[j]!;
      if (roll <= 0) {
        index = j;
        break;
      }
    }
    const [choice] = pool.splice(index, 1);
    if (choice) {
      picked.push(choice);
    }
  }

  return picked;
}

function listDayCandidates(
  allEvents: EventCard[],
  context: PilotEventSelectionContext,
  day: number,
  excludeIds: Set<string>,
  options?: { widenDistrict?: boolean },
): EventCard[] {
  const completed = new Set(context.pilot.completedEventIds);
  const dayPlan = getPilotDayPlan(day);
  const theme = dayPlan?.theme;

  const base = allEvents.filter((event) => {
    if (event.day !== day) {
      return false;
    }
    if (excludeIds.has(event.id) || completed.has(event.id)) {
      return false;
    }
    if (theme != null && event.theme != null && event.theme !== theme) {
      return false;
    }
    if (!conditionsMatch(event.conditions, context)) {
      return false;
    }
    if (options?.widenDistrict) {
      return true;
    }
    return eventMatchesDistrict(event, context.selectedDistrictId);
  });

  return base;
}

function listSideCandidates(
  allEvents: EventCard[],
  context: PilotEventSelectionContext,
  day: number,
  excludeIds: Set<string>,
): EventCard[] {
  const strict = listDayCandidates(allEvents, context, day, excludeIds);
  if (strict.length > 0) {
    return strict;
  }
  return listDayCandidates(allEvents, context, day, excludeIds, {
    widenDistrict: true,
  });
}

function filterQuickCandidates(events: EventCard[]): EventCard[] {
  return events.filter(
    (e) =>
      e.filterTags?.includes('urgent') === true ||
      (e.urgencyHours != null && e.urgencyHours <= 3),
  );
}

function filterOpportunityCandidates(events: EventCard[]): EventCard[] {
  return events.filter(
    (e) =>
      e.filterTags?.includes('opportunity') === true ||
      e.eventType === 'opportunity' ||
      e.eventType === 'permanent_solution',
  );
}

function filterButterflyCandidates(events: EventCard[]): EventCard[] {
  return events.filter((e) => e.eventType === 'butterfly');
}

function resolveButterflyFromConsequences(
  gameState: GameState,
  day: number,
  allEvents: EventCard[],
  excludeIds: Set<string>,
): string[] {
  const ids: string[] = [];
  for (const consequence of gameState.pilot.pendingConsequences) {
    if (consequence.triggerDay !== day) {
      continue;
    }
    const payloadEventId =
      typeof consequence.payload.eventId === 'string'
        ? consequence.payload.eventId
        : undefined;
    if (payloadEventId && !excludeIds.has(payloadEventId)) {
      ids.push(payloadEventId);
      continue;
    }
    // Faz 2: unlock_event tipinde katalogdan event çözümleme genişletilebilir.
    if (consequence.type === 'unlock_event' && payloadEventId) {
      ids.push(payloadEventId);
    }
  }

  const catalogIds = filterButterflyCandidates(
    allEvents.filter(
      (e) =>
        e.day === day &&
        eventMatchesDistrict(e, gameState.pilot.selectedDistrictId!) &&
        !excludeIds.has(e.id),
    ),
  ).map((e) => e.id);

  return [...new Set([...ids, ...catalogIds])].slice(0, 1);
}

function buildSeed(
  districtId: PilotDistrictId,
  day: number,
  runId?: string | null,
): number {
  const key = runId
    ? `${districtId}-${day}-${runId}`
    : `${districtId}-${day}`;
  return hashSeed(key);
}

function initialStatus(role: GameEventRole): GameEventStatus {
  if (role === 'signal') {
    return 'pending';
  }
  return 'awaiting_decision';
}

/**
 * Deterministik günlük olay seti üretir (pure).
 */
export function generateDailyEventSet(
  params: GenerateDailyEventSetParams,
): DailyEventSet {
  const {
    gameState,
    day,
    districtId,
    events = pilotEvents,
    containerState = null,
    vehicleState = null,
    dailyPriorityKey,
    carryOverSignals = [],
  } = params;

  const catalog = cloneEventCards(events);
  const contentHistory = buildEventVariationHistory(gameState, catalog);
  const batchCategories: EventContentCategory[] = [];

  const trackCategory = (event: EventCard) => {
    batchCategories.push(mapEventToContentCategory(event));
  };

  const trackRhythmNeighborhood = (event: EventCard) => {
    const nh = resolveRhythmEventNeighborhood(event);
    if (nh) {
      rhythmNeighborhoodsSeen.push(nh);
    }
  };

  const buildRhythmContext = () => ({
    day,
    gameState,
    dailyPriorityKey,
    neighborhoods: rhythmNeighborhoodsSeen,
    batchCategories: [...batchCategories],
    recentEventTitles: gameState.pilot.eventContentRecentTitles,
    recentProfileIds: gameState.pilot.eventContentRecentProfileIds,
    pilotDistrictId: districtId,
  });

  const tutorialActive = day <= 1;
  const vehicleSignals: VehicleEventSignal[] = vehicleState
    ? createVehicleEventSignals(vehicleState, {
        day,
        activeDistrictId: districtId,
        tutorialActive,
      })
    : [];
  const context = buildContext(gameState, day, districtId);
  const dayPlan = getCurrentPilotDayPlan({
    ...gameState.pilot,
    currentPilotDay: day,
  });
  const theme = dayPlan?.theme;
  const counts = getDailyEventCounts(day);
  const rhythmPlan = getPilotRhythmPlan(day);
  const rhythmNeighborhoodsSeen: string[] = [];
  const runId = gameState.pilot.run?.id ?? null;
  const seed = buildSeed(districtId, day, runId);
  const rng = createSeededRandom(seed);

  const recentEventIds = [
    ...gameState.pilot.completedEventIds,
    ...(gameState.solvedEvents?.map((e) => e.id) ?? []),
  ];

  const weightBase = {
    context,
    theme,
    recentEventIds,
    containerState,
    vehicleState,
    tutorialActive,
  };

  const makePickWeight =
    (
      pool: EventCard[],
      districtMatchFor?: (event: EventCard) => boolean | undefined,
    ) =>
    (event: EventCard) => {
      const raw = calculateEventWeight({
        event,
        ...weightBase,
        districtMatch: districtMatchFor?.(event),
      });
      const suppressed = applyVehicleCandidateWeightSuppression(
        raw,
        event,
        pool,
        vehicleSignals,
        day,
        tutorialActive,
      );
      const rhythmBonus = scoreEventForRhythm(
        event,
        rhythmPlan,
        buildRhythmContext(),
      );
      const carryBonus =
        day > 1 && carryOverSignals.length > 0
          ? getCarryOverWeightDeltaForEvent(event, carryOverSignals)
          : 0;
      return Math.max(1, suppressed + rhythmBonus + carryBonus);
    };

  const selectedIds = new Set<string>();
  const eventRoles: Record<string, GameEventRole> = {};
  const eventStatuses: Record<string, GameEventStatus> = {};

  const assignRole = (id: string, role: GameEventRole) => {
    selectedIds.add(id);
    eventRoles[id] = role;
    eventStatuses[id] = initialStatus(role);
  };

  const anchorCandidates = selectPilotEventsForDay({
    gameState: {
      ...gameState,
      pilot: { ...gameState.pilot, currentPilotDay: day },
    },
    events: catalog,
    maxEvents: 1,
  });

  const anchorEvent = anchorCandidates[0];
  const anchorEventId = anchorEvent?.id ?? '';

  if (anchorEvent) {
    assignRole(anchorEventId, 'anchor');
    trackCategory(anchorEvent);
    trackRhythmNeighborhood(anchorEvent);
  }

  let sidePool = listSideCandidates(catalog, context, day, selectedIds);
  sidePool = filterEventPoolByContentVariety(sidePool, {
    history: contentHistory,
    batchCategories,
    day,
  });
  const sidePicked = pickWeightedUnique(
    sidePool,
    counts.side,
    rng,
    makePickWeight(sidePool, (event) =>
      eventMatchesDistrict(event, districtId) && !isSharedDistrictEvent(event),
    ),
  );

  for (const event of sidePicked) {
    assignRole(event.id, 'side');
    trackCategory(event);
    trackRhythmNeighborhood(event);
  }

  let remainingPool = listDayCandidates(catalog, context, day, selectedIds, {
    widenDistrict: true,
  });
  remainingPool = filterEventPoolByContentVariety(remainingPool, {
    history: contentHistory,
    batchCategories,
    day,
  });

  const quickPool = filterQuickCandidates(remainingPool);
  const quickPicked = pickWeightedUnique(
    quickPool,
    counts.quick,
    rng,
    makePickWeight(quickPool, (event) => eventMatchesDistrict(event, districtId)),
  );
  for (const event of quickPicked) {
    assignRole(event.id, 'quick');
    trackCategory(event);
    trackRhythmNeighborhood(event);
  }

  const afterQuickExclude = new Set(selectedIds);
  let opportunityPool = filterOpportunityCandidates(
    listDayCandidates(catalog, context, day, afterQuickExclude, {
      widenDistrict: true,
    }),
  );
  opportunityPool = filterEventPoolByContentVariety(opportunityPool, {
    history: contentHistory,
    batchCategories,
    day,
  });
  const opportunityPicked = pickWeightedUnique(
    opportunityPool,
    counts.opportunity,
    rng,
    makePickWeight(opportunityPool, (event) =>
      eventMatchesDistrict(event, districtId),
    ),
  );
  for (const event of opportunityPicked) {
    assignRole(event.id, 'opportunity');
    trackCategory(event);
    trackRhythmNeighborhood(event);
  }

  let butterflyEventIds: string[] = [];
  if (counts.butterfly > 0) {
    butterflyEventIds = resolveButterflyFromConsequences(
      gameState,
      day,
      catalog,
      selectedIds,
    ).slice(0, counts.butterfly);
    for (const id of butterflyEventIds) {
      if (!selectedIds.has(id)) {
        assignRole(id, 'butterfly');
      }
    }
  }

  const anchorEventIds = anchorEventId ? [anchorEventId] : [];
  const sideEventIds = sidePicked.map((e) => e.id);
  const quickActionIds = quickPicked.map((e) => e.id);
  const opportunityEventIds = opportunityPicked.map((e) => e.id);

  const signalEventIds: string[] = [];
  const allEventIds = [
    ...anchorEventIds,
    ...sideEventIds,
    ...quickActionIds,
    ...opportunityEventIds,
    ...butterflyEventIds,
    ...signalEventIds,
  ];

  const uniqueAll = [...new Set(allEventIds)];

  const baseDailyEventSet: DailyEventSet = {
    id: `daily-${districtId}-d${day}-${seed}`,
    day,
    districtId,
    generatedAt: new Date(0).toISOString(),
    seed,
    anchorEventId,
    sideEventIds,
    quickActionIds,
    opportunityEventIds,
    butterflyEventIds,
    signalEventIds,
    allEventIds: uniqueAll,
    eventRoles,
    eventStatuses,
  };

  const withDistrict = enrichDailyEventSetWithDistrictEvents({
    gameState,
    day,
    districtId,
    dailyEventSet: baseDailyEventSet,
    randomFn: rng,
    containerState,
    catalog,
  });

  const withVehicle = enrichDailyEventSetWithVehicleSignals({
    dailyEventSet: withDistrict,
    vehicleState,
    day,
    districtId,
    tutorialActive,
    catalog,
  });

  const withContent = enrichDailyEventSetWithEventContent({
    dailyEventSet: withVehicle,
    catalog,
    gameState,
    day,
    districtId,
    dailyPriorityKey,
  });

  const withRhythm = applyPilotRhythmToDailyEventSet({
    dailyEventSet: withContent,
    catalog,
    gameState,
    day,
    dailyPriorityKey,
  });

  if (events !== pilotEvents) {
    syncCatalogToSource(catalog, events);
  }

  return withRhythm;
}

export function resolveEventCardsFromDailySet(
  dailyEventSet: DailyEventSet,
  catalog: EventCard[] = pilotEvents,
  solvedEventIds: Set<string> = new Set(),
): EventCard[] {
  const mergedCatalog = [
    ...catalog,
    ...(dailyEventSet.supplementalEvents ?? []),
  ];
  const byId = new Map(mergedCatalog.map((e) => [e.id, e]));
  const activeIds = dailyEventSet.allEventIds.filter((id) => !solvedEventIds.has(id));
  const cards = activeIds
    .map((id) => byId.get(id))
    .filter((e): e is EventCard => e != null);
  return cloneEventCards(cards);
}

export function resolveDailySetSeedInput(
  gameState: GameState,
  day: number,
  districtId: PilotDistrictId = gameState.pilot.selectedDistrictId ??
    DEFAULT_PILOT_DISTRICT_ID,
): number {
  return buildSeed(districtId, day, gameState.pilot.run?.id ?? null);
}
