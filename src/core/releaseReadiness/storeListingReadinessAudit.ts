import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  STORE_LISTING_FALSE_CLAIM_PATTERNS,
  STORE_LISTING_IAP_ANDROID_PRODUCT_ID,
  STORE_LISTING_IAP_ENTITLEMENT_ID,
  STORE_LISTING_IAP_IOS_PRODUCT_ID,
  STORE_LISTING_IAP_OFFERING_ID,
  STORE_LISTING_METADATA_DRAFT,
  STORE_LISTING_MIN_SCREENSHOT_COUNT,
  STORE_LISTING_PRIVACY_MATRIX,
  STORE_LISTING_PRIVACY_POLICY_PLACEHOLDER,
  STORE_LISTING_READINESS_DOCS_PATH,
  STORE_LISTING_SCREENSHOT_REQUIREMENTS,
  STORE_LISTING_SUPPORT_URL_PLACEHOLDER,
} from './storeListingReadinessConstants';
import { runStoreScreenshotReadinessAudit } from './storeScreenshotReadinessAudit';
import type {
  CreviaStoreListingAssetRequirement,
  CreviaStoreListingChecklistItem,
  CreviaStoreListingReadinessMode,
  CreviaStoreListingReadinessResult,
  CreviaStoreReadinessBlocker,
  CreviaStoreReadinessHealthStatus,
  CreviaStoreReadinessWarning,
  RunStoreListingReadinessAuditOptions,
} from './storeListingReadinessTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function assetExists(...paths: string[]): boolean {
  return paths.some((p) => existsSync(join(REPO_ROOT, p)));
}

export function scanStoreCopyForFalseClaims(text: string): string | undefined {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return STORE_LISTING_FALSE_CLAIM_PATTERNS.find((p) => normalized.includes(p.toLocaleLowerCase('tr-TR')));
}

export function isPrivacyPolicyUrlPlaceholder(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes('PENDING_PLACEHOLDER') || trimmed.includes('REPLACE_WITH')) {
    return true;
  }
  if (trimmed.includes('example.com') || trimmed.includes('TODO')) {
    return true;
  }
  return false;
}

