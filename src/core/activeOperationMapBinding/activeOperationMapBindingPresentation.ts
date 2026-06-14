import type {
  ActiveOperationMapBinding,
  ActiveOperationMapCardModel,
} from './activeOperationMapBindingTypes';
import type { MapGameplayBinding } from '@/core/mapGameplayBinding/mapGameplayBindingTypes';

export function enrichMapGameplayActiveOperationTracker(
  binding: MapGameplayBinding | null | undefined,
  activeOperation: ActiveOperationMapBinding | null | undefined,
): MapGameplayBinding | null {
  if (!binding || binding.id !== 'active_operation_tracker' || !activeOperation) {
    return binding ?? null;
  }
  if (activeOperation.visibilityLevel === 'hidden') {
    return binding;
  }
  return {
    ...binding,
    supportedDecisionLine: activeOperation.decisionLine.trim() || binding.supportedDecisionLine,
    confidence: activeOperation.confidence,
    priority: Math.max(binding.priority, activeOperation.priority),
    visibilityLevel:
      binding.visibilityLevel === 'hidden'
        ? binding.visibilityLevel
        : activeOperation.visibilityLevel,
  };
}

function pickSupportingLines(
  binding: ActiveOperationMapBinding,
  maxLines: number,
): Pick<ActiveOperationMapCardModel, 'districtLine' | 'routeLine' | 'pressureLine'> {
  const candidates: Array<['routeLine' | 'districtLine' | 'pressureLine', string]> = [];
  if (binding.routeLine) candidates.push(['routeLine', binding.routeLine]);
  if (binding.districtLine) candidates.push(['districtLine', binding.districtLine]);
  if (binding.pressureLine) candidates.push(['pressureLine', binding.pressureLine]);
  const picked = candidates.slice(0, maxLines);
  return {
    routeLine: picked.find(([key]) => key === 'routeLine')?.[1],
    districtLine: picked.find(([key]) => key === 'districtLine')?.[1],
    pressureLine: picked.find(([key]) => key === 'pressureLine')?.[1],
  };
}

export function buildActiveOperationMapCardModel(
  binding: ActiveOperationMapBinding | null | undefined,
  options: { day?: number } = {},
): ActiveOperationMapCardModel | null {
  if (!binding || binding.visibilityLevel === 'hidden') {
    return null;
  }

  const day = options.day ?? 1;
  const maxSupportingLines = day >= 10 ? 2 : day >= 8 ? 2 : 1;
  const supporting = pickSupportingLines(binding, maxSupportingLines);

  const ctaLabel =
    binding.phase === 'completed' || binding.phase === 'result_trace_available'
      ? 'Sonucu Gor'
      : binding.eventDetailRoute
        ? 'Operasyonu Ac'
        : binding.canOpenOperation
          ? 'Takip Et'
          : 'Detay yok';

  return {
    id: `active_operation_card:${binding.eventId ?? 'fallback'}`,
    title: binding.title,
    phaseLabel: binding.phaseLabel,
    mapLine: binding.mapLine,
    decisionLine: binding.decisionLine,
    districtLine: supporting.districtLine,
    routeLine: supporting.routeLine,
    pressureLine: supporting.pressureLine,
    nextActionLine: binding.nextActionLine,
    ctaLabel,
    ctaRoute: binding.eventDetailRoute,
    tone: binding.tone,
    visibilityLevel: binding.visibilityLevel,
    isActionable: binding.isActionable,
    accessibilityLabel: binding.accessibilityLabel,
  };
}
