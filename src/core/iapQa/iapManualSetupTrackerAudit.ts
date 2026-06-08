import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { IAP_PRODUCT_COPY_DOCS_PATH, runIapProductCopyAudit } from '@/core/iapProductCopy';
import { runSecretHygieneScan } from '@/core/security/secretHygieneAudit';
import { buildSecretRotationClosureResult } from '@/core/security/secretRotationClosureAudit';

import {
  IAP_DASHBOARD_ENTRY_CHECKLIST_DOCS_PATH,
  runIapDashboardEntryChecklistAudit,
} from './iapDashboardEntryChecklist';
import { IAP_SANDBOX_QA_ENV_KEYS } from './iapSandboxQaConstants';
import {
  IAP_MANUAL_SETUP_TRACKER_AREAS,
  IAP_MANUAL_SETUP_TRACKER_DOCS_PATH,
  IAP_MANUAL_SETUP_TRACKER_ENV_KEYS,
  IAP_MANUAL_SETUP_TRACKER_PRODUCT_IDS,
  IAP_MANUAL_SETUP_PLACEHOLDER_PATTERNS,
  IAP_MANUAL_SETUP_SECRET_PATTERNS,
  buildIapManualSetupTrackerItems,
} from './iapManualSetupTrackerConstants';
import type {
  CreviaIapManualSetupArea,
  CreviaIapManualSetupBlocker,
  CreviaIapManualSetupHealthStatus,
  CreviaIapManualSetupItem,
  CreviaIapManualSetupPlatformStatus,
  CreviaIapManualSetupStatus,
  CreviaIapManualSetupTrackerResult,
  CreviaIapManualSetupWarning,
} from './iapManualSetupTrackerTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readEnv(key: string): string {
  return (process.env[key] ?? '').trim();
}

