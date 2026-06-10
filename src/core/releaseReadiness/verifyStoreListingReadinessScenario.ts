import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { verifyAnalyticsNewSystemsScenario } from '@/core/analytics/verifyAnalyticsNewSystemsScenario';
import { verifyIapSandboxSmokeExecutionScenario } from '@/core/iapQa/verifyIapSandboxSmokeExecutionScenario';
import { verifyIapSandboxReadinessScenario } from '@/core/iapQa/verifyIapSandboxReadinessScenario';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  STORE_LISTING_FALSE_CLAIM_PATTERNS,
  STORE_LISTING_METADATA_DRAFT,
  STORE_LISTING_MIN_SCREENSHOT_COUNT,
  STORE_LISTING_PRIVACY_POLICY_PLACEHOLDER,
  STORE_LISTING_READINESS_DOCS_PATH,
} from './storeListingReadinessConstants';
import { runStoreMetadataFinalizationAudit } from './storeMetadataFinalizationAudit';
import {
  assertStoreListingReadinessIntegrity,
  isPrivacyPolicyUrlPlaceholder,
  runStoreListingReadinessAudit,
  scanStoreCopyForFalseClaims,
} from './storeListingReadinessAudit';
import { runSoftLaunchReadinessReview } from './softLaunchReviewAudit';
import { verifySoftLaunchReviewScenario } from './verifySoftLaunchReviewScenario';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyStoreListingReadinessOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  readinessHealth: string;
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

