import {
  IAP_STORE_PRODUCT_IDS,
  MAIN_OPERATION_ENTITLEMENT_ID,
} from '@/core/iap/iapProductConstants';

import { IAP_SANDBOX_QA_ENV_KEYS } from './iapSandboxQaConstants';
import {
  REVENUECAT_DEFAULT_OFFERING_ID,
  REVENUECAT_PACKAGE_PRODUCT_ID,
} from './iapSandboxReadinessConstants';
import type {
  CreviaIapManualSetupArea,
  CreviaIapManualSetupItem,
} from './iapManualSetupTrackerTypes';

export const IAP_MANUAL_SETUP_TRACKER_DOCS_PATH =
  'docs/crevia-revenuecat-store-manual-setup-tracker.md';

export const IAP_MANUAL_SETUP_TRACKER_MIN_AREA_COUNT = 8;

export const IAP_MANUAL_SETUP_TRACKER_AREAS: readonly CreviaIapManualSetupArea[] = [
  'revenuecat_project',
  'revenuecat_entitlement',
  'revenuecat_offering',
  'app_store_connect_iap',
  'google_play_console_product',
  'eas_build_config',
  'sandbox_test_accounts',
  'manual_verification',
] as const;

export const IAP_MANUAL_SETUP_TRACKER_AREA_LABELS: Record<CreviaIapManualSetupArea, string> = {
  revenuecat_project: 'A. RevenueCat Project',
  revenuecat_entitlement: 'B. RevenueCat Entitlement',
  revenuecat_offering: 'C. RevenueCat Offering',
  app_store_connect_iap: 'D. App Store Connect IAP',
  google_play_console_product: 'E. Google Play Console Product',
  eas_build_config: 'F. EAS / Build Config',
  sandbox_test_accounts: 'G. Sandbox Test Accounts',
  manual_verification: 'H. Manual Verification',
};

export const IAP_MANUAL_SETUP_TRACKER_PRODUCT_IDS = {
  ios: IAP_STORE_PRODUCT_IDS.ios,
  android: IAP_STORE_PRODUCT_IDS.android,
  entitlement: MAIN_OPERATION_ENTITLEMENT_ID,
  offering: REVENUECAT_DEFAULT_OFFERING_ID,
  packageProduct: REVENUECAT_PACKAGE_PRODUCT_ID,
} as const;

export const IAP_MANUAL_SETUP_TRACKER_ENV_KEYS = {
  ios: IAP_SANDBOX_QA_ENV_KEYS.ios,
  android: IAP_SANDBOX_QA_ENV_KEYS.android,
} as const;

export const IAP_MANUAL_SETUP_SECRET_PATTERNS = [
  'sk_',
  'rcsk_',
  'secret_',
  'REVENUECAT_SECRET',
] as const;

export const IAP_MANUAL_SETUP_PLACEHOLDER_PATTERNS = [
  'REPLACE_WITH',
  'YOUR_KEY_HERE',
  'placeholder',
  'appl_PLACEHOLDER',
  'goog_PLACEHOLDER',
] as const;

function item(partial: CreviaIapManualSetupItem): CreviaIapManualSetupItem {
  return partial;
}

