import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import {
  buildTeamSpecializationFitResults,
} from '@/core/teamSpecialization/teamSpecializationModel';
import type { TeamSpecializationContext } from '@/core/teamSpecialization/teamSpecializationTypes';

import {
  CONTAINER_NETWORK_DISTRICT_IDS,
  CONTAINER_NETWORK_HEALTH_THRESHOLDS,
  CONTAINER_NETWORK_MIN_DAY_VISIBILITY,
  CONTAINER_NETWORK_PRESSURE_THRESHOLDS,
  CONTAINER_NETWORK_REQUIRED_PERMISSION_IDS,
  CONTAINER_NETWORK_SAFE_FALLBACK_DISTRICT,
  CONTAINER_NETWORK_SAFE_FALLBACK_SCORE,
  CONTAINER_NETWORK_SCORE_RANGE,
  CONTAINER_NETWORK_UPGRADE_KIND_LABELS,
  getDistrictContainerNetworkProfile,
} from './containerNetworkConstants';
import {
  buildContainerNetworkRecommendationLine,
  buildContainerNetworkSummaryLine,
  buildContainerNetworkTradeoffLine,
  buildContainerNetworkUnlockLine,
} from './containerNetworkPresentation';
import type {
  ContainerNetworkContext,
  ContainerNetworkHealthLevel,
  ContainerNetworkHealthResult,
  ContainerNetworkImpactDomain,
  ContainerNetworkPressureLevel,
  ContainerNetworkSignalSource,
  ContainerNetworkUpgradeAxis,
  ContainerNetworkUpgradeCandidate,
  ContainerNetworkUpgradeKind,
  ContainerNetworkUpgradeStatus,
} from './containerNetworkTypes';

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

function normalizeDistrictId(value?: string | null): MapDistrictId | undefined {
  if (!value) return undefined;
  return normalizeMapDistrictId(value) ?? undefined;
}

function getContextDistrictId(context: ContainerNetworkContext): MapDistrictId {
  return (
    normalizeDistrictId(context.districtId) ??
    normalizeDistrictId(context.districtOperationCandidate?.definition.districtId) ??
    normalizeDistrictId(context.activeTaskRoute?.targetDistrictId) ??
    CONTAINER_NETWORK_SAFE_FALLBACK_DISTRICT
  );
}

function hasPermission(context: ContainerNetworkContext, permissionId: string): boolean {
  return (context.unlockedPermissionIds ?? []).includes(permissionId);
}

function getContainerMetrics(context: ContainerNetworkContext, districtId: MapDistrictId): {
  fillPressure: number;
  cleanlinessPressure: number;
  maintenancePressure: number;
  socialPressure: number;
  status?: string;
} {
  const resources = context.operationalResources;
  if (!isRecord(resources)) {
    return { fillPressure: 0, cleanlinessPressure: 0, maintenancePressure: 0, socialPressure: 0 };
  }

  const networks = resources.containerNetworks ?? resources.districtContainerNetworks;
  if (Array.isArray(networks)) {
    const entry = networks.find(
      (item) =>
        isRecord(item) &&
        normalizeDistrictId(String(item.districtId ?? item.neighborhoodId ?? '')) === districtId,
    );
    if (isRecord(entry)) {
      return {
        fillPressure: readNumber(entry, ['fillPressure', 'capacityPressure']) ?? 0,
        cleanlinessPressure: readNumber(entry, ['cleanlinessPressure']) ?? 0,
        maintenancePressure: readNumber(entry, ['maintenancePressure']) ?? 0,
        socialPressure: readNumber(entry, ['socialPressure']) ?? 0,
        status: typeof entry.status === 'string' ? entry.status : undefined,
      };
    }
  }

  if (isRecord(networks)) {
    const entry = networks[districtId];
    if (isRecord(entry)) {
      return {
        fillPressure: readNumber(entry, ['fillPressure', 'capacityPressure']) ?? 0,
        cleanlinessPressure: readNumber(entry, ['cleanlinessPressure']) ?? 0,
        maintenancePressure: readNumber(entry, ['maintenancePressure']) ?? 0,
        socialPressure: readNumber(entry, ['socialPressure']) ?? 0,
        status: typeof entry.status === 'string' ? entry.status : undefined,
      };
    }
  }

  const blob = textBlob(resources);
  if (blob.includes('container') || blob.includes('konteyner')) {
    return {
      fillPressure: readNumber(resources, ['fillPressure', 'containerPressure']) ?? 40,
      cleanlinessPressure: readNumber(resources, ['cleanlinessPressure']) ?? 0,
      maintenancePressure: 0,
      socialPressure: 0,
    };
  }

  return { fillPressure: 0, cleanlinessPressure: 0, maintenancePressure: 0, socialPressure: 0 };
}

