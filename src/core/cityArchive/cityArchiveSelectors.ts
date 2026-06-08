import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import type { CityArchiveEntry, CityArchiveV1State } from './cityArchiveTypes';

export function selectRecentCityArchiveEntries(
  state: CityArchiveV1State | null | undefined,
  limit = 10,
): CityArchiveEntry[] {
  if (!state?.entries.length) return [];
  return [...state.entries]
    .filter((e) => e.isPlayerVisible)
    .sort((a, b) => b.day - a.day || b.createdAtDay - a.createdAtDay)
    .slice(0, limit);
}

export function selectDistrictArchiveEntries(
  state: CityArchiveV1State | null | undefined,
  districtId: MapDistrictId,
  limit = 5,
): CityArchiveEntry[] {
  if (!state?.entries.length) return [];
  return state.entries
    .filter((e) => e.districtId === districtId && e.isPlayerVisible)
    .sort((a, b) => b.day - a.day)
    .slice(0, limit);
}

export function selectArchiveEntryForMapJournalTrace(
  state: CityArchiveV1State | null | undefined,
  focusDistrictId?: MapDistrictId,
): CityArchiveEntry | undefined {
  const recent = selectRecentCityArchiveEntries(state, 8);
  if (focusDistrictId) {
    const districtMatch = recent.find(
      (e) => e.districtId === focusDistrictId && e.mapLine,
    );
    if (districtMatch) return districtMatch;
  }
  return recent.find((e) => e.mapLine || e.kind === 'report_milestone');
}

export function selectArchivePreviousDecisionReference(
  state: CityArchiveV1State | null | undefined,
  beforeDay?: number,
): CityArchiveEntry | undefined {
  if (!state?.entries.length) return undefined;
  return state.entries
    .filter(
      (e) =>
        e.kind === 'decision_record' &&
        (beforeDay == null || e.day < beforeDay),
    )
    .sort((a, b) => b.day - a.day)[0];
}

export function selectArchiveRewardComebackSummary(
  state: CityArchiveV1State | null | undefined,
): CityArchiveV1State['rewardComebackSummary'] | null {
  return state?.rewardComebackSummary ?? null;
}

export function selectArchiveEceRelationshipSummary(
  state: CityArchiveV1State | null | undefined,
): CityArchiveV1State['eceRelationshipSummary'] | null {
  return state?.eceRelationshipSummary ?? null;
}

export function selectPlayerVisibleArchiveEntriesForJournal(
  state: CityArchiveV1State | null | undefined,
  maxEntries: number,
  currentDay: number,
): CityArchiveEntry[] {
  if (!state?.entries.length) return [];
  return state.entries
    .filter((e) => e.isPlayerVisible && e.day <= currentDay)
    .sort((a, b) => b.day - a.day || (b.priority === 'milestone' ? 1 : 0) - (a.priority === 'milestone' ? 1 : 0))
    .slice(0, maxEntries);
}
