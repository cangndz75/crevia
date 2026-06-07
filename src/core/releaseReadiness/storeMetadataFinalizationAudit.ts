import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { isPrivacyPolicyUrlPlaceholder } from './storeListingReadinessAudit';
import {
  STORE_IAP_METADATA_DRAFT,
  STORE_KEYWORDS_EN,
  STORE_KEYWORDS_TR,
  STORE_METADATA_EN,
  STORE_METADATA_FALSE_CLAIM_PATTERNS,
  STORE_METADATA_FINALIZATION_DOCS_PATH,
  STORE_METADATA_TR,
} from './storeMetadataFinalizationConstants';
import type {
  CreviaStoreMetadataBlocker,
  CreviaStoreMetadataField,
  CreviaStoreMetadataFinalizationMode,
  CreviaStoreMetadataFinalizationResult,
  CreviaStoreMetadataHealthStatus,
  CreviaStoreMetadataRiskScanResult,
  CreviaStoreMetadataWarning,
  CreviaStoreReviewNoteDraft,
  RunStoreMetadataFinalizationAuditOptions,
} from './storeMetadataFinalizationTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

export function scanMetadataForFalseClaims(text: string): string[] {
  const normalized = text.toLocaleLowerCase('tr-TR');
  const hits: string[] = [];
  for (const pattern of STORE_METADATA_FALSE_CLAIM_PATTERNS) {
    if (normalized.includes(pattern.toLocaleLowerCase('tr-TR'))) {
      hits.push(pattern);
    }
  }
  return hits;
}

function scanKeywordsForbidden(
  keywords: string[],
  forbidden: string[],
): string[] {
  const hits: string[] = [];
  for (const kw of keywords) {
    const lower = kw.toLocaleLowerCase('tr-TR');
    for (const f of forbidden) {
      if (lower.includes(f.toLocaleLowerCase('tr-TR'))) {
        hits.push(`${kw} → ${f}`);
      }
    }
  }
  return hits;
}

function buildFields(): CreviaStoreMetadataField[] {
  const tr = STORE_METADATA_TR;
  const en = STORE_METADATA_EN;
  const privacyPlaceholder = isPrivacyPolicyUrlPlaceholder(tr.privacyPolicyUrl);
  const supportPlaceholder = tr.supportUrl.includes('PENDING_PLACEHOLDER');
  const emailPlaceholder = tr.contactEmail.includes('PENDING_PLACEHOLDER');
  const copyrightPlaceholder = tr.copyrightOwner.includes('PENDING');

  return [
    { key: 'appName', valueTr: tr.appName, valueEn: en.appName, required: true, status: tr.appName ? 'draft' : 'pending' },
    { key: 'subtitle', valueTr: tr.subtitle, valueEn: en.subtitle, required: true, status: 'draft' },
    { key: 'shortDescription', valueTr: tr.shortDescription, valueEn: en.shortDescription, required: true, status: 'draft' },
    { key: 'fullDescription', valueTr: tr.fullDescription.slice(0, 60), valueEn: en.fullDescription.slice(0, 60), required: true, status: 'draft' },
    { key: 'category', valueTr: tr.category, valueEn: en.category, required: true, status: 'draft' },
    { key: 'ageRatingNote', valueTr: tr.ageRatingNote, valueEn: en.ageRatingNote, required: true, status: 'draft' },
    { key: 'supportUrl', valueTr: tr.supportUrl, valueEn: en.supportUrl, required: true, status: supportPlaceholder ? 'placeholder' : 'draft' },
    { key: 'privacyPolicyUrl', valueTr: tr.privacyPolicyUrl, valueEn: en.privacyPolicyUrl, required: true, status: privacyPlaceholder ? 'placeholder' : 'draft' },
    { key: 'marketingUrl', valueTr: tr.marketingUrl || '(not set)', valueEn: en.marketingUrl || '(not set)', required: false, status: tr.marketingUrl ? 'draft' : 'pending' },
    { key: 'contactEmail', valueTr: tr.contactEmail, valueEn: en.contactEmail, required: true, status: emailPlaceholder ? 'placeholder' : 'draft' },
    { key: 'copyrightOwner', valueTr: tr.copyrightOwner, valueEn: en.copyrightOwner, required: true, status: copyrightPlaceholder ? 'placeholder' : 'draft' },
    { key: 'appReviewNotes', valueTr: tr.appReviewNotes.slice(0, 60), valueEn: en.appReviewNotes.slice(0, 60), required: true, status: 'draft' },
    { key: 'releaseNotes', valueTr: tr.releaseNotes.slice(0, 60), valueEn: en.releaseNotes.slice(0, 60), required: true, status: 'draft' },
  ];
}

