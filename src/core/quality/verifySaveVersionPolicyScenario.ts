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
  STRATEGY_HISTORY_MIGRATION_FROM_VERSION,
} from '@/core/quality/saveVersionPolicy';
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
  { id: 'save_version_eq_26', regex: /SAVE_VERSION\s*===\s*26\b/ },
  { id: 'save_version_neq_26', regex: /SAVE_VERSION\s*!==\s*26\b/ },
  { id: 'expected_save_version_26', regex: /EXPECTED_SAVE_VERSION\s*=\s*26\b/ },
  { id: 'named_expected_save_version_26', regex: /EXPECTED_SAVE_VERSION\s*=\s*26;/ },
  { id: 'must_remain_26', regex: /must remain 26|remain 26/i },
  {
    id: 'game_persist_literal_save_version_includes',
    regex: /includes\(['"][^'"]*SAVE_VERSION\s*=\s*26/,
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
      getExpectedSaveVersionForCurrentBuild() === 27,
      'current SAVE_VERSION is 27',
      `current SAVE_VERSION is ${SAVE_VERSION}`,
    ),
  );
  record(assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION matches current build'));
  record(assert(checks, assertCurrentSaveVersion(), 'assertCurrentSaveVersion passes'));
  record(
    assert(
      checks,
      assertMigrationSupportsVersion(STRATEGY_HISTORY_MIGRATION_FROM_VERSION, SAVE_VERSION),
      'v26→v27 migration path supported by policy',
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
      'v26 save migrates to v27 with strategyHistory default',
      'v26→v27 migration failed',
    ),
  );

  const migratedV27 = normalizePersistedSave({
    ...createDay1Seed(),
    saveVersion: SAVE_VERSION,
    strategyHistory: migratedV26?.strategyHistory,
    updatedAt: '2026-06-15T00:00:00.000Z',
  });
  record(
    assert(
      checks,
      migratedV27?.saveVersion === SAVE_VERSION,
      'v27 save no-op migration safe',
      'v27 no-op migration failed',
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

  const legacyHits = scanLegacyVersionChecks();
  record(
    assert(
      checks,
      legacyHits.length === 0,
      'no active verify/analyzer expects SAVE_VERSION 26',
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

  record(assert(checks, report.currentSaveVersion === 27, 'policy report currentSaveVersion 27'));
  record(
    assert(
      checks,
      report.migrationCoverage.some((entry) => /v?26→v?27/.test(entry)),
      'policy report includes v26→v27 migration coverage',
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
    `migrationCoverage: v${STRATEGY_HISTORY_MIGRATION_FROM_VERSION}→v${SAVE_VERSION} (strategyHistory)`,
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
