import type { ActiveTaskRouteModel } from '@/core/activeTaskRoutes/activeTaskRouteTypes';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import type { DailyOperationsPlanState } from '@/core/dailyPlanning/dailyPlanningTypes';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { DistrictOperationCandidate } from '@/core/districtOperations/districtOperationTypes';
import type {
  DistrictTrustMemoryItem,
  DistrictTrustScoreResult,
} from '@/core/districtTrust/districtTrustTypes';
import type { EventFamilyDomain } from '@/core/eventFamilies/eventFamilyTypes';
import type { CreviaMapLayerId } from '@/core/mapLayers/mapLayerTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { TeamSpecializationFitResult } from '@/core/teamSpecialization/teamSpecializationTypes';

export type ContainerNetworkId = string;

export type ContainerNetworkHealthLevel =
  | 'fragile'
  | 'strained'
  | 'functional'
  | 'stable'
  | 'optimized'
  | 'showcase';

export type ContainerNetworkUpgradeStatus =
  | 'unavailable'
  | 'preview'
  | 'available'
  | 'recommended'
  | 'active'
  | 'completed'
  | 'cooldown'
  | 'future';

export type ContainerNetworkUpgradeKind =
  | 'capacity_rebalance'
  | 'visible_clean_point'
  | 'school_residential_order'
  | 'industrial_heavy_use_point'
  | 'transit_flow_support'
  | 'environmental_sensitivity_point'
  | 'recovery_cleanup_focus'
  | 'operation_era_upgrade'
  | 'future_smart_network';

export type ContainerNetworkPressureLevel =
  | 'low'
  | 'moderate'
  | 'elevated'
  | 'high'
  | 'critical';

export type ContainerNetworkImpactDomain =
  | 'container'
  | 'district_trust'
  | 'social'
  | 'vehicle_route'
  | 'personnel'
  | 'environmental_care'
  | 'resource_recovery'
  | 'city_development';

export type ContainerNetworkSignalSource =
  | 'operational_resource'
  | 'resource_fatigue'
  | 'district_trust'
  | 'district_memory'
  | 'district_operation'
  | 'event_family'
  | 'map_layer'
  | 'team_specialization'
  | 'daily_plan'
  | 'operation_signal'
  | 'social_pulse'
  | 'active_task_route'
  | 'fallback';

export type ContainerNetworkUpgradeAxis =
  | 'rank_permission'
  | 'district_trust'
  | 'resource_stability'
  | 'container_pressure'
  | 'district_operation'
  | 'event_family_signal'
  | 'map_layer'
  | 'team_specialization'
  | 'operation_era'
  | 'future_system';

export type ContainerNetworkDistrictProfile = {
  districtId: MapDistrictId;
  title: string;
  flavorLine: string;
  preferredUpgradeKinds: ContainerNetworkUpgradeKind[];
  sensitiveImpactDomains: ContainerNetworkImpactDomain[];
  pressureDomains: ContainerNetworkImpactDomain[];
  baseHealthOffset?: number;
  priority: number;
};

export type ContainerNetworkEventFamilySignal = {
  domain: EventFamilyDomain;
  strength?: 'low' | 'medium' | 'high';
};

export type ContainerNetworkContext = {
  day?: number;
  districtId?: MapDistrictId | string;
  currentRankKey?: string;
  authorityTrust?: number;
  unlockedPermissionIds?: string[];
  operationalResources?: unknown;
  resourceFatigue?: unknown;
  districtTrustResult?: DistrictTrustScoreResult | null;
  districtMemoryItems?: DistrictTrustMemoryItem[];
  districtOperationCandidate?: DistrictOperationCandidate | null;
  eventFamilySignals?: ContainerNetworkEventFamilySignal[];
  teamSpecializationResults?: TeamSpecializationFitResult[];
  activeTaskRoute?: ActiveTaskRouteModel | null;
  mapLayerStates?: unknown;
  dailyPlan?: DailyOperationsPlanState | null;
  operationSignals?: OperationSignalsState | null;
  socialPulse?: unknown;
  crisisState?: unknown;
  operationEra?: unknown;
  isPilotDay?: boolean;
  isDispatchPhase?: boolean;
  isFieldPhase?: boolean;
  isReportSurface?: boolean;
  assignment?: EventAssignmentState | null;
};

export type ContainerNetworkHealthResult = {
  districtId: MapDistrictId;
  score: number;
  healthLevel: ContainerNetworkHealthLevel;
  pressureLevel: ContainerNetworkPressureLevel;
  signalSources: ContainerNetworkSignalSource[];
  pressureDomains: ContainerNetworkImpactDomain[];
  reasonLines: string[];
  memoryLine?: string;
  confidence: 'low' | 'medium' | 'high';
  isVisibleToPlayer: boolean;
};

export type ContainerNetworkUpgradeCandidate = {
  id: ContainerNetworkId;
  districtId: MapDistrictId;
  kind: ContainerNetworkUpgradeKind;
  status: ContainerNetworkUpgradeStatus;
  healthResult: ContainerNetworkHealthResult;
  readinessScore: number;
  impactScore: number;
  pressureLevel: ContainerNetworkPressureLevel;
  impactDomains: ContainerNetworkImpactDomain[];
  upgradeAxes: ContainerNetworkUpgradeAxis[];
  title: string;
  summaryLine: string;
  tradeoffLine?: string;
  recommendationLine?: string;
  unlockLine?: string;
  suggestedTeamSpecializationId?: string;
  relatedDistrictOperationId?: string;
  relatedMapLayerIds: CreviaMapLayerId[];
  isVisibleToPlayer: boolean;
  isPreviewOnly: boolean;
};

export type ContainerNetworkPresentationModel = {
  id: ContainerNetworkId;
  title: string;
  subtitle: string;
  districtLabel: string;
  statusLabel: string;
  healthLabel: string;
  pressureLabel: string;
  tone: ContainerNetworkTone;
  compactLine: string;
  summaryLine: string;
  tradeoffLine?: string;
  recommendationLine?: string;
  memoryLine?: string;
  chips: ContainerNetworkChipModel[];
  ctaHint?: string;
  emptyStateLine?: string;
};

export type ContainerNetworkTone =
  | 'neutral'
  | 'positive'
  | 'watch'
  | 'strained'
  | 'recovering'
  | 'urgent';

export type ContainerNetworkChipModel = {
  id: string;
  label: string;
  tone: ContainerNetworkTone;
  iconKey?: string;
};

export type ContainerNetworkAuditResult = {
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  details?: string;
};