function buildReviewNotesDraft(): CreviaStoreReviewNoteDraft {
  const trNotes = STORE_METADATA_TR.appReviewNotes;
  const enNotes = STORE_METADATA_EN.appReviewNotes;
  const combined = trNotes + '\n' + enNotes;
  const lower = combined.toLocaleLowerCase('tr-TR');

  return {
    sections: [
      'simulation game description',
      'no real GPS / municipality data',
      'IAP sandbox test account placeholder',
      'RevenueCat entitlement mapping',
      'Day 8+ main operation test instructions',
      'Dev/mock path internal-only note',
    ],
    containsDayEightTestNote: lower.includes('day 8') || lower.includes('gün 8'),
    containsSandboxPlaceholder: lower.includes('sandbox'),
    containsRevenueCatPlaceholder: lower.includes('revenuecat') || lower.includes('entitlement'),
  };
}

function runRiskScan(): CreviaStoreMetadataRiskScanResult {
  const allTexts = [
    STORE_METADATA_TR.shortDescription,
    STORE_METADATA_TR.fullDescription,
    STORE_METADATA_TR.subtitle,
    STORE_METADATA_TR.appReviewNotes,
    STORE_METADATA_TR.releaseNotes,
    ...STORE_METADATA_TR.featureBullets,
    STORE_METADATA_EN.shortDescription,
    STORE_METADATA_EN.fullDescription,
    STORE_METADATA_EN.subtitle,
    STORE_METADATA_EN.appReviewNotes,
    STORE_METADATA_EN.releaseNotes,
    ...STORE_METADATA_EN.featureBullets,
    STORE_IAP_METADATA_DRAFT.displayNameTr,
    STORE_IAP_METADATA_DRAFT.displayNameEn,
    STORE_IAP_METADATA_DRAFT.descriptionTr,
    STORE_IAP_METADATA_DRAFT.descriptionEn,
  ];

  const combined = allTexts.join('\n');
  const hits = scanMetadataForFalseClaims(combined);

  return {
    passed: hits.length === 0,
    scannedTexts: allTexts.length,
    hits,
  };
}

function collectBlockersAndWarnings(
  mode: CreviaStoreMetadataFinalizationMode,
  state: {
    privacyPlaceholder: boolean;
    screenshotsPending: boolean;
    riskScanPassed: boolean;
    consoleEntryPending: boolean;
    keywordForbiddenHits: string[];
  },
): { blockers: CreviaStoreMetadataBlocker[]; warnings: CreviaStoreMetadataWarning[] } {
  const blockers: CreviaStoreMetadataBlocker[] = [];
  const warnings: CreviaStoreMetadataWarning[] = [];

  if (state.privacyPlaceholder) {
    if (mode === 'launch_candidate') {
      blockers.push({
        id: 'metadata.privacy_url_placeholder',
        title: 'Privacy policy URL placeholder',
        message: 'Real hosted URL required for launch_candidate.',
      });
    } else {
      warnings.push({
        id: 'metadata.privacy_url_placeholder',
        title: 'Privacy policy URL placeholder',
        message: 'Placeholder — will block launch_candidate.',
      });
    }
  }

  if (state.screenshotsPending) {
    if (mode === 'launch_candidate') {
      blockers.push({
        id: 'metadata.screenshots_pending',
        title: 'Store screenshots pending',
        message: 'Screenshots not captured.',
      });
    } else {
      warnings.push({
        id: 'metadata.screenshots_pending',
        title: 'Store screenshots pending',
        message: 'Manual capture pending.',
      });
    }
  }

  if (!state.riskScanPassed) {
    blockers.push({
      id: 'metadata.false_claim_detected',
      title: 'Metadata false claim detected',
      message: 'Draft copy failed risk scan.',
    });
  }

  if (state.keywordForbiddenHits.length > 0) {
    warnings.push({
      id: 'metadata.keyword_forbidden_hit',
      title: 'Forbidden keyword detected',
      message: state.keywordForbiddenHits.slice(0, 3).join('; '),
    });
  }

  if (state.consoleEntryPending) {
    if (mode === 'launch_candidate') {
      blockers.push({
        id: 'metadata.console_entry_pending',
        title: 'Store console entry pending',
        message: 'Metadata not entered in App Store Connect / Play Console.',
      });
    } else if (mode === 'soft_launch_candidate') {
      blockers.push({
        id: 'metadata.console_entry_pending',
        title: 'Store console entry pending',
        message: 'Metadata not entered — blocker for soft_launch_candidate unless manually confirmed.',
      });
    } else {
      warnings.push({
        id: 'metadata.console_entry_pending',
        title: 'Store console entry pending',
        message: 'Manual console entry not done.',
      });
    }
  }

  return { blockers, warnings };
}

function buildHealth(
  mode: CreviaStoreMetadataFinalizationMode,
  blockers: CreviaStoreMetadataBlocker[],
): CreviaStoreMetadataHealthStatus {
  if (blockers.length > 0) {
    return mode === 'launch_candidate' || mode === 'soft_launch_candidate' ? 'BLOCKED' : 'WARN';
  }
  return 'WARN';
}

