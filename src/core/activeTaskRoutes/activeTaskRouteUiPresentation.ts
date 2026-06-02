import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';
import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  ACTIVE_TASK_ROUTE_UI_FORBIDDEN_COPY_TERMS,
  ACTIVE_TASK_ROUTE_UI_MAX_STEPS,
  ACTIVE_TASK_ROUTE_UI_MOBILE_COPY_LENGTH,
  ACTIVE_TASK_ROUTE_UI_VISIBLE_MIN_DAY,
  getActiveTaskRouteUiPhaseDefinition,
} from './activeTaskRouteUiConstants';
import {
  buildActiveTaskRouteFallback,
  buildActiveTaskRouteModel,
} from './activeTaskRouteModel';
import type { ActiveTaskRouteModel } from './activeTaskRouteTypes';
import type {
  CreviaActiveRouteRankVisibility,
  CreviaActiveTaskRouteDistrictNode,
  CreviaActiveTaskRouteHealthStatus,
  CreviaActiveTaskRoutePhase,
  CreviaActiveTaskRouteResourceNode,
  CreviaActiveTaskRouteStatus,
  CreviaActiveTaskRouteStep,
  CreviaActiveTaskRouteUiContext,
  CreviaActiveTaskRouteUiModel,
  CreviaActiveTaskRouteVisibility,
} from './activeTaskRouteUiTypes';

function districtLabel(id: string): string {
  const normalized = normalizeMapDistrictId(id) ?? 'merkez';
  return DISTRICT_IDENTITIES[normalized]?.name ?? normalized;
}

function clampCopy(text: string, max = ACTIVE_TASK_ROUTE_UI_MOBILE_COPY_LENGTH): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function activeTaskRouteUiCopyContainsForbiddenTerms(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return ACTIVE_TASK_ROUTE_UI_FORBIDDEN_COPY_TERMS.some((term) => normalized.includes(term));
}

function safeCopy(text: string, fallback: string): string {
  const clamped = clampCopy(text);
  if (activeTaskRouteUiCopyContainsForbiddenTerms(clamped)) return clampCopy(fallback);
  return clamped;
}

function resolveUiPhase(
  route: ActiveTaskRouteModel,
  context: CreviaActiveTaskRouteUiContext,
): CreviaActiveTaskRoutePhase {
  const stage = route.stage;
  if (route.status === 'strained' || route.status === 'delayed' || route.pressure === 'high') {
    if (context.isFieldPhase || context.isDispatchPhase) return 'risk_watch';
  }
  if (stage === 'delayed' || route.status === 'delayed') return 'delayed';
  if (stage === 'completed' || route.status === 'completed') return 'completed';
  if (stage === 'resolving') return 'resolving';
  if (stage === 'on_site') return 'on_site';
  if (stage === 'en_route') return 'en_route';
  if (stage === 'dispatch_ready' || route.status === 'ready') return 'dispatch_ready';
  return 'planned';
}

function resolveUiStatus(
  route: ActiveTaskRouteModel,
  visible: boolean,
): CreviaActiveTaskRouteStatus {
  if (!visible || route.status === 'inactive') return 'hidden';
  if (route.status === 'completed') return 'completed';
  if (route.status === 'strained' || route.status === 'delayed') return 'watch';
  if (route.status === 'active') return 'active';
  if (route.status === 'ready') return 'ready';
  return 'planned';
}

function resolveHealthStatus(route: ActiveTaskRouteModel, visible: boolean): CreviaActiveTaskRouteHealthStatus {
  if (!visible) return 'hidden';
  if (route.pressure === 'critical' || route.status === 'blocked') return 'strained';
  if (route.pressure === 'high' || route.status === 'strained') return 'watch';
  return 'healthy';
}

export function buildActiveRouteRankVisibility(
  context: CreviaActiveTaskRouteUiContext = {},
): CreviaActiveRouteRankVisibility {
  const day = context.day ?? 1;
  const rankKey = context.rankKey ?? context.currentRankKey ?? '';
  const permissions = context.unlockedPermissionIds ?? [];

  if (day <= ACTIVE_TASK_ROUTE_UI_VISIBLE_MIN_DAY.hidden) {
    return { mode: 'hidden', showSteps: false, showResourceLink: false, showTrustMemoryLink: false };
  }

  if (
    rankKey.includes('director') ||
    rankKey.includes('chief') ||
    permissions.includes('active_task_route')
  ) {
    return { mode: 'detailed', showSteps: true, showResourceLink: true, showTrustMemoryLink: true };
  }

  if (day >= ACTIVE_TASK_ROUTE_UI_VISIBLE_MIN_DAY.standard) {
    return { mode: 'standard', showSteps: true, showResourceLink: false, showTrustMemoryLink: false };
  }

  return { mode: 'compact', showSteps: false, showResourceLink: false, showTrustMemoryLink: false };
}

