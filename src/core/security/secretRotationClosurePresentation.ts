import type { CreviaSecretRotationClosureResult } from './secretRotationClosureTypes';
import { SECRET_ROTATION_MANUAL_CHECKLIST } from './secretRotationClosureConstants';

export function buildSecretRotationClosureConsoleSummary(
  result: CreviaSecretRotationClosureResult,
): string {
  const lines = [
    '=== Crevia Secret Rotation Closure ===',
    `Health: ${result.health}`,
    `Exposures: ${result.exposureCount} (${result.pendingRotationCount} pending rotation)`,
    `Current tree sanitized: ${result.currentTreeSanitized}`,
    `Rotation required: ${result.rotationRequired}`,
    `Evidence present: ${result.rotationEvidencePresent}`,
    `Verified closed: ${result.rotationVerifiedClosed}`,
    `Closure can proceed: ${result.closureCanProceed}`,
    '',
  ];

  if (result.exposureRecords.length > 0) {
    lines.push('--- Exposure records (no raw values) ---');
    for (const r of result.exposureRecords.slice(0, 8)) {
      lines.push(`  [${r.rotationStatus}] ${r.findingKind} @ ${r.sourceFile} (${r.provider})`);
    }
    if (result.exposureRecords.length > 8) {
      lines.push(`  ... and ${result.exposureRecords.length - 8} more`);
    }
    lines.push('');
  }

  if (result.blockers.length > 0) {
    lines.push('--- Blockers ---');
    for (const b of result.blockers) {
      lines.push(`  • ${b.title}`);
    }
    lines.push('');
  }

  if (result.nextActions.length > 0) {
    lines.push('--- Next actions ---');
    for (const a of result.nextActions.slice(0, 6)) {
      lines.push(`  • ${a}`);
    }
  }

  return lines.join('\n');
}

export function buildSecretRotationClosureMarkdown(
  result: CreviaSecretRotationClosureResult,
): string {
  const sections = [
    '# Secret Rotation Closure Report',
    '',
    `**Health:** ${result.health}`,
    `**Current tree sanitized:** ${result.currentTreeSanitized}`,
    `**Rotation required:** ${result.rotationRequired}`,
    `**Verified closed:** ${result.rotationVerifiedClosed}`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| Exposure records | ${result.exposureCount} |`,
    `| Pending rotation | ${result.pendingRotationCount} |`,
    `| Evidence present | ${result.rotationEvidencePresent} |`,
    `| Closure can proceed | ${result.closureCanProceed} |`,
    '',
  ];

  if (result.exposureRecords.length > 0) {
    sections.push('## Exposure Records');
    sections.push('');
    sections.push('| Kind | File | Provider | Status | Launch blocking |');
    sections.push('|------|------|----------|--------|-----------------|');
    for (const r of result.exposureRecords) {
      sections.push(
        `| ${r.findingKind} | ${r.sourceFile} | ${r.provider} | ${r.rotationStatus} | ${r.launchBlocking} |`,
      );
    }
    sections.push('');
  }

  return sections.join('\n');
}

export function buildSecretRotationChecklist(): string[] {
  return SECRET_ROTATION_MANUAL_CHECKLIST.map((item) => `[ ] ${item}`);
}

export function buildSecretRotationBlockerTable(
  result: CreviaSecretRotationClosureResult,
): string {
  if (result.blockers.length === 0) return 'No blockers.';
  const rows = result.blockers.map(
    (b) => `| ${b.id} | ${b.title} | ${b.recommendation} |`,
  );
  return ['| ID | Title | Recommendation |', '|----|-------|----------------|', ...rows].join('\n');
}

export function buildSecretRotationNextActionTable(
  result: CreviaSecretRotationClosureResult,
): string {
  if (result.nextActions.length === 0) return 'No pending actions.';
  return result.nextActions.map((a, i) => `${i + 1}. ${a}`).join('\n');
}
