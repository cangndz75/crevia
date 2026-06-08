import { selectArchiveEntryForMapJournalTrace } from '@/core/cityArchive/cityArchiveSelectors';
import type { CityArchiveV1State } from '@/core/cityArchive/cityArchiveTypes';
import { softenRepeatedWatchNoteCopy } from '@/core/releaseCandidatePolish/polishCopyPresentation';

import { STORY_CHAIN_PERSISTENT_FORBIDDEN_TERMS } from './storyChainPersistentConstants';
import { extractPersistentStoryChainState } from './storyChainPersistentEngine';
import type { PersistentStoryChainSurfaceLines } from './storyChainPersistentTypes';

function normalize(text: string): string {
  return text.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

export function storyChainPersistentLineContainsForbidden(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  const lower = normalize(text);
  return STORY_CHAIN_PERSISTENT_FORBIDDEN_TERMS.some((w) => lower.includes(w));
}

export function isStoryChainPersistentDuplicate(
  line: string | null | undefined,
  existingLines: string[] = [],
): boolean {
  if (!line?.trim()) return true;
  const normalized = normalize(line);
  return existingLines.some((existing) => {
    const other = normalize(existing);
    if (!other) return false;
    if (other === normalized) return true;
    if (normalized.length >= 22 && other.includes(normalized.slice(0, 22))) return true;
    if (other.length >= 22 && normalized.includes(other.slice(0, 22))) return true;
    return false;
  });
}

function pickPrimaryChain(archive: CityArchiveV1State | null | undefined) {
  const state = extractPersistentStoryChainState(archive);
  return (
    state.activeChains.find((c) => c.status === 'active' || c.status === 'waiting') ??
    state.activeChains[0]
  );
}

export function buildPersistentStoryChainSurfaceLines(
  archive: CityArchiveV1State | null | undefined,
  day: number,
  existingLines: string[] = [],
): PersistentStoryChainSurfaceLines {
  if (day <= 1) return {};
  const chain = pickPrimaryChain(archive);
  if (!chain) return {};

  const result: PersistentStoryChainSurfaceLines = {};

  const hub = chain.hubLine ?? chain.playerVisibleLine;
  if (hub && !isStoryChainPersistentDuplicate(hub, existingLines) && !storyChainPersistentLineContainsForbidden(hub)) {
    result.hubLine = softenRepeatedWatchNoteCopy(hub, day);
  }

  const report = chain.reportLine ?? chain.playerVisibleLine;
  if (
    day >= 4 &&
    report &&
    !isStoryChainPersistentDuplicate(report, [...existingLines, result.hubLine ?? '']) &&
    !storyChainPersistentLineContainsForbidden(report)
  ) {
    result.reportLine = softenRepeatedWatchNoteCopy(report, day);
  }

  const ece = chain.eceLine;
  if (
    day >= 3 &&
    ece &&
    !isStoryChainPersistentDuplicate(ece, [...existingLines, result.hubLine ?? '', result.reportLine ?? '']) &&
    !storyChainPersistentLineContainsForbidden(ece)
  ) {
    result.eceLine = softenRepeatedWatchNoteCopy(ece, day);
  }

  const mapEntry = selectArchiveEntryForMapJournalTrace(
    archive ?? undefined,
    chain.districtId,
    day,
  );
  const map = mapEntry?.mapLine ?? chain.mapLine ?? mapEntry?.shortLine;
  if (
    map &&
    !isStoryChainPersistentDuplicate(map, [...existingLines, result.hubLine ?? '', result.reportLine ?? '']) &&
    !storyChainPersistentLineContainsForbidden(map)
  ) {
    result.mapLine = softenRepeatedWatchNoteCopy(map, day);
  }

  return result;
}

export function buildPersistentStoryChainHubLine(
  archive: CityArchiveV1State | null | undefined,
  day: number,
  existingLines: string[] = [],
): string | null {
  return buildPersistentStoryChainSurfaceLines(archive, day, existingLines).hubLine ?? null;
}

export function buildPersistentStoryChainReportLine(
  archive: CityArchiveV1State | null | undefined,
  day: number,
  existingLines: string[] = [],
): string | null {
  return buildPersistentStoryChainSurfaceLines(archive, day, existingLines).reportLine ?? null;
}

export function buildPersistentStoryChainEceHint(
  archive: CityArchiveV1State | null | undefined,
  day: number,
  existingLines: string[] = [],
): string | null {
  return buildPersistentStoryChainSurfaceLines(archive, day, existingLines).eceLine ?? null;
}

export function buildPersistentStoryChainMapHint(
  archive: CityArchiveV1State | null | undefined,
  day: number,
  existingLines: string[] = [],
): string | null {
  return buildPersistentStoryChainSurfaceLines(archive, day, existingLines).mapLine ?? null;
}
