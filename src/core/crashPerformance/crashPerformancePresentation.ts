import type { CrashPerformanceAuditResult } from './crashPerformanceTypes';

export function formatCrashPerformanceHealthLine(result: CrashPerformanceAuditResult): string {
  return `${result.health} provider=${result.selectedProvider} mode=${result.integrationMode} release=${result.releaseReadinessStatus}`;
}

export function buildCrashPerformanceManualStepsMarkdown(
  steps: CrashPerformanceAuditResult['nextManualSteps'],
): string {
  return steps
    .map((step) => `- [${step.status === 'pending' ? ' ' : 'x'}] **${step.title}**${step.notes ? ` — ${step.notes}` : ''}`)
    .join('\n');
}

export function buildCrashPerformanceAuditConsoleSummary(result: CrashPerformanceAuditResult): string {
  const lines = [
    formatCrashPerformanceHealthLine(result),
    `expo=${result.expoCompatibility} eas=${result.easBuildCompatibility}`,
    `privacyRisk=${result.privacyRisk} sourceMaps=${result.sourceMapStatus}`,
    `env=${result.environmentConfigStatus} smoke=${result.smokeTestStatus}`,
    `codeIntegration=${result.codeIntegrationPass ? 'PASS' : 'FAIL'}`,
  ];
  if (result.blockers.length > 0) {
    lines.push(`blockers=${result.blockers.map((b) => b.id).join(', ')}`);
  }
  return lines.join('\n');
}
