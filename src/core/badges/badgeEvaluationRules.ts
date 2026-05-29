import { classifyContainerDecisionAction, isContainerRelevantEvent } from '@/core/containers/containerDecisionEffects';
import type { ContainerState } from '@/core/containers/containerTypes';
import type { ButterflyHookState } from '@/core/events/butterflyHookTypes';
import type { HubQuickActionState } from '@/core/hubQuickActions/hubQuickActionTypes';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { EventCard } from '@/core/models/EventCard';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { PersonnelState } from '@/core/personnel/personnelTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import { inferVehicleDecisionAction } from '@/core/vehicles/vehicleDecisionEffects';

import type { CalculateDailyAuthorityTrustGainInput } from '@/core/authority/authorityTypes';

const LOW_MORALE_THRESHOLD = 45;
const LOW_BUDGET_THRESHOLD = 50_000;
const PUBLIC_TRUST_THRESHOLD = 50;
const CRITICAL_FATIGUE_THRESHOLD = 86;
const HEAVY_BUDGET_COST = 5_000;

const ROUTE_POSITIVE_ACTIONS = new Set([
  'prioritize_route',
  'dispatch_collection',
  'maintenance',
  'permanent_solution',
  'add_capacity',
]);

const CONTAINER_MANAGEMENT_ACTIONS = new Set([
  'prioritize_route',
  'maintenance',
  'add_capacity',
  'communicate',
  'permanent_solution',
]);

export type BadgeEvaluationRuleContext = {
  day: number;
  decisionHistory: DecisionRecord[];
  activeEvents: EventCard[];
  eventPool?: EventCard[];
  metricsBefore?: GameMetrics | null;
  metricsAfter: GameMetrics;
  socialPulseStateAfter?: SocialPulseState | null;
  butterflyHookState?: ButterflyHookState | null;
  containerState?: ContainerState | null;
  vehicleState?: VehicleState | null;
  personnelState?: PersonnelState | null;
  hubQuickActionState?: HubQuickActionState | null;
  authorityInput: CalculateDailyAuthorityTrustGainInput;
  authorityNetGain?: number;
};

function decisionsForDay(
  decisionHistory: DecisionRecord[],
  day: number,
): DecisionRecord[] {
  return decisionHistory.filter((record) => record.day === day);
}

function buildEventLookup(
  eventPool: EventCard[] | undefined,
  activeEvents: EventCard[],
): Map<string, EventCard> {
  const map = new Map<string, EventCard>();
  for (const event of [...(eventPool ?? []), ...activeEvents]) {
    map.set(event.id, event);
  }
  return map;
}

function hasHeavyCostDecisionWithBadOutcome(records: DecisionRecord[]): boolean {
  return records.some((record) => {
    const budgetEffect = record.appliedEffects.budget ?? 0;
    const budgetCost = Math.abs(record.appliedCosts?.budget ?? 0);
    const heavyCost =
      budgetCost >= HEAVY_BUDGET_COST || budgetEffect <= -HEAVY_BUDGET_COST;
    const badOutcome =
      (record.appliedEffects.publicSatisfaction ?? 0) < 0 &&
      (record.appliedEffects.staffMorale ?? 0) < 0;
    return heavyCost && badOutcome;
  });
}

function hasCriticalOrHighEventResolvedToday(
  decisionsToday: DecisionRecord[],
  eventLookup: Map<string, EventCard>,
): boolean {
  if (decisionsToday.length === 0) {
    return false;
  }
  const resolvedIds = new Set(decisionsToday.map((record) => record.eventId));
  for (const eventId of resolvedIds) {
    const event = eventLookup.get(eventId);
    if (
      event &&
      (event.riskLevel === 'critical' || event.riskLevel === 'high')
    ) {
      return true;
    }
  }
  return false;
}

function hasRoutePositiveActionToday(
  ctx: BadgeEvaluationRuleContext,
  decisionsToday: DecisionRecord[],
  eventLookup: Map<string, EventCard>,
): boolean {
  const hubRouteToday =
    ctx.hubQuickActionState?.records?.some(
      (record) =>
        record.actionId === 'route_preparation' && record.day === ctx.day,
    ) ?? false;
  if (hubRouteToday) {
    return true;
  }

  for (const record of decisionsToday) {
    const event = eventLookup.get(record.eventId);
    if (!event) {
      continue;
    }
    const action = inferVehicleDecisionAction(event, {
      id: record.decisionId,
      title: record.decisionLabel,
      description: record.decisionLabel,
    });
    if (!ROUTE_POSITIVE_ACTIONS.has(action)) {
      continue;
    }
    const netPositive =
      (record.appliedEffects.publicSatisfaction ?? 0) >= 0 &&
      (record.appliedEffects.staffMorale ?? 0) >= -2 &&
      (record.appliedEffects.risk ?? 0) <= 0;
    if (netPositive) {
      return true;
    }
  }

  return false;
}

function hasContainerManagementToday(
  decisionsToday: DecisionRecord[],
  eventLookup: Map<string, EventCard>,
): boolean {
  for (const record of decisionsToday) {
    const event = eventLookup.get(record.eventId);
    if (!event || !isContainerRelevantEvent(event)) {
      continue;
    }
    const action = classifyContainerDecisionAction({
      event,
      decision: {
        id: record.decisionId,
        title: record.decisionLabel,
        description: record.decisionLabel,
      },
    });
    if (CONTAINER_MANAGEMENT_ACTIONS.has(action)) {
      return true;
    }
  }
  return false;
}

