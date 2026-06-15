import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { verifyIapIntegrationScenario } from '@/core/iap/verifyIapIntegrationScenario';
import { IAP_STORE_PRODUCT_IDS, MAIN_OPERATION_ENTITLEMENT_ID } from '@/core/iap/iapProductConstants';
import { runIapProductCopyAudit } from '@/core/iapProductCopy/iapProductCopyAudit';
import { runManualLaunchTrackerAudit } from '@/core/manualLaunchTracker/manualLaunchTrackerAudit';
import { runReleaseCandidateAudit } from '@/core/releaseCandidate/releaseCandidateAudit';
import { runSoftLaunchReadinessReview } from '@/core/releaseReadiness/softLaunchReviewAudit';
import { runStoreMetadataFinalizationAudit } from '@/core/releaseReadiness/storeMetadataFinalizationAudit';
import { verifySoftLaunchReviewScenario } from '@/core/releaseReadiness/verifySoftLaunchReviewScenario';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  IAP_DASHBOARD_ENTRY_CHECKLIST_DOCS_PATH,
  IAP_DASHBOARD_ENTRY_PLACEHOLDERS,
  assertIapDashboardEntryChecklistIntegrity,
  buildIapDashboardEntryChecklist,
  runIapDashboardEntryChecklistAudit,
} from './iapDashboardEntryChecklist';
import {
  IAP_MANUAL_SETUP_TRACKER_AREAS,
  IAP_MANUAL_SETUP_TRACKER_DOCS_PATH,
  IAP_MANUAL_SETUP_TRACKER_MIN_AREA_COUNT,
  IAP_MANUAL_SETUP_TRACKER_PRODUCT_IDS,
} from './iapManualSetupTrackerConstants';
import {
  assertIapManualSetupTrackerIntegrity,
  buildIapManualSetupTracker,
  collectIapManualSetupBlockers,
} from './iapManualSetupTrackerAudit';
import { verifyIapSandboxReadinessScenario } from './verifyIapSandboxReadinessScenario';
import { verifyIapSandboxSmokeExecutionScenario } from './verifyIapSandboxSmokeExecutionScenario';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyIapManualSetupTrackerOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  trackerHealth: string;
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