export function verifyStoreListingReadinessScenario(): VerifyStoreListingReadinessOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const internal = runStoreListingReadinessAudit({ mode: 'internal_device_test' });
  const launch = runStoreListingReadinessAudit({ mode: 'launch_candidate' });
  const softLaunch = runStoreListingReadinessAudit({ mode: 'soft_launch_candidate' });
  const integrity = assertStoreListingReadinessIntegrity();

  ok = assert(checks, integrity.ok, 'Integrity check', integrity.message) && ok;

  ok =
    assert(
      checks,
      internal.checklist.length > 0 && internal.privacyMatrix.length > 0,
      'Store readiness result no crash',
      'Empty result',
    ) && ok;

  const metaIds = ['meta.app_name', 'meta.full_description', 'meta.category', 'meta.support_url', 'meta.privacy_policy_url'];
  ok =
    assert(
      checks,
      metaIds.every((id) => internal.checklist.some((c) => c.id === id)),
      'Metadata checklist core fields',
      'Missing metadata field',
    ) && ok;

  ok =
    assert(
      checks,
      internal.screenshots.length >= STORE_LISTING_MIN_SCREENSHOT_COUNT,
      `Screenshot checklist ${STORE_LISTING_MIN_SCREENSHOT_COUNT}+`,
      `screenshots=${internal.screenshots.length}`,
    ) && ok;

  const privacyTypes = ['Analytics', 'Purchase', 'Crash'];
  ok =
    assert(
      checks,
      privacyTypes.every((t) => internal.privacyMatrix.some((p) => p.collectedDataType.includes(t))),
      'Privacy matrix analytics/purchase/crash',
      'Missing privacy row',
    ) && ok;

  ok =
    assert(
      checks,
      internal.metadataDraft.shortDescriptionTr.length > 20,
      'Draft TR short description',
      'Missing TR short',
    ) && ok;
  ok =
    assert(
      checks,
      internal.metadataDraft.fullDescriptionTr.length > 50,
      'Draft TR full description',
      'Missing TR full',
    ) && ok;
  ok =
    assert(
      checks,
      internal.metadataDraft.shortDescriptionEn.length > 20,
      'Draft EN short description',
      'Missing EN short',
    ) && ok;
  ok =
    assert(
      checks,
      internal.metadataDraft.fullDescriptionEn.length > 50,
      'Draft EN full description',
      'Missing EN full',
    ) && ok;

  ok =
    assert(
      checks,
      internal.copyForbiddenClaimsScanPassed,
      'Store copy false claim guard',
      'Forbidden claim in draft',
    ) && ok;

  const gpsClaim = scanStoreCopyForFalseClaims('canlı GPS ile gerçek zamanlı şehir yönetimi');
  ok =
    assert(
      checks,
      gpsClaim !== undefined,
      'GPS/real-time false claim guard detects pattern',
      'Guard missed GPS claim',
    ) && ok;

  const cleanCopy = scanStoreCopyForFalseClaims(STORE_LISTING_METADATA_DRAFT.shortDescriptionTr);
  ok = assert(checks, cleanCopy === undefined, 'Draft copy clean', `Hit: ${cleanCopy}`) && ok;

  if (
    !warn(
      checks,
      internal.iapMetadataPlaceholder,
      'IAP product metadata placeholder WARN',
      'IAP should be placeholder in current state',
    )
  ) {
    hasWarn = true;
  }

  ok =
    assert(
      checks,
      isPrivacyPolicyUrlPlaceholder(STORE_LISTING_PRIVACY_POLICY_PLACEHOLDER),
      'Privacy policy URL is placeholder',
      'URL not detected as placeholder',
    ) && ok;

  ok =
    assert(
      checks,
      launch.blockers.some((b) => b.id.includes('privacy_policy')),
      'Privacy placeholder → launch_candidate BLOCKER',
      `blockers=${launch.blockers.map((b) => b.id).join(',')}`,
    ) && ok;

  ok =
    assert(
      checks,
      launch.blockers.some((b) => b.id.includes('screenshots')),
      'Missing screenshots → launch_candidate BLOCKER',
      'Missing screenshot blocker',
    ) && ok;

  ok =
    assert(
      checks,
      internal.blockers.length === 0,
      'Internal device mode no blockers',
      `blockers=${internal.blockers.length}`,
    ) && ok;

  if (
    !warn(
      checks,
      internal.warnings.length > 0,
      'Internal device mode WARN',
      'Expected listing WARNs',
    )
  ) {
    hasWarn = true;
  }

  ok =
    assert(
      checks,
      softLaunch.blockers.length === 0,
      'Soft launch candidate no store listing blockers',
      `blockers=${softLaunch.blockers.length}`,
    ) && ok;

  const launchReview = runSoftLaunchReadinessReview({ mode: 'launch_candidate' });
  ok =
    assert(
      checks,
      launchReview.findings.some((f) => f.id.startsWith('store.listing_')),
      'Soft launch review reads store listing',
      'Missing store.listing_ finding',
    ) && ok;

  ok =
    assert(
      checks,
      launchReview.blockerCount > 0,
      'Launch candidate still blocked overall',
      `blockers=${launchReview.blockerCount}`,
    ) && ok;

  const docs = readRepo(STORE_LISTING_READINESS_DOCS_PATH);
  ok = assert(checks, docs.length > 200, 'Store listing docs exist', 'Docs missing') && ok;
  ok =
    assert(
      checks,
      docs.includes('Privacy policy') || docs.includes('Gizlilik'),
      'Docs privacy section',
      'Missing privacy in docs',
    ) && ok;

  ok = assert(checks, verifySoftLaunchReviewScenario().ok, 'verify:soft-launch-review compatible', 'Soft launch review broken') && ok;
  ok = assert(checks, verifyIapSandboxSmokeExecutionScenario().ok, 'verify:iap-sandbox-smoke-execution compatible', 'Smoke execution broken') && ok;
  ok = assert(checks, verifyIapSandboxReadinessScenario().ok, 'verify:iap-sandbox-readiness compatible', 'IAP readiness broken') && ok;
  ok = assert(checks, verifyAnalyticsNewSystemsScenario().ok, 'verify:analytics-new-systems compatible', 'Analytics broken') && ok;

  const fullLoop = runFullLoopAnalysis();
  ok = assert(checks, fullLoop.totalFAIL === 0, 'verify:full-loop compatible', `FAIL=${fullLoop.totalFAIL}`) && ok;
  ok = assert(checks, verifyFullUxFlowScenario().ok, 'verify:full-ux-flow compatible', 'UX flow broken') && ok;

  const metaFinalization = runStoreMetadataFinalizationAudit({ mode: 'internal_device_test' });
  ok =
    assert(
      checks,
      metaFinalization.metadataDraftPresent,
      'Metadata finalization draft present',
      'Metadata finalization draft missing',
    ) && ok;
  ok =
    assert(
      checks,
      metaFinalization.riskScan.passed,
      'Metadata finalization risk scan pass',
      `Risk hits: ${metaFinalization.riskScan.hits.join(', ')}`,
    ) && ok;
  ok =
    assert(
      checks,
      metaFinalization.keywordsPresent,
      'Metadata finalization keywords present',
      'Keywords missing',
    ) && ok;
  ok =
    assert(
      checks,
      metaFinalization.iapMetadataDraftPresent,
      'IAP metadata draft present',
      'IAP metadata draft missing',
    ) && ok;
  ok =
    assert(
      checks,
      metaFinalization.reviewNotesDraftPresent,
      'Review notes draft present',
      'Review notes draft missing',
    ) && ok;

  ok = assert(checks, SAVE_VERSION === 26, 'SAVE_VERSION 23 unchanged', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  const persist = readRepo('src/store/gamePersist.ts');
  ok =
    assert(
      checks,
      !persist.includes('storeListingReadinessState'),
      'No persist shape change',
      'Persist polluted',
    ) && ok;

  ok =
    assert(
      checks,
      STORE_LISTING_FALSE_CLAIM_PATTERNS.length >= 8,
      'False claim patterns defined',
      'Too few patterns',
    ) && ok;

  if (internal.health === 'WARN' || launch.health === 'BLOCKED') {
    hasWarn = true;
  }

  return {
    ok,
    warn: hasWarn,
    checks,
    readinessHealth: launch.health,
  };
}
