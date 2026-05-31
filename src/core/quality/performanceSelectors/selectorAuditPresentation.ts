import type { SelectorAuditResult } from './selectorAuditTypes';

export function buildSelectorAuditConsoleReport(result: SelectorAuditResult): string {
  const lines: string[] = [
    '=== Performance & Selector Audit ===',
    `Health: ${result.health}`,
    `Checked: ${result.checkedCount} | Pass: ${result.passCount} | Warn: ${result.warnCount} | Fail: ${result.failCount}`,
    '',
  ];

  const fails = result.findings.filter((f) => f.status === 'fail');
  const warns = result.findings.filter((f) => f.status === 'warn');

  if (fails.length > 0) {
    lines.push('--- FAIL ---');
    for (const f of fails.slice(0, 12)) {
      lines.push(`[FAIL] ${f.componentName}: ${f.message}`);
    }
  }

  if (warns.length > 0) {
    lines.push('--- WARN (sample) ---');
    for (const f of warns.slice(0, 8)) {
      lines.push(`[WARN] ${f.componentName}: ${f.message}`);
    }
  }

  const highRisk = result.findings.filter(
    (f) => f.riskLevel === 'high' || f.riskLevel === 'critical',
  );
  if (highRisk.length > 0) {
    lines.push('');
    lines.push('--- Highest risk ---');
    for (const f of highRisk.slice(0, 6)) {
      lines.push(`[${f.status.toUpperCase()}] ${f.surface}/${f.componentName}: ${f.recommendation}`);
    }
  }

  return lines.join('\n');
}
