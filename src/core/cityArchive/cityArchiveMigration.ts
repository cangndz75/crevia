import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  CITY_ARCHIVE_BACKFILL_MAX,
  CITY_ARCHIVE_MIGRATION_FROM_SAVE_VERSION,
} from './cityArchiveConstants';
import {
  appendCityArchiveEntries,
  buildCityArchiveEntriesForDay,
} from './cityArchiveEngine';
import { createInitialCityArchiveState, normalizeCityArchiveState } from './cityArchiveState';
import type { CityArchiveBackfillInput, CityArchiveV1State } from './cityArchiveTypes';

export function migrateCityArchiveFromSaveV23(
  input: CityArchiveBackfillInput,
  existingArchive?: unknown,
): CityArchiveV1State {
  const currentDay = input.currentDay;
  const warnings: string[] = [];

  let state = existingArchive
    ? normalizeCityArchiveState(existingArchive, currentDay)
    : createInitialCityArchiveState(currentDay);

  const alreadyMigrated =
    state.migrationMeta?.migratedFromSaveVersion === CITY_ARCHIVE_MIGRATION_FROM_SAVE_VERSION &&
    Boolean(state.migrationMeta.backfillStrategy);
  if (alreadyMigrated) {
    return state;
  }

  if (currentDay <= 3) {
    state = {
      ...createInitialCityArchiveState(currentDay),
      migrationMeta: {
        migratedFromSaveVersion: CITY_ARCHIVE_MIGRATION_FROM_SAVE_VERSION,
        migratedAtDay: currentDay,
        backfillStrategy: 'day_1_3_empty',
        backfillEntryCount: 0,
        warnings,
      },
    };
    return state;
  }

  const backfillEntries = buildCityArchiveEntriesForDay({
    day: currentDay,
    isPostPilot:
      input.postPilotPhase === 'main_operation_light' ||
      input.postPilotPhase === 'main_operation_full',
    isPilotCompleted: input.pilotStatus === 'completed',
    lastDailyReport: input.lastDailyReport ?? undefined,
    dayDecisions: input.decisionHistory,
    mainOperationFeelLine:
      currentDay >= POST_PILOT_FIRST_OPERATION_DAY &&
      (input.pilotStatus === 'completed' ||
        input.postPilotPhase === 'main_operation_light' ||
        input.postPilotPhase === 'main_operation_full')
        ? 'Ana operasyon kapsamı genişledi.'
        : undefined,
  }).slice(0, CITY_ARCHIVE_BACKFILL_MAX);

  if (backfillEntries.length === 0) {
    const fallback = buildCityArchiveEntriesForDay({
      day: Math.max(4, currentDay),
      lastDailyReport: input.lastDailyReport ?? {
        summary: `Gün ${currentDay}: şehir arşivi başladı.`,
      },
    }).slice(0, 1);

    state = appendCityArchiveEntries(state, fallback, {
      day: currentDay,
      skipDuplicate: true,
    });
  } else {
    state = appendCityArchiveEntries(state, backfillEntries, {
      day: currentDay,
      skipDuplicate: true,
    });
  }

  state = {
    ...state,
    migrationMeta: {
      migratedFromSaveVersion: CITY_ARCHIVE_MIGRATION_FROM_SAVE_VERSION,
      migratedAtDay: currentDay,
      backfillStrategy: backfillEntries.length > 0 ? 'minimal_signals' : 'fallback_archive_started',
      backfillEntryCount: state.entries.length,
      warnings,
    },
  };

  return state;
}

export function resolveCityArchiveOnPersistLoad(params: {
  rawArchive: unknown;
  saveVersion: number;
  currentDay: number;
  backfillInput: CityArchiveBackfillInput;
}): CityArchiveV1State {
  const { rawArchive, saveVersion, currentDay, backfillInput } = params;

  if (rawArchive != null) {
    const normalized = normalizeCityArchiveState(rawArchive, currentDay);
    if (saveVersion >= 24 && normalized.entries.length >= 0) {
      return normalized;
    }
  }

  if (saveVersion <= CITY_ARCHIVE_MIGRATION_FROM_SAVE_VERSION || rawArchive == null) {
    return migrateCityArchiveFromSaveV23(backfillInput, rawArchive);
  }

  return createInitialCityArchiveState(currentDay);
}
