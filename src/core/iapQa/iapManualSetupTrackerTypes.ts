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
};
