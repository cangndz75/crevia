export type CreviaStoreMetadataHealthStatus = 'PASS' | 'WARN' | 'BLOCKED';

export type CreviaStoreMetadataField = {
  key: string;
  valueTr: string;
  valueEn: string;
  required: boolean;
  status: 'draft' | 'pending' | 'ready' | 'placeholder';
};

export type CreviaStoreLocalizedMetadata = {
  appName: string;
  subtitle: string;
  shortDescription: string;
  fullDescription: string;
  featureBullets: string[];
  keywords: string[];
  category: string;
  ageRatingNote: string;
  supportUrl: string;
  privacyPolicyUrl: string;
  marketingUrl: string;
  contactEmail: string;
  copyrightOwner: string;
  appReviewNotes: string;
  releaseNotes: string;
};

export type CreviaStoreKeywordSet = {
  locale: 'tr' | 'en';
  keywords: string[];
  forbiddenKeywords: string[];
  forbiddenHits: string[];
};

export type CreviaStoreIapMetadataDraft = {
  productIdIos: string;
  productIdAndroid: string;
  displayNameTr: string;
  displayNameEn: string;
  descriptionTr: string;
  descriptionEn: string;
  entitlementId: string;
  offeringId: string;
  productType: string;
  priceTierStatus: 'pending_manual' | 'configured';
  storeSetupStatus: 'pending_manual' | 'configured';
};

export type CreviaStoreReviewNoteDraft = {
  sections: string[];
  containsDayEightTestNote: boolean;
  containsSandboxPlaceholder: boolean;
  containsRevenueCatPlaceholder: boolean;
};

export type CreviaStoreMetadataRiskScanResult = {
  passed: boolean;
  scannedTexts: number;
  hits: string[];
};

export type CreviaStoreMetadataBlocker = {
  id: string;
  title: string;
  message: string;
};

export type CreviaStoreMetadataWarning = {
  id: string;
  title: string;
  message: string;
};

export type CreviaStoreMetadataFinalizationMode =
  | 'internal_device_test'
  | 'iap_sandbox_test'
  | 'launch_candidate'
  | 'soft_launch_candidate';

export type CreviaStoreMetadataFinalizationResult = {
  health: CreviaStoreMetadataHealthStatus;
  mode: CreviaStoreMetadataFinalizationMode;
  metadataTr: CreviaStoreLocalizedMetadata;
  metadataEn: CreviaStoreLocalizedMetadata;
  fields: CreviaStoreMetadataField[];
  keywordsTr: CreviaStoreKeywordSet;
  keywordsEn: CreviaStoreKeywordSet;
  iapMetadata: CreviaStoreIapMetadataDraft;
  reviewNotes: CreviaStoreReviewNoteDraft;
  releaseNotesDraft: string;
  riskScan: CreviaStoreMetadataRiskScanResult;
  blockers: CreviaStoreMetadataBlocker[];
  warnings: CreviaStoreMetadataWarning[];
  metadataDraftPresent: boolean;
  keywordsPresent: boolean;
  iapMetadataDraftPresent: boolean;
  reviewNotesDraftPresent: boolean;
  privacyUrlIsPlaceholder: boolean;
  screenshotsPending: boolean;
  consoleEntryPending: boolean;
  nextActions: string[];
};

export type RunStoreMetadataFinalizationAuditOptions = {
  mode?: CreviaStoreMetadataFinalizationMode;
};
