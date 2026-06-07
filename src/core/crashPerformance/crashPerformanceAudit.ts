import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';

import {
  CRASH_PERFORMANCE_ALTERNATIVE_PROVIDER,
  CRASH_PERFORMANCE_DOCS_PATH,
  CRASH_PERFORMANCE_MANUAL_LAUNCH_TRACKER_PATH,
  CRASH_PERFORMANCE_ENV_KEYS,
  CRASH_PERFORMANCE_EAS_SECRET_KEYS,
  CRASH_PERFORMANCE_OFFICIAL_DOCS,
  CRASH_PERFORMANCE_SELECTED_PROVIDER,
  FORBIDDEN_CRASH_BREADCRUMB_KEYS,
} from './crashPerformanceConstants';
import { getCrashPerformanceConfig } from './crashPerformanceConfig';
import { assertCrashContextPrivacySafe } from './crashPerformancePrivacy';
import type {
  CrashPerformanceAuditResult,
  CrashPerformanceBlocker,
  CrashPerformanceManualStep,
  CrashIntegrationMode,
  RunCrashPerformanceAuditOptions,
} from './crashPerformanceTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function hasAll(content: string, patterns: string[]): boolean {
  return patterns.every((pattern) => content.includes(pattern));
}

function readEnv(key: string): string | undefined {
  const raw = process.env[key];
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveIntegrationMode(config = getCrashPerformanceConfig()): CrashIntegrationMode {
  const hasDsn = Boolean(config.dsn);
  const pluginReady = readRepo('app.json').includes('@sentry/react-native');
  const sourceMapSecrets = CRASH_PERFORMANCE_EAS_SECRET_KEYS.every((key) => Boolean(readEnv(key)));

  if (!hasDsn || !config.enabled) {
    return 'disabled';
  }
  if (config.appEnv === 'development') {
    return 'dev_ready';
  }
  if (pluginReady && sourceMapSecrets) {
    return 'production_ready';
  }
  if (hasDsn && config.enabled) {
    return 'internal_test_ready';
  }
  return 'dev_ready';
}

export function runCrashPerformanceAudit(
  options: RunCrashPerformanceAuditOptions = {},
): CrashPerformanceAuditResult {
  const mode = options.mode ?? 'internal_device_test';
  const config = getCrashPerformanceConfig();
  const blockers: CrashPerformanceBlocker[] = [];
  const nextManualSteps: CrashPerformanceManualStep[] = [];

  const crashModule = readRepo('src/core/crashPerformance/index.ts');
  const crashReporter = readRepo('src/core/crashPerformance/crashReporter.ts');
  const crashReporterSentry = readRepo('src/core/crashPerformance/crashReporterSentry.ts');
  const crashReporterNoop = readRepo('src/core/crashPerformance/crashReporterNoop.ts');
  const breadcrumbs = readRepo('src/core/crashPerformance/crashBreadcrumbs.ts');
  const privacy = readRepo('src/core/crashPerformance/crashPerformancePrivacy.ts');
  const appJson = readRepo('app.json');
  const packageJson = readRepo('package.json');
  const layout = readRepo('src/app/_layout.tsx');
  const analyticsTracker = readRepo('src/core/analytics/analyticsTracker.ts');

  const codeIntegrationPass =
    crashModule.length > 0 &&
    crashReporter.includes('initCrashReporter') &&
    crashReporterNoop.includes('createNoopCrashReporter') &&
    crashReporterSentry.includes('createSentryCrashReporter') &&
    breadcrumbs.includes('breadcrumbHubScreenOpened') &&
    layout.includes('initCrashReporter');

  const dualProviderBlocked =
    !crashReporterSentry.includes('crashlytics') &&
    !packageJson.includes('@react-native-firebase/crashlytics') &&
    CRASH_PERFORMANCE_SELECTED_PROVIDER === 'sentry';

  const analyticsSeparationPass =
    analyticsTracker.includes('No-op analytics tracker') &&
    !crashReporter.includes('trackAnalyticsEvent') &&
    !breadcrumbs.includes('trackCreviaEvent');

  const privacySample = assertCrashContextPrivacySafe({
    day: 8,
    screenName: 'HubScreen',
    saveState: 'blocked',
    email: 'blocked',
    eventBody: 'blocked',
    paymentId: 'blocked',
    locationLat: 41.0,
  });
  const privacyRisk =
    privacy.includes('FORBIDDEN_CRASH_BREADCRUMB_KEYS') && privacySample.forbiddenKeys.length > 0
      ? 'low'
      : privacySample.safe
        ? 'low'
        : 'medium';

  const sourceMapPlugin = appJson.includes('@sentry/react-native');
  const metroUsesSentry = readRepo('metro.config.js').includes('@sentry/react-native/metro');
  const sourceMapStatus = metroUsesSentry
    ? 'configured'
    : sourceMapPlugin
      ? 'plugin_ready'
      : readRepo(CRASH_PERFORMANCE_DOCS_PATH).includes('SENTRY_AUTH_TOKEN')
        ? 'docs_ready'
        : 'not_configured';

  let environmentConfigStatus: CrashPerformanceAuditResult['environmentConfigStatus'] = 'missing_dsn';
  if (config.dsn && config.enabled) {
    environmentConfigStatus = 'ready';
  } else if (config.dsn && !config.enabled) {
    environmentConfigStatus = 'disabled';
  } else if (readEnv(CRASH_PERFORMANCE_ENV_KEYS.enabled) === 'true') {
    environmentConfigStatus = 'partial';
  }

  const smokeTestStatus: CrashPerformanceAuditResult['smokeTestStatus'] = 'manual_pending';

  if (!codeIntegrationPass) {
    blockers.push({
      id: 'crash.code_integration_missing',
      title: 'Crash SDK code integration incomplete',
      message: 'crashPerformance module or app entry wiring missing.',
      recommendation: 'Complete crashReporter + _layout init before soft launch.',
    });
  }

  if (!dualProviderBlocked) {
    blockers.push({
      id: 'crash.dual_provider_risk',
      title: 'Dual crash provider risk',
      message: 'Sentry and Crashlytics must not be wired together.',
      recommendation: 'Keep Sentry-only path; document Crashlytics as alternative only.',
    });
  }

  if (!analyticsSeparationPass) {
    blockers.push({
      id: 'crash.analytics_coupling',
      title: 'Crash layer coupled to analytics tracker',
      message: 'Crash breadcrumbs must not call analytics runtime.',
      recommendation: 'Keep crashPerformance independent from analyticsTracker.',
    });
  }

  if (!config.dsn) {
    nextManualSteps.push({
      id: 'env.sentry_dsn',
      title: 'Set EXPO_PUBLIC_SENTRY_DSN in EAS / .env',
      status: 'pending',
      notes: 'Without DSN runtime stays no-op.',
    });
  }

  if (!readEnv('SENTRY_AUTH_TOKEN')) {
    nextManualSteps.push({
      id: 'release.sentry_auth_token',
      title: 'Add SENTRY_AUTH_TOKEN to EAS secrets',
      status: 'pending',
      notes: 'Required for automatic source map upload on EAS Build.',
    });
  }

  nextManualSteps.push({
    id: 'smoke.real_device_crash',
    title: 'Trigger manual crash on internal EAS build and verify Sentry dashboard',
    status: 'pending',
    notes: `Track in ${CRASH_PERFORMANCE_MANUAL_LAUNCH_TRACKER_PATH} (crash_sentry group).`,
  });

  if (sourceMapStatus === 'not_configured' || sourceMapStatus === 'docs_ready') {
    nextManualSteps.push({
      id: 'release.source_maps',
      title: 'Complete Sentry source map upload setup (EAS + metro plugin optional)',
      status: 'pending',
    });
  }

  let releaseReadinessStatus: CrashPerformanceAuditResult['releaseReadinessStatus'] = 'code_only';
  if (codeIntegrationPass && config.dsn && config.enabled && sourceMapStatus === 'configured') {
    releaseReadinessStatus = 'production_ready';
  } else if (codeIntegrationPass && config.dsn && config.enabled) {
    releaseReadinessStatus = 'internal_test_ready';
  } else if (blockers.some((b) => b.id === 'crash.dual_provider_risk')) {
    releaseReadinessStatus = 'blocked';
  }

  let health: CrashPerformanceAuditResult['health'] = 'PASS';
  if (blockers.length > 0) {
    health = 'BLOCKED';
  } else if (environmentConfigStatus !== 'ready' || sourceMapStatus !== 'configured') {
    health = 'WARN';
  }

  if (mode === 'launch_candidate' && environmentConfigStatus !== 'ready') {
    health = 'WARN';
  }

  const expoCompatible =
    packageJson.includes('@sentry/react-native') &&
    !packageJson.includes('sentry-expo') &&
    hasAll(crashReporterSentry, ['@sentry/react-native']);

  return {
    health,
    selectedProvider: CRASH_PERFORMANCE_SELECTED_PROVIDER,
    integrationMode: resolveIntegrationMode(config),
    expoCompatibility: expoCompatible ? 'compatible' : 'partial',
    easBuildCompatibility: sourceMapPlugin ? 'compatible' : 'docs_only',
    privacyRisk,
    sourceMapStatus,
    environmentConfigStatus,
    smokeTestStatus,
    releaseReadinessStatus,
    blockers,
    nextManualSteps,
    codeIntegrationPass,
    dualProviderBlocked,
    analyticsSeparationPass,
  };
}

export function buildCrashPerformanceSdkDecisionSummary(): string {
  return [
    `Provider: ${CRASH_PERFORMANCE_SELECTED_PROVIDER} (Sentry-first, Expo SDK 54 / EAS)`,
    `Alternative: ${CRASH_PERFORMANCE_ALTERNATIVE_PROVIDER} (docs only, not wired)`,
    `Expo docs: ${CRASH_PERFORMANCE_OFFICIAL_DOCS.expoUsingSentry}`,
    `Sentry Expo setup: ${CRASH_PERFORMANCE_OFFICIAL_DOCS.sentryReactNativeExpo}`,
    `Forbidden breadcrumb keys: ${FORBIDDEN_CRASH_BREADCRUMB_KEYS.length}`,
    `SAVE_VERSION: ${SAVE_VERSION}`,
  ].join(' | ');
}
