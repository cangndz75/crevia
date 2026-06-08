import {
  IAP_PRODUCT_COPY_DOCS_PATH,
  IAP_PRODUCT_COPY_PACK_ID,
  IAP_PRODUCT_COPY_REVIEW_NOTES,
} from '@/core/iapProductCopy';
import {
  IAP_PRODUCT_COPY_PRODUCT_DESCRIPTION_OPTIONS_EN,
  IAP_PRODUCT_COPY_PRODUCT_DESCRIPTION_OPTIONS_TR,
  IAP_PRODUCT_COPY_PRODUCT_NAME_OPTIONS_EN,
  IAP_PRODUCT_COPY_PRODUCT_NAME_OPTIONS_TR,
} from '@/core/iapProductCopy/iapProductCopyConstants';
import { runIapProductCopyAudit } from '@/core/iapProductCopy/iapProductCopyAudit';

import { IAP_SANDBOX_QA_ENV_KEYS } from './iapSandboxQaConstants';
import type {
  IapDashboardBlockerMapping,
  IapDashboardChecklistItem,
  IapDashboardEntryChecklist,
  IapDashboardEntryChecklistAuditResult,
  IapDashboardEntryChecklistStatus,
  IapDashboardEvidenceRequirement,
  IapOfferScreenTrustQaItem,
  IapReviewNotePlaceholderMapping,
  IapSandboxTestMatrixCase,
} from './iapManualSetupTrackerTypes';

export const IAP_DASHBOARD_ENTRY_CHECKLIST_ID = 'crevia_iap_dashboard_entry_v1';

export const IAP_DASHBOARD_ENTRY_CHECKLIST_DOCS_PATH =
  'docs/crevia-iap-dashboard-entry-checklist.md';

export const IAP_DASHBOARD_ENTRY_PLACEHOLDERS = {
  appStoreProductId: '[APP_STORE_PRODUCT_ID_PENDING]',
  playProductId: '[PLAY_PRODUCT_ID_PENDING]',
  revenueCatEntitlement: '[REVENUECAT_ENTITLEMENT_PENDING]',
  revenueCatOffering: '[REVENUECAT_OFFERING_ID_PENDING]',
  revenueCatPackage: '[REVENUECAT_PACKAGE_ID_PENDING]',
  sandboxTestAccount: '[SANDBOX_TEST_ACCOUNT_PENDING]',
  reviewerDay8Access: '[REVIEWER_DAY8_ACCESS_METHOD_PENDING]',
  priceTier: '[PRICE_TIER_PENDING]',
} as const;

function item(partial: IapDashboardChecklistItem): IapDashboardChecklistItem {
  return partial;
}

function summarizePlatformStatus(
  items: IapDashboardChecklistItem[],
): IapDashboardChecklistItem['status'] {
  if (items.some((i) => i.status === 'blocked')) return 'blocked';
  if (items.some((i) => i.status === 'verified')) return 'in_progress';
  if (items.every((i) => i.status === 'not_applicable')) return 'not_applicable';
  if (items.some((i) => i.status === 'in_progress' || i.status === 'entered')) {
    return 'in_progress';
  }
  return 'pending';
}

