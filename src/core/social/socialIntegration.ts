import { buildMainOperationSocialMentionsForDay } from '@/core/mainOperation/mainOperationSocialContent';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  SOCIAL_DEFAULT_LAST_PROCESSED_DAY,
  SOCIAL_NEIGHBORHOOD_IDS,
  SOCIAL_SEED_PROFILES,
  type SocialNeighborhoodId,
} from './socialConstants';
import { applySocialDecisionEffect } from './socialDecisionEffects';
import { processSocialPulseEndOfDay } from './socialEngine';
import {
  clampSocialValue,
  isSocialRiskLevel,
  recomputeSocialPulseAggregates,
} from './socialSelectors';
import type {
  NeighborhoodSocialProfile,
  SocialDecisionEffectInput,
  SocialMention,
  SocialMentionType,
  SocialOutcomeHistory,
  SocialPulseState,
  SocialRiskLevel,
  SocialTopic,
  SocialTopicType,
} from './socialTypes';

const SOCIAL_MENTION_TYPES: readonly SocialMentionType[] = [
  'complaint',
  'gratitude',
  'rumor',
  'crisis',
  'question',
  'neutral',
] as const;

const SOCIAL_TOPIC_TYPES: readonly SocialTopicType[] = [
  'complaint_wave',
  'misinformation',
  'gratitude_wave',
  'crisis_pressure',
  'service_delay',
  'environmental_concern',
  'public_question',
] as const;

function isRecord(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function isSocialNeighborhoodId(value: string): value is SocialNeighborhoodId {
  return (SOCIAL_NEIGHBORHOOD_IDS as readonly string[]).includes(value);
}

function normalizeNeighborhoodId(value: unknown): SocialNeighborhoodId | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return isSocialNeighborhoodId(normalized) ? normalized : null;
}

function normalizeStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((item): item is string => typeof item === 'string');
}

function normalizeProfile(
  neighborhoodId: SocialNeighborhoodId,
  raw: unknown,
  currentDay: number,
  fallback: NeighborhoodSocialProfile,
): NeighborhoodSocialProfile {
  const seed = SOCIAL_SEED_PROFILES[neighborhoodId];

  if (!isRecord(raw)) {
    return { ...fallback };
  }

  const activeTopicIds = normalizeStringArray(raw.activeTopicIds);

  return {
    neighborhoodId,
    trust: clampSocialValue(
      typeof raw.trust === 'number' ? raw.trust : seed.trust,
    ),
    complaintHeat: clampSocialValue(
      typeof raw.complaintHeat === 'number' ? raw.complaintHeat : seed.complaintHeat,
    ),
    misinformation: clampSocialValue(
      typeof raw.misinformation === 'number'
        ? raw.misinformation
        : seed.misinformation,
    ),
    gratitude: clampSocialValue(
      typeof raw.gratitude === 'number' ? raw.gratitude : seed.gratitude,
    ),
    crisisSpread: clampSocialValue(
      typeof raw.crisisSpread === 'number' ? raw.crisisSpread : seed.crisisSpread,
    ),
    mediaAttention: clampSocialValue(
      typeof raw.mediaAttention === 'number'
        ? raw.mediaAttention
        : seed.mediaAttention,
    ),
    fatigue: clampSocialValue(
      typeof raw.fatigue === 'number' ? raw.fatigue : seed.fatigue,
    ),
    activeTopicIds,
    lastUpdatedDay:
      typeof raw.lastUpdatedDay === 'number'
        ? Math.max(0, Math.floor(raw.lastUpdatedDay))
        : currentDay,
  };
}

function normalizeTopic(raw: unknown): SocialTopic | null {
  if (!isRecord(raw) || typeof raw.id !== 'string') {
    return null;
  }

  const neighborhoodId = normalizeNeighborhoodId(raw.neighborhoodId);
  if (!neighborhoodId) {
    return null;
  }

  const type =
    typeof raw.type === 'string' &&
    (SOCIAL_TOPIC_TYPES as readonly string[]).includes(raw.type)
      ? (raw.type as SocialTopicType)
      : 'public_question';

  const severity: SocialRiskLevel = isSocialRiskLevel(raw.severity)
    ? raw.severity
    : 'medium';

  const createdDay =
    typeof raw.createdDay === 'number'
      ? Math.max(1, Math.floor(raw.createdDay))
      : 1;

  return {
    id: raw.id,
    neighborhoodId,
    type,
    title: typeof raw.title === 'string' ? raw.title : 'Sosyal konu',
    severity,
    intensity: clampSocialValue(
      typeof raw.intensity === 'number' ? raw.intensity : 50,
    ),
    createdDay,
    expiresDay:
      typeof raw.expiresDay === 'number'
        ? Math.max(createdDay, Math.floor(raw.expiresDay))
        : undefined,
  };
}

