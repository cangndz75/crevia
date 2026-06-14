export const MAP_GAMEPLAY_ROLES = [
  'overview',
  'risk_reader',
  'operation_tracker',
  'resource_board',
  'district_memory',
  'route_support',
  'result_trace',
  'authority_unlock_surface',
] as const;

export type MapGameplayRole = (typeof MAP_GAMEPLAY_ROLES)[number];

export const MAP_GAMEPLAY_VISIBILITY_LEVELS = [
  'hidden',
  'teaser',
  'summary',
  'detailed',
] as const;

export type MapGameplayVisibilityLevel =
  (typeof MAP_GAMEPLAY_VISIBILITY_LEVELS)[number];

export const MAP_GAMEPLAY_DAY_RANGES = [
  'day_1',
  'day_2_7',
  'day_8_plus',
  'day_10_plus',
] as const;

export type MapGameplayDayRange = (typeof MAP_GAMEPLAY_DAY_RANGES)[number];

export const MAP_GAMEPLAY_IMPLEMENTATION_RISKS = [
  'low',
  'medium',
  'high',
] as const;

export type MapGameplayImplementationRisk =
  (typeof MAP_GAMEPLAY_IMPLEMENTATION_RISKS)[number];

export const MAP_GAMEPLAY_SOURCE_KINDS = [
  'active_event',
  'assignment',
  'active_task_route',
  'district_trust',
  'district_memory',
  'social_pulse',
  'operation_signal',
  'resource_pressure',
  'personnel_presence',
  'vehicle_presence',
  'container_presence',
  'vehicle_maintenance',
  'team_specialization',
  'tomorrow_risk',
  'decision_consequence',
  'map_layer_permission',
  'authority_permission',
  'city_archive',
  'map_reaction',
  'before_after',
  'fallback',
] as const;

export type MapGameplaySourceKind =
  (typeof MAP_GAMEPLAY_SOURCE_KINDS)[number];

export const MAP_GAMEPLAY_SUPPORTED_DECISIONS = [
  'open_active_operation',
  'choose_operation_priority',
  'choose_strategy_style',
  'choose_dispatch_resource',
  'monitor_route_pressure',
  'monitor_district_trust',
  'monitor_resource_pressure',
  'return_to_district',
  'inspect_result_trace',
  'understand_unlocked_layer',
  'none',
] as const;

export type MapGameplaySupportedDecision =
  (typeof MAP_GAMEPLAY_SUPPORTED_DECISIONS)[number];

export type MapGameplayBindingConfidence = 'low' | 'medium' | 'high';

export type MapGameplayBinding = {
  id: string;
  role: MapGameplayRole;
  title: string;
  playerQuestion: string;
  supportedDecision: MapGameplaySupportedDecision;
  supportedDecisionLine: string;
  sourceKinds: MapGameplaySourceKind[];
  sourceIds: string[];
  requiredPermissionId?: string;
  requiredRankId?: string;
  visibilityLevel: MapGameplayVisibilityLevel;
  dayRange: MapGameplayDayRange;
  implementationRisk: MapGameplayImplementationRisk;
  confidence: MapGameplayBindingConfidence;
  priority: number;
  isActionable: boolean;
  guardReason?: string;
};

export type MapGameplayBindingInput = {
  day: number;
  authorityRankId?: string;
  unlockedPermissionIds?: string[];
  activeEventIds?: string[];
  activeOperationContext?: unknown;
  mapLayerStatuses?: unknown;
  districtTrustSignals?: unknown;
  districtMemorySignals?: unknown;
  socialSignals?: unknown;
  operationSignals?: unknown;
  resourceSignals?: unknown;
  personnelPresence?: unknown;
  vehiclePresence?: unknown;
  containerPresence?: unknown;
  activeTaskRouteSignals?: unknown;
  tomorrowRiskSignals?: unknown;
  decisionConsequenceSignals?: unknown;
  cityArchiveSignals?: unknown;
};

export type MapGameplayBindingCardModel = {
  id: string;
  title: string;
  question: string;
  decisionLine: string;
  badgeLabel: string;
  tone: 'neutral' | 'positive' | 'warning' | 'locked';
  visibilityLevel: MapGameplayVisibilityLevel;
  isActionable: boolean;
  priority: number;
  accessibilityLabel: string;
};
