import type { AuthorityGameplayEffectSnapshot } from '@/core/authorityGameplayExpansion/authorityGameplayEffectTypes';
import {
  applyAuthorityToMapMarkerFeedback,
  authorityCtaForStatus,
  buildAuthorityDeferMitigationLine,
} from '@/core/authorityGameplayExpansion/authorityGameplayEffectModel';
import type { OperationPortfolioItem } from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioTypes';
import type { MapGameplayRuntimeFeedbackResult } from '@/core/mapGameplayBinding/mapGameplayRuntimeFeedbackTypes';
import type { MapMarkerPortfolioStatus } from '@/core/mapGameplayBinding/mapGameplayRuntimeFeedbackTypes';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import type {
  ActiveOperationMapBinding,
  ActiveOperationMapPhase,
} from './activeOperationMapBindingTypes';

const TEXT_LIMIT = 72;

export type OperationActionSource =
  | 'explicit_active'
  | 'portfolio_selected'
  | 'portfolio_recommended'
  | 'map_binding'
  | 'deferred_watch'
  | 'fallback';

export type OperationActionPresentation = {
  statusLabel: string;
  ctaLabel: string;
  explanationLine: string;
  riskLine?: string;
  authorityLine?: string;
  deferLine?: string;
  isStartable: boolean;
  isInspectable: boolean;
  tone: 'neutral' | 'positive' | 'warning' | 'locked';
  badgeLabel: string;
};

export type ActiveOperationIdentity = {
  eventId?: string;
  districtId?: string;
  operationKind?: string;
  source: OperationActionSource;
  status: MapMarkerPortfolioStatus;
  priority: number;
  isStartable: boolean;
  isInspectable: boolean;
  isDeferred: boolean;
  isBlockedByCapacity: boolean;
  explanationLine: string;
  ctaLabel: string;
};

export type ResolveOperationActionPresentationInput = {
  status: MapMarkerPortfolioStatus;
  phase?: ActiveOperationMapPhase;
  day?: number;
  authorityEffectSnapshot?: AuthorityGameplayEffectSnapshot | null;
  portfolioItem?: OperationPortfolioItem;
  mitigationLine?: string;
  portfolioDeferLine?: string;
  explanationSeed?: string;
};

export type ResolveActiveOperationIdentityInput = {
  day: number;
  explicitEventId?: string;
  binding?: ActiveOperationMapBinding | null;
  runtimeFeedback?: MapGameplayRuntimeFeedbackResult | null;
  deferredEventIds?: string[];
  portfolioItem?: OperationPortfolioItem;
};

function clampLine(value: string, max = TEXT_LIMIT): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

export function statusLabelForPortfolioStatus(status: MapMarkerPortfolioStatus): string {
  switch (status) {
    case 'active':
      return 'Aktif operasyon';
    case 'today_focus':
      return 'Bugunun odagi';
    case 'recommended':
      return 'Onerilen aday';
    case 'deferred':
      return 'Yarin icin izleniyor';
    case 'blocked_by_capacity':
      return 'Kapasite disi';
    case 'watch':
      return 'Izleniyor';
    case 'completed':
      return 'Tamamlandi';
    case 'locked':
      return 'Kilitli';
    default:
      return 'Operasyon';
  }
}

export function badgeLabelForPortfolioStatus(status: MapMarkerPortfolioStatus): string {
  switch (status) {
    case 'active':
      return 'Aktif';
    case 'today_focus':
      return 'Bugun';
    case 'recommended':
      return 'Oneri';
    case 'deferred':
      return 'Ertelendi';
    case 'blocked_by_capacity':
      return 'Kapasite';
    case 'watch':
      return 'Izle';
    case 'completed':
      return 'Tamam';
    case 'locked':
      return 'Kilit';
    default:
      return 'Sinyal';
  }
}

export function toneForPortfolioStatus(
  status: MapMarkerPortfolioStatus,
): OperationActionPresentation['tone'] {
  switch (status) {
    case 'active':
    case 'today_focus':
    case 'recommended':
      return 'positive';
    case 'deferred':
    case 'blocked_by_capacity':
      return 'warning';
    case 'locked':
      return 'locked';
    default:
      return 'neutral';
  }
}

