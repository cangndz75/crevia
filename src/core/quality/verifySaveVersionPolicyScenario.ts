import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { createDay1Seed } from '@/core/content/day1Seed';
import {
  assertCurrentSaveVersion,
  assertGamePersistExportsCurrentSaveVersion,
  assertMigrationSupportsVersion,
  buildSaveVersionPolicyReport,
  EXPECTED_SAVE_VERSION_FOR_VERIFY,
  getExpectedSaveVersionForCurrentBuild,
  isCurrentSaveVersion,
  MAINTENANCE_BACKLOG_RUNTIME_MIGRATION_FROM_VERSION,
  STRATEGY_HISTORY_MIGRATION_FROM_VERSION,
} from '@/core/quality/saveVersionPolicy';
import { verifyMaintenanceBacklogRuntimeScenario } from '@/core/maintenanceBacklog/verifyMaintenanceBacklogRuntimeScenario';
import { verifyStrategyHistoryScenario } from '@/core/strategyHistory/verifyStrategyHistoryScenario';
import {
  GAME_STORAGE_KEY,
  normalizePersistedSave,
  SAVE_VERSION,
} from '@/store/gamePersist';

export type VerifySaveVersionPolicyOutcome = {
  ok: boolean;
  checks: string[];
  report: ReturnType<typeof buildSaveVersionPolicyReport>;
};

const REPO_ROOT = join(__dirname, '..', '..', '..');
const SCAN_ROOTS = ['src', 'scripts'] as const;

