import {
  PRIVACY_POLICY_TEXT_DATA_SAFETY_MATRIX,
  PRIVACY_POLICY_TEXT_DOCS_PATH,
  PRIVACY_POLICY_TEXT_FORBIDDEN_PHRASES,
  PRIVACY_POLICY_TEXT_MANUAL_REVIEW_ITEMS,
  PRIVACY_POLICY_TEXT_PACK_ID,
  PRIVACY_POLICY_TEXT_PUBLISHED_URL_PLACEHOLDER,
  PRIVACY_POLICY_TEXT_SDK_DISCLOSURE_MATRIX,
  PRIVACY_POLICY_TEXT_SECTIONS,
  PRIVACY_POLICY_TEXT_STORE_DATA_SAFETY_CHECKLIST,
  PRIVACY_POLICY_TEXT_STORE_DISCLOSURE_EN,
  PRIVACY_POLICY_TEXT_STORE_DISCLOSURE_TR,
} from './privacyPolicyTextConstants';
import type {
  PrivacyPolicyTextAuditResult,
  PrivacyPolicyTextBlocker,
  PrivacyPolicyTextFalseClaimFinding,
  PrivacyPolicyTextPackStatus,
} from './privacyPolicyTextTypes';

function normalize(text: string): string {
  return text.toLocaleLowerCase('tr-TR');
}

function matchesForbidden(text: string): string | undefined {
  const normalized = normalize(text);
  return PRIVACY_POLICY_TEXT_FORBIDDEN_PHRASES.find((phrase) =>
    normalized.includes(normalize(phrase)),
  );
}

export function scanPrivacyPolicyTextForViolations(
  items: Array<{ id: string; text: string }>,
): PrivacyPolicyTextFalseClaimFinding[] {
  const findings: PrivacyPolicyTextFalseClaimFinding[] = [];
  for (const { id, text } of items) {
    const hit = matchesForbidden(text);
    if (hit) findings.push({ phrase: hit, fieldId: id, severity: 'blocker' });
  }
  return findings;
}

function collectCopyTexts(): Array<{ id: string; text: string }> {
  const texts: Array<{ id: string; text: string }> = [];
  for (const section of PRIVACY_POLICY_TEXT_SECTIONS) {
    texts.push({ id: section.id, text: section.bodyTR });
    texts.push({ id: section.id, text: section.bodyEN });
  }
  texts.push({ id: 'store_disclosure_tr', text: PRIVACY_POLICY_TEXT_STORE_DISCLOSURE_TR });
  texts.push({ id: 'store_disclosure_en', text: PRIVACY_POLICY_TEXT_STORE_DISCLOSURE_EN });
  return texts;
}

function resolveStatus(
  copyGuardPassed: boolean,
  privacyUrlPlaceholder: boolean,
): PrivacyPolicyTextPackStatus {
  if (!copyGuardPassed) return 'draft';
  if (privacyUrlPlaceholder) return 'ready_for_legal_review';
  return 'blocked_by_missing_privacy_url';
}

function buildBlockers(
  copyGuardPassed: boolean,
  privacyUrlPlaceholder: boolean,
  falseClaimFindings: PrivacyPolicyTextFalseClaimFinding[],
): PrivacyPolicyTextBlocker[] {
  const blockers: PrivacyPolicyTextBlocker[] = [];

  if (privacyUrlPlaceholder) {
    blockers.push({
      id: 'privacy.url_placeholder',
      title: 'Privacy policy URL not published',
      message: `Placeholder URL remains: ${PRIVACY_POLICY_TEXT_PUBLISHED_URL_PLACEHOLDER}`,
    });
  }

  blockers.push({
    id: 'privacy.data_safety_manual_review',
    title: 'Store data safety forms pending',
    message: 'Apple App Privacy and Google Play Data Safety require manual completion.',
  });

  blockers.push({
    id: 'privacy.legal_review_pending',
    title: 'Legal review pending',
    message: 'Final privacy policy legal review required before public launch.',
  });

  if (!copyGuardPassed) {
    blockers.push({
      id: 'privacy.copy_false_claim',
      title: 'Privacy text false claim detected',
      message: `${falseClaimFindings.length} forbidden or mismatched phrase(s) in policy text.`,
    });
  }

  return blockers;
}