function buildChecklist(iconPresent: boolean): CreviaStoreListingChecklistItem[] {
  const draft = STORE_LISTING_METADATA_DRAFT;
  const privacyPlaceholder = isPrivacyPolicyUrlPlaceholder(draft.privacyPolicyUrl);
  const supportPlaceholder = draft.supportUrl.includes('PENDING_PLACEHOLDER');

  return [
    {
      id: 'meta.app_name',
      section: 'app_metadata',
      title: 'App name',
      description: draft.appName,
      status: draft.appName ? 'draft' : 'pending',
      requiredForLaunch: true,
      recommendation: 'Finalize as "Crevia" in App Store Connect / Play Console.',
    },
    {
      id: 'meta.subtitle',
      section: 'app_metadata',
      title: 'Subtitle / short description',
      description: `${draft.subtitleTr} | ${draft.subtitleEn}`,
      status: 'draft',
      requiredForLaunch: true,
      recommendation: 'iOS subtitle + Play short description from draft.',
    },
    {
      id: 'meta.full_description',
      section: 'app_metadata',
      title: 'Full description',
      description: 'TR + EN drafts in constants',
      status: 'draft',
      requiredForLaunch: true,
      recommendation: STORE_LISTING_READINESS_DOCS_PATH,
    },
    {
      id: 'meta.keywords',
      section: 'app_metadata',
      title: 'Keywords / tags',
      description: draft.keywords,
      status: 'draft',
      requiredForLaunch: false,
      recommendation: 'iOS keywords field; Play tags as applicable.',
    },
    {
      id: 'meta.category',
      section: 'app_metadata',
      title: 'Category',
      description: draft.category,
      status: 'draft',
      requiredForLaunch: true,
      recommendation: 'Games → Simulation.',
    },
    {
      id: 'meta.support_url',
      section: 'app_metadata',
      title: 'Support URL',
      description: draft.supportUrl,
      status: supportPlaceholder ? 'pending' : 'draft',
      requiredForLaunch: true,
      recommendation: 'Host support page before launch.',
    },
    {
      id: 'meta.marketing_url',
      section: 'app_metadata',
      title: 'Marketing URL (optional)',
      description: draft.marketingUrl || 'Not set',
      status: draft.marketingUrl ? 'draft' : 'not_applicable',
      requiredForLaunch: false,
      recommendation: 'Optional landing page.',
    },
    {
      id: 'meta.privacy_policy_url',
      section: 'app_metadata',
      title: 'Privacy policy URL',
      description: draft.privacyPolicyUrl,
      status: privacyPlaceholder ? 'pending' : 'draft',
      requiredForLaunch: true,
      recommendation: 'Publish real privacy policy URL — placeholder blocks launch_candidate.',
    },
    {
      id: 'meta.contact_email',
      section: 'app_metadata',
      title: 'Contact email',
      description: draft.supportContact,
      status: draft.supportContact.includes('PENDING') ? 'pending' : 'draft',
      requiredForLaunch: true,
      recommendation: 'Use monitored support inbox.',
    },
    {
      id: 'visual.app_icon',
      section: 'visual_assets',
      title: 'App icon',
      description: iconPresent ? 'assets present' : 'pending capture',
      status: iconPresent ? 'draft' : 'pending',
      requiredForLaunch: true,
      recommendation: '1024×1024 master + platform variants.',
    },
    {
      id: 'visual.ios_screenshots',
      section: 'visual_assets',
      title: 'App Store screenshots',
      description: 'Manual capture pending',
      status: 'pending',
      requiredForLaunch: true,
      recommendation: 'Minimum 7 screens per checklist.',
    },
    {
      id: 'visual.play_screenshots',
      section: 'visual_assets',
      title: 'Play Store screenshots',
      description: 'Manual capture pending',
      status: 'pending',
      requiredForLaunch: true,
      recommendation: 'Phone + optional tablet.',
    },
    {
      id: 'visual.feature_graphic',
      section: 'visual_assets',
      title: 'Feature graphic (Play)',
      description: '1024×500 pending',
      status: 'pending',
      requiredForLaunch: true,
      recommendation: 'Play Console feature graphic.',
    },
    {
      id: 'visual.promo_graphic',
      section: 'visual_assets',
      title: 'Promo graphic (optional)',
      description: 'Not required for soft launch',
      status: 'not_applicable',
      requiredForLaunch: false,
      recommendation: 'Optional marketing asset.',
    },
    {
      id: 'visual.tablet_screenshots',
      section: 'visual_assets',
      title: 'Tablet screenshots (optional)',
      description: 'Optional for Play',
      status: 'not_applicable',
      requiredForLaunch: false,
      recommendation: 'Add if tablet supported.',
    },
    {
      id: 'visual.screenshot_language',
      section: 'visual_assets',
      title: 'Screenshot language TR/EN policy',
      description: 'TR primary; EN optional second locale',
      status: 'draft',
      requiredForLaunch: true,
      recommendation: 'TR set first; EN for global listing.',
    },
    {
      id: 'iap.product_id',
      section: 'iap_metadata',
      title: 'Product id',
      description: `iOS: ${STORE_LISTING_IAP_IOS_PRODUCT_ID}; Android: ${STORE_LISTING_IAP_ANDROID_PRODUCT_ID}`,
      status: 'pending',
      requiredForLaunch: true,
      recommendation: 'Create in store dashboards — not marked done in repo.',
    },
    {
      id: 'iap.display_name',
      section: 'iap_metadata',
      title: 'Product display name',
      description: 'Ana Operasyon — Tam Erişim (draft)',
      status: 'draft',
      requiredForLaunch: true,
      recommendation: 'Align with in-app offer copy.',
    },
    {
      id: 'iap.description',
      section: 'iap_metadata',
      title: 'Product description',
      description: STORE_LISTING_METADATA_DRAFT.iapProductDescription,
      status: 'draft',
      requiredForLaunch: true,
      recommendation: 'Non-subscription one-time unlock.',
    },
    {
      id: 'iap.price_tier',
      section: 'iap_metadata',
      title: 'Price tier placeholder',
      description: 'Pending store console',
      status: 'pending',
      requiredForLaunch: true,
      recommendation: 'Set tier after sandbox smoke pass.',
    },
    {
      id: 'iap.classification',
      section: 'iap_metadata',
      title: 'Non-subscription classification',
      description: 'One-time non-consumable unlock',
      status: 'draft',
      requiredForLaunch: true,
      recommendation: 'Disclose in-app purchase in listing.',
    },
    {
      id: 'iap.revenuecat_mapping',
      section: 'iap_metadata',
      title: 'RevenueCat offering/entitlement mapping',
      description: `Offering: ${STORE_LISTING_IAP_OFFERING_ID}; Entitlement: ${STORE_LISTING_IAP_ENTITLEMENT_ID}`,
      status: 'pending',
      requiredForLaunch: true,
      recommendation: 'docs/crevia-iap-sandbox-smoke-test.md',
    },
    {
      id: 'privacy.analytics',
      section: 'privacy_data_safety',
      title: 'Analytics data collected?',
      description: 'Structured events only; no raw text',
      status: 'draft',
      requiredForLaunch: true,
      recommendation: 'Declare in Apple Privacy Nutrition / Play Data safety.',
    },
    {
      id: 'privacy.purchase',
      section: 'privacy_data_safety',
      title: 'Purchase data collected?',
      description: 'Via store + RevenueCat',
      status: 'draft',
      requiredForLaunch: true,
      recommendation: 'Purchase history for entitlement restore.',
    },
    {
      id: 'privacy.crash',
      section: 'privacy_data_safety',
      title: 'Crash logs collected?',
      description: 'SDK pending',
      status: 'pending',
      requiredForLaunch: false,
      recommendation: 'WARN until crash SDK integrated.',
    },
    {
      id: 'privacy.user_id',
      section: 'privacy_data_safety',
      title: 'User ID / account data',
      description: 'No login — local save only',
      status: 'ready',
      requiredForLaunch: true,
      recommendation: 'Declare "No account" where applicable.',
    },
    {
      id: 'privacy.raw_text',
      section: 'privacy_data_safety',
      title: 'Raw text / copy collected',
      description: 'Must be NO',
      status: 'ready',
      requiredForLaunch: true,
      recommendation: 'Analytics forbidden keys enforced.',
    },
    {
      id: 'privacy.personal_policy',
      section: 'privacy_data_safety',
      title: 'Personal data policy',
      description: STORE_LISTING_METADATA_DRAFT.privacySummary,
      status: privacyPlaceholder ? 'pending' : 'draft',
      requiredForLaunch: true,
      recommendation: 'Link privacy policy URL.',
    },
    {
      id: 'privacy.data_linked',
      section: 'privacy_data_safety',
      title: 'Data linked to user?',
      description: 'Analytics: no; Purchase: store-dependent',
      status: 'draft',
      requiredForLaunch: true,
      recommendation: 'Complete data safety forms honestly.',
    },
    {
      id: 'privacy.tracking',
      section: 'privacy_data_safety',
      title: 'Data used for tracking?',
      description: 'No ATT / no ad tracking in MVP',
      status: 'ready',
      requiredForLaunch: true,
      recommendation: 'ATT not required unless tracking SDK added.',
    },
    {
      id: 'privacy.delete_contact',
      section: 'privacy_data_safety',
      title: 'Delete data / contact process',
      description: 'Support email + local uninstall clears save',
      status: 'pending',
      requiredForLaunch: true,
      recommendation: 'Document in privacy policy.',
    },
    {
      id: 'age.violence_gambling',
      section: 'age_rating',
      title: 'Violence/gambling/medical/adult: no',
      description: 'Simulation; no mature content',
      status: 'draft',
      requiredForLaunch: true,
      recommendation: 'Answer IARC / Apple questionnaire honestly.',
    },
    {
      id: 'age.iap_disclosure',
      section: 'age_rating',
      title: 'In-app purchase disclosure',
      description: 'One-time unlock disclosed',
      status: 'draft',
      requiredForLaunch: true,
      recommendation: 'Mark IAP yes in rating forms.',
    },
    {
      id: 'age.simulation_category',
      section: 'age_rating',
      title: 'Simulation / game category',
      description: 'Games — Simulation',
      status: 'draft',
      requiredForLaunch: true,
      recommendation: 'Not education / official government app.',
    },
    {
      id: 'age.ugc',
      section: 'age_rating',
      title: 'User-generated content: no',
      description: 'No UGC in MVP',
      status: 'ready',
      requiredForLaunch: true,
      recommendation: 'Revisit if social features added.',
    },
    {
      id: 'age.ads',
      section: 'age_rating',
      title: 'Ads: no',
      description: 'No ad SDK in MVP',
      status: 'ready',
      requiredForLaunch: true,
      recommendation: 'Revisit if ads added.',
    },
    {
      id: 'build.eas_profile',
      section: 'build_compliance',
      title: 'EAS build profile',
      description: 'eas.json not in repo — manual EAS setup',
      status: 'pending',
      requiredForLaunch: true,
      recommendation: 'Configure development + production profiles.',
    },
    {
      id: 'build.bundle_id',
      section: 'build_compliance',
      title: 'Bundle id / package name',
      description: 'Not finalized in app.json',
      status: 'pending',
      requiredForLaunch: true,
      recommendation: 'Set before store submission.',
    },
    {
      id: 'build.version',
      section: 'build_compliance',
      title: 'Version / build number',
      description: 'app.json version 1.0.0',
      status: 'draft',
      requiredForLaunch: true,
      recommendation: 'Increment per submission.',
    },
    {
      id: 'build.privacy_manifest',
      section: 'build_compliance',
      title: 'Privacy manifest (iOS)',
      description: 'Review when native build configured',
      status: 'pending',
      requiredForLaunch: true,
      recommendation: 'Apple Privacy Manifest for required APIs.',
    },
    {
      id: 'build.android_data_safety',
      section: 'build_compliance',
      title: 'Android data safety form',
      description: 'Manual Play Console form',
      status: 'pending',
      requiredForLaunch: true,
      recommendation: 'Align with privacy matrix.',
    },
    {
      id: 'build.ios_export',
      section: 'build_compliance',
      title: 'iOS export compliance',
      description: 'Standard encryption exemption typical',
      status: 'pending',
      requiredForLaunch: true,
      recommendation: 'Answer in App Store Connect.',
    },
    {
      id: 'build.att',
      section: 'build_compliance',
      title: 'ATT requirement',
      description: 'Not required — no tracking SDK',
      status: 'ready',
      requiredForLaunch: true,
      recommendation: 'Re-evaluate if analytics tracking added.',
    },
  ];
}