export function buildIapDashboardAppStoreItems(): IapDashboardChecklistItem[] {
  const nameTr = IAP_PRODUCT_COPY_PRODUCT_NAME_OPTIONS_TR[0];
  const nameEn = IAP_PRODUCT_COPY_PRODUCT_NAME_OPTIONS_EN[0];
  const descTr = IAP_PRODUCT_COPY_PRODUCT_DESCRIPTION_OPTIONS_TR[0];
  const descEn = IAP_PRODUCT_COPY_PRODUCT_DESCRIPTION_OPTIONS_EN[0];

  return [
    item({
      id: 'asc.product_type',
      platform: 'app_store',
      fieldTarget: 'product_type',
      valueSource: 'manual_dashboard',
      requiredEvidenceType: 'manual_note',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction:
        'Confirm product type in App Store Connect — code expects non-consumable one-time unlock; manual decision required before marking entered.',
      fakePassRisk: true,
    }),
    item({
      id: 'asc.product_id',
      platform: 'app_store',
      fieldTarget: 'product_id',
      valueSource: 'placeholder',
      requiredEvidenceType: 'store_console',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: 'Create product in ASC and record real product ID — do not invent in repo.',
      fakePassRisk: true,
      placeholderToken: IAP_DASHBOARD_ENTRY_PLACEHOLDERS.appStoreProductId,
    }),
    item({
      id: 'asc.reference_name',
      platform: 'app_store',
      fieldTarget: 'reference_name',
      valueSource: 'iap_product_copy_pack',
      requiredEvidenceType: 'store_console',
      status: 'in_progress',
      blocksPublicLaunch: false,
      blocksInternalDeviceTest: false,
      nextAction: 'Paste internal reference name when creating ASC product.',
      fakePassRisk: false,
      copyHint: 'Crevia Main Operation Season 1',
    }),
    item({
      id: 'asc.product_name_tr',
      platform: 'app_store',
      fieldTarget: 'product_name_tr',
      valueSource: 'iap_product_copy_pack',
      requiredEvidenceType: 'store_console',
      status: 'in_progress',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: false,
      nextAction: `Paste TR display name from ${IAP_PRODUCT_COPY_DOCS_PATH}.`,
      fakePassRisk: false,
      copyHint: nameTr,
    }),
    item({
      id: 'asc.product_name_en',
      platform: 'app_store',
      fieldTarget: 'product_name_en',
      valueSource: 'iap_product_copy_pack',
      requiredEvidenceType: 'store_console',
      status: 'in_progress',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: false,
      nextAction: `Paste EN display name from ${IAP_PRODUCT_COPY_DOCS_PATH}.`,
      fakePassRisk: false,
      copyHint: nameEn,
    }),
    item({
      id: 'asc.product_description_tr',
      platform: 'app_store',
      fieldTarget: 'product_description_tr',
      valueSource: 'iap_product_copy_pack',
      requiredEvidenceType: 'store_console',
      status: 'in_progress',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: false,
      nextAction: 'Paste TR product description from IAP product copy pack.',
      fakePassRisk: false,
      copyHint: descTr,
    }),
    item({
      id: 'asc.product_description_en',
      platform: 'app_store',
      fieldTarget: 'product_description_en',
      valueSource: 'iap_product_copy_pack',
      requiredEvidenceType: 'store_console',
      status: 'in_progress',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: false,
      nextAction: 'Paste EN product description from IAP product copy pack.',
      fakePassRisk: false,
      copyHint: descEn,
    }),
    item({
      id: 'asc.price_tier',
      platform: 'app_store',
      fieldTarget: 'price_tier',
      valueSource: 'placeholder',
      requiredEvidenceType: 'store_console',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: 'Select price tier in ASC — never hardcode price in app copy.',
      fakePassRisk: true,
      placeholderToken: IAP_DASHBOARD_ENTRY_PLACEHOLDERS.priceTier,
    }),
    item({
      id: 'asc.localization',
      platform: 'app_store',
      fieldTarget: 'localization',
      valueSource: 'manual_dashboard',
      requiredEvidenceType: 'store_console',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: false,
      nextAction: 'Add TR + EN localizations for product name and description.',
      fakePassRisk: true,
    }),
    item({
      id: 'asc.review_screenshot',
      platform: 'app_store',
      fieldTarget: 'review_screenshot',
      valueSource: 'manual_dashboard',
      requiredEvidenceType: 'screenshot',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: false,
      nextAction: 'Upload IAP review screenshot if required by ASC.',
      fakePassRisk: true,
    }),
    item({
      id: 'asc.review_note',
      platform: 'app_store',
      fieldTarget: 'review_note',
      valueSource: 'iap_product_copy_pack',
      requiredEvidenceType: 'manual_note',
      status: 'in_progress',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: false,
      nextAction: 'Paste TR/EN review notes after replacing placeholders with real values.',
      fakePassRisk: true,
      copyHint: IAP_PRODUCT_COPY_REVIEW_NOTES.tr.slice(0, 120),
    }),
    item({
      id: 'asc.sandbox_tester',
      platform: 'app_store',
      fieldTarget: 'sandbox_tester',
      valueSource: 'placeholder',
      requiredEvidenceType: 'manual_note',
      status: 'pending',
      blocksPublicLaunch: false,
      blocksInternalDeviceTest: true,
      nextAction: 'Create sandbox Apple ID — do not commit credentials to repo.',
      fakePassRisk: true,
      placeholderToken: IAP_DASHBOARD_ENTRY_PLACEHOLDERS.sandboxTestAccount,
    }),
    item({
      id: 'asc.product_status',
      platform: 'app_store',
      fieldTarget: 'product_status',
      valueSource: 'store_console',
      requiredEvidenceType: 'store_console',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: 'Attach ASC product status screenshot before marking verified.',
      fakePassRisk: true,
    }),
    item({
      id: 'asc.ready_to_submit',
      platform: 'app_store',
      fieldTarget: 'ready_to_submit',
      valueSource: 'store_console',
      requiredEvidenceType: 'store_console',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: false,
      nextAction: 'Product must be cleared for sale / sandbox before sandbox purchase test.',
      fakePassRisk: true,
    }),
  ];
}

