import type { ActiveOperationMapPhase } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import type { DistrictCriterionId } from '@/core/districtPersonality/districtPersonalityTypes';

export type MapSignalCopyContext =
  | 'active_operation'
  | 'district_personality'
  | 'route_support'
  | 'resource_pressure'
  | 'social_sensitivity'
  | 'trust_fragility'
  | 'container_network'
  | 'vehicle_maintenance'
  | 'team_fatigue'
  | 'district_memory'
  | 'result_trace'
  | 'tomorrow_risk'
  | 'authority_layer'
  | 'fallback';

export type MapSignalCopyLineKind =
  | 'map_line'
  | 'decision_line'
  | 'district_line'
  | 'pressure_line'
  | 'route_line'
  | 'next_action_line'
  | 'locked_teaser'
  | 'accessibility_label';

export type MapSignalCopyTone = 'neutral' | 'positive' | 'warning' | 'locked';

export type MapSignalCopyDayPolicy =
  | 'day_1'
  | 'day_2_7'
  | 'day_8_plus'
  | 'day_10_plus'
  | 'any';

export type MapSignalCopySourceGuard =
  | 'requires_active_event'
  | 'requires_route_source'
  | 'requires_district_source'
  | 'requires_live_pressure'
  | 'requires_memory_source'
  | 'requires_result_source'
  | 'requires_authority_permission'
  | 'requires_vehicle_source'
  | 'requires_container_source'
  | 'requires_team_source'
  | 'safe_baseline'
  | 'fallback_only';

export type MapSignalCopyTemplate = {
  id: string;
  context: MapSignalCopyContext;
  kind: MapSignalCopyLineKind;
  tone: MapSignalCopyTone;
  dayPolicy: MapSignalCopyDayPolicy;
  sourceGuards: MapSignalCopySourceGuard[];
  text: string;
  maxLength: number;
  priority: number;
  tags: string[];
  operationPhase?: ActiveOperationMapPhase;
  districtCriterionId?: DistrictCriterionId;
};

export type MapSignalCopyConfidence = 'low' | 'medium' | 'high';

export type MapSignalCopyResult = {
  id: string;
  text: string;
  context: MapSignalCopyContext;
  kind: MapSignalCopyLineKind;
  tone: MapSignalCopyTone;
  sourceTemplateId: string;
  sourceIds: string[];
  confidence: MapSignalCopyConfidence;
  isFallback: boolean;
};

export type MapSignalCopyInput = {
  context: MapSignalCopyContext;
  kind: MapSignalCopyLineKind;
  day: number;
  tone?: MapSignalCopyTone;
  sourceIds?: string[];
  sourceKinds?: string[];
  districtCriterionId?: DistrictCriterionId;
  districtArchetypeId?: string;
  operationPhase?: ActiveOperationMapPhase;
  pressureKind?: string;
  visibilityLevel?: 'hidden' | 'teaser' | 'summary' | 'detailed';
  permissionAvailable?: boolean;
  recentTemplateIds?: string[];
  maxLength?: number;
};

export type MapSignalAccessibilityLabelInput = {
  phaseLabel?: string;
  mapLine?: string;
  decisionLine?: string;
  supportLine?: string;
  ctaLabel?: string;
  ctaDisabled?: boolean;
};

export const MAP_SIGNAL_COPY_CONTEXTS: MapSignalCopyContext[] = [
  'active_operation',
  'district_personality',
  'route_support',
  'resource_pressure',
  'social_sensitivity',
  'trust_fragility',
  'container_network',
  'vehicle_maintenance',
  'team_fatigue',
  'district_memory',
  'result_trace',
  'tomorrow_risk',
  'authority_layer',
  'fallback',
];

export const MAP_SIGNAL_COPY_LINE_KINDS: MapSignalCopyLineKind[] = [
  'map_line',
  'decision_line',
  'district_line',
  'pressure_line',
  'route_line',
  'next_action_line',
  'locked_teaser',
  'accessibility_label',
];

export const MAP_SIGNAL_COPY_TONES: MapSignalCopyTone[] = [
  'neutral',
  'positive',
  'warning',
  'locked',
];

export const MAP_SIGNAL_COPY_DAY_POLICIES: MapSignalCopyDayPolicy[] = [
  'day_1',
  'day_2_7',
  'day_8_plus',
  'day_10_plus',
  'any',
];

export const MAP_SIGNAL_COPY_SOURCE_GUARDS: MapSignalCopySourceGuard[] = [
  'requires_active_event',
  'requires_route_source',
  'requires_district_source',
  'requires_live_pressure',
  'requires_memory_source',
  'requires_result_source',
  'requires_authority_permission',
  'requires_vehicle_source',
  'requires_container_source',
  'requires_team_source',
  'safe_baseline',
  'fallback_only',
];
