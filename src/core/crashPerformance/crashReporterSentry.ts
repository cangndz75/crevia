import type {
  CrashBreadcrumbCategory,
  CrashContext,
  CrashMessageLevel,
  CrashReporter,
} from './crashPerformanceTypes';
import type { CrashPerformanceConfig } from './crashPerformanceTypes';
import { sanitizeCrashContext } from './crashPerformancePrivacy';

type SentryModule = typeof import('@sentry/react-native');

function loadSentryModule(): SentryModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@sentry/react-native') as SentryModule;
  } catch {
    return null;
  }
}

function toSentryLevel(level: CrashMessageLevel): 'debug' | 'info' | 'warning' | 'error' | 'fatal' {
  switch (level) {
    case 'debug':
      return 'debug';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'fatal':
      return 'fatal';
    case 'info':
    default:
      return 'info';
  }
}

export function createSentryCrashReporter(config: CrashPerformanceConfig): CrashReporter {
  const sentry = loadSentryModule();
  const spans = new Map<string, number>();
  let initialized = false;
  let active = false;

  const reporter: CrashReporter = {
    provider: 'sentry',
    get active() {
      return active;
    },
    init() {
      if (initialized || !sentry || !config.dsn) {
        return;
      }
      initialized = true;

      try {
        sentry.init({
          dsn: config.dsn,
          enabled: config.enabled,
          environment: config.appEnv,
          release: config.release,
          dist: config.dist,
          sendDefaultPii: config.sendDefaultPii,
          debug: config.debugLogging,
          tracesSampleRate: config.performanceTracingEnabled ? 0.1 : 0,
          enableAutoSessionTracking: config.enabled,
          attachStacktrace: true,
        });
        active = config.enabled;
      } catch {
        active = false;
      }
    },
    captureException(error: unknown, context?: CrashContext) {
      if (!active || !sentry) return;
      const safeContext = sanitizeCrashContext(context);
      try {
        sentry.withScope((scope) => {
          for (const [key, value] of Object.entries(safeContext)) {
            if (value !== undefined) {
              scope.setTag(key, String(value));
            }
          }
          sentry.captureException(error);
        });
      } catch {
        // Never crash the app from observability.
      }
    },
    captureMessage(message: string, level: CrashMessageLevel = 'info', context?: CrashContext) {
      if (!active || !sentry) return;
      const safeContext = sanitizeCrashContext(context);
      try {
        sentry.withScope((scope) => {
          for (const [key, value] of Object.entries(safeContext)) {
            if (value !== undefined) {
              scope.setTag(key, String(value));
            }
          }
          sentry.captureMessage(message, toSentryLevel(level));
        });
      } catch {
        // no-op
      }
    },
    addBreadcrumb(name: string, category: CrashBreadcrumbCategory, data?: CrashContext) {
      if (!active || !sentry) return;
      const safeData = sanitizeCrashContext(data);
      try {
        sentry.addBreadcrumb({
          message: name,
          category,
          data: safeData,
          level: 'info',
        });
      } catch {
        // no-op
      }
    },
    setContext(context: CrashContext) {
      if (!active || !sentry) return;
      const safeContext = sanitizeCrashContext(context);
      try {
        const scope = sentry.getGlobalScope?.() ?? sentry.getCurrentScope?.();
        for (const [key, value] of Object.entries(safeContext)) {
          if (value !== undefined) {
            scope?.setTag(key, String(value));
          }
        }
      } catch {
        // no-op
      }
    },
    clearContext() {
      if (!active || !sentry) return;
      try {
        const scope = sentry.getGlobalScope?.() ?? sentry.getCurrentScope?.();
        scope?.clear();
      } catch {
        // no-op
      }
    },
    startSpan(name: string, context?: CrashContext) {
      spans.set(name, Date.now());
      reporter.addBreadcrumb(`span_start:${name}`, 'performance', context);
    },
    endSpan(name: string, context?: CrashContext) {
      const startedAt = spans.get(name);
      spans.delete(name);
      const durationMs = startedAt !== undefined ? Date.now() - startedAt : undefined;
      reporter.addBreadcrumb(`span_end:${name}`, 'performance', {
        ...context,
        durationMs,
      });
    },
  };

  return reporter;
}
