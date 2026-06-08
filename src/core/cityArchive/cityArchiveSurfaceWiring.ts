import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';
import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import {
  buildPersistentStoryChainEceHint,
  buildPersistentStoryChainHubLine,
  buildPersistentStoryChainReportLine,
} from '@/core/storyChains/storyChainPersistentPresentation';

import { selectArchiveEntryForMapJournalTracePriority } from './cityArchiveSelectors';
import {
  archiveJournalEntryLabel,
  archiveSurfaceLineContainsForbidden,
  buildArchiveSurfaceDuplicateKey,
  hasSemanticOverlap,
  isArchiveSurfaceDuplicate,
  mapJournalTraceAllowedForDay,
  maxHubArchiveContinuityLinesForDay,
  maxReportContinuityLinesForDay,
  normalizeArchiveSurfaceText,
} from './cityArchiveSurfacePriority';
import type { CityArchiveEntry, CityArchiveV1State } from './cityArchiveTypes';
import { normalizeCityArchiveState } from './cityArchiveState';

export type MapArchiveJournalTracePresentation = {
  line: string | null;
  visible: boolean;
  entry?: CityArchiveEntry;
  duplicateKey?: string;
};

export type ReportArchiveContinuityModel = {
  selectedArchiveLine?: string;
  storyChainLine?: string;
  districtLine?: string;
  positiveLine?: string;
  cityJournalLine?: string;
  mainOperationLine?: string;
  suppressedLines: string[];
  visibleLines: string[];
  maxVisibleContinuityLines: number;
  duplicateKeys: string[];
  sourceSignals: {
    hasStoryChain: boolean;
    hasReward: boolean;
    hasDistrict: boolean;
    hasCityJournal: boolean;
    hasMainOperation: boolean;
  };
};

export type HubArchiveContinuityModel = {
  continuityLine?: string;
  continuityKind?: 'story' | 'reward' | 'district' | 'city_memory';
  suppressedLines: string[];
  duplicateKeys: string[];
  maxLines: number;
};

export type EceArchiveHintModel = {
  supportingLine?: string;
  sourceKind?: 'story_chain' | 'advisor_relationship' | 'reward_comeback' | 'district' | 'city_echo';
  suppressedLines: string[];
};

export type ReportArchiveContinuityInput = {
  day: number;
  cityArchive?: CityArchiveV1State | null;
  isFullMode?: boolean;
  storyChainLine?: string | null;
  rewardComebackLine?: string | null;
  districtReportLine?: string | null;
  cityJournalLine?: string | null;
  mainOperationLine?: string | null;
  existingLines?: string[];
};

export type HubArchiveContinuityInput = {
  day: number;
  cityArchive?: CityArchiveV1State | null;
  storyChainLine?: string | null;
  rewardComebackLine?: string | null;
  districtReportLine?: string | null;
  cityJournalLine?: string | null;
  advisorSupportingLine?: string | null;
  existingLines?: string[];
};

export type EceArchiveHintInput = {
  day: number;
  cityArchive?: CityArchiveV1State | null;
  storyChainEceHint?: string | null;
  advisorRelationshipSupportingLine?: string | null;
  advisorRelationshipMainLine?: string | null;
  rewardComebackEceLine?: string | null;
  districtEceLine?: string | null;
  cityEchoAdvisorLine?: string | null;
  existingLines?: string[];
};

function districtName(id?: MapDistrictId): string {
  if (!id) return 'Mahalle';
  return DISTRICT_IDENTITIES[id]?.name ?? id;
}

