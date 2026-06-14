export type FollowUpActionSourceKind =
  | 'portfolio_defer_risk'
  | 'one_more_day_retention'
  | 'daily_capacity_portfolio'
  | 'city_memory_visibility'
  | 'decision_consequence'
  | 'tomorrow_risk'
  | 'district_personality'
  | 'district_memory'
  | 'city_archive'
  | 'story_chain'
  | 'carry_over'
  | 'butterfly_effect'
  | 'reward_comeback'
  | 'ece_strategy_line'
  | 'authority_gameplay_expansion'
  | 'fallback';

export type FollowUpActionKind =
  | 'recheck_district'
  | 'monitor_signal'
  | 'send_small_team'
  | 'rebalance_resource'
  | 'review_route'
  | 'check_container_line'
  | 'calm_social_pulse'
  | 'reinforce_trust'
  | 'capture_memory_trace'
  | 'support_recovery'
  | 'prepare_tomorrow'
  | 'safe_watch';

export type FollowUpActionCostBand = 'none' | 'low' | 'medium';

export type FollowUpActionImpactBand = 'low' | 'medium' | 'high';

export type FollowUpActionConfidence = 'low' | 'medium' | 'high';

export type FollowUpActionDayPolicy =
  | 'day_1'
  | 'day_2_7'
  | 'day_8_plus'
  | 'day_10_plus'
  | 'any';

export type FollowUpActionVisibilityLevel = 'hidden' | 'teaser' | 'summary' | 'detailed';

export type FollowUpAction = {
  id: string;
  kind: FollowUpActionKind;
  title: string;
  line: string;
  benefitLine: string;
  riskLine?: string;
  districtId?: string;
  districtName?: string;
  costBand: FollowUpActionCostBand;
  impactBand: FollowUpActionImpactBand;
  sourceIds: string[];
  sourceKinds: FollowUpActionSourceKind[];
  confidence: FollowUpActionConfidence;
  priority: number;
  dayPolicy: FollowUpActionDayPolicy;
  visibilityLevel: FollowUpActionVisibilityLevel;
  isActionable: boolean;
  isFallback: boolean;
};

export type FollowUpActionResult = {
  day: number;
  actions: FollowUpAction[];
  primaryAction?: FollowUpAction;
  secondaryAction?: FollowUpAction;
  sourceIds: string[];
};

export type FollowUpActionInput = {
  day: number;
  portfolioDeferRiskResult?: unknown;
  oneMoreDayRetentionResult?: unknown;
  dailyCapacityPortfolioResult?: unknown;
  cityMemoryVisibilityResult?: unknown;
  decisionConsequenceThreads?: unknown[];
  tomorrowRiskSignals?: unknown;
  districtPersonalityProfiles?: unknown[];
  districtMemorySignals?: unknown;
  cityArchiveSignals?: unknown;
  storyChainSignals?: unknown;
  carryOverSignals?: unknown;
  butterflySignals?: unknown;
  rewardComebackSignals?: unknown;
  eceStrategyLineResult?: unknown;
  authorityExpansionSummary?: unknown;
  recentActionIds?: string[];
};

export type FollowUpActionCardModel = {
  id: string;
  title: string;
  line: string;
  benefitLine: string;
  riskLine?: string;
  badgeLabel: string;
  costLabel: string;
  impactLabel: string;
  districtName?: string;
  tone: 'neutral' | 'positive' | 'cautious' | 'locked';
  isActionable: boolean;
  accessibilityLabel: string;
};

export type FollowUpActionDraft = {
  kind: FollowUpActionKind;
  sourceIds: string[];
  sourceKinds: FollowUpActionSourceKind[];
  priority: number;
  confidence: FollowUpActionConfidence;
  districtId?: string;
  districtName?: string;
  dayPolicy: FollowUpActionDayPolicy;
  riskLine?: string;
  seed: number;
  isFallback?: boolean;
};