export function buildIapManualSetupTrackerItems(): CreviaIapManualSetupItem[] {
  return [
    // A. RevenueCat Project
    item({
      id: 'rc_project.exists',
      area: 'revenuecat_project',
      title: 'RevenueCat project exists',
      status: 'pending_manual',
      platform: 'infra',
      blockerIfMissing: true,
      notes: 'Create project in RevenueCat dashboard.',
    }),
    item({
      id: 'rc_project.ios_app',
      area: 'revenuecat_project',
      title: 'App created for iOS',
      status: 'pending_manual',
      platform: 'ios',
      blockerIfMissing: true,
      notes: 'Link iOS app with App Store Connect shared secret.',
    }),
    item({
      id: 'rc_project.android_app',
      area: 'revenuecat_project',
      title: 'App created for Android',
      status: 'pending_manual',
      platform: 'android',
      blockerIfMissing: true,
      notes: 'Link Android app with Play service account JSON.',
    }),
    item({
      id: 'rc_project.public_sdk_keys',
      area: 'revenuecat_project',
      title: 'Public SDK keys available',
      status: 'pending_manual',
      platform: 'both',
      blockerIfMissing: true,
      notes: `iOS: appl_* key; Android: goog_* key.`,
    }),
    item({
      id: 'rc_project.keys_as_eas_secrets',
      area: 'revenuecat_project',
      title: 'Public SDK keys stored as EAS secrets',
      status: 'pending_manual',
      platform: 'both',
      blockerIfMissing: true,
      notes: `${IAP_SANDBOX_QA_ENV_KEYS.ios} and ${IAP_SANDBOX_QA_ENV_KEYS.android} in EAS.`,
    }),
    item({
      id: 'rc_project.no_secret_committed',
      area: 'revenuecat_project',
      title: 'No secret key committed to repo',
      status: 'pending_manual',
      platform: 'infra',
      blockerIfMissing: true,
      notes: 'sk_/rcsk_ patterns must never appear in source.',
    }),

    // B. RevenueCat Entitlement
    item({
      id: 'rc_entitlement.id_created',
      area: 'revenuecat_entitlement',
      title: `Entitlement id: ${MAIN_OPERATION_ENTITLEMENT_ID}`,
      status: 'pending_manual',
      platform: 'infra',
      blockerIfMissing: true,
      notes: 'Create entitlement in RevenueCat dashboard.',
    }),
    item({
      id: 'rc_entitlement.product_attached',
      area: 'revenuecat_entitlement',
      title: 'Entitlement attached to product',
      status: 'pending_manual',
      platform: 'both',
      blockerIfMissing: true,
      notes: 'Both iOS and Android products linked to entitlement.',
    }),
    item({
      id: 'rc_entitlement.sync_expected',
      area: 'revenuecat_entitlement',
      title: 'Entitlement sync expected on purchase',
      status: 'pending_manual',
      platform: 'both',
      blockerIfMissing: false,
      notes: 'CustomerInfo should reflect active entitlement after purchase.',
    }),

    // C. RevenueCat Offering
    item({
      id: 'rc_offering.id_created',
      area: 'revenuecat_offering',
      title: `Offering id: ${REVENUECAT_DEFAULT_OFFERING_ID}`,
      status: 'pending_manual',
      platform: 'infra',
      blockerIfMissing: true,
      notes: 'Default offering in RevenueCat dashboard.',
    }),
    item({
      id: 'rc_offering.package_mapping',
      area: 'revenuecat_offering',
      title: `Package id / package mapping (${REVENUECAT_PACKAGE_PRODUCT_ID})`,
      status: 'pending_manual',
      platform: 'both',
      blockerIfMissing: true,
      notes: 'Package contains the correct store product.',
    }),
    item({
      id: 'rc_offering.product_linked',
      area: 'revenuecat_offering',
      title: 'Product linked to offering',
      status: 'pending_manual',
      platform: 'both',
      blockerIfMissing: true,
      notes: 'Offering visible in getOfferings SDK call.',
    }),
    item({
      id: 'rc_offering.visible_in_sdk',
      area: 'revenuecat_offering',
      title: 'Offering visible in SDK',
      status: 'pending_manual',
      platform: 'both',
      blockerIfMissing: false,
      notes: 'Requires EAS dev build + real keys to verify.',
    }),

    // D. App Store Connect IAP
    item({
      id: 'asc_iap.product_id',
      area: 'app_store_connect_iap',
      title: `Product id: ${IAP_STORE_PRODUCT_IDS.ios}`,
      status: 'pending_manual',
      platform: 'ios',
      blockerIfMissing: true,
      notes: 'Non-consumable one-time unlock in App Store Connect.',
    }),
    item({
      id: 'asc_iap.product_type',
      area: 'app_store_connect_iap',
      title: 'Product type: non-consumable',
      status: 'pending_manual',
      platform: 'ios',
      blockerIfMissing: true,
      notes: 'Must be non-consumable, not subscription.',
    }),
    item({
      id: 'asc_iap.metadata',
      area: 'app_store_connect_iap',
      title: 'Product metadata (display name, description)',
      status: 'pending_manual',
      platform: 'ios',
      blockerIfMissing: false,
      notes: 'Localized display name and description.',
    }),
    item({
      id: 'asc_iap.price',
      area: 'app_store_connect_iap',
      title: 'Price tier selected',
      status: 'pending_manual',
      platform: 'ios',
      blockerIfMissing: true,
      notes: 'Price tier active for sandbox testing.',
    }),
    item({
      id: 'asc_iap.review_screenshot',
      area: 'app_store_connect_iap',
      title: 'Review screenshot uploaded',
      status: 'pending_manual',
      platform: 'ios',
      blockerIfMissing: false,
      notes: 'Required for App Review; can be placeholder for sandbox.',
    }),
    item({
      id: 'asc_iap.cleared_for_sale',
      area: 'app_store_connect_iap',
      title: 'Cleared for sale / sandbox availability',
      status: 'pending_manual',
      platform: 'ios',
      blockerIfMissing: true,
      notes: 'Product must be available in sandbox environment.',
    }),

    // E. Google Play Console Product
    item({
      id: 'play_product.product_id',
      area: 'google_play_console_product',
      title: `Product id: ${IAP_STORE_PRODUCT_IDS.android}`,
      status: 'pending_manual',
      platform: 'android',
      blockerIfMissing: true,
      notes: 'Managed product in Google Play Console.',
    }),
    item({
      id: 'play_product.classification',
      area: 'google_play_console_product',
      title: 'Managed product / one-time (not subscription)',
      status: 'pending_manual',
      platform: 'android',
      blockerIfMissing: true,
      notes: 'In-app product, not subscription.',
    }),
    item({
      id: 'play_product.metadata',
      area: 'google_play_console_product',
      title: 'Product metadata (title, description)',
      status: 'pending_manual',
      platform: 'android',
      blockerIfMissing: false,
      notes: 'Localized title and description.',
    }),
    item({
      id: 'play_product.price',
      area: 'google_play_console_product',
      title: 'Price active',
      status: 'pending_manual',
      platform: 'android',
      blockerIfMissing: true,
      notes: 'Default price set and active.',
    }),
    item({
      id: 'play_product.active_status',
      area: 'google_play_console_product',
      title: 'Product active status',
      status: 'pending_manual',
      platform: 'android',
      blockerIfMissing: true,
      notes: 'Product must be active for license testing.',
    }),
    item({
      id: 'play_product.license_tester',
      area: 'google_play_console_product',
      title: 'License tester configured',
      status: 'pending_manual',
      platform: 'android',
      blockerIfMissing: true,
      notes: 'Gmail added to Play Console license testers.',
    }),

    // F. EAS / Build Config
    item({
      id: 'eas_config.ios_api_key_secret',
      area: 'eas_build_config',
      title: `${IAP_SANDBOX_QA_ENV_KEYS.ios} EAS secret`,
      status: 'pending_manual',
      platform: 'ios',
      blockerIfMissing: true,
      notes: 'appl_* key stored as EAS secret.',
    }),
    item({
      id: 'eas_config.android_api_key_secret',
      area: 'eas_build_config',
      title: `${IAP_SANDBOX_QA_ENV_KEYS.android} EAS secret`,
      status: 'pending_manual',
      platform: 'android',
      blockerIfMissing: true,
      notes: 'goog_* key stored as EAS secret.',
    }),
    item({
      id: 'eas_config.dev_build_profile',
      area: 'eas_build_config',
      title: 'Development build profile configured',
      status: 'pending_manual',
      platform: 'both',
      blockerIfMissing: true,
      notes: 'eas.json development profile with native modules.',
    }),
    item({
      id: 'eas_config.billing_permission',
      area: 'eas_build_config',
      title: 'Native billing permission check',
      status: 'pending_manual',
      platform: 'android',
      blockerIfMissing: false,
      notes: 'com.android.vending.BILLING in manifest after prebuild.',
    }),
    item({
      id: 'eas_config.bundle_package_alignment',
      area: 'eas_build_config',
      title: 'Bundle id / package name alignment',
      status: 'pending_manual',
      platform: 'both',
      blockerIfMissing: true,
      notes: 'app.json bundle id matches store app entries.',
    }),

    // G. Sandbox Test Accounts
    item({
      id: 'sandbox_accounts.ios_tester',
      area: 'sandbox_test_accounts',
      title: 'iOS sandbox tester account',
      status: 'pending_manual',
      platform: 'ios',
      blockerIfMissing: true,
      notes: 'Sandbox Apple ID created and configured on device.',
    }),
    item({
      id: 'sandbox_accounts.android_tester',
      area: 'sandbox_test_accounts',
      title: 'Android license tester account',
      status: 'pending_manual',
      platform: 'android',
      blockerIfMissing: true,
      notes: 'Gmail added to license testers; internal track build uploaded.',
    }),
    item({
      id: 'sandbox_accounts.test_notes',
      area: 'sandbox_test_accounts',
      title: 'Test account notes documented',
      status: 'pending_manual',
      platform: 'both',
      blockerIfMissing: false,
      notes: 'Account emails/types recorded (not in repo).',
    }),
    item({
      id: 'sandbox_accounts.restore_state',
      area: 'sandbox_test_accounts',
      title: 'Restore test account state documented',
      status: 'pending_manual',
      platform: 'both',
      blockerIfMissing: false,
      notes: 'How to reset sandbox purchase state for re-testing.',
    }),

    // H. Manual Verification
    item({
      id: 'manual_verify.product_metadata_loads',
      area: 'manual_verification',
      title: 'Product metadata loads on device',
      status: 'pending_manual',
      platform: 'both',
      blockerIfMissing: false,
      notes: 'getOfferings returns product with title/price.',
    }),
    item({
      id: 'manual_verify.purchase_flow_starts',
      area: 'manual_verification',
      title: 'Purchase flow starts on device',
      status: 'pending_manual',
      platform: 'both',
      blockerIfMissing: false,
      notes: 'Store sheet appears after CTA tap.',
    }),
    item({
      id: 'manual_verify.restore_flow_starts',
      area: 'manual_verification',
      title: 'Restore flow starts on device',
      status: 'pending_manual',
      platform: 'both',
      blockerIfMissing: false,
      notes: 'restorePurchases returns without crash.',
    }),
    item({
      id: 'manual_verify.entitlement_sync',
      area: 'manual_verification',
      title: 'Entitlement sync after purchase',
      status: 'pending_manual',
      platform: 'both',
      blockerIfMissing: false,
      notes: `${MAIN_OPERATION_ENTITLEMENT_ID} active in CustomerInfo.`,
    }),
    item({
      id: 'manual_verify.offline_fallback',
      area: 'manual_verification',
      title: 'Offline fallback graceful',
      status: 'pending_manual',
      platform: 'both',
      blockerIfMissing: false,
      notes: 'Airplane mode → controlled error, no crash.',
    }),
    item({
      id: 'manual_verify.observations_recorded',
      area: 'manual_verification',
      title: 'Observations recorded',
      status: 'pending_manual',
      platform: 'both',
      blockerIfMissing: false,
      notes: 'Manual test results documented in smoke execution docs.',
    }),
  ];
}
