import { normalizeContainerNeighborhoodId } from '@/core/containers/containerNeighborhoodBridge';
import { createSeededRandom, hashSeed } from '@/core/game/createSeededRandom';
import { getNeighborhoodIdentity } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import type { DailyEventSet, GameEventRole } from '@/core/models/DailyEventSet';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { isDay1LearningEventId } from '@/features/tutorial/tutorialTypes';

import {
  BUTTERFLY_SEED_FALLBACK_CATEGORIES,
  getPilotRhythmPlan,
  getRhythmPilotDistrictForDay,
} from './pilotRhythmConstants';
import {
  applyContentProfileToEvent,
  mapEventToContentCategory,
  pickNeighborhoodIdFromEvent,
  rankProfilesForEvent,
  resolveEventNeighborhoodId,
} from './eventVariationEngine';
import type {
  EventContentCategory,
  EventContentVariationContext,
} from './eventContentTypes';
import type {
  PilotDayRole,
  PilotEventSlot,
  PilotRhythmContext,
  PilotRhythmDebugSummary,
  PilotRhythmMeta,
  PilotRhythmPlan,
  PilotRhythmSelectionResult,
} from './pilotRhythmTypes';

export { getPilotRhythmPlan, getPilotDayRole, getRhythmPilotDistrictForDay } from './pilotRhythmConstants';

const ROLE_TO_GAME_ROLE: Partial<Record<PilotEventSlot, GameEventRole>> = {
  main: 'anchor',
  side: 'side',
  support: 'quick',
  opportunity: 'opportunity',
  signal: 'signal',
  follow_up: 'butterfly',
  final: 'anchor',
  social: 'side',
};

const GAME_ROLE_TO_SLOT: Record<GameEventRole, PilotEventSlot> = {
  anchor: 'main',
  side: 'side',
  quick: 'support',
  opportunity: 'opportunity',
  signal: 'signal',
  butterfly: 'follow_up',
};

const SEVERITY_RANK: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function resolveRhythmEventCategory(event: EventCard): string {
  return event.contentCategory ?? mapEventToContentCategory(event);
}

export function resolveRhythmEventNeighborhood(event: EventCard): string | undefined {
  const id = pickNeighborhoodIdFromEvent(event);
  return id ?? undefined;
}

export function buildRhythmDebugSummary(
  events: EventCard[],
  plan: PilotRhythmPlan,
): PilotRhythmDebugSummary {
  const categories: Record<string, number> = {};
  const neighborhoods: Record<string, number> = {};
  const slots: Record<string, number> = {};

  for (const event of events) {
    const cat = resolveRhythmEventCategory(event);
    categories[cat] = (categories[cat] ?? 0) + 1;
    const nh = resolveRhythmEventNeighborhood(event);
    if (nh) {
      neighborhoods[nh] = (neighborhoods[nh] ?? 0) + 1;
    }
    const slot = event.rhythmMeta?.slot ?? 'side';
    slots[slot] = (slots[slot] ?? 0) + 1;
  }

  return { role: plan.role, categories, neighborhoods, slots };
}

function effectivePreferredCategories(plan: PilotRhythmPlan): string[] {
  if (plan.role !== 'butterfly_seed') {
    return plan.preferredCategories;
  }
  const hasButterfly = plan.preferredCategories.includes('butterfly');
  if (hasButterfly) {
    return plan.preferredCategories;
  }
  return [...plan.preferredCategories, ...BUTTERFLY_SEED_FALLBACK_CATEGORIES];
}

function priorityCategoryBoost(
  category: string,
  priorityKey: PilotRhythmContext['dailyPriorityKey'],
): number {
  if (!priorityKey) {
    return 0;
  }
  if (priorityKey === 'public_relief') {
    if (
      category === 'social_pressure' ||
      category === 'citizen_complaint' ||
      category === 'community_support'
    ) {
      return 3;
    }
  }
  if (priorityKey === 'operation_stability') {
    if (
      category === 'waste_container' ||
      category === 'vehicle_route' ||
      category === 'maintenance'
    ) {
      return 3;
    }
  }
  if (priorityKey === 'resource_protection') {
    if (
      category === 'maintenance' ||
      category === 'personnel_morale' ||
      category === 'opportunity' ||
      category === 'permanent_solution'
    ) {
      return 3;
    }
  }
  return 0;
}

