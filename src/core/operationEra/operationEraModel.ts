import {
  buildOperationEraRecommendationLine,
  buildOperationEraReviewLine,
  buildOperationEraSummaryLine,
  buildOperationEraUnlockLine,
} from './operationEraPresentation';
import {
  OPERATION_ERA_CATALOG,
  getOperationEraCatalogEntry,
} from './operationEraCatalog';
import {
  OPERATION_ERA_IS_TERMINAL_GAME_STATE,
  OPERATION_ERA_MIN_DAY_VISIBILITY,
  OPERATION_ERA_PILOT_MAX_DAY,
  OPERATION_ERA_SAFE_FALLBACK_SCORE,
  OPERATION_ERA_SCORE_RANGE,
} from './operationEraConstants';
import type {
  OperationEraCandidate,
  OperationEraContentHook,
  OperationEraContentWeightHints,
  OperationEraContext,
  OperationEraDefinition,
  OperationEraFocusDomain,
  OperationEraNonTerminalGuardResult,
  OperationEraStatus,
} from './operationEraTypes';

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

function hasPermission(context: OperationEraContext, permissionId?: string): boolean {
  if (!permissionId) return true;
  return (context.unlockedPermissionIds ?? []).includes(permissionId);
}

function isPilotContext(context: OperationEraContext): boolean {
  const day = context.day ?? 0;
  return context.isPilotDay === true || day <= OPERATION_ERA_PILOT_MAX_DAY;
}

function isFutureOnlyDefinition(definition: OperationEraDefinition): boolean {
  return definition.isFutureOnly;
}

function matchesEventFamily(definition: OperationEraDefinition, context: OperationEraContext): boolean {
  const signals = context.eventFamilySignals ?? [];
  if (signals.length === 0) return false;
  return signals.some((signal) => definition.relatedEventFamilyDomains.includes(signal.domain));
}

function matchesDistrictOperation(
  definition: OperationEraDefinition,
  context: OperationEraContext,
): boolean {
  const candidates = context.districtOperationCandidates ?? [];
  return candidates.some((candidate) =>
    definition.relatedDistrictOperationKinds.includes(candidate.definition.kind),
  );
}

function matchesVehicleMaintenance(
  definition: OperationEraDefinition,
  context: OperationEraContext,
): boolean {
  const window = context.vehicleMaintenanceWindow;
  if (!window) return false;
  return definition.relatedVehicleMaintenanceKinds.includes(window.kind);
}

function matchesContainerNetwork(
  definition: OperationEraDefinition,
  context: OperationEraContext,
): boolean {
  const candidates = context.containerNetworkCandidates ?? [];
  return candidates.some((candidate) =>
    definition.relatedContainerUpgradeKinds.includes(candidate.kind),
  );
}

function hasMapLayerContext(definition: OperationEraDefinition, context: OperationEraContext): boolean {
  const blob = textBlob(context.mapLayerStates);
  return definition.relatedMapLayerIds.some((layerId) => blob.includes(layerId));
}

function hasDistrictTrustContext(context: OperationEraContext): boolean {
  return (context.districtTrustResults ?? []).length > 0;
}

function hasLowOrHighTrustContext(context: OperationEraContext): boolean {
  return (context.districtTrustResults ?? []).some(
    (result) =>
      result.level === 'fragile' ||
      result.level === 'watch' ||
      result.level === 'stable' ||
      result.level === 'trusted' ||
      result.level === 'supportive',
  );
}

function hasVehicleRoutePressure(context: OperationEraContext): boolean {
  const blob = [
    textBlob(context.operationSignals),
    textBlob(context.vehicleMaintenanceWindow),
    textBlob(context.activeTaskRoute),
  ].join(' ');
  return ['vehicle', 'route', 'maintenance', 'route_pressure', 'strained', 'critical'].some(
    (token) => blob.includes(token),
  );
}

function hasContainerPressure(context: OperationEraContext): boolean {
  const blob = [
    textBlob(context.containerNetworkCandidates),
    textBlob(context.operationSignals),
  ].join(' ');
  return ['container', 'konteyner', 'cleanliness', 'fillpressure', 'capacity'].some((token) =>
    blob.includes(token),
  );
}

