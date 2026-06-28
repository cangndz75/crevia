import type { ActiveOperationMapPhase } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';

export type MapDirectActionKind =
  | 'open_operation'
  | 'inspect_signal'
  | 'continue_operation'
  | 'view_readiness'
  | 'view_maintenance'
  | 'view_district'
  | 'view_report_context'
  | 'focus_map_layer';

export type MapDirectActionSurface =
  | 'marker'
  | 'district_label'
  | 'active_operation_card'
  | 'map_bottom_sheet'
  | 'hero_panel';

export type MapDirectActionTone =
  | 'positive'
  | 'mixed'
  | 'warning'
  | 'critical'
  | 'neutral'
  | 'active';

export type MapDirectActionSourceType =
  | 'operation'
  | 'district'
  | 'maintenance'
  | 'readiness'
  | 'social'
  | 'periodGoal'
  | 'report';

export type MapDirectActionTargetPhase =
  | 'inspect'
  | 'plan'
  | 'dispatch'
  | 'field'
  | 'result'
  | 'report'
  | 'hub';

export type MapDirectActionPresentation = {
  id: string;
  kind: MapDirectActionKind;
  label: string;
  description: string;
  tone: MapDirectActionTone;
  enabled: boolean;
  disabledReason?: string;
  sourceType: MapDirectActionSourceType;
  sourceId?: string;
  targetRouteKey?: string;
  targetPhase?: MapDirectActionTargetPhase;
  priority: number;
  dedupeKey: string;
};

export type MapActionBundleChip = {
  label: string;
  value?: string;
  tone: MapDirectActionTone;
};

export type MapActionBundlePresentation = {
  title: string;
  subtitle: string;
  primaryAction?: MapDirectActionPresentation;
  secondaryActions: MapDirectActionPresentation[];
  chips: MapActionBundleChip[];
};

export type MapDirectActionMarkerContext = {
  markerId: string;
  markerType:
    | 'active_event'
    | 'urgent_signal'
    | 'resolved'
    | 'opportunity'
    | 'resource'
    | 'district'
    | 'operation';
  markerStatus?: 'active' | 'pending' | 'resolved' | 'locked';
  eventId?: string;
  eventDetailRoute?: string;
  districtId?: string;
  districtName?: string;
};

export type MapDirectActionOperationContext = {
  eventId?: string;
  eventDetailRoute?: string;
  phase?: ActiveOperationMapPhase;
  districtId?: string;
  districtName?: string;
  hasReadinessContext?: boolean;
  resultRouteAvailable?: boolean;
};

export type MapDirectActionMaintenanceContext = {
  activeItemCount: number;
  districtLinkedItemCount: number;
  topItemLabel?: string;
  readinessRouteAvailable: boolean;
  readinessRoute?: string;
};

export type MapDirectActionPeriodGoalContext = {
  shortTitle?: string;
  currentSignal?: string;
};

export type MapDirectActionDistrictContext = {
  districtId?: string;
  districtName?: string;
  personalitySignalLine?: string;
  canOpenDistrictDetail?: boolean;
};

export type BuildMapActionBundleInput = {
  surface: MapDirectActionSurface;
  marker?: MapDirectActionMarkerContext;
  operation?: MapDirectActionOperationContext;
  maintenance?: MapDirectActionMaintenanceContext;
  district?: MapDirectActionDistrictContext;
  periodGoal?: MapDirectActionPeriodGoalContext;
  layerToggleAvailable?: boolean;
  reportRouteAvailable?: boolean;
  excludeDedupeKeys?: string[];
  maxSecondary?: number;
};
