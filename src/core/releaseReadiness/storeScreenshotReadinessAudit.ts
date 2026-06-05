import {
  STORE_SCREENSHOT_ASSET_CHECKLIST,
  STORE_SCREENSHOT_DEVICE_PROFILES,
  STORE_SCREENSHOT_FALSE_CLAIM_PATTERNS,
  STORE_SCREENSHOT_GPS_CLAIM_PATTERNS,
  STORE_SCREENSHOT_MIN_COUNT,
  STORE_SCREENSHOT_OFFICIAL_CLAIM_PATTERNS,
  STORE_SCREENSHOT_OLD_SEASON_PATTERNS,
  STORE_SCREENSHOT_PAYWALL_PRESSURE_PATTERNS,
  STORE_SCREENSHOT_READINESS_DOCS_PATH,
  STORE_SCREENSHOT_REQUIREMENTS,
} from './storeScreenshotReadinessConstants';
import type {
  CreviaStoreScreenshotBlocker,
  CreviaStoreScreenshotCopyGuardResult,
  CreviaStoreScreenshotHealthStatus,
  CreviaStoreScreenshotReadinessResult,
  CreviaStoreScreenshotWarning,
  RunStoreScreenshotReadinessAuditOptions,
} from './storeScreenshotReadinessTypes';

function matchesAny(text: string, patterns: readonly string[]): string | undefined {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return patterns.find((p) => normalized.includes(p.toLocaleLowerCase('tr-TR')));
}

export function scanScreenshotCopyForFalseClaims(text: string): string | undefined {
  return matchesAny(text, STORE_SCREENSHOT_FALSE_CLAIM_PATTERNS);
}

export function scanScreenshotCopyForPaywallPressure(text: string): string | undefined {
  return matchesAny(text, STORE_SCREENSHOT_PAYWALL_PRESSURE_PATTERNS);
}

export function scanScreenshotCopyForGpsClaim(text: string): string | undefined {
  return matchesAny(text, STORE_SCREENSHOT_GPS_CLAIM_PATTERNS);
}

export function scanScreenshotCopyForOfficialClaim(text: string): string | undefined {
  return matchesAny(text, STORE_SCREENSHOT_OFFICIAL_CLAIM_PATTERNS);
}

export function scanScreenshotCopyForOldSeasonWording(text: string): string | undefined {
  return matchesAny(text, STORE_SCREENSHOT_OLD_SEASON_PATTERNS);
}

export function buildScreenshotCopyGuard(overlayCopies: string[]): CreviaStoreScreenshotCopyGuardResult {
  const allText = overlayCopies.join('\n');
  const violations: string[] = [];

  const falseClaim = scanScreenshotCopyForFalseClaims(allText);
  const paywall = scanScreenshotCopyForPaywallPressure(allText);
  const gps = scanScreenshotCopyForGpsClaim(allText);
  const official = scanScreenshotCopyForOfficialClaim(allText);
  const oldSeason = scanScreenshotCopyForOldSeasonWording(allText);

  if (falseClaim) violations.push(`false_claim: ${falseClaim}`);
  if (paywall) violations.push(`paywall_pressure: ${paywall}`);
  if (gps) violations.push(`gps_claim: ${gps}`);
  if (official) violations.push(`official_claim: ${official}`);
  if (oldSeason) violations.push(`old_season: ${oldSeason}`);

  return {
    passed: violations.length === 0,
    falseClaimDetected: !!falseClaim,
    paywallPressureDetected: !!paywall,
    liveGpsClaimDetected: !!gps,
    officialMunicipalityClaimDetected: !!official,
    oldSeasonWordingDetected: !!oldSeason,
    rawPrivacyClaimDetected: false,
    violations,
  };
}

function collectBlockersAndWarnings(
  mode: CreviaStoreScreenshotReadinessResult['mode'],
  state: {
    allRequiredCaptured: boolean;
    copyGuardPassed: boolean;
    assetChecklistComplete: boolean;
    screenshotsPending: number;
  },
): { blockers: CreviaStoreScreenshotBlocker[]; warnings: CreviaStoreScreenshotWarning[] } {
  const blockers: CreviaStoreScreenshotBlocker[] = [];
  const warnings: CreviaStoreScreenshotWarning[] = [];

  if (!state.allRequiredCaptured) {
    if (mode === 'launch_candidate' || mode === 'soft_launch_candidate') {
      blockers.push({
        id: 'screenshot.required_missing',
        title: 'Required screenshots missing',
        message: `${state.screenshotsPending} required screenshot(s) not captured — blocks ${mode}.`,
      });
    } else {
      warnings.push({
        id: 'screenshot.required_missing',
        title: 'Required screenshots pending',
        message: `${state.screenshotsPending} screenshot(s) pending capture.`,
      });
    }
  }

  if (!state.copyGuardPassed) {
    if (mode === 'launch_candidate') {
      blockers.push({
        id: 'screenshot.copy_guard_fail',
        title: 'Screenshot copy guard failed',
        message: 'Overlay copy contains forbidden claims.',
      });
    } else {
      warnings.push({
        id: 'screenshot.copy_guard_fail',
        title: 'Screenshot copy guard issue',
        message: 'Overlay copy contains risky wording.',
      });
    }
  }

  if (!state.assetChecklistComplete) {
    if (mode === 'launch_candidate' || mode === 'soft_launch_candidate') {
      blockers.push({
        id: 'screenshot.assets_incomplete',
        title: 'Asset checklist incomplete',
        message: 'Required visual assets (icon, feature graphic, screenshots) pending.',
      });
    } else {
      warnings.push({
        id: 'screenshot.assets_incomplete',
        title: 'Asset checklist pending',
        message: 'Visual asset preparation in progress.',
      });
    }
  }

  return { blockers, warnings };
}