function neighborhoodSpreadBoost(
  event: EventCard,
  plan: PilotRhythmPlan,
  seenNeighborhoods: string[],
): number {
  const required = plan.requiredNeighborhoodSpread ?? 1;
  if (required <= 1) {
    return 0;
  }
  const nh =
    resolveRhythmEventNeighborhood(event) ??
    plan.preferredNeighborhoods?.find((n) => event.districtIds?.some((d) => {
      const mapped = normalizeContainerNeighborhoodId(d);
      return mapped === n;
    }));

  if (!nh) {
    return 0;
  }

  const seenSet = new Set(seenNeighborhoods);
  if (!seenSet.has(nh)) {
    return 10;
  }
  if (seenSet.size < required && plan.preferredNeighborhoods?.includes(nh)) {
    return 6;
  }
  return 0;
}

export function scoreEventForRhythm(
  event: EventCard,
  plan: PilotRhythmPlan,
  context: PilotRhythmContext,
): number {
  if (plan.role === 'tutorial' || isDay1LearningEventId(event.id)) {
    return 0;
  }

  const preferred = effectivePreferredCategories(plan);
  const category = resolveRhythmEventCategory(event);
  let score = 0;

  if (preferred.includes(category)) {
    score += 8;
  }
  if (plan.discouragedCategories?.includes(category)) {
    score -= 4;
  }

  const nh = resolveRhythmEventNeighborhood(event);
  if (nh && plan.preferredNeighborhoods?.includes(nh)) {
    score += 6;
  }

  for (const slot of plan.eventSlots) {
    if (slot.preferredCategories.includes(category)) {
      score += 4;
    }
    if (
      slot.preferredNeighborhoods?.length &&
      nh &&
      slot.preferredNeighborhoods.includes(nh)
    ) {
      score += 3;
    }
    if (
      slot.minSeverity &&
      (SEVERITY_RANK[event.riskLevel] ?? 0) >= (SEVERITY_RANK[slot.minSeverity] ?? 0)
    ) {
      score += 2;
    }
  }

  score += priorityCategoryBoost(category, context.dailyPriorityKey);

  const seen = context.neighborhoods ?? [];
  score += neighborhoodSpreadBoost(event, plan, seen);

  if (event.eventType === 'opportunity' && plan.role === 'opportunity') {
    score += 5;
  }
  if (event.eventType === 'butterfly' && plan.role === 'butterfly_seed') {
    score += 5;
  }

  const batch = context.batchCategories ?? [];
  const sameDayCat = batch.filter((c) => c === category).length;
  if (sameDayCat >= 2) {
    score -= 12;
  }

  return score;
}

export function applyPilotRhythmToEventCandidates(
  candidates: EventCard[],
  context: PilotRhythmContext,
): EventCard[] {
  const plan = getPilotRhythmPlan(context.day);
  if (plan.role === 'tutorial') {
    return candidates;
  }

  return [...candidates].sort((a, b) => {
    const scoreB = scoreEventForRhythm(b, plan, context);
    const scoreA = scoreEventForRhythm(a, plan, context);
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    return a.id.localeCompare(b.id);
  });
}

export function selectEventsForRhythm(
  candidates: EventCard[],
  context: PilotRhythmContext,
): PilotRhythmSelectionResult {
  const plan = getPilotRhythmPlan(context.day);
  const warnings: string[] = [];

  if (candidates.length === 0) {
    warnings.push('Rhythm: candidate havuzu boş, mevcut set korunacak');
    return {
      plan,
      selectedEvents: [],
      warnings,
      debugSummary: buildRhythmDebugSummary([], plan),
    };
  }

  const sorted = applyPilotRhythmToEventCandidates(candidates, context);
  return {
    plan,
    selectedEvents: sorted,
    warnings,
    debugSummary: buildRhythmDebugSummary(sorted.slice(0, 6), plan),
  };
}

