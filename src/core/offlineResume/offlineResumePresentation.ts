import type { OfflineResumeAuditResult, OfflineResumeScenarioResult } from './offlineResumeTypes';

export function formatOfflineResumeScenarioLine(result: OfflineResumeScenarioResult): string {
  return `${result.status} [${result.phase}] ${result.title}: ${result.actualBehavior}`;
}

export function buildOfflineResumeVerifySummary(audit: OfflineResumeAuditResult): {
  pass: number;
  warn: number;
  fail: number;
  blocker: number;
  lines: string[];
} {
  const lines = audit.scenarioResults.map(formatOfflineResumeScenarioLine);
  return {
    pass: audit.scenarioResults.filter((r) => r.status === 'PASS').length,
    warn: audit.scenarioResults.filter((r) => r.status === 'WARN').length,
    fail: audit.scenarioResults.filter((r) => r.status === 'FAIL').length,
    blocker: audit.scenarioResults.filter((r) => r.status === 'BLOCKER').length,
    lines,
  };
}

export function buildOfflineResumeReleaseNote(audit: OfflineResumeAuditResult): string {
  return [
    `Overall: ${audit.overallHealth}`,
    `Launch risk: ${audit.launchRisk}`,
    audit.releaseRecommendation,
    audit.fixedIssues.length > 0 ? `Fixed: ${audit.fixedIssues.join('; ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
