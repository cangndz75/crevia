import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runManualLaunchTrackerAudit } from '@/core/manualLaunchTracker/manualLaunchTrackerAudit';
import { runReleaseCandidateAudit } from '@/core/releaseCandidate/releaseCandidateAudit';
import { runStoreMetadataFinalizationAudit } from '@/core/releaseReadiness/storeMetadataFinalizationAudit';
import { runStoreScreenshotReadinessAudit } from '@/core/releaseReadiness/storeScreenshotReadinessAudit';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  STORE_SCREENSHOT_NARRATIVE_DOCS_PATH,
  STORE_SCREENSHOT_NARRATIVE_FORBIDDEN_PHRASES,
  STORE_SCREENSHOT_NARRATIVE_MIN_COUNT,
  STORE_SCREENSHOT_NARRATIVE_OFFICIAL_DOCS,
} from './storeScreenshotNarrativeConstants';
import {
  assertStoreScreenshotNarrativeIntegrity,
  runStoreScreenshotNarrativeAudit,
  scanNarrativeCopyForViolations,
} from './storeScreenshotNarrativeAudit';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

export type VerifyStoreScreenshotNarrativeOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail = pass): boolean {
  checks.push(`${ok ? 'PASS' : 'FAIL'} ${ok ? pass : fail}`);
  return ok;
}

const REQUIRED_SCREEN_KEYS = [
  'onboarding_city_entry',
  'hub_operations_desk',
  'event_decision_plan',
  'decision_impact_result',
  'map_neighborhood_reactions',
  'social_pulse',
  'end_of_day_report',
  'main_operation_day8',
  'advisor_relationship',
] as const;

const OPTIONAL_SCREEN_KEYS = ['profile_career', 'operational_resources'] as const;

const REQUIRED_COPY_KEYS = [
  'Şehre İlk Adımını At',
  "Run Today's City Operations",
  'Karar Ver, Etkisini Gör',
  'See Why It Happened',
  'Neighborhoods React',
  'Sosyal Nabzı Oku',
  "Review the Day's Impact",
  'Ana Operasyon Başladı',
  'Ece Learns Your Style',
] as const;

