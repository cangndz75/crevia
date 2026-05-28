import { normalizeContainerNeighborhoodId } from '@/core/containers/containerNeighborhoodBridge';
import { createSeededRandom, hashSeed } from '@/core/game/createSeededRandom';
import { getNeighborhoodIdentity } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import { normalizeNeighborhoodId } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import type { DailyEventSet } from '@/core/models/DailyEventSet';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { PilotEventType } from '@/core/models/PilotDayPlan';
import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import { isDay1LearningEventId } from '@/features/tutorial/tutorialTypes';

import {
  EVENT_CONTENT_PROFILES,
  getEventContentProfileById,
} from './eventContentLibrary';
import { getPilotRhythmPlan } from './pilotRhythmConstants';
import type {
  EventContentCategory,
  EventContentMeta,
  EventContentProfile,
  EventContentVariationContext,
  EventVariationHistory,
} from './eventContentTypes';

const MAX_CATEGORY_PER_DAY = 2;
const TITLE_REPEAT_WINDOW_DAYS = 2;

export function mapEventToContentCategory(event: EventCard): EventContentCategory {
  const type = event.eventType ?? '';
  const cat = `${event.category} ${type} ${(event.filterTags ?? []).join(' ')}`.toLowerCase();

  if (type === 'permanent_solution' || cat.includes('permanent')) {
    return 'permanent_solution';
  }
  if (type === 'opportunity' || event.filterTags?.includes('opportunity')) {
    return 'opportunity';
  }
  if (type === 'butterfly') {
    return 'butterfly';
  }
  if (type === 'waste' || cat.includes('container') || cat.includes('konteyner')) {
    return 'waste_container';
  }
  if (
    type === 'social_media' ||
    type === 'citizen_complaint' ||
    cat.includes('sosyal') ||
    cat.includes('social')
  ) {
    return 'social_pressure';
  }
  if (type === 'vehicle' || cat.includes('rota') || cat.includes('route')) {
    return 'vehicle_route';
  }
  if (type === 'staff' || cat.includes('personel') || cat.includes('ekip')) {
    return 'personnel_morale';
  }
  if (type === 'noise' || cat.includes('gürültü')) {
    return 'noise';
  }
  if (type === 'market' || cat.includes('pazar')) {
    return 'market_vendor';
  }
  if (type === 'sidewalk') {
    return 'sidewalk_occupation';
  }
  if (cat.includes('bakım') || cat.includes('maintenance')) {
    return 'maintenance';
  }
  if (cat.includes('denetim') || cat.includes('inspection')) {
    return 'inspection_gap';
  }
  if (cat.includes('community_support') || cat.includes('gönüllü')) {
    return 'community_support';
  }
  return 'citizen_complaint';
}

type EventNeighborhoodFields = EventCard & {
  relatedNeighborhoodId?: string;
  districtId?: string;
  targetNeighborhoodId?: string;
  location?: { neighborhoodId?: string };
  contentMeta?: EventContentMeta;
  context?: { neighborhoodId?: string };
};

export type ResolveEventNeighborhoodOptions = {
  fallbackNeighborhoodId?: string;
  /** Analyzer/metrics: mahalle yoksa 'unknown' döner (oyun fallback'i cumhuriyet). */
  treatMissingAsUnknown?: boolean;
};

/** Event kartından canonical mahalle id çıkarır; bilinmeyen id crash etmez. */
export function pickNeighborhoodIdFromEvent(event: EventCard): string | null {
  const extended = event as EventNeighborhoodFields;
  const candidates = [
    event.neighborhoodId,
    extended.relatedNeighborhoodId,
    extended.districtId,
    extended.targetNeighborhoodId,
    extended.location?.neighborhoodId,
    extended.contentMeta?.neighborhoodId,
    extended.context?.neighborhoodId,
    event.district,
  ];

  for (const candidate of candidates) {
    const normalized =
      normalizeNeighborhoodId(candidate) ??
      normalizeContainerNeighborhoodId(candidate);
    if (normalized) {
      return normalized;
    }
  }

  for (const pilotDistrictId of event.districtIds ?? []) {
    const fromPilot = normalizeContainerNeighborhoodId(pilotDistrictId);
    if (fromPilot) {
      return fromPilot;
    }
  }

  return null;
}