const ACTIVE_LEGACY_PATTERNS: { id: string; regex: RegExp }[] = [
  { id: 'save_version_eq_27', regex: /SAVE_VERSION\s*===\s*27\b/ },
  { id: 'save_version_neq_27', regex: /SAVE_VERSION\s*!==\s*27\b/ },
  { id: 'expected_save_version_27', regex: /EXPECTED_SAVE_VERSION\s*=\s*27\b/ },
  { id: 'named_expected_save_version_27', regex: /EXPECTED_SAVE_VERSION\s*=\s*27;/ },
  { id: 'must_remain_27', regex: /must remain 27/i },
  {
    id: 'game_persist_literal_save_version_includes',
    regex: /includes\(['"][^'"]*SAVE_VERSION\s*=\s*27/,
  },
];

function assert(checks: string[], pass: boolean, ok: string, fail?: string): boolean {
  checks.push(pass ? `PASS ${ok}` : `FAIL ${fail ?? ok}`);
  return pass;
}

function walkTsFiles(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.expo') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkTsFiles(full, files);
    else if (/\.tsx?$/.test(entry)) files.push(full);
  }
  return files;
}

function scanLegacyVersionChecks(): { file: string; patternId: string }[] {
  const hits: { file: string; patternId: string }[] = [];
  for (const root of SCAN_ROOTS) {
    for (const file of walkTsFiles(join(REPO_ROOT, root))) {
      if (file.includes('_bulk-save-version-27-fix')) continue;
      if (file.includes('save-version-27-fix')) continue;
      if (file.includes('verifySaveVersionPolicyScenario')) continue;
      if (file.includes('saveVersionPolicy.ts')) continue;
      const content = readFileSync(file, 'utf8');
      for (const pattern of ACTIVE_LEGACY_PATTERNS) {
        if (pattern.regex.test(content)) {
          hits.push({ file: relative(REPO_ROOT, file), patternId: pattern.id });
        }
      }
    }
  }
  return hits;
}

export function verifySaveVersionPolicyScenario(): VerifySaveVersionPolicyOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(
    assert(
      checks,
      getExpectedSaveVersionForCurrentBuild() === 28,
      'current SAVE_VERSION is 28',
      `current SAVE_VERSION is ${SAVE_VERSION}`,
    ),
  );
  record(assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION matches current build'));
  record(assert(checks, assertCurrentSaveVersion(), 'assertCurrentSaveVersion passes'));
  record(
    assert(
      checks,
      assertMigrationSupportsVersion(STRATEGY_HISTORY_MIGRATION_FROM_VERSION, SAVE_VERSION),
      'v26→v28 migration path supported by policy',
    ),
  );
  record(
    assert(
      checks,
      assertMigrationSupportsVersion(MAINTENANCE_BACKLOG_RUNTIME_MIGRATION_FROM_VERSION, SAVE_VERSION),
      'v27→v28 migration path supported by policy',
    ),
  );
  record(
    assert(
      checks,
      EXPECTED_SAVE_VERSION_FOR_VERIFY === SAVE_VERSION,
      'EXPECTED_SAVE_VERSION_FOR_VERIFY tracks runtime SAVE_VERSION',
    ),
  );

  const persistSource = readFileSync(join(REPO_ROOT, 'src/store/gamePersist.ts'), 'utf8');
  record(
    assert(
      checks,
      persistSource.includes('strategyHistory'),
      'gamePersist includes strategyHistory persist field',
    ),
  );
  record(
    assert(
      checks,
      persistSource.includes('maintenanceBacklogRuntime'),
      'gamePersist includes maintenanceBacklogRuntime persist field',
    ),
  );
  record(
    assert(
      checks,
      assertGamePersistExportsCurrentSaveVersion(persistSource),
      'gamePersist exports current SAVE_VERSION literal',
    ),
  );
  record(
    assert(
      checks,
      persistSource.includes('GAME_STORAGE_KEY'),
      'storage key constant present',
      'GAME_STORAGE_KEY missing',
    ),
  );
  record(assert(checks, GAME_STORAGE_KEY === 'crevia-game-state-v1', 'storage key unchanged'));

  const migratedV26 = normalizePersistedSave({
    ...createDay1Seed(),
    saveVersion: STRATEGY_HISTORY_MIGRATION_FROM_VERSION,
    updatedAt: '2026-06-15T00:00:00.000Z',
  });
  record(
    assert(
      checks,
      migratedV26?.saveVersion === SAVE_VERSION && migratedV26.strategyHistory != null,
      'v26 save migrates to v28 with strategyHistory default',
      'v26→v28 migration failed',
    ),
  );

  const migratedV27 = normalizePersistedSave({
    ...createDay1Seed(),
    saveVersion: MAINTENANCE_BACKLOG_RUNTIME_MIGRATION_FROM_VERSION,
    strategyHistory: migratedV26?.strategyHistory,
    updatedAt: '2026-06-15T00:00:00.000Z',
  });
  record(
    assert(
      checks,
      migratedV27?.saveVersion === SAVE_VERSION && migratedV27.maintenanceBacklogRuntime != null,
      'v27 save migrates to v28 with maintenanceBacklogRuntime default',
      'v27→v28 migration failed',
    ),
  );

  const migratedV28 = normalizePersistedSave({
    ...createDay1Seed(),
    saveVersion: SAVE_VERSION,
    strategyHistory: migratedV26?.strategyHistory,
    maintenanceBacklogRuntime: migratedV27?.maintenanceBacklogRuntime,
    updatedAt: '2026-06-15T00:00:00.000Z',
  });
  record(
    assert(
      checks,
      migratedV28?.saveVersion === SAVE_VERSION,
      'v28 save no-op migration safe',
      'v28 no-op migration failed',
    ),
  );

  const strategyHistoryOutcome = verifyStrategyHistoryScenario();
  record(
    assert(
      checks,
      strategyHistoryOutcome.ok,
      'strategyHistory migration smoke (verifyStrategyHistoryScenario)',
      `${strategyHistoryOutcome.checks.filter((line) => line.startsWith('FAIL')).length} FAIL in strategy history verify`,
    ),
  );

  const maintenanceRuntimeOutcome = verifyMaintenanceBacklogRuntimeScenario();
  record(
    assert(
      checks,
      maintenanceRuntimeOutcome.ok,
      'maintenanceBacklogRuntime smoke (verifyMaintenanceBacklogRuntimeScenario)',
      `${maintenanceRuntimeOutcome.checks.filter((line) => line.startsWith('FAIL')).length} FAIL in maintenance runtime verify`,
    ),
  );

  const legacyHits = scanLegacyVersionChecks();
  record(
    assert(
      checks,
      legacyHits.length === 0,
      'no active verify/analyzer expects SAVE_VERSION 27',
      legacyHits.map((hit) => `${hit.file} (${hit.patternId})`).join('; ') || 'legacy hits found',
    ),
  );

  const policyHelperExists = existsSync(
    join(REPO_ROOT, 'src/core/quality/saveVersionPolicy.ts'),
  );
  record(assert(checks, policyHelperExists, 'saveVersionPolicy helper exists'));

  const report = buildSaveVersionPolicyReport({
    legacyVersionChecksFound: legacyHits.length,
    policyWarnings: legacyHits.map((hit) => `${hit.file}:${hit.patternId}`),
    blockingFailures: ok ? [] : checks.filter((line) => line.startsWith('FAIL')),
  });

  record(assert(checks, report.currentSaveVersion === 28, 'policy report currentSaveVersion 28'));
  record(
    assert(
      checks,
      report.migrationCoverage.some((entry) => /v?27→v?28/.test(entry)),
      'policy report includes v27→v28 migration coverage',
    ),
  );

  return { ok, checks, report };
}

export function analyzeSaveVersionPolicyScenario(): {
  ok: boolean;
  lines: string[];
  report: ReturnType<typeof buildSaveVersionPolicyReport>;
} {
  const outcome = verifySaveVersionPolicyScenario();
  const legacyHits = scanLegacyVersionChecks();
  const lines: string[] = [
    '# SAVE_VERSION policy analysis',
    `currentSaveVersion: ${SAVE_VERSION}`,
    `migrationCoverage: v${STRATEGY_HISTORY_MIGRATION_FROM_VERSION}→v${SAVE_VERSION} (strategyHistory); v${MAINTENANCE_BACKLOG_RUNTIME_MIGRATION_FROM_VERSION}→v${SAVE_VERSION} (maintenanceBacklogRuntime)`,
    `legacyVersionChecksFound: ${legacyHits.length}`,
    '',
    '## Verify summary',
    ...outcome.checks,
    '',
    '## Remaining legacy hits',
    ...(legacyHits.length === 0
      ? ['(none)']
      : legacyHits.map((hit) => `- ${hit.file} [${hit.patternId}]`)),
  ];

  return {
    ok: outcome.ok,
    lines,
    report: outcome.report,
  };
}
