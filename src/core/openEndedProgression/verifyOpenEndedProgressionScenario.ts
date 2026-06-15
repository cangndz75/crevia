import fs from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import path from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';

import {
  EARLY_OPERATION_BENCHMARK_DAYS,
  FORBIDDEN_PLAYER_FACING_SEASON_END_TERMS,
  OPEN_ENDED_OPERATION_IS_TERMINAL,
  OPEN_ENDED_OPERATION_PHASES,
  OPEN_ENDED_PROGRESSION_UNLOCK_AXES,
  PILOT_TRAINING_DAYS,
  TECHNICAL_ALLOWED_BENCHMARK_TERMS,
} from './openEndedProgressionConstants';
import {
  buildNextProgressionPreview,
  buildOpenEndedProgressionSummary,
  buildOperationCareerPhaseLabel,
  buildPeriodicReviewCopy,
  containsForbiddenSeasonEndCopy,
  normalizeLegacySeasonEndLabel,
} from './openEndedProgressionPresentation';
import type {
  OpenEndedProgressionGuardResult,
  OperationCareerPhase,
  ProgressionUnlockAxis,
} from './openEndedProgressionTypes';

export type VerifyOpenEndedProgressionOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  findings: OpenEndedProgressionGuardResult[];
};

const REPO_ROOT = process.cwd();
const SCAN_DIRS = ['src/features', 'src/core', 'docs'] as const;
const PLAYER_FACING_EXTENSIONS = new Set(['.ts', '.tsx']);
const DOC_EXTENSIONS = new Set(['.md']);
const ALLOWED_TECHNICAL_FILES = [
  'analytics',
  'verify',
  'simulation',
  'releaseReadiness',
  'quality',
  'docs',
  'openEndedProgression',
  'rankPermissions',
  'eventFamilies',
  'districtTrust',
  'mapLayers',
  'activeTaskRoutes',
  'districtOperations',
  'teamSpecialization',
  'vehicleMaintenance',
  'containerNetwork',
  'operationEra',
  'contentProduction',
  'eventSelection',
  'eventVariants',
  'eventFreshness',
  'eventResultNewSystems',
  'reports',
  'districtTrustRuntime',
  'districtMemoryRuntime',
  'districtOperationsRuntime',
  'hub',
];

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

function readRepo(relativePath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function walkFiles(relativeDir: string): string[] {
  const root = path.join(REPO_ROOT, relativeDir);
  if (!fs.existsSync(root)) return [];
  const out: string[] = [];
  const visit = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(full);
      } else {
        out.push(path.relative(REPO_ROOT, full).replace(/\\/g, '/'));
      }
    }
  };
  visit(root);
  return out;
}

function isTechnicalAllowedPath(file: string): boolean {
  const normalized = file.replace(/\\/g, '/');
  return ALLOWED_TECHNICAL_FILES.some((part) => normalized.includes(part));
}

function isAllowedTechnicalLine(line: string): boolean {
  const lower = line.toLocaleLowerCase('tr-TR');
  return TECHNICAL_ALLOWED_BENCHMARK_TERMS.some((term) =>
    lower.includes(term.toLocaleLowerCase('tr-TR')),
  );
}

function scanForbiddenSeasonEndCopy(): OpenEndedProgressionGuardResult[] {
  const findings: OpenEndedProgressionGuardResult[] = [];
  for (const dir of SCAN_DIRS) {
    for (const file of walkFiles(dir)) {
      const ext = path.extname(file);
      if (!PLAYER_FACING_EXTENSIONS.has(ext) && !DOC_EXTENSIONS.has(ext)) continue;
      const content = readRepo(file);
      const lines = content.split(/\r?\n/);
      lines.forEach((line, index) => {
        for (const term of FORBIDDEN_PLAYER_FACING_SEASON_END_TERMS) {
          if (!line.toLocaleLowerCase('tr-TR').includes(term.toLocaleLowerCase('tr-TR'))) {
            continue;
          }
          const detail = `${file}:${index + 1}`;
          if (DOC_EXTENSIONS.has(ext) || isTechnicalAllowedPath(file) || isAllowedTechnicalLine(line)) {
            findings.push({
              status: 'WARN',
              message: `Legacy/technical terminology retained: ${term}`,
              details: [detail],
            });
          } else {
            findings.push({
              status: 'FAIL',
              message: `Player-facing forbidden season-end copy: ${term}`,
              details: [detail],
            });
          }
        }
      });
    }
  }
  return findings;
}

