import type { ContentRuntimeActivationEventMeta } from '@/core/contentRuntimeActivation/contentRuntimeActivationTypes';
import type { CityEchoBinding } from '@/core/cityEchoBinding/cityEchoBindingTypes';
import type { DecisionImpactExplanation } from '@/core/decisionImpactExplanation/decisionImpactExplanationTypes';
import type { OperationalResourcesState } from '@/core/operationalResources/operationalResourceTypes';
import type { PostPilotPhase } from '@/core/postPilot/postPilotOperationTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

export type OperationalResourcePresenceLiteVisibility =
  | 'hidden'
  | 'compact'
  | 'standard'
  | 'detailed_preview';

export type TeamGroupKind =
  | 'cleanup_team'
  | 'route_team'
  | 'container_team'
  | 'support_team'
  | 'rapid_response_team'
  | 'coordination_team';

export type TeamGroupStatus =
  | 'ready'
  | 'assigned'
  | 'busy'
  | 'fatigued'
  | 'recovering'
  | 'watch';

export type VehicleGroupKind =
  | 'light_service_vehicle'
  | 'route_support_vehicle'
  | 'container_vehicle'
  | 'field_support_vehicle'
  | 'maintenance_watch_vehicle';

export type VehicleGroupStatus =
  | 'ready'
  | 'assigned'
  | 'route_pressure'
  | 'fatigue_watch'
  | 'maintenance_watch'
  | 'limited';

export type PresenceBand = 'low' | 'medium' | 'high';

export type MaintenanceBand = 'ok' | 'watch' | 'risk';

export type OperationalResourcePresenceLitePriority = 'low' | 'medium' | 'high';

export type TeamGroupPresence = {
  id: string;
  label: string;
  kind: TeamGroupKind;
  status: TeamGroupStatus;
  workloadBand: PresenceBand;
  fatigueBand: PresenceBand;
  moraleBand?: PresenceBand;
  districtFocus?: string;
  line: string;
  detailLine?: string;
  iconKey: string;
  priority: OperationalResourcePresenceLitePriority;
};

export type VehicleGroupPresence = {
  id: string;
  label: string;
  kind: VehicleGroupKind;
  status: VehicleGroupStatus;
  capacityBand: PresenceBand;
  fatigueBand: PresenceBand;
  maintenanceBand: MaintenanceBand;
  districtFocus?: string;
  line: string;
  detailLine?: string;
  iconKey: string;
  priority: OperationalResourcePresenceLitePriority;
};

export type OperationalResourcePresenceLiteSourceSignals = {
  hasOperationSignals: boolean;
  hasResourceFatigue: boolean;
  hasContentPack: boolean;
  hasDecisionImpact: boolean;
  hasTomorrowRisk: boolean;
  hasCityEcho: boolean;
  hasVehicleRoutePack: boolean;
  hasContainerPack: boolean;
  hasDistrictPack: boolean;
  personnelPressure: boolean;
  vehiclePressure: boolean;
  containerPressure: boolean;
};

export type OperationalResourcePresenceLiteModel = {
  day: number;
  visibility: OperationalResourcePresenceLiteVisibility;
  teamGroups: TeamGroupPresence[];
  vehicleGroups: VehicleGroupPresence[];
  primaryPressureLine: string;
  mapPresenceLine?: string;
  reportLine?: string;
  hubLine?: string;
  eceLine?: string;
  sourceSignals: OperationalResourcePresenceLiteSourceSignals;
  maxVisibleGroups: number;
  duplicateKey: string;
};

export type OperationalResourcePresenceLiteInput = {
  day?: number;
  isPostPilot?: boolean;
  isPilotCompleted?: boolean;
  postPilotPhase?: PostPilotPhase | null;
  accessMode?: 'none' | 'limited' | 'full';
  focusDistrictId?: MapDistrictId | string | null;
  operationalResources?: OperationalResourcesState | null;
  operationSignals?: {
    dailyFocus?: string;
    priorityDistrictId?: string;
    containers?: { status?: string; summary?: string; score?: number };
    vehicles?: { status?: string; summary?: string; score?: number };
    personnel?: { status?: string; summary?: string; score?: number };
    districts?: { status?: string; summary?: string; score?: number };
    overall?: { status?: string; summary?: string; score?: number };
  } | null;
  resourceFatigue?: unknown;
  contentPackMeta?: ContentRuntimeActivationEventMeta | null;
  decisionImpact?: DecisionImpactExplanation | null;
  tomorrowRisk?: TomorrowRiskModel | null;
  cityEcho?: CityEchoBinding | null;
  existingLines?: string[];
  mainOperationScopeHintLine?: string | null;
  operationSignalsSummaryLine?: string | null;
  resourceFatigueSummaryLine?: string | null;
  districtReportCardLine?: string | null;
  cityJournalLine?: string | null;
  mapResourceOverlayLine?: string | null;
};

export type OperationalResourcePresenceDetailCard = {
  id: string;
  label: string;
  statusLabel: string;
  lines: string[];
  iconKey: string;
  tone: 'positive' | 'neutral' | 'warning' | 'critical';
};

export type OperationalResourcePresenceHubPresentation = {
  summaryLine: string;
  secondaryLine?: string;
  defaultTab: 'personnel' | 'vehicles' | 'containers';
};
