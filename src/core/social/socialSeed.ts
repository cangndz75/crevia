import {
  SOCIAL_DEFAULT_LAST_PROCESSED_DAY,
  SOCIAL_NEIGHBORHOOD_IDS,
  SOCIAL_SEED_PROFILES,
  type SocialNeighborhoodId,
} from './socialConstants';
import { normalizeSocialPulseState } from './socialIntegration';
import { recomputeSocialPulseAggregates } from './socialSelectors';
import type {
  NeighborhoodSocialProfile,
  SocialMention,
  SocialOutcomeHistory,
  SocialPulseState,
  SocialTopic,
} from './socialTypes';

function buildSeedProfile(
  neighborhoodId: SocialNeighborhoodId,
  day: number,
  activeTopicIds: string[],
): NeighborhoodSocialProfile {
  const metrics = SOCIAL_SEED_PROFILES[neighborhoodId];
  return {
    neighborhoodId,
    ...metrics,
    activeTopicIds,
    lastUpdatedDay: day,
  };
}

function buildSeedTopics(day: number): SocialTopic[] {
  return [
    {
      id: 'topic-merkez-flooding',
      neighborhoodId: 'merkez',
      type: 'crisis_pressure',
      title: 'Su tahliyesi ve koku şikayetleri',
      severity: 'high',
      intensity: 72,
      createdDay: day,
      expiresDay: day + 1,
    },
    {
      id: 'topic-sanayi-service-delay',
      neighborhoodId: 'sanayi',
      type: 'service_delay',
      title: 'Toplama gecikmesi tartışması',
      severity: 'medium',
      intensity: 58,
      createdDay: day,
      expiresDay: day + 2,
    },
    {
      id: 'topic-yesilvadi-gratitude',
      neighborhoodId: 'yesilvadi',
      type: 'gratitude_wave',
      title: 'Temizlik ekibine teşekkür mesajları',
      severity: 'low',
      intensity: 44,
      createdDay: day,
    },
  ];
}

function buildSeedMentions(day: number): SocialMention[] {
  return [
    {
      id: 'mention-merkez-1',
      neighborhoodId: 'merkez',
      type: 'complaint',
      authorName: 'Ayşe Yılmaz',
      message: 'Sokağımızda biriken sulardan geçemiyoruz.',
      createdDay: day,
      minuteOffset: 12,
      likes: 24,
      replies: 8,
    },
    {
      id: 'mention-istasyon-1',
      neighborhoodId: 'istasyon',
      type: 'gratitude',
      authorName: 'Mehmet Kaya',
      message: 'Temizlik ekipleri dün gece boyunca çalıştı, teşekkürler!',
      createdDay: day,
      minuteOffset: 28,
      likes: 56,
      replies: 12,
    },
    {
      id: 'mention-cumhuriyet-1',
      neighborhoodId: 'cumhuriyet',
      type: 'crisis',
      authorName: 'Fatma Demir',
      message: 'Alt geçit tamamen su altında, acil müdahale lazım.',
      createdDay: day,
      minuteOffset: 45,
      likes: 41,
      replies: 15,
    },
  ];
}

function buildSeedOutcomeHistory(day: number): SocialOutcomeHistory[] {
  return [
    {
      id: 'outcome-seed-1',
      title: 'Açıklama Yapıldı',
      description: 'Halk bilgilendirildi',
      pulseDelta: 18,
      createdDay: Math.max(1, day - 1),
      neighborhoodId: 'merkez',
    },
  ];
}

export function createInitialSocialPulseState(
  currentDay = 1,
): SocialPulseState {
  const day = Math.max(1, currentDay);
  const activeTopics = buildSeedTopics(day);
  const neighborhoods = SOCIAL_NEIGHBORHOOD_IDS.reduce<
    Record<string, NeighborhoodSocialProfile>
  >((acc, id) => {
    const linkedTopicIds = activeTopics
      .filter((topic) => topic.neighborhoodId === id)
      .map((topic) => topic.id);
    acc[id] = buildSeedProfile(id, day, linkedTopicIds);
    return acc;
  }, {});

  const base: SocialPulseState = {
    neighborhoods,
    activeTopics,
    mentionFeed: buildSeedMentions(day),
    outcomeHistory: buildSeedOutcomeHistory(day),
    globalPulseScore: SOCIAL_DEFAULT_LAST_PROCESSED_DAY,
    globalRiskLevel: 'medium',
    lastProcessedDay: Math.max(SOCIAL_DEFAULT_LAST_PROCESSED_DAY, day - 1),
  };

  return recomputeSocialPulseAggregates(base);
}

export function normalizePersistedSocialPulseState(
  raw: unknown,
  currentDay: number,
): SocialPulseState {
  const day = Math.max(1, currentDay);

  if (raw === null || raw === undefined) {
    return createInitialSocialPulseState(day);
  }

  return normalizeSocialPulseState(raw, day);
}