function buildAssets(iconPresent: boolean): CreviaStoreListingAssetRequirement[] {
  return [
    {
      id: 'icon',
      assetType: 'App icon',
      platform: 'both',
      required: true,
      status: iconPresent ? 'present' : 'pending',
      pathHint: 'assets/images/icon.png',
      notes: '1024 master required for stores.',
    },
    {
      id: 'ios_screenshots',
      assetType: 'App Store screenshots',
      platform: 'ios',
      required: true,
      status: 'pending',
      notes: 'See screenshot checklist.',
    },
    {
      id: 'play_screenshots',
      assetType: 'Play Store screenshots',
      platform: 'android',
      required: true,
      status: 'pending',
      notes: 'Phone required; tablet optional.',
    },
    {
      id: 'feature_graphic',
      assetType: 'Feature graphic',
      platform: 'android',
      required: true,
      status: 'pending',
      notes: '1024×500 Play feature graphic.',
    },
    {
      id: 'promo_graphic',
      assetType: 'Promo graphic',
      platform: 'android',
      required: false,
      status: 'optional_pending',
      notes: 'Optional.',
    },
  ];
}

function collectBlockersAndWarnings(
  mode: CreviaStoreListingReadinessMode,
  options: {
    privacyPlaceholder: boolean;
    screenshotsComplete: boolean;
    storeMetadataReady: boolean;
    copyScanPassed: boolean;
    iapPlaceholder: boolean;
    iconPresent: boolean;
    screenshotReadinessPending?: boolean;
  },
): { blockers: CreviaStoreReadinessBlocker[]; warnings: CreviaStoreReadinessWarning[] } {
  const blockers: CreviaStoreReadinessBlocker[] = [];
  const warnings: CreviaStoreReadinessWarning[] = [];

  const pushLaunchIssue = (
    id: string,
    section: CreviaStoreReadinessBlocker['section'],
    title: string,
    message: string,
  ) => {
    if (mode === 'launch_candidate') {
      blockers.push({ id, title, message, section });
    } else if (mode === 'soft_launch_candidate') {
      warnings.push({ id, title, message, section });
    } else {
      warnings.push({ id, title, message, section });
    }
  };

  if (options.privacyPlaceholder) {
    pushLaunchIssue(
      'store.listing_privacy_policy_pending',
      'app_metadata',
      'Privacy policy URL placeholder',
      `URL is placeholder (${STORE_LISTING_PRIVACY_POLICY_PLACEHOLDER}).`,
    );
  }

  if (!options.screenshotsComplete) {
    pushLaunchIssue(
      'store.listing_screenshots_pending',
      'visual_assets',
      'Store screenshots pending',
      `${STORE_LISTING_SCREENSHOT_REQUIREMENTS.filter((s) => s.status === 'pending').length} screenshot(s) not captured.`,
    );
  }

  if (!options.storeMetadataReady) {
    pushLaunchIssue(
      'store.listing_metadata_pending',
      'app_metadata',
      'Store metadata not ready',
      'App name/description/support/privacy fields still draft or pending.',
    );
  }

  if (!options.copyScanPassed) {
    warnings.push({
      id: 'store.listing_false_claim_detected',
      title: 'Store copy false claim detected',
      message: 'Draft copy failed forbidden-claim scan.',
      section: 'app_metadata',
    });
  }

  if (options.iapPlaceholder) {
    warnings.push({
      id: 'store.listing_iap_metadata_pending',
      title: 'IAP product metadata placeholder',
      message: 'Store product ids and price tier pending in dashboards.',
      section: 'iap_metadata',
    });
  }

  if (!options.iconPresent && mode !== 'internal_device_test') {
    warnings.push({
      id: 'store.listing_icon_review',
      title: 'App icon review pending',
      message: 'Finalize store icon assets.',
      section: 'visual_assets',
    });
  }

  const crashPending = STORE_LISTING_PRIVACY_MATRIX.find((p) => p.collectedDataType.includes('Crash'));
  if (crashPending) {
    warnings.push({
      id: 'store.listing_crash_sdk_pending',
      title: 'Crash log SDK pending',
      message: 'Declare pending in data safety forms until SDK integrated.',
      section: 'privacy_data_safety',
    });
  }

  if (options.screenshotReadinessPending) {
    if (mode === 'launch_candidate') {
      blockers.push({
        id: 'store.listing_screenshot_readiness_pending',
        title: 'Screenshot capture readiness pending',
        message: 'Required screenshots not captured — blocks launch_candidate.',
        section: 'visual_assets',
      });
    } else {
      warnings.push({
        id: 'store.listing_screenshot_readiness_pending',
        title: 'Screenshot capture readiness pending',
        message: 'Screenshot capture checklist not complete.',
        section: 'visual_assets',
      });
    }
  }

  return { blockers, warnings };
}