function normalizeMention(raw: unknown): SocialMention | null {
  if (!isRecord(raw) || typeof raw.id !== 'string') {
    return null;
  }

  const neighborhoodId = normalizeNeighborhoodId(raw.neighborhoodId);
  if (!neighborhoodId) {
    return null;
  }

  const type =
    typeof raw.type === 'string' &&
    (SOCIAL_MENTION_TYPES as readonly string[]).includes(raw.type)
      ? (raw.type as SocialMentionType)
      : 'neutral';

  const createdDay =
    typeof raw.createdDay === 'number'
      ? Math.max(1, Math.floor(raw.createdDay))
      : 1;

  return {
    id: raw.id,
    neighborhoodId,
    type,
    authorName:
      typeof raw.authorName === 'string' ? raw.authorName : 'Vatandaş',
    message: typeof raw.message === 'string' ? raw.message : '',
    createdDay,
    minuteOffset:
      typeof raw.minuteOffset === 'number'
        ? Math.max(0, Math.floor(raw.minuteOffset))
        : 0,
    likes:
      typeof raw.likes === 'number'
        ? Math.max(0, Math.floor(raw.likes))
        : 0,
    replies:
      typeof raw.replies === 'number'
        ? Math.max(0, Math.floor(raw.replies))
        : 0,
  };
}

function normalizeOutcome(raw: unknown): SocialOutcomeHistory | null {
  if (!isRecord(raw) || typeof raw.id !== 'string') {
    return null;
  }

  const neighborhoodId =
    raw.neighborhoodId != null
      ? normalizeNeighborhoodId(raw.neighborhoodId) ?? undefined
      : undefined;

  return {
    id: raw.id,
    title: typeof raw.title === 'string' ? raw.title : 'Sonuç',
    description: typeof raw.description === 'string' ? raw.description : '',
    pulseDelta:
      typeof raw.pulseDelta === 'number' ? Math.round(raw.pulseDelta) : 0,
    createdDay:
      typeof raw.createdDay === 'number'
        ? Math.max(1, Math.floor(raw.createdDay))
        : 1,
    neighborhoodId,
  };
}

function buildFallbackNeighborhoods(
  day: number,
): Record<string, NeighborhoodSocialProfile> {
  return SOCIAL_NEIGHBORHOOD_IDS.reduce<Record<string, NeighborhoodSocialProfile>>(
    (acc, id) => {
      acc[id] = {
        neighborhoodId: id,
        ...SOCIAL_SEED_PROFILES[id],
        activeTopicIds: [],
        lastUpdatedDay: day,
      };
      return acc;
    },
    {},
  );
}

function syncProfileTopicIds(
  state: SocialPulseState,
): Record<string, NeighborhoodSocialProfile> {
  const topicIdsByNeighborhood = new Map<string, string[]>();
  for (const topic of state.activeTopics) {
    const list = topicIdsByNeighborhood.get(topic.neighborhoodId) ?? [];
    list.push(topic.id);
    topicIdsByNeighborhood.set(topic.neighborhoodId, list);
  }

  const next: Record<string, NeighborhoodSocialProfile> = {};
  for (const id of SOCIAL_NEIGHBORHOOD_IDS) {
    const profile = state.neighborhoods[id];
    if (!profile) {
      continue;
    }
    const linked = topicIdsByNeighborhood.get(id) ?? [];
    const mergedIds = Array.from(
      new Set([...profile.activeTopicIds, ...linked]),
    ).filter((topicId) =>
      state.activeTopics.some((topic) => topic.id === topicId),
    );
    next[id] = {
      ...profile,
      activeTopicIds: mergedIds,
    };
  }
  return next;
}

/**
 * Eksik mahalleleri seed profilleriyle tamamlar, sayısal alanları clamp eder,
 * global skor/risk yeniden hesaplanır.
 */
