import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runPostLaunchTelemetryReadinessAudit } from '@/core/analytics/postLaunchTelemetryReadinessAudit';
import { runCrashPerformanceAudit } from '@/core/crashPerformance/crashPerformanceAudit';
import { buildIapManualSetupTracker } from '@/core/iapQa/iapManualSetupTrackerAudit';
import { runIapSandboxReadinessAudit } from '@/core/iapQa/iapSandboxReadinessAudit';
import { runManualLaunchTrackerAudit } from '@/core/manualLaunchTracker/manualLaunchTrackerAudit';
import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { detectRecentSystemExpansionRisk } from '@/core/releaseReadiness/noNewSystemFreezeAudit';
import { runPrivacyPolicyReadinessAudit } from '@/core/releaseReadiness/privacyPolicyReadinessAudit';
import { runSoftLaunchReadinessReview } from '@/core/releaseReadiness/softLaunchReviewAudit';
import { runStoreMetadataFinalizationAudit } from '@/core/releaseReadiness/storeMetadataFinalizationAudit';
import { runStoreScreenshotReadinessAudit } from '@/core/releaseReadiness/storeScreenshotReadinessAudit';
import { runSoftLaunchRegressionCleanupAudit } from '@/core/softLaunchRegressionCleanup/softLaunchRegressionCleanupAudit';
import {
  isAnalyticsSchemaCodeHealthy,
  summarizeCrashSdkStatus,
} from '@/core/softLaunchRegressionCleanup/verificationHealthHelpers';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  RELEASE_CANDIDATE_BOARD,
  RELEASE_CANDIDATE_DOCS_PATH,
  RELEASE_CANDIDATE_EXPECTED_SAVE_VERSION,
  RELEASE_CANDIDATE_GAMEPLAY_AREAS,
  RELEASE_CANDIDATE_NON_GOALS,
  RELEASE_CANDIDATE_PROTECTED_PATHS,
  buildReleaseCandidateStoreChecklistTemplate,
} from './releaseCandidateConstants';
import type {
  ReleaseCandidateAuditResult,
  ReleaseCandidateBlockerSummary,
  ReleaseCandidateEvidenceSummary,
  ReleaseCandidateHealthStatus,
  ReleaseCandidateLaunchDecision,
  ReleaseCandidateOverallStatus,
  ReleaseCandidateReadinessStatus,
  ReleaseCandidateStoreChecklistItem,
  RunReleaseCandidateAuditOptions,
} from './releaseCandidateTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function resolveStoreChecklist(): ReleaseCandidateStoreChecklistItem[] {
  const items = buildReleaseCandidateStoreChecklistTemplate();
  const metadata = runStoreMetadataFinalizationAudit({ mode: 'launch_candidate' });
  const screenshots = runStoreScreenshotReadinessAudit({ mode: 'launch_candidate' });
  const privacy = runPrivacyPolicyReadinessAudit({ mode: 'launch_candidate' });

  const privacyUrl = items.find((i) => i.id === 'store.privacy_url');
  if (privacyUrl && privacy.publishedPrivacyUrlIsPlaceholder) {
    privacyUrl.status = 'blocked';
  }

  const dataSafety = items.find((i) => i.id === 'privacy.data_safety_form');
  if (dataSafety && privacy.legalReviewPending) {
    dataSafety.status = 'pending_console';
  }

  if (metadata.metadataDraftPresent) {
    for (const id of ['store.app_name', 'store.subtitle_short_description', 'store.full_description', 'store.keywords', 'store.release_notes']) {
      const item = items.find((i) => i.id === id);
      if (item && item.status !== 'blocked') item.status = 'draft';
    }
  }

  if (metadata.consoleEntryPending) {
    for (const id of ['store.app_name', 'store.subtitle_short_description', 'store.full_description']) {
      const item = items.find((i) => i.id === id);
      if (item) item.status = 'pending_console';
    }
  }

  const iphoneShots = items.find((i) => i.id === 'visual.iphone_screenshots');
  const androidShots = items.find((i) => i.id === 'visual.android_screenshots');
  if (screenshots.screenshotsPending > 0) {
    if (iphoneShots) iphoneShots.status = 'pending_console';
    if (androidShots) androidShots.status = 'pending_console';
  }

  const iapSandbox = items.find((i) => i.id === 'iap.sandbox_status');
  const iapRestore = items.find((i) => i.id === 'iap.restore_status');
  if (iapSandbox) iapSandbox.status = 'blocked';
  if (iapRestore) iapRestore.status = 'blocked';

  return items;
}

