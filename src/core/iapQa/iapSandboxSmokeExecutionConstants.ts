import {
  IAP_STORE_PRODUCT_IDS,
  MAIN_OPERATION_ENTITLEMENT_ID,
} from '@/core/iap/iapProductConstants';

import { IAP_SANDBOX_QA_ENV_KEYS } from './iapSandboxQaConstants';
import {
  REVENUECAT_DEFAULT_OFFERING_ID,
  REVENUECAT_PACKAGE_PRODUCT_ID,
} from './iapSandboxReadinessConstants';

export const IAP_SANDBOX_SMOKE_EXECUTION_DOCS_PATH =
  'docs/crevia-iap-sandbox-smoke-execution.md';

export const IAP_SANDBOX_SMOKE_MIN_CASE_COUNT = 14;

export const IAP_SANDBOX_SMOKE_BLOCKER_CASE_IDS = [
  'purchase_completed',
  'restore_existing_purchase',
  'restart_entitlement_sync',
  'entitlement_active_after_purchase',
] as const;

export const IAP_SANDBOX_SMOKE_DEV_ONLY_CASE_IDS = [
  'app_open_no_key_dev_mock',
  'app_open_no_key_production_disabled',
  'limited_mode_remains_playable',
] as const;

export const IAP_SANDBOX_SMOKE_MANUAL_OBSERVATION_FIELDS = [
  'platform',
  'device',
  'buildProfile',
  'revenueCatAppIdVisible',
  'offeringId',
  'entitlementId',
  'productId',
  'testerAccountType',
  'testCaseResult',
  'screenshotPath',
  'videoPath',
  'logs',
  'notes',
  'severity',
] as const;

export const IAP_SANDBOX_SMOKE_EXECUTION_CONSTANTS = {
  entitlementId: MAIN_OPERATION_ENTITLEMENT_ID,
  offeringId: REVENUECAT_DEFAULT_OFFERING_ID,
  packageProductId: REVENUECAT_PACKAGE_PRODUCT_ID,
  iosProductId: IAP_STORE_PRODUCT_IDS.ios,
  androidProductId: IAP_STORE_PRODUCT_IDS.android,
  iosEnvKey: IAP_SANDBOX_QA_ENV_KEYS.ios,
  androidEnvKey: IAP_SANDBOX_QA_ENV_KEYS.android,
} as const;
