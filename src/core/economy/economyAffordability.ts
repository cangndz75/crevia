import {
  formatSourceAmount,
  formatSourceDelta,
} from './economyFormatter';
import {
  canAfford,
  extractDecisionCost,
  type ExtractDecisionCostInput,
} from './economyEngine';
import type { EconomyState } from './types';

export type CheckDecisionAffordabilityParams = {
  economyState: EconomyState;
  decision?: ExtractDecisionCostInput['decision'];
  decisionResult?: ExtractDecisionCostInput['decisionResult'];
};

export type DecisionAffordabilityCheck = {
  cost: number;
  canAfford: boolean;
  currentSource: number;
  missingSource: number;
  formattedCost: string;
  formattedMissingSource: string;
};

function estimateDecisionCost(params: CheckDecisionAffordabilityParams): number {
  const { decision, decisionResult } = params;

  if (decision) {
    const fromCosts = decision.costs?.budget ?? 0;
    const fromEffects =
      decision.effects?.budget != null && decision.effects.budget < 0
        ? Math.abs(decision.effects.budget)
        : 0;
    const total = fromCosts + fromEffects;
    if (total > 0) {
      return total;
    }
  }

  return extractDecisionCost({ decision, decisionResult });
}

export function checkDecisionAffordability(
  params: CheckDecisionAffordabilityParams,
): DecisionAffordabilityCheck {
  const { economyState } = params;
  const currentSource = economyState.currentSource;
  const cost = estimateDecisionCost(params);
  const affordable = cost <= 0 || canAfford(economyState, cost);
  const missingSource = Math.max(0, cost - currentSource);

  return {
    cost,
    canAfford: affordable,
    currentSource,
    missingSource,
    formattedCost: cost > 0 ? formatSourceDelta(-cost) : '0',
    formattedMissingSource: formatSourceAmount(missingSource),
  };
}
