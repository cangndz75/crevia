import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  STORE_SCREENSHOT_ASSET_CHECKLIST,
  STORE_SCREENSHOT_DEVICE_PROFILES,
  STORE_SCREENSHOT_FALSE_CLAIM_PATTERNS,
  STORE_SCREENSHOT_MIN_COUNT,
  STORE_SCREENSHOT_READINESS_DOCS_PATH,
  STORE_SCREENSHOT_REQUIREMENTS,
} from './storeScreenshotReadinessConstants';
import {
  assertStoreScreenshotReadinessIntegrity,
  buildScreenshotCopyGuard,
  runStoreScreenshotReadinessAudit,
  scanScreenshotCopyForFalseClaims,
  scanScreenshotCopyForGpsClaim,
  scanScreenshotCopyForOfficialClaim,
  scanScreenshotCopyForOldSeasonWording,
  scanScreenshotCopyForPaywallPressure,
} from './storeScreenshotReadinessAudit';
import { verifyStoreListingReadinessScenario } from './verifyStoreListingReadinessScenario';
import { verifyPrivacyPolicyReadinessScenario } from './verifyPrivacyPolicyReadinessScenario';
import { verifySoftLaunchReviewScenario } from './verifySoftLaunchReviewScenario';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyStoreScreenshotReadinessOutcome = {
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

export function verifyStoreScreenshotReadinessScenario(): VerifyStoreScreenshotReadinessOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const internal = runStoreScreenshotReadinessAudit({ mode: 'internal_device_test' });
  const launch = runStoreScreenshotReadinessAudit({ mode: 'launch_candidate' });
  const integrity = assertStoreScreenshotReadinessIntegrity();

  ok = assert(checks, integrity.ok, 'Integrity check', integrity.message) && ok;

  ok =
    assert(
      checks,
      internal.screenshots.length >= STORE_SCREENSHOT_MIN_COUNT,
      `Minimum ${STORE_SCREENSHOT_MIN_COUNT} screenshot requirements`,
      `screenshots=${internal.screenshots.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      internal.screenshots.every(
        (s) =>
          s.screenName.length > 0 &&
          s.capturePurpose.length > 0 &&
          s.gameStateRequirement.length > 0 &&
          s.deviceProfile.length > 0,
      ),
      'Every screenshot has screenName/purpose/state/deviceProfile',
      'Incomplete screenshot requirement',
    ) && ok;

  const requiredScreenNames = [
    'Hub',
    'Event inspect',
    'Dispatch',
    'Map district',
    'Operation result',
    'End-of-day report',
    'Profile',
    'Post-pilot',
  ];
  ok =
    assert(
      checks,
      requiredScreenNames.every((name) =>
        internal.screenshots.some((s) => s.screenName.includes(name)),
      ),
      'All 8 required screens covered',
      `Missing screen: ${requiredScreenNames.find((name) => !internal.screenshots.some((s) => s.screenName.includes(name)))}`,
    ) && ok;

  ok =
    assert(
      checks,
      internal.deviceProfiles.some((d) => d.platform === 'ios'),
      'Device matrix includes iOS',
      'No iOS profile',
    ) && ok;
  ok =
    assert(
      checks,
      internal.deviceProfiles.some((d) => d.platform === 'android'),
      'Device matrix includes Android',
      'No Android profile',
    ) && ok;
  ok =
    assert(
      checks,
      internal.deviceProfiles.some((d) => d.category === 'low_mid_device'),
      'Device matrix includes low/mid profile',
      'No low/mid device profile',
    ) && ok;

  ok =
    assert(
      checks,
      internal.assets.some((a) => a.assetType.includes('App icon')),
      'Asset checklist includes app icon',
      'Missing app icon',
    ) && ok;
  ok =
    assert(
      checks,
      internal.assets.some((a) => a.assetType.includes('feature graphic')),
      'Asset checklist includes feature graphic',
      'Missing feature graphic',
    ) && ok;
  ok =
    assert(
      checks,
      internal.assets.some((a) => a.assetType.includes('screenshots')),
      'Asset checklist includes screenshots',
      'Missing screenshots asset',
    ) && ok;

  ok =
    assert(
      checks,
      scanScreenshotCopyForGpsClaim('canlı GPS navigasyon') !== undefined,
      'GPS claim scanner detects GPS pattern',
      'GPS scanner missed pattern',
    ) && ok;
  ok =
    assert(
      checks,
      scanScreenshotCopyForFalseClaims('resmi belediye uygulaması') !== undefined,
      'False claim scanner detects official pattern',
      'False claim scanner missed pattern',
    ) && ok;
  ok =
    assert(
      checks,
      scanScreenshotCopyForOldSeasonWording('sezon finali yaklaşıyor') !== undefined,
      'Old season scanner detects season wording',
      'Season scanner missed pattern',
    ) && ok;
  ok =
    assert(
      checks,
      scanScreenshotCopyForOfficialClaim('official municipality app') !== undefined,
      'Official claim scanner works',
      'Official scanner missed',
    ) && ok;

  const postPilotSS = internal.screenshots.find((s) => s.id === 'ss_post_pilot_offer');
  ok =
    assert(
      checks,
      postPilotSS !== undefined && !postPilotSS.copyOverlayAllowed,
      'Post-pilot screenshot no overlay allowed',
      'Post-pilot overlay guard missing',
    ) && ok;
  ok =
    assert(
      checks,
      postPilotSS !== undefined && postPilotSS.forbiddenVisibleCards.includes('placeholder_price_tag'),
      'Post-pilot screenshot guards placeholder price',
      'Missing placeholder_price_tag guard',
    ) && ok;

  ok =
    assert(
      checks,
      scanScreenshotCopyForPaywallPressure('satın almazsan oynayamazsın') !== undefined,
      'Paywall pressure scanner works',
      'Paywall scanner missed pattern',
    ) && ok;

  ok =
    assert(
      checks,
      launch.blockers.some((b) => b.id.includes('required_missing')),
      'Missing screenshots → launch_candidate BLOCKER',
      'Missing screenshot blocker',
    ) && ok;

  ok =
    assert(
      checks,
      internal.blockers.length === 0,
      'Internal mode produces no blockers',
      `Internal blockers=${internal.blockers.length}`,
    ) && ok;

  if (
    !warn(
      checks,
      internal.warnings.length > 0,
      'Internal mode produces WARNs',
      'Expected WARNs in internal mode',
    )
  ) {
    hasWarn = true;
  }

  ok =
    assert(
      checks,
      internal.copyGuard.passed,
      'Current overlay copy passes guard',
      `Violations: ${internal.copyGuard.violations.join(', ')}`,
    ) && ok;

  ok =
    assert(
      checks,
      verifyStoreListingReadinessScenario().ok,
      'verify:store-listing-readiness compatible',
      'Store listing readiness broken',
    ) && ok;

  ok =
    assert(
      checks,
      verifyPrivacyPolicyReadinessScenario().ok,
      'verify:privacy-policy-readiness compatible',
      'Privacy policy readiness broken',
    ) && ok;

  ok =
    assert(
      checks,
      verifySoftLaunchReviewScenario().ok,
      'verify:soft-launch-review compatible',
      'Soft launch review broken',
    ) && ok;

  const fullLoop = runFullLoopAnalysis();
  ok =
    assert(
      checks,
      fullLoop.totalFAIL === 0,
      'verify:full-loop compatible',
      `FAIL=${fullLoop.totalFAIL}`,
    ) && ok;

  ok =
    assert(
      checks,
      verifyFullUxFlowScenario().ok,
      'verify:full-ux-flow compatible',
      'UX flow broken',
    ) && ok;

  ok =
    assert(
      checks,
      isCurrentSaveVersion(SAVE_VERSION),
      'SAVE_VERSION 23 unchanged',
      `SAVE_VERSION=${SAVE_VERSION}`,
    ) && ok;

  const persist = readRepo('src/store/gamePersist.ts');
  ok =
    assert(
      checks,
      !persist.includes('storeScreenshotReadinessState'),
      'No persist shape change',
      'Persist polluted',
    ) && ok;

  const docs = readRepo(STORE_SCREENSHOT_READINESS_DOCS_PATH);
  ok =
    assert(
      checks,
      docs.length > 200,
      'Screenshot capture plan docs exist',
      'Docs missing or too short',
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
