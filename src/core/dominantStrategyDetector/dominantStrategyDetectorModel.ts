import {
  DOMINANT_STRATEGY_CLEARER_DAY,
  DOMINANT_STRATEGY_COUNTER_LINES,
  DOMINANT_STRATEGY_FULL_VISIBLE_DAY,
  DOMINANT_STRATEGY_MAX_SIGNALS,
  DOMINANT_STRATEGY_MIN_VISIBLE_DAY,
  DOMINANT_STRATEGY_REFLECTION_LINES,
  DOMINANT_STRATEGY_TIE_BREAK_ORDER,
  DOMINANT_STRATEGY_TITLES,
  DOMINANT_STRATEGY_TONES,
} from './dominantStrategyDetectorConstants';
import { pickSurfaceCopy } from '@/core/contentVarietyQuality';
import type {
  DominantStrategyConfidence,
  DominantStrategyDetectorInput,
  DominantStrategyDetectorResult,
  DominantStrategyPattern,
  DominantStrategyPresentationCandidate,
  DominantStrategySignal,
  DominantStrategySignalKind,
} from './dominantStrategyDetectorTypes';

type PatternScore = {
  pattern: DominantStrategyPattern;
  score: number;
  count: number;
  supportCount: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function uniqueStrings(values: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const text = asString(value);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }
  return result;
}

function sourceIdsFromRecord(record: Record<string, unknown>, fallback: string): string[] {
  return uniqueStrings([record.id, record.sourceId, record.eventId, record.operationId, record.actionId, record.sourceIds, fallback].flat());
}

function normalizeToken(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, '_') ?? '';
}

function inferPatternFromText(text: string): DominantStrategyPattern | null {
  const value = normalizeToken(text);
  if (/rapid|fast|hizli|ani|immediate/.test(value)) return 'rapid_response_overuse';
  if (/prevent|onleyici|safe_watch|watch|long_term|early|maintenance/.test(value)) return 'preventive_overuse';
  if (/balanced|denge|default|low_risk/.test(value)) return 'balanced_default_overuse';
  if (/resource_saving|budget|tasarruf|low_cost|kaynak/.test(value)) return 'resource_saving_overuse';
  if (/trust|public|social|guven|communication/.test(value)) return 'public_trust_overfocus';
  if (/crisis|urgent|risk|kritik|high_urgency/.test(value)) return 'crisis_priority_overfocus';
  if (/route|vehicle|rota|arac/.test(value)) return 'route_heavy_repetition';
  if (/recovery|comeback|toparlan/.test(value)) return 'recovery_opportunity_neglect';
  return null;
}

function inferDomainFromRecord(record: Record<string, unknown>): string | undefined {
  return (
    asString(record.domainTag) ??
    asString(record.domain) ??
    asString(record.relatedDomain) ??
    asString(record.kind) ??
    asString(record.itemKind) ??
    asString(record.selectedItemKind)
  );
}

function makeSignal(params: {
  id: string;
  kind: DominantStrategySignalKind;
  patternHint: DominantStrategyPattern;
  sourceIds: string[];
  weight?: number;
  day?: number;
  districtId?: string;
  districtName?: string;
  domainTag?: string;
  decisionKind?: string;
}): DominantStrategySignal {
  return {
    id: params.id,
    kind: params.kind,
    patternHint: params.patternHint,
    districtId: params.districtId,
    districtName: params.districtName,
    domainTag: params.domainTag,
    decisionKind: params.decisionKind,
    sourceIds: uniqueStrings(params.sourceIds),
    weight: clamp(params.weight ?? 1, 1, 4),
    day: params.day,
  };
}

