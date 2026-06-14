import {
  CITY_RHYTHM_DIRECTOR_ACCESSIBILITY_MAX,
  CITY_RHYTHM_DIRECTOR_LINE_MAX,
  CITY_RHYTHM_DIRECTOR_MAX_PRESENTATION_SLOTS,
  CITY_RHYTHM_INTENSITY_LABELS,
  CITY_RHYTHM_KIND_BADGES,
} from './cityRhythmDirectorConstants';
import { collectCityRhythmDirectorLines } from './cityRhythmDirectorModel';
import type { CityRhythmCardModel, CityRhythmDirectorResult } from './cityRhythmDirectorTypes';

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

function toCardModel(result: CityRhythmDirectorResult): CityRhythmCardModel | null {
  if (!result.isVisible) return null;
  const line = clampLine(result.summaryLine, CITY_RHYTHM_DIRECTOR_LINE_MAX);
  if (!isSafeText(`${result.title} ${line}`)) return null;
  return {
    id: `card_rhythm_${result.day}`,
    title: result.title,
    line,
    badgeLabel: CITY_RHYTHM_KIND_BADGES[result.rhythmKind],
    intensityLabel: CITY_RHYTHM_INTENSITY_LABELS[result.intensity],
    tone: result.tone,
    visibilityLevel: result.intensity === 'low' ? 'summary' : 'summary',
    accessibilityLabel: clampLine(
      `${result.title}. ${CITY_RHYTHM_INTENSITY_LABELS[result.intensity]}. ${line}.`,
      CITY_RHYTHM_DIRECTOR_ACCESSIBILITY_MAX,
    ),
  };
}

export function buildCityRhythmCardModels(
  result: CityRhythmDirectorResult | null | undefined,
  existingLines: readonly string[] = [],
): CityRhythmCardModel[] {
  if (!result?.isVisible || result.day < 8) return [];
  const cards: CityRhythmCardModel[] = [];
  for (const slot of result.slots) {
    if (slot.isFallback || slot.visibilityLevel === 'hidden') continue;
    if (duplicates(slot.line, existingLines)) continue;
    const card: CityRhythmCardModel = {
      id: `card_${slot.id}`,
      title: slot.title,
      line: clampLine(slot.line, CITY_RHYTHM_DIRECTOR_LINE_MAX),
      badgeLabel: CITY_RHYTHM_KIND_BADGES[result.rhythmKind],
      intensityLabel: CITY_RHYTHM_INTENSITY_LABELS[result.intensity],
      tone: slot.tone,
      visibilityLevel: slot.visibilityLevel,
      accessibilityLabel: clampLine(
        `${slot.title}. ${slot.line}.`,
        CITY_RHYTHM_DIRECTOR_ACCESSIBILITY_MAX,
      ),
    };
    if (!isSafeText(`${card.title} ${card.line}`)) continue;
    cards.push(card);
    if (cards.length >= CITY_RHYTHM_DIRECTOR_MAX_PRESENTATION_SLOTS) break;
  }
  if (cards.length === 0) {
    const primary = toCardModel(result);
    if (primary && !duplicates(primary.line, existingLines)) cards.push(primary);
  }
  return cards;
}

export function buildPrimaryCityRhythmCard(
  result: CityRhythmDirectorResult | null | undefined,
  existingLines: readonly string[] = [],
): CityRhythmCardModel | null {
  if (!result?.isVisible || result.day < 8) return null;
  const slot = result.primarySlot;
  if (!slot || slot.isFallback) {
    const card = toCardModel(result);
    if (!card || duplicates(card.line, existingLines)) return null;
    return card;
  }
  if (duplicates(slot.line, existingLines)) return null;
  return {
    id: `card_${slot.id}`,
    title: result.title,
    line: clampLine(slot.line, CITY_RHYTHM_DIRECTOR_LINE_MAX),
    badgeLabel: CITY_RHYTHM_KIND_BADGES[result.rhythmKind],
    intensityLabel: CITY_RHYTHM_INTENSITY_LABELS[result.intensity],
    tone: result.tone,
    visibilityLevel: slot.visibilityLevel,
    accessibilityLabel: clampLine(
      `${result.title}. ${slot.line}.`,
      CITY_RHYTHM_DIRECTOR_ACCESSIBILITY_MAX,
    ),
  };
}

export function buildHubCityRhythmHint(
  result: CityRhythmDirectorResult | null | undefined,
  existingLines: readonly string[] = [],
): string | null {
  const slot = result?.hubSlot;
  if (!result?.isVisible || !slot || slot.isFallback || (result.day ?? 1) < 8) return null;
  if (duplicates(slot.line, existingLines)) return null;
  if (!isSafeText(slot.line)) return null;
  return clampLine(slot.line, CITY_RHYTHM_DIRECTOR_LINE_MAX);
}

export function buildReportCityRhythmNote(
  result: CityRhythmDirectorResult | null | undefined,
  existingLines: readonly string[] = [],
): string | null {
  const slot = result?.reportSlot;
  if (!result?.isVisible || !slot || slot.isFallback || (result.day ?? 1) < 8) return null;
  if (duplicates(slot.line, existingLines)) return null;
  if (!isSafeText(slot.line)) return null;
  return clampLine(slot.line, CITY_RHYTHM_DIRECTOR_LINE_MAX);
}

export function buildEceCityRhythmLine(
  result: CityRhythmDirectorResult | null | undefined,
  existingLines: readonly string[] = [],
): string | null {
  const slot = result?.eceSlot;
  if (!result?.isVisible || !slot || slot.isFallback || result.intensity === 'low' || (result.day ?? 1) < 8) {
    return null;
  }
  if (duplicates(slot.line, existingLines)) return null;
  if (!isSafeText(slot.line)) return null;
  return clampLine(slot.line, CITY_RHYTHM_DIRECTOR_LINE_MAX);
}

export function buildPortfolioCityRhythmSignal(
  result: CityRhythmDirectorResult | null | undefined,
  existingLines: readonly string[] = [],
): string | null {
  const slot = result?.portfolioSlot;
  if (!result?.isVisible || !slot || slot.isFallback || (result.day ?? 1) < 8) return null;
  if (duplicates(slot.line, existingLines)) return null;
  if (!isSafeText(slot.line)) return null;
  return clampLine(slot.line, CITY_RHYTHM_DIRECTOR_LINE_MAX);
}

export function collectCityRhythmDirectorPresentationLines(
  result: CityRhythmDirectorResult,
): string[] {
  return collectCityRhythmDirectorLines(result);
}
