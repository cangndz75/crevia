export type DistrictNeglectRecoverySourceKind =
  | 'district_personality'
  | 'district_trust'
  | 'district_memory'
  | 'city_archive'
  | 'story_chain'
  | 'decision_consequence'
  | 'carry_over'
  | 'butterfly_effect'
  | 'daily_capacity_portfolio'
  | 'portfolio_defer_risk'
  | 'one_more_day_retention'
  | 'follow_up_action'
  | 'positive_comeback'
  | 'city_memory_visibility'
  | 'ece_strategy_line'
  | 'social_pulse'
  | 'map_gameplay_binding'
  | 'active_operation_map_binding'
  | 'authority_gameplay_expansion'
  | 'fallback';

export type DistrictNeglectRecoveryKind =
  | 'neglect_watch'
  | 'neglect_warning'
  | 'trust_fragility'
  | 'social_cooling'
  | 'route_backlog'
  | 'container_backlog'
  | 'recovery_window'
  | 'recovery_progress'
  | 'positive_momentum'
  | 'safe_watch'
  | 'fallback';

export type DistrictNeglectBand = 'none' | 'watch' | 'rising' | 'high';

export type DistrictRecoveryBand = 'none' | 'possible' | 'active' | 'strong';

export type DistrictNeglectRecoveryTone =
  | 'neutral'
  | 'cautious'
  | 'positive'
  | 'strategic'
  | 'locked';

export type DistrictNeglectRecoveryDayPolicy =
  | 'day_1'
  | 'day_2_7'
  | 'day_8_plus'
  | 'day_10_plus'
  | 'any';

export type DistrictNeglectRecoveryConfidence = 'low' | 'medium' | 'high';

export type DistrictNeglectRecoverySignal = {
  id: string;
  districtId: string;
  districtName: string;
  kind: DistrictNeglectRecoveryKind;
  title: string;
  line: string;
  shortLine?: string;
  neglectScore: number;
  recoveryScore: number;
  neglectBand: DistrictNeglectBand;
  recoveryBand: DistrictRecoveryBand;
  tone: DistrictNeglectRecoveryTone;
  sourceIds: string[];
  sourceKinds: DistrictNeglectRecoverySourceKind[];
  confidence: DistrictNeglectRecoveryConfidence;
  priority: number;
  dayPolicy: DistrictNeglectRecoveryDayPolicy;
  isActionable: boolean;
  isFallback: boolean;
};

export type DistrictNeglectRecoveryResult = {
  day: number;
  signals: DistrictNeglectRecoverySignal[];
  primarySignal?: DistrictNeglectRecoverySignal;
  reportSignal?: DistrictNeglectRecoverySignal;
  hubSignal?: DistrictNeglectRecoverySignal;
  mapSignal?: DistrictNeglectRecoverySignal;
  eceSignal?: DistrictNeglectRecoverySignal;
  portfolioSignal?: DistrictNeglectRecoverySignal;
  sourceIds: string[];
};

export type DistrictNeglectRecoveryInput = {
  day: number;
  districtPersonalityProfiles?: unknown[];
  districtTrustSignals?: unknown;
  districtMemorySignals?: unknown;
  cityArchiveSignals?: unknown;
  storyChainSignals?: unknown;
  decisionConsequenceThreads?: unknown[];
  carryOverSignals?: unknown;
  butterflySignals?: unknown;
  dailyCapacityPortfolioResult?: unknown;
  portfolioDeferRiskResult?: unknown;
  oneMoreDayRetentionResult?: unknown;
  followUpActionResult?: unknown;
  positiveComebackResult?: unknown;
  cityMemoryVisibilityResult?: unknown;
  eceStrategyLineResult?: unknown;
  socialPulseSignals?: unknown;
  mapGameplayBindings?: unknown[];
  activeOperationMapBindings?: unknown[];
  authorityExpansionSummary?: unknown;
  recentSignalIds?: string[];
  suppressSourceIds?: string[];
  suppressLines?: string[];
};

export type DistrictNeglectRecoveryCardModel = {
  id: string;
  title: string;
  line: string;
  shortLine?: string;
  badgeLabel: string;
  districtName: string;
  neglectLabel?: string;
  recoveryLabel?: string;
  tone: DistrictNeglectRecoveryTone;
  isActionable: boolean;
  accessibilityLabel: string;
};

export type DistrictNeglectRecoveryContributionDraft = {
  districtId?: string;
  districtName?: string;
  neglectDelta?: number;
  recoveryDelta?: number;
  sourceIds: string[];
  sourceKinds: DistrictNeglectRecoverySourceKind[];
  neglectKindHint?: DistrictNeglectRecoveryKind;
  recoveryKindHint?: DistrictNeglectRecoveryKind;
  confidence?: DistrictNeglectRecoveryConfidence;
  priority?: number;
  requiresLiveSource?: boolean;
  marksTrustSource?: boolean;
  marksRouteSource?: boolean;
  marksContainerSource?: boolean;
  marksSocialSource?: boolean;
  personalityNeglectBoost?: boolean;
  personalityRecoveryBoost?: boolean;
};
