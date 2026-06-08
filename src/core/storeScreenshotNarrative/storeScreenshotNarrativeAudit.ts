import {
  STORE_SCREENSHOT_NARRATIVE_CAPTION_GUIDELINES,
  STORE_SCREENSHOT_NARRATIVE_CAPTURE_SCENARIOS,
  STORE_SCREENSHOT_NARRATIVE_DEVICE_MATRIX,
  STORE_SCREENSHOT_NARRATIVE_DOCS_PATH,
  STORE_SCREENSHOT_NARRATIVE_FORBIDDEN_PHRASES,
  STORE_SCREENSHOT_NARRATIVE_ITEMS_TEMPLATE,
  STORE_SCREENSHOT_NARRATIVE_MIN_COUNT,
  STORE_SCREENSHOT_NARRATIVE_OFFICIAL_DOCS,
  STORE_SCREENSHOT_NARRATIVE_PACK_ID,
  STORE_SCREENSHOT_NARRATIVE_TECHNICAL_FORBIDDEN_WORDS,
} from './storeScreenshotNarrativeConstants';
import type {
  StoreScreenshotNarrativeAuditResult,
  StoreScreenshotNarrativeBlocker,
  StoreScreenshotNarrativeFalseClaimFinding,
  StoreScreenshotNarrativeItem,
  StoreScreenshotNarrativePackStatus,
} from './storeScreenshotNarrativeTypes';

function normalize(text: string): string {
  return text.toLocaleLowerCase('tr-TR');
}

function matchesForbidden(text: string): string | undefined {
  const normalized = normalize(text);
  return STORE_SCREENSHOT_NARRATIVE_FORBIDDEN_PHRASES.find((phrase) =>
    normalized.includes(normalize(phrase)),
  );
}

function matchesTechnicalWord(text: string): string | undefined {
  const normalized = normalize(text);
  return STORE_SCREENSHOT_NARRATIVE_TECHNICAL_FORBIDDEN_WORDS.find((word) =>
    new RegExp(`\\b${word}\\b`, 'i').test(normalized),
  );
}

export function scanNarrativeCopyForViolations(texts: string[]): string[] {
  const violations: string[] = [];
  for (const text of texts) {
    const forbidden = matchesForbidden(text);
    if (forbidden) violations.push(`forbidden_phrase: ${forbidden} in "${text.slice(0, 52)}"`);
    const technical = matchesTechnicalWord(text);
    if (technical) violations.push(`technical_word: ${technical} in "${text.slice(0, 52)}"`);
  }
  return violations;
}

function buildScreenshots(): StoreScreenshotNarrativeItem[] {
  return STORE_SCREENSHOT_NARRATIVE_ITEMS_TEMPLATE.map((template) => ({
    ...template,
    captureStatus: 'pending' as const,
  }));
}

function collectCopyTexts(screenshots: StoreScreenshotNarrativeItem[]): string[] {
  return screenshots.flatMap((screenshot) => [
    screenshot.titleTR,
    screenshot.titleEN,
    screenshot.subtitleTR,
    screenshot.subtitleEN,
    screenshot.playerPromise,
    screenshot.screenshotGoal,
  ]);
}

function resolveStatus(
  screenshots: StoreScreenshotNarrativeItem[],
  copyGuardPassed: boolean,
): StoreScreenshotNarrativePackStatus {
  const required = screenshots.filter((screenshot) => screenshot.blocksStoreSubmission);
  const anyCaptured = screenshots.some(
    (screenshot) =>
      screenshot.captureStatus === 'captured' || screenshot.captureStatus === 'verified',
  );
  const allRequiredVerified = required.every((screenshot) => screenshot.captureStatus === 'verified');
  const anyRequiredPending = required.some((screenshot) => screenshot.captureStatus === 'pending');

  if (!copyGuardPassed) return 'draft';
  if (!anyCaptured && anyRequiredPending) return 'ready_for_capture';
  if (allRequiredVerified) return 'ready_for_store_review';
  return 'blocked_by_missing_screens';
}

