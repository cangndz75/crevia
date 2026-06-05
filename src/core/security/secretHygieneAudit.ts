import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  SECRET_HYGIENE_DOC_FILES,
  SECRET_HYGIENE_DOCS_PATH,
  SECRET_HYGIENE_SOURCE_FILES,
  SECRET_PATTERN_REFERENCE_ALLOWLIST,
  SECRET_REAL_KEY_PATTERNS,
  SECRET_HYGIENE_SAFE_PLACEHOLDERS,
} from './secretHygieneConstants';
import type {
  CreviaSecretFindingKind,
  CreviaSecretFindingSeverity,
  CreviaSecretHygieneHealthStatus,
  CreviaSecretHygieneResult,
  CreviaSecretRotationRequirement,
  CreviaSecretSanitizationAction,
  CreviaSecretScanFinding,
} from './secretHygieneTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepoFile(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function isSafePlaceholder(value: string): boolean {
  const lower = value.toLowerCase();
  return SECRET_HYGIENE_SAFE_PLACEHOLDERS.some((p) => lower.includes(p.toLowerCase()));
}

function isPatternReference(line: string): boolean {
  return SECRET_PATTERN_REFERENCE_ALLOWLIST.some((pattern) => pattern.test(line));
}

function findRealKeyOccurrences(
  content: string,
  filePath: string,
  patternName: string,
  pattern: RegExp,
  kind: CreviaSecretFindingKind,
  severity: CreviaSecretFindingSeverity,
  rotationRequired: boolean,
): CreviaSecretScanFinding[] {
  const findings: CreviaSecretScanFinding[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const match = pattern.exec(line);
    if (!match) continue;

    const matchedValue = match[0];

    if (isSafePlaceholder(matchedValue)) continue;
    if (isPatternReference(line)) continue;

    findings.push({
      id: `secret.${patternName}.${filePath.replace(/[/\\]/g, '_')}.L${i + 1}`,
      kind,
      severity,
      filePath,
      title: `${kind} found in ${filePath}`,
      message: `Potential ${kind} detected at line ${i + 1}. Value not shown for safety.`,
      recommendation: rotationRequired
        ? 'Remove from repo and rotate key in provider dashboard.'
        : 'Replace with placeholder or remove.',
      rotationRequired,
    });
  }

  return findings;
}

export function scanSourceFiles(): CreviaSecretScanFinding[] {
  const findings: CreviaSecretScanFinding[] = [];

  for (const file of SECRET_HYGIENE_SOURCE_FILES) {
    const content = readRepoFile(file);
    if (content.length === 0) continue;

    findings.push(
      ...findRealKeyOccurrences(
        content, file, 'rc_secret', SECRET_REAL_KEY_PATTERNS.revenueCatSecret,
        'revenuecat_secret_key', 'blocker', true,
      ),
      ...findRealKeyOccurrences(
        content, file, 'rc_secret_alt', SECRET_REAL_KEY_PATTERNS.revenueCatSecretAlt,
        'revenuecat_secret_key', 'blocker', true,
      ),
      ...findRealKeyOccurrences(
        content, file, 'rc_public_ios', SECRET_REAL_KEY_PATTERNS.revenueCatPublicIos,
        'revenuecat_public_key', 'medium', false,
      ),
      ...findRealKeyOccurrences(
        content, file, 'rc_public_android', SECRET_REAL_KEY_PATTERNS.revenueCatPublicAndroid,
        'revenuecat_public_key', 'medium', false,
      ),
    );
  }

  return findings;
}

export function scanDocFiles(): CreviaSecretScanFinding[] {
  const findings: CreviaSecretScanFinding[] = [];

  for (const file of SECRET_HYGIENE_DOC_FILES) {
    const content = readRepoFile(file);
    if (content.length === 0) continue;

    findings.push(
      ...findRealKeyOccurrences(
        content, file, 'doc_rc_secret', SECRET_REAL_KEY_PATTERNS.revenueCatSecret,
        'revenuecat_secret_key', 'blocker', true,
      ),
      ...findRealKeyOccurrences(
        content, file, 'doc_rc_secret_alt', SECRET_REAL_KEY_PATTERNS.revenueCatSecretAlt,
        'revenuecat_secret_key', 'blocker', true,
      ),
      ...findRealKeyOccurrences(
        content, file, 'doc_rc_public_ios', SECRET_REAL_KEY_PATTERNS.revenueCatPublicIos,
        'docs_real_key_value', 'high', false,
      ),
      ...findRealKeyOccurrences(
        content, file, 'doc_rc_public_android', SECRET_REAL_KEY_PATTERNS.revenueCatPublicAndroid,
        'docs_real_key_value', 'high', false,
      ),
    );
  }

  return findings;
}

