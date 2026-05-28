import type { EventCard } from '@/core/models/EventCard';
import type { Neighborhood } from '@/core/models/Neighborhood';
import { eventSeverity } from '@/core/utils/eventPriority';
import { selectNeighborhoodSocialRisks } from '@/core/social/socialSelectors';
import type { SocialPulseState, SocialRiskLevel, SocialTopic } from '@/core/social/socialTypes';

import type {
  SocialResponseAssignment,
  SocialResponseSource,
  SocialResponseType,
} from './hubQuickActionTypes';

export type SocialResponsePlanContext = {
  socialPulseState?: SocialPulseState;
  activeEvents: EventCard[];
  neighborhoods: Neighborhood[];
};

const SEVERITY_RANK: Record<SocialRiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const SOCIAL_EVENT_KEYWORDS = [
  'sosyal',
  'şikayet',
  'sikayet',
  'vatandaş',
  'vatandas',
  'gündem',
  'gundem',
  'medya',
  'viral',
  'söylenti',
  'soylenti',
  'memnuniyet',
  'guven',
  'güven',
] as const;

function normalizeHaystack(...parts: Array<string | undefined>): string {
  return parts
    .filter((p): p is string => typeof p === 'string' && p.length > 0)
    .join(' ')
    .toLowerCase();
}

function includesAny(haystack: string, keywords: readonly string[]): boolean {
  return keywords.some((kw) => haystack.includes(kw));
}

function pickPrimaryTopic(topics: SocialTopic[]): SocialTopic | null {
  if (topics.length === 0) return null;
  return [...topics].sort((a, b) => {
    const severityDiff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.intensity - a.intensity;
  })[0] ?? null;
}

function pickRiskiestSocialNeighborhood(
  socialPulseState: SocialPulseState | undefined,
): string | null {
  if (!socialPulseState) return null;
  const risks = selectNeighborhoodSocialRisks(socialPulseState);
  const worst = risks[0];
  if (
    worst &&
    (worst.riskLevel === 'critical' ||
      worst.riskLevel === 'high' ||
      worst.score >= 55)
  ) {
    return worst.neighborhoodId;
  }
  return null;
}

function pickSocialThemedEvent(
  activeEvents: EventCard[],
  neighborhoods: Neighborhood[],
): EventCard | null {
  const ranked = [...activeEvents]
    .filter((event) => {
      const haystack = normalizeHaystack(
        event.title,
        event.description,
        event.category,
        event.eventType,
        event.contextTag,
      );
      return includesAny(haystack, SOCIAL_EVENT_KEYWORDS);
    })
    .sort((a, b) => eventSeverity(b) - eventSeverity(a));
  for (const event of ranked) {
    if (event.neighborhoodId || event.district) {
      const id = resolveNeighborhoodId(
        event.neighborhoodId,
        event.district,
        neighborhoods,
      );
      if (id) return event;
    }
  }
  return null;
}

function resolveNeighborhoodId(
  rawId: string | undefined,
  districtName: string | undefined,
  neighborhoods: Neighborhood[],
): string | undefined {
  if (rawId) {
    const byId = neighborhoods.find((n) => n.id === rawId);
    if (byId) return byId.id;
    if (rawId.trim().length > 0) return rawId.trim();
  }
  if (districtName) {
    const byName = neighborhoods.find((n) => n.name === districtName);
    if (byName) return byName.id;
    if (neighborhoods.some((n) => n.id === districtName)) return districtName;
  }
  return rawId;
}

function fallbackNeighborhoodId(
  neighborhoods: Neighborhood[],
  socialPulseState: SocialPulseState | undefined,
): string | null {
  const merkez = neighborhoods.find((n) => n.id === 'merkez');
  if (merkez) return merkez.id;
  if (neighborhoods[0]) return neighborhoods[0].id;
  const socialIds = socialPulseState
    ? Object.keys(socialPulseState.neighborhoods)
    : [];
  if (socialIds.includes('merkez')) return 'merkez';
  return socialIds[0] ?? null;
}

function resolveNeighborhoodLabel(
  neighborhoodId: string,
  neighborhoods: Neighborhood[],
): string {
  const fromList = neighborhoods.find((n) => n.id === neighborhoodId);
  if (fromList) return fromList.name;
  const labels: Record<string, string> = {
    merkez: 'Merkez',
    sanayi: 'Sanayi',
    yesilvadi: 'Yeşilvadi',
    istasyon: 'İstasyon',
    cumhuriyet: 'Cumhuriyet',
  };
  return labels[neighborhoodId] ?? neighborhoodId;
}

