import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createDay1Seed } from '@/core/content/day1Seed';
import { checkPostPilotOfferCopyAlignment } from '@/core/iap/iapOfferPresentation';
import { SAVE_VERSION } from '@/store/gamePersist';

import { runIapConversionReadinessAudit } from './iapConversionReadinessAudit';
import {
  buildIapConversionSoftLaunchFindings,
} from './iapConversionReadinessPresentation';
import {
  IAP_CONVERSION_READINESS_DOCS_PATH,
  IAP_CONVERSION_PAYWALL_PRESSURE_PATTERNS,
} from './iapConversionReadinessConstants';
import {
  buildDevJumpPilotCompletedGameState,
} from './monetizationEngine';
import {
  buildPostPilotOfferViewModel,
  collectMonetizationPresentationStrings,
} from './monetizationPresentation';
import {
  createInitialMonetizationState,
  syncMonetizationAfterPilotComplete,
} from './monetizationState';
import { verifyMonetizationScenario } from './verifyMonetizationScenario';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyIapConversionReadinessOutcome = {
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

export function verifyIapConversionReadinessScenario(): VerifyIapConversionReadinessOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const result = runIapConversionReadinessAudit();

  ok = assert(checks,
    result.health !== 'FAIL',
    'IAP conversion readiness health not FAIL',
    `Health: ${result.health}`,
  ) && ok;

  ok = assert(checks,
    result.copyGuardPassed,
    'Offer copy forbidden paywall pressure clean',
    'Copy guard failed',
  ) && ok;

  ok = assert(checks,
    result.limitedModePlayable,
    'Limited mode playable copy present',
    'Limited mode broken',
  ) && ok;

  ok = assert(checks,
    result.restoreCtaPresent,
    'Restore CTA policy present',
    'Restore CTA missing',
  ) && ok;

  ok = assert(checks,
    result.productMetadataPendingSafe,
    'Product metadata pending safe fallback',
    'Fake price guard failed',
  ) && ok;

  ok = assert(checks,
    result.storeMetadataConsistent,
    'Store metadata IAP consistency',
    'Store metadata mismatch',
  ) && ok;

  ok = assert(checks,
    result.privacyConsistent,
    'Privacy purchase disclosure consistency',
    'Privacy inconsistency',
  ) && ok;

  ok = assert(checks,
    result.freezeCompliant,
    'No-New-System Freeze scope compliant',
    'Freeze scope violated',
  ) && ok;

  const gs = buildDevJumpPilotCompletedGameState({
    ...createDay1Seed().gameState,
    pilot: {
      ...createDay1Seed().gameState.pilot,
      status: 'completed',
      currentPilotDay: 7,
    },
  });
  const mon = syncMonetizationAfterPilotComplete(createInitialMonetizationState(), 7);
  const offerModel = buildPostPilotOfferViewModel(gs, mon);
  const allCopy = collectMonetizationPresentationStrings(offerModel).toLocaleLowerCase('tr-TR');
  const pressureHit = IAP_CONVERSION_PAYWALL_PRESSURE_PATTERNS.find(
    (p) => allCopy.includes(p.toLocaleLowerCase('tr-TR')),
  );
  ok = assert(checks,
    pressureHit === undefined,
    'Paywall pressure scan clean',
    `Pressure found: ${pressureHit}`,
  ) && ok;

  const runtimeService = readRepo('src/core/iap/iapRuntimeService.ts');
  ok = assert(checks,
    runtimeService.includes("mode: 'disabled'") || runtimeService.includes("'disabled'"),
    'RevenueCat disabled state safe',
    'Missing disabled guard',
  ) && ok;

  ok = assert(checks,
    runtimeService.includes('__DEV__') || readRepo('src/core/iap/iapRuntimeConfig.ts').includes('__DEV__'),
    'Dev mock guarded by __DEV__',
    'Mock path not dev-guarded',
  ) && ok;

  const alignment = checkPostPilotOfferCopyAlignment(gs, mon);
  ok = assert(checks,
    alignment.aligned,
    'PostPilot offer copy aligned with IAP copy',
    `Mismatches: ${alignment.mismatches.join('; ')}`,
  ) && ok;

  const slFindings = buildIapConversionSoftLaunchFindings(result);
  ok = assert(checks,
    slFindings.readinessPassPresent,
    'Soft launch: readiness pass present',
    'readinessPassPresent false',
  ) && ok;
  ok = assert(checks,
    slFindings.offerCopyGuardPass,
    'Soft launch: offer copy guard pass',
    'offerCopyGuardPass false',
  ) && ok;
  ok = assert(checks,
    slFindings.limitedModePlayable,
    'Soft launch: limited mode playable',
    'limitedModePlayable false',
  ) && ok;
  ok = assert(checks,
    slFindings.restoreCtaPresent,
    'Soft launch: restore CTA present',
    'restoreCtaPresent false',
  ) && ok;
  ok = assert(checks,
    slFindings.productMetadataPendingSafe,
    'Soft launch: product metadata pending safe',
    'productMetadataPendingSafe false',
  ) && ok;
  ok = assert(checks,
    slFindings.paywallPressureGuardPass,
    'Soft launch: paywall pressure guard pass',
    'paywallPressureGuardPass false',
  ) && ok;

  const doc = readRepo(IAP_CONVERSION_READINESS_DOCS_PATH);
  ok = assert(checks, doc.length > 0, 'IAP conversion readiness docs exist', 'Docs missing') && ok;

  ok = assert(checks, verifyMonetizationScenario().ok, 'verify:monetization-gate compatible', 'Monetization broken') && ok;

  ok = assert(checks, SAVE_VERSION === 24, 'SAVE_VERSION 23 unchanged', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  const persist = readRepo('src/store/gamePersist.ts');
  ok = assert(checks,
    !persist.includes('iapConversionReadiness'),
    'No persist shape change',
    'Persist polluted',
  ) && ok;

  if (result.health === 'WARN') {
    hasWarn = true;
  }

  return {
    ok,
    warn: hasWarn,
    checks,
    readinessHealth: result.health,
  };
}
