import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runManualLaunchTrackerAudit } from '@/core/manualLaunchTracker/manualLaunchTrackerAudit';
import { runReleaseCandidateAudit } from '@/core/releaseCandidate/releaseCandidateAudit';
import { runStoreMetadataFinalizationAudit } from '@/core/releaseReadiness/storeMetadataFinalizationAudit';
import { runStoreScreenshotNarrativeAudit } from '@/core/storeScreenshotNarrative';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  STORE_METADATA_COPY_DOCS_PATH,
  STORE_METADATA_COPY_FORBIDDEN_PHRASES,
  STORE_METADATA_COPY_MIN_FEATURE_BULLETS,
  STORE_METADATA_COPY_NARRATIVE_ALIGNMENT_THEMES_EN,
  STORE_METADATA_COPY_NARRATIVE_ALIGNMENT_THEMES_TR,
  STORE_METADATA_COPY_NARRATIVE_DOCS_PATH,
} from './storeMetadataCopyConstants';
import {
  assertStoreMetadataCopyIntegrity,
  runStoreMetadataCopyAudit,
  scanMetadataCopyForFalseClaims,
} from './storeMetadataCopyAudit';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

export type VerifyStoreMetadataCopyOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail = pass): boolean {
  checks.push(`${ok ? 'PASS' : 'FAIL'} ${ok ? pass : fail}`);
  return ok;
}

