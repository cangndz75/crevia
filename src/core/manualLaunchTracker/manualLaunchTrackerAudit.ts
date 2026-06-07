import { runPostLaunchTelemetryReadinessAudit } from '@/core/analytics/postLaunchTelemetryReadinessAudit';
import { runCrashPerformanceAudit } from '@/core/crashPerformance/crashPerformanceAudit';
import { runSoftLaunchReadinessReview } from '@/core/releaseReadiness/softLaunchReviewAudit';
import { runSoftLaunchRegressionCleanupAudit } from '@/core/softLaunchRegressionCleanup/softLaunchRegressionCleanupAudit';
import {
  isAnalyticsSchemaCodeHealthy,
  summarizePrivacyReadiness,
} from '@/core/softLaunchRegressionCleanup/verificationHealthHelpers';

import {
  applyEvidenceStatusToBlockers,
  runManualLaunchEvidenceAudit,
} from './manualLaunchEvidenceAudit';
import { runManualLaunchRoundOneAudit } from './manualLaunchRoundOneAudit';
import {
  MANUAL_LAUNCH_BLOCKER_GROUP_IDS,
  MANUAL_LAUNCH_BLOCKER_GROUP_LABELS,
  MANUAL_LAUNCH_BLOCKER_GROUP_MAP,
  MANUAL_LAUNCH_BLOCKERS,
  MANUAL_LAUNCH_DEVICE_TEST_MATRIX,
  MANUAL_LAUNCH_NON_GOALS,
  MANUAL_LAUNCH_TRACKER_DOCS_PATH,
} from './manualLaunchTrackerConstants';
import type {
  ManualLaunchBlocker,
  ManualLaunchBlockerGroup,
  ManualLaunchCodeHealthStatus,
  ManualLaunchOverallStatus,
  ManualLaunchReadinessStatus,
  ManualLaunchTrackerResult,
  ManualLaunchVerificationMatrixRow,
  RunManualLaunchTrackerAuditOptions,
} from './manualLaunchTrackerTypes';

function cloneBlockers(): ManualLaunchBlocker[] {
  return MANUAL_LAUNCH_BLOCKERS.map((b) => ({ ...b }));
}

function applyFactualStatusUpdates(blockers: ManualLaunchBlocker[]): void {
  const privacy = summarizePrivacyReadiness();
  const crash = runCrashPerformanceAudit({ mode: 'internal_device_test' });

  const sentryProcessor = blockers.find((b) => b.id === 'privacy_policy_sentry_processor_added');
  if (sentryProcessor && privacy.sentryProcessorListed) {
    sentryProcessor.status = 'done';
  }

  if (privacy.placeholderUrlBlocked) {
    const urlBlocker = blockers.find((b) => b.id === 'privacy_url_published');
    if (urlBlocker) {
      urlBlocker.status = 'blocked';
    }
  }

  if (crash.codeIntegrationPass) {
    const privacyBreadcrumbs = blockers.find((b) => b.id === 'sentry_privacy_safe_breadcrumbs_verified');
    if (privacyBreadcrumbs && privacyBreadcrumbs.status === 'pending') {
      privacyBreadcrumbs.nextAction =
        'Code privacy guards PASS — verify payload on device after DSN smoke.';
    }
  }
}

function buildBlockerGroups(blockers: ManualLaunchBlocker[]): ManualLaunchBlockerGroup[] {
  return MANUAL_LAUNCH_BLOCKER_GROUP_IDS.map((groupId) => {
    const ids = MANUAL_LAUNCH_BLOCKER_GROUP_MAP[groupId];
    const groupBlockers = blockers.filter((b) => ids.includes(b.id));
    const pendingCount = groupBlockers.filter(
      (b) => b.status === 'pending' || b.status === 'blocked' || b.status === 'in_progress',
    ).length;
    const doneCount = groupBlockers.filter((b) => b.status === 'done').length;
    const category = groupBlockers[0]?.category ?? 'metadata';

    return {
      id: groupId,
      title: MANUAL_LAUNCH_BLOCKER_GROUP_LABELS[groupId],
      category,
      blockers: groupBlockers,
      pendingCount,
      doneCount,
      publicLaunchBlocked: groupBlockers.some(
        (b) =>
          b.blocksPublicLaunch &&
          (b.status === 'pending' || b.status === 'blocked' || b.status === 'in_progress'),
      ),
      internalTestBlocked: groupBlockers.some(
        (b) =>
          b.blocksInternalDeviceTest &&
          (b.status === 'pending' || b.status === 'blocked' || b.status === 'in_progress'),
      ),
    };
  });
}

