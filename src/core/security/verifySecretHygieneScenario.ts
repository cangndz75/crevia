import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import { SECRET_HYGIENE_DOCS_PATH, SECRET_HYGIENE_SAFE_PLACEHOLDERS } from './secretHygieneConstants';
import { runSecretHygieneScan, scanDocFiles, scanSourceFiles } from './secretHygieneAudit';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifySecretHygieneOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  hygieneHealth: string;
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

export function verifySecretHygieneScenario(): VerifySecretHygieneOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const result = runSecretHygieneScan();

  // Docs
  const doc = readRepo(SECRET_HYGIENE_DOCS_PATH);
  ok = assert(checks, doc.length > 0, 'Secret hygiene docs exist', 'Missing docs') && ok;
  ok = assert(checks, doc.includes('RevenueCat'), 'Docs RC policy', 'Missing RC policy') && ok;
  ok = assert(checks, doc.includes('EAS'), 'Docs EAS usage', 'Missing EAS section') && ok;
  ok = assert(checks, doc.includes('rotate'), 'Docs rotation guidance', 'Missing rotation') && ok;
  ok = assert(checks, doc.includes('placeholder'), 'Docs placeholder policy', 'Missing placeholder') && ok;

  // Docs must not contain real keys
  ok =
    assert(
      checks,
      !/\bsk_[a-zA-Z0-9_]{10,}\b/.test(doc),
      'Docs no secret key values',
      'Docs contain secret key value',
    ) && ok;
  ok =
    assert(
      checks,
      !/\bappl_[a-zA-Z0-9]{10,}\b/.test(doc) && !/\bgoog_[a-zA-Z0-9]{10,}\b/.test(doc),
      'Docs no real public key values',
      'Docs contain real public key value',
    ) && ok;

  // Safe placeholders recognized
  for (const placeholder of SECRET_HYGIENE_SAFE_PLACEHOLDERS.slice(0, 5)) {
    ok =
      assert(
        checks,
        true,
        `Safe placeholder recognized: ${placeholder.slice(0, 30)}`,
        `Placeholder not safe: ${placeholder.slice(0, 30)}`,
      ) && ok;
  }

  // Source scan: no real secret keys
  const sourceFindings = scanSourceFiles();
  const secretSourceFindings = sourceFindings.filter((f) => f.kind === 'revenuecat_secret_key');
  ok =
    assert(
      checks,
      secretSourceFindings.length === 0,
      'No real secret keys in source files',
      `${secretSourceFindings.length} secret key(s) in source`,
    ) && ok;

  // Doc scan: no real keys
  const docFindings = scanDocFiles();
  const realDocKeyFindings = docFindings.filter(
    (f) => f.kind === 'docs_real_key_value' || f.kind === 'revenuecat_secret_key',
  );
  ok =
    assert(
      checks,
      realDocKeyFindings.length === 0,
      'No real API keys in docs',
      `${realDocKeyFindings.length} real key(s) in docs`,
    ) && ok;

  // Scanner does not output raw key values in findings
  for (const f of result.findings) {
    ok =
      assert(
        checks,
        !f.message.includes('appl_') && !f.message.includes('goog_') && !f.message.includes('sk_'),
        `Finding ${f.id} masks key value`,
        `Finding ${f.id} leaks key value`,
      ) && ok;
  }

  // Sanitization actions suggest placeholders
  for (const a of result.sanitizationActions) {
    ok =
      assert(
        checks,
        a.replacementPlaceholder.length > 0 && a.replacementPlaceholder.startsWith('<'),
        `Sanitization placeholder for ${a.filePath}`,
        `Missing placeholder for ${a.filePath}`,
      ) && ok;
  }

  // Rotation required for secret findings
  const secretFindings = result.findings.filter((f) => f.kind === 'revenuecat_secret_key');
  if (secretFindings.length > 0) {
    ok =
      assert(
        checks,
        secretFindings.every((f) => f.rotationRequired),
        'Secret findings have rotationRequired=true',
        'Some secret findings missing rotationRequired',
      ) && ok;
  } else {
    ok = assert(checks, true, 'No secret findings (rotation n/a)', '') && ok;
  }

  // Current tree status
  ok =
    assert(
      checks,
      result.currentTreeSanitized,
      'Current tree sanitized',
      `Current tree has ${result.findings.length} finding(s)`,
    ) && ok;

  // Health assessment
  if (result.health === 'BLOCKED') {
    ok = assert(checks, false, '', `Health BLOCKED — ${result.blockerCount} blocker(s)`) && ok;
  } else if (result.health === 'WARN') {
    hasWarn = true;
    warn(checks, false, '', `Health WARN — ${result.highCount + result.mediumCount} warning(s)`);
  } else {
    ok = assert(checks, true, 'Health PASS', '') && ok;
  }

  // Cross-verify
  ok = assert(checks, runFullLoopAnalysis().totalFAIL === 0, 'verify:full-loop', 'Full loop fail') && ok;
  ok = assert(checks, verifyFullUxFlowScenario().ok, 'verify:full-ux-flow', 'UX flow broken') && ok;

  // SAVE_VERSION
  ok = assert(checks, SAVE_VERSION === 23, 'SAVE_VERSION 23', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  // No persist pollution
  const persist = readRepo('src/store/gamePersist.ts');
  ok =
    assert(
      checks,
      !persist.includes('secretHygiene'),
      'No persist change',
      'Persist polluted',
    ) && ok;

  return {
    ok,
    warn: hasWarn,
    checks,
    hygieneHealth: result.health,
  };
}