export function ctaLabelForPortfolioStatus(
  status: MapMarkerPortfolioStatus,
  phase?: ActiveOperationMapPhase,
): string {
  switch (status) {
    case 'active':
    case 'today_focus':
      if (phase === 'planning' || phase === 'dispatch_ready') return 'Planla';
      if (phase === 'dispatching' || phase === 'field_active') return 'Ekibi yonlendir';
      return 'Operasyonu incele';
    case 'recommended':
      return 'Onceliklendir';
    case 'deferred':
      return 'Yarin icin izle';
    case 'blocked_by_capacity':
      return 'Kapasiteyi kontrol et';
    case 'watch':
      return 'Plani gor';
    case 'completed':
      return 'Sonucu gor';
    case 'locked':
      return 'Yetki gerekli';
    default:
      return 'Incele';
  }
}

export function resolvePortfolioMarkerStatus(params: {
  eventId: string;
  item?: OperationPortfolioItem;
  deferredSet: Set<string>;
  explicitActiveEventId?: string;
  activeOperationBinding?: ActiveOperationMapBinding | null;
}): MapMarkerPortfolioStatus {
  const { eventId, item, deferredSet, explicitActiveEventId, activeOperationBinding } = params;
  const isExplicitActive =
    eventId === explicitActiveEventId || eventId === activeOperationBinding?.eventId;
  const phase =
    activeOperationBinding?.eventId === eventId ? activeOperationBinding.phase : undefined;

  if (phase === 'completed' || phase === 'result_trace_available') return 'completed';
  if (item?.status === 'locked') return 'locked';
  if (deferredSet.has(eventId) || item?.status === 'deferred') {
    return deferredSet.has(eventId) ? 'blocked_by_capacity' : 'deferred';
  }
  if (isExplicitActive) return 'active';
  if (item?.status === 'selected') return 'today_focus';
  if (item?.status === 'available' && (item.priority >= 55 || item.isMapRecommended)) {
    return 'recommended';
  }
  if (item?.status === 'watch_only') return 'watch';
  if (item?.status === 'available') return 'watch';
  return 'watch';
}

function authorityLineForStatus(
  status: MapMarkerPortfolioStatus,
  snapshot?: AuthorityGameplayEffectSnapshot | null,
): string | undefined {
  if (!snapshot || snapshot.mode !== 'active') return undefined;
  if (status === 'deferred' || status === 'blocked_by_capacity') {
    return clampLine('Yetki avantaji: erteleme etkisi gorunur.');
  }
  if (status === 'active' || status === 'today_focus' || status === 'recommended') {
    return clampLine('Yetki avantaji: oncelik daha net okunuyor.');
  }
  if (status === 'watch') {
    return clampLine('Yetki avantaji: bolge baskisi daha acik.');
  }
  return undefined;
}

function explanationForStatus(
  status: MapMarkerPortfolioStatus,
  item?: OperationPortfolioItem,
  portfolioDeferLine?: string,
  seed?: string,
): string {
  if (seed?.trim()) return clampLine(seed);
  if (status === 'blocked_by_capacity') {
    return clampLine(
      item?.deferRiskLine ?? portfolioDeferLine ?? 'Bugunku kapasite dolu; bu operasyon bugun baslamaz.',
    );
  }
  if (status === 'deferred') {
    return clampLine(item?.deferRiskLine ?? portfolioDeferLine ?? 'Yarin icin izlenen operasyon baskisi.');
  }
  if (status === 'today_focus' || status === 'active') {
    return clampLine(item?.selectBenefitLine ?? 'Bugunun odak operasyonu.');
  }
  if (status === 'recommended') {
    return clampLine(item?.recommendedReason ?? 'Oncelikli aday.');
  }
  if (status === 'locked') {
    return clampLine(item?.authorityTeaserLine ?? 'Yetki acilinca detay gorunur.');
  }
  return clampLine(item?.recommendedReason ?? 'Izleniyor.');
}

