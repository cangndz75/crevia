import {
  IAP_UI_FORBIDDEN_WORDS,
  MAIN_OPERATION_ENTITLEMENT_ID,
  MAIN_OPERATION_IAP_PRODUCT_ID,
  MAIN_OPERATION_UNLOCK_BULLETS,
  IAP_STORE_PRODUCT_IDS,
} from './iapProductConstants';
import type {
  IapDesignAuditFinding,
  IapDesignAuditResult,
  IapEntitlementId,
  IapProductDefinition,
  IapProductId,
} from './iapProductTypes';

const MAIN_OPERATION_PRODUCT: IapProductDefinition = {
  productId: MAIN_OPERATION_IAP_PRODUCT_ID,
  entitlementId: MAIN_OPERATION_ENTITLEMENT_ID,
  type: 'one_time_unlock',
  title: 'Ana Operasyon Paketi',
  subtitle: 'Sezon 1: Şehir Yönetimi',
  description: 'Pilot sonrası geniş şehir operasyonunu açar.',
  storeProductIds: {
    ios: IAP_STORE_PRODUCT_IDS.ios,
    android: IAP_STORE_PRODUCT_IDS.android,
    revenueCat: IAP_STORE_PRODUCT_IDS.revenueCat,
  },
  unlocks: [...MAIN_OPERATION_UNLOCK_BULLETS],
  isRecommendedLaunchProduct: true,
};

export function getIapProductDefinitions(): IapProductDefinition[] {
  return [MAIN_OPERATION_PRODUCT];
}

export function getMainOperationProductDefinition(): IapProductDefinition {
  return MAIN_OPERATION_PRODUCT;
}

export function getIapProductById(
  productId: IapProductId,
): IapProductDefinition | undefined {
  return getIapProductDefinitions().find((p) => p.productId === productId);
}

export function getIapEntitlementForProduct(
  productId: IapProductId,
): IapEntitlementId {
  const product = getIapProductById(productId);
  return product?.entitlementId ?? MAIN_OPERATION_ENTITLEMENT_ID;
}

export function isRecommendedLaunchIapProduct(product: IapProductDefinition): boolean {
  return product.isRecommendedLaunchProduct && product.type === 'one_time_unlock';
}

function containsForbiddenCopy(text: string): boolean {
  const lower = text.toLowerCase();
  return IAP_UI_FORBIDDEN_WORDS.some((word) => lower.includes(word));
}

export function validateIapProductDefinitions(): IapDesignAuditResult {
  const findings: IapDesignAuditFinding[] = [];
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  const push = (
    id: string,
    severity: IapDesignAuditFinding['severity'],
    message: string,
    recommendation: string,
  ) => {
    findings.push({ id, severity, message, recommendation });
    if (severity === 'pass') passCount += 1;
    else if (severity === 'warn') warnCount += 1;
    else failCount += 1;
  };

  const products = getIapProductDefinitions();
  if (products.length === 0) {
    push('products_empty', 'fail', 'No IAP products', 'Define launch product');
  }

  const recommended = products.filter((p) => p.isRecommendedLaunchProduct);
  if (recommended.length === 1 && recommended[0]?.type === 'one_time_unlock') {
    push(
      'launch_one_time_unlock',
      'pass',
      'Single recommended one_time_unlock at launch',
      'Keep subscription for later phase',
    );
  } else {
    push(
      'launch_one_time_unlock',
      'fail',
      'Launch must recommend exactly one one_time_unlock',
      'Set isRecommendedLaunchProduct on main pack only',
    );
  }

  const subRecommended = products.filter(
    (p) => p.type === 'subscription' && p.isRecommendedLaunchProduct,
  );
  if (subRecommended.length === 0) {
    push('no_subscription_launch', 'pass', 'No subscription at launch', 'Document in docs');
  } else {
    push(
      'no_subscription_launch',
      'fail',
      'Subscription must not be launch recommended',
      'Set isRecommendedLaunchProduct false',
    );
  }

  for (const product of products) {
    if (!product.storeProductIds.ios.trim()) {
      push(`ios_id_${product.productId}`, 'fail', 'iOS store id empty', 'Set App Store product id');
    }
    if (!product.storeProductIds.android.trim()) {
      push(
        `android_id_${product.productId}`,
        'fail',
        'Android store id empty',
        'Set Play Console product id',
      );
    }
    if (product.entitlementId !== getIapEntitlementForProduct(product.productId)) {
      push(
        `entitlement_match_${product.productId}`,
        'fail',
        'Entitlement mismatch',
        'Align entitlementId',
      );
    }

    const copyBlob = [
      product.title,
      product.subtitle,
      product.description,
      ...product.unlocks,
    ].join(' ');
    if (containsForbiddenCopy(copyBlob)) {
      push(
        `forbidden_copy_${product.productId}`,
        'fail',
        'Product copy contains forbidden words',
        'Use Crevia offer language',
      );
    } else {
      push(
        `forbidden_copy_${product.productId}`,
        'pass',
        'Product copy clean',
        'Keep store-facing copy aligned',
      );
    }

    if (product.unlocks.length >= 5) {
      push(
        `unlocks_count_${product.productId}`,
        'pass',
        'Unlock bullets sufficient',
        'Update when features ship',
      );
    } else {
      push(
        `unlocks_count_${product.productId}`,
        'fail',
        'Need at least 5 unlock bullets',
        'Add full operation value bullets',
      );
    }
  }

  let health: IapDesignAuditResult['health'] = 'PASS';
  if (failCount > 0) health = 'FAIL';
  else if (warnCount > 0) health = 'WARN';

  return {
    health,
    checkedCount: findings.length,
    passCount,
    warnCount,
    failCount,
    findings,
  };
}