function buildVerificationMatrix(
  codeHealth: ManualLaunchCodeHealthStatus,
): ManualLaunchVerificationMatrixRow[] {
  const regression = runSoftLaunchRegressionCleanupAudit({ mode: 'soft_launch_candidate' });
  const telemetry = runPostLaunchTelemetryReadinessAudit({ mode: 'soft_launch_candidate' });
  const crash = runCrashPerformanceAudit({ mode: 'internal_device_test' });
  const schemaHealthy = isAnalyticsSchemaCodeHealthy();

  return [
    {
      id: 'matrix.soft_launch_review',
      label: 'Soft launch review',
      codeHealth,
      manualStatus: 'BLOCKED',
      relatedVerifyCommand: 'npm run verify:soft-launch-review',
      note: 'Internal device test proceed; launch blockers manual.',
    },
    {
      id: 'matrix.soft_launch_readiness',
      label: 'Soft launch readiness',
      codeHealth,
      manualStatus: 'WARN',
      relatedVerifyCommand: 'npm run verify:soft-launch-readiness',
      note: 'Pre-SDK WARN expected; IAP/analytics manual pending.',
    },
    {
      id: 'matrix.iap_manual_setup',
      label: 'IAP manual setup tracker',
      codeHealth: 'PASS',
      manualStatus: 'BLOCKED',
      relatedVerifyCommand: 'npm run verify:iap-manual-setup-tracker',
      note: 'Dashboard/store setup pending — not code regression.',
    },
    {
      id: 'matrix.iap_sandbox_qa',
      label: 'IAP sandbox QA',
      codeHealth: 'PASS',
      manualStatus: 'BLOCKED',
      relatedVerifyCommand: 'npm run verify:iap-sandbox-qa',
      note: 'Sandbox smoke not executed on device.',
    },
    {
      id: 'matrix.store_metadata',
      label: 'Store metadata finalization',
      codeHealth: 'PASS',
      manualStatus: 'BLOCKED',
      relatedVerifyCommand: 'npm run verify:store-metadata-finalization',
      note: 'Docs ready; console entry pending.',
    },
    {
      id: 'matrix.store_screenshots',
      label: 'Store screenshot readiness',
      codeHealth: 'PASS',
      manualStatus: 'BLOCKED',
      relatedVerifyCommand: 'npm run verify:store-screenshot-readiness',
      note: 'Captures pending.',
    },
    {
      id: 'matrix.privacy',
      label: 'Privacy policy readiness',
      codeHealth: schemaHealthy ? 'PASS' : 'FAIL',
      manualStatus: 'BLOCKED',
      relatedVerifyCommand: 'npm run verify:privacy-policy-readiness',
      note: 'URL placeholder BLOCKED; Sentry processor may be code-listed.',
    },
    {
      id: 'matrix.crash_performance',
      label: 'Crash / Sentry',
      codeHealth: crash.codeIntegrationPass ? 'PASS' : 'WARN',
      manualStatus: 'BLOCKED',
      relatedVerifyCommand: 'npm run verify:crash-performance',
      note: 'Code integration PASS; DSN/smoke/source maps manual.',
    },
    {
      id: 'matrix.telemetry',
      label: 'Post-launch telemetry',
      codeHealth: regression.codeHealth,
      manualStatus: 'BLOCKED',
      relatedVerifyCommand: 'npm run verify:post-launch-telemetry-readiness',
      note: `KPI ${telemetry.kpiGroups.length}+ funnels ${telemetry.funnels.length}+; dashboard SDK pending.`,
    },
    {
      id: 'matrix.analytics_runtime',
      label: 'Analytics runtime schema',
      codeHealth: schemaHealthy ? 'PASS' : 'FAIL',
      manualStatus: 'BLOCKED',
      relatedVerifyCommand: 'npm run verify:analytics-runtime',
      note: 'Schema PASS ≠ dashboard wired.',
    },
  ];
}

function buildNextActions(blockers: ManualLaunchBlocker[], groups: ManualLaunchBlockerGroup[]): string[] {
  const actions: string[] = [
    'Run internal EAS builds on iOS + Android — start device test matrix.',
    `Track manual blockers in ${MANUAL_LAUNCH_TRACKER_DOCS_PATH}.`,
  ];

  const internalBlocked = blockers.filter(
    (b) =>
      b.blocksInternalDeviceTest &&
      (b.status === 'pending' || b.status === 'blocked' || b.status === 'in_progress'),
  );
  if (internalBlocked.length > 0) {
    actions.push(
      `${internalBlocked.length} blocker(s) gate full internal test completion — prioritize IAP sandbox + device matrix.`,
    );
    actions.push(internalBlocked[0]!.nextAction);
  }

  const iapGroup = groups.find((g) => g.id === 'iap_revenuecat');
  if (iapGroup?.publicLaunchBlocked) {
    actions.push('Complete RevenueCat + store product setup before sandbox purchase tests.');
  }

  const privacyUrl = blockers.find((b) => b.id === 'privacy_url_published');
  if (privacyUrl && privacyUrl.status !== 'done') {
    actions.push('Publish privacy URL before public launch listing.');
  }

  const sentrySmoke = blockers.find((b) => b.id === 'sentry_dashboard_smoke_test');
  if (sentrySmoke && sentrySmoke.status !== 'done') {
    actions.push('Run Sentry dashboard smoke after DSN on internal build.');
  }

  return actions;
}