function collectDecisionSignals(records: unknown[]): DominantStrategySignal[] {
  return records.slice(-7).flatMap((item, index) => {
    if (!isRecord(item)) return [];
    const decisionKind =
      asString(item.selectedDecisionKind) ??
      asString(item.decisionKind) ??
      asString(item.strategyId) ??
      asString(item.strategyKind) ??
      asString(item.decisionLabel);
    const label = [
      decisionKind,
      asString(item.decisionLabel),
      asString(item.title),
      asString(item.summary),
    ].filter(Boolean).join(' ');
    const pattern = inferPatternFromText(label);
    const districtId =
      asString(item.districtId) ?? asString(item.neighborhoodId) ?? asString(item.regionId);
    const domainTag = inferDomainFromRecord(item);
    const sourceIds = sourceIdsFromRecord(item, `decision-${index}`);
    const signals: DominantStrategySignal[] = [];
    if (pattern) {
      signals.push(makeSignal({
        id: `dominant-decision-${index}-${pattern}`,
        kind: 'decision_choice',
        patternHint: pattern,
        sourceIds,
        weight: 2,
        day: asNumber(item.day, 0) || undefined,
        districtId,
        districtName: asString(item.districtName) ?? asString(item.district),
        domainTag,
        decisionKind,
      }));
    }
    if (districtId) {
      signals.push(makeSignal({
        id: `dominant-district-${index}-${districtId}`,
        kind: 'district_focus',
        patternHint: 'district_repetition',
        sourceIds,
        weight: 1,
        day: asNumber(item.day, 0) || undefined,
        districtId,
        districtName: asString(item.districtName) ?? asString(item.district),
        domainTag,
      }));
    }
    if (domainTag && inferPatternFromText(domainTag) === 'route_heavy_repetition') {
      signals.push(makeSignal({
        id: `dominant-domain-${index}-route`,
        kind: 'decision_choice',
        patternHint: 'route_heavy_repetition',
        sourceIds,
        weight: 1,
        day: asNumber(item.day, 0) || undefined,
        districtId,
        domainTag,
      }));
    }
    return signals;
  });
}

function collectHistorySignals(
  values: unknown[],
  kind: DominantStrategySignalKind,
  fallbackPattern: DominantStrategyPattern,
): DominantStrategySignal[] {
  return values.slice(-7).flatMap((item, index) => {
    if (!isRecord(item)) return [];
    const joined = [
      asString(item.patternHint),
      asString(item.kind),
      asString(item.status),
      asString(item.tone),
      asString(item.title),
      asString(item.line),
      asString(item.reasonLine),
    ].filter(Boolean).join(' ');
    const baseInferred = inferPatternFromText(joined) ?? fallbackPattern;
    const inferred =
      kind === 'day8_strategic_focus' && baseInferred === 'public_trust_overfocus'
        ? 'social_pressure_avoidance'
        : baseInferred;
    const weight =
      inferred === 'social_pressure_avoidance' || inferred === 'recovery_opportunity_neglect'
        ? 16
        : kind === 'follow_up_execution'
          ? 3
          : 2;
    return makeSignal({
      id: `dominant-${kind}-${index}-${inferred}`,
      kind,
      patternHint: inferred,
      sourceIds: sourceIdsFromRecord(item, `${kind}-${index}`),
      weight,
      day: asNumber(item.day, 0) || undefined,
      districtId: asString(item.districtId),
      districtName: asString(item.districtName),
      domainTag: inferDomainFromRecord(item),
      decisionKind: asString(item.decisionKind),
    });
  });
}

function collectDirectSignals(input: DominantStrategyDetectorInput): DominantStrategySignal[] {
  const direct: DominantStrategySignal[] = [];
  for (const [index, districtId] of (input.recentDistrictIds ?? []).slice(-7).entries()) {
    direct.push(makeSignal({
      id: `dominant-recent-district-${index}-${districtId}`,
      kind: 'district_focus',
      patternHint: 'district_repetition',
      sourceIds: [`recent-district-${districtId}-${index}`],
      weight: 1,
      districtId,
    }));
  }
  for (const [index, domainTag] of (input.recentDomainTags ?? []).slice(-7).entries()) {
    const pattern = inferPatternFromText(domainTag);
    if (!pattern) continue;
    direct.push(makeSignal({
      id: `dominant-recent-domain-${index}-${pattern}`,
      kind: 'decision_choice',
      patternHint: pattern,
      sourceIds: [`recent-domain-${domainTag}-${index}`],
      weight: 1,
      domainTag,
    }));
  }
  return direct;
}

