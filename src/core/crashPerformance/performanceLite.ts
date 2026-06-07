import {
  endPerformanceSpan,
  recordScreenReady,
  startPerformanceSpan,
} from './crashReporter';
import type { CrashContext } from './crashPerformanceTypes';

const screenStartTimes = new Map<string, number>();

export function startScreenTiming(screenName: string, context?: CrashContext): void {
  screenStartTimes.set(screenName, Date.now());
  startPerformanceSpan(`screen:${screenName}`, context);
}

export function endScreenTiming(screenName: string, context?: CrashContext): void {
  const startedAt = screenStartTimes.get(screenName);
  screenStartTimes.delete(screenName);
  endPerformanceSpan(`screen:${screenName}`, context);
  if (startedAt !== undefined) {
    recordScreenReady(screenName, Date.now() - startedAt);
  }
}

export { recordScreenReady, startPerformanceSpan, endPerformanceSpan };