export function runManualLaunchTrackerAudit(
  _options: RunManualLaunchTrackerAuditOptions = {},
): ManualLaunchTrackerResult {
  const regression = runSoftLaunchRegressionCleanupAudit({ mode: 'soft_launch_candidate' });
  const internalReview = runSoftLaunchReadinessReview({ mode: 'internal_device_test' });

  const codeHealthStatus: ManualLaunchCodeHealthStatus = regression.codeHealth;
  const manualReadinessStatus: ManualLaunchReadinessStatus = regression.manualLaunchReadiness;

  const blockers = cloneBlockers();
  applyFactualStatusUpdates(blockers);
  const evidenceAudit = runManualLaunchEvidenceAudit();
  const roundOne = runManualLaunchRoundOneAudit(evidenceAudit.evidenceLog);
  const blockersWithEvidence = applyEvidenceStatusToBlockers(blockers, evidenceAudit.evidenceLog);
  const blockerGroups = buildBlockerGroups(blockersWithEvidence);

  const pendingPublicLaunchBlockers = blockersWithEvidence.filter(
    (b) =>
      b.blocksPublicLaunch &&
      (b.status === 'pending' || b.status === 'blocked' || b.status === 'in_progress'),
  ).length;

  const pendingInternalTestBlockers = blockersWithEvidence.filter(
    (b) =>
      b.blocksInternalDeviceTest &&
      (b.status === 'pending' || b.status === 'blocked' || b.status === 'in_progress'),
  ).length;

  const evidenceRecords = evidenceAudit.evidenceLog.map((e) => ({
    blockerOrTestId: e.blockerId ?? e.testCaseId ?? e.evidenceId,
    evidenceType: e.evidenceType,
    evidenceStatus:
      e.status === 'rejected' ? ('missing' as const) : e.status,
    evidenceLocation: e.evidenceLocation,
    verifiedBy: e.verifiedBy,
    verifiedAt: e.verifiedAt,
  }));

  const fakePassGuardActive =
    evidenceAudit.summary.fakePassGuardActive &&
    blockersWithEvidence.filter((b) => b.fakePassRisk).every((b) => b.status !== 'done');

  let overallStatus: ManualLaunchOverallStatus = 'blocked_for_public_launch';
  if (codeHealthStatus === 'FAIL') {
    overallStatus = 'blocked';
  } else if (pendingPublicLaunchBlockers === 0 && codeHealthStatus === 'PASS') {
    overallStatus = 'ready_for_release_candidate';
  } else if (internalReview.decision === 'proceed_internal_test') {
    overallStatus = 'ready_for_internal_device_test';
  }

  const internalDeviceTestDecision =
    internalReview.decision === 'proceed_internal_test'
      ? 'proceed_internal_device_test'
      : 'fix_required_before_internal_test';

  const publicLaunchDecision =
    pendingPublicLaunchBlockers > 0 ? 'blocked_for_public_launch' : 'ready_for_public_launch_review';

  const nextActions = [
    roundOne.nextManualAction,
    ...buildNextActions(blockersWithEvidence, blockerGroups),
    `Evidence: ${evidenceAudit.summary.missingEvidence}/${evidenceAudit.summary.totalEvidenceRequired} missing — attach before marking blockers done.`,
    `Round 1: ${roundOne.pendingTests}/${roundOne.totalRoundOneTests - roundOne.skippedTests} tests pending — see ${roundOne.docsPath}.`,
  ];

  return {
    overallStatus,
    codeHealthStatus,
    manualReadinessStatus,
    internalDeviceTestDecision,
    publicLaunchDecision,
    blockerGroups,
    blockers: blockersWithEvidence,
    deviceTestMatrix: [...MANUAL_LAUNCH_DEVICE_TEST_MATRIX],
    evidenceRecords,
    evidenceLog: evidenceAudit.evidenceLog,
    easBuildChecklist: evidenceAudit.easBuildChecklist,
    deviceTestEvidence: evidenceAudit.deviceTestEvidence,
    evidenceSummary: evidenceAudit.summary,
    nextActions,
    verificationMatrix: buildVerificationMatrix(codeHealthStatus),
    nonGoalsConfirmed: [...MANUAL_LAUNCH_NON_GOALS],
    pendingPublicLaunchBlockers,
    pendingInternalTestBlockers,
    fakePassGuardActive,
    roundOne,
    roundOneStatus: roundOne.roundOneStatus,
    roundOneMissingEvidence: roundOne.roundOneMissingEvidence,
    roundOneHighestPriorityMissing: roundOne.roundOneHighestPriorityMissing,
    roundOneCanStart: roundOne.roundOneCanStart,
    roundOneCanComplete: roundOne.roundOneCanComplete,
    roundOneNextManualAction: roundOne.nextManualAction,
    docsPath: MANUAL_LAUNCH_TRACKER_DOCS_PATH,
  };
}
