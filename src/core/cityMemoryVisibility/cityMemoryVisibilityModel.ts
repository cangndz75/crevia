import { pickSurfaceCopy } from '@/core/contentVarietyQuality';
import {
  CITY_MEMORY_TECHNICAL_TOKEN_PATTERN,
  CITY_MEMORY_VISIBILITY_COPY_PACK,
  CITY_MEMORY_VISIBILITY_LINE_MAX,
  CITY_MEMORY_VISIBILITY_MAX_TRACES,
  CITY_MEMORY_VISIBILITY_PRIORITY_MAX,
  CITY_MEMORY_VISIBILITY_SHORT_MAX,
  CITY_MEMORY_VISIBILITY_SOURCE_PRIORITY,
} from './cityMemoryVisibilityConstants';
import type {
  CityMemoryVisibilityConfidence,
  CityMemoryVisibilityDayPolicy,
  CityMemoryVisibilityInput,
  CityMemoryVisibilityKind,
  CityMemoryVisibilityResult,
  CityMemoryVisibilitySourceKind,
  CityMemoryVisibilityTone,
  CityMemoryVisibilityTrace,
} from './cityMemoryVisibilityTypes';

type CandidateSeed = {
  id: string;
  kind: CityMemoryVisibilityKind;
  title: string;
  line: string;
  shortLine?: string;
  districtId?: string;
  districtName?: string;
  storyChainId?: string;
  tone: CityMemoryVisibilityTone;
  sourceIds: string[];
  sourceKinds: CityMemoryVisibilitySourceKind[];
  confidence: CityMemoryVisibilityConfidence;
  priority: number;
  dayPolicy: CityMemoryVisibilityDayPolicy;
  isActionable: boolean;
  isFallback?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (isRecord(value)) {
    const nested =
      value.items ??
      value.signals ??
      value.bindings ??
      value.threads ??
      value.cards ??
      value.activeChains ??
      value.entries;
    return Array.isArray(nested) ? nested : [value];
  }
  return [];
}

function readString(value: unknown, keys: string[]): string | null {
  if (!isRecord(value)) return null;
  for (const key of keys) {
    const item = value[key];
    if (typeof item === 'string' && item.trim()) return item.trim();
  }
  return null;
}

function readNestedString(value: unknown, paths: string[][]): string | null {
  for (const path of paths) {
    let cursor: unknown = value;
    for (const key of path) {
      cursor = isRecord(cursor) ? cursor[key] : undefined;
    }
    if (typeof cursor === 'string' && cursor.trim()) return cursor.trim();
  }
  return null;
}

function readSourceIds(value: unknown, fallback: string): string[] {
  if (!isRecord(value)) return [fallback];
  const sourceIds = value.sourceIds;
  if (Array.isArray(sourceIds)) {
    const ids = sourceIds.filter(
      (item): item is string => typeof item === 'string' && Boolean(item.trim()),
    );
    if (ids.length > 0) return ids.slice(0, 6);
  }
  const id = typeof value.id === 'string' && value.id.trim() ? value.id.trim() : fallback;
  return [id];
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function clampLine(value: string, max = CITY_MEMORY_VISIBILITY_LINE_MAX): string {
  const cleaned = value.replace(/\s+/g, ' ').trim().replace(CITY_MEMORY_TECHNICAL_TOKEN_PATTERN, '').trim();
  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0]?.trim() || cleaned;
  if (firstSentence.length <= max) return firstSentence;
  return `${firstSentence.slice(0, max - 1).trim()}…`;
}

function shortLine(text: string): string {
  return clampLine(text, CITY_MEMORY_VISIBILITY_SHORT_MAX);
}

function copyLine(kind: CityMemoryVisibilityKind, seed: string): string {
  const lines = CITY_MEMORY_VISIBILITY_COPY_PACK[kind];
  return pickSurfaceCopy(kind, 'report', lines, { duplicateKey: seed });
}

function sourceRank(kind: CityMemoryVisibilitySourceKind): number {
  const index = CITY_MEMORY_VISIBILITY_SOURCE_PRIORITY.indexOf(kind);
  return index >= 0 ? CITY_MEMORY_VISIBILITY_SOURCE_PRIORITY.length - index : 0;
}

