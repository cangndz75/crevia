import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import {
  buildTeamSpecializationFitResults,
  getBestTeamSpecializationForAssignment,
} from '@/core/teamSpecialization/teamSpecializationModel';
import type { TeamSpecializationContext } from '@/core/teamSpecialization/teamSpecializationTypes';

import {
  VEHICLE_MAINTENANCE_MIN_DAY_VISIBILITY,
  VEHICLE_MAINTENANCE_RISK_THRESHOLDS,
  VEHICLE_MAINTENANCE_SAFE_FALLBACK_SCORE,
  VEHICLE_MAINTENANCE_SCORE_RANGE,
} from './vehicleMaintenanceConstants';
import {
  buildVehicleMaintenanceRecommendationLine,
  buildVehicleMaintenanceRiskLine,
  buildVehicleMaintenanceSummaryLine,
  buildVehicleMaintenanceTradeoffLine,
} from './vehicleMaintenancePresentation';
import type {
  VehicleMaintenanceContext,
  VehicleMaintenancePressureDomain,
  VehicleMaintenanceRiskLevel,
  VehicleMaintenanceSignalSource,
  VehicleMaintenanceTone,
  VehicleMaintenanceTradeoffType,
  VehicleMaintenanceWindowKind,
  VehicleMaintenanceWindowModel,
  VehicleMaintenanceWindowStatus,
} from './vehicleMaintenanceTypes';

function textBlob(value: unknown): string {
  if (typeof value === 'string') return value.toLocaleLowerCase('tr-TR');
  if (Array.isArray(value)) return value.map(textBlob).join(' ');
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map(textBlob).join(' ');
  }
  return '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readNumber(value: unknown, keys: readonly string[]): number | undefined {
  if (!isRecord(value)) return undefined;
  for (const key of keys) {
    const item = value[key];
    if (typeof item === 'number' && Number.isFinite(item)) return item;
  }
  return undefined;
}

function hasPermission(context: VehicleMaintenanceContext, permissionId: string): boolean {
  return (context.unlockedPermissionIds ?? []).includes(permissionId);
}

function getVehicleMetrics(context: VehicleMaintenanceContext): {
  maintenanceRisk: number;
  routePressure: number;
  capacityPressure: number;
  status?: string;
} {
  const resources = context.operationalResources;
  if (!isRecord(resources)) {
    return { maintenanceRisk: 0, routePressure: 0, capacityPressure: 0 };
  }

  const groups = resources.vehicleGroups;
  if (!isRecord(groups)) {
    return { maintenanceRisk: 0, routePressure: 0, capacityPressure: 0 };
  }

  let maintenanceRisk = 0;
  let routePressure = 0;
  let capacityPressure = 0;
  let status: string | undefined;

  for (const group of Object.values(groups)) {
    if (!isRecord(group)) continue;
    maintenanceRisk = Math.max(maintenanceRisk, readNumber(group, ['maintenanceRisk']) ?? 0);
    routePressure = Math.max(routePressure, readNumber(group, ['routePressure']) ?? 0);
    capacityPressure = Math.max(capacityPressure, readNumber(group, ['capacityPressure']) ?? 0);
    if (typeof group.status === 'string') status = group.status;
  }

  return { maintenanceRisk, routePressure, capacityPressure, status };
}

function hasHighVehicleFatigue(context: VehicleMaintenanceContext): boolean {
  const metrics = getVehicleMetrics(context);
  const blob = textBlob(context.resourceFatigue) + textBlob(context.operationSignals);
  return (
    metrics.maintenanceRisk >= 65 ||
    metrics.routePressure >= 70 ||
    metrics.status === 'critical' ||
    metrics.status === 'strained' ||
    ['critical', 'maintenance_risk', 'strained', 'tired'].some((token) => blob.includes(token))
  );
}

function hasStableVehicleResources(context: VehicleMaintenanceContext): boolean {
  const metrics = getVehicleMetrics(context);
  return (
    metrics.maintenanceRisk <= 35 &&
    metrics.routePressure <= 35 &&
    metrics.status !== 'strained' &&
    metrics.status !== 'critical'
  );
}

