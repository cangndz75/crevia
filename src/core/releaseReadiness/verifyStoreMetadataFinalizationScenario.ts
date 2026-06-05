import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { verifyAnalyticsNewSystemsScenario } from '@/core/analytics/verifyAnalyticsNewSystemsScenario';
import { verifyIapSandboxSmokeExecutionScenario } from '@/core/iapQa/verifyIapSandboxSmokeExecutionScenario';
import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  STORE_IAP_METADATA_DRAFT,
  STORE_KEYWORDS_EN,
  STORE_KEYWORDS_TR,
  STORE_METADATA_EN,
  STORE_METADATA_FALSE_CLAIM_PATTERNS,
  STORE_METADATA_FINALIZATION_DOCS_PATH,
  STORE_METADATA_TR,
} from './storeMetadataFinalizationConstants';
import {
  assertStoreMetadataFinalizationIntegrity,
  runStoreMetadataFinalizationAudit,
  scanMetadataForFalseClaims,
} from './storeMetadataFinalizationAudit';
import { isPrivacyPolicyUrlPlaceholder } from './storeListingReadinessAudit';
import { verifyStoreListingReadinessScenario } from './verifyStoreListingReadinessScenario';
import { verifyPrivacyPolicyReadinessScenario } from './verifyPrivacyPolicyReadinessScenario';
import { verifySoftLaunchReviewScenario } from './verifySoftLaunchReviewScenario';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyStoreMetadataFinalizationOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  finalizationHealth: string;
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

