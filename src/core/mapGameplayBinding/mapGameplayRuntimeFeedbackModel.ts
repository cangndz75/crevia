import type { ActiveOperationMapBinding } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import type { DailyCapacityRuntimeSnapshot } from '@/core/dailyCapacityPortfolio/dailyCapacityRuntimeBindingTypes';
import type { OperationPortfolioItem } from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioTypes';
import { shouldApplyPortfolioRuntimeBinding } from '@/core/dailyCapacityPortfolio/dailyCapacityRuntimeBindingModel';
import type { GameState } from '@/core/models/GameState';
import {
  applyAuthorityToMapMarkerFeedback,
  authorityCtaForStatus,
  buildPortfolioMarkerFeedbackBase,
} from '@/core/activeOperationMapBinding/operationActionPresentation';
import type { AuthorityGameplayEffectSnapshot } from '@/core/authorityGameplayExpansion/authorityGameplayEffectTypes';

import type {
  MapGameplayBinding,
  MapGameplaySupportedDecision,
} from './mapGameplayBindingTypes';
import type {
  MapGameplayRuntimeFeedbackResult,
  MapGameplayRuntimeMarkerFeedback,
  MapMarkerPortfolioStatus,
} from './mapGameplayRuntimeFeedbackTypes';

const TEXT_LIMIT = 72;

const MAP_DISTRICT_IDS = [
  'merkez',
  'cumhuriyet',
  'sanayi',
  'istasyon',
  'yesilvadi',
] as const;

function normalizeDistrictId(raw?: string | null): string | undefined {
  if (!raw?.trim()) return undefined;
  const normalized = raw.trim().toLowerCase();
  const direct = MAP_DISTRICT_IDS.find((id) => id === normalized);
  if (direct) return direct;
  return MAP_DISTRICT_IDS.find((id) => normalized.includes(id));
}

function clampLine(value: string, max = TEXT_LIMIT): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function eventIdFromPortfolioItem(
  item: OperationPortfolioItem,
  catalogIds: Set<string>,
): string | undefined {
  for (const sourceId of item.sourceIds) {
    if (catalogIds.has(sourceId)) return sourceId;
  }
  return undefined;
}

function buildMarkerFeedback(params: {
  eventId: string;
  item?: OperationPortfolioItem;
  deferredSet: Set<string>;
  explicitActiveEventId?: string;
  activeOperationBinding?: ActiveOperationMapBinding | null;
  portfolioDeferLine?: string;
  authorityEffectSnapshot?: import('@/core/authorityGameplayExpansion/authorityGameplayEffectTypes').AuthorityGameplayEffectSnapshot | null;
}): MapGameplayRuntimeMarkerFeedback {
  const base = buildPortfolioMarkerFeedbackBase({
    eventId: params.eventId,
    item: params.item,
    deferredSet: params.deferredSet,
    explicitActiveEventId: params.explicitActiveEventId,
    activeOperationBinding: params.activeOperationBinding,
    portfolioDeferLine: params.portfolioDeferLine,
    authorityEffectSnapshot: params.authorityEffectSnapshot,
  });
  const { status, presentation, priority, sourceIds } = base;

  let marker: MapGameplayRuntimeMarkerFeedback = {
    id: `map_runtime_marker_${params.eventId}`,
    eventId: params.eventId,
    districtId: normalizeDistrictId(params.item?.districtId ?? params.item?.districtName),
    districtName: params.item?.districtName ?? params.item?.districtId,
    status,
    priority,
    tone: presentation.tone,
    isActionable: presentation.isStartable,
    isInspectable: presentation.isInspectable,
    isStartable: presentation.isStartable,
    supportedDecision: supportedDecisionForStatus(status),
    ctaLabel: presentation.ctaLabel,
    explanationLine: presentation.explanationLine,
    riskLine: presentation.riskLine,
    deferLine: presentation.deferLine,
    badgeLabel: presentation.badgeLabel,
    sourceIds,
  };

  marker = applyAuthorityToMapMarkerFeedback(marker, params.authorityEffectSnapshot, params.item);
  const authorityCta = authorityCtaForStatus(marker.status, params.authorityEffectSnapshot);
  if (authorityCta && !marker.isStartable) {
    marker = { ...marker, ctaLabel: authorityCta };
  }
  return marker;
}

function supportedDecisionForStatus(status: MapMarkerPortfolioStatus): MapGameplaySupportedDecision {
  switch (status) {
    case 'active':
    case 'today_focus':
      return 'open_active_operation';
    case 'recommended':
      return 'choose_operation_priority';
    case 'deferred':
    case 'blocked_by_capacity':
    case 'watch':
      return 'choose_operation_priority';
    case 'completed':
      return 'inspect_result_trace';
    case 'locked':
      return 'understand_unlocked_layer';
    default:
      return 'none';
  }
}

function resolvePrimaryMarker(
  markers: MapGameplayRuntimeMarkerFeedback[],
  explicitActiveEventId?: string,
  activeOperationBinding?: ActiveOperationMapBinding | null,
): MapGameplayRuntimeMarkerFeedback | undefined {
  const explicit = markers.find((marker) => marker.eventId === explicitActiveEventId);
  if (explicit) return explicit;
  if (activeOperationBinding?.eventId) {
    const activeBinding = markers.find(
      (marker) => marker.eventId === activeOperationBinding.eventId,
    );
    if (activeBinding) return activeBinding;
  }
  const rank = (status: MapMarkerPortfolioStatus): number => {
    switch (status) {
      case 'active':
        return 6;
      case 'today_focus':
        return 5;
      case 'recommended':
        return 4;
      case 'watch':
        return 3;
      case 'deferred':
        return 2;
      case 'blocked_by_capacity':
        return 1;
      default:
        return 0;
    }
  };
  return [...markers].sort(
    (a, b) => rank(b.status) - rank(a.status) || b.priority - a.priority || a.id.localeCompare(b.id),
  )[0];
}

