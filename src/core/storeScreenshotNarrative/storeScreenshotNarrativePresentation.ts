import { STORE_SCREENSHOT_NARRATIVE_VISUAL_DIRECTION } from './storeScreenshotNarrativeConstants';
import type { StoreScreenshotNarrativeAuditResult } from './storeScreenshotNarrativeTypes';

export function buildStoreScreenshotNarrativeConsoleSummary(
  result: StoreScreenshotNarrativeAuditResult,
): string {
  const lines = [
    '=== Store Screenshot Narrative Pack ===',
    `Pack ID: ${result.packId}`,
    `Status: ${result.status}`,
    `Locale: ${result.localeCoverage} | Stores: ${result.targetStores}`,
    `Screenshots: ${result.screenshots.length} total, ${result.requiredScreenshotCount} required`,
    `Capture: ${result.pendingCaptureCount} pending, ${result.verifiedCaptureCount} verified`,
    `Copy guard: ${result.copyGuardPassed ? 'PASS' : 'FAIL'}`,
    `Fake pass guard: ${result.fakePassGuard ? 'ACTIVE' : 'OFF'}`,
    '',
    '--- Narrative order ---',
    ...result.screenshots.map(
      (screenshot) =>
        `${screenshot.order}. [${screenshot.captureStatus}] ${screenshot.titleTR} / ${screenshot.titleEN} (${screenshot.screenKey})${screenshot.optional ? ' [optional]' : ''}`,
    ),
    '',
    '--- Capture scenarios ---',
    ...result.captureScenarios.map(
      (scenario) => `${scenario.scenarioId}: ${scenario.label} - day ${scenario.targetDay}`,
    ),
    '',
    '--- Device matrix ---',
    ...result.deviceMatrix.map(
      (device) => `${device.platform}: ${device.deviceClass} (${device.priority})`,
    ),
    '',
    '--- False-claim guard ---',
    ...result.falseClaimFindings.map(
      (finding) => `${finding.passed ? 'PASS' : 'FAIL'} ${finding.id}: ${finding.message}`,
    ),
    '',
    '--- Visual direction ---',
    `Theme: ${STORE_SCREENSHOT_NARRATIVE_VISUAL_DIRECTION.theme}`,
    `Overlay: ${STORE_SCREENSHOT_NARRATIVE_VISUAL_DIRECTION.overlay}`,
    '',
    '--- Blockers ---',
    ...(result.blockerSummary.length > 0
      ? result.blockerSummary.map((blocker) => `- ${blocker.id}: ${blocker.message}`)
      : ['(none)']),
    '',
    '--- Next actions ---',
    ...result.nextActions.map((action) => `- ${action}`),
    '',
    `Docs: ${result.docsPath}`,
  ];
  return lines.join('\n');
}

export function buildStoreScreenshotNarrativeCaptionTable(
  result: StoreScreenshotNarrativeAuditResult,
): string {
  const header = '| # | TR Title | EN Title | TR Subtitle | EN Subtitle |';
  const sep = '|---|----------|----------|-------------|-------------|';
  const rows = result.screenshots.map(
    (screenshot) =>
      `| ${screenshot.order} | ${screenshot.titleTR} | ${screenshot.titleEN} | ${screenshot.subtitleTR} | ${screenshot.subtitleEN} |`,
  );
  return [header, sep, ...rows].join('\n');
}
