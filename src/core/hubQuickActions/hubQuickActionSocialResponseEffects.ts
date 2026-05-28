import { SOCIAL_OUTCOME_HISTORY_MAX } from '@/core/social/socialConstants';
import { normalizeSocialPulseState } from '@/core/social/socialIntegration';
import { hasSocialQuickActionLock } from '@/core/social/socialQuickAction';
import {
  calculateNeighborhoodSocialScore,
  clampSocialValue,
  recomputeSocialPulseAggregates,
} from '@/core/social/socialSelectors';
import type {
  NeighborhoodSocialProfile,
  SocialOutcomeHistory,
  SocialPulseState,
  SocialProfileMetricDeltas,
} from '@/core/social/socialTypes';

import type { SocialResponseAssignment, SocialResponseType } from './hubQuickActionTypes';

export type ApplySocialResponseEffectInput = {
  socialPulseState: SocialPulseState | null | undefined;
  assignment: SocialResponseAssignment;
  currentDay: number;
};

export type ApplySocialResponseEffectResult = {
  success: boolean;
  blocked: boolean;
  message?: string;
  state: SocialPulseState;
  changed: boolean;
  pulseDelta: number;
};

function resolveTopicKey(assignment: SocialResponseAssignment): string {
  if (assignment.targetTopicId) {
    return assignment.targetTopicId;
  }
  if (assignment.targetNeighborhoodId) {
    return `neighborhood-${assignment.targetNeighborhoodId}`;
  }
  return 'fallback';
}

function deltasForResponseType(
  responseType: SocialResponseType,
): SocialProfileMetricDeltas {
  switch (responseType) {
    case 'clarify':
      return {
        misinformation: -6,
        crisisSpread: -2,
        trust: 1,
      };
    case 'empathize':
      return {
        complaintHeat: -4,
        trust: 2,
        fatigue: -1,
      };
    case 'inform':
      return {
        misinformation: -3,
        complaintHeat: -2,
        trust: 1,
      };
    case 'deescalate':
      return {
        crisisSpread: -5,
        complaintHeat: -2,
        trust: 1,
      };
    default:
      return {
        misinformation: -3,
        complaintHeat: -2,
        trust: 1,
      };
  }
}

function applyMetricDeltas(
  profile: NeighborhoodSocialProfile,
  deltas: SocialProfileMetricDeltas,
): NeighborhoodSocialProfile {
  const apply = (current: number, delta: number | undefined) =>
    delta == null ? current : clampSocialValue(current + delta);

  return {
    ...profile,
    trust: apply(profile.trust, deltas.trust),
    complaintHeat: apply(profile.complaintHeat, deltas.complaintHeat),
    misinformation: apply(profile.misinformation, deltas.misinformation),
    gratitude: apply(profile.gratitude, deltas.gratitude),
    crisisSpread: apply(profile.crisisSpread, deltas.crisisSpread),
    mediaAttention: apply(profile.mediaAttention, deltas.mediaAttention),
    fatigue: apply(profile.fatigue, deltas.fatigue),
    lastUpdatedDay: profile.lastUpdatedDay,
  };
}

function ensureProfile(
  state: SocialPulseState,
  neighborhoodId: string,
  day: number,
): NeighborhoodSocialProfile {
  const existing = state.neighborhoods[neighborhoodId];
  if (existing) {
    return { ...existing, activeTopicIds: [...existing.activeTopicIds] };
  }

  const { createInitialSocialPulseState } =
    require('@/core/social/socialSeed') as typeof import('@/core/social/socialSeed');
  const seed = createInitialSocialPulseState(day);
  const fallback = seed.neighborhoods[neighborhoodId];
  if (fallback) {
    return { ...fallback, activeTopicIds: [...fallback.activeTopicIds] };
  }

  return {
    neighborhoodId,
    trust: 50,
    complaintHeat: 30,
    misinformation: 20,
    gratitude: 35,
    crisisSpread: 25,
    mediaAttention: 30,
    fatigue: 25,
    activeTopicIds: [],
    lastUpdatedDay: day,
  };
}

export function applySocialResponseEffect(
  input: ApplySocialResponseEffectInput,
): ApplySocialResponseEffectResult {
  const day = Math.max(1, input.currentDay);
  const topicKey = resolveTopicKey(input.assignment);
  const neighborhoodId = input.assignment.targetNeighborhoodId ?? 'merkez';

  let normalized: SocialPulseState;
  try {
    normalized = normalizeSocialPulseState(input.socialPulseState ?? {}, day);
  } catch {
    const fallback = normalizeSocialPulseState({}, day);
    return {
      success: false,
      blocked: false,
      message: 'Sosyal nabız güncellenemedi.',
      state: fallback,
      changed: false,
      pulseDelta: 0,
    };
  }

  if (hasSocialQuickActionLock(normalized, topicKey, day)) {
    return {
      success: false,
      blocked: true,
      message: 'Bu gündeme bugün zaten yanıt verildi.',
      state: normalized,
      changed: false,
      pulseDelta: 0,
    };
  }

  const profile = ensureProfile(normalized, neighborhoodId, day);
  const scoreBefore = calculateNeighborhoodSocialScore(profile);
  const deltas = deltasForResponseType(input.assignment.responseType);
  const updatedProfile = applyMetricDeltas(profile, deltas);
  updatedProfile.lastUpdatedDay = day;

  const scoreAfter = calculateNeighborhoodSocialScore(updatedProfile);
  const pulseDelta = scoreAfter - scoreBefore;

  const outcome: SocialOutcomeHistory = {
    id: `hub-social-response-${day}-${topicKey}`,
    title: 'Hub Sosyal Yanıt',
    description: input.assignment.targetTopicTitle
      ? `${input.assignment.targetTopicTitle} için kısa açıklama planlandı.`
      : `${input.assignment.targetNeighborhoodLabel ?? neighborhoodId} gündemi için kısa açıklama planlandı.`,
    pulseDelta,
    createdDay: day,
    neighborhoodId,
  };

  const nextState = recomputeSocialPulseAggregates({
    ...normalized,
    neighborhoods: {
      ...normalized.neighborhoods,
      [neighborhoodId]: updatedProfile,
    },
    activeTopics: [...normalized.activeTopics],
    mentionFeed: [...normalized.mentionFeed],
    outcomeHistory: [outcome, ...normalized.outcomeHistory].slice(
      0,
      SOCIAL_OUTCOME_HISTORY_MAX,
    ),
  });

  return {
    success: true,
    blocked: false,
    state: nextState,
    changed: true,
    pulseDelta,
  };
}