export function buildActiveTaskRouteVisibility(
  context: CreviaActiveTaskRouteUiContext = {},
  route: ActiveTaskRouteModel,
): CreviaActiveTaskRouteVisibility {
  const day = context.day ?? 1;
  const rankVisibility = buildActiveRouteRankVisibility(context);
  const isPostPilot =
    context.isPostPilot === true || day >= POST_PILOT_FIRST_OPERATION_DAY;

  if (day <= ACTIVE_TASK_ROUTE_UI_VISIBLE_MIN_DAY.hidden || route.status === 'inactive') {
    return {
      mode: 'hidden',
      showSteps: false,
      showResourceWarning: false,
      maxSteps: 0,
      showMapHint: false,
    };
  }

  if (day <= ACTIVE_TASK_ROUTE_UI_VISIBLE_MIN_DAY.compact) {
    return {
      mode: 'compact',
      showSteps: false,
      showResourceWarning: route.pressure === 'high' || route.pressure === 'critical',
      maxSteps: 2,
      showMapHint: false,
    };
  }

  return {
    mode: rankVisibility.mode === 'detailed' ? 'detailed' : 'standard',
    showSteps: rankVisibility.showSteps,
    showResourceWarning: route.pressure === 'high' || route.pressure === 'critical',
    maxSteps: ACTIVE_TASK_ROUTE_UI_MAX_STEPS,
    showMapHint: isPostPilot || context.hasActiveRouteLayer === true || context.isMapSurface === true,
  };
}

function personnelLabel(type?: string): string {
  if (!type) return 'Ekip';
  if (type.includes('field')) return 'Saha ekibi';
  if (type.includes('route')) return 'Rota ekibi';
  return 'Ekip';
}

function vehicleLabel(type?: string): string {
  if (!type) return 'Araç';
  if (type.includes('route')) return 'Rota aracı';
  if (type.includes('support')) return 'Destek aracı';
  return 'Araç';
}

export function buildActiveTaskRouteDistrictNode(
  context: CreviaActiveTaskRouteUiContext,
): CreviaActiveTaskRouteDistrictNode[] {
  const route = buildActiveTaskRouteModel(context);
  const targetId = route.targetDistrictId ?? 'merkez';
  const sourceId = route.sourceDistrictId ?? 'merkez';
  return [
    {
      districtId: sourceId,
      label: districtLabel(sourceId),
      role: 'source',
      tone: 'neutral',
    },
    {
      districtId: targetId,
      label: districtLabel(targetId),
      role: 'target',
      tone: 'teal',
    },
  ];
}

export function buildActiveTaskRouteResourceNode(
  context: CreviaActiveTaskRouteUiContext,
): CreviaActiveTaskRouteResourceNode[] {
  const nodes: CreviaActiveTaskRouteResourceNode[] = [];
  if (context.assignment?.personnelType) {
    nodes.push({
      kind: 'personnel',
      label: personnelLabel(context.assignment.personnelType),
      shortLabel: 'Ekip',
      tone: 'mint',
    });
  }
  if (context.assignment?.vehicleType) {
    nodes.push({
      kind: 'vehicle',
      label: vehicleLabel(context.assignment.vehicleType),
      shortLabel: 'Araç',
      tone: 'gold',
    });
  }
  return nodes;
}

function stepActiveIndex(phase: CreviaActiveTaskRoutePhase): number {
  switch (phase) {
    case 'planned':
      return 0;
    case 'dispatch_ready':
      return 1;
    case 'en_route':
    case 'risk_watch':
    case 'delayed':
      return 2;
    case 'on_site':
    case 'resolving':
      return 3;
    case 'completed':
      return 3;
    default:
      return 0;
  }
}

