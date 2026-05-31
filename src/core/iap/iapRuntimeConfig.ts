import type {
  IapRuntimeConfig,
  IapValidationFinding,
  IapValidationResult,
} from './iapRuntimeTypes';

const PUBLIC_KEY_PLACEHOLDER_IOS = 'appl_REPLACE_WITH_REVENUECAT_IOS_PUBLIC_KEY';
const PUBLIC_KEY_PLACEHOLDER_ANDROID = 'goog_REPLACE_WITH_REVENUECAT_ANDROID_PUBLIC_KEY';

const SECRET_KEY_PATTERNS = [/^sk_/i, /secret/i, /^rcsk_/i];

function getPlatformOs(): 'ios' | 'android' | 'web' | 'unknown' {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Platform } = require('react-native') as {
      Platform: { OS: 'ios' | 'android' | 'web' };
    };
    return Platform.OS;
  } catch {
    return 'web';
  }
}

function readEnv(key: string): string | undefined {
  const raw = process.env[key];
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isPlaceholderKey(key: string): boolean {
  return (
    key.includes('REPLACE_WITH') ||
    key === PUBLIC_KEY_PLACEHOLDER_IOS ||
    key === PUBLIC_KEY_PLACEHOLDER_ANDROID
  );
}

export function looksLikeRevenueCatSecretKey(key: string): boolean {
  return SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function normalizePublicKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  if (isPlaceholderKey(key)) return undefined;
  if (looksLikeRevenueCatSecretKey(key)) return undefined;
  return key;
}

export function getIapRuntimeConfig(): IapRuntimeConfig {
  const iosKey = normalizePublicKey(
    readEnv('EXPO_PUBLIC_REVENUECAT_IOS_API_KEY'),
  );
  const androidKey = normalizePublicKey(
    readEnv('EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY'),
  );
  const appUserId = readEnv('EXPO_PUBLIC_REVENUECAT_APP_USER_ID');
  const os = getPlatformOs();
  const hasPlatformKey =
    os === 'ios'
      ? Boolean(iosKey)
      : os === 'android'
        ? Boolean(androidKey)
        : Boolean(iosKey || androidKey);
  const hasAnyKey = Boolean(iosKey || androidKey);

  if (hasAnyKey && hasPlatformKey) {
    return {
      mode: 'revenuecat',
      revenueCatIosApiKey: iosKey,
      revenueCatAndroidApiKey: androidKey,
      appUserId,
      useDebugLogs: typeof __DEV__ !== 'undefined' && __DEV__,
    };
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return {
      mode: 'mock',
      appUserId,
      useDebugLogs: true,
    };
  }

  return {
    mode: 'disabled',
    appUserId,
    useDebugLogs: false,
  };
}

export function isIapRuntimeEnabled(config: IapRuntimeConfig): boolean {
  return config.mode !== 'disabled';
}

export function isRevenueCatConfigured(config: IapRuntimeConfig): boolean {
  if (config.mode !== 'revenuecat') return false;
  const key = getRevenueCatApiKeyForPlatform(config, getPlatformOs());
  return Boolean(key);
}

export function getRevenueCatApiKeyForPlatform(
  config: IapRuntimeConfig,
  platform: 'ios' | 'android' | 'web' | 'unknown',
): string | undefined {
  if (platform === 'ios') return config.revenueCatIosApiKey;
  if (platform === 'android') return config.revenueCatAndroidApiKey;
  return config.revenueCatIosApiKey ?? config.revenueCatAndroidApiKey;
}

export function validateIapRuntimeConfig(
  config: IapRuntimeConfig = getIapRuntimeConfig(),
): IapValidationResult {
  const findings: IapValidationFinding[] = [];
  const rawIos = readEnv('EXPO_PUBLIC_REVENUECAT_IOS_API_KEY');
  const rawAndroid = readEnv('EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY');

  if (rawIos && looksLikeRevenueCatSecretKey(rawIos)) {
    findings.push({
      id: 'ios_secret_rejected',
      severity: 'warn',
      message: 'iOS RevenueCat key looks like a secret key and was ignored.',
    });
  }
  if (rawAndroid && looksLikeRevenueCatSecretKey(rawAndroid)) {
    findings.push({
      id: 'android_secret_rejected',
      severity: 'warn',
      message: 'Android RevenueCat key looks like a secret key and was ignored.',
    });
  }

  if (config.mode === 'revenuecat') {
    findings.push({
      id: 'revenuecat_mode',
      severity: 'pass',
      message: 'RevenueCat runtime mode active.',
    });
  } else if (config.mode === 'mock') {
    findings.push({
      id: 'mock_mode',
      severity: 'pass',
      message: 'Mock IAP runtime mode (dev).',
    });
  } else {
    findings.push({
      id: 'disabled_mode',
      severity: 'warn',
      message: 'IAP runtime disabled — no public SDK keys for this build.',
    });
  }

  return {
    valid: findings.every((f) => f.severity !== 'fail'),
    findings,
  };
}

export const IAP_RUNTIME_ENV_DOC = {
  iosKey: 'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY',
  androidKey: 'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY',
  appUserId: 'EXPO_PUBLIC_REVENUECAT_APP_USER_ID',
  placeholderIos: PUBLIC_KEY_PLACEHOLDER_IOS,
  placeholderAndroid: PUBLIC_KEY_PLACEHOLDER_ANDROID,
} as const;