function resolveDayPolicy(day: number): CityMemoryVisibilityDayPolicy {
  if (day <= 1) return 'day_1';
  if (day < 8) return 'day_2_7';
  if (day < 10) return 'day_8_plus';
  return 'day_10_plus';
}

function policyAllows(day: number, policy: CityMemoryVisibilityDayPolicy): boolean {
  if (policy === 'any') return true;
  if (policy === 'day_1') return day <= 1;
  if (policy === 'day_2_7') return day >= 2 && day <= 7;
  if (policy === 'day_8_plus') return day >= 8;
  return day >= 10;
}

function makeTrace(seed: CandidateSeed): CityMemoryVisibilityTrace {
  const line = clampLine(seed.line);
  return {
    id: seed.id,
    kind: seed.kind,
    title: clampLine(seed.title, 44),
    line,
    shortLine: seed.shortLine ? shortLine(seed.shortLine) : shortLine(line),
    districtId: seed.districtId,
    districtName: seed.districtName,
    storyChainId: seed.storyChainId,
    tone: seed.tone,
    sourceIds: uniqueStrings(seed.sourceIds),
    sourceKinds: uniqueStrings(seed.sourceKinds) as CityMemoryVisibilitySourceKind[],
    confidence: seed.confidence,
    priority: clamp(seed.priority, 0, CITY_MEMORY_VISIBILITY_PRIORITY_MAX),
    dayPolicy: seed.dayPolicy,
    isActionable: seed.isActionable,
    isFallback: seed.isFallback === true,
  };
}

function isSuppressed(seed: CandidateSeed, input: CityMemoryVisibilityInput): boolean {
  const suppressed = new Set(input.suppressSourceIds ?? []);
  if (seed.sourceIds.some((id) => suppressed.has(id))) return true;
  if (input.recentTraceIds?.includes(seed.id)) return true;
  const text = normalizeText(seed.line);
  if ((input.recentTraceTexts ?? []).some((recent) => normalizeText(recent) === text)) return true;
  return false;
}

function isDuplicateOfOtherSurfaces(seed: CandidateSeed, input: CityMemoryVisibilityInput): boolean {
  const texts: string[] = [];
  const sourceIds: string[] = [];

  const retention = input.oneMoreDayRetentionResult;
  if (isRecord(retention)) {
    const hook = retention.primaryHook;
    if (isRecord(hook)) {
      texts.push(
        readString(hook, ['line', 'tomorrowLine']) ?? '',
        readString(retention, ['summaryLine', 'footerLine']) ?? '',
      );
      sourceIds.push(...readSourceIds(hook, 'retention'));
    }
  }

  const ece = input.eceStrategyLineResult;
  if (isRecord(ece)) {
    for (const key of ['primaryLine', 'secondaryLine', 'reportLine', 'continuationLine']) {
      const line = ece[key];
      if (isRecord(line)) {
        texts.push(readString(line, ['text']) ?? '');
        sourceIds.push(...readSourceIds(line, 'ece'));
      }
    }
  }

  const normalizedSeed = normalizeText(seed.line);
  if (texts.some((text) => normalizeText(text) === normalizedSeed)) return true;
  if (seed.sourceIds.some((id) => sourceIds.includes(id))) {
    if (seed.sourceKinds.includes('one_more_day_retention') || seed.sourceKinds.includes('portfolio_defer_risk')) {
      return true;
    }
  }
  return false;
}

function pushDecisionCandidates(input: CityMemoryVisibilityInput, seeds: CandidateSeed[]): void {
  for (const raw of asArray(input.decisionConsequenceThreads)) {
    if (!isRecord(raw)) continue;
    const sourceIds = readSourceIds(raw, 'decision-consequence');
    const text =
      readString(raw, ['causalLine', 'summary', 'line', 'eceLine']) ??
      readString(raw, ['nextActionHint']);
    if (!text) continue;
    const shortText =
      readString(raw, ['summary', 'line']) ??
      readString(raw, ['title']);
    const districtId = readString(raw, ['districtId', 'neighborhoodId']);
    seeds.push({
      id: `memory-decision-${sourceIds[0]}`,
      kind: 'decision_trace',
      title: readString(raw, ['title']) ?? 'Karar izi',
      line: text,
      shortLine: shortText && normalizeText(shortText) !== normalizeText(text) ? shortText : undefined,
      districtId: districtId ?? undefined,
      districtName: readString(raw, ['districtName', 'district']) ?? undefined,
      tone: readString(raw, ['tone']) === 'warning' ? 'cautious' : 'strategic',
      sourceIds,
      sourceKinds: ['decision_consequence'],
      confidence: readString(raw, ['strength']) === 'high' ? 'high' : 'medium',
      priority: 88,
      dayPolicy: input.day <= 1 ? 'day_1' : input.day < 8 ? 'day_2_7' : 'day_8_plus',
      isActionable: true,
    });
  }
}

