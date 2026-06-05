export type CreviaStoreScreenshotHealthStatus = 'PASS' | 'WARN' | 'BLOCKED';

export type CreviaStoreScreenshotDeviceProfile = {
  id: string;
  label: string;
  platform: 'ios' | 'android';
  category: 'small_phone' | 'large_phone' | 'medium_phone' | 'low_mid_device' | 'tablet';
  storeSizePendingManualConfirmation: boolean;
  notes: string;
};

export type CreviaStoreScreenshotCaptureScenario = {
  targetDay: string;
  gameStateRequirement: string;
  requiredVisibleCards: string[];
  forbiddenVisibleCards: string[];
};

export type CreviaStoreScreenshotRequirement = {
  id: string;
  screenName: string;
  platform: 'ios' | 'android' | 'both';
  deviceProfile: string;
  targetDay: string;
  gameStateRequirement: string;
  requiredVisibleCards: string[];
  forbiddenVisibleCards: string[];
  capturePurpose: string;
  copyOverlayAllowed: boolean;
  overlayCopyDraft?: string;
  riskNotes: string;
  status: 'pending' | 'captured' | 'rejected' | 'needs_recapture';
  blockerIfMissing: boolean;
};

export type CreviaStoreScreenshotAssetRequirement = {
  id: string;
  assetType: string;
  requiredFor: 'ios' | 'android' | 'both';
  status: 'pending' | 'present' | 'not_applicable';
  sourceFile: string;
  exportStatus: 'pending' | 'exported' | 'not_applicable';
  manualConfirmationNeeded: boolean;
  blockerIfMissing: boolean;
};

export type CreviaStoreScreenshotCopyGuardResult = {
  passed: boolean;
  falseClaimDetected: boolean;
  paywallPressureDetected: boolean;
  liveGpsClaimDetected: boolean;
  officialMunicipalityClaimDetected: boolean;
  oldSeasonWordingDetected: boolean;
  rawPrivacyClaimDetected: boolean;
  violations: string[];
};

export type CreviaStoreScreenshotBlocker = {
  id: string;
  title: string;
  message: string;
};

export type CreviaStoreScreenshotWarning = {
  id: string;
  title: string;
  message: string;
};

export type CreviaStoreScreenshotReadinessResult = {
  health: CreviaStoreScreenshotHealthStatus;
  mode: 'internal_device_test' | 'iap_sandbox_test' | 'launch_candidate' | 'soft_launch_candidate';
  screenshots: CreviaStoreScreenshotRequirement[];
  deviceProfiles: CreviaStoreScreenshotDeviceProfile[];
  assets: CreviaStoreScreenshotAssetRequirement[];
  copyGuard: CreviaStoreScreenshotCopyGuardResult;
  blockers: CreviaStoreScreenshotBlocker[];
  warnings: CreviaStoreScreenshotWarning[];
  screenshotsCaptured: number;
  screenshotsPending: number;
  screenshotsTotal: number;
  allRequiredCaptured: boolean;
  deviceMatrixComplete: boolean;
  assetChecklistComplete: boolean;
  nextActions: string[];
};

export type RunStoreScreenshotReadinessAuditOptions = {
  mode?: CreviaStoreScreenshotReadinessResult['mode'];
};
