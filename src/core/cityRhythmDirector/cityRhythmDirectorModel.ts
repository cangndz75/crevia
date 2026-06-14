import { pickSurfaceCopy } from '@/core/contentVarietyQuality';
import {
  CITY_RHYTHM_COPY,
  CITY_RHYTHM_DIRECTOR_LINE_MAX,
  CITY_RHYTHM_DIRECTOR_MAX_INTERNAL_SLOTS,
  CITY_RHYTHM_DIRECTOR_TITLE_MAX,
  CITY_RHYTHM_FAKE_CLAIM_PATTERNS,
  CITY_RHYTHM_KIND_TITLES,
  CITY_RHYTHM_POSITIVE_KINDS,
  CITY_RHYTHM_RISK_KINDS,
  CITY_RHYTHM_SLOT_TITLES,
} from './cityRhythmDirectorConstants';
import type {
  CityRhythmDirectorInput,
  CityRhythmDirectorResult,
  CityRhythmIntensity,
  CityRhythmKind,
  CityRhythmSlot,
  CityRhythmSlotDraft,
  CityRhythmSlotKind,
  CityRhythmSourceKind,
  CityRhythmTone,
  CityRhythmVisibilityLevel,
} from './cityRhythmDirectorTypes';

let slotCounter = 0;

