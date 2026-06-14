import type { CreviaActiveTaskRouteUiModel } from '@/core/activeTaskRoutes/activeTaskRouteUiTypes';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import type { DistrictPersonalityProfile } from '@/core/districtPersonality/districtPersonalityTypes';
import type { EventGameplayVarietyProfile } from '@/core/eventVariety/eventGameplayVarietyTypes';
import type { MapGameplayBinding, MapGameplayVisibilityLevel } from '@/core/mapGameplayBinding/mapGameplayBindingTypes';
import type { EventCard } from '@/core/models/EventCard';

export const ACTIVE_OPERATION_MAP_PHASES = [
  'before_inspect',
  'inspecting',
  'planning',
  'dispatch_ready',
  'dispatching',
  'field_active',
  'field_paused',
  'completed',
  'result_trace_available',
  'unknown',
] as const;

export type ActiveOperationMapPhase = (typeof ACTIVE_OPERATION_MAP_PHASES)[number];

export const ACTIVE_OPERATION_MAP_SIGNAL_KINDS = [
  'active_event',
  'assignment',
  'active_task_route',
  'district_personality',
  'gameplay_pressure',
  'map_gameplay_binding',
  'operation_signal',
  'authority_visibility',
  'decision_consequence',
  'result_trace',
  'fallback',
] as const;

export type ActiveOperationMapSignalKind =
  (typeof ACTIVE_OPERATION_MAP_SIGNAL_KINDS)[number];

export type ActiveOperationMapTone =
  | 'neutral'
  | 'inspect'
  | 'planning'
  | 'dispatch'
  | 'field'
  | 'paused'
  | 'completed'
  | 'result';

export type ActiveOperationMapConfidence = 'low' | 'medium' | 'high';

export type ActiveOperationMapBindingInput = {
  day: number;
  activeEvent?: EventCard | null;
  assignment?: EventAssignmentState | null;
  activeTaskRoute?: CreviaActiveTaskRouteUiModel | null;
  districtPersonality?: DistrictPersonalityProfile | null;
  eventGameplayProfile?: EventGameplayVarietyProfile | null;
  mapGameplayBinding?: MapGameplayBinding | null;
  operationSignals?: unknown;
  resourceSignals?: unknown;
  socialSignals?: unknown;
  trustSignals?: unknown;
  tomorrowRiskSignals?: unknown;
  decisionConsequenceSignals?: unknown;
  unlockedPermissionIds?: string[];
  resultRouteAvailable?: boolean;
  eventDetailRoute?: string;
  microDecisionPending?: boolean;
  recentTemplateIds?: string[];
};

export type ActiveOperationMapBinding = {
  id: string;
  eventId?: string;
  districtId?: string;
  districtName?: string;
  title: string;
  phase: ActiveOperationMapPhase;
  phaseLabel: string;
  mapLine: string;
  decisionLine: string;
  districtLine?: string;
  routeLine?: string;
  pressureLine?: string;
  nextActionLine?: string;
  signalKinds: ActiveOperationMapSignalKind[];
  sourceIds: string[];
  confidence: ActiveOperationMapConfidence;
  visibilityLevel: MapGameplayVisibilityLevel;
  tone: ActiveOperationMapTone;
  priority: number;
  isActionable: boolean;
  canOpenOperation: boolean;
  canShowRouteHint: boolean;
  canShowDistrictContext: boolean;
  accessibilityLabel: string;
  eventDetailRoute?: string;
};

export type ActiveOperationMapCardModel = {
  id: string;
  title: string;
  phaseLabel: string;
  mapLine: string;
  decisionLine: string;
  districtLine?: string;
  routeLine?: string;
  pressureLine?: string;
  nextActionLine?: string;
  ctaLabel: string;
  ctaRoute?: string;
  tone: ActiveOperationMapTone;
  visibilityLevel: MapGameplayVisibilityLevel;
  isActionable: boolean;
  accessibilityLabel: string;
};