export function resolveEventNeighborhoodId(
  event: EventCard,
  fallbackDistrictNeighborhood?: string,
  options?: ResolveEventNeighborhoodOptions,
): string {
  const fromEvent = pickNeighborhoodIdFromEvent(event);
  if (fromEvent) {
    return fromEvent;
  }

  const fromFallback =
    normalizeNeighborhoodId(fallbackDistrictNeighborhood) ??
    normalizeNeighborhoodId(options?.fallbackNeighborhoodId);
  if (fromFallback) {
    return fromFallback;
  }

  if (options?.treatMissingAsUnknown) {
    return 'unknown';
  }
  return 'cumhuriyet';
}

export function buildEventVariationHistory(
  gameState: GameState,
  catalog: EventCard[],
): EventVariationHistory {
  const recentProfileIds: string[] = [];
  const recentTitles: string[] = [];
  const categoriesByDay: Record<number, EventContentCategory[]> = {};

  const byId = new Map(catalog.map((e) => [e.id, e]));

  for (const title of gameState.pilot.eventContentRecentTitles ?? []) {
    recentTitles.push(title);
  }
  for (const profileId of gameState.pilot.eventContentRecentProfileIds ?? []) {
    recentProfileIds.push(profileId);
  }

  for (const solved of gameState.solvedEvents ?? []) {
    if (solved.title) {
      recentTitles.push(solved.title);
    }
    const card = byId.get(solved.id);
    if (card?.contentProfileId) {
      recentProfileIds.push(card.contentProfileId);
    }
  }

  const current = gameState.pilot.dailyEventSet;
  if (current) {
    const day = current.day;
    categoriesByDay[day] = current.allEventIds.map((id) => {
      const card = byId.get(id);
      return card
        ? mapEventToContentCategory(card)
        : ('citizen_complaint' as EventContentCategory);
    });
    for (const id of current.allEventIds) {
      const card = byId.get(id);
      if (card?.contentProfileId) {
        recentProfileIds.push(card.contentProfileId);
      }
      if (card?.title) {
        recentTitles.push(card.title);
      }
    }
  }

  return {
    recentProfileIds,
    recentTitles,
    categoriesByDay,
  };
}

function profileMatchesNeighborhood(
  profile: EventContentProfile,
  neighborhoodId: string,
): boolean {
  if (!profile.allowedNeighborhoods?.length) {
    return true;
  }
  return profile.allowedNeighborhoods.includes(neighborhoodId);
}

function profileMatchesEvent(
  profile: EventContentProfile,
  event: EventCard,
  category: EventContentCategory,
): boolean {
  if (profile.category !== category) {
    return false;
  }
  const haystack = `${event.eventType} ${event.category} ${event.title}`.toLowerCase();
  return profile.tags.some((tag) => haystack.includes(tag.toLowerCase()));
}

