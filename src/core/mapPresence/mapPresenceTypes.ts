import type { MapDistrictId } from '@/features/map/data/mapDistrictConstants';

export type MapPresenceDomain =
  | 'container'
  | 'vehicle_route'
  | 'personnel'
  | 'social'
  | 'crisis_adjacent'
  | 'district_balance'
  | 'generic_operation';

export type MapPresenceSurface = 'overview' | 'district_detail' | 'bottom_panel';

export type MapPresenceAnchorKind =
  | 'container'
  | 'vehicle_access'
  | 'team_station'
  | 'social_hotspot'
  | 'crisis_point'
  | 'district_center';

export type MapPresenceIntensity = 'low' | 'medium' | 'high';

export type MapPresenceMarkerStatus =
  | 'normal'
  | 'pressure'
  | 'critical'
  | 'in_progress'
  | 'resolved'
  | 'carry_over'
  | 'assigned'
  | 'en_route'
  | 'working'
  | 'tired'
  | 'maintenance_risk'
  | 'social_watch'
  | 'risk_watch';

export type DistrictMapPresenceAnchor = {
  id: string;
  districtId: MapDistrictId;
  kind: MapPresenceAnchorKind;
  label: string;
  x: number;
  y: number;
  priority: number;
};

export type MapContainerPresenceMarker = {
  id: string;
  districtId: MapDistrictId;
  anchorId: string;
  label: string;
  status: MapPresenceMarkerStatus;
  intensity: MapPresenceIntensity;
  linkedEventId?: string;
  pulse: boolean;
  visible: boolean;
  x: number;
  y: number;
};

export type MapVehiclePresenceMarker = {
  id: string;
  districtId: MapDistrictId;
  anchorId: string;
  vehicleGroupId?: string;
  label: string;
  status: MapPresenceMarkerStatus;
  intensity: MapPresenceIntensity;
  linkedEventId?: string;
  routeHintId?: string;
  visible: boolean;
  x: number;
  y: number;
};

export type MapTeamPresenceMarker = {
  id: string;
  districtId: MapDistrictId;
  anchorId: string;
  teamGroupId?: string;
  label: string;
  status: MapPresenceMarkerStatus;
  intensity: MapPresenceIntensity;
  linkedEventId?: string;
  visible: boolean;
  x: number;
  y: number;
};

export type MapRoutePresenceHint = {
  id: string;
  fromAnchorId?: string;
  toAnchorId: string;
  districtId: MapDistrictId;
  status: 'preview' | 'active' | 'delayed' | 'balanced' | 'overloaded';
  intensity: MapPresenceIntensity;
  linkedEventId?: string;
  visible: boolean;
  fromX?: number;
  fromY?: number;
  toX: number;
  toY: number;
};

export type MapPresenceViewModel = {
  day: number;
  visible: boolean;
  domain: MapPresenceDomain;
  selectedDistrictId?: MapDistrictId;
  containerMarkers: MapContainerPresenceMarker[];
  vehicleMarkers: MapVehiclePresenceMarker[];
  teamMarkers: MapTeamPresenceMarker[];
  routeHints: MapRoutePresenceHint[];
  panelLines: string[];
  debugReason?: string;
};

export type MapPresenceInput = {
  day: number;
  surface?: MapPresenceSurface;
  selectedDistrictId?: MapDistrictId;
  activeEvent?: {
    id?: string;
    title?: string;
    contentCategory?: string;
    neighborhoodId?: string;
    district?: string;
    resolved?: boolean;
    inProgress?: boolean;
  } | null;
  eventDomainFocus?: { focus?: string; domain?: string } | null;
  carryOverMemory?: { domain?: string; districtId?: string; resolved?: boolean } | null;
  reportTomorrowPreview?: { domain?: string; visible?: boolean } | null;
  operationSignals?: { dominantDomain?: string; pressureLevel?: string } | null;
  operationalResources?: {
    vehicleGroups?: Record<string, { status?: string; maintenanceRisk?: number; routePressure?: number }>;
    personnelGroups?: Record<string, { status?: string; fatigueScore?: number }>;
    districtNetworks?: Record<string, { status?: string; fillPressure?: number }>;
  } | null;
  assignmentState?: { activeDistrictId?: string } | null;
  crisisState?: { active?: boolean; phase?: string; accessMode?: string } | null;
  postPilotOperation?: { active?: boolean } | null;
  hasRealPostPilotData?: boolean;
  mapBeforeAfterSummary?: import('./mapBeforeAfterTypes').MapBeforeAfterSummary | null;
};

export const MAP_PRESENCE_DOMAINS: MapPresenceDomain[] = [
  'container',
  'vehicle_route',
  'personnel',
  'social',
  'crisis_adjacent',
  'district_balance',
  'generic_operation',
];
