import type { ActiveOperationMapPhase } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';

import type {
  BuildMapActionBundleInput,
  MapActionBundleChip,
  MapActionBundlePresentation,
  MapDirectActionKind,
  MapDirectActionPresentation,
  MapDirectActionSourceType,
  MapDirectActionSurface,
  MapDirectActionTargetPhase,
  MapDirectActionTone,
} from './mapDirectActionTypes';

const ACTION_LABELS: Record<MapDirectActionKind, string> = {
  open_operation: 'Operasyona Git',
  inspect_signal: 'İncele',
  continue_operation: 'Devam Et',
  view_readiness: 'Hazırlığı Gör',
  view_maintenance: 'Hazırlık Takibi',
  view_district: 'Mahalleyi Gör',
  view_report_context: 'Raporda Gör',
  focus_map_layer: 'Katmanı Aç',
};

const ACTION_DESCRIPTIONS: Record<MapDirectActionKind, string> = {
  open_operation: 'Bu sinyalin operasyon akışını aç.',
  inspect_signal: 'Mahalle sinyalini inceleme fazında aç.',
  continue_operation: 'Operasyon kaldığı fazdan devam eder.',
  view_readiness: 'Ekip, araç ve kaynak hazırlığını kontrol et.',
  view_maintenance: 'Bakım kuyruğundaki takip sinyalini görüntüle.',
  view_district: 'Mahallenin güven, sosyal nabız ve hizmet sinyalini aç.',
  view_report_context: 'Bu kararın gün sonu izini gör.',
  focus_map_layer: 'Bu sinyali harita katmanında göster.',
};

const MID_PHASES: ActiveOperationMapPhase[] = [
  'planning',
  'dispatch_ready',
  'dispatching',
  'field_active',
  'field_paused',
];

const READINESS_PHASES: ActiveOperationMapPhase[] = [
  'planning',
  'dispatch_ready',
  'dispatching',
];

function clampLine(value: string, max = 72): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function phaseToTargetPhase(phase?: ActiveOperationMapPhase): MapDirectActionTargetPhase | undefined {
  switch (phase) {
    case 'before_inspect':
    case 'inspecting':
      return 'inspect';
    case 'planning':
      return 'plan';
    case 'dispatch_ready':
    case 'dispatching':
      return 'dispatch';
    case 'field_active':
    case 'field_paused':
      return 'field';
    case 'completed':
    case 'result_trace_available':
      return 'result';
    default:
      return undefined;
  }
}

function toneForKind(kind: MapDirectActionKind): MapDirectActionTone {
  switch (kind) {
    case 'continue_operation':
    case 'open_operation':
      return 'active';
    case 'inspect_signal':
      return 'warning';
    case 'view_readiness':
    case 'view_maintenance':
      return 'mixed';
    case 'view_report_context':
      return 'positive';
    default:
      return 'neutral';
  }
}

function createAction(params: {
  kind: MapDirectActionKind;
  sourceType: MapDirectActionSourceType;
  sourceId?: string;
  targetRouteKey?: string;
  targetPhase?: MapDirectActionTargetPhase;
  priority: number;
  enabled?: boolean;
  disabledReason?: string;
  labelOverride?: string;
  descriptionOverride?: string;
}): MapDirectActionPresentation | null {
  if (!params.targetRouteKey && params.kind !== 'view_district' && params.kind !== 'focus_map_layer') {
    return null;
  }
  if (params.kind === 'view_district' && !params.targetRouteKey) {
    return null;
  }
  if (params.kind === 'focus_map_layer' && !params.targetRouteKey) {
    return null;
  }

  const enabled = params.enabled ?? true;
  if (!enabled) return null;

  return {
    id: `${params.kind}:${params.sourceId ?? 'map'}`,
    kind: params.kind,
    label: params.labelOverride ?? ACTION_LABELS[params.kind],
    description: params.descriptionOverride ?? ACTION_DESCRIPTIONS[params.kind],
    tone: toneForKind(params.kind),
    enabled: true,
    sourceType: params.sourceType,
    sourceId: params.sourceId,
    targetRouteKey: params.targetRouteKey,
    targetPhase: params.targetPhase,
    priority: params.priority,
    dedupeKey: `${params.kind}:${params.targetRouteKey ?? params.sourceId ?? 'local'}`,
  };
}

function dedupeByLabel(actions: MapDirectActionPresentation[]): MapDirectActionPresentation[] {
  const seen = new Set<string>();
  const result: MapDirectActionPresentation[] = [];
  for (const action of [...actions].sort((a, b) => b.priority - a.priority)) {
    const key = action.label.toLocaleLowerCase('tr-TR');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(action);
  }
  return result;
}

function excludeKeys(
  actions: MapDirectActionPresentation[],
  exclude?: string[],
): MapDirectActionPresentation[] {
  if (!exclude?.length) return actions;
  const blocked = new Set(exclude);
  return actions.filter((action) => !blocked.has(action.dedupeKey));
}

