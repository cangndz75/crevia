import {
  getDistrictIdentity,
  normalizeMapDistrictId,
} from '@/core/districts/districtIdentityPresentation';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import {
  DISTRICT_OPERATION_CATALOG,
  getDistrictOperationCatalogForDistrict,
} from './districtOperationCatalog';
import {
  DISTRICT_OPERATION_HIGH_TRUST_LEVELS,
  DISTRICT_OPERATION_LOW_TRUST_LEVELS,
  DISTRICT_OPERATION_MAX_VISIBLE_CANDIDATES,
  DISTRICT_OPERATION_MIN_DAY_VISIBILITY,
  DISTRICT_OPERATION_SAFE_FALLBACK_DISTRICT,
} from './districtOperationConstants';
import {
  buildDistrictOperationSummaryLine,
  buildDistrictOperationUnlockLine,
} from './districtOperationPresentation';
import type {
  DistrictOperationCandidate,
  DistrictOperationContext,
  DistrictOperationDefinition,
  DistrictOperationEligibilityReason,
  DistrictOperationKind,
  DistrictOperationStatus,
  DistrictOperationTone,
} from './districtOperationTypes';

const DEFINITIONS_BY_ID = new Map(
  DISTRICT_OPERATION_CATALOG.map((definition) => [definition.id, definition]),
);

function hasPermission(context: DistrictOperationContext, permissionId?: string): boolean {
  if (!permissionId) return true;
  return (context.unlockedPermissionIds ?? []).includes(permissionId);
}

function normalizeDistrictId(value?: string | null): MapDistrictId | undefined {
  if (!value) return undefined;
  return normalizeMapDistrictId(value) ?? undefined;
}

function getContextDistrictId(context: DistrictOperationContext): MapDistrictId | undefined {
  return normalizeDistrictId(context.districtId);
}

function getTrustForDistrict(
  context: DistrictOperationContext,
  districtId: MapDistrictId,
) {
  return (context.districtTrustResults ?? []).find(
    (result) => result.districtId === districtId,
  );
}

function getMemoryForDistrict(
  context: DistrictOperationContext,
  districtId: MapDistrictId,
) {
  return (context.districtMemoryItems ?? []).filter(
    (item) => item.districtId === districtId,
  );
}

function textBlob(value: unknown): string {
  if (typeof value === 'string') return value.toLocaleLowerCase('tr-TR');
  if (Array.isArray(value)) return value.map(textBlob).join(' ');
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map(textBlob).join(' ');
  }
  return '';
}

function hasResourcePressure(context: DistrictOperationContext): boolean {
  const blob = [
    textBlob(context.resourceFatigue),
    textBlob(context.operationalResources),
    textBlob(context.operationSignals),
  ].join(' ');
  return ['strained', 'critical', 'tired', 'maintenance_risk', 'busy', 'watch'].some((token) =>
    blob.includes(token),
  );
}

function hasCrisisWatch(context: DistrictOperationContext): boolean {
  const blob = textBlob(context.crisisState);
  return ['watch', 'elevated', 'critical', 'active'].some((token) => blob.includes(token));
}

function hasRepeatedPressure(context: DistrictOperationContext, districtId: MapDistrictId): boolean {
  const memory = getMemoryForDistrict(context, districtId);
  return memory.some(
    (item) => item.kind === 'repeated_pressure' || item.kind === 'resource_strain',
  );
}

function matchesEventFamilyDomain(
  definition: DistrictOperationDefinition,
  context: DistrictOperationContext,
): boolean {
  const signals = context.eventFamilySignals ?? [];
  if (signals.length === 0) return false;
  return signals.some((signal) =>
    definition.relatedEventFamilyDomains.includes(signal.domain),
  );
}

function matchesActiveRoute(
  definition: DistrictOperationDefinition,
  context: DistrictOperationContext,
): boolean {
  const route = context.activeTaskRoute;
  if (!route) return false;
  const target = normalizeDistrictId(route.targetDistrictId);
  return target === definition.districtId;
}

function isRecoveryKind(kind: DistrictOperationKind): boolean {
  return kind === 'recovery_focus' || kind === 'district_memory_response';
}

function isCrisisPreventionKind(kind: DistrictOperationKind): boolean {
  return kind === 'crisis_prevention';
}

function isResourceKind(kind: DistrictOperationKind): boolean {
  return kind === 'resource_balance' || kind === 'route_discipline';
}