function pushCarryOverCandidates(input: CityMemoryVisibilityInput, seeds: CandidateSeed[]): void {
  for (const raw of asArray(input.carryOverSignals)) {
    if (!isRecord(raw)) continue;
    const sourceIds = readSourceIds(raw, 'carry-over');
    const text =
      readString(raw, ['text', 'summary', 'line', 'impactLine', 'eceLine']) ??
      readString(raw, ['title']);
    if (!text) continue;
    seeds.push({
      id: `memory-carry-${sourceIds[0]}`,
      kind: 'carry_over_trace',
      title: readString(raw, ['title', 'shortLabel']) ?? 'Devam eden etki',
      line: text,
      districtId: readString(raw, ['neighborhoodId', 'districtId']) ?? undefined,
      tone: 'strategic',
      sourceIds,
      sourceKinds: ['carry_over'],
      confidence: 'medium',
      priority: 84,
      dayPolicy: input.day < 8 ? 'day_2_7' : 'day_8_plus',
      isActionable: true,
    });
  }
}

function pushButterflyCandidates(input: CityMemoryVisibilityInput, seeds: CandidateSeed[]): void {
  for (const raw of asArray(input.butterflySignals)) {
    if (!isRecord(raw)) continue;
    const sourceIds = readSourceIds(raw, 'butterfly');
    const text =
      readString(raw, ['reportLine', 'resultHint', 'description', 'line', 'eceLine']) ??
      readString(raw, ['title']);
    if (!text) continue;
    seeds.push({
      id: `memory-butterfly-${sourceIds[0]}`,
      kind: 'butterfly_trace',
      title: readString(raw, ['title']) ?? 'Kucuk etki',
      line: text,
      districtId: readString(raw, ['neighborhoodId', 'districtId']) ?? undefined,
      tone: 'cautious',
      sourceIds,
      sourceKinds: ['butterfly_effect'],
      confidence: 'medium',
      priority: 80,
      dayPolicy: input.day < 8 ? 'day_2_7' : 'day_8_plus',
      isActionable: false,
    });
  }
}

function pushArchiveCandidates(input: CityMemoryVisibilityInput, seeds: CandidateSeed[]): void {
  for (const raw of asArray(input.cityArchiveEntries)) {
    if (!isRecord(raw)) continue;
    if (raw.isPlayerVisible === false) continue;
    const sourceIds = readSourceIds(raw, 'city-archive');
    const text =
      readString(raw, ['eceLine', 'reportLine', 'shortLine', 'line', 'archiveLine']) ??
      readString(raw, ['title']);
    if (!text) continue;
    seeds.push({
      id: `memory-archive-${sourceIds[0]}`,
      kind: 'district_trace',
      title: readString(raw, ['title']) ?? 'Sehir arsivi',
      line: text,
      districtId: readString(raw, ['districtId']) ?? undefined,
      tone: 'neutral',
      sourceIds,
      sourceKinds: ['city_archive'],
      confidence: 'high',
      priority: 76,
      dayPolicy: input.day < 8 ? 'day_2_7' : 'day_8_plus',
      isActionable: false,
    });
  }
}

function pushDistrictMemoryCandidates(input: CityMemoryVisibilityInput, seeds: CandidateSeed[]): void {
  for (const raw of asArray(input.districtMemorySignals)) {
    if (!isRecord(raw)) continue;
    const sourceIds = readSourceIds(raw, 'district-memory');
    const text =
      readString(raw, ['advisorLine', 'reportLine', 'memoryLine', 'line', 'advisorHint', 'reportHint']) ??
      readString(raw, ['shortLine', 'title']);
    if (!text) continue;
    seeds.push({
      id: `memory-district-${sourceIds[0]}`,
      kind: 'district_trace',
      title: readString(raw, ['title']) ?? 'Mahalle hafizasi',
      line: text,
      districtId: readString(raw, ['districtId', 'neighborhoodId']) ?? undefined,
      districtName: readString(raw, ['districtName', 'district']) ?? undefined,
      tone: 'strategic',
      sourceIds,
      sourceKinds: ['district_memory'],
      confidence: 'high',
      priority: 78,
      dayPolicy: input.day < 8 ? 'day_2_7' : 'day_8_plus',
      isActionable: true,
    });
  }
}

