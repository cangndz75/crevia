export const SECRET_HYGIENE_DOCS_PATH = 'docs/crevia-secret-hygiene.md';

export const SECRET_HYGIENE_SAFE_PLACEHOLDERS = [
  'PENDING_PLACEHOLDER',
  'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY',
  'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY',
  '<YOUR_REVENUECAT_PUBLIC_KEY>',
  'YOUR_KEY_HERE',
  'rc_public_key_placeholder',
  'appl_REPLACE_WITH_REVENUECAT_IOS_PUBLIC_KEY',
  'goog_REPLACE_WITH_REVENUECAT_ANDROID_PUBLIC_KEY',
  'REPLACE_WITH',
  'appl_PLACEHOLDER',
  'goog_PLACEHOLDER',
  '<REVENUECAT_PUBLIC_SDK_KEY_SET_IN_EAS>',
  '<DO_NOT_COMMIT_SECRET_KEY>',
  '<STORE_SHARED_SECRET_NOT_IN_REPO>',
] as const;

export const SECRET_REAL_KEY_PATTERNS = {
  revenueCatSecret: /\bsk_[a-zA-Z0-9_]{10,}\b/,
  revenueCatSecretAlt: /\brcsk_[a-zA-Z0-9_]{10,}\b/,
  revenueCatPublicIos: /\bappl_[a-zA-Z0-9]{10,}\b/,
  revenueCatPublicAndroid: /\bgoog_[a-zA-Z0-9]{10,}\b/,
  genericLongToken: /\b[a-zA-Z0-9_-]{40,}\b/,
} as const;

export const SECRET_PATTERN_REFERENCE_ALLOWLIST = [
  /['"`]sk_['"`,)\]}\s]/,
  /['"`]rcsk_['"`,)\]}\s]/,
  /['"`]secret_['"`,)\]}\s]/,
  /\/\^sk_\//,
  /\/\^rcsk_\//,
  /\/secret\//,
  /sk_live_simulated_test_key/,
  /Secret key \(/,
  /secret key/i,
  /No sk_/,
  /sk_\*\s/,
  /rcsk_\*/,
  /sk_\/rcsk_/,
  /\.includes\('sk_'\)/,
  /\.startsWith\('sk_'\)/,
  /\.includes\(pattern\)/,
  /sk_ or rcsk_/i,
  /sk_ patterns/i,
  /sk_ client/i,
] as const;

export const SECRET_HYGIENE_SOURCE_FILES = [
  'src/core/iap/iapProductConstants.ts',
  'src/core/iap/iapRuntimeConfig.ts',
  'src/core/iapQa/iapSandboxQaConstants.ts',
  'src/core/iapQa/iapSandboxQaAudit.ts',
  'src/core/iapQa/iapManualSetupTrackerConstants.ts',
  'src/core/iapQa/iapManualSetupTrackerAudit.ts',
  'app.json',
  'app.config.js',
  'app.config.ts',
  '.env',
  '.env.local',
  '.env.production',
  'eas.json',
] as const;

export const SECRET_HYGIENE_DOC_FILES = [
  'docs/crevia-revenuecat-store-manual-setup-tracker.md',
  'docs/crevia-iap-sandbox-smoke-test.md',
  'docs/crevia-iap-sandbox-smoke-execution.md',
  'docs/crevia-iap-integration.md',
  'docs/crevia-iap-sandbox-qa.md',
  'docs/crevia-store-metadata-finalization.md',
  'docs/crevia-data-safety-draft.md',
  'docs/crevia-store-listing-readiness.md',
  'docs/crevia-privacy-policy-draft.md',
  'docs/crevia-secret-hygiene.md',
] as const;

export const SECRET_SANITIZATION_PLACEHOLDERS = {
  revenueCatPublicIos: '<REVENUECAT_PUBLIC_SDK_KEY_SET_IN_EAS>',
  revenueCatPublicAndroid: '<REVENUECAT_PUBLIC_SDK_KEY_SET_IN_EAS>',
  revenueCatSecret: '<DO_NOT_COMMIT_SECRET_KEY>',
  storeSharedSecret: '<STORE_SHARED_SECRET_NOT_IN_REPO>',
  genericToken: '<SENSITIVE_TOKEN_REMOVED>',
} as const;
