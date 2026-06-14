import {
  DOMINANT_STRATEGY_ACCESSIBILITY_MAX,
  DOMINANT_STRATEGY_BADGE_LABELS,
  DOMINANT_STRATEGY_CARD_MAX,
  DOMINANT_STRATEGY_LINE_MAX,
  DOMINANT_STRATEGY_SHAME_PATTERNS,
} from './dominantStrategyDetectorConstants';
import type {
  DominantStrategyCardModel,
  DominantStrategyDetectorResult,
} from './dominantStrategyDetectorTypes';

const TECHNICAL_ENUM_PATTERN = /\b[a-z]+_[a-z_]+\b/;

function clampLine(value: string, max: number): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3).trimEnd()}...`;
}

function isSafeCopy(value: string): boolean {
  return !TECHNICAL_ENUM_PATTERN.test(value) &&
    !DOMINANT_STRATEGY_SHAME_PATTERNS.some((pattern) => pattern.test(value));
}

function buildCard(result: DominantStrategyDetectorResult): DominantStrategyCardModel | null {
  if (!result.reportCandidate && !result.hubCandidate && !result.eceCandidate) return null;
  if (!result.isVisible || result.pattern === 'none') return null;
  const line = clampLine(result.line, DOMINANT_STRATEGY_LINE_MAX);
  const counterSignalLine = result.counterSignalLine
    ? clampLine(result.counterSignalLine, DOMINANT_STRATEGY_LINE_MAX)
    : undefined;
  if (!isSafeCopy(`${result.title} ${line} ${counterSignalLine ?? ''}`)) return null;
  return {
    id: `dominant-strategy-card-${result.pattern}`,
    title: result.title,
    line,
    counterSignalLine,
    badgeLabel: DOMINANT_STRATEGY_BADGE_LABELS[result.pattern],
    tone: result.tone,
    visibilityLevel: result.hubCandidate?.visibilityLevel ?? 'summary',
    accessibilityLabel: clampLine(
      `${result.title}. ${line}. ${counterSignalLine ?? ''}`.trim(),
      DOMINANT_STRATEGY_ACCESSIBILITY_MAX,
    ),
  };
}

export function buildDominantStrategyCardModels(
  result: DominantStrategyDetectorResult | null | undefined,
): DominantStrategyCardModel[] {
  if (!result) return [];
  const card = buildCard(result);
  return card ? [card].slice(0, DOMINANT_STRATEGY_CARD_MAX) : [];
}

export function buildPrimaryDominantStrategyCard(
  result: DominantStrategyDetectorResult | null | undefined,
): DominantStrategyCardModel | null {
  return result ? buildCard(result) : null;
}

export function buildEceDominantStrategyLine(
  result: DominantStrategyDetectorResult | null | undefined,
  avoidLines: string[] = [],
): string | undefined {
  if (!result?.isVisible || result.pattern === 'none') return undefined;
  const line = result.counterSignalLine ?? result.line;
  if (!isSafeCopy(line)) return undefined;
  const normalized = line.trim().toLowerCase();
  if (avoidLines.some((avoid) => avoid.trim().toLowerCase() === normalized)) return undefined;
  return clampLine(line, DOMINANT_STRATEGY_LINE_MAX);
}

export function buildReportDominantStrategyNote(
  result: DominantStrategyDetectorResult | null | undefined,
  avoidLines: string[] = [],
): string | undefined {
  return buildEceDominantStrategyLine(result, avoidLines);
}

export function buildHubDominantStrategyHint(
  result: DominantStrategyDetectorResult | null | undefined,
  avoidLines: string[] = [],
): string | undefined {
  return buildEceDominantStrategyLine(result, avoidLines);
}

export function dominantStrategyCopySafe(
  result: DominantStrategyDetectorResult | null | undefined,
): boolean {
  if (!result) return true;
  return isSafeCopy(`${result.title} ${result.line} ${result.counterSignalLine ?? ''}`);
}
