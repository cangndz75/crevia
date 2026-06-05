import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { runSecretHygieneScan } from './secretHygieneAudit';
import type { CreviaSecretHygieneResult, CreviaSecretScanFinding } from './secretHygieneTypes';
import {
  SECRET_PROVIDER_POLICIES,
  SECRET_ROTATION_CLOSURE_DOCS_PATH,
  SECRET_ROTATION_EVIDENCE_REGISTRY,
  SECRET_ROTATION_HISTORICAL_EXPOSURE_REGISTRY,
  SECRET_ROTATION_PUBLIC_REPO_EXPOSURE_FLAG,
  SECRET_ROTATION_RAW_KEY_PATTERNS,
} from './secretRotationClosureConstants';
import type {
  CreviaSecretClosureBlocker,
  CreviaSecretClosureWarning,
  CreviaSecretExposureRecord,
  CreviaSecretRotationClosureResult,
  CreviaSecretRotationEvidence,
  CreviaSecretRotationHealthStatus,
  CreviaSecretRotationStatus,
} from './secretRotationClosureTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function sourceAreaFromPath(filePath: string): CreviaSecretExposureRecord['sourceArea'] {
  if (filePath.startsWith('docs/')) return 'docs';
  if (filePath.includes('.env')) return 'env';
  if (filePath.length > 0) return 'source';
  return 'unknown';
}

function resolveRotationStatus(
  exposure: Pick<CreviaSecretExposureRecord, 'id' | 'rotationRequired' | 'findingKind'>,
  evidence: CreviaSecretRotationEvidence[],
): CreviaSecretRotationStatus {
  if (!exposure.rotationRequired) return 'not_required';

  const match = evidence.find((e) => e.exposureId === exposure.id);
  if (!match) return 'required_pending';

  if (match.actionType === 'false_positive' || match.actionType === 'reviewed_not_secret') {
    return match.verifiedByAudit || !match.manualOnly ? 'verified_closed' : 'required_pending';
  }

  if (match.actionType === 'revoked') {
    return match.verifiedByAudit ? 'verified_closed' : 'revoked_pending_verification';
  }

  if (match.actionType === 'rotated') {
    return match.verifiedByAudit ? 'verified_closed' : 'rotated_pending_verification';
  }

  return 'blocked_unknown_exposure';
}

export function validateSecretRotationEvidence(
  evidence: CreviaSecretRotationEvidence,
): { valid: boolean; blockers: string[] } {
  const blockers: string[] = [];

  if (evidence.rawKeyIncluded !== false) {
    blockers.push('Evidence must not include raw key values.');
  }

  for (const pattern of SECRET_ROTATION_RAW_KEY_PATTERNS) {
    if (pattern.test(evidence.evidenceNote)) {
      blockers.push('Evidence note contains key-like pattern.');
    }
    if (pattern.test(evidence.dashboardReferencePlaceholder)) {
      blockers.push('Dashboard reference contains key-like pattern.');
    }
  }

  if (
    (evidence.actionType === 'false_positive' || evidence.actionType === 'reviewed_not_secret') &&
    !evidence.confirmedBy.trim()
  ) {
    blockers.push('False positive closure requires confirmedBy.');
  }

  return { valid: blockers.length === 0, blockers };
}

export function buildExposureRecordsFromSecretHygiene(
  hygiene: CreviaSecretHygieneResult,
): CreviaSecretExposureRecord[] {
  const records: CreviaSecretExposureRecord[] = [];

  for (const finding of hygiene.findings) {
    if (finding.kind === 'placeholder_safe') continue;
    records.push(exposureRecordFromFinding(finding, 'secret_hygiene_scan'));
  }

  for (const historical of SECRET_ROTATION_HISTORICAL_EXPOSURE_REGISTRY) {
    records.push({
      ...historical,
      rotationStatus: 'required_pending',
    });
  }

  if (SECRET_ROTATION_PUBLIC_REPO_EXPOSURE_FLAG && hygiene.currentTreeSanitized) {
    records.push({
      id: 'exposure.public_repo_historical',
      findingKind: 'generic_api_key',
      sourceFile: 'git-history',
      sourceArea: 'historical',
      detectedBy: 'public_repo_exposure_flag',
      detectedAtLabel: 'historical',
      rawValueStored: false,
      rawValueMasked: false,
      provider: SECRET_PROVIDER_POLICIES.generic_api_key.provider,
      rotationRequired: true,
      rotationStatus: 'required_pending',
      manualActionRequired: true,
      launchBlocking: true,
      notes: 'Public repo exposure flag set — rotation required until evidence closed.',
    });
  }

  return records;
}

