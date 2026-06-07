import type { StoreScreenshotNarrativeAuditResult } from './storeScreenshotNarrativeTypes';
import { STORE_SCREENSHOT_NARRATIVE_VISUAL_DIRECTION } from './storeScreenshotNarrativeConstants';

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
      (s) =>
        `${s.order}. [${s.captureStatus}] ${s.titleTR} / ${s.titleEN} (${s.screenKey})${s.optional ? ' [optional]' : ''}`,
    ),
    '',
    '--- Capture scenarios ---',
    ...result.captureScenarios.map((c) => `${c.id}: ${c.title} — ${c.targetDayRange}`),
    '',
    '--- Device matrix ---',
    ...result.deviceMatrix.map((d) => `${d.platform}: ${d.label}`),
    '',
    '--- Visual direction ---',
    `Theme: ${STORE_SCREENSHOT_NARRATIVE_VISUAL_DIRECTION.theme}`,
    `Overlay: ${STORE_SCREENSHOT_NARRATIVE_VISUAL_DIRECTION.overlay}`,
    '',
    '--- Blockers ---',
    ...(result.blockerSummary.length > 0
      ? result.blockerSummary.map((b) => `- ${b.id}: ${b.message}`)
      : ['(none)']),
    '',
    '--- Next actions ---',
    ...result.nextActions.map((a) => `- ${a}`),
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
    (s) =>
      `| ${s.order} | ${s.titleTR} | ${s.titleEN} | ${s.subtitleTR} | ${s.subtitleEN} |`,
  );
  return [header, sep, ...rows].join('\n');
}
