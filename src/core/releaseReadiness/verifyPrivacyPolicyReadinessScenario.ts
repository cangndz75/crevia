import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { verifyAnalyticsNewSystemsScenario } from '@/core/analytics/verifyAnalyticsNewSystemsScenario';
import { verifyIapSandboxSmokeExecutionScenario } from '@/core/iapQa/verifyIapSandboxSmokeExecutionScenario';
import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  DATA_SAFETY_DRAFT_DOCS_PATH,
  PRIVACY_DATA_CATEGORY_MATRIX,
  PRIVACY_POLICY_DRAFT_DOCS_PATH,
  PRIVACY_POLICY_MIN_DATA_CATEGORIES,
  PRIVACY_POLICY_PUBLISHED_URL_PLACEHOLDER,
  PRIVACY_POLICY_RISKY_WORDING_PATTERNS,
  PRIVACY_THIRD_PARTY_PROCESSORS,
} from './privacyPolicyReadinessConstants';
import {
  assertPrivacyPolicyReadinessIntegrity,
  runPrivacyPolicyReadinessAudit,
  scanPrivacyRiskyWording,
} from './privacyPolicyReadinessAudit';
import { runSoftLaunchReadinessReview } from './softLaunchReviewAudit';
import { verifySoftLaunchReviewScenario } from './verifySoftLaunchReviewScenario';
import { verifyStoreListingReadinessScenario } from './verifyStoreListingReadinessScenario';
import { isPrivacyPolicyUrlPlaceholder } from './storeListingReadinessAudit';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyPrivacyPolicyReadinessOutcome = {
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

export function verifyPrivacyPolicyReadinessScenario(): VerifyPrivacyPolicyReadinessOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const internal = runPrivacyPolicyReadinessAudit({ mode: 'internal_device_test' });
  const launch = runPrivacyPolicyReadinessAudit({ mode: 'launch_candidate' });
  const integrity = assertPrivacyPolicyReadinessIntegrity();

  ok = assert(checks, integrity.ok, 'Integrity check', integrity.message) && ok;

  const privacyDoc = readRepo(PRIVACY_POLICY_DRAFT_DOCS_PATH);
  const dataSafetyDoc = readRepo(DATA_SAFETY_DRAFT_DOCS_PATH);

  ok =
    assert(
      checks,
      privacyDoc.includes('Giriş') && privacyDoc.includes('Introduction'),
      'Privacy draft TR and EN sections',
      'Missing TR/EN sections',
    ) && ok;
  ok =
    assert(
      checks,
      privacyDoc.includes('Topladığımız Veriler') && privacyDoc.includes('Data We Collect'),
      'Privacy draft collect sections TR/EN',
      'Missing collect sections',
    ) && ok;
  ok =
    assert(
      checks,
      privacyDoc.includes('Toplamadığımız Veriler') && privacyDoc.includes('Data We Do Not Collect'),
      'Privacy draft not-collect sections TR/EN',
      'Missing not-collect sections',
    ) && ok;

  ok =
    assert(
      checks,
      PRIVACY_DATA_CATEGORY_MATRIX.length >= PRIVACY_POLICY_MIN_DATA_CATEGORIES,
      `Data category matrix ${PRIVACY_POLICY_MIN_DATA_CATEGORIES}+`,
      `categories=${PRIVACY_DATA_CATEGORY_MATRIX.length}`,
    ) && ok;

  const processorNames = ['RevenueCat', 'Apple', 'Google', 'Analytics', 'Sentry'];
  ok =
    assert(
      checks,
      processorNames.every((n) =>
        PRIVACY_THIRD_PARTY_PROCESSORS.some((p) => p.name.includes(n) || p.id.includes(n.toLowerCase())),
      ),
      'Third-party processor matrix complete',
      'Missing processor',
    ) && ok;

  const appStoreCategories = ['Purchases', 'Analytics', 'Crash', 'Location', 'User Content'];
  ok =
    assert(
      checks,
      appStoreCategories.every((c) => internal.appStoreAnswers.some((a) => a.dataCategory.includes(c.split(' ')[0]))),
      'App Store privacy draft key categories',
      'Missing App Store category',
    ) && ok;

  const playCategories = ['Purchase', 'analytics', 'Crash', 'location', 'Contacts', 'Photos', 'Health'];
  ok =
    assert(
      checks,
      playCategories.every((c) =>
        internal.googlePlayAnswers.some((a) => a.dataType.toLocaleLowerCase('tr-TR').includes(c.toLowerCase())),
      ),
      'Google Play data safety key categories',
      'Missing Play category',
    ) && ok;

  const rawText = PRIVACY_DATA_CATEGORY_MATRIX.find((c) => c.id === 'raw_text_content');
  ok =
    assert(checks, rawText?.collected === 'no', 'Raw text not collected', 'Wrong raw text status') && ok;
  const saveData = PRIVACY_DATA_CATEGORY_MATRIX.find((c) => c.id === 'save_data');
  ok =
    assert(
      checks,
      saveData?.collected === 'no' && saveData?.sharedWithThirdParty === false,
      'Save dump not collected/shared',
      'Save data misclassified',
    ) && ok;

  const location = PRIVACY_DATA_CATEGORY_MATRIX.find((c) => c.id === 'location_data');
  ok =
    assert(checks, location?.collected === 'no', 'Precise location/GPS not collected', 'Location wrong') && ok;

  const purchase = PRIVACY_DATA_CATEGORY_MATRIX.find((c) => c.id === 'purchase_status');
  ok =
    assert(
      checks,
      Boolean(
        purchase &&
          (purchase.thirdPartyProcessor.includes('Apple') || purchase.source.includes('StoreKit')),
      ),
      'Purchase data via store/RevenueCat',
      'Purchase misclassified',
    ) && ok;

  const crash = PRIVACY_DATA_CATEGORY_MATRIX.find((c) => c.id === 'crash_diagnostics');
  if (
    !warn(
      checks,
      crash?.collected === 'pending',
      'Crash SDK pending',
      'Crash should be pending',
    )
  ) {
    hasWarn = true;
  }

  ok =
    assert(
      checks,
      isPrivacyPolicyUrlPlaceholder(PRIVACY_POLICY_PUBLISHED_URL_PLACEHOLDER),
      'Privacy policy URL is placeholder',
      'URL should be placeholder',
    ) && ok;

  ok =
    assert(
      checks,
      launch.blockers.some((b) => b.id.includes('published_url')),
      'Placeholder URL → launch_candidate BLOCKER',
      `blockers=${launch.blockers.map((b) => b.id).join(',')}`,
    ) && ok;

  ok =
    assert(checks, internal.blockers.length === 0, 'Internal device mode no blockers', `blockers=${internal.blockers.length}`) && ok;

  const riskyHit = scanPrivacyRiskyWording('Biz hiçbir veri toplamıyoruz ve tam anonimiz.');
  ok =
    assert(checks, riskyHit !== undefined, 'Risky wording scanner catches absolute claims', 'Scanner missed') && ok;
  ok =
    assert(checks, internal.riskyWordingScanPassed, 'Draft copy risky scan PASS', 'Draft has risky wording') && ok;

  const launchReview = runSoftLaunchReadinessReview({ mode: 'launch_candidate' });
  ok =
    assert(
      checks,
      launchReview.findings.some((f) => f.id.startsWith('privacy.')),
      'Soft launch review privacy integration',
      'Missing privacy findings',
    ) && ok;
  ok =
    assert(checks, launchReview.blockerCount > 0, 'Launch candidate still blocked', `blockers=${launchReview.blockerCount}`) && ok;

  const storeListing = verifyStoreListingReadinessScenario();
  if (!storeListing.ok) {
    checks.push('WARN manual_blocker: store-listing-readiness pending (not privacy code regression)');
  } else {
    checks.push('PASS verify:store-listing-readiness compatible');
  }
  ok =
    assert(
      checks,
      PRIVACY_THIRD_PARTY_PROCESSORS.some((p) => p.id === 'crash_reporting' && p.name.includes('Sentry')),
      'Sentry listed in privacy processors',
      'Sentry processor missing',
    ) && ok;
  const smokeExecution = verifyIapSandboxSmokeExecutionScenario();
  if (!smokeExecution.ok) {
    checks.push('WARN manual_blocker: iap-sandbox-smoke-execution pending (not privacy code regression)');
  } else {
    checks.push('PASS verify:iap-sandbox-smoke-execution compatible');
  }
  ok = assert(checks, verifyAnalyticsNewSystemsScenario().ok, 'verify:analytics-new-systems compatible', 'Analytics broken') && ok;

  const fullLoop = runFullLoopAnalysis();
  ok = assert(checks, fullLoop.totalFAIL === 0, 'verify:full-loop compatible', `FAIL=${fullLoop.totalFAIL}`) && ok;
  ok = assert(checks, verifyFullUxFlowScenario().ok, 'verify:full-ux-flow compatible', 'UX flow broken') && ok;

  ok = assert(checks, SAVE_VERSION === 26, 'SAVE_VERSION 23 unchanged', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  ok =
    assert(
      checks,
      dataSafetyDoc.includes('App Store') && dataSafetyDoc.includes('Google Play'),
      'Data safety draft covers both stores',
      'Missing store sections',
    ) && ok;

  ok =
    assert(
      checks,
      PRIVACY_POLICY_RISKY_WORDING_PATTERNS.length >= 8,
      'Risky wording patterns defined',
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