function isPlaceholder(value: string): boolean {
  if (value.length === 0) return true;
  const lower = value.toLowerCase();
  return IAP_MANUAL_SETUP_PLACEHOLDER_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

function isSecretPattern(value: string): boolean {
  const lower = value.toLowerCase();
  return IAP_MANUAL_SETUP_SECRET_PATTERNS.some((p) => lower.startsWith(p.toLowerCase()));
}

function readRepoFile(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function checkSecretKeyCommitted(): boolean {
  const hygiene = runSecretHygieneScan();
  return hygiene.findings.some((f) => f.kind === 'revenuecat_secret_key');
}

function checkDocsContainRealKey(): boolean {
  const hygiene = runSecretHygieneScan();
  return hygiene.findings.some(
    (f) => f.kind === 'docs_real_key_value' || (f.kind === 'revenuecat_secret_key' && f.filePath.startsWith('docs/')),
  );
}

export function buildIapManualSetupTracker(): CreviaIapManualSetupTrackerResult {
  const productCopy = runIapProductCopyAudit();
  const items = buildIapManualSetupTrackerItems();
  const iosKeyRaw = readEnv(IAP_MANUAL_SETUP_TRACKER_ENV_KEYS.ios);
  const androidKeyRaw = readEnv(IAP_MANUAL_SETUP_TRACKER_ENV_KEYS.android);
  const iosKeyConfigured = iosKeyRaw.length > 0 && !isPlaceholder(iosKeyRaw) && !isSecretPattern(iosKeyRaw);
  const androidKeyConfigured = androidKeyRaw.length > 0 && !isPlaceholder(androidKeyRaw) && !isSecretPattern(androidKeyRaw);
  const keysConfigured = iosKeyConfigured && androidKeyConfigured;
  const dashboardAudit = runIapDashboardEntryChecklistAudit({
    revenueCatKeysConfigured: keysConfigured,
  });

  const secretCommitted = checkSecretKeyCommitted();
  const docsContainRealKey = checkDocsContainRealKey();

  const noSecretItem = items.find((i) => i.id === 'rc_project.no_secret_committed');
  if (noSecretItem) {
    noSecretItem.status = secretCommitted ? 'blocked' : 'verified';
  }

  const rotationClosure = buildSecretRotationClosureResult();
  const blockers = collectIapManualSetupBlockers(
    items,
    keysConfigured,
    secretCommitted,
    docsContainRealKey,
    rotationClosure,
  );
  const warnings = collectIapManualSetupWarnings(
    items,
    keysConfigured,
    docsContainRealKey,
    rotationClosure,
  );
  const platformStatuses = buildIapManualSetupPlatformStatus(items);
  const nextActions = buildIapManualSetupNextActions(items, keysConfigured, secretCommitted);
  nextActions.unshift(
    `IAP dashboard entry checklist (${dashboardAudit.checklist.status}): ${IAP_DASHBOARD_ENTRY_CHECKLIST_DOCS_PATH}`,
  );
  nextActions.unshift(
    `IAP product copy pack (${productCopy.status}): ${IAP_PRODUCT_COPY_DOCS_PATH}`,
  );

  const entitlementMappingPending = items
    .filter((i) => i.area === 'revenuecat_entitlement')
    .some((i) => i.status === 'pending_manual' || i.status === 'not_started');
  const storeProductsPending =
    items.filter((i) => i.area === 'app_store_connect_iap' || i.area === 'google_play_console_product')
      .some((i) => i.status === 'pending_manual' || i.status === 'not_started');
  const easSecretsPending = items
    .filter((i) => i.area === 'eas_build_config' && i.id.includes('api_key'))
    .some((i) => i.status === 'pending_manual' || i.status === 'not_started');
  const sandboxTestersPending = items
    .filter((i) => i.area === 'sandbox_test_accounts' && i.blockerIfMissing)
    .some((i) => i.status === 'pending_manual' || i.status === 'not_started');
  const manualVerificationPending = items
    .filter((i) => i.area === 'manual_verification')
    .every((i) => i.status === 'pending_manual' || i.status === 'not_started');

  const allVerified = items.every(
    (i) => i.status === 'verified' || i.status === 'not_applicable',
  );

  const health = summarizeIapManualSetupHealth(blockers, warnings, allVerified);

  return {
    health,
    areas: [...IAP_MANUAL_SETUP_TRACKER_AREAS],
    items,
    blockers,
    warnings,
    platformStatuses,
    revenueCatKeysConfigured: keysConfigured,
    entitlementMappingPending,
    storeProductsPending,
    easSecretsPending,
    sandboxTestersPending,
    manualVerificationPending,
    allVerified,
    nextActions,
    docsPath: IAP_MANUAL_SETUP_TRACKER_DOCS_PATH,
    iosProductId: IAP_MANUAL_SETUP_TRACKER_PRODUCT_IDS.ios,
    androidProductId: IAP_MANUAL_SETUP_TRACKER_PRODUCT_IDS.android,
    entitlementId: IAP_MANUAL_SETUP_TRACKER_PRODUCT_IDS.entitlement,
    offeringId: IAP_MANUAL_SETUP_TRACKER_PRODUCT_IDS.offering,
    productCopyPackId: productCopy.packId,
    productCopyPackStatus: productCopy.status,
    productCopyDocsPath: IAP_PRODUCT_COPY_DOCS_PATH,
    productMetadataCopyReady: productCopy.copyGuardPassed,
    dashboardChecklistId: dashboardAudit.checklist.checklistId,
    dashboardChecklistStatus: dashboardAudit.checklist.status,
    dashboardChecklistDocsPath: IAP_DASHBOARD_ENTRY_CHECKLIST_DOCS_PATH,
    appStoreChecklistStatus: dashboardAudit.appStoreChecklistStatus,
    playChecklistStatus: dashboardAudit.playChecklistStatus,
    revenueCatChecklistStatus: dashboardAudit.revenueCatChecklistStatus,
    sandboxMatrixStatus: dashboardAudit.sandboxMatrixStatus,
    placeholderCount: dashboardAudit.placeholderCount,
    verifiedEvidenceCount: dashboardAudit.verifiedEvidenceCount,
    canStartSandboxTesting: dashboardAudit.canStartSandboxTesting,
    canSubmitForReview: dashboardAudit.canSubmitForReview,
    dashboardEntryChecklist: dashboardAudit.checklist,
  };
}

export function collectIapManualSetupBlockers(
  items: CreviaIapManualSetupItem[],
  keysConfigured: boolean,
  secretCommitted: boolean,
  docsContainRealKey: boolean,
  rotationClosure = buildSecretRotationClosureResult(),
): CreviaIapManualSetupBlocker[] {
  const blockers: CreviaIapManualSetupBlocker[] = [];

  if (!rotationClosure.currentTreeSanitized) {
    blockers.push({
      id: 'security.current_tree_blocks_closure',
      area: 'revenuecat_project',
      title: 'Secret rotation closure blocked — current tree dirty',
      message: 'Sanitize current tree before IAP sandbox execution.',
      recommendation: 'Run verify:secret-hygiene first.',
    });
  }

  if (rotationClosure.blockers.some((b) => b.id === 'closure.raw_key_evidence_blocked')) {
    blockers.push({
      id: 'security.raw_key_evidence_blocked',
      area: 'revenuecat_project',
      title: 'Rotation evidence contains raw key',
      message: 'Evidence must not include key values.',
      recommendation: 'Remove raw keys from evidence records.',
    });
  }

  if (
    rotationClosure.rotationRequired &&
    !rotationClosure.rotationVerifiedClosed
  ) {
    blockers.push({
      id: 'security.rotation_required_pending',
      area: 'revenuecat_project',
      title: 'Secret rotation closure pending',
      message: `${rotationClosure.pendingRotationCount} exposure(s) await provider rotate/revoke.`,
      recommendation: 'Complete docs/crevia-secret-rotation-closure.md checklist.',
    });
  }

  if (!keysConfigured) {
    blockers.push({
      id: 'tracker.revenuecat_keys_missing',
      area: 'revenuecat_project',
      title: 'RevenueCat public SDK keys not configured',
      message: `${IAP_SANDBOX_QA_ENV_KEYS.ios} and/or ${IAP_SANDBOX_QA_ENV_KEYS.android} missing or placeholder.`,
      recommendation: 'Create RC project, get appl_/goog_ keys, add to EAS secrets.',
    });
  }

  if (secretCommitted) {
    blockers.push({
      id: 'tracker.secret_key_committed',
      area: 'revenuecat_project',
      title: 'Secret key pattern found in repo',
      message: 'sk_/rcsk_/secret_ pattern detected in source files.',
      recommendation: 'Remove secret key immediately; rotate in RevenueCat dashboard.',
    });
  }

  if (docsContainRealKey) {
    blockers.push({
      id: 'tracker.docs_contain_real_key',
      area: 'revenuecat_project',
      title: 'Docs contain real API key value',
      message: 'Real appl_*/goog_* key found in documentation.',
      recommendation: 'Replace with placeholder in docs; keys belong in EAS secrets only.',
    });
  }

  const pendingBlockerAreas: CreviaIapManualSetupArea[] = [
    'revenuecat_entitlement',
    'revenuecat_offering',
    'app_store_connect_iap',
    'google_play_console_product',
    'eas_build_config',
    'sandbox_test_accounts',
  ];

  for (const area of pendingBlockerAreas) {
    const areaItems = items.filter((i) => i.area === area && i.blockerIfMissing);
    const pendingCount = areaItems.filter(
      (i) => i.status === 'pending_manual' || i.status === 'not_started',
    ).length;
    if (pendingCount > 0) {
      blockers.push({
        id: `tracker.${area}_pending`,
        area,
        title: `${area} setup pending`,
        message: `${pendingCount} required item(s) not configured.`,
        recommendation: `Complete ${area} manual setup in dashboard.`,
      });
    }
  }

  const configuredUnverified = items.filter((i) => i.status === 'configured_unverified');
  if (configuredUnverified.length > 0) {
    blockers.push({
      id: 'tracker.configured_unverified_not_pass',
      area: 'manual_verification',
      title: 'configured_unverified does not count as sandbox pass',
      message: `${configuredUnverified.length} item(s) configured but not verified on device.`,
      recommendation: 'Run sandbox smoke test to verify configuration.',
    });
  }

  return blockers;
}

export function collectIapManualSetupWarnings(
  items: CreviaIapManualSetupItem[],
  keysConfigured: boolean,
  docsContainRealKey: boolean,
  rotationClosure = buildSecretRotationClosureResult(),
): CreviaIapManualSetupWarning[] {
  const warnings: CreviaIapManualSetupWarning[] = [];

  if (rotationClosure.rotationVerifiedClosed && rotationClosure.closureCanProceed) {
    warnings.push({
      id: 'security.rotation_verified_closed',
      area: 'revenuecat_project',
      title: 'Secret rotation closure verified',
      message: 'No pending rotation exposures.',
      recommendation: 'Proceed with IAP manual setup when ready.',
    });
  }

  if (rotationClosure.warnings.length > 0) {
    warnings.push({
      id: 'security.rotation_closure_warnings',
      area: 'revenuecat_project',
      title: 'Rotation closure warnings',
      message: rotationClosure.warnings.map((w) => w.title).slice(0, 2).join('; '),
      recommendation: 'Review docs/crevia-secret-rotation-closure.md.',
    });
  }

  const nonBlockerPending = items.filter(
    (i) => !i.blockerIfMissing && (i.status === 'pending_manual' || i.status === 'not_started'),
  );
  if (nonBlockerPending.length > 0) {
    warnings.push({
      id: 'tracker.optional_items_pending',
      area: 'manual_verification',
      title: 'Optional setup items pending',
      message: `${nonBlockerPending.length} non-blocker item(s) not yet configured.`,
      recommendation: 'Complete before launch_candidate review.',
    });
  }

  if (keysConfigured) {
    const iosKeyRaw = readEnv(IAP_MANUAL_SETUP_TRACKER_ENV_KEYS.ios);
    const androidKeyRaw = readEnv(IAP_MANUAL_SETUP_TRACKER_ENV_KEYS.android);
    if (isSecretPattern(iosKeyRaw) || isSecretPattern(androidKeyRaw)) {
      warnings.push({
        id: 'tracker.secret_pattern_in_env',
        area: 'revenuecat_project',
        title: 'Secret key pattern in env variable',
        message: 'Env var looks like a secret key, not a public SDK key.',
        recommendation: 'Use appl_*/goog_* public keys only.',
      });
    }
  }

  const manualVerifyItems = items.filter((i) => i.area === 'manual_verification');
  const allManualPending = manualVerifyItems.every(
    (i) => i.status === 'pending_manual' || i.status === 'not_started',
  );
  if (allManualPending) {
    warnings.push({
      id: 'tracker.manual_verification_not_started',
      area: 'manual_verification',
      title: 'Manual verification not started',
      message: 'No device verification results logged.',
      recommendation: 'Run manual smoke on EAS dev build after setup complete.',
    });
  }

  return warnings;
}

export function buildIapManualSetupPlatformStatus(
  items: CreviaIapManualSetupItem[],
): CreviaIapManualSetupPlatformStatus[] {
  return (['ios', 'android'] as const).map((platform) => {
    const relevant = items.filter(
      (i) => i.platform === platform || i.platform === 'both',
    );
    const configuredCount = relevant.filter((i) => i.status === 'configured_unverified').length;
    const verifiedCount = relevant.filter((i) => i.status === 'verified').length;
    const pendingCount = relevant.filter(
      (i) => i.status === 'pending_manual' || i.status === 'not_started',
    ).length;
    const blockedCount = relevant.filter((i) => i.status === 'blocked').length;

    let status: CreviaIapManualSetupStatus = 'pending_manual';
    if (blockedCount > 0) status = 'blocked';
    else if (pendingCount === 0 && relevant.length > 0) {
      status = verifiedCount === relevant.length ? 'verified' : 'configured_unverified';
    }

    return {
      platform,
      status,
      configuredCount,
      verifiedCount,
      pendingCount,
      blockedCount,
      totalItems: relevant.length,
    };
  });
}

export function buildIapManualSetupNextActions(
  items: CreviaIapManualSetupItem[],
  keysConfigured: boolean,
  secretCommitted: boolean,
): string[] {
  const actions: string[] = [];

  if (secretCommitted) {
    actions.push('URGENT: Remove secret key from repo and rotate in RevenueCat dashboard.');
  }

  if (!keysConfigured) {
    actions.push('Create RevenueCat project and get public SDK keys (appl_*/goog_*).');
    actions.push('Store keys as EAS secrets: eas secret:create.');
  }

  const areaOrder: CreviaIapManualSetupArea[] = [
    'revenuecat_project',
    'revenuecat_entitlement',
    'revenuecat_offering',
    'app_store_connect_iap',
    'google_play_console_product',
    'eas_build_config',
    'sandbox_test_accounts',
    'manual_verification',
  ];

  for (const area of areaOrder) {
    const pending = items.filter(
      (i) => i.area === area && i.blockerIfMissing && (i.status === 'pending_manual' || i.status === 'not_started'),
    );
    if (pending.length > 0 && area !== 'revenuecat_project') {
      actions.push(`Complete ${area}: ${pending.map((i) => i.title).slice(0, 2).join(', ')}.`);
    }
  }

  if (items.every((i) => i.status === 'configured_unverified' || i.status === 'verified' || i.status === 'not_applicable')) {
    actions.push('Run sandbox smoke test on EAS dev build to move configured_unverified → verified.');
  }

  return actions;
}

export function summarizeIapManualSetupProgress(
  result: CreviaIapManualSetupTrackerResult,
): string {
  const verified = result.items.filter((i) => i.status === 'verified').length;
  const pending = result.items.filter(
    (i) => i.status === 'pending_manual' || i.status === 'not_started',
  ).length;
  const configuredUnverified = result.items.filter((i) => i.status === 'configured_unverified').length;

  return [
    `Health: ${result.health}`,
    `Items: ${result.items.length} total`,
    `Verified: ${verified}`,
    `Configured (unverified): ${configuredUnverified}`,
    `Pending: ${pending}`,
    `Blockers: ${result.blockers.length}`,
    `RC keys: ${result.revenueCatKeysConfigured}`,
    `All verified: ${result.allVerified}`,
  ].join(' | ');
}

function summarizeIapManualSetupHealth(
  blockers: CreviaIapManualSetupBlocker[],
  warnings: CreviaIapManualSetupWarning[],
  allVerified: boolean,
): CreviaIapManualSetupHealthStatus {
  if (allVerified && blockers.length === 0) return 'PASS';
  if (blockers.length > 0) return 'BLOCKED';
  if (warnings.length > 0) return 'WARN';
  return 'PASS';
}

export function assertIapManualSetupTrackerIntegrity(): {
  ok: boolean;
  areaCount: number;
  itemCount: number;
} {
  const items = buildIapManualSetupTrackerItems();
  const areas = new Set(items.map((i) => i.area));
  const valid =
    areas.size >= 8 &&
    items.length > 0 &&
    items.every((i) => i.id && i.area && i.title && i.platform) &&
    existsSync(join(REPO_ROOT, IAP_MANUAL_SETUP_TRACKER_DOCS_PATH));
  return { ok: valid, areaCount: areas.size, itemCount: items.length };
}
