import type { ManualLaunchBlockerGroup, ManualLaunchTrackerResult } from './manualLaunchTrackerTypes';

export function formatManualLaunchTrackerHeadline(result: ManualLaunchTrackerResult): string {
  return [
    `overall=${result.overallStatus}`,
    `code=${result.codeHealthStatus}`,
    `manual=${result.manualReadinessStatus}`,
    `internal=${result.internalDeviceTestDecision}`,
    `public=${result.publicLaunchDecision}`,
  ].join(' | ');
}

export function buildManualLaunchTrackerConsoleSummary(result: ManualLaunchTrackerResult): string {
  const lines = [
    '=== Crevia Manual Launch Blocker Tracker ===',
    formatManualLaunchTrackerHeadline(result),
    `Blockers: ${result.blockers.length} total | public pending: ${result.pendingPublicLaunchBlockers} | internal pending: ${result.pendingInternalTestBlockers}`,
    `Device test cases: ${result.deviceTestMatrix.length}`,
    `Fake PASS guard: ${result.fakePassGuardActive ? 'ACTIVE' : 'INACTIVE'}`,
    '',
    '--- Blocker groups ---',
  ];

  for (const group of result.blockerGroups) {
    lines.push(
      `  ${group.title}: ${group.pendingCount} pending, ${group.doneCount} done` +
        (group.publicLaunchBlocked ? ' [public BLOCKED]' : '') +
        (group.internalTestBlocked ? ' [internal BLOCKED]' : ''),
    );
  }

  lines.push('', '--- Top next actions ---');
  for (const action of result.nextActions.slice(0, 6)) {
    lines.push(`  • ${action}`);
  }

  lines.push('', '--- Verification matrix ---');
  for (const row of result.verificationMatrix) {
    lines.push(`  ${row.label}: code=${row.codeHealth} manual=${row.manualStatus} — ${row.note}`);
  }

  lines.push('', '--- Evidence summary ---');
  lines.push(
    `  total=${result.evidenceSummary.totalEvidenceRequired} missing=${result.evidenceSummary.missingEvidence} verified=${result.evidenceSummary.verifiedEvidence}`,
  );
  lines.push(
    `  internalEvidence=${result.evidenceSummary.internalDeviceEvidenceStatus} publicEvidence=${result.evidenceSummary.publicLaunchEvidenceStatus}`,
  );
  lines.push(`  EAS checklist pending=${result.easBuildChecklist.filter((i) => i.status === 'pending').length}`);
  lines.push(
    `  Device tests pending=${result.deviceTestEvidence.filter((t) => t.status === 'pending').length}/20`,
  );

  lines.push('', '--- Round 1 internal playtest ---');
  lines.push(
    `  status=${result.roundOneStatus} execution=${result.roundOne.internalDeviceTestExecutionStatus}`,
  );
  lines.push(
    `  tests pending=${result.roundOne.pendingTests} verified=${result.roundOne.verifiedEvidence} missingEvidence=${result.roundOneMissingEvidence}`,
  );
  lines.push(`  canStart=${result.roundOneCanStart} canComplete=${result.roundOneCanComplete}`);

  lines.push('', `Docs: ${result.docsPath} | Round 1: ${result.roundOne.docsPath}`);
  return lines.join('\n');
}

export function buildBlockerGroupMarkdown(group: ManualLaunchBlockerGroup): string {
  const lines = [`### ${group.title}`, '', '| ID | Status | Blocks launch | Blocks internal | Next action |', '| --- | --- | --- | --- | --- |'];
  for (const b of group.blockers) {
    lines.push(
      `| ${b.id} | ${b.status} | ${b.blocksPublicLaunch ? 'yes' : 'no'} | ${b.blocksInternalDeviceTest ? 'yes' : 'no'} | ${b.nextAction} |`,
    );
  }
  return lines.join('\n');
}