export function rankProfilesForEvent(
  event: EventCard,
  neighborhoodId: string,
  dailyPriorityKey?: DailyPriorityKey,
): EventContentProfile[] {
  const category = mapEventToContentCategory(event);
  const identity = getNeighborhoodIdentity(neighborhoodId);

  const scored = EVENT_CONTENT_PROFILES.filter((profile) => {
    if (!profileMatchesNeighborhood(profile, neighborhoodId)) {
      return false;
    }
    if (
      profile.preferredNeighborhoodArchetypes?.length &&
      !profile.preferredNeighborhoodArchetypes.includes(identity.archetype)
    ) {
      return false;
    }
    return profile.category === category || profileMatchesEvent(profile, event, category);
  }).map((profile) => {
    let score = profile.category === category ? 10 : 5;
    if (profile.allowedNeighborhoods?.includes(neighborhoodId)) {
      score += 8;
    }
    if (profile.preferredNeighborhoodArchetypes?.includes(identity.archetype)) {
      score += 6;
    }
    if (
      dailyPriorityKey &&
      profile.preferredPriorityKeys?.includes(dailyPriorityKey)
    ) {
      score += 4;
    }
    return { profile, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.profile);
}

function pickTemplate(templates: string[], rng: () => number): string {
  if (templates.length === 0) {
    return '';
  }
  const index = Math.floor(rng() * templates.length);
  return templates[Math.min(index, templates.length - 1)]!;
}

function pickFreshTemplate(
  templates: string[],
  rng: () => number,
  blockedTitles: string[],
): string {
  if (templates.length === 0) {
    return '';
  }
  const tried = new Set<string>();
  for (let attempt = 0; attempt < templates.length * 3; attempt += 1) {
    const candidate = pickTemplate(templates, rng);
    if (!blockedTitles.includes(candidate) && !tried.has(candidate)) {
      return candidate;
    }
    tried.add(candidate);
  }
  return templates[0]!;
}

export function isProfileBlocked(
  profile: EventContentProfile,
  context: EventContentVariationContext,
  proposedTitle: string,
): boolean {
  const rules = profile.variationRules;
  if (context.isTutorialDay && rules?.excludeDay1Tutorial) {
    return true;
  }
  if (context.batchProfileIds.includes(profile.id)) {
    return true;
  }
  const categoryCount = context.batchCategories.filter(
    (c) => c === profile.category,
  ).length;
  if (categoryCount >= MAX_CATEGORY_PER_DAY) {
    return true;
  }
  const avoidDays = rules?.avoidRepeatWithinDays ?? TITLE_REPEAT_WINDOW_DAYS;
  if (context.history.recentProfileIds.includes(profile.id)) {
    return true;
  }
  if (context.history.recentTitles.includes(proposedTitle)) {
    return true;
  }
  const dayCategories = context.history.categoriesByDay[context.day] ?? [];
  const sameDayCategoryCount =
    dayCategories.filter((c) => c === profile.category).length +
    context.batchCategories.filter((c) => c === profile.category).length;
  if (sameDayCategoryCount >= MAX_CATEGORY_PER_DAY) {
    return true;
  }
  return false;
}

export function selectContentProfileForEvent(
  event: EventCard,
  context: EventContentVariationContext,
): EventContentProfile | null {
  if (context.isTutorialDay && (context.isAnchor || isDay1LearningEventId(event.id))) {
    return null;
  }

  const ranked = rankProfilesForEvent(
    event,
    context.neighborhoodId,
    context.dailyPriorityKey,
  );
  if (ranked.length === 0) {
    return null;
  }

  for (const profile of ranked) {
    const title = pickTemplate(profile.titleTemplates, context.rng);
    if (!isProfileBlocked(profile, context, title)) {
      return profile;
    }
  }

  for (const profile of ranked) {
    const title = pickTemplate(profile.titleTemplates, context.rng);
    if (!context.history.recentTitles.includes(title)) {
      return profile;
    }
  }

  return ranked[0] ?? null;
}

function buildPriorityHintFromBlueprint(
  blueprint: EventContentProfile['decisionBlueprints'][number],
  dailyPriorityKey?: DailyPriorityKey,
): string | undefined {
  if (!dailyPriorityKey) {
    return undefined;
  }
  if (blueprint.recommendedForPriority?.includes(dailyPriorityKey)) {
    if (
      dailyPriorityKey === 'resource_protection' &&
      (blueprint.intent === 'dispatch_team' || blueprint.intent === 'invest')
    ) {
      return 'Kaynak baskısı';
    }
    if (dailyPriorityKey === 'public_relief' && blueprint.intent === 'communicate') {
      return 'Sosyal rahatlama';
    }
    if (dailyPriorityKey === 'operation_stability' && blueprint.intent === 'reroute') {
      return 'Operasyonel kazanım';
    }
    return 'Önceliği destekler';
  }
  if (blueprint.discouragedForPriority?.includes(dailyPriorityKey)) {
    return 'Önceliği riske atar';
  }
  return undefined;
}

function mergeDecisionWithBlueprint(
  existing: EventDecision,
  blueprint: EventContentProfile['decisionBlueprints'][number],
  dailyPriorityKey?: DailyPriorityKey,
): EventDecision {
  return {
    ...existing,
    title: existing.title.length > 4 ? existing.title : blueprint.title,
    description:
      blueprint.description.length > existing.description.length
        ? blueprint.description
        : `${blueprint.description} ${blueprint.shortTradeoff}`,
    contentShortTradeoff: blueprint.shortTradeoff,
    contentRiskHint: blueprint.riskHint,
    contentStrategyLabel: blueprint.strategyLabel,
    contentPriorityHint:
      buildPriorityHintFromBlueprint(blueprint, dailyPriorityKey) ??
      existing.contentPriorityHint,
    recommended:
      existing.recommended ??
      blueprint.recommendedForPriority != null,
  };
}

function buildDecisionsFromBlueprints(
  event: EventCard,
  profile: EventContentProfile,
  dailyPriorityKey?: DailyPriorityKey,
): EventDecision[] {
  if (event.decisions.length === 0) {
    return profile.decisionBlueprints.map((bp, i) => ({
      id: `${event.id}-${bp.id}`,
      title: bp.title,
      description: bp.description,
      style: i === 0 ? 'bold' : 'balanced',
      effects: {
        publicSatisfaction: 0,
        budget: 0,
        morale: 0,
        risk: 0,
        xp: 0,
      },
      contentShortTradeoff: bp.shortTradeoff,
      contentRiskHint: bp.riskHint,
      contentStrategyLabel: bp.strategyLabel,
      contentPriorityHint: buildPriorityHintFromBlueprint(bp, dailyPriorityKey),
    }));
  }

  return event.decisions.map((decision, index) => {
    const blueprint =
      profile.decisionBlueprints[index] ??
      profile.decisionBlueprints[index % profile.decisionBlueprints.length];
    if (!blueprint) {
      return decision;
    }
    return mergeDecisionWithBlueprint(decision, blueprint, dailyPriorityKey);
  });
}

export function applyContentProfileToEvent(
  event: EventCard,
  profile: EventContentProfile,
  context: EventContentVariationContext,
): EventCard {
  const title = pickFreshTemplate(
    profile.titleTemplates,
    context.rng,
    context.history.recentTitles,
  );
  const description = pickTemplate(profile.descriptionTemplates, context.rng);
  const fieldNote = pickTemplate(profile.fieldNoteTemplates, context.rng);
  const citizen = profile.citizenVoiceTemplates
    ? pickTemplate(profile.citizenVoiceTemplates, context.rng)
    : undefined;
  const advisor = profile.advisorLineTemplates
    ? pickTemplate(profile.advisorLineTemplates, context.rng)
    : undefined;
  const identity = getNeighborhoodIdentity(context.neighborhoodId);

  const archetypeLabels = profile.decisionBlueprints.map((bp) => bp.strategyLabel);

  return {
    ...event,
    title,
    description,
    riskLevel: profile.baseSeverity,
    neighborhoodId: context.neighborhoodId,
    district: identity.shortName,
    characterMessage: citizen || fieldNote || undefined,
    characterName: citizen ? identity.representative.name : undefined,
    advisorNote: advisor,
    contentProfileId: profile.id,
    contentCategory: profile.category,
    contentFutureHookHint: profile.futureHook
      ? 'Bu karar ileride tekrar gündeme gelebilir.'
      : undefined,
    contentMeta: {
      profileId: profile.id,
      category: profile.category,
      narrativeTone: profile.narrativeTone,
      archetypeLabels,
      neighborhoodId: context.neighborhoodId,
    },
    decisions: buildDecisionsFromBlueprints(event, profile, context.dailyPriorityKey),
  };
}

export function enrichEventWithContentVariation(
  event: EventCard,
  context: EventContentVariationContext,
): EventCard {
  const profile = selectContentProfileForEvent(event, context);
  const identity = getNeighborhoodIdentity(context.neighborhoodId);
  const withNeighborhood = {
    ...event,
    neighborhoodId: context.neighborhoodId,
    district: identity.shortName,
  };

  if (!profile) {
    if (context.history.recentTitles.includes(event.title)) {
      const deduped = `${event.title} · ${identity.shortName}`;
      context.history.recentTitles.push(deduped);
      return { ...withNeighborhood, title: deduped };
    }
    return withNeighborhood;
  }
  context.batchProfileIds.push(profile.id);
  context.batchCategories.push(profile.category);
  const enriched = applyContentProfileToEvent(event, profile, context);
  context.history.recentTitles.push(enriched.title);
  context.history.recentProfileIds.push(profile.id);
  return enriched;
}

export type EnrichDailyEventSetParams = {
  dailyEventSet: DailyEventSet;
  catalog: EventCard[];
  gameState: GameState;
  day: number;
  districtId: string;
  dailyPriorityKey?: DailyPriorityKey;
};

const CONTENT_MEMORY_LIMIT = 48;

export function appendPilotEventContentMemory(
  pilot: GameState['pilot'],
  catalog: EventCard[],
  dailyEventSet: DailyEventSet,
): GameState['pilot'] {
  const titles = [...(pilot.eventContentRecentTitles ?? [])];
  const profileIds = [...(pilot.eventContentRecentProfileIds ?? [])];

  for (const eventId of dailyEventSet.allEventIds) {
    const card = catalog.find((e) => e.id === eventId);
    if (card?.title) {
      titles.push(card.title);
    }
    if (card?.contentProfileId) {
      profileIds.push(card.contentProfileId);
    }
  }

  return {
    ...pilot,
    eventContentRecentTitles: titles.slice(-CONTENT_MEMORY_LIMIT),
    eventContentRecentProfileIds: profileIds.slice(-CONTENT_MEMORY_LIMIT),
  };
}

export function enrichDailyEventSetWithEventContent(
  params: EnrichDailyEventSetParams,
): DailyEventSet {
  const { dailyEventSet, catalog, gameState, day, dailyPriorityKey, districtId } =
    params;
  const pilotDistrictNeighborhood =
    normalizeContainerNeighborhoodId(districtId) ?? undefined;
  if (day <= 1) {
    return dailyEventSet;
  }
  const tutorialActive = day <= 1;
  const history = buildEventVariationHistory(gameState, catalog);
  const rng = createSeededRandom(
    hashSeed(
      `event-content-${day}-${dailyEventSet.seed}-${dailyPriorityKey ?? 'none'}`,
    ),
  );

  const batchProfileIds: string[] = [];
  const batchCategories: EventContentCategory[] = [];
  const enrichedSupplemental: EventCard[] = [];

  const enrichCard = (eventId: string, isAnchor: boolean): void => {
    const card = catalog.find((e) => e.id === eventId);
    if (!card) {
      return;
    }
    const plan = getPilotRhythmPlan(day);
    const cardNeighborhood = pickNeighborhoodIdFromEvent(card);
    let neighborhoodId = resolveEventNeighborhoodId(card, pilotDistrictNeighborhood);
    if (
      day > 1 &&
      pilotDistrictNeighborhood &&
      plan.preferredNeighborhoods?.includes(pilotDistrictNeighborhood) &&
      cardNeighborhood !== pilotDistrictNeighborhood
    ) {
      neighborhoodId = pilotDistrictNeighborhood;
    }
    const context: EventContentVariationContext = {
      day,
      neighborhoodId,
      dailyPriorityKey,
      history,
      batchProfileIds,
      batchCategories,
      isAnchor,
      isTutorialDay: tutorialActive,
      rng,
    };
    const enriched = enrichEventWithContentVariation(
      {
        ...card,
        decisions: card.decisions.map((d) => ({ ...d })),
      },
      context,
    );
    const idx = catalog.findIndex((e) => e.id === eventId);
    if (idx >= 0) {
      catalog[idx] = enriched;
    }
    if (dailyEventSet.supplementalEvents?.some((e) => e.id === eventId)) {
      enrichedSupplemental.push(enriched);
    }
  };

  const orderedIds = [
    dailyEventSet.anchorEventId,
    ...dailyEventSet.sideEventIds,
    ...dailyEventSet.quickActionIds,
    ...dailyEventSet.opportunityEventIds,
    ...dailyEventSet.butterflyEventIds,
  ].filter(Boolean);

  for (const id of orderedIds) {
    enrichCard(id, id === dailyEventSet.anchorEventId);
  }

  return {
    ...dailyEventSet,
    supplementalEvents:
      enrichedSupplemental.length > 0
        ? enrichedSupplemental
        : dailyEventSet.supplementalEvents,
  };
}

export function enrichEventCardsFromDailySet(
  events: EventCard[],
  params: Omit<EnrichDailyEventSetParams, 'dailyEventSet'> & {
    dailyEventSet: DailyEventSet;
  },
): EventCard[] {
  const catalog = [...params.catalog];
  enrichDailyEventSetWithEventContent({ ...params, catalog });
  const byId = new Map(catalog.map((e) => [e.id, e]));
  return events.map((e) => byId.get(e.id) ?? e);
}

export function filterEventPoolByContentVariety(
  pool: EventCard[],
  context: Pick<
    EventContentVariationContext,
    'history' | 'batchCategories' | 'day'
  >,
): EventCard[] {
  return pool.filter((event) => {
    const category = mapEventToContentCategory(event);
    const sameDay =
      (context.history.categoriesByDay[context.day] ?? []).filter(
        (c) => c === category,
      ).length +
      context.batchCategories.filter((c) => c === category).length;
    return sameDay < MAX_CATEGORY_PER_DAY;
  });
}

export function getProfileForEventCard(
  event: EventCard,
): EventContentProfile | null {
  if (event.contentProfileId) {
    return getEventContentProfileById(event.contentProfileId) ?? null;
  }
  return null;
}

export type { PilotEventType };