export function assignPilotEventSlots(
  events: EventCard[],
  plan: PilotRhythmPlan,
  roleByEventId: Record<string, GameEventRole>,
): EventCard[] {
  return events.map((event) => {
    const gameRole = roleByEventId[event.id] ?? 'side';
    const slot = GAME_ROLE_TO_SLOT[gameRole] ?? 'side';
    const relationText = buildRhythmRelationText(plan.role, slot);
    const rhythmMeta: PilotRhythmMeta = {
      dayRole: plan.role,
      slot,
      intensity: plan.intensity,
      relationText,
    };
    return { ...event, rhythmMeta };
  });
}

function buildRhythmRelationText(
  role: PilotDayRole,
  slot: PilotEventSlot,
): string | undefined {
  if (role === 'butterfly_seed' && slot === 'follow_up') {
    return 'Önceki baskının yankısı';
  }
  if (role === 'final_stress' && slot === 'final') {
    return 'Final baskısı';
  }
  if (role === 'opportunity' && slot === 'opportunity') {
    return 'Stratejik fırsat';
  }
  return undefined;
}

function reEnrichForNeighborhood(
  event: EventCard,
  targetNeighborhood: string,
  context: Omit<EventContentVariationContext, 'neighborhoodId'>,
): EventCard {
  const ranked = rankProfilesForEvent(
    event,
    targetNeighborhood,
    context.dailyPriorityKey,
  );
  const profile =
    ranked.find((p) => p.allowedNeighborhoods?.includes(targetNeighborhood)) ??
    ranked[0];
  if (!profile) {
    return {
      ...event,
      neighborhoodId: targetNeighborhood,
    };
  }
  const enriched = applyContentProfileToEvent(event, profile, {
    ...context,
    neighborhoodId: targetNeighborhood,
  });
  if (context.history.recentTitles.includes(enriched.title)) {
    const identity = getNeighborhoodIdentity(targetNeighborhood);
    return {
      ...enriched,
      title: `${enriched.title} · ${identity.shortName} · G${context.day}`,
    };
  }
  context.history.recentTitles.push(enriched.title);
  return enriched;
}

export function ensureRhythmNeighborhoodSpread(
  catalog: EventCard[],
  dailyEventSet: DailyEventSet,
  plan: PilotRhythmPlan,
  context: PilotRhythmContext,
): EventCard[] {
  if (plan.role === 'tutorial' || plan.day <= 1) {
    return catalog;
  }

  const required = plan.requiredNeighborhoodSpread ?? 1;
  const preferred = plan.preferredNeighborhoods ?? [];
  if (required <= 1 || preferred.length === 0) {
    return catalog;
  }

  const ids = dailyEventSet.allEventIds.filter(
    (id) => !isDay1LearningEventId(id) && id !== dailyEventSet.anchorEventId,
  );

  const collectNeighborhoods = (): Set<string> => {
    const set = new Set<string>();
    for (const id of dailyEventSet.allEventIds) {
      const card = catalog.find((e) => e.id === id);
      const nh = card ? resolveRhythmEventNeighborhood(card) : undefined;
      if (nh && nh !== 'unknown') {
        set.add(nh);
      }
    }
    return set;
  };

  let seen = collectNeighborhoods();
  if (seen.size >= required) {
    return catalog;
  }

  const rng = createSeededRandom(
    hashSeed(`rhythm-spread-${plan.day}-${dailyEventSet.seed}`),
  );
  const variationBase: Omit<EventContentVariationContext, 'neighborhoodId'> = {
    day: plan.day,
    dailyPriorityKey: context.dailyPriorityKey,
    history: {
      recentProfileIds: context.recentProfileIds ?? [],
      recentTitles: context.recentEventTitles ?? [],
      categoriesByDay: {},
    },
    batchProfileIds: [],
    batchCategories: (context.batchCategories ?? []) as EventContentCategory[],
    isAnchor: false,
    isTutorialDay: false,
    rng,
  };

  const updated = [...catalog];
  for (const target of preferred) {
    if (seen.has(target)) {
      continue;
    }
    const candidateId =
      ids.find((id) => {
        const role = dailyEventSet.eventRoles[id];
        return role === 'side' || role === 'quick';
      }) ??
      ids.find((id) => dailyEventSet.eventRoles[id] === 'anchor') ??
      ids[0];
    if (!candidateId) {
      break;
    }
    const idx = updated.findIndex((e) => e.id === candidateId);
    if (idx < 0) {
      continue;
    }
    updated[idx] = reEnrichForNeighborhood(
      updated[idx]!,
      target,
      variationBase,
    );
    seen = collectNeighborhoods();
    if (seen.size >= required) {
      break;
    }
  }

  return updated;
}