export function buildIapDashboardPlayStoreItems(): IapDashboardChecklistItem[] {
  const nameTr = IAP_PRODUCT_COPY_PRODUCT_NAME_OPTIONS_TR[0];
  const nameEn = IAP_PRODUCT_COPY_PRODUCT_NAME_OPTIONS_EN[0];
  const descTr = IAP_PRODUCT_COPY_PRODUCT_DESCRIPTION_OPTIONS_TR[0];
  const descEn = IAP_PRODUCT_COPY_PRODUCT_DESCRIPTION_OPTIONS_EN[0];

  return [
    item({
      id: 'play.product_type',
      platform: 'play_console',
      fieldTarget: 'product_type',
      valueSource: 'manual_dashboard',
      requiredEvidenceType: 'manual_note',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction:
        'Confirm in-app product vs subscription in Play Console — code expects managed one-time product.',
      fakePassRisk: true,
    }),
    item({
      id: 'play.product_id',
      platform: 'play_console',
      fieldTarget: 'product_id',
      valueSource: 'placeholder',
      requiredEvidenceType: 'store_console',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: 'Create Play product and record real product ID — do not invent in repo.',
      fakePassRisk: true,
      placeholderToken: IAP_DASHBOARD_ENTRY_PLACEHOLDERS.playProductId,
    }),
    item({
      id: 'play.product_name_tr',
      platform: 'play_console',
      fieldTarget: 'product_name_tr',
      valueSource: 'iap_product_copy_pack',
      requiredEvidenceType: 'store_console',
      status: 'in_progress',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: false,
      nextAction: 'Paste TR product title from IAP product copy pack.',
      fakePassRisk: false,
      copyHint: nameTr,
    }),
    item({
      id: 'play.product_name_en',
      platform: 'play_console',
      fieldTarget: 'product_name_en',
      valueSource: 'iap_product_copy_pack',
      requiredEvidenceType: 'store_console',
      status: 'in_progress',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: false,
      nextAction: 'Paste EN product title from IAP product copy pack.',
      fakePassRisk: false,
      copyHint: nameEn,
    }),
    item({
      id: 'play.product_description_tr',
      platform: 'play_console',
      fieldTarget: 'product_description_tr',
      valueSource: 'iap_product_copy_pack',
      requiredEvidenceType: 'store_console',
      status: 'in_progress',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: false,
      nextAction: 'Paste TR description from IAP product copy pack.',
      fakePassRisk: false,
      copyHint: descTr,
    }),
    item({
      id: 'play.product_description_en',
      platform: 'play_console',
      fieldTarget: 'product_description_en',
      valueSource: 'iap_product_copy_pack',
      requiredEvidenceType: 'store_console',
      status: 'in_progress',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: false,
      nextAction: 'Paste EN description from IAP product copy pack.',
      fakePassRisk: false,
      copyHint: descEn,
    }),
    item({
      id: 'play.price_tier',
      platform: 'play_console',
      fieldTarget: 'price_tier',
      valueSource: 'placeholder',
      requiredEvidenceType: 'store_console',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: 'Set default price in Play Console — store provides localized price at runtime.',
      fakePassRisk: true,
      placeholderToken: IAP_DASHBOARD_ENTRY_PLACEHOLDERS.priceTier,
    }),
    item({
      id: 'play.active_status',
      platform: 'play_console',
      fieldTarget: 'product_status',
      valueSource: 'store_console',
      requiredEvidenceType: 'store_console',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: 'Product must be Active — attach console screenshot as evidence.',
      fakePassRisk: true,
    }),
    item({
      id: 'play.country_availability',
      platform: 'play_console',
      fieldTarget: 'country_availability',
      valueSource: 'manual_dashboard',
      requiredEvidenceType: 'store_console',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: false,
      nextAction: 'Confirm country availability matches launch plan.',
      fakePassRisk: true,
    }),
    item({
      id: 'play.license_tester',
      platform: 'play_console',
      fieldTarget: 'license_tester',
      valueSource: 'placeholder',
      requiredEvidenceType: 'manual_note',
      status: 'pending',
      blocksPublicLaunch: false,
      blocksInternalDeviceTest: true,
      nextAction: 'Add license tester Gmail + internal test track build.',
      fakePassRisk: true,
      placeholderToken: IAP_DASHBOARD_ENTRY_PLACEHOLDERS.sandboxTestAccount,
    }),
    item({
      id: 'play.build_package_link',
      platform: 'play_console',
      fieldTarget: 'build_package_link',
      valueSource: 'manual_dashboard',
      requiredEvidenceType: 'store_console',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: 'Link product to build on internal/closed test track.',
      fakePassRisk: true,
    }),
    item({
      id: 'play.review_note',
      platform: 'play_console',
      fieldTarget: 'review_note',
      valueSource: 'iap_product_copy_pack',
      requiredEvidenceType: 'manual_note',
      status: 'in_progress',
      blocksPublicLaunch: false,
      blocksInternalDeviceTest: false,
      nextAction: 'Use EN review notes if Play review requests IAP explanation.',
      fakePassRisk: true,
      copyHint: IAP_PRODUCT_COPY_REVIEW_NOTES.en.slice(0, 120),
    }),
  ];
}