function hasCrisisWatch(context: OperationEraContext): boolean {
  const blob = textBlob(context.crisisState);
  return ['watch', 'elevated', 'critical', 'active'].some((token) => blob.includes(token));
}

function hasSocialPulsePressure(context: OperationEraContext): boolean {
  const blob = textBlob(context.socialPulse) + textBlob(context.operationSignals);
  return ['social', 'complaint', 'pulse', 'temizlik', 'güven'].some((token) => blob.includes(token));
}

function hasCityDevelopmentFutureContext(context: OperationEraContext): boolean {
  const blob = textBlob(context.mapLayerStates) + textBlob(context.contentPackAvailability);
  return blob.includes('city_development') || blob.includes('content_pack');
}

function hasActiveRouteVehicleContext(context: OperationEraContext): boolean {
  const route = context.activeTaskRoute;
  if (!route) return false;
  const blob = textBlob(route);
  return route.domain === 'vehicle_route' || blob.includes('vehicle') || blob.includes('route');
}

function hasTeamSpecializationRelevant(
  definition: OperationEraDefinition,
  context: OperationEraContext,
): boolean {
  return (context.teamSpecializationResults ?? []).some((result) =>
    definition.relatedTeamSpecializationIds.includes(result.specialization.id),
  );
}

function hasMissingContentHooks(
  definition: OperationEraDefinition,
  context: OperationEraContext,
): boolean {
  if (definition.contentHooks.length === 0) return true;
  const hookPresent = definition.contentHooks.some((hook) => {
    switch (hook) {
      case 'event_family':
        return matchesEventFamily(definition, context);
      case 'district_operation':
        return matchesDistrictOperation(definition, context);
      case 'map_layer':
        return hasMapLayerContext(definition, context);
      case 'active_task_route':
        return !!context.activeTaskRoute;
      case 'team_specialization':
        return (context.teamSpecializationResults ?? []).length > 0;
      case 'vehicle_maintenance':
        return !!context.vehicleMaintenanceWindow;
      case 'container_network':
        return (context.containerNetworkCandidates ?? []).length > 0;
      case 'district_trust':
        return hasDistrictTrustContext(context);
      case 'advisor_note':
        return !!context.reportSummary || textBlob(context).includes('advisor');
      case 'social_pulse':
        return !!context.socialPulse;
      case 'report_review':
        return !!context.reportSummary;
      case 'city_development':
        return hasCityDevelopmentFutureContext(context);
      default:
        return false;
    }
  });
  return !hookPresent;
}

export function clampOperationEraScore(score: number): number {
  if (!Number.isFinite(score)) return OPERATION_ERA_SAFE_FALLBACK_SCORE.readiness;
  return Math.min(
    OPERATION_ERA_SCORE_RANGE.max,
    Math.max(OPERATION_ERA_SCORE_RANGE.min, Math.round(score)),
  );
}

export function getOperationEraDefinitions(): readonly OperationEraDefinition[] {
  return OPERATION_ERA_CATALOG;
}

export function getOperationEraDefinition(id: string): OperationEraDefinition | undefined {
  return getOperationEraCatalogEntry(id);
}

export function getOperationEraDefinitionsByFocusDomain(
  domain: OperationEraFocusDomain,
): OperationEraDefinition[] {
  return OPERATION_ERA_CATALOG.filter((definition) => definition.focusDomains.includes(domain));
}

export function getOperationEraDefinitionsByContentHook(
  hook: OperationEraContentHook,
): OperationEraDefinition[] {
  return OPERATION_ERA_CATALOG.filter((definition) => definition.contentHooks.includes(hook));
}