export function buildActiveTaskRouteSteps(
  context: CreviaActiveTaskRouteUiContext,
  phase: CreviaActiveTaskRoutePhase,
): CreviaActiveTaskRouteStep[] {
  const route = buildActiveTaskRouteModel(context);
  const target =
    route.nodes[route.nodes.length - 1]?.shortLabel ?? districtLabel(route.targetDistrictId ?? 'merkez');
  const vehicle = vehicleLabel(context.assignment?.vehicleType);
  const team = personnelLabel(context.assignment?.personnelType);

  const rawSteps: CreviaActiveTaskRouteStep[] = [
    {
      id: 'prep',
      label: `${team} hazırlanıyor`,
      shortLabel: 'Hazırlık',
      order: 0,
      isActive: false,
      isComplete: false,
    },
    {
      id: 'dispatch',
      label: `${vehicle} ${target} hattına yönlendi`,
      shortLabel: 'Yönlendirme',
      order: 1,
      isActive: false,
      isComplete: false,
    },
    {
      id: 'onsite',
      label: `Saha ekibi ${target} çevresinde`,
      shortLabel: 'Sahada',
      order: 2,
      isActive: false,
      isComplete: false,
    },
    {
      id: 'resolve',
      label: 'Son kontrol rapora taşınacak',
      shortLabel: 'Son kontrol',
      order: 3,
      isActive: false,
      isComplete: false,
    },
  ];

  const activeIndex = stepActiveIndex(phase);
  return rawSteps.slice(0, ACTIVE_TASK_ROUTE_UI_MAX_STEPS).map((step, index) => ({
    ...step,
    isActive: index === activeIndex && phase !== 'completed',
    isComplete: index < activeIndex || phase === 'completed',
  }));
}

function buildSurfaceLine(
  phase: CreviaActiveTaskRoutePhase,
  surface: 'map' | 'dispatch' | 'field' | 'report',
  context: CreviaActiveTaskRouteUiContext,
  route: ActiveTaskRouteModel,
): string {
  const def = getActiveTaskRouteUiPhaseDefinition(phase);
  const target =
    route.nodes[route.nodes.length - 1]?.shortLabel ?? districtLabel(route.targetDistrictId ?? 'merkez');
  const team = personnelLabel(context.assignment?.personnelType);
  const vehicle = vehicleLabel(context.assignment?.vehicleType);

  let line = def.mapLineIntent;
  if (surface === 'dispatch') line = def.dispatchLineIntent;
  if (surface === 'field') line = def.fieldLineIntent;
  if (surface === 'report') line = def.reportLineIntent;

  if (surface === 'dispatch' && context.assignment) {
    line = `${team} · ${vehicle} → ${target}: ${def.shortLabel.toLocaleLowerCase('tr-TR')}.`;
  } else if (surface === 'field') {
    line = `${target}: ${def.fieldLineIntent}`;
  } else if (surface === 'map') {
    line = `${target} — ${def.mapLineIntent}`;
  }

  if (route.summaryLine && surface === 'map' && phase !== 'planned') {
    line = route.summaryLine.includes(target) ? route.summaryLine : line;
  }

  return safeCopy(line, `${target}: saha yönü izleniyor.`);
}

function buildResourceWarningLine(route: ActiveTaskRouteModel): string | undefined {
  if (route.pressure !== 'high' && route.pressure !== 'critical') return undefined;
  const line =
    route.riskLine ??
    (route.domain === 'vehicle_route'
      ? 'Araç/rota baskısı rotayı yavaşlatabilir.'
      : 'Kaynak baskısı rotayı izlemeyi gerektiriyor.');
  return safeCopy(line, 'Kaynak baskısı rotayı izlemeyi gerektiriyor.');
}

export function buildActiveTaskRouteForEvent(
  context: CreviaActiveTaskRouteUiContext = {},
): CreviaActiveTaskRouteUiModel {
  return buildActiveTaskRouteUiModel({
    ...context,
    activeEvent: context.activeEvent ?? context.selectedEvent,
  });
}

export function buildActiveTaskRouteForAssignment(
  context: CreviaActiveTaskRouteUiContext = {},
): CreviaActiveTaskRouteUiModel {
  return buildActiveTaskRouteUiModel(context);
}

