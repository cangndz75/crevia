import {
  STORE_SCREENSHOT_NARRATIVE_CAPTION_GUIDELINES,
  STORE_SCREENSHOT_NARRATIVE_CAPTURE_SCENARIOS,
  STORE_SCREENSHOT_NARRATIVE_DEVICE_MATRIX,
  STORE_SCREENSHOT_NARRATIVE_DOCS_PATH,
  STORE_SCREENSHOT_NARRATIVE_FORBIDDEN_PHRASES,
  STORE_SCREENSHOT_NARRATIVE_ITEMS_TEMPLATE,
  STORE_SCREENSHOT_NARRATIVE_MIN_COUNT,
  STORE_SCREENSHOT_NARRATIVE_PACK_ID,
} from './storeScreenshotNarrativeConstants';
import type {
  StoreScreenshotNarrativeAuditResult,
  StoreScreenshotNarrativeBlocker,
  StoreScreenshotNarrativeItem,
  StoreScreenshotNarrativePackStatus,
} from './storeScreenshotNarrativeTypes';

function matchesForbidden(text: string): string | undefined {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return STORE_SCREENSHOT_NARRATIVE_FORBIDDEN_PHRASES.find((p) =>
    normalized.includes(p.toLocaleLowerCase('tr-TR')),
  );
}

export function scanNarrativeCopyForViolations(texts: string[]): string[] {
  const violations: string[] = [];
  for (const text of texts) {
    const hit = matchesForbidden(text);
    if (hit) violations.push(`forbidden_phrase: ${hit} in "${text.slice(0, 40)}..."`);
  }
  return violations;
}

function buildScreenshots(): StoreScreenshotNarrativeItem[] {
  return STORE_SCREENSHOT_NARRATIVE_ITEMS_TEMPLATE.map((t) => ({
    ...t,
    captureStatus: 'pending' as const,
  }));
}

function collectCopyTexts(screenshots: StoreScreenshotNarrativeItem[]): string[] {
  return screenshots.flatMap((s) => [
    s.titleTR,
    s.titleEN,
    s.subtitleTR,
    s.subtitleEN,
    s.playerPromise,
    s.screenshotGoal,
  ]);
}

function resolveStatus(
  screenshots: StoreScreenshotNarrativeItem[],
  copyGuardPassed: boolean,
): StoreScreenshotNarrativePackStatus {
  const verified = screenshots.filter((s) => s.captureStatus === 'verified').length;
  const captured = screenshots.filter(
    (s) => s.captureStatus === 'captured' || s.captureStatus === 'verified',
  ).length;
  const required = screenshots.filter((s) => s.blocksStoreSubmission);
  const requiredPending = required.some((s) => s.captureStatus === 'pending');

  if (!copyGuardPassed) return 'draft';
  if (requiredPending && captured === 0) return 'ready_for_capture';
  if (requiredPending) return 'blocked_by_missing_screens';
  if (verified >= required.length) return 'ready_for_store_review';
  return 'blocked_by_missing_screens';
}

function buildBlockers(
  screenshots: StoreScreenshotNarrativeItem[],
  copyGuardPassed: boolean,
): StoreScreenshotNarrativeBlocker[] {
  const blockers: StoreScreenshotNarrativeBlocker[] = [];
  const pendingRequired = screenshots.filter(
    (s) => s.blocksStoreSubmission && s.captureStatus === 'pending',
  );

  if (pendingRequired.length > 0) {
    blockers.push({
      id: 'narrative.capture_pending',
      title: 'Screenshot capture pending',
      message: `${pendingRequired.length} required narrative screenshot(s) not captured — store submission blocked.`,
    });
  }

  if (!copyGuardPassed) {
    blockers.push({
      id: 'narrative.copy_guard',
      title: 'Narrative copy guard failed',
      message: 'TR/EN captions contain forbidden or misleading phrases.',
    });
  }

  const fakeVerified = screenshots.some(
    (s) => s.captureStatus === 'verified' || s.captureStatus === 'captured',
  );
  if (fakeVerified) {
    blockers.push({
      id: 'narrative.fake_evidence',
      title: 'Capture status must stay pending until real evidence',
      message: 'Narrative pack must not mark screenshots captured without evidence.',
    });
  }

  return blockers;
}

