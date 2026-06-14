import { buildEceOperationFeedBindingLine } from '@/core/day8OperationFeedBinding';
import { pickSurfaceCopy } from '@/core/contentVarietyQuality';
import {
  ECE_STRATEGY_LINE_CONTENT_PACK,
  type EceStrategyContentLine,
} from './eceStrategyLineContentPack';
import {
  ECE_STRATEGY_LINE_MAX,
  ECE_STRATEGY_LINE_SHORT_MAX,
  ECE_STRATEGY_LINE_SOURCE_PRIORITY,
  ECE_TECHNICAL_TOKEN_PATTERN,
} from './eceStrategyLineConstants';
import type {
  EceStrategyLine,
  EceStrategyLineConfidence,
  EceStrategyLineInput,
  EceStrategyLineKind,
  EceStrategyLinePhase,
  EceStrategyLineResult,
  EceStrategyLineSourceKind,
  EceStrategyTone,
} from './eceStrategyLineTypes';

type CandidateSeed = {
  id: string;
  kind: EceStrategyLineKind;
  tone: EceStrategyTone;
  text: string;
  shortText?: string;
  sourceIds: string[];
  sourceKinds: EceStrategyLineSourceKind[];
  confidence: EceStrategyLineConfidence;
  priority: number;
  minDay?: number;
  allowDayOne?: boolean;
  isActionable?: boolean;
  ctaHint?: string;
  phases: EceStrategyLinePhase[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (isRecord(value)) {
    const nested = value.items ?? value.signals ?? value.bindings ?? value.threads ?? value.cards;
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
    if (ids.length > 0) return ids.slice(0, 5);
  }
  const id = typeof value.id === 'string' && value.id.trim() ? value.id.trim() : fallback;
  return [id];
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function lineIsDuplicate(line: EceStrategyLine, input: EceStrategyLineInput): boolean {
  const text = normalizeText(line.text);
  if (input.recentLineIds?.includes(line.id)) return true;
  return (input.recentLineTexts ?? []).some((recent) => normalizeText(recent) === text);
}

function clampSentence(value: string, max = ECE_STRATEGY_LINE_MAX): string {
  const firstSentence = value
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)[0]
    ?.trim();
  const cleaned = (firstSentence || value.trim()).replace(ECE_TECHNICAL_TOKEN_PATTERN, '').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}…`;
}

function buildShortText(text: string): string {
  return clampSentence(text, ECE_STRATEGY_LINE_SHORT_MAX);
}

function contentLine(kind: EceStrategyLineKind, seed: string): EceStrategyContentLine {
  const lines = ECE_STRATEGY_LINE_CONTENT_PACK.filter((line) => line.kind === kind);
  if (lines.length === 0) {
    return {
      id: `fallback-${seed}`,
      kind: 'fallback',
      tone: 'calm',
      text: 'Bugun sakin ilerleyelim; en net sinyali birlikte okuyacagiz.',
    };
  }
  const texts = lines.map((line) => line.text);
  const text = pickSurfaceCopy(kind, 'ece', texts, { duplicateKey: seed });
  return lines.find((line) => line.text === text) ?? lines[0]!;
}

function makeLine(seed: CandidateSeed): EceStrategyLine {
  const text = clampSentence(seed.text);
  return {
    id: seed.id,
    kind: seed.kind,
    tone: seed.tone,
    text,
    shortText: seed.shortText ? clampSentence(seed.shortText, ECE_STRATEGY_LINE_SHORT_MAX) : buildShortText(text),
    sourceIds: Array.from(new Set(seed.sourceIds.filter(Boolean))).slice(0, 6),
    sourceKinds: Array.from(new Set(seed.sourceKinds)),
    confidence: seed.confidence,
    priority: seed.priority,
    dayPolicy: {
      minDay: seed.minDay,
      allowDayOne: seed.allowDayOne,
    },
    isActionable: seed.isActionable ?? false,
    ctaHint: seed.ctaHint,
    phases: seed.phases,
  };
}

function seedFromContent(
  kind: EceStrategyLineKind,
  sourceKind: EceStrategyLineSourceKind,
  seed: string,
  overrides: Partial<CandidateSeed>,
): CandidateSeed {
  const content = contentLine(kind, seed);
  return {
    id: `${sourceKind}-${content.id}`,
    kind,
    tone: content.tone,
    text: content.text,
    sourceIds: [sourceKind],
    sourceKinds: [sourceKind],
    confidence: 'medium',
    priority: 50,
    phases: ['hub'],
    ...overrides,
  };
}

function buildFallbackLine(day: number): EceStrategyLine {
  const dayOne = day <= 1;
  return makeLine({
    id: dayOne ? 'ece-fallback-day-1' : 'ece-fallback-general',
    kind: dayOne ? 'day_start_briefing' : 'fallback',
    tone: 'calm',
    text: dayOne
      ? 'Ilk operasyonu sakin okuyalim; etkisini raporda goreceksin.'
      : 'Bugun sakin ilerleyelim; en net sinyali birlikte okuyacagiz.',
    sourceIds: ['fallback'],
    sourceKinds: ['fallback'],
    confidence: 'low',
    priority: 1,
    allowDayOne: true,
    isActionable: false,
    phases: ['hub', 'day_start'],
  });
}

function buildOneMoreDayCandidate(input: EceStrategyLineInput): EceStrategyLine | null {
  const result = input.oneMoreDayRetentionResult;
  const hook = isRecord(result) ? result.primaryHook : null;
  const text =
    readNestedString(result, [['primaryHook', 'tomorrowLine'], ['primaryHook', 'line']]) ??
    readString(result, ['summaryLine', 'footerLine']);
  if (!text && !hook) return null;
  const sourceIds = readSourceIds(hook ?? result, 'one-more-day-retention');
  return makeLine(
    seedFromContent('one_more_day_hook', 'one_more_day_retention', sourceIds.join('-'), {
      id: `ece-retention-${sourceIds[0]}`,
      text: text ?? contentLine('one_more_day_hook', sourceIds[0] ?? 'retention').text,
      sourceIds,
      confidence: 'high',
      priority: 100,
      minDay: 2,
      isActionable: true,
      ctaHint: readString(result, ['ctaLabel']) ?? 'Devam et',
      phases: ['hub', 'report', 'continuation'],
    }),
  );
}

function buildOperationFeedBindingCandidate(input: EceStrategyLineInput): EceStrategyLine | null {
  const raw = input.day8OperationFeedBindingResult;
  if (!isRecord(raw) || raw.isActive !== true) return null;
  const text = buildEceOperationFeedBindingLine(raw as never);
  if (!text) return null;
  const sourceIds = readSourceIds(raw, 'operation-feed-binding');
  return makeLine(
    seedFromContent('hub_strategy_hint', 'daily_capacity_portfolio', sourceIds.join('-'), {
      id: `ece-operation-feed-${sourceIds[0] ?? 'binding'}`,
      text,
      sourceIds,
      confidence: 'medium',
      priority: 78,
      minDay: 8,
      isActionable: true,
      phases: ['hub', 'operation'],
    }),
  );
}

function buildPortfolioDeferCandidate(input: EceStrategyLineInput): EceStrategyLine | null {
  const result = input.portfolioDeferRiskResult;
  const text =
    readString(result, ['tomorrowActionLine', 'reportSummaryLine', 'summaryLine']) ??
    readNestedString(result, [['primaryBinding', 'line'], ['primaryBinding', 'summaryLine']]);
  if (!text) return null;
  const sourceIds = readSourceIds(result, 'portfolio-defer-risk');
  return makeLine(
    seedFromContent('defer_follow_up', 'portfolio_defer_risk', sourceIds.join('-'), {
      id: `ece-defer-${sourceIds[0]}`,
      text,
      sourceIds,
      confidence: 'high',
      priority: 92,
      minDay: 2,
      isActionable: true,
      ctaHint: 'Takip et',
      phases: ['hub', 'report', 'continuation'],
    }),
  );
}

function buildDailyCapacityCandidate(input: EceStrategyLineInput): EceStrategyLine | null {
  const result = input.dailyCapacityPortfolioResult;
  const text =
    readString(result, ['primaryTradeoffLine', 'ecePortfolioLine']) ??
    readNestedString(result, [['primaryRecommendation', 'summary'], ['primaryRecommendation', 'line']]);
  if (!text) return null;
  const sourceIds = readSourceIds(result, 'daily-capacity-portfolio');
  return makeLine(
    seedFromContent('portfolio_tradeoff', 'daily_capacity_portfolio', sourceIds.join('-'), {
      id: `ece-portfolio-${sourceIds[0]}`,
      text,
      sourceIds,
      confidence: 'high',
      priority: 86,
      minDay: 8,
      isActionable: true,
      ctaHint: 'Portfoyu oku',
      phases: ['hub', 'report', 'continuation'],
    }),
  );
}

function buildAuthorityCandidate(input: EceStrategyLineInput): EceStrategyLine | null {
  const summary = input.authorityExpansionSummary;
  const text =
    readString(summary, ['eceAuthorityLine', 'summaryLine']) ??
    readNestedString(summary, [['primaryBenefit', 'unlockedLine'], ['nextBenefit', 'previewLine']]);
  if (!text) return null;
  const sourceIds = readSourceIds(summary, 'authority-gameplay-expansion');
  return makeLine(
    seedFromContent('authority_benefit', 'authority_gameplay_expansion', sourceIds.join('-'), {
      id: `ece-authority-${sourceIds[0]}`,
      text,
      sourceIds,
      confidence: 'medium',
      priority: 78,
      minDay: 2,
      isActionable: false,
      phases: ['hub', 'report'],
    }),
  );
}

function firstRealLine(value: unknown, keys: string[]): { text: string; sourceIds: string[] } | null {
  const items = asArray(value);
  for (const item of items) {
    const text = readString(item, keys);
    if (text) return { text, sourceIds: readSourceIds(item, 'source') };
  }
  return null;
}

function buildGenericCandidate(
  input: EceStrategyLineInput,
  value: unknown,
  sourceKind: EceStrategyLineSourceKind,
  kind: EceStrategyLineKind,
  keys: string[],
  priority: number,
  phases: EceStrategyLinePhase[],
): EceStrategyLine | null {
  const real = firstRealLine(value, keys);
  if (!real) return null;
  return makeLine(
    seedFromContent(kind, sourceKind, real.sourceIds.join('-'), {
      id: `ece-${sourceKind}-${real.sourceIds[0]}`,
      text: real.text,
      sourceIds: real.sourceIds,
      confidence: 'medium',
      priority,
      minDay: 2,
      phases,
    }),
  );
}

function buildPlayerStyleCandidate(input: EceStrategyLineInput): EceStrategyLine | null {
  if (input.day <= 1 || !isRecord(input.playerStyleInsight)) return null;
  const visible = input.playerStyleInsight.visible;
  const confidence = input.playerStyleInsight.confidence;
  if (visible === false || confidence === 'low' || confidence === 'none') return null;
  const text = readString(input.playerStyleInsight, ['advisorLine', 'line', 'summaryLine']);
  const sourceIds = readSourceIds(input.playerStyleInsight, 'player-style');
  return makeLine(
    seedFromContent('player_style_reflection', 'player_style', sourceIds.join('-'), {
      id: `ece-player-style-${sourceIds[0]}`,
      text: text ?? contentLine('player_style_reflection', sourceIds[0] ?? 'style').text,
      sourceIds,
      confidence: confidence === 'high' ? 'high' : 'medium',
      priority: 28,
      minDay: 2,
      phases: ['hub', 'continuation'],
    }),
  );
}

function phaseAllowed(line: EceStrategyLine, phase: EceStrategyLinePhase): boolean {
  return line.phases.includes(phase);
}

function dayAllowed(line: EceStrategyLine, day: number): boolean {
  if (day <= 1 && !line.dayPolicy.allowDayOne) return false;
  if (line.dayPolicy.minDay != null && day < line.dayPolicy.minDay) return false;
  if (line.dayPolicy.maxDay != null && day > line.dayPolicy.maxDay) return false;
  return true;
}

function sourceRank(line: EceStrategyLine): number {
  const index = ECE_STRATEGY_LINE_SOURCE_PRIORITY.findIndex((kind) =>
    line.sourceKinds.includes(kind),
  );
  return index < 0 ? 999 : index;
}

function sortLines(lines: EceStrategyLine[]): EceStrategyLine[] {
  return [...lines].sort((a, b) => b.priority - a.priority || sourceRank(a) - sourceRank(b));
}

function collectCandidates(input: EceStrategyLineInput): EceStrategyLine[] {
  const candidates = [
    buildOneMoreDayCandidate(input),
    buildPortfolioDeferCandidate(input),
    buildDailyCapacityCandidate(input),
    buildOperationFeedBindingCandidate(input),
    buildAuthorityCandidate(input),
    buildGenericCandidate(
      input,
      input.decisionConsequenceThreads,
      'decision_consequence',
      'decision_consequence',
      ['eceLine', 'tomorrowActionLine', 'line', 'summaryLine', 'nextActionHint'],
      72,
      ['hub', 'report'],
    ),
    buildGenericCandidate(
      input,
      input.carryOverSignals,
      'carry_over',
      'decision_consequence',
      ['eceLine', 'line', 'summaryLine', 'impactLine'],
      66,
      ['hub', 'report', 'continuation'],
    ),
    buildGenericCandidate(
      input,
      input.butterflySignals,
      'butterfly_effect',
      'positive_reinforcement',
      ['eceLine', 'line', 'summaryLine'],
      64,
      ['hub', 'report'],
    ),
    buildGenericCandidate(
      input,
      input.districtMemorySignals,
      'district_memory',
      'district_memory',
      ['eceLine', 'line', 'memoryLine', 'summaryLine'],
      58,
      ['hub', 'report', 'continuation'],
    ),
    buildGenericCandidate(
      input,
      input.cityArchiveSignals,
      'city_archive',
      'district_memory',
      ['eceLine', 'line', 'archiveLine', 'summaryLine'],
      56,
      ['hub', 'report'],
    ),
    buildGenericCandidate(
      input,
      input.storyChainSignals,
      'story_chain',
      'district_memory',
      ['eceLine', 'line', 'summaryLine'],
      54,
      ['hub', 'continuation'],
    ),
    buildGenericCandidate(
      input,
      input.mapGameplayBindings,
      'map_gameplay_binding',
      'map_priority',
      ['eceLine', 'line', 'summaryLine', 'mapLine'],
      52,
      ['hub', 'map', 'operation'],
    ),
    buildGenericCandidate(
      input,
      input.activeOperationMapBindings,
      'active_operation_map_binding',
      'map_priority',
      ['eceLine', 'line', 'summaryLine', 'mapLine'],
      51,
      ['hub', 'map', 'operation'],
    ),
    buildGenericCandidate(
      input,
      input.resourcePressureSignals,
      'resource_pressure',
      'resource_pressure',
      ['eceLine', 'line', 'summaryLine', 'warningLine'],
      48,
      ['hub', 'report', 'continuation'],
    ),
    buildPlayerStyleCandidate(input),
  ].filter((line): line is EceStrategyLine => Boolean(line));

  return candidates
    .filter((line) => dayAllowed(line, input.day))
    .filter((line) => !lineIsDuplicate(line, input));
}

function firstForPhase(lines: EceStrategyLine[], phase: EceStrategyLinePhase): EceStrategyLine | undefined {
  return sortLines(lines).find((line) => phaseAllowed(line, phase));
}

export function buildEceStrategyLineResult(input: EceStrategyLineInput): EceStrategyLineResult {
  const fallbackLine = buildFallbackLine(input.day);
  const candidates = collectCandidates(input);
  const sorted = sortLines(candidates);
  const primaryLine = input.day <= 1 ? fallbackLine : sorted[0] ?? fallbackLine;
  const secondaryLine =
    input.day <= 1
      ? undefined
      : sorted.find((line) => line.id !== primaryLine.id && phaseAllowed(line, 'hub'));
  const reportLine = input.day <= 1 ? undefined : firstForPhase(sorted, 'report');
  const continuationLine = input.day <= 1 ? undefined : firstForPhase(sorted, 'continuation');
  const sourceIds = Array.from(
    new Set([
      ...fallbackLine.sourceIds,
      ...sorted.flatMap((line) => line.sourceIds),
    ]),
  );

  return {
    day: input.day,
    primaryLine,
    secondaryLine,
    reportLine,
    continuationLine,
    fallbackLine,
    sourceIds,
  };
}
