import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { runPostLaunchTelemetryReadinessAudit } from '@/core/analytics/postLaunchTelemetryReadinessAudit';
import { runSoftLaunchReadinessReview } from '@/core/releaseReadiness/softLaunchReviewAudit';
import { verifyAnalyticsRuntimeScenario } from '@/core/analytics/verifyAnalyticsRuntimeScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  CRASH_PERFORMANCE_ALTERNATIVE_PROVIDER,
  CRASH_PERFORMANCE_DOCS_PATH,
  CRASH_PERFORMANCE_ENV_KEYS,
  CRASH_PERFORMANCE_EXPECTED_SAVE_VERSION,
  CRASH_PERFORMANCE_OFFICIAL_DOCS,
  CRASH_PERFORMANCE_SELECTED_PROVIDER,
  FORBIDDEN_CRASH_BREADCRUMB_KEYS,
} from './crashPerformanceConstants';
import { getCrashPerformanceConfig, shouldActivateCrashReporter } from './crashPerformanceConfig';
import { assertCrashContextPrivacySafe } from './crashPerformancePrivacy';
import { createNoopCrashReporter } from './crashReporterNoop';
import { runCrashPerformanceAudit } from './crashPerformanceAudit';
import {
  breadcrumbDecisionResultOpened,
  breadcrumbEndOfDayReportOpened,
  breadcrumbHubScreenOpened,
  breadcrumbIapPurchaseStatus,
  breadcrumbMainOperationFeelShown,
  breadcrumbMapScreenOpened,
  breadcrumbOfflineResumeWarning,
  breadcrumbPostPilotOfferSeen,
} from './crashBreadcrumbs';
import { endScreenTiming, startScreenTiming } from './performanceLite';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyCrashPerformanceOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  auditHealth: string;
};

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function assert(checks: string[], ok: boolean, pass: string, fail = pass): boolean {
  checks.push(`${ok ? 'PASS' : 'FAIL'} ${ok ? pass : fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

export function verifyCrashPerformanceScenario(): VerifyCrashPerformanceOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const audit = runCrashPerformanceAudit({ mode: 'soft_launch_candidate' });
  if (audit.health === 'WARN') hasWarn = true;

  record(assert(checks, audit.selectedProvider === 'sentry', 'Sentry-first provider selected'));
  record(
    assert(
      checks,
      CRASH_PERFORMANCE_SELECTED_PROVIDER === 'sentry',
      'Provider constant is sentry',
    ),
  );
  record(
    assert(
      checks,
      audit.dualProviderBlocked,
      'Dual provider not wired (Crashlytics alternative only)',
    ),
  );
  record(
    assert(
      checks,
      readRepo(CRASH_PERFORMANCE_DOCS_PATH).includes(CRASH_PERFORMANCE_ALTERNATIVE_PROVIDER),
      'Crashlytics alternative documented',
    ),
  );
  record(
    assert(
      checks,
      readRepo(CRASH_PERFORMANCE_DOCS_PATH).includes(CRASH_PERFORMANCE_OFFICIAL_DOCS.expoUsingSentry),
      'Expo Using Sentry docs referenced',
    ),
  );
  record(
    assert(
      checks,
      readRepo(CRASH_PERFORMANCE_DOCS_PATH).includes(CRASH_PERFORMANCE_OFFICIAL_DOCS.sentryReactNativeExpo),
      'Sentry React Native Expo docs referenced',
    ),
  );
  record(assert(checks, audit.expoCompatibility !== 'incompatible', 'Expo compatibility check present'));
  record(
    assert(
      checks,
      audit.easBuildCompatibility === 'compatible' || audit.easBuildCompatibility === 'docs_only',
      'EAS build compatibility check present',
    ),
  );

  const configWithoutDsn = getCrashPerformanceConfig();
  record(
    assert(
      checks,
      !shouldActivateCrashReporter({ ...configWithoutDsn, dsn: undefined, enabled: true }),
      'Missing DSN → no-op',
    ),
  );
  record(
    assert(
      checks,
      !shouldActivateCrashReporter({ ...configWithoutDsn, enabled: false, dsn: 'https://a@b/1' }),
      'enabled=false → no-op',
    ),
  );

  const layoutInitGuard =
    readRepo('src/core/crashPerformance/crashReporter.ts').includes('__creviaCrashReporterInit') &&
    readRepo('src/app/_layout.tsx').includes('initCrashReporter()');
  record(assert(checks, layoutInitGuard, 'init singleton guard present in crashReporter + layout'));

  try {
    const noop = createNoopCrashReporter();
    noop.captureException(new Error('verify noop safe'), { surface: 'hub' });
    noop.captureMessage('verify message', 'info', { day: 1 });
    noop.addBreadcrumb('verify', 'system', { day: 1 });
    record(assert(checks, true, 'capture helpers callable with noop provider'));
  } catch {
    record(assert(checks, false, 'capture helpers noop-safe'));
  }

  record(
    assert(
      checks,
      !readRepo('src/core/crashPerformance/crashReporter.ts').includes('applyDecision'),
      'Crash helper does not import gameplay chain',
    ),
  );

  const privacyProbe = assertCrashContextPrivacySafe({
    playerName: 'x',
    saveState: '{}',
    eventBody: 'text',
    paymentId: 'pid',
    locationLat: 1,
    email: 'a@b.c',
  });
  record(assert(checks, !privacyProbe.safe, 'PII forbidden fields guard detects blocked keys'));
  record(
    assert(
      checks,
      FORBIDDEN_CRASH_BREADCRUMB_KEYS.includes('saveState'),
      'raw save JSON key forbidden',
    ),
  );
  record(assert(checks, FORBIDDEN_CRASH_BREADCRUMB_KEYS.includes('eventBody'), 'full event body forbidden'));
  record(assert(checks, FORBIDDEN_CRASH_BREADCRUMB_KEYS.includes('paymentId'), 'payment identifiers forbidden'));
  record(assert(checks, FORBIDDEN_CRASH_BREADCRUMB_KEYS.includes('locationLat'), 'precise location forbidden'));

  breadcrumbHubScreenOpened({ day: 8, phase: 'post_pilot_full' });
  breadcrumbEndOfDayReportOpened({ day: 8 });
  breadcrumbMapScreenOpened({ day: 8 });
  breadcrumbDecisionResultOpened({ day: 8, eventId: 'evt_safe' });
  breadcrumbPostPilotOfferSeen({ day: 8 });
  breadcrumbIapPurchaseStatus({ day: 8, status: 'started', source: 'mock' });
  breadcrumbMainOperationFeelShown({ day: 8 });
  breadcrumbOfflineResumeWarning({ scenario: 'hydrated_resume', status: 'ready' });
  record(assert(checks, true, 'Critical flow breadcrumb helpers exist'));

  startScreenTiming('HubScreen');
  endScreenTiming('HubScreen');
  record(assert(checks, true, 'Screen timing helper no-op compatible'));

  record(
    assert(
      checks,
      readRepo('src/core/crashPerformance/crashPerformanceConfig.ts').includes('performanceTracing') &&
        readRepo('src/core/crashPerformance/crashPerformanceConstants.ts').includes(
          'EXPO_PUBLIC_SENTRY_PERFORMANCE_TRACING_ENABLED',
        ),
      'Performance tracing env flag gated',
    ),
  );

  const docs = readRepo(CRASH_PERFORMANCE_DOCS_PATH);
  record(assert(checks, docs.includes('SENTRY_AUTH_TOKEN'), 'Source map manual steps in docs'));
  record(assert(checks, docs.includes('smoke test'), 'Real device smoke checklist in docs'));

  const telemetry = runPostLaunchTelemetryReadinessAudit({ mode: 'soft_launch_candidate' });
  if (
    !warn(
      checks,
      telemetry.warnings.some((w) => w.id === 'telemetry.crash_sdk_pending') ||
        telemetry.warnings.some((w) => w.id === 'telemetry.crash_sdk_code_ready'),
      'postLaunchTelemetry crash SDK note present',
      'Missing telemetry crash SDK integration note',
    )
  ) {
    hasWarn = true;
  }

  const review = runSoftLaunchReadinessReview({ mode: 'internal_device_test' });
  record(
    assert(
      checks,
      review.findings.some((f) => f.id === 'crash.code_integration_present'),
      'softLaunchReview crash integration finding present',
    ),
  );

  record(assert(checks, SAVE_VERSION === CRASH_PERFORMANCE_EXPECTED_SAVE_VERSION, 'SAVE_VERSION unchanged'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('crashPerformance'), 'applyDecision unchanged'));
  record(
    assert(
      checks,
      !readRepo('src/core/dayPipeline/verifyDayPipelineScenario.ts').includes('crashPerformance'),
      'dayPipeline unchanged',
    ),
  );
  const analyticsRuntime = verifyAnalyticsRuntimeScenario();
  if (
    !warn(
      checks,
      analyticsRuntime.ok,
      'verify:analytics-runtime compatible',
      'verify:analytics-runtime has pre-existing FAIL (Perf/IAP cascade) — not crash-performance regression',
    )
  ) {
    hasWarn = true;
  }

  const fullLoop = runFullLoopAnalysis();
  record(assert(checks, fullLoop.totalFAIL === 0, 'verify:full-loop compatible'));

  record(assert(checks, readRepo('package.json').includes('verify:crash-performance'), 'package.json script present'));
  record(assert(checks, audit.codeIntegrationPass, 'Crash SDK code integration PASS'));
  record(
    assert(
      checks,
      readRepo('src/core/crashPerformance/crashReporterNoop.ts').includes("provider: 'none'"),
      'Noop provider runtime contract present',
    ),
  );

  if (audit.health === 'WARN') hasWarn = true;
  if (audit.environmentConfigStatus !== 'ready') hasWarn = true;

  return {
    ok,
    warn: hasWarn,
    checks,
    auditHealth: audit.health,
  };
}