function exposureRecordFromFinding(
  finding: CreviaSecretScanFinding,
  detectedBy: string,
): CreviaSecretExposureRecord {
  const policy = SECRET_PROVIDER_POLICIES[finding.kind];

  return {
    id: `exposure.${finding.id}`,
    findingKind: finding.kind,
    sourceFile: finding.filePath,
    sourceArea: sourceAreaFromPath(finding.filePath),
    detectedBy,
    detectedAtLabel: 'current_scan',
    rawValueStored: false,
    rawValueMasked: false,
    provider: policy.provider,
    rotationRequired: policy.rotationRequired || finding.rotationRequired,
    rotationStatus: policy.rotationRequired || finding.rotationRequired ? 'required_pending' : 'not_required',
    manualActionRequired: policy.manualActionRequired,
    launchBlocking: policy.launchBlocking,
    notes: finding.recommendation,
  };
}

function applyEvidenceToRecords(
  records: CreviaSecretExposureRecord[],
  evidence: CreviaSecretRotationEvidence[],
): CreviaSecretExposureRecord[] {
  return records.map((record) => ({
    ...record,
    rotationStatus: resolveRotationStatus(record, evidence),
  }));
}

export function collectSecretRotationBlockers(
  hygiene: CreviaSecretHygieneResult,
  exposureRecords: CreviaSecretExposureRecord[],
  evidence: CreviaSecretRotationEvidence[],
): CreviaSecretClosureBlocker[] {
  const blockers: CreviaSecretClosureBlocker[] = [];

  if (!hygiene.currentTreeSanitized) {
    blockers.push({
      id: 'closure.current_tree_dirty',
      title: 'Current tree not sanitized',
      message: 'Secret hygiene scan must PASS before rotation closure can proceed.',
      recommendation: 'Run verify:secret-hygiene and sanitize findings first.',
    });
  }

  for (const ev of evidence) {
    const validation = validateSecretRotationEvidence(ev);
    if (!validation.valid) {
      blockers.push({
        id: 'closure.raw_key_evidence_blocked',
        title: 'Evidence contains raw key or invalid closure',
        message: validation.blockers.join(' '),
        recommendation: 'Remove key values from evidence; use file path + action type only.',
      });
    }
  }

  const pendingLaunchBlocking = exposureRecords.filter(
    (r) =>
      r.launchBlocking &&
      r.rotationRequired &&
      r.rotationStatus !== 'verified_closed' &&
      r.rotationStatus !== 'not_required',
  );

  if (pendingLaunchBlocking.length > 0) {
    blockers.push({
      id: 'closure.rotation_required_pending',
      title: 'Rotation required pending',
      message: `${pendingLaunchBlocking.length} exposure(s) require provider rotation/revoke with evidence.`,
      recommendation: 'Complete manual rotation checklist in docs/crevia-secret-rotation-closure.md.',
    });
  }

  const missingEvidence = exposureRecords.filter(
    (r) =>
      r.rotationRequired &&
      r.rotationStatus === 'required_pending',
  );

  if (missingEvidence.length > 0 && hygiene.currentTreeSanitized) {
    blockers.push({
      id: 'closure.rotation_evidence_missing',
      title: 'Rotation evidence missing',
      message: `${missingEvidence.length} exposure(s) lack verified closure evidence.`,
      recommendation: 'Record manual evidence after dashboard revoke/rotate — no raw keys.',
    });
  }

  const falsePositivePending = exposureRecords.filter((r) => {
    const ev = evidence.find((e) => e.exposureId === r.id);
    return (
      ev?.actionType === 'false_positive' &&
      !ev.verifiedByAudit &&
      ev.manualOnly &&
      r.rotationStatus !== 'verified_closed'
    );
  });

  if (falsePositivePending.length > 0) {
    blockers.push({
      id: 'closure.false_positive_unverified',
      title: 'False positive closure unverified',
      message: 'False positive claims require manual evidence before closure.',
      recommendation: 'Add confirmedBy + evidenceNote without raw key values.',
    });
  }

  return blockers;
}