export type ApplyPilotRhythmParams = {
  dailyEventSet: DailyEventSet;
  catalog: EventCard[];
  gameState: GameState;
  day: number;
  dailyPriorityKey?: PilotRhythmContext['dailyPriorityKey'];
};

export function applyPilotRhythmToDailyEventSet(
  params: ApplyPilotRhythmParams,
): DailyEventSet {
  const { dailyEventSet, gameState, day, dailyPriorityKey } = params;
  let catalog = params.catalog;
  const plan = getPilotRhythmPlan(day);

  if (plan.role === 'tutorial') {
    return dailyEventSet;
  }

  const rhythmContext: PilotRhythmContext = {
    day,
    gameState,
    dailyPriorityKey,
    pilotDistrictId: dailyEventSet.districtId,
    recentEventTitles: gameState.pilot.eventContentRecentTitles,
    recentProfileIds: gameState.pilot.eventContentRecentProfileIds,
  };

  catalog = ensureRhythmNeighborhoodSpread(
    catalog,
    dailyEventSet,
    plan,
    rhythmContext,
  );

  const rhythmDistrictNeighborhood = normalizeContainerNeighborhoodId(
    dailyEventSet.districtId,
  );
  if (rhythmDistrictNeighborhood && plan.day > 1) {
    for (const id of dailyEventSet.allEventIds) {
      if (isDay1LearningEventId(id)) {
        continue;
      }
      const role = dailyEventSet.eventRoles[id];
      if (role !== 'anchor' && role !== 'side' && role !== 'quick') {
        continue;
      }
      const idx = catalog.findIndex((e) => e.id === id);
      if (idx < 0) {
        continue;
      }
      const identity = getNeighborhoodIdentity(rhythmDistrictNeighborhood);
      catalog[idx] = {
        ...catalog[idx]!,
        neighborhoodId: rhythmDistrictNeighborhood,
        district: identity.shortName,
        contentMeta: catalog[idx]!.contentMeta
          ? {
              ...catalog[idx]!.contentMeta!,
              neighborhoodId: rhythmDistrictNeighborhood,
            }
          : catalog[idx]!.contentMeta,
      };
    }
  }

  const roleById = dailyEventSet.eventRoles;
  for (const id of dailyEventSet.allEventIds) {
    const idx = catalog.findIndex((e) => e.id === id);
    if (idx < 0) {
      continue;
    }
    const gameRole = roleById[id] ?? 'side';
    const slot = GAME_ROLE_TO_SLOT[gameRole] ?? 'side';
    catalog[idx] = {
      ...catalog[idx]!,
      rhythmMeta: {
        dayRole: plan.role,
        slot,
        intensity: plan.intensity,
        relationText: buildRhythmRelationText(plan.role, slot),
      },
    };
  }

  params.catalog.splice(0, params.catalog.length, ...catalog);

  return dailyEventSet;
}

export function buildRhythmWeightBonus(
  event: EventCard,
  plan: PilotRhythmPlan,
  context: PilotRhythmContext,
): number {
  return scoreEventForRhythm(event, plan, context);
}

export function mapRhythmSlotToGameRole(slot: PilotEventSlot): GameEventRole | undefined {
  return ROLE_TO_GAME_ROLE[slot];
}
