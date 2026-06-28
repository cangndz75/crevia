export const BUILD_PREP_FOUNDATION_DOC = 'docs/crevia-eas-store-build-prep-foundation.md';

export const BUILD_PREP_STORE_METADATA_CHECKLIST =
  'docs/crevia-store-metadata-checklist.md';

export const BUILD_PREP_PRIVACY_CHECKLIST =
  'docs/crevia-privacy-data-safety-checklist.md';

export const BUILD_PREP_VERSIONING_POLICY_SECTION = 'Versioning policy';

/** Gameplay persist schema — must not be confused with app store version. */
export const BUILD_PREP_EXPECTED_SAVE_VERSION = 28;

export const BUILD_PREP_APP_CONFIG_PATH = 'app.json';

export const BUILD_PREP_EAS_CONFIG_PATH = 'eas.json';

export const BUILD_PREP_ENV_EXAMPLE_PATH = '.env.example';

export const BUILD_PREP_REQUIRED_EAS_PROFILES = [
  'development',
  'preview',
  'production',
] as const;

export const BUILD_PREP_ICON_PATHS = [
  'assets/images/icon.png',
  'assets/images/android-icon-foreground.png',
  'assets/images/android-icon-background.png',
  'assets/logos/logo.png',
] as const;

export const BUILD_PREP_SECRET_PATTERNS: RegExp[] = [
  /sk_live_[A-Za-z0-9]+/,
  /sk_test_[A-Za-z0-9]+/,
  /rcsk_[A-Za-z0-9]+/,
  /AIza[0-9A-Za-z\-_]{20,}/,
  /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
];

export const BUILD_PREP_SAFE_PLACEHOLDER_MARKERS = [
  'REPLACE_WITH',
  'PENDING_PLACEHOLDER',
  'YOUR_',
  'placeholder',
  'example.com',
] as const;

export const BUILD_PREP_SAVE_VERSION_CONFUSION_PATTERNS: RegExp[] = [
  /SAVE_VERSION\s*=\s*app\s*version/i,
  /app\s*version\s*=\s*SAVE_VERSION/i,
  /SAVE_VERSION.*semver/i,
  /store\s*version.*SAVE_VERSION\s*28/i,
];