export function verifyStoreMetadataFinalizationScenario(): VerifyStoreMetadataFinalizationOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const internal = runStoreMetadataFinalizationAudit({ mode: 'internal_device_test' });
  const launch = runStoreMetadataFinalizationAudit({ mode: 'launch_candidate' });
  const integrity = assertStoreMetadataFinalizationIntegrity();

  ok = assert(checks, integrity.ok, 'Integrity check', integrity.message) && ok;

  ok =
    assert(
      checks,
      STORE_METADATA_TR.appName.length > 0,
      'TR app name present',
      'Missing TR app name',
    ) && ok;
  ok =
    assert(
      checks,
      STORE_METADATA_TR.shortDescription.length > 20,
      'TR short description present',
      'Missing TR short description',
    ) && ok;
  ok =
    assert(
      checks,
      STORE_METADATA_TR.fullDescription.length > 50,
      'TR full description present',
      'Missing TR full description',
    ) && ok;
  ok =
    assert(
      checks,
      STORE_METADATA_EN.appName.length > 0,
      'EN app name present',
      'Missing EN app name',
    ) && ok;
  ok =
    assert(
      checks,
      STORE_METADATA_EN.shortDescription.length > 20,
      'EN short description present',
      'Missing EN short description',
    ) && ok;
  ok =
    assert(
      checks,
      STORE_METADATA_EN.fullDescription.length > 50,
      'EN full description present',
      'Missing EN full description',
    ) && ok;

  ok =
    assert(
      checks,
      STORE_METADATA_TR.featureBullets.length >= 5,
      `TR feature bullets ${STORE_METADATA_TR.featureBullets.length} >= 5`,
      `TR feature bullets ${STORE_METADATA_TR.featureBullets.length}`,
    ) && ok;
  ok =
    assert(
      checks,
      STORE_METADATA_EN.featureBullets.length >= 5,
      `EN feature bullets ${STORE_METADATA_EN.featureBullets.length} >= 5`,
      `EN feature bullets ${STORE_METADATA_EN.featureBullets.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      STORE_KEYWORDS_TR.keywords.length >= 8,
      `TR keywords ${STORE_KEYWORDS_TR.keywords.length} >= 8`,
      `TR keywords ${STORE_KEYWORDS_TR.keywords.length}`,
    ) && ok;
  ok =
    assert(
      checks,
      STORE_KEYWORDS_EN.keywords.length >= 8,
      `EN keywords ${STORE_KEYWORDS_EN.keywords.length} >= 8`,
      `EN keywords ${STORE_KEYWORDS_EN.keywords.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      STORE_IAP_METADATA_DRAFT.entitlementId.length > 0,
      'IAP entitlement id present',
      'Missing entitlement id',
    ) && ok;
  ok =
    assert(
      checks,
      STORE_IAP_METADATA_DRAFT.offeringId.length > 0,
      'IAP offering id present',
      'Missing offering id',
    ) && ok;
  ok =
    assert(
      checks,
      STORE_IAP_METADATA_DRAFT.productType.length > 0,
      'IAP product type present',
      'Missing product type',
    ) && ok;

  const trReviewNotes = STORE_METADATA_TR.appReviewNotes.toLocaleLowerCase('tr-TR');
  ok =
    assert(
      checks,
      trReviewNotes.includes('day 8') || trReviewNotes.includes('gün 8'),
      'Review notes Day 8+ test note',
      'Missing Day 8+ test note',
    ) && ok;

  ok =
    assert(
      checks,
      STORE_METADATA_TR.releaseNotes.length > 20,
      'TR release notes present',
      'Missing TR release notes',
    ) && ok;
  ok =
    assert(
      checks,
      STORE_METADATA_EN.releaseNotes.length > 20,
      'EN release notes present',
      'Missing EN release notes',
    ) && ok;

  ok =
    assert(
      checks,
      internal.riskScan.passed,
      'Draft copy false claim scan PASS',
      `Hits: ${internal.riskScan.hits.join(', ')}`,
    ) && ok;

  const gpsTest = scanMetadataForFalseClaims('Bu resmi belediye uygulamasıdır ve canlı GPS takip yapar');
  ok =
    assert(
      checks,
      gpsTest.length > 0,
      'GPS/official false claim scanner detects patterns',
      'Scanner missed GPS/official claim',
    ) && ok;

  const payToWinTest = scanMetadataForFalseClaims('Pay to win premium advantage ile kazan');
  ok =
    assert(
      checks,
      payToWinTest.length > 0,
      'Pay-to-win false claim scanner detects patterns',
      'Scanner missed pay-to-win claim',
    ) && ok;

  const noDataTest = scanMetadataForFalseClaims('We collect no data and are fully anonymous');
  ok =
    assert(
      checks,
      noDataTest.length > 0,
      'No-data/anonymous false claim scanner detects',
      'Scanner missed no-data claim',
    ) && ok;

  const seasonFinalTest = scanMetadataForFalseClaims('Sezon finali ve oyun sonu');
  ok =
    assert(
      checks,
      seasonFinalTest.length > 0,
      'Season final / game over scanner detects',
      'Scanner missed season final claim',
    ) && ok;

  const cleanDraftTr = scanMetadataForFalseClaims(STORE_METADATA_TR.fullDescription);
  ok =
    assert(checks, cleanDraftTr.length === 0, 'TR draft clean', `TR draft hit: ${cleanDraftTr.join(', ')}`) && ok;
  const cleanDraftEn = scanMetadataForFalseClaims(STORE_METADATA_EN.fullDescription);
  ok =
    assert(checks, cleanDraftEn.length === 0, 'EN draft clean', `EN draft hit: ${cleanDraftEn.join(', ')}`) && ok;

  ok =
    assert(
      checks,
      isPrivacyPolicyUrlPlaceholder(STORE_METADATA_TR.privacyPolicyUrl),
      'Privacy URL is placeholder',
      'URL not detected as placeholder',
    ) && ok;

  ok =
    assert(
      checks,
      launch.blockers.some((b) => b.id.includes('privacy_url')),
      'Privacy placeholder → launch_candidate BLOCKER',
      `blockers=${launch.blockers.map((b) => b.id).join(',')}`,
    ) && ok;

  ok =
    assert(
      checks,
      internal.blockers.length === 0 ||
        internal.blockers.every((b) => b.id.includes('false_claim')),
      'Internal device mode no unexpected blockers',
      `blockers=${internal.blockers.map((b) => b.id).join(',')}`,
    ) && ok;

  ok =
    assert(
      checks,
      STORE_METADATA_FALSE_CLAIM_PATTERNS.length >= 15,
      'False claim patterns defined',
      `Too few patterns: ${STORE_METADATA_FALSE_CLAIM_PATTERNS.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      internal.keywordsTr.forbiddenHits.length === 0,
      'TR keywords no forbidden hits',
      `Forbidden: ${internal.keywordsTr.forbiddenHits.join(', ')}`,
    ) && ok;
  ok =
    assert(
      checks,
      internal.keywordsEn.forbiddenHits.length === 0,
      'EN keywords no forbidden hits',
      `Forbidden: ${internal.keywordsEn.forbiddenHits.join(', ')}`,
    ) && ok;

  const docs = readRepo(STORE_METADATA_FINALIZATION_DOCS_PATH);
  ok = assert(checks, docs.length > 200, 'Finalization docs present', 'Docs missing') && ok;
  ok =
    assert(
      checks,
      docs.includes('Keywords') || docs.includes('Anahtar kelime'),
      'Docs keyword section',
      'Missing keyword section in docs',
    ) && ok;
  ok =
    assert(
      checks,
      docs.includes('IAP') || docs.includes('Uygulama İçi'),
      'Docs IAP section',
      'Missing IAP section in docs',
    ) && ok;

  ok = assert(checks, verifyStoreListingReadinessScenario().ok, 'verify:store-listing-readiness compatible', 'Store listing broken') && ok;
  ok = assert(checks, verifyPrivacyPolicyReadinessScenario().ok, 'verify:privacy-policy-readiness compatible', 'Privacy policy broken') && ok;
  ok = assert(checks, verifySoftLaunchReviewScenario().ok, 'verify:soft-launch-review compatible', 'Soft launch review broken') && ok;
  ok = assert(checks, verifyIapSandboxSmokeExecutionScenario().ok, 'verify:iap-sandbox-smoke-execution compatible', 'Smoke execution broken') && ok;
  ok = assert(checks, verifyAnalyticsNewSystemsScenario().ok, 'verify:analytics-new-systems compatible', 'Analytics broken') && ok;

  const fullLoop = runFullLoopAnalysis();
  ok = assert(checks, fullLoop.totalFAIL === 0, 'verify:full-loop compatible', `FAIL=${fullLoop.totalFAIL}`) && ok;
  ok = assert(checks, verifyFullUxFlowScenario().ok, 'verify:full-ux-flow compatible', 'UX flow broken') && ok;

  ok = assert(checks, SAVE_VERSION === 23, 'SAVE_VERSION 23 unchanged', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  const persist = readRepo('src/store/gamePersist.ts');
  ok =
    assert(
      checks,
      !persist.includes('storeMetadataFinalizationState'),
      'No persist shape change',
      'Persist polluted',
    ) && ok;

  if (internal.health === 'WARN' || launch.health === 'BLOCKED') {
    hasWarn = true;
  }

  return {
    ok,
    warn: hasWarn,
    checks,
    finalizationHealth: launch.health,
  };
}
