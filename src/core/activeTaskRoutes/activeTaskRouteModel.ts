import {
  ACTIVE_TASK_ROUTE_SAFE_CENTER_NODE,
  ACTIVE_TASK_ROUTE_VISIBLE_MIN_DAY,
} from './activeTaskRouteConstants';
import type {
  ActiveTaskRouteContext,
  ActiveTaskRouteDomain,
  ActiveTaskRouteModel,
  ActiveTaskRouteNode,
  ActiveTaskRoutePressure,
  ActiveTaskRouteSegment,
  ActiveTaskRouteSource,
  ActiveTaskRouteStage,
  ActiveTaskRouteStatus,
  ActiveTaskRouteTone,
} from './activeTaskRouteTypes';

function normalizeId(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.toLowerCase().replace(/[^a-z0-9_]+/g, '_');
}

function getEvent(context: ActiveTaskRouteContext) {
  return context.activeEvent ?? context.selectedEvent ?? null;
}

function getEventDistrictId(context: ActiveTaskRouteContext): string | undefined {
  const event = getEvent(context);
  return (
    event?.districtIds?.[0] ??
    event?.neighborhoodId ??
    normalizeId(event?.district) ??
    undefined
  );
}

function readString(value: unknown, keys: readonly string[]): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const source = value as Record<string, unknown>;
  for (const key of keys) {
    const item = source[key];
    if (typeof item === 'string' && item.trim().length > 0) return item;
  }
  return undefined;
}

function readBoolean(value: unknown, keys: readonly string[]): boolean {
  if (!value || typeof value !== 'object') return false;
  const source = value as Record<string, unknown>;
  return keys.some((key) => source[key] === true);
}

function hasResourcePressure(value: unknown): boolean {
  const serialized = JSON.stringify(value ?? {}).toLowerCase();
  return ['strained', 'critical', 'tired', 'maintenance_risk', 'busy'].some((token) =>
    serialized.includes(token),
  );
}

function hasCriticalResourcePressure(value: unknown): boolean {
  const serialized = JSON.stringify(value ?? {}).toLowerCase();
  return ['critical', 'maintenance_risk'].some((token) => serialized.includes(token));
}

function hasCrisisSignal(value: unknown): boolean {
  const serialized = JSON.stringify(value ?? {}).toLowerCase();
  return ['active', 'watch', 'elevated', 'critical'].some((token) =>
    serialized.includes(token),
  );
}

function hasCriticalCrisisSignal(value: unknown): boolean {
  const serialized = JSON.stringify(value ?? {}).toLowerCase();
  return ['critical', 'activeincident'].some((token) => serialized.includes(token));
}

function isWeakAssignment(context: ActiveTaskRouteContext): boolean {
  return (
    context.assignment?.compatibilityLabel === 'Zayıf uyum' ||
    (context.assignment?.compatibilityScore ?? 100) < 45
  );
}

export function getActiveTaskRouteStageFromContext(
  context: ActiveTaskRouteContext,
): ActiveTaskRouteStage {
  if (context.isResultPhase || context.assignment?.status === 'processed') return 'completed';
  if (context.isFieldPhase) {
    return context.assignment?.status === 'dispatched' ? 'on_site' : 'en_route';
  }
  if (context.isDispatchPhase && context.assignment?.status === 'confirmed') {
    return 'dispatch_ready';
  }
  if (context.assignment?.status === 'dispatched') return 'en_route';
  if (context.assignment) return 'assigned';
  if (getEvent(context)) return 'planned';
  return context.hasActiveTaskRouteLayer || context.mapLayerContext?.hasActiveTask
    ? 'monitoring'
    : 'planned';
}

export function getActiveTaskRouteDomain(
  context: ActiveTaskRouteContext,
): ActiveTaskRouteDomain {
  const category = getEvent(context)?.category?.toLowerCase() ?? '';
  const eventType = getEvent(context)?.eventType?.toLowerCase() ?? '';
  const focus = context.operationSignals?.dailyFocus;
  const text = `${category} ${eventType}`;

  if (text.includes('container') || text.includes('konteyner') || focus === 'containers') {
    return 'container';
  }
  if (text.includes('vehicle') || text.includes('route') || focus === 'vehicles') {
    return 'vehicle_route';
  }
  if (text.includes('personnel') || text.includes('ekip') || focus === 'personnel') {
    return 'personnel';
  }
  if (text.includes('social') || text.includes('halk')) return 'social';
  if (text.includes('crisis') || text.includes('kriz')) return 'crisis';
  if (focus === 'districts') return 'district_balance';
  return 'generic';
}

