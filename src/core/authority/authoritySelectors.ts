import type { DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import type { ButterflyHookState } from '@/core/events/butterflyHookTypes';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DailyEventSet } from '@/core/models/DailyEventSet';
import type { EventCard } from '@/core/models/EventCard';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { SocialPulseState } from '@/core/social/socialTypes';

import type { CalculateDailyAuthorityTrustGainInput } from './authorityTypes';

const LOW_MORALE_THRESHOLD = 45;
const LOW_BUDGET_THRESHOLD = 50_000;
const SEVERE_BUDGET_DROP = 8_000;
const SEVERE_MORALE_DROP = 8;
const SOCIAL_CRISIS_GROWTH = 6;

export type BuildAuthorityDailyGainInputParams = {
  day: number;
  dailyEventSet?: DailyEventSet | null;
  decisionHistory: DecisionRecord[];
  activeEvents: EventCard[];
  dailyGoalState?: DailyGoalState | null;
  metricsBefore?: GameMetrics | null;
  metricsAfter: GameMetrics;
  socialPulseStateBefore?: SocialPulseState | null;
  socialPulseStateAfter?: SocialPulseState | null;
  butterflyHookState?: ButterflyHookState | null;
};

function decisionsForDay(
  decisionHistory: DecisionRecord[],
  day: number,
): DecisionRecord[] {
  return decisionHistory.filter((record) => record.day === day);
}

function resolvedEventIdsForDay(
  decisionHistory: DecisionRecord[],
  day: number,
): Set<string> {
  return new Set(
    decisionsForDay(decisionHistory, day).map((record) => record.eventId),
  );
}

export function buildAuthorityDailyGainInput(
  params: BuildAuthorityDailyGainInputParams,
): CalculateDailyAuthorityTrustGainInput {
  const {
    day,
    dailyEventSet,
    decisionHistory,
    activeEvents,
    dailyGoalState,
    metricsBefore,
    metricsAfter,
    socialPulseStateBefore,
    socialPulseStateAfter,
    butterflyHookState,
  } = params;

  const resolvedToday = resolvedEventIdsForDay(decisionHistory, day);

  const mainEventResolved =
    dailyEventSet != null
      ? resolvedToday.has(dailyEventSet.anchorEventId)
      : decisionsForDay(decisionHistory, day).length > 0;

  const sideEventsResolvedCount =
    dailyEventSet != null
      ? dailyEventSet.sideEventIds.filter((id) => resolvedToday.has(id)).length
      : Math.max(0, resolvedToday.size - (mainEventResolved ? 1 : 0));

  const dailyGoalsCompletedCount =
    dailyGoalState?.goals.filter((goal) => goal.isCompleted).length ?? 0;

  const criticalEventUnresolved = activeEvents.some(
    (event) => event.riskLevel === 'critical' || event.riskLevel === 'high',
  );

  const criticalRiskClosedWithoutGrowth =
    !criticalEventUnresolved &&
    (dailyEventSet?.eventStatuses
      ? Object.values(dailyEventSet.eventStatuses).some(
          (status) => status === 'resolved' || status === 'escalated',
        )
      : resolvedToday.size > 0);

  const budgetBefore = metricsBefore?.budget ?? metricsAfter.budget;
  const budgetDrop = budgetBefore - metricsAfter.budget;
  const budgetNotSeriouslyDamaged =
    metricsAfter.budget >= LOW_BUDGET_THRESHOLD && budgetDrop < SEVERE_BUDGET_DROP;
  const budgetSeverelyDropped =
    metricsAfter.budget < LOW_BUDGET_THRESHOLD || budgetDrop >= SEVERE_BUDGET_DROP;

  const moraleBefore = metricsBefore?.staffMorale ?? metricsAfter.staffMorale;
  const moraleDrop = moraleBefore - metricsAfter.staffMorale;
  const personnelMoraleMaintained =
    metricsAfter.staffMorale >= LOW_MORALE_THRESHOLD &&
    moraleDrop < SEVERE_MORALE_DROP;
  const personnelMoraleSeverelyDropped =
    metricsAfter.staffMorale < LOW_MORALE_THRESHOLD ||
    moraleDrop >= SEVERE_MORALE_DROP;

  const socialBefore = socialPulseStateBefore?.globalPulseScore ?? null;
  const socialAfter = socialPulseStateAfter?.globalPulseScore ?? null;
  const socialDelta =
    socialBefore != null && socialAfter != null
      ? socialAfter - socialBefore
      : 0;
  const socialPulseBalanced =
    socialAfter == null ? metricsAfter.publicSatisfaction >= 45 : socialDelta >= -3;
  const socialCrisisGrew =
    socialAfter != null
      ? socialDelta <= -SOCIAL_CRISIS_GROWTH
      : metricsAfter.publicSatisfaction < 40;

  const activeButterflyHooks =
    butterflyHookState?.hooks.filter((hook) => hook.status === 'active') ?? [];
  const resolvedButterflyHooks =
    butterflyHookState?.hooks.filter((hook) => hook.status === 'resolved') ?? [];
  const butterflyFollowUpWellManaged =
    activeButterflyHooks.length === 0 &&
    (resolvedButterflyHooks.length > 0 || resolvedToday.size > 0);

  return {
    day,
    mainEventResolved,
    sideEventsResolvedCount,
    dailyGoalsCompletedCount,
    criticalRiskClosedWithoutGrowth,
    budgetNotSeriouslyDamaged,
    personnelMoraleMaintained,
    socialPulseBalanced,
    butterflyFollowUpWellManaged,
    criticalEventUnresolved,
    budgetSeverelyDropped,
    personnelMoraleSeverelyDropped,
    socialCrisisGrew,
  };
}

import { normalizeAuthorityState } from './authoritySeed';
import type { AuthorityState } from './authorityTypes';

export function selectAuthorityState(
  pilotAuthorityState: unknown,
  day: number,
): AuthorityState {
  return normalizeAuthorityState(pilotAuthorityState, day);
}