function hasButterflyFollowUpResolvedToday(
  butterflyHookState: ButterflyHookState | null | undefined,
  day: number,
): boolean {
  const hooks = butterflyHookState?.hooks ?? [];
  return hooks.some(
    (hook) =>
      hook.status === 'resolved' &&
      hook.createdDay < day &&
      (hook.kind === 'follow_up_event' ||
        hook.kind === 'report_echo' ||
        hook.kind === 'opportunity_return' ||
        hook.kind === 'permanent_solution_prompt'),
  );
}

function containerHasNoCriticalRisk(containerState: ContainerState | null | undefined): boolean {
  if (containerState == null) {
    return false;
  }
  return Object.values(containerState.aggregates).every(
    (aggregate) => aggregate.criticalContainerCount === 0,
  );
}

function teamCaretakerQualifies(
  ctx: BadgeEvaluationRuleContext,
): boolean {
  if (!ctx.authorityInput.personnelMoraleMaintained) {
    return false;
  }
  const teams = ctx.personnelState?.teams ?? [];
  if (teams.length === 0) {
    return ctx.metricsAfter.staffMorale >= LOW_MORALE_THRESHOLD + 3;
  }
  if (
    teams.some(
      (team) =>
        team.fatigue >= CRITICAL_FATIGUE_THRESHOLD ||
        team.status === 'exhausted' ||
        team.status === 'risky',
    )
  ) {
    return false;
  }
  const avgMorale =
    teams.reduce((sum, team) => sum + team.morale, 0) / teams.length;
  return avgMorale >= LOW_MORALE_THRESHOLD + 3;
}

export type BadgeEvaluationRuleFlags = {
  dailyOperationCompleted: boolean;
  positiveOperationDay: boolean;
  socialPulseBalanced: boolean;
  budgetNotSeriouslyDamaged: boolean;
  personnelMoraleMaintained: boolean;
  criticalRiskClosedWithoutGrowth: boolean;
  butterflyFollowUpWellManaged: boolean;
  vehicleDayPositive: boolean;
  containerRiskControlled: boolean;
};

export function deriveBadgeEvaluationRuleFlags(
  ctx: BadgeEvaluationRuleContext,
): BadgeEvaluationRuleFlags {
  const decisionsToday = decisionsForDay(ctx.decisionHistory, ctx.day);
  const eventLookup = buildEventLookup(ctx.eventPool, ctx.activeEvents);
  const authorityNetGain = ctx.authorityNetGain ?? 0;

  const socialScore =
    ctx.socialPulseStateAfter?.globalPulseScore ??
    ctx.metricsAfter.publicSatisfaction;

  const dailyOperationCompleted =
    ctx.authorityInput.mainEventResolved === true || decisionsToday.length > 0;

  const positiveOperationDay =
    ctx.authorityInput.mainEventResolved === true &&
    (ctx.authorityInput.dailyGoalsCompletedCount ?? 0) >= 1 &&
    authorityNetGain > 0 &&
    !ctx.authorityInput.criticalEventUnresolved &&
    !ctx.authorityInput.budgetSeverelyDropped &&
    !ctx.authorityInput.personnelMoraleSeverelyDropped &&
    !ctx.authorityInput.socialCrisisGrew;

  const socialPulseBalanced =
    socialScore >= PUBLIC_TRUST_THRESHOLD &&
    ctx.authorityInput.socialPulseBalanced === true &&
    !ctx.authorityInput.socialCrisisGrew;

  const budgetNotSeriouslyDamaged =
    ctx.authorityInput.budgetNotSeriouslyDamaged === true &&
    ctx.metricsAfter.budget >= LOW_BUDGET_THRESHOLD &&
    !hasHeavyCostDecisionWithBadOutcome(decisionsToday);

  const personnelMoraleMaintained = teamCaretakerQualifies(ctx);

  const criticalRiskClosedWithoutGrowth = hasCriticalOrHighEventResolvedToday(
    decisionsToday,
    eventLookup,
  );

  const butterflyFollowUpWellManaged = hasButterflyFollowUpResolvedToday(
    ctx.butterflyHookState,
    ctx.day,
  );

  const routeActionToday = hasRoutePositiveActionToday(
    ctx,
    decisionsToday,
    eventLookup,
  );
  const vehicleDayPositive =
    routeActionToday &&
    (ctx.vehicleState?.aggregates.broken ?? 0) === 0 &&
    (ctx.vehicleState?.aggregates.available ?? 0) > 0;

  const containerManagedToday = hasContainerManagementToday(
    decisionsToday,
    eventLookup,
  );
  const containerRiskControlled =
    containerHasNoCriticalRisk(ctx.containerState) && containerManagedToday;

  return {
    dailyOperationCompleted,
    positiveOperationDay,
    socialPulseBalanced,
    budgetNotSeriouslyDamaged,
    personnelMoraleMaintained,
    criticalRiskClosedWithoutGrowth,
    butterflyFollowUpWellManaged,
    vehicleDayPositive,
    containerRiskControlled,
  };
}
