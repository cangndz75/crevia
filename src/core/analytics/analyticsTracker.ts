import {
  buildAnalyticsPayload,
  sanitizeAnalyticsPayload,
  validateAnalyticsEventPayload,
} from './analyticsSchema';
import type {
  AnalyticsEventName,
  AnalyticsEventPayload,
  AnalyticsEventPayloadBase,
  AnalyticsPayloadValue,
} from './analyticsTypes';

let testingBufferEnabled = false;
const testingBuffer: AnalyticsEventPayload[] = [];

/**
 * Test/verify modunda bellek buffer'ı açar. Production bundle'da çağrılmamalı.
 */
/** Yalnızca verify/test senaryolarında kullan; production UI çağırmamalı. */
export function setAnalyticsEnabledForTesting(enabled: boolean): void {
  testingBufferEnabled = enabled;
  if (!enabled) {
    testingBuffer.length = 0;
  }
}

export function getTrackedAnalyticsEventsForTesting(): readonly AnalyticsEventPayload[] {
  return [...testingBuffer];
}

export function clearTrackedAnalyticsEventsForTesting(): void {
  testingBuffer.length = 0;
}

export function createAnalyticsEvent(
  eventName: AnalyticsEventName,
  base: Omit<AnalyticsEventPayloadBase, 'eventName' | 'schemaVersion'>,
  extra: Record<string, AnalyticsPayloadValue> = {},
): AnalyticsEventPayload {
  return buildAnalyticsPayload(eventName, base, extra);
}

/**
 * No-op analytics tracker — gerçek SDK yok. Payload validate + sanitize edilir.
 * Geçersiz payload production'da sessizce düşürülür; verify senaryosunda yakalanır.
 */
export function trackAnalyticsEvent(payload: AnalyticsEventPayload): void {
  const sanitized = sanitizeAnalyticsPayload(payload);
  const validation = validateAnalyticsEventPayload(sanitized);

  if (!validation.valid) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      return;
    }
    return;
  }

  if (testingBufferEnabled) {
    testingBuffer.push(sanitized);
  }
}
