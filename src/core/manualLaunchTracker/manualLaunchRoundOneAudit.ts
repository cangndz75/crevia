import { runCrashPerformanceAudit } from '@/core/crashPerformance/crashPerformanceAudit';

import type { ManualLaunchEvidenceLogEntry } from './manualLaunchEvidenceTypes';
import {
  MANUAL_LAUNCH_ROUND_ONE_DOCS_PATH,
  MANUAL_LAUNCH_ROUND_ONE_PRIORITY_MISSING,
  MANUAL_LAUNCH_ROUND_ONE_SCOPES,
  MANUAL_LAUNCH_ROUND_ONE_TEMPLATE,
  MANUAL_LAUNCH_ROUND_ONE_TEST_CASE_TEMPLATES,
} from './manualLaunchRoundOneConstants';
import type {
  ManualLaunchRoundOneAuditResult,
  ManualLaunchRoundOneTestCase,
  ManualLaunchTestRound,
  ManualLaunchTestRoundStatus,
} from './manualLaunchTestRounds';

function isSentryEnvReady(): boolean {
  const crash = runCrashPerformanceAudit({ mode: 'internal_device_test' });
  return crash.environmentConfigStatus === 'ready';
}

function evidenceForTestCase(
  testCaseId: string,
  evidenceLog: ManualLaunchEvidenceLogEntry[],
): { attached: number; verified: number; rejected: number } {
  const entries = evidenceLog.filter((e) => e.testCaseId === testCaseId);
  return {
    attached: entries.filter((e) => e.status === 'attached').length,
    verified: entries.filter((e) => e.status === 'verified').length,
    rejected: entries.filter((e) => e.status === 'rejected').length,
  };
}

function resolveTestEvidenceStatus(
  counts: { attached: number; verified: number; rejected: number },
): ManualLaunchRoundOneTestCase['evidenceStatus'] {
  if (counts.verified > 0) return 'verified';
  if (counts.attached > 0) return 'attached';
  if (counts.rejected > 0) return 'rejected';
  return 'missing';
}

function resolveTestStatus(
  template: (typeof MANUAL_LAUNCH_ROUND_ONE_TEST_CASE_TEMPLATES)[number],
  evidenceStatus: ManualLaunchRoundOneTestCase['evidenceStatus'],
  sentryEnvReady: boolean,
): ManualLaunchRoundOneTestCase['status'] {
  if (template.conditionalOnEnvReady && !sentryEnvReady) {
    return 'skipped';
  }
  if (evidenceStatus === 'verified') {
    return 'done';
  }
  if (evidenceStatus === 'rejected') {
    return 'blocked';
  }
  return 'pending';
}

function buildTestCases(
  evidenceLog: ManualLaunchEvidenceLogEntry[],
): ManualLaunchRoundOneTestCase[] {
  const sentryEnvReady = isSentryEnvReady();

  return MANUAL_LAUNCH_ROUND_ONE_TEST_CASE_TEMPLATES.map((template) => {
    const counts = evidenceForTestCase(template.testCaseId, evidenceLog);
    const evidenceStatus = resolveTestEvidenceStatus(counts);
    const status = resolveTestStatus(template, evidenceStatus, sentryEnvReady);

    return {
      ...template,
      status,
      evidenceStatus,
    };
  });
}

function deriveRoundStatus(testCases: ManualLaunchRoundOneTestCase[]): ManualLaunchTestRoundStatus {
  const active = testCases.filter((t) => t.status !== 'skipped');
  const verified = active.filter((t) => t.evidenceStatus === 'verified').length;
  const attached = active.filter((t) => t.evidenceStatus === 'attached').length;
  const blocked = active.filter((t) => t.status === 'blocked').length;

  if (verified === active.length && active.length > 0) {
    return 'verified';
  }
  if (blocked > 0 && verified === 0) {
    return 'blocked';
  }
  if (verified > 0 || attached > 0) {
    return verified > 0 ? 'partially_verified' : 'in_progress';
  }
  return 'ready_to_execute';
}