function pushStoryChainCandidates(input: CityMemoryVisibilityInput, seeds: CandidateSeed[]): void {
  for (const raw of asArray(input.storyChains)) {
    if (!isRecord(raw)) continue;
    const chainId = readString(raw, ['chainId', 'id']);
    if (!chainId) continue;
    const text =
      readString(raw, ['eceLine', 'reportLine', 'hubLine', 'playerVisibleLine', 'line']) ??
      readString(raw, ['playerVisibleTitle']);
    if (!text) continue;
    seeds.push({
      id: `memory-story-${chainId}`,
      kind: 'story_chain_trace',
      title: readString(raw, ['playerVisibleTitle', 'title']) ?? 'Hikaye zinciri',
      line: text,
      districtId: readString(raw, ['districtId']) ?? undefined,
      storyChainId: chainId,
      tone: 'positive',
      sourceIds: readSourceIds(raw, chainId),
      sourceKinds: ['story_chain'],
      confidence: 'high',
      priority: input.day >= 10 ? 74 : 68,
      dayPolicy: input.day >= 10 ? 'day_10_plus' : input.day >= 8 ? 'day_8_plus' : 'day_2_7',
      isActionable: true,
    });
  }
}

function pushRetentionCandidates(input: CityMemoryVisibilityInput, seeds: CandidateSeed[]): void {
  const retention = input.oneMoreDayRetentionResult;
  if (!isRecord(retention)) return;
  const hook = retention.primaryHook;
  const text =
    readNestedString(retention, [['primaryHook', 'line'], ['primaryHook', 'tomorrowLine']]) ??
    readString(retention, ['summaryLine']);
  if (!text || !isRecord(hook)) return;
  const sourceIds = readSourceIds(hook, 'retention');
  const sourceKinds = (Array.isArray(hook.sourceKinds)
    ? hook.sourceKinds.filter((k): k is string => typeof k === 'string')
    : ['one_more_day_retention']) as CityMemoryVisibilitySourceKind[];
  if (!sourceKinds.some((k) => k.includes('memory') || k.includes('consequence') || k.includes('carry'))) {
    return;
  }
  seeds.push({
    id: `memory-retention-${sourceIds[0]}`,
    kind: 'hub_continuation_hint',
    title: 'Devam odağı',
    line: text,
    tone: 'strategic',
    sourceIds,
    sourceKinds: ['one_more_day_retention'],
    confidence: 'medium',
    priority: 62,
    dayPolicy: 'day_8_plus',
    isActionable: true,
  });
}

function pushDeferCandidates(input: CityMemoryVisibilityInput, seeds: CandidateSeed[]): void {
  const defer = input.portfolioDeferRiskResult;
  if (!isRecord(defer)) return;
  const binding = defer.primaryBinding;
  if (!isRecord(binding)) return;
  const sourceKinds = (Array.isArray(binding.sourceKinds)
    ? binding.sourceKinds.filter((k): k is string => typeof k === 'string')
    : []) as CityMemoryVisibilitySourceKind[];
  if (!sourceKinds.some((k) => k.includes('memory') || k.includes('consequence'))) return;
  const text = readString(binding, ['line', 'summaryLine', 'tomorrowLine']);
  if (!text) return;
  const sourceIds = readSourceIds(binding, 'defer');
  seeds.push({
    id: `memory-defer-${sourceIds[0]}`,
    kind: 'carry_over_trace',
    title: 'Takip izi',
    line: text,
    tone: 'cautious',
    sourceIds,
    sourceKinds: ['portfolio_defer_risk'],
    confidence: 'medium',
    priority: 60,
    dayPolicy: 'day_8_plus',
    isActionable: true,
  });
}

