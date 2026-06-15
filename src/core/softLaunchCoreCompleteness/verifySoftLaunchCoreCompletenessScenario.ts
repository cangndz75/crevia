import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';

import {
  SOFT_LAUNCH_CORE_DOCS_PATH,
  SOFT_LAUNCH_CORE_NON_GOALS,
  SOFT_LAUNCH_CORE_REQUIRED_AREA_IDS,
} from './softLaunchCoreCompletenessConstants';
import { runSoftLaunchCoreCompletenessAudit } from './softLaunchCoreCompletenessAudit';
import {
  buildSoftLaunchCoreCompletenessConsoleSummary,
  buildSoftLaunchCoreCompletenessMarkdown,
} from './softLaunchCoreCompletenessPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifySoftLaunchCoreCompletenessOutcome = {
  ok: boolean;
  checks: string[];
  overallHealth: string;
  decision: string;
};

function assert(checks: string[], condition: boolean, pass: string, fail: string): boolean {
  checks.push(condition ? `PASS ${pass}` : `FAIL ${fail}`);
  return condition;
}

function readRepo(path: string): string {
  const full = join(REPO_ROOT, path);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

export function verifySoftLaunchCoreCompletenessScenario(): VerifySoftLaunchCoreCompletenessOutcome {
  const checks: string[] = [];
  let ok = true;
  const result = runSoftLaunchCoreCompletenessAudit();

  ok = assert(checks, result.auditAreas.length >= 15, 'At least 15 audit areas', `areas=${result.auditAreas.length}`) && ok;
  ok = assert(checks, result.auditAreas.every((area) => area.status), 'Every audit area has status', 'Missing status') && ok;

  for (const id of SOFT_LAUNCH_CORE_REQUIRED_AREA_IDS) {
    ok = assert(
      checks,
      result.auditAreas.some((area) => area.id === id),
      `Audit area ${id} present`,
      `Missing area ${id}`,
    ) && ok;
  }

  ok = assert(
    checks,
    result.softLaunchCoreDecision === 'blocked_for_launch_candidate',
    'Launch blockers keep launch_candidate BLOCKED',
    result.softLaunchCoreDecision,
  ) && ok;
  ok = assert(
    checks,
    result.internalDeviceTestDecision === 'proceed_internal_test',
    'Internal device test decision can proceed separately',
    result.internalDeviceTestDecision,
  ) && ok;

  const priorities = new Set(result.mandatoryPreSoftLaunchPasses.map((pass) => pass.priority));
  ok = assert(checks, priorities.has('must'), 'Pre-launch passes include must', 'Missing must') && ok;
  ok = assert(checks, priorities.has('should'), 'Pre-launch passes include should', 'Missing should') && ok;
  ok = assert(checks, priorities.has('optional'), 'Pre-launch passes include optional', 'Missing optional') && ok;
  ok = assert(
    checks,
    result.mandatoryPreSoftLaunchPasses.every((pass) => pass.priority === 'must' || pass.priority === 'should' || pass.priority === 'optional'),
    'Pre-launch passes classified as must/should/optional',
    'Invalid pass priority',
  ) && ok;

  ok = assert(checks, result.recommendedNextPrompts.length > 0, 'recommendedNextPrompts non-empty', 'No prompts') && ok;
  ok = assert(checks, result.deferredV11Systems.length > 0, 'deferredV11Systems non-empty', 'No V1.1 deferrals') && ok;
  ok = assert(checks, result.deferredV2Systems.length > 0, 'deferredV2Systems non-empty', 'No V2 deferrals') && ok;
  ok = assert(checks, result.launchBlockers.length >= 9, 'Launch blockers listed', `blockers=${result.launchBlockers.length}`) && ok;

  for (const nonGoal of SOFT_LAUNCH_CORE_NON_GOALS) {
    ok = assert(
      checks,
      result.nonGoalsConfirmed.includes(nonGoal),
      `Non-goal confirmed: ${nonGoal}`,
      `Missing non-goal: ${nonGoal}`,
    ) && ok;
  }

  ok = assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION at 24', `SAVE_VERSION=${SAVE_VERSION}`) && ok;
  ok = assert(
    checks,
    result.nonGoalsConfirmed.some((line) => line.includes('SAVE_VERSION remains 24')),
    'Audit confirms SAVE_VERSION snapshot',
    'Missing SAVE_VERSION snapshot',
  ) && ok;

  const store = readRepo('src/store/useGameStore.ts');
  const persist = readRepo('src/store/gamePersist.ts');
  ok = assert(
    checks,
    !store.includes('softLaunchCoreCompleteness') && !persist.includes('softLaunchCoreCompleteness'),
    'Runtime gameplay/store files not connected to audit',
    'Audit imported into runtime store/persist',
  ) && ok;

  const docs = readRepo(SOFT_LAUNCH_CORE_DOCS_PATH);
  ok = assert(checks, docs.length > 0, 'Docs file exists', 'Missing docs') && ok;
  for (const heading of [
    '## Amaç',
    '## Bu audit release readiness değildir',
    '## Oyuncu hissi odakları',
    '## Audit alanları',
    '## Bulgular',
    '## Soft launch öncesi must/should/optional işler',
    "## V1.1'e bırakılan işler",
    "## V2'ye bırakılan işler",
    "## Launch blocker'ları",
    '## Net karar',
    '## Sıradaki önerilen prompt',
  ]) {
    ok = assert(checks, docs.includes(heading), `Docs heading ${heading}`, `Missing docs heading ${heading}`) && ok;
  }

  const pkg = readRepo('package.json');
  ok = assert(
    checks,
    pkg.includes('"verify:soft-launch-core-completeness"'),
    'package.json script exists',
    'Missing package script',
  ) && ok;

  const markdown = buildSoftLaunchCoreCompletenessMarkdown(result);
  ok = assert(checks, markdown.includes('Crevia technical foundation strong.'), 'Markdown net decision language', 'Missing net decision') && ok;
  const consoleSummary = buildSoftLaunchCoreCompletenessConsoleSummary(result);
  ok = assert(checks, consoleSummary.length > 200, 'Console summary non-empty', 'Console summary too short') && ok;

  return {
    ok,
    checks,
    overallHealth: result.overallHealth,
    decision: result.softLaunchCoreDecision,
  };
}
