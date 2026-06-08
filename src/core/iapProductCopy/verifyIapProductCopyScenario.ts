import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildIapManualSetupTracker } from '@/core/iapQa/iapManualSetupTrackerAudit';
import { runIapSandboxQaAudit } from '@/core/iapQa/iapSandboxQaAudit';
import { runManualLaunchTrackerAudit } from '@/core/manualLaunchTracker/manualLaunchTrackerAudit';
import { runReleaseCandidateAudit } from '@/core/releaseCandidate/releaseCandidateAudit';
import { runStoreMetadataFinalizationAudit } from '@/core/releaseReadiness/storeMetadataFinalizationAudit';
import { runStoreMetadataCopyAudit } from '@/core/storeMetadataCopy';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  IAP_PRODUCT_COPY_DOCS_PATH,
  IAP_PRODUCT_COPY_FALSE_PRESSURE_PHRASES,
  IAP_PRODUCT_COPY_MIN_BENEFIT_BULLETS,
  IAP_PRODUCT_COPY_REVIEW_NOTES,
} from './iapProductCopyConstants';
import {
  assertIapProductCopyIntegrity,
  runIapProductCopyAudit,
  scanIapProductCopyForFalsePressure,
} from './iapProductCopyAudit';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

export type VerifyIapProductCopyOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail = pass): boolean {
  checks.push(`${ok ? 'PASS' : 'FAIL'} ${ok ? pass : fail}`);
  return ok;
}