export function buildIapDashboardRevenueCatItems(): IapDashboardChecklistItem[] {
  return [
    item({
      id: 'rc.project_created',
      platform: 'revenuecat',
      fieldTarget: 'app_bundle_id',
      valueSource: 'manual_dashboard',
      requiredEvidenceType: 'dashboard_event',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: 'Create RevenueCat project and link iOS + Android apps.',
      fakePassRisk: true,
    }),
    item({
      id: 'rc.ios_app_configured',
      platform: 'revenuecat',
      fieldTarget: 'store_product_link',
      valueSource: 'revenuecat_dashboard',
      requiredEvidenceType: 'screenshot',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: 'Configure iOS app with ASC shared secret / App Store Connect API.',
      fakePassRisk: true,
    }),
    item({
      id: 'rc.android_app_configured',
      platform: 'revenuecat',
      fieldTarget: 'store_product_link',
      valueSource: 'revenuecat_dashboard',
      requiredEvidenceType: 'screenshot',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: 'Configure Android app with Play service account JSON.',
      fakePassRisk: true,
    }),
    item({
      id: 'rc.public_sdk_keys',
      platform: 'revenuecat',
      fieldTarget: 'public_sdk_keys',
      valueSource: 'eas_env',
      requiredEvidenceType: 'manual_note',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: `Store appl_/goog_ keys in EAS: ${IAP_SANDBOX_QA_ENV_KEYS.ios}, ${IAP_SANDBOX_QA_ENV_KEYS.android}.`,
      fakePassRisk: true,
    }),
    item({
      id: 'rc.entitlement_id',
      platform: 'revenuecat',
      fieldTarget: 'entitlement_id',
      valueSource: 'placeholder',
      requiredEvidenceType: 'dashboard_event',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: 'Create entitlement in RC dashboard — do not invent ID in repo.',
      fakePassRisk: true,
      placeholderToken: IAP_DASHBOARD_ENTRY_PLACEHOLDERS.revenueCatEntitlement,
    }),
    item({
      id: 'rc.offering_id',
      platform: 'revenuecat',
      fieldTarget: 'offering_id',
      valueSource: 'placeholder',
      requiredEvidenceType: 'dashboard_event',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: 'Create default offering — attach dashboard screenshot as evidence.',
      fakePassRisk: true,
      placeholderToken: IAP_DASHBOARD_ENTRY_PLACEHOLDERS.revenueCatOffering,
    }),
    item({
      id: 'rc.package_id',
      platform: 'revenuecat',
      fieldTarget: 'package_id',
      valueSource: 'placeholder',
      requiredEvidenceType: 'dashboard_event',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: 'Map package to store products in offering.',
      fakePassRisk: true,
      placeholderToken: IAP_DASHBOARD_ENTRY_PLACEHOLDERS.revenueCatPackage,
    }),
    item({
      id: 'rc.app_store_product_attached',
      platform: 'revenuecat',
      fieldTarget: 'store_product_link',
      valueSource: 'store_console',
      requiredEvidenceType: 'screenshot',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: 'Attach ASC product to RC entitlement after real product ID exists.',
      fakePassRisk: true,
    }),
    item({
      id: 'rc.play_product_attached',
      platform: 'revenuecat',
      fieldTarget: 'store_product_link',
      valueSource: 'store_console',
      requiredEvidenceType: 'screenshot',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: 'Attach Play product to RC entitlement after real product ID exists.',
      fakePassRisk: true,
    }),
    item({
      id: 'rc.current_offering_selected',
      platform: 'revenuecat',
      fieldTarget: 'offering_id',
      valueSource: 'revenuecat_dashboard',
      requiredEvidenceType: 'dashboard_event',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: 'Set current offering in RC project settings.',
      fakePassRisk: true,
    }),
    item({
      id: 'rc.purchase_event_visible',
      platform: 'revenuecat',
      fieldTarget: 'purchase_event',
      valueSource: 'revenuecat_dashboard',
      requiredEvidenceType: 'purchase_log',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: 'Sandbox purchase must show in RC customer/event view — purchase_log evidence required.',
      fakePassRisk: true,
    }),
    item({
      id: 'rc.restore_event_visible',
      platform: 'revenuecat',
      fieldTarget: 'restore_event',
      valueSource: 'revenuecat_dashboard',
      requiredEvidenceType: 'purchase_log',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: true,
      nextAction: 'Restore must show in RC — purchase_log / dashboard_event evidence required.',
      fakePassRisk: true,
    }),
  ];
}

export function buildIapDashboardSandboxTesterItems(): IapDashboardChecklistItem[] {
  return [
    item({
      id: 'sandbox.ios_tester',
      platform: 'shared',
      fieldTarget: 'sandbox_tester',
      valueSource: 'placeholder',
      requiredEvidenceType: 'manual_note',
      status: 'pending',
      blocksPublicLaunch: false,
      blocksInternalDeviceTest: true,
      nextAction: 'Document iOS sandbox Apple ID (not in repo).',
      fakePassRisk: true,
      placeholderToken: IAP_DASHBOARD_ENTRY_PLACEHOLDERS.sandboxTestAccount,
    }),
    item({
      id: 'sandbox.android_tester',
      platform: 'shared',
      fieldTarget: 'sandbox_tester',
      valueSource: 'placeholder',
      requiredEvidenceType: 'manual_note',
      status: 'pending',
      blocksPublicLaunch: false,
      blocksInternalDeviceTest: true,
      nextAction: 'Document Play license tester Gmail (not in repo).',
      fakePassRisk: true,
      placeholderToken: IAP_DASHBOARD_ENTRY_PLACEHOLDERS.sandboxTestAccount,
    }),
    item({
      id: 'sandbox.reviewer_day8_access',
      platform: 'shared',
      fieldTarget: 'review_note',
      valueSource: 'placeholder',
      requiredEvidenceType: 'manual_note',
      status: 'pending',
      blocksPublicLaunch: true,
      blocksInternalDeviceTest: false,
      nextAction: 'Document how App Review reaches Day 8 / main operation preview.',
      fakePassRisk: true,
      placeholderToken: IAP_DASHBOARD_ENTRY_PLACEHOLDERS.reviewerDay8Access,
    }),
  ];
}