export function normalizeSocialPulseState(
  input: unknown,
  currentDay?: number,
): SocialPulseState {
  const day = Math.max(1, currentDay ?? 1);
  const fallbackNeighborhoods = buildFallbackNeighborhoods(day);

  if (!isRecord(input)) {
    return recomputeSocialPulseAggregates({
      neighborhoods: fallbackNeighborhoods,
      activeTopics: [],
      mentionFeed: [],
      outcomeHistory: [],
      globalPulseScore: SOCIAL_DEFAULT_LAST_PROCESSED_DAY,
      globalRiskLevel: 'medium',
      lastProcessedDay: Math.max(SOCIAL_DEFAULT_LAST_PROCESSED_DAY, day - 1),
    });
  }

  const rawNeighborhoods = isRecord(input.neighborhoods)
    ? input.neighborhoods
    : {};

  const neighborhoods: Record<string, NeighborhoodSocialProfile> = {};

  for (const id of SOCIAL_NEIGHBORHOOD_IDS) {
    const fallback = fallbackNeighborhoods[id]!;
    neighborhoods[id] = normalizeProfile(
      id,
      rawNeighborhoods[id],
      day,
      fallback,
    );
  }

  const activeTopics = Array.isArray(input.activeTopics)
    ? input.activeTopics
        .map(normalizeTopic)
        .filter((topic): topic is SocialTopic => topic != null)
    : [];

  const mentionFeed = Array.isArray(input.mentionFeed)
    ? input.mentionFeed
        .map(normalizeMention)
        .filter((mention): mention is SocialMention => mention != null)
    : [];

  const outcomeHistory = Array.isArray(input.outcomeHistory)
    ? input.outcomeHistory
        .map(normalizeOutcome)
        .filter((item): item is SocialOutcomeHistory => item != null)
    : [];

  const lastProcessedDay =
    typeof input.lastProcessedDay === 'number'
      ? Math.max(SOCIAL_DEFAULT_LAST_PROCESSED_DAY, Math.floor(input.lastProcessedDay))
      : Math.max(SOCIAL_DEFAULT_LAST_PROCESSED_DAY, day - 1);

  const withTopics: SocialPulseState = {
    neighborhoods,
    activeTopics,
    mentionFeed,
    outcomeHistory,
    globalPulseScore:
      typeof input.globalPulseScore === 'number'
        ? clampSocialValue(input.globalPulseScore)
        : SOCIAL_DEFAULT_LAST_PROCESSED_DAY,
    globalRiskLevel: isSocialRiskLevel(input.globalRiskLevel)
      ? input.globalRiskLevel
      : 'medium',
    lastProcessedDay,
  };

  const synced = {
    ...withTopics,
    neighborhoods: syncProfileTopicIds(withTopics),
  };

  return recomputeSocialPulseAggregates(synced);
}

/** Karar sonrası sosyal nabız — bozuk/eksik state normalize edilir, etki uygulanır. */
export function processSocialPulseAfterDecisionForStore(
  state: SocialPulseState | null | undefined,
  input: SocialDecisionEffectInput,
): SocialPulseState {
  const resolvedDay = Math.max(1, input.day);
  try {
    const normalized = normalizeSocialPulseState(state ?? {}, resolvedDay);
    return applySocialDecisionEffect(normalized, {
      ...input,
      day: resolvedDay,
    }).state;
  } catch {
    return normalizeSocialPulseState(state ?? {}, resolvedDay);
  }
}

export type SocialPulseEndOfDayContext = {
  enrichMainOperation?: boolean;
};

/** Store gün kapanışı — bozuk state normalize edilir, ardından günlük drift uygulanır. */
export function processSocialPulseEndOfDayForStore(
  state: SocialPulseState | null | undefined,
  day: number,
  context?: SocialPulseEndOfDayContext,
): SocialPulseState {
  const resolvedDay = Math.max(1, day);
  let normalized = normalizeSocialPulseState(state ?? {}, resolvedDay);
  if (context?.enrichMainOperation && resolvedDay >= POST_PILOT_FIRST_OPERATION_DAY) {
    const fresh = buildMainOperationSocialMentionsForDay(resolvedDay, 2);
    const existingIds = new Set(normalized.mentionFeed.map((m) => m.id));
    const merged = [
      ...fresh.filter((m) => !existingIds.has(m.id)),
      ...normalized.mentionFeed,
    ].slice(0, 12);
    normalized = { ...normalized, mentionFeed: merged };
  }
  return processSocialPulseEndOfDay(normalized, resolvedDay);
}
