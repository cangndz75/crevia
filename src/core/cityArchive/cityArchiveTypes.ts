import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

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

export type CityArchiveTrustDeltaBand = 'down' | 'flat' | 'up' | 'recovered';
export type CityArchiveImpactBand = 'none' | 'low' | 'medium' | 'high';
export type CityArchiveTone = 'positive' | 'watch' | 'strained' | 'stable';
export type CityArchivePriority = 'low' | 'medium' | 'high' | 'milestone';

export type CityArchiveEntry = {
  id: string;
  day: number;
  kind: CityArchiveEntryKind;
  districtId?: MapDistrictId;
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
  trustDeltaBand?: CityArchiveTrustDeltaBand;
  resourceImpactBand?: CityArchiveImpactBand;
  isPlayerVisible: boolean;
  priority: CityArchivePriority;
  duplicateKey: string;
  createdFrom: CityArchiveEntrySourceKind;
  createdAtDay: number;
};

export type CityArchiveDistrictSummary = {
  districtId: MapDistrictId;
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
  lastResolvedDay?: number;
  duplicateKeys?: string[];
  summaryLine?: string;
  activeChains?: import('@/core/storyChains/storyChainPersistentTypes').PersistentStoryChain[];
  recentlyClosedChains?: import('@/core/storyChains/storyChainPersistentTypes').PersistentStoryChainClosure[];
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

export type CityArchiveAppendOptions = {
  day: number;
  skipDuplicate?: boolean;
};

export type CityArchiveDayCloseInput = {
  day: number;
  isPostPilot?: boolean;
  isPilotCompleted?: boolean;
  accessMode?: 'none' | 'limited' | 'full';
  lastDailyReport?: {
    day?: number;
    summary?: string;
    headline?: string;
  } | null;
  dayDecisions?: Array<{
    id?: string;
    day?: number;
    eventId?: string;
    decisionId?: string;
    neighborhoodId?: string;
    summary?: string;
  }>;
  journalLines?: string[];
  rewardComebackLine?: string | null;
  rewardComebackKind?: string | null;
  districtReportLine?: string | null;
  districtId?: MapDistrictId | string | null;
  mainOperationFeelLine?: string | null;
  advisorPredictionLine?: string | null;
  carryOverLine?: string | null;
  operationSignalLine?: string | null;
};

export type CityArchiveBackfillInput = {
  currentDay: number;
  saveVersion: number;
  pilotStatus?: string;
  postPilotPhase?: string | null;
  lastDailyReport?: CityArchiveDayCloseInput['lastDailyReport'];
  decisionHistory?: CityArchiveDayCloseInput['dayDecisions'];
};