export function runStoreScreenshotNarrativeAudit(): StoreScreenshotNarrativeAuditResult {
  const screenshots = buildScreenshots();
  const copyTexts = collectCopyTexts(screenshots);
  const falseClaimViolations = scanNarrativeCopyForViolations(copyTexts);
  const copyGuardPassed = falseClaimViolations.length === 0;

  const requiredScreenshotCount = screenshots.filter((s) => s.blocksStoreSubmission).length;
  const pendingCaptureCount = screenshots.filter((s) => s.captureStatus === 'pending').length;
  const verifiedCaptureCount = screenshots.filter((s) => s.captureStatus === 'verified').length;

  const status = resolveStatus(screenshots, copyGuardPassed);
  const blockerSummary = buildBlockers(screenshots, copyGuardPassed);

  const nextActions: string[] = [
    `Review narrative pack: ${STORE_SCREENSHOT_NARRATIVE_DOCS_PATH}`,
    'Capture 8 required screenshots on iOS 6.7" and Android phone per device matrix.',
    'Apply TR/EN overlay headlines per screenshot order — verify length on small phones.',
    'Attach screenshot evidence to manual launch tracker before marking captured.',
    'Do not mark store_screenshots_captured blocker done without verified evidence.',
  ];

  if (!copyGuardPassed) {
    nextActions.unshift('Fix forbidden phrases in narrative captions.');
  }

  return {
    packId: STORE_SCREENSHOT_NARRATIVE_PACK_ID,
    status,
    localeCoverage: 'tr_en',
    targetStores: 'both',
    screenshots,
    captureScenarios: STORE_SCREENSHOT_NARRATIVE_CAPTURE_SCENARIOS.map((s) => ({ ...s })),
    captionGuidelines: STORE_SCREENSHOT_NARRATIVE_CAPTION_GUIDELINES.map((g) => ({ ...g })),
    deviceMatrix: STORE_SCREENSHOT_NARRATIVE_DEVICE_MATRIX.map((d) => ({ ...d })),
    blockerSummary,
    nextActions,
    fakePassGuard: true,
    copyGuardPassed,
    requiredScreenshotCount,
    pendingCaptureCount,
    verifiedCaptureCount,
    docsPath: STORE_SCREENSHOT_NARRATIVE_DOCS_PATH,
    falseClaimViolations,
  };
}

export function assertStoreScreenshotNarrativeIntegrity(): { ok: boolean; message: string } {
  const required = STORE_SCREENSHOT_NARRATIVE_ITEMS_TEMPLATE.filter((s) => !s.optional);
  if (required.length < STORE_SCREENSHOT_NARRATIVE_MIN_COUNT) {
    return {
      ok: false,
      message: `Required screenshots below minimum (${required.length} < ${STORE_SCREENSHOT_NARRATIVE_MIN_COUNT})`,
    };
  }
  if (STORE_SCREENSHOT_NARRATIVE_CAPTURE_SCENARIOS.length < 4) {
    return { ok: false, message: 'Capture scenarios too few' };
  }
  if (STORE_SCREENSHOT_NARRATIVE_DEVICE_MATRIX.length < 4) {
    return { ok: false, message: 'Device matrix too small' };
  }
  return { ok: true, message: 'OK' };
}

export function buildStoreScreenshotNarrativeSummary(result: StoreScreenshotNarrativeAuditResult): string {
  return [
    `Pack: ${result.packId}`,
    `Status: ${result.status}`,
    `Required: ${result.requiredScreenshotCount}`,
    `Pending: ${result.pendingCaptureCount}`,
    `Verified: ${result.verifiedCaptureCount}`,
    `Copy guard: ${result.copyGuardPassed ? 'PASS' : 'FAIL'}`,
    `Blockers: ${result.blockerSummary.length}`,
    `Docs: ${result.docsPath}`,
  ].join(' | ');
}