function hasCrisisContext(context: VehicleMaintenanceContext): boolean {
  const blob = textBlob(context.crisisState);
  return ['watch', 'elevated', 'critical', 'active'].some((token) => blob.includes(token));
}

function isWeakAssignmentFit(assignment?: EventAssignmentState | null): boolean {
  if (!assignment) return false;
  return assignment.compatibilityLabel === 'Zayıf uyum' || assignment.compatibilityScore < 45;
}

function isSanayiRouteContext(context: VehicleMaintenanceContext): boolean {
  const districtId =
    context.districtOperationCandidate?.definition.districtId ??
    context.activeTaskRoute?.targetDistrictId;
  if (districtId === 'sanayi' || districtId === 'istasyon') return true;
  const blob = textBlob(context.districtOperationCandidate);
  return blob.includes('sanayi') || blob.includes('istasyon');
}

function getTeamSpecializationContext(
  context: VehicleMaintenanceContext,
): TeamSpecializationContext {
  return {
    day: context.day,
    assignment: context.assignment,
    districtOperationCandidate: context.districtOperationCandidate,
    activeTaskRoute: context.activeTaskRoute,
    eventFamilySignals: context.eventFamilySignals?.map((signal) => ({
      domain: signal.domain,
      strength: signal.strength,
    })),
    operationalResources: context.operationalResources,
    resourceFatigue: context.resourceFatigue,
    operationSignals: context.operationSignals,
    crisisState: context.crisisState,
    isDispatchPhase: context.isDispatchPhase,
    isFieldPhase: context.isFieldPhase,
  };
}

function getTeamResults(context: VehicleMaintenanceContext) {
  if (context.teamSpecializationResults?.length) {
    return context.teamSpecializationResults;
  }
  return buildTeamSpecializationFitResults(getTeamSpecializationContext(context));
}

function getTechnicalTeamRecommended(context: VehicleMaintenanceContext): boolean {
  return getTeamResults(context).some(
    (result) =>
      result.specialization.groupId === 'technical_team' &&
      (result.status === 'recommended' || result.status === 'active' || result.fitScore >= 60),
  );
}

function getRouteSupportRecommended(context: VehicleMaintenanceContext): boolean {
  return getTeamResults(context).some(
    (result) =>
      result.specialization.groupId === 'route_support_team' &&
      (result.status === 'recommended' || result.status === 'active' || result.fitScore >= 60),
  );
}

function isTechnicalTeamSelected(context: VehicleMaintenanceContext): boolean {
  const assignment = context.assignment;
  return (
    assignment?.personnelType === 'technical_team' ||
    assignment?.vehicleType === 'maintenance_vehicle'
  );
}

function isRouteSupportSelected(context: VehicleMaintenanceContext): boolean {
  return context.assignment?.vehicleType === 'route_support_vehicle';
}

export function clampVehicleMaintenanceScore(score: number): number {
  if (!Number.isFinite(score)) return VEHICLE_MAINTENANCE_SAFE_FALLBACK_SCORE.readiness;
  return Math.min(
    VEHICLE_MAINTENANCE_SCORE_RANGE.max,
    Math.max(VEHICLE_MAINTENANCE_SCORE_RANGE.min, Math.round(score)),
  );
}

export function getVehicleMaintenanceRiskLevel(score: number): VehicleMaintenanceRiskLevel {
  const clamped = clampVehicleMaintenanceScore(score);
  if (clamped <= VEHICLE_MAINTENANCE_RISK_THRESHOLDS.lowMax) return 'low';
  if (clamped <= VEHICLE_MAINTENANCE_RISK_THRESHOLDS.moderateMax) return 'moderate';
  if (clamped <= VEHICLE_MAINTENANCE_RISK_THRESHOLDS.elevatedMax) return 'elevated';
  if (clamped <= VEHICLE_MAINTENANCE_RISK_THRESHOLDS.highMax) return 'high';
  return 'critical';
}

