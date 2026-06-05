import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { isPrivacyPolicyUrlPlaceholder } from './storeListingReadinessAudit';
import { STORE_LISTING_PRIVACY_POLICY_PLACEHOLDER } from './storeListingReadinessConstants';
import {
  APP_STORE_PRIVACY_ANSWER_DRAFTS,
  DATA_SAFETY_DRAFT_DOCS_PATH,
  GOOGLE_PLAY_DATA_SAFETY_ANSWER_DRAFTS,
  PRIVACY_DATA_CATEGORY_MATRIX,
  PRIVACY_POLICY_DRAFT_DOCS_PATH,
  PRIVACY_POLICY_MIN_DATA_CATEGORIES,
  PRIVACY_POLICY_PUBLISHED_URL_PLACEHOLDER,
  PRIVACY_POLICY_RISKY_WORDING_PATTERNS,
  PRIVACY_POLICY_SECTIONS,
  PRIVACY_THIRD_PARTY_PROCESSORS,
} from './privacyPolicyReadinessConstants';
import type {
  CreviaPrivacyPolicyBlocker,
  CreviaPrivacyPolicyHealthStatus,
  CreviaPrivacyPolicyReadinessMode,
  CreviaPrivacyPolicyReadinessResult,
  CreviaPrivacyPolicyWarning,
  RunPrivacyPolicyReadinessAuditOptions,
} from './privacyPolicyReadinessTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

export function scanPrivacyRiskyWording(text: string): string | undefined {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return PRIVACY_POLICY_RISKY_WORDING_PATTERNS.find((p) =>
    normalized.includes(p.toLocaleLowerCase('tr-TR')),
  );
}

function docsContainSections(docs: string, sectionIds: string[]): boolean {
  const lower = docs.toLocaleLowerCase('tr-TR');
  return sectionIds.every((id) => {
    const section = PRIVACY_POLICY_SECTIONS.find((s) => s.id === id);
    if (!section) return false;
    return (
      lower.includes(section.titleTr.toLocaleLowerCase('tr-TR')) ||
      lower.includes(section.titleEn.toLocaleLowerCase('tr-TR'))
    );
  });
}

function collectBlockersAndWarnings(
  mode: CreviaPrivacyPolicyReadinessMode,
  state: {
    privacyDraftPresent: boolean;
    dataSafetyDraftPresent: boolean;
    publishedUrlPlaceholder: boolean;
    appStoreComplete: boolean;
    googlePlayComplete: boolean;
    riskyScanPassed: boolean;
    thirdPartyPending: boolean;
  },
): { blockers: CreviaPrivacyPolicyBlocker[]; warnings: CreviaPrivacyPolicyWarning[] } {
  const blockers: CreviaPrivacyPolicyBlocker[] = [];
  const warnings: CreviaPrivacyPolicyWarning[] = [];

  const pushIssue = (id: string, title: string, message: string, launchBlocker: boolean) => {
    if (
      (mode === 'launch_candidate' || mode === 'soft_launch_candidate') &&
      launchBlocker
    ) {
      blockers.push({ id, title, message });
    } else {
      warnings.push({ id, title, message });
    }
  };

  if (!state.privacyDraftPresent) {
    pushIssue(
      'privacy.draft_missing',
      'Privacy policy draft missing',
      PRIVACY_POLICY_DRAFT_DOCS_PATH,
      mode === 'soft_launch_candidate',
    );
  }

  if (!state.dataSafetyDraftPresent) {
    pushIssue(
      'privacy.data_safety_draft_missing',
      'Data safety draft missing',
      DATA_SAFETY_DRAFT_DOCS_PATH,
      mode === 'soft_launch_candidate',
    );
  }

  if (state.publishedUrlPlaceholder) {
    pushIssue(
      'privacy.published_url_placeholder',
      'Published privacy policy URL missing',
      `Placeholder: ${PRIVACY_POLICY_PUBLISHED_URL_PLACEHOLDER}`,
      true,
    );
  }

  if (!state.appStoreComplete) {
    pushIssue(
      'privacy.app_store_draft_incomplete',
      'App Store privacy answers draft incomplete',
      'Manual confirmation items remain.',
      mode === 'launch_candidate' || mode === 'soft_launch_candidate',
    );
  }

  if (!state.googlePlayComplete) {
    pushIssue(
      'privacy.google_play_draft_incomplete',
      'Google Play data safety draft incomplete',
      'Manual confirmation items remain.',
      mode === 'launch_candidate' || mode === 'soft_launch_candidate',
    );
  }

  if (!state.riskyScanPassed) {
    pushIssue(
      'privacy.risky_wording_detected',
      'Privacy copy risky wording detected',
      'Draft contains absolute or false compliance claims.',
      mode === 'launch_candidate',
    );
  }

  if (state.thirdPartyPending) {
    warnings.push({
      id: 'privacy.third_party_sdk_pending',
      title: 'Third-party SDK confirmation pending',
      message: 'RevenueCat, analytics, and crash SDK behavior need manual confirmation.',
    });
  }

  warnings.push({
    id: 'privacy.legal_review_pending',
    title: 'Legal review pending',
    message: 'This draft is not legal advice; KVKK/GDPR counsel review required before publication.',
  });

  return { blockers, warnings };
}

function buildHealth(
  mode: CreviaPrivacyPolicyReadinessMode,
  blockers: CreviaPrivacyPolicyBlocker[],
): CreviaPrivacyPolicyHealthStatus {
  if ((mode === 'launch_candidate' || mode === 'soft_launch_candidate') && blockers.length > 0) {
    return 'BLOCKED';
  }
  return 'WARN';
}

