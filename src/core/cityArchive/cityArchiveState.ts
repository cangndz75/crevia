import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import {
  CITY_ARCHIVE_ENTRY_KINDS,
  CITY_ARCHIVE_ENTRY_KIND_LABELS,
  CITY_ARCHIVE_FORBIDDEN_COPY_WORDS,
  CITY_ARCHIVE_FORBIDDEN_STORED_FIELDS,
  CITY_ARCHIVE_KEEP_LAST_N_DAYS_DETAILED,
  CITY_ARCHIVE_MAX_ENTRIES,
  CITY_ARCHIVE_MAX_ENTRIES_PER_DISTRICT,
  CITY_ARCHIVE_V1_VERSION,
} from './cityArchiveConstants';
import type {
  CityArchiveEntry,
  CityArchiveEntryKind,
  CityArchiveEntrySourceKind,
  CityArchivePriority,
  CityArchiveV1State,
} from './cityArchiveTypes';

const VALID_KINDS = new Set<string>(CITY_ARCHIVE_ENTRY_KINDS);
const VALID_SOURCES = new Set<string>([
  'decisionImpact',
  'cityJournal',
  'rewardComeback',
  'districtReportCard',
  'advisorRelationship',
  'storyChain',
  'operationSignals',
  'contentPackMeta',
  'manualFallback',
]);