export function getVehicleMaintenanceSignalSources(
  context: VehicleMaintenanceContext = {},
): VehicleMaintenanceSignalSource[] {
  const sources: VehicleMaintenanceSignalSource[] = [];
  if (context.operationalResources) sources.push('operational_resource');
  if (context.resourceFatigue) sources.push('resource_fatigue');
  if (context.activeTaskRoute) sources.push('active_task_route');
  if (context.assignment) sources.push('assignment');
  if (context.teamSpecializationResults?.length || context.assignment) {
    sources.push('team_specialization');
  }
  if (context.districtOperationCandidate) sources.push('district_operation');
  if ((context.eventFamilySignals?.length ?? 0) > 0) sources.push('event_family');
  if (context.dailyPlan) sources.push('daily_plan');
  if (hasCrisisContext(context)) sources.push('crisis_state');
  if (context.operationSignals) sources.push('operation_signal');
  if (sources.length === 0) sources.push('fallback');
  return sources;
}

export function getVehicleMaintenancePressureDomains(
  context: VehicleMaintenanceContext = {},
): VehicleMaintenancePressureDomain[] {
  const domains = new Set<VehicleMaintenancePressureDomain>();

  const route = context.activeTaskRoute;
  if (route?.domain === 'vehicle_route' || route?.pressure === 'high' || route?.pressure === 'critical') {
    domains.add('vehicle_route');
  }

  if (hasHighVehicleFatigue(context) || context.resourceFatigue) {
    domains.add('resource_fatigue');
  }

  if (context.assignment?.vehicleType) {
    domains.add('vehicle_route');
  }

  if (hasCrisisContext(context)) {
    domains.add('crisis');
  }

  const districtKind = context.districtOperationCandidate?.definition.kind;
  if (districtKind === 'route_discipline' || districtKind === 'resource_balance') {
    domains.add('vehicle_route');
    domains.add('district_balance');
  }

  if (context.operationSignals?.dailyFocus === 'vehicles') {
    domains.add('vehicle_route');
  }

  if (domains.size === 0) domains.add('generic');
  return [...domains];
}

export function calculateVehicleMaintenanceUrgencyScore(
  context: VehicleMaintenanceContext = {},
): number {
  let score = VEHICLE_MAINTENANCE_SAFE_FALLBACK_SCORE.urgency;
  const metrics = getVehicleMetrics(context);
  const route = context.activeTaskRoute;

  if (hasHighVehicleFatigue(context)) score += 20;
  if (metrics.maintenanceRisk >= 75 || metrics.routePressure >= 80) score += 10;
  if (route?.pressure === 'high') score += 15;
  if (route?.pressure === 'critical') score += 20;
  if (isWeakAssignmentFit(context.assignment)) score += 10;
  if (hasCrisisContext(context)) score += 15;
  if (isSanayiRouteContext(context)) score += 8;
  if (!isTechnicalTeamSelected(context) && hasHighVehicleFatigue(context)) score += 8;

  if (isTechnicalTeamSelected(context) || getTechnicalTeamRecommended(context)) score -= 8;
  if (isRouteSupportSelected(context) || getRouteSupportRecommended(context)) score -= 6;
  if (context.dailyPlan?.vehicleFocus === 'preventive_maintenance') score -= 6;
  if (context.dailyPlan?.personnelFocus === 'rest_rotation') score -= 6;
  if (route?.pressure === 'low') score -= 8;
  if (hasStableVehicleResources(context)) score -= 8;

  return clampVehicleMaintenanceScore(score);
}

