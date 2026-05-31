import type { MonetizationProductId, OwnedPack } from '@/core/monetization/monetizationTypes';

import { MAIN_OPERATION_IAP_PRODUCT_ID } from './iapProductConstants';
import type {
  IapDesignAuditFinding,
  IapDesignAuditResult,
  IapEntitlementState,
  IapPurchaseResult,
  IapRestoreResult,
} from './iapProductTypes';

export type MonetizationAccessFromEntitlement = 'full' | 'none';

export function mapEntitlementToMonetizationAccess(
  entitlement: IapEntitlementState,
): MonetizationAccessFromEntitlement {
  if (
    entitlement.isActive &&
    entitlement.entitlementId === 'main_operation_full_access'
  ) {
    return 'full';
  }
  return 'none';
}

export function shouldUnlockMainOperationFromEntitlement(
  entitlement: IapEntitlementState,
): boolean {
  return mapEntitlementToMonetizationAccess(entitlement) === 'full';
}

export function buildOwnedPackFromEntitlement(
  entitlement: IapEntitlementState,
  currentDay: number,
): OwnedPack | undefined {
  if (!shouldUnlockMainOperationFromEntitlement(entitlement)) {
    return undefined;
  }
  const productId: MonetizationProductId =
    entitlement.productId ?? MAIN_OPERATION_IAP_PRODUCT_ID;
  const source =
    entitlement.source === 'mock'
      ? 'mock_purchase'
      : entitlement.source === 'revenuecat'
        ? 'restore_placeholder'
        : 'restore_placeholder';

  return {
    productId,
    unlockedAtDay: entitlement.verifiedAtDay ?? currentDay,
    source,
  };
}

export function buildMockEntitlementForMainOperation(
  currentDay: number,
): IapEntitlementState {
  return {
    entitlementId: 'main_operation_full_access',
    isActive: true,
    source: 'mock',
    productId: MAIN_OPERATION_IAP_PRODUCT_ID,
    verifiedAtDay: currentDay,
    reason: 'mock_purchase_dev_flow',
  };
}

export function buildRestoreResultFromEntitlement(
  entitlement: IapEntitlementState,
): IapRestoreResult {
  if (!entitlement.isActive) {
    return {
      status: 'not_found',
      message: 'Bu hesapta aktif Ana Operasyon erişimi bulunamadı.',
    };
  }
  return {
    status: 'restored',
    entitlement,
    message: 'Ana Operasyon erişimi geri yüklendi.',
  };
}

export function buildPurchaseResultFromEntitlement(
  entitlement: IapEntitlementState,
): IapPurchaseResult {
  if (!entitlement.isActive) {
    return {
      status: 'failed',
      message: 'Erişim kontrolü tamamlanamadı. Daha sonra tekrar deneyebilirsin.',
    };
  }
  return {
    status: 'completed',
    entitlement,
    message: 'Ana Operasyon erişimi aktif',
  };
}

/**
 * Gelecek SDK entegrasyonu: entitlement → monetization state patch.
 * Şu an store action yazılmaz; mockPurchaseMainOperationPack korunur.
 *
 * Beklenen eşleme:
 * - mainOperationAccess: 'full'
 * - ownedPacks: main_operation_season_1
 * - gameState.pilot.fullMainOperationUnlocked: true
 * - postPilotOperation.phase: main_operation_full
 */
export const IAP_MONETIZATION_SYNC_CONTRACT = {
  mainOperationAccess: 'full',
  ownedPackProductId: MAIN_OPERATION_IAP_PRODUCT_ID,
  fullMainOperationUnlocked: true,
  postPilotPhase: 'main_operation_full',
} as const;

export function validateEntitlementMapping(): IapDesignAuditResult {
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

  const active = buildMockEntitlementForMainOperation(8);
  if (mapEntitlementToMonetizationAccess(active) === 'full') {
    push('active_maps_full', 'pass', 'Active entitlement maps to full', 'Use in SDK sync');
  } else {
    push('active_maps_full', 'fail', 'Active entitlement must map full', 'Fix mapping');
  }

  const inactive: IapEntitlementState = {
    ...active,
    isActive: false,
  };
  if (mapEntitlementToMonetizationAccess(inactive) === 'none') {
    push('inactive_maps_none', 'pass', 'Inactive entitlement maps to none', 'Limited flow preserved');
  } else {
    push('inactive_maps_none', 'fail', 'Inactive must not unlock', 'Fix mapping');
  }

  const pack = buildOwnedPackFromEntitlement(active, 8);
  if (pack?.productId === 'main_operation_season_1') {
    push('owned_pack_id', 'pass', 'Owned pack product id correct', 'Keep product id stable');
  } else {
    push('owned_pack_id', 'fail', 'Owned pack id wrong', 'Use main_operation_season_1');
  }

  if (active.source === 'mock') {
    push('mock_source', 'pass', 'Mock entitlement source', 'Dev flow unchanged');
  }

  const restored = buildRestoreResultFromEntitlement(active);
  if (restored.status === 'restored' && restored.message.length > 0) {
    push('restore_copy', 'pass', 'Restore restored copy', 'Use in UI');
  }

  const notFound = buildRestoreResultFromEntitlement(inactive);
  if (notFound.status === 'not_found') {
    push('restore_not_found', 'pass', 'Restore not_found status', 'Use in UI');
  }

  const purchase = buildPurchaseResultFromEntitlement(active);
  if (purchase.status === 'completed') {
    push('purchase_completed', 'pass', 'Purchase completed mapping', 'SDK adapter');
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