export function runPrivacyPolicyTextAudit(): PrivacyPolicyTextAuditResult {
  const falseClaimFindings = scanPrivacyPolicyTextForViolations(collectCopyTexts());
  const copyGuardPassed = falseClaimFindings.length === 0;
  const privacyUrlPlaceholder = true;
  const status = resolveStatus(copyGuardPassed, privacyUrlPlaceholder);
  const blockerSummary = buildBlockers(copyGuardPassed, privacyUrlPlaceholder, falseClaimFindings);

  const nextActions: string[] = [
    `Review privacy text pack: ${PRIVACY_POLICY_TEXT_DOCS_PATH}`,
    'Complete legal review before publishing hosted privacy URL.',
    'Manually complete Apple App Privacy and Google Play Data Safety forms.',
    'Confirm Sentry, analytics, and RevenueCat disclosures match live SDK config.',
    'Publish real privacy URL — do not mark blocker done without evidence.',
    'Keep data safety final review pending until console forms are manually verified.',
  ];

  if (!copyGuardPassed) {
    nextActions.unshift('Fix forbidden phrases in privacy policy text pack.');
  }

  return {
    packId: PRIVACY_POLICY_TEXT_PACK_ID,
    status,
    localeCoverage: 'tr_en',
    sections: PRIVACY_POLICY_TEXT_SECTIONS.map((s) => ({ ...s })),
    dataUseMatrix: PRIVACY_POLICY_TEXT_DATA_SAFETY_MATRIX.map((d) => ({ ...d })),
    sdkDisclosureMatrix: PRIVACY_POLICY_TEXT_SDK_DISCLOSURE_MATRIX.map((s) => ({ ...s })),
    storeDataSafetyChecklist: [...PRIVACY_POLICY_TEXT_STORE_DATA_SAFETY_CHECKLIST],
    storeDisclosureCopyTR: PRIVACY_POLICY_TEXT_STORE_DISCLOSURE_TR,
    storeDisclosureCopyEN: PRIVACY_POLICY_TEXT_STORE_DISCLOSURE_EN,
    falseClaimFindings,
    manualReviewItems: PRIVACY_POLICY_TEXT_MANUAL_REVIEW_ITEMS.map((m) => ({ ...m })),
    copyGuardPassed,
    privacyUrlStatus: 'placeholder',
    legalReviewStatus: 'pending',
    dataSafetyFormStatus: 'pending_manual_review',
    blockerSummary,
    nextActions,
    fakePassGuard: true,
    docsPath: PRIVACY_POLICY_TEXT_DOCS_PATH,
  };
}

export function assertPrivacyPolicyTextIntegrity(): { ok: boolean; message: string } {
  if (PRIVACY_POLICY_TEXT_SECTIONS.length < 10) {
    return { ok: false, message: 'Privacy sections below minimum' };
  }
  if (PRIVACY_POLICY_TEXT_DATA_SAFETY_MATRIX.length < 15) {
    return { ok: false, message: 'Data safety matrix incomplete' };
  }
  if (PRIVACY_POLICY_TEXT_SDK_DISCLOSURE_MATRIX.length < 4) {
    return { ok: false, message: 'SDK disclosure matrix incomplete' };
  }
  if (PRIVACY_POLICY_TEXT_MANUAL_REVIEW_ITEMS.length < 6) {
    return { ok: false, message: 'Manual review items incomplete' };
  }
  const requiredSectionIds = [
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
  ];
  for (const id of requiredSectionIds) {
    if (!PRIVACY_POLICY_TEXT_SECTIONS.some((s) => s.id === id)) {
      return { ok: false, message: `Missing section: ${id}` };
    }
  }
  return { ok: true, message: 'OK' };
}

export function buildPrivacyPolicyTextSummary(result: PrivacyPolicyTextAuditResult): string {
  return [
    `Pack: ${result.packId}`,
    `Status: ${result.status}`,
    `Copy guard: ${result.copyGuardPassed ? 'PASS' : 'FAIL'}`,
    `Privacy URL: ${result.privacyUrlStatus}`,
    `Legal review: ${result.legalReviewStatus}`,
    `Data safety: ${result.dataSafetyFormStatus}`,
    `Sections: ${result.sections.length}`,
    `Docs: ${result.docsPath}`,
  ].join(' | ');
}