export function calculateOperationEraReadinessScore(
  definition: OperationEraDefinition,
  context: OperationEraContext,
): number {
  let score = OPERATION_ERA_SAFE_FALLBACK_SCORE.readiness;

  if (hasPermission(context, 'operation_era_preview')) score += 20;
  if (hasPermission(context, definition.requiredPermissionId)) score += 10;
  if (
    typeof context.authorityTrust === 'number' &&
    typeof definition.minAuthority === 'number' &&
    context.authorityTrust >= definition.minAuthority
  ) {
    score += 8;
  } else if (
    typeof context.authorityTrust === 'number' &&
    context.authorityTrust >= 55 &&
    !definition.minAuthority
  ) {
    score += 8;
  }
  if (typeof context.xp === 'number' && typeof definition.minXp === 'number' && context.xp >= definition.minXp) {
    score += 8;
  } else if (typeof context.xp === 'number' && context.xp >= 120 && !definition.minXp) {
    score += 8;
  }
  if ((context.day ?? 0) >= OPERATION_ERA_MIN_DAY_VISIBILITY.previewMinDay) score += 8;
  if (matchesEventFamily(definition, context)) score += 10;
  if (matchesDistrictOperation(definition, context)) score += 10;
  if (matchesVehicleMaintenance(definition, context)) score += 8;
  if (matchesContainerNetwork(definition, context)) score += 8;
  if (hasMapLayerContext(definition, context)) score += 6;
  if (hasDistrictTrustContext(context) && definition.focusDomains.includes('district_trust')) score += 6;
  if (context.isFullMode) score += 5;

  if (isPilotContext(context)) score -= 25;
  if ((context.day ?? 0) <= 3) score -= 20;
  if (hasMissingContentHooks(definition, context)) score -= 10;
  if (isFutureOnlyDefinition(definition)) score -= 100;
  if (context.isLimitedMode && !definition.isFutureOnly) score -= 8;

  return clampOperationEraScore(score);
}

export function calculateOperationEraRelevanceScore(
  definition: OperationEraDefinition,
  context: OperationEraContext,
): number {
  let score = OPERATION_ERA_SAFE_FALLBACK_SCORE.relevance;

  if (definition.id === 'route_maintenance_era' && hasVehicleRoutePressure(context)) score += 15;
  if (definition.id === 'container_network_era' && hasContainerPressure(context)) score += 15;
  if (definition.id === 'district_trust_era' && hasLowOrHighTrustContext(context)) score += 12;
  if (definition.id === 'crisis_recovery_era' && hasCrisisWatch(context)) score += 15;
  if (definition.id === 'social_pulse_era' && hasSocialPulsePressure(context)) score += 10;
  if (definition.id === 'city_growth_preview_era' && hasCityDevelopmentFutureContext(context)) {
    score += 8;
  }
  if (definition.id === 'route_maintenance_era' && hasActiveRouteVehicleContext(context)) score += 8;
  if (hasTeamSpecializationRelevant(definition, context)) score += 8;

  if (definition.id === 'core_city_operations' && (context.day ?? 0) >= 8) score += 10;

  return clampOperationEraScore(score);
}

export function resolveOperationEraStatus(
  definition: OperationEraDefinition,
  context: OperationEraContext,
  readiness: number,
  relevance: number,
): OperationEraStatus {
  if (isFutureOnlyDefinition(definition)) return 'future';
  if (isPilotContext(context)) return readiness < 20 ? 'unavailable' : 'preview';
  if (readiness < 35) return readiness < 20 ? 'unavailable' : 'preview';

  const hasStrongContext =
    matchesEventFamily(definition, context) ||
    matchesDistrictOperation(definition, context) ||
    matchesVehicleMaintenance(definition, context) ||
    matchesContainerNetwork(definition, context) ||
    hasPermission(context, 'operation_era_preview');

  if (readiness >= 60 && relevance >= 55) return 'recommended';
  if (readiness >= 50) return 'available';
  if (hasStrongContext && readiness >= 40 && hasPermission(context, 'operation_era_preview')) {
    return relevance >= 45 ? 'recommended' : 'available';
  }
  return 'preview';
}