function buildFalseClaimFindings(
  screenshots: StoreScreenshotNarrativeItem[],
  violations: string[],
): StoreScreenshotNarrativeFalseClaimFinding[] {
  const copy = collectCopyTexts(screenshots).join(' ');
  const normalizedCopy = normalize(copy);
  const allPending = screenshots.every((screenshot) => screenshot.captureStatus === 'pending');
  const onboardingItem = screenshots.find((screenshot) => screenshot.id === 'ssn_onboarding_entry');
  const rewardCopy = screenshots
    .filter((screenshot) => screenshot.id === 'ssn_decision_impact' || screenshot.id === 'ssn_end_of_day_report')
    .map((screenshot) => `${screenshot.playerPromise} ${screenshot.screenshotGoal}`)
    .join(' ');

  return [
    {
      id: 'false_claim.no_ai',
      passed: !/\bai\b|yapay zeka/i.test(copy),
      message: 'No AI or chatbot store claim.',
    },
    {
      id: 'false_claim.no_gps_live_tracking',
      passed: !/gps|canlı takip|live tracking/i.test(copy),
      message: 'No GPS or live tracking claim.',
    },
    {
      id: 'false_claim.no_online_multiplayer',
      passed: !/online|multiplayer|oyuncularla rekabet/i.test(copy),
      message: 'No online or multiplayer claim.',
    },
    {
      id: 'false_claim.no_official_data',
      passed: !/resmi belediye|gerçek belediye|official municipality|real city data/i.test(copy),
      message: 'No official municipality or real city data claim.',
    },
    {
      id: 'false_claim.no_unlimited_free',
      passed: !/sınırsız|bedava|ücretsiz her şey|free forever|unlimited/i.test(copy),
      message: 'No unlimited or misleading free claim.',
    },
    {
      id: 'false_claim.no_iap_paywall',
      passed: !/premium|satın al|paywall|buy to win|unlock premium/i.test(copy),
      message: 'No IAP or paywall claim in screenshot copy.',
    },
    {
      id: 'false_claim.capture_pending',
      passed: allPending,
      message: 'All screenshot capture statuses remain pending until real evidence exists.',
    },
    {
      id: 'false_claim.onboarding_mapping',
      passed:
        onboardingItem != null &&
        onboardingItem.captureNotes.includes('gameplay mapping stays invisible') &&
        !normalizedCopy.includes('new gameplay district'),
      message: 'Five onboarding presentation districts are not described as new gameplay district types.',
    },
    {
      id: 'false_claim.reward_not_economy',
      passed: !/coin|currency|economy reward|cash|prize/i.test(rewardCopy),
      message: 'Reward and comeback language is visibility/recovery, not economy reward.',
    },
    {
      id: 'false_claim.copy_scanner',
      passed: violations.length === 0,
      message: violations.length === 0 ? 'Copy scanner passed.' : violations.join('; '),
    },
  ];
}

function buildBlockers(
  screenshots: StoreScreenshotNarrativeItem[],
  copyGuardPassed: boolean,
  falseClaimFindings: StoreScreenshotNarrativeFalseClaimFinding[],
): StoreScreenshotNarrativeBlocker[] {
  const blockers: StoreScreenshotNarrativeBlocker[] = [];
  const pendingRequired = screenshots.filter(
    (screenshot) => screenshot.blocksStoreSubmission && screenshot.captureStatus === 'pending',
  );

  if (pendingRequired.length > 0) {
    blockers.push({
      id: 'narrative.capture_pending',
      title: 'Screenshot capture pending',
      message: `${pendingRequired.length} required narrative screenshot(s) still need real device capture.`,
    });
  }

  if (!copyGuardPassed) {
    blockers.push({
      id: 'narrative.copy_guard',
      title: 'Narrative copy guard failed',
      message: 'TR/EN captions contain forbidden, technical, or misleading phrases.',
    });
  }

  const failedFindings = falseClaimFindings.filter((finding) => !finding.passed);
  if (failedFindings.length > 0) {
    blockers.push({
      id: 'narrative.false_claim_guard',
      title: 'False-claim guard failed',
      message: failedFindings.map((finding) => finding.id).join(', '),
    });
  }

  if (
    screenshots.some(
      (screenshot) => screenshot.captureStatus === 'captured' || screenshot.captureStatus === 'verified',
    )
  ) {
    blockers.push({
      id: 'narrative.fake_evidence',
      title: 'Capture status changed without evidence',
      message: 'Narrative pack must not mark screenshots captured without verified evidence.',
    });
  }

  return blockers;
}

