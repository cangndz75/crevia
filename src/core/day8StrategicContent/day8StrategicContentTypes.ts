export type Day8StrategicContentSourceKind =
  | 'daily_capacity_portfolio'
  | 'portfolio_defer_risk'
  | 'one_more_day_retention'
  | 'city_memory_visibility'
  | 'follow_up_action'
  | 'positive_comeback'
  | 'district_neglect_recovery'
  | 'ece_strategy_line'
  | 'authority_gameplay_expansion'
  | 'district_personality'
  | 'map_gameplay_binding'
  | 'active_operation_map_binding'
  | 'event_gameplay_variety'
  | 'decision_consequence'
  | 'carry_over'
  | 'butterfly_effect'
  | 'city_archive'
  | 'story_chain'
  | 'district_trust'
  | 'social_pulse'
  | 'vehicle_maintenance'
  | 'team_specialization'
  | 'container_network'
  | 'operational_resource'
  | 'fallback';

export type Day8StrategicContentKind =
  | 'strategic_operation_focus'
  | 'district_neglect_focus'
  | 'district_recovery_focus'
  | 'resource_pressure_focus'
  | 'route_pressure_focus'
  | 'container_pressure_focus'
  | 'social_trust_focus'
  | 'memory_trace_focus'
  | 'follow_up_focus'
  | 'positive_comeback_focus'
  | 'defer_risk_focus'
  | 'map_priority_focus'
  | 'authority_explanation_focus'
  | 'safe_watch_focus'
  | 'fallback';

export type Day8StrategicContentTone =
  | 'strategic'
  | 'cautious'
  | 'positive'
  | 'neutral'
  | 'locked';

export type Day8StrategicContentDayPolicy = 'day_8_9' | 'day_10_plus' | 'any';

export type Day8StrategicContentVisibilityLevel =
  | 'hidden'
  | 'teaser'
  | 'summary'
  | 'detailed';

export type Day8StrategicContentConfidence = 'low' | 'medium' | 'high';

export type Day8StrategicContentCandidate = {
  id: string;
  kind: Day8StrategicContentKind;
  title: string;
  line: string;
  shortLine?: string;
  districtId?: string;
  districtName?: string;
  tone: Day8StrategicContentTone;
  priority: number;
  confidence: Day8StrategicContentConfidence;
  sourceIds: string[];
  sourceKinds: Day8StrategicContentSourceKind[];
  dayPolicy: Day8StrategicContentDayPolicy;
  visibilityLevel: Day8StrategicContentVisibilityLevel;
  isActionable: boolean;
  isFallback: boolean;
};

export type Day8StrategicContentResult = {
  day: number;
  candidates: Day8StrategicContentCandidate[];
  primaryCandidate?: Day8StrategicContentCandidate;
  secondaryCandidate?: Day8StrategicContentCandidate;
  reportCandidate?: Day8StrategicContentCandidate;
  hubCandidate?: Day8StrategicContentCandidate;
  mapCandidate?: Day8StrategicContentCandidate;
  eceCandidate?: Day8StrategicContentCandidate;
  portfolioCandidate?: Day8StrategicContentCandidate;
  sourceIds: string[];
};

export type Day8StrategicContentInput = {
  day: number;
  authorityPermissionIds?: string[];
  dailyCapacityPortfolioResult?: unknown;
  portfolioDeferRiskResult?: unknown;
  oneMoreDayRetentionResult?: unknown;
  cityMemoryVisibilityResult?: unknown;
  followUpActionResult?: unknown;
  positiveComebackResult?: unknown;
  districtNeglectRecoveryResult?: unknown;
  eceStrategyLineResult?: unknown;
  authorityExpansionSummary?: unknown;
  districtPersonalityProfiles?: unknown[];
  mapGameplayBindings?: unknown[];
  activeOperationMapBindings?: unknown[];
  eventGameplayVarietyProfiles?: unknown[];
  decisionConsequenceThreads?: unknown[];
  carryOverSignals?: unknown;
  butterflySignals?: unknown;
  cityArchiveSignals?: unknown;
  storyChainSignals?: unknown;
  districtTrustSignals?: unknown;
  districtMemorySignals?: unknown;
  socialPulseSignals?: unknown;
  vehicleMaintenanceSignals?: unknown;
  teamSpecializationSignals?: unknown;
  containerNetworkSignals?: unknown;
  operationalResourceSignals?: unknown;
  recentCandidateIds?: string[];
  suppressSourceIds?: string[];
  suppressLines?: string[];
};

export type Day8StrategicContentCandidateDraft = {
  kind: Day8StrategicContentKind;
  districtId?: string;
  districtName?: string;
  sourceIds: string[];
  sourceKinds: Day8StrategicContentSourceKind[];
  priority: number;
  confidence: Day8StrategicContentConfidence;
  visibilityLevel?: Day8StrategicContentVisibilityLevel;
  tone?: Day8StrategicContentTone;
  isRisk?: boolean;
  isPositive?: boolean;
  titleHint?: string;
  lineHint?: string;
  seed?: number;
};

export type Day8StrategicContentCardModel = {
  id: string;
  title: string;
  line: string;
  shortLine?: string;
  badgeLabel: string;
  districtName?: string;
  tone: Day8StrategicContentTone;
  visibilityLevel: Day8StrategicContentVisibilityLevel;
  isActionable: boolean;
  accessibilityLabel: string;
};