function buildHealth(
  mode: CreviaStoreScreenshotReadinessResult['mode'],
  blockers: CreviaStoreScreenshotBlocker[],
): CreviaStoreScreenshotHealthStatus {
  if ((mode === 'launch_candidate' || mode === 'soft_launch_candidate') && blockers.length > 0) {
    return 'BLOCKED';
  }
  if (blockers.length > 0) return 'WARN';
  return 'WARN';
}

export function runStoreScreenshotReadinessAudit(
  options: RunStoreScreenshotReadinessAuditOptions = {},
): CreviaStoreScreenshotReadinessResult {
  const mode = options.mode ?? 'internal_device_test';

  const screenshots = STORE_SCREENSHOT_REQUIREMENTS.map((s) => ({ ...s }));
  const deviceProfiles = STORE_SCREENSHOT_DEVICE_PROFILES.map((d) => ({ ...d }));
  const assets = STORE_SCREENSHOT_ASSET_CHECKLIST.map((a) => ({ ...a }));

  const screenshotsCaptured = screenshots.filter((s) => s.status === 'captured').length;
  const screenshotsPending = screenshots.filter(
    (s) => s.status === 'pending' || s.status === 'needs_recapture',
  ).length;
  const allRequiredCaptured = screenshots
    .filter((s) => s.blockerIfMissing)
    .every((s) => s.status === 'captured');

  const overlayCopies = screenshots
    .filter((s) => s.overlayCopyDraft)
    .map((s) => s.overlayCopyDraft!);
  const copyGuard = buildScreenshotCopyGuard(overlayCopies);

  const requiredAssetsDone = assets
    .filter((a) => a.blockerIfMissing)
    .every((a) => a.status === 'present');
  const assetChecklistComplete = requiredAssetsDone;

  const deviceMatrixComplete =
    deviceProfiles.some((d) => d.platform === 'ios') &&
    deviceProfiles.some((d) => d.platform === 'android') &&
    deviceProfiles.some((d) => d.category === 'low_mid_device');

  const { blockers, warnings } = collectBlockersAndWarnings(mode, {
    allRequiredCaptured,
    copyGuardPassed: copyGuard.passed,
    assetChecklistComplete,
    screenshotsPending,
  });

  const health = buildHealth(mode, blockers);

  const nextActions: string[] = [];
  if (screenshotsPending > 0) {
    nextActions.push(`Capture ${screenshotsPending} pending screenshots on real device.`);
  }
  if (!copyGuard.passed) {
    nextActions.push('Fix screenshot overlay copy violations.');
  }
  if (!assetChecklistComplete) {
    nextActions.push('Complete asset checklist: icon, feature graphic, screenshots.');
  }
  nextActions.push(`Review capture plan: ${STORE_SCREENSHOT_READINESS_DOCS_PATH}`);

  return {
    health,
    mode,
    screenshots,
    deviceProfiles,
    assets,
    copyGuard,
    blockers,
    warnings,
    screenshotsCaptured,
    screenshotsPending,
    screenshotsTotal: screenshots.length,
    allRequiredCaptured,
    deviceMatrixComplete,
    assetChecklistComplete,
    nextActions,
  };
}

export function buildStoreScreenshotReadinessSummary(
  result: CreviaStoreScreenshotReadinessResult,
): string {
  return [
    `Health: ${result.health}`,
    `Mode: ${result.mode}`,
    `Screenshots: ${result.screenshotsCaptured}/${result.screenshotsTotal} captured`,
    `Pending: ${result.screenshotsPending}`,
    `Copy guard: ${result.copyGuard.passed ? 'PASS' : 'FAIL'}`,
    `Assets complete: ${result.assetChecklistComplete}`,
    `Blockers: ${result.blockers.length}`,
    `Warnings: ${result.warnings.length}`,
  ].join(' | ');
}

export function assertStoreScreenshotReadinessIntegrity(): { ok: boolean; message: string } {
  if (STORE_SCREENSHOT_REQUIREMENTS.length < STORE_SCREENSHOT_MIN_COUNT) {
    return { ok: false, message: `Screenshot requirements below minimum (${STORE_SCREENSHOT_REQUIREMENTS.length} < ${STORE_SCREENSHOT_MIN_COUNT})` };
  }
  if (STORE_SCREENSHOT_DEVICE_PROFILES.length < 4) {
    return { ok: false, message: 'Device profiles too few' };
  }
  if (STORE_SCREENSHOT_ASSET_CHECKLIST.length < 6) {
    return { ok: false, message: 'Asset checklist too small' };
  }
  if (STORE_SCREENSHOT_FALSE_CLAIM_PATTERNS.length < 10) {
    return { ok: false, message: 'False claim patterns too few' };
  }
  return { ok: true, message: 'OK' };
}
