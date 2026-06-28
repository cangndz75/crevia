export type PresentationSurface =
  | 'result'
  | 'reportInsight'
  | 'reportReplay'
  | 'miniCityFeed'
  | 'hubCard'
  | 'advisor'
  | 'periodGoal'
  | 'maintenance'
  | 'district'
  | 'playerStyle';

export type PresentationMessageCandidate = {
  id: string;
  surface: PresentationSurface;
  title?: string;
  description?: string;
  sourceLabel?: string;
  domain?: string;
  districtName?: string;
  eventId?: string;
  tone?: string;
  priority: number;
  dedupeKey?: string;
};

export type PresentationDedupeResult<T> = {
  kept: T[];
  removed: T[];
  removedReasons: Array<{
    id: string;
    reason: string;
    duplicateOf?: string;
  }>;
};

export const PRESENTATION_NEAR_DUPLICATE_PREFIX_MIN = 18;

const PUNCTUATION_PATTERN = /[.!?,;:…]+$/g;

export const SURFACE_PRIORITY: Record<PresentationSurface, number> = {
  result: 95,
  reportInsight: 90,
  hubCard: 82,
  maintenance: 80,
  periodGoal: 78,
  district: 76,
  playerStyle: 74,
  advisor: 70,
  miniCityFeed: 62,
  reportReplay: 55,
};

