import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runManualLaunchTrackerAudit } from '@/core/manualLaunchTracker/manualLaunchTrackerAudit';
import { runReleaseCandidateAudit } from '@/core/releaseCandidate/releaseCandidateAudit';
import { runStoreMetadataFinalizationAudit } from '@/core/releaseReadiness/storeMetadataFinalizationAudit';
import { runPrivacyPolicyReadinessAudit } from '@/core/releaseReadiness/privacyPolicyReadinessAudit';
import { runStoreMetadataCopyAudit } from '@/core/storeMetadataCopy';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  PRIVACY_POLICY_TEXT_DOCS_PATH,
  PRIVACY_POLICY_TEXT_FORBIDDEN_PHRASES,
  PRIVACY_POLICY_TEXT_MIN_SECTIONS,
} from './privacyPolicyTextConstants';
import {
  assertPrivacyPolicyTextIntegrity,
  runPrivacyPolicyTextAudit,
  scanPrivacyPolicyTextForViolations,
} from './privacyPolicyTextAudit';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

export type VerifyPrivacyPolicyTextOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail = pass): boolean {
  checks.push(`${ok ? 'PASS' : 'FAIL'} ${ok ? pass : fail}`);
  return ok;
}

const REQUIRED_SECTION_IDS = [
  'overview',
  'data_collected',
  'data_not_collected',
  'sentry_crash',
  'analytics',
  'purchases_revenuecat',
  'local_save',
  'children_age',
  'data_sharing',
  'user_choices',
  'contact_support',
] as const;