export function calculateVehicleMaintenanceReadinessScore(
  context: VehicleMaintenanceContext = {},
): number {
  let score = VEHICLE_MAINTENANCE_SAFE_FALLBACK_SCORE.readiness;
  const day = context.day ?? 1;

  if (hasPermission(context, 'vehicle_maintenance_window_preview')) score += 15;
  if (getTechnicalTeamRecommended(context)) score += 15;
  if (getRouteSupportRecommended(context)) score += 10;
  if (context.activeTaskRoute) score += 10;

  const districtKind = context.districtOperationCandidate?.definition.kind;
  if (districtKind === 'route_discipline' || districtKind === 'resource_balance') {
    score += 10;
  }

  const vehicleFocus = context.dailyPlan?.vehicleFocus;
  if (
    vehicleFocus === 'preventive_maintenance' ||
    vehicleFocus === 'route_check' ||
    context.dailyPlan?.personnelFocus === 'rest_rotation'
  ) {
    score += 10;
  }

  if (hasHighVehicleFatigue(context)) score += 10;

  if (day <= VEHICLE_MAINTENANCE_MIN_DAY_VISIBILITY.hiddenMaxDay) score -= 25;
  if (!context.operationalResources && !context.activeTaskRoute && !context.assignment) {
    score -= 15;
  }

  return clampVehicleMaintenanceScore(score);
}

export function resolveVehicleMaintenanceWindowStatus(
  context: VehicleMaintenanceContext,
  readiness: number,
  urgency: number,
): VehicleMaintenanceWindowStatus {
  const day = context.day ?? 1;

  if (day <= VEHICLE_MAINTENANCE_MIN_DAY_VISIBILITY.hiddenMaxDay) {
    return 'preview';
  }

  if (readiness < 35) {
    return day <= VEHICLE_MAINTENANCE_MIN_DAY_VISIBILITY.previewMaxDay ? 'preview' : 'unavailable';
  }

  if (urgency >= 85) return 'urgent';
  if (urgency >= 65 && readiness >= 45) return 'recommended';
  if (readiness >= 60) return 'open';

  if (
    (getTechnicalTeamRecommended(context) || context.dailyPlan?.vehicleFocus === 'preventive_maintenance') &&
    urgency < 65
  ) {
    return 'open';
  }

  return day <= VEHICLE_MAINTENANCE_MIN_DAY_VISIBILITY.previewMaxDay ? 'preview' : 'open';
}

export function resolveVehicleMaintenanceWindowKind(
  context: VehicleMaintenanceContext = {},
): VehicleMaintenanceWindowKind {
  if (hasCrisisContext(context)) return 'emergency_stabilization';

  const route = context.activeTaskRoute;
  if (route?.pressure === 'high' || route?.pressure === 'critical') {
    return 'route_load_rebalance';
  }

  if (hasHighVehicleFatigue(context)) return 'fatigue_recovery';

  if (isTechnicalTeamSelected(context) || getTechnicalTeamRecommended(context)) {
    return 'technical_inspection';
  }

  if (context.dailyPlan?.vehicleFocus === 'preventive_maintenance') {
    return 'preventive_check';
  }

  if (context.dailyPlan?.vehicleFocus === 'high_capacity') {
    return 'capacity_planning';
  }

  const districtKind = context.districtOperationCandidate?.definition.kind;
  if (districtKind === 'route_discipline') return 'route_load_rebalance';
  if (districtKind === 'resource_balance') return 'fatigue_recovery';

  for (const signal of context.eventFamilySignals ?? []) {
    if (signal.domain === 'resource_recovery') return 'fatigue_recovery';
    if (signal.domain === 'vehicle_route') return 'route_load_rebalance';
  }

  return 'preventive_check';
}

export function resolveVehicleMaintenanceTradeoffs(
  context: VehicleMaintenanceContext,
  status: VehicleMaintenanceWindowStatus,
  kind: VehicleMaintenanceWindowKind,
): VehicleMaintenanceTradeoffType[] {
  const tradeoffs: VehicleMaintenanceTradeoffType[] = [];

  if (status === 'urgent' || hasCrisisContext(context)) {
    tradeoffs.push('crisis_prevention');
  }

  if (kind === 'fatigue_recovery' || kind === 'preventive_check' || kind === 'technical_inspection') {
    tradeoffs.push('protect_tomorrow');
    tradeoffs.push('assign_technical_team');
  }

  if (kind === 'route_load_rebalance') {
    tradeoffs.push('rebalance_route');
    tradeoffs.push('protect_tomorrow');
  }

  if (status === 'open' || status === 'recommended') {
    tradeoffs.push('push_today');
  }

  if (status === 'preview' || calculateVehicleMaintenanceUrgencyScore(context) < 45) {
    tradeoffs.push('monitor_only');
  }

  if (tradeoffs.length === 0) {
    tradeoffs.push('monitor_only', 'protect_tomorrow');
  }

  return [...new Set(tradeoffs)].slice(0, 3);
}