function countFakePassViolations(testCases: ManualLaunchRoundOneTestCase[]): number {
  return testCases.filter((t) => t.status === 'done' && t.evidenceStatus !== 'verified').length;
}

export function runManualLaunchRoundOneAudit(
  evidenceLog: ManualLaunchEvidenceLogEntry[] = [],
): ManualLaunchRoundOneAuditResult {
  const testCases = buildTestCases(evidenceLog);
  const activeCases = testCases.filter((t) => t.status !== 'skipped');

  const attachedEvidence = activeCases.filter((t) => t.evidenceStatus === 'attached').length;
  const verifiedEvidence = activeCases.filter((t) => t.evidenceStatus === 'verified').length;
  const pendingTests = activeCases.filter((t) => t.status === 'pending').length;
  const blockedTests = activeCases.filter((t) => t.status === 'blocked').length;
  const skippedTests = testCases.filter((t) => t.status === 'skipped').length;

  const roundOneStatus = deriveRoundStatus(testCases);
  const fakePassGuardViolations = countFakePassViolations(testCases);

  const missingCriticalEvidence = MANUAL_LAUNCH_ROUND_ONE_PRIORITY_MISSING.filter((id) => {
    const testCaseId = id.replace('evidence.round1.', '');
    const tc = testCases.find((t) => t.testCaseId === testCaseId);
    return !tc || tc.evidenceStatus !== 'verified';
  });

  const roundOneMissingEvidence = activeCases.filter(
    (t) => t.evidenceStatus === 'missing' || t.evidenceStatus === 'attached',
  ).length;

  const round: ManualLaunchTestRound = {
    ...MANUAL_LAUNCH_ROUND_ONE_TEMPLATE,
    status: roundOneStatus,
    highestPriorityMissing: [...missingCriticalEvidence],
  };

  const roundOneCanStart = roundOneStatus === 'ready_to_execute' || roundOneStatus === 'pending';
  const roundOneCanComplete = verifiedEvidence === activeCases.length && activeCases.length > 0;

  const canProceedInternalDeviceTest = roundOneCanStart && fakePassGuardViolations === 0;
  const internalDeviceTestExecutionStatus: ManualLaunchRoundOneAuditResult['internalDeviceTestExecutionStatus'] =
    roundOneCanComplete
      ? 'completed'
      : canProceedInternalDeviceTest
        ? 'ready_to_execute'
        : 'blocked';

  const nextManualAction =
    verifiedEvidence === 0
      ? 'Run internal EAS build; execute Round 1 Day 1 + Day 8 scripts on physical devices; attach evidence per docs/crevia-internal-device-test-round-one.md (no fake PASS).'
      : `Round 1 progress: ${verifiedEvidence}/${activeCases.length} verified — continue remaining tests.`;

  return {
    round,
    scopes: MANUAL_LAUNCH_ROUND_ONE_SCOPES,
    testCases,
    totalRoundOneTests: testCases.length,
    pendingTests,
    attachedEvidence,
    verifiedEvidence,
    blockedTests,
    skippedTests,
    canProceedInternalDeviceTest,
    internalDeviceTestExecutionStatus,
    canProceedPublicLaunch: false,
    missingCriticalEvidence,
    fakePassGuardViolations,
    roundOneStatus,
    roundOneMissingEvidence,
    roundOneHighestPriorityMissing: [...MANUAL_LAUNCH_ROUND_ONE_PRIORITY_MISSING],
    roundOneCanStart,
    roundOneCanComplete,
    nextManualAction,
    docsPath: MANUAL_LAUNCH_ROUND_ONE_DOCS_PATH,
  };
}

export function roundOneTestPassesWithoutEvidence(testCaseId: string): boolean {
  const audit = runManualLaunchRoundOneAudit();
  const tc = audit.testCases.find((t) => t.testCaseId === testCaseId);
  if (!tc) return false;
  return tc.status === 'done' && tc.evidenceStatus !== 'verified';
}