export function buildIapReviewNotePlaceholderMapping(): IapReviewNotePlaceholderMapping[] {
  return [
    {
      placeholder: IAP_DASHBOARD_ENTRY_PLACEHOLDERS.appStoreProductId,
      checklistItemId: 'asc.product_id',
      readyForReview: false,
      blocksPublicLaunch: true,
      nextAction: 'Replace with real ASC product ID + store_console screenshot.',
    },
    {
      placeholder: IAP_DASHBOARD_ENTRY_PLACEHOLDERS.playProductId,
      checklistItemId: 'play.product_id',
      readyForReview: false,
      blocksPublicLaunch: true,
      nextAction: 'Replace with real Play product ID + store_console screenshot.',
    },
    {
      placeholder: IAP_DASHBOARD_ENTRY_PLACEHOLDERS.revenueCatEntitlement,
      checklistItemId: 'rc.entitlement_id',
      readyForReview: false,
      blocksPublicLaunch: true,
      nextAction: 'Replace with real RC entitlement ID + dashboard screenshot.',
    },
    {
      placeholder: IAP_DASHBOARD_ENTRY_PLACEHOLDERS.sandboxTestAccount,
      checklistItemId: 'sandbox.ios_tester',
      readyForReview: false,
      blocksPublicLaunch: false,
      nextAction: 'Provide sandbox tester to App Review via secure channel — never commit to repo.',
    },
    {
      placeholder: IAP_DASHBOARD_ENTRY_PLACEHOLDERS.reviewerDay8Access,
      checklistItemId: 'sandbox.reviewer_day8_access',
      readyForReview: false,
      blocksPublicLaunch: true,
      nextAction: 'Document dev progression or save slot method for reviewer Day 8 access.',
    },
  ];
}

