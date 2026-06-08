import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { verifyIapManualSetupTrackerScenario } from '@/core/iapQa/verifyIapManualSetupTrackerScenario';
import { verifyIapSandboxReadinessScenario } from '@/core/iapQa/verifyIapSandboxReadinessScenario';
import { verifySoftLaunchReviewScenario } from '@/core/releaseReadiness/verifySoftLaunchReviewScenario';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import { runSecretHygieneScan } from './secretHygieneAudit';
import type { CreviaSecretHygieneResult } from './secretHygieneTypes';
import {
  buildSecretRotationClosureResult,
  buildSimulatedExposureRecord,
  collectSecretRotationBlockers,
  evaluateSecretRotationClosure,
  validateSecretRotationEvidence,
} from './secretRotationClosureAudit';
import { SECRET_ROTATION_CLOSURE_DOCS_PATH } from './secretRotationClosureConstants';
import type { CreviaSecretRotationEvidence } from './secretRotationClosureTypes';
import { verifySecretHygieneScenario } from './verifySecretHygieneScenario';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifySecretRotationClosureOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  closureHealth: string;
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function buildSanitizedHygieneWithSimulatedFinding(
  kind: 'revenuecat_secret_key' | 'revenuecat_public_key' | 'placeholder_safe',
): CreviaSecretHygieneResult {
  const base = runSecretHygieneScan();
  if (kind === 'placeholder_safe') {
    return { ...base, findings: [], currentTreeSanitized: true, rotationPending: false };
  }

  const finding =
    kind === 'revenuecat_secret_key'
      ? {
          id: 'sim.secret',
          kind: 'revenuecat_secret_key' as const,
          severity: 'blocker' as const,
          filePath: 'docs/simulated.md',
          title: 'Simulated secret',
          message: 'Simulated — value not shown.',
          recommendation: 'Rotate in dashboard.',
          rotationRequired: true,
        }
      : {
          id: 'sim.public',
          kind: 'revenuecat_public_key' as const,
          severity: 'medium' as const,
          filePath: 'docs/simulated.md',
          title: 'Simulated public key',
          message: 'Simulated — value not shown.',
          recommendation: 'Move to EAS.',
          rotationRequired: false,
        };

  return {
    ...base,
    findings: [finding],
    currentTreeSanitized: true,
    rotationPending: kind === 'revenuecat_secret_key',
  };
}