export function runStoreScreenshotNarrativeAudit(): StoreScreenshotNarrativeAuditResult {
  const screenshots = buildScreenshots();
  const copyTexts = collectCopyTexts(screenshots);
  const falseClaimViolations = scanNarrativeCopyForViolations(copyTexts);
  const falseClaimFindings = buildFalseClaimFindings(screenshots, falseClaimViolations);
  const copyGuardPassed =
    falseClaimViolations.length === 0 && falseClaimFindings.every((finding) => finding.passed);

  const requiredScreenshotCount = screenshots.filter(
    (screenshot) => screenshot.blocksStoreSubmission,
  ).length;
  const pendingCaptureCount = screenshots.filter(
    (screenshot) => screenshot.captureStatus === 'pending',
  ).length;
  const verifiedCaptureCount = screenshots.filter(
    (screenshot) => screenshot.captureStatus === 'verified',
  ).length;

  const status = resolveStatus(screenshots, copyGuardPassed);
  const blockerSummary = buildBlockers(screenshots, copyGuardPassed, falseClaimFindings);

  const nextActions: string[] = [
    `Review narrative pack: ${STORE_SCREENSHOT_NARRATIVE_DOCS_PATH}`,
    `Re-check official store docs before export: Apple screenshots (${STORE_SCREENSHOT_NARRATIVE_OFFICIAL_DOCS.appleScreenshotSpecs}) and Google preview assets (${STORE_SCREENSHOT_NARRATIVE_OFFICIAL_DOCS.googlePreviewAssets}).`,
    'Capture 9 required screenshots on iOS large phone and Android phone using real device/emulator evidence.',
    'Apply TR/EN overlay captions and verify text length on small phone previews.',
    'Attach screenshot and store console evidence before marking store_screenshots_captured done.',
    'Keep privacy URL and Google Data safety as separate manual blockers until completed in the real consoles.',
  ];

  if (!copyGuardPassed) {
    nextActions.unshift('Fix forbidden or misleading screenshot narrative copy.');
  }

  return {
    packId: STORE_SCREENSHOT_NARRATIVE_PACK_ID,
    status,
    localeCoverage: 'tr_en',
    targetStores: 'both',
    screenshots,
    captureScenarios: STORE_SCREENSHOT_NARRATIVE_CAPTURE_SCENARIOS.map((scenario) => ({
      ...scenario,
      surfaces: [...scenario.surfaces],
    })),
    captionGuidelines: STORE_SCREENSHOT_NARRATIVE_CAPTION_GUIDELINES.map((guideline) => ({
      ...guideline,
    })),
    deviceMatrix: STORE_SCREENSHOT_NARRATIVE_DEVICE_MATRIX.map((device) => ({ ...device })),
    falseClaimFindings,
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
  const required = STORE_SCREENSHOT_NARRATIVE_ITEMS_TEMPLATE.filter(
    (screenshot) => !screenshot.optional,
  );
  const uniqueOrders = new Set(STORE_SCREENSHOT_NARRATIVE_ITEMS_TEMPLATE.map((screenshot) => screenshot.order));
  const uniqueIds = new Set(STORE_SCREENSHOT_NARRATIVE_ITEMS_TEMPLATE.map((screenshot) => screenshot.id));

  if (required.length < STORE_SCREENSHOT_NARRATIVE_MIN_COUNT) {
    return {
      ok: false,
      message: `Required screenshots below minimum (${required.length} < ${STORE_SCREENSHOT_NARRATIVE_MIN_COUNT})`,
    };
  }
  if (uniqueOrders.size !== STORE_SCREENSHOT_NARRATIVE_ITEMS_TEMPLATE.length) {
    return { ok: false, message: 'Duplicate screenshot order' };
  }
  if (uniqueIds.size !== STORE_SCREENSHOT_NARRATIVE_ITEMS_TEMPLATE.length) {
    return { ok: false, message: 'Duplicate screenshot id' };
  }
  if (STORE_SCREENSHOT_NARRATIVE_CAPTURE_SCENARIOS.length < 5) {
    return { ok: false, message: 'Capture scenarios too few' };
  }
  if (STORE_SCREENSHOT_NARRATIVE_DEVICE_MATRIX.length < 5) {
    return { ok: false, message: 'Device matrix too small' };
  }
  return { ok: true, message: 'OK' };
}

export function buildStoreScreenshotNarrativeSummary(
  result: StoreScreenshotNarrativeAuditResult,
): string {
  return [
    `Pack: ${result.packId}`,
    `Status: ${result.status}`,
    `Required: ${result.requiredScreenshotCount}`,
    `Pending: ${result.pendingCaptureCount}`,
    `Verified: ${result.verifiedCaptureCount}`,
    `Copy guard: ${result.copyGuardPassed ? 'PASS' : 'FAIL'}`,
    `False claims: ${result.falseClaimFindings.filter((finding) => !finding.passed).length} fail`,
    `Blockers: ${result.blockerSummary.length}`,
    `Docs: ${result.docsPath}`,
  ].join(' | ');
}