export function buildIapSandboxTestMatrix(): IapSandboxTestMatrixCase[] {
  return [
    {
      id: 'sandbox.ios_purchase_success',
      platform: 'ios',
      title: 'iOS purchase success',
      precondition: 'ASC product created, RC configured, sandbox Apple ID on device.',
      steps: [
        'Launch EAS dev build on iOS device.',
        'Complete pilot to post-pilot offer.',
        'Tap purchase CTA and complete sandbox transaction.',
      ],
      expectedResult: 'Main Operation access unlocks; calm success copy shown.',
      requiredEvidence: ['purchase_log', 'screenshot'],
      relatedBlocker: 'iap_sandbox_purchase_test',
      passCriteria: 'purchase_log + entitlement active in app state.',
      failCriteria: 'Crash, silent failure, or pay-to-win copy shown.',
    },
    {
      id: 'sandbox.ios_restore_success',
      platform: 'ios',
      title: 'iOS restore success',
      precondition: 'Prior sandbox purchase on same Apple ID.',
      steps: ['Open offer screen.', 'Tap restore.', 'Wait for entitlement sync.'],
      expectedResult: 'Restore success copy; Main Operation access active.',
      requiredEvidence: ['purchase_log', 'dashboard_event'],
      relatedBlocker: 'iap_restore_test',
      passCriteria: 'Restore completes without crash; access reflected.',
      failCriteria: 'False success without entitlement or blaming copy.',
    },
    {
      id: 'sandbox.ios_cancel_purchase',
      platform: 'ios',
      title: 'iOS cancel purchase',
      precondition: 'Offer screen reachable.',
      steps: ['Start purchase.', 'Cancel App Store sheet.'],
      expectedResult: 'Cancelled copy; pilot/limited flow still available.',
      requiredEvidence: ['manual_note', 'screenshot'],
      relatedBlocker: 'iap_sandbox_purchase_test',
      passCriteria: 'Calm cancelled state; no FOMO pressure.',
      failCriteria: 'Crash or locked-out player messaging.',
    },
    {
      id: 'sandbox.ios_purchase_failed',
      platform: 'ios',
      title: 'iOS failed / network unavailable',
      precondition: 'Airplane mode or revoked sandbox account.',
      steps: ['Attempt purchase or restore offline.'],
      expectedResult: 'Failed copy with retry guidance; no crash.',
      requiredEvidence: ['manual_note'],
      relatedBlocker: 'iap_sandbox_purchase_test',
      passCriteria: 'Controlled error state from copy pack.',
      failCriteria: 'Unhandled exception or infinite spinner.',
    },
    {
      id: 'sandbox.android_purchase_success',
      platform: 'android',
      title: 'Android purchase success',
      precondition: 'Play product active, license tester, internal track build.',
      steps: [
        'Launch EAS dev build on Android.',
        'Reach post-pilot offer.',
        'Complete Play billing flow.',
      ],
      expectedResult: 'Main Operation access unlocks.',
      requiredEvidence: ['purchase_log', 'screenshot'],
      relatedBlocker: 'iap_sandbox_purchase_test',
      passCriteria: 'purchase_log + entitlement active.',
      failCriteria: 'Product not found or crash.',
    },
    {
      id: 'sandbox.android_restore_sync',
      platform: 'android',
      title: 'Android restore / sync purchase',
      precondition: 'Prior purchase on license tester account.',
      steps: ['Tap restore on offer screen.'],
      expectedResult: 'Access restored via Play account sync.',
      requiredEvidence: ['purchase_log', 'dashboard_event'],
      relatedBlocker: 'iap_restore_test',
      passCriteria: 'Entitlement active after restore.',
      failCriteria: 'False positive restore message.',
    },
    {
      id: 'sandbox.android_cancel_purchase',
      platform: 'android',
      title: 'Android cancel purchase',
      precondition: 'Offer screen reachable.',
      steps: ['Start purchase.', 'Cancel Play billing sheet.'],
      expectedResult: 'Cancelled copy; limited mode still safe.',
      requiredEvidence: ['manual_note'],
      relatedBlocker: 'iap_sandbox_purchase_test',
      passCriteria: 'Calm cancelled messaging.',
      failCriteria: 'Player-blaming or FOMO copy.',
    },
    {
      id: 'sandbox.android_purchase_failed',
      platform: 'android',
      title: 'Android failed / network unavailable',
      precondition: 'Offline or billing unavailable.',
      steps: ['Attempt purchase while offline.'],
      expectedResult: 'Failed copy; app remains usable in limited mode.',
      requiredEvidence: ['manual_note'],
      relatedBlocker: 'iap_sandbox_purchase_test',
      passCriteria: 'No crash; copy pack failed state shown.',
      failCriteria: 'Hard lock or unhandled error.',
    },
    {
      id: 'sandbox.rc_entitlement_active',
      platform: 'both',
      title: 'RevenueCat entitlement active after purchase',
      precondition: 'RC dashboard access after purchase.',
      steps: ['Complete sandbox purchase.', 'Open RC customer view.'],
      expectedResult: 'Entitlement shows active for test user.',
      requiredEvidence: ['dashboard_event', 'screenshot'],
      relatedBlocker: 'revenuecat_entitlement_config',
      passCriteria: 'RC dashboard matches in-app unlock.',
      failCriteria: 'Entitlement missing in RC after successful purchase.',
    },
    {
      id: 'sandbox.app_state_unlock',
      platform: 'both',
      title: 'App state unlock reflects entitlement',
      precondition: 'Successful purchase or restore.',
      steps: ['Return to Hub after unlock.', 'Verify main operation scope available.'],
      expectedResult: 'Gameplay state matches monetization entitlement.',
      requiredEvidence: ['screenshot', 'manual_note'],
      relatedBlocker: 'iap_sandbox_purchase_test',
      passCriteria: 'Main operation surfaces unlock without pay-to-win messaging.',
      failCriteria: 'UI shows unlocked but state unchanged.',
    },
    {
      id: 'sandbox.limited_mode_safe_cancel',
      platform: 'both',
      title: 'Limited mode safe if purchase cancelled',
      precondition: 'Post-pilot without purchase.',
      steps: ['Cancel purchase.', 'Choose limited continue.'],
      expectedResult: 'Limited agenda remains playable; no punishment copy.',
      requiredEvidence: ['manual_note', 'screenshot'],
      relatedBlocker: 'iap_sandbox_purchase_test',
      passCriteria: 'Limited/light copy consistent with copy pack.',
      failCriteria: 'Contradictory or pressuring copy.',
    },
    {
      id: 'sandbox.restore_no_purchase',
      platform: 'both',
      title: 'Restore with no purchase shows safe message',
      precondition: 'Fresh sandbox account with no prior purchase.',
      steps: ['Tap restore on offer screen.'],
      expectedResult: 'Not-found / calm message; no crash.',
      requiredEvidence: ['manual_note'],
      relatedBlocker: 'iap_restore_test',
      passCriteria: 'Safe restore-not-found copy.',
      failCriteria: 'False unlock or error crash.',
    },
  ];
}

