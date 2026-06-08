export type CreviaIapManualSetupStatus =
  | 'not_started'
  | 'pending_manual'
  | 'configured_unverified'
  | 'verified'
  | 'blocked'
  | 'not_applicable';

export type CreviaIapManualSetupHealthStatus = 'PASS' | 'WARN' | 'BLOCKED';

export type CreviaIapManualSetupArea =
  | 'revenuecat_project'
  | 'revenuecat_entitlement'
  | 'revenuecat_offering'
  | 'app_store_connect_iap'
  | 'google_play_console_product'
  | 'eas_build_config'
  | 'sandbox_test_accounts'
  | 'manual_verification';

export type CreviaIapManualSetupItem = {
  id: string;
  area: CreviaIapManualSetupArea;
  title: string;
  status: CreviaIapManualSetupStatus;
  platform: 'ios' | 'android' | 'both' | 'infra';
  blockerIfMissing: boolean;
  notes: string;
};

export type CreviaIapManualSetupBlocker = {
  id: string;
  area: CreviaIapManualSetupArea;
  title: string;
  message: string;
  recommendation: string;
};

export type CreviaIapManualSetupWarning = {
  id: string;
  area: CreviaIapManualSetupArea;
  title: string;
  message: string;
  recommendation: string;
};

export type CreviaIapManualSetupPlatformStatus = {
  platform: 'ios' | 'android';
  status: CreviaIapManualSetupStatus;
  configuredCount: number;
  verifiedCount: number;
  pendingCount: number;
  blockedCount: number;
  totalItems: number;
};

export type IapDashboardEntryChecklistStatus =
  | 'draft'
  | 'ready_for_manual_entry'
  | 'blocked_by_missing_dashboard_access'
  | 'partially_entered'
  | 'ready_for_sandbox_test';

export type IapDashboardChecklistPlatform =
  | 'app_store'
  | 'play_console'
  | 'revenuecat'
  | 'shared';

export type IapDashboardFieldTarget =
  | 'product_id'
  | 'reference_name'
  | 'product_name_tr'
  | 'product_name_en'
  | 'product_description_tr'
  | 'product_description_en'
  | 'price_tier'
  | 'entitlement_id'
  | 'offering_id'
  | 'package_id'
  | 'app_bundle_id'
  | 'store_product_link'
  | 'sandbox_tester'
  | 'review_note'
  | 'restore_test'
  | 'purchase_test'
  | 'product_type'
  | 'localization'
  | 'review_screenshot'
  | 'product_status'
  | 'ready_to_submit'
  | 'country_availability'
  | 'license_tester'
  | 'build_package_link'
  | 'public_sdk_keys'
  | 'purchase_event'
  | 'restore_event';

export type IapDashboardValueSource =
  | 'iap_product_copy_pack'
  | 'manual_dashboard'
  | 'store_console'
  | 'revenuecat_dashboard'
  | 'eas_env'
  | 'placeholder';

export type IapDashboardRequiredEvidenceType =
  | 'store_console'
  | 'purchase_log'
  | 'dashboard_event'
  | 'manual_note'
  | 'screenshot';

export type IapDashboardChecklistItemStatus =
  | 'pending'
  | 'in_progress'
  | 'entered'
  | 'verified'
  | 'blocked'
  | 'not_applicable';

export type IapDashboardChecklistItem = {
  id: string;
  platform: IapDashboardChecklistPlatform;
  fieldTarget: IapDashboardFieldTarget;
  valueSource: IapDashboardValueSource;
  requiredEvidenceType: IapDashboardRequiredEvidenceType;
  status: IapDashboardChecklistItemStatus;
  blocksPublicLaunch: boolean;
  blocksInternalDeviceTest: boolean;
  nextAction: string;
  fakePassRisk: boolean;
  copyHint?: string;
  placeholderToken?: string;
};

export type IapSandboxTestMatrixCase = {
  id: string;
  platform: 'ios' | 'android' | 'both';
  title: string;
  precondition: string;
  steps: string[];
  expectedResult: string;
  requiredEvidence: IapDashboardRequiredEvidenceType[];
  relatedBlocker: string;
  passCriteria: string;
  failCriteria: string;
};