function deriveSpecialPatterns(signals: DominantStrategySignal[]): DominantStrategySignal[] {
  const derived: DominantStrategySignal[] = [];
  const districtGroups = new Map<string, DominantStrategySignal[]>();
  for (const signal of signals) {
    if (!signal.districtId) continue;
    const group = districtGroups.get(signal.districtId) ?? [];
    group.push(signal);
    districtGroups.set(signal.districtId, group);
  }
  const repeatedDistrict = [...districtGroups.values()]
    .filter((group) => {
      if (group.length < 3) return false;
      const allDirectDistrictSignals = group.every((signal) => signal.kind === 'district_focus' && !signal.decisionKind);
      const uniquePatternCount = new Set(group.map((signal) => signal.patternHint)).size;
      return allDirectDistrictSignals || uniquePatternCount >= 3;
    })
    .sort((a, b) => b.length - a.length)[0];
  if (repeatedDistrict) {
    derived.push(makeSignal({
      id: `dominant-derived-district-repetition-${repeatedDistrict[0]?.districtId ?? 'district'}`,
      kind: 'district_focus',
      patternHint: 'district_repetition',
      sourceIds: repeatedDistrict.flatMap((signal) => signal.sourceIds),
      weight: 16,
      districtId: repeatedDistrict[0]?.districtId,
      districtName: repeatedDistrict[0]?.districtName,
    }));
  }

  const lastDecisionSignals = signals
    .filter((signal) => ['decision_choice', 'portfolio_choice', 'operation_feed_choice'].includes(signal.kind))
    .slice(-5);
  const decisionPatterns = lastDecisionSignals.map((signal) => signal.patternHint);
  const uniqueDecisionPatterns = new Set(decisionPatterns.filter((pattern) => pattern !== 'none'));
  if (lastDecisionSignals.length >= 5 && uniqueDecisionPatterns.size >= 4) {
    derived.push(makeSignal({
      id: 'dominant-derived-inconsistent-switching',
      kind: 'report_outcome',
      patternHint: 'inconsistent_switching',
      sourceIds: lastDecisionSignals.flatMap((signal) => signal.sourceIds),
      weight: 16,
    }));
  }

  const hasSocialPressure =
    signals.some(
      (signal) =>
        signal.kind !== 'decision_choice' &&
        signal.kind !== 'district_focus' &&
        (signal.patternHint === 'public_trust_overfocus' ||
          /social|trust|guven/i.test(`${signal.domainTag ?? ''} ${signal.decisionKind ?? ''}`)),
    );
  const socialResponses = signals.filter(
    (signal) => signal.patternHint === 'public_trust_overfocus' && signal.kind === 'decision_choice',
  ).length;
  if (hasSocialPressure && socialResponses <= 1 && signals.length >= 4) {
    derived.push(makeSignal({
      id: 'dominant-derived-social-pressure-avoidance',
      kind: 'report_outcome',
      patternHint: 'social_pressure_avoidance',
      sourceIds: signals.flatMap((signal) => signal.sourceIds).slice(0, 8),
      weight: 14,
    }));
  }

  const hasRecoverySource = signals.some(
    (signal) =>
      signal.patternHint === 'recovery_opportunity_neglect' ||
      signal.kind === 'follow_up_execution' ||
      /recovery|comeback|toparlan/i.test(`${signal.decisionKind ?? ''} ${signal.domainTag ?? ''}`),
  );
  const recoveryResponses = signals.filter(
    (signal) => signal.patternHint === 'recovery_opportunity_neglect' && signal.kind === 'decision_choice',
  ).length;
  if (hasRecoverySource && recoveryResponses === 0 && signals.length >= 4) {
    derived.push(makeSignal({
      id: 'dominant-derived-recovery-neglect',
      kind: 'report_outcome',
      patternHint: 'recovery_opportunity_neglect',
      sourceIds: signals.flatMap((signal) => signal.sourceIds).slice(0, 8),
      weight: 16,
    }));
  }

  return derived;
}

function capSignals(signals: DominantStrategySignal[]): DominantStrategySignal[] {
  const seen = new Set<string>();
  const unique: DominantStrategySignal[] = [];
  for (const signal of signals) {
    const key = signal.id;
    if (seen.has(key) || signal.sourceIds.length === 0) continue;
    seen.add(key);
    unique.push(signal);
  }
  return unique
    .sort((a, b) => b.weight - a.weight)
    .slice(0, DOMINANT_STRATEGY_MAX_SIGNALS);
}

function scoreSignals(signals: DominantStrategySignal[]): PatternScore[] {
  const byPattern = new Map<DominantStrategyPattern, PatternScore>();
  for (const signal of signals) {
    if (signal.patternHint === 'none') continue;
    const score = byPattern.get(signal.patternHint) ?? {
      pattern: signal.patternHint,
      score: 0,
      count: 0,
      supportCount: 0,
    };
    const recency = signal.day ? 1 + Math.max(0, Math.min(3, signal.day)) * 0.02 : 1;
    score.score += signal.weight * recency;
    score.count += 1;
    if (signal.kind !== 'decision_choice' && signal.kind !== 'district_focus') score.supportCount += 1;
    byPattern.set(signal.patternHint, score);
  }
  return [...byPattern.values()].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return DOMINANT_STRATEGY_TIE_BREAK_ORDER.indexOf(a.pattern) -
      DOMINANT_STRATEGY_TIE_BREAK_ORDER.indexOf(b.pattern);
  });
}