export function resolveOperationActionPresentation(
  input: ResolveOperationActionPresentationInput,
): OperationActionPresentation {
  const status = input.status;
  const phase = input.phase;
  const isStartable =
    status === 'active' || status === 'today_focus' || status === 'recommended';
  const isInspectable =
    isStartable ||
    status === 'deferred' ||
    status === 'blocked_by_capacity' ||
    status === 'watch' ||
    status === 'completed';

  let ctaLabel = ctaLabelForPortfolioStatus(status, phase);
  const authorityCta = authorityCtaForStatus(status, input.authorityEffectSnapshot);
  if (authorityCta && !isStartable) {
    ctaLabel = authorityCta;
  }

  const mitigationLine =
    input.mitigationLine ??
    (input.portfolioItem
      ? buildAuthorityDeferMitigationLine(input.portfolioItem, input.authorityEffectSnapshot)
      : undefined);

  const explanationLine = explanationForStatus(
    status,
    input.portfolioItem,
    input.portfolioDeferLine,
    input.explanationSeed,
  );

  const authorityLine = authorityLineForStatus(status, input.authorityEffectSnapshot);

  return {
    statusLabel: statusLabelForPortfolioStatus(status),
    ctaLabel,
    explanationLine,
    riskLine: input.portfolioItem?.deferRiskLine
      ? clampLine(input.portfolioItem.deferRiskLine)
      : undefined,
    authorityLine,
    deferLine:
      status === 'deferred' || status === 'blocked_by_capacity'
        ? mitigationLine ?? input.portfolioDeferLine
        : undefined,
    isStartable,
    isInspectable,
    tone: toneForPortfolioStatus(status),
    badgeLabel: badgeLabelForPortfolioStatus(status),
  };
}

function sourceRank(source: OperationActionSource): number {
  switch (source) {
    case 'explicit_active':
      return 6;
    case 'portfolio_selected':
      return 5;
    case 'portfolio_recommended':
      return 4;
    case 'map_binding':
      return 3;
    case 'deferred_watch':
      return 2;
    default:
      return 1;
  }
}

function bindingStatus(binding: ActiveOperationMapBinding): MapMarkerPortfolioStatus {
  if (binding.phase === 'completed' || binding.phase === 'result_trace_available') {
    return 'completed';
  }
  return 'active';
}

export function resolveActiveOperationIdentity(
  input: ResolveActiveOperationIdentityInput,
): ActiveOperationIdentity | null {
  const deferredSet = new Set(input.deferredEventIds ?? input.runtimeFeedback?.deferredEventIds ?? []);
  const eventId =
    input.explicitEventId ??
    input.binding?.eventId ??
    input.runtimeFeedback?.primaryEventId;
  if (!eventId && !input.binding?.eventId) return null;

  const resolvedEventId = eventId ?? input.binding?.eventId;
  if (!resolvedEventId) return null;

  const marker = input.runtimeFeedback?.markers.find((entry) => entry.eventId === resolvedEventId);
  const portfolioItem = input.portfolioItem;

  if (deferredSet.has(resolvedEventId)) {
    const presentation = resolveOperationActionPresentation({
      status: 'blocked_by_capacity',
      phase: input.binding?.phase,
      day: input.day,
      portfolioItem,
    });
    return {
      eventId: resolvedEventId,
      districtId: marker?.districtId ?? input.binding?.districtId,
      operationKind: portfolioItem?.kind,
      source: 'deferred_watch',
      status: 'blocked_by_capacity',
      priority: marker?.priority ?? 36,
      isStartable: false,
      isInspectable: true,
      isDeferred: true,
      isBlockedByCapacity: true,
      explanationLine: presentation.explanationLine,
      ctaLabel: presentation.ctaLabel,
    };
  }

  if (input.binding?.eventId === resolvedEventId && input.binding.phase !== 'unknown') {
    const status = marker?.status ?? bindingStatus(input.binding);
    const presentation = resolveOperationActionPresentation({
      status,
      phase: input.binding.phase,
      day: input.day,
      portfolioItem,
    });
    return {
      eventId: resolvedEventId,
      districtId: input.binding.districtId ?? marker?.districtId,
      operationKind: portfolioItem?.kind,
      source: 'explicit_active',
      status,
      priority: Math.max(input.binding.priority, marker?.priority ?? 0, 70),
      isStartable: presentation.isStartable,
      isInspectable: presentation.isInspectable,
      isDeferred: false,
      isBlockedByCapacity: false,
      explanationLine: presentation.explanationLine,
      ctaLabel: presentation.ctaLabel,
    };
  }

  if (marker) {
    const source: OperationActionSource =
      marker.status === 'recommended'
        ? 'portfolio_recommended'
        : marker.status === 'deferred' || marker.status === 'blocked_by_capacity'
          ? 'deferred_watch'
          : 'portfolio_selected';
    return {
      eventId: resolvedEventId,
      districtId: marker.districtId,
      operationKind: portfolioItem?.kind,
      source,
      status: marker.status,
      priority: marker.priority,
      isStartable: marker.isStartable,
      isInspectable: marker.isInspectable,
      isDeferred: marker.status === 'deferred',
      isBlockedByCapacity: marker.status === 'blocked_by_capacity',
      explanationLine: marker.explanationLine,
      ctaLabel: marker.ctaLabel,
    };
  }

  if (input.day < POST_PILOT_FIRST_OPERATION_DAY) {
    if (!input.binding || input.binding.phase === 'unknown') return null;
    const status = bindingStatus(input.binding);
    const presentation = resolveOperationActionPresentation({
      status,
      phase: input.binding.phase,
      day: input.day,
    });
    return {
      eventId: input.binding.eventId,
      districtId: input.binding.districtId,
      source: 'map_binding',
      status,
      priority: input.binding.priority,
      isStartable: presentation.isStartable,
      isInspectable: presentation.isInspectable,
      isDeferred: false,
      isBlockedByCapacity: false,
      explanationLine: presentation.explanationLine,
      ctaLabel: presentation.ctaLabel,
    };
  }

  const primaryMarker = input.runtimeFeedback?.markers.find(
    (entry) => entry.id === input.runtimeFeedback?.primaryMarkerId,
  );
  if (primaryMarker) {
    return {
      eventId: primaryMarker.eventId,
      districtId: primaryMarker.districtId,
      operationKind: portfolioItem?.kind,
      source:
        primaryMarker.status === 'recommended' ? 'portfolio_recommended' : 'portfolio_selected',
      status: primaryMarker.status,
      priority: primaryMarker.priority,
      isStartable: primaryMarker.isStartable,
      isInspectable: primaryMarker.isInspectable,
      isDeferred: primaryMarker.status === 'deferred',
      isBlockedByCapacity: primaryMarker.status === 'blocked_by_capacity',
      explanationLine: primaryMarker.explanationLine,
      ctaLabel: primaryMarker.ctaLabel,
    };
  }

  return null;
}

