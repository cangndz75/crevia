import type { ActiveTaskRouteModel } from '@/core/activeTaskRoutes/activeTaskRouteTypes';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import type { DailyOperationsPlanState } from '@/core/dailyPlanning/dailyPlanningTypes';
import type { DistrictOperationCandidate } from '@/core/districtOperations/districtOperationTypes';
import type { EventFamilyDomain } from '@/core/eventFamilies/eventFamilyTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { TeamSpecializationFitResult } from '@/core/teamSpecialization/teamSpecializationTypes';

export type VehicleMaintenanceWindowId = string;

export type VehicleMaintenanceWindowStatus =
  | 'unavailable'
  | 'preview'
  | 'open'
  | 'recommended'
  | 'urgent'
  | 'deferred'
  | 'completed'
  | 'cooldown'
  | 'future';

export type VehicleMaintenanceRiskLevel =
  | 'low'
  | 'moderate'
  | 'elevated'
  | 'high'
  | 'critical';

export type VehicleMaintenanceWindowKind =
  | 'preventive_check'
  | 'route_load_rebalance'
  | 'fatigue_recovery'
  | 'technical_inspection'
  | 'emergency_stabilization'
  | 'capacity_planning'
  | 'operation_era_maintenance'
  | 'future_upgrade';

export type VehicleMaintenanceTradeoffType =
  | 'protect_tomorrow'
  | 'push_today'
  | 'rebalance_route'
  | 'assign_technical_team'
  | 'monitor_only'
  | 'crisis_prevention';

export type VehicleMaintenanceSignalSource =
  | 'operational_resource'
  | 'resource_fatigue'
  | 'assignment'
  | 'active_task_route'
  | 'team_specialization'
  | 'district_operation'
  | 'event_family'
  | 'daily_plan'
  | 'crisis_state'
  | 'operation_signal'
  | 'fallback';

export type VehicleMaintenancePressureDomain =
  | 'vehicle_route'
  | 'resource_fatigue'
  | 'personnel'
  | 'container'
  | 'crisis'
  | 'district_balance'
  | 'generic';

export type VehicleMaintenanceEventFamilySignal = {
  domain: EventFamilyDomain;
  strength?: 'low' | 'medium' | 'high';
};

export type VehicleMaintenanceContext = {
  day?: number;
  operationalResources?: unknown;
  resourceFatigue?: unknown;
  assignment?: EventAssignmentState | null;
  activeTaskRoute?: ActiveTaskRouteModel | null;
  teamSpecializationResults?: TeamSpecializationFitResult[];
  districtOperationCandidate?: DistrictOperationCandidate | null;
  eventFamilySignals?: VehicleMaintenanceEventFamilySignal[];
  dailyPlan?: DailyOperationsPlanState | null;
  operationSignals?: OperationSignalsState | null;
  crisisState?: unknown;
  currentRankKey?: string;
  authorityTrust?: number;
  unlockedPermissionIds?: string[];
  isDispatchPhase?: boolean;
  isFieldPhase?: boolean;
  isReportSurface?: boolean;
  isPilotDay?: boolean;
};

export type VehicleMaintenanceWindowModel = {
  id: VehicleMaintenanceWindowId;
  status: VehicleMaintenanceWindowStatus;
  kind: VehicleMaintenanceWindowKind;
  riskLevel: VehicleMaintenanceRiskLevel;
  tradeoffTypes: VehicleMaintenanceTradeoffType[];
  pressureDomains: VehicleMaintenancePressureDomain[];
  signalSources: VehicleMaintenanceSignalSource[];
  readinessScore: number;
  urgencyScore: number;
  title: string;
  summaryLine: string;
  riskLine: string;
  tradeoffLine: string;
  recommendationLine?: string;
  suggestedTeamSpecializationId?: string;
  targetDistrictId?: string;
  isVisibleToPlayer: boolean;
  isPreviewOnly: boolean;
};

export type VehicleMaintenancePresentationModel = {
  id: VehicleMaintenanceWindowId;
  title: string;
  subtitle: string;
  statusLabel: string;
  kindLabel: string;
  riskLabel: string;
  tone: VehicleMaintenanceTone;
  compactLine: string;
  riskLine: string;
  tradeoffLine: string;
  recommendationLine?: string;
  chips: VehicleMaintenanceChipModel[];
  ctaHint?: string;
  emptyStateLine?: string;
};

export type VehicleMaintenanceTone =
  | 'neutral'
  | 'positive'
  | 'watch'
  | 'strained'
  | 'recovering'
  | 'urgent';

export type VehicleMaintenanceChipModel = {
  id: string;
  label: string;
  tone: VehicleMaintenanceTone;
  iconKey?: string;
};

export type VehicleMaintenanceAuditResult = {
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  details?: string;
};