function enrichBindings(
  bindings: readonly MapGameplayBinding[],
  markers: readonly MapGameplayRuntimeMarkerFeedback[],
  primary?: MapGameplayRuntimeMarkerFeedback,
): MapGameplayBinding[] {
  const deferredCount = markers.filter(
    (marker) => marker.status === 'deferred' || marker.status === 'blocked_by_capacity',
  ).length;

  return bindings.map((binding) => {
    if (binding.role === 'operation_tracker' && primary) {
      return {
        ...binding,
        priority: Math.max(binding.priority, primary.priority),
        isActionable: primary.isStartable,
        supportedDecision: primary.supportedDecision,
        supportedDecisionLine: clampLine(primary.explanationLine),
        confidence: primary.isStartable ? 'high' : binding.confidence,
      };
    }
    if (binding.id === 'route_support_hint' && primary?.status === 'today_focus') {
      return {
        ...binding,
        priority: Math.max(binding.priority, primary.priority - 8),
        isActionable: binding.isActionable && primary.isStartable,
      };
    }
    if (deferredCount > 0 && binding.role === 'risk_reader') {
      return {
        ...binding,
        supportedDecisionLine: clampLine(
          `${binding.supportedDecisionLine} ${deferredCount} operasyon kapasite disi.`,
        ),
      };
    }
    return binding;
  });
}

export type BuildMapGameplayRuntimeFeedbackInput = {
  day: number;
  gameState: GameState;
  snapshot?: DailyCapacityRuntimeSnapshot | null;
  mapGameplayBindings: readonly MapGameplayBinding[];
  activeOperationBinding?: ActiveOperationMapBinding | null;
  deferredEventIds?: string[];
  explicitActiveEventId?: string;
  authorityEffectSnapshot?: AuthorityGameplayEffectSnapshot | null;
};

export function buildMapGameplayRuntimeFeedback(
  input: BuildMapGameplayRuntimeFeedbackInput,
): MapGameplayRuntimeFeedbackResult {
  const deferredEventIds = uniqueStrings([
    ...(input.deferredEventIds ?? []),
    ...(input.snapshot?.deferredOperationEventIds ?? []),
    ...(input.snapshot?.portfolio.deferredItems.flatMap((item) =>
      item.sourceIds.filter((id) => !id.startsWith('portfolio_')),
    ) ?? []),
  ]);
  const deferredSet = new Set(deferredEventIds);

  if (
    !input.snapshot ||
    input.snapshot.mode !== 'portfolio_runtime' ||
    !shouldApplyPortfolioRuntimeBinding(input.day, input.gameState)
  ) {
    return {
      mode: 'legacy',
      markers: [],
      deferredEventIds,
      enrichedBindings: [...input.mapGameplayBindings],
      sourceIds: [],
    };
  }

  const portfolio = input.snapshot.portfolio;
  const deferLine = input.snapshot.portfolioDeferRisk.tomorrowActionLine;
  const catalogIds = new Set<string>([
    ...input.snapshot.activeOperationEventIds,
    ...deferredEventIds,
    ...portfolio.items.flatMap((item) => item.sourceIds),
  ]);
  const operationItems = portfolio.items.filter(
    (item) =>
      item.kind === 'active_operation' ||
      item.sourceKinds.includes('active_events') ||
      item.sourceKinds.includes('post_pilot_event_quota'),
  );

  const markersByEvent = new Map<string, MapGameplayRuntimeMarkerFeedback>();
  for (const item of operationItems) {
    const eventId = eventIdFromPortfolioItem(item, catalogIds);
    if (!eventId) continue;
    markersByEvent.set(
      eventId,
      buildMarkerFeedback({
        eventId,
        item,
        deferredSet,
        explicitActiveEventId: input.explicitActiveEventId,
        activeOperationBinding: input.activeOperationBinding,
        portfolioDeferLine: deferLine,
        authorityEffectSnapshot: input.authorityEffectSnapshot,
      }),
    );
  }

  for (const eventId of deferredEventIds) {
    if (markersByEvent.has(eventId)) continue;
    markersByEvent.set(
      eventId,
      buildMarkerFeedback({
        eventId,
        deferredSet,
        explicitActiveEventId: input.explicitActiveEventId,
        activeOperationBinding: input.activeOperationBinding,
        portfolioDeferLine: deferLine,
        authorityEffectSnapshot: input.authorityEffectSnapshot,
      }),
    );
  }

  const markers = [...markersByEvent.values()].sort(
    (a, b) =>
      b.priority - a.priority || (a.eventId?.localeCompare(b.eventId ?? '') ?? 0),
  );

  const primary = resolvePrimaryMarker(
    markers,
    input.explicitActiveEventId,
    input.activeOperationBinding,
  );

  return {
    mode: 'portfolio_runtime',
    markers,
    primaryMarkerId: primary?.id,
    primaryEventId: primary?.eventId,
    deferredEventIds,
    enrichedBindings: enrichBindings(input.mapGameplayBindings, markers, primary),
    sourceIds: uniqueStrings([
      ...markers.flatMap((marker) => marker.sourceIds),
      ...(primary?.sourceIds ?? []),
    ]),
  };
}
