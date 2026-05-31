import type {
  IapEntitlementState,
  IapProductDefinition,
  IapProductId,
  IapPurchaseResult,
  IapRestoreResult,
} from './iapProductTypes';

/**
 * Gelecek IAP SDK adapter sözleşmesi — Aşama 2’de implement edilir.
 * Bu dosyada native/network import yok.
 */
export interface IapAdapter {
  fetchIapProducts(): Promise<IapProductDefinition[]>;
  purchaseIapProduct(productId: IapProductId): Promise<IapPurchaseResult>;
  restoreIapPurchases(): Promise<IapRestoreResult>;
  getActiveEntitlements(): Promise<IapEntitlementState[]>;
}

/**
 * Entitlement sonucunu mevcut monetization store action’larına bağlar.
 * Runtime implementasyonu SDK aşamasında; şimdilik yalnızca sözleşme.
 */
export type SyncIapEntitlementToGameState = (
  entitlement: IapEntitlementState,
) => void;
