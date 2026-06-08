import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import { extractPersistentStoryChainState } from '@/core/storyChains/storyChainPersistentEngine';

import {
  mapJournalTraceAllowedForDay,
  scoreMapJournalTraceEntry,
} from './cityArchiveSurfacePriority';
import { normalizeCityArchiveState } from './cityArchiveState';
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

function hasActiveStoryTrace(archive: CityArchiveV1State, day: number): boolean {
  const chainState = extractPersistentStoryChainState(archive);
  return chainState.activeChains.some(
    (c) => c.status === 'active' || c.status === 'waiting' || c.lastAdvancedDay === day,
  );
}

export function selectArchiveEntryForMapJournalTracePriority(
  state: CityArchiveV1State | null | undefined,
  day: number,
  focusDistrictId?: MapDistrictId,
): CityArchiveEntry | undefined {
  if (!mapJournalTraceAllowedForDay(day) || !state?.entries.length) return undefined;

  const archive = normalizeCityArchiveState(state, day);
  const activeStory = hasActiveStoryTrace(archive, day);
  const recent = selectRecentCityArchiveEntries(archive, 12).filter((e) => e.isPlayerVisible);

  const candidates = recent
    .map((entry) => ({
      entry,
      score: scoreMapJournalTraceEntry(entry, day, activeStory),
      districtBoost: focusDistrictId && entry.districtId === focusDistrictId ? 8 : 0,
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score + b.districtBoost - (a.score + a.districtBoost));

  if (day <= 3) {
    const top = candidates[0];
    if (!top || top.score < 50) return undefined;
    return top.entry;
  }

  return candidates[0]?.entry;
}

export function selectArchiveEntryForMapJournalTrace(
  state: CityArchiveV1State | null | undefined,
  focusDistrictId?: MapDistrictId,
  day = state?.updatedAtDay ?? 1,
): CityArchiveEntry | undefined {
  return selectArchiveEntryForMapJournalTracePriority(state, day, focusDistrictId);
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