function buildEligibilityReasons(
  definition: OperationEraDefinition,
  context: OperationEraContext,
  readiness: number,
  relevance: number,
): string[] {
  const reasons: string[] = [definition.flavorLine];

  if (hasPermission(context, 'operation_era_preview')) {
    reasons.push('Operasyon dönemi önizleme yetkisi açık.');
  }
  if (matchesEventFamily(definition, context)) {
    reasons.push('Olay ailesi sinyalleri bu dönemle uyumlu.');
  }
  if (matchesDistrictOperation(definition, context)) {
    reasons.push('Mahalle operasyon adayları dönem odağını destekliyor.');
  }
  if (matchesVehicleMaintenance(definition, context)) {
    reasons.push('Araç bakım penceresi bu dönemle eşleşiyor.');
  }
  if (matchesContainerNetwork(definition, context)) {
    reasons.push('Konteyner ağı geliştirme sinyalleri bu dönemi güçlendiriyor.');
  }
  if (hasMapLayerContext(definition, context)) {
    reasons.push('Harita katmanları dönem bağlamını taşıyor.');
  }
  if (readiness >= 50) {
    reasons.push('Hazırlık skoru dönem önerisi için yeterli.');
  }
  if (relevance >= 55) {
    reasons.push('Güncel operasyon sinyalleri bu dönemi öne çıkarıyor.');
  }
  if (isFutureOnlyDefinition(definition)) {
    reasons.push('Bu dönem ileride açılacak şehir gelişimi hazırlığıdır.');
  }

  return reasons.filter(Boolean);
}

export function buildOperationEraCandidate(
  definition: OperationEraDefinition,
  context: OperationEraContext,
): OperationEraCandidate {
  const readinessScore = calculateOperationEraReadinessScore(definition, context);
  const relevanceScore = calculateOperationEraRelevanceScore(definition, context);
  const status = resolveOperationEraStatus(definition, context, readinessScore, relevanceScore);
  const eligibilityReasons = buildEligibilityReasons(
    definition,
    context,
    readinessScore,
    relevanceScore,
  );

  const candidate: OperationEraCandidate = {
    definition,
    status,
    readinessScore,
    relevanceScore,
    tone: definition.tone,
    focusDomains: definition.focusDomains,
    contentHooks: definition.contentHooks,
    eligibilityReasons,
    summaryLine: buildOperationEraSummaryLine({
      definition,
      status,
      readinessScore,
      relevanceScore,
      tone: definition.tone,
      focusDomains: definition.focusDomains,
      contentHooks: definition.contentHooks,
      eligibilityReasons,
      summaryLine: '',
      isVisibleToPlayer: false,
      isPreviewOnly: status === 'preview',
    }),
    unlockLine: buildOperationEraUnlockLine({
      definition,
      status,
      readinessScore,
      relevanceScore,
      tone: definition.tone,
      focusDomains: definition.focusDomains,
      contentHooks: definition.contentHooks,
      eligibilityReasons,
      summaryLine: '',
      isVisibleToPlayer: false,
      isPreviewOnly: status === 'preview',
    }),
    recommendationLine: buildOperationEraRecommendationLine({
      definition,
      status,
      readinessScore,
      relevanceScore,
      tone: definition.tone,
      focusDomains: definition.focusDomains,
      contentHooks: definition.contentHooks,
      eligibilityReasons,
      summaryLine: '',
      isVisibleToPlayer: false,
      isPreviewOnly: status === 'preview',
    }),
    reviewLine: buildOperationEraReviewLine({
      definition,
      status,
      readinessScore,
      relevanceScore,
      tone: definition.tone,
      focusDomains: definition.focusDomains,
      contentHooks: definition.contentHooks,
      eligibilityReasons,
      summaryLine: '',
      isVisibleToPlayer: false,
      isPreviewOnly: status === 'preview',
    }),
    isVisibleToPlayer: false,
    isPreviewOnly: status === 'preview' || status === 'unavailable' || status === 'future',
  };

  candidate.isVisibleToPlayer = shouldShowOperationEraPreview(context, candidate);
  candidate.summaryLine =
    candidate.summaryLine || `${definition.title}: ${definition.shortLabel} dönemi izleniyor.`;

  return candidate;
}

export function buildOperationEraCandidates(context: OperationEraContext): OperationEraCandidate[] {
  return OPERATION_ERA_CATALOG.map((definition) => buildOperationEraCandidate(definition, context));
}