export function getActiveTaskRouteTargetDistrictId(
  context: ActiveTaskRouteContext,
): string {
  return (
    getEventDistrictId(context) ??
    normalizeId(readString(context.assignment, ['relatedDistrictId', 'districtId'])) ??
    normalizeId(readString(context.mapLayerContext, ['selectedDistrictId', 'districtId'])) ??
    'merkez'
  );
}

export function getActiveTaskRouteSourceDistrictId(
  context: ActiveTaskRouteContext,
): string {
  return (
    normalizeId(readString(context.assignment, ['sourceDistrictId'])) ??
    normalizeId(readString(context.operationalResources, ['sourceDistrictId'])) ??
    'merkez'
  );
}

export function getActiveTaskRoutePressure(
  context: ActiveTaskRouteContext,
): ActiveTaskRoutePressure {
  if (hasCriticalCrisisSignal(context.crisisState) || hasCriticalResourcePressure(context.operationalResources)) {
    return 'critical';
  }
  if (
    hasCrisisSignal(context.crisisState) ||
    hasResourcePressure(context.operationalResources) ||
    context.operationSignals?.overall.status === 'critical'
  ) {
    return 'high';
  }
  if (isWeakAssignment(context) || context.operationSignals?.overall.status === 'strained') {
    return 'high';
  }
  if (
    context.operationSignals?.overall.status === 'stable' ||
    context.assignment?.compatibilityLabel === 'Güçlü uyum'
  ) {
    return 'low';
  }
  return context.assignment ? 'medium' : 'medium';
}

export function getActiveTaskRouteStatus(
  context: ActiveTaskRouteContext,
): ActiveTaskRouteStatus {
  const stage = getActiveTaskRouteStageFromContext(context);
  const pressure = getActiveTaskRoutePressure(context);
  const hasTask = Boolean(getEvent(context) || context.assignment);

  if (!hasTask && (context.hasActiveTaskRouteLayer || context.mapLayerContext?.hasActiveTask)) {
    return 'preview';
  }
  if (!hasTask) return 'inactive';
  if (stage === 'completed') return 'completed';
  if (pressure === 'critical' && !context.assignment) return 'blocked';
  if (pressure === 'critical') return 'blocked';
  if (pressure === 'high') return context.isFieldPhase || context.isDispatchPhase ? 'strained' : 'delayed';
  if (context.isFieldPhase || stage === 'en_route' || stage === 'on_site' || stage === 'resolving') {
    return 'active';
  }
  if (context.assignment || stage === 'dispatch_ready') return 'ready';
  return 'preview';
}

export function getActiveTaskRouteTone(
  status: ActiveTaskRouteStatus,
  pressure: ActiveTaskRoutePressure,
): ActiveTaskRouteTone {
  if (status === 'completed') return 'positive';
  if (status === 'blocked' || pressure === 'critical') return 'crisis';
  if (status === 'strained' || pressure === 'high') return 'strained';
  if (status === 'delayed' || pressure === 'medium') return 'watch';
  if (pressure === 'low') return 'recovering';
  return 'neutral';
}

