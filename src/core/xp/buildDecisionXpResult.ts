import type { DecisionAppliedCosts, DecisionAppliedEffects } from '@/core/models/DecisionRecord';
import type { EventDecision, EventDecisionCost } from '@/core/models/EventCard';

import { mergeDistrictBonusFlags } from '@/core/xp/mergeDistrictBonusFlags';
import type { DistrictBonusFlags } from '@/core/xp/types';
import type { XpDecisionResultLike } from '@/core/xp/xpDecisionAdapter';

/**
 * applyDecision çıktısından XP adapter girdisi üretir.
 * Mevcut DecisionRecord / EventDecision tiplerini değiştirmez.
 */
export function buildDecisionXpResultFromApplied(
  appliedEffects: DecisionAppliedEffects,
  appliedCosts: DecisionAppliedCosts | undefined,
  decision: EventDecision,
  eventHints?: DistrictBonusFlags,
): XpDecisionResultLike {
  const costs: EventDecisionCost | undefined = decision.costs;
  const budgetFromCosts = appliedCosts?.budget ?? costs?.budget ?? 0;
  const budgetFromEffects =
    appliedEffects.budget != null && appliedEffects.budget < 0
      ? Math.abs(appliedEffects.budget)
      : 0;

  const staffHours = appliedCosts?.staffHours ?? costs?.staffHours;
  const staffFatigueDelta =
    staffHours != null && staffHours > 0 ? Math.ceil(staffHours / 4) : 0;

  return {
    satisfactionDelta: appliedEffects.publicSatisfaction ?? 0,
    riskDelta: appliedEffects.risk ?? 0,
    budgetSpent: budgetFromCosts > 0 ? budgetFromCosts : budgetFromEffects,
    expectedBudget:
      costs?.budget != null && costs.budget > 0
        ? Math.round(costs.budget * 1.2)
        : undefined,
    staffFatigueDelta,
    districtBonusFlags: mergeDistrictBonusFlags(
      eventHints,
      decision.districtBonusFlags,
    ),
  };
}
