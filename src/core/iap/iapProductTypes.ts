export type IapProductType = 'one_time_unlock' | 'subscription' | 'consumable';

export type IapProductId = 'main_operation_season_1';

export type IapEntitlementId = 'main_operation_full_access';

export type IapStoreProvider =
  | 'apple_app_store'
  | 'google_play'
  | 'revenuecat'
  | 'mock';

export type IapProductDefinition = {
  productId: IapProductId;
  entitlementId: IapEntitlementId;
  type: IapProductType;
  title: string;
  subtitle: string;
  description: string;
  storeProductIds: {
    ios: string;
    android: string;
    revenueCat?: string;
  };
  unlocks: string[];
  isRecommendedLaunchProduct: boolean;
};

export type IapEntitlementState = {
  entitlementId: IapEntitlementId;
  isActive: boolean;
  source: IapStoreProvider;
  productId?: IapProductId;
  verifiedAtDay?: number;
  expiresAtDay?: number;
  reason?: string;
};

export type IapRestoreStatus = IapRestoreResult['status'];

export type IapRestoreResult = {
  status: 'restored' | 'not_found' | 'failed' | 'pending';
  entitlement?: IapEntitlementState;
  message: string;
};

export type IapPurchaseStatus = IapPurchaseResult['status'];

export type IapPurchaseResult = {
  status: 'completed' | 'cancelled' | 'failed' | 'pending';
  entitlement?: IapEntitlementState;
  message: string;
};

export type IapOfferCopyModel = {
  title: string;
  subtitle: string;
  valueBullets: string[];
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  restoreCtaLabel: string;
  footerNote: string;
};

export type IapIntegrationAdapterContract = {
  fetchProducts: string;
  purchaseProduct: string;
  restorePurchases: string;
  getCustomerEntitlements: string;
  syncEntitlementToMonetizationState: string;
};

export type IapDesignAuditFinding = {
  id: string;
  severity: 'pass' | 'warn' | 'fail';
  message: string;
  recommendation: string;
};

export type IapDesignAuditResult = {
  health: 'PASS' | 'WARN' | 'FAIL';
  checkedCount: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  findings: IapDesignAuditFinding[];
};
