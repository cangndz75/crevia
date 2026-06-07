import type {
  SoftLaunchRegressionCleanupResult,
  SoftLaunchVerifyFailureClassification,
} from './softLaunchRegressionCleanupTypes';

export function formatRegressionCleanupHealthLine(result: SoftLaunchRegressionCleanupResult): string {
  return `health=${result.health} code=${result.codeHealth} manual=${result.manualLaunchReadiness} launch=${result.launchCandidateDecision}`;
}

export function buildClassificationTableMarkdown(
  classifications: SoftLaunchVerifyFailureClassification[],
): string {
  const lines = ['| Command | Status | Code | Manual | Summary |', '| --- | --- | --- | --- | --- |'];
  for (const row of classifications) {
    lines.push(
      `| ${row.command} | ${row.normalizedStatus} | ${row.codeHealth} | ${row.manualLaunchReadiness} | ${row.summary} |`,
    );
  }
  return lines.join('\n');
}

export function buildRegressionCleanupConsoleSummary(result: SoftLaunchRegressionCleanupResult): string {
  return [
    formatRegressionCleanupHealthLine(result),
    `manualBlockers=${result.blockerCount} codeRegressions=${result.codeRegressions.length}`,
    `dashboardPending=${result.dashboardPending.join(', ') || 'none'}`,
    `environmentPending=${result.environmentPending.join(', ') || 'none'}`,
    `staleFixes=${result.staleExpectationsFixed.length}`,
  ].join('\n');
}
