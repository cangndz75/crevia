export type StoreMetadataCopyPackStatus =
  | 'draft'
  | 'ready_for_console_entry'
  | 'blocked_by_manual_store_entry'
  | 'ready_for_review';

export type StoreMetadataCopyLocale = 'tr' | 'en';

export type StoreMetadataCopyTargetStore = 'app_store' | 'google_play' | 'both';

export type StoreMetadataCopyFieldType =
  | 'app_name'
  | 'subtitle'
  | 'short_description'
  | 'full_description'
  | 'feature_bullet'
  | 'keyword_phrase'
  | 'release_note'
  | 'review_note'
  | 'iap_description'
  | 'privacy_disclosure';

export type StoreMetadataCopyClaimRisk = 'low' | 'medium' | 'high';

export type StoreMetadataCopyItemStatus = 'draft' | 'ready_for_review' | 'needs_manual_check';

export type StoreMetadataCopyItem = {
  id: string;
  locale: StoreMetadataCopyLocale;
  storeTarget: StoreMetadataCopyTargetStore;
  fieldType: StoreMetadataCopyFieldType;
  text: string;
  characterGuidance: string;
  tone: string;
  claimRisk: StoreMetadataCopyClaimRisk;
  storeComplianceNotes: string;
  status: StoreMetadataCopyItemStatus;
  blocksSubmission: boolean;
};

export type StoreMetadataCopyManualLimitCheck = {
  id: string;
  platform: 'apple' | 'google' | 'both';
  note: string;
  lastChecked: string;
};

export type StoreMetadataCopyIapGuidance = {
  toneTr: string;
  toneEn: string;
  displayNameToneTr: string;
  displayNameToneEn: string;
  descriptionToneTr: string;
  descriptionToneEn: string;
  restorePurchaseNoteTr: string;
  restorePurchaseNoteEn: string;
  forbiddenPressurePhrases: string[];
  complianceNotes: string[];
};

export type StoreMetadataCopyFalseClaimFinding = {
  phrase: string;
  fieldId: string;
  severity: 'blocker' | 'warning';
};

export type StoreMetadataCopyBlocker = {
  id: string;
  title: string;
  message: string;
};

export type StoreMetadataCopyPack = {
  packId: string;
  status: StoreMetadataCopyPackStatus;
  localeCoverage: 'tr' | 'en' | 'tr_en';
  targetStores: StoreMetadataCopyTargetStore;
  appNameOptions: string[];
  subtitleOptionsTR: string[];
  subtitleOptionsEN: string[];
  shortDescriptionOptionsTR: string[];
  shortDescriptionOptionsEN: string[];
  longDescriptionTR: string;
  longDescriptionEN: string;
  featureBulletsTR: string[];
  featureBulletsEN: string[];
  keywordPhrasesTR: string[];
  keywordPhrasesEN: string[];
  reviewNotesTR: string;
  reviewNotesEN: string;
  releaseNotesTR: string;
  releaseNotesEN: string;
  iapCopyGuidance: StoreMetadataCopyIapGuidance;
  privacyDisclosureCopyTR: string;
  privacyDisclosureCopyEN: string;
  positioningTR: string;
  positioningEN: string;
  manualLimitChecks: StoreMetadataCopyManualLimitCheck[];
  items: StoreMetadataCopyItem[];
  falseClaimFindings: StoreMetadataCopyFalseClaimFinding[];
  copyGuardPassed: boolean;
  consoleEntryPending: true;
  blockerSummary: StoreMetadataCopyBlocker[];
  nextActions: string[];
  fakePassGuard: true;
  docsPath: string;
  narrativePackDocsPath: string;
};

export type StoreMetadataCopyAuditResult = StoreMetadataCopyPack;
