import type { PersonnelAssignmentType } from '@/core/assignments/assignmentTypes';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import type { ActiveTaskRouteDomain } from '@/core/activeTaskRoutes/activeTaskRouteTypes';
import type { EventFamilyDomain } from '@/core/eventFamilies/eventFamilyTypes';

import { TEAM_SPECIALIZATION_CATALOG } from './teamSpecializationCatalog';
import {
  ASSIGNMENT_PERSONNEL_TO_SPECIALIZATION_GROUP,
  OPERATIONAL_PERSONNEL_TO_SPECIALIZATION_GROUP,
  TEAM_SPECIALIZATION_FIT_THRESHOLDS,
  TEAM_SPECIALIZATION_MIN_DAY_VISIBILITY,
  TEAM_SPECIALIZATION_SAFE_DEFAULT_GROUP,
} from './teamSpecializationConstants';
import {
  buildTeamSpecializationCompactLine,
  buildTeamSpecializationRecommendationLine,
  buildTeamSpecializationAssignmentPreviewLine,
} from './teamSpecializationPresentation';
import type {
  TeamSpecializationCapability,
  TeamSpecializationContext,
  TeamSpecializationDefinition,
  TeamSpecializationDomain,
  TeamSpecializationFitLevel,
  TeamSpecializationFitResult,
  TeamSpecializationGroupId,
  TeamSpecializationSource,
  TeamSpecializationStatus,
  TeamSpecializationTone,
} from './teamSpecializationTypes';

const DEFINITIONS_BY_ID = new Map(
  TEAM_SPECIALIZATION_CATALOG.map((definition) => [definition.id, definition]),
);

function textBlob(value: unknown): string {
  if (typeof value === 'string') return value.toLocaleLowerCase('tr-TR');
  if (Array.isArray(value)) return value.map(textBlob).join(' ');
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map(textBlob).join(' ');
  }
  return '';
}

function hasCrisisContext(context: TeamSpecializationContext): boolean {
  const blob = textBlob(context.crisisState);
  return ['watch', 'elevated', 'critical', 'active', 'strained'].some((token) =>
    blob.includes(token),
  );
}

function hasRecoveryContext(context: TeamSpecializationContext): boolean {
  const trust = context.districtTrustResult;
  if (trust && ['fragile', 'watch', 'falling', 'strained'].includes(trust.level)) {
    return true;
  }
  const memory = context.districtMemoryItems ?? [];
  return memory.some(
    (item) =>
      item.kind === 'recovery_window' ||
      item.kind === 'recent_improvement' ||
      item.kind === 'repeated_pressure',
  );
}

function hasPublicTrustContext(context: TeamSpecializationContext): boolean {
  const candidate = context.districtOperationCandidate;
  if (
    candidate?.definition.kind === 'public_trust' ||
    candidate?.definition.kind === 'recovery_focus'
  ) {
    return true;
  }
  const trust = context.districtTrustResult;
  return trust != null && ['fragile', 'watch'].includes(trust.level);
}

function hasSevereResourceFatigue(context: TeamSpecializationContext): boolean {
  const blob = [
    textBlob(context.resourceFatigue),
    textBlob(context.operationalResources),
    textBlob(context.operationSignals),
  ].join(' ');
  return ['critical', 'strained', 'maintenance_risk', 'tired'].some((token) =>
    blob.includes(token),
  );
}

function domainFromOperationSignalFocus(focus?: string): TeamSpecializationDomain | null {
  if (focus === 'containers') return 'container';
  if (focus === 'vehicles') return 'vehicle_route';
  if (focus === 'personnel') return 'personnel';
  if (focus === 'districts') return 'district_balance';
  return null;
}

export function getTeamSpecializationDefinitions(): readonly TeamSpecializationDefinition[] {
  return TEAM_SPECIALIZATION_CATALOG;
}

export function getTeamSpecializationDefinition(
  id: string,
): TeamSpecializationDefinition | undefined {
  return DEFINITIONS_BY_ID.get(id);
}

export function getSpecializationsForGroup(
  groupId: TeamSpecializationGroupId | string,
): readonly TeamSpecializationDefinition[] {
  return TEAM_SPECIALIZATION_CATALOG.filter((definition) => definition.groupId === groupId);
}

export function mapOperationalPersonnelGroupToSpecialization(
  personnelGroupId: string,
): TeamSpecializationGroupId {
  const mapped =
    OPERATIONAL_PERSONNEL_TO_SPECIALIZATION_GROUP[
      personnelGroupId as keyof typeof OPERATIONAL_PERSONNEL_TO_SPECIALIZATION_GROUP
    ];
  return mapped ?? TEAM_SPECIALIZATION_SAFE_DEFAULT_GROUP;
}