function hasContainerResourceContext(context: ContainerNetworkContext): boolean {
  const blob = [
    textBlob(context.operationalResources),
    textBlob(context.resourceFatigue),
    textBlob(context.operationSignals),
  ].join(' ');
  return ['container', 'konteyner', 'cleanliness', 'fillpressure', 'waste', 'temizlik'].some(
    (token) => blob.includes(token),
  );
}

function hasHighContainerPressure(context: ContainerNetworkContext, districtId: MapDistrictId): boolean {
  const metrics = getContainerMetrics(context, districtId);
  const maxPressure = Math.max(
    metrics.fillPressure,
    metrics.cleanlinessPressure,
    metrics.maintenancePressure,
    metrics.socialPressure,
  );
  return (
    maxPressure >= 65 ||
    metrics.status === 'critical' ||
    metrics.status === 'high' ||
    metrics.status === 'strained'
  );
}

function hasCriticalContainerPressure(context: ContainerNetworkContext, districtId: MapDistrictId): boolean {
  const metrics = getContainerMetrics(context, districtId);
  const maxPressure = Math.max(
    metrics.fillPressure,
    metrics.cleanlinessPressure,
    metrics.maintenancePressure,
    metrics.socialPressure,
  );
  return maxPressure >= 85 || metrics.status === 'critical';
}

function hasStableResourceSignal(context: ContainerNetworkContext, districtId: MapDistrictId): boolean {
  const metrics = getContainerMetrics(context, districtId);
  const maxPressure = Math.max(metrics.fillPressure, metrics.cleanlinessPressure);
  const blob = textBlob(context.resourceFatigue);
  return (
    maxPressure <= 35 &&
    metrics.status !== 'strained' &&
    metrics.status !== 'critical' &&
    !['critical', 'strained', 'tired'].some((token) => blob.includes(token))
  );
}

function hasResourceFatigueStrain(context: ContainerNetworkContext): boolean {
  const blob = textBlob(context.resourceFatigue);
  return ['strained', 'critical', 'tired', 'cleanliness', 'container'].some((token) =>
    blob.includes(token),
  );
}

function getTrustLevel(context: ContainerNetworkContext): string | undefined {
  return context.districtTrustResult?.level;
}

function isLowTrust(context: ContainerNetworkContext): boolean {
  const level = getTrustLevel(context);
  return level === 'fragile' || level === 'watch';
}

function isStableTrust(context: ContainerNetworkContext): boolean {
  const level = getTrustLevel(context);
  return level === 'stable' || level === 'trusted' || level === 'supportive';
}

function hasUnresolvedCarryOver(context: ContainerNetworkContext, districtId: MapDistrictId): boolean {
  return (context.districtMemoryItems ?? []).some(
    (item) =>
      item.districtId === districtId &&
      (item.kind === 'unresolved_carry_over' ||
        item.kind === 'repeated_pressure' ||
        item.kind === 'resource_strain'),
  );
}

function hasRecentImprovementMemory(context: ContainerNetworkContext, districtId: MapDistrictId): boolean {
  return (context.districtMemoryItems ?? []).some(
    (item) =>
      item.districtId === districtId &&
      (item.kind === 'recent_improvement' || item.kind === 'stable_operation'),
  );
}

function hasSocialCleanlinessComplaint(context: ContainerNetworkContext): boolean {
  const blob = textBlob(context.socialPulse) + textBlob(context.operationSignals);
  return ['cleanliness', 'temizlik', 'waste', 'çöp', 'container', 'konteyner'].some((token) =>
    blob.includes(token),
  );
}

function hasCrisisWatch(context: ContainerNetworkContext): boolean {
  const blob = textBlob(context.crisisState);
  return ['watch', 'elevated', 'critical', 'active'].some((token) => blob.includes(token));
}

function hasContainerEventFamily(context: ContainerNetworkContext): boolean {
  return (context.eventFamilySignals ?? []).some(
    (signal) =>
      signal.domain === 'container' ||
      signal.domain === 'resource_recovery' ||
      signal.domain === 'district_balance',
  );
}

function hasRecoveryEventFamily(context: ContainerNetworkContext): boolean {
  return (context.eventFamilySignals ?? []).some(
    (signal) => signal.domain === 'resource_recovery' || signal.domain === 'district_balance',
  );
}

