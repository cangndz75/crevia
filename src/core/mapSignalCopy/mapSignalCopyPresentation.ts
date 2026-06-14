import type { ActiveOperationMapPhase } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import type { MapGameplayBinding, MapGameplayRole } from '@/core/mapGameplayBinding/mapGameplayBindingTypes';
import type { DistrictCriterionId, DistrictPersonalityLineKind } from '@/core/districtPersonality/districtPersonalityTypes';

import { ACTIVE_OPERATION_PHASE_LABELS, MAP_SIGNAL_COPY_ACCESSIBILITY_MAX_LENGTH } from './mapSignalCopyConstants';
import { selectMapSignalCopy } from './mapSignalCopyModel';
import type {
  MapSignalAccessibilityLabelInput,
  MapSignalCopyContext,
  MapSignalCopyInput,
  MapSignalCopyLineKind,
  MapSignalCopyResult,
} from './mapSignalCopyTypes';

const ROLE_TO_CONTEXT: Partial<Record<MapGameplayRole, MapSignalCopyContext>> = {
  operation_tracker: 'active_operation',
  risk_reader: 'social_sensitivity',
  resource_board: 'resource_pressure',
  route_support: 'route_support',
  district_memory: 'district_memory',
  result_trace: 'result_trace',
  authority_unlock_surface: 'authority_layer',
};

export type ActiveOperationMapCopyInput = {
  phase: ActiveOperationMapPhase;
  day: number;
  visibilityLevel?: 'hidden' | 'teaser' | 'summary' | 'detailed';
  sourceIds?: string[];
  sourceKinds?: string[];
  permissionAvailable?: boolean;
  recentTemplateIds?: string[];
};

export type ActiveOperationMapCopySelection = {
  mapLine: string;
  decisionLine: string;
  nextActionLine: string;
  mapTemplateId: string;
  decisionTemplateId: string;
  nextTemplateId: string;
};

function buildSelectionInput(
  partial: Omit<MapSignalCopyInput, 'context' | 'kind'>,
  context: MapSignalCopyContext,
  kind: MapSignalCopyLineKind,
): MapSignalCopyInput {
  return { context, kind, ...partial };
}

export function selectActiveOperationMapCopy(
  input: ActiveOperationMapCopyInput,
): ActiveOperationMapCopySelection {
  const base: Omit<MapSignalCopyInput, 'context' | 'kind'> = {
    day: input.day,
    operationPhase: input.phase,
    visibilityLevel: input.visibilityLevel,
    sourceIds:
      input.phase === 'unknown'
        ? input.sourceIds
        : [...(input.sourceIds ?? []), `phase:${input.phase}`],
    sourceKinds:
      input.phase === 'unknown'
        ? [...(input.sourceKinds ?? []), 'fallback']
        : [...(input.sourceKinds ?? []), 'active_event'],
    permissionAvailable: input.permissionAvailable,
    recentTemplateIds: input.recentTemplateIds,
  };

  const map = selectMapSignalCopy(
    buildSelectionInput(base, 'active_operation', 'map_line'),
  );
  const decision = selectMapSignalCopy(
    buildSelectionInput(
      {
        ...base,
        recentTemplateIds: [...(input.recentTemplateIds ?? []), map.sourceTemplateId],
      },
      'active_operation',
      'decision_line',
    ),
  );
  const next = selectMapSignalCopy(
    buildSelectionInput(
      {
        ...base,
        recentTemplateIds: [
          ...(input.recentTemplateIds ?? []),
          map.sourceTemplateId,
          decision.sourceTemplateId,
        ],
      },
      'active_operation',
      'next_action_line',
    ),
  );

  return {
    mapLine: map.text,
    decisionLine: decision.text,
    nextActionLine: next.text,
    mapTemplateId: map.sourceTemplateId,
    decisionTemplateId: decision.sourceTemplateId,
    nextTemplateId: next.sourceTemplateId,
  };
}

