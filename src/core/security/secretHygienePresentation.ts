import type { CreviaSecretHygieneResult } from './secretHygieneTypes';

export function buildSecretHygieneConsoleSummary(
  result: CreviaSecretHygieneResult,
): string {
  const lines = [
    '=== Crevia Secret Hygiene Scan ===',
    `Health: ${result.health}`,
    `Scanned: ${result.scannedFileCount} source files, ${result.scannedDocCount} doc files`,
    `Findings: ${result.findings.length} (${result.blockerCount} blocker, ${result.highCount} high, ${result.mediumCount} medium, ${result.lowCount} low)`,
    `Current tree sanitized: ${result.currentTreeSanitized}`,
    `Rotation pending: ${result.rotationPending}`,
    '',
  ];

  if (result.findings.length > 0) {
    lines.push('--- Findings (values masked) ---');
    for (const f of result.findings.slice(0, 10)) {
      lines.push(`  [${f.severity.toUpperCase()}] ${f.kind} in ${f.filePath}`);
    }
    if (result.findings.length > 10) {
      lines.push(`  ... and ${result.findings.length - 10} more`);
    }
    lines.push('');
  }

  if (result.rotationRequirements.length > 0) {
    lines.push('--- Rotation requirements ---');
    for (const r of result.rotationRequirements) {
      lines.push(`  • ${r.provider}: ${r.manualAction}`);
    }
    lines.push('');
  }

  if (result.sanitizationActions.length > 0) {
    lines.push('--- Sanitization actions ---');
    for (const a of result.sanitizationActions.slice(0, 8)) {
      lines.push(`  • ${a.filePath}: replace with ${a.replacementPlaceholder}`);
    }
    lines.push('');
  }

  if (result.currentTreeSanitized && !result.rotationPending) {
    lines.push('Current tree is clean. No secret patterns detected.');
  }

  return lines.join('\n');
}

export function buildSecretHygieneMarkdown(
  result: CreviaSecretHygieneResult,
): string {
  const sections: string[] = [
    '# Secret Hygiene Scan Report',
    '',
    `**Health:** ${result.health}`,
    `**Current tree sanitized:** ${result.currentTreeSanitized}`,
    `**Rotation pending:** ${result.rotationPending}`,
    '',
    '## Scan Summary',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Source files scanned | ${result.scannedFileCount} |`,
    `| Doc files scanned | ${result.scannedDocCount} |`,
    `| Blocker findings | ${result.blockerCount} |`,
    `| High findings | ${result.highCount} |`,
    `| Medium findings | ${result.mediumCount} |`,
    `| Low findings | ${result.lowCount} |`,
    '',
  ];

  if (result.findings.length > 0) {
    sections.push('## Findings');
    sections.push('');
    sections.push('| Severity | Kind | File | Rotation |');
    sections.push('|----------|------|------|----------|');
    for (const f of result.findings) {
      sections.push(
        `| ${f.severity} | ${f.kind} | ${f.filePath} | ${f.rotationRequired ? 'yes' : 'no'} |`,
      );
    }
    sections.push('');
  }

  if (result.rotationRequirements.length > 0) {
    sections.push('## Rotation Requirements');
    sections.push('');
    for (const r of result.rotationRequirements) {
      sections.push(`- **${r.provider}:** ${r.manualAction} (resolved: ${r.resolved})`);
    }
    sections.push('');
  }

  if (result.currentTreeSanitized) {
    sections.push('## Status');
    sections.push('');
    sections.push('Current working tree contains no secret patterns.');
  }

  return sections.join('\n');
}

export function buildSecretHygieneChecklist(
  result: CreviaSecretHygieneResult,
): string[] {
  const items: string[] = [];

  items.push(
    result.currentTreeSanitized
      ? '[✓] Current tree sanitized — no secret patterns'
      : '[ ] Current tree contains secret patterns',
  );

  items.push(
    !result.rotationPending
      ? '[✓] No rotation pending'
      : '[ ] Key rotation required — check provider dashboards',
  );

  items.push(
    result.blockerCount === 0
      ? '[✓] No blocker findings'
      : `[ ] ${result.blockerCount} blocker finding(s) to resolve`,
  );

  return items;
}
