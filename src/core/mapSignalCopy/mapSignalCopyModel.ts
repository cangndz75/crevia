import type {
  MapSignalCopyConfidence,
  MapSignalCopyDayPolicy,
  MapSignalCopyInput,
  MapSignalCopyResult,
  MapSignalCopySourceGuard,
  MapSignalCopyTemplate,
} from './mapSignalCopyTypes';
import { getMapSignalCopyTemplates } from './mapSignalCopyLines';

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (Math.imul(31, hash) + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function clampPriority(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function resolveMapSignalDayPolicies(day: number): MapSignalCopyDayPolicy[] {
  const policies: MapSignalCopyDayPolicy[] = ['any'];
  if (day <= 1) policies.push('day_1');
  if (day >= 2 && day <= 7) policies.push('day_2_7');
  if (day >= 8 && day < 10) policies.push('day_8_plus');
  if (day >= 10) policies.push('day_10_plus');
  return policies;
}

function hasSourceKind(input: MapSignalCopyInput, kind: string): boolean {
  return (input.sourceKinds ?? []).includes(kind);
}

function hasSourceIdPrefix(input: MapSignalCopyInput, prefix: string): boolean {
  return (input.sourceIds ?? []).some((id) => id.startsWith(prefix));
}

function hasAnySource(input: MapSignalCopyInput): boolean {
  return (input.sourceIds?.length ?? 0) > 0 || (input.sourceKinds?.length ?? 0) > 0;
}

export function satisfiesMapSignalSourceGuard(
  guard: MapSignalCopySourceGuard,
  input: MapSignalCopyInput,
): boolean {
  switch (guard) {
    case 'safe_baseline':
      return true;
    case 'fallback_only':
      return !hasAnySource(input) || hasSourceKind(input, 'fallback');
    case 'requires_active_event':
      return hasSourceIdPrefix(input, 'event:') || hasSourceKind(input, 'active_event');
    case 'requires_route_source':
      return hasSourceIdPrefix(input, 'route:') || hasSourceKind(input, 'active_task_route');
    case 'requires_district_source':
      return Boolean(input.districtCriterionId) || hasSourceIdPrefix(input, 'district:');
    case 'requires_live_pressure':
      return Boolean(input.pressureKind && input.pressureKind !== 'calm_standard');
    case 'requires_memory_source':
      return (
        hasSourceKind(input, 'district_memory') ||
        hasSourceKind(input, 'decision_consequence') ||
        hasSourceIdPrefix(input, 'memory:') ||
        hasSourceIdPrefix(input, 'archive:')
      );
    case 'requires_result_source':
      return (
        hasSourceKind(input, 'result_trace') ||
        hasSourceIdPrefix(input, 'result_trace:') ||
        hasSourceIdPrefix(input, 'before_after:')
      );
    case 'requires_authority_permission':
      return input.permissionAvailable === true && input.visibilityLevel === 'detailed';
    case 'requires_vehicle_source':
      return hasSourceKind(input, 'vehicle_presence') || hasSourceIdPrefix(input, 'vehicle:');
    case 'requires_container_source':
      return hasSourceKind(input, 'container_presence') || hasSourceIdPrefix(input, 'container:');
    case 'requires_team_source':
      return hasSourceKind(input, 'personnel_presence') || hasSourceIdPrefix(input, 'personnel:');
    default:
      return false;
  }
}

function satisfiesAllSourceGuards(template: MapSignalCopyTemplate, input: MapSignalCopyInput): boolean {
  return template.sourceGuards.every((guard) => satisfiesMapSignalSourceGuard(guard, input));
}

function matchesDayPolicy(template: MapSignalCopyTemplate, day: number): boolean {
  if (template.dayPolicy === 'any') return true;
  return resolveMapSignalDayPolicies(day).includes(template.dayPolicy);
}

function matchesTemplate(input: MapSignalCopyInput, template: MapSignalCopyTemplate): boolean {
  if (template.context !== input.context) return false;
  if (template.kind !== input.kind) return false;
  if (input.tone && template.tone !== input.tone) return false;
  if (input.operationPhase && template.operationPhase && template.operationPhase !== input.operationPhase) {
    return false;
  }
  if (
    input.districtCriterionId &&
    template.districtCriterionId &&
    template.districtCriterionId !== input.districtCriterionId
  ) {
    return false;
  }
  if (!matchesDayPolicy(template, input.day)) return false;
  if (!satisfiesAllSourceGuards(template, input)) return false;
  const maxLength = input.maxLength ?? template.maxLength;
  if (template.text.length > maxLength) return false;
  return true;
}

function selectionSeed(input: MapSignalCopyInput): string {
  return [
    input.context,
    input.kind,
    String(input.day),
    input.operationPhase ?? '',
    input.districtCriterionId ?? '',
    ...(input.sourceIds ?? []),
    input.pressureKind ?? '',
  ].join('|');
}

function resolveConfidence(template: MapSignalCopyTemplate, input: MapSignalCopyInput): MapSignalCopyConfidence {
  if (template.sourceGuards.includes('fallback_only') || template.sourceGuards.includes('safe_baseline')) {
    return 'low';
  }
  if (template.sourceGuards.some((guard) => guard.startsWith('requires_'))) {
    return input.day >= 8 ? 'high' : 'medium';
  }
  return 'medium';
}

function buildResult(
  template: MapSignalCopyTemplate,
  input: MapSignalCopyInput,
  isFallback: boolean,
): MapSignalCopyResult {
  return {
    id: `${template.id}:${input.day}`,
    text: template.text,
    context: template.context,
    kind: template.kind,
    tone: template.tone,
    sourceTemplateId: template.id,
    sourceIds: input.sourceIds ?? [],
    confidence: isFallback ? 'low' : resolveConfidence(template, input),
    isFallback,
  };
}

export function selectMapSignalCopy(input: MapSignalCopyInput): MapSignalCopyResult {
  const templates = getMapSignalCopyTemplates();
  const recent = new Set(input.recentTemplateIds ?? []);
  const candidates = templates
    .filter((template) => matchesTemplate(input, template))
    .sort((a, b) => clampPriority(b.priority) - clampPriority(a.priority) || a.id.localeCompare(b.id));

  const freshCandidates = candidates.filter((template) => !recent.has(template.id));
  const pool = freshCandidates.length > 0 ? freshCandidates : candidates;
  const seed = selectionSeed(input);
  const index = pool.length > 0 ? stableHash(seed) % pool.length : 0;
  const selected = pool[index];

  if (selected) {
    return buildResult(selected, input, false);
  }

  const fallback = templates
    .filter(
      (template) =>
        template.context === 'fallback' &&
        template.kind === input.kind &&
        template.sourceGuards.includes('safe_baseline'),
    )
    .sort((a, b) => b.priority - a.priority)[0];

  if (fallback) {
    return buildResult(fallback, input, true);
  }

  return {
    id: `fallback:${input.context}:${input.kind}`,
    text: 'Harita aktif operasyonu izliyor.',
    context: input.context,
    kind: input.kind,
    tone: 'neutral',
    sourceTemplateId: 'fallback_hardcoded',
    sourceIds: input.sourceIds ?? [],
    confidence: 'low',
    isFallback: true,
  };
}

export function filterRepeatedMapSignalCopy(
  results: readonly MapSignalCopyResult[],
  recentTemplateIds: readonly string[] = [],
): MapSignalCopyResult[] {
  const recent = new Set(recentTemplateIds);
  const seenText = new Set<string>();
  const seenPrefix = new Set<string>();
  const filtered: MapSignalCopyResult[] = [];

  for (const result of results) {
    if (recent.has(result.sourceTemplateId)) continue;
    const normalized = result.text.trim().toLocaleLowerCase('tr-TR');
    if (seenText.has(normalized)) continue;
    const prefix = normalized.split(/\s+/).slice(0, 2).join(' ');
    if (seenPrefix.has(prefix)) continue;
    seenText.add(normalized);
    seenPrefix.add(prefix);
    filtered.push(result);
  }

  return filtered;
}

export function countTemplatesByContext(context: MapSignalCopyInput['context']): number {
  return getMapSignalCopyTemplates().filter((template) => template.context === context).length;
}

export function countActiveOperationPhaseTemplates(
  phase: NonNullable<MapSignalCopyInput['operationPhase']>,
  kind: MapSignalCopyInput['kind'] = 'map_line',
): number {
  return getMapSignalCopyTemplates().filter(
    (template) =>
      template.context === 'active_operation' &&
      template.operationPhase === phase &&
      template.kind === kind,
  ).length;
}

export function countDistrictCriterionTemplates(
  criterionId: NonNullable<MapSignalCopyInput['districtCriterionId']>,
  kind: MapSignalCopyInput['kind'],
): number {
  return getMapSignalCopyTemplates().filter(
    (template) =>
      template.context === 'district_personality' &&
      template.districtCriterionId === criterionId &&
      template.kind === kind,
  ).length;
}