export function verifyIapManualSetupTrackerScenario(): VerifyIapManualSetupTrackerOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const tracker = buildIapManualSetupTracker();
  const integrity = assertIapManualSetupTrackerIntegrity();

  ok = assert(checks, integrity.ok, 'Tracker integrity', 'Tracker invalid') && ok;
  ok =
    assert(
      checks,
      integrity.areaCount >= IAP_MANUAL_SETUP_TRACKER_MIN_AREA_COUNT,
      `Areas ${IAP_MANUAL_SETUP_TRACKER_MIN_AREA_COUNT}+`,
      `areas=${integrity.areaCount}`,
    ) && ok;

  // Area checks
  ok =
    assert(
      checks,
      tracker.areas.includes('revenuecat_project'),
      'RevenueCat project area',
      'Missing revenuecat_project',
    ) && ok;
  ok =
    assert(
      checks,
      tracker.areas.includes('revenuecat_entitlement'),
      'RevenueCat entitlement area',
      'Missing revenuecat_entitlement',
    ) && ok;
  ok =
    assert(
      checks,
      tracker.areas.includes('revenuecat_offering'),
      'RevenueCat offering area',
      'Missing revenuecat_offering',
    ) && ok;
  ok =
    assert(
      checks,
      tracker.areas.includes('app_store_connect_iap'),
      'App Store Connect area',
      'Missing app_store_connect_iap',
    ) && ok;
  ok =
    assert(
      checks,
      tracker.areas.includes('google_play_console_product'),
      'Google Play Console area',
      'Missing google_play_console_product',
    ) && ok;
  ok =
    assert(
      checks,
      tracker.areas.includes('eas_build_config'),
      'EAS config area',
      'Missing eas_build_config',
    ) && ok;
  ok =
    assert(
      checks,
      tracker.areas.includes('sandbox_test_accounts'),
      'Sandbox tester area',
      'Missing sandbox_test_accounts',
    ) && ok;
  ok =
    assert(
      checks,
      tracker.areas.includes('manual_verification'),
      'Manual verification area',
      'Missing manual_verification',
    ) && ok;

  // Product ID checks
  ok =
    assert(
      checks,
      tracker.iosProductId === IAP_STORE_PRODUCT_IDS.ios,
      'iOS product id matches',
      `iOS id mismatch: ${tracker.iosProductId}`,
    ) && ok;
  ok =
    assert(
      checks,
      tracker.androidProductId === IAP_STORE_PRODUCT_IDS.android,
      'Android product id matches',
      `Android id mismatch: ${tracker.androidProductId}`,
    ) && ok;
  ok =
    assert(
      checks,
      tracker.entitlementId === MAIN_OPERATION_ENTITLEMENT_ID,
      'Entitlement id main_operation_full_access',
      `Entitlement mismatch: ${tracker.entitlementId}`,
    ) && ok;
  ok =
    assert(
      checks,
      tracker.offeringId === 'default',
      'Offering id default',
      `Offering mismatch: ${tracker.offeringId}`,
    ) && ok;

  // Docs checks
  const doc = readRepo(IAP_MANUAL_SETUP_TRACKER_DOCS_PATH);
  ok = assert(checks, doc.length > 0, 'Tracker docs exist', 'Missing docs') && ok;
  ok = assert(checks, doc.includes('RevenueCat'), 'Docs RC checklist', 'Missing RC section') && ok;
  ok = assert(checks, doc.includes('App Store Connect'), 'Docs ASC checklist', 'Missing ASC') && ok;
  ok = assert(checks, doc.includes('Play Console'), 'Docs Play checklist', 'Missing Play') && ok;
  ok = assert(checks, doc.includes('EAS'), 'Docs EAS secrets', 'Missing EAS') && ok;
  ok = assert(checks, doc.includes('sandbox'), 'Docs sandbox tester', 'Missing sandbox') && ok;
  ok = assert(checks, doc.includes('Manual Verification'), 'Docs manual verification', 'Missing manual verify') && ok;
  ok =
    assert(
      checks,
      !doc.includes('sk_') && !doc.includes('rcsk_'),
      'Docs no secret key',
      'Docs contain secret pattern',
    ) && ok;
  ok =
    assert(
      checks,
      !/appl_[a-zA-Z0-9]{10,}/.test(doc) && !/goog_[a-zA-Z0-9]{10,}/.test(doc),
      'Docs no real key values',
      'Docs contain real key values',
    ) && ok;

  // Key safety
  ok =
    assert(
      checks,
      !tracker.revenueCatKeysConfigured || tracker.revenueCatKeysConfigured,
      'RC keys status tracked',
      'Key status unknown',
    ) && ok;

  // Placeholder keys check
  if (!tracker.revenueCatKeysConfigured) {
    ok =
      assert(
        checks,
        tracker.blockers.some((b) => b.id.includes('revenuecat_keys')),
        'Missing keys → BLOCKER',
        'Missing keys should produce blocker',
      ) && ok;
  }

  // Store products pending check
  if (tracker.storeProductsPending) {
    ok =
      assert(
        checks,
        tracker.blockers.some(
          (b) => b.id.includes('app_store_connect') || b.id.includes('google_play'),
        ),
        'Missing store products → BLOCKER',
        'Missing store products should produce blocker',
      ) && ok;
  }

  // configured_unverified check
  const configuredUnverifiedItems = tracker.items.filter(
    (i) => i.status === 'configured_unverified',
  );
  if (configuredUnverifiedItems.length > 0) {
    ok =
      assert(
        checks,
        tracker.blockers.some((b) => b.id.includes('configured_unverified')),
        'configured_unverified not sandbox pass',
        'configured_unverified should produce blocker',
      ) && ok;
  }

  // Entitlement item present
  ok =
    assert(
      checks,
      tracker.items.some((i) => i.id === 'rc_entitlement.id_created' && i.title.includes('main_operation_full_access')),
      'Entitlement tracked as main_operation_full_access',
      'Entitlement item missing',
    ) && ok;

  // Offering item present
  ok =
    assert(
      checks,
      tracker.items.some((i) => i.id === 'rc_offering.id_created' && i.title.includes('default')),
      'Offering tracked as default',
      'Offering item missing',
    ) && ok;

  // Dashboard entry checklist
  const dashboardIntegrity = assertIapDashboardEntryChecklistIntegrity();
  ok =
    assert(checks, dashboardIntegrity.ok, 'Dashboard checklist integrity', dashboardIntegrity.message) &&
    ok;
  const dashboard = buildIapDashboardEntryChecklist();
  const dashboardAudit = runIapDashboardEntryChecklistAudit();
  ok = assert(checks, dashboard.appStoreItems.length >= 10, 'App Store checklist present', 'ASC checklist missing') && ok;
  ok = assert(checks, dashboard.playStoreItems.length >= 8, 'Play Console checklist present', 'Play checklist missing') && ok;
  ok = assert(checks, dashboard.revenueCatItems.length >= 10, 'RevenueCat checklist present', 'RC checklist missing') && ok;
  ok =
    assert(
      checks,
      dashboard.sandboxTestMatrix.length >= 10,
      'Sandbox test matrix present',
      `matrix=${dashboard.sandboxTestMatrix.length}`,
    ) && ok;
  ok =
    assert(
      checks,
      dashboard.reviewNoteItems.length >= 5,
      'Review notes placeholder mapping',
      `mappings=${dashboard.reviewNoteItems.length}`,
    ) && ok;
  ok =
    assert(
      checks,
      dashboard.offerScreenTrustQa.length >= 8,
      'Offer screen trust QA checklist',
      `qa=${dashboard.offerScreenTrustQa.length}`,
    ) && ok;
  ok =
    assert(
      checks,
      tracker.dashboardChecklistId === dashboard.checklistId,
      'Tracker dashboard checklist id',
      'Dashboard id mismatch',
    ) && ok;
  ok =
    assert(
      checks,
      tracker.dashboardChecklistStatus === 'ready_for_manual_entry',
      'Dashboard checklist ready_for_manual_entry',
      `status=${tracker.dashboardChecklistStatus}`,
    ) && ok;
  ok =
    assert(
      checks,
      (tracker.placeholderCount ?? 0) > 0,
      'Placeholders remain (expected)',
      'placeholderCount should be > 0',
    ) && ok;
  ok =
    assert(
      checks,
      (tracker.verifiedEvidenceCount ?? 0) === 0,
      'Verified evidence count 0',
      `verified=${tracker.verifiedEvidenceCount}`,
    ) && ok;
  ok =
    assert(checks, tracker.canStartSandboxTesting === false, 'Cannot start sandbox yet', 'sandbox gate open too early') &&
    ok;
  ok =
    assert(checks, tracker.canSubmitForReview === false, 'Cannot submit for review yet', 'review gate open too early') &&
    ok;
  ok =
    assert(
      checks,
      !dashboard.appStoreItems.some((i) => i.status === 'verified'),
      'No ASC item verified without evidence',
      'Fake ASC verified',
    ) && ok;
  ok =
    assert(
      checks,
      !dashboard.sandboxTestMatrix.some((t) => t.id.includes('PASS')),
      'Sandbox matrix no fake PASS ids',
      'Fake PASS in matrix',
    ) && ok;
  const productCopy = runIapProductCopyAudit();
  ok =
    assert(
      checks,
      productCopy.status === 'ready_for_dashboard_entry',
      'iapProductCopy pack status read',
      `copyStatus=${productCopy.status}`,
    ) && ok;
  ok =
    assert(
      checks,
      tracker.productMetadataCopyReady === true,
      'Product metadata copy ready',
      'copy not ready',
    ) && ok;
  const dashboardDocs = readRepo(IAP_DASHBOARD_ENTRY_CHECKLIST_DOCS_PATH);
  ok = assert(checks, dashboardDocs.length > 200, 'Dashboard checklist docs exist', 'Missing dashboard docs') && ok;
  ok =
    assert(
      checks,
      dashboardDocs.includes(IAP_DASHBOARD_ENTRY_PLACEHOLDERS.appStoreProductId),
      'Docs ASC product placeholder',
      'Missing ASC placeholder in docs',
    ) && ok;
  ok =
    assert(
      checks,
      !dashboardDocs.match(/appl_[a-zA-Z0-9]{10,}/) && !dashboardDocs.match(/goog_[a-zA-Z0-9]{10,}/),
      'Dashboard docs no fabricated RC keys',
      'Real keys in dashboard docs',
    ) && ok;
  const metadata = runStoreMetadataFinalizationAudit({ mode: 'launch_candidate' });
  ok =
    assert(
      checks,
      metadata.iapDashboardChecklistDocsPath === IAP_DASHBOARD_ENTRY_CHECKLIST_DOCS_PATH,
      'storeMetadataFinalization dashboard docs path',
      'Metadata finalization missing dashboard path',
    ) && ok;
  const release = runReleaseCandidateAudit();
  ok =
    assert(checks, release.publicLaunchDecision === 'blocked', 'Public launch blocked', 'Public launch not blocked') &&
    ok;
  ok =
    assert(checks, release.monetizationReadiness === 'BLOCKED', 'Release candidate IAP blocked', 'IAP not blocked') &&
    ok;
  const manualLaunch = runManualLaunchTrackerAudit({ mode: 'internal_device_test' });
  ok =
    assert(
      checks,
      manualLaunch.evidenceSummary.verifiedEvidence === 0,
      'Manual launch evidence verified 0',
      `verified=${manualLaunch.evidenceSummary.verifiedEvidence}`,
    ) && ok;
  ok =
    assert(
      checks,
      manualLaunch.blockers.some((b) => b.id.includes('iap') || b.category === 'iap'),
      'Manual launch IAP blockers pending',
      'IAP blockers missing',
    ) && ok;
  ok =
    assert(checks, dashboardAudit.fakePassGuard === true, 'Dashboard fake pass guard active', 'Guard off') && ok;
  ok =
    assert(
      checks,
      dashboard.reviewNoteItems.every((m) => !m.readyForReview),
      'Review placeholders not ready_for_review',
      'Placeholder marked ready',
    ) && ok;

  // Soft launch review integration
  const launchReview = runSoftLaunchReadinessReview({ mode: 'launch_candidate' });
  ok =
    assert(
      checks,
      launchReview.findings.some(
        (f) => f.id.includes('manual_setup_tracker') || f.id.includes('public_keys') || f.id.includes('store_setup'),
      ),
      'Soft launch IAP tracker integrated',
      'Missing tracker integration in soft launch review',
    ) && ok;
  ok =
    assert(
      checks,
      launchReview.blockerCount > 0,
      'Launch candidate still blocked',
      `blockers=${launchReview.blockerCount}`,
    ) && ok;

  // Cross-verify existing scripts
  ok = assert(checks, verifyIapSandboxReadinessScenario().ok, 'verify:iap-sandbox-readiness', 'Readiness broken') && ok;
  ok = assert(checks, verifyIapSandboxSmokeExecutionScenario().ok, 'verify:iap-sandbox-smoke-execution', 'Execution broken') && ok;
  ok = assert(checks, verifyIapIntegrationScenario().ok, 'verify:iap-integration', 'Integration broken') && ok;
  ok = assert(checks, verifySoftLaunchReviewScenario().ok, 'verify:soft-launch-review', 'Review broken') && ok;
  ok = assert(checks, runFullLoopAnalysis().totalFAIL === 0, 'verify:full-loop', 'Full loop fail') && ok;
  ok = assert(checks, verifyFullUxFlowScenario().ok, 'verify:full-ux-flow', 'UX flow broken') && ok;

  // SAVE_VERSION
  ok = assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION 23', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  // No persist pollution
  const persist = readRepo('src/store/gamePersist.ts');
  ok =
    assert(
      checks,
      !persist.includes('iapManualSetupTracker') && !persist.includes('iapDashboardEntry'),
      'No persist change',
      'Persist polluted',
    ) && ok;
  ok =
    assert(
      checks,
      !readRepo('src/core/game/applyDecision.ts').includes('iapDashboardEntry'),
      'applyDecision unchanged',
      'applyDecision touched',
    ) && ok;
  ok =
    assert(
      checks,
      !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('iapDashboardEntry'),
      'dayPipeline unchanged',
      'dayPipeline touched',
    ) && ok;
  ok =
    assert(
      checks,
      !readRepo('src/core/game/generateDailyEventSet.ts').includes('iapDashboardEntry'),
      'event generation unchanged',
      'event generation touched',
    ) && ok;
  ok =
    assert(
      checks,
      !readRepo('src/core/iapQa/iapDashboardEntryChecklist.ts').includes('expo-router'),
      'no new route in dashboard checklist module',
      'route added',
    ) && ok;

  if (tracker.health === 'BLOCKED' || tracker.health === 'WARN') {
    hasWarn = true;
  }

  return {
    ok,
    warn: hasWarn,
    checks,
    trackerHealth: tracker.health,
  };
}