export function mapAssignmentPersonnelToSpecializationGroup(
  personnelType: PersonnelAssignmentType,
): TeamSpecializationGroupId {
  return ASSIGNMENT_PERSONNEL_TO_SPECIALIZATION_GROUP[personnelType];
}

export function resolveTeamGroupFromAssignment(
  assignment?: EventAssignmentState | null,
): TeamSpecializationGroupId {
  if (!assignment) return TEAM_SPECIALIZATION_SAFE_DEFAULT_GROUP;

  const vehicleType = assignment.vehicleType;
  if (vehicleType === 'route_support_vehicle') return 'route_support_team';
  if (
    vehicleType === 'maintenance_vehicle' &&
    assignment.personnelType === 'technical_team'
  ) {
    return 'technical_team';
  }

  const personnelGroup = mapAssignmentPersonnelToSpecializationGroup(assignment.personnelType);
  if (assignment.approachType === 'public_first') return 'public_communication_team';
  if (assignment.approachType === 'rapid_response') return 'field_team';

  return personnelGroup;
}

export function getTeamSpecializationDomainSignals(
  context: TeamSpecializationContext = {},
): TeamSpecializationDomain[] {
  const signals = new Set<TeamSpecializationDomain>();

  const districtOp = context.districtOperationCandidate;
  if (districtOp) {
    for (const domain of districtOp.definition.impactDomains) {
      if (domain === 'trust') signals.add('public_trust');
      else if (domain === 'map') signals.add('district_balance');
      else if (domain === 'city_development') signals.add('district_balance');
      else signals.add(domain as TeamSpecializationDomain);
    }
    if (districtOp.definition.kind === 'environmental_care') {
      signals.add('environmental_care');
    }
    if (districtOp.definition.kind === 'public_trust') {
      signals.add('public_trust');
      signals.add('social');
    }
  }

  const routeDomain = context.activeTaskRoute?.domain;
  if (routeDomain === 'vehicle_route') signals.add('vehicle_route');
  if (routeDomain === 'container') signals.add('container');
  if (routeDomain === 'personnel') signals.add('personnel');
  if (routeDomain === 'social') signals.add('social');
  if (routeDomain === 'crisis') signals.add('crisis');
  if (routeDomain === 'district_balance') signals.add('district_balance');
  if (routeDomain === 'generic') signals.add('generic_operation');

  for (const signal of context.eventFamilySignals ?? []) {
    if (signal.domain === 'crisis_adjacent') signals.add('crisis');
    else if (signal.domain === 'social') signals.add('social');
    else if (signal.domain === 'vehicle_route') signals.add('vehicle_route');
    else if (signal.domain === 'container') signals.add('container');
    else if (signal.domain === 'resource_recovery') signals.add('resource_recovery');
    else if (signal.domain === 'district_balance') signals.add('district_balance');
    else signals.add('generic_operation');
  }

  if (hasCrisisContext(context)) signals.add('crisis');
  if (hasRecoveryContext(context)) signals.add('resource_recovery');
  if (hasPublicTrustContext(context)) {
    signals.add('public_trust');
    signals.add('social');
  }

  const focusDomain = domainFromOperationSignalFocus(context.operationSignals?.dailyFocus);
  if (focusDomain) signals.add(focusDomain);

  for (const domain of context.districtTrustResult?.pressureDomains ?? []) {
    if (domain === 'social') signals.add('social');
    if (domain === 'container') signals.add('container');
    if (domain === 'vehicle_route') signals.add('vehicle_route');
    if (domain === 'personnel') signals.add('personnel');
    if (domain === 'crisis') signals.add('crisis');
    if (domain === 'district_balance') signals.add('district_balance');
    if (domain === 'resource_recovery') signals.add('resource_recovery');
  }

  if (signals.size === 0) signals.add('generic_operation');
  return [...signals];
}

function hasCapability(
  definition: TeamSpecializationDefinition,
  capability: TeamSpecializationCapability,
): boolean {
  return definition.capabilities.includes(capability);
}

function matchesDistrictOperationKind(
  definition: TeamSpecializationDefinition,
  context: TeamSpecializationContext,
): boolean {
  const kind = context.districtOperationCandidate?.definition.kind;
  if (!kind) return false;
  return definition.preferredDistrictOperationKinds.includes(kind);
}

function matchesEventFamilyDomain(
  definition: TeamSpecializationDefinition,
  domain: EventFamilyDomain,
): boolean {
  return definition.preferredEventFamilyDomains.includes(domain);
}