export function buildIapOfferScreenTrustQaChecklist(): IapOfferScreenTrustQaItem[] {
  return [
    {
      id: 'trust.price_from_store',
      rule: 'Product price comes from store at runtime — not hardcoded in UI.',
      status: 'pending_manual',
      blocksPublicLaunch: true,
    },
    {
      id: 'trust.restore_visible',
      rule: 'Restore CTA visible on offer screen.',
      status: 'pending_manual',
      blocksPublicLaunch: true,
    },
    {
      id: 'trust.calm_cancel_fail',
      rule: 'Cancel and failed purchase states use calm copy from IAP product copy pack.',
      status: 'pending_manual',
      blocksPublicLaunch: true,
    },
    {
      id: 'trust.no_pay_to_win',
      rule: 'No pay-to-win or success guarantee copy on offer screen.',
      status: 'documented',
      blocksPublicLaunch: true,
    },
    {
      id: 'trust.no_fomo',
      rule: 'No FOMO / urgency pressure on offer screen.',
      status: 'documented',
      blocksPublicLaunch: true,
    },
    {
      id: 'trust.main_operation_value',
      rule: 'Main Operation value proposition clear (scope expansion, not score advantage).',
      status: 'documented',
      blocksPublicLaunch: true,
    },
    {
      id: 'trust.limited_mode_consistent',
      rule: 'Limited mode secondary CTA does not contradict offer copy pack.',
      status: 'pending_manual',
      blocksPublicLaunch: false,
    },
    {
      id: 'trust.privacy_terms_note',
      rule: 'Privacy/terms link area documented — real URL pending separately.',
      status: 'documented',
      blocksPublicLaunch: true,
    },
    {
      id: 'trust.purchase_success_state',
      rule: 'Purchase success updates access state correctly on device.',
      status: 'pending_manual',
      blocksPublicLaunch: true,
    },
    {
      id: 'trust.restore_success_state',
      rule: 'Restore success updates access state correctly on device.',
      status: 'pending_manual',
      blocksPublicLaunch: true,
    },
  ];
}

export function buildIapDashboardEvidenceRequirements(): IapDashboardEvidenceRequirement[] {
  return [
    {
      id: 'ev.asc_product_created',
      evidenceType: 'store_console',
      closesBlocker: 'app_store_product_created',
      cannotCloseWithout: 'ASC product list screenshot showing real product ID and status.',
    },
    {
      id: 'ev.play_product_active',
      evidenceType: 'store_console',
      closesBlocker: 'play_console_product_created',
      cannotCloseWithout: 'Play Console product detail screenshot showing Active status.',
    },
    {
      id: 'ev.rc_dashboard',
      evidenceType: 'screenshot',
      closesBlocker: 'revenuecat_entitlement_config',
      cannotCloseWithout: 'RevenueCat entitlement/offering screenshot — no fabricated IDs in repo.',
    },
    {
      id: 'ev.sandbox_purchase',
      evidenceType: 'purchase_log',
      closesBlocker: 'iap_sandbox_purchase_test',
      cannotCloseWithout: 'Device purchase_log with transaction reference — not mock PASS.',
    },
    {
      id: 'ev.sandbox_restore',
      evidenceType: 'purchase_log',
      closesBlocker: 'iap_restore_test',
      cannotCloseWithout: 'Restore purchase_log or RC dashboard_event after restore.',
    },
    {
      id: 'ev.review_notes_complete',
      evidenceType: 'manual_note',
      closesBlocker: 'app_store_metadata_entered',
      cannotCloseWithout: 'Review notes with all placeholders replaced — no PENDING tokens.',
    },
  ];
}

export function buildIapDashboardBlockerMapping(): IapDashboardBlockerMapping[] {
  return [
    {
      blockerId: 'revenuecat_public_keys',
      checklistItemIds: ['rc.public_sdk_keys'],
      evidenceRequired: ['manual_note'],
    },
    {
      blockerId: 'app_store_product_created',
      checklistItemIds: ['asc.product_id', 'asc.product_status'],
      evidenceRequired: ['store_console'],
    },
    {
      blockerId: 'play_console_product_created',
      checklistItemIds: ['play.product_id', 'play.active_status'],
      evidenceRequired: ['store_console'],
    },
    {
      blockerId: 'iap_sandbox_purchase_test',
      checklistItemIds: ['sandbox.ios_purchase_success', 'sandbox.android_purchase_success'],
      evidenceRequired: ['purchase_log'],
    },
    {
      blockerId: 'iap_restore_test',
      checklistItemIds: ['sandbox.ios_restore_success', 'sandbox.android_restore_sync'],
      evidenceRequired: ['purchase_log', 'dashboard_event'],
    },
  ];
}

function resolveChecklistStatus(
  productCopyReady: boolean,
  placeholderCount: number,
  verifiedCount: number,
): IapDashboardEntryChecklistStatus {
  if (!productCopyReady) return 'blocked_by_missing_dashboard_access';
  if (verifiedCount > 0) return 'partially_entered';
  if (placeholderCount === 0) return 'ready_for_sandbox_test';
  return 'ready_for_manual_entry';
}

