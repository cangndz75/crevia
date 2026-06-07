import type {
  CrashBreadcrumbCategory,
  CrashContext,
  CrashMessageLevel,
  CrashReporter,
} from './crashPerformanceTypes';

export function createNoopCrashReporter(): CrashReporter {
  return {
    provider: 'none',
    active: false,
    init() {},
    captureException() {},
    captureMessage() {},
    addBreadcrumb(_name: string, _category: CrashBreadcrumbCategory, _data?: CrashContext) {},
    setContext() {},
    clearContext() {},
    startSpan() {},
    endSpan() {},
  };
}

export const NOOP_CRASH_REPORTER: CrashReporter = createNoopCrashReporter();

export function captureExceptionNoop(_error: unknown, _context?: CrashContext): void {}

export function captureMessageNoop(
  _message: string,
  _level: CrashMessageLevel = 'info',
  _context?: CrashContext,
): void {}