function matchesRouteDomain(
  definition: TeamSpecializationDefinition,
  domain: ActiveTaskRouteDomain,
): boolean {
  return definition.preferredRouteDomains.includes(domain);
}

export function calculateTeamSpecializationFitScore(
  definition: TeamSpecializationDefinition,
  context: TeamSpecializationContext = {},
): number {
  let score = 45;
  const day = context.day ?? 1;
  const domainSignals = getTeamSpecializationDomainSignals(context);
  const selectedGroup =
    context.selectedTeamGroupId ?? resolveTeamGroupFromAssignment(context.assignment);

  if (selectedGroup === definition.groupId) score += 15;

  for (const domain of domainSignals) {
    if (definition.primaryDomains.includes(domain)) score += 15;
    else if (definition.secondaryDomains.includes(domain)) score += 8;
    if (definition.weaknessDomains.includes(domain)) score -= 12;
  }

  if (matchesDistrictOperationKind(definition, context)) score += 12;

  const route = context.activeTaskRoute;
  if (route && matchesRouteDomain(definition, route.domain)) score += 10;

  for (const signal of context.eventFamilySignals ?? []) {
    if (matchesEventFamilyDomain(definition, signal.domain)) score += 10;
  }

  if (hasCrisisContext(context) && hasCapability(definition, 'crisis_coordination')) {
    score += 15;
  }
  if (hasCrisisContext(context) && !hasCapability(definition, 'crisis_coordination')) {
    score -= 10;
  }

  if (hasRecoveryContext(context) && hasCapability(definition, 'recovery_support')) {
    score += 10;
  }

  if (hasPublicTrustContext(context) && hasCapability(definition, 'public_communication')) {
    score += 10;
  }

  if (
    domainSignals.includes('vehicle_route') &&
    hasCapability(definition, 'route_discipline')
  ) {
    score += 10;
  }

  if (
    domainSignals.includes('container') &&
    hasCapability(definition, 'container_network_support')
  ) {
    score += 10;
  }

  if (
    hasSevereResourceFatigue(context) &&
    !hasCapability(definition, 'recovery_support') &&
    !hasCapability(definition, 'preventive_maintenance')
  ) {
    score -= 8;
  }

  if (day <= TEAM_SPECIALIZATION_MIN_DAY_VISIBILITY.hiddenMaxDay) score -= 15;
  if (definition.isFutureOnly) score -= 100;

  return Math.min(100, Math.max(0, score));
}

export function getTeamSpecializationFitLevel(score: number): TeamSpecializationFitLevel {
  const clamped = Math.min(100, Math.max(0, score));
  if (clamped <= TEAM_SPECIALIZATION_FIT_THRESHOLDS.poorMax) return 'poor';
  if (clamped <= TEAM_SPECIALIZATION_FIT_THRESHOLDS.weakMax) return 'weak';
  if (clamped <= TEAM_SPECIALIZATION_FIT_THRESHOLDS.acceptableMax) return 'acceptable';
  if (clamped <= TEAM_SPECIALIZATION_FIT_THRESHOLDS.goodMax) return 'good';
  if (clamped <= TEAM_SPECIALIZATION_FIT_THRESHOLDS.strongMax) return 'strong';
  return 'excellent';
}

export function resolveTeamSpecializationStatus(
  definition: TeamSpecializationDefinition,
  context: TeamSpecializationContext,
  score: number,
): TeamSpecializationStatus {
  const day = context.day ?? 1;
  if (definition.isFutureOnly) return 'future';

  if (day <= TEAM_SPECIALIZATION_MIN_DAY_VISIBILITY.hiddenMaxDay) {
    return 'preview';
  }

  const selectedGroup =
    context.selectedTeamGroupId ?? resolveTeamGroupFromAssignment(context.assignment);
  const fitLevel = getTeamSpecializationFitLevel(score);

  if (hasSevereResourceFatigue(context) && fitLevel === 'poor') {
    return 'strained';
  }

  if (selectedGroup === definition.groupId && score >= 55) {
    return context.isFieldPhase || context.isDispatchPhase ? 'active' : 'recommended';
  }

  if (score >= 70) return 'recommended';
  if (score >= 55) return 'available';
  if (score >= 40) return day <= TEAM_SPECIALIZATION_MIN_DAY_VISIBILITY.previewMaxDay ? 'preview' : 'available';
  return 'preview';
}