export function buildIapDashboardEntryChecklist(): IapDashboardEntryChecklist {
  const productCopy = runIapProductCopyAudit();
  const reviewNoteItems = buildIapReviewNotePlaceholderMapping();
  const placeholderCount = reviewNoteItems.filter((m) => !m.readyForReview).length;

  return {
    checklistId: IAP_DASHBOARD_ENTRY_CHECKLIST_ID,
    status: resolveChecklistStatus(
      productCopy.status === 'ready_for_dashboard_entry' && productCopy.copyGuardPassed,
      placeholderCount,
      0,
    ),
    appStoreItems: buildIapDashboardAppStoreItems(),
    playStoreItems: buildIapDashboardPlayStoreItems(),
    revenueCatItems: buildIapDashboardRevenueCatItems(),
    sandboxTesterItems: buildIapDashboardSandboxTesterItems(),
    reviewNoteItems,
    evidenceRequirements: buildIapDashboardEvidenceRequirements(),
    blockerMapping: buildIapDashboardBlockerMapping(),
    sandboxTestMatrix: buildIapSandboxTestMatrix(),
    offerScreenTrustQa: buildIapOfferScreenTrustQaChecklist(),
    fakePassGuard: true,
  };
}

export function runIapDashboardEntryChecklistAudit(options?: {
  revenueCatKeysConfigured?: boolean;
}): IapDashboardEntryChecklistAuditResult {
  const checklist = buildIapDashboardEntryChecklist();
  const allItems = [
    ...checklist.appStoreItems,
    ...checklist.playStoreItems,
    ...checklist.revenueCatItems,
    ...checklist.sandboxTesterItems,
  ];

  const placeholderCount =
    checklist.reviewNoteItems.filter((m) => !m.readyForReview).length +
    allItems.filter((i) => i.valueSource === 'placeholder' && i.status !== 'verified').length;

  const verifiedEvidenceCount = allItems.filter((i) => i.status === 'verified').length;
  const _keysConfigured = options?.revenueCatKeysConfigured ?? false;
  void _keysConfigured;

  const canSubmitForReview =
    checklist.reviewNoteItems.every((m) => m.readyForReview) &&
    verifiedEvidenceCount > 0 &&
    allItems
      .filter((i) => i.blocksPublicLaunch)
      .every((i) => i.status === 'verified');

  return {
    checklist,
    placeholderCount,
    verifiedEvidenceCount,
    canStartSandboxTesting: false,
    canSubmitForReview: false,
    appStoreChecklistStatus: summarizePlatformStatus(checklist.appStoreItems),
    playChecklistStatus: summarizePlatformStatus(checklist.playStoreItems),
    revenueCatChecklistStatus: summarizePlatformStatus(checklist.revenueCatItems),
    sandboxMatrixStatus: 'ready_for_execution',
    offerScreenTrustQaStatus: 'pending_manual',
    fakePassGuard:
      verifiedEvidenceCount === 0 &&
      !canSubmitForReview &&
      checklist.fakePassGuard,
  };
}

export function assertIapDashboardEntryChecklistIntegrity(): {
  ok: boolean;
  message: string;
} {
  const checklist = buildIapDashboardEntryChecklist();
  if (checklist.appStoreItems.length < 10) {
    return { ok: false, message: 'App Store checklist too short' };
  }
  if (checklist.playStoreItems.length < 8) {
    return { ok: false, message: 'Play Console checklist too short' };
  }
  if (checklist.revenueCatItems.length < 10) {
    return { ok: false, message: 'RevenueCat checklist too short' };
  }
  if (checklist.sandboxTestMatrix.length < 10) {
    return { ok: false, message: 'Sandbox matrix too short' };
  }
  if (checklist.reviewNoteItems.length < 5) {
    return { ok: false, message: 'Review note placeholder mapping incomplete' };
  }
  if (checklist.offerScreenTrustQa.length < 8) {
    return { ok: false, message: 'Offer screen trust QA checklist too short' };
  }
  return { ok: true, message: 'OK' };
}

export function buildIapDashboardEntryConsoleSummary(
  audit: IapDashboardEntryChecklistAuditResult,
): string {
  const c = audit.checklist;
  return [
    '=== IAP Dashboard Entry Checklist ===',
    `Checklist: ${c.checklistId}`,
    `Status: ${c.status}`,
    `Placeholders: ${audit.placeholderCount}`,
    `Verified evidence: ${audit.verifiedEvidenceCount}`,
    `Can start sandbox: ${audit.canStartSandboxTesting}`,
    `Can submit for review: ${audit.canSubmitForReview}`,
    `App Store: ${audit.appStoreChecklistStatus}`,
    `Play Console: ${audit.playChecklistStatus}`,
    `RevenueCat: ${audit.revenueCatChecklistStatus}`,
    `Sandbox matrix: ${audit.sandboxMatrixStatus} (${c.sandboxTestMatrix.length} cases)`,
    `Offer trust QA: ${audit.offerScreenTrustQaStatus}`,
    `Fake pass guard: ${audit.fakePassGuard ? 'ACTIVE' : 'OFF'}`,
    `Copy pack: ${IAP_PRODUCT_COPY_PACK_ID}`,
    `Docs: ${IAP_DASHBOARD_ENTRY_CHECKLIST_DOCS_PATH}`,
  ].join('\n');
}
