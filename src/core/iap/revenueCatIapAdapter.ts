import {
  getIapRuntimeConfig,
  getRevenueCatApiKeyForPlatform,
  isRevenueCatConfigured,
} from './iapRuntimeConfig';
import type { IapRuntimeConfig, IapRuntimeAdapterStatus } from './iapRuntimeTypes';
import {
  IAP_STORE_PRODUCT_IDS,
  MAIN_OPERATION_ENTITLEMENT_ID,
  MAIN_OPERATION_IAP_PRODUCT_ID,
} from './iapProductConstants';
import { getMainOperationProductDefinition } from './iapProductDesign';
import {
  buildPurchaseResultFromEntitlement,
  buildRestoreResultFromEntitlement,
} from './iapEntitlementMapping';
import type {
  IapEntitlementState,
  IapProductId,
  IapPurchaseResult,
  IapRestoreResult,
} from './iapProductTypes';
import type { IapRuntimeProduct } from './iapRuntimeTypes';

type PurchasesModule = {
  default: PurchasesClient;
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: number;
  };
  LOG_LEVEL: {
    DEBUG: string;
  };
};

type PurchasesClient = {
  configure: (opts: { apiKey: string; appUserID?: string }) => Promise<void>;
  setLogLevel: (level: string) => Promise<void>;
  getOfferings: () => Promise<OfferingsResult>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<CustomerInfoResult>;
  getCustomerInfo: () => Promise<CustomerInfoResult>;
};

type OfferingsResult = {
  current?: {
    availablePackages: PurchasesPackage[];
  };
};

type PurchasesPackage = {
  identifier: string;
  product: {
    identifier: string;
    priceString: string;
    title: string;
    description: string;
  };
};

type PurchaseResult = {
  customerInfo: CustomerInfo;
};

type CustomerInfoResult = {
  customerInfo: CustomerInfo;
};

type CustomerInfo = {
  entitlements: {
    active: Record<
      string,
      {
        identifier: string;
        isActive: boolean;
        productIdentifier: string;
      }
    >;
  };
};

let configurePromise: Promise<IapRuntimeAdapterStatus> | null = null;
let configured = false;
let purchasesModule: PurchasesModule | null | undefined;

function debugLog(config: IapRuntimeConfig, message: string): void {
  if (!config.useDebugLogs || typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }
  // eslint-disable-next-line no-console
  console.log(`[iap] ${message}`);
}

function loadPurchasesModule(): PurchasesModule | null {
  if (purchasesModule !== undefined) {
    return purchasesModule;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    purchasesModule = require('react-native-purchases') as PurchasesModule;
    return purchasesModule;
  } catch {
    purchasesModule = null;
    return null;
  }
}

function getPlatformOs(): 'ios' | 'android' | 'web' | 'unknown' {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Platform } = require('react-native') as {
      Platform: { OS: 'ios' | 'android' | 'web' };
    };
    return Platform.OS;
  } catch {
    return 'web';
  }
}

function storeProductIdForPlatform(): string {
  return getPlatformOs() === 'android'
    ? IAP_STORE_PRODUCT_IDS.android
    : IAP_STORE_PRODUCT_IDS.ios;
}

function mapCustomerInfoToEntitlement(
  customerInfo: CustomerInfo,
  currentDay: number,
): IapEntitlementState | undefined {
  const active =
    customerInfo.entitlements.active[MAIN_OPERATION_ENTITLEMENT_ID];
  if (!active?.isActive) {
    return undefined;
  }
  return {
    entitlementId: MAIN_OPERATION_ENTITLEMENT_ID,
    isActive: true,
    source: 'revenuecat',
    productId: MAIN_OPERATION_IAP_PRODUCT_ID,
    verifiedAtDay: currentDay,
    reason: active.productIdentifier,
  };
}

function mapAllActiveEntitlements(
  customerInfo: CustomerInfo,
  currentDay: number,
): IapEntitlementState[] {
  const main = mapCustomerInfoToEntitlement(customerInfo, currentDay);
  return main ? [main] : [];
}

function packageMatchesProduct(pkg: PurchasesPackage): boolean {
  const storeId = storeProductIdForPlatform();
  const productId = pkg.product.identifier;
  return (
    productId === storeId ||
    productId === MAIN_OPERATION_IAP_PRODUCT_ID ||
    pkg.identifier === MAIN_OPERATION_IAP_PRODUCT_ID ||
    pkg.identifier.includes('main_operation')
  );
}

function findPackageForProduct(
  offerings: OfferingsResult,
): PurchasesPackage | undefined {
  const packages = offerings.current?.availablePackages ?? [];
  return packages.find(packageMatchesProduct);
}

function disabledStatus(message: string): IapRuntimeAdapterStatus {
  const config = getIapRuntimeConfig();
  return {
    mode: config.mode,
    configured: false,
    available: false,
    message,
  };
}

export async function configureRevenueCatIap(
  config: IapRuntimeConfig = getIapRuntimeConfig(),
): Promise<IapRuntimeAdapterStatus> {
  if (configurePromise) {
    return configurePromise;
  }

  configurePromise = (async (): Promise<IapRuntimeAdapterStatus> => {
    if (!isRevenueCatConfigured(config)) {
      return disabledStatus('RevenueCat public API key missing for platform.');
    }

    const apiKey = getRevenueCatApiKeyForPlatform(config, getPlatformOs());
    if (!apiKey) {
      return disabledStatus('RevenueCat API key not set for this platform.');
    }

    const module = loadPurchasesModule();
    if (!module?.default) {
      return disabledStatus('react-native-purchases module unavailable.');
    }

    try {
      if (config.useDebugLogs && module.LOG_LEVEL?.DEBUG) {
        await module.default.setLogLevel(module.LOG_LEVEL.DEBUG);
      }
      await module.default.configure({
        apiKey,
        appUserID: config.appUserId,
      });
      configured = true;
      debugLog(config, 'RevenueCat configured');
      return {
        mode: 'revenuecat',
        configured: true,
        available: true,
        message: 'RevenueCat configured.',
      };
    } catch {
      configured = false;
      return disabledStatus('RevenueCat configure failed.');
    }
  })();

  return configurePromise;
}

