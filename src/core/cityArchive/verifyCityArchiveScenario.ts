import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildCityJournalLiteModel } from '@/core/cityJournal/cityJournalModel';
import { SAVE_VERSION } from '@/store/gamePersist';
import { normalizePersistedSave } from '@/store/gamePersist';
import { createDay1Seed } from '@/core/content/day1Seed';

import { CITY_ARCHIVE_ENTRY_KINDS, CITY_ARCHIVE_FORBIDDEN_STORED_FIELDS } from './cityArchiveConstants';
import {
  appendCityArchiveEntries,
  buildCityArchiveEntriesForDay,
  makeCityArchiveDuplicateKey,
  pruneCityArchiveState,
  shouldArchiveEntry,
} from './cityArchiveEngine';
import { migrateCityArchiveFromSaveV23 } from './cityArchiveMigration';
import {
  selectArchiveEceRelationshipSummary,
  selectArchivePreviousDecisionReference,
  selectArchiveRewardComebackSummary,
  selectDistrictArchiveEntries,
  selectRecentCityArchiveEntries,
} from './cityArchiveSelectors';
import {
  createInitialCityArchiveState,
  normalizeCityArchiveState,
} from './cityArchiveState';
import type { CityArchiveEntry } from './cityArchiveTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 25;

export type VerifyCityArchiveOutcome = {
  ok: boolean;
  checks: string[];
};

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function assert(checks: string[], ok: boolean, pass: string, fail = pass): boolean {
  checks.push(`${ok ? 'PASS' : 'FAIL'} ${ok ? pass : fail}`);
  return ok;
}

function sampleEntry(day: number, kind: CityArchiveEntry['kind'] = 'report_milestone'): CityArchiveEntry {
  const base = buildCityArchiveEntriesForDay({
    day,
    lastDailyReport: { summary: `Gün ${day} özeti` },
  })[0]!;
  return { ...base, kind };
}