export function buildActiveTaskRouteNodes(
  context: ActiveTaskRouteContext,
): ActiveTaskRouteNode[] {
  const targetDistrictId = getActiveTaskRouteTargetDistrictId(context);
  const event = getEvent(context);
  const nodes: ActiveTaskRouteNode[] = [{ ...ACTIVE_TASK_ROUTE_SAFE_CENTER_NODE }];

  if (context.assignment?.vehicleType) {
    nodes.push({
      id: `vehicle_${context.assignment.vehicleType}`,
      type: 'vehicle_group',
      title: 'Araç Grubu',
      shortLabel: 'Araç',
      description: 'Seçili araç grubu rota yönünde hazırlanır.',
      iconKey: 'bus-outline',
      tone: 'neutral',
    });
  }

  if (context.assignment?.personnelType) {
    nodes.push({
      id: `team_${context.assignment.personnelType}`,
      type: 'field_team',
      title: 'Saha Ekibi',
      shortLabel: 'Ekip',
      description: 'Seçili ekip hedef bölgeye yönlendirilir.',
      iconKey: 'people-outline',
      tone: 'neutral',
    });
  }

  if (event || context.assignment || context.hasActiveTaskRouteLayer) {
    nodes.push({
      id: `target_${targetDistrictId}`,
      type: event ? 'event_location' : 'district',
      districtId: targetDistrictId,
      title: event?.district ?? 'Hedef Mahalle',
      shortLabel: event?.district ?? 'Hedef',
      description: event?.title ?? 'Aktif görev hedefi.',
      iconKey: 'location-outline',
      tone: context.assignment ? 'watch' : 'neutral',
    });
  }

  return nodes;
}

export function buildActiveTaskRouteSegments(
  nodes: readonly ActiveTaskRouteNode[],
  context: ActiveTaskRouteContext,
): ActiveTaskRouteSegment[] {
  if (nodes.length < 2) return [];
  const status = getActiveTaskRouteStatus(context);
  const pressure = getActiveTaskRoutePressure(context);
  const tone = getActiveTaskRouteTone(status, pressure);

  return nodes.slice(1).map((node, index) => {
    const from = nodes[index];
    return {
      id: `${from.id}_to_${node.id}`,
      fromNodeId: from.id,
      toNodeId: node.id,
      status,
      pressure,
      label: `${from.shortLabel} → ${node.shortLabel}`,
      helperText: pressure === 'high' || pressure === 'critical'
        ? 'Baskı hattı izleniyor.'
        : 'Saha yönü hazır.',
      tone,
    };
  });
}

function buildSourceSignals(context: ActiveTaskRouteContext): ActiveTaskRouteSource[] {
  const signals: ActiveTaskRouteSource[] = [];
  if (context.activeEvent) signals.push('active_event');
  if (context.assignment) signals.push('assignment');
  if (context.hasActiveTaskRouteLayer || context.mapLayerContext?.hasActiveTask) {
    signals.push('map_layer');
  }
  if (context.operationalResources) signals.push('operational_resource');
  if (context.districtTrustResults) signals.push('district_trust');
  if (context.operationSignals) signals.push('operation_signal');
  if (context.crisisState) signals.push('crisis_state');
  if (signals.length === 0) signals.push('fallback');
  return signals;
}

function buildSummaryLine(context: ActiveTaskRouteContext, status: ActiveTaskRouteStatus): string {
  const event = getEvent(context);
  const target = event?.district ?? 'hedef mahalle';
  if (status === 'inactive') return 'Aktif görev rotası beklemede.';
  if (status === 'preview') return 'Aktif görev rotası saha yönlendirmesi için hazırlanır.';
  if (context.isFieldPhase) return `Ekip ${target} hattında sahaya çıkıyor.`;
  if (context.isDispatchPhase) return `Merkez → ${target} rotası yönlendirmeye hazır.`;
  return `Merkez → ${target} saha yönü izleniyor.`;
}

function buildRiskLine(domain: ActiveTaskRouteDomain, pressure: ActiveTaskRoutePressure): string | undefined {
  if (pressure === 'low') return undefined;
  if (domain === 'vehicle_route') return 'Araç/rota baskısı nedeniyle gecikme riski izleniyor.';
  if (domain === 'personnel') return 'Ekip yükü rotayı baskı altında tutabilir.';
  if (domain === 'social') return 'Sosyal baskı yüksek; görünür müdahale önemli.';
  if (domain === 'crisis') return 'Kriz eşiği izleniyor, rota kontrollü tutulmalı.';
  return pressure === 'critical'
    ? 'Kaynak baskısı yüksek, yönlendirme kontrollü tutulmalı.'
    : 'Rota baskısı izleniyor.';
}

