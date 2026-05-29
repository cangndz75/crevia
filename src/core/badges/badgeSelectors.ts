import { buildAuthorityDailyGainInput } from '@/core/authority/authoritySelectors';
import type { AuthorityDailyGainSnapshot } from '@/core/authority/authorityTypes';
import type { ContainerState } from '@/core/containers/containerTypes';
import type { DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import type { ButterflyHookState } from '@/core/events/butterflyHookTypes';
import type { HubQuickActionState } from '@/core/hubQuickActions/hubQuickActionTypes';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DailyEventSet } from '@/core/models/DailyEventSet';
import type { EventCard } from '@/core/models/EventCard';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { PersonnelState } from '@/core/personnel/personnelTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';

import { deriveBadgeEvaluationRuleFlags } from './badgeEvaluationRules';
import type { EvaluateDailyBadgesInput } from './badgeTypes';

export type BuildDailyBadgeEvaluationInputParams = {
  day: number;
  decisionHistory: DecisionRecord[];
  activeEvents: EventCard[];
  eventPool?: EventCard[];
  dailyEventSet?: DailyEventSet | null;
  dailyGoalState?: DailyGoalState | null;
  metricsBefore?: GameMetrics | null;
  metricsAfter: GameMetrics;
  socialPulseStateBefore?: SocialPulseState | null;
  socialPulseStateAfter?: SocialPulseState | null;
  butterflyHookState?: ButterflyHookState | null;
  containerState?: ContainerState | null;
  vehicleState?: VehicleState | null;
  personnelState?: PersonnelState | null;
  hubQuickActionState?: HubQuickActionState | null;
  authorityDailyGain?: AuthorityDailyGainSnapshot | null;
};

export function buildDailyBadgeEvaluationInput(
  params: BuildDailyBadgeEvaluationInputParams,
): Omit<EvaluateDailyBadgesInput, 'badgeState' | 'day'> {
  const authorityInput = buildAuthorityDailyGainInput({
    day: params.day,
    dailyEventSet: params.dailyEventSet,
    decisionHistory: params.decisionHistory,
    activeEvents: params.activeEvents,
    dailyGoalState: params.dailyGoalState,
    metricsBefore: params.metricsBefore,
    metricsAfter: params.metricsAfter,
    socialPulseStateBefore: params.socialPulseStateBefore,
    socialPulseStateAfter: params.socialPulseStateAfter,
    butterflyHookState: params.butterflyHookState,
  });

  return deriveBadgeEvaluationRuleFlags({
    day: params.day,
    decisionHistory: params.decisionHistory,
    activeEvents: params.activeEvents,
    eventPool: params.eventPool,
    metricsBefore: params.metricsBefore,
    metricsAfter: params.metricsAfter,
    socialPulseStateAfter: params.socialPulseStateAfter,
    butterflyHookState: params.butterflyHookState,
    containerState: params.containerState,
    vehicleState: params.vehicleState,
    personnelState: params.personnelState,
    hubQuickActionState: params.hubQuickActionState,
    authorityInput,
    authorityNetGain: params.authorityDailyGain?.netGain ?? 0,
  });
}
