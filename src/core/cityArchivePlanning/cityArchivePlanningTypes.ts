export type CityArchiveEntryKind =
  | 'decision_record'
  | 'district_shift'
  | 'trust_recovery'
  | 'route_balanced'
  | 'container_relief'
  | 'resource_pressure'
  | 'resource_recovery'
  | 'social_response'
  | 'crisis_prevented'
  | 'main_operation_started'
  | 'comeback_available'
  | 'comeback_completed'
  | 'ece_prediction_confirmed'
  | 'story_chain_step'
  | 'report_milestone';

export type CityArchiveEntrySourceKind =
  | 'decisionImpact'
  | 'cityJournal'
  | 'rewardComeback'
  | 'districtReportCard'
  | 'advisorRelationship'
  | 'storyChain'
  | 'operationSignals'
  | 'contentPackMeta'
  | 'manualFallback';

export type CityArchiveBackfillSource =
  | 'city_day_last_daily_report'
  | 'decision_history'
  | 'city_journal_lite'
  | 'reward_comeback'
  | 'district_report_card'
  | 'main_operation_feel'
  | 'carry_over_memory'
  | 'fallback_archive_started';

export type CityArchiveWriteTimingOption =
  | 'after_apply_decision'
  | 'after_end_current_day_report_close'
  | 'post_day_refresh';

export type CityArchiveTrustDeltaBand = 'down' | 'flat' | 'up' | 'recovered';
export type CityArchiveImpactBand = 'none' | 'low' | 'medium' | 'high';
export type CityArchiveTone = 'positive' | 'watch' | 'strained' | 'stable';
export type CityArchivePriority = 'low' | 'medium' | 'high' | 'milestone';

export type CityArchiveEntry = {
  id: string;
  day: number;
  kind: CityArchiveEntryKind;
  districtId?: string;
  domain?: string;
  eventId?: string;
  decisionId?: string;
  sourceKind: CityArchiveEntrySourceKind;
  title: string;
  shortLine: string;
  reportLine?: string;
  eceLine?: string;
  socialLine?: string;
  mapLine?: string;
  scoreImpact?: CityArchiveImpactBand;
  trustDeltaBand?: CityArchiveTrustDeltaBand;
  resourceImpactBand?: CityArchiveImpactBand;
  isPlayerVisible: boolean;
  priority: CityArchivePriority;
  duplicateKey: string;
  createdFrom: CityArchiveEntrySourceKind;
};

export type CityArchiveDistrictSummary = {
  districtId: string;
  lastUpdatedDay: number;
  recentEntryIds: string[];
  dominantIssueKind?: string;
  trustTrend: CityArchiveTrustDeltaBand;
  socialTone: CityArchiveTone;
  resourceTone: CityArchiveTone;
  lastPositiveMoment?: string;
  lastWarningMoment?: string;
  playerStyleInDistrict?: string;
  eceDistrictNote?: string;
};

export type CityArchivePlayerStyleSummary = {
  dominantStyle?: string;
  styleConfidence: 'low' | 'medium' | 'high';
  lastUpdatedDay: number;
  supportingEntryIds: string[];
};

export type CityArchiveEceRelationshipSummary = {
  familiarityBand: 'new' | 'warming' | 'familiar' | 'trusted';
  lastPredictionState?: 'confirmed' | 'softened' | 'missed';
  lastPredictionEntryId?: string;
  trustedPatterns: string[];
  lastUpdatedDay: number;
};

export type CityArchiveRewardComebackSummary = {
  recentPositiveEntryIds: string[];
  recentComebackEntryIds: string[];
  lastCompletedComebackDay?: number;
  lastUpdatedDay: number;
};

export type CityArchiveStoryChainSummary = {
  activeChainIds: string[];
  unresolvedChainKinds: string[];
  lastClosureDay?: number;
  lastUpdatedDay: number;
};

export type CityArchivePruningState = {
  maxEntries: number;
  maxEntriesPerDistrict: number;
  keepLastNDaysDetailed: number;
  compactedBeforeDay?: number;
  compactedEntryCount: number;
};

export type CityArchiveMigrationMeta = {
  migratedFromSaveVersion: number;
  migratedAtDay: number;
  backfillStrategy: string;
  backfillEntryCount: number;
  warnings: string[];
};

export type CityArchiveV1State = {
  version: 1;
  createdAtDay: number;
  updatedAtDay: number;
  entries: CityArchiveEntry[];
  districtSummaries: Record<string, CityArchiveDistrictSummary>;
  playerStyleSummary: CityArchivePlayerStyleSummary;
  eceRelationshipSummary: CityArchiveEceRelationshipSummary;
  rewardComebackSummary: CityArchiveRewardComebackSummary;
  storyChainSummary: CityArchiveStoryChainSummary;
  pruningState: CityArchivePruningState;
  migrationMeta?: CityArchiveMigrationMeta;
};

export type CityArchivePlanningAuditCheck = {
  id: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
};

export type CityArchivePlanningAuditResult = {
  ok: boolean;
  targetModelReady: boolean;
  migrationPlanReady: boolean;
  integrationPlanReady: boolean;
  safetyReady: boolean;
  checks: CityArchivePlanningAuditCheck[];
};
