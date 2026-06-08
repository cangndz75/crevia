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

export type VehicleMaintenanceWindowStatus =
  | 'suggested'
  | 'planned'
  | 'skipped'
  | 'completed'
  | 'expired';

export type VehicleMaintenanceWindowKind =
  | 'light_check'
  | 'route_reset'
  | 'container_vehicle_service'
  | 'field_recovery'
  | 'emergency_repair_watch';

export type VehicleMaintenanceWindowSourceKind =
  | 'day_close'
  | 'migration'
  | 'archive_link'
  | 'story_signal';

export type VehicleFleetGroupStateV1 = {
  groupId: VehicleFleetGroupId;
  label: string;
  conditionBand: VehicleConditionBand;
  fatigueBand: VehicleFatigueBand;
  availabilityBand: VehicleAvailabilityBand;
  lastUsedDay?: number;
  consecutiveUseDays: number;
  lastMaintenanceDay?: number;
  maintenanceNeedScore: number;
  routePressureScore: number;
  assignmentPressureScore: number;
  districtPressureIds: MapDistrictId[];
  relatedArchiveEntryIds: string[];
  nextSuggestedWindow?: string;
  playerVisibleLine: string;
  duplicateKey: string;
};

export type VehicleMaintenanceWindowV1 = {
  id: string;
  groupId: VehicleFleetGroupId;
  day: number;
  status: VehicleMaintenanceWindowStatus;
  windowKind: VehicleMaintenanceWindowKind;
  priority: number;
  tradeoffLine: string;
  expectedEffect: string;
  districtId?: MapDistrictId;
  sourceKind: VehicleMaintenanceWindowSourceKind;
  duplicateKey: string;
  archiveEntryId?: string;
  createdAtDay: number;
  resolvedAtDay?: number;
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
  warnings?: string[];
};

export type VehicleMaintenanceStateV1 = {
  version: VehicleMaintenanceStateVersion;
  createdAtDay: number;
  updatedAtDay: number;
  fleetGroups: Record<VehicleFleetGroupId, VehicleFleetGroupStateV1>;
  maintenanceWindows: VehicleMaintenanceWindowV1[];
  fatigueSummary: VehicleMaintenanceFatigueSummary;
  routePressureSummary: VehicleMaintenanceRoutePressureSummary;
  assignmentImpactSummary: VehicleMaintenanceAssignmentImpactSummary;
  cityArchiveLinkSummary: VehicleMaintenanceCityArchiveLinkSummary;
  migrationMeta: VehicleMaintenanceMigrationMeta;
  sourceSignals: string[];
};

export type VehicleMaintenanceDayCloseInput = {
  day: number;
  operationSignals?: {
    vehicles?: { status?: string };
    containers?: { status?: string };
    personnel?: { status?: string };
    districts?: { status?: string };
    priorityDistrictId?: string;
  };
  operationalResources?: unknown;
  assignmentVehicleGroup?: string;
  assignmentCompatibilityScore?: number;
  assignmentApproach?: string;
  cityArchiveRecentKinds?: string[];
  storyChainKinds?: string[];
  contentPackDomains?: string[];
  routeBalanced?: boolean;
  resourceRecovery?: boolean;
  comebackCompleted?: boolean;
  resourcePressure?: boolean;
  vehicleRoutePressure?: boolean;
  districtId?: MapDistrictId;
  existingHubLines?: string[];
  existingReportLines?: string[];
};

export type VehicleMaintenanceStorySignal = {
  canStrengthenRouteChain: boolean;
  canStrengthenFatigueChain: boolean;
  shouldSoftenChain: boolean;
  reason: string;
};

export type VehicleMaintenanceSurfaceLines = {
  hubLine?: string;
  reportLine?: string;
  mapHint?: string;
  journalLabel?: string;
};
