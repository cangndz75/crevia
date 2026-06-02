import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { CreviaMapLayerContext } from '@/core/mapLayers/mapLayerTypes';

export type ActiveTaskRouteId = string;

export type ActiveTaskRouteStage =
  | 'planned'
  | 'assigned'
  | 'dispatch_ready'
  | 'en_route'
  | 'on_site'
  | 'resolving'
  | 'completed'
  | 'delayed'
  | 'blocked'
  | 'monitoring';

export type ActiveTaskRouteStatus =
  | 'inactive'
  | 'ready'
  | 'active'
  | 'delayed'
  | 'strained'
  | 'blocked'
  | 'completed'
  | 'preview';

export type ActiveTaskRoutePressure = 'low' | 'medium' | 'high' | 'critical';

export type ActiveTaskRouteTone =
  | 'neutral'
  | 'positive'
  | 'watch'
  | 'strained'
  | 'crisis'
  | 'recovering';

export type ActiveTaskRouteNodeType =
  | 'operation_center'
  | 'district'
  | 'resource_group'
  | 'event_location'
  | 'field_team'
  | 'vehicle_group'
  | 'checkpoint';

export type ActiveTaskRouteSource =
  | 'active_event'
  | 'assignment'
  | 'map_layer'
  | 'operational_resource'
  | 'district_trust'
  | 'operation_signal'
  | 'crisis_state'
  | 'fallback';

export type ActiveTaskRouteDomain =
  | 'container'
  | 'vehicle_route'
  | 'personnel'
  | 'social'
  | 'crisis'
  | 'district_balance'
  | 'generic';

export type ActiveTaskRouteNode = {
  id: string;
  type: ActiveTaskRouteNodeType;
  districtId?: string;
  title: string;
  shortLabel: string;
  description?: string;
  iconKey?: string;
  tone?: ActiveTaskRouteTone;
};

export type ActiveTaskRouteSegment = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  status: ActiveTaskRouteStatus;
  pressure: ActiveTaskRoutePressure;
  label: string;
  helperText?: string;
  tone?: ActiveTaskRouteTone;
};

export type ActiveTaskRouteContext = {
  day?: number;
  activeEvent?: EventCard | null;
  selectedEvent?: EventCard | null;
  assignment?: EventAssignmentState | null;
  operationalResources?: unknown;
  districtTrustResults?: unknown;
  operationSignals?: OperationSignalsState | null;
  crisisState?: unknown;
  mapLayerContext?: CreviaMapLayerContext | null;
  currentRankKey?: string;
  authorityTrust?: number;
  hasActiveTaskRouteLayer?: boolean;
  isDispatchPhase?: boolean;
  isFieldPhase?: boolean;
  isMapSurface?: boolean;
  isResultPhase?: boolean;
};

export type ActiveTaskRouteModel = {
  id: ActiveTaskRouteId;
  status: ActiveTaskRouteStatus;
  stage: ActiveTaskRouteStage;
  pressure: ActiveTaskRoutePressure;
  tone: ActiveTaskRouteTone;
  domain: ActiveTaskRouteDomain;
  sourceDistrictId?: string;
  targetDistrictId?: string;
  nodes: ActiveTaskRouteNode[];
  segments: ActiveTaskRouteSegment[];
  sourceSignals: ActiveTaskRouteSource[];
  title: string;
  summaryLine: string;
  routeNote: string;
  etaLabel?: string;
  riskLine?: string;
  isVisibleToPlayer: boolean;
  isPreviewOnly: boolean;
};

export type ActiveTaskRoutePresentationModel = {
  id: ActiveTaskRouteId;
  title: string;
  subtitle: string;
  statusLabel: string;
  stageLabel: string;
  pressureLabel: string;
  tone: ActiveTaskRouteTone;
  compactLine: string;
  routeNote: string;
  nodeLabels: string[];
  segmentLabels: string[];
  chips: ActiveTaskRouteChipModel[];
  ctaHint?: string;
  emptyStateLine?: string;
};

export type ActiveTaskRouteChipModel = {
  id: string;
  label: string;
  tone: ActiveTaskRouteTone;
  iconKey?: string;
};

export type ActiveTaskRouteAuditResult = {
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  details?: string;
};
