import type { CreviaSecretFindingKind } from './secretHygieneTypes';

import type { CreviaSecretExposureRecord, CreviaSecretRotationEvidence } from './secretRotationClosureTypes';

export const SECRET_ROTATION_CLOSURE_DOCS_PATH = 'docs/crevia-secret-rotation-closure.md';

export type SecretProviderPolicy = {
  provider: string;
  rotationRequired: boolean;
  launchBlocking: boolean;
  manualActionRequired: boolean;
  defaultSeverity: 'blocker' | 'high' | 'medium' | 'low';
  manualAction: string;
};

export const SECRET_PROVIDER_POLICIES: Record<CreviaSecretFindingKind, SecretProviderPolicy> = {
  revenuecat_secret_key: {
    provider: 'RevenueCat',
    rotationRequired: true,
    launchBlocking: true,
    manualActionRequired: true,
    defaultSeverity: 'blocker',
    manualAction: 'Revoke/rotate secret key in RevenueCat dashboard → API Keys.',
  },
  store_shared_secret: {
    provider: 'App Store Connect / Google Play',
    rotationRequired: true,
    launchBlocking: true,
    manualActionRequired: true,
    defaultSeverity: 'blocker',
    manualAction: 'Regenerate store shared secret in provider dashboard.',
  },
  generic_api_key: {
    provider: 'Unknown provider',
    rotationRequired: true,
    launchBlocking: true,
    manualActionRequired: true,
    defaultSeverity: 'blocker',
    manualAction: 'Manual security review required before launch.',
  },
  eas_secret_value: {
    provider: 'EAS',
    rotationRequired: true,
    launchBlocking: true,
    manualActionRequired: true,
    defaultSeverity: 'blocker',
    manualAction: 'Rotate EAS secret and remove value from repo/docs.',
  },
  revenuecat_public_key: {
    provider: 'RevenueCat',
    rotationRequired: false,
    launchBlocking: false,
    manualActionRequired: true,
    defaultSeverity: 'medium',
    manualAction: 'Move public SDK key to EAS secrets; rotate if exposed publicly.',
  },
  docs_real_key_value: {
    provider: 'RevenueCat / docs',
    rotationRequired: false,
    launchBlocking: false,
    manualActionRequired: true,
    defaultSeverity: 'high',
    manualAction: 'Replace docs value with placeholder; rotate if key was public.',
  },
  suspicious_token: {
    provider: 'Unknown',
    rotationRequired: true,
    launchBlocking: true,
    manualActionRequired: true,
    defaultSeverity: 'high',
    manualAction: 'Manual review required — classify as secret or false positive.',
  },
  placeholder_safe: {
    provider: 'N/A',
    rotationRequired: false,
    launchBlocking: false,
    manualActionRequired: false,
    defaultSeverity: 'low',
    manualAction: 'No action required.',
  },
};

/**
 * Historical exposure registry — raw key values never stored.
 * Populate manually after hygiene cleanup when past exposure is known.
 */
export const SECRET_ROTATION_HISTORICAL_EXPOSURE_REGISTRY: Omit<
  CreviaSecretExposureRecord,
  'rotationStatus'
>[] = [];

/**
 * Manual rotation evidence registry — no raw keys, dashboard refs as placeholders only.
 */
export const SECRET_ROTATION_EVIDENCE_REGISTRY: CreviaSecretRotationEvidence[] = [];

/**
 * Set true if keys were pushed to a public remote — forces rotation pending until evidence closed.
 */
export const SECRET_ROTATION_PUBLIC_REPO_EXPOSURE_FLAG = false;

export const SECRET_ROTATION_MANUAL_CHECKLIST = [
  'Exposed key provider dashboard\'da revoke/rotate edildi mi?',
  'Eski key devre dışı mı?',
  'Yeni key EAS secret olarak eklendi mi?',
  'Yeni key repo/docs içinde yok mu?',
  '.env.example placeholder mı?',
  'Secret hygiene scan tekrar PASS mi?',
  'IAP readiness verify PASS mi?',
  'Sandbox smoke öncesi key doğrulandı mı?',
  'Git history exposure public repo\'ya pushlandı mı?',
  'Public push olduysa provider key kesin rotate edildi mi?',
] as const;

export const SECRET_ROTATION_RAW_KEY_PATTERNS = [
  /\bsk_[a-zA-Z0-9_]{8,}\b/,
  /\brcsk_[a-zA-Z0-9_]{8,}\b/,
  /\bappl_[a-zA-Z0-9]{10,}\b/,
  /\bgoog_[a-zA-Z0-9]{10,}\b/,
] as const;
