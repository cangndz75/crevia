export type AuthorityRankId =
  | 'field_coordinator'
  | 'operations_responsible'
  | 'unit_chief'
  | 'district_coordinator'
  | 'deputy_director'
  | 'department_director';

export type AuthorityPermissionId =
  | 'basic_operations'
  | 'daily_preparation_authority'
  | 'field_priority_note'
  | 'promotion_review_eligible'
  | 'operations_responsible_scope'
  | 'district_expansion_preview'
  | 'unit_chief_scope';

export type AuthorityEvaluationStatus =
  | 'stable'
  | 'watching'
  | 'promotion_candidate'
  | 'promoted';

export type AuthorityDomainKey =
  | 'operations'
  | 'publicTrust'
  | 'resources'
  | 'personnel'
  | 'crisis';

export type AuthorityDomainScores = Record<AuthorityDomainKey, number>;

export type AuthorityRankDefinition = {
  id: AuthorityRankId;
  label: string;
  trustThreshold: number;
};

export type AuthorityPermissionDefinition = {
  id: AuthorityPermissionId;
  label: string;
  trustThreshold: number;
};

export type AuthorityHistoryEntry = {
  day: number;
  type: 'daily_gain' | 'evaluation' | 'permission_unlock';
  trustDelta?: number;
  trustAfter: number;
  formalRankId: AuthorityRankId;
  note?: string;
};

export type AuthorityDailyGainSource =
  | 'main_event_resolved'
  | 'side_event_resolved'
  | 'daily_goal_completed'
  | 'critical_risk_closed'
  | 'budget_stable'
  | 'personnel_morale_maintained'
  | 'social_pulse_balanced'
  | 'butterfly_followup_managed'
  | 'critical_event_unresolved'
  | 'budget_severe_drop'
  | 'personnel_morale_severe_drop'
  | 'social_crisis_grew';

export type AuthorityDailyGainLine = {
  source: AuthorityDailyGainSource;
  delta: number;
  label: string;
};

export type AuthorityDailyGainSnapshot = {
  day: number;
  trustBefore: number;
  trustAfter: number;
  netGain: number;
  lines: AuthorityDailyGainLine[];
  domainScoreDeltas: Partial<AuthorityDomainScores>;
  newlyUnlockedPermissionIds: AuthorityPermissionId[];
};

export type AuthorityEvaluationSnapshot = {
  day: number;
  pilotScore: number;
  trustAtEvaluation: number;
  previousFormalRankId: AuthorityRankId;
  nextFormalRankId?: AuthorityRankId;
  evaluationStatus: AuthorityEvaluationStatus;
  pendingPromotionRankId?: AuthorityRankId;
  promoted: boolean;
  summaryLines: string[];
  /** Pilot final değerlendirmesi idempotency anahtarı. */
  pilotRunId?: string;
};

export type AuthorityState = {
  authorityTrust: number;
  formalRankId: AuthorityRankId;
  evaluationStatus: AuthorityEvaluationStatus;
  pendingPromotionRankId?: AuthorityRankId;
  unlockedPermissionIds: AuthorityPermissionId[];
  domainScores: AuthorityDomainScores;
  history: AuthorityHistoryEntry[];
  lastDailyGain?: AuthorityDailyGainSnapshot;
  lastEvaluation?: AuthorityEvaluationSnapshot;
  lastUpdatedDay: number;
};

export type CalculateDailyAuthorityTrustGainInput = {
  day: number;
  mainEventResolved?: boolean;
  sideEventsResolvedCount?: number;
  dailyGoalsCompletedCount?: number;
  criticalRiskClosedWithoutGrowth?: boolean;
  budgetNotSeriouslyDamaged?: boolean;
  personnelMoraleMaintained?: boolean;
  socialPulseBalanced?: boolean;
  butterflyFollowUpWellManaged?: boolean;
  criticalEventUnresolved?: boolean;
  budgetSeverelyDropped?: boolean;
  personnelMoraleSeverelyDropped?: boolean;
  socialCrisisGrew?: boolean;
};

export type EvaluateAuthorityPromotionInput = {
  authorityState: AuthorityState;
  pilotScore: number;
  day: number;
};

export type AuthorityProgress = {
  currentRank: AuthorityRankDefinition;
  nextRank?: AuthorityRankDefinition;
  progressToNextPercent: number;
  trustRemainingToNext: number;
};
