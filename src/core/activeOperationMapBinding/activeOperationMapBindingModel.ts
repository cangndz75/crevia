import type {
  ActiveOperationMapBinding,
  ActiveOperationMapBindingInput,
  ActiveOperationMapConfidence,
  ActiveOperationMapPhase,
  ActiveOperationMapSignalKind,
  ActiveOperationMapTone,
} from './activeOperationMapBindingTypes';
import {
  buildActiveOperationAccessibilityLabel,
  getActiveOperationPhaseLabel,
  selectActiveOperationMapCopy,
} from '@/core/mapSignalCopy/mapSignalCopyPresentation';

const DETAILED_PERMISSION_IDS = new Set([
  'assignment_fit_preview',
  'district_trust_preview',
  'resource_pressure_summary',
  'map_trust_layer',
  'map_resource_layer',
  'map_route_layer',
  'active_task_route',
]);

const PHASE_TONES: Record<ActiveOperationMapPhase, ActiveOperationMapTone> = {
  before_inspect: 'inspect',
  inspecting: 'inspect',
  planning: 'planning',
  dispatch_ready: 'dispatch',
  dispatching: 'dispatch',
  field_active: 'field',
  field_paused: 'paused',
  completed: 'completed',
  result_trace_available: 'result',
  unknown: 'neutral',
};

function hasAnyPermission(ids: string[] | undefined): boolean {
  return (ids ?? []).some((id) => DETAILED_PERMISSION_IDS.has(id));
}