function buildHealth(
  mode: CreviaStoreListingReadinessMode,
  blockers: CreviaStoreReadinessBlocker[],
): CreviaStoreReadinessHealthStatus {
  if (mode === 'launch_candidate' && blockers.length > 0) return 'BLOCKED';
  if (blockers.length > 0) return 'WARN';
  return 'WARN';
}

export function runStoreListingReadinessAudit(
  options: RunStoreListingReadinessAuditOptions = {},
): CreviaStoreListingReadinessResult {
  const mode = options.mode ?? 'internal_device_test';

  const iconPresent = assetExists(
    'assets/images/icon.png',
    'assets/icon.png',
    'assets/images/android-icon-foreground.png',
  );

  const metadataDraft = { ...STORE_LISTING_METADATA_DRAFT };
  const privacyPolicyUrlIsPlaceholder = isPrivacyPolicyUrlPlaceholder(metadataDraft.privacyPolicyUrl);
  const screenshots = STORE_LISTING_SCREENSHOT_REQUIREMENTS.map((s) => ({ ...s }));
  const screenshotsComplete = screenshots.every((s) => s.status === 'done');
  const screenshotsMeetMinimum = screenshots.length >= STORE_LISTING_MIN_SCREENSHOT_COUNT;

  const allCopyText = [
    metadataDraft.shortDescriptionTr,
    metadataDraft.shortDescriptionEn,
    metadataDraft.fullDescriptionTr,
    metadataDraft.fullDescriptionEn,
    metadataDraft.iapProductDescription,
    metadataDraft.privacySummary,
    ...metadataDraft.featureBullets,
  ].join('\n');
  const copyForbiddenClaimsScanPassed = !scanStoreCopyForFalseClaims(allCopyText);

  const checklist = buildChecklist(iconPresent);
  const requiredMetaPending = checklist.filter(
    (c) =>
      c.section === 'app_metadata' &&
      c.requiredForLaunch &&
      (c.status === 'pending' || c.status === 'draft'),
  );
  const storeMetadataReady =
    requiredMetaPending.length === 0 &&
    !privacyPolicyUrlIsPlaceholder &&
    !metadataDraft.supportUrl.includes('PENDING_PLACEHOLDER');

  const iapMetadataPlaceholder = checklist.some(
    (c) => c.section === 'iap_metadata' && c.status === 'pending',
  );

  const screenshotReadiness = runStoreScreenshotReadinessAudit({ mode });
  const screenshotReadinessPending = !screenshotReadiness.allRequiredCaptured;

  const { blockers, warnings } = collectBlockersAndWarnings(mode, {
    privacyPlaceholder: privacyPolicyUrlIsPlaceholder,
    screenshotsComplete: screenshotsComplete && screenshotsMeetMinimum,
    storeMetadataReady,
    copyScanPassed: copyForbiddenClaimsScanPassed,
    iapPlaceholder: iapMetadataPlaceholder,
    iconPresent,
    screenshotReadinessPending,
  });

  const health = buildHealth(mode, blockers);

  const nextActions: string[] = [
    `Complete store listing checklist: ${STORE_LISTING_READINESS_DOCS_PATH}`,
  ];
  if (privacyPolicyUrlIsPlaceholder) {
    nextActions.push('Publish real privacy policy URL (placeholder blocks launch_candidate).');
  }
  if (!screenshotsComplete) {
    nextActions.push(`Capture ${screenshots.length} screenshots per matrix on real device.`);
  }
  if (iapMetadataPlaceholder) {
    nextActions.push('Create IAP products in App Store Connect / Play Console.');
  }
  nextActions.push('Complete Apple Privacy Nutrition + Play Data safety forms from privacy matrix.');
  nextActions.push('Review privacy policy draft: docs/crevia-privacy-policy-draft.md');
  nextActions.push('Review data safety draft: docs/crevia-data-safety-draft.md');

  return {
    health,
    mode,
    checklist,
    assets: buildAssets(iconPresent),
    screenshots,
    privacyMatrix: STORE_LISTING_PRIVACY_MATRIX.map((p) => ({ ...p })),
    metadataDraft,
    blockers,
    warnings,
    copyForbiddenClaimsScanPassed,
    privacyPolicyUrlIsPlaceholder,
    screenshotsComplete,
    storeMetadataReady,
    iapMetadataPlaceholder,
    nextActions,
  };
}

