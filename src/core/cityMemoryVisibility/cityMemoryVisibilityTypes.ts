export type CityMemoryVisibilitySourceKind =
  | 'city_archive'
  | 'story_chain'
  | 'district_memory'
  | 'decision_consequence'
  | 'carry_over'
  | 'butterfly_effect'
  | 'portfolio_defer_risk'
  | 'one_more_day_retention'
  | 'ece_strategy_line'
  | 'map_gameplay_binding'
  | 'active_operation_map_binding'
  | 'district_personality'
  | 'fallback';

export type CityMemoryVisibilityKind =
  | 'decision_trace'
  | 'district_trace'
  | 'story_chain_trace'
  | 'carry_over_trace'
  | 'butterfly_trace'
  | 'report_memory_note'
  | 'map_memory_hint'
  | 'hub_continuation_hint'
  | 'ece_memory_hint'
  | 'safe_summary'
  | 'fallback';

export type CityMemoryVisibilityTone =
  | 'neutral'
  | 'strategic'
  | 'positive'
  | 'cautious'
  | 'locked';

export type CityMemoryVisibilityDayPolicy =
  | 'day_1'
  | 'day_2_7'
  | 'day_8_plus'
  | 'day_10_plus'
  | 'any';

export type CityMemoryVisibilityConfidence = 'low' | 'medium' | 'high';

export type CityMemoryVisibilityTrace = {
  id: string;
  kind: CityMemoryVisibilityKind;
  title: string;
  line: string;
  shortLine?: string;
  districtId?: string;
  districtName?: string;
  storyChainId?: string;
  tone: CityMemoryVisibilityTone;
  sourceIds: string[];
  sourceKinds: CityMemoryVisibilitySourceKind[];
  confidence: CityMemoryVisibilityConfidence;
  priority: number;
  dayPolicy: CityMemoryVisibilityDayPolicy;
  isActionable: boolean;
  isFallback: boolean;
};

export type CityMemoryVisibilityResult = {
  day: number;
  traces: CityMemoryVisibilityTrace[];
  primaryTrace?: CityMemoryVisibilityTrace;
  reportTrace?: CityMemoryVisibilityTrace;
  hubTrace?: CityMemoryVisibilityTrace;
  mapTrace?: CityMemoryVisibilityTrace;
  eceTrace?: CityMemoryVisibilityTrace;
  summaryLine?: string;
  sourceIds: string[];
};

export type CityMemoryVisibilityInput = {
  day: number;
  cityArchiveEntries?: unknown[];
  storyChains?: unknown[];
  districtMemorySignals?: unknown;
  decisionConsequenceThreads?: unknown[];
  carryOverSignals?: unknown;
  butterflySignals?: unknown;
  portfolioDeferRiskResult?: unknown;
  oneMoreDayRetentionResult?: unknown;
  eceStrategyLineResult?: unknown;
  mapGameplayBindings?: unknown[];
  activeOperationMapBindings?: unknown[];
  districtPersonalityProfiles?: unknown[];
  recentTraceIds?: string[];
  recentTraceTexts?: string[];
  suppressSourceIds?: string[];
};

export type CityMemoryTraceCardModel = {
  id: string;
  title: string;
  line: string;
  shortLine?: string;
  badgeLabel: string;
  tone: CityMemoryVisibilityTone;
  districtName?: string;
  isActionable: boolean;
  accessibilityLabel: string;
};