export function runPrivacyPolicyReadinessAudit(
  options: RunPrivacyPolicyReadinessAuditOptions = {},
): CreviaPrivacyPolicyReadinessResult {
  const mode = options.mode ?? 'internal_device_test';

  const privacyDraftDocs = readRepo(PRIVACY_POLICY_DRAFT_DOCS_PATH);
  const dataSafetyDraftDocs = readRepo(DATA_SAFETY_DRAFT_DOCS_PATH);
  const privacyDraftDocsPresent = privacyDraftDocs.length > 200;
  const dataSafetyDraftDocsPresent = dataSafetyDraftDocs.length > 200;

  const requiredSectionIds: Array<(typeof PRIVACY_POLICY_SECTIONS)[number]['id']> = [
    'introduction',
    'data_we_collect',
    'data_we_do_not_collect',
    'analytics_data',
    'purchase_payment_data',
    'crash_logging_data',
    'children_privacy',
    'user_rights_contact',
    'contact_support',
  ];

  const sectionsComplete =
    privacyDraftDocsPresent && docsContainSections(privacyDraftDocs, requiredSectionIds);

  const appStoreAnswers = APP_STORE_PRIVACY_ANSWER_DRAFTS.map((a) => ({ ...a }));
  const googlePlayAnswers = GOOGLE_PLAY_DATA_SAFETY_ANSWER_DRAFTS.map((a) => ({ ...a }));

  const appStoreDraftComplete =
    appStoreAnswers.length >= 5 &&
    appStoreAnswers.every((a) => a.dataCategory.length > 0) &&
    sectionsComplete;

  const googlePlayDraftComplete =
    googlePlayAnswers.length >= 6 &&
    googlePlayAnswers.every((a) => a.dataType.length > 0) &&
    dataSafetyDraftDocsPresent;

  const publishedPrivacyUrlIsPlaceholder = isPrivacyPolicyUrlPlaceholder(
    STORE_LISTING_PRIVACY_POLICY_PLACEHOLDER,
  );

  const scanText = [
    privacyDraftDocs,
    ...PRIVACY_POLICY_SECTIONS.map((s) => s.summaryTr + s.summaryEn),
  ].join('\n');
  const riskyWordingScanPassed = !scanPrivacyRiskyWording(scanText);

  const thirdPartyConfirmationPending = PRIVACY_THIRD_PARTY_PROCESSORS.some(
    (p) => p.status === 'pending',
  );

  const { blockers, warnings } = collectBlockersAndWarnings(mode, {
    privacyDraftPresent: privacyDraftDocsPresent && sectionsComplete,
    dataSafetyDraftPresent: dataSafetyDraftDocsPresent,
    publishedUrlPlaceholder: publishedPrivacyUrlIsPlaceholder,
    appStoreComplete: appStoreDraftComplete,
    googlePlayComplete: googlePlayDraftComplete,
    riskyScanPassed: riskyWordingScanPassed,
    thirdPartyPending: thirdPartyConfirmationPending,
  });

  const health = buildHealth(mode, blockers);

  const nextActions: string[] = [
    'Review drafts with legal counsel before publication.',
    PRIVACY_POLICY_DRAFT_DOCS_PATH,
    DATA_SAFETY_DRAFT_DOCS_PATH,
  ];
  if (publishedPrivacyUrlIsPlaceholder) {
    nextActions.push('Publish hosted privacy policy URL — placeholder blocks launch_candidate.');
  }
  if (thirdPartyConfirmationPending) {
    nextActions.push('Confirm RevenueCat + analytics SDK data processing after sandbox smoke.');
  }

  return {
    health,
    mode,
    sections: PRIVACY_POLICY_SECTIONS.map((s) => ({ ...s })),
    dataCategories: PRIVACY_DATA_CATEGORY_MATRIX.map((c) => ({ ...c })),
    thirdPartyProcessors: PRIVACY_THIRD_PARTY_PROCESSORS.map((p) => ({ ...p })),
    appStoreAnswers,
    googlePlayAnswers,
    blockers,
    warnings,
    privacyDraftDocsPresent: privacyDraftDocsPresent && sectionsComplete,
    dataSafetyDraftDocsPresent,
    publishedPrivacyUrlIsPlaceholder,
    appStoreDraftComplete,
    googlePlayDraftComplete,
    riskyWordingScanPassed,
    thirdPartyConfirmationPending,
    legalReviewPending: true,
    nextActions,
  };
}

export function assertPrivacyPolicyReadinessIntegrity(): { ok: boolean; message: string } {
  if (PRIVACY_DATA_CATEGORY_MATRIX.length < PRIVACY_POLICY_MIN_DATA_CATEGORIES) {
    return { ok: false, message: 'Data category matrix below minimum' };
  }
  if (PRIVACY_THIRD_PARTY_PROCESSORS.length < 5) {
    return { ok: false, message: 'Third-party processor matrix too small' };
  }
  if (!existsSync(join(REPO_ROOT, PRIVACY_POLICY_DRAFT_DOCS_PATH))) {
    return { ok: false, message: 'Privacy policy draft docs missing' };
  }
  if (!existsSync(join(REPO_ROOT, DATA_SAFETY_DRAFT_DOCS_PATH))) {
    return { ok: false, message: 'Data safety draft docs missing' };
  }
  return { ok: true, message: 'OK' };
}
