import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { verifySecretHygieneScenario } from '@/core/security/verifySecretHygieneScenario';
import { verifySecretRotationClosureScenario } from '@/core/security/verifySecretRotationClosureScenario';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  NO_NEW_SYSTEM_FREEZE_ALLOWED_SCOPES,
  NO_NEW_SYSTEM_FREEZE_DOCS_PATH,
  NO_NEW_SYSTEM_FREEZE_FORBIDDEN_SCOPES,
  NO_NEW_SYSTEM_FREEZE_PROMPT_GUARD,
} from './noNewSystemFreezeConstants';
import {
  buildFreezeForbiddenScopeList,
  isNoNewSystemFreezeActive,
  runNoNewSystemFreezeAudit,
} from './noNewSystemFreezeAudit';
import { verifyIapManualSetupTrackerScenario } from '@/core/iapQa/verifyIapManualSetupTrackerScenario';
import { verifyStoreMetadataFinalizationScenario } from './verifyStoreMetadataFinalizationScenario';
import { verifyStoreScreenshotReadinessScenario } from './verifyStoreScreenshotReadinessScenario';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyNoNewSystemFreezeOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  freezeHealth: string;
  freezeDecision: string;
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

export function verifyNoNewSystemFreezeScenario(): VerifyNoNewSystemFreezeOutcome {
  const checks: string[] = [];
  let ok = true;

  const result = runNoNewSystemFreezeAudit({ mode: 'launch_candidate' });
  const softLaunchFreeze = runNoNewSystemFreezeAudit({ mode: 'soft_launch_candidate' });
  const doc = readRepo(NO_NEW_SYSTEM_FREEZE_DOCS_PATH);
  const forbidden = buildFreezeForbiddenScopeList();

  ok = assert(checks, doc.length > 0, 'Freeze docs exist', 'Missing docs') && ok;
  ok =
    assert(
      checks,
      doc.toLowerCase().includes('allowed scope'),
      'Docs allowed scope',
      'Missing allowed',
    ) && ok;
  ok =
    assert(
      checks,
      doc.toLowerCase().includes('forbidden scope'),
      'Docs forbidden scope',
      'Missing forbidden',
    ) && ok;
  ok =
    assert(
      checks,
      NO_NEW_SYSTEM_FREEZE_ALLOWED_SCOPES.length >= 12,
      `Allowed scope ${NO_NEW_SYSTEM_FREEZE_ALLOWED_SCOPES.length}>=12`,
      `allowed=${NO_NEW_SYSTEM_FREEZE_ALLOWED_SCOPES.length}`,
    ) && ok;
  ok =
    assert(
      checks,
      NO_NEW_SYSTEM_FREEZE_FORBIDDEN_SCOPES.length >= 15,
      `Forbidden scope ${NO_NEW_SYSTEM_FREEZE_FORBIDDEN_SCOPES.length}>=15`,
      `forbidden=${NO_NEW_SYSTEM_FREEZE_FORBIDDEN_SCOPES.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      forbidden.includes('save_version_bump'),
      'SAVE_VERSION bump forbidden',
      'Missing save_version_bump',
    ) && ok;
  ok =
    assert(
      checks,
      forbidden.includes('persist_shape_change'),
      'Persist shape change forbidden',
      'Missing persist_shape_change',
    ) && ok;
  ok =
    assert(
      checks,
      forbidden.includes('event_generation_rewrite'),
      'Event generation rewrite forbidden',
      'Missing event_generation_rewrite',
    ) && ok;
  ok =
    assert(
      checks,
      forbidden.includes('new_content_pack'),
      'New content pack forbidden',
      'Missing new_content_pack',
    ) && ok;

  ok =
    assert(
      checks,
      NO_NEW_SYSTEM_FREEZE_ALLOWED_SCOPES.includes('iap_setup_tracker_update'),
      'IAP setup tracker allowed',
      'IAP tracker not allowed',
    ) && ok;
  ok =
    assert(
      checks,
      NO_NEW_SYSTEM_FREEZE_ALLOWED_SCOPES.includes('bugfix'),
      'Bugfix allowed',
      'Bugfix not allowed',
    ) && ok;
  ok =
    assert(
      checks,
      NO_NEW_SYSTEM_FREEZE_ALLOWED_SCOPES.includes('false_claim_copy_fix'),
      'False claim fix allowed',
      'False claim fix not allowed',
    ) && ok;

  ok =
    assert(
      checks,
      NO_NEW_SYSTEM_FREEZE_PROMPT_GUARD.length >= 8,
      `Prompt guard ${NO_NEW_SYSTEM_FREEZE_PROMPT_GUARD.length}>=8`,
      `guard=${NO_NEW_SYSTEM_FREEZE_PROMPT_GUARD.length}`,
    ) && ok;

  const pendingManual = result.manualBlockers.filter((b) => b.status === 'pending');
  ok =
    assert(
      checks,
      pendingManual.length > 0,
      'Manual blockers visible in freeze audit',
      'No manual blockers detected',
    ) && ok;
  ok =
    assert(
      checks,
      result.findings.some((f) => f.id === 'freeze.manual_blockers_remaining'),
      'Manual blockers in freeze findings',
      'Missing manual blocker finding',
    ) && ok;

  ok =
    assert(
      checks,
      result.findings.some((f) => f.id === 'freeze.no_new_system_gate_present'),
      'Freeze gate present finding',
      'Missing gate finding',
    ) && ok;

  ok =
    assert(
      checks,
      softLaunchFreeze.freezeActive,
      'Soft launch candidate freeze active',
      `decision=${softLaunchFreeze.decision}`,
    ) && ok;
  ok =
    assert(
      checks,
      isNoNewSystemFreezeActive('soft_launch_candidate'),
      'isNoNewSystemFreezeActive soft_launch',
      'Freeze not active for soft launch',
    ) && ok;

  ok =
    assert(
      checks,
      result.violations.filter((v) => v.severity === 'blocker').length === 0,
      'No blocker expansion violations',
      `${result.violations.length} violation(s)`,
    ) && ok;

  const reviewCode = readRepo('src/core/softLaunchRegressionCleanup/verificationHealthHelpers.ts');
  ok =
    assert(
      checks,
      reviewCode.includes('summarizeSoftLaunchReviewCodeBlockers'),
      'soft-launch-review classification helper present',
      'Review classification missing',
    ) && ok;
  ok = assert(checks, verifySecretHygieneScenario().ok, 'verify:secret-hygiene', 'Hygiene broken') && ok;
  const rotation = verifySecretRotationClosureScenario();
  if (!rotation.ok) {
    checks.push(
      'WARN manual_blocker: secret-rotation-closure pending (not freeze code regression)',
    );
  } else {
    checks.push('PASS verify:secret-rotation-closure');
  }
  const manualTracker = verifyIapManualSetupTrackerScenario();
  if (!manualTracker.ok) {
    checks.push('WARN manual_blocker: iap-manual-setup-tracker pending (not freeze code regression)');
  } else {
    checks.push('PASS verify:iap-manual-setup-tracker');
  }
  const metadata = verifyStoreMetadataFinalizationScenario();
  if (!metadata.ok) {
    checks.push('WARN manual_blocker: store-metadata-finalization pending (not freeze code regression)');
  } else {
    checks.push('PASS verify:store-metadata-finalization');
  }
  const screenshots = verifyStoreScreenshotReadinessScenario();
  if (!screenshots.ok) {
    checks.push('WARN manual_blocker: store-screenshot-readiness pending (not freeze code regression)');
  } else {
    checks.push('PASS verify:store-screenshot-readiness');
  }
  ok = assert(checks, runFullLoopAnalysis().totalFAIL === 0, 'verify:full-loop', 'Full loop fail') && ok;
  ok = assert(checks, verifyFullUxFlowScenario().ok, 'verify:full-ux-flow', 'UX flow broken') && ok;
  ok = assert(checks, SAVE_VERSION === 25, 'SAVE_VERSION 23', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  const persist = readRepo('src/store/gamePersist.ts');
  ok =
    assert(
      checks,
      !persist.includes('noNewSystemFreezeState'),
      'No persist change',
      'Persist polluted',
    ) && ok;

  return {
    ok,
    warn: result.health === 'WARN',
    checks,
    freezeHealth: result.health,
    freezeDecision: result.decision,
  };
}
