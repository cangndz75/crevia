import {
  ALLOWED_GENERIC_PAYLOAD_KEYS,
  FORBIDDEN_ANALYTICS_PAYLOAD_KEYS,
  FREE_TEXT_LIKE_PAYLOAD_KEY_SUFFIXES,
} from './analyticsConstants';
import type {
  AnalyticsAuditFinding,
  AnalyticsAuditResult,
  AnalyticsEventDefinition,
  AnalyticsEventPayload,
} from './analyticsTypes';

export function findForbiddenAnalyticsKeys(
  payload: Record<string, unknown>,
): string[] {
  return Object.keys(payload).filter((key) =>
    FORBIDDEN_ANALYTICS_PAYLOAD_KEYS.includes(
      key as (typeof FORBIDDEN_ANALYTICS_PAYLOAD_KEYS)[number],
    ),
  );
}

export function hasFreeTextLikePayload(payload: Record<string, unknown>): boolean {
  for (const key of Object.keys(payload)) {
    if (FREE_TEXT_LIKE_PAYLOAD_KEY_SUFFIXES.some((suffix) => key.includes(suffix))) {
      return true;
    }
    if (key.endsWith('Text')) {
      return true;
    }
    const value = payload[key];
    if (typeof value === 'string' && value.length > 120) {
      return true;
    }
  }
  return false;
}

export function assertNoForbiddenPayloadKeys(payload: AnalyticsEventPayload): void {
  const forbidden = findForbiddenAnalyticsKeys(payload);
  if (forbidden.length > 0) {
    throw new Error(`Forbidden analytics keys: ${forbidden.join(', ')}`);
  }
}

export function isAnalyticsPayloadPrivacySafe(payload: AnalyticsEventPayload): boolean {
  if (findForbiddenAnalyticsKeys(payload).length > 0) {
    return false;
  }
  if (hasFreeTextLikePayload(payload)) {
    return false;
  }
  for (const key of Object.keys(payload)) {
    if (
      !ALLOWED_GENERIC_PAYLOAD_KEYS.includes(
        key as (typeof ALLOWED_GENERIC_PAYLOAD_KEYS)[number],
      ) &&
      key !== 'eventName'
    ) {
      const def = payload;
      if (typeof def[key] === 'string' && String(def[key]).includes('@')) {
        return false;
      }
    }
  }
  return true;
}

export function validateAnalyticsPrivacy(
  definitions: AnalyticsEventDefinition[],
): AnalyticsAuditResult {
  const findings: AnalyticsAuditFinding[] = [];
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  const push = (
    id: string,
    severity: AnalyticsAuditFinding['severity'],
    message: string,
    recommendation: string,
  ) => {
    findings.push({ id, severity, message, recommendation });
    if (severity === 'pass') passCount += 1;
    else if (severity === 'warn') warnCount += 1;
    else failCount += 1;
  };

  push(
    'privacy_forbidden_list',
    'pass',
    'Forbidden payload key list defined',
    'Do not send PII or raw save in analytics',
  );

  for (const def of definitions) {
    const badAllowed = def.allowedPayloadKeys.filter((k) =>
      FORBIDDEN_ANALYTICS_PAYLOAD_KEYS.includes(
        k as (typeof FORBIDDEN_ANALYTICS_PAYLOAD_KEYS)[number],
      ),
    );
    if (badAllowed.length > 0) {
      push(
        `privacy_def_${def.name}`,
        'fail',
        `${def.name} allowlist includes forbidden keys`,
        'Remove forbidden keys from allowlist',
      );
    }
  }

  const sampleUnsafe: AnalyticsEventPayload = {
    eventName: 'daily_plan_confirmed',
    surface: 'hub',
    schemaVersion: 1,
    email: 'test@example.com',
  };
  if (!isAnalyticsPayloadPrivacySafe(sampleUnsafe)) {
    push('privacy_detects_email', 'pass', 'Privacy rejects email in payload', 'Keep validators');
  } else {
    push('privacy_detects_email', 'fail', 'Privacy failed to reject email', 'Fix privacy check');
  }

  let health: AnalyticsAuditResult['health'] = 'PASS';
  if (failCount > 0) health = 'FAIL';
  else if (warnCount > 0) health = 'WARN';

  return {
    health,
    checkedCount: findings.length,
    passCount,
    warnCount,
    failCount,
    findings,
  };
}