export function isRevenueCatAdapterConfigured(): boolean {
  return configured;
}

export async function fetchRevenueCatProducts(): Promise<IapRuntimeProduct[]> {
  const config = getIapRuntimeConfig();
  const definition = getMainOperationProductDefinition();
  const fallback: IapRuntimeProduct = {
    productId: definition.productId,
    title: definition.title,
    subtitle: definition.subtitle,
    definition,
  };

  if (!configured) {
    return [fallback];
  }

  const module = loadPurchasesModule();
  if (!module?.default) {
    return [fallback];
  }

  try {
    const offerings = await module.default.getOfferings();
    const pkg = findPackageForProduct(offerings);
    if (!pkg) {
      return [fallback];
    }
    return [
      {
        productId: MAIN_OPERATION_IAP_PRODUCT_ID,
        title: pkg.product.title || definition.title,
        subtitle: definition.subtitle,
        priceLabel: pkg.product.priceString,
        definition,
      },
    ];
  } catch {
    return [fallback];
  }
}

export async function purchaseRevenueCatProduct(
  productId: IapProductId,
  currentDay: number,
): Promise<IapPurchaseResult> {
  if (productId !== MAIN_OPERATION_IAP_PRODUCT_ID) {
    return {
      status: 'failed',
      message: 'Erişim kontrolü tamamlanamadı. Daha sonra tekrar deneyebilirsin.',
    };
  }

  if (!configured) {
    return {
      status: 'failed',
      message: 'Erişim kontrolü tamamlanamadı. Daha sonra tekrar deneyebilirsin.',
    };
  }

  const module = loadPurchasesModule();
  if (!module?.default) {
    return {
      status: 'failed',
      message: 'Erişim kontrolü tamamlanamadı. Daha sonra tekrar deneyebilirsin.',
    };
  }

  try {
    const offerings = await module.default.getOfferings();
    const pkg = findPackageForProduct(offerings);
    if (!pkg) {
      return {
        status: 'failed',
        message: 'Erişim kontrolü tamamlanamadı. Daha sonra tekrar deneyebilirsin.',
      };
    }

    const result = await module.default.purchasePackage(pkg);
    const entitlement = mapCustomerInfoToEntitlement(
      result.customerInfo,
      currentDay,
    );
    if (!entitlement) {
      return {
        status: 'pending',
        message: 'Erişim kontrol ediliyor',
      };
    }
    return buildPurchaseResultFromEntitlement(entitlement);
  } catch (error: unknown) {
    if (isPurchaseCancelled(error, module)) {
      return {
        status: 'cancelled',
        message: 'İşlem iptal edildi.',
      };
    }
    return {
      status: 'failed',
      message: 'Erişim kontrolü tamamlanamadı. Daha sonra tekrar deneyebilirsin.',
    };
  }
}

export async function restoreRevenueCatPurchases(
  currentDay: number,
): Promise<IapRestoreResult> {
  if (!configured) {
    return {
      status: 'not_found',
      message: 'Bu hesapta aktif Ana Operasyon erişimi bulunamadı.',
    };
  }

  const module = loadPurchasesModule();
  if (!module?.default) {
    return {
      status: 'failed',
      message: 'Erişim kontrolü tamamlanamadı. Daha sonra tekrar deneyebilirsin.',
    };
  }

  try {
    const result = await module.default.restorePurchases();
    const entitlement = mapCustomerInfoToEntitlement(
      result.customerInfo,
      currentDay,
    );
    if (!entitlement) {
      return {
        status: 'not_found',
        message: 'Bu hesapta aktif Ana Operasyon erişimi bulunamadı.',
      };
    }
    return buildRestoreResultFromEntitlement(entitlement);
  } catch {
    return {
      status: 'failed',
      message: 'Erişim kontrolü tamamlanamadı. Daha sonra tekrar deneyebilirsin.',
    };
  }
}

export async function getRevenueCatActiveEntitlements(
  currentDay: number,
): Promise<IapEntitlementState[]> {
  if (!configured) {
    return [];
  }

  const module = loadPurchasesModule();
  if (!module?.default) {
    return [];
  }

  try {
    const result = await module.default.getCustomerInfo();
    return mapAllActiveEntitlements(result.customerInfo, currentDay);
  } catch {
    return [];
  }
}

export function syncRevenueCatEntitlementToMonetizationState(
  entitlement: IapEntitlementState,
  currentDay: number,
): SyncRevenueCatEntitlementResult {
  return {
    entitlement: {
      ...entitlement,
      verifiedAtDay: entitlement.verifiedAtDay ?? currentDay,
    },
    shouldUnlock: entitlement.isActive && entitlement.entitlementId === MAIN_OPERATION_ENTITLEMENT_ID,
  };
}

export type SyncRevenueCatEntitlementResult = {
  entitlement: IapEntitlementState;
  shouldUnlock: boolean;
};

function isPurchaseCancelled(
  error: unknown,
  module: PurchasesModule | null,
): boolean {
  if (!isRecord(error)) return false;
  const code = error.code;
  if (
    module &&
    typeof code === 'number' &&
    code === module.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
  ) {
    return true;
  }
  if (error.userCancelled === true) return true;
  const message = String(error.message ?? '').toLowerCase();
  return message.includes('cancel');
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object';
}