export function getRecommendedOperationEras(
  context: OperationEraContext,
  max = 3,
): OperationEraCandidate[] {
  const statusWeight = (status: OperationEraStatus) => {
    if (status === 'recommended') return 5;
    if (status === 'available') return 4;
    if (status === 'active') return 6;
    if (status === 'preview') return 2;
    if (status === 'future') return 1;
    return 0;
  };

  return buildOperationEraCandidates(context)
    .filter((candidate) => candidate.isVisibleToPlayer && candidate.status !== 'unavailable')
    .sort((a, b) => {
      const scoreA =
        statusWeight(a.status) * 100 +
        a.readinessScore +
        a.relevanceScore +
        a.definition.playerFacingPriority;
      const scoreB =
        statusWeight(b.status) * 100 +
        b.readinessScore +
        b.relevanceScore +
        b.definition.playerFacingPriority;
      return scoreB - scoreA;
    })
    .slice(0, max);
}

export function shouldShowOperationEraPreview(
  context: OperationEraContext,
  candidate: OperationEraCandidate,
): boolean {
  if (isFutureOnlyDefinition(candidate.definition)) {
    return candidate.status === 'future' || candidate.status === 'preview';
  }

  if (isPilotContext(context)) {
    return false;
  }

  if ((context.day ?? 0) < OPERATION_ERA_MIN_DAY_VISIBILITY.previewMinDay) {
    return false;
  }

  if (hasPermission(context, 'operation_era_preview')) return true;

  const hasContext =
    matchesEventFamily(candidate.definition, context) ||
    matchesDistrictOperation(candidate.definition, context) ||
    matchesVehicleMaintenance(candidate.definition, context) ||
    matchesContainerNetwork(candidate.definition, context) ||
    hasDistrictTrustContext(context);

  if ((context.day ?? 0) >= OPERATION_ERA_MIN_DAY_VISIBILITY.previewMinDay && hasContext) {
    return true;
  }

  return candidate.readinessScore >= 45 && hasContext;
}

export function buildOperationEraFallbackCandidate(
  context: OperationEraContext = {},
): OperationEraCandidate {
  const definition =
    getOperationEraDefinition('core_city_operations') ?? OPERATION_ERA_CATALOG[0]!;
  return buildOperationEraCandidate(definition, context);
}

export function getOperationEraContentWeightHints(
  candidate: OperationEraCandidate,
): OperationEraContentWeightHints {
  const definition = candidate.definition;
  const resourceSystems: string[] = [];

  if (definition.focusDomains.includes('vehicle_route')) resourceSystems.push('vehicles');
  if (definition.focusDomains.includes('container_network')) resourceSystems.push('containers');
  if (definition.focusDomains.includes('personnel_team')) resourceSystems.push('personnel');
  if (definition.focusDomains.includes('district_trust')) resourceSystems.push('districts');

  return {
    preferredEventFamilyDomains: [...definition.relatedEventFamilyDomains],
    preferredDistrictOperationKinds: [...definition.relatedDistrictOperationKinds],
    preferredMapLayerIds: [...definition.relatedMapLayerIds],
    preferredResourceSystems: resourceSystems,
  };
}

export function assertOperationEraIsNonTerminal(
  candidate: OperationEraCandidate,
): OperationEraNonTerminalGuardResult {
  if (OPERATION_ERA_IS_TERMINAL_GAME_STATE) {
    return { ok: false, message: 'Operation era terminal flag must remain false.' };
  }

  const forbiddenGameEnd = ['oyun bitti', 'sezon finali', 'sezon sonu', 'final sezon'];
  const copyBlob = [
    candidate.summaryLine,
    candidate.unlockLine ?? '',
    candidate.recommendationLine ?? '',
    candidate.reviewLine ?? '',
    ...candidate.eligibilityReasons,
  ]
    .join(' ')
    .toLocaleLowerCase('tr-TR');

  if (forbiddenGameEnd.some((term) => copyBlob.includes(term))) {
    return { ok: false, message: 'Operation era copy contains terminal game-end language.' };
  }

  return {
    ok: true,
    message: 'Operation era remains a non-terminal career theme period.',
  };
}
