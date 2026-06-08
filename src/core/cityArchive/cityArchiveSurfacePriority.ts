import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import type { CityArchiveEntry, CityArchiveEntryKind, CityArchiveEntrySourceKind } from './cityArchiveTypes';

export type ArchiveSurfaceKind = 'map' | 'report' | 'hub' | 'ece' | 'city_journal';

export type ArchiveSurfaceDuplicateKeyInput = {
  surface: ArchiveSurfaceKind;
  day: number;
  districtId?: MapDistrictId | string | null;
  entryKind?: CityArchiveEntryKind | string;
  chainKind?: string | null;
  sourceKind?: CityArchiveEntrySourceKind | string;
  semanticKey?: string;
};

export const CITY_ARCHIVE_SURFACE_FORBIDDEN_TERMS = [
  'gps',
  'canlı takip',
  'canli takip',
  'gerçek vatandaş',
  'gercek vatandas',
  'resmi belediye',
  'panik',
  'felaket',
  'viral',
  'premium',
  'kilitli',
  'pack',
  'metadata',
  'runtime',
  'openai',
  ' ai ',
  'quest',
  'mission',
] as const;

export const CITY_ARCHIVE_JOURNAL_ENTRY_LABELS: Partial<Record<CityArchiveEntryKind, string>> = {
  story_chain_step: 'Operasyon zinciri',
  comeback_completed: 'Toparlanma tamamlandı',
  comeback_available: 'Toparlanma fırsatı',
  main_operation_started: 'Ana operasyon',
  district_shift: 'Mahalle değişimi',
  route_balanced: 'Rota dengesi',
  container_relief: 'Konteyner rahatladı',
  trust_recovery: 'Güven toparlandı',
  vehicle_maintenance_suggested: 'Bakım penceresi',
  vehicle_maintenance_completed: 'Araç bakım izi',
  vehicle_fatigue_warning: 'Araç bakım izi',
  fleet_recovered: 'Filo toparlandı',
};

export const MAP_JOURNAL_TRACE_PRIORITY_KINDS: readonly CityArchiveEntryKind[] = [
  'story_chain_step',
  'comeback_completed',
  'comeback_available',
  'main_operation_started',
  'district_shift',
  'trust_recovery',
  'route_balanced',
  'container_relief',
  'report_milestone',
] as const;

const SEMANTIC_CLUSTERS = [
  ['toparlanma', 'toparlan', 'recovery', 'rahatladı', 'rahatladi'],
  ['rota', 'route', 'hat'],
  ['konteyner', 'container', 'çevre', 'cevre'],
  ['güven', 'guven', 'trust', 'sosyal'],
  ['risk', 'baskı', 'baski', 'watch'],
  ['ana operasyon', 'main operation', 'kapsam'],
] as const;

export function normalizeArchiveSurfaceText(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{Letter}\p{Number}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function archiveSurfaceLineContainsForbidden(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  const lower = normalizeArchiveSurfaceText(text);
  return CITY_ARCHIVE_SURFACE_FORBIDDEN_TERMS.some((w) => lower.includes(w.trim()));
}

export function buildArchiveSurfaceDuplicateKey(input: ArchiveSurfaceDuplicateKeyInput): string {
  return [
    input.surface,
    input.day,
    input.districtId ?? 'city',
    input.entryKind ?? 'none',
    input.chainKind ?? 'none',
    input.sourceKind ?? 'none',
    input.semanticKey ?? 'none',
  ].join(':');
}

export function isArchiveSurfaceDuplicate(
  line: string | null | undefined,
  existingLines: string[] = [],
): boolean {
  if (!line?.trim()) return true;
  const normalized = normalizeArchiveSurfaceText(line);
  return existingLines.some((existing) => {
    const other = normalizeArchiveSurfaceText(existing);
    if (!other) return false;
    if (other === normalized) return true;
    if (normalized.length >= 22 && other.includes(normalized.slice(0, 22))) return true;
    if (other.length >= 22 && normalized.includes(other.slice(0, 22))) return true;
    return hasSemanticOverlap(line, existing);
  });
}

export function hasSemanticOverlap(a: string, b: string): boolean {
  const na = normalizeArchiveSurfaceText(a);
  const nb = normalizeArchiveSurfaceText(b);
  if (!na || !nb) return false;
  for (const cluster of SEMANTIC_CLUSTERS) {
    const aHit = cluster.some((w) => na.includes(w));
    const bHit = cluster.some((w) => nb.includes(w));
    if (aHit && bHit) {
      const sharedDistrict =
        na.split(' ').some((token) => token.length >= 4 && nb.includes(token));
      if (sharedDistrict || na.slice(0, 18) === nb.slice(0, 18)) return true;
    }
  }
  return false;
}

export function maxReportContinuityLinesForDay(day: number, isFullMode = false): number {
  if (day <= 1) return 0;
  if (day <= 3) return 1;
  if (isFullMode) return 3;
  return 2;
}

export function maxHubArchiveContinuityLinesForDay(day: number): number {
  if (day <= 1) return 0;
  return 1;
}

export function mapJournalTraceAllowedForDay(day: number): boolean {
  if (day <= 1) return false;
  if (day <= 3) return true;
  return true;
}

export function scoreMapJournalTraceEntry(
  entry: CityArchiveEntry,
  day: number,
  hasActiveStoryTrace: boolean,
): number {
  switch (entry.kind) {
    case 'story_chain_step': {
      const isToday = entry.day === day;
      const recent = day - entry.day <= 1;
      if (isToday || recent) return 100;
      return hasActiveStoryTrace ? 95 : 40;
    }
    case 'comeback_completed':
      return 90;
    case 'comeback_available':
      return hasActiveStoryTrace ? 0 : 80;
    case 'main_operation_started':
      return day >= 8 ? 70 : 30;
    case 'district_shift':
      return entry.priority === 'high' || entry.priority === 'milestone' ? 60 : 45;
    case 'trust_recovery':
    case 'route_balanced':
    case 'container_relief':
      return 50;
    case 'report_milestone':
      return 40;
    default:
      return entry.mapLine ? 15 : 0;
  }
}

export function archiveJournalEntryLabel(kind: CityArchiveEntryKind): string {
  return CITY_ARCHIVE_JOURNAL_ENTRY_LABELS[kind] ?? 'Şehir kaydı';
}
