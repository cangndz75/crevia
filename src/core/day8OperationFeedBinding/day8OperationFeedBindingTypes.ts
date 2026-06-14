export type Day8OperationFeedBindingSourceKind =
  | 'day8_strategic_content'
  | 'city_rhythm_director'
  | 'district_neglect_recovery'
  | 'positive_comeback'
  | 'follow_up_action'
  | 'city_memory_visibility'
  | 'portfolio_defer_risk'
  | 'daily_capacity_portfolio'
  | 'one_more_day_retention'
  | 'ece_strategy_line'
  | 'authority_gameplay_expansion'
  | 'event_gameplay_variety'
  | 'district_personality'
  | 'map_gameplay_binding'
  | 'fallback';

export type Day8OperationFeedBiasKind =
  | 'district_neglect_bias'
  | 'district_recovery_bias'
  | 'positive_comeback_bias'
  | 'follow_up_bias'
  | 'memory_trace_bias'
  | 'resource_pressure_bias'
  | 'route_pressure_bias'
  | 'container_pressure_bias'
  | 'social_trust_bias'
  | 'defer_risk_bias'
  | 'city_rhythm_bias'
  | 'safe_watch_bias'
  | 'fallback';

export type Day8OperationFeedTone =
  | 'strategic'
  | 'cautious'
  | 'positive'
  | 'neutral'
  | 'locked';

export type Day8OperationFeedVisibilityLevel = 'hidden' | 'teaser' | 'summary' | 'detailed';

export type Day8OperationFeedConfidence = 'low' | 'medium' | 'high';

export type Day8OperationFeedBias = {
  id: string;
  kind: Day8OperationFeedBiasKind;
  title: string;
  reasonLine: string;
  badgeLabel: string;
  districtId?: string;
  districtName?: string;
  targetEventFamilyIds?: string[];
  targetEventKindIds?: string[];
  targetDomainTags?: string[];
  scoreBoost: number;
  priority: number;
  confidence: Day8OperationFeedConfidence;
  tone: Day8OperationFeedTone;
  sourceIds: string[];
  sourceKinds: Day8OperationFeedBindingSourceKind[];
  visibilityLevel: Day8OperationFeedVisibilityLevel;
  isFallback: boolean;
};

export type Day8OperationFeedItemBinding = {
  id: string;
  eventId?: string;
  operationId?: string;
  title: string;
  reasonLine: string;
  badgeLabel: string;
  districtId?: string;
  districtName?: string;
  appliedBiasIds: string[];
  sourceIds: string[];
  priority: number;
  visibilityLevel: Day8OperationFeedVisibilityLevel;
  isRecommended: boolean;
  isPresentationOnly: boolean;
};

export type Day8OperationFeedSelectionBiasSummary = {
  applied: boolean;
  totalBoostedCandidates: number;
  matchedCandidateCount: number;
  presentationOnlyBindingCount: number;
  maxBoost: number;
  reasonLine?: string;
  unmatchedBindingReason?: string;
};

export type Day8OperationFeedBindingResult = {
  day: number;
  isActive: boolean;
  biases: Day8OperationFeedBias[];
  feedBindings: Day8OperationFeedItemBinding[];
  primaryFeedBinding?: Day8OperationFeedItemBinding;
  selectionBiasSummary?: Day8OperationFeedSelectionBiasSummary;
  sourceIds: string[];
};

export type Day8OperationFeedBindingInput = {
  day: number;
  authorityPermissionIds?: string[];
  existingEventCandidates?: unknown[];
  existingOperationFeedItems?: unknown[];
  day8StrategicContentResult?: unknown;
  cityRhythmDirectorResult?: unknown;
  districtNeglectRecoveryResult?: unknown;
  positiveComebackResult?: unknown;
  followUpActionResult?: unknown;
  cityMemoryVisibilityResult?: unknown;
  portfolioDeferRiskResult?: unknown;
  dailyCapacityPortfolioResult?: unknown;
  oneMoreDayRetentionResult?: unknown;
  eceStrategyLineResult?: unknown;
  authorityExpansionSummary?: unknown;
  eventGameplayVarietyProfiles?: unknown[];
  districtPersonalityProfiles?: unknown[];
  mapGameplayBindings?: unknown[];
  recentBindingIds?: string[];
  suppressLines?: string[];
  suppressSourceIds?: string[];
};

export type Day8OperationFeedBindingCardModel = {
  id: string;
  title: string;
  reasonLine: string;
  badgeLabel: string;
  districtName?: string;
  tone: Day8OperationFeedTone;
  visibilityLevel: Day8OperationFeedVisibilityLevel;
  accessibilityLabel: string;
};

export type Day8OperationFeedBiasDraft = {
  kind: Day8OperationFeedBiasKind;
  districtId?: string;
  districtName?: string;
  sourceIds: string[];
  sourceKinds: Day8OperationFeedBindingSourceKind[];
  priority: number;
  confidence: Day8OperationFeedConfidence;
  visibilityLevel?: Day8OperationFeedVisibilityLevel;
  tone?: Day8OperationFeedTone;
  reasonHint?: string;
  titleHint?: string;
  isFallback?: boolean;
};

export type NormalizedEventCandidate = {
  id: string;
  eventId?: string;
  operationId?: string;
  eventFamilyId?: string;
  districtIds: string[];
  domains: string[];
  tags: string[];
  title: string;
  score: number;
  isBlocked?: boolean;
};

export type NormalizedOperationFeedItem = {
  id: string;
  eventId?: string;
  operationId?: string;
  title: string;
  districtId?: string;
  districtName?: string;
  domains: string[];
  tags: string[];
  kind?: string;
};