function isVisibleTrustKind(kind: DistrictOperationKind): boolean {
  return kind === 'visible_service' || kind === 'public_trust' || kind === 'environmental_care';
}

function isLowTrustLevel(level?: string): boolean {
  return (DISTRICT_OPERATION_LOW_TRUST_LEVELS as readonly string[]).includes(level ?? '');
}

function isHighTrustLevel(level?: string): boolean {
  return (DISTRICT_OPERATION_HIGH_TRUST_LEVELS as readonly string[]).includes(level ?? '');
}

export function getDistrictOperationDefinitions(): readonly DistrictOperationDefinition[] {
  return DISTRICT_OPERATION_CATALOG;
}

export function getDistrictOperationDefinitionsForDistrict(
  districtId: string,
): readonly DistrictOperationDefinition[] {
  return getDistrictOperationCatalogForDistrict(districtId);
}

export function getDistrictOperationDefinition(
  id: string,
): DistrictOperationDefinition | undefined {
  return DEFINITIONS_BY_ID.get(id);
}

export function getDistrictOperationEligibilityReasons(
  definition: DistrictOperationDefinition,
  context: DistrictOperationContext = {},
): DistrictOperationEligibilityReason[] {
  const reasons: DistrictOperationEligibilityReason[] = [];
  const districtId = definition.districtId;
  const trust = getTrustForDistrict(context, districtId);

  if (hasPermission(context, definition.requiredPermissionId)) {
    reasons.push('rank_unlocked');
  }
  if (trust && !isLowTrustLevel(trust.level)) {
    reasons.push('trust_level_met');
  }
  if (trust && isLowTrustLevel(trust.level) && isRecoveryKind(definition.kind)) {
    reasons.push('trust_needs_recovery');
  }
  if (hasRepeatedPressure(context, districtId)) {
    reasons.push('repeated_pressure_detected');
  }
  if (hasResourcePressure(context) && isResourceKind(definition.kind)) {
    reasons.push('resource_pressure_detected');
  }
  if (hasCrisisWatch(context) && isCrisisPreventionKind(definition.kind)) {
    reasons.push('crisis_watch_detected');
  }
  if (matchesEventFamilyDomain(definition, context)) {
    reasons.push('event_family_relevant');
  }
  if (matchesActiveRoute(definition, context)) {
    reasons.push('route_context_available');
  }
  if (context.operationEra && definition.unlockAxes.includes('operation_era')) {
    reasons.push('operation_era_relevant');
  }
  if (definition.isFutureOnly) {
    reasons.push('future_locked');
  }
  if (reasons.length === 0) {
    reasons.push('fallback');
  }
  return reasons;
}

export function resolveDistrictOperationStatus(
  definition: DistrictOperationDefinition,
  context: DistrictOperationContext = {},
): DistrictOperationStatus {
  const day = context.day ?? 1;

  if (definition.isFutureOnly) return 'future';

  if (day <= DISTRICT_OPERATION_MIN_DAY_VISIBILITY.hiddenMaxDay) {
    return 'preview';
  }

  const minDay = definition.minDay ?? DISTRICT_OPERATION_MIN_DAY_VISIBILITY.readyMinDay;
  if (day < minDay) {
    return 'preview';
  }

  const permissionGranted = hasPermission(context, definition.requiredPermissionId);
  if (definition.requiredPermissionId && !permissionGranted) {
    return 'preview';
  }

  const trust = getTrustForDistrict(context, definition.districtId);
  const contextDistrict = getContextDistrictId(context);

  const districtMatches =
    !contextDistrict || contextDistrict === definition.districtId;

  if (!contextDistrict && !context.districtId && day <= DISTRICT_OPERATION_MIN_DAY_VISIBILITY.previewMaxDay) {
    return 'preview';
  }

  if (!districtMatches && contextDistrict) {
    return permissionGranted ? 'ready' : 'preview';
  }

  if (trust && isLowTrustLevel(trust.level) && isRecoveryKind(definition.kind)) {
    return 'recommended';
  }

  if (trust && isHighTrustLevel(trust.level) && isVisibleTrustKind(definition.kind)) {
    return 'recommended';
  }

  if (hasCrisisWatch(context) && isCrisisPreventionKind(definition.kind)) {
    return 'recommended';
  }

  if (hasResourcePressure(context) && isResourceKind(definition.kind)) {
    return 'recommended';
  }

  if (matchesEventFamilyDomain(definition, context)) {
    return permissionGranted ? 'recommended' : 'ready';
  }

  if (matchesActiveRoute(definition, context) && permissionGranted) {
    return 'recommended';
  }

  if (permissionGranted) {
    return 'ready';
  }

  return day <= DISTRICT_OPERATION_MIN_DAY_VISIBILITY.previewMaxDay ? 'preview' : 'ready';
}

