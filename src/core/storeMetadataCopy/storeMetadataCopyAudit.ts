import {
  STORE_METADATA_COPY_DOCS_PATH,
  STORE_METADATA_COPY_FEATURE_BULLETS_EN,
  STORE_METADATA_COPY_FEATURE_BULLETS_TR,
  STORE_METADATA_COPY_FORBIDDEN_PHRASES,
  STORE_METADATA_COPY_ITEMS_TEMPLATE,
  STORE_METADATA_COPY_KEYWORD_PHRASES_EN,
  STORE_METADATA_COPY_KEYWORD_PHRASES_TR,
  STORE_METADATA_COPY_LONG_DESCRIPTION_EN,
  STORE_METADATA_COPY_LONG_DESCRIPTION_TR,
  STORE_METADATA_COPY_MIN_FEATURE_BULLETS,
  STORE_METADATA_COPY_MIN_KEYWORD_PHRASES,
  STORE_METADATA_COPY_NARRATIVE_DOCS_PATH,
  STORE_METADATA_COPY_PACK_ID,
  STORE_METADATA_COPY_POSITIONING_EN,
  STORE_METADATA_COPY_POSITIONING_TR,
  STORE_METADATA_COPY_PRIVACY_DISCLOSURE_EN,
  STORE_METADATA_COPY_PRIVACY_DISCLOSURE_TR,
  STORE_METADATA_COPY_RELEASE_NOTES_EN,
  STORE_METADATA_COPY_RELEASE_NOTES_TR,
  STORE_METADATA_COPY_REVIEW_NOTES_EN,
  STORE_METADATA_COPY_REVIEW_NOTES_TR,
  STORE_METADATA_COPY_APP_NAME_OPTIONS,
  STORE_METADATA_COPY_IAP_GUIDANCE,
  STORE_METADATA_COPY_MANUAL_LIMIT_CHECKS,
  STORE_METADATA_COPY_SHORT_DESCRIPTION_OPTIONS_EN,
  STORE_METADATA_COPY_SHORT_DESCRIPTION_OPTIONS_TR,
  STORE_METADATA_COPY_SUBTITLE_OPTIONS_EN,
  STORE_METADATA_COPY_SUBTITLE_OPTIONS_TR,
} from './storeMetadataCopyConstants';
import type {
  StoreMetadataCopyAuditResult,
  StoreMetadataCopyBlocker,
  StoreMetadataCopyFalseClaimFinding,
  StoreMetadataCopyItem,
  StoreMetadataCopyPackStatus,
} from './storeMetadataCopyTypes';

function normalize(text: string): string {
  return text.toLocaleLowerCase('tr-TR');
}

function matchesForbidden(text: string): string | undefined {
  const normalized = normalize(text);
  return STORE_METADATA_COPY_FORBIDDEN_PHRASES.find((phrase) =>
    normalized.includes(normalize(phrase)),
  );
}

export function scanMetadataCopyForFalseClaims(
  items: Array<{ id: string; text: string }>,
): StoreMetadataCopyFalseClaimFinding[] {
  const findings: StoreMetadataCopyFalseClaimFinding[] = [];
  for (const { id, text } of items) {
    const hit = matchesForbidden(text);
    if (hit) {
      findings.push({ phrase: hit, fieldId: id, severity: 'blocker' });
    }
  }
  return findings;
}

function buildItems(): StoreMetadataCopyItem[] {
  return STORE_METADATA_COPY_ITEMS_TEMPLATE.map((t) => ({
    ...t,
    status: 'ready_for_review' as const,
  }));
}

function collectCopyTexts(items: StoreMetadataCopyItem[]): Array<{ id: string; text: string }> {
  return items.map((item) => ({ id: item.id, text: item.text }));
}

function resolveStatus(
  copyGuardPassed: boolean,
  consoleEntryPending: true,
): StoreMetadataCopyPackStatus {
  if (!copyGuardPassed) return 'draft';
  if (consoleEntryPending) return 'ready_for_console_entry';
  return 'blocked_by_manual_store_entry';
}

function buildBlockers(
  copyGuardPassed: boolean,
  falseClaimFindings: StoreMetadataCopyFalseClaimFinding[],
): StoreMetadataCopyBlocker[] {
  const blockers: StoreMetadataCopyBlocker[] = [];

  blockers.push({
    id: 'metadata.console_entry_pending',
    title: 'Store console entry pending',
    message: 'Metadata copy pack is draft-ready — manual ASC / Play Console entry not done.',
  });

  if (!copyGuardPassed) {
    blockers.push({
      id: 'metadata.copy_false_claim',
      title: 'Metadata copy false claim detected',
      message: `${falseClaimFindings.length} forbidden phrase(s) in copy pack.`,
    });
  }

  return blockers;
}

