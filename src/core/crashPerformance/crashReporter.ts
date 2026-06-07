import { getCrashPerformanceConfig, shouldActivateCrashReporter } from './crashPerformanceConfig';
import { createNoopCrashReporter } from './crashReporterNoop';
import { createSentryCrashReporter } from './crashReporterSentry';
import type {
  CrashBreadcrumbCategory,
  CrashContext,
  CrashMessageLevel,
  CrashReporter,
} from './crashPerformanceTypes';

type CrashReporterGlobal = typeof globalThis & {
  __creviaCrashReporterInit?: boolean;
  __creviaCrashReporter?: CrashReporter;
};

const crashGlobal = globalThis as CrashReporterGlobal;

function resolveReporter(): CrashReporter {
  if (crashGlobal.__creviaCrashReporter) {
    return crashGlobal.__creviaCrashReporter;
  }

  const config = getCrashPerformanceConfig();
  if (shouldActivateCrashReporter(config)) {
    crashGlobal.__creviaCrashReporter = createSentryCrashReporter(config);
  } else {
    crashGlobal.__creviaCrashReporter = createNoopCrashReporter();
  }

  return crashGlobal.__creviaCrashReporter;
}

export function initCrashReporter(): CrashReporter {
  if (crashGlobal.__creviaCrashReporterInit) {
    return resolveReporter();
  }
  crashGlobal.__creviaCrashReporterInit = true;

  const reporter = resolveReporter();
  try {
    reporter.init();
  } catch {
    crashGlobal.__creviaCrashReporter = createNoopCrashReporter();
    return crashGlobal.__creviaCrashReporter;
  }

  return reporter;
}

export function getCrashReporter(): CrashReporter {
  return resolveReporter();
}

export function resetCrashReporterForTesting(): void {
  crashGlobal.__creviaCrashReporterInit = false;
  crashGlobal.__creviaCrashReporter = undefined;
}

export function captureException(error: unknown, context?: CrashContext): void {
  resolveReporter().captureException(error, context);
}

export function captureMessage(
  message: string,
  level: CrashMessageLevel = 'info',
  context?: CrashContext,
): void {
  resolveReporter().captureMessage(message, level, context);
}

export function addBreadcrumb(
  name: string,
  category: CrashBreadcrumbCategory,
  data?: CrashContext,
): void {
  resolveReporter().addBreadcrumb(name, category, data);
}

export function setCrashContext(context: CrashContext): void {
  resolveReporter().setContext(context);
}

export function clearCrashContext(): void {
  resolveReporter().clearContext();
}

export function startPerformanceSpan(name: string, context?: CrashContext): void {
  resolveReporter().startSpan(name, context);
}

export function endPerformanceSpan(name: string, context?: CrashContext): void {
  resolveReporter().endSpan(name, context);
}

export function recordScreenReady(screenName: string, durationMs: number): void {
  addBreadcrumb('screen_ready', 'performance', {
    screenName,
    durationMs,
    actionType: 'screen_ready',
  });
}

export function markAppStart(): void {
  addBreadcrumb('app_start', 'system', { actionType: 'app_start' });
  startPerformanceSpan('app_start');
}

export function triggerDevCrashTest(): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }
  addBreadcrumb('dev_crash_test', 'system', { actionType: 'dev_crash_test' });
  throw new Error('Crevia dev crash test — Sentry smoke');
}