export function verifyIapProductCopyScenario(): VerifyIapProductCopyOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  const pack = runIapProductCopyAudit();
  const integrity = assertIapProductCopyIntegrity();

  record(assert(checks, integrity.ok, `integrity: ${integrity.message}`));
  record(assert(checks, pack.packId.length > 0, 'IapProductCopyPack produced'));
  record(
    assert(
      checks,
      pack.productCopyItems.some((i) => i.locale === 'tr' && i.target === 'app_store_product_name'),
      'TR product name alternatives',
    ),
  );
  record(
    assert(
      checks,
      pack.productCopyItems.some((i) => i.locale === 'en' && i.target === 'app_store_product_name'),
      'EN product name alternatives',
    ),
  );
  record(
    assert(
      checks,
      pack.productCopyItems.some((i) => i.target === 'app_store_product_description' && i.locale === 'tr'),
      'TR product descriptions',
    ),
  );
  record(
    assert(
      checks,
      pack.productCopyItems.some((i) => i.target === 'play_product_description' && i.locale === 'en'),
      'EN product descriptions',
    ),
  );
  record(assert(checks, pack.offerScreenCopy.titleOptionsTR.length >= 2, 'offer title TR'));
  record(assert(checks, pack.offerScreenCopy.titleOptionsEN.length >= 2, 'offer title EN'));
  record(assert(checks, pack.offerScreenCopy.subtitleTR.length > 10, 'offer subtitle TR'));
  record(assert(checks, pack.offerScreenCopy.subtitleEN.length > 10, 'offer subtitle EN'));
  record(
    assert(
      checks,
      pack.productCopyItems.filter((i) => i.target === 'benefit_bullet' && i.locale === 'tr').length >=
        IAP_PRODUCT_COPY_MIN_BENEFIT_BULLETS,
      `benefit bullets TR >= ${IAP_PRODUCT_COPY_MIN_BENEFIT_BULLETS}`,
    ),
  );
  record(
    assert(
      checks,
      pack.productCopyItems.filter((i) => i.target === 'benefit_bullet' && i.locale === 'en').length >=
        IAP_PRODUCT_COPY_MIN_BENEFIT_BULLETS,
      `benefit bullets EN >= ${IAP_PRODUCT_COPY_MIN_BENEFIT_BULLETS}`,
    ),
  );
  record(assert(checks, pack.restoreCopy.ctaTR.length > 0, 'restore copy TR'));
  record(assert(checks, pack.restoreCopy.ctaEN.length > 0, 'restore copy EN'));
  record(
    assert(
      checks,
      pack.purchaseStateCopy.successTR.length >= 1 && pack.purchaseStateCopy.successEN.length >= 1,
      'purchase success copy TR/EN',
    ),
  );
  record(
    assert(
      checks,
      pack.purchaseStateCopy.cancelledTR.length >= 1 && pack.purchaseStateCopy.cancelledEN.length >= 1,
      'purchase cancelled copy TR/EN',
    ),
  );
  record(
    assert(
      checks,
      pack.purchaseStateCopy.failedTR.length >= 1 && pack.purchaseStateCopy.failedEN.length >= 1,
      'purchase failed copy TR/EN',
    ),
  );
  record(assert(checks, pack.reviewNotes.tr.length > 50, 'review notes TR'));
  record(assert(checks, pack.reviewNotes.en.length > 50, 'review notes EN'));
  record(assert(checks, pack.reviewNotes.tr.includes('PENDING'), 'manual placeholders in review notes TR'));
  record(assert(checks, pack.reviewNotes.en.includes('PENDING'), 'manual placeholders in review notes EN'));

  const allCopy = pack.productCopyItems.map((i) => ({ id: i.id, text: i.text }));
  const pressureHits = scanIapProductCopyForFalsePressure(allCopy);
  record(
    assert(
      checks,
      pressureHits.length === 0,
      'no FOMO/dark pattern phrases',
      pressureHits.map((h) => `${h.fieldId}:${h.phrase}`).join('; '),
    ),
  );
  record(assert(checks, pack.copyGuardPassed, 'copy guard passed'));

  const combined = allCopy.map((c) => c.text).join('\n');
  record(assert(checks, !/\$\d+|\d+\s*TL|price tier/i.test(combined), 'no invented prices'));
  record(
    assert(
      checks,
      !combined.includes('crevia.main_operation') && !combined.includes('main_operation_full_access'),
      'no hardcoded product/entitlement IDs in player copy',
    ),
  );
  record(
    assert(
      checks,
      !/sandbox@test|password123|reviewer@/i.test(combined),
      'no fabricated sandbox credentials',
    ),
  );
  record(
    assert(
      checks,
      pack.restoreCopy.ctaTR.length > 0 && pack.restoreCopy.helperEN.length > 0,
      'restore visible in copy pack',
    ),
  );
  record(
    assert(
      checks,
      pack.reviewNotes.en.toLowerCase().includes('apple') || pack.reviewNotes.en.toLowerCase().includes('google'),
      'payment handled by Apple/Google copy',
    ),
  );
  record(
    assert(
      checks,
      pack.reviewNotes.en.toLowerCase().includes('revenuecat'),
      'RevenueCat entitlement copy in review notes',
    ),
  );

  record(assert(checks, pack.productSetupPending === true, 'product setup pending'));
  record(assert(checks, pack.sandboxPending === true, 'sandbox pending'));
  record(assert(checks, pack.restoreTestPending === true, 'restore test pending'));
  record(assert(checks, pack.fakePassGuard === true, 'fakePassGuard active'));
  record(
    assert(
      checks,
      pack.status === 'ready_for_dashboard_entry' || pack.status === 'draft',
      `status dashboard-ready (${pack.status})`,
    ),
  );

  const manualSetup = buildIapManualSetupTracker();
  const manualSetupSrc = readRepo('src/core/iapQa/iapManualSetupTrackerAudit.ts');
  record(
    assert(
      checks,
      manualSetupSrc.includes('iapProductCopy') || manualSetupSrc.includes('productCopy'),
      'iapManualSetupTracker references product copy pack',
    ),
  );
  record(assert(checks, manualSetup.storeProductsPending, 'iapManualSetupTracker store products pending'));

  const sandbox = runIapSandboxQaAudit();
  record(assert(checks, sandbox.blockerCount > 0 || sandbox.health !== 'PASS', 'iapSandboxQa still blocked/pending'));

  const metadataFinalization = runStoreMetadataFinalizationAudit({ mode: 'launch_candidate' });
  record(
    assert(
      checks,
      metadataFinalization.nextActions.some((a) => a.includes('iap') || a.includes('IAP')) ||
        readRepo('src/core/releaseReadiness/storeMetadataFinalizationAudit.ts').includes('iapProductCopy'),
      'storeMetadataFinalization IAP copy docs path',
    ),
  );

  const metadataCopy = runStoreMetadataCopyAudit();
  record(assert(checks, metadataCopy.iapCopyGuidance.toneTr.length > 0, 'storeMetadataCopy IAP guidance aligned'));

  const release = runReleaseCandidateAudit();
  record(assert(checks, release.publicLaunchDecision === 'blocked', 'public launch blocked'));
  record(
    assert(
      checks,
      release.manualBlockers.some((id) => id.includes('iap') || id.includes('revenuecat') || id.includes('product')),
      'release candidate IAP setup blocked',
    ),
  );

  const tracker = runManualLaunchTrackerAudit();
  record(assert(checks, tracker.evidenceSummary.verifiedEvidence === 0, 'verified evidence 0'));
  record(
    assert(
      checks,
      tracker.blockerGroups.some((g) => g.id === 'iap_revenuecat' && g.pendingCount > 0),
      'manual launch tracker IAP blockers pending',
    ),
  );

  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('iapProductCopy'), 'no copy in persist'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('iapProductCopy'), 'applyDecision unchanged'));
  record(
    assert(
      checks,
      !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('iapProductCopy'),
      'dayPipeline unchanged',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/game/generateDailyEventSet.ts').includes('iapProductCopy'),
      'event generation unchanged',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/iapProductCopy/index.ts').includes('expo-router'),
      'no new route in IAP copy module',
    ),
  );
  record(assert(checks, existsSync(join(REPO_ROOT, IAP_PRODUCT_COPY_DOCS_PATH)), 'docs file exists'));
  record(
    assert(
      checks,
      IAP_PRODUCT_COPY_FALSE_PRESSURE_PHRASES.length >= 15,
      'false pressure phrase list populated',
    ),
  );
  record(
    assert(
      checks,
      !IAP_PRODUCT_COPY_REVIEW_NOTES.tr.includes('sandbox@test'),
      'no fake sandbox account in review notes',
    ),
  );
  record(assert(checks, readRepo('src/store/gamePersist.ts').includes(`SAVE_VERSION = ${SAVE_VERSION}`), `SAVE_VERSION unchanged (${SAVE_VERSION})`));

  return { ok, checks };
}