function isActiveOperationPhase(phase?: ActiveOperationMapPhase): boolean {
  return Boolean(phase && MID_PHASES.includes(phase));
}

function hasReadinessPhase(phase?: ActiveOperationMapPhase, explicit?: boolean): boolean {
  return Boolean(explicit || (phase && READINESS_PHASES.includes(phase)));
}

function buildMaintenanceChips(
  maintenance: BuildMapActionBundleInput['maintenance'],
): MapActionBundleChip[] {
  if (!maintenance || maintenance.activeItemCount <= 0) return [];
  const chips: MapActionBundleChip[] = [];
  if (maintenance.districtLinkedItemCount > 0) {
    chips.push({
      label: 'Takip',
      value: `${maintenance.districtLinkedItemCount} takip adayı`,
      tone: 'warning',
    });
  } else if (maintenance.topItemLabel) {
    chips.push({
      label: 'Hazırlık',
      value: clampLine(maintenance.topItemLabel, 28),
      tone: 'mixed',
    });
  }
  return chips;
}

function buildPeriodGoalChip(
  periodGoal: BuildMapActionBundleInput['periodGoal'],
): MapActionBundleChip | null {
  if (!periodGoal?.shortTitle?.trim()) return null;
  return {
    label: 'Şehir Gündemi',
    value: clampLine(periodGoal.shortTitle, 32),
    tone: 'neutral',
  };
}

export function selectPressableMapDirectActions(
  bundle: MapActionBundlePresentation,
): MapDirectActionPresentation[] {
  const actions: MapDirectActionPresentation[] = [];
  if (bundle.primaryAction?.enabled && bundle.primaryAction.targetRouteKey) {
    actions.push(bundle.primaryAction);
  }
  for (const secondary of bundle.secondaryActions) {
    if (secondary.enabled && secondary.targetRouteKey) {
      actions.push(secondary);
    }
  }
  return actions;
}