function pushMapCandidates(input: CityMemoryVisibilityInput, seeds: CandidateSeed[]): void {
  for (const raw of [...asArray(input.mapGameplayBindings), ...asArray(input.activeOperationMapBindings)]) {
    if (!isRecord(raw)) continue;
    const role = readString(raw, ['role', 'phase']);
    const isMemoryRole =
      role === 'district_memory' ||
      role === 'result_trace' ||
      role === 'result_trace_stamp' ||
      role === 'district_memory_trace';
    if (!isMemoryRole && !readString(raw, ['mapLine', 'memoryLine'])) continue;
    const sourceIds = readSourceIds(raw, 'map-binding');
    const text =
      readString(raw, ['mapLine', 'memoryLine', 'playerFacingLine', 'focusLine', 'pressureLine']) ??
      readString(raw, ['title']);
    if (!text) continue;
    seeds.push({
      id: `memory-map-${sourceIds[0]}`,
      kind: 'map_memory_hint',
      title: readString(raw, ['playerFacingTitle', 'title']) ?? 'Harita izi',
      line: text,
      districtId: readString(raw, ['districtId']) ?? undefined,
      districtName: readString(raw, ['districtName']) ?? undefined,
      tone: 'strategic',
      sourceIds,
      sourceKinds: isMemoryRole ? ['map_gameplay_binding'] : ['active_operation_map_binding'],
      confidence: 'medium',
      priority: 58,
      dayPolicy: 'day_8_plus',
      isActionable: true,
    });
  }
}

function pushEceMemoryCandidates(input: CityMemoryVisibilityInput, seeds: CandidateSeed[]): void {
  const ece = input.eceStrategyLineResult;
  if (!isRecord(ece)) return;
  for (const key of ['primaryLine', 'secondaryLine', 'reportLine']) {
    const line = ece[key];
    if (!isRecord(line)) continue;
    const kinds = Array.isArray(line.sourceKinds)
      ? line.sourceKinds.filter((k): k is string => typeof k === 'string')
      : [];
    const isMemory =
      kinds.some((k) =>
        ['decision_consequence', 'carry_over', 'butterfly_effect', 'district_memory', 'city_archive', 'story_chain'].includes(k),
      ) ||
      readString(line, ['kind'])?.includes('memory') ||
      readString(line, ['kind'])?.includes('consequence');
    if (!isMemory) continue;
    const text = readString(line, ['text']);
    if (!text) continue;
    const sourceIds = readSourceIds(line, 'ece-memory');
    seeds.push({
      id: `memory-ece-${sourceIds[0]}`,
      kind: 'ece_memory_hint',
      title: 'Ece hafiza notu',
      line: text,
      tone: 'neutral',
      sourceIds,
      sourceKinds: ['ece_strategy_line'],
      confidence: readString(line, ['confidence']) === 'high' ? 'high' : 'medium',
      priority: 52,
      dayPolicy: 'day_8_plus',
      isActionable: false,
    });
  }
}

function pushPersonalityContext(input: CityMemoryVisibilityInput, seeds: CandidateSeed[]): void {
  for (const raw of asArray(input.districtPersonalityProfiles)) {
    if (!isRecord(raw)) continue;
    const districtId = readString(raw, ['districtId', 'id']);
    if (!districtId) continue;
    const criteria = asArray(raw.criteria);
    const history = criteria.find(
      (entry) => isRecord(entry) && readString(entry, ['id']) === 'operation_history_weight',
    );
    if (!isRecord(history) || readString(history, ['band']) !== 'high') continue;
    const districtName = readString(raw, ['districtName', 'name']) ?? districtId;
    const sourceIds = readSourceIds(raw, districtId);
    seeds.push({
      id: `memory-personality-${districtId}`,
      kind: 'safe_summary',
      title: `${districtName} baglami`,
      line: `${districtName} bolgesinde kararlar daha gorunur olabilir.`,
      districtId,
      districtName,
      tone: 'neutral',
      sourceIds,
      sourceKinds: ['district_personality'],
      confidence: 'low',
      priority: 24,
      dayPolicy: 'day_8_plus',
      isActionable: false,
    });
  }
}