export function getActiveOperationPhaseLabel(phase: ActiveOperationMapPhase): string {
  return ACTIVE_OPERATION_PHASE_LABELS[phase] ?? 'Operasyon';
}

export function enrichMapGameplayBindingDecisionLine(
  binding: MapGameplayBinding,
  options: {
    day: number;
    recentTemplateIds?: string[];
    permissionAvailable?: boolean;
    pressureKind?: string;
    districtCriterionId?: DistrictCriterionId;
  },
): string {
  const context = ROLE_TO_CONTEXT[binding.role];
  if (!context || binding.sourceKinds.includes('fallback')) {
    return binding.supportedDecisionLine;
  }

  const result = selectMapSignalCopy({
    context,
    kind: 'decision_line',
    day: options.day,
    visibilityLevel: binding.visibilityLevel,
    sourceIds: binding.sourceIds,
    sourceKinds: binding.sourceKinds,
    permissionAvailable: options.permissionAvailable,
    pressureKind: options.pressureKind,
    districtCriterionId: options.districtCriterionId,
    recentTemplateIds: options.recentTemplateIds,
    maxLength: 90,
  });

  if (result.isFallback || result.confidence === 'low') {
    return binding.supportedDecisionLine;
  }
  return result.text;
}

export function selectDistrictPersonalityMapCopy(
  criterionId: DistrictCriterionId,
  kind: DistrictPersonalityLineKind,
  options: {
    day: number;
    sourceIds?: string[];
    recentTemplateIds?: string[];
  },
): MapSignalCopyResult {
  const kindMap: Partial<Record<DistrictPersonalityLineKind, MapSignalCopyLineKind>> = {
    map_signal: 'map_line',
    ece_hint: 'district_line',
    event_plan: 'decision_line',
    retention_hook: 'next_action_line',
    report_note: 'map_line',
    authority_teaser: 'locked_teaser',
    fallback: 'map_line',
    event_inspect: 'decision_line',
  };
  const mappedKind = kindMap[kind] ?? 'map_line';

  return selectMapSignalCopy({
    context: 'district_personality',
    kind: mappedKind,
    day: options.day,
    districtCriterionId: criterionId,
    sourceIds: [...(options.sourceIds ?? []), `district:${criterionId}`],
    sourceKinds: ['district_personality'],
    recentTemplateIds: options.recentTemplateIds,
  });
}

export function buildMapSignalAccessibilityLabel(input: MapSignalAccessibilityLabelInput): string {
  const parts = [
    input.phaseLabel,
    input.mapLine,
    input.decisionLine,
    input.supportLine,
    input.ctaDisabled ? 'İşlem şu an kullanılamıyor' : input.ctaLabel,
  ].filter(Boolean);

  let label = parts.join('. ').replace(/\s+/g, ' ').trim();
  if (!label.endsWith('.')) {
    label = `${label}.`;
  }
  if (label.length > MAP_SIGNAL_COPY_ACCESSIBILITY_MAX_LENGTH) {
    const shortened = [input.phaseLabel, input.mapLine, input.decisionLine]
      .filter(Boolean)
      .join('. ')
      .trim();
    label =
      shortened.length <= MAP_SIGNAL_COPY_ACCESSIBILITY_MAX_LENGTH
        ? `${shortened}.`
        : `${shortened.slice(0, MAP_SIGNAL_COPY_ACCESSIBILITY_MAX_LENGTH - 1).trim()}.`;
  }
  return label;
}

export function buildActiveOperationAccessibilityLabel(input: {
  phase: ActiveOperationMapPhase;
  title: string;
  mapLine: string;
  decisionLine: string;
  supportLine?: string;
  ctaDisabled?: boolean;
}): string {
  return buildMapSignalAccessibilityLabel({
    phaseLabel: `${getActiveOperationPhaseLabel(input.phase)}: ${input.title}`,
    mapLine: input.mapLine,
    decisionLine: input.decisionLine,
    supportLine: input.supportLine,
    ctaDisabled: input.ctaDisabled,
  });
}