export function runStoreMetadataFinalizationAudit(
  options: RunStoreMetadataFinalizationAuditOptions = {},
): CreviaStoreMetadataFinalizationResult {
  const mode = options.mode ?? 'internal_device_test';

  const fields = buildFields();
  const reviewNotes = buildReviewNotesDraft();
  const riskScan = runRiskScan();

  const trForbiddenHits = scanKeywordsForbidden(
    STORE_KEYWORDS_TR.keywords,
    STORE_KEYWORDS_TR.forbiddenKeywords,
  );
  const enForbiddenHits = scanKeywordsForbidden(
    STORE_KEYWORDS_EN.keywords,
    STORE_KEYWORDS_EN.forbiddenKeywords,
  );
  const allForbiddenHits = [...trForbiddenHits, ...enForbiddenHits];

  const keywordsTr = { ...STORE_KEYWORDS_TR, forbiddenHits: trForbiddenHits };
  const keywordsEn = { ...STORE_KEYWORDS_EN, forbiddenHits: enForbiddenHits };

  const privacyUrlIsPlaceholder = isPrivacyPolicyUrlPlaceholder(
    STORE_METADATA_TR.privacyPolicyUrl,
  );

  const metadataDraftPresent =
    STORE_METADATA_TR.appName.length > 0 &&
    STORE_METADATA_TR.shortDescription.length > 20 &&
    STORE_METADATA_TR.fullDescription.length > 50 &&
    STORE_METADATA_EN.appName.length > 0 &&
    STORE_METADATA_EN.shortDescription.length > 20 &&
    STORE_METADATA_EN.fullDescription.length > 50;

  const keywordsPresent =
    STORE_KEYWORDS_TR.keywords.length >= 8 &&
    STORE_KEYWORDS_EN.keywords.length >= 8;

  const iapMetadataDraftPresent =
    STORE_IAP_METADATA_DRAFT.entitlementId.length > 0 &&
    STORE_IAP_METADATA_DRAFT.offeringId.length > 0 &&
    STORE_IAP_METADATA_DRAFT.productType.length > 0;

  const reviewNotesDraftPresent =
    reviewNotes.containsDayEightTestNote &&
    STORE_METADATA_TR.appReviewNotes.length > 50;

  const docsContent = readRepo(STORE_METADATA_FINALIZATION_DOCS_PATH);
  const docsPresent = docsContent.length > 200;

  const { blockers, warnings } = collectBlockersAndWarnings(mode, {
    privacyPlaceholder: privacyUrlIsPlaceholder,
    screenshotsPending: true,
    riskScanPassed: riskScan.passed,
    consoleEntryPending: true,
    keywordForbiddenHits: allForbiddenHits,
  });

  const health = buildHealth(mode, blockers);

  const nextActions: string[] = [];
  if (privacyUrlIsPlaceholder) {
    nextActions.push('Publish real privacy policy URL — placeholder blocks launch_candidate.');
  }
  nextActions.push('Capture store screenshots per matrix.');
  nextActions.push(
    'Apply TR/EN screenshot narrative captions: docs/crevia-store-screenshot-narrative-pack.md',
  );
  nextActions.push('Enter metadata in App Store Connect / Play Console.');
  if (STORE_IAP_METADATA_DRAFT.priceTierStatus === 'pending_manual') {
    nextActions.push('Set IAP price tier in store dashboards.');
  }
  if (!docsPresent) {
    nextActions.push(`Create ${STORE_METADATA_FINALIZATION_DOCS_PATH}`);
  }

  return {
    health,
    mode,
    metadataTr: { ...STORE_METADATA_TR },
    metadataEn: { ...STORE_METADATA_EN },
    fields,
    keywordsTr,
    keywordsEn,
    iapMetadata: { ...STORE_IAP_METADATA_DRAFT },
    reviewNotes,
    releaseNotesDraft: STORE_METADATA_TR.releaseNotes,
    riskScan,
    blockers,
    warnings,
    metadataDraftPresent,
    keywordsPresent,
    iapMetadataDraftPresent,
    reviewNotesDraftPresent,
    privacyUrlIsPlaceholder,
    screenshotsPending: true,
    consoleEntryPending: true,
    nextActions,
  };
}

export function assertStoreMetadataFinalizationIntegrity(): { ok: boolean; message: string } {
  if (STORE_METADATA_TR.featureBullets.length < 5) {
    return { ok: false, message: 'TR feature bullets below 5' };
  }
  if (STORE_METADATA_EN.featureBullets.length < 5) {
    return { ok: false, message: 'EN feature bullets below 5' };
  }
  if (STORE_KEYWORDS_TR.keywords.length < 8) {
    return { ok: false, message: 'TR keyword set below 8' };
  }
  if (STORE_KEYWORDS_EN.keywords.length < 8) {
    return { ok: false, message: 'EN keyword set below 8' };
  }
  if (!STORE_IAP_METADATA_DRAFT.entitlementId) {
    return { ok: false, message: 'IAP entitlement id missing' };
  }
  const docsContent = readRepo(STORE_METADATA_FINALIZATION_DOCS_PATH);
  if (docsContent.length < 200) {
    return { ok: false, message: 'Metadata finalization docs missing or too short' };
  }
  return { ok: true, message: 'OK' };
}