function hasWorsenedEventFamily(context: ContainerNetworkContext): boolean {
  const blob = textBlob(context.eventFamilySignals);
  return blob.includes('worsened') || blob.includes('carry_over') || blob.includes('carryover');
}

function getDistrictOperationKind(context: ContainerNetworkContext): string | undefined {
  return context.districtOperationCandidate?.definition.kind;
}

function hasContainerNetworkOperation(context: ContainerNetworkContext): boolean {
  const kind = getDistrictOperationKind(context);
  return kind === 'container_network' || kind === 'environmental_care';
}

function hasRecoveryDistrictOperation(context: ContainerNetworkContext): boolean {
  const kind = getDistrictOperationKind(context);
  return (
    kind === 'recovery_focus' ||
    kind === 'district_memory_response' ||
    kind === 'environmental_care'
  );
}

function hasMapLayerContext(context: ContainerNetworkContext): boolean {
  const blob = textBlob(context.mapLayerStates);
  return ['resource_pressure', 'district_trust', 'district_memory'].some((token) =>
    blob.includes(token),
  );
}

function hasActiveRouteContainerDomain(context: ContainerNetworkContext, districtId: MapDistrictId): boolean {
  const route = context.activeTaskRoute;
  if (!route) return false;
  const target = normalizeDistrictId(route.targetDistrictId);
  if (target !== districtId) return false;
  const blob = textBlob(route);
  return blob.includes('container') || route.domain === 'container';
}

function hasPreventiveDailyPlan(context: ContainerNetworkContext): boolean {
  const plan = context.dailyPlan;
  if (!plan) return false;
  const blob = textBlob(plan);
  return ['preventive', 'cleanliness', 'container', 'temizlik', 'konteyner'].some((token) =>
    blob.includes(token),
  );
}

function isWeakAssignment(context: ContainerNetworkContext): boolean {
  const assignment = context.assignment;
  if (!assignment) return false;
  return assignment.compatibilityLabel === 'Zayıf uyum' || assignment.compatibilityScore < 45;
}

