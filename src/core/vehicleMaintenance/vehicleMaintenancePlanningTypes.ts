import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

export type VehicleMaintenanceStateVersion = 1;

export type VehicleFleetGroupId =
  | 'light_service'
  | 'route_support'
  | 'container_support'
  | 'field_response'
  | 'backup_fleet';

export type VehicleConditionBand =
  | 'stable'
  | 'watch'
  | 'strained'
  | 'maintenance_due'
  | 'critical';

export type VehicleFatigueBand = 'low' | 'moderate' | 'high' | 'severe';

export type VehicleAvailabilityBand =
  | 'ready'
  | 'limited'
  | 'reduced'
  | 'unavailable';

export type VehicleMaintenancePlanningWindowStatus =
  | 'suggested'
  | 'planned'
  | 'skipped'
  | 'completed'
  | 'expired';

export type VehicleMaintenancePlanningWindowKind =
  | 'light_check'
  | 'route_reset'
  | 'container_vehicle_service'
  | 'field_recovery'
  | 'emergency_repair_watch';

export type VehicleMaintenanceReadinessStatus =
  | 'blocked'
  | 'planning_complete'
  | 'ready_for_v1_implementation';

export type VehicleFleetGroupStateV1 = {
  groupId: VehicleFleetGroupId;
  label: string;
  conditionBand: VehicleConditionBand;
  fatigueBand: VehicleFatigueBand;
  availabilityBand: VehicleAvailabilityBand;
  lastUsedDay: number;
  consecutiveUseDays: number;
  lastMaintenanceDay?: number;
  maintenanceNeedScore: number;
  routePressureScore: number;
  assignmentPressureScore: number;
  districtPressureIds: MapDistrictId[];
  relatedArchiveEntryIds: string[];
  nextSuggestedWindow?: string;
  playerVisibleLine: string;
};

export type VehicleMaintenancePlanningWindow = {
  id: string;
  groupId: VehicleFleetGroupId;
  day: number;
  status: VehicleMaintenancePlanningWindowStatus;
  windowKind: VehicleMaintenancePlanningWindowKind;
  priority: number;
  tradeoffLine: string;
  expectedEffect: string;
  duplicateKey: string;
};

export type VehicleMaintenanceFatigueSummary = {
  overallBand: VehicleFatigueBand;
  highestPressureGroupId?: VehicleFleetGroupId;
  consecutiveHeavyDays: number;
  playerLine?: string;
};

export type VehicleMaintenanceRoutePressureSummary = {
  dominantDistrictId?: MapDistrictId;
  routePressureScore: number;
  linkedStoryChainKind?: string;
  playerLine?: string;
};

export type VehicleMaintenanceAssignmentImpactSummary = {
  lastVehicleGroupUsed?: string;
  compatibilityScore?: number;
  pressureDelta: number;
  playerLine?: string;
};

export type VehicleMaintenanceCityArchiveLinkSummary = {
  recentEntryKinds: string[];
  linkedEntryIds: string[];
  duplicateGuardActive: boolean;
};

export type VehicleMaintenanceMigrationMeta = {
  targetSaveVersion: number;
  migratedFromVersion?: number;
  derivedFromArchive: boolean;
  idempotent: boolean;
};

export type VehicleMaintenanceStateV1 = {
  version: VehicleMaintenanceStateVersion;
  createdAtDay: number;
  updatedAtDay: number;
  fleetGroups: Record<VehicleFleetGroupId, VehicleFleetGroupStateV1>;
  maintenanceWindows: VehicleMaintenancePlanningWindow[];
  fatigueSummary: VehicleMaintenanceFatigueSummary;
  routePressureSummary: VehicleMaintenanceRoutePressureSummary;
  assignmentImpactSummary: VehicleMaintenanceAssignmentImpactSummary;
  cityArchiveLinkSummary: VehicleMaintenanceCityArchiveLinkSummary;
  migrationMeta: VehicleMaintenanceMigrationMeta;
  sourceSignals: string[];
};

export type VehicleMaintenanceScoreSourceId =
  | 'operation_signals_vehicle'
  | 'resource_fatigue'
  | 'operational_resources'
  | 'assignment_vehicle_group'
  | 'vehicle_route_domain_event'
  | 'route_balanced_archive'
  | 'resource_pressure_archive'
  | 'story_chain_route_pressure'
  | 'story_chain_resource_fatigue'
  | 'district_report_resource_pressure'
  | 'content_pack_vehicle_route'
  | 'content_pack_resource_pressure'
  | 'consecutive_use_streak'
  | 'backup_fleet_overuse'
  | 'crisis_adjacent_field_response';

export type VehicleMaintenanceScoreContribution = {
  sourceId: VehicleMaintenanceScoreSourceId;
  weight: number;
  description: string;
};

export type VehicleMaintenanceFleetGroupPlan = {
  groupId: VehicleFleetGroupId;
  label: string;
  playerLabel: string;
  linkedDomains: string[];
  linkedDistricts: MapDistrictId[];
  linkedArchiveKinds: string[];
  linkedStoryChainKinds: string[];
  maxConsecutiveUseDays: number;
  maintenanceWindowKinds: VehicleMaintenancePlanningWindowKind[];
};

export type VehicleMaintenanceDaySafetyPlan = {
  dayRange: string;
  maintenanceUiVisibility: 'hidden' | 'passive_hint' | 'suggested' | 'visible';
  windowSuggestionAllowed: boolean;
  hubLineMax: number;
  reportLineMax: number;
  mapHintAllowed: boolean;
};

export type VehicleMaintenanceSurfacePlan = {
  surface: 'hub' | 'report' | 'map' | 'assignment_preview' | 'city_journal';
  maxLinesPerDay: number;
  priorityBelow: string[];
  exampleLine: string;
  forbiddenTerms: string[];
};

export type VehicleMaintenanceArchiveEntryRecommendation = {
  kind: string;
  purpose: string;
  duplicateKeyPattern: string;
  playerFacing: boolean;
  storeRawMetadata: false;
};

export type VehicleMaintenanceMigrationPlan = {
  targetSaveVersion: number;
  currentSaveVersion: number;
  steps: string[];
  day7Default: string;
  day8Derivation: string[];
  safeFallback: string;
  idempotent: boolean;
};

export type VehicleMaintenanceImplementationScope = {
  stage: string;
  included: string[];
  notIncluded: string[];
};

export type VehicleMaintenancePlanningAuditCheck = {
  id: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
};

export type VehicleMaintenanceReadinessScore = {
  modelCompletenessScore: number;
  fleetGroupCoverageScore: number;
  scoringPlanScore: number;
  integrationPlanScore: number;
  surfaceDensityPlanScore: number;
  daySafetyScore: number;
  migrationPlanScore: number;
  manualQaNeedScore: number;
  overallReadiness: VehicleMaintenanceReadinessStatus;
  summaryLine: string;
};

export type VehicleMaintenancePlanningAuditResult = {
  checks: VehicleMaintenancePlanningAuditCheck[];
  readinessScore: VehicleMaintenanceReadinessScore;
  runtimeOpen: boolean;
  implementationBlocked: boolean;
};
