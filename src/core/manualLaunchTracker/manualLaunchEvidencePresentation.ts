import type { ManualLaunchEvidenceAuditResult } from './manualLaunchEvidenceTypes';

export function buildEvidenceSummaryConsoleLines(result: ManualLaunchEvidenceAuditResult): string[] {
  const s = result.summary;
  return [
    '=== Manual Launch Evidence Log ===',
    `total=${s.totalEvidenceRequired} missing=${s.missingEvidence} attached=${s.attachedEvidence} verified=${s.verifiedEvidence} rejected=${s.rejectedEvidence}`,
    `internalEvidence=${s.internalDeviceEvidenceStatus} publicEvidence=${s.publicLaunchEvidenceStatus}`,
    `fakePassGuard=${s.fakePassGuardActive ? 'ACTIVE' : 'INACTIVE'}`,
    `priorityMissing=${s.highestPriorityMissingEvidence.join(', ')}`,
    `EAS checklist items=${result.easBuildChecklist.length} pending=${result.easBuildChecklist.filter((i) => i.status === 'pending').length}`,
    `Device test evidence cases=${result.deviceTestEvidence.length} verified=${result.deviceTestEvidence.filter((t) => t.evidenceStatus === 'verified').length}`,
  ];
}

export function buildEvidenceSummaryMarkdown(result: ManualLaunchEvidenceAuditResult): string {
  const lines = [
    '## Evidence summary',
    '',
    `- Total required: ${result.summary.totalEvidenceRequired}`,
    `- Missing: ${result.summary.missingEvidence}`,
    `- Verified: ${result.summary.verifiedEvidence}`,
    `- Internal device evidence: ${result.summary.internalDeviceEvidenceStatus}`,
    `- Public launch evidence: ${result.summary.publicLaunchEvidenceStatus}`,
    '',
    '### EAS internal build checklist',
    '',
    '| ID | Status | Blocks internal |',
    '| --- | --- | --- |',
  ];
  for (const item of result.easBuildChecklist) {
    lines.push(`| ${item.id} | ${item.status} | ${item.blocksInternalDeviceTest ? 'yes' : 'no'} |`);
  }
  lines.push('', '### Device test batch (20)', '');
  for (const test of result.deviceTestEvidence) {
    lines.push(`- ${test.testCaseId}: ${test.evidenceStatus} (${test.status})`);
  }
  return lines.join('\n');
}
