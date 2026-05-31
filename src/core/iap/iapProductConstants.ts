import type {
  IapIntegrationAdapterContract,
  IapProductDefinition,
  IapProductId,
} from './iapProductTypes';

export const IAP_UI_FORBIDDEN_WORDS = [
  'premium',
  'satın al',
  'kilitli',
  'paywall',
  'ödeme yap',
  'reklamsız',
  'zorunlu',
] as const;

export const MAIN_OPERATION_IAP_PRODUCT_ID: IapProductId = 'main_operation_season_1';

export const MAIN_OPERATION_ENTITLEMENT_ID = 'main_operation_full_access' as const;

export const IAP_STORE_PRODUCT_IDS = {
  ios: 'crevia.main_operation.season1',
  android: 'crevia_main_operation_season_1',
  revenueCat: 'main_operation_full_access',
} as const;

export const MAIN_OPERATION_UNLOCK_BULLETS = [
  'Geniş mahalle kapsamı',
  'Ana operasyon sezon hedefleri',
  'Kriz Masası ve kriz hamleleri',
  'Saha kaynakları ve harita sinyalleri',
  'Canlı operasyon kararları',
  'Sezon sonu değerlendirmesi',
] as const;

export const IAP_OFFER_COPY = {
  title: 'Ana Operasyon Paketi',
  subtitle: 'Sezon 1: Şehir Yönetimi',
  primaryCtaLabel: 'Ana Operasyonu Aç',
  secondaryCtaLabel: 'Sınırlı Gündemle Devam Et',
  restoreCtaLabel: 'Erişimi Geri Yükle',
  footerNote:
    'Pilot tamamlandıktan sonra sınırlı gündemle devam edebilir veya Ana Operasyon kapsamını açabilirsin.',
  accessChecking: 'Erişim kontrol ediliyor',
  accessNotFound: 'Bu hesapta aktif Ana Operasyon erişimi bulunamadı.',
  accessActive: 'Ana Operasyon erişimi aktif',
} as const;

export const IAP_STATUS_COPY = {
  restoreRestored: 'Ana Operasyon erişimi geri yüklendi.',
  restoreNotFound: 'Bu hesapta aktif Ana Operasyon erişimi bulunamadı.',
  restoreFailed: 'Erişim kontrolü tamamlanamadı. Daha sonra tekrar deneyebilirsin.',
  restorePending: 'Erişim kontrol ediliyor',
  purchaseCompleted: 'Ana Operasyon erişimi aktif',
  purchaseCancelled: 'İşlem iptal edildi.',
  purchaseFailed: 'Erişim kontrolü tamamlanamadı. Daha sonra tekrar deneyebilirsin.',
  purchasePending: 'Erişim kontrol ediliyor',
} as const;

export const IAP_INTEGRATION_ADAPTER_CONTRACT: IapIntegrationAdapterContract = {
  fetchProducts: 'fetchIapProducts',
  purchaseProduct: 'purchaseIapProduct',
  restorePurchases: 'restoreIapPurchases',
  getCustomerEntitlements: 'getActiveEntitlements',
  syncEntitlementToMonetizationState: 'syncIapEntitlementToMonetizationState',
};

export const ANALYTICS_IAP_EVENTS_STAGE2 = [
  'iap_product_list_loaded',
  'iap_purchase_started',
  'iap_purchase_completed',
  'iap_purchase_failed',
  'iap_restore_started',
  'iap_restore_completed',
  'iap_restore_not_found',
] as const;

export const MOCK_PURCHASE_ANALYTICS_BRIDGE = {
  purchaseStarted: 'main_operation_mock_purchase_started',
  purchaseCompleted: 'main_operation_mock_purchase_completed',
  restorePressed: 'access_restore_pressed',
  offerOpened: 'post_pilot_offer_opened',
  primaryCta: 'post_pilot_offer_primary_cta_pressed',
  limitedContinue: 'limited_continue_selected',
} as const;