export function buildMapActionBundlePresentation(
  input: BuildMapActionBundleInput,
): MapActionBundlePresentation {
  const candidates: MapDirectActionPresentation[] = [];
  const operation = input.operation;
  const marker = input.marker;
  const route = operation?.eventDetailRoute ?? marker?.eventDetailRoute;
  const eventId = operation?.eventId ?? marker?.eventId;
  const phase = operation?.phase;
  const targetPhase = phaseToTargetPhase(phase);

  if (marker) {
    const bindingMatches = Boolean(
      operation?.eventId && marker.eventId && operation.eventId === marker.eventId,
    );

    if (
      marker.markerType === 'active_event' ||
      marker.markerType === 'operation' ||
      (bindingMatches && isActiveOperationPhase(phase))
    ) {
      if (isActiveOperationPhase(phase) && route) {
        candidates.push(
          createAction({
            kind: 'continue_operation',
            sourceType: 'operation',
            sourceId: eventId,
            targetRouteKey: route,
            targetPhase,
            priority: 90,
          })!,
        );
      } else if (route) {
        candidates.push(
          createAction({
            kind: bindingMatches ? 'open_operation' : 'inspect_signal',
            sourceType: 'operation',
            sourceId: eventId,
            targetRouteKey: route,
            targetPhase: bindingMatches ? targetPhase : 'inspect',
            priority: bindingMatches ? 85 : 80,
          })!,
        );
      }

      if (hasReadinessPhase(phase, operation?.hasReadinessContext) && route) {
        candidates.push(
          createAction({
            kind: 'view_readiness',
            sourceType: 'readiness',
            sourceId: eventId,
            targetRouteKey: route,
            targetPhase: 'dispatch',
            priority: 70,
          })!,
        );
      }

      if (
        input.maintenance &&
        input.maintenance.districtLinkedItemCount > 0 &&
        input.maintenance.readinessRouteAvailable &&
        input.maintenance.readinessRoute
      ) {
        candidates.push(
          createAction({
            kind: 'view_maintenance',
            sourceType: 'maintenance',
            sourceId: input.maintenance.topItemLabel,
            targetRouteKey: input.maintenance.readinessRoute,
            targetPhase: 'dispatch',
            priority: 65,
          })!,
        );
      }
    }

    if (
      marker.markerType === 'urgent_signal' ||
      marker.markerType === 'opportunity' ||
      (marker.markerType === 'active_event' && !bindingMatches)
    ) {
      if (route) {
        candidates.push(
          createAction({
            kind: 'inspect_signal',
            sourceType: 'social',
            sourceId: eventId,
            targetRouteKey: route,
            targetPhase: 'inspect',
            priority: 82,
          })!,
        );
      }
    }

    if (marker.markerType === 'resolved' || marker.markerStatus === 'resolved') {
      if (input.reportRouteAvailable) {
        candidates.push(
          createAction({
            kind: 'view_report_context',
            sourceType: 'report',
            sourceId: eventId ?? marker.markerId,
            targetRouteKey: '/reports',
            targetPhase: 'report',
            priority: 88,
          })!,
        );
      }
      if (phase === 'result_trace_available' && route) {
        candidates.push(
          createAction({
            kind: 'open_operation',
            sourceType: 'operation',
            sourceId: eventId,
            targetRouteKey: route,
            targetPhase: 'result',
            priority: 75,
            labelOverride: 'Sonucu İncele',
          })!,
        );
      }
    }

    if (marker.markerType === 'district' || marker.markerType === 'resource') {
      const districtId = marker.districtId ?? input.district?.districtId;
      if (districtId && input.district?.canOpenDistrictDetail !== false) {
        candidates.push(
          createAction({
            kind: 'view_district',
            sourceType: 'district',
            sourceId: districtId,
            targetRouteKey: `map:detail:${districtId}`,
            priority: 78,
            descriptionOverride: input.district?.personalitySignalLine
              ? clampLine(
                  `Mahallenin ${input.district.personalitySignalLine.toLocaleLowerCase('tr-TR')} sinyalini gör.`,
                )
              : ACTION_DESCRIPTIONS.view_district,
          })!,
        );
      }
    }

    const districtId =
      input.district?.districtId ?? marker.districtId;
    if (
      districtId &&
      input.district?.canOpenDistrictDetail !== false &&
      marker.markerType !== 'district'
    ) {
      candidates.push(
        createAction({
          kind: 'view_district',
          sourceType: 'district',
          sourceId: districtId,
          targetRouteKey: `map:detail:${districtId}`,
          priority: 55,
        })!,
      );
    }
  }

  if (
    input.surface === 'active_operation_card' ||
    input.surface === 'hero_panel'
  ) {
    if (route) {
      if (isActiveOperationPhase(phase)) {
        candidates.push(
          createAction({
            kind: 'continue_operation',
            sourceType: 'operation',
            sourceId: eventId,
            targetRouteKey: route,
            targetPhase,
            priority: 95,
          })!,
        );
      } else {
        candidates.push(
          createAction({
            kind: 'open_operation',
            sourceType: 'operation',
            sourceId: eventId,
            targetRouteKey: route,
            targetPhase,
            priority: 90,
          })!,
        );
      }

      if (hasReadinessPhase(phase, operation?.hasReadinessContext)) {
        candidates.push(
          createAction({
            kind: 'view_readiness',
            sourceType: 'readiness',
            sourceId: eventId,
            targetRouteKey: route,
            targetPhase: 'dispatch',
            priority: 72,
          })!,
        );
      }
    }
  }

  if (input.layerToggleAvailable && input.surface === 'district_label') {
    candidates.push(
      createAction({
        kind: 'focus_map_layer',
        sourceType: 'district',
        sourceId: input.district?.districtId,
        targetRouteKey: 'map:layers',
        priority: 50,
      })!,
    );
  }

  const filtered = excludeKeys(
    dedupeByLabel(candidates.filter((action): action is MapDirectActionPresentation => Boolean(action))),
    input.excludeDedupeKeys,
  );

  const maxSecondary = input.maxSecondary ?? 2;
  const primaryAction = filtered[0];
  const secondaryActions = filtered.slice(1, 1 + maxSecondary);

  const chips: MapActionBundleChip[] = [
    ...buildMaintenanceChips(input.maintenance),
  ];
  const periodChip = buildPeriodGoalChip(input.periodGoal);
  if (periodChip) chips.push(periodChip);

  const title =
    input.surface === 'hero_panel'
      ? 'Aktif Sinyal'
      : marker?.districtName?.trim() ||
        input.district?.districtName?.trim() ||
        'Harita Sinyali';

  const subtitle =
    input.district?.personalitySignalLine?.trim() ||
    operation?.districtName?.trim() ||
    marker?.districtName?.trim() ||
    'Canlı operasyon masası';

  return {
    title: clampLine(title, 42),
    subtitle: clampLine(subtitle, 56),
    primaryAction,
    secondaryActions,
    chips: chips.slice(0, 3),
  };
}

export function buildMarkerMapActionBundle(
  input: Omit<BuildMapActionBundleInput, 'surface'> & { surface?: MapDirectActionSurface },
): MapActionBundlePresentation {
  return buildMapActionBundlePresentation({
    ...input,
    surface: input.surface ?? 'map_bottom_sheet',
  });
}

export function buildHeroMapActionBundle(
  input: Omit<BuildMapActionBundleInput, 'surface' | 'maxSecondary'>,
): MapActionBundlePresentation {
  return buildMapActionBundlePresentation({
    ...input,
    surface: 'hero_panel',
    maxSecondary: 1,
  });
}

export function buildActiveOperationCardActionBundle(
  input: Omit<BuildMapActionBundleInput, 'surface' | 'maxSecondary'>,
): MapActionBundlePresentation {
  return buildMapActionBundlePresentation({
    ...input,
    surface: 'active_operation_card',
    maxSecondary: 1,
  });
}

export { ACTION_LABELS, ACTION_DESCRIPTIONS };
