import type { ManualLaunchRoundOneAuditResult } from './manualLaunchTestRounds';

export function buildRoundOneConsoleLines(result: ManualLaunchRoundOneAuditResult): string[] {
  const lines = [
    '=== Manual Launch Round 1 — Internal Device Playtest ===',
    `round=${result.round.roundId} status=${result.roundOneStatus}`,
    `tests=${result.totalRoundOneTests} pending=${result.pendingTests} verified=${result.verifiedEvidence} skipped=${result.skippedTests}`,
    `execution=${result.internalDeviceTestExecutionStatus} canStart=${result.roundOneCanStart} canComplete=${result.roundOneCanComplete}`,
    `missingEvidence=${result.roundOneMissingEvidence} fakePassViolations=${result.fakePassGuardViolations}`,
    `publicLaunch=${result.canProceedPublicLaunch ? 'allowed' : 'blocked'}`,
  ];

  if (result.roundOneHighestPriorityMissing.length > 0) {
    lines.push(`priorityMissing=${result.roundOneHighestPriorityMissing.slice(0, 5).join(', ')}`);
  }

  lines.push('', '--- Round 1 scopes ---');
  for (const scope of result.scopes) {
    lines.push(`  ${scope.title}: ${scope.testCaseIds.length} tests`);
  }

  lines.push('', `Docs: ${result.docsPath}`);
  return lines;
}
