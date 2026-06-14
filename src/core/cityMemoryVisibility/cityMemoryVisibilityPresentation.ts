import {
  CITY_MEMORY_VISIBILITY_ACCESSIBILITY_MAX,
  CITY_MEMORY_VISIBILITY_KIND_LABELS,
  CITY_MEMORY_VISIBILITY_LINE_MAX,
  CITY_MEMORY_VISIBILITY_MAX_TRACES,
  CITY_MEMORY_VISIBILITY_SHORT_MAX,
  CITY_MEMORY_TECHNICAL_TOKEN_PATTERN,
} from './cityMemoryVisibilityConstants';
import type {
  CityMemoryTraceCardModel,
  CityMemoryVisibilityResult,
  CityMemoryVisibilityTrace,
} from './cityMemoryVisibilityTypes';

function clampLine(value: string, max: number): string {
  const cleaned = value.replace(/\s+/g, ' ').trim().replace(CITY_MEMORY_TECHNICAL_TOKEN_PATTERN, '').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}…`;
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function isDuplicate(text: string, avoidTexts: string[]): boolean {
  const normalized = normalizeText(text);
  if (!normalized) return true;
  return avoidTexts.some((avoid) => {
    const other = normalizeText(avoid);
    return other && (other === normalized || other.includes(normalized) || normalized.includes(other));
  });
}

function badgeFor(trace: CityMemoryVisibilityTrace): string {
  if (trace.isFallback) return 'Hafiza';
  if (trace.kind.includes('story')) return 'Zincir';
  if (trace.kind.includes('map')) return 'Harita';
  if (trace.kind.includes('opportunity') || trace.tone === 'positive') return 'Firsat';
  if (trace.tone === 'cautious') return 'Dikkat';
  return CITY_MEMORY_VISIBILITY_KIND_LABELS[trace.kind] ?? 'Iz';
}

function toCard(trace: CityMemoryVisibilityTrace): CityMemoryTraceCardModel {
  const title = clampLine(trace.title, 44);
  const line = clampLine(trace.line, CITY_MEMORY_VISIBILITY_LINE_MAX);
  const shortLine = trace.shortLine ? clampLine(trace.shortLine, CITY_MEMORY_VISIBILITY_SHORT_MAX) : undefined;
  return {
    id: trace.id,
    title,
    line,
    shortLine,
    badgeLabel: badgeFor(trace),
    tone: trace.tone,
    districtName: trace.districtName,
    isActionable: trace.isActionable,
    accessibilityLabel: clampLine(`${title}. ${line}`, CITY_MEMORY_VISIBILITY_ACCESSIBILITY_MAX),
  };
}

export function buildCityMemoryTraceCardModels(
  result: CityMemoryVisibilityResult | null | undefined,
): CityMemoryTraceCardModel[] {
  if (!result) return [];
  return result.traces.slice(0, CITY_MEMORY_VISIBILITY_MAX_TRACES).map(toCard);
}

export function buildReportCityMemoryNote(
  result: CityMemoryVisibilityResult | null | undefined,
  avoidTexts: string[] = [],
): CityMemoryTraceCardModel | null {
  const trace = result?.reportTrace ?? result?.primaryTrace;
  if (!trace) return null;
  const card = toCard(trace);
  if (isDuplicate(card.line, avoidTexts)) return null;
  return card;
}

export function buildHubCityMemoryHint(
  result: CityMemoryVisibilityResult | null | undefined,
  avoidTexts: string[] = [],
): CityMemoryTraceCardModel | null {
  const trace = result?.hubTrace ?? result?.primaryTrace;
  if (!trace || trace.isFallback) return null;
  const hubLine = trace.shortLine?.trim() || trace.line;
  const card = toCard({
    ...trace,
    kind: trace.kind === 'hub_continuation_hint' ? trace.kind : 'hub_continuation_hint',
    line: hubLine,
  });
  if (isDuplicate(card.line, avoidTexts)) return null;
  return card;
}

export function buildMapCityMemoryHint(
  result: CityMemoryVisibilityResult | null | undefined,
  avoidTexts: string[] = [],
): CityMemoryTraceCardModel | null {
  const trace = result?.mapTrace;
  if (!trace) return null;
  const card = toCard(trace);
  if (isDuplicate(card.line, avoidTexts)) return null;
  return card;
}

export function buildEceCityMemoryHint(
  result: CityMemoryVisibilityResult | null | undefined,
  avoidTexts: string[] = [],
): CityMemoryTraceCardModel | null {
  const trace = result?.eceTrace;
  if (!trace) return null;
  const card = toCard(trace);
  if (isDuplicate(card.line, avoidTexts)) return null;
  return card;
}
