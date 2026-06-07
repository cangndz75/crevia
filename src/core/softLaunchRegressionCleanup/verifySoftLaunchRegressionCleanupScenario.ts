import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runPostLaunchTelemetryReadinessAudit } from '@/core/analytics/postLaunchTelemetryReadinessAudit';
import { runCrashPerformanceAudit } from '@/core/crashPerformance/crashPerformanceAudit';
import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { NO_NEW_SYSTEM_FREEZE_REGISTERED_CORE_DIRS } from '@/core/releaseReadiness/noNewSystemFreezeConstants';
import { detectRecentSystemExpansionRisk } from '@/core/releaseReadiness/noNewSystemFreezeAudit';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  SOFT_LAUNCH_COMPLETION_MODULE_REGISTRY,
  SOFT_LAUNCH_MANUAL_BLOCKERS,
  SOFT_LAUNCH_REGRESSION_CLEANUP_DOCS_PATH,
  SOFT_LAUNCH_REGRESSION_CLEANUP_EXPECTED_SAVE_VERSION,
} from './softLaunchRegressionCleanupConstants';
import {
  buildRegressionCleanupSafetyChecks,
  runSoftLaunchRegressionCleanupAudit,
} from './softLaunchRegressionCleanupAudit';
import {
  isAnalyticsSchemaCodeHealthy,
  isAnalyticsSelectorPerfAcceptableForSoftLaunch,
  summarizeFreezeCompliance,
  summarizePrivacyReadiness,
  summarizeSoftLaunchReviewCodeBlockers,
} from './verificationHealthHelpers';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifySoftLaunchRegressionCleanupOutcome = {
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

export function verifySoftLaunchRegressionCleanupScenario(): VerifySoftLaunchRegressionCleanupOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const audit = runSoftLaunchRegressionCleanupAudit({ mode: 'soft_launch_candidate' });
  if (audit.health === 'WARN') hasWarn = true;

  for (const classification of audit.commandClassifications) {
    record(
      assert(
        checks,
        classification.normalizedStatus !== 'FAIL' || classification.codeRegressions.length === 0,
        `${classification.command} classified (${classification.normalizedStatus})`,
        `${classification.command} code regression: ${classification.codeRegressions.join(', ')}`,
      ),
    );
  }

  record(assert(checks, audit.commandClassifications.length === 5, 'Five verify commands classified'));
  record(assert(checks, audit.manualBlockers.length >= 10, 'Manual blockers registry present'));
  record(
    warn(
      checks,
      audit.manualLaunchReadiness === 'BLOCKED',
      'Manual launch readiness BLOCKED (expected)',
      'Manual launch readiness should stay BLOCKED until store/IAP/privacy/crash done',
    ) || true,
  );
  if (audit.manualLaunchReadiness !== 'BLOCKED') hasWarn = true;

  record(
    warn(
      checks,
      audit.launchCandidateDecision === 'blocked',
      'launchCandidateDecision blocked (expected)',
      'Launch candidate should remain blocked',
    ) || true,
  );

  record(assert(checks, SOFT_LAUNCH_MANUAL_BLOCKERS.every((b) => b.status === 'pending'), 'Manual blockers not fake PASS'));
  record(
    assert(
      checks,
      !audit.manualBlockers.some((b) => b.status === 'done' && b.blocksPublicLaunch),
      'Public launch blockers not marked done',
    ),
  );

  const review = summarizeSoftLaunchReviewCodeBlockers('internal_device_test');
  record(assert(checks, review.codeBlockers.length === 0, 'Soft launch review no code blockers (internal)'));
  record(assert(checks, review.manualBlockers.length > 0, 'Soft launch review manual/stale items separated'));

  const freeze = summarizeFreezeCompliance();
  record(assert(checks, freeze.codeExpansionBlockers.length === 0, 'Freeze no code expansion blockers'));
  record(warn(checks, freeze.manualPending > 0, 'Freeze manual pending visible', 'Freeze manual pending missing') || true);
  if (freeze.manualPending > 0) hasWarn = true;

  const privacy = summarizePrivacyReadiness();
  record(assert(checks, privacy.sentryProcessorListed, 'Sentry privacy processor listed'));
  record(
    warn(
      checks,
      privacy.placeholderUrlBlocked,
      'Privacy URL placeholder BLOCKED',
      'Privacy URL should remain placeholder blocker',
    ) || true,
  );

  const telemetry = runPostLaunchTelemetryReadinessAudit({ mode: 'soft_launch_candidate' });
  record(assert(checks, telemetry.eventCoverage.filter((r) => !r.existsInSchema).length === 0, 'Telemetry KPI/funnel coverage intact'));
  record(
    warn(
      checks,
      telemetry.warnings.some((w) => w.id === 'telemetry.crash_sdk_code_ready'),
      'Crash SDK visible in telemetry',
      'Missing telemetry.crash_sdk_code_ready',
    ) || true,
  );

  const crash = runCrashPerformanceAudit();
  record(assert(checks, crash.codeIntegrationPass, 'Crash code integration PASS'));
  record(warn(checks, crash.environmentConfigStatus !== 'ready', 'Sentry env pending WARN', 'Sentry env unexpectedly ready') || true);

  record(assert(checks, isAnalyticsSchemaCodeHealthy(), 'Analytics event schema code healthy'));
  const selector = isAnalyticsSelectorPerfAcceptableForSoftLaunch();
  record(assert(checks, selector.acceptable, 'Performance selector no FAIL regression'));
  if (selector.health === 'WARN') hasWarn = true;

  for (const mod of SOFT_LAUNCH_COMPLETION_MODULE_REGISTRY) {
    record(
      assert(
        checks,
        NO_NEW_SYSTEM_FREEZE_REGISTERED_CORE_DIRS.includes(
          mod.coreDir as (typeof NO_NEW_SYSTEM_FREEZE_REGISTERED_CORE_DIRS)[number],
        ),
        `Freeze registry includes ${mod.id}`,
      ),
    );
  }

  record(assert(checks, detectRecentSystemExpansionRisk().every((v) => v.id !== 'risk.new_core_runtime_dir'), 'No unregistered core runtime dirs'));

  const safety = buildRegressionCleanupSafetyChecks();
  record(assert(checks, safety.saveVersionOk, 'SAVE_VERSION unchanged'));
  record(assert(checks, safety.persistOk, 'persist shape unchanged'));
  record(assert(checks, safety.applyDecisionOk, 'applyDecision unchanged'));
  record(assert(checks, safety.dayPipelineOk, 'dayPipeline unchanged'));
  record(assert(checks, safety.docsOk, 'Regression cleanup docs exist'));

  record(assert(checks, readRepo('src/core/analytics/verifyPostLaunchTelemetryReadinessScenario.ts').includes('progressLog'), 'Telemetry verify progress output'));
  record(assert(checks, !readRepo('src/core/analytics/verifyPostLaunchTelemetryReadinessScenario.ts').includes('verifySoftLaunchReviewScenario()'), 'Telemetry nested soft-launch-review removed'));

  const fullLoop = runFullLoopAnalysis();
  record(assert(checks, fullLoop.totalFAIL === 0, 'verify:full-loop compatible'));
  record(assert(checks, readRepo('package.json').includes('verify:soft-launch-regression-cleanup'), 'package.json script present'));

  if (audit.codeHealth === 'WARN') hasWarn = true;

  return {
    ok,
    warn: hasWarn,
    checks,
    auditHealth: audit.health,
  };
}
