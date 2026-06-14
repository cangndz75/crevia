export type FollowUpExecutionSourceKind =
  | 'follow_up_action'
  | 'day8_operation_feed_binding'
  | 'positive_comeback'
  | 'city_memory_visibility'
  | 'district_neglect_recovery'
  | 'daily_capacity_portfolio'
  | 'portfolio_defer_risk'
  | 'one_more_day_retention'
  | 'city_rhythm_director';

export type FollowUpExecutionKind =
  | 'recheck_district'
  | 'send_small_team'
  | 'monitor_signal'
  | 'rebalance_resource'
  | 'review_route'
  | 'check_container_line'
  | 'calm_social_pulse'
  | 'reinforce_trust'
  | 'capture_memory_trace'
  | 'support_recovery'
  | 'safe_watch';

export type FollowUpExecutionStatus =
  | 'available'
  | 'executed'
  | 'blocked'
  | 'expired';

export type FollowUpExecutionTone =
  | 'calm'
  | 'positive'
  | 'cautious'
  | 'strategic';

export type FollowUpExecutionCandidate = {
  id: string;
  actionId: string;
  kind: FollowUpExecutionKind;
  title: string;
  line: string;
  resultLine: string;
  districtId?: string;
  districtName?: string;
  status: FollowUpExecutionStatus;
  tone: FollowUpExecutionTone;
  priority: number;
  sourceIds: string[];
  sourceKinds: FollowUpExecutionSourceKind[];
  isPresentationOnly: true;
};

export type FollowUpExecutionResult = {
  day: number;
  isActive: boolean;
  availableCandidates: FollowUpExecutionCandidate[];
  executedCandidates: FollowUpExecutionCandidate[];
  primaryCandidate?: FollowUpExecutionCandidate;
  reportCandidate?: FollowUpExecutionCandidate;
  hubCandidate?: FollowUpExecutionCandidate;
  eceCandidate?: FollowUpExecutionCandidate;
  sourceIds: string[];
};

export type FollowUpExecutionInput = {
  day: number;
  followUpActionResult?: unknown;
  day8OperationFeedBindingResult?: unknown;
  positiveComebackResult?: unknown;
  cityMemoryVisibilityResult?: unknown;
  districtNeglectRecoveryResult?: unknown;
  dailyCapacityPortfolioResult?: unknown;
  portfolioDeferRiskResult?: unknown;
  oneMoreDayRetentionResult?: unknown;
  cityRhythmDirectorResult?: unknown;
  executedActionIdsToday?: string[];
  expiredActionIds?: string[];
  suppressSourceIds?: string[];
};

export type ExecuteFollowUpActionLiteCommand = {
  day: number;
  actionId: string;
};

export type FollowUpExecutionCardModel = {
  id: string;
  title: string;
  line: string;
  resultLine?: string;
  badgeLabel: string;
  ctaLabel?: string;
  districtName?: string;
  status: FollowUpExecutionStatus;
  tone: FollowUpExecutionTone;
  accessibilityLabel: string;
};

export type FollowUpExecutionSourceAdapter = {
  id: string;
  title: string;
  line: string;
  sourceIds: string[];
  sourceKinds: string[];
  kind: string;
};
