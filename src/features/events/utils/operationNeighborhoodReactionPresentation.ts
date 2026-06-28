import {
  buildDistrictReactionFlavor,
  dedupeDistrictPersonalityCopy,
  mapResultToneToPersonalityOutcome,
} from '@/core/districtPersonality';
import type { SocialEchoPresentation } from '@/core/socialEcho';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';
import type { PostDecisionCityReactionPresentation } from '@/features/events/utils/postDecisionCityReactionPresentation';
import type { EventResultOutcomeBand } from './eventResultRevealPresentation';

export type OperationNeighborhoodReactionTag = {
  id: string;
  label: string;
  tone: 'positive' | 'mixed' | 'warning' | 'neutral';
};

export type OperationNeighborhoodReactionPresentation = {
  visibility: 'visible' | 'hidden';
  districtName: string;
  headline: string;
  message: string;
  tags: OperationNeighborhoodReactionTag[];
  tone: 'positive' | 'mixed' | 'warning' | 'critical' | 'neutral';
  iconKey: string;
};

function clamp(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

function publicDelta(snapshot: DecisionResultSnapshot): number {
  return snapshot.metricChanges.find((metric) => metric.key === 'publicSatisfaction')?.delta ?? 0;
}

function moraleDelta(snapshot: DecisionResultSnapshot): number {
  return snapshot.metricChanges.find((metric) => metric.key === 'personnelMorale')?.delta ?? 0;
}

function buildTrustTag(snapshot: DecisionResultSnapshot): OperationNeighborhoodReactionTag | null {
  const delta = publicDelta(snapshot);
  if (delta >= 3) return { id: 'trust-up', label: `Güven +${delta}`, tone: 'positive' };
  if (delta <= -2) return { id: 'trust-down', label: `Güven ${delta}`, tone: 'warning' };
  if (delta > 0) return { id: 'trust-soft', label: 'Güven toparlanıyor', tone: 'mixed' };
  return null;
}

function buildPatienceTag(
  snapshot: DecisionResultSnapshot,
  strategyId?: EventPlanStrategyId | null,
): OperationNeighborhoodReactionTag | null {
  const social = snapshot.subsystemOutcomes.find((item) => item.key === 'social');
  if (social?.status === 'warning' || social?.status === 'critical') {
    return { id: 'patience', label: 'Sabır sınırda', tone: 'warning' };
  }
  if (strategyId === 'long_term_fix') {
    return { id: 'patience-calm', label: 'Sabır korundu', tone: 'positive' };
  }
  if (strategyId === 'rapid_response') {
    return { id: 'visibility', label: 'Müdahale görünür', tone: 'positive' };
  }
  return null;
}

function buildFatigueTag(snapshot: DecisionResultSnapshot): OperationNeighborhoodReactionTag | null {
  const morale = moraleDelta(snapshot);
  if (morale <= -3) return { id: 'fatigue', label: 'Yorgunluk riski', tone: 'warning' };
  const vehicle = snapshot.subsystemOutcomes.find((item) => item.key === 'vehicle');
  if (vehicle?.status === 'warning' || vehicle?.status === 'critical') {
    return { id: 'route-risk', label: 'Rota baskısı', tone: 'warning' };
  }
  return null;
}

export function buildOperationNeighborhoodReactionPresentation(input: {
  snapshot: DecisionResultSnapshot;
  outcomeBand: EventResultOutcomeBand;
  day?: number;
  strategyId?: EventPlanStrategyId | null;
  cityReaction?: PostDecisionCityReactionPresentation | null;
  socialEcho?: SocialEchoPresentation | null;
  avoidLines?: string[];
}): OperationNeighborhoodReactionPresentation {
  const districtName =
    input.snapshot.neighborhoodName?.trim() ||
    input.cityReaction?.districtName?.trim() ||
    'Mahalle';
  const personalityOutcome = mapResultToneToPersonalityOutcome(
    input.outcomeBand === 'success'
      ? 'positive'
      : input.outcomeBand === 'partial' || input.outcomeBand === 'mixed'
        ? 'mixed'
        : input.outcomeBand === 'risk'
          ? 'warning'
          : 'neutral',
  );

  const flavor = buildDistrictReactionFlavor({
    districtId: input.snapshot.neighborhoodId,
    districtName,
    day: input.day ?? input.snapshot.day,
    outcomeBand: personalityOutcome,
    avoidLines: input.avoidLines,
  });

  const messageCandidates = [
    input.socialEcho?.message?.trim(),
    input.cityReaction?.socialEcho?.line?.trim(),
    input.cityReaction?.shortSummary?.trim(),
    flavor.description,
  ].filter((line): line is string => Boolean(line?.trim()));

  let message = messageCandidates[0] ?? flavor.description;
  for (const candidate of messageCandidates.slice(1)) {
    if (!dedupeDistrictPersonalityCopy(candidate, [message])) {
      message = clamp(`${message} ${candidate}`, 140);
      break;
    }
  }

  const tags: OperationNeighborhoodReactionTag[] = [];
  const trustTag = buildTrustTag(input.snapshot);
  const patienceTag = buildPatienceTag(input.snapshot, input.strategyId);
  const fatigueTag = buildFatigueTag(input.snapshot);

  for (const tag of [trustTag, patienceTag, fatigueTag]) {
    if (tag && tags.length < 2 && !tags.some((existing) => existing.id === tag.id)) {
      tags.push(tag);
    }
  }

  if (tags.length === 0) {
    tags.push({
      id: 'recorded',
      label: input.outcomeBand === 'success' ? 'Tepki olumlu' : 'Kayda geçti',
      tone: input.outcomeBand === 'success' ? 'positive' : 'neutral',
    });
  }

  const tone =
    flavor.tone === 'positive'
      ? 'positive'
      : flavor.tone === 'warning'
        ? 'warning'
        : input.socialEcho?.tone === 'warning'
          ? 'warning'
          : 'mixed';

  return {
    visibility: message.trim() ? 'visible' : 'hidden',
    districtName,
    headline: flavor.title || `${districtName} tepkisi`,
    message: clamp(message, 132),
    tags: tags.slice(0, 2),
    tone,
    iconKey: 'chatbubble-ellipses-outline',
  };
}
