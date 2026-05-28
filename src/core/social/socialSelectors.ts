import {
  SOCIAL_RISK_LEVELS,
  SOCIAL_RISK_SCORE_THRESHOLDS,
  SOCIAL_SCORE_WEIGHTS,
  SOCIAL_VALUE_MAX,
  SOCIAL_VALUE_MIN,
} from './socialConstants';
import type {
  GlobalSocialPulseSummary,
  NeighborhoodSocialProfile,
  NeighborhoodSocialRiskView,
  SocialMention,
  SocialOutcomeHistory,
  SocialPulseRootState,
  SocialPulseState,
  SocialRiskLevel,
  SocialTopic,
} from './socialTypes';

export function clampSocialValue(value: number): number {
  if (!Number.isFinite(value)) {
    return SOCIAL_VALUE_MIN;
  }
  return Math.round(
    Math.min(SOCIAL_VALUE_MAX, Math.max(SOCIAL_VALUE_MIN, value)),
  );
}

function riskCalmContribution(value: number, weight: number): number {
  return (SOCIAL_VALUE_MAX - clampSocialValue(value)) * weight;
}

export function calculateNeighborhoodSocialScore(
  profile: NeighborhoodSocialProfile,
): number {
  const w = SOCIAL_SCORE_WEIGHTS;
  const raw =
    profile.trust * w.trust +
    profile.gratitude * w.gratitude +
    riskCalmContribution(profile.complaintHeat, w.complaintCalm) +
    riskCalmContribution(profile.misinformation, w.informationClarity) +
    riskCalmContribution(profile.crisisSpread, w.crisisControl) +
    riskCalmContribution(profile.mediaAttention, w.mediaCalm) +
    riskCalmContribution(profile.fatigue, w.fatigueReserve);

  return clampSocialValue(raw);
}

export function getSocialRiskLevel(score: number): SocialRiskLevel {
  const clamped = clampSocialValue(score);
  if (clamped >= SOCIAL_RISK_SCORE_THRESHOLDS.lowMin) {
    return 'low';
  }
  if (clamped >= SOCIAL_RISK_SCORE_THRESHOLDS.mediumMin) {
    return 'medium';
  }
  if (clamped >= SOCIAL_RISK_SCORE_THRESHOLDS.highMin) {
    return 'high';
  }
  return 'critical';
}

export function calculateGlobalSocialPulseScore(state: SocialPulseState): number {
  const profiles = Object.values(state.neighborhoods);
  if (profiles.length === 0) {
    return SOCIAL_VALUE_MIN;
  }

  const total = profiles.reduce(
    (sum, profile) => sum + calculateNeighborhoodSocialScore(profile),
    0,
  );

  return clampSocialValue(total / profiles.length);
}

export function recomputeSocialPulseAggregates(
  state: SocialPulseState,
): SocialPulseState {
  const globalPulseScore = calculateGlobalSocialPulseScore(state);
  return {
    ...state,
    globalPulseScore,
    globalRiskLevel: getSocialRiskLevel(globalPulseScore),
  };
}

function resolveFallbackSocialPulseState(): SocialPulseState {
  // Lazy require — socialSeed ↔ socialIntegration döngüsünü kırar.
  const { createInitialSocialPulseState } =
    require('./socialSeed') as typeof import('./socialSeed');
  return createInitialSocialPulseState(1);
}

export function selectSocialPulseState(
  rootState: SocialPulseRootState,
): SocialPulseState {
  return rootState.socialPulseState ?? resolveFallbackSocialPulseState();
}

export function selectGlobalSocialPulseSummary(
  state: SocialPulseState,
): GlobalSocialPulseSummary {
  return {
    globalPulseScore: state.globalPulseScore,
    globalRiskLevel: state.globalRiskLevel,
  };
}

export function selectNeighborhoodSocialRisks(
  state: SocialPulseState,
): NeighborhoodSocialRiskView[] {
  return Object.values(state.neighborhoods)
    .map((profile) => {
      const score = calculateNeighborhoodSocialScore(profile);
      return {
        neighborhoodId: profile.neighborhoodId,
        score,
        riskLevel: getSocialRiskLevel(score),
        profile,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function selectActiveSocialTopics(state: SocialPulseState): SocialTopic[] {
  return state.activeTopics;
}

export function selectSocialMentionFeed(state: SocialPulseState): SocialMention[] {
  return state.mentionFeed;
}

export function selectSocialOutcomeHistory(
  state: SocialPulseState,
): SocialOutcomeHistory[] {
  return state.outcomeHistory;
}

export function isSocialRiskLevel(value: unknown): value is SocialRiskLevel {
  return (
    typeof value === 'string' &&
    (SOCIAL_RISK_LEVELS as readonly string[]).includes(value)
  );
}