export function collectRotationRequirements(
  findings: CreviaSecretScanFinding[],
): CreviaSecretRotationRequirement[] {
  const requirements: CreviaSecretRotationRequirement[] = [];
  const secretFindings = findings.filter((f) => f.rotationRequired);

  if (secretFindings.some((f) => f.kind === 'revenuecat_secret_key')) {
    requirements.push({
      provider: 'RevenueCat',
      reason: 'Secret key pattern detected in repo.',
      manualAction: 'Rotate/revoke secret key in RevenueCat dashboard → API Keys.',
      resolved: false,
    });
  }

  if (secretFindings.some((f) => f.kind === 'store_shared_secret')) {
    requirements.push({
      provider: 'App Store Connect / Google Play',
      reason: 'Store shared secret detected in repo.',
      manualAction: 'Regenerate shared secret in store dashboard.',
      resolved: false,
    });
  }

  return requirements;
}

export function collectSanitizationActions(
  findings: CreviaSecretScanFinding[],
): CreviaSecretSanitizationAction[] {
  const actions: CreviaSecretSanitizationAction[] = [];

  for (const f of findings) {
    if (f.kind === 'placeholder_safe') continue;

    let placeholder = '<SENSITIVE_TOKEN_REMOVED>';
    if (f.kind === 'revenuecat_secret_key') placeholder = '<DO_NOT_COMMIT_SECRET_KEY>';
    else if (f.kind === 'revenuecat_public_key' || f.kind === 'docs_real_key_value') {
      placeholder = '<REVENUECAT_PUBLIC_SDK_KEY_SET_IN_EAS>';
    } else if (f.kind === 'store_shared_secret') {
      placeholder = '<STORE_SHARED_SECRET_NOT_IN_REPO>';
    }

    actions.push({
      filePath: f.filePath,
      description: `Replace ${f.kind} in ${f.filePath}`,
      replacementPlaceholder: placeholder,
      applied: false,
    });
  }

  return actions;
}

function computeHealth(findings: CreviaSecretScanFinding[]): CreviaSecretHygieneHealthStatus {
  if (findings.some((f) => f.severity === 'blocker')) return 'BLOCKED';
  if (findings.some((f) => f.severity === 'high' || f.severity === 'medium')) return 'WARN';
  return 'PASS';
}

export function runSecretHygieneScan(): CreviaSecretHygieneResult {
  const sourceFindings = scanSourceFiles();
  const docFindings = scanDocFiles();
  const allFindings = [...sourceFindings, ...docFindings];

  const rotationRequirements = collectRotationRequirements(allFindings);
  const sanitizationActions = collectSanitizationActions(allFindings);

  const blockerCount = allFindings.filter((f) => f.severity === 'blocker').length;
  const highCount = allFindings.filter((f) => f.severity === 'high').length;
  const mediumCount = allFindings.filter((f) => f.severity === 'medium').length;
  const lowCount = allFindings.filter((f) => f.severity === 'low').length;

  const currentTreeSanitized = allFindings.length === 0;
  const rotationPending = rotationRequirements.some((r) => !r.resolved);

  const health = computeHealth(allFindings);

  const scannedFileCount = SECRET_HYGIENE_SOURCE_FILES.filter(
    (f) => readRepoFile(f).length > 0,
  ).length;
  const scannedDocCount = SECRET_HYGIENE_DOC_FILES.filter(
    (f) => readRepoFile(f).length > 0,
  ).length;

  return {
    health,
    findings: allFindings,
    blockerCount,
    highCount,
    mediumCount,
    lowCount,
    sanitizationActions,
    rotationRequirements,
    currentTreeSanitized,
    rotationPending,
    scannedFileCount,
    scannedDocCount,
    docsPath: SECRET_HYGIENE_DOCS_PATH,
  };
}

export function assertSecretHygieneIntegrity(): { ok: boolean; findingCount: number } {
  const result = runSecretHygieneScan();
  return {
    ok: existsSync(join(REPO_ROOT, SECRET_HYGIENE_DOCS_PATH)),
    findingCount: result.findings.length,
  };
}