export function pickHigherPriorityIdentity(
  a: ActiveOperationIdentity | null,
  b: ActiveOperationIdentity | null,
): ActiveOperationIdentity | null {
  if (!a) return b;
  if (!b) return a;
  const rankDiff = sourceRank(a.source) - sourceRank(b.source);
  if (rankDiff !== 0) return rankDiff > 0 ? a : b;
  return a.priority >= b.priority ? a : b;
}

export function buildPortfolioMarkerFeedbackBase(params: {
  eventId: string;
  item?: OperationPortfolioItem;
  deferredSet: Set<string>;
  explicitActiveEventId?: string;
  activeOperationBinding?: ActiveOperationMapBinding | null;
  portfolioDeferLine?: string;
  authorityEffectSnapshot?: AuthorityGameplayEffectSnapshot | null;
  mitigationLine?: string;
}) {
  const status = resolvePortfolioMarkerStatus({
    eventId: params.eventId,
    item: params.item,
    deferredSet: params.deferredSet,
    explicitActiveEventId: params.explicitActiveEventId,
    activeOperationBinding: params.activeOperationBinding,
  });
  const phase =
    params.activeOperationBinding?.eventId === params.eventId
      ? params.activeOperationBinding.phase
      : undefined;

  const presentation = resolveOperationActionPresentation({
    status,
    phase,
    portfolioItem: params.item,
    portfolioDeferLine: params.portfolioDeferLine,
    authorityEffectSnapshot: params.authorityEffectSnapshot,
    mitigationLine: params.mitigationLine,
  });

  const priorityBase = params.item?.priority ?? 40;
  const priorityBoost =
    status === 'active'
      ? 100
      : status === 'today_focus'
        ? 92
        : status === 'recommended'
          ? 70
          : status === 'blocked_by_capacity' || status === 'deferred'
            ? 38
            : 30;
  const priority = Math.max(0, Math.min(100, Math.max(priorityBase, priorityBoost)));

  return {
    status,
    presentation,
    priority,
    phase,
    sourceIds: uniqueStrings([
      params.eventId,
      ...(params.item?.sourceIds ?? []),
      `map_runtime_${status}`,
    ]),
  };
}

export { applyAuthorityToMapMarkerFeedback, authorityCtaForStatus };