export function buildStoreListingReadinessSummary(result: CreviaStoreListingReadinessResult): string {
  const pendingChecklist = result.checklist.filter((c) => c.status === 'pending').length;
  const pendingScreens = result.screenshots.filter((s) => s.status === 'pending').length;
  return [
    `Health: ${result.health}`,
    `Mode: ${result.mode}`,
    `Checklist pending: ${pendingChecklist}`,
    `Screenshots pending: ${pendingScreens}`,
    `Privacy URL placeholder: ${result.privacyPolicyUrlIsPlaceholder}`,
    `Copy scan passed: ${result.copyForbiddenClaimsScanPassed}`,
    `Blockers: ${result.blockers.length}`,
    `Warnings: ${result.warnings.length}`,
  ].join(' | ');
}

export function assertStoreListingReadinessIntegrity(): { ok: boolean; message: string } {
  const appJson = readRepo('app.json');
  if (!appJson.includes('"name"')) {
    return { ok: false, message: 'app.json missing name' };
  }
  if (STORE_LISTING_SCREENSHOT_REQUIREMENTS.length < STORE_LISTING_MIN_SCREENSHOT_COUNT) {
    return { ok: false, message: 'Screenshot count below minimum' };
  }
  if (STORE_LISTING_PRIVACY_MATRIX.length < 5) {
    return { ok: false, message: 'Privacy matrix too small' };
  }
  const docs = readRepo(STORE_LISTING_READINESS_DOCS_PATH);
  if (docs.length < 100) {
    return { ok: false, message: 'Store listing docs missing or too short' };
  }
  return { ok: true, message: 'OK' };
}