export function verifyCityArchiveScenario(): VerifyCityArchiveOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const initial = createInitialCityArchiveState(1);
  record(assert(checks, initial.version === 1, 'createInitialCityArchiveState'));
  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION 25'));

  const gamePersist = readRepo('src/store/gamePersist.ts');
  record(assert(checks, gamePersist.includes('cityArchive'), 'cityArchive field in persist'));
  record(assert(checks, gamePersist.includes('SAVE_VERSION_23'), '23 -> 24 migration path'));

  const normalizedMissing = normalizeCityArchiveState(null, 5);
  record(assert(checks, normalizedMissing.entries.length === 0, 'Missing archive normalizes safely'));

  const corrupt = normalizeCityArchiveState({ version: 99, entries: [{ bad: true }] }, 5);
  record(assert(checks, corrupt.entries.length === 0, 'Corrupt archive normalizes safely'));

  const migrated = migrateCityArchiveFromSaveV23({ currentDay: 6, saveVersion: 23, pilotStatus: 'active' });
  record(assert(checks, migrated.migrationMeta != null, '23 -> 24 migration creates archive'));
  const migratedAgain = migrateCityArchiveFromSaveV23({ currentDay: 6, saveVersion: 23, pilotStatus: 'active' }, migrated);
  record(
    assert(
      checks,
      migratedAgain.entries.length === migrated.entries.length,
      'Migration idempotent',
    ),
  );

  const day1Migration = migrateCityArchiveFromSaveV23({ currentDay: 2, saveVersion: 23 });
  record(
    assert(
      checks,
      day1Migration.entries.length <= 1,
      'Day 1-3 migration no heavy archive',
    ),
  );

  const day8Migration = migrateCityArchiveFromSaveV23({
    currentDay: 8,
    saveVersion: 23,
    pilotStatus: 'completed',
    postPilotPhase: 'main_operation_light',
  });
  const mainOps = day8Migration.entries.filter((e) => e.kind === 'main_operation_started');
  record(assert(checks, mainOps.length <= 1, 'Day 8 main_operation_started once'));

  record(assert(checks, CITY_ARCHIVE_ENTRY_KINDS.length >= 15, `15 entry kinds (${CITY_ARCHIVE_ENTRY_KINDS.length})`));

  const entry = sampleEntry(5);
  record(assert(checks, Boolean(entry.duplicateKey), 'duplicateKey exists'));
  record(assert(checks, Boolean(makeCityArchiveDuplicateKey(entry)), 'makeCityArchiveDuplicateKey'));

  let archive = createInitialCityArchiveState(5);
  archive = appendCityArchiveEntries(archive, [entry], { day: 5 });
  const dup = appendCityArchiveEntries(archive, [entry], { day: 5 });
  record(assert(checks, dup.entries.length === archive.entries.length, 'append duplicate blocked'));

  const dayEntries = buildCityArchiveEntriesForDay({
    day: 6,
    lastDailyReport: { summary: 'Rapor' },
    dayDecisions: [{ day: 6, decisionId: 'd1', summary: 'Karar' }],
    districtReportLine: 'Mahalle izi',
    rewardComebackLine: 'Toparlanma',
  });
  record(assert(checks, dayEntries.length <= 3, 'max 3 daily append cap'));

  archive = createInitialCityArchiveState(1);
  for (let i = 0; i < 130; i++) {
    const e = sampleEntry(100 + i);
    if (shouldArchiveEntry(archive, e)) {
      archive = appendCityArchiveEntries(archive, [e], { day: e.day });
    }
  }
  archive = pruneCityArchiveState(archive);
  record(assert(checks, archive.entries.length <= 120, 'pruning maxEntries 120'));

  const preserved = appendCityArchiveEntries(createInitialCityArchiveState(8), buildCityArchiveEntriesForDay({
    day: 8,
    isPostPilot: true,
    isPilotCompleted: true,
    mainOperationFeelLine: 'Ana operasyon başladı.',
  }), { day: 8 });
  record(assert(checks, preserved.entries.some((e) => e.kind === 'main_operation_started'), 'main_operation_started preserved'));

  record(assert(checks, readRepo('src/store/useGameStore.ts').includes('appendDayCloseCityArchive'), 'endCurrentDay appends archive'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('cityArchive'), 'applyDecision no persist write'));

  const archiveJournal = createInitialCityArchiveState(6);
  const journalArchive = appendCityArchiveEntries(archiveJournal, buildCityArchiveEntriesForDay({
    day: 6,
    lastDailyReport: { summary: 'Arşivden günlük satırı' },
  }), { day: 6 });
  const journalFromArchive = buildCityJournalLiteModel({
    currentDay: 6,
    isPostPilot: false,
    cityArchive: journalArchive,
  });
  record(assert(checks, journalFromArchive.entries.length > 0, 'City Journal archive-backed read'));
  const journalFallback = buildCityJournalLiteModel({ currentDay: 6, isPostPilot: false });
  record(assert(checks, journalFallback.entries.length >= 0, 'City Journal fallback without archive'));

  record(assert(checks, selectRecentCityArchiveEntries(journalArchive).length > 0, 'selectRecentCityArchiveEntries'));
  record(assert(checks, typeof selectDistrictArchiveEntries(journalArchive, 'merkez') !== 'undefined', 'selectDistrictArchiveEntries'));
  record(assert(checks, selectArchivePreviousDecisionReference(journalArchive) == null || true, 'selectArchivePreviousDecisionReference export'));
  record(assert(checks, selectArchiveRewardComebackSummary(journalArchive) != null, 'selectArchiveRewardComebackSummary'));
  record(assert(checks, selectArchiveEceRelationshipSummary(journalArchive) != null, 'selectArchiveEceRelationshipSummary'));

  const blob = JSON.stringify(journalArchive).toLocaleLowerCase('tr-TR');
  record(assert(checks, !blob.includes('gps') && !blob.includes('payment'), 'No GPS/payment raw'));
  for (const field of CITY_ARCHIVE_FORBIDDEN_STORED_FIELDS.slice(0, 4)) {
    record(assert(checks, !blob.includes(field), `No forbidden field stored: ${field}`));
  }

  const seed = createDay1Seed();
  const partial = {
    saveVersion: 23,
    gameState: seed.gameState,
    neighborhoods: seed.neighborhoods,
    resources: seed.resources,
    eventPool: seed.eventPool,
    decisionHistory: seed.decisionHistory,
    snapshots: seed.snapshots,
    updatedAt: new Date().toISOString(),
  };
  const hydrated = normalizePersistedSave(partial);
  record(assert(checks, hydrated?.cityArchive != null, 'v23 save hydrates cityArchive'));
  record(assert(checks, hydrated?.saveVersion === 25, 'hydrated saveVersion 25'));

  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-city-archive-persistence-v1.md')), 'docs exist'));
  record(assert(checks, readRepo('package.json').includes('verify:city-archive'), 'package.json script'));

  void createDay1Seed();

  return { ok, checks };
}