function buildCodeRegressions(): string[] {
  const regression = runSoftLaunchRegressionCleanupAudit({ mode: 'soft_launch_candidate' });
  const regressions = [...regression.codeRegressions];
  const fullLoop = runFullLoopAnalysis();
  if (fullLoop.totalFAIL > 0) {
    regressions.push(`full_loop_fail_${fullLoop.totalFAIL}`);
  }
  if (!isAnalyticsSchemaCodeHealthy()) {
    regressions.push('analytics_schema_fail');
  }
  const expansion = detectRecentSystemExpansionRisk().filter((v) => v.id === 'risk.new_core_runtime_dir');
  if (expansion.length > 0) {
    regressions.push('forbidden_runtime_expansion');
  }
  if (SAVE_VERSION !== RELEASE_CANDIDATE_EXPECTED_SAVE_VERSION) {
    regressions.push(`save_version_${SAVE_VERSION}`);
  }
  for (const rel of RELEASE_CANDIDATE_PROTECTED_PATHS) {
    const content = readRepo(rel);
    if (content.includes('releaseCandidateState')) {
      regressions.push(`persist_pollution_${rel}`);
    }
  }
  return [...new Set(regressions)];
}

function buildCodeHealth(codeRegressions: string[]): ReleaseCandidateHealthStatus {
  if (codeRegressions.length > 0) return 'FAIL';
  const regression = runSoftLaunchRegressionCleanupAudit({ mode: 'soft_launch_candidate' });
  if (regression.codeHealth === 'WARN') return 'WARN';
  return 'PASS';
}

function buildGameplayReadiness(): ReleaseCandidateHealthStatus {
  const areas = RELEASE_CANDIDATE_GAMEPLAY_AREAS;
  if (areas.some((a) => a.status === 'FAIL')) return 'FAIL';
  if (areas.some((a) => a.status === 'WARN')) return 'WARN';
  return 'PASS';
}

function mapHealthToReadiness(health: 'PASS' | 'WARN' | 'BLOCKED' | 'FAIL'): ReleaseCandidateReadinessStatus {
  if (health === 'BLOCKED' || health === 'FAIL') return 'BLOCKED';
  if (health === 'WARN') return 'WARN';
  return 'READY';
}

function buildEvidenceSummary(manualTracker: ReturnType<typeof runManualLaunchTrackerAudit>): ReleaseCandidateEvidenceSummary {
  const s = manualTracker.evidenceSummary;
  const internalPriority = [
    'eas_cli_ready',
    'sentry_dashboard_smoke_test',
    'iap_sandbox_purchase_test',
    'iap_restore_test',
    'day8_pack_origin_event_smoke',
    'large_text_smoke',
  ];
  const publicPriority = [
    'store_screenshots_captured',
    'privacy_url_published',
    'app_store_metadata_entered',
    'sentry_source_maps_configured',
    'analytics_dashboard_created',
  ];

  const blockerIds = new Set(manualTracker.blockers.filter((b) => b.status !== 'done').map((b) => b.id));

  return {
    totalEvidenceRequired: s.totalEvidenceRequired,
    missingEvidence: s.missingEvidence,
    attachedEvidence: s.attachedEvidence,
    verifiedEvidence: s.verifiedEvidence,
    rejectedEvidence: s.rejectedEvidence,
    internalDeviceEvidenceStatus: s.internalDeviceEvidenceStatus,
    publicLaunchEvidenceStatus: s.publicLaunchEvidenceStatus,
    highestPriorityMissingEvidence: s.highestPriorityMissingEvidence,
    missingCount: s.missingEvidence,
    verifiedCount: s.verifiedEvidence,
    attachedCount: s.attachedEvidence,
    highestPriorityMissing: s.highestPriorityMissingEvidence,
    requiredBeforeInternalTest: internalPriority.filter((id) => blockerIds.has(id)),
    requiredBeforePublicLaunch: publicPriority.filter((id) => blockerIds.has(id)),
  };
}

