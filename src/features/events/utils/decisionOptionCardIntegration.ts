import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import type { DecisionAffordabilityCheck } from '@/core/economy/economyAffordability';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { PersonnelImpactPreview } from '@/core/personnel/personnelPresentation';
import type { VehicleImpactPreview } from '@/core/vehicles/vehiclePresentation';
import type { ResolvedQuickAction } from '@/features/events/utils/eventDetailDecisionUtils';
import {
  buildCompactDecisionImpactSummary,
  buildDecisionShortTradeoff,
  buildPrimaryDecisionImpacts,
  formatDecisionPriorityFitLabel,
  getDecisionOptionVariantConfig,
  getDecisionPriorityFit,
  getDecisionRiskLevel,
  getDecisionStrategyLabel,
  getDecisionStrategyTone,
  getUnavailableDecisionReason,
  shouldShowDecisionDetailImpact,
  type DecisionOptionCardVariant,
  type DecisionPriorityFit,
  type DecisionRiskLevel,
  type DecisionStrategyTone,
  type PrimaryDecisionImpact,
} from '@/features/events/utils/decisionTradeoffPresentation';

export type QuickDecisionCardItem = {
  decision: EventDecision;
  decisionId: string;
  affordability?: DecisionAffordabilityCheck;
};

export type EventDetailDecisionListItem = QuickDecisionCardItem;

export function buildQuickDecisionCardItems(
  event: EventCard,
  actions: ResolvedQuickAction[],
  affordabilityByDecisionId?: Record<string, DecisionAffordabilityCheck>,
): QuickDecisionCardItem[] {
  return actions.map((action) => ({
    decision: action.decision,
    decisionId: action.decision.id,
    affordability: affordabilityByDecisionId?.[action.decision.id],
  }));
}

export function buildEventDetailDecisionListItems(
  event: EventCard,
  options?: {
    excludeDecisionIds?: string[];
    affordabilityByDecisionId?: Record<string, DecisionAffordabilityCheck>;
  },
): EventDetailDecisionListItem[] {
  const exclude = new Set(options?.excludeDecisionIds ?? []);
  return event.decisions
    .filter((d) => !exclude.has(d.id))
    .map((decision) => ({
      decision,
      decisionId: decision.id,
      affordability: options?.affordabilityByDecisionId?.[decision.id],
    }));
}

export function isDecisionSelectable(
  affordability?: DecisionAffordabilityCheck,
): boolean {
  if (!affordability) return true;
  if (affordability.cost <= 0) return true;
  return affordability.canAfford;
}

export type BuildDecisionOptionCardPresentationInput = {
  event: EventCard;
  decision: EventDecision;
  variant?: DecisionOptionCardVariant;
  dailyPriorityKey?: DailyPriorityKey;
  personnelPreview?: PersonnelImpactPreview | null;
  vehiclePreview?: VehicleImpactPreview | null;
  affordability?: DecisionAffordabilityCheck;
};

export type DecisionOptionCardPresentation = {
  strategyLabel: string;
  strategyTone: DecisionStrategyTone;
  priorityFit: DecisionPriorityFit | null;
  priorityLabel: string | null;
  riskLevel: DecisionRiskLevel;
  tradeoff: string;
  primaryImpacts: PrimaryDecisionImpact[];
  extraSummary: string | null;
  showDetail: boolean;
  unavailableReason: string | null;
  showPriorityChip: boolean;
  insufficient: boolean;
};

/** Saf presentation builder — verify scriptleri ve kart UI aynı yolu paylaşır. */
export function buildDecisionOptionCardPresentation(
  input: BuildDecisionOptionCardPresentationInput,
): DecisionOptionCardPresentation {
  const variant = input.variant ?? 'full';
  const variantConfig = getDecisionOptionVariantConfig(variant);
  const insufficient =
    input.affordability != null &&
    input.affordability.cost > 0 &&
    !input.affordability.canAfford;

  const strategyLabel = getDecisionStrategyLabel(input.decision);
  const strategyTone = getDecisionStrategyTone(input.decision);
  const priorityFit = getDecisionPriorityFit(input.decision, input.dailyPriorityKey);
  const riskLevel = getDecisionRiskLevel(input.decision, {
    event: input.event,
    dailyPriorityKey: input.dailyPriorityKey,
    personnelPreview: input.personnelPreview,
    vehiclePreview: input.vehiclePreview,
    affordability: input.affordability,
  });
  const tradeoff = buildDecisionShortTradeoff(input.decision, input.event);
  const impacts = buildPrimaryDecisionImpacts({
    event: input.event,
    decision: input.decision,
    dailyPriorityKey: input.dailyPriorityKey,
    personnelPreview: input.personnelPreview,
    vehiclePreview: input.vehiclePreview,
    affordability: input.affordability,
  });
  const primaryImpacts = impacts.slice(0, variantConfig.maxPrimaryImpacts);
  const extraSummary =
    variantConfig.maxPrimaryImpacts < impacts.length
      ? buildCompactDecisionImpactSummary(impacts)
      : null;
  const priorityLabel = formatDecisionPriorityFitLabel(priorityFit);
  const showPriorityChip =
    variantConfig.showPriorityChip && priorityFit != null && priorityLabel != null;
  const showDetail =
    variantConfig.showDetailImpact &&
    !insufficient &&
    shouldShowDecisionDetailImpact({
      event: input.event,
      decision: input.decision,
      dailyPriorityKey: input.dailyPriorityKey,
      personnelPreview: input.personnelPreview,
      vehiclePreview: input.vehiclePreview,
      affordability: input.affordability,
    });

  return {
    strategyLabel,
    strategyTone,
    priorityFit,
    priorityLabel,
    riskLevel,
    tradeoff,
    primaryImpacts,
    extraSummary,
    showDetail,
    unavailableReason: getUnavailableDecisionReason(input.affordability),
    showPriorityChip,
    insufficient,
  };
}
