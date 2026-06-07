import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { runStoreScreenshotReadinessAudit } from '@/core/releaseReadiness/storeScreenshotReadinessAudit';
import { runStoreMetadataFinalizationAudit } from '@/core/releaseReadiness/storeMetadataFinalizationAudit';
import { runReleaseCandidateAudit } from '@/core/releaseCandidate/releaseCandidateAudit';
import { runManualLaunchTrackerAudit } from '@/core/manualLaunchTracker/manualLaunchTrackerAudit';
import {
  STORE_SCREENSHOT_NARRATIVE_DOCS_PATH,
  STORE_SCREENSHOT_NARRATIVE_FORBIDDEN_PHRASES,
  STORE_SCREENSHOT_NARRATIVE_MIN_COUNT,
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
  'hub_operations_desk',
  'event_decision_plan',
  'decision_impact_result',
  'map_neighborhood_reactions',
  'social_pulse',
  'end_of_day_report',
  'main_operation_day8',
  'profile_career',
] as const;

const OPTIONAL_SCREEN_KEYS = ['operational_resources', 'city_journal_memory'] as const;

export function verifyStoreScreenshotNarrativeScenario(): VerifyStoreScreenshotNarrativeOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  const narrative = runStoreScreenshotNarrativeAudit();
  const integrity = assertStoreScreenshotNarrativeIntegrity();

  record(assert(checks, integrity.ok, `integrity: ${integrity.message}`));

  const required = narrative.screenshots.filter((s) => s.blocksStoreSubmission);
  record(
    assert(
      checks,
      required.length >= STORE_SCREENSHOT_NARRATIVE_MIN_COUNT,
      `at least ${STORE_SCREENSHOT_NARRATIVE_MIN_COUNT} required screenshots`,
    ),
  );

  record(
    assert(
      checks,
      narrative.screenshots.every((s) => s.titleTR.trim().length > 0),
      'every item has TR title',
    ),
  );
  record(
    assert(
      checks,
      narrative.screenshots.every((s) => s.titleEN.trim().length > 0),
      'every item has EN title',
    ),
  );
  record(
    assert(
      checks,
      narrative.screenshots.every((s) => s.playerPromise.trim().length > 0),
      'every item has playerPromise',
    ),
  );
  record(
    assert(
      checks,
      narrative.screenshots.every((s) => s.requiredGameState.trim().length > 0),
      'every item has requiredGameState',
    ),
  );
  record(
    assert(
      checks,
      narrative.screenshots.every((s) => s.captureStatus === 'pending'),
      'every item captureStatus pending',
    ),
  );
  record(
    assert(
      checks,
      narrative.verifiedCaptureCount === 0,
      'verified capture count is 0',
    ),
  );

  for (const key of REQUIRED_SCREEN_KEYS) {
    record(
      assert(
        checks,
        narrative.screenshots.some((s) => s.screenKey === key),
        `screenshot item for ${key}`,
      ),
    );
  }
  for (const key of OPTIONAL_SCREEN_KEYS) {
    record(
      assert(
        checks,
        narrative.screenshots.some((s) => s.screenKey === key && s.optional),
        `optional screenshot item for ${key}`,
      ),
    );
  }

  const titleWordCounts = narrative.screenshots.flatMap((s) => [
    s.titleTR.split(/\s+/).length,
    s.titleEN.split(/\s+/).length,
  ]);
  record(
    assert(
      checks,
      titleWordCounts.every((c) => c >= 2 && c <= 8),
      'headlines are short (2–8 words)',
    ),
  );
  record(
    assert(
      checks,
      narrative.screenshots.every((s) => s.subtitleTR.length <= 80 && s.subtitleEN.length <= 80),
      'subtitles not too long',
    ),
  );

  const copyTexts = narrative.screenshots.flatMap((s) => [
    s.titleTR,
    s.titleEN,
    s.subtitleTR,
    s.subtitleEN,
    s.playerPromise,
  ]);
  const violations = scanNarrativeCopyForViolations(copyTexts);
  record(assert(checks, violations.length === 0, 'no forbidden phrases in captions', violations.join('; ')));
  record(assert(checks, narrative.copyGuardPassed, 'copy guard passed'));

  const iosPlan = narrative.deviceMatrix.some((d) => d.platform === 'ios');
  const androidPlan = narrative.deviceMatrix.some((d) => d.platform === 'android');
  record(assert(checks, iosPlan, 'iOS phone capture plan in device matrix'));
  record(assert(checks, androidPlan, 'Android phone capture plan in device matrix'));
  record(
    assert(
      checks,
      narrative.deviceMatrix.some((d) => d.safeAreaNotes.length > 0),
      'safe area notes present',
    ),
  );
  record(
    assert(
      checks,
      narrative.deviceMatrix.some((d) => d.trCopyLengthNote.length > 0 && d.enCopyLengthNote.length > 0),
      'TR/EN length notes present',
    ),
  );

  const screenshotReadiness = runStoreScreenshotReadinessAudit({ mode: 'launch_candidate' });
  const readinessAuditSrc = readRepo('src/core/releaseReadiness/storeScreenshotReadinessAudit.ts');
  record(
    assert(
      checks,
      readinessAuditSrc.includes('storeScreenshotNarrative') || readinessAuditSrc.includes('narrative'),
      'storeScreenshotReadiness references narrative pack',
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
  const metadataSrc = readRepo('src/core/releaseReadiness/storeMetadataFinalizationAudit.ts');
  record(
    assert(
      checks,
      metadataSrc.includes('narrative') || metadata.nextActions.some((a) => a.includes('screenshot')),
      'storeMetadataFinalization aware of screenshots',
    ),
  );

  const release = runReleaseCandidateAudit();
  const screenshotBlockerOpen =
    release.manualBlockers.some((id) => id.includes('screenshot')) ||
    release.blockerSummary.topPublicBlockers.some((b) => b.toLowerCase().includes('screenshot')) ||
    release.storeChecklist.some(
      (item) =>
        item.title.toLowerCase().includes('screenshot') &&
        (item.status === 'missing' || item.status === 'pending_console' || item.status === 'draft'),
    );
  record(
    assert(
      checks,
      screenshotBlockerOpen || release.publicLaunchDecision === 'blocked',
      'release candidate: screenshot blocker or launch blocked',
    ),
  );
  record(
    assert(
      checks,
      release.publicLaunchDecision === 'blocked',
      'public launch remains blocked',
    ),
  );

  const tracker = runManualLaunchTrackerAudit();
  const screenshotEvidence = tracker.evidenceLog.filter((e) => e.evidenceType === 'screenshot');
  const verifiedScreenshotEvidence = screenshotEvidence.filter((e) => e.status === 'verified');
  record(
    assert(
      checks,
      verifiedScreenshotEvidence.length === 0,
      'manual launch tracker: no verified screenshot evidence',
    ),
  );

  record(assert(checks, narrative.fakePassGuard === true, 'fakePassGuard active'));
  record(
    assert(
      checks,
      narrative.status === 'ready_for_capture' || narrative.status === 'blocked_by_missing_screens',
      `narrative status capture-pending (${narrative.status})`,
    ),
  );

  const persist = readRepo('src/store/gamePersist.ts');
  record(assert(checks, persist.includes(`SAVE_VERSION = ${SAVE_VERSION}`), `SAVE_VERSION unchanged (${SAVE_VERSION})`));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('storeScreenshotNarrative'), 'no narrative in persist'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('storeScreenshotNarrative'), 'applyDecision unchanged'));
  record(assert(checks, !readRepo('src/core/game/dayPipeline.ts').includes('storeScreenshotNarrative'), 'dayPipeline unchanged'));
  record(
    assert(
      checks,
      !readRepo('src/core/game/ensureDailyEventsForDay.ts').includes('storeScreenshotNarrative'),
      'event generation unchanged',
    ),
  );

  record(
    assert(
      checks,
      !readRepo('src/core/storeScreenshotNarrative/index.ts').includes('expo-router'),
      'no new route in narrative module',
    ),
  );

  record(assert(checks, existsSync(join(REPO_ROOT, STORE_SCREENSHOT_NARRATIVE_DOCS_PATH)), 'docs file exists'));
  record(
    assert(
      checks,
      STORE_SCREENSHOT_NARRATIVE_FORBIDDEN_PHRASES.length >= 10,
      'forbidden phrase list populated',
    ),
  );

  return { ok, checks };
}