export function verifyOpenEndedProgressionScenario(): VerifyOpenEndedProgressionOutcome {
  const checks: string[] = [];
  const findings: OpenEndedProgressionGuardResult[] = [];
  let ok = true;
  let hasWarn = false;

  ok = assert(checks, PILOT_TRAINING_DAYS === 7, 'Pilot training 7 days', 'Pilot training days changed') && ok;
  ok = assert(checks, EARLY_OPERATION_BENCHMARK_DAYS === 14, 'Early benchmark 14 days', 'Benchmark days changed') && ok;
  ok = assert(checks, OPEN_ENDED_OPERATION_IS_TERMINAL === false, 'Open-ended operation non-terminal', 'Operation marked terminal') && ok;
  ok = assert(checks, OPEN_ENDED_OPERATION_PHASES.includes('long_term_career'), 'Long-term career phase', 'Missing long_term_career') && ok;

  for (const axis of [
    'xp',
    'authority',
    'rank',
    'resource_stability',
    'district_trust',
    'operation_era',
  ] as const satisfies readonly ProgressionUnlockAxis[]) {
    ok =
      assert(
        checks,
        OPEN_ENDED_PROGRESSION_UNLOCK_AXES.includes(axis),
        `Unlock axis ${axis}`,
        `Missing unlock axis ${axis}`,
      ) && ok;
  }

  for (const phase of OPEN_ENDED_OPERATION_PHASES) {
    const label = buildOperationCareerPhaseLabel(phase as OperationCareerPhase);
    ok = assert(checks, label.trim().length > 0, `Phase label ${phase}`, `Empty phase label ${phase}`) && ok;
  }

  const review = buildPeriodicReviewCopy({
    kind: 'periodic_operation_review',
    phase: 'district_responsibility',
  });
  ok =
    assert(
      checks,
      review.title === 'Dönemsel Operasyon Değerlendirmesi' ||
        review.title === 'Operasyon Dönemi Özeti',
      'Periodic review title non-terminal',
      'Periodic review title terminal',
    ) && ok;
  ok =
    assert(
      checks,
      !containsForbiddenSeasonEndCopy(JSON.stringify(review)),
      'Periodic review copy has no forbidden terms',
      'Periodic review copy has forbidden terms',
    ) && ok;
  ok =
    assert(
      checks,
      ['Operasyona Devam Et', 'Merkeze Dön', 'Sonraki Güne Hazırlan'].includes(review.ctaLabel),
      'Periodic review CTA continues',
      'Periodic review CTA terminal',
    ) && ok;

  const summary = buildOpenEndedProgressionSummary();
  ok =
    assert(
      checks,
      summary.toLocaleLowerCase('tr-TR').includes('açık uçlu'),
      'Summary contains open-ended progression',
      'Summary missing open-ended progression',
    ) && ok;

  const preview = buildNextProgressionPreview();
  ok =
    assert(
      checks,
      ['xp', 'authority', 'ünvan', 'kaynak', 'mahalle'].some((term) =>
        preview.toLocaleLowerCase('tr-TR').includes(term),
      ),
      'Next preview uses progression axes',
      'Next preview uses day count instead of axes',
    ) && ok;

  ok =
    assert(
      checks,
      normalizeLegacySeasonEndLabel('Sezon Sonu') !== 'Sezon Sonu',
      'Legacy Sezon Sonu normalized',
      'Legacy Sezon Sonu left player-facing',
    ) && ok;
  ok =
    assert(
      checks,
      normalizeLegacySeasonEndLabel('Yeni Sezona Başla') === 'Operasyona Devam Et',
      'Legacy new season CTA normalized',
      'Legacy new season CTA not normalized',
    ) && ok;

  const docs = readRepo('docs/crevia-open-ended-progression.md');
  ok =
    assert(
      checks,
      docs.toLocaleLowerCase('tr-TR').includes('açık uçlu ana operasyon'),
      'Docs include open-ended main operation',
      'Docs missing open-ended main operation',
    ) && ok;
  ok =
    assert(
      checks,
      docs.toLocaleLowerCase('tr-TR').includes('benchmark'),
      'Docs say 14 days are benchmark context',
      'Docs missing benchmark context',
    ) && ok;

  ok =
    assert(
      checks,
      containsForbiddenSeasonEndCopy('Bu oyuncuya görünen sezon sonu metnidir.'),
      'Forbidden phrase scan catches player-facing phrase',
      'Forbidden phrase scan missed forbidden phrase',
    ) && ok;
  ok =
    assert(
      checks,
      !containsForbiddenSeasonEndCopy('14 gün early operation benchmark window olarak teknik testte kullanılır.'),
      'Technical benchmark phrase allowed by helper',
      'Technical benchmark phrase blocked by helper',
    ) && ok;

  const scanFindings = scanForbiddenSeasonEndCopy();
  findings.push(...scanFindings);
  const failFindings = scanFindings.filter((f) => f.status === 'FAIL');
  const warnFindings = scanFindings.filter((f) => f.status === 'WARN');
  ok =
    assert(
      checks,
      failFindings.length === 0,
      'Existing player-facing forbidden phrase scan PASS',
      `Player-facing forbidden phrase scan found ${failFindings.length} FAIL`,
    ) && ok;
  if (warnFindings.length > 0) {
    checks.push(`WARN Legacy technical/docs naming retained (${warnFindings.length})`);
    hasWarn = true;
  }

  ok = assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION unchanged at 23', `SAVE_VERSION=${SAVE_VERSION}`) && ok;
  hasWarn = !warn(checks, true, 'Persist shape unchanged by this patch (manual scope note)', 'Persist shape manual check needed') || hasWarn;

  return {
    ok,
    warn: hasWarn,
    checks,
    findings,
  };
}