export function verifyStoreMetadataCopyScenario(): VerifyStoreMetadataCopyOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  const copy = runStoreMetadataCopyAudit();
  const integrity = assertStoreMetadataCopyIntegrity();

  record(assert(checks, integrity.ok, `integrity: ${integrity.message}`));
  record(assert(checks, copy.packId.length > 0, 'StoreMetadataCopyPack produced'));
  record(assert(checks, copy.localeCoverage === 'tr_en', 'TR/EN coverage'));
  record(assert(checks, copy.appNameOptions.length >= 2, 'app name alternatives'));
  record(assert(checks, copy.subtitleOptionsTR.length >= 2, 'TR subtitle alternatives'));
  record(assert(checks, copy.subtitleOptionsEN.length >= 2, 'EN subtitle alternatives'));
  record(assert(checks, copy.shortDescriptionOptionsTR.length >= 1, 'TR short description'));
  record(assert(checks, copy.shortDescriptionOptionsEN.length >= 1, 'EN short description'));
  record(assert(checks, copy.longDescriptionTR.length > 100, 'TR full description'));
  record(assert(checks, copy.longDescriptionEN.length > 100, 'EN full description'));
  record(
    assert(
      checks,
      copy.featureBulletsTR.length >= STORE_METADATA_COPY_MIN_FEATURE_BULLETS,
      `TR feature bullets >= ${STORE_METADATA_COPY_MIN_FEATURE_BULLETS}`,
    ),
  );
  record(
    assert(
      checks,
      copy.featureBulletsEN.length >= STORE_METADATA_COPY_MIN_FEATURE_BULLETS,
      `EN feature bullets >= ${STORE_METADATA_COPY_MIN_FEATURE_BULLETS}`,
    ),
  );
  record(assert(checks, copy.keywordPhrasesTR.length >= 8, 'TR keyword phrase pool'));
  record(assert(checks, copy.keywordPhrasesEN.length >= 8, 'EN keyword phrase pool'));
  record(assert(checks, copy.reviewNotesTR.length > 50, 'TR review notes'));
  record(assert(checks, copy.reviewNotesEN.length > 50, 'EN review notes'));
  record(assert(checks, copy.releaseNotesTR.length > 20, 'TR release notes'));
  record(assert(checks, copy.releaseNotesEN.length > 20, 'EN release notes'));
  record(assert(checks, copy.iapCopyGuidance.toneTr.length > 10, 'IAP copy guidance TR'));
  record(assert(checks, copy.iapCopyGuidance.toneEn.length > 10, 'IAP copy guidance EN'));
  record(assert(checks, copy.privacyDisclosureCopyTR.length > 20, 'privacy disclosure TR'));
  record(assert(checks, copy.privacyDisclosureCopyEN.length > 20, 'privacy disclosure EN'));
  record(assert(checks, copy.manualLimitChecks.length >= 5, 'manual limit check notes'));

  const copyTexts = copy.items.map((i) => ({ id: i.id, text: i.text }));
  const falseClaims = scanMetadataCopyForFalseClaims(copyTexts);
  record(
    assert(
      checks,
      falseClaims.length === 0,
      'no false GPS/AI/online/official claims',
      falseClaims.map((f) => `${f.fieldId}:${f.phrase}`).join('; '),
    ),
  );
  record(assert(checks, copy.copyGuardPassed, 'copy guard passed'));

  record(
    assert(
      checks,
      !copy.longDescriptionTR.includes('crevia.main_operation') &&
        !copy.longDescriptionEN.includes('crevia.main_operation'),
      'no invented product IDs in descriptions',
    ),
  );
  record(
    assert(
      checks,
      !/\$\d+|\d+\s*TL|price tier/i.test(copy.longDescriptionTR + copy.longDescriptionEN),
      'no invented prices in copy',
    ),
  );
  record(assert(checks, copy.consoleEntryPending === true, 'console entry pending'));
  record(
    assert(
      checks,
      copy.status === 'ready_for_console_entry' || copy.status === 'draft',
      `status console-ready (${copy.status})`,
    ),
  );
  record(assert(checks, copy.fakePassGuard === true, 'fakePassGuard active'));

  const trTechDensity =
    (copy.longDescriptionTR.match(/\b(runtime|persist|metadata|sdk)\b/gi) ?? []).length;
  record(assert(checks, trTechDensity <= 2, 'TR copy not overly technical'));

  const enNotMirror =
    copy.longDescriptionEN.slice(0, 80) !== copy.longDescriptionTR.slice(0, 80);
  record(assert(checks, enNotMirror, 'EN copy not direct TR mirror'));

  for (const theme of STORE_METADATA_COPY_NARRATIVE_ALIGNMENT_THEMES_TR) {
    record(
      assert(
        checks,
        copy.longDescriptionTR.toLocaleLowerCase('tr-TR').includes(theme),
        `narrative theme TR: ${theme}`,
      ),
    );
  }
  for (const theme of STORE_METADATA_COPY_NARRATIVE_ALIGNMENT_THEMES_EN) {
    record(
      assert(
        checks,
        copy.longDescriptionEN.toLocaleLowerCase('en-US').includes(theme),
        `narrative theme EN: ${theme}`,
      ),
    );
  }

  const narrative = runStoreScreenshotNarrativeAudit();
  record(
    assert(
      checks,
      narrative.status === 'ready_for_capture' || narrative.status === 'blocked_by_missing_screens',
      'screenshot narrative still capture-pending',
    ),
  );
  record(assert(checks, narrative.verifiedCaptureCount === 0, 'screenshot evidence still 0'));

  const finalization = runStoreMetadataFinalizationAudit({ mode: 'launch_candidate' });
  const finalizationSrc = readRepo('src/core/releaseReadiness/storeMetadataFinalizationAudit.ts');
  record(
    assert(
      checks,
      finalizationSrc.includes('storeMetadataCopy') || finalizationSrc.includes('metadataCopy'),
      'storeMetadataFinalization references copy pack',
    ),
  );
  record(
    assert(
      checks,
      finalization.consoleEntryPending,
      'storeMetadataFinalization console entry pending',
    ),
  );
  record(
    assert(
      checks,
      finalization.nextActions.some((a) => a.includes('metadata') || a.includes('copy')),
      'storeMetadataFinalization aware of metadata copy',
    ),
  );

  const release = runReleaseCandidateAudit();
  record(assert(checks, release.publicLaunchDecision === 'blocked', 'public launch remains blocked'));
  const metadataBlockerOpen =
    release.manualBlockers.some((id) => id.includes('metadata')) ||
    release.blockerSummary.topPublicBlockers.some((b) => b.toLowerCase().includes('metadata')) ||
    finalization.blockers.some((b) => b.id.includes('console') || b.id.includes('metadata'));
  record(assert(checks, metadataBlockerOpen, 'release candidate metadata blocker pending'));

  const tracker = runManualLaunchTrackerAudit();
  record(
    assert(
      checks,
      tracker.evidenceSummary.verifiedEvidence === 0,
      'manual launch tracker verified evidence 0',
    ),
  );

  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('storeMetadataCopy'), 'no copy in persist'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('storeMetadataCopy'), 'applyDecision unchanged'));
  record(assert(checks, !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('storeMetadataCopy'), 'dayPipeline unchanged'));
  record(
    assert(
      checks,
      !readRepo('src/core/game/generateDailyEventSet.ts').includes('storeMetadataCopy'),
      'event generation unchanged',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/storeMetadataCopy/index.ts').includes('expo-router'),
      'no new route in copy module',
    ),
  );
  record(assert(checks, existsSync(join(REPO_ROOT, STORE_METADATA_COPY_DOCS_PATH)), 'docs file exists'));
  record(
    assert(
      checks,
      existsSync(join(REPO_ROOT, STORE_METADATA_COPY_NARRATIVE_DOCS_PATH)),
      'narrative docs linked',
    ),
  );
  record(
    assert(
      checks,
      STORE_METADATA_COPY_FORBIDDEN_PHRASES.length >= 15,
      'forbidden phrase list populated',
    ),
  );
  record(assert(checks, persistIncludesSaveVersion(), `SAVE_VERSION unchanged (${SAVE_VERSION})`));

  return { ok, checks };
}

function persistIncludesSaveVersion(): boolean {
  const persist = readRepo('src/store/gamePersist.ts');
  return persist.includes(`SAVE_VERSION = ${SAVE_VERSION}`);
}