function nextSlotId(prefix: string): string {
  slotCounter += 1;
  return `crd_${prefix}_${slotCounter}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampLine(value: string, max: number): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3).trimEnd()}...`;
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  return [
    ...new Set(
      values
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => value.trim()),
    ),
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : isRecord(value) ? [value] : [];
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function sourceIdsFromUnknown(value: unknown): string[] {
  if (!isRecord(value)) return [];
  return uniqueStrings([asString(value.id), ...asArray(value.sourceIds).map(asString)]);
}

function normalizeLine(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function duplicateLine(line: string, existing: readonly string[]): boolean {
  const normalized = normalizeLine(line);
  return existing.some((entry) => normalizeLine(entry) === normalized);
}

function containsFakeClaim(text: string): boolean {
  return CITY_RHYTHM_FAKE_CLAIM_PATTERNS.some((pattern) => pattern.test(text));
}

function pickCopy(kind: CityRhythmKind, seed = 0, previousLines?: readonly string[]): string {
  const lines = CITY_RHYTHM_COPY[kind];
  return pickSurfaceCopy(kind, 'city_rhythm', lines, { seed, previousLines });
}

const STRATEGIC_CONTENT_RHYTHM_MAP: Record<string, CityRhythmKind> = {
  district_neglect_focus: 'neglect_attention_day',
  district_recovery_focus: 'recovery_window_day',
  positive_comeback_focus: 'recovery_window_day',
  resource_pressure_focus: 'resource_strain_day',
  route_pressure_focus: 'resource_strain_day',
  container_pressure_focus: 'resource_strain_day',
  social_trust_focus: 'social_trust_day',
  memory_trace_focus: 'memory_echo_day',
  follow_up_focus: 'follow_up_day',
  defer_risk_focus: 'strategic_pressure_day',
  strategic_operation_focus: 'mixed_city_day',
  map_priority_focus: 'mixed_city_day',
  safe_watch_focus: 'calm_watch_day',
  authority_explanation_focus: 'mixed_city_day',
  fallback: 'fallback',
};

function adaptDay8StrategicContent(input: CityRhythmDirectorInput): CityRhythmSlotDraft[] {
  const raw = input.day8StrategicContentResult;
  if (!isRecord(raw)) return [];
  const drafts: CityRhythmSlotDraft[] = [];
  const primaryCandidate = isRecord(raw.primaryCandidate) ? raw.primaryCandidate : null;
  const primaryId = primaryCandidate ? asString(primaryCandidate.id) : undefined;
  for (const candidate of asArray(raw.candidates)) {
    if (!isRecord(candidate) || candidate.isFallback === true) continue;
    const kind = asString(candidate.kind);
    const rhythmKind = kind ? (STRATEGIC_CONTENT_RHYTHM_MAP[kind] ?? 'mixed_city_day') : 'mixed_city_day';
    const sourceIds = sourceIdsFromUnknown(candidate);
    if (sourceIds.length === 0) continue;
    const isRisk = CITY_RHYTHM_RISK_KINDS.includes(rhythmKind);
    const isPositive = CITY_RHYTHM_POSITIVE_KINDS.includes(rhythmKind);
    drafts.push({
      slotKind: asString(candidate.id) === primaryId ? 'primary_focus' : 'secondary_focus',
      rhythmKind,
      title: asString(candidate.title),
      lineHint: asString(candidate.line),
      sourceCandidateId: asString(candidate.id),
      sourceIds,
      sourceKinds: ['day8_strategic_content'],
      priority: typeof candidate.priority === 'number' ? candidate.priority : 80,
      tone: asString(candidate.tone) as CityRhythmTone | undefined,
      isRisk,
      isPositive,
      districtId: asString(candidate.districtId),
      seed: sourceIds.length,
    });
  }
  return drafts;
}

function adaptDistrictNeglectRecovery(input: CityRhythmDirectorInput): CityRhythmSlotDraft[] {
  const raw = input.districtNeglectRecoveryResult;
  if (!isRecord(raw)) return [];
  const drafts: CityRhythmSlotDraft[] = [];
  for (const signal of asArray(raw.signals)) {
    if (!isRecord(signal) || signal.isFallback === true) continue;
    const kind = asString(signal.kind);
    const sourceIds = sourceIdsFromUnknown(signal);
    if (sourceIds.length === 0) continue;
    let rhythmKind: CityRhythmKind = 'mixed_city_day';
    let isRisk = false;
    let isPositive = false;
    if (kind === 'neglect_warning' || kind === 'neglect_watch') {
      const band = asString(signal.neglectBand);
      rhythmKind = band === 'high' || band === 'rising' ? 'neglect_attention_day' : 'strategic_pressure_day';
      isRisk = true;
    } else if (kind === 'recovery_window' || kind === 'recovery_progress' || kind === 'positive_momentum') {
      const band = asString(signal.recoveryBand);
      rhythmKind = band === 'active' || band === 'strong' ? 'recovery_window_day' : 'recovery_window_day';
      isPositive = true;
    } else if (kind === 'trust_fragility' || kind === 'social_cooling') {
      rhythmKind = 'social_trust_day';
      isRisk = true;
    } else if (kind === 'route_backlog' || kind === 'container_backlog') {
      rhythmKind = 'resource_strain_day';
      isRisk = true;
    }
    drafts.push({
      slotKind: 'secondary_focus',
      rhythmKind,
      lineHint: asString(signal.line),
      sourceCandidateId: asString(signal.id),
      sourceIds,
      sourceKinds: ['district_neglect_recovery'],
      priority: typeof signal.priority === 'number' ? signal.priority : 78,
      isRisk,
      isPositive,
      districtId: asString(signal.districtId),
      seed: sourceIds.length,
    });
  }
  return drafts;
}

function adaptPositiveComeback(input: CityRhythmDirectorInput): CityRhythmSlotDraft[] {
  const raw = input.positiveComebackResult;
  if (!isRecord(raw)) return [];
  const drafts: CityRhythmSlotDraft[] = [];
  const kindMap: Record<string, CityRhythmKind> = {
    district_recovery: 'recovery_window_day',
    trust_recovery: 'recovery_window_day',
    opportunity_window: 'recovery_window_day',
    safe_momentum: 'calm_watch_day',
    follow_up_success: 'follow_up_day',
    memory_positive_trace: 'memory_echo_day',
  };
  for (const candidate of asArray(raw.candidates)) {
    if (!isRecord(candidate) || candidate.isFallback === true) continue;
    const kind = asString(candidate.kind);
    const rhythmKind = kind ? (kindMap[kind] ?? 'recovery_window_day') : 'recovery_window_day';
    const sourceIds = sourceIdsFromUnknown(candidate);
    if (sourceIds.length === 0) continue;
    drafts.push({
      slotKind: 'recovery_balance',
      rhythmKind,
      lineHint: asString(candidate.line),
      sourceCandidateId: asString(candidate.id),
      sourceIds,
      sourceKinds: ['positive_comeback'],
      priority: typeof candidate.priority === 'number' ? candidate.priority : 84,
      isPositive: true,
      districtId: asString(candidate.districtId),
      seed: sourceIds.length,
    });
  }
  return drafts;
}

function adaptFollowUpActions(input: CityRhythmDirectorInput): CityRhythmSlotDraft[] {
  const raw = input.followUpActionResult;
  if (!isRecord(raw)) return [];
  const drafts: CityRhythmSlotDraft[] = [];
  for (const action of asArray(raw.actions)) {
    if (!isRecord(action) || action.isFallback === true) continue;
    const sourceIds = sourceIdsFromUnknown(action);
    if (sourceIds.length === 0) continue;
    drafts.push({
      slotKind: 'follow_up_hint',
      rhythmKind: 'follow_up_day',
      lineHint: asString(action.line),
      sourceCandidateId: asString(action.id),
      sourceIds,
      sourceKinds: ['follow_up_action'],
      priority: typeof action.priority === 'number' ? action.priority : 76,
      isPositive: true,
      districtId: asString(action.districtId),
      seed: sourceIds.length,
    });
  }
  return drafts;
}

function adaptCityMemory(input: CityRhythmDirectorInput): CityRhythmSlotDraft[] {
  const raw = input.cityMemoryVisibilityResult;
  if (!isRecord(raw)) return [];
  const drafts: CityRhythmSlotDraft[] = [];
  for (const trace of asArray(raw.traces)) {
    if (!isRecord(trace) || trace.isFallback === true) continue;
    const sourceIds = sourceIdsFromUnknown(trace);
    if (sourceIds.length === 0) continue;
    drafts.push({
      slotKind: 'memory_echo',
      rhythmKind: 'memory_echo_day',
      lineHint: asString(trace.line),
      sourceCandidateId: asString(trace.id),
      sourceIds,
      sourceKinds: ['city_memory_visibility'],
      priority: typeof trace.priority === 'number' ? trace.priority : 74,
      districtId: asString(trace.districtId),
      seed: sourceIds.length,
    });
  }
  return drafts;
}

function adaptPortfolioDefer(input: CityRhythmDirectorInput): CityRhythmSlotDraft[] {
  const raw = input.portfolioDeferRiskResult;
  if (!isRecord(raw)) return [];
  const drafts: CityRhythmSlotDraft[] = [];
  for (const binding of asArray(raw.bindings)) {
    if (!isRecord(binding)) continue;
    const deferRisk = asString(binding.deferRisk);
    const sourceIds = sourceIdsFromUnknown(binding);
    if (sourceIds.length === 0) continue;
    const rhythmKind: CityRhythmKind =
      deferRisk === 'opportunity_may_expire' ? 'recovery_window_day' : 'strategic_pressure_day';
    drafts.push({
      slotKind: 'secondary_focus',
      rhythmKind,
      sourceIds,
      sourceKinds: ['portfolio_defer_risk'],
      priority: 82,
      isRisk: rhythmKind === 'strategic_pressure_day',
      isPositive: rhythmKind === 'recovery_window_day',
      districtId: asString(binding.districtId),
      seed: sourceIds.length,
    });
  }
  return drafts;
}

function adaptDailyCapacity(input: CityRhythmDirectorInput): CityRhythmSlotDraft[] {
  const raw = input.dailyCapacityPortfolioResult;
  if (!isRecord(raw)) return [];
  const drafts: CityRhythmSlotDraft[] = [];
  const kindMap: Record<string, CityRhythmKind> = {
    resource_pressure: 'resource_strain_day',
    social_pressure: 'social_trust_day',
    follow_up_candidate: 'follow_up_day',
    recovery_opportunity: 'recovery_window_day',
    district_pressure: 'neglect_attention_day',
    route_pressure: 'resource_strain_day',
    container_pressure: 'resource_strain_day',
  };
  for (const item of asArray(raw.items)) {
    if (!isRecord(item)) continue;
    const kind = asString(item.kind);
    const rhythmKind = kind ? (kindMap[kind] ?? 'mixed_city_day') : undefined;
    if (!rhythmKind) continue;
    const sourceIds = sourceIdsFromUnknown(item);
    if (sourceIds.length === 0) continue;
    drafts.push({
      slotKind: 'secondary_focus',
      rhythmKind,
      title: asString(item.title),
      sourceIds,
      sourceKinds: ['daily_capacity_portfolio'],
      priority: typeof item.priority === 'number' ? item.priority : 72,
      isRisk: rhythmKind === 'neglect_attention_day' || rhythmKind === 'resource_strain_day',
      isPositive: rhythmKind === 'recovery_window_day' || rhythmKind === 'follow_up_day',
      districtId: asString(item.districtId),
      seed: sourceIds.length,
    });
  }
  return drafts;
}

function adaptOneMoreDay(input: CityRhythmDirectorInput): CityRhythmSlotDraft[] {
  const raw = input.oneMoreDayRetentionResult;
  if (!isRecord(raw)) return [];
  const hook = raw.primaryHook;
  if (!isRecord(hook) || hook.isFallback === true) return [];
  const sourceIds = sourceIdsFromUnknown(hook);
  if (sourceIds.length === 0) return [];
  const hookKind = asString(hook.kind);
  const rhythmKind: CityRhythmKind =
    hookKind === 'recovery_opportunity' ? 'recovery_window_day' : 'strategic_pressure_day';
  return [
    {
      slotKind: 'secondary_focus',
      rhythmKind,
      lineHint: asString(hook.line),
      sourceCandidateId: asString(hook.id),
      sourceIds,
      sourceKinds: ['one_more_day_retention'],
      priority: typeof hook.priority === 'number' ? hook.priority : 70,
      isRisk: rhythmKind === 'strategic_pressure_day',
      isPositive: rhythmKind === 'recovery_window_day',
      districtId: asString(hook.districtId),
      seed: sourceIds.length,
    },
  ];
}

function collectDrafts(input: CityRhythmDirectorInput): CityRhythmSlotDraft[] {
  return [
    ...adaptDay8StrategicContent(input),
    ...adaptDistrictNeglectRecovery(input),
    ...adaptPositiveComeback(input),
    ...adaptPortfolioDefer(input),
    ...adaptDailyCapacity(input),
    ...adaptFollowUpActions(input),
    ...adaptCityMemory(input),
    ...adaptOneMoreDay(input),
  ].filter(
    (draft) =>
      !(input.suppressSourceIds ?? []).some((id) => draft.sourceIds.includes(id)) &&
      !(input.recentPrimarySourceKinds ?? []).includes(draft.sourceKinds[0]),
  );
}

function resolveDominantRhythmKind(
  drafts: CityRhythmSlotDraft[],
  day: number,
  recentKinds: CityRhythmKind[],
): CityRhythmKind {
  if (drafts.length === 0) return day >= 8 ? 'calm_watch_day' : 'fallback';
  const counts = new Map<CityRhythmKind, number>();
  for (const draft of drafts) {
    counts.set(draft.rhythmKind, (counts.get(draft.rhythmKind) ?? 0) + draft.priority);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const hasRisk = drafts.some((d) => d.isRisk);
  const hasPositive = drafts.some((d) => d.isPositive);
  if (hasRisk && hasPositive && sorted.length >= 2) return 'mixed_city_day';
  let top = sorted[0]?.[0] ?? 'mixed_city_day';
  if (recentKinds.slice(-2).includes(top) && sorted.length > 1) {
    top = sorted[1][0];
  }
  if (hasPositive && !hasRisk && top === 'strategic_pressure_day') {
    top = 'recovery_window_day';
  }
  if (hasRisk && !hasPositive && top === 'recovery_window_day') {
    top = 'strategic_pressure_day';
  }
  if (day <= 9 && top === 'strategic_pressure_day' && drafts.every((d) => d.priority < 75)) {
    top = 'mixed_city_day';
  }
  return top;
}

function resolveIntensity(
  rhythmKind: CityRhythmKind,
  drafts: CityRhythmSlotDraft[],
  day: number,
  isFallback: boolean,
): CityRhythmIntensity {
  if (isFallback || rhythmKind === 'calm_watch_day' || rhythmKind === 'fallback') return 'low';
  const highPriorityCount = drafts.filter((d) => d.priority >= 85).length;
  const riskStack = drafts.filter((d) => d.isRisk && d.priority >= 78).length;
  if (rhythmKind === 'recovery_window_day' || rhythmKind === 'follow_up_day') {
    return highPriorityCount >= 2 ? 'medium' : 'medium';
  }
  if (day <= 9 && (rhythmKind === 'strategic_pressure_day' || rhythmKind === 'neglect_attention_day')) {
    return riskStack >= 2 && highPriorityCount >= 2 ? 'high' : 'medium';
  }
  if (riskStack >= 2 || highPriorityCount >= 3) return 'high';
  if (drafts.length >= 2) return 'medium';
  return 'low';
}

function resolveTone(rhythmKind: CityRhythmKind, intensity: CityRhythmIntensity): CityRhythmTone {
  if (rhythmKind === 'mixed_city_day') return 'balanced';
  if (rhythmKind === 'recovery_window_day' || rhythmKind === 'follow_up_day') return 'positive';
  if (rhythmKind === 'calm_watch_day' || rhythmKind === 'fallback') return 'calm';
  if (
    rhythmKind === 'strategic_pressure_day' ||
    rhythmKind === 'neglect_attention_day' ||
    rhythmKind === 'resource_strain_day'
  ) {
    return intensity === 'high' ? 'cautious' : 'strategic';
  }
  if (rhythmKind === 'memory_echo_day') return 'strategic';
  if (rhythmKind === 'social_trust_day') return 'cautious';
  return 'balanced';
}

function applyDensityGuard(
  drafts: CityRhythmSlotDraft[],
  input: CityRhythmDirectorInput,
): { picked: CityRhythmSlotDraft[]; suppressedIds: string[] } {
  const sorted = [...drafts].sort((a, b) => b.priority - a.priority || a.slotKind.localeCompare(b.slotKind));
  const picked: CityRhythmSlotDraft[] = [];
  const suppressedIds: string[] = [];
  const slotKindUsed = new Set<CityRhythmSlotKind>();
  const rhythmKindUsed = new Set<CityRhythmKind>();
  const districtCount = new Map<string, number>();
  const sourceKindUsed = new Set<CityRhythmSourceKind>();
  let riskCount = 0;
  let positiveCount = 0;
  const hasPositiveSource = drafts.some((d) => d.isPositive);
  const hasRiskSource = drafts.some((d) => d.isRisk);
  const recentKinds = input.recentRhythmKinds ?? [];
  const recentDistricts = input.recentDistrictIds ?? [];

  for (const draftEntry of sorted) {
    let draft = draftEntry;
    if (picked.length >= CITY_RHYTHM_DIRECTOR_MAX_INTERNAL_SLOTS) break;
    if (recentKinds.slice(-2).includes(draft.rhythmKind) && sorted.some((alt) => alt.rhythmKind !== draft.rhythmKind)) {
      suppressedIds.push(...draft.sourceIds);
      continue;
    }
    if (rhythmKindUsed.has(draft.rhythmKind) && sorted.some((alt) => !rhythmKindUsed.has(alt.rhythmKind))) {
      suppressedIds.push(...draft.sourceIds);
      continue;
    }
    const districtKey = draft.districtId ?? 'city';
    if ((districtCount.get(districtKey) ?? 0) >= 2) {
      suppressedIds.push(...draft.sourceIds);
      continue;
    }
    if (recentDistricts.slice(-2).includes(districtKey) && draft.slotKind === 'primary_focus') {
      draft = { ...draft, slotKind: 'secondary_focus' };
    }
    if (draft.isRisk && hasPositiveSource && riskCount >= 1 && positiveCount === 0) {
      suppressedIds.push(...draft.sourceIds);
      continue;
    }
    if (draft.isPositive && hasRiskSource && positiveCount >= 1 && riskCount === 0) {
      suppressedIds.push(...draft.sourceIds);
      continue;
    }
    if (slotKindUsed.has(draft.slotKind) && draft.slotKind !== 'secondary_focus') {
      draft = { ...draft, slotKind: 'secondary_focus' };
    }
    picked.push(draft);
    slotKindUsed.add(draft.slotKind);
    rhythmKindUsed.add(draft.rhythmKind);
    districtCount.set(districtKey, (districtCount.get(districtKey) ?? 0) + 1);
    sourceKindUsed.add(draft.sourceKinds[0]);
    if (draft.isRisk) riskCount += 1;
    if (draft.isPositive) positiveCount += 1;
  }

  if (input.day >= 10 && picked.length >= 2 && sourceKindUsed.size < 2) {
    const extra = sorted.find(
      (draft) =>
        !picked.some((entry) => entry.sourceIds[0] === draft.sourceIds[0]) &&
        !draft.sourceKinds.every((kind) => sourceKindUsed.has(kind)),
    );
    if (extra && picked.length < CITY_RHYTHM_DIRECTOR_MAX_INTERNAL_SLOTS) {
      picked.push(extra);
    }
  }

  return { picked, suppressedIds: uniqueStrings(suppressedIds) };
}

function buildSlotFromDraft(
  draft: CityRhythmSlotDraft,
  rhythmKind: CityRhythmKind,
  existingLines: readonly string[],
  isFallback = false,
): CityRhythmSlot | null {
  const line = clampLine(
    draft.lineHint ?? pickCopy(rhythmKind, draft.seed ?? 0),
    CITY_RHYTHM_DIRECTOR_LINE_MAX,
  );
  if (containsFakeClaim(line) || duplicateLine(line, existingLines)) return null;
  const tone: CityRhythmTone =
    draft.tone ??
    (CITY_RHYTHM_POSITIVE_KINDS.includes(rhythmKind)
      ? 'positive'
      : CITY_RHYTHM_RISK_KINDS.includes(rhythmKind)
        ? 'cautious'
        : 'balanced');
  return {
    id: nextSlotId(draft.slotKind),
    kind: draft.slotKind,
    title: clampLine(draft.title ?? CITY_RHYTHM_SLOT_TITLES[draft.slotKind], CITY_RHYTHM_DIRECTOR_TITLE_MAX),
    line,
    sourceCandidateId: draft.sourceCandidateId,
    sourceIds: uniqueStrings(draft.sourceIds),
    sourceKinds: uniqueStrings(draft.sourceKinds) as CityRhythmSourceKind[],
    priority: clamp(draft.priority, 0, 100),
    tone,
    visibilityLevel: isFallback ? 'hidden' : (draft.visibilityLevel ?? 'summary'),
    isFallback,
  };
}

function buildFallbackSlots(input: CityRhythmDirectorInput, existingLines: readonly string[]): CityRhythmSlot[] {
  const rhythmKind: CityRhythmKind = input.day >= 8 ? 'calm_watch_day' : 'fallback';
  const line = pickCopy(rhythmKind, input.day);
  const safeLine = duplicateLine(line, existingLines) ? pickCopy('fallback', input.day + 1) : line;
  return [
    {
      id: nextSlotId('fallback'),
      kind: 'safe_watch',
      title: CITY_RHYTHM_SLOT_TITLES.safe_watch,
      line: clampLine(safeLine, CITY_RHYTHM_DIRECTOR_LINE_MAX),
      sourceIds: ['fallback'],
      sourceKinds: ['fallback'],
      priority: 20,
      tone: 'calm',
      visibilityLevel: input.day < 8 ? 'hidden' : 'summary',
      isFallback: true,
    },
  ];
}

function pickSurfaceSlot(
  slots: CityRhythmSlot[],
  prefer: (slot: CityRhythmSlot) => boolean,
): CityRhythmSlot | undefined {
  return slots.find((slot) => !slot.isFallback && prefer(slot)) ?? slots.find((s) => !s.isFallback);
}

export function buildCityRhythmDirector(input: CityRhythmDirectorInput): CityRhythmDirectorResult {
  slotCounter = 0;
  const day = Math.max(1, input.day ?? 1);
  const existingLines = input.suppressLines ?? [];
  const suppressCandidateIds: string[] = [];
  const suppressSourceIds: string[] = [...(input.suppressSourceIds ?? [])];

  if (day < 8) {
    const slots = buildFallbackSlots(input, existingLines);
    return {
      day,
      isVisible: false,
      rhythmKind: 'fallback',
      intensity: 'low',
      tone: 'calm',
      title: CITY_RHYTHM_KIND_TITLES.fallback,
      summaryLine: slots[0]?.line ?? pickCopy('fallback', day),
      slots,
      sourceIds: ['fallback'],
      suppressCandidateIds,
      suppressSourceIds,
    };
  }

  const drafts = collectDrafts(input);
  const { picked, suppressedIds } = applyDensityGuard(drafts, input);
  suppressSourceIds.push(...suppressedIds);

  const rhythmKind = resolveDominantRhythmKind(picked, day, input.recentRhythmKinds ?? []);
  const isFallback = picked.length === 0;
  const intensity = resolveIntensity(rhythmKind, picked, day, isFallback);
  const tone = resolveTone(rhythmKind, intensity);
  const title = CITY_RHYTHM_KIND_TITLES[rhythmKind];
  const summaryLine = pickCopy(rhythmKind, day);

  const slots: CityRhythmSlot[] = [];
  const usedLines = [...existingLines];

  if (isFallback) {
    slots.push(...buildFallbackSlots(input, usedLines));
  } else {
    for (const draft of picked) {
      const slot = buildSlotFromDraft(draft, draft.rhythmKind, usedLines);
      if (!slot) {
        suppressCandidateIds.push(draft.sourceCandidateId ?? draft.sourceIds[0] ?? '');
        continue;
      }
      slots.push(slot);
      usedLines.push(slot.line);
    }
    if (slots.length === 0) {
      slots.push(...buildFallbackSlots(input, usedLines));
    }
  }

  const visibleSlots = slots.filter((slot) => !slot.isFallback && slot.visibilityLevel !== 'hidden');
  const primarySlot = visibleSlots.find((s) => s.kind === 'primary_focus') ?? visibleSlots[0] ?? slots[0];
  const reportSlot =
    pickSurfaceSlot(visibleSlots, (s) => s.kind === 'primary_focus' || s.kind === 'memory_echo') ??
    primarySlot;
  const hubSlot =
    pickSurfaceSlot(visibleSlots, (s) => s.kind === 'primary_focus' || s.kind === 'recovery_balance') ??
    primarySlot;
  const eceSlot =
    pickSurfaceSlot(visibleSlots, (s) => s.kind === 'primary_focus' || s.kind === 'secondary_focus') ??
    primarySlot;
  const portfolioSlot =
    pickSurfaceSlot(visibleSlots, (s) => s.sourceKinds.includes('daily_capacity_portfolio')) ??
    primarySlot;

  return {
    day,
    isVisible: true,
    rhythmKind: isFallback && slots.every((s) => s.isFallback) ? 'calm_watch_day' : rhythmKind,
    intensity: isFallback ? 'low' : intensity,
    tone,
    title,
    summaryLine: primarySlot?.line ?? summaryLine,
    slots,
    primarySlot,
    reportSlot,
    hubSlot,
    eceSlot,
    portfolioSlot,
    sourceIds: uniqueStrings(slots.flatMap((slot) => slot.sourceIds)),
    suppressCandidateIds: uniqueStrings(suppressCandidateIds),
    suppressSourceIds: uniqueStrings(suppressSourceIds),
  };
}

export function collectCityRhythmDirectorLines(result: CityRhythmDirectorResult): string[] {
  return [result.summaryLine, ...result.slots.map((slot) => slot.line)].filter(Boolean);
}

export function hasCityRhythmDirectorRealSource(input: CityRhythmDirectorInput): boolean {
  return collectDrafts(input).length > 0;
}
