import {
  ECE_STRATEGY_LINE_ACCESSIBILITY_MAX,
  ECE_STRATEGY_LINE_KIND_LABELS,
  ECE_STRATEGY_LINE_MAX,
  ECE_STRATEGY_LINE_SHORT_MAX,
  ECE_TECHNICAL_TOKEN_PATTERN,
} from './eceStrategyLineConstants';
import type {
  EceStrategyLine,
  EceStrategyLineCardModel,
  EceStrategyLinePhase,
  EceStrategyLineResult,
} from './eceStrategyLineTypes';

function clamp(value: string, max: number): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

function isSafeLine(line: EceStrategyLine | null | undefined): line is EceStrategyLine {
  if (!line?.text.trim()) return false;
  return !ECE_TECHNICAL_TOKEN_PATTERN.test(line.text);
}

function selectLine(
  result: EceStrategyLineResult | null | undefined,
  phase: EceStrategyLinePhase,
): EceStrategyLine | null {
  if (!result) return null;
  if (phase === 'report' && isSafeLine(result.reportLine)) return result.reportLine;
  if (phase === 'continuation' && isSafeLine(result.continuationLine)) return result.continuationLine;
  if ((phase === 'map' || phase === 'operation') && isSafeLine(result.secondaryLine)) {
    const secondary = result.secondaryLine;
    if (secondary.phases.includes(phase)) return secondary;
  }
  if (isSafeLine(result.primaryLine)) return result.primaryLine;
  if (isSafeLine(result.fallbackLine)) return result.fallbackLine;
  return null;
}

export function buildEceStrategyLineCardModel(
  result: EceStrategyLineResult | null | undefined,
  phase: EceStrategyLinePhase,
  avoidTexts: Array<string | null | undefined> = [],
): EceStrategyLineCardModel | null {
  const line = selectLine(result, phase);
  if (!line) return null;
  const text = clamp(line.text, ECE_STRATEGY_LINE_MAX);
  const normalized = text.toLowerCase();
  if (avoidTexts.some((avoid) => avoid?.trim().toLowerCase() === normalized)) return null;
  return {
    id: line.id,
    text,
    shortText: line.shortText ? clamp(line.shortText, ECE_STRATEGY_LINE_SHORT_MAX) : undefined,
    tone: line.tone,
    badgeLabel: ECE_STRATEGY_LINE_KIND_LABELS[line.kind],
    sourceLabel: line.sourceKinds[0]?.replace(/_/g, ' '),
    ctaHint: line.ctaHint,
    accessibilityLabel: clamp(`Ece. ${text}`, ECE_STRATEGY_LINE_ACCESSIBILITY_MAX),
  };
}

export function buildEceHubAdvisorLine(
  result: EceStrategyLineResult | null | undefined,
  avoidTexts: Array<string | null | undefined> = [],
): string | null {
  return buildEceStrategyLineCardModel(result, 'hub', avoidTexts)?.text ?? null;
}

export function buildEceReportAdvisorLine(
  result: EceStrategyLineResult | null | undefined,
  avoidTexts: Array<string | null | undefined> = [],
): string | null {
  return buildEceStrategyLineCardModel(result, 'report', avoidTexts)?.text ?? null;
}

export function buildEceContinuationLine(
  result: EceStrategyLineResult | null | undefined,
  avoidTexts: Array<string | null | undefined> = [],
): string | null {
  return buildEceStrategyLineCardModel(result, 'continuation', avoidTexts)?.text ?? null;
}

export function buildEceOperationHintLine(
  result: EceStrategyLineResult | null | undefined,
  avoidTexts: Array<string | null | undefined> = [],
): string | null {
  return buildEceStrategyLineCardModel(result, 'operation', avoidTexts)?.text ?? null;
}

export function buildEceMapHintLine(
  result: EceStrategyLineResult | null | undefined,
  avoidTexts: Array<string | null | undefined> = [],
): string | null {
  return buildEceStrategyLineCardModel(result, 'map', avoidTexts)?.text ?? null;
}
