import {
  DISTRICT_IDENTITIES,
  DISTRICT_IDENTITY_FALLBACK,
  MAP_DISTRICT_IDENTITY_IDS,
} from '@/core/districts/districtIdentityConstants';

import {
  DISTRICT_ARCHETYPE_CRITERIA,
  DISTRICT_BASELINE_SCORES,
  DISTRICT_CRITERION_LABELS,
  DISTRICT_CRITERION_MEANINGS,
  DISTRICT_CRITERION_TAGS,
} from './districtPersonalityConstants';
import {
  DISTRICT_CRITERION_IDS,
  type DistrictArchetypeId,
  type DistrictCriterionBand,
  type DistrictCriterionId,
  type DistrictCriterionScore,
  type DistrictGameplayTag,
  type DistrictPersonalityInput,
  type DistrictPersonalityProfile,
  type DistrictPersonalitySourceKind,
} from './districtPersonalityTypes';
import { getDistrictPersonalityLine } from './districtPersonalityContentLines';

type SourceState = {
  kind: DistrictPersonalitySourceKind;
  ids: string[];
  present: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeDistrictId(value: string | null | undefined): string {
  const normalized = (value ?? '').trim().toLowerCase();
  return MAP_DISTRICT_IDENTITY_IDS.includes(normalized as never)
    ? normalized
    : DISTRICT_IDENTITY_FALLBACK.id;
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function bandFor(score: number): DistrictCriterionBand {
  if (score >= 67) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function dedupe(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function hasSource(value: unknown): boolean {
  if (value == null || value === false) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  if (isRecord(value)) {
    if (value.visible === false || value.enabled === false) return false;
    return Object.keys(value).length > 0;
  }
  return true;
}

function extractIds(prefix: string, value: unknown): string[] {
  if (!hasSource(value)) return [];
  if (typeof value === 'string' || typeof value === 'number') {
    return [`${prefix}:${String(value)}`];
  }
  if (Array.isArray(value)) {
    return dedupe(
      value.map((item, index) => {
        if (typeof item === 'string' || typeof item === 'number') {
          return `${prefix}:${String(item)}`;
        }
        if (isRecord(item) && typeof item.id === 'string') {
          return `${prefix}:${item.id}`;
        }
        if (isRecord(item) && typeof item.eventId === 'string') {
          return `${prefix}:${item.eventId}`;
        }
        return `${prefix}:${index}`;
      }),
    );
  }
  if (isRecord(value)) {
    for (const key of ['id', 'districtId', 'eventId', 'routeId']) {
      if (typeof value[key] === 'string') return [`${prefix}:${value[key]}`];
    }
    return Object.keys(value).slice(0, 4).map((key) => `${prefix}:${key}`);
  }
  return [`${prefix}:present`];
}

function source(kind: DistrictPersonalitySourceKind, prefix: string, value: unknown): SourceState {
  return { kind, ids: extractIds(prefix, value), present: hasSource(value) };
}

function sourceKinds(...states: SourceState[]): DistrictPersonalitySourceKind[] {
  return dedupe(states.filter((state) => state.present).map((state) => state.kind)) as DistrictPersonalitySourceKind[];
}

function sourceIds(...states: SourceState[]): string[] {
  return dedupe(states.flatMap((state) => state.ids));
}

function modifier(present: boolean, amount: number): number {
  return present ? amount : 0;
}

function buildSources(input: DistrictPersonalityInput, districtId: string): Record<string, SourceState> {
  return {
    design: source('design_baseline', 'design_baseline', districtId),
    identity: source('district_identity', 'district_identity', districtId),
    trust: source('district_trust', 'district_trust', input.districtTrustSignals),
    memory: source('district_memory', 'district_memory', input.districtMemorySignals),
    social: source('social_pulse', 'social_pulse', input.socialSignals),
    operation: source('operation_signal', 'operation_signal', input.operationSignals),
    resource: source('resource_pressure', 'resource_pressure', input.resourceSignals),
    container: source('container_network', 'container_network', input.containerNetworkSignals),
    maintenance: source('vehicle_maintenance', 'vehicle_maintenance', input.vehicleMaintenanceSignals),
    team: source('team_specialization', 'team_specialization', input.teamSpecializationSignals),
    route: source('active_task_route', 'active_task_route', input.activeTaskRouteSignals),
    archive: source('city_archive', 'city_archive', input.cityArchiveSignals),
    consequence: source('decision_consequence', 'decision_consequence', input.decisionConsequenceSignals),
    eventHistory: source('event_history', 'event_history', input.eventHistorySignals),
  };
}

function buildCriterion(
  id: DistrictCriterionId,
  baseline: number,
  liveDelta: number,
  sourceStates: SourceState[],
): DistrictCriterionScore {
  const score = clampScore(baseline + liveDelta);
  return {
    id,
    score,
    band: bandFor(score),
    label: DISTRICT_CRITERION_LABELS[id],
    gameplayMeaning: DISTRICT_CRITERION_MEANINGS[id],
    sourceKinds: sourceKinds(...sourceStates),
    sourceIds: sourceIds(...sourceStates),
  };
}

function deriveArchetypes(criteria: readonly DistrictCriterionScore[]): DistrictArchetypeId[] {
  const byId = new Map(criteria.map((criterion) => [criterion.id, criterion.score]));
  const scored = Object.entries(DISTRICT_ARCHETYPE_CRITERIA)
    .map(([archetypeId, criterionIds]) => ({
      id: archetypeId as DistrictArchetypeId,
      score:
        criterionIds.reduce((sum, criterionId) => sum + (byId.get(criterionId) ?? 0), 0) /
        criterionIds.length,
    }))
    .filter((item) => item.score >= 64)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => item.id);

  return scored.length > 0 ? scored : ['balanced_district'];
}

function tagsFor(criteria: readonly DistrictCriterionScore[]): DistrictGameplayTag[] {
  const tags = criteria
    .filter((criterion) => criterion.band === 'high')
    .map((criterion) => DISTRICT_CRITERION_TAGS[criterion.id]);
  return dedupe(tags.length > 0 ? tags : ['balanced_watch']) as DistrictGameplayTag[];
}

function hasPermission(input: DistrictPersonalityInput, ids: readonly string[]): boolean {
  const permissions = new Set(input.unlockedPermissionIds ?? []);
  return ids.some((id) => permissions.has(id));
}

function confidenceFor(criteria: readonly DistrictCriterionScore[], isFallback: boolean): 'low' | 'medium' | 'high' {
  if (isFallback) return 'low';
  const liveSourceCount = new Set(
    criteria
      .flatMap((criterion) => criterion.sourceKinds)
      .filter((kind) => kind !== 'design_baseline' && kind !== 'district_identity'),
  ).size;
  if (liveSourceCount >= 3) return 'high';
  if (liveSourceCount >= 1) return 'medium';
  return 'medium';
}

function findCriterion(criteria: readonly DistrictCriterionScore[], id: DistrictCriterionId): DistrictCriterionScore {
  return criteria.find((criterion) => criterion.id === id) ?? criteria[0]!;
}

function biasBand(score: number): DistrictCriterionBand {
  return bandFor(score);
}

export function buildDistrictPersonalityProfile(
  input: DistrictPersonalityInput = {},
): DistrictPersonalityProfile {
  const districtId = normalizeDistrictId(input.districtId);
  const identity = DISTRICT_IDENTITIES[districtId as keyof typeof DISTRICT_IDENTITIES] ?? DISTRICT_IDENTITY_FALLBACK;
  const isFallback = districtId === DISTRICT_IDENTITY_FALLBACK.id && normalizeDistrictId(input.districtId) !== input.districtId;
  const baseline = DISTRICT_BASELINE_SCORES[districtId] ?? {};
  const sources = buildSources(input, districtId);
  const base = (criterionId: DistrictCriterionId) => baseline[criterionId] ?? 45;

  const criteria: DistrictCriterionScore[] = [
    buildCriterion('social_sensitivity', base('social_sensitivity'), modifier(sources.social.present, 16) + modifier(sources.trust.present, 8), [sources.design, sources.identity, sources.social, sources.trust]),
    buildCriterion('route_difficulty', base('route_difficulty'), modifier(sources.route.present, 18) + modifier(sources.operation.present, 8), [sources.design, sources.identity, sources.route, sources.operation]),
    buildCriterion('container_density', base('container_density'), modifier(sources.container.present, 20) + modifier(sources.eventHistory.present, 8), [sources.design, sources.identity, sources.container, sources.eventHistory]),
    buildCriterion('trust_fragility', base('trust_fragility'), modifier(sources.trust.present, 18) + modifier(sources.social.present, 10), [sources.design, sources.identity, sources.trust, sources.social]),
    buildCriterion('recovery_potential', base('recovery_potential'), modifier(sources.consequence.present, 12) + modifier(sources.archive.present, 8), [sources.design, sources.identity, sources.consequence, sources.archive]),
    buildCriterion('neglect_risk', base('neglect_risk'), modifier(sources.archive.present, 12) + modifier(sources.resource.present, 10), [sources.design, sources.identity, sources.archive, sources.resource]),
    buildCriterion('maintenance_exposure', base('maintenance_exposure'), modifier(sources.maintenance.present, 18) + modifier(sources.team.present, 8) + modifier(sources.route.present, 8), [sources.design, sources.identity, sources.maintenance, sources.team, sources.route]),
    buildCriterion('operation_history_weight', base('operation_history_weight'), modifier(sources.memory.present, 18) + modifier(sources.archive.present, 10) + modifier(sources.consequence.present, 8), [sources.design, sources.identity, sources.memory, sources.archive, sources.consequence]),
    buildCriterion('public_visibility', base('public_visibility'), modifier(sources.social.present, 10) + modifier(sources.operation.present, 8), [sources.design, sources.identity, sources.social, sources.operation]),
    buildCriterion('resource_dependency', base('resource_dependency'), modifier(sources.resource.present, 18) + modifier(sources.container.present, 8) + modifier(sources.route.present, 8), [sources.design, sources.identity, sources.resource, sources.container, sources.route]),
  ].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const primaryCriterion = criteria[0]!;
  const secondaryCriterionIds = criteria.slice(1, 4).map((criterion) => criterion.id);
  const archetypeIds = isFallback ? ['balanced_district' as const] : deriveArchetypes(criteria);
  const route = findCriterion(criteria, 'route_difficulty');
  const social = findCriterion(criteria, 'social_sensitivity');
  const container = findCriterion(criteria, 'container_density');
  const trust = findCriterion(criteria, 'trust_fragility');
  const recovery = findCriterion(criteria, 'recovery_potential');
  const neglect = findCriterion(criteria, 'neglect_risk');
  const maintenance = findCriterion(criteria, 'maintenance_exposure');
  const resource = findCriterion(criteria, 'resource_dependency');
  const history = findCriterion(criteria, 'operation_history_weight');

  const preferredDomains = dedupe([
    social.band === 'high' ? 'social' : '',
    route.band === 'high' ? 'transport' : '',
    container.band === 'high' ? 'container' : '',
    maintenance.band === 'high' ? 'maintenance' : '',
    resource.band === 'high' ? 'logistics' : '',
    'general',
  ]) as DistrictPersonalityProfile['eventBias']['preferredDomains'];

  const pressureHints = dedupe([
    social.band === 'high' ? 'social_sensitivity' : '',
    route.band === 'high' ? 'route_pressure' : '',
    container.band === 'high' ? 'container_network_pressure' : '',
    trust.band === 'high' ? 'district_trust_pressure' : '',
    neglect.band === 'high' ? 'tomorrow_risk_pressure' : '',
    recovery.band === 'high' ? 'opportunity_window' : '',
  ]) as DistrictPersonalityProfile['eventBias']['pressureHints'];

  const mapRoles = dedupe([
    social.band === 'high' || trust.band === 'high' ? 'risk_reader' : '',
    route.band === 'high' || maintenance.band === 'high' ? 'route_support' : '',
    resource.band === 'high' || container.band === 'high' ? 'resource_board' : '',
    history.band === 'high' ? 'district_memory' : '',
    'overview',
  ]) as DistrictPersonalityProfile['mapBias']['preferredMapRoles'];

  const detailedAllowed = hasPermission(input, [
    'district_trust_preview',
    'resource_pressure_summary',
    'assignment_fit_preview',
    'district_memory_trace_preview',
    'map_trust_layer',
    'map_resource_layer',
  ]);
  const primaryLineKind = detailedAllowed ? 'map_signal' : 'authority_teaser';
  const mapSignalLine =
    primaryLineKind === 'map_signal'
      ? getDistrictPersonalityLine(primaryCriterion.id, 'map_signal')
      : 'Yetki arttikca bu bolgenin karar baglami daha net okunur.';

  return {
    districtId,
    districtName: input.districtName?.trim() || identity.name || 'Bolge',
    archetypeIds,
    primaryArchetypeId: archetypeIds[0] ?? 'balanced_district',
    criteria,
    primaryCriterionId: primaryCriterion.id,
    secondaryCriterionIds,
    gameplayTags: tagsFor(criteria),
    eventBias: {
      preferredDomains,
      pressureHints: pressureHints.length > 0 ? pressureHints : ['calm_standard'],
    },
    strategyBias: {
      rapidResponseRisk: biasBand(Math.max(route.score, social.score, maintenance.score)),
      balancedPlanFit: biasBand(Math.max(trust.score, resource.score, social.score)),
      longTermFixValue: biasBand(Math.max(recovery.score, neglect.score, container.score)),
      recommendedCautionLine: getDistrictPersonalityLine(primaryCriterion.id, 'event_plan'),
    },
    mapBias: {
      preferredMapRoles: mapRoles,
      mapSignalLine,
    },
    eceToneHint:
      recovery.band === 'high'
        ? 'recovery'
        : trust.band === 'high' || social.band === 'high'
          ? 'cautious'
          : resource.band === 'high' || route.band === 'high'
            ? 'strategic'
            : 'calm',
    retentionHookHint:
      input.day != null && input.day <= 1
        ? undefined
        : getDistrictPersonalityLine(primaryCriterion.id, 'retention_hook'),
    confidence: confidenceFor(criteria, isFallback),
    isFallback,
    sourceLabel: isFallback ? 'Balanced fallback district personality' : 'District identity + live signal personality',
    sourceIds: dedupe(criteria.flatMap((criterion) => criterion.sourceIds)),
  };
}

export function buildAllDistrictPersonalityProfiles(
  input: Omit<DistrictPersonalityInput, 'districtId' | 'districtName'> = {},
): DistrictPersonalityProfile[] {
  return MAP_DISTRICT_IDENTITY_IDS.map((districtId) =>
    buildDistrictPersonalityProfile({ ...input, districtId }),
  );
}

export function isDistrictPersonalityDetailedAllowed(input: {
  profile: DistrictPersonalityProfile;
  permissionIds?: string[];
  criterionId?: DistrictCriterionId;
}): boolean {
  const permissions = new Set(input.permissionIds ?? []);
  const criterionId = input.criterionId ?? input.profile.primaryCriterionId;
  if (criterionId === 'trust_fragility' || criterionId === 'social_sensitivity') {
    return permissions.has('district_trust_preview') || permissions.has('map_trust_layer');
  }
  if (criterionId === 'resource_dependency' || criterionId === 'container_density') {
    return permissions.has('resource_pressure_summary') || permissions.has('map_resource_layer');
  }
  if (criterionId === 'route_difficulty' || criterionId === 'maintenance_exposure') {
    return permissions.has('assignment_fit_preview');
  }
  if (criterionId === 'operation_history_weight') {
    return permissions.has('district_memory_trace_preview');
  }
  return permissions.size > 0;
}
