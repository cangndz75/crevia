import type { CreviaStoreScreenshotReadinessResult } from './storeScreenshotReadinessTypes';
import { STORE_SCREENSHOT_READINESS_DOCS_PATH } from './storeScreenshotReadinessConstants';

export function buildStoreScreenshotReadinessConsoleSummary(
  result: CreviaStoreScreenshotReadinessResult,
): string {
  const lines = [
    '=== Crevia Store Screenshot Capture Readiness ===',
    `Health: ${result.health}`,
    `Mode: ${result.mode}`,
    `Screenshots: ${result.screenshotsTotal} total (${result.screenshotsCaptured} captured, ${result.screenshotsPending} pending)`,
    `Device profiles: ${result.deviceProfiles.length} (iOS: ${result.deviceProfiles.filter((d) => d.platform === 'ios').length}, Android: ${result.deviceProfiles.filter((d) => d.platform === 'android').length})`,
    `Copy guard: ${result.copyGuard.passed ? 'PASS' : 'FAIL'}`,
    `Assets complete: ${result.assetChecklistComplete}`,
    '',
    '--- Screenshot Checklist ---',
    ...result.screenshots.map(
      (s) =>
        `  [${s.status}] ${s.screenName} — ${s.capturePurpose} (${s.deviceProfile})${s.copyOverlayAllowed ? '' : ' [no overlay]'}`,
    ),
    '',
    '--- Device Profiles ---',
    ...result.deviceProfiles.map(
      (d) => `  ${d.id}: ${d.label} (${d.platform}) — store size pending: ${d.storeSizePendingManualConfirmation}`,
    ),
    '',
    '--- Asset Checklist ---',
    ...result.assets.map(
      (a) => `  [${a.status}] ${a.assetType} (${a.requiredFor})${a.blockerIfMissing ? ' [required]' : ''}`,
    ),
    '',
    '--- Copy Guard ---',
    `  False claim: ${result.copyGuard.falseClaimDetected ? 'DETECTED' : 'clean'}`,
    `  Paywall pressure: ${result.copyGuard.paywallPressureDetected ? 'DETECTED' : 'clean'}`,
    `  GPS claim: ${result.copyGuard.liveGpsClaimDetected ? 'DETECTED' : 'clean'}`,
    `  Official municipality: ${result.copyGuard.officialMunicipalityClaimDetected ? 'DETECTED' : 'clean'}`,
    `  Old season wording: ${result.copyGuard.oldSeasonWordingDetected ? 'DETECTED' : 'clean'}`,
    '',
    '--- Blockers ---',
    ...(result.blockers.length > 0
      ? result.blockers.map((b) => `  • ${b.title}: ${b.message}`)
      : ['  (none for current mode)']),
    '',
    '--- Warnings ---',
    ...(result.warnings.length > 0
      ? result.warnings.map((w) => `  • ${w.title}: ${w.message}`)
      : ['  (none)']),
    '',
    '--- Next actions ---',
    ...result.nextActions.map((a) => `  • ${a}`),
    '',
    `Docs: ${STORE_SCREENSHOT_READINESS_DOCS_PATH}`,
  ];
  return lines.join('\n');
}

export function buildStoreScreenshotReadinessMarkdown(
  result: CreviaStoreScreenshotReadinessResult,
): string {
  return [
    '# Store Screenshot Capture Readiness Report',
    '',
    `**Health:** ${result.health} | **Mode:** ${result.mode}`,
    '',
    '## Screenshot Checklist',
    '',
    '| Screen | Purpose | Status | Device | Overlay | Risk |',
    '|--------|---------|--------|--------|---------|------|',
    ...result.screenshots.map(
      (s) =>
        `| ${s.screenName} | ${s.capturePurpose.slice(0, 40)} | ${s.status} | ${s.deviceProfile} | ${s.copyOverlayAllowed ? 'yes' : 'no'} | ${s.riskNotes.slice(0, 35)} |`,
    ),
    '',
    '## Device Profiles',
    '',
    '| ID | Label | Platform | Category | Store Size Pending |',
    '|----|-------|----------|----------|--------------------|',
    ...result.deviceProfiles.map(
      (d) =>
        `| ${d.id} | ${d.label} | ${d.platform} | ${d.category} | ${d.storeSizePendingManualConfirmation} |`,
    ),
    '',
    '## Asset Checklist',
    '',
    '| Asset | Platform | Status | Blocker |',
    '|-------|----------|--------|---------|',
    ...result.assets.map(
      (a) => `| ${a.assetType} | ${a.requiredFor} | ${a.status} | ${a.blockerIfMissing} |`,
    ),
    '',
    '## Copy Guard',
    '',
    `- False claim: ${result.copyGuard.falseClaimDetected ? 'DETECTED' : 'clean'}`,
    `- Paywall pressure: ${result.copyGuard.paywallPressureDetected ? 'DETECTED' : 'clean'}`,
    `- GPS claim: ${result.copyGuard.liveGpsClaimDetected ? 'DETECTED' : 'clean'}`,
    `- Official municipality: ${result.copyGuard.officialMunicipalityClaimDetected ? 'DETECTED' : 'clean'}`,
    `- Old season wording: ${result.copyGuard.oldSeasonWordingDetected ? 'DETECTED' : 'clean'}`,
    '',
    '## Blockers',
    '',
    ...(result.blockers.length > 0
      ? result.blockers.map((b) => `- **${b.title}:** ${b.message}`)
      : ['_None for current mode._']),
  ].join('\n');
}

export function buildStoreScreenshotChecklist(
  result: CreviaStoreScreenshotReadinessResult,
): string[] {
  return result.screenshots.map(
    (s) =>
      `[${s.status}] ${s.screenName} — ${s.capturePurpose} (${s.deviceProfile})${s.copyOverlayAllowed ? '' : ' [no overlay]'}`,
  );
}