function evaluatePublicLaunchDecision(
  codeHealth: ReleaseCandidateHealthStatus,
  manualTracker: ReturnType<typeof runManualLaunchTrackerAudit>,
  storeChecklist: ReleaseCandidateStoreChecklistItem[],
): ReleaseCandidateLaunchDecision {
  if (codeHealth === 'FAIL') return 'blocked';
  const publicPending = manualTracker.blockers.filter(
    (b) =>
      b.blocksPublicLaunch &&
      (b.status === 'pending' || b.status === 'blocked' || b.status === 'in_progress'),
  );
  const storeBlocked = storeChecklist.some(
    (i) => i.blocksPublicLaunch && (i.status === 'blocked' || i.status === 'pending_console' || i.status === 'missing'),
  );
  if (publicPending.length > 0 || storeBlocked) return 'blocked';
  return 'ready';
}

function evaluateInternalDeviceTestDecision(
  codeRegressions: string[],
  internalReview: ReturnType<typeof runSoftLaunchReadinessReview>,
): ReleaseCandidateLaunchDecision {
  if (codeRegressions.length > 0) return 'blocked';
  if (internalReview.decision === 'proceed_internal_test') return 'ready';
  return 'blocked';
}

export function runReleaseCandidateAudit(
  _options: RunReleaseCandidateAuditOptions = {},
): ReleaseCandidateAuditResult {
  const manualTracker = runManualLaunchTrackerAudit({ mode: 'internal_device_test' });
  const internalReview = runSoftLaunchReadinessReview({ mode: 'internal_device_test' });
  const regression = runSoftLaunchRegressionCleanupAudit({ mode: 'soft_launch_candidate' });
  const crash = runCrashPerformanceAudit({ mode: 'internal_device_test' });
  const crashSummary = summarizeCrashSdkStatus();
  const telemetry = runPostLaunchTelemetryReadinessAudit({ mode: 'soft_launch_candidate' });
  const privacy = runPrivacyPolicyReadinessAudit({ mode: 'launch_candidate' });
  const metadata = runStoreMetadataFinalizationAudit({ mode: 'launch_candidate' });
  const screenshots = runStoreScreenshotReadinessAudit({ mode: 'launch_candidate' });
  const iapSetup = buildIapManualSetupTracker();
  const iapSandbox = runIapSandboxReadinessAudit({ mode: 'launch_candidate' });

  const codeRegressions = buildCodeRegressions();
  const codeHealth = buildCodeHealth(codeRegressions);
  const gameplayReadiness = buildGameplayReadiness();
  const storeChecklist = resolveStoreChecklist();

  const storeReadiness: ReleaseCandidateReadinessStatus =
    metadata.health === 'BLOCKED' || screenshots.health === 'BLOCKED' ? 'BLOCKED' : 'WARN';

  const monetizationReadiness: ReleaseCandidateReadinessStatus =
    iapSetup.health === 'BLOCKED' || iapSandbox.health === 'BLOCKED' ? 'BLOCKED' : 'WARN';

  const privacyReadiness: ReleaseCandidateReadinessStatus = mapHealthToReadiness(privacy.health);

  const crashObservabilityReadiness: ReleaseCandidateReadinessStatus = crashSummary.codeIntegrationPass
    ? crashSummary.envPending || crashSummary.smokePending
      ? 'WARN'
      : 'READY'
    : 'BLOCKED';

  const analyticsReadiness: ReleaseCandidateReadinessStatus = isAnalyticsSchemaCodeHealthy()
    ? telemetry.health === 'BLOCKED'
      ? 'BLOCKED'
      : 'WARN'
    : 'BLOCKED';

  const devicePending = manualTracker.blockers.filter(
    (b) =>
      (b.category === 'device_test' || b.category === 'performance') &&
      b.status !== 'done' &&
      b.status !== 'not_applicable',
  ).length;
  const deviceTestReadiness: ReleaseCandidateReadinessStatus =
    devicePending > 0 ? 'BLOCKED' : 'READY';

  const publicLaunchDecision = evaluatePublicLaunchDecision(codeHealth, manualTracker, storeChecklist);
  const internalDeviceTestDecision = evaluateInternalDeviceTestDecision(codeRegressions, internalReview);

  let overallStatus: ReleaseCandidateOverallStatus = 'blocked_for_public_launch';
  if (codeHealth === 'FAIL') {
    overallStatus = 'blocked';
  } else if (publicLaunchDecision === 'ready') {
    overallStatus = 'ready_for_release_candidate';
  } else if (internalDeviceTestDecision === 'ready') {
    overallStatus = 'ready_for_internal_device_test';
  }

  const pendingPublic = manualTracker.blockers.filter(
    (b) =>
      b.blocksPublicLaunch &&
      (b.status === 'pending' || b.status === 'blocked' || b.status === 'in_progress'),
  );
  const pendingInternal = manualTracker.blockers.filter(
    (b) =>
      b.blocksInternalDeviceTest &&
      (b.status === 'pending' || b.status === 'blocked' || b.status === 'in_progress'),
  );

  const blockerSummary: ReleaseCandidateBlockerSummary = {
    totalManualBlockers: manualTracker.blockers.length,
    pendingPublicLaunch: pendingPublic.length,
    pendingInternalTest: pendingInternal.length,
    topPublicBlockers: pendingPublic.slice(0, 8).map((b) => `${b.id}: ${b.title}`),
    topInternalBlockers: pendingInternal.slice(0, 8).map((b) => `${b.id}: ${b.title}`),
  };

  const fakePassGuardActive = manualTracker.fakePassGuardActive;

  const requiredNextActions = [
    ...manualTracker.nextActions.slice(0, 4),
    'Run npm run verify:release-candidate before each release readiness review.',
    publicLaunchDecision === 'blocked'
      ? `Public launch blocked — ${pendingPublic.length} manual blocker(s) open.`
      : 'Public launch gate review.',
  ];

  const roundOneAudit = manualTracker.roundOne;

  return {
    overallStatus,
    codeHealth,
    gameplayReadiness,
    storeReadiness,
    monetizationReadiness,
    privacyReadiness,
    crashObservabilityReadiness,
    analyticsReadiness,
    deviceTestReadiness,
    publicLaunchDecision,
    internalDeviceTestDecision,
    blockerSummary,
    manualBlockers: pendingPublic.map((b) => b.id),
    codeRegressions,
    requiredNextActions,
    evidenceSummary: buildEvidenceSummary(manualTracker),
    gameplayAreas: [...RELEASE_CANDIDATE_GAMEPLAY_AREAS],
    storeChecklist,
    releaseBoard: [...RELEASE_CANDIDATE_BOARD],
    nonGoalsConfirmed: [...RELEASE_CANDIDATE_NON_GOALS],
    fakePassGuardActive,
    roundOne: {
      roundOneStatus: roundOneAudit.roundOneStatus,
      roundOneMissingEvidence: roundOneAudit.roundOneMissingEvidence,
      roundOneHighestPriorityMissing: roundOneAudit.roundOneHighestPriorityMissing,
      roundOneCanStart: roundOneAudit.roundOneCanStart,
      roundOneCanComplete: roundOneAudit.roundOneCanComplete,
      nextManualAction: roundOneAudit.nextManualAction,
      totalRoundOneTests: roundOneAudit.totalRoundOneTests,
      pendingTests: roundOneAudit.pendingTests,
      verifiedEvidence: roundOneAudit.verifiedEvidence,
      internalDeviceTestExecutionStatus: roundOneAudit.internalDeviceTestExecutionStatus,
    },
    docsPath: RELEASE_CANDIDATE_DOCS_PATH,
  };
}
