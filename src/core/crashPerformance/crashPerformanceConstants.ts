import type { CrashReportingProvider } from './crashPerformanceTypes';

export const CRASH_PERFORMANCE_DOCS_PATH = 'docs/crevia-crash-performance-sdk-integration.md';

export const CRASH_PERFORMANCE_MANUAL_LAUNCH_TRACKER_PATH =
  'docs/crevia-manual-launch-blocker-tracker.md';

export const CRASH_PERFORMANCE_EXPECTED_SAVE_VERSION = 26;

export const CRASH_PERFORMANCE_SELECTED_PROVIDER: CrashReportingProvider = 'sentry';

export const CRASH_PERFORMANCE_ALTERNATIVE_PROVIDER: CrashReportingProvider = 'crashlytics';

export const CRASH_PERFORMANCE_ENV_KEYS = {
  dsn: 'EXPO_PUBLIC_SENTRY_DSN',
  enabled: 'EXPO_PUBLIC_CRASH_REPORTING_ENABLED',
  appEnv: 'EXPO_PUBLIC_APP_ENV',
  performanceTracing: 'EXPO_PUBLIC_SENTRY_PERFORMANCE_TRACING_ENABLED',
} as const;

export const CRASH_PERFORMANCE_EAS_SECRET_KEYS = [
  'SENTRY_AUTH_TOKEN',
  'SENTRY_ORG',
  'SENTRY_PROJECT',
] as const;

export const FORBIDDEN_CRASH_BREADCRUMB_KEYS = [
  'name',
  'firstName',
  'lastName',
  'email',
  'phone',
  'address',
  'rawText',
  'reportText',
  'freeText',
  'saveState',
  'saveJson',
  'deviceId',
  'idfa',
  'idfv',
  'advertisingId',
  'ipAddress',
  'locationLat',
  'locationLng',
  'latitude',
  'longitude',
  'customerId',
  'revenueCatCustomerId',
  'transactionId',
  'purchaseToken',
  'receipt',
  'paymentId',
  'openAiPrompt',
  'aiText',
  'eventBody',
  'eventCopy',
  'eventText',
  'playerName',
] as const;

export const FORBIDDEN_CRASH_BREADCRUMB_KEY_SUFFIXES = [
  'Email',
  'Password',
  'Token',
  'Secret',
  'Receipt',
] as const;

export const CRASH_PERFORMANCE_OFFICIAL_DOCS = {
  expoUsingSentry: 'https://docs.expo.dev/guides/using-sentry/',
  sentryReactNativeExpo: 'https://docs.sentry.io/platforms/react-native/manual-setup/expo/',
  expoDebuggingRuntime: 'https://docs.expo.dev/debugging/runtime-issues/',
  sentryExpoMigration: 'https://docs.sentry.io/platforms/react-native/migration/sentry-expo/',
  firebaseCrashlyticsExpoNote:
    'https://rnfirebase.io/crashlytics/usage — requires dev client / native config; not Expo Go.',
} as const;

export const CRASH_PERFORMANCE_NON_GOALS = [
  'Gameplay logic changes',
  'applyDecision / dayPipeline / event generation changes',
  'SAVE_VERSION bump',
  'New navigation routes',
  'IAP behavior changes',
  'Analytics schema refactor',
  'Session replay without privacy review',
  'Dual crash SDK wiring',
  'PII or raw save logging',
] as const;

export const CRASH_PERFORMANCE_MONITORED_SCREENS = [
  'hub',
  'decision_result',
  'end_of_day_report',
  'map',
  'social_pulse',
  'post_pilot_offer',
] as const;