function hasSignal(value: unknown): boolean {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function clampPriority(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolvePhase(input: ActiveOperationMapBindingInput): ActiveOperationMapPhase {
  if (!input.activeEvent) {
    return 'unknown';
  }
  if (input.resultRouteAvailable && input.assignment?.status === 'processed') {
    return 'result_trace_available';
  }
  if (input.assignment?.status === 'processed' || input.activeTaskRoute?.phase === 'completed') {
    return 'completed';
  }
  if (input.microDecisionPending) {
    return 'field_paused';
  }
  if (
    input.activeTaskRoute?.phase === 'on_site' ||
    input.activeTaskRoute?.phase === 'resolving'
  ) {
    return 'field_active';
  }
  if (
    input.activeTaskRoute?.phase === 'delayed' ||
    input.activeTaskRoute?.phase === 'risk_watch'
  ) {
    return 'field_paused';
  }
  if (input.activeTaskRoute?.phase === 'en_route' || input.assignment?.status === 'dispatched') {
    return 'dispatching';
  }
  if (
    input.activeTaskRoute?.phase === 'dispatch_ready' ||
    input.assignment?.status === 'confirmed'
  ) {
    return 'dispatch_ready';
  }
  if (input.assignment?.status === 'draft') {
    return 'planning';
  }
  return input.day <= 1 ? 'before_inspect' : 'inspecting';
}

export function resolveActiveOperationMapPhase(
  input: ActiveOperationMapBindingInput,
): ActiveOperationMapPhase {
  return resolvePhase(input);
}

function resolveVisibility(input: ActiveOperationMapBindingInput) {
  if (!input.activeEvent) return 'hidden' as const;
  if (input.mapGameplayBinding?.visibilityLevel === 'hidden') return 'hidden' as const;
  if (input.day <= 1) return 'summary' as const;
  if (input.mapGameplayBinding?.visibilityLevel === 'detailed') return 'detailed' as const;
  if (input.day >= 8 && hasAnyPermission(input.unlockedPermissionIds)) return 'detailed' as const;
  if (input.day >= 2) return 'summary' as const;
  return 'teaser' as const;
}

function resolveConfidence(input: ActiveOperationMapBindingInput): ActiveOperationMapConfidence {
  if (!input.activeEvent) return 'low';
  if (input.activeTaskRoute?.visible || input.assignment || input.eventGameplayProfile) return 'high';
  if (input.districtPersonality && !input.districtPersonality.isFallback) return 'medium';
  return 'medium';
}

function resolveDistrictLine(input: ActiveOperationMapBindingInput, visibility: string) {
  const profile = input.districtPersonality;
  if (!profile || profile.isFallback || input.day <= 1) {
    return undefined;
  }
  if (visibility === 'hidden' || visibility === 'teaser') {
    return undefined;
  }
  const hasDistrictPermission = (input.unlockedPermissionIds ?? []).some((id) =>
    ['district_trust_preview', 'map_trust_layer'].includes(id),
  );
  if (visibility === 'detailed' || (input.day >= 2 && hasDistrictPermission)) {
    return profile.mapBias.mapSignalLine;
  }
  return undefined;
}

function resolvePressureLine(input: ActiveOperationMapBindingInput) {
  const profile = input.eventGameplayProfile;
  if (!profile || profile.primaryPressure === 'calm_standard') {
    return undefined;
  }
  if (input.day <= 1) {
    return undefined;
  }
  if (input.day < 8) {
    const hasResourcePermission = (input.unlockedPermissionIds ?? []).some((id) =>
      ['resource_pressure_summary', 'assignment_fit_preview'].includes(id),
    );
    if (!hasResourcePermission) {
      return undefined;
    }
  }
  return profile.dispatchHintLine ?? profile.planHintLine ?? profile.playerFacingLine;
}

function resolveRouteLine(input: ActiveOperationMapBindingInput) {
  if (!input.activeTaskRoute?.visible || !input.activeTaskRoute.mapLine) return undefined;
  return input.activeTaskRoute.mapLine;
}

function resolveSignalKinds(input: ActiveOperationMapBindingInput): ActiveOperationMapSignalKind[] {
  const kinds: ActiveOperationMapSignalKind[] = ['authority_visibility'];
  if (input.activeEvent) kinds.push('active_event');
  if (input.assignment) kinds.push('assignment');
  if (input.activeTaskRoute?.visible) kinds.push('active_task_route');
  if (input.districtPersonality && !input.districtPersonality.isFallback) {
    kinds.push('district_personality');
  }
  if (input.eventGameplayProfile) kinds.push('gameplay_pressure');
  if (input.mapGameplayBinding) kinds.push('map_gameplay_binding');
  if (hasSignal(input.operationSignals)) kinds.push('operation_signal');
  if (input.decisionConsequenceSignals) kinds.push('decision_consequence');
  if (input.resultRouteAvailable) kinds.push('result_trace');
  if (!input.activeEvent) kinds.push('fallback');
  return unique(kinds);
}

function resolveSourceIds(input: ActiveOperationMapBindingInput): string[] {
  return unique(
    [
      input.activeEvent?.id ? `event:${input.activeEvent.id}` : undefined,
      input.assignment?.eventId ? `assignment:${input.assignment.eventId}` : undefined,
      input.activeTaskRoute?.id ? `route:${input.activeTaskRoute.id}` : undefined,
      ...(input.districtPersonality?.sourceIds ?? []).map((id) => `district:${id}`),
      ...(input.eventGameplayProfile?.sourceIds ?? []).map((id) => `gameplay:${id}`),
      input.mapGameplayBinding?.id ? `map_gameplay:${input.mapGameplayBinding.id}` : undefined,
      input.resultRouteAvailable ? 'result_trace:available' : undefined,
    ].filter(Boolean) as string[],
  );
}

export function buildActiveOperationMapBinding(
  input: ActiveOperationMapBindingInput,
): ActiveOperationMapBinding {
  const phase = resolvePhase(input);
  const visibilityLevel = resolveVisibility(input);
  const routeLine = resolveRouteLine(input);
  const districtLine = resolveDistrictLine(input, visibilityLevel);
  const pressureLine = resolvePressureLine(input);
  const signalKinds = resolveSignalKinds(input);
  const sourceIds = resolveSourceIds(input);
  const phaseCopy = selectActiveOperationMapCopy({
    phase,
    day: input.day,
    visibilityLevel,
    sourceIds,
    sourceKinds: signalKinds,
    permissionAvailable: hasAnyPermission(input.unlockedPermissionIds),
    recentTemplateIds: input.recentTemplateIds,
  });
  const phaseLabel = getActiveOperationPhaseLabel(phase);
  const phaseTone = PHASE_TONES[phase];
  const canOpenOperation = Boolean(input.activeEvent);
  const eventId = input.activeEvent?.id;
  const districtId =
    input.activeEvent?.neighborhoodId ?? input.districtPersonality?.districtId ?? undefined;
  const title = input.activeEvent?.title ?? 'Aktif operasyon yok';
  const isActionable = canOpenOperation && visibilityLevel !== 'hidden';
  const mapLine = phaseCopy.mapLine;
  const decisionLine = input.assignment?.advisorNote ?? phaseCopy.decisionLine;
  const supportLine = routeLine ?? districtLine ?? pressureLine;

  return {
    id: `active_operation_map:${eventId ?? districtId ?? 'fallback'}:${phase}`,
    eventId,
    districtId,
    districtName: input.districtPersonality?.districtName,
    title,
    phase,
    phaseLabel,
    mapLine,
    decisionLine,
    districtLine,
    routeLine,
    pressureLine,
    nextActionLine: phaseCopy.nextActionLine,
    signalKinds,
    sourceIds,
    confidence: resolveConfidence(input),
    visibilityLevel,
    tone: phaseTone,
    priority: clampPriority((input.mapGameplayBinding?.priority ?? 40) + (routeLine ? 15 : 0)),
    isActionable,
    canOpenOperation,
    canShowRouteHint: Boolean(routeLine),
    canShowDistrictContext: Boolean(districtLine),
    accessibilityLabel: buildActiveOperationAccessibilityLabel({
      phase,
      title,
      mapLine,
      decisionLine,
      supportLine,
      ctaDisabled: !isActionable,
    }),
    eventDetailRoute: isActionable ? input.eventDetailRoute : undefined,
  };
}