export function verifyStoreScreenshotNarrativeScenario(): VerifyStoreScreenshotNarrativeOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  const narrative = runStoreScreenshotNarrativeAudit();
  const integrity = assertStoreScreenshotNarrativeIntegrity();
  const required = narrative.screenshots.filter((screenshot) => screenshot.blocksStoreSubmission);
  const optional = narrative.screenshots.filter((screenshot) => screenshot.optional);

  record(assert(checks, integrity.ok, `integrity: ${integrity.message}`));
  record(
    assert(
      checks,
      required.length >= STORE_SCREENSHOT_NARRATIVE_MIN_COUNT,
      `at least ${STORE_SCREENSHOT_NARRATIVE_MIN_COUNT} required screenshots`,
      `required screenshots=${required.length}`,
    ),
  );

  record(assert(checks, required[0]?.screenKey === 'onboarding_city_entry', 'onboarding screenshot is first'));
  record(
    assert(
      checks,
      narrative.screenshots.every((screenshot, index) => screenshot.order === index + 1),
      'screenshot order is sequential',
    ),
  );

  for (const key of REQUIRED_SCREEN_KEYS) {
    record(
      assert(
        checks,
        required.some((screenshot) => screenshot.screenKey === key),
        `required screenshot item for ${key}`,
      ),
    );
  }
  for (const key of OPTIONAL_SCREEN_KEYS) {
    record(
      assert(
        checks,
        optional.some((screenshot) => screenshot.screenKey === key),
        `optional screenshot item for ${key}`,
      ),
    );
  }

  record(
    assert(
      checks,
      narrative.screenshots.every((screenshot) => screenshot.titleTR.trim().length > 0),
      'every item has TR title',
    ),
  );
  record(
    assert(
      checks,
      narrative.screenshots.every((screenshot) => screenshot.titleEN.trim().length > 0),
      'every item has EN title',
    ),
  );
  record(
    assert(
      checks,
      narrative.screenshots.every((screenshot) => screenshot.subtitleTR.trim().length > 0),
      'every item has TR subtitle',
    ),
  );
  record(
    assert(
      checks,
      narrative.screenshots.every((screenshot) => screenshot.subtitleEN.trim().length > 0),
      'every item has EN subtitle',
    ),
  );
  record(
    assert(
      checks,
      narrative.screenshots.every((screenshot) => screenshot.playerPromise.trim().length > 0),
      'every item has playerPromise',
    ),
  );
  record(
    assert(
      checks,
      narrative.screenshots.every((screenshot) => screenshot.requiredGameState.trim().length > 0),
      'every item has requiredGameState',
    ),
  );
  record(
    assert(
      checks,
      narrative.screenshots.every((screenshot) => screenshot.captureStatus === 'pending'),
      'every item captureStatus pending',
    ),
  );
  record(assert(checks, narrative.verifiedCaptureCount === 0, 'verified capture count is 0'));

  for (const copy of REQUIRED_COPY_KEYS) {
    record(
      assert(
        checks,
        narrative.screenshots.some(
          (screenshot) =>
            screenshot.titleTR === copy ||
            screenshot.titleEN === copy ||
            screenshot.subtitleTR === copy ||
            screenshot.subtitleEN === copy,
        ),
        `required copy present: ${copy}`,
      ),
    );
  }

  const titleWordCounts = narrative.screenshots.flatMap((screenshot) => [
    screenshot.titleTR.split(/\s+/).length,
    screenshot.titleEN.split(/\s+/).length,
  ]);
  record(
    assert(
      checks,
      titleWordCounts.every((count) => count >= 2 && count <= 7),
      'headlines are short (2-7 words)',
    ),
  );
  record(
    assert(
      checks,
      narrative.screenshots.every(
        (screenshot) => screenshot.subtitleTR.length <= 82 && screenshot.subtitleEN.length <= 82,
      ),
      'subtitles not too long',
    ),
  );

  const copyTexts = narrative.screenshots.flatMap((screenshot) => [
    screenshot.titleTR,
    screenshot.titleEN,
    screenshot.subtitleTR,
    screenshot.subtitleEN,
    screenshot.playerPromise,
    screenshot.screenshotGoal,
  ]);
  const violations = scanNarrativeCopyForViolations(copyTexts);
  record(assert(checks, violations.length === 0, 'no forbidden phrases or technical words', violations.join('; ')));
  record(assert(checks, narrative.copyGuardPassed, 'copy guard passed'));
  record(
    assert(
      checks,
      narrative.falseClaimFindings.every((finding) => finding.passed),
      'all false-claim findings pass',
      narrative.falseClaimFindings
        .filter((finding) => !finding.passed)
        .map((finding) => finding.id)
        .join(', '),
    ),
  );

  record(
    assert(
      checks,
      narrative.deviceMatrix.some(
        (device) => device.platform === 'ios' && device.priority === 'must' && device.orientation === 'portrait',
      ),
      'iOS phone capture plan in device matrix',
    ),
  );
  record(
    assert(
      checks,
      narrative.deviceMatrix.some(
        (device) =>
          device.platform === 'android' && device.priority === 'must' && device.orientation === 'portrait',
      ),
      'Android phone capture plan in device matrix',
    ),
  );
  record(
    assert(
      checks,
      narrative.deviceMatrix.every(
        (device) =>
          device.safeAreaNotes.length > 0 &&
          device.cropRisk.length > 0 &&
          device.copyLengthNotes.length > 0,
      ),
      'safe area, crop, and TR/EN length notes present',
    ),
  );
  record(
    assert(
      checks,
      narrative.deviceMatrix.every((device) =>
        device.officialDimensionNotes.toLowerCase().includes('official') ||
        device.officialDimensionNotes.toLowerCase().includes('console') ||
        device.officialDimensionNotes.toLowerCase().includes('connect'),
      ),
      'official dimension check manual note present',
    ),
  );

  const scenarioIds = narrative.captureScenarios.map((scenario) => scenario.scenarioId);
  record(assert(checks, scenarioIds.includes('state_day1_onboarding'), 'Day 1 onboarding scenario present'));
  record(assert(checks, scenarioIds.includes('state_day5_pilot'), 'Day 5 pilot scenario present'));
  record(assert(checks, scenarioIds.includes('state_day8_main_operation'), 'Day 8 main operation scenario present'));
  record(assert(checks, scenarioIds.includes('state_profile_career'), 'Profile scenario present'));
  record(
    assert(
      checks,
      narrative.captureScenarios.every(
        (scenario) =>
          scenario.requiredStateSummary.length > 0 &&
          scenario.surfaces.length > 0 &&
          scenario.seedNotes.length > 0 &&
          scenario.fakeDataPolicy.length > 0 &&
          scenario.evidenceNotes.length > 0,
      ),
      'capture scenarios include state, surfaces, seed, fake-data and evidence notes',
    ),
  );

  const screenshotReadiness = runStoreScreenshotReadinessAudit({ mode: 'launch_candidate' });
  record(
    assert(
      checks,
      screenshotReadiness.narrativePackId === narrative.packId &&
        screenshotReadiness.narrativePackStatus === narrative.status &&
        screenshotReadiness.narrativeDocsPath === STORE_SCREENSHOT_NARRATIVE_DOCS_PATH,
      'storeScreenshotReadiness reads narrative pack',
    ),
  );
  record(
    assert(
      checks,
      !screenshotReadiness.allRequiredCaptured,
      'store screenshot readiness: capture still pending',
    ),
  );

  const metadata = runStoreMetadataFinalizationAudit();
  record(
    assert(
      checks,
      metadata.nextActions.some((action) => action.includes('crevia-store-screenshot-narrative-pack')),
      'storeMetadataFinalization links narrative docs',
    ),
  );

  const release = runReleaseCandidateAudit();
  record(assert(checks, release.publicLaunchDecision === 'blocked', 'public launch remains blocked'));
  record(
    assert(
      checks,
      release.manualBlockers.includes('store_screenshots_captured') ||
        release.storeChecklist.some(
          (item) => item.id === 'visual.iphone_screenshots' && item.status !== 'done',
        ),
      'release candidate screenshot blocker remains open',
    ),
  );

  const tracker = runManualLaunchTrackerAudit();
  const verifiedScreenshotEvidence = tracker.evidenceLog.filter(
    (evidence) => evidence.evidenceType === 'screenshot' && evidence.status === 'verified',
  );
  record(
    assert(
      checks,
      verifiedScreenshotEvidence.length === 0,
      'manual launch tracker: no verified screenshot evidence',
    ),
  );

  record(assert(checks, narrative.fakePassGuard === true, 'fakePassGuard active'));
  record(assert(checks, narrative.status === 'ready_for_capture', 'narrative status ready_for_capture'));

  const docs = readRepo(STORE_SCREENSHOT_NARRATIVE_DOCS_PATH);
  record(assert(checks, docs.includes('Dirty worktree stabilization'), 'docs include dirty stabilization'));
  record(assert(checks, docs.includes('Screenshot narrative order'), 'docs include narrative order'));
  record(assert(checks, docs.includes('Capture scenario states'), 'docs include capture states'));
  record(assert(checks, docs.includes('Device matrix'), 'docs include device matrix'));
  record(assert(checks, docs.includes('False claim guard'), 'docs include false claim guard'));
  record(assert(checks, docs.includes('Remaining manual actions'), 'docs include remaining manual actions'));
  record(
    assert(
      checks,
      docs.includes(STORE_SCREENSHOT_NARRATIVE_OFFICIAL_DOCS.appleScreenshotSpecs) &&
        docs.includes(STORE_SCREENSHOT_NARRATIVE_OFFICIAL_DOCS.googlePreviewAssets) &&
        docs.includes(STORE_SCREENSHOT_NARRATIVE_OFFICIAL_DOCS.appleAppPrivacy) &&
        docs.includes(STORE_SCREENSHOT_NARRATIVE_OFFICIAL_DOCS.googleDataSafety),
      'docs link official store/privacy references',
    ),
  );

  const persist = readRepo('src/store/gamePersist.ts');
  record(assert(checks, persist.includes(`SAVE_VERSION = ${SAVE_VERSION}`), `SAVE_VERSION unchanged (${SAVE_VERSION})`));
  record(assert(checks, !persist.includes('storeScreenshotNarrative'), 'no narrative in persist'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('storeScreenshotNarrative'), 'applyDecision unchanged'));
  record(
    assert(
      checks,
      !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('storeScreenshotNarrative'),
      'dayPipeline unchanged',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/game/ensureDailyEventsForDay.ts').includes('storeScreenshotNarrative'),
      'event generation unchanged',
    ),
  );
  record(assert(checks, !readRepo('src/core/storeScreenshotNarrative/index.ts').includes('expo-router'), 'no new route in narrative module'));
  record(assert(checks, existsSync(join(REPO_ROOT, STORE_SCREENSHOT_NARRATIVE_DOCS_PATH)), 'docs file exists'));
  record(assert(checks, STORE_SCREENSHOT_NARRATIVE_FORBIDDEN_PHRASES.length >= 20, 'forbidden phrase list populated'));

  return { ok, checks };
}