function resolveTone(
  status: TeamSpecializationStatus,
  context: TeamSpecializationContext,
): TeamSpecializationTone {
  if (status === 'strained') return 'strained';
  if (hasCrisisContext(context)) return 'crisis';
  if (status === 'recommended' || status === 'active') return 'positive';
  if (hasRecoveryContext(context)) return 'recovering';
  if (status === 'preview') return 'watch';
  return 'neutral';
}

function buildPressureWarnings(
  definition: TeamSpecializationDefinition,
  context: TeamSpecializationContext,
): string[] {
  const warnings: string[] = [];
  const domainSignals = getTeamSpecializationDomainSignals(context);

  for (const domain of domainSignals) {
    if (definition.weaknessDomains.includes(domain)) {
      if (domain === 'social' || domain === 'public_trust') {
        warnings.push('Bu ekip sosyal baskıyı doğrudan azaltmayabilir.');
      }
      if (domain === 'vehicle_route') {
        warnings.push('Araç/rota baskısı için teknik destek gerekebilir.');
      }
    }
  }

  if (hasCrisisContext(context) && !hasCapability(definition, 'crisis_coordination')) {
    warnings.push('Kriz eşiğinde kriz koordinasyonu için farklı ekip daha uygun olabilir.');
  }

  if (
    hasSevereResourceFatigue(context) &&
    !hasCapability(definition, 'recovery_support') &&
    !hasCapability(definition, 'preventive_maintenance')
  ) {
    warnings.push('Kaynak yorgunluğu yüksek; toparlanma desteği sınırlı kalabilir.');
  }

  return warnings;
}

export function buildTeamSpecializationSourceSignals(
  context: TeamSpecializationContext = {},
): TeamSpecializationSource[] {
  const sources: TeamSpecializationSource[] = [];
  if (context.assignment) sources.push('assignment');
  if (context.operationalResources) sources.push('operational_resource');
  if (context.districtOperationCandidate) sources.push('district_operation');
  if (context.activeTaskRoute) sources.push('active_task_route');
  if ((context.eventFamilySignals?.length ?? 0) > 0) sources.push('event_family');
  if (context.districtTrustResult || (context.districtMemoryItems?.length ?? 0) > 0) {
    sources.push('district_trust');
  }
  if (context.resourceFatigue || hasSevereResourceFatigue(context)) {
    sources.push('resource_fatigue');
  }
  if (hasCrisisContext(context)) sources.push('crisis_state');
  if (sources.length === 0) sources.push('fallback');
  return sources;
}

export function buildTeamSpecializationFitResult(
  definition: TeamSpecializationDefinition,
  context: TeamSpecializationContext = {},
): TeamSpecializationFitResult {
  const fitScore = calculateTeamSpecializationFitScore(definition, context);
  const fitLevel = getTeamSpecializationFitLevel(fitScore);
  const status = resolveTeamSpecializationStatus(definition, context, fitScore);
  const domainSignals = getTeamSpecializationDomainSignals(context);
  const matchedDomains = domainSignals.filter(
    (domain) =>
      definition.primaryDomains.includes(domain) ||
      definition.secondaryDomains.includes(domain),
  );
  const missingDomains = definition.primaryDomains.filter(
    (domain) => !domainSignals.includes(domain),
  );
  const matchedCapabilities = definition.capabilities.filter((capability) => {
    if (capability === 'crisis_coordination' && hasCrisisContext(context)) return true;
    if (capability === 'recovery_support' && hasRecoveryContext(context)) return true;
    if (capability === 'public_communication' && hasPublicTrustContext(context)) return true;
    if (capability === 'route_discipline' && domainSignals.includes('vehicle_route')) return true;
    if (capability === 'container_network_support' && domainSignals.includes('container')) {
      return true;
    }
    return matchesDistrictOperationKind(definition, context);
  });

  const result: TeamSpecializationFitResult = {
    specialization: definition,
    fitScore,
    fitLevel,
    status,
    tone: resolveTone(status, context),
    matchedDomains,
    missingDomains,
    matchedCapabilities,
    pressureWarnings: buildPressureWarnings(definition, context),
    sourceSignals: buildTeamSpecializationSourceSignals(context),
    summaryLine: '',
    isVisibleToPlayer: shouldShowTeamSpecializationPreview(context),
    isPreviewOnly: status === 'preview' || status === 'future',
  };

  result.summaryLine = buildTeamSpecializationCompactLine(result);
  if (status === 'recommended' || status === 'active') {
    result.recommendationLine = buildTeamSpecializationRecommendationLine(result);
  }

  return result;
}

