import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import {
  DAY1_LEARNING_EVENT_IDS,
  type Day1LearningEventId,
} from '@/features/tutorial/tutorialTypes';

export const ONBOARDING_STARTER_DECISION_IDS = ['fast', 'planned', 'partial'] as const;

export type OnboardingStarterDecisionId = (typeof ONBOARDING_STARTER_DECISION_IDS)[number];

export type Day1ResponseStyle = OnboardingStarterDecisionId;

const DISTRICT_DAY1_EVENT: Record<PilotDistrictId, Day1LearningEventId> = {
  central: 'central_day1_learning_main_street',
  cumhuriyet: 'cumhuriyet_day1_learning_complaint',
  industrial_market: 'industrial_market_day1_learning_market_waste',
};

const DISTRICT_DECISION_PREFIX: Record<PilotDistrictId, string> = {
  central: 'central-d1',
  cumhuriyet: 'cumhuriyet-d1',
  industrial_market: 'industrial-d1',
};

const STARTER_TO_DAY1_SUFFIX: Record<OnboardingStarterDecisionId, string> = {
  fast: 'assign',
  planned: 'follow',
  partial: 'communicate',
};

export function isOnboardingStarterDecisionId(
  value: string,
): value is OnboardingStarterDecisionId {
  return (ONBOARDING_STARTER_DECISION_IDS as readonly string[]).includes(value);
}

export function resolveOnboardingStarterDecision(
  districtId: PilotDistrictId,
  starterDecision: OnboardingStarterDecisionId,
): { eventId: Day1LearningEventId; decisionId: string; responseStyle: Day1ResponseStyle } {
  const prefix = DISTRICT_DECISION_PREFIX[districtId];
  const suffix = STARTER_TO_DAY1_SUFFIX[starterDecision];

  return {
    eventId: DISTRICT_DAY1_EVENT[districtId],
    decisionId: `${prefix}-${suffix}`,
    responseStyle: starterDecision,
  };
}

export function isDay1LearningEventIdForDistrict(eventId: string): eventId is Day1LearningEventId {
  return (DAY1_LEARNING_EVENT_IDS as readonly string[]).includes(eventId);
}