function pickDominantPattern(scores: PatternScore[]): PatternScore {
  return scores[0] ?? { pattern: 'none', score: 0, count: 0, supportCount: 0 };
}

function forcedPatternFromInput(input: DominantStrategyDetectorInput): DominantStrategyPattern | null {
  const decisionRecords = (input.decisionRecords ?? []).filter(isRecord).slice(-7);
  const lastFive = decisionRecords.slice(-5);
  const patternFromRecord = (record: Record<string, unknown>) =>
    inferPatternFromText([
      asString(record.selectedDecisionKind),
      asString(record.decisionKind),
      asString(record.strategyId),
      asString(record.decisionLabel),
      asString(record.domainTag),
    ].filter(Boolean).join(' '));
  const decisionPatterns = lastFive
    .map(patternFromRecord)
    .filter((pattern): pattern is DominantStrategyPattern => Boolean(pattern));

  const districtCounts = new Map<string, DominantStrategyPattern[]>();
  for (const record of decisionRecords) {
    const districtId = asString(record.districtId) ?? asString(record.neighborhoodId) ?? asString(record.regionId);
    if (!districtId) continue;
    const group = districtCounts.get(districtId) ?? [];
    group.push(patternFromRecord(record) ?? 'none');
    districtCounts.set(districtId, group);
  }
  const variedDistrictRepeat = [...districtCounts.values()].some(
    (patterns) => patterns.length >= 3 && new Set(patterns).size >= 3,
  );
  const directDistrictRepeat = (() => {
    const counts = new Map<string, number>();
    for (const id of input.recentDistrictIds ?? []) counts.set(id, (counts.get(id) ?? 0) + 1);
    return [...counts.values()].some((count) => count >= 3);
  })();
  if (variedDistrictRepeat || directDistrictRepeat) return 'district_repetition';

  const hasRecoverySource = (input.followUpExecutionHistory ?? []).some((item) => {
    if (!isRecord(item)) return false;
    return /recovery|comeback|toparlan|support_recovery/i.test(
      `${asString(item.kind) ?? ''} ${asString(item.title) ?? ''} ${asString(item.line) ?? ''}`,
    );
  });
  const hasRecoveryDecision = decisionPatterns.includes('recovery_opportunity_neglect');
  if (hasRecoverySource && !hasRecoveryDecision) return 'recovery_opportunity_neglect';

  const hasSocialPressureSource = (input.day8StrategicContentHistory ?? []).some((item) => {
    if (!isRecord(item)) return false;
    return /social|trust|guven/i.test(
      `${asString(item.kind) ?? ''} ${asString(item.title) ?? ''} ${asString(item.line) ?? ''}`,
    );
  });
  const socialDecisionCount = decisionPatterns.filter((pattern) => pattern === 'public_trust_overfocus').length;
  if (hasSocialPressureSource && socialDecisionCount <= 1) return 'social_pressure_avoidance';

  if (lastFive.length >= 5 && new Set(decisionPatterns.filter((pattern) => pattern !== 'none')).size >= 4) {
    return 'inconsistent_switching';
  }

  return null;
}

function confidenceFor(score: PatternScore, day: number): DominantStrategyConfidence {
  if (day < DOMINANT_STRATEGY_MIN_VISIBLE_DAY || score.pattern === 'none') return 'low';
  if (day < DOMINANT_STRATEGY_FULL_VISIBLE_DAY) return score.count >= 3 ? 'medium' : 'low';
  if (score.count >= 4 && score.supportCount >= 1 && score.score >= 8) return 'high';
  if (score.count >= 3 || score.score >= 6) return 'medium';
  return 'low';
}

function visibilityFor(day: number, pattern: DominantStrategyPattern, confidence: DominantStrategyConfidence) {
  if (day < DOMINANT_STRATEGY_MIN_VISIBLE_DAY) return 'hidden' as const;
  if (pattern === 'none') return day >= DOMINANT_STRATEGY_FULL_VISIBLE_DAY ? 'hidden' as const : 'teaser' as const;
  if (day < DOMINANT_STRATEGY_FULL_VISIBLE_DAY) return 'teaser' as const;
  if (day >= DOMINANT_STRATEGY_CLEARER_DAY && confidence === 'high') return 'detailed' as const;
  return 'summary' as const;
}