export function buildTeamSpecializationFitResults(
  context: TeamSpecializationContext = {},
): TeamSpecializationFitResult[] {
  const selectedGroup = resolveTeamGroupFromAssignment(context.assignment);
  const enriched: TeamSpecializationContext = {
    ...context,
    selectedTeamGroupId: context.selectedTeamGroupId ?? selectedGroup,
  };

  const definitions = enriched.selectedTeamGroupId
    ? [
        ...getSpecializationsForGroup(enriched.selectedTeamGroupId),
        ...TEAM_SPECIALIZATION_CATALOG.filter(
          (definition) => definition.groupId !== enriched.selectedTeamGroupId,
        ),
      ]
    : [...TEAM_SPECIALIZATION_CATALOG];

  return definitions.map((definition) => buildTeamSpecializationFitResult(definition, enriched));
}

export function getRecommendedTeamSpecializations(
  context: TeamSpecializationContext = {},
  max = 3,
): TeamSpecializationFitResult[] {
  return buildTeamSpecializationFitResults(context)
    .filter(
      (result) => result.status === 'recommended' || result.status === 'active' || result.status === 'available',
    )
    .sort((left, right) => {
      if (right.fitScore !== left.fitScore) return right.fitScore - left.fitScore;
      return (
        right.specialization.playerFacingPriority - left.specialization.playerFacingPriority
      );
    })
    .slice(0, max);
}

export function getBestTeamSpecializationForAssignment(
  context: TeamSpecializationContext = {},
): TeamSpecializationFitResult {
  const enriched: TeamSpecializationContext = {
    ...context,
    selectedTeamGroupId:
      context.selectedTeamGroupId ?? resolveTeamGroupFromAssignment(context.assignment),
  };
  const results = buildTeamSpecializationFitResults(enriched);
  return (
    results.sort((left, right) => {
      if (right.fitScore !== left.fitScore) return right.fitScore - left.fitScore;
      return (
        right.specialization.playerFacingPriority - left.specialization.playerFacingPriority
      );
    })[0] ?? buildTeamSpecializationFallbackResult(enriched)
  );
}

export function buildTeamSpecializationFallbackResult(
  context: TeamSpecializationContext = {},
): TeamSpecializationFitResult {
  const groupId =
    context.selectedTeamGroupId ??
    resolveTeamGroupFromAssignment(context.assignment) ??
    TEAM_SPECIALIZATION_SAFE_DEFAULT_GROUP;
  const definition =
    getSpecializationsForGroup(groupId)[0] ??
    getTeamSpecializationDefinition('field_team_fast_response')!;

  return {
    specialization: definition,
    fitScore: 40,
    fitLevel: 'acceptable',
    status: 'preview',
    tone: 'neutral',
    matchedDomains: [],
    missingDomains: definition.primaryDomains,
    matchedCapabilities: [],
    pressureWarnings: [],
    sourceSignals: ['fallback'],
    summaryLine: 'Ekip uzmanlığı foundation modunda hazırlanıyor.',
    isVisibleToPlayer: false,
    isPreviewOnly: true,
  };
}

export function shouldShowTeamSpecializationPreview(
  context: TeamSpecializationContext = {},
): boolean {
  const day = context.day ?? 1;
  if (day <= TEAM_SPECIALIZATION_MIN_DAY_VISIBILITY.hiddenMaxDay) return false;

  const hasAssignmentContext = context.assignment != null;
  const hasDistrictOpContext = context.districtOperationCandidate != null;
  const hasRouteContext = context.activeTaskRoute != null;
  const hasPhaseContext = context.isDispatchPhase === true || context.isFieldPhase === true;

  if (day <= TEAM_SPECIALIZATION_MIN_DAY_VISIBILITY.previewMaxDay) {
    return hasAssignmentContext || hasPhaseContext;
  }

  return (
    hasAssignmentContext ||
    hasDistrictOpContext ||
    hasRouteContext ||
    hasPhaseContext
  );
}

export function buildAssignmentTeamSpecializationPreviewLine(
  context: TeamSpecializationContext = {},
): string | null {
  if (!shouldShowTeamSpecializationPreview(context)) return null;
  const best = getBestTeamSpecializationForAssignment(context);
  if (!best.isVisibleToPlayer && (context.day ?? 1) <= TEAM_SPECIALIZATION_MIN_DAY_VISIBILITY.previewMaxDay) {
    return null;
  }
  if (best.fitLevel === 'poor' && (context.day ?? 1) <= TEAM_SPECIALIZATION_MIN_DAY_VISIBILITY.previewMaxDay) {
    return null;
  }
  return buildTeamSpecializationAssignmentPreviewLine(best);
}