function resolveTone(
  status: VehicleMaintenanceWindowStatus,
  riskLevel: VehicleMaintenanceRiskLevel,
): VehicleMaintenanceTone {
  if (status === 'urgent' || riskLevel === 'critical') return 'urgent';
  if (riskLevel === 'high' || status === 'recommended') return 'strained';
  if (status === 'open') return 'positive';
  if (status === 'preview') return 'watch';
  return 'neutral';
}

export function getVehicleMaintenanceSuggestedTeam(
  context: VehicleMaintenanceContext = {},
): string | undefined {
  const results = getTeamResults(context);
  const technical = results.find(
    (result) => result.specialization.groupId === 'technical_team',
  );
  const routeSupport = results.find(
    (result) => result.specialization.groupId === 'route_support_team',
  );

  const kind = resolveVehicleMaintenanceWindowKind(context);
  if (kind === 'route_load_rebalance' && routeSupport && routeSupport.fitScore >= 55) {
    return routeSupport.specialization.id;
  }
  if (technical && technical.fitScore >= 50) {
    return technical.specialization.id;
  }
  if (routeSupport && routeSupport.fitScore >= 60) {
    return routeSupport.specialization.id;
  }
  return technical?.specialization.id ?? routeSupport?.specialization.id;
}

export function buildVehicleMaintenanceWindowModel(
  context: VehicleMaintenanceContext = {},
): VehicleMaintenanceWindowModel {
  const readinessScore = calculateVehicleMaintenanceReadinessScore(context);
  const urgencyScore = calculateVehicleMaintenanceUrgencyScore(context);
  const status = resolveVehicleMaintenanceWindowStatus(context, readinessScore, urgencyScore);
  const kind = resolveVehicleMaintenanceWindowKind(context);
  const riskLevel = getVehicleMaintenanceRiskLevel(urgencyScore);
  const tradeoffTypes = resolveVehicleMaintenanceTradeoffs(context, status, kind);
  const pressureDomains = getVehicleMaintenancePressureDomains(context);
  const signalSources = getVehicleMaintenanceSignalSources(context);
  const suggestedTeamSpecializationId = getVehicleMaintenanceSuggestedTeam(context);

  const model: VehicleMaintenanceWindowModel = {
    id: `vehicle_maintenance_${kind}_${context.day ?? 0}`,
    status,
    kind,
    riskLevel,
    tradeoffTypes,
    pressureDomains,
    signalSources,
    readinessScore,
    urgencyScore,
    title: 'Araç Bakım Penceresi',
    summaryLine: '',
    riskLine: '',
    tradeoffLine: '',
    targetDistrictId:
      context.districtOperationCandidate?.definition.districtId ??
      context.activeTaskRoute?.targetDistrictId,
    suggestedTeamSpecializationId,
    isVisibleToPlayer: false,
    isPreviewOnly: status === 'preview' || status === 'unavailable',
  };

  model.summaryLine = buildVehicleMaintenanceSummaryLine(model, context);
  model.riskLine = buildVehicleMaintenanceRiskLine(model, context);
  model.tradeoffLine = buildVehicleMaintenanceTradeoffLine(model);
  model.recommendationLine = buildVehicleMaintenanceRecommendationLine(model, context);
  model.isVisibleToPlayer = shouldShowVehicleMaintenanceWindow(context, model);
  model.isPreviewOnly =
    model.status === 'preview' || model.status === 'unavailable' || model.status === 'future';

  return model;
}

