import { buildAuthorityDailyGainInput } from '@/core/authority/authoritySelectors';
import type { AuthorityDailyGainSnapshot } from '@/core/authority/authorityTypes';
import type { ContainerState } from '@/core/containers/containerTypes';
import type { DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import type { ButterflyHookState } from '@/core/events/butterflyHookTypes';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DailyEventSet } from '@/core/models/DailyEventSet';
import type { EventCard } from '@/core/models/EventCard';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';

import type { EvaluateDailyBadgesInput } from './badgeTypes';

export type BuildDailyBadgeEvaluationInputParams = {
  day: number;
  decisionHistory: DecisionRecord[];
  activeEvents: EventCard[];
  dailyEventSet?: DailyEventSet | null;
  dailyGoalState?: DailyGoalState | null;
  metricsBefore?: GameMetrics | null;
  metricsAfter: GameMetrics;
  socialPulseStateBefore?: SocialPulseState | null;
  socialPulseStateAfter?: SocialPulseState | null;
  butterflyHookState?: ButterflyHookState | null;
  containerState?: ContainerState | null;
  vehicleState?: VehicleState | null;
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

  const decisionsToday = params.decisionHistory.filter(
    (record) => record.day === params.day,
  ).length;

  const authorityNetGain = params.authorityDailyGain?.netGain ?? 0;
  const positiveOperationDay =
    authorityNetGain > 0 ||
    (decisionsToday > 0 && !authorityInput.criticalEventUnresolved);

  const containerRiskControlled =
    params.containerState != null
      ? Object.values(params.containerState.aggregates).reduce(
          (sum, status) => sum + status.criticalContainerCount,
          0,
        ) === 0
      : true;

  const vehicleDayPositive =
    decisionsToday > 0 &&
    (params.vehicleState?.aggregates?.broken ?? 0) === 0;

  return {
    positiveOperationDay,
    socialPulseBalanced: authorityInput.socialPulseBalanced,
    budgetNotSeriouslyDamaged: authorityInput.budgetNotSeriouslyDamaged,
    personnelMoraleMaintained: authorityInput.personnelMoraleMaintained,
    criticalRiskClosedWithoutGrowth:
      authorityInput.criticalRiskClosedWithoutGrowth,
    butterflyFollowUpWellManaged: authorityInput.butterflyFollowUpWellManaged,
    vehicleDayPositive,
    containerRiskControlled,
  };
}