export function resolveSocialResponseType(params: {
  topic: SocialTopic | null;
  profile?: {
    misinformation: number;
    complaintHeat: number;
    crisisSpread: number;
    fatigue: number;
  };
}): SocialResponseType {
  const { topic, profile } = params;

  if (topic?.type === 'misinformation') return 'clarify';
  if (profile && profile.misinformation >= 55) return 'clarify';

  if (topic?.type === 'public_question' || topic?.type === 'service_delay') {
    return 'inform';
  }

  if (profile && profile.crisisSpread >= 55) return 'deescalate';
  if (topic?.type === 'crisis_pressure') return 'deescalate';

  if (
    topic?.type === 'complaint_wave' ||
    (profile && profile.complaintHeat >= 55)
  ) {
    return profile && profile.complaintHeat >= 65 ? 'empathize' : 'deescalate';
  }

  if (topic?.type === 'gratitude_wave') return 'inform';

  return 'inform';
}

export function buildSocialResponseAssignment(
  context: SocialResponsePlanContext,
  currentDay: number,
): SocialResponseAssignment | null {
  const { socialPulseState, activeEvents, neighborhoods } = context;
  const topics = socialPulseState?.activeTopics ?? [];
  const primaryTopic = pickPrimaryTopic(topics);

  let targetNeighborhoodId: string | undefined;
  let source: SocialResponseSource = 'fallback';
  let targetTopicId: string | undefined;
  let targetTopicTitle: string | undefined;

  if (primaryTopic) {
    targetTopicId = primaryTopic.id;
    targetTopicTitle = primaryTopic.title;
    targetNeighborhoodId =
      resolveNeighborhoodId(
        primaryTopic.neighborhoodId,
        undefined,
        neighborhoods,
      ) ?? primaryTopic.neighborhoodId;
    source = 'active_topic';
  }

  if (!targetNeighborhoodId) {
    const socialWorst = pickRiskiestSocialNeighborhood(socialPulseState);
    if (socialWorst) {
      targetNeighborhoodId = socialWorst;
      source = 'social_pressure';
    }
  }

  if (!targetNeighborhoodId) {
    const socialEvent = pickSocialThemedEvent(activeEvents, neighborhoods);
    if (socialEvent) {
      targetNeighborhoodId = resolveNeighborhoodId(
        socialEvent.neighborhoodId,
        socialEvent.district,
        neighborhoods,
      );
      source = 'active_event';
    }
  }

  if (!targetNeighborhoodId) {
    targetNeighborhoodId =
      fallbackNeighborhoodId(neighborhoods, socialPulseState) ?? undefined;
    source = 'fallback';
  }

  if (!targetNeighborhoodId) {
    return null;
  }

  const profile = socialPulseState?.neighborhoods[targetNeighborhoodId];
  const responseType = resolveSocialResponseType({
    topic: primaryTopic,
    profile: profile
      ? {
          misinformation: profile.misinformation,
          complaintHeat: profile.complaintHeat,
          crisisSpread: profile.crisisSpread,
          fatigue: profile.fatigue,
        }
      : undefined,
  });

  const targetNeighborhoodLabel = resolveNeighborhoodLabel(
    targetNeighborhoodId,
    neighborhoods,
  );

  const label = targetTopicTitle
    ? `${targetTopicTitle} — sosyal yanıt`
    : `${targetNeighborhoodLabel} — sosyal yanıt`;
  const effectLabel = targetTopicTitle
    ? `${targetTopicTitle} gündemi`
    : `${targetNeighborhoodLabel} gündemi`;

  return {
    day: currentDay,
    targetTopicId,
    targetTopicTitle,
    targetNeighborhoodId,
    targetNeighborhoodLabel,
    responseType,
    source,
    label,
    effectLabel,
  };
}

export function buildSocialResponseResultLines(
  assignment: SocialResponseAssignment,
): { resultLine: string; detailLine: string } {
  const detailLine =
    'Sosyal yayılımı ve yanlış bilgi riskini küçük ölçekte azaltır.';

  if (assignment.targetTopicTitle) {
    return {
      resultLine: `Sosyal Yanıt hazırlandı: ‘${assignment.targetTopicTitle}’ gündemi için açıklama planlandı.`,
      detailLine,
    };
  }

  const neighborhood = assignment.targetNeighborhoodLabel ?? 'Mahalle';
  return {
    resultLine: `Sosyal Yanıt hazırlandı: ${neighborhood} gündemi için kısa açıklama planlandı.`,
    detailLine,
  };
}