export function shouldShowVehicleMaintenanceWindow(
  context: VehicleMaintenanceContext = {},
  model?: VehicleMaintenanceWindowModel,
): boolean {
  const day = context.day ?? 1;
  if (day <= VEHICLE_MAINTENANCE_MIN_DAY_VISIBILITY.hiddenMaxDay) return false;

  const hasVehicleContext =
    context.operationalResources != null ||
    context.activeTaskRoute != null ||
    context.assignment != null ||
    context.resourceFatigue != null ||
    (context.eventFamilySignals?.length ?? 0) > 0;

  if (day <= VEHICLE_MAINTENANCE_MIN_DAY_VISIBILITY.previewMaxDay) {
    return hasVehicleContext && (context.isDispatchPhase === true || context.isFieldPhase === true);
  }

  if (hasPermission(context, 'vehicle_maintenance_window_preview') && hasVehicleContext) {
    return true;
  }

  if (context.isDispatchPhase || context.isFieldPhase) {
    return hasVehicleContext;
  }

  if (model && (model.status === 'recommended' || model.status === 'urgent' || model.status === 'open')) {
    return hasVehicleContext;
  }

  return false;
}

export function buildVehicleMaintenanceFallbackModel(
  context: VehicleMaintenanceContext = {},
): VehicleMaintenanceWindowModel {
  return {
    id: 'vehicle_maintenance_fallback',
    status: 'preview',
    kind: 'preventive_check',
    riskLevel: 'moderate',
    tradeoffTypes: ['monitor_only', 'protect_tomorrow'],
    pressureDomains: ['generic'],
    signalSources: ['fallback'],
    readinessScore: VEHICLE_MAINTENANCE_SAFE_FALLBACK_SCORE.readiness,
    urgencyScore: VEHICLE_MAINTENANCE_SAFE_FALLBACK_SCORE.urgency,
    title: 'Araç Bakım Penceresi',
    summaryLine: 'Araç bakım penceresi foundation modunda hazırlanıyor.',
    riskLine: 'Araç/rota baskısı netleşince bakım ihtiyacı görünür olur.',
    tradeoffLine: 'Bugün bakım açmak hızı düşürür, yarını korur.',
    isVisibleToPlayer: false,
    isPreviewOnly: true,
  };
}

export function buildAssignmentVehicleMaintenancePreviewLine(
  context: VehicleMaintenanceContext = {},
): string | null {
  const day = context.day ?? 1;
  if (day < VEHICLE_MAINTENANCE_MIN_DAY_VISIBILITY.openMinDay) return null;

  const model = buildVehicleMaintenanceWindowModel(context);
  if (!shouldShowVehicleMaintenanceWindow(context, model)) return null;
  if (!model.isVisibleToPlayer && day <= VEHICLE_MAINTENANCE_MIN_DAY_VISIBILITY.previewMaxDay) {
    return null;
  }
  if (model.status === 'unavailable') return null;

  const teamHint = model.suggestedTeamSpecializationId?.includes('technical')
    ? 'Teknik Ekip uygun'
    : model.suggestedTeamSpecializationId?.includes('route')
      ? 'Rota Destek uygun'
      : undefined;

  if (model.status === 'urgent' || model.riskLevel === 'high' || model.riskLevel === 'critical') {
    return teamHint
      ? `Bakım: Rota baskısı yükseliyor · ${teamHint}`
      : 'Bakım: Rota baskısı yükseliyor · pencere öneriliyor';
  }

  if (model.status === 'recommended' || model.status === 'open') {
    return teamHint
      ? `Bakım: Pencere açık · ${teamHint}`
      : 'Bakım: Araç bakımı bugün planlanabilir';
  }

  return null;
}

export function getBestTeamSpecializationForMaintenance(
  context: VehicleMaintenanceContext = {},
) {
  return getBestTeamSpecializationForAssignment(getTeamSpecializationContext(context));
}
