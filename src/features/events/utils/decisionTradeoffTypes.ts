import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';

/** Karar strateji karakteri — plan ve karar kartlarında ortak dil. */
export type DecisionArchetypeId =
  | 'rapid_response'
  | 'preventive'
  | 'resource_saving'
  | 'social_trust'
  | 'balanced';

export type DecisionTradeoffDimensionId =
  | 'trust'
  | 'resource'
  | 'readiness'
  | 'patience'
  | 'tomorrow_risk';

export type DecisionTradeoffDensityBand = 'day1' | 'openEnded';

export type ContextFitBadgeTone =
  | 'strong_match'
  | 'risky_choice'
  | 'resource_friendly'
  | 'social_strong'
  | 'tomorrow_risk'
  | 'neutral';

export type DecisionTradeoffChipTone = 'gain' | 'cost' | 'risk' | 'neutral';

export type DecisionTradeoffChip = {
  id: string;
  label: string;
  tone: DecisionTradeoffChipTone;
};

export type TradeoffMeterSegment = {
  dimensionId: DecisionTradeoffDimensionId;
  label: string;
  direction: 'up' | 'down' | 'steady';
  emphasis: 'strong' | 'medium' | 'light';
};

export type ContextFitBadge = {
  id: string;
  label: string;
  tone: ContextFitBadgeTone;
};

export type ReadinessFitChip = {
  id: string;
  label: string;
  tone: 'strong_match' | 'weak_match' | 'risky' | 'neutral';
};

export type PlanOptionDepthPresentation = {
  archetypeId: DecisionArchetypeId;
  strategyBadge: string;
  benefitChip: DecisionTradeoffChip;
  costChip: DecisionTradeoffChip;
  shortTermEffect: string;
  longTermEffect: string;
  riskWarning: string | null;
  contextFitBadge: ContextFitBadge | null;
  readinessFitBadge: ReadinessFitChip | null;
  tradeoffMeter: TradeoffMeterSegment[];
  opportunityCost: string;
  outcomePreview: string;
  decisionMemoryChip: string | null;
  dominantStrategyWarning: string | null;
  portfolioConflictHint: string | null;
  maintenanceEconomyHint: string | null;
};

export type DecisionOptionDepthPresentation = {
  archetypeId: DecisionArchetypeId;
  strategyBadge: string;
  benefitChip: DecisionTradeoffChip;
  costChip: DecisionTradeoffChip;
  shortTermEffect: string;
  longTermEffect: string;
  riskWarning: string | null;
  contextFitBadge: ContextFitBadge | null;
  tradeoffMeter: TradeoffMeterSegment[];
  opportunityCost: string;
  outcomePreview: string;
  decisionMemoryChip: string | null;
  dominantStrategyWarning: string | null;
};

export const PLAN_STRATEGY_TO_ARCHETYPE: Record<EventPlanStrategyId, DecisionArchetypeId> = {
  rapid_response: 'rapid_response',
  balanced_plan: 'balanced',
  long_term_fix: 'preventive',
};

export const ARCHETYPE_BADGE_LABELS: Record<DecisionArchetypeId, string> = {
  rapid_response: 'Hızlı Müdahale',
  preventive: 'Önleyici Plan',
  resource_saving: 'Kaynak Korur',
  social_trust: 'Sosyal Güven',
  balanced: 'Dengeli Plan',
};
