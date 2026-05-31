import {
  getIapRuntimeConfig,
  isIapRuntimeEnabled,
  isRevenueCatConfigured,
} from './iapRuntimeConfig';
import { getMainOperationProductDefinition } from './iapProductDesign';
import { buildMockEntitlementForMainOperation } from './iapEntitlementMapping';
import {
  MAIN_OPERATION_IAP_PRODUCT_ID,
} from './iapProductConstants';
import {
  configureRevenueCatIap,
  fetchRevenueCatProducts,
  getRevenueCatActiveEntitlements,
  isRevenueCatAdapterConfigured,
  purchaseRevenueCatProduct,
  restoreRevenueCatPurchases,
} from './revenueCatIapAdapter';
import type { IapEntitlementState, IapProductId, IapPurchaseResult, IapRestoreResult } from './iapProductTypes';
import type {
  IapRuntimeAdapterStatus,
  IapRuntimeProduct,
  IapRuntimeProductListResult,
} from './iapRuntimeTypes';

let initPromise: Promise<IapRuntimeAdapterStatus> | null = null;
let lastStatus: IapRuntimeAdapterStatus | null = null;

export function isIapAvailableForRuntime(): boolean {
  const config = getIapRuntimeConfig();
  if (config.mode === 'disabled') return false;
  if (config.mode === 'mock') return true;
  return isRevenueCatConfigured(config);
}

export function getLastIapRuntimeStatus(): IapRuntimeAdapterStatus | null {
  return lastStatus;
}

export async function initializeIapRuntime(): Promise<IapRuntimeAdapterStatus> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const config = getIapRuntimeConfig();
    if (config.mode === 'disabled') {
      lastStatus = {
        mode: 'disabled',
        configured: false,
        available: false,
        message: 'IAP disabled — configure EXPO_PUBLIC_REVENUECAT_* keys.',
      };
      return lastStatus;
    }

    if (config.mode === 'mock') {
      lastStatus = {
        mode: 'mock',
        configured: true,
        available: true,
        message: 'Mock IAP runtime (dev).',
      };
      return lastStatus;
    }

    lastStatus = await configureRevenueCatIap(config);
    return lastStatus;
  })();

  return initPromise;
}

function designFallbackProducts(): IapRuntimeProduct[] {
  const definition = getMainOperationProductDefinition();
  return [
    {
      productId: definition.productId,
      title: definition.title,
      subtitle: definition.subtitle,
      definition,
    },
  ];
}

export async function fetchIapProducts(): Promise<IapRuntimeProductListResult> {
  const status = await initializeIapRuntime();
  const config = getIapRuntimeConfig();

  if (config.mode === 'disabled') {
    return {
      products: [],
      source: 'none',
      status,
    };
  }

  if (config.mode === 'mock') {
    return {
      products: designFallbackProducts(),
      source: 'design',
      status,
    };
  }

  if (!isRevenueCatAdapterConfigured()) {
    return {
      products: designFallbackProducts(),
      source: 'design',
      status,
    };
  }

  const products = await fetchRevenueCatProducts();
  return {
    products: products.length > 0 ? products : designFallbackProducts(),
    source: 'revenuecat',
    status,
  };
}

export async function purchaseIapProduct(
  productId: IapProductId,
  currentDay: number,
): Promise<IapPurchaseResult> {
  const config = getIapRuntimeConfig();

  if (config.mode === 'disabled') {
    return {
      status: 'failed',
      message: 'Erişim kontrolü tamamlanamadı. Daha sonra tekrar deneyebilirsin.',
    };
  }

  if (config.mode === 'mock') {
    const entitlement = buildMockEntitlementForMainOperation(currentDay);
    return {
      status: 'completed',
      entitlement,
      message: 'Ana Operasyon erişimi aktif',
    };
  }

  if (productId !== MAIN_OPERATION_IAP_PRODUCT_ID) {
    return {
      status: 'failed',
      message: 'Erişim kontrolü tamamlanamadı. Daha sonra tekrar deneyebilirsin.',
    };
  }

  await initializeIapRuntime();
  return purchaseRevenueCatProduct(productId, currentDay);
}

export async function restoreIapPurchases(
  currentDay: number,
): Promise<IapRestoreResult> {
  const config = getIapRuntimeConfig();

  if (config.mode === 'disabled') {
    return {
      status: 'not_found',
      message: 'Bu hesapta aktif Ana Operasyon erişimi bulunamadı.',
    };
  }

  if (config.mode === 'mock') {
    return {
      status: 'not_found',
      message: 'Bu hesapta aktif Ana Operasyon erişimi bulunamadı.',
    };
  }

  await initializeIapRuntime();
  return restoreRevenueCatPurchases(currentDay);
}

export async function getActiveIapEntitlements(
  currentDay: number,
): Promise<IapEntitlementState[]> {
  const config = getIapRuntimeConfig();
  if (!isIapRuntimeEnabled(config)) {
    return [];
  }
  if (config.mode === 'mock') {
    return [];
  }
  await initializeIapRuntime();
  if (!isRevenueCatAdapterConfigured()) {
    return [];
  }
  return getRevenueCatActiveEntitlements(currentDay);
}

export function shouldUseMockPurchaseForOfferScreen(): boolean {
  const config = getIapRuntimeConfig();
  return config.mode === 'mock';
}

export function shouldUseRevenueCatPurchaseForOfferScreen(): boolean {
  const config = getIapRuntimeConfig();
  return config.mode === 'revenuecat' && isRevenueCatConfigured(config);
}
