import type {
  ContentVarietySurface,
  CopyQualityIssue,
  SelectDeterministicCopyVariantInput,
} from './contentVarietyQualityTypes';

export const TECHNICAL_ENUM_PATTERN = /\b[a-z]+_[a-z_]+\b/;

export const SHAME_LANGUAGE_PATTERNS = [
  /hep\s+yanl[iı]ş/i,
  /s[uü]rekli\s+hata/i,
  /ba[sş]ar[iı]s[iı]z/i,
  /k[oö]t[uü]\s+karar/i,
  /yine\s+hata/i,
  /asla\s+do[gğ]ru/i,
];

export const ACCUSATORY_DOMINANT_PATTERNS = [
  /hep\s+yanl[iı]ş/i,
  /s[uü]rekli\s+hata/i,
  /yanl[iı]ş\s+yap/i,
  /ba[sş]ar[iı]s[iı]z/i,
];

export const PRESENTATION_ONLY_SELECTED_PATTERN = /\bse[cç]ildi\b/i;

export const SURFACE_MAX_LENGTH: Record<ContentVarietySurface, number> = {
  hub: 96,
  report: 120,
  ece: 120,
  operation_feed: 110,
  portfolio: 110,
  map: 72,
  city_rhythm: 110,
  dominant_strategy: 120,
  follow_up_execution: 110,
  resource_pressure: 120,
  fallback: 120,
};

function stableHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function normalizeCopyForDuplicateCheck(line: string): string {
  return line
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.!?…]+$/g, '');
}

export function buildCopyVariantKey(
  kind: string,
  surface: ContentVarietySurface,
  districtId?: string,
  day?: number,
  duplicateKey?: string,
): string {
  return [kind, surface, districtId ?? '', String(day ?? 0), duplicateKey ?? ''].join('|');
}

export function selectDeterministicCopyVariant(
  input: SelectDeterministicCopyVariantInput,
): string {
  const variants = input.variants.filter((line) => line.trim().length > 0);
  if (variants.length === 0) return '';
  const key = buildCopyVariantKey(
    input.kind,
    input.surface,
    input.districtId,
    input.day,
    input.duplicateKey ?? input.sourceIds?.[0],
  );
  const blocked = new Set(
    (input.previousLineHashes ?? []).map((hash) => hash.toLowerCase()),
  );
  const start = stableHash(key) % variants.length;
  for (let offset = 0; offset < variants.length; offset += 1) {
    const candidate = variants[(start + offset) % variants.length]!;
    const normalized = normalizeCopyForDuplicateCheck(candidate);
    if (blocked.has(normalized)) continue;
    return candidate;
  }
  return variants[start] ?? variants[0]!;
}

export function pickSurfaceCopy(
  kind: string,
  surface: ContentVarietySurface,
  variants: readonly string[],
  options: {
    day?: number;
    districtId?: string;
    sourceIds?: readonly string[];
    seed?: number;
    previousLines?: readonly string[];
    duplicateKey?: string;
  } = {},
): string {
  const seedKey = options.seed ?? options.day ?? 0;
  return selectDeterministicCopyVariant({
    kind,
    surface,
    day: seedKey,
    districtId: options.districtId,
    sourceIds: options.sourceIds,
    duplicateKey: options.duplicateKey,
    previousLineHashes: (options.previousLines ?? []).map(normalizeCopyForDuplicateCheck),
    variants,
  });
}

export function detectTechnicalEnumLeak(line: string): boolean {
  return TECHNICAL_ENUM_PATTERN.test(line);
}

export function detectTooLongMobileCopy(line: string, maxLength: number): boolean {
  return line.trim().length > maxLength;
}

export function detectShameLanguage(line: string): boolean {
  return SHAME_LANGUAGE_PATTERNS.some((pattern) => pattern.test(line));
}

export function detectAccusatoryDominantLanguage(line: string): boolean {
  return ACCUSATORY_DOMINANT_PATTERNS.some((pattern) => pattern.test(line));
}

export function detectPresentationOnlySelectedLanguage(line: string): boolean {
  return PRESENTATION_ONLY_SELECTED_PATTERN.test(line);
}

export function detectRepeatedPhrases(lines: readonly string[]): string[] {
  const counts = new Map<string, number>();
  for (const line of lines) {
    const normalized = normalizeCopyForDuplicateCheck(line);
    if (!normalized) continue;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([phrase]) => phrase);
}

export function detectRepeatedOpeningPhrases(lines: readonly string[]): string[] {
  const openings = new Map<string, number>();
  for (const line of lines) {
    const opening = normalizeCopyForDuplicateCheck(line).split(' ').slice(0, 4).join(' ');
    if (!opening) continue;
    openings.set(opening, (openings.get(opening) ?? 0) + 1);
  }
  return [...openings.entries()]
    .filter(([, count]) => count > 3)
    .map(([opening]) => opening);
}

export function mergeCopyPools<T extends string>(
  base: Record<T, readonly string[]>,
  expansion: Partial<Record<T, readonly string[]>>,
): Record<T, string[]> {
  const merged = { ...base } as Record<T, string[]>;
  for (const key of Object.keys(expansion) as T[]) {
    const extra = expansion[key];
    if (!extra?.length) continue;
    merged[key] = [...(merged[key] ?? []), ...extra];
  }
  return merged;
}

export function auditCopyLines(
  lines: readonly string[],
  options: {
    module: string;
    kind: string;
    surface: ContentVarietySurface;
    allowSharedFallback?: boolean;
  },
): CopyQualityIssue[] {
  const issues: CopyQualityIssue[] = [];
  const max = SURFACE_MAX_LENGTH[options.surface];
  for (const line of lines) {
    if (detectTechnicalEnumLeak(line)) {
      issues.push({
        line,
        reason: 'technical enum leak',
        severity: 'fail',
        module: options.module,
        kind: options.kind,
        surface: options.surface,
      });
    }
    if (detectTooLongMobileCopy(line, Math.max(max, 130))) {
      issues.push({
        line,
        reason: `line exceeds ${Math.max(max, 130)} chars`,
        severity: 'fail',
        module: options.module,
        kind: options.kind,
        surface: options.surface,
      });
    } else if (detectTooLongMobileCopy(line, max)) {
      issues.push({
        line,
        reason: `line exceeds surface max ${max}`,
        severity: 'warn',
        module: options.module,
        kind: options.kind,
        surface: options.surface,
      });
    }
    if (options.surface === 'ece' && detectShameLanguage(line)) {
      issues.push({
        line,
        reason: 'ece shame language',
        severity: 'fail',
        module: options.module,
        kind: options.kind,
        surface: options.surface,
      });
    }
    if (options.surface === 'dominant_strategy' && detectAccusatoryDominantLanguage(line)) {
      issues.push({
        line,
        reason: 'dominant strategy accusatory language',
        severity: 'fail',
        module: options.module,
        kind: options.kind,
        surface: options.surface,
      });
    }
    if (
      options.surface === 'operation_feed' &&
      detectPresentationOnlySelectedLanguage(line)
    ) {
      issues.push({
        line,
        reason: 'presentation-only selected language',
        severity: 'fail',
        module: options.module,
        kind: options.kind,
        surface: options.surface,
      });
    }
  }
  return issues;
}