export function collectSecretRotationWarnings(
  hygiene: CreviaSecretHygieneResult,
  exposureRecords: CreviaSecretExposureRecord[],
): CreviaSecretClosureWarning[] {
  const warnings: CreviaSecretClosureWarning[] = [];

  const publicKeyExposure = exposureRecords.filter(
    (r) => r.findingKind === 'revenuecat_public_key' || r.findingKind === 'docs_real_key_value',
  );

  if (publicKeyExposure.length > 0) {
    warnings.push({
      id: 'closure.public_key_manual_review',
      title: 'Public SDK key exposure — manual review recommended',
      message: `${publicKeyExposure.length} public key exposure(s) detected.`,
      recommendation: 'Move to EAS secrets; rotate if key was publicly exposed.',
    });
  }

  const pendingVerification = exposureRecords.filter(
    (r) =>
      r.rotationStatus === 'revoked_pending_verification' ||
      r.rotationStatus === 'rotated_pending_verification',
  );

  if (pendingVerification.length > 0) {
    warnings.push({
      id: 'closure.pending_verification',
      title: 'Rotation pending verification',
      message: `${pendingVerification.length} exposure(s) have evidence but await audit verification.`,
      recommendation: 'Re-run secret hygiene scan and confirm old key disabled.',
    });
  }

  if (SECRET_ROTATION_PUBLIC_REPO_EXPOSURE_FLAG && hygiene.currentTreeSanitized) {
    warnings.push({
      id: 'closure.public_repo_exposure_flag',
      title: 'Public repo exposure flag active',
      message: 'Historical public push assumed — rotation required until evidence closed.',
      recommendation: 'Rotate all exposed keys in provider dashboards.',
    });
  }

  return warnings;
}

export function buildSecretRotationNextActions(
  hygiene: CreviaSecretHygieneResult,
  exposureRecords: CreviaSecretExposureRecord[],
  blockers: CreviaSecretClosureBlocker[],
): string[] {
  const actions: string[] = [];

  if (!hygiene.currentTreeSanitized) {
    actions.push('URGENT: Sanitize current tree — run verify:secret-hygiene.');
    return actions;
  }

  if (blockers.some((b) => b.id === 'closure.raw_key_evidence_blocked')) {
    actions.push('Remove raw key values from rotation evidence immediately.');
  }

  const pending = exposureRecords.filter((r) => r.rotationStatus === 'required_pending');
  for (const record of pending.slice(0, 5)) {
    const policy = SECRET_PROVIDER_POLICIES[record.findingKind];
    actions.push(`${record.provider}: ${policy.manualAction}`);
  }

  if (exposureRecords.every((r) => r.rotationStatus === 'not_required' || r.rotationStatus === 'verified_closed')) {
    actions.push('Rotation closure complete — proceed with IAP sandbox setup when ready.');
  }

  return actions;
}

function computeHealth(
  hygiene: CreviaSecretHygieneResult,
  blockers: CreviaSecretClosureBlocker[],
  warnings: CreviaSecretClosureWarning[],
): CreviaSecretRotationHealthStatus {
  if (!hygiene.currentTreeSanitized || blockers.length > 0) return 'BLOCKED';
  if (warnings.length > 0) return 'WARN';
  return 'PASS';
}

export type SecretRotationClosureInput = {
  hygiene: CreviaSecretHygieneResult;
  evidence?: CreviaSecretRotationEvidence[];
};

