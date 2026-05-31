import type {
  IapEntitlementState,
  IapProductDefinition,
  IapProductId,
  IapPurchaseResult,
  IapRestoreResult,
} from './iapProductTypes';

export type IapRuntimeMode = 'disabled' | 'mock' | 'revenuecat';

export type IapRuntimeConfig = {
  mode: IapRuntimeMode;
  revenueCatIosApiKey?: string;
  revenueCatAndroidApiKey?: string;
  appUserId?: string;
  useDebugLogs: boolean;
};

export type IapValidationSeverity = 'pass' | 'warn' | 'fail';

export type IapValidationFinding = {
  id: string;
  severity: IapValidationSeverity;
  message: string;
};

export type IapValidationResult = {
  valid: boolean;
  findings: IapValidationFinding[];
};

export type IapRuntimeAdapterStatus = {
  mode: IapRuntimeMode;
  configured: boolean;
  available: boolean;
  message: string;
};

export type IapRuntimeProduct = {
  productId: IapProductId;
  title: string;
  subtitle?: string;
  priceLabel?: string;
  definition: IapProductDefinition;
};

export type IapRuntimeProductListResult = {
  products: IapRuntimeProduct[];
  source: 'design' | 'revenuecat' | 'none';
  status: IapRuntimeAdapterStatus;
};

export type SyncIapEntitlementMonetizationPatch = {
  entitlement: IapEntitlementState;
  shouldApply: boolean;
  purchaseResult?: IapPurchaseResult;
  restoreResult?: IapRestoreResult;
};