function buildFallbackSeed(day: number): CandidateSeed {
  const kind: CityMemoryVisibilityKind = day <= 1 ? 'fallback' : 'safe_summary';
  const seed = `fallback-day-${day}`;
  return {
    id: `memory-fallback-${day}`,
    kind,
    title: 'Sehir hafizasi',
    line: day <= 1
      ? copyLine('fallback', seed)
      : copyLine('safe_summary', seed),
    tone: 'neutral',
    sourceIds: ['fallback'],
    sourceKinds: ['fallback'],
    confidence: 'low',
    priority: 8,
    dayPolicy: day <= 1 ? 'day_1' : 'any',
    isActionable: false,
    isFallback: true,
  };
}

function scoreSeed(seed: CandidateSeed, day: number): number {
  const primarySource = seed.sourceKinds[0] ?? 'fallback';
  return seed.priority + sourceRank(primarySource) + (policyAllows(day, seed.dayPolicy) ? 10 : -40);
}

function pickSurfaceTrace(
  traces: CityMemoryVisibilityTrace[],
  kinds: CityMemoryVisibilityKind[],
): CityMemoryVisibilityTrace | undefined {
  return traces.find((trace) => kinds.includes(trace.kind));
}

export function buildCityMemoryVisibility(
  input: CityMemoryVisibilityInput,
): CityMemoryVisibilityResult {
  const day = Math.max(1, input.day ?? 1);
  const seeds: CandidateSeed[] = [];

  pushDecisionCandidates(input, seeds);
  pushCarryOverCandidates(input, seeds);
  pushButterflyCandidates(input, seeds);
  pushArchiveCandidates(input, seeds);
  pushDistrictMemoryCandidates(input, seeds);
  pushStoryChainCandidates(input, seeds);
  pushRetentionCandidates(input, seeds);
  pushDeferCandidates(input, seeds);
  pushMapCandidates(input, seeds);
  pushEceMemoryCandidates(input, seeds);
  pushPersonalityContext(input, seeds);

  const filtered = seeds
    .filter((seed) => policyAllows(day, seed.dayPolicy) || seed.isFallback)
    .filter((seed) => !isSuppressed(seed, input))
    .filter((seed) => !isDuplicateOfOtherSurfaces(seed, input))
    .sort((a, b) => scoreSeed(b, day) - scoreSeed(a, day) || a.id.localeCompare(b.id));

  let traces = filtered.map((seed) => makeTrace(seed));

  if (traces.length === 0 || (day <= 1 && traces.every((trace) => !trace.isFallback))) {
    const fallback = makeTrace(buildFallbackSeed(day));
    traces = day <= 1 ? [fallback] : [fallback, ...traces.filter((trace) => !trace.isFallback)];
  }

  if (day <= 1) {
    traces = traces.slice(0, 1);
  } else {
    traces = traces.slice(0, CITY_MEMORY_VISIBILITY_MAX_TRACES);
  }

  const primaryTrace =
    traces.find((trace) => !trace.isFallback && trace.confidence !== 'low') ?? traces[0];

  const reportTrace =
    pickSurfaceTrace(traces, ['decision_trace', 'carry_over_trace', 'district_trace', 'story_chain_trace']) ??
  traces.find((trace) => trace.kind === 'report_memory_note');

  const hubTrace =
    pickSurfaceTrace(traces, ['hub_continuation_hint', 'carry_over_trace', 'story_chain_trace', 'decision_trace']) ??
    traces.find((trace) => trace.kind === 'hub_continuation_hint');

  const mapTrace = traces.find((trace) => trace.kind === 'map_memory_hint');

  let eceTrace = traces.find((trace) => trace.kind === 'ece_memory_hint');
  if (eceTrace && input.eceStrategyLineResult && isRecord(input.eceStrategyLineResult)) {
    const eceText = readNestedString(input.eceStrategyLineResult, [['primaryLine', 'text']]);
    if (eceText && normalizeText(eceText) === normalizeText(eceTrace.line)) {
      eceTrace = undefined;
    }
  }

  const summaryLine = primaryTrace?.shortLine ?? primaryTrace?.line;

  return {
    day,
    traces,
    primaryTrace,
    reportTrace: reportTrace
      ? {
          ...reportTrace,
          kind: reportTrace.kind === 'fallback' ? 'report_memory_note' : reportTrace.kind,
          line: reportTrace.kind === 'fallback' ? reportTrace.line : reportTrace.line,
        }
      : undefined,
    hubTrace,
    mapTrace,
    eceTrace,
    summaryLine,
    sourceIds: uniqueStrings(traces.flatMap((trace) => trace.sourceIds)),
  };
}
