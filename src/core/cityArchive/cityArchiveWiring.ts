import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  buildPersistentStoryChainDayCloseInput,
  type StoryChainDayCloseStoreInput,
} from '@/core/storyChains/storyChainPersistentWiring';
import { applyPersistentStoryChainOnDayClose } from '@/core/storyChains/storyChainPersistentEngine';

import {
  appendCityArchiveEntries,
  buildCityArchiveEntriesForDay,
} from './cityArchiveEngine';
import { createInitialCityArchiveState } from './cityArchiveState';
import type { CityArchiveDayCloseInput, CityArchiveV1State } from './cityArchiveTypes';

export type CityArchiveDayCloseStoreInput = {
  closingDay: number;
  pilotStatus?: string;
  postPilotPhase?: string | null;
  dailyReportSummary?: string;
  dailyReportHeadline?: string;
  dayDecisions?: CityArchiveDayCloseInput['dayDecisions'];
  districtReportLine?: string | null;
  districtId?: string | null;
  rewardComebackLine?: string | null;
  rewardComebackKind?: string | null;
  mainOperationFeelLine?: string | null;
  advisorPredictionLine?: string | null;
  carryOverLine?: string | null;
};

export function buildCityArchiveDayCloseInput(
  input: CityArchiveDayCloseStoreInput,
): CityArchiveDayCloseInput {
  const closingDay = input.closingDay;
  const isPostPilot = closingDay >= POST_PILOT_FIRST_OPERATION_DAY;
  const isPilotCompleted = input.pilotStatus === 'completed';

  return {
    day: closingDay,
    isPostPilot,
    isPilotCompleted,
    lastDailyReport: {
      summary: input.dailyReportSummary,
      headline: input.dailyReportHeadline,
    },
    dayDecisions: input.dayDecisions,
    districtReportLine: input.districtReportLine ?? undefined,
    districtId: input.districtId,
    rewardComebackLine: input.rewardComebackLine ?? undefined,
    rewardComebackKind: input.rewardComebackKind ?? undefined,
    mainOperationFeelLine: input.mainOperationFeelLine ?? undefined,
    advisorPredictionLine: input.advisorPredictionLine ?? undefined,
    carryOverLine: input.carryOverLine ?? undefined,
  };
}

export function appendDayCloseCityArchive(
  archive: CityArchiveV1State | null | undefined,
  input: CityArchiveDayCloseInput,
): CityArchiveV1State {
  const base = archive ?? createInitialCityArchiveState(input.day);
  const entries = buildCityArchiveEntriesForDay(input);
  return appendCityArchiveEntries(base, entries, { day: input.day, skipDuplicate: true });
}

export function appendDayCloseCityArchiveWithStoryChains(
  archive: CityArchiveV1State | null | undefined,
  archiveInput: CityArchiveDayCloseInput,
  storyChainStoreInput?: StoryChainDayCloseStoreInput,
): CityArchiveV1State {
  const afterArchive = appendDayCloseCityArchive(archive, archiveInput);
  if (!storyChainStoreInput) return afterArchive;
  const storyInput = buildPersistentStoryChainDayCloseInput(storyChainStoreInput);
  return applyPersistentStoryChainOnDayClose(afterArchive, storyInput);
}
