export type EceStrategyLineSourceKind =
  | 'authority_gameplay_expansion'
  | 'daily_capacity_portfolio'
  | 'portfolio_defer_risk'
  | 'one_more_day_retention'
  | 'decision_consequence'
  | 'tomorrow_risk'
  | 'carry_over'
  | 'butterfly_effect'
  | 'district_personality'
  | 'district_memory'
  | 'city_archive'
  | 'story_chain'
  | 'map_gameplay_binding'
  | 'active_operation_map_binding'
  | 'event_gameplay_variety'
  | 'resource_pressure'
  | 'advisor_seniority'
  | 'advisor_relationship'
  | 'player_style'
  | 'fallback';

export type EceStrategyLineKind =
  | 'day_start_briefing'
  | 'hub_strategy_hint'
  | 'portfolio_tradeoff'
  | 'defer_follow_up'
  | 'one_more_day_hook'
  | 'authority_benefit'
  | 'district_memory'
  | 'decision_consequence'
  | 'map_priority'
  | 'resource_pressure'
  | 'player_style_reflection'
  | 'recovery_opportunity'
  | 'warning_caution'
  | 'positive_reinforcement'
  | 'fallback';

export type EceStrategyTone =
  | 'calm'
  | 'strategic'
  | 'cautious'
  | 'positive'
  | 'warning'
  | 'mentor';

export type EceStrategyLinePhase =
  | 'hub'
  | 'report'
  | 'continuation'
  | 'operation'
  | 'map'
  | 'day_start';

export type EceStrategyLineConfidence = 'low' | 'medium' | 'high';

export type EceStrategyLineDayPolicy = {
  minDay?: number;
  maxDay?: number;
  allowDayOne?: boolean;
};

export type EceStrategyLine = {
  id: string;
  kind: EceStrategyLineKind;
  tone: EceStrategyTone;
  text: string;
  shortText?: string;
  sourceIds: string[];
  sourceKinds: EceStrategyLineSourceKind[];
  confidence: EceStrategyLineConfidence;
  priority: number;
  dayPolicy: EceStrategyLineDayPolicy;
  isActionable: boolean;
  ctaHint?: string;
  phases: EceStrategyLinePhase[];
};

export type EceStrategyLineResult = {
  day: number;
  primaryLine?: EceStrategyLine;
  secondaryLine?: EceStrategyLine;
  reportLine?: EceStrategyLine;
  continuationLine?: EceStrategyLine;
  fallbackLine: EceStrategyLine;
  sourceIds: string[];
};

export type EceStrategyLineInput = {
  day: number;
  phase?: EceStrategyLinePhase;
  authorityExpansionSummary?: unknown;
  dailyCapacityPortfolioResult?: unknown;
  portfolioDeferRiskResult?: unknown;
  oneMoreDayRetentionResult?: unknown;
  decisionConsequenceThreads?: unknown;
  tomorrowRiskSignals?: unknown;
  carryOverSignals?: unknown;
  butterflySignals?: unknown;
  districtPersonalityProfiles?: unknown;
  districtMemorySignals?: unknown;
  cityArchiveSignals?: unknown;
  storyChainSignals?: unknown;
  mapGameplayBindings?: unknown;
  activeOperationMapBindings?: unknown;
  eventGameplayVarietyProfiles?: unknown;
  resourcePressureSignals?: unknown;
  advisorSeniorityState?: unknown;
  advisorRelationshipState?: unknown;
  playerStyleInsight?: unknown;
  districtNeglectRecoveryResult?: unknown;
  day8StrategicContentResult?: unknown;
  cityRhythmDirectorResult?: unknown;
  recentLineIds?: string[];
  recentLineTexts?: string[];
};

export type EceStrategyLineCardModel = {
  id: string;
  text: string;
  shortText?: string;
  tone: EceStrategyTone;
  badgeLabel?: string;
  sourceLabel?: string;
  ctaHint?: string;
  accessibilityLabel: string;
};