export function evaluateSecretRotationClosure(
  input: SecretRotationClosureInput,
): CreviaSecretRotationClosureResult {
  const evidence = input.evidence ?? [...SECRET_ROTATION_EVIDENCE_REGISTRY];
  const rawRecords = buildExposureRecordsFromSecretHygiene(input.hygiene);
  const recordsWithEvidence = applyEvidenceToRecords(rawRecords, evidence);

  const blockers = collectSecretRotationBlockers(input.hygiene, recordsWithEvidence, evidence);
  const warnings = collectSecretRotationWarnings(input.hygiene, recordsWithEvidence);
  const nextActions = buildSecretRotationNextActions(input.hygiene, recordsWithEvidence, blockers);

  const rotationRequired = recordsWithEvidence.some((r) => r.rotationRequired);
  const pendingRotationCount = recordsWithEvidence.filter(
    (r) =>
      r.rotationRequired &&
      r.rotationStatus !== 'verified_closed' &&
      r.rotationStatus !== 'not_required',
  ).length;
  const rotationEvidencePresent = evidence.length > 0;
  const rotationVerifiedClosed =
    !rotationRequired ||
    recordsWithEvidence
      .filter((r) => r.rotationRequired)
      .every((r) => r.rotationStatus === 'verified_closed');

  const health = computeHealth(input.hygiene, blockers, warnings);

  return {
    health,
    exposureRecords: recordsWithEvidence,
    rotationActions: [],
    evidence,
    blockers,
    warnings,
    nextActions,
    currentTreeSanitized: input.hygiene.currentTreeSanitized,
    rotationRequired,
    rotationEvidencePresent,
    rotationVerifiedClosed,
    closureCanProceed: input.hygiene.currentTreeSanitized && blockers.length === 0,
    publicRepoExposureFlag: SECRET_ROTATION_PUBLIC_REPO_EXPOSURE_FLAG,
    exposureCount: recordsWithEvidence.length,
    pendingRotationCount,
    docsPath: SECRET_ROTATION_CLOSURE_DOCS_PATH,
  };
}

export function buildSecretRotationClosureResult(): CreviaSecretRotationClosureResult {
  return evaluateSecretRotationClosure({ hygiene: runSecretHygieneScan() });
}

export function summarizeSecretRotationClosure(result: CreviaSecretRotationClosureResult): string {
  return [
    `Health: ${result.health}`,
    `Exposures: ${result.exposureCount}`,
    `Pending rotation: ${result.pendingRotationCount}`,
    `Current tree sanitized: ${result.currentTreeSanitized}`,
    `Rotation required: ${result.rotationRequired}`,
    `Evidence present: ${result.rotationEvidencePresent}`,
    `Verified closed: ${result.rotationVerifiedClosed}`,
    `Closure can proceed: ${result.closureCanProceed}`,
    `Blockers: ${result.blockers.length}`,
  ].join(' | ');
}

export function assertSecretRotationClosureIntegrity(): { ok: boolean; exposureCount: number } {
  const result = buildSecretRotationClosureResult();
  const allNoRawValues = result.exposureRecords.every(
    (r) => r.rawValueStored === false && r.rawValueMasked === false,
  );
  return {
    ok: existsSync(join(REPO_ROOT, SECRET_ROTATION_CLOSURE_DOCS_PATH)) && allNoRawValues,
    exposureCount: result.exposureCount,
  };
}

/** Verify helper: simulate exposure without storing raw values. */
export function buildSimulatedExposureRecord(
  kind: CreviaSecretExposureRecord['findingKind'],
  sourceFile: string,
): CreviaSecretExposureRecord {
  const policy = SECRET_PROVIDER_POLICIES[kind];
  return {
    id: `simulated.exposure.${kind}`,
    findingKind: kind,
    sourceFile,
    sourceArea: sourceAreaFromPath(sourceFile),
    detectedBy: 'verify_simulation',
    detectedAtLabel: 'simulated',
    rawValueStored: false,
    rawValueMasked: false,
    provider: policy.provider,
    rotationRequired: policy.rotationRequired,
    rotationStatus: policy.rotationRequired ? 'required_pending' : 'not_required',
    manualActionRequired: policy.manualActionRequired,
    launchBlocking: policy.launchBlocking,
    notes: 'Simulated exposure for verify — no raw value stored.',
  };
}
