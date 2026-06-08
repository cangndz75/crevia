import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import type { OnboardingStarterDecisionId } from '@/core/onboarding/onboardingStarterDecision';

export type OnboardingPilotDistrictId =
  | 'merkez'
  | 'cumhuriyet'
  | 'sanayi'
  | 'istasyon'
  | 'yesilvadi';

export type OnboardingDecisionStyle =
  | 'fast_response'
  | 'planned_solution'
  | 'partial_intervention';

export type OnboardingContinuationTone =
  | 'low'
  | 'medium'
  | 'high'
  | 'balanced'
  | 'watch';

export type OnboardingImpactTone =
  | 'positive'
  | 'balanced'
  | 'watch'
  | 'pressure';

export type OnboardingContinuationViewModel = {
  eceIntro: {
    title: string;
    body: string;
    advisorLabel: string;
    toneChip: string;
    fieldFocus: string;
    decisionApproach: string;
  };
  fieldBriefing: {
    districtName: string;
    title: string;
    body: string;
    focus: string;
    caution: string;
    chips: Array<{
      label: string;
      value: string;
      tone: OnboardingContinuationTone;
    }>;
  };
  firstImpact: {
    title: string;
    body: string;
    effects: Array<{
      label: string;
      value: string;
      body: string;
      tone: OnboardingImpactTone;
    }>;
  };
  cityReaction: {
    districtName: string;
    mapHint: string;
    socialBubble: string;
    eceLine: string;
    reactionTone: 'positive' | 'balanced' | 'watch';
  };
  centerUnlocked: {
    title: string;
    body: string;
    lines: string[];
  };
};

export type OnboardingContinuationStepId =
  | 'region'
  | 'decision'
  | 'ece_briefing'
  | 'field_briefing'
  | 'first_impact'
  | 'city_reaction'
  | 'center_unlocked';

export type OnboardingContinuationStepMeta = {
  id: OnboardingContinuationStepId;
  title: string;
  titleLines?: string[];
  body: string;
  primaryLabel: string;
};

export type OnboardingDistrictOption = {
  id: OnboardingPilotDistrictId;
  gameDistrictId: PilotDistrictId;
  title: string;
  description: string;
  recommended?: boolean;
  badges: Array<{ label: string; icon: string }>;
  metrics: {
    socialRisk: { label: string; value: string; tone: 'low' | 'mid' | 'high' };
    staffPace: { label: string; value: string; tone: 'low' | 'mid' | 'high' };
    difficulty: { label: string; value: string; tone: 'low' | 'mid' | 'high' };
  };
};

export function starterDecisionToContinuationStyle(
  decisionId: OnboardingStarterDecisionId,
): OnboardingDecisionStyle {
  if (decisionId === 'planned') return 'planned_solution';
  if (decisionId === 'partial') return 'partial_intervention';
  return 'fast_response';
}
