import type { ActiveTaskRouteModel } from '@/core/activeTaskRoutes/activeTaskRouteTypes';
import type { ContainerNetworkUpgradeCandidate } from '@/core/containerNetwork/containerNetworkTypes';
import type { DistrictOperationCandidate } from '@/core/districtOperations/districtOperationTypes';
import type { DistrictTrustScoreResult } from '@/core/districtTrust/districtTrustTypes';
import type { EventFamilyDomain } from '@/core/eventFamilies/eventFamilyTypes';
import type { CreviaMapLayerId } from '@/core/mapLayers/mapLayerTypes';
import type { OperationCareerPhase } from '@/core/openEndedProgression/openEndedProgressionTypes';
import type { TeamSpecializationFitResult } from '@/core/teamSpecialization/teamSpecializationTypes';
import type { VehicleMaintenanceWindowModel } from '@/core/vehicleMaintenance/vehicleMaintenanceTypes';

export type OperationEraId = string;

export type OperationEraStatus =
  | 'unavailable'
  | 'preview'
  | 'available'
  | 'recommended'
  | 'active'
  | 'cooling_down'
  | 'completed_review'
  | 'future';

export type OperationEraCadence =
  | 'milestone_based'
  | 'weekly_theme'
  | 'biweekly_theme'
  | 'monthly_theme'
  | 'rank_unlock'
  | 'content_pack'
  | 'future_live_ops';

export type OperationEraFocusDomain =
  | 'core_operations'
  | 'vehicle_route'
  | 'container_network'
  | 'personnel_team'
  | 'district_trust'
  | 'crisis_recovery'
  | 'social_pulse'
  | 'city_development'
  | 'content_expansion'
  | 'operation_efficiency';

export type OperationEraUnlockAxis =
  | 'rank_permission'
  | 'authority'
  | 'xp'
  | 'district_trust'
  | 'resource_stability'
  | 'crisis_control'
  | 'content_pack'
  | 'map_layer'
  | 'future_system';

export type OperationEraContentHook =
  | 'event_family'
  | 'district_operation'
  | 'map_layer'
  | 'active_task_route'
  | 'team_specialization'
  | 'vehicle_maintenance'
  | 'container_network'
  | 'district_trust'
  | 'advisor_note'
  | 'social_pulse'
  | 'report_review'
  | 'city_development';

export type OperationEraTone =
  | 'neutral'
  | 'positive'
  | 'strategic'
  | 'watch'
  | 'recovering'
  | 'crisis_watch'
  | 'growth';

export type OperationEraDefinition = {
  id: OperationEraId;
  title: string;
  shortLabel: string;
  description: string;
  flavorLine: string;
  cadence: OperationEraCadence;
  focusDomains: OperationEraFocusDomain[];
  unlockAxes: OperationEraUnlockAxis[];
  contentHooks: OperationEraContentHook[];
  requiredPermissionId?: string;
  requiredRankKey?: string;
  minAuthority?: number;
  minXp?: number;
  minDay?: number;
  recommendedDistrictTrustLevels?: string[];
  relatedEventFamilyDomains: EventFamilyDomain[];
  relatedDistrictOperationKinds: string[];
  relatedMapLayerIds: CreviaMapLayerId[];
  relatedTeamSpecializationIds: string[];
  relatedVehicleMaintenanceKinds: string[];
  relatedContainerUpgradeKinds: string[];
  isFutureOnly: boolean;
  playerFacingPriority: number;
  tone: OperationEraTone;
  iconKey?: string;
};

export type OperationEraEventFamilySignal = {
  domain: EventFamilyDomain;
  strength?: 'low' | 'medium' | 'high';
};

export type OperationEraContext = {
  day?: number;
  currentRankKey?: string;
  authorityTrust?: number;
  xp?: number;
  unlockedPermissionIds?: string[];
  openEndedPhase?: OperationCareerPhase;
  districtTrustResults?: DistrictTrustScoreResult[];
  districtOperationCandidates?: DistrictOperationCandidate[];
  eventFamilySignals?: OperationEraEventFamilySignal[];
  mapLayerStates?: unknown;
  activeTaskRoute?: ActiveTaskRouteModel | null;
  teamSpecializationResults?: TeamSpecializationFitResult[];
  vehicleMaintenanceWindow?: VehicleMaintenanceWindowModel | null;
  containerNetworkCandidates?: ContainerNetworkUpgradeCandidate[];
  crisisState?: unknown;
  operationSignals?: unknown;
  socialPulse?: unknown;
  reportSummary?: unknown;
  contentPackAvailability?: unknown;
  isPilotDay?: boolean;
  isLimitedMode?: boolean;
  isFullMode?: boolean;
};

export type OperationEraCandidate = {
  definition: OperationEraDefinition;
  status: OperationEraStatus;
  readinessScore: number;
  relevanceScore: number;
  tone: OperationEraTone;
  focusDomains: OperationEraFocusDomain[];
  contentHooks: OperationEraContentHook[];
  eligibilityReasons: string[];
  summaryLine: string;
  unlockLine?: string;
  recommendationLine?: string;
  reviewLine?: string;
  isVisibleToPlayer: boolean;
  isPreviewOnly: boolean;
};

export type OperationEraPresentationModel = {
  id: OperationEraId;
  title: string;
  subtitle: string;
  statusLabel: string;
  cadenceLabel: string;
  tone: OperationEraTone;
  compactLine: string;
  summaryLine: string;
  focusChips: OperationEraChipModel[];
  hookChips: OperationEraChipModel[];
  unlockLine?: string;
  recommendationLine?: string;
  reviewLine?: string;
  ctaHint?: string;
  emptyStateLine?: string;
};

export type OperationEraChipModel = {
  id: string;
  label: string;
  tone: OperationEraTone;
  iconKey?: string;
};

export type OperationEraContentWeightHints = {
  preferredEventFamilyDomains: EventFamilyDomain[];
  preferredDistrictOperationKinds: string[];
  preferredMapLayerIds: CreviaMapLayerId[];
  preferredResourceSystems: string[];
};

export type OperationEraAuditResult = {
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  details?: string;
};

export type OperationEraNonTerminalGuardResult = {
  ok: boolean;
  message: string;
};
