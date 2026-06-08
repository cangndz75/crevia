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
  | 'trained'
  | 'reliable'
  | 'expert_preview';

export type TeamFatigueBand = 'low' | 'moderate' | 'high' | 'strained';

export type TeamMoraleBand = 'steady' | 'watch' | 'motivated' | 'tired';

export type TeamSpecializationReadinessStatus =
  | 'blocked'
  | 'planning_complete'
  | 'ready_for_v1_implementation';

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

export type TeamExperienceScoreSourceId =
  | 'assignment_personnel_group'
  | 'assignment_compatibility'
  | 'event_domain_success'
  | 'event_outcome_success'
  | 'city_archive_entry'
  | 'story_chain_closure'
  | 'district_report_player_style'
  | 'content_pack_domain'
  | 'reward_comeback_positive'
  | 'operational_resources_capacity'
  | 'vehicle_maintenance_fatigue'
  | 'same_domain_success'
  | 'repeated_district_domain_success'
  | 'poor_fit_penalty'
  | 'failed_outcome_penalty'
  | 'fatigue_gain_reduction'
  | 'backup_overuse_morale';

export type TeamFatigueScoreSourceId =
  | 'consecutive_use_streak'
  | 'rapid_support_field_response'
  | 'crisis_adjacent_pressure'
  | 'poor_fit_assignment'
  | 'recovery_rest_window'
  | 'balanced_assignment_relief';

export type TeamMoraleScoreSourceId =
  | 'positive_outcome'
  | 'public_thanks_social_trust'
  | 'repeated_strain'
  | 'backup_overuse'
  | 'team_capacity_stable';

export type TeamScoreContribution = {
  sourceId: TeamExperienceScoreSourceId | TeamFatigueScoreSourceId | TeamMoraleScoreSourceId;
  scoreKind: 'experience' | 'fatigue' | 'morale';
  weight: number;
  description: string;
};

export type TeamGroupPlan = {
  groupId: TeamGroupId;
  label: string;
  playerLabel: string;
  linkedDomains: string[];
  linkedDistricts: MapDistrictId[];
  linkedArchiveKinds: string[];
  linkedStoryChainKinds: string[];
  linkedVehicleFleetGroups: string[];
  maxConsecutiveUseDays: number;
};

export type TeamSpecializationDaySafetyPlan = {
  dayRange: string;
  specializationUiVisibility: 'hidden' | 'passive_hint' | 'minimal_hint' | 'visible';
  hubLineMax: number;
  reportLineMax: number;
  mapHintAllowed: boolean;
};

export type TeamSpecializationSurfacePlan = {
  surface: 'hub' | 'report' | 'map' | 'assignment_preview' | 'city_journal';
  maxLinesPerDay: number;
  priorityBelow: string[];
  exampleLine: string;
  forbiddenTerms: string[];
};

export type TeamArchiveEntryRecommendation = {
  kind: string;
  purpose: string;
  duplicateKeyPattern: string;
  playerFacing: boolean;
  storeRawPersonnelData: false;
};

export type TeamSpecializationMigrationPlan = {
  targetSaveVersion: number;
  currentSaveVersion: number;
  steps: string[];
  day7Default: string;
  day8Derivation: string[];
  safeFallback: string;
  idempotent: boolean;
};

export type TeamSpecializationImplementationScope = {
  stage: string;
  included: string[];
  notIncluded: string[];
};

export type TeamSpecializationPlanningAuditCheck = {
  id: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
};

export type TeamSpecializationReadinessScore = {
  modelCompletenessScore: number;
  teamGroupCoverageScore: number;
  scoringPlanScore: number;
  integrationPlanScore: number;
  surfaceDensityPlanScore: number;
  daySafetyScore: number;
  migrationPlanScore: number;
  manualQaNeedScore: number;
  overallReadiness: TeamSpecializationReadinessStatus;
  summaryLine: string;
};

export type TeamSpecializationPlanningAuditResult = {
  checks: TeamSpecializationPlanningAuditCheck[];
  readinessScore: TeamSpecializationReadinessScore;
  runtimeOpen: boolean;
  implementationBlocked: boolean;
};
