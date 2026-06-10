import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

export type TeamSpecializationStateVersion = 1;

export type TeamGroupId =
  | 'field_coordination'
  | 'route_cleanup'
  | 'container_service'
  | 'social_response'
  | 'rapid_support'
  | 'backup_team';

export type SpecializationBand =
  | 'none'
  | 'emerging'
  | 'reliable'
  | 'specialized'
  | 'expert_preview';

export type TeamFatigueBand = 'low' | 'watched' | 'elevated' | 'strained';

export type TeamMoraleBand = 'steady' | 'motivated' | 'pressured' | 'tired';

export type TeamGroupSpecializationStateV1 = {
  groupId: TeamGroupId;
  label: string;
  specializationBand: SpecializationBand;
  fatigueBand: TeamFatigueBand;
  moraleBand: TeamMoraleBand;
  dominantDomain: string;
  secondaryDomain?: string;
  experienceScore: number;
  fatigueScore: number;
  moraleScore: number;
  lastAssignedDay?: number;
  consecutiveUseDays: number;
  districtExperienceIds: MapDistrictId[];
  relatedArchiveEntryIds: string[];
  suggestedUseLine: string;
  cautionLine?: string;
  duplicateKey: string;
};

export type TeamSpecializationSummary = {
  highestExperienceGroupId?: TeamGroupId;
  overallFatigueBand: TeamFatigueBand;
  overallMoraleBand: TeamMoraleBand;
  playerLine?: string;
};

export type TeamFatigueSummary = {
  strainedGroupIds: TeamGroupId[];
  consecutiveHeavyDays: number;
  playerLine?: string;
};

export type TeamAssignmentFitSummary = {
  lastPersonnelGroupUsed?: string;
  compatibilityScore?: number;
  fitDelta: number;
  playerLine?: string;
};

export type TeamDistrictExperienceSummary = {
  dominantDistrictId?: MapDistrictId;
  experienceScore: number;
  playerLine?: string;
};

export type TeamCityArchiveLinkSummary = {
  recentEntryKinds: string[];
  linkedEntryIds: string[];
  duplicateGuardActive: boolean;
};

export type TeamVehicleMaintenanceLinkSummary = {
  linkedFleetGroupIds: string[];
  strainSignals: string[];
  cautionActive: boolean;
  playerLine?: string;
};

export type TeamSpecializationMigrationMeta = {
  targetSaveVersion: number;
  migratedFromVersion?: number;
  derivedFromAssignment: boolean;
  derivedFromArchive: boolean;
  idempotent: boolean;
  warnings?: string[];
};

export type TeamSpecializationStateV1 = {
  version: TeamSpecializationStateVersion;
  createdAtDay: number;
  updatedAtDay: number;
  teamGroups: Record<TeamGroupId, TeamGroupSpecializationStateV1>;
  specializationSummary: TeamSpecializationSummary;
  fatigueSummary: TeamFatigueSummary;
  assignmentFitSummary: TeamAssignmentFitSummary;
  districtExperienceSummary: TeamDistrictExperienceSummary;
  cityArchiveLinkSummary: TeamCityArchiveLinkSummary;
  vehicleMaintenanceLinkSummary: TeamVehicleMaintenanceLinkSummary;
  migrationMeta: TeamSpecializationMigrationMeta;
  sourceSignals: string[];
};

export type TeamSpecializationDayCloseInput = {
  day: number;
  operationSignals?: {
    vehicles?: { status?: string };
    containers?: { status?: string };
    personnel?: { status?: string };
    districts?: { status?: string };
    priorityDistrictId?: string;
  };
  assignmentPersonnelGroup?: string;
  assignmentVehicleGroup?: string;
  assignmentCompatibilityScore?: number;
  assignmentApproach?: string;
  assignmentDomain?: string;
  assignmentOutcomePositive?: boolean;
  cityArchiveRecentKinds?: string[];
  storyChainKinds?: string[];
  contentPackDomains?: string[];
  districtId?: MapDistrictId;
  routeBalanced?: boolean;
  resourceRecovery?: boolean;
  comebackCompleted?: boolean;
  resourcePressure?: boolean;
  crisisAdjacent?: boolean;
  socialTrustPositive?: boolean;
  teamCapacityStable?: boolean;
  recoveryRestWindow?: boolean;
  storyChainClosure?: boolean;
  repeatedDistrictSuccess?: boolean;
  existingHubLines?: string[];
  existingReportLines?: string[];
  existingMapHints?: string[];
  existingAssignmentHints?: string[];
  hubDensityContext?: {
    existingInsightLineCount?: number;
    hasActiveOperationInsight?: boolean;
    hasAuthorityPreview?: boolean;
    hasBadgeShowcase?: boolean;
    hasDistrictExpansion?: boolean;
  };
  vehicleMaintenanceStrainActive?: boolean;
  vehicleMaintenanceLine?: string;
  vehicleMaintenance?: {
    fleetGroups?: Record<
      string,
      { maintenanceNeedScore?: number; conditionBand?: string; fatigueBand?: string }
    >;
  };
};

export type TeamSpecializationStorySignalType =
  | 'field_coordination_followup_hint'
  | 'route_cleanup_chain_hint'
  | 'container_service_chain_hint'
  | 'social_response_trust_hint'
  | 'rapid_support_fatigue_hint'
  | 'backup_team_strain_hint';

export type TeamSpecializationStorySignal = {
  signalType: TeamSpecializationStorySignalType;
  groupId: TeamGroupId;
  priority: 'low';
  canStrengthenChain: boolean;
  shouldSoftenChain: boolean;
  reason: string;
};

export type TeamSpecializationSurfaceLines = {
  hubLine?: string;
  reportLine?: string;
  mapHint?: string;
  assignmentHint?: string;
  journalLabel?: string;
  suppressVehicleMaintenanceLine?: boolean;
  mergedStrainLine?: string;
};
