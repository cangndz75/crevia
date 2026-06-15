import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  BUILD_PREP_APP_CONFIG_PATH,
  BUILD_PREP_EAS_CONFIG_PATH,
  BUILD_PREP_ENV_EXAMPLE_PATH,
  BUILD_PREP_EXPECTED_SAVE_VERSION,
  BUILD_PREP_FOUNDATION_DOC,
  BUILD_PREP_PRIVACY_CHECKLIST,
  BUILD_PREP_REQUIRED_EAS_PROFILES,
  BUILD_PREP_STORE_METADATA_CHECKLIST,
  BUILD_PREP_VERSIONING_POLICY_SECTION,
} from './buildPrepConstants';
import { runBuildPrepAudit } from './buildPrepAudit';

export type VerifyBuildPrepOutcome = {
  ok: boolean;
  checks: string[];
  auditHealth: string;
};

const REPO_ROOT = join(__dirname, '..', '..', '..');

function assert(checks: string[], pass: boolean, ok: string, fail?: string): boolean {
  checks.push(pass ? `PASS ${ok}` : `FAIL ${fail ?? ok}`);
  return pass;
}

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function parseJsonSafe(content: string): unknown | null {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function runNpmScript(script: string): { ok: boolean; detail: string } {
  try {
    execSync(`npm run ${script}`, {
      cwd: REPO_ROOT,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 180_000,
    });
    return { ok: true, detail: `${script} passed.` };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    const detail =
      [err.stdout, err.stderr, err.message].filter(Boolean).join('\n').trim().slice(0, 400) ||
      `${script} failed.`;
    return { ok: false, detail };
  }
}

export function verifyBuildPrepScenario(): VerifyBuildPrepOutcome {
  const checks: string[] = [];
  let ok = true;

  const appRaw = readRepo(BUILD_PREP_APP_CONFIG_PATH);
  const easRaw = readRepo(BUILD_PREP_EAS_CONFIG_PATH);
  const appConfig = parseJsonSafe(appRaw);
  const easConfig = parseJsonSafe(easRaw) as { build?: Record<string, unknown> } | null;

  ok =
    assert(checks, Boolean(appConfig), 'app.json parses safely', 'app.json parse failed') && ok;
  ok =
    assert(
      checks,
      Boolean(easConfig),
      'eas.json parses safely',
      'eas.json parse failed',
    ) && ok;

  for (const profile of BUILD_PREP_REQUIRED_EAS_PROFILES) {
    ok =
      assert(
        checks,
        Boolean(easConfig?.build?.[profile]),
        `EAS profile "${profile}" exists`,
        `missing EAS profile "${profile}"`,
      ) && ok;
  }

  const expo = (appConfig as { expo?: Record<string, unknown> })?.expo as
    | {
        version?: string;
        ios?: { buildNumber?: string; bundleIdentifier?: string };
        android?: { versionCode?: number; package?: string };
      }
    | undefined;

  ok =
    assert(
      checks,
      Boolean(expo?.version),
      'expo.version present',
      'expo.version missing',
    ) && ok;
  ok =
    assert(
      checks,
      Boolean(expo?.ios?.buildNumber) || readRepo(BUILD_PREP_FOUNDATION_DOC).includes('buildNumber'),
      'iOS buildNumber present or documented',
      'iOS buildNumber missing',
    ) && ok;
  ok =
    assert(
      checks,
      typeof expo?.android?.versionCode === 'number' ||
        readRepo(BUILD_PREP_FOUNDATION_DOC).includes('versionCode'),
      'Android versionCode present or documented',
      'Android versionCode missing',
    ) && ok;

  ok =
    assert(
      checks,
      existsSync(join(REPO_ROOT, BUILD_PREP_STORE_METADATA_CHECKLIST)),
      'store metadata checklist exists',
      'store metadata checklist missing',
    ) && ok;
  ok =
    assert(
      checks,
      existsSync(join(REPO_ROOT, BUILD_PREP_PRIVACY_CHECKLIST)),
      'privacy/data safety checklist exists',
      'privacy checklist missing',
    ) && ok;

  const foundationDoc = readRepo(BUILD_PREP_FOUNDATION_DOC);
  ok =
    assert(
      checks,
      foundationDoc.includes(BUILD_PREP_VERSIONING_POLICY_SECTION) &&
        foundationDoc.includes('SAVE_VERSION') &&
        foundationDoc.includes(String(BUILD_PREP_EXPECTED_SAVE_VERSION)),
      'SAVE_VERSION vs app version documented',
      'SAVE_VERSION/app version distinction missing in foundation doc',
    ) && ok;

  const envExample = readRepo(BUILD_PREP_ENV_EXAMPLE_PATH);
  const envHasSecrets =
    /sk_live_|sk_test_|rcsk_|-----BEGIN/.test(envExample) &&
    !envExample.includes('REPLACE_WITH');
  ok =
    assert(
      checks,
      !envHasSecrets,
      '.env.example has no committed secrets',
      'secret-like values in .env.example',
    ) && ok;

  const gamePersist = readRepo('src/store/gamePersist.ts');
  const saveVersionMatch = gamePersist.match(/SAVE_VERSION:\s*number\s*=\s*(\d+)/);
  const currentSaveVersion = saveVersionMatch ? Number(saveVersionMatch[1]) : -1;
  ok =
    assert(
      checks,
      currentSaveVersion === BUILD_PREP_EXPECTED_SAVE_VERSION,
      `SAVE_VERSION unchanged (${BUILD_PREP_EXPECTED_SAVE_VERSION})`,
      `SAVE_VERSION changed: ${currentSaveVersion}`,
    ) && ok;

  ok =
    assert(
      checks,
      !gamePersist.includes('// BUILD_PREP_MUTATION'),
      'gamePersist not mutated by build prep pass',
      'gamePersist mutation marker found',
    ) && ok;

  const typecheck = runNpmScript('typecheck:tsc');
  ok = assert(checks, typecheck.ok, typecheck.detail, typecheck.detail) && ok;

  const finalUi = runNpmScript('verify:final-ui-visual-unification');
  ok = assert(checks, finalUi.ok, finalUi.detail, finalUi.detail) && ok;

  const audit = runBuildPrepAudit();
  ok =
    assert(
      checks,
      audit.failCount === 0,
      `build prep audit has no FAIL (${audit.warnCount} WARN)`,
      `build prep audit FAIL count: ${audit.failCount}`,
    ) && ok;

  return {
    ok,
    checks,
    auditHealth: audit.health,
  };
}