export function verifyPrivacyPolicyTextScenario(): VerifyPrivacyPolicyTextOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  const pack = runPrivacyPolicyTextAudit();
  const integrity = assertPrivacyPolicyTextIntegrity();

  record(assert(checks, integrity.ok, `integrity: ${integrity.message}`));
  record(assert(checks, pack.packId.length > 0, 'PrivacyPolicyTextPack produced'));
  record(assert(checks, pack.localeCoverage === 'tr_en', 'TR/EN coverage'));
  record(
    assert(
      checks,
      pack.sections.length >= PRIVACY_POLICY_TEXT_MIN_SECTIONS,
      `at least ${PRIVACY_POLICY_TEXT_MIN_SECTIONS} privacy sections`,
    ),
  );
  record(assert(checks, pack.dataUseMatrix.length >= 15, 'data safety matrix present'));
  record(assert(checks, pack.sdkDisclosureMatrix.length >= 4, 'SDK disclosure matrix present'));
  record(assert(checks, pack.storeDisclosureCopyTR.length > 20, 'store disclosure TR'));
  record(assert(checks, pack.storeDisclosureCopyEN.length > 20, 'store disclosure EN'));
  record(assert(checks, pack.manualReviewItems.length >= 6, 'manual legal review items'));
  record(assert(checks, pack.legalReviewStatus === 'pending', 'legal review pending'));
  record(assert(checks, pack.privacyUrlStatus === 'placeholder', 'privacy URL placeholder'));
  record(
    assert(
      checks,
      pack.dataSafetyFormStatus === 'pending_manual_review',
      'data safety form pending manual review',
    ),
  );
  record(assert(checks, pack.fakePassGuard === true, 'fakePassGuard active'));

  for (const id of REQUIRED_SECTION_IDS) {
    record(assert(checks, pack.sections.some((s) => s.id === id), `section ${id}`));
  }

  const crashRow = pack.dataUseMatrix.find((d) => d.category === 'Crash diagnostics');
  record(
    assert(
      checks,
      crashRow?.collected === 'conditional' || crashRow?.collected === 'yes',
      'crash diagnostics conditional/yes',
    ),
  );
  record(
    assert(
      checks,
      pack.dataUseMatrix.find((d) => d.category === 'Usage analytics')?.collected ===
        'pending_manual_review' ||
        pack.dataUseMatrix.find((d) => d.category === 'Usage analytics')?.collected ===
          'conditional',
      'usage analytics pending/conditional',
    ),
  );
  record(
    assert(
      checks,
      pack.dataUseMatrix.find((d) => d.category === 'Purchase status')?.collected === 'conditional',
      'purchase status conditional',
    ),
  );
  record(
    assert(
      checks,
      pack.dataUseMatrix.find((d) => d.category === 'Local gameplay progress')?.collected === 'yes',
      'local gameplay progress local yes',
    ),
  );
  record(
    assert(
      checks,
      pack.dataUseMatrix.find((d) => d.category === 'Precise location')?.collected === 'no',
      'precise GPS no',
    ),
  );
  record(
    assert(
      checks,
      pack.dataUseMatrix.find((d) => d.category === 'Real municipality data')?.collected === 'no',
      'real municipality data no',
    ),
  );
  record(
    assert(
      checks,
      pack.dataUseMatrix.find((d) => d.category === 'Contacts')?.collected === 'no',
      'contacts no',
    ),
  );
  record(
    assert(
      checks,
      pack.dataUseMatrix.find((d) => d.category === 'Health data')?.collected === 'no',
      'health data no',
    ),
  );
  record(
    assert(
      checks,
      pack.dataUseMatrix.find((d) => d.category === 'Free-form user content')?.collected === 'no',
      'free-form personal text no',
    ),
  );

  const copyTexts = pack.sections.flatMap((s) => [
    { id: s.id, text: s.bodyTR },
    { id: s.id, text: s.bodyEN },
    { id: 'store_tr', text: pack.storeDisclosureCopyTR },
    { id: 'store_en', text: pack.storeDisclosureCopyEN },
  ]);
  const violations = scanPrivacyPolicyTextForViolations(copyTexts);
  record(
    assert(
      checks,
      violations.length === 0,
      'no false GPS/official/AI/online claims',
      violations.map((v) => `${v.fieldId}:${v.phrase}`).join('; '),
    ),
  );
  record(assert(checks, pack.copyGuardPassed, 'copy guard passed'));
  record(
    assert(
      checks,
      pack.status === 'ready_for_legal_review' || pack.status === 'draft',
      `status legal-review path (${pack.status})`,
    ),
  );

  const readiness = runPrivacyPolicyReadinessAudit({ mode: 'launch_candidate' });
  const readinessSrc = readRepo('src/core/releaseReadiness/privacyPolicyReadinessAudit.ts');
  record(
    assert(
      checks,
      readinessSrc.includes('privacyPolicyText') || readinessSrc.includes('privacyText'),
      'privacyPolicyReadiness references text pack',
    ),
  );
  record(
    assert(
      checks,
      readiness.publishedPrivacyUrlIsPlaceholder,
      'privacyPolicyReadiness URL placeholder',
    ),
  );
  record(assert(checks, readiness.legalReviewPending, 'privacyPolicyReadiness legal review pending'));

  const metadataCopy = runStoreMetadataCopyAudit();
  const finalization = runStoreMetadataFinalizationAudit({ mode: 'launch_candidate' });
  record(
    assert(
      checks,
      metadataCopy.privacyDisclosureCopyTR.length > 0,
      'storeMetadataCopy privacy disclosure present',
    ),
  );
  record(
    assert(
      checks,
      finalization.privacyUrlIsPlaceholder,
      'storeMetadataFinalization privacy URL pending',
    ),
  );

  const release = runReleaseCandidateAudit();
  record(assert(checks, release.publicLaunchDecision === 'blocked', 'public launch blocked'));
  record(
    assert(
      checks,
      release.manualBlockers.some((id) => id.includes('privacy')) ||
        finalization.blockers.some((b) => b.id.includes('privacy')),
      'release candidate privacy blocker pending',
    ),
  );

  const tracker = runManualLaunchTrackerAudit();
  record(
    assert(
      checks,
      tracker.evidenceSummary.verifiedEvidence === 0,
      'manual launch tracker verified evidence 0',
    ),
  );
  const privacyBlockerPending =
    tracker.blockerGroups.some(
      (g) => g.id === 'privacy_data_safety' && g.pendingCount > 0,
    ) ||
    tracker.blockers.some(
      (b) => b.id.includes('privacy') && b.status !== 'done',
    );
  record(
    assert(
      checks,
      privacyBlockerPending,
      'manual launch tracker privacy blockers pending',
    ),
  );

  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('privacyPolicyText'), 'no text pack in persist'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('privacyPolicyText'), 'applyDecision unchanged'));
  record(
    assert(
      checks,
      !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('privacyPolicyText'),
      'dayPipeline unchanged',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/game/generateDailyEventSet.ts').includes('privacyPolicyText'),
      'event generation unchanged',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/privacyPolicyText/index.ts').includes('expo-router'),
      'no new route in privacy text module',
    ),
  );
  record(assert(checks, existsSync(join(REPO_ROOT, PRIVACY_POLICY_TEXT_DOCS_PATH)), 'docs file exists'));
  record(
    assert(
      checks,
      PRIVACY_POLICY_TEXT_FORBIDDEN_PHRASES.length >= 15,
      'forbidden phrase list populated',
    ),
  );
  record(assert(checks, readRepo('src/store/gamePersist.ts').includes(`SAVE_VERSION = ${SAVE_VERSION}`), `SAVE_VERSION unchanged (${SAVE_VERSION})`));

  return { ok, checks };
}
