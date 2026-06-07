import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { NO_NEW_SYSTEM_FREEZE_REGISTERED_CORE_DIRS } from '@/core/releaseReadiness/noNewSystemFreezeConstants';
import { SAVE_VERSION } from '@/store/gamePersist';
import {
  isAnalyticsSchemaCodeHealthy,
  summarizeCrashSdkStatus,
  summarizePrivacyReadiness,
} from '@/core/softLaunchRegressionCleanup/verificationHealthHelpers';

import {
  MANUAL_LAUNCH_BLOCKER_GROUP_IDS,
  MANUAL_LAUNCH_BLOCKERS,
  MANUAL_LAUNCH_DEVICE_TEST_MATRIX,
  MANUAL_LAUNCH_TRACKER_DOCS_PATH,
  MANUAL_LAUNCH_TRACKER_EXPECTED_SAVE_VERSION,
  MANUAL_LAUNCH_TRACKER_MIN_BLOCKER_COUNT,
} from './manualLaunchTrackerConstants';
import {
  BLOCKER_EVIDENCE_CLOSE_REQUIREMENTS,
  INTERNAL_DEVICE_TEST_BATCH_IDS,
} from './manualLaunchEvidenceConstants';
import {
  MANUAL_LAUNCH_ROUND_ONE_DOCS_PATH,
  MANUAL_LAUNCH_ROUND_ONE_TEST_CASE_IDS,
} from './manualLaunchRoundOneConstants';
import { roundOneTestPassesWithoutEvidence } from './manualLaunchRoundOneAudit';
import {
  canCloseBlockerWithEvidence,
  evidenceTypeSatisfiesPassRule,
} from './manualLaunchEvidenceAudit';
import { runManualLaunchTrackerAudit } from './manualLaunchTrackerAudit';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyManualLaunchTrackerOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  overallStatus: string;
};

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function assert(checks: string[], ok: boolean, pass: string, fail = pass): boolean {
  checks.push(`${ok ? 'PASS' : 'FAIL'} ${ok ? pass : fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

export function verifyManualLaunchTrackerScenario(): VerifyManualLaunchTrackerOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const audit = runManualLaunchTrackerAudit({ mode: 'internal_device_test' });

  record(assert(checks, MANUAL_LAUNCH_BLOCKERS.length >= MANUAL_LAUNCH_TRACKER_MIN_BLOCKER_COUNT, `At least ${MANUAL_LAUNCH_TRACKER_MIN_BLOCKER_COUNT} manual blockers`));
  record(assert(checks, audit.blockers.length >= MANUAL_LAUNCH_TRACKER_MIN_BLOCKER_COUNT, 'Audit blocker count'));

  for (const groupId of MANUAL_LAUNCH_BLOCKER_GROUP_IDS) {
    const group = audit.blockerGroups.find((g) => g.id === groupId);
    record(assert(checks, Boolean(group), `${groupId} blocker group`));
  }

  record(assert(checks, audit.fakePassGuardActive, 'Fake PASS guard active'));
  record(
    warn(
      checks,
      audit.publicLaunchDecision === 'blocked_for_public_launch',
      'Public launch blocked (expected)',
      'Public launch should remain blocked',
    ) || true,
  );
  if (audit.publicLaunchDecision === 'blocked_for_public_launch') hasWarn = true;

  record(
    assert(
      checks,
      audit.internalDeviceTestDecision === 'proceed_internal_device_test',
      'Internal device test proceed decision',
    ),
  );
  record(
    assert(
      checks,
      audit.overallStatus === 'ready_for_internal_device_test' || audit.overallStatus === 'blocked_for_public_launch',
      'Overall status allows internal test path',
    ),
  );

  const iapIds = [
    'revenuecat_public_keys',
    'app_store_product_created',
    'play_console_product_created',
    'iap_sandbox_purchase_test',
    'iap_restore_test',
  ];
  for (const id of iapIds) {
    const b = audit.blockers.find((x) => x.id === id);
    record(assert(checks, b?.status === 'pending' || b?.status === 'blocked', `IAP blocker pending: ${id}`));
  }

  const storeIds = ['store_screenshots_captured', 'app_store_metadata_entered', 'release_notes_final'];
  for (const id of storeIds) {
    const b = audit.blockers.find((x) => x.id === id);
    record(assert(checks, b?.status === 'pending' || b?.status === 'blocked', `Store blocker pending: ${id}`));
  }

  const privacy = summarizePrivacyReadiness();
  record(assert(checks, privacy.placeholderUrlBlocked, 'Privacy URL placeholder blocker'));
  record(assert(checks, privacy.sentryProcessorListed, 'Sentry processor listed in privacy docs'));
  const sentryProcessor = audit.blockers.find((b) => b.id === 'privacy_policy_sentry_processor_added');
  record(
    assert(
      checks,
      sentryProcessor?.status === 'done',
      'Sentry processor blocker reflects code/docs ready',
    ),
  );

  const crash = summarizeCrashSdkStatus();
  record(assert(checks, crash.codeIntegrationPass, 'Crash code integration PASS'));
  record(warn(checks, crash.envPending, 'Sentry DSN pending', 'DSN should stay pending until set') || true);
  record(warn(checks, crash.smokePending, 'Sentry dashboard smoke pending', 'Smoke pending expected') || true);
  if (crash.envPending || crash.smokePending) hasWarn = true;

  const crashBlockers = ['sentry_dsn_set', 'sentry_dashboard_smoke_test', 'sentry_source_maps_configured'];
  for (const id of crashBlockers) {
    const b = audit.blockers.find((x) => x.id === id);
    record(assert(checks, b?.status !== 'done', `Crash blocker not fake PASS: ${id}`));
  }

  record(assert(checks, isAnalyticsSchemaCodeHealthy(), 'Analytics schema code healthy'));
  const analyticsPending = audit.blockers.filter((b) => b.category === 'analytics' && b.status !== 'done');
  record(assert(checks, analyticsPending.length >= 5, 'Analytics dashboard/SDK pending blockers'));
  record(
    assert(
      checks,
      audit.blockers.some((b) => b.id === 'iap_funnel_verified' && b.status === 'pending'),
      'IAP funnel pending blocker',
    ),
  );

  record(assert(checks, audit.deviceTestMatrix.length >= 20, 'Device test matrix 20+ cases'));
  record(assert(checks, audit.deviceTestMatrix.some((t) => t.platform === 'ios' || t.platform === 'both'), 'iOS test case'));
  record(assert(checks, audit.deviceTestMatrix.some((t) => t.platform === 'android' || t.platform === 'both'), 'Android test case'));

  const requiredTests = [
    'idt.day1_first_session',
    'idt.day8_pack_origin_event',
    'idt.day8_report_resume',
    'idt.iap_sandbox_purchase',
    'idt.sentry_crash_smoke',
    'idt.large_text_smoke',
    'idt.low_end_android_performance',
  ];
  for (const id of requiredTests) {
    record(assert(checks, audit.deviceTestMatrix.some((t) => t.id === id), `Device test: ${id}`));
  }

  record(assert(checks, audit.evidenceLog.length > 0, 'Evidence log model present'));
  record(assert(checks, audit.evidenceSummary.totalEvidenceRequired > 50, 'Evidence log populated'));
  record(assert(checks, audit.evidenceSummary.verifiedEvidence === 0, 'No verified evidence without manual attach'));
  record(assert(checks, audit.evidenceSummary.missingEvidence > 0, 'Evidence missing reported'));
  record(assert(checks, audit.easBuildChecklist.length >= 10, 'Internal EAS build checklist present'));
  record(assert(checks, audit.easBuildChecklist.some((i) => i.id === 'ios_internal_profile_ready'), 'iOS build checklist item'));
  record(assert(checks, audit.easBuildChecklist.some((i) => i.id === 'android_internal_profile_ready'), 'Android build checklist item'));
  record(assert(checks, audit.deviceTestEvidence.length === INTERNAL_DEVICE_TEST_BATCH_IDS.length, '20 device test cases evidence-linked'));
  record(
    assert(
      checks,
      !canCloseBlockerWithEvidence('sentry_dashboard_smoke_test', audit.evidenceLog),
      'Sentry smoke dashboard_event without verify does not close blocker',
    ),
  );
  record(
    assert(
      checks,
      !evidenceTypeSatisfiesPassRule('iap_sandbox_purchase_test', 'purchase_log', 'missing'),
      'IAP sandbox purchase_log missing does not PASS',
    ),
  );
  record(
    assert(
      checks,
      !canCloseBlockerWithEvidence('privacy_url_published', audit.evidenceLog),
      'Privacy URL url evidence required before close',
    ),
  );
  record(
    assert(
      checks,
      !canCloseBlockerWithEvidence('store_screenshots_captured', audit.evidenceLog),
      'Store screenshots screenshot evidence required',
    ),
  );
  record(
    assert(
      checks,
      audit.blockers.filter((b) => b.fakePassRisk && b.status === 'done').length === 0,
      'Missing evidence does not mark fakePassRisk blockers done',
    ),
  );
  record(assert(checks, Object.keys(BLOCKER_EVIDENCE_CLOSE_REQUIREMENTS).length >= 8, 'Blocker close rules defined'));
  record(assert(checks, audit.evidenceRecords.every((e) => e.evidenceStatus === 'missing'), 'Legacy evidence records all missing'));

  record(assert(checks, audit.roundOne.totalRoundOneTests >= 20, 'Round 1 test plan present'));
  record(assert(checks, audit.roundOne.testCases.length === MANUAL_LAUNCH_ROUND_ONE_TEST_CASE_IDS.length, 'Round 1 at least 20 test cases'));
  record(assert(checks, audit.roundOne.testCases.some((t) => t.testCaseId === 'day1_first_session'), 'Round 1 Day 1 first session test'));
  record(assert(checks, audit.roundOne.testCases.some((t) => t.testCaseId === 'day8_pack_origin_event_appears'), 'Round 1 Day 8 pack-origin test'));
  record(assert(checks, audit.roundOne.testCases.some((t) => t.testCaseId === 'day8_map_district_reaction'), 'Round 1 map reaction test'));
  record(assert(checks, audit.roundOne.testCases.some((t) => t.testCaseId === 'day8_operational_resources_sheet'), 'Round 1 operational resources sheet test'));
  record(assert(checks, audit.roundOne.testCases.some((t) => t.testCaseId === 'large_text_hub_map_report'), 'Round 1 large text test'));
  record(assert(checks, audit.roundOne.testCases.some((t) => t.testCaseId === 'offline_no_network_launch'), 'Round 1 offline launch test'));
  record(assert(checks, audit.roundOne.testCases.some((t) => t.testCaseId === 'sentry_dashboard_smoke_if_env_ready'), 'Round 1 Sentry conditional test'));
  record(assert(checks, existsSync(join(REPO_ROOT, MANUAL_LAUNCH_ROUND_ONE_DOCS_PATH)), 'Evidence attach procedure docs exist'));
  record(
    assert(
      checks,
      readRepo(MANUAL_LAUNCH_ROUND_ONE_DOCS_PATH).includes('Evidence attach format'),
      'Evidence attach format in Round 1 docs',
    ),
  );
  record(assert(checks, audit.roundOne.verifiedEvidence === 0, 'Round 1 verifiedEvidence 0'));
  record(assert(checks, audit.roundOne.pendingTests >= 19, 'Round 1 tests pending'));
  record(
    assert(
      checks,
      !roundOneTestPassesWithoutEvidence('day1_first_session'),
      'No evidence → no Round 1 test PASS',
    ),
  );
  record(assert(checks, audit.roundOne.fakePassGuardViolations === 0, 'Round 1 fake pass guard violations 0'));
  record(
    assert(
      checks,
      audit.roundOne.internalDeviceTestExecutionStatus === 'ready_to_execute',
      'Internal device test ready_to_execute',
    ),
  );
  record(assert(checks, audit.roundOne.canProceedPublicLaunch === false, 'Round 1 public launch blocked'));
  record(assert(checks, audit.roundOneCanStart, 'Round 1 can start manual execution'));
  record(assert(checks, !audit.roundOneCanComplete, 'Round 1 cannot complete without verified evidence'));

  record(assert(checks, audit.verificationMatrix.length >= 8, 'Verification matrix populated'));
  record(assert(checks, audit.nonGoalsConfirmed.length >= 8, 'Non-goals confirmed'));

  record(assert(checks, SAVE_VERSION === MANUAL_LAUNCH_TRACKER_EXPECTED_SAVE_VERSION, 'SAVE_VERSION unchanged'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('manualLaunchTrackerState'), 'persist shape unchanged'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('manualLaunchTracker'), 'applyDecision unchanged'));
  record(
    assert(
      checks,
      !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('manualLaunchTracker'),
      'dayPipeline unchanged',
    ),
  );
  record(assert(checks, existsSync(join(REPO_ROOT, MANUAL_LAUNCH_TRACKER_DOCS_PATH)), 'Tracker docs exist'));
  record(assert(checks, readRepo('package.json').includes('verify:manual-launch-tracker'), 'package.json script'));
  record(assert(checks, NO_NEW_SYSTEM_FREEZE_REGISTERED_CORE_DIRS.includes('src/core/manualLaunchTracker'), 'Freeze registry includes manualLaunchTracker'));

  const fullLoop = runFullLoopAnalysis();
  record(assert(checks, fullLoop.totalFAIL === 0, 'verify:full-loop compatible'));

  if (audit.manualReadinessStatus === 'BLOCKED') {
    checks.push('WARN manual readiness BLOCKED (expected until manual work done)');
    hasWarn = true;
  }

  return {
    ok,
    warn: hasWarn,
    checks,
    overallStatus: audit.overallStatus,
  };
}