export function normalizePresentationText(value: string | null | undefined): string {
  if (!value?.trim()) return '';
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(PUNCTUATION_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildCanonicalMessageKey(parts: {
  title?: string;
  description?: string;
  sourceLabel?: string;
  domain?: string;
  districtName?: string;
  eventId?: string;
  tone?: string;
  surface?: PresentationSurface;
  dedupeKey?: string;
}): string {
  const segments = [
    parts.dedupeKey,
    parts.eventId,
    parts.domain,
    parts.districtName,
    parts.sourceLabel,
    parts.surface,
    parts.tone,
    normalizePresentationText(parts.title),
    normalizePresentationText(parts.description),
  ].filter((segment): segment is string => Boolean(segment?.trim()));

  return segments.join('|');
}

export function isSameMessage(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const a = normalizePresentationText(left);
  const b = normalizePresentationText(right);
  if (!a || !b) return false;
  return a === b;
}

export function isNearDuplicateMessage(
  left: string | null | undefined,
  right: string | null | undefined,
  options: { domain?: string; requireDomainMatch?: boolean } = {},
): boolean {
  if (isSameMessage(left, right)) return true;

  const a = normalizePresentationText(left);
  const b = normalizePresentationText(right);
  if (!a || !b) return false;

  if (options.requireDomainMatch && options.domain) {
    const domain = normalizePresentationText(options.domain);
    if (!a.includes(domain) && !b.includes(domain)) return false;
  }

  const prefixLen = Math.min(
    PRESENTATION_NEAR_DUPLICATE_PREFIX_MIN,
    a.length,
    b.length,
  );
  if (prefixLen < 12) return false;

  const aPrefix = a.slice(0, prefixLen);
  const bPrefix = b.slice(0, prefixLen);
  if (aPrefix === bPrefix) return true;
  if (a.includes(bPrefix) || b.includes(aPrefix)) return true;
  return false;
}

export function lineDuplicatesAvoidLines(
  line: string | null | undefined,
  avoidLines: ReadonlyArray<string | null | undefined>,
): boolean {
  if (!line?.trim()) return true;
  return avoidLines.some((avoid) => {
    if (!avoid?.trim()) return false;
    if (isSameMessage(line, avoid)) return true;
    return isNearDuplicateMessage(line, avoid);
  });
}

export function buildAvoidLines(
  ...lineGroups: Array<string | null | undefined | ReadonlyArray<string | null | undefined>>
): string[] {
  const lines: string[] = [];
  for (const group of lineGroups) {
    if (typeof group === 'string') {
      if (group.trim()) lines.push(group.trim());
      continue;
    }
    if (group == null) continue;
    if (Array.isArray(group)) {
      for (const line of group) {
        if (line?.trim()) lines.push(line.trim());
      }
    }
  }
  return lines;
}

export function pickSurfacePriorityWinner<T extends { surface: PresentationSurface; priority: number; id: string }>(
  left: T,
  right: T,
): T {
  const leftSurface = SURFACE_PRIORITY[left.surface] + left.priority / 1000;
  const rightSurface = SURFACE_PRIORITY[right.surface] + right.priority / 1000;
  return leftSurface >= rightSurface ? left : right;
}

export function dedupePresentationMessages<T extends PresentationMessageCandidate>(
  candidates: T[],
  options: {
    avoidLines?: ReadonlyArray<string | null | undefined>;
    maxItems?: number;
    allowNearDuplicate?: boolean;
  } = {},
): PresentationDedupeResult<T> {
  const avoidLines = buildAvoidLines(options.avoidLines ?? []);
  const kept: T[] = [];
  const removed: T[] = [];
  const removedReasons: PresentationDedupeResult<T>['removedReasons'] = [];
  const seenKeys = new Set<string>();
  const seenCanonical = new Set<string>();

  const sorted = [...candidates].sort((a, b) => b.priority - a.priority);

  for (const candidate of sorted) {
    const canonical = buildCanonicalMessageKey(candidate);
    if (candidate.dedupeKey && seenKeys.has(candidate.dedupeKey)) {
      removed.push(candidate);
      removedReasons.push({ id: candidate.id, reason: 'dedupeKey', duplicateOf: candidate.dedupeKey });
      continue;
    }
    if (seenCanonical.has(canonical)) {
      removed.push(candidate);
      removedReasons.push({ id: candidate.id, reason: 'canonical', duplicateOf: canonical });
      continue;
    }

    const titleDup =
      candidate.title && lineDuplicatesAvoidLines(candidate.title, [...avoidLines, ...kept.map((k) => k.title)]);
    const descriptionDup =
      candidate.description &&
      lineDuplicatesAvoidLines(candidate.description, [
        ...avoidLines,
        ...kept.map((k) => k.description),
        ...kept.map((k) => k.title),
      ]);

    if (titleDup || descriptionDup) {
      removed.push(candidate);
      removedReasons.push({
        id: candidate.id,
        reason: titleDup ? 'title-duplicate' : 'description-duplicate',
      });
      continue;
    }

    if (options.allowNearDuplicate !== true) {
      const nearDup = kept.some(
        (existing) =>
          (candidate.domain && existing.domain === candidate.domain &&
            (isNearDuplicateMessage(candidate.title, existing.title, { domain: candidate.domain }) ||
              isNearDuplicateMessage(candidate.description, existing.description, {
                domain: candidate.domain,
              }))) ||
          isNearDuplicateMessage(candidate.title, existing.title) ||
          isNearDuplicateMessage(candidate.description, existing.description),
      );
      if (nearDup) {
        removed.push(candidate);
        removedReasons.push({ id: candidate.id, reason: 'near-duplicate' });
        continue;
      }
    }

    kept.push(candidate);
    if (candidate.dedupeKey) seenKeys.add(candidate.dedupeKey);
    seenCanonical.add(canonical);
    if (candidate.title) avoidLines.push(candidate.title);
    if (candidate.description) avoidLines.push(candidate.description);

    if (options.maxItems && kept.length >= options.maxItems) break;
  }

  return { kept, removed, removedReasons };
}

export function selectBoundedPresentationLines<T extends { line: string; priority: number; id: string }>(
  candidates: Array<T | null | undefined>,
  avoidLines: ReadonlyArray<string | null | undefined>,
  maxItems: number,
): T[] {
  const pool = candidates.filter((item): item is T => Boolean(item?.line?.trim()));
  const selected: T[] = [];
  const activeAvoid = buildAvoidLines(avoidLines);

  for (const candidate of [...pool].sort((a, b) => b.priority - a.priority)) {
    if (selected.length >= maxItems) break;
    if (lineDuplicatesAvoidLines(candidate.line, activeAvoid)) continue;
    selected.push(candidate);
    activeAvoid.push(candidate.line);
  }

  return selected;
}