function buildCandidate(
  result: Pick<DominantStrategyDetectorResult, 'pattern' | 'title' | 'line' | 'tone' | 'sourceIds'>,
  visibilityLevel: DominantStrategyPresentationCandidate['visibilityLevel'],
): DominantStrategyPresentationCandidate | undefined {
  if (visibilityLevel === 'hidden') return undefined;
  return {
    id: `dominant-strategy-${result.pattern}`,
    title: result.title,
    line: result.line,
    badgeLabel: result.pattern === 'none' ? 'Izleme' : 'Strateji',
    tone: result.tone,
    visibilityLevel,
    sourceIds: result.sourceIds,
  };
}

export function buildDominantStrategyDetector(
  input: DominantStrategyDetectorInput,
): DominantStrategyDetectorResult {
  const day = Math.max(1, input.day);
  const rawSignals = [
    ...collectDecisionSignals(input.decisionRecords ?? []),
    ...collectHistorySignals(input.portfolioHistory ?? [], 'portfolio_choice', 'balanced_default_overuse'),
    ...collectHistorySignals(input.operationFeedChoiceHistory ?? [], 'operation_feed_choice', 'route_heavy_repetition'),
    ...collectHistorySignals(input.followUpExecutionHistory ?? [], 'follow_up_execution', 'recovery_opportunity_neglect'),
    ...collectHistorySignals(input.deferRiskHistory ?? [], 'defer_risk', 'resource_saving_overuse'),
    ...collectHistorySignals(input.districtFocusHistory ?? [], 'district_focus', 'district_repetition'),
    ...collectHistorySignals(input.cityRhythmHistory ?? [], 'city_rhythm', 'balanced_default_overuse'),
    ...collectHistorySignals(input.day8StrategicContentHistory ?? [], 'day8_strategic_focus', 'recovery_opportunity_neglect'),
    ...collectHistorySignals(input.reportOutcomeHistory ?? [], 'report_outcome', 'inconsistent_switching'),
    ...collectDirectSignals(input),
  ];
  const allSignals = capSignals([...rawSignals, ...deriveSpecialPatterns(rawSignals)]);
  const scores = scoreSignals(allSignals);
  const noneScore: PatternScore = { pattern: 'none', score: 0, count: 0, supportCount: 0 };
  const forcedPattern = forcedPatternFromInput(input);
  const dominant = forcedPattern
    ? { pattern: forcedPattern, score: 16, count: Math.max(3, allSignals.length), supportCount: 1 }
    : allSignals.length >= 3
      ? pickDominantPattern(scores)
      : noneScore;
  const confidence = confidenceFor(dominant, day);
  const visibilityLevel = visibilityFor(day, dominant.pattern, confidence);
  const sourceIds = uniqueStrings(allSignals.flatMap((signal) => signal.sourceIds));
  const reflectionLines = DOMINANT_STRATEGY_REFLECTION_LINES[dominant.pattern];
  const counterLines = DOMINANT_STRATEGY_COUNTER_LINES[dominant.pattern];
  const line = pickSurfaceCopy(dominant.pattern, 'dominant_strategy', reflectionLines, { day });
  const counterSignalLine =
    visibilityLevel === 'teaser'
      ? undefined
      : counterLines.length > 0
        ? pickSurfaceCopy(dominant.pattern, 'dominant_strategy', counterLines, {
            day,
            duplicateKey: 'counter',
          })
        : undefined;
  const resultBase = {
    pattern: dominant.pattern,
    title: DOMINANT_STRATEGY_TITLES[dominant.pattern],
    line,
    tone: DOMINANT_STRATEGY_TONES[dominant.pattern],
    sourceIds,
  };
  const candidate = buildCandidate(resultBase, visibilityLevel);

  return {
    day,
    isVisible: visibilityLevel !== 'hidden' && dominant.pattern !== 'none',
    pattern: dominant.pattern,
    confidence,
    tone: DOMINANT_STRATEGY_TONES[dominant.pattern],
    title: DOMINANT_STRATEGY_TITLES[dominant.pattern],
    line,
    counterSignalLine,
    signals: allSignals,
    sourceIds,
    reportCandidate: candidate,
    hubCandidate: candidate,
    eceCandidate: candidate,
  };
}

export function collectDominantStrategyLines(
  result: DominantStrategyDetectorResult | null | undefined,
): string[] {
  if (!result || !result.isVisible) return [];
  return [result.line, result.counterSignalLine].filter((line): line is string => Boolean(line));
}
