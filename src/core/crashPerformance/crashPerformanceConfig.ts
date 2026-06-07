import {
  CRASH_PERFORMANCE_ENV_KEYS,
  CRASH_PERFORMANCE_SELECTED_PROVIDER,
} from './crashPerformanceConstants';
import type { CrashPerformanceConfig, CrashReportingProvider } from './crashPerformanceTypes';

function readEnv(key: string): string | undefined {
  const raw = process.env[key];
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readBoolEnv(key: string, fallback = false): boolean {
  const raw = readEnv(key);
  if (raw === undefined) return fallback;
  const normalized = raw.toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes') return true;
  if (normalized === '0' || normalized === 'false' || normalized === 'no') return false;
  return fallback;
}

function isValidSentryDsn(dsn: string | undefined): boolean {
  if (!dsn) return false;
  if (dsn.includes('REPLACE_WITH') || dsn.includes('your-dsn')) return false;
  return /^https?:\/\/.+@.+\/\d+/.test(dsn);
}

function readExpoConfig():
  | {
      version?: string;
      ios?: { buildNumber?: string };
      android?: { versionCode?: number };
    }
  | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants').default as {
      expoConfig?: {
        version?: string;
        ios?: { buildNumber?: string };
        android?: { versionCode?: number };
      };
    };
    return Constants.expoConfig;
  } catch {
    return undefined;
  }
}

function resolveAppVersion(): string | undefined {
  const version = readExpoConfig()?.version;
  if (typeof version === 'string' && version.length > 0) {
    return version;
  }
  return undefined;
}

function resolveBuildNumber(): string | undefined {
  const expoConfig = readExpoConfig();
  const iosBuild = expoConfig?.ios?.buildNumber;
  if (typeof iosBuild === 'string' && iosBuild.length > 0) {
    return iosBuild;
  }
  const androidCode = expoConfig?.android?.versionCode;
  if (typeof androidCode === 'number') {
    return String(androidCode);
  }
  return undefined;
}

export function resolveCrashReportingProvider(): CrashReportingProvider {
  return CRASH_PERFORMANCE_SELECTED_PROVIDER;
}

export function getCrashPerformanceConfig(): CrashPerformanceConfig {
  const dsn = readEnv(CRASH_PERFORMANCE_ENV_KEYS.dsn);
  const enabledFlag = readBoolEnv(CRASH_PERFORMANCE_ENV_KEYS.enabled, false);
  const appEnv =
    readEnv(CRASH_PERFORMANCE_ENV_KEYS.appEnv) ??
    (typeof __DEV__ !== 'undefined' && __DEV__ ? 'development' : 'production');
  const performanceTracingEnabled = readBoolEnv(
    CRASH_PERFORMANCE_ENV_KEYS.performanceTracing,
    false,
  );
  const validDsn = isValidSentryDsn(dsn);
  const enabled = enabledFlag && validDsn;

  return {
    provider: resolveCrashReportingProvider(),
    dsn: validDsn ? dsn : undefined,
    enabled,
    appEnv,
    release: resolveAppVersion() ? `crevia@${resolveAppVersion()}` : undefined,
    dist: resolveBuildNumber(),
    performanceTracingEnabled: enabled && performanceTracingEnabled,
    sendDefaultPii: false,
    debugLogging: typeof __DEV__ !== 'undefined' && __DEV__ && enabledFlag,
  };
}

export function shouldActivateCrashReporter(config: CrashPerformanceConfig = getCrashPerformanceConfig()): boolean {
  return config.provider === 'sentry' && config.enabled && Boolean(config.dsn);
}