function cleanLine(text: string, limit = 96): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit - 1).trimEnd()}…`;
}

export function cityArchiveCopyContainsForbidden(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  const lower = text.toLocaleLowerCase('tr-TR');
  return CITY_ARCHIVE_FORBIDDEN_COPY_WORDS.some((w) => lower.includes(w));
}

function isValidPriority(val: unknown): val is CityArchivePriority {
  return val === 'low' || val === 'medium' || val === 'high' || val === 'milestone';
}

function normalizeEntry(raw: unknown, currentDay: number, warnings: string[]): CityArchiveEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const kind = r.kind;
  const sourceKind = r.sourceKind;
  if (typeof kind !== 'string' || !VALID_KINDS.has(kind)) {
    warnings.push('dropped_invalid_kind');
    return null;
  }
  if (typeof sourceKind !== 'string' || !VALID_SOURCES.has(sourceKind)) {
    warnings.push('dropped_invalid_source');
    return null;
  }
  const day = typeof r.day === 'number' ? r.day : currentDay;
  const title = cleanLine(String(r.title ?? CITY_ARCHIVE_ENTRY_KIND_LABELS[kind as CityArchiveEntryKind]));
  const shortLine = cleanLine(String(r.shortLine ?? title));
  if (!shortLine || cityArchiveCopyContainsForbidden(shortLine)) {
    warnings.push('dropped_forbidden_copy');
    return null;
  }
  for (const field of CITY_ARCHIVE_FORBIDDEN_STORED_FIELDS) {
    if (field in r && r[field] != null) {
      warnings.push(`stripped_forbidden_field:${field}`);
    }
  }
  const districtRaw = r.districtId;
  const districtId =
    typeof districtRaw === 'string'
      ? (normalizeMapDistrictId(districtRaw) ?? undefined)
      : undefined;
  const duplicateKey =
    typeof r.duplicateKey === 'string' && r.duplicateKey.trim()
      ? r.duplicateKey
      : `${day}|${kind}|${districtId ?? 'city'}|${r.eventId ?? ''}|${r.decisionId ?? ''}`;

  return {
    id: typeof r.id === 'string' ? r.id : `archive-${day}-${kind}-${duplicateKey}`,
    day,
    kind: kind as CityArchiveEntryKind,
    districtId,
    domain: typeof r.domain === 'string' ? cleanLine(r.domain, 48) : undefined,
    eventId: typeof r.eventId === 'string' ? r.eventId : undefined,
    decisionId: typeof r.decisionId === 'string' ? r.decisionId : undefined,
    sourceKind: sourceKind as CityArchiveEntrySourceKind,
    title,
    shortLine,
    reportLine: typeof r.reportLine === 'string' ? cleanLine(r.reportLine) : undefined,
    eceLine: typeof r.eceLine === 'string' ? cleanLine(r.eceLine) : undefined,
    socialLine: typeof r.socialLine === 'string' ? cleanLine(r.socialLine) : undefined,
    mapLine: typeof r.mapLine === 'string' ? cleanLine(r.mapLine) : undefined,
    trustDeltaBand:
      r.trustDeltaBand === 'down' ||
      r.trustDeltaBand === 'flat' ||
      r.trustDeltaBand === 'up' ||
      r.trustDeltaBand === 'recovered'
        ? r.trustDeltaBand
        : undefined,
    resourceImpactBand:
      r.resourceImpactBand === 'none' ||
      r.resourceImpactBand === 'low' ||
      r.resourceImpactBand === 'medium' ||
      r.resourceImpactBand === 'high'
        ? r.resourceImpactBand
        : undefined,
    isPlayerVisible: r.isPlayerVisible !== false,
    priority: isValidPriority(r.priority) ? r.priority : 'medium',
    duplicateKey,
    createdFrom: (VALID_SOURCES.has(String(r.createdFrom))
      ? r.createdFrom
      : sourceKind) as CityArchiveEntrySourceKind,
    createdAtDay: typeof r.createdAtDay === 'number' ? r.createdAtDay : day,
  };
}

export function createInitialCityArchiveState(currentDay = 1): CityArchiveV1State {
  return {
    version: CITY_ARCHIVE_V1_VERSION,
    createdAtDay: currentDay,
    updatedAtDay: currentDay,
    entries: [],
    districtSummaries: {},
    playerStyleSummary: {
      styleConfidence: 'low',
      lastUpdatedDay: currentDay,
      supportingEntryIds: [],
    },
    eceRelationshipSummary: {
      familiarityBand: 'new',
      trustedPatterns: [],
      lastUpdatedDay: currentDay,
    },
    rewardComebackSummary: {
      recentPositiveEntryIds: [],
      recentComebackEntryIds: [],
      lastUpdatedDay: currentDay,
    },
    storyChainSummary: {
      activeChainIds: [],
      unresolvedChainKinds: [],
      lastUpdatedDay: currentDay,
    },
    pruningState: {
      maxEntries: CITY_ARCHIVE_MAX_ENTRIES,
      maxEntriesPerDistrict: CITY_ARCHIVE_MAX_ENTRIES_PER_DISTRICT,
      keepLastNDaysDetailed: CITY_ARCHIVE_KEEP_LAST_N_DAYS_DETAILED,
      compactedEntryCount: 0,
    },
  };
}

export function normalizeCityArchiveState(
  input: unknown,
  currentDay = 1,
): CityArchiveV1State {
  const warnings: string[] = [];
  if (!input || typeof input !== 'object') {
    return createInitialCityArchiveState(currentDay);
  }
  const raw = input as Record<string, unknown>;
  if (raw.version !== CITY_ARCHIVE_V1_VERSION) {
    warnings.push('reset_invalid_version');
    const fresh = createInitialCityArchiveState(currentDay);
    fresh.migrationMeta = {
      migratedFromSaveVersion: 0,
      migratedAtDay: currentDay,
      backfillStrategy: 'corrupt_reset',
      backfillEntryCount: 0,
      warnings,
    };
    return fresh;
  }

  const entries: CityArchiveEntry[] = [];
  if (Array.isArray(raw.entries)) {
    for (const item of raw.entries) {
      const normalized = normalizeEntry(item, currentDay, warnings);
      if (normalized) entries.push(normalized);
    }
  } else {
    warnings.push('entries_array_missing');
  }

  const base = createInitialCityArchiveState(currentDay);
  const createdAtDay =
    typeof raw.createdAtDay === 'number' ? raw.createdAtDay : currentDay;
  const updatedAtDay =
    typeof raw.updatedAtDay === 'number' ? raw.updatedAtDay : currentDay;

  const migrationMeta =
    raw.migrationMeta && typeof raw.migrationMeta === 'object'
      ? {
          migratedFromSaveVersion:
            Number((raw.migrationMeta as Record<string, unknown>).migratedFromSaveVersion) || 23,
          migratedAtDay:
            Number((raw.migrationMeta as Record<string, unknown>).migratedAtDay) || currentDay,
          backfillStrategy: String(
            (raw.migrationMeta as Record<string, unknown>).backfillStrategy ?? 'normalize',
          ),
          backfillEntryCount:
            Number((raw.migrationMeta as Record<string, unknown>).backfillEntryCount) || 0,
          warnings: [
            ...warnings,
            ...(((raw.migrationMeta as Record<string, unknown>).warnings as string[]) ?? []),
          ],
        }
      : warnings.length > 0
        ? {
            migratedFromSaveVersion: 24,
            migratedAtDay: currentDay,
            backfillStrategy: 'normalize_warnings',
            backfillEntryCount: 0,
            warnings,
          }
        : undefined;

  return {
    ...base,
    createdAtDay,
    updatedAtDay,
    entries,
    districtSummaries: isRecord(raw.districtSummaries)
      ? (raw.districtSummaries as CityArchiveV1State['districtSummaries'])
      : {},
    playerStyleSummary: isRecord(raw.playerStyleSummary)
      ? { ...base.playerStyleSummary, ...(raw.playerStyleSummary as object) }
      : base.playerStyleSummary,
    eceRelationshipSummary: isRecord(raw.eceRelationshipSummary)
      ? { ...base.eceRelationshipSummary, ...(raw.eceRelationshipSummary as object) }
      : base.eceRelationshipSummary,
    rewardComebackSummary: isRecord(raw.rewardComebackSummary)
      ? { ...base.rewardComebackSummary, ...(raw.rewardComebackSummary as object) }
      : base.rewardComebackSummary,
    storyChainSummary: isRecord(raw.storyChainSummary)
      ? { ...base.storyChainSummary, ...(raw.storyChainSummary as object) }
      : base.storyChainSummary,
    pruningState: isRecord(raw.pruningState)
      ? {
          ...base.pruningState,
          ...(raw.pruningState as object),
          maxEntries: CITY_ARCHIVE_MAX_ENTRIES,
          maxEntriesPerDistrict: CITY_ARCHIVE_MAX_ENTRIES_PER_DISTRICT,
          keepLastNDaysDetailed: CITY_ARCHIVE_KEEP_LAST_N_DAYS_DETAILED,
        }
      : base.pruningState,
    migrationMeta,
  };
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}
