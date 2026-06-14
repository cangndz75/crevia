import {
  POSITIVE_COMEBACK_ACCESSIBILITY_MAX,
  POSITIVE_COMEBACK_BENEFIT_LINE_MAX,
  POSITIVE_COMEBACK_KIND_BADGES,
  POSITIVE_COMEBACK_LINE_MAX,
  POSITIVE_COMEBACK_MAX_CANDIDATES,
} from './positiveComebackConstants';
import type {
  PositiveComebackCardModel,
  PositiveComebackResult,
} from './positiveComebackTypes';

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

function toCardModel(
  candidate: PositiveComebackResult['candidates'][number],
): PositiveComebackCardModel | null {
  if (!isSafeText(`${candidate.title} ${candidate.line} ${candidate.benefitLine}`)) return null;
  const line = clampLine(candidate.line, POSITIVE_COMEBACK_LINE_MAX);
  const benefitLine = clampLine(candidate.benefitLine, POSITIVE_COMEBACK_BENEFIT_LINE_MAX);
  return {
    id: `card_${candidate.id}`,
    title: candidate.title,
    line,
    benefitLine,
    badgeLabel: POSITIVE_COMEBACK_KIND_BADGES[candidate.kind],
    tone: candidate.tone,
    districtName: candidate.districtName,
    isActionable: candidate.isActionable,
    accessibilityLabel: clampLine(
      `${candidate.title}. ${line}. ${benefitLine}.`,
      POSITIVE_COMEBACK_ACCESSIBILITY_MAX,
    ),
  };
}

export function buildPositiveComebackCardModels(
  result: PositiveComebackResult | null | undefined,
  existingLines: readonly string[] = [],
): PositiveComebackCardModel[] {
  if (!result) return [];
  const cards: PositiveComebackCardModel[] = [];
  for (const candidate of result.candidates.slice(0, POSITIVE_COMEBACK_MAX_CANDIDATES)) {
    if (candidate.visibilityLevel === 'hidden') continue;
    if (duplicates(candidate.line, existingLines)) continue;
    const card = toCardModel(candidate);
    if (!card) continue;
    cards.push(card);
    if (cards.length >= POSITIVE_COMEBACK_MAX_CANDIDATES) break;
  }
  return cards;
}

export function buildPrimaryPositiveComebackCard(
  result: PositiveComebackResult | null | undefined,
  existingLines: readonly string[] = [],
): PositiveComebackCardModel | null {
  const candidate = result?.primaryCandidate;
  if (!candidate || candidate.visibilityLevel === 'hidden') return null;
  if (duplicates(candidate.line, existingLines)) return null;
  return toCardModel(candidate);
}

export function buildReportPositiveComebackNote(
  result: PositiveComebackResult | null | undefined,
  existingLines: readonly string[] = [],
): string | undefined {
  const candidate = result?.reportCandidate;
  if (!candidate || candidate.isFallback || candidate.visibilityLevel === 'hidden') return undefined;
  if (!isSafeText(`${candidate.line} ${candidate.benefitLine}`)) return undefined;
  if (duplicates(candidate.line, existingLines)) return undefined;
  return clampLine(candidate.line, POSITIVE_COMEBACK_LINE_MAX);
}

export function buildHubPositiveComebackHint(
  result: PositiveComebackResult | null | undefined,
  existingLines: readonly string[] = [],
): string | undefined {
  const candidate = result?.hubCandidate;
  if (!candidate || candidate.isFallback || candidate.visibilityLevel === 'hidden') return undefined;
  if (!isSafeText(candidate.line)) return undefined;
  if (duplicates(candidate.line, existingLines)) return undefined;
  return clampLine(candidate.benefitLine || candidate.line, POSITIVE_COMEBACK_BENEFIT_LINE_MAX);
}

export function buildEcePositiveComebackLine(
  result: PositiveComebackResult | null | undefined,
  existingLines: readonly string[] = [],
): string | undefined {
  const candidate = result?.eceCandidate;
  if (!candidate || candidate.isFallback || candidate.visibilityLevel === 'hidden') return undefined;
  if (!isSafeText(candidate.line)) return undefined;
  if (duplicates(candidate.line, existingLines)) return undefined;
  const prefix = candidate.visibilityLevel === 'detailed' ? '' : 'Fırsat: ';
  return clampLine(`${prefix}${candidate.line}`, POSITIVE_COMEBACK_LINE_MAX);
}

export function buildPortfolioPositiveComebackSignal(
  result: PositiveComebackResult | null | undefined,
  existingLines: readonly string[] = [],
): string | undefined {
  const candidate = result?.portfolioCandidate;
  if (!candidate || candidate.isFallback || candidate.visibilityLevel === 'hidden') return undefined;
  if (!isSafeText(candidate.benefitLine)) return undefined;
  if (duplicates(candidate.benefitLine, existingLines)) return undefined;
  return clampLine(candidate.benefitLine, POSITIVE_COMEBACK_BENEFIT_LINE_MAX);
}

export function collectPositiveComebackPresentationLines(
  result: PositiveComebackResult,
): string[] {
  return result.candidates.flatMap((candidate) => [
    candidate.title,
    candidate.line,
    candidate.benefitLine,
  ]);
}