function getTeamSpecializationContext(context: ContainerNetworkContext): TeamSpecializationContext {
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

function getTeamResults(context: ContainerNetworkContext) {
  if (context.teamSpecializationResults?.length) {
    return context.teamSpecializationResults;
  }
  return buildTeamSpecializationFitResults(getTeamSpecializationContext(context));
}

function isTechnicalTeamRecommended(context: ContainerNetworkContext): boolean {
  return getTeamResults(context).some(
    (result) =>
      (result.specialization.id === 'technical_team_preventive_maintenance' ||
        result.specialization.groupId === 'technical_team') &&
      (result.status === 'recommended' || result.status === 'active' || result.fitScore >= 60),
  );
}

function isContainerNetworkTeamRecommended(context: ContainerNetworkContext): boolean {
  return getTeamResults(context).some(
    (result) =>
      result.specialization.id === 'container_network_unit' &&
      (result.status === 'recommended' || result.status === 'active' || result.fitScore >= 60),
  );
}

function isFutureOnlyContext(context: ContainerNetworkContext): boolean {
  const blob = textBlob(context.operationEra) + textBlob(context.mapLayerStates);
  return blob.includes('future_smart_network') || blob.includes('city_development');
}

export function clampContainerNetworkScore(score: number): number {
  if (!Number.isFinite(score)) return CONTAINER_NETWORK_SAFE_FALLBACK_SCORE.health;
  return Math.min(
    CONTAINER_NETWORK_SCORE_RANGE.max,
    Math.max(CONTAINER_NETWORK_SCORE_RANGE.min, Math.round(score)),
  );
}

export function getContainerNetworkHealthLevel(score: number): ContainerNetworkHealthLevel {
  const clamped = clampContainerNetworkScore(score);
  if (clamped <= CONTAINER_NETWORK_HEALTH_THRESHOLDS.fragileMax) return 'fragile';
  if (clamped <= CONTAINER_NETWORK_HEALTH_THRESHOLDS.strainedMax) return 'strained';
  if (clamped <= CONTAINER_NETWORK_HEALTH_THRESHOLDS.functionalMax) return 'functional';
  if (clamped <= CONTAINER_NETWORK_HEALTH_THRESHOLDS.stableMax) return 'stable';
  if (clamped <= CONTAINER_NETWORK_HEALTH_THRESHOLDS.optimizedMax) return 'optimized';
  return 'showcase';
}

export function getContainerNetworkPressureLevel(score: number): ContainerNetworkPressureLevel {
  const clamped = clampContainerNetworkScore(score);
  if (clamped <= CONTAINER_NETWORK_PRESSURE_THRESHOLDS.lowMax) return 'low';
  if (clamped <= CONTAINER_NETWORK_PRESSURE_THRESHOLDS.moderateMax) return 'moderate';
  if (clamped <= CONTAINER_NETWORK_PRESSURE_THRESHOLDS.elevatedMax) return 'elevated';
  if (clamped <= CONTAINER_NETWORK_PRESSURE_THRESHOLDS.highMax) return 'high';
  return 'critical';
}

export function getContainerNetworkDistrictProfile(districtId: string) {
  return getDistrictContainerNetworkProfile(districtId);
}

export function getContainerNetworkSignalSources(
  context: ContainerNetworkContext,
): ContainerNetworkSignalSource[] {
  const sources: ContainerNetworkSignalSource[] = [];
  const districtId = getContextDistrictId(context);

  if (context.operationalResources) sources.push('operational_resource');
  if (context.resourceFatigue) sources.push('resource_fatigue');
  if (context.districtTrustResult) sources.push('district_trust');
  if ((context.districtMemoryItems ?? []).some((item) => item.districtId === districtId)) {
    sources.push('district_memory');
  }
  if (context.districtOperationCandidate) sources.push('district_operation');
  if ((context.eventFamilySignals ?? []).length > 0) sources.push('event_family');
  if (context.mapLayerStates) sources.push('map_layer');
  if ((context.teamSpecializationResults ?? []).length > 0 || context.assignment) {
    sources.push('team_specialization');
  }
  if (context.dailyPlan) sources.push('daily_plan');
  if (context.operationSignals) sources.push('operation_signal');
  if (context.socialPulse) sources.push('social_pulse');
  if (context.activeTaskRoute) sources.push('active_task_route');

  if (sources.length === 0) sources.push('fallback');
  return sources;
}

export function getContainerNetworkPressureDomains(
  context: ContainerNetworkContext,
): ContainerNetworkImpactDomain[] {
  const domains: ContainerNetworkImpactDomain[] = [];
  const districtId = getContextDistrictId(context);
  const profile = getContainerNetworkDistrictProfile(districtId);

  const metrics = getContainerMetrics(context, districtId);
  if (
    Math.max(metrics.fillPressure, metrics.cleanlinessPressure, metrics.maintenancePressure) >= 45
  ) {
    domains.push('container');
  }

  if (hasResourceFatigueStrain(context)) {
    if (!domains.includes('container')) domains.push('container');
  }

  const opKind = getDistrictOperationKind(context);
  if (opKind === 'container_network' || opKind === 'environmental_care') {
    domains.push(opKind === 'environmental_care' ? 'environmental_care' : 'container');
  }

  if (hasContainerEventFamily(context)) {
    if (!domains.includes('resource_recovery')) domains.push('resource_recovery');
  }

  if (hasUnresolvedCarryOver(context, districtId)) {
    if (!domains.includes('district_trust')) domains.push('district_trust');
  }

  if (hasSocialCleanlinessComplaint(context)) {
    if (!domains.includes('social')) domains.push('social');
  }

  if (hasActiveRouteContainerDomain(context, districtId)) {
    if (!domains.includes('container')) domains.push('container');
  }

  if (domains.length === 0) {
    domains.push(...profile.pressureDomains.slice(0, 2));
  }
  if (domains.length === 0) domains.push('container');

  return [...new Set(domains)];
}

export function calculateContainerNetworkHealthScore(context: ContainerNetworkContext): number {
  const districtId = getContextDistrictId(context);
  const profile = getContainerNetworkDistrictProfile(districtId);
  let score = CONTAINER_NETWORK_SAFE_FALLBACK_SCORE.health + (profile.baseHealthOffset ?? 0);

  if (hasStableResourceSignal(context, districtId)) score += 10;
  if (isStableTrust(context)) score += 8;
  if (hasRecoveryEventFamily(context)) score += 8;
  if (getDistrictOperationKind(context) === 'container_network') score += 10;
  if (isTechnicalTeamRecommended(context) || isContainerNetworkTeamRecommended(context)) score += 8;
  if (hasPreventiveDailyPlan(context)) score += 8;
  if (hasRecentImprovementMemory(context, districtId)) score += 6;

  if (hasCriticalContainerPressure(context, districtId)) score -= 15;
  else if (hasHighContainerPressure(context, districtId)) score -= 12;

  if (hasResourceFatigueStrain(context)) score -= 12;
  if (hasUnresolvedCarryOver(context, districtId)) score -= 8;
  if (hasSocialCleanlinessComplaint(context)) score -= 8;
  if (hasCrisisWatch(context)) score -= 6;
  if (
    (context.districtMemoryItems ?? []).some(
      (item) => item.districtId === districtId && item.kind === 'repeated_pressure',
    )
  ) {
    score -= 8;
  }
  if (isWeakAssignment(context)) score -= 6;

  return clampContainerNetworkScore(score);
}

export function calculateContainerNetworkPressureScore(context: ContainerNetworkContext): number {
  const districtId = getContextDistrictId(context);
  let score = CONTAINER_NETWORK_SAFE_FALLBACK_SCORE.pressure;

  if (hasHighContainerPressure(context, districtId)) score += 20;
  if (hasSocialCleanlinessComplaint(context)) score += 12;
  if (hasUnresolvedCarryOver(context, districtId)) score += 10;
  if (isLowTrust(context)) score += 8;
  if (hasWorsenedEventFamily(context)) score += 10;
  if (hasActiveRouteContainerDomain(context, districtId)) score += 8;
  if (hasCrisisWatch(context)) score += 8;

  if (isTechnicalTeamRecommended(context) || isContainerNetworkTeamRecommended(context)) score -= 8;
  if (hasRecoveryDistrictOperation(context)) score -= 8;
  if (isStableTrust(context)) score -= 6;
  if (hasPreventiveDailyPlan(context)) score -= 6;

  return clampContainerNetworkScore(score);
}

export function calculateContainerNetworkReadinessScore(context: ContainerNetworkContext): number {
  let score = CONTAINER_NETWORK_SAFE_FALLBACK_SCORE.readiness;

  if (hasPermission(context, 'container_network_upgrade_preview')) score += 15;
  if (hasPermission(context, 'district_specific_operations_preview')) score += 8;
  if (isTechnicalTeamRecommended(context)) score += 12;
  if (isContainerNetworkTeamRecommended(context)) score += 12;
  if (hasContainerNetworkOperation(context)) score += 12;
  if (hasContainerEventFamily(context)) score += 10;
  if (hasMapLayerContext(context)) score += 8;
  if (context.districtTrustResult?.isVisibleToPlayer) score += 6;

  if ((context.day ?? 0) <= CONTAINER_NETWORK_MIN_DAY_VISIBILITY.hiddenMaxDay) score -= 25;
  if (!hasContainerResourceContext(context) && !context.districtOperationCandidate) score -= 15;
  if (isFutureOnlyContext(context)) score -= 100;

  return clampContainerNetworkScore(score);
}

export function calculateContainerNetworkImpactScore(context: ContainerNetworkContext): number {
  const districtId = getContextDistrictId(context);
  const profile = getContainerNetworkDistrictProfile(districtId);
  let score = CONTAINER_NETWORK_SAFE_FALLBACK_SCORE.impact;

  const pressureScore = calculateContainerNetworkPressureScore(context);
  if (pressureScore >= 65) score += 15;

  if (isLowTrust(context) && hasRecoveryDistrictOperation(context)) score += 12;
  if (hasSocialCleanlinessComplaint(context)) score += 10;

  const kind = resolveContainerNetworkUpgradeKind(context);
  if (profile.preferredUpgradeKinds.includes(kind)) score += 10;

  if (context.operationEra) score += 8;
  if (textBlob(context.mapLayerStates).includes('city_development')) score += 8;

  return clampContainerNetworkScore(score);
}

function matchesRecoveryContext(context: ContainerNetworkContext): boolean {
  return (
    hasRecoveryEventFamily(context) ||
    hasRecoveryDistrictOperation(context) ||
    isLowTrust(context) ||
    hasUnresolvedCarryOver(context, getContextDistrictId(context))
  );
}

export function resolveContainerNetworkUpgradeKind(
  context: ContainerNetworkContext,
): ContainerNetworkUpgradeKind {
  const districtId = getContextDistrictId(context);
  const profile = getContainerNetworkDistrictProfile(districtId);

  if (matchesRecoveryContext(context)) {
    if (profile.preferredUpgradeKinds.includes('recovery_cleanup_focus')) {
      return 'recovery_cleanup_focus';
    }
  }

  if (hasHighContainerPressure(context, districtId) || hasCriticalContainerPressure(context, districtId)) {
    if (profile.preferredUpgradeKinds.includes('capacity_rebalance')) {
      return 'capacity_rebalance';
    }
    return 'capacity_rebalance';
  }

  if (districtId === 'merkez') return 'visible_clean_point';
  if (districtId === 'cumhuriyet') return 'school_residential_order';
  if (districtId === 'sanayi') return 'industrial_heavy_use_point';
  if (districtId === 'istasyon') return 'transit_flow_support';
  if (districtId === 'yesilvadi') return 'environmental_sensitivity_point';

  return profile.preferredUpgradeKinds[0] ?? 'capacity_rebalance';
}

export function resolveContainerNetworkUpgradeStatus(
  context: ContainerNetworkContext,
  readiness: number,
  impact: number,
  pressureScore: number,
): ContainerNetworkUpgradeStatus {
  const day = context.day ?? 0;

  if (isFutureOnlyContext(context)) return 'future';
  if (day <= CONTAINER_NETWORK_MIN_DAY_VISIBILITY.hiddenMaxDay) return 'unavailable';
  if (day <= CONTAINER_NETWORK_MIN_DAY_VISIBILITY.previewMaxDay) return 'preview';
  if (readiness < 35) return readiness < 20 ? 'unavailable' : 'preview';

  const pressureLevel = getContainerNetworkPressureLevel(pressureScore);
  if (
    (pressureLevel === 'high' || pressureLevel === 'critical') &&
    readiness >= 45
  ) {
    return 'recommended';
  }
  if (impact >= 70 && readiness >= 55) return 'recommended';
  if (readiness >= 60) return 'available';
  return 'preview';
}

function buildUpgradeAxes(context: ContainerNetworkContext): ContainerNetworkUpgradeAxis[] {
  const axes: ContainerNetworkUpgradeAxis[] = [];
  if ((context.unlockedPermissionIds ?? []).some((id) =>
    CONTAINER_NETWORK_REQUIRED_PERMISSION_IDS.includes(id),
  )) {
    axes.push('rank_permission');
  }
  if (context.districtTrustResult) axes.push('district_trust');
  if (context.operationalResources || context.resourceFatigue) axes.push('resource_stability');
  if (hasHighContainerPressure(context, getContextDistrictId(context))) {
    axes.push('container_pressure');
  }
  if (context.districtOperationCandidate) axes.push('district_operation');
  if ((context.eventFamilySignals ?? []).length > 0) axes.push('event_family_signal');
  if (context.mapLayerStates) axes.push('map_layer');
  if (isTechnicalTeamRecommended(context) || isContainerNetworkTeamRecommended(context)) {
    axes.push('team_specialization');
  }
  if (context.operationEra) axes.push('operation_era');
  if (isFutureOnlyContext(context)) axes.push('future_system');
  if (axes.length === 0) axes.push('container_pressure');
  return axes;
}

function buildRelatedMapLayerIds(): import('@/core/mapLayers/mapLayerTypes').CreviaMapLayerId[] {
  return ['resource_pressure', 'district_trust', 'district_memory'];
}

function buildHealthReasonLines(
  context: ContainerNetworkContext,
  healthLevel: ContainerNetworkHealthLevel,
  pressureLevel: ContainerNetworkPressureLevel,
): string[] {
  const districtId = getContextDistrictId(context);
  const profile = getContainerNetworkDistrictProfile(districtId);
  const lines: string[] = [profile.flavorLine];

  if (hasHighContainerPressure(context, districtId)) {
    lines.push('Konteyner kapasitesi ve temizlik baskısı ağ sağlığını zorluyor.');
  } else if (healthLevel === 'stable' || healthLevel === 'optimized' || healthLevel === 'showcase') {
    lines.push('Kaynak sinyalleri konteyner ağının dengeli çalıştığını gösteriyor.');
  } else {
    lines.push('Konteyner ağı işlevsel ama geliştirme fırsatları izleniyor.');
  }

  if (pressureLevel === 'high' || pressureLevel === 'critical') {
    lines.push('Baskı seviyesi kısa vadeli düzenlemeyi gündeme getiriyor.');
  }

  return lines;
}

export function buildContainerNetworkHealthResult(
  context: ContainerNetworkContext,
): ContainerNetworkHealthResult {
  const districtId = getContextDistrictId(context);
  const score = calculateContainerNetworkHealthScore(context);
  const pressureScore = calculateContainerNetworkPressureScore(context);
  const healthLevel = getContainerNetworkHealthLevel(score);
  const pressureLevel = getContainerNetworkPressureLevel(pressureScore);
  const day = context.day ?? 0;

  const memoryItem = (context.districtMemoryItems ?? []).find(
    (item) => item.districtId === districtId,
  );

  return {
    districtId,
    score,
    healthLevel,
    pressureLevel,
    signalSources: getContainerNetworkSignalSources(context),
    pressureDomains: getContainerNetworkPressureDomains(context),
    reasonLines: buildHealthReasonLines(context, healthLevel, pressureLevel),
    memoryLine: memoryItem?.title ?? memoryItem?.description,
    confidence:
      day >= CONTAINER_NETWORK_MIN_DAY_VISIBILITY.trustMemoryMinDay &&
      (context.districtTrustResult || (context.districtMemoryItems ?? []).length > 0)
        ? 'high'
        : day >= CONTAINER_NETWORK_MIN_DAY_VISIBILITY.availableMinDay
          ? 'medium'
          : 'low',
    isVisibleToPlayer: shouldShowContainerNetworkUpgrade(context, {
      districtId,
      readinessScore: calculateContainerNetworkReadinessScore(context),
    } as ContainerNetworkUpgradeCandidate),
  };
}

export function buildContainerNetworkUpgradeCandidate(
  context: ContainerNetworkContext,
): ContainerNetworkUpgradeCandidate {
  const districtId = getContextDistrictId(context);
  const profile = getContainerNetworkDistrictProfile(districtId);
  const healthResult = buildContainerNetworkHealthResult(context);
  const readinessScore = calculateContainerNetworkReadinessScore(context);
  const impactScore = calculateContainerNetworkImpactScore(context);
  const pressureScore = calculateContainerNetworkPressureScore(context);
  const pressureLevel = getContainerNetworkPressureLevel(pressureScore);
  const kind = resolveContainerNetworkUpgradeKind(context);
  const status = resolveContainerNetworkUpgradeStatus(
    context,
    readinessScore,
    impactScore,
    pressureScore,
  );
  const kindLabel = CONTAINER_NETWORK_UPGRADE_KIND_LABELS[kind];
  const suggestedTeam = getSuggestedContainerNetworkTeam(context);

  const candidate: ContainerNetworkUpgradeCandidate = {
    id: `container_network_${districtId}_${kind}`,
    districtId,
    kind,
    status,
    healthResult,
    readinessScore,
    impactScore,
    pressureLevel,
    impactDomains: getContainerNetworkPressureDomains(context),
    upgradeAxes: buildUpgradeAxes(context),
    title: profile.title,
    summaryLine: buildContainerNetworkSummaryLine({
      districtId,
      kind,
      status,
      healthResult,
      readinessScore,
      impactScore,
      pressureLevel,
      impactDomains: getContainerNetworkPressureDomains(context),
      upgradeAxes: buildUpgradeAxes(context),
      title: profile.title,
      id: `container_network_${districtId}_${kind}`,
      isVisibleToPlayer: false,
      isPreviewOnly: status === 'preview',
    } as ContainerNetworkUpgradeCandidate),
    tradeoffLine: buildContainerNetworkTradeoffLine({
      kind,
      pressureLevel,
      districtId,
    } as ContainerNetworkUpgradeCandidate),
    recommendationLine: buildContainerNetworkRecommendationLine({
      suggestedTeamSpecializationId: suggestedTeam,
    } as ContainerNetworkUpgradeCandidate),
    unlockLine: buildContainerNetworkUnlockLine(context),
    suggestedTeamSpecializationId: suggestedTeam,
    relatedDistrictOperationId: context.districtOperationCandidate?.definition.id,
    relatedMapLayerIds: buildRelatedMapLayerIds(),
    isVisibleToPlayer: false,
    isPreviewOnly: status === 'preview' || status === 'unavailable',
  };

  candidate.isVisibleToPlayer = shouldShowContainerNetworkUpgrade(context, candidate);
  candidate.summaryLine =
    candidate.summaryLine ||
    `${profile.title}: ${kindLabel} geliştirmesi izleniyor.`;

  return candidate;
}

export function buildContainerNetworkCandidatesForAllDistricts(
  context: ContainerNetworkContext,
): ContainerNetworkUpgradeCandidate[] {
  return CONTAINER_NETWORK_DISTRICT_IDS.map((districtId) =>
    buildContainerNetworkUpgradeCandidate({ ...context, districtId }),
  );
}

export function getRecommendedContainerNetworkUpgrades(
  context: ContainerNetworkContext,
  max = 3,
): ContainerNetworkUpgradeCandidate[] {
  const candidates = buildContainerNetworkCandidatesForAllDistricts(context)
    .filter((candidate) => candidate.isVisibleToPlayer)
    .sort((a, b) => {
      const statusWeight = (status: ContainerNetworkUpgradeStatus) => {
        if (status === 'recommended') return 5;
        if (status === 'available') return 4;
        if (status === 'preview') return 2;
        return 1;
      };
      const pressureBonus = (candidate: ContainerNetworkUpgradeCandidate) => {
        const pressure = calculateContainerNetworkPressureScore({
          ...context,
          districtId: candidate.districtId,
        });
        const level = getContainerNetworkPressureLevel(pressure);
        return level === 'high' || level === 'critical' ? 10 : 0;
      };
      const scoreA =
        statusWeight(a.status) * 100 +
        a.readinessScore +
        a.impactScore +
        pressureBonus(a) +
        getContainerNetworkDistrictProfile(a.districtId).priority;
      const scoreB =
        statusWeight(b.status) * 100 +
        b.readinessScore +
        b.impactScore +
        pressureBonus(b) +
        getContainerNetworkDistrictProfile(b.districtId).priority;
      return scoreB - scoreA;
    });

  return candidates.slice(0, max);
}

export function shouldShowContainerNetworkUpgrade(
  context: ContainerNetworkContext,
  candidate: Pick<ContainerNetworkUpgradeCandidate, 'districtId' | 'readinessScore'> &
    Partial<ContainerNetworkUpgradeCandidate>,
): boolean {
  const day = context.day ?? 0;
  if (day <= CONTAINER_NETWORK_MIN_DAY_VISIBILITY.hiddenMaxDay) return false;
  if (day <= CONTAINER_NETWORK_MIN_DAY_VISIBILITY.previewMaxDay) {
    return candidate.readinessScore >= 20;
  }

  const hasContext =
    hasContainerResourceContext(context) ||
    !!context.districtOperationCandidate ||
    !!context.districtTrustResult ||
    (context.districtMemoryItems ?? []).length > 0;

  if (day >= CONTAINER_NETWORK_MIN_DAY_VISIBILITY.availableMinDay && hasContext) return true;
  if (
    day >= CONTAINER_NETWORK_MIN_DAY_VISIBILITY.trustMemoryMinDay &&
    (context.districtTrustResult || (context.districtMemoryItems ?? []).length > 0)
  ) {
    return true;
  }
  if (hasPermission(context, 'container_network_upgrade_preview')) return true;

  return candidate.readinessScore >= 45 && hasContext;
}

export function buildContainerNetworkFallbackCandidate(
  context: ContainerNetworkContext = {},
): ContainerNetworkUpgradeCandidate {
  const districtId = CONTAINER_NETWORK_SAFE_FALLBACK_DISTRICT;
  const profile = getContainerNetworkDistrictProfile(districtId);
  const healthResult: ContainerNetworkHealthResult = {
    districtId,
    score: CONTAINER_NETWORK_SAFE_FALLBACK_SCORE.health,
    healthLevel: getContainerNetworkHealthLevel(CONTAINER_NETWORK_SAFE_FALLBACK_SCORE.health),
    pressureLevel: getContainerNetworkPressureLevel(CONTAINER_NETWORK_SAFE_FALLBACK_SCORE.pressure),
    signalSources: ['fallback'],
    pressureDomains: ['container'],
    reasonLines: [profile.flavorLine, 'Konteyner ağı sinyalleri henüz sınırlı.'],
    confidence: 'low',
    isVisibleToPlayer: false,
  };

  return {
    id: `container_network_fallback_${districtId}`,
    districtId,
    kind: 'capacity_rebalance',
    status: 'preview',
    healthResult,
    readinessScore: CONTAINER_NETWORK_SAFE_FALLBACK_SCORE.readiness,
    impactScore: CONTAINER_NETWORK_SAFE_FALLBACK_SCORE.impact,
    pressureLevel: healthResult.pressureLevel,
    impactDomains: ['container'],
    upgradeAxes: ['container_pressure'],
    title: profile.title,
    summaryLine: `${profile.title}: konteyner ağı geliştirmesi izleniyor.`,
    relatedMapLayerIds: buildRelatedMapLayerIds(),
    isVisibleToPlayer: false,
    isPreviewOnly: true,
  };
}

export function getSuggestedContainerNetworkTeam(
  context: ContainerNetworkContext,
): string | undefined {
  if (isContainerNetworkTeamRecommended(context)) return 'container_network_unit';
  if (isTechnicalTeamRecommended(context)) return 'technical_team_preventive_maintenance';
  const districtId = getContextDistrictId(context);
  if (districtId === 'yesilvadi' || getDistrictOperationKind(context) === 'environmental_care') {
    return 'container_network_unit';
  }
  return 'technical_team_preventive_maintenance';
}
