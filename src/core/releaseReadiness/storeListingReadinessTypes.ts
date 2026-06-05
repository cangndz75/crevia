export type CreviaStoreReadinessHealthStatus = 'PASS' | 'WARN' | 'BLOCKED';

export type CreviaStoreListingChecklistSection =
  | 'app_metadata'
  | 'visual_assets'
  | 'iap_metadata'
  | 'privacy_data_safety'
  | 'age_rating'
  | 'build_compliance';

export type CreviaStoreListingChecklistItemStatus =
  | 'pending'
  | 'draft'
  | 'ready'
  | 'not_applicable';

export type CreviaStoreListingChecklistItem = {
  id: string;
  section: CreviaStoreListingChecklistSection;
  title: string;
  description: string;
  status: CreviaStoreListingChecklistItemStatus;
  requiredForLaunch: boolean;
  recommendation: string;
};

export type CreviaStoreListingAssetRequirement = {
  id: string;
  assetType: string;
  platform: 'ios' | 'android' | 'both';
  required: boolean;
  status: 'pending' | 'present' | 'optional_pending';
  pathHint?: string;
  notes: string;
};

export type CreviaStoreScreenshotRequirement = {
  screenName: string;
  purpose: string;
  requiredState: string;
  copyOverlayAllowed: boolean;
  riskNotes: string;
  deviceSize: string;
  status: 'pending' | 'done';
  platform: 'ios' | 'android' | 'both';
};

export type CreviaStorePrivacyRequirement = {
  collectedDataType: string;
  purpose: string;
  linkedToUser: boolean | 'pending';
  usedForTracking: boolean | 'pending';
  requiredForAppFunctionality: boolean;
  notes: string;
};

export type CreviaStoreMetadataDraft = {
  appName: string;
  subtitleTr: string;
  subtitleEn: string;
  shortDescriptionTr: string;
  shortDescriptionEn: string;
  fullDescriptionTr: string;
  fullDescriptionEn: string;
  featureBullets: string[];
  iapProductDescription: string;
  privacySummary: string;
  supportContact: string;
  privacyPolicyUrl: string;
  supportUrl: string;
  marketingUrl: string;
  keywords: string;
  category: string;
};

export type CreviaStoreReadinessBlocker = {
  id: string;
  title: string;
  message: string;
  section: CreviaStoreListingChecklistSection;
};

export type CreviaStoreReadinessWarning = {
  id: string;
  title: string;
  message: string;
  section: CreviaStoreListingChecklistSection;
};

export type CreviaStoreListingReadinessMode =
  | 'internal_device_test'
  | 'iap_sandbox_test'
  | 'launch_candidate'
  | 'soft_launch_candidate';

export type CreviaStoreListingReadinessResult = {
  health: CreviaStoreReadinessHealthStatus;
  mode: CreviaStoreListingReadinessMode;
  checklist: CreviaStoreListingChecklistItem[];
  assets: CreviaStoreListingAssetRequirement[];
  screenshots: CreviaStoreScreenshotRequirement[];
  privacyMatrix: CreviaStorePrivacyRequirement[];
  metadataDraft: CreviaStoreMetadataDraft;
  blockers: CreviaStoreReadinessBlocker[];
  warnings: CreviaStoreReadinessWarning[];
  copyForbiddenClaimsScanPassed: boolean;
  privacyPolicyUrlIsPlaceholder: boolean;
  screenshotsComplete: boolean;
  storeMetadataReady: boolean;
  iapMetadataPlaceholder: boolean;
  nextActions: string[];
};

export type RunStoreListingReadinessAuditOptions = {
  mode?: CreviaStoreListingReadinessMode;
};
