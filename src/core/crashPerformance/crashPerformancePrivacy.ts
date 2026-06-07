import {
  FORBIDDEN_CRASH_BREADCRUMB_KEYS,
  FORBIDDEN_CRASH_BREADCRUMB_KEY_SUFFIXES,
} from './crashPerformanceConstants';
import type { CrashContext, CrashContextValue } from './crashPerformanceTypes';

function isForbiddenKey(key: string): boolean {
  if (FORBIDDEN_CRASH_BREADCRUMB_KEYS.includes(key as (typeof FORBIDDEN_CRASH_BREADCRUMB_KEYS)[number])) {
    return true;
  }
  return FORBIDDEN_CRASH_BREADCRUMB_KEY_SUFFIXES.some((suffix) => key.endsWith(suffix));
}

function sanitizeValue(value: CrashContextValue): CrashContextValue {
  if (typeof value !== 'string') {
    return value;
  }
  if (value.length > 120) {
    return `${value.slice(0, 117)}...`;
  }
  return value;
}

export function sanitizeCrashContext(context: CrashContext | undefined): CrashContext {
  if (!context) return {};

  const sanitized: CrashContext = {};
  for (const [key, value] of Object.entries(context)) {
    if (isForbiddenKey(key)) continue;
    if (value === undefined) continue;
    sanitized[key] = sanitizeValue(value);
  }
  return sanitized;
}

export function assertCrashContextPrivacySafe(context: CrashContext): {
  safe: boolean;
  forbiddenKeys: string[];
} {
  const forbiddenKeys = Object.keys(context).filter(isForbiddenKey);
  return { safe: forbiddenKeys.length === 0, forbiddenKeys };
}

export function hashSafeContentPackId(packId: string | undefined): string | undefined {
  if (!packId) return undefined;
  if (packId.length <= 24) return packId;
  let hash = 0;
  for (let i = 0; i < packId.length; i += 1) {
    hash = (hash * 31 + packId.charCodeAt(i)) >>> 0;
  }
  return `pack_${hash.toString(16)}`;
}