export function calculateDistrictOperationReadinessScore(
  definition: DistrictOperationDefinition,
  context: DistrictOperationContext = {},
): number {
  let score = 45;
  const day = context.day ?? 1;
  const districtId = definition.districtId;
  const trust = getTrustForDistrict(context, districtId);
  const contextDistrict = getContextDistrictId(context);

  if (hasPermission(context, definition.requiredPermissionId)) score += 15;
  if (trust && !isLowTrustLevel(trust.level)) score += 15;
  if (hasResourcePressure(context) && isResourceKind(definition.kind)) score += 10;
  if (matchesEventFamilyDomain(definition, context)) score += 10;
  if (matchesActiveRoute(definition, context)) score += 10;
  if (hasCrisisWatch(context) && isCrisisPreventionKind(definition.kind)) score += 15;
  if (trust && isLowTrustLevel(trust.level) && isRecoveryKind(definition.kind)) score += 15;
  if (trust && isHighTrustLevel(trust.level) && isVisibleTrustKind(definition.kind)) score += 8;

  if (day <= DISTRICT_OPERATION_MIN_DAY_VISIBILITY.hiddenMaxDay) score -= 20;
  if (contextDistrict && contextDistrict !== definition.districtId) score -= 15;
  if (definition.isFutureOnly) score -= 100;

  return Math.min(100, Math.max(0, score));
}

export function getDistrictOperationImpactLines(
  definition: DistrictOperationDefinition,
  _context: DistrictOperationContext = {},
): string[] {
  const lines: string[] = [];
  const districtLabel = getDistrictIdentity(definition.districtId).shortLabel;

  if (definition.impactDomains.includes('container')) {
    lines.push('Konteyner ağı baskısını azaltmaya odaklanır.');
  }
  if (definition.impactDomains.includes('vehicle_route')) {
    lines.push('Araç/rota yükünü daha dengeli dağıtır.');
  }
  if (definition.impactDomains.includes('trust')) {
    lines.push(`${districtLabel} mahalle güvenini toparlama fırsatı verir.`);
  }
  if (definition.impactDomains.includes('social')) {
    lines.push('Sosyal algı ve vatandaş temasını dengeler.');
  }
  if (definition.impactDomains.includes('crisis')) {
    lines.push('Kriz riskini erken izleme odağına alır.');
  }
  if (definition.impactDomains.includes('personnel')) {
    lines.push('Personel yükünü daha sürdürülebilir hale getirir.');
  }
  if (lines.length === 0) {
    lines.push(`${districtLabel} operasyon gündemine odaklanır.`);
  }
  return lines;
}

function resolveDistrictOperationTone(
  definition: DistrictOperationDefinition,
  context: DistrictOperationContext,
  status: DistrictOperationStatus,
): DistrictOperationTone {
  if (status === 'recommended' && isCrisisPreventionKind(definition.kind)) {
    return 'crisis_watch';
  }
  const trust = getTrustForDistrict(context, definition.districtId);
  if (trust && isLowTrustLevel(trust.level) && isRecoveryKind(definition.kind)) {
    return 'recovering';
  }
  if (hasResourcePressure(context) && isResourceKind(definition.kind)) {
    return 'strained';
  }
  if (status === 'recommended') return 'positive';
  if (status === 'preview' || status === 'future') return 'watch';
  return 'neutral';
}

function resolveCandidatePriority(
  definition: DistrictOperationDefinition,
  context: DistrictOperationContext,
  status: DistrictOperationStatus,
  readinessScore: number,
): number {
  let priority = definition.playerFacingPriority;
  if (status === 'recommended') priority += 20;
  if (matchesActiveRoute(definition, context)) priority += 12;
  if (getContextDistrictId(context) === definition.districtId) priority += 8;
  return priority + Math.round(readinessScore / 10);
}

