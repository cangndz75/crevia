import type { AssignmentsState } from '@/core/assignments/assignmentTypes';
import type { CrisisActionState } from '@/core/crisisActions/crisisActionTypes';
import type { DailyOperationsPlanState } from '@/core/dailyPlanning/dailyPlanningTypes';
import type { GameState } from '@/core/models/GameState';
import type { MicroDecisionState } from '@/core/microDecisions/microDecisionTypes';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';

export type OperationalResourceStatus =
  | 'stable'
  | 'busy'
  | 'strained'
  | 'critical';

export type OperationalResourceTrend = 'improving' | 'steady' | 'worsening';

export type PersonnelGroupId =
  | 'field_team'
  | 'technical_team'
  | 'public_relations_team';

export type VehicleGroupId =
  | 'standard_truck'
  | 'maintenance_vehicle'
  | 'route_support_vehicle';

export type ContainerNetworkMetric =
  | 'fill_pressure'
  | 'cleanliness_pressure'
  | 'maintenance_pressure'
  | 'social_pressure';

export type OperationalResourceDomain = 'personnel' | 'vehicles' | 'containers';

export type PersonnelGroupState = {
  id: PersonnelGroupId;
  label: string;
  status: OperationalResourceStatus;
  workloadScore: number;
  fatigueScore: number;
  moraleScore: number;
  specialtyTags: string[];
  usedToday: boolean;
  lastAssignedDay?: number;
  trend: OperationalResourceTrend;
  summary: string;
};

export type VehicleGroupState = {
  id: VehicleGroupId;
  label: string;
  status: OperationalResourceStatus;
  capacityPressure: number;
  maintenanceRisk: number;
  routePressure: number;
  specialtyTags: string[];
  usedToday: boolean;
  lastUsedDay?: number;
  trend: OperationalResourceTrend;
  summary: string;
};

export type DistrictContainerNetworkState = {
  districtId: string;
  status: OperationalResourceStatus;
  fillPressure: number;
  cleanlinessPressure: number;
  maintenancePressure: number;
  socialPressure: number;
  trend: OperationalResourceTrend;
  summary: string;
  sourceTags: string[];
};

export type OperationalResourcesDailySummary = {
  day: number;
  personnelLine: string;
  vehicleLine: string;
  containerLine: string;
  warnings: string[];
};

export type OperationalResourcesState = {
  personnelGroups: Record<PersonnelGroupId, PersonnelGroupState>;
  vehicleGroups: Record<VehicleGroupId, VehicleGroupState>;
  containerNetworksByDistrictId: Record<string, DistrictContainerNetworkState>;
  dailySummary?: OperationalResourcesDailySummary;
  lastProcessedDay?: number;
  lastRefreshedDay?: number;
};

export type OperationalResourceEffect = {
  domain: OperationalResourceDomain;
  targetId: string;
  delta: number;
  metric?: ContainerNetworkMetric | 'workload' | 'fatigue' | 'morale' | 'capacity' | 'maintenance' | 'route';
  reason: string;
  sourceTags: string[];
};

export type OperationalResourceEngineInput = {
  gameState: GameState;
  monetization?: MonetizationState;
  operationSignals: OperationSignalsState;
  dailyOperationsPlan: DailyOperationsPlanState;
  assignments: AssignmentsState;
  microDecisionState: MicroDecisionState;
  crisisActionState: CrisisActionState;
  operationalResources: OperationalResourcesState;
};

export type OperationalResourcePresentationTone =
  | 'positive'
  | 'neutral'
  | 'warning'
  | 'critical';

export type OperationalResourceDetailTabId =
  | 'personnel'
  | 'vehicles'
  | 'containers';

export type OperationalPersonnelDetailRow = {
  id: PersonnelGroupId;
  label: string;
  statusLabel: string;
  tone: OperationalResourcePresentationTone;
  workloadLabel: string;
  fatigueLabel: string;
  moraleLabel: string;
  summary: string;
  usageLine: string;
  recommendationLine: string;
  iconKey: string;
};

export type OperationalVehicleDetailRow = {
  id: VehicleGroupId;
  label: string;
  statusLabel: string;
  tone: OperationalResourcePresentationTone;
  capacityLabel: string;
  maintenanceLabel: string;
  routeLabel: string;
  summary: string;
  usageLine: string;
  recommendationLine: string;
  iconKey: string;
};

export type OperationalContainerNetworkDetailRow = {
  districtId: string;
  label: string;
  statusLabel: string;
  tone: OperationalResourcePresentationTone;
  fillLabel: string;
  cleanlinessLabel: string;
  maintenanceLabel: string;
  socialLabel: string;
  summary: string;
  recommendationLine: string;
  iconKey: string;
};

export type OperationalResourceDetailSheetModel = {
  title: string;
  subtitle: string;
  defaultTabId: OperationalResourceDetailTabId;
  tabs: Array<{
    id: OperationalResourceDetailTabId;
    label: string;
    summary: string;
    tone: OperationalResourcePresentationTone;
  }>;
  personnelRows: OperationalPersonnelDetailRow[];
  vehicleRows: OperationalVehicleDetailRow[];
  containerRows: OperationalContainerNetworkDetailRow[];
  footerNote: string;
};
