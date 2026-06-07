import type { ReleaseCandidateAuditResult } from './releaseCandidateTypes';

export function formatReleaseCandidateHeadline(result: ReleaseCandidateAuditResult): string {
  return [
    `overall=${result.overallStatus}`,
    `code=${result.codeHealth}`,
    `gameplay=${result.gameplayReadiness}`,
    `public=${result.publicLaunchDecision}`,
    `internal=${result.internalDeviceTestDecision}`,
  ].join(' | ');
}

export function buildReleaseCandidateConsoleSummary(result: ReleaseCandidateAuditResult): string {
  const lines = [
    '=== Crevia Release Candidate Audit ===',
    formatReleaseCandidateHeadline(result),
    '',
    '--- Readiness pillars ---',
    `  Store: ${result.storeReadiness}`,
    `  Monetization: ${result.monetizationReadiness}`,
    `  Privacy: ${result.privacyReadiness}`,
    `  Crash observability: ${result.crashObservabilityReadiness}`,
    `  Analytics: ${result.analyticsReadiness}`,
    `  Device test: ${result.deviceTestReadiness}`,
    '',
    `Manual blockers: ${result.blockerSummary.totalManualBlockers} | public pending: ${result.blockerSummary.pendingPublicLaunch} | internal pending: ${result.blockerSummary.pendingInternalTest}`,
    `Code regressions: ${result.codeRegressions.length}`,
    `Fake PASS guard: ${result.fakePassGuardActive ? 'ACTIVE' : 'INACTIVE'}`,
    '',
    '--- Top public blockers ---',
  ];

  for (const b of result.blockerSummary.topPublicBlockers) {
    lines.push(`  • ${b}`);
  }

  lines.push('', '--- Gameplay completion (soft launch) ---');
  for (const area of result.gameplayAreas) {
    lines.push(`  ${area.title}: ${area.status} — ${area.verifyCommand}`);
  }

  lines.push('', '--- Evidence ---');
  lines.push(
    `  total=${result.evidenceSummary.totalEvidenceRequired} missing=${result.evidenceSummary.missingEvidence} attached=${result.evidenceSummary.attachedEvidence} verified=${result.evidenceSummary.verifiedEvidence} rejected=${result.evidenceSummary.rejectedEvidence}`,
  );
  lines.push(
    `  internalEvidence=${result.evidenceSummary.internalDeviceEvidenceStatus} publicEvidence=${result.evidenceSummary.publicLaunchEvidenceStatus}`,
  );
  if (result.evidenceSummary.highestPriorityMissingEvidence.length > 0) {
    lines.push(
      `  priority missing: ${result.evidenceSummary.highestPriorityMissingEvidence.join(', ')}`,
    );
  }

  lines.push('', '--- Round 1 internal playtest ---');
  lines.push(
    `  status=${result.roundOne.roundOneStatus} execution=${result.roundOne.internalDeviceTestExecutionStatus}`,
  );
  lines.push(
    `  tests=${result.roundOne.totalRoundOneTests} pending=${result.roundOne.pendingTests} verified=${result.roundOne.verifiedEvidence}`,
  );
  lines.push(
    `  canStart=${result.roundOne.roundOneCanStart} canComplete=${result.roundOne.roundOneCanComplete}`,
  );

  lines.push('', '--- Required next actions ---');
  for (const action of result.requiredNextActions.slice(0, 6)) {
    lines.push(`  • ${action}`);
  }

  lines.push('', `Docs: ${result.docsPath}`);
  return lines.join('\n');
}

export function buildReleaseBoardMarkdown(result: ReleaseCandidateAuditResult): string {
  const columns = [
    { key: 'now_internal_device_test', label: 'Now / Internal Device Test' },
    { key: 'before_soft_launch', label: 'Before Soft Launch' },
    { key: 'before_public_launch', label: 'Before Public Launch' },
    { key: 'v1_1_backlog', label: 'V1.1 Backlog' },
  ] as const;

  const lines = ['| Column | Items |', '| --- | --- |'];
  for (const col of columns) {
    const items = result.releaseBoard
      .filter((b) => b.column === col.key)
      .map((b) => b.title)
      .join('; ');
    lines.push(`| ${col.label} | ${items} |`);
  }
  return lines.join('\n');
}