export function buildDistrictOperationCandidate(
  definition: DistrictOperationDefinition,
  context: DistrictOperationContext = {},
): DistrictOperationCandidate {
  const status = resolveDistrictOperationStatus(definition, context);
  const readinessScore = calculateDistrictOperationReadinessScore(definition, context);
  const eligibilityReasons = getDistrictOperationEligibilityReasons(definition, context);
  const impactLines = getDistrictOperationImpactLines(definition, context);
  const tone = resolveDistrictOperationTone(definition, context, status);
  const day = context.day ?? 1;

  const candidate: DistrictOperationCandidate = {
    definition,
    status,
    tone,
    eligibilityReasons,
    priority: resolveCandidatePriority(definition, context, status, readinessScore),
    readinessScore,
    summaryLine: '',
    impactLines,
    isVisibleToPlayer: shouldShowDistrictOperationPreview(context) && day > 1,
    isPreviewOnly: status === 'preview' || status === 'future' || !hasPermission(context, definition.requiredPermissionId),
  };

  candidate.summaryLine = buildDistrictOperationSummaryLine(candidate);
  if (status === 'preview' || status === 'future' || !hasPermission(context, definition.requiredPermissionId)) {
    candidate.unlockLine = buildDistrictOperationUnlockLine(candidate);
  }
  if (status === 'recommended' || status === 'ready') {
    candidate.recommendedActionLine = `Operasyon önerisini incele: ${definition.shortLabel}`;
  }

  return candidate;
}

export function buildDistrictOperationCandidates(
  context: DistrictOperationContext = {},
): DistrictOperationCandidate[] {
  const contextDistrict = getContextDistrictId(context);
  const definitions = contextDistrict
    ? [
        ...getDistrictOperationDefinitionsForDistrict(contextDistrict),
        ...DISTRICT_OPERATION_CATALOG.filter((definition) => definition.districtId !== contextDistrict),
      ]
    : [...DISTRICT_OPERATION_CATALOG];

  return definitions.map((definition) => buildDistrictOperationCandidate(definition, context));
}

export function getRecommendedDistrictOperations(
  context: DistrictOperationContext = {},
  max = DISTRICT_OPERATION_MAX_VISIBLE_CANDIDATES,
): DistrictOperationCandidate[] {
  return buildDistrictOperationCandidates(context)
    .filter((candidate) => candidate.status === 'recommended' || candidate.status === 'ready')
    .sort((left, right) => {
      if (right.priority !== left.priority) return right.priority - left.priority;
      if (right.readinessScore !== left.readinessScore) {
        return right.readinessScore - left.readinessScore;
      }
      return left.definition.title.localeCompare(right.definition.title, 'tr');
    })
    .slice(0, max);
}

export function shouldShowDistrictOperationPreview(
  context: DistrictOperationContext = {},
): boolean {
  const day = context.day ?? 1;
  if (day <= DISTRICT_OPERATION_MIN_DAY_VISIBILITY.hiddenMaxDay) return false;
  if (day <= DISTRICT_OPERATION_MIN_DAY_VISIBILITY.previewMaxDay) return true;

  const hasPreviewPermission = hasPermission(context, 'district_specific_operations_preview');
  const hasTrustSignal = (context.districtTrustResults?.length ?? 0) > 0;
  const hasMemorySignal = (context.districtMemoryItems?.length ?? 0) > 0;

  return hasPreviewPermission || hasTrustSignal || hasMemorySignal || context.isFullMode === true;
}

export function buildDistrictOperationFallbackCandidate(
  districtId: string = DISTRICT_OPERATION_SAFE_FALLBACK_DISTRICT,
): DistrictOperationCandidate {
  const normalized = normalizeDistrictId(districtId) ?? DISTRICT_OPERATION_SAFE_FALLBACK_DISTRICT;
  const definition =
    getDistrictOperationDefinitionsForDistrict(normalized)[0] ??
    getDistrictOperationDefinition('visible_service_merkez')!;
  const identity = getDistrictIdentity(normalized);

  return {
    definition,
    status: 'preview',
    tone: 'neutral',
    eligibilityReasons: ['fallback'],
    priority: definition.playerFacingPriority,
    readinessScore: 40,
    summaryLine: `${identity.shortLabel} operasyon önerisi foundation modunda hazırlanıyor.`,
    impactLines: getDistrictOperationImpactLines(definition),
    unlockLine: 'Bölge sorumluluğu ilerledikçe mahalle özel operasyonları gündeme gelir.',
    isVisibleToPlayer: false,
    isPreviewOnly: true,
  };
}
