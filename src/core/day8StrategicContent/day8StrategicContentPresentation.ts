import {
  DAY8_STRATEGIC_CONTENT_ACCESSIBILITY_MAX,
  DAY8_STRATEGIC_CONTENT_KIND_BADGES,
  DAY8_STRATEGIC_CONTENT_LINE_MAX,
  DAY8_STRATEGIC_CONTENT_MAX_PRESENTATION_CANDIDATES,
  DAY8_STRATEGIC_CONTENT_SHORT_MAX,
} from './day8StrategicContentConstants';
import type {
  Day8StrategicContentCardModel,
  Day8StrategicContentCandidate,
  Day8StrategicContentResult,
} from './day8StrategicContentTypes';

const TECHNICAL_ENUM_PATTERN = /[a-z]+_[a-z_]+/;

function clampLine(value: string, max: number): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3).trimEnd()}...`;
}

function normalizeLine(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function duplicates(line: string, existingLines: readonly string[]): boolean {
  const normalized = normalizeLine(line);
  return existingLines.some((existing) => normalizeLine(existing) === normalized);
}

function isSafeText(text: string): boolean {
  return !TECHNICAL_ENUM_PATTERN.test(text);
}

function toCardModel(candidate: Day8StrategicContentCandidate): Day8StrategicContentCardModel | null {
  if (!isSafeText(`${candidate.title} ${candidate.line}`)) return null;
  const line = clampLine(candidate.line, DAY8_STRATEGIC_CONTENT_LINE_MAX);
  const shortLine = candidate.shortLine
    ? clampLine(candidate.shortLine, DAY8_STRATEGIC_CONTENT_SHORT_MAX)
    : undefined;
  return {
    id: `card_${candidate.id}`,
    title: candidate.title,
    line,
    shortLine,
    badgeLabel: DAY8_STRATEGIC_CONTENT_KIND_BADGES[candidate.kind],
    districtName: candidate.districtName,
    tone: candidate.tone,
    visibilityLevel: candidate.visibilityLevel,
    isActionable: candidate.isActionable,
    accessibilityLabel: clampLine(
      `${candidate.title}. ${candidate.districtName ?? 'Şehir'}. ${line}.`,
      DAY8_STRATEGIC_CONTENT_ACCESSIBILITY_MAX,
    ),
  };
}

export function buildDay8StrategicContentCardModels(
  result: Day8StrategicContentResult | null | undefined,
  existingLines: readonly string[] = [],
): Day8StrategicContentCardModel[] {
  if (!result || result.day < 8) return [];
  const cards: Day8StrategicContentCardModel[] = [];
  for (const candidate of result.candidates) {
    if (candidate.isFallback || candidate.visibilityLevel === 'hidden') continue;
    if (duplicates(candidate.line, existingLines)) continue;
    const card = toCardModel(candidate);
    if (!card) continue;
    cards.push(card);
    if (cards.length >= DAY8_STRATEGIC_CONTENT_MAX_PRESENTATION_CANDIDATES) break;
  }
  return cards;
}

export function buildPrimaryDay8StrategicContentCard(
  result: Day8StrategicContentResult | null | undefined,
  existingLines: readonly string[] = [],
): Day8StrategicContentCardModel | null {
  const candidate = result?.primaryCandidate;
  if (!candidate || candidate.isFallback || (result?.day ?? 1) < 8) return null;
  if (candidate.visibilityLevel === 'hidden') return null;
  if (duplicates(candidate.line, existingLines)) return null;
  return toCardModel(candidate);
}

export function buildHubDay8StrategicContentHint(
  result: Day8StrategicContentResult | null | undefined,
  existingLines: readonly string[] = [],
): string | null {
  const candidate = result?.hubCandidate;
  if (!candidate || candidate.isFallback || (result?.day ?? 1) < 8) return null;
  if (candidate.visibilityLevel === 'hidden') return null;
  if (duplicates(candidate.line, existingLines)) return null;
  if (!isSafeText(candidate.line)) return null;
  return clampLine(candidate.line, DAY8_STRATEGIC_CONTENT_LINE_MAX);
}

export function buildReportDay8StrategicContentNote(
  result: Day8StrategicContentResult | null | undefined,
  existingLines: readonly string[] = [],
): string | null {
  const candidate = result?.reportCandidate;
  if (!candidate || candidate.isFallback || (result?.day ?? 1) < 8) return null;
  if (candidate.visibilityLevel === 'hidden') return null;
  if (duplicates(candidate.line, existingLines)) return null;
  if (!isSafeText(candidate.line)) return null;
  return clampLine(candidate.line, DAY8_STRATEGIC_CONTENT_LINE_MAX);
}

export function buildMapDay8StrategicContentHint(
  result: Day8StrategicContentResult | null | undefined,
  existingLines: readonly string[] = [],
): string | null {
  const candidate = result?.mapCandidate;
  if (!candidate || candidate.isFallback || (result?.day ?? 1) < 8) return null;
  if (candidate.visibilityLevel === 'hidden') return null;
  if (duplicates(candidate.line, existingLines)) return null;
  if (!isSafeText(candidate.line)) return null;
  return clampLine(candidate.line, DAY8_STRATEGIC_CONTENT_LINE_MAX);
}

export function buildEceDay8StrategicContentLine(
  result: Day8StrategicContentResult | null | undefined,
  existingLines: readonly string[] = [],
): string | null {
  const candidate = result?.eceCandidate;
  if (!candidate || candidate.isFallback || candidate.confidence === 'low' || (result?.day ?? 1) < 8) {
    return null;
  }
  if (candidate.visibilityLevel === 'hidden') return null;
  if (duplicates(candidate.line, existingLines)) return null;
  if (!isSafeText(candidate.line)) return null;
  return clampLine(candidate.line, DAY8_STRATEGIC_CONTENT_LINE_MAX);
}

export function buildPortfolioDay8StrategicContentSignal(
  result: Day8StrategicContentResult | null | undefined,
  existingLines: readonly string[] = [],
): string | null {
  const candidate = result?.portfolioCandidate;
  if (!candidate || candidate.isFallback || (result?.day ?? 1) < 8) return null;
  if (candidate.visibilityLevel === 'hidden') return null;
  if (duplicates(candidate.line, existingLines)) return null;
  if (!isSafeText(candidate.line)) return null;
  return clampLine(candidate.line, DAY8_STRATEGIC_CONTENT_LINE_MAX);
}

export function collectDay8StrategicContentPresentationLines(
  result: Day8StrategicContentResult,
): string[] {
  return result.candidates.map((candidate) => candidate.line);
}