export function runStoreMetadataCopyAudit(): StoreMetadataCopyAuditResult {
  const items = buildItems();
  const falseClaimFindings = scanMetadataCopyForFalseClaims(collectCopyTexts(items));
  const copyGuardPassed = falseClaimFindings.length === 0;
  const consoleEntryPending = true as const;
  const status = resolveStatus(copyGuardPassed, consoleEntryPending);
  const blockerSummary = buildBlockers(copyGuardPassed, falseClaimFindings);

  const nextActions: string[] = [
    `Review metadata copy pack: ${STORE_METADATA_COPY_DOCS_PATH}`,
    `Align store screenshots with narrative pack: ${STORE_METADATA_COPY_NARRATIVE_DOCS_PATH}`,
    'Manual check ASC / Play field limits before console paste.',
    'Enter TR/EN metadata in App Store Connect / Play Console — do not mark done without evidence.',
    'Publish real privacy policy URL before launch_candidate.',
    'Keep sandbox test account placeholder until real credentials exist.',
  ];

  if (!copyGuardPassed) {
    nextActions.unshift('Fix forbidden phrases in metadata copy pack.');
  }

  return {
    packId: STORE_METADATA_COPY_PACK_ID,
    status,
    localeCoverage: 'tr_en',
    targetStores: 'both',
    appNameOptions: [...STORE_METADATA_COPY_APP_NAME_OPTIONS],
    subtitleOptionsTR: [...STORE_METADATA_COPY_SUBTITLE_OPTIONS_TR],
    subtitleOptionsEN: [...STORE_METADATA_COPY_SUBTITLE_OPTIONS_EN],
    shortDescriptionOptionsTR: [...STORE_METADATA_COPY_SHORT_DESCRIPTION_OPTIONS_TR],
    shortDescriptionOptionsEN: [...STORE_METADATA_COPY_SHORT_DESCRIPTION_OPTIONS_EN],
    longDescriptionTR: STORE_METADATA_COPY_LONG_DESCRIPTION_TR,
    longDescriptionEN: STORE_METADATA_COPY_LONG_DESCRIPTION_EN,
    featureBulletsTR: [...STORE_METADATA_COPY_FEATURE_BULLETS_TR],
    featureBulletsEN: [...STORE_METADATA_COPY_FEATURE_BULLETS_EN],
    keywordPhrasesTR: [...STORE_METADATA_COPY_KEYWORD_PHRASES_TR],
    keywordPhrasesEN: [...STORE_METADATA_COPY_KEYWORD_PHRASES_EN],
    reviewNotesTR: STORE_METADATA_COPY_REVIEW_NOTES_TR,
    reviewNotesEN: STORE_METADATA_COPY_REVIEW_NOTES_EN,
    releaseNotesTR: STORE_METADATA_COPY_RELEASE_NOTES_TR,
    releaseNotesEN: STORE_METADATA_COPY_RELEASE_NOTES_EN,
    iapCopyGuidance: { ...STORE_METADATA_COPY_IAP_GUIDANCE },
    privacyDisclosureCopyTR: STORE_METADATA_COPY_PRIVACY_DISCLOSURE_TR,
    privacyDisclosureCopyEN: STORE_METADATA_COPY_PRIVACY_DISCLOSURE_EN,
    positioningTR: STORE_METADATA_COPY_POSITIONING_TR,
    positioningEN: STORE_METADATA_COPY_POSITIONING_EN,
    manualLimitChecks: STORE_METADATA_COPY_MANUAL_LIMIT_CHECKS.map((c) => ({ ...c })),
    items,
    falseClaimFindings,
    copyGuardPassed,
    consoleEntryPending,
    blockerSummary,
    nextActions,
    fakePassGuard: true,
    docsPath: STORE_METADATA_COPY_DOCS_PATH,
    narrativePackDocsPath: STORE_METADATA_COPY_NARRATIVE_DOCS_PATH,
  };
}

export function assertStoreMetadataCopyIntegrity(): { ok: boolean; message: string } {
  if (STORE_METADATA_COPY_FEATURE_BULLETS_TR.length < STORE_METADATA_COPY_MIN_FEATURE_BULLETS) {
    return {
      ok: false,
      message: `TR feature bullets below minimum (${STORE_METADATA_COPY_FEATURE_BULLETS_TR.length})`,
    };
  }
  if (STORE_METADATA_COPY_FEATURE_BULLETS_EN.length < STORE_METADATA_COPY_MIN_FEATURE_BULLETS) {
    return {
      ok: false,
      message: `EN feature bullets below minimum (${STORE_METADATA_COPY_FEATURE_BULLETS_EN.length})`,
    };
  }
  if (STORE_METADATA_COPY_KEYWORD_PHRASES_TR.length < STORE_METADATA_COPY_MIN_KEYWORD_PHRASES) {
    return { ok: false, message: 'TR keyword phrases below minimum' };
  }
  if (STORE_METADATA_COPY_KEYWORD_PHRASES_EN.length < STORE_METADATA_COPY_MIN_KEYWORD_PHRASES) {
    return { ok: false, message: 'EN keyword phrases below minimum' };
  }
  if (STORE_METADATA_COPY_SUBTITLE_OPTIONS_TR.length < 2) {
    return { ok: false, message: 'TR subtitle alternatives below 2' };
  }
  if (STORE_METADATA_COPY_SUBTITLE_OPTIONS_EN.length < 2) {
    return { ok: false, message: 'EN subtitle alternatives below 2' };
  }
  if (STORE_METADATA_COPY_SHORT_DESCRIPTION_OPTIONS_TR.length < 2) {
    return { ok: false, message: 'TR short description alternatives below 2' };
  }
  if (STORE_METADATA_COPY_SHORT_DESCRIPTION_OPTIONS_EN.length < 2) {
    return { ok: false, message: 'EN short description alternatives below 2' };
  }
  if (STORE_METADATA_COPY_MANUAL_LIMIT_CHECKS.length < 5) {
    return { ok: false, message: 'Manual limit checks incomplete' };
  }
  return { ok: true, message: 'OK' };
}

export function buildStoreMetadataCopySummary(result: StoreMetadataCopyAuditResult): string {
  return [
    `Pack: ${result.packId}`,
    `Status: ${result.status}`,
    `Copy guard: ${result.copyGuardPassed ? 'PASS' : 'FAIL'}`,
    `Console entry: pending`,
    `Items: ${result.items.length}`,
    `False claims: ${result.falseClaimFindings.length}`,
    `Docs: ${result.docsPath}`,
  ].join(' | ');
}