export function buildActiveTaskRouteUiModel(
  context: CreviaActiveTaskRouteUiContext = {},
): CreviaActiveTaskRouteUiModel {
  const route =
    context.activeEvent || context.selectedEvent || context.assignment
      ? buildActiveTaskRouteModel(context)
      : buildActiveTaskRouteFallback(context);

  const visible = route.isVisibleToPlayer && route.status !== 'inactive';
  const visibility = buildActiveTaskRouteVisibility(context, route);
  const phase = resolveUiPhase(route, context);
  const status = resolveUiStatus(route, visible && visibility.mode !== 'hidden');
  const healthStatus = resolveHealthStatus(route, visible && visibility.mode !== 'hidden');
  const steps = buildActiveTaskRouteSteps(context, phase).slice(0, visibility.maxSteps || ACTIVE_TASK_ROUTE_UI_MAX_STEPS);
  const activeStepIndex = stepActiveIndex(phase);
  const targetDistrictLabel = districtLabel(route.targetDistrictId ?? 'merkez');

  const dispatchLine = buildSurfaceLine(phase, 'dispatch', context, route);
  const fieldLine = buildSurfaceLine(phase, 'field', context, route);
  const mapLine = buildSurfaceLine(phase, 'map', context, route);
  const reportLine = buildSurfaceLine(phase, 'report', context, route);
  const def = getActiveTaskRouteUiPhaseDefinition(phase);
  const statusLine = safeCopy(`${def.shortLabel}: ${route.summaryLine}`, route.summaryLine);

  return {
    id: route.id,
    phase,
    status,
    healthStatus,
    visibility,
    routeModel: route,
    steps,
    districtNodes: buildActiveTaskRouteDistrictNode(context),
    resourceNodes: buildActiveTaskRouteResourceNode(context),
    dispatchLine,
    fieldLine,
    mapLine,
    reportLine,
    statusLine,
    resourceWarningLine: visibility.showResourceWarning
      ? buildResourceWarningLine(route)
      : undefined,
    teamLabel: context.assignment?.personnelType
      ? personnelLabel(context.assignment.personnelType)
      : undefined,
    vehicleLabel: context.assignment?.vehicleType
      ? vehicleLabel(context.assignment.vehicleType)
      : undefined,
    targetDistrictLabel,
    activeStepIndex,
    visible: visible && visibility.mode !== 'hidden',
    isHintOnly: true,
  };
}

export function buildActiveTaskRouteMapLine(
  context: CreviaActiveTaskRouteUiContext = {},
): string | undefined {
  const model = buildActiveTaskRouteUiModel({ ...context, isMapSurface: true });
  if (!model.visible || !model.visibility.showMapHint) return undefined;
  return model.mapLine;
}

export function buildActiveTaskRouteDebugRows(
  context: CreviaActiveTaskRouteUiContext = {},
): string[] {
  const model = buildActiveTaskRouteUiModel(context);
  return [
    `visible: ${model.visible}`,
    `phase: ${model.phase}`,
    `status: ${model.status}`,
    `health: ${model.healthStatus}`,
    `steps: ${model.steps.length}`,
    `target: ${model.targetDistrictLabel ?? 'n/a'}`,
    `dispatch: ${model.dispatchLine.slice(0, 48)}`,
    `field: ${model.fieldLine.slice(0, 48)}`,
    `map: ${model.mapLine.slice(0, 48)}`,
  ];
}

export function shouldSuppressMapOperationHintForActiveRoute(
  context: CreviaActiveTaskRouteUiContext = {},
): boolean {
  const model = buildActiveTaskRouteUiModel({ ...context, isMapSurface: true });
  return model.visible && model.visibility.showMapHint && model.phase !== 'planned';
}

export function validateActiveTaskRouteUiCopy(model: CreviaActiveTaskRouteUiModel): boolean {
  const lines = [
    model.dispatchLine,
    model.fieldLine,
    model.mapLine,
    model.reportLine,
    model.statusLine,
    model.resourceWarningLine,
  ].filter(Boolean) as string[];

  if (model.steps.length > ACTIVE_TASK_ROUTE_UI_MAX_STEPS) return false;

  for (const line of lines) {
    if (line.length > ACTIVE_TASK_ROUTE_UI_MOBILE_COPY_LENGTH + 1) return false;
    if (activeTaskRouteUiCopyContainsForbiddenTerms(line)) return false;
  }
  return true;
}