export type IapOfferScreenTrustQaItem = {
  id: string;
  rule: string;
  status: 'pending_manual' | 'documented';
  blocksPublicLaunch: boolean;
};

export type IapReviewNotePlaceholderMapping = {
  placeholder: string;
  checklistItemId: string;
  readyForReview: boolean;
  blocksPublicLaunch: boolean;
  nextAction: string;
};

export type IapDashboardEvidenceRequirement = {
  id: string;
  evidenceType: IapDashboardRequiredEvidenceType;
  closesBlocker: string;
  cannotCloseWithout: string;
};

export type IapDashboardBlockerMapping = {
  blockerId: string;
  checklistItemIds: string[];
  evidenceRequired: IapDashboardRequiredEvidenceType[];
};

export type IapDashboardEntryChecklist = {
  checklistId: string;
  status: IapDashboardEntryChecklistStatus;
  appStoreItems: IapDashboardChecklistItem[];
  playStoreItems: IapDashboardChecklistItem[];
  revenueCatItems: IapDashboardChecklistItem[];
  sandboxTesterItems: IapDashboardChecklistItem[];
  reviewNoteItems: IapReviewNotePlaceholderMapping[];
  evidenceRequirements: IapDashboardEvidenceRequirement[];
  blockerMapping: IapDashboardBlockerMapping[];
  sandboxTestMatrix: IapSandboxTestMatrixCase[];
  offerScreenTrustQa: IapOfferScreenTrustQaItem[];
  fakePassGuard: boolean;
};

export type IapDashboardEntryChecklistAuditResult = {
  checklist: IapDashboardEntryChecklist;
  placeholderCount: number;
  verifiedEvidenceCount: number;
  canStartSandboxTesting: boolean;
  canSubmitForReview: boolean;
  appStoreChecklistStatus: IapDashboardChecklistItemStatus;
  playChecklistStatus: IapDashboardChecklistItemStatus;
  revenueCatChecklistStatus: IapDashboardChecklistItemStatus;
  sandboxMatrixStatus: 'pending' | 'ready_for_execution';
  offerScreenTrustQaStatus: 'pending_manual';
  fakePassGuard: boolean;
};

export type CreviaIapManualSetupTrackerResult = {
  health: CreviaIapManualSetupHealthStatus;
  areas: CreviaIapManualSetupArea[];
  items: CreviaIapManualSetupItem[];
  blockers: CreviaIapManualSetupBlocker[];
  warnings: CreviaIapManualSetupWarning[];
  platformStatuses: CreviaIapManualSetupPlatformStatus[];
  revenueCatKeysConfigured: boolean;
  entitlementMappingPending: boolean;
  storeProductsPending: boolean;
  easSecretsPending: boolean;
  sandboxTestersPending: boolean;
  manualVerificationPending: boolean;
  allVerified: boolean;
  nextActions: string[];
  docsPath: string;
  iosProductId: string;
  androidProductId: string;
  entitlementId: string;
  offeringId: string;
  productCopyPackId?: string;
  productCopyPackStatus?: string;
  productCopyDocsPath?: string;
  productMetadataCopyReady?: boolean;
  dashboardChecklistId?: string;
  dashboardChecklistStatus?: IapDashboardEntryChecklistStatus;
  dashboardChecklistDocsPath?: string;
  appStoreChecklistStatus?: IapDashboardChecklistItemStatus;
  playChecklistStatus?: IapDashboardChecklistItemStatus;
  revenueCatChecklistStatus?: IapDashboardChecklistItemStatus;
  sandboxMatrixStatus?: 'pending' | 'ready_for_execution';
  placeholderCount?: number;
  verifiedEvidenceCount?: number;
  canStartSandboxTesting?: boolean;
  canSubmitForReview?: boolean;
  dashboardEntryChecklist?: IapDashboardEntryChecklist;
};