export function shouldShowActiveTaskRoute(
  context: ActiveTaskRouteContext,
  routeModel: ActiveTaskRouteModel,
): boolean {
  const day = context.day ?? getEvent(context)?.day ?? ACTIVE_TASK_ROUTE_VISIBLE_MIN_DAY.preview;
  if (day <= ACTIVE_TASK_ROUTE_VISIBLE_MIN_DAY.hiddenOrPreview) {
    return false;
  }
  if (context.isDispatchPhase || context.isFieldPhase) return routeModel.status !== 'inactive';
  if (context.hasActiveTaskRouteLayer || context.mapLayerContext?.hasActiveTask) return true;
  return day >= ACTIVE_TASK_ROUTE_VISIBLE_MIN_DAY.standard && Boolean(getEvent(context) || context.assignment);
}

export function buildActiveTaskRouteFallback(
  context: ActiveTaskRouteContext = {},
): ActiveTaskRouteModel {
  const nodes = buildActiveTaskRouteNodes(context);
  return {
    id: `active_route_${context.day ?? 'preview'}`,
    status: 'inactive',
    stage: 'planned',
    pressure: 'medium',
    tone: 'neutral',
    domain: 'generic',
    sourceDistrictId: 'merkez',
    targetDistrictId: 'merkez',
    nodes,
    segments: [],
    sourceSignals: ['fallback'],
    title: 'Aktif Görev Rotası',
    summaryLine: 'Aktif görev rotası beklemede.',
    routeNote: 'Aktif görev rotası, seçili operasyonun saha yönünü gösterir.',
    isVisibleToPlayer: false,
    isPreviewOnly: true,
  };
}

export function buildActiveTaskRouteModel(
  context: ActiveTaskRouteContext = {},
): ActiveTaskRouteModel {
  const stage = getActiveTaskRouteStageFromContext(context);
  const status = getActiveTaskRouteStatus(context);
  const pressure = getActiveTaskRoutePressure(context);
  const domain = getActiveTaskRouteDomain(context);
  const tone = getActiveTaskRouteTone(status, pressure);
  const nodes = buildActiveTaskRouteNodes(context);
  const segments = buildActiveTaskRouteSegments(nodes, context);
  const sourceDistrictId = getActiveTaskRouteSourceDistrictId(context);
  const targetDistrictId = getActiveTaskRouteTargetDistrictId(context);
  const routeModel: ActiveTaskRouteModel = {
    id: `active_route_${getEvent(context)?.id ?? context.assignment?.eventId ?? targetDistrictId}`,
    status,
    stage,
    pressure,
    tone,
    domain,
    sourceDistrictId,
    targetDistrictId,
    nodes,
    segments,
    sourceSignals: buildSourceSignals(context),
    title: 'Aktif Görev Rotası',
    summaryLine: buildSummaryLine(context, status),
    routeNote: 'Aktif görev rotası, seçili operasyonun hedef mahallesini gösterir.',
    etaLabel: status === 'active' || status === 'ready' ? 'Saha yönü hazır' : undefined,
    riskLine: buildRiskLine(domain, pressure),
    isVisibleToPlayer: false,
    isPreviewOnly: !context.hasActiveTaskRouteLayer && !context.mapLayerContext?.hasActiveTask,
  };

  return {
    ...routeModel,
    isVisibleToPlayer: shouldShowActiveTaskRoute(context, routeModel),
    isPreviewOnly:
      routeModel.isPreviewOnly ||
      (context.day ?? getEvent(context)?.day ?? 1) < ACTIVE_TASK_ROUTE_VISIBLE_MIN_DAY.standard,
  };
}

export function getActiveTaskRouteMapLayerContext(routeModel: ActiveTaskRouteModel) {
  return {
    hasActiveTask: routeModel.status !== 'inactive' && routeModel.nodes.length >= 2,
    routeStatus: routeModel.status,
    routePressure: routeModel.pressure,
  } as const;
}

export function activeTaskRouteContextHasCompletedSignal(
  context: ActiveTaskRouteContext,
): boolean {
  return context.isResultPhase === true || context.assignment?.status === 'processed';
}

export function activeTaskRouteContextHasWeakFit(
  context: ActiveTaskRouteContext,
): boolean {
  return isWeakAssignment(context) || readBoolean(context.assignment, ['weakFit']);
}