export function verifySecretRotationClosureScenario(): VerifySecretRotationClosureOutcome {
  const checks: string[] = [];
  let ok = true;

  const result = buildSecretRotationClosureResult();
  const doc = readRepo(SECRET_ROTATION_CLOSURE_DOCS_PATH);

  ok = assert(checks, doc.length > 0, 'Rotation closure docs exist', 'Missing docs') && ok;
  ok = assert(checks, doc.includes('raw key'), 'Docs raw key policy', 'Missing raw key rule') && ok;
  ok = assert(checks, doc.includes('RevenueCat'), 'Docs RC checklist', 'Missing RC section') && ok;
  ok = assert(checks, doc.includes('EAS'), 'Docs EAS checklist', 'Missing EAS section') && ok;
  ok =
    assert(
      checks,
      doc.toLowerCase().includes('public repo'),
      'Docs public repo policy',
      'Missing public repo',
    ) && ok;

  // Raw key never in model
  ok =
    assert(
      checks,
      result.exposureRecords.every((r) => r.rawValueStored === false),
      'Exposure rawValueStored false',
      'Exposure stores raw value',
    ) && ok;
  ok =
    assert(
      checks,
      result.exposureRecords.every((r) => r.rawValueMasked === false),
      'Exposure rawValueMasked false',
      'Exposure masks raw value in model',
    ) && ok;

  // Simulated secret exposure
  const secretExposure = buildSimulatedExposureRecord('revenuecat_secret_key', 'src/simulated.ts');
  ok =
    assert(
      checks,
      secretExposure.rotationRequired === true,
      'Secret key exposure rotationRequired true',
      'Secret exposure missing rotationRequired',
    ) && ok;
  ok =
    assert(
      checks,
      secretExposure.launchBlocking === true,
      'Secret key exposure launchBlocking true',
      'Secret exposure not launch blocking',
    ) && ok;

  // Public SDK key policy
  const publicExposure = buildSimulatedExposureRecord('revenuecat_public_key', 'docs/simulated.md');
  ok =
    assert(
      checks,
      publicExposure.rotationRequired === false,
      'Public SDK key rotationRequired false',
      'Public key incorrectly requires rotation',
    ) && ok;

  // Placeholder no rotation
  const placeholderExposure = buildSimulatedExposureRecord('placeholder_safe', 'docs/placeholder.md');
  ok =
    assert(
      checks,
      placeholderExposure.rotationRequired === false,
      'Placeholder rotation not required',
      'Placeholder triggers rotation',
    ) && ok;

  // Rotation required + evidence missing → blocker
  const hygieneWithSecret = buildSanitizedHygieneWithSimulatedFinding('revenuecat_secret_key');
  const closurePending = evaluateSecretRotationClosure({ hygiene: hygieneWithSecret, evidence: [] });
  ok =
    assert(
      checks,
      closurePending.blockers.some((b) => b.id === 'closure.rotation_required_pending'),
      'Rotation required + no evidence → blocker',
      'Missing rotation pending blocker',
    ) && ok;
  ok =
    assert(
      checks,
      closurePending.blockers.some((b) => b.id === 'closure.rotation_evidence_missing'),
      'Rotation evidence missing blocker',
      'Missing evidence blocker',
    ) && ok;

  // Evidence with raw key pattern → blocker
  const badEvidence: CreviaSecretRotationEvidence = {
    exposureId: 'simulated.exposure.revenuecat_secret_key',
    provider: 'RevenueCat',
    actionType: 'rotated',
    confirmedBy: 'tester',
    confirmationDateLabel: '2026-01-01',
    evidenceNote: 'rotated sk_live_abcdefghijklmnop',
    dashboardReferencePlaceholder: 'RevenueCat API Keys page',
    rawKeyIncluded: false,
    verifiedByAudit: false,
    manualOnly: true,
  };
  const badValidation = validateSecretRotationEvidence(badEvidence);
  ok =
    assert(
      checks,
      !badValidation.valid,
      'Evidence raw key pattern blocked',
      'Evidence with key pattern accepted',
    ) && ok;

  const blockersFromBadEvidence = collectSecretRotationBlockers(
    hygieneWithSecret,
    [secretExposure],
    [badEvidence],
  );
  ok =
    assert(
      checks,
      blockersFromBadEvidence.some((b) => b.id === 'closure.raw_key_evidence_blocked'),
      'Raw key evidence produces blocker',
      'Raw key evidence not blocked',
    ) && ok;

  // False positive without confirmedBy
  const falsePositiveEvidence: CreviaSecretRotationEvidence = {
    exposureId: 'simulated.exposure.suspicious_token',
    provider: 'Unknown',
    actionType: 'false_positive',
    confirmedBy: '',
    confirmationDateLabel: '2026-01-01',
    evidenceNote: 'Not a secret',
    dashboardReferencePlaceholder: 'N/A',
    rawKeyIncluded: false,
    verifiedByAudit: false,
    manualOnly: true,
  };
  const fpValidation = validateSecretRotationEvidence(falsePositiveEvidence);
  ok =
    assert(
      checks,
      !fpValidation.valid,
      'False positive needs confirmedBy',
      'False positive accepted without confirmedBy',
    ) && ok;

  const fpExposure = buildSimulatedExposureRecord('suspicious_token', 'src/unknown.ts');
  const hygieneWithSuspicious: CreviaSecretHygieneResult = {
    ...buildSanitizedHygieneWithSimulatedFinding('placeholder_safe'),
    findings: [
      {
        id: 'sim.suspicious',
        kind: 'suspicious_token',
        severity: 'high',
        filePath: 'src/unknown.ts',
        title: 'Suspicious token',
        message: 'Simulated — value not shown.',
        recommendation: 'Manual review.',
        rotationRequired: true,
      },
    ],
  };
  const fpClosure = evaluateSecretRotationClosure({
    hygiene: hygieneWithSuspicious,
    evidence: [{ ...falsePositiveEvidence, exposureId: `exposure.sim.suspicious`, confirmedBy: 'reviewer' }],
  });
  ok =
    assert(
      checks,
      fpClosure.blockers.some((b) => b.id === 'closure.false_positive_unverified'),
      'False positive unverified stays blocked',
      'False positive closed without verification',
    ) && ok;

  // Dirty tree blocks closure
  const dirtyHygiene: CreviaSecretHygieneResult = {
    ...runSecretHygieneScan(),
    currentTreeSanitized: false,
    health: 'BLOCKED',
    findings: [
      {
        id: 'dirty.secret',
        kind: 'revenuecat_secret_key',
        severity: 'blocker',
        filePath: 'src/dirty.ts',
        title: 'Dirty',
        message: 'Value not shown.',
        recommendation: 'Remove.',
        rotationRequired: true,
      },
    ],
  };
  const dirtyClosure = evaluateSecretRotationClosure({ hygiene: dirtyHygiene });
  ok =
    assert(
      checks,
      dirtyClosure.blockers.some((b) => b.id === 'closure.current_tree_dirty'),
      'Dirty tree blocks closure',
      'Dirty tree did not block',
    ) && ok;

  // Clean tree + no rotation → not_required / PASS
  ok =
    assert(
      checks,
      result.currentTreeSanitized,
      'Current tree sanitized',
      'Current tree not sanitized',
    ) && ok;
  ok =
    assert(
      checks,
      !result.rotationRequired || result.rotationVerifiedClosed,
      'Rotation not required or verified closed',
      'Rotation pending without closure',
    ) && ok;

  if (result.health === 'BLOCKED' && result.exposureCount === 0 && result.currentTreeSanitized) {
    ok = assert(checks, false, '', 'Unexpected BLOCKED with no exposures') && ok;
  } else if (result.health === 'PASS') {
    ok = assert(checks, true, 'Closure health PASS', '') && ok;
  }

  // Cross-verify
  ok = assert(checks, verifySecretHygieneScenario().ok, 'verify:secret-hygiene', 'Hygiene broken') && ok;
  ok =
    assert(
      checks,
      verifyIapManualSetupTrackerScenario().ok,
      'verify:iap-manual-setup-tracker',
      'Manual tracker broken',
    ) && ok;
  ok =
    assert(
      checks,
      verifyIapSandboxReadinessScenario().ok,
      'verify:iap-sandbox-readiness',
      'Sandbox readiness broken',
    ) && ok;
  ok =
    assert(checks, verifySoftLaunchReviewScenario().ok, 'verify:soft-launch-review', 'Review broken') && ok;
  ok = assert(checks, runFullLoopAnalysis().totalFAIL === 0, 'verify:full-loop', 'Full loop fail') && ok;
  ok = assert(checks, verifyFullUxFlowScenario().ok, 'verify:full-ux-flow', 'UX flow broken') && ok;
  ok = assert(checks, SAVE_VERSION === 25, 'SAVE_VERSION 23', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  const persist = readRepo('src/store/gamePersist.ts');
  ok =
    assert(
      checks,
      !persist.includes('secretRotationClosure'),
      'No persist change',
      'Persist polluted',
    ) && ok;

  return {
    ok,
    warn: false,
    checks,
    closureHealth: result.health,
  };
}
