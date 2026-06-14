export type PositiveComebackSourceKind =
  | 'reward_comeback'
  | 'daily_capacity_portfolio'
  | 'follow_up_action'
  | 'one_more_day_retention'
  | 'portfolio_defer_risk'
  | 'city_memory_visibility'
  | 'decision_consequence'
  | 'carry_over'
  | 'butterfly_effect'
  | 'district_personality'
  | 'district_trust'
  | 'district_memory'
  | 'city_archive'
  | 'story_chain'
  | 'social_pulse'
  | 'container_network'
  | 'operational_resource'
  | 'authority_gameplay_expansion'
  | 'ece_strategy_line'
  | 'fallback';

export type PositiveComebackKind =
  | 'trust_recovery'
  | 'resource_relief'
  | 'social_support'
  | 'district_recovery'
  | 'container_improvement'
  | 'route_relief'
  | 'follow_up_success'
  | 'memory_positive_trace'
  | 'opportunity_window'
  | 'safe_momentum'
  | 'fallback';

export type PositiveComebackTone =
  | 'positive'
  | 'calm'
  | 'strategic'
  | 'hopeful'
  | 'locked';

export type PositiveComebackDayPolicy =
  | 'day_1'
  | 'day_2_7'
  | 'day_8_plus'
  | 'day_10_plus'
  | 'any';

export type PositiveComebackConfidence = 'low' | 'medium' | 'high';

export type PositiveComebackVisibilityLevel = 'hidden' | 'teaser' | 'summary' | 'detailed';

export type PositiveComebackCandidate = {
  id: string;
  kind: PositiveComebackKind;
  title: string;
  line: string;
  benefitLine: string;
  districtId?: string;
  districtName?: string;
  tone: PositiveComebackTone;
  sourceIds: string[];
  sourceKinds: PositiveComebackSourceKind[];
  confidence: PositiveComebackConfidence;
  priority: number;
  dayPolicy: PositiveComebackDayPolicy;
  isActionable: boolean;
  isFallback: boolean;
  visibilityLevel: PositiveComebackVisibilityLevel;
};

export type PositiveComebackResult = {
  day: number;
  candidates: PositiveComebackCandidate[];
  primaryCandidate?: PositiveComebackCandidate;
  reportCandidate?: PositiveComebackCandidate;
  hubCandidate?: PositiveComebackCandidate;
  eceCandidate?: PositiveComebackCandidate;
  portfolioCandidate?: PositiveComebackCandidate;
  sourceIds: string[];
};

export type PositiveComebackInput = {
  day: number;
  rewardComebackSignals?: unknown;
  dailyCapacityPortfolioResult?: unknown;
  followUpActionResult?: unknown;
  oneMoreDayRetentionResult?: unknown;
  portfolioDeferRiskResult?: unknown;
  cityMemoryVisibilityResult?: unknown;
  decisionConsequenceThreads?: unknown[];
  carryOverSignals?: unknown;
  butterflySignals?: unknown;
  districtPersonalityProfiles?: unknown[];
  districtTrustSignals?: unknown;
  districtMemorySignals?: unknown;
  cityArchiveSignals?: unknown;
  storyChainSignals?: unknown;
  socialPulseSignals?: unknown;
  containerNetworkSignals?: unknown;
  operationalResourceSignals?: unknown;
  authorityExpansionSummary?: unknown;
  authorityPermissionIds?: string[];
  eceStrategyLineResult?: unknown;
  recentCandidateIds?: string[];
};

export type PositiveComebackCardModel = {
  id: string;
  title: string;
  line: string;
  benefitLine: string;
  badgeLabel: string;
  tone: PositiveComebackTone;
  districtName?: string;
  isActionable: boolean;
  accessibilityLabel: string;
};

export type PositiveComebackCandidateDraft = {
  kind: PositiveComebackKind;
  sourceIds: string[];
  sourceKinds: PositiveComebackSourceKind[];
  priority: number;
  confidence: PositiveComebackConfidence;
  districtId?: string;
  districtName?: string;
  dayPolicy?: PositiveComebackDayPolicy;
  tone?: PositiveComebackTone;
  title?: string;
  line?: string;
  benefitLine?: string;
  visibilityLevel?: PositiveComebackVisibilityLevel;
  isActionable?: boolean;
  isFallback?: boolean;
  seed?: number;
};
