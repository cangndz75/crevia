import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { buildIapManualSetupTracker } from '@/core/iapQa/iapManualSetupTrackerAudit';
import { NO_NEW_SYSTEM_FREEZE_REGISTERED_CORE_DIRS } from '@/core/releaseReadiness/noNewSystemFreezeConstants';
import { SAVE_VERSION } from '@/store/gamePersist';
import {
  isAnalyticsSchemaCodeHealthy,
  summarizeCrashSdkStatus,
  summarizePrivacyReadiness,
} from '@/core/softLaunchRegressionCleanup/verificationHealthHelpers';

import {
  RELEASE_CANDIDATE_DOCS_PATH,
  RELEASE_CANDIDATE_EXPECTED_SAVE_VERSION,
  RELEASE_CANDIDATE_GAMEPLAY_AREAS,
  RELEASE_CANDIDATE_NON_GOALS,
  RELEASE_CANDIDATE_PROTECTED_PATHS,
} from './releaseCandidateConstants';
import { runReleaseCandidateAudit } from './releaseCandidateAudit';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyReleaseCandidateOutcome = {
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

export function verifyReleaseCandidateScenario(): VerifyReleaseCandidateOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const audit = runReleaseCandidateAudit({ mode: 'internal_device_test' });

  record(assert(checks, Boolean(audit.overallStatus), 'ReleaseCandidateAuditResult produced'));
  record(
    warn(
      checks,
      audit.publicLaunchDecision === 'blocked',
      'publicLaunchDecision blocked (expected)',
      'Public launch should remain blocked',
    ) || true,
  );
  if (audit.publicLaunchDecision === 'blocked') hasWarn = true;

  record(
    assert(
      checks,
      audit.internalDeviceTestDecision === 'ready',
      'internalDeviceTestDecision ready/proceed',
    ),
  );
  record(
    assert(
      checks,
      audit.overallStatus === 'ready_for_internal_device_test' || audit.overallStatus === 'blocked_for_public_launch',
      'Overall status internal-test path',
    ),
  );

  record(assert(checks, audit.codeHealth !== 'FAIL', 'codeHealth not FAIL from manual blockers'));
  record(assert(checks, audit.codeRegressions.length === 0, 'No code regressions'));
  record(assert(checks, audit.manualBlockers.length > 0, 'Manual blockers listed separately'));
  record(assert(checks, audit.fakePassGuardActive, 'Fake PASS guard active'));

  record(assert(checks, existsSync(join(REPO_ROOT, 'src/core/onboarding/verifyFirstTenMinutesScenario.ts')), 'first-10-minutes verify module'));
  record(assert(checks, runFullLoopAnalysis().totalFAIL === 0, 'full-loop PASS reference'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'src/core/ux/verifyFullUxFlowScenario.ts')), 'full-ux-flow verify module'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'src/core/offlineResume/verifyOfflineResumeScenario.ts')), 'offline-resume verify module'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'src/core/uiDensity/verifyUiDensityScenario.ts')), 'ui-density verify module'));
  record(assert(checks, summarizeCrashSdkStatus().codeIntegrationPass, 'crash code integration PASS reference'));
  record(assert(checks, isAnalyticsSchemaCodeHealthy(), 'analytics schema PASS reference'));
  record(assert(checks, SAVE_VERSION === RELEASE_CANDIDATE_EXPECTED_SAVE_VERSION, 'SAVE_VERSION 23'));

  for (const rel of RELEASE_CANDIDATE_PROTECTED_PATHS) {
    record(assert(checks, !readRepo(rel).includes('releaseCandidate'), `Protected file clean: ${rel}`));
  }

  const privacy = summarizePrivacyReadiness();
  record(assert(checks, privacy.placeholderUrlBlocked, 'Privacy URL placeholder public blocker'));
  record(
    assert(
      checks,
      audit.storeChecklist.some((i) => i.id === 'visual.iphone_screenshots' && i.status !== 'ready' && i.status !== 'done'),
      'Screenshots pending blocker',
    ),
  );
  record(
    assert(
      checks,
      audit.storeChecklist.some((i) => i.id === 'store.privacy_url' && i.status === 'blocked'),
      'Metadata privacy URL tracking blocked',
    ),
  );
  record(assert(checks, audit.storeChecklist.length >= 20, 'Store visual asset checklist present'));

  const iapBlockers = [
    'revenuecat_public_keys',
    'app_store_product_created',
    'play_console_product_created',
    'iap_sandbox_purchase_test',
    'iap_restore_test',
  ];
  for (const id of iapBlockers) {
    record(
      assert(
        checks,
        audit.manualBlockers.includes(id) ||
          audit.blockerSummary.topPublicBlockers.some((b) => b.startsWith(id)),
        `IAP blocker tracked: ${id}`,
      ),
    );
  }
  record(assert(checks, audit.storeChecklist.some((i) => i.section === 'iap_metadata'), 'IAP product metadata checklist'));

  const iapSetup = buildIapManualSetupTracker();
  record(assert(checks, iapSetup.productMetadataCopyReady === true, 'IAP product copy ready'));
  record(
    assert(
      checks,
      iapSetup.dashboardChecklistStatus === 'ready_for_manual_entry',
      'Dashboard entry checklist ready',
    ),
  );
  record(assert(checks, iapSetup.storeProductsPending === true, 'IAP product setup pending'));
  record(assert(checks, iapSetup.manualVerificationPending === true, 'IAP sandbox/restore pending'));
  record(assert(checks, (iapSetup.verifiedEvidenceCount ?? 0) === 0, 'IAP dashboard verified evidence 0'));

  record(assert(checks, audit.blockerSummary.topInternalBlockers.some((b) => b.includes('sentry')) || audit.manualBlockers.some((id) => id.includes('sentry')), 'Sentry blockers tracked'));
  record(assert(checks, summarizeCrashSdkStatus().envPending, 'Sentry DSN pending'));
  record(assert(checks, summarizeCrashSdkStatus().smokePending, 'Dashboard smoke pending'));
  record(assert(checks, summarizeCrashSdkStatus().codeIntegrationPass, 'Crash code vs manual separation'));

  record(assert(checks, isAnalyticsSchemaCodeHealthy(), 'Analytics schema PASS'));
  record(assert(checks, audit.analyticsReadiness !== 'READY', 'Analytics dashboard pending public blocker'));

  record(
    assert(
      checks,
      audit.blockerSummary.topInternalBlockers.some((b) => b.includes('ios')) ||
        audit.evidenceSummary.requiredBeforeInternalTest.length > 0,
      'iOS device test pending',
    ),
  );
  record(
    assert(
      checks,
      audit.blockerSummary.topInternalBlockers.some((b) => b.includes('android')) ||
        audit.evidenceSummary.requiredBeforeInternalTest.length > 0,
      'Android device test pending',
    ),
  );
  record(assert(checks, audit.deviceTestReadiness === 'BLOCKED', 'Device test readiness BLOCKED'));
  record(assert(checks, RELEASE_CANDIDATE_GAMEPLAY_AREAS.length >= 10, 'Gameplay readiness areas listed'));
  record(assert(checks, audit.gameplayAreas.every((a) => a.status !== 'FAIL'), 'Gameplay areas no FAIL'));
  record(assert(checks, audit.evidenceSummary.totalEvidenceRequired > 50, 'ReleaseCandidate evidence summary total'));
  record(assert(checks, audit.evidenceSummary.missingEvidence > 0, 'Evidence missing count tracked'));
  record(assert(checks, audit.evidenceSummary.verifiedEvidence === 0, 'No fake verified evidence'));
  record(assert(checks, audit.evidenceSummary.internalDeviceEvidenceStatus === 'BLOCKED', 'Internal device evidence BLOCKED'));
  record(assert(checks, audit.evidenceSummary.publicLaunchEvidenceStatus === 'BLOCKED', 'Public launch evidence BLOCKED'));
  record(assert(checks, audit.fakePassGuardActive, 'Release candidate fake PASS guard'));
  record(assert(checks, audit.roundOne.totalRoundOneTests >= 20, 'Release candidate Round 1 plan'));
  record(assert(checks, audit.roundOne.verifiedEvidence === 0, 'Release candidate Round 1 verified 0'));
  record(
    assert(
      checks,
      audit.roundOne.internalDeviceTestExecutionStatus === 'ready_to_execute',
      'Release candidate internal test ready_to_execute',
    ),
  );
  record(assert(checks, audit.roundOne.roundOneCanStart, 'Release candidate Round 1 can start'));
  record(assert(checks, !audit.roundOne.roundOneCanComplete, 'Release candidate Round 1 not complete'));
  record(assert(checks, audit.releaseBoard.length >= 10, 'Release readiness board present'));
  record(assert(checks, audit.nonGoalsConfirmed.length >= RELEASE_CANDIDATE_NON_GOALS.length, 'Non-goals confirmed'));
  record(assert(checks, existsSync(join(REPO_ROOT, RELEASE_CANDIDATE_DOCS_PATH)), 'Release candidate docs exist'));
  record(assert(checks, readRepo('package.json').includes('verify:release-candidate'), 'package.json script'));
  record(assert(checks, NO_NEW_SYSTEM_FREEZE_REGISTERED_CORE_DIRS.includes('src/core/releaseCandidate'), 'Freeze registry includes releaseCandidate'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'src/core/manualLaunchTracker/manualLaunchTrackerAudit.ts')), 'manualLaunchTracker integration'));

  if (audit.codeHealth === 'WARN') {
    checks.push('WARN codeHealth WARN (expected — dashboard/env pending)');
    hasWarn = true;
  }
  if (audit.storeReadiness === 'BLOCKED') {
    checks.push('WARN storeReadiness BLOCKED (expected)');
    hasWarn = true;
  }

  return {
    ok,
    warn: hasWarn,
    checks,
    overallStatus: audit.overallStatus,
  };
}