function cleanLine(text: string, limit = 96): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit - 1).trimEnd()}…`;
}

function storyChainTouchedToday(archive: CityArchiveV1State | null | undefined, day: number): boolean {
  if (!archive) return false;
  if (archive.storyChainSummary?.lastUpdatedDay === day) return true;
  return archive.entries.some((e) => e.kind === 'story_chain_step' && e.day === day);
}

export function filterArchiveEntriesForJournalDisplay(
  entries: CityArchiveEntry[],
  maxEntries: number,
): CityArchiveEntry[] {
  const seenDayDistrict = new Set<string>();
  const result: CityArchiveEntry[] = [];

  for (const entry of entries) {
    const key = `${entry.day}:${entry.districtId ?? 'city'}:${entry.kind}`;
    const districtDayKey = `${entry.day}:${entry.districtId ?? 'city'}`;
    const sameDayDistrictCount = result.filter(
      (e) => `${e.day}:${e.districtId ?? 'city'}` === districtDayKey,
    ).length;
    if (sameDayDistrictCount >= 2 && entry.kind !== 'story_chain_step') continue;
    if (seenDayDistrict.has(key)) continue;

    const duplicateStory = result.some(
      (e) =>
        e.kind === 'story_chain_step' &&
        entry.kind === 'comeback_completed' &&
        e.day === entry.day &&
        e.districtId === entry.districtId &&
        hasSemanticOverlap(e.shortLine, entry.shortLine),
    );
    if (duplicateStory) continue;

    seenDayDistrict.add(key);
    result.push(entry);
    if (result.length >= maxEntries) break;
  }

  return result;
}

export function buildMapArchiveJournalTracePresentation(
  archive: CityArchiveV1State | null | undefined,
  day: number,
  focusDistrictId?: MapDistrictId | string | null,
  existingLines: string[] = [],
  districtReportMapLine?: string | null,
): MapArchiveJournalTracePresentation {
  if (!mapJournalTraceAllowedForDay(day)) {
    return { line: null, visible: false };
  }

  const districtId = normalizeMapDistrictId(focusDistrictId) ?? undefined;
  const entry = selectArchiveEntryForMapJournalTracePriority(archive, day, districtId);
  if (!entry) return { line: null, visible: false };

  const raw =
    entry.mapLine ??
    entry.shortLine ??
    entry.reportLine ??
    '';
  if (!raw.trim() || archiveSurfaceLineContainsForbidden(raw)) {
    return { line: null, visible: false };
  }

  let line = cleanLine(raw);
  if (entry.kind === 'story_chain_step') {
    line = line.startsWith('Devam eden iz')
      ? line
      : cleanLine(`Devam eden iz: ${line.replace(/^Operasyon zinciri:\s*/i, '')}`);
  } else if (entry.kind === 'main_operation_started') {
    line = cleanLine(
      line.startsWith('Operasyon izi')
        ? line
        : `Operasyon izi: ${line.replace(/^Gün\s+\d+:\s*/i, '')}`,
    );
  } else if (!line.startsWith('Günlük izi') && !line.startsWith('Devam eden iz')) {
    const name = districtName(entry.districtId);
    line = cleanLine(`Günlük izi: ${name} — ${line.replace(/^Gün\s+\d+:\s*/i, '')}`);
  }

  if (districtReportMapLine && hasSemanticOverlap(line, districtReportMapLine)) {
    return { line: null, visible: false };
  }
  if (isArchiveSurfaceDuplicate(line, existingLines)) {
    return { line: null, visible: false };
  }

  const duplicateKey = buildArchiveSurfaceDuplicateKey({
    surface: 'map',
    day,
    districtId: entry.districtId,
    entryKind: entry.kind,
    chainKind: entry.domain,
    sourceKind: entry.sourceKind,
    semanticKey: entry.duplicateKey,
  });

  return { line, visible: true, entry, duplicateKey };
}

export function buildReportArchiveContinuityModel(
  input: ReportArchiveContinuityInput,
): ReportArchiveContinuityModel {
  const day = input.day;
  const guard = [...(input.existingLines ?? [])];
  const maxVisibleContinuityLines = maxReportContinuityLinesForDay(day, input.isFullMode);
  const suppressedLines: string[] = [];
  const duplicateKeys: string[] = [];
  const archive = input.cityArchive ? normalizeCityArchiveState(input.cityArchive, day) : null;
  const storyToday = storyChainTouchedToday(archive, day);

  const storyChainLine =
    input.storyChainLine &&
    storyToday &&
    !isArchiveSurfaceDuplicate(input.storyChainLine, guard) &&
    !archiveSurfaceLineContainsForbidden(input.storyChainLine)
      ? input.storyChainLine
      : undefined;

  const positiveLine =
    !storyChainLine &&
    input.rewardComebackLine &&
    !isArchiveSurfaceDuplicate(input.rewardComebackLine, guard) &&
    !archiveSurfaceLineContainsForbidden(input.rewardComebackLine)
      ? input.rewardComebackLine
      : undefined;

  const districtLine =
    !storyChainLine &&
    !positiveLine &&
    input.districtReportLine &&
    !isArchiveSurfaceDuplicate(input.districtReportLine, guard) &&
    !archiveSurfaceLineContainsForbidden(input.districtReportLine)
      ? input.districtReportLine
      : undefined;

  const cityJournalLine =
    !storyChainLine &&
    !positiveLine &&
    !districtLine &&
    input.cityJournalLine &&
    !isArchiveSurfaceDuplicate(input.cityJournalLine, guard) &&
    !archiveSurfaceLineContainsForbidden(input.cityJournalLine)
      ? input.cityJournalLine
      : undefined;

  const mainOperationLine =
    !storyChainLine &&
    !positiveLine &&
    !districtLine &&
    !cityJournalLine &&
    day >= POST_PILOT_FIRST_OPERATION_DAY &&
    input.mainOperationLine &&
    !isArchiveSurfaceDuplicate(input.mainOperationLine, guard) &&
    !archiveSurfaceLineContainsForbidden(input.mainOperationLine)
      ? input.mainOperationLine
      : undefined;

  if (input.storyChainLine && !storyChainLine) suppressedLines.push(input.storyChainLine);
  if (input.rewardComebackLine && !positiveLine) suppressedLines.push(input.rewardComebackLine);
  if (input.districtReportLine && !districtLine) suppressedLines.push(input.districtReportLine);
  if (input.cityJournalLine && !cityJournalLine) suppressedLines.push(input.cityJournalLine);

  const candidates = [
    storyChainLine,
    positiveLine,
    districtLine,
    cityJournalLine,
    mainOperationLine,
  ].filter((line): line is string => Boolean(line));

  const visibleLines = candidates.slice(0, maxVisibleContinuityLines);
  for (const line of visibleLines) {
    duplicateKeys.push(
      buildArchiveSurfaceDuplicateKey({
        surface: 'report',
        day,
        semanticKey: normalizeArchiveSurfaceText(line).slice(0, 24),
      }),
    );
  }

  return {
    selectedArchiveLine: visibleLines[0],
    storyChainLine,
    districtLine,
    positiveLine,
    cityJournalLine,
    mainOperationLine,
    suppressedLines,
    visibleLines,
    maxVisibleContinuityLines,
    duplicateKeys,
    sourceSignals: {
      hasStoryChain: Boolean(storyChainLine),
      hasReward: Boolean(positiveLine),
      hasDistrict: Boolean(districtLine),
      hasCityJournal: Boolean(cityJournalLine),
      hasMainOperation: Boolean(mainOperationLine),
    },
  };
}

export function buildHubArchiveContinuityModel(
  input: HubArchiveContinuityInput,
): HubArchiveContinuityModel {
  const day = input.day;
  const maxLines = maxHubArchiveContinuityLinesForDay(day);
  if (maxLines <= 0) {
    return { suppressedLines: [], duplicateKeys: [], maxLines: 0 };
  }

  const guard = [...(input.existingLines ?? []), input.cityJournalLine ?? '', input.advisorSupportingLine ?? ''].filter(
    Boolean,
  );
  const suppressedLines: string[] = [];
  const duplicateKeys: string[] = [];
  const archive = input.cityArchive ? normalizeCityArchiveState(input.cityArchive, day) : null;

  const storyResolved =
    input.storyChainLine ??
    buildPersistentStoryChainHubLine(archive, day, guard);
  if (
    storyResolved &&
    !isArchiveSurfaceDuplicate(storyResolved, guard) &&
    !archiveSurfaceLineContainsForbidden(storyResolved)
  ) {
    duplicateKeys.push(
      buildArchiveSurfaceDuplicateKey({ surface: 'hub', day, entryKind: 'story_chain_step' }),
    );
    return {
      continuityLine: storyResolved,
      continuityKind: 'story',
      suppressedLines: [input.rewardComebackLine, input.districtReportLine].filter(
        (l): l is string => Boolean(l),
      ),
      duplicateKeys,
      maxLines,
    };
  }
  if (input.storyChainLine) suppressedLines.push(input.storyChainLine);

  if (
    input.rewardComebackLine &&
    day >= 4 &&
    !isArchiveSurfaceDuplicate(input.rewardComebackLine, guard) &&
    !archiveSurfaceLineContainsForbidden(input.rewardComebackLine)
  ) {
    duplicateKeys.push(
      buildArchiveSurfaceDuplicateKey({ surface: 'hub', day, entryKind: 'comeback_completed' }),
    );
    return {
      continuityLine: input.rewardComebackLine,
      continuityKind: 'reward',
      suppressedLines: [input.districtReportLine ?? ''].filter(Boolean),
      duplicateKeys,
      maxLines,
    };
  }

  if (
    input.districtReportLine &&
    !isArchiveSurfaceDuplicate(input.districtReportLine, guard) &&
    !archiveSurfaceLineContainsForbidden(input.districtReportLine)
  ) {
    const line = input.districtReportLine.startsWith('Mahalle izi')
      ? input.districtReportLine
      : cleanLine(`Mahalle izi: ${input.districtReportLine}`);
    duplicateKeys.push(
      buildArchiveSurfaceDuplicateKey({ surface: 'hub', day, entryKind: 'district_shift' }),
    );
    return {
      continuityLine: line,
      continuityKind: 'district',
      suppressedLines: [],
      duplicateKeys,
      maxLines,
    };
  }

  if (
    input.cityJournalLine &&
    day >= 3 &&
    !isArchiveSurfaceDuplicate(input.cityJournalLine, guard) &&
    !archiveSurfaceLineContainsForbidden(input.cityJournalLine)
  ) {
    const line = input.cityJournalLine.startsWith('Şehir hafızası')
      ? input.cityJournalLine
      : cleanLine(`Şehir hafızası: ${input.cityJournalLine.replace(/^Gün\s+\d+:\s*/i, '')}`);
    return {
      continuityLine: line,
      continuityKind: 'city_memory',
      suppressedLines: [],
      duplicateKeys,
      maxLines,
    };
  }

  return { suppressedLines, duplicateKeys, maxLines };
}

export function buildEceArchiveHintModel(input: EceArchiveHintInput): EceArchiveHintModel {
  const day = input.day;
  const suppressedLines: string[] = [];
  if (day <= 1) return { suppressedLines };

  const guard = [
    ...(input.existingLines ?? []),
    input.advisorRelationshipMainLine ?? '',
  ].filter(Boolean);

  const storyHint =
    input.storyChainEceHint ??
    buildPersistentStoryChainEceHint(input.cityArchive, day, guard);
  if (
    storyHint &&
    day >= 3 &&
    !isArchiveSurfaceDuplicate(storyHint, guard) &&
    !archiveSurfaceLineContainsForbidden(storyHint)
  ) {
    return { supportingLine: storyHint, sourceKind: 'story_chain', suppressedLines };
  }
  if (input.storyChainEceHint) suppressedLines.push(input.storyChainEceHint);

  if (
    input.advisorRelationshipSupportingLine &&
    !isArchiveSurfaceDuplicate(input.advisorRelationshipSupportingLine, guard) &&
    !archiveSurfaceLineContainsForbidden(input.advisorRelationshipSupportingLine)
  ) {
    return {
      supportingLine: input.advisorRelationshipSupportingLine,
      sourceKind: 'advisor_relationship',
      suppressedLines,
    };
  }

  if (
    input.rewardComebackEceLine &&
    day >= 4 &&
    !isArchiveSurfaceDuplicate(input.rewardComebackEceLine, guard) &&
    !archiveSurfaceLineContainsForbidden(input.rewardComebackEceLine)
  ) {
    return {
      supportingLine: input.rewardComebackEceLine,
      sourceKind: 'reward_comeback',
      suppressedLines,
    };
  }

  if (
    input.districtEceLine &&
    !isArchiveSurfaceDuplicate(input.districtEceLine, guard) &&
    !archiveSurfaceLineContainsForbidden(input.districtEceLine)
  ) {
    return { supportingLine: input.districtEceLine, sourceKind: 'district', suppressedLines };
  }

  if (
    input.cityEchoAdvisorLine &&
    !isArchiveSurfaceDuplicate(input.cityEchoAdvisorLine, guard) &&
    !archiveSurfaceLineContainsForbidden(input.cityEchoAdvisorLine)
  ) {
    return { supportingLine: input.cityEchoAdvisorLine, sourceKind: 'city_echo', suppressedLines };
  }

  return { suppressedLines };
}

export function buildReportArchiveContinuityFromCandidates(
  input: ReportArchiveContinuityInput,
): ReportArchiveContinuityModel {
  const archive = input.cityArchive ? normalizeCityArchiveState(input.cityArchive, input.day) : null;
  const guard = input.existingLines ?? [];
  const storyChainLine =
    input.storyChainLine ??
    buildPersistentStoryChainReportLine(archive, input.day, guard);
  return buildReportArchiveContinuityModel({
    ...input,
    storyChainLine,
    cityArchive: archive,
  });
}

export { archiveJournalEntryLabel };
