export type {
  IapAdapter,
  SyncIapEntitlementToGameState,
} from './iapAdapterContract';

export type {
  IapDesignAuditFinding,
  IapDesignAuditResult,
  IapEntitlementId,
  IapEntitlementState,
  IapIntegrationAdapterContract,
  IapOfferCopyModel,
  IapProductDefinition,
  IapProductId,
  IapProductType,
  IapPurchaseResult,
  IapPurchaseStatus,
  IapRestoreResult,
  IapRestoreStatus,
  IapStoreProvider,
} from './iapProductTypes';

export {
  ANALYTICS_IAP_EVENTS_STAGE2,
  IAP_INTEGRATION_ADAPTER_CONTRACT,
  IAP_OFFER_COPY,
  IAP_STATUS_COPY,
  IAP_STORE_PRODUCT_IDS,
  IAP_UI_FORBIDDEN_WORDS,
  MAIN_OPERATION_ENTITLEMENT_ID,
  MAIN_OPERATION_IAP_PRODUCT_ID,
  MAIN_OPERATION_UNLOCK_BULLETS,
  MOCK_PURCHASE_ANALYTICS_BRIDGE,
} from './iapProductConstants';

export {
  getIapEntitlementForProduct,
  getIapProductById,
  getIapProductDefinitions,
  getMainOperationProductDefinition,
  isRecommendedLaunchIapProduct,
  validateIapProductDefinitions,
} from './iapProductDesign';

export {
  IAP_MONETIZATION_SYNC_CONTRACT,
  buildMockEntitlementForMainOperation,
  buildOwnedPackFromEntitlement,
  buildPurchaseResultFromEntitlement,
  buildRestoreResultFromEntitlement,
  mapEntitlementToMonetizationAccess,
  shouldUnlockMainOperationFromEntitlement,
  validateEntitlementMapping,
  type MonetizationAccessFromEntitlement,
} from './iapEntitlementMapping';

export {
  buildIapOfferCopyModel,
  buildIapPurchaseStatusCopy,
  buildIapRestoreCopy,
  checkPostPilotOfferCopyAlignment,
  validateIapOfferCopy,
  type PostPilotOfferCopyAlignment,
} from './iapOfferPresentation';

export {
  verifyIapProductDesignScenario,
  type VerifyIapProductDesignOutcome,
} from './verifyIapProductDesignScenario';

export {
  verifyIapIntegrationScenario,
  type VerifyIapIntegrationOutcome,
} from './verifyIapIntegrationScenario';

export type {
  IapRuntimeConfig,
  IapRuntimeMode,
  IapRuntimeAdapterStatus,
  IapRuntimeProduct,
  IapRuntimeProductListResult,
  IapValidationResult,
} from './iapRuntimeTypes';

export {
  getIapRuntimeConfig,
  isIapRuntimeEnabled,
  isRevenueCatConfigured,
  getRevenueCatApiKeyForPlatform,
  validateIapRuntimeConfig,
  looksLikeRevenueCatSecretKey,
  IAP_RUNTIME_ENV_DOC,
} from './iapRuntimeConfig';

export {
  initializeIapRuntime,
  fetchIapProducts,
  purchaseIapProduct,
  restoreIapPurchases,
  getActiveIapEntitlements,
  isIapAvailableForRuntime,
  shouldUseMockPurchaseForOfferScreen,
  shouldUseRevenueCatPurchaseForOfferScreen,
  getLastIapRuntimeStatus,
} from './iapRuntimeService';

export {
  configureRevenueCatIap,
  fetchRevenueCatProducts,
  purchaseRevenueCatProduct,
  restoreRevenueCatPurchases,
  getRevenueCatActiveEntitlements,
  syncRevenueCatEntitlementToMonetizationState,
  isRevenueCatAdapterConfigured,
} from './revenueCatIapAdapter';
