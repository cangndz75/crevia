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
  STALE_EXPECTATION_FIXES,
} from './softLaunchRegressionCleanupConstants';
import type {
  RunSoftLaunchRegressionCleanupAuditOptions,
  SoftLaunchManualBlocker,
  SoftLaunchRegressionCleanupResult,
  SoftLaunchVerifyFailureClassification,
  SoftLaunchVerifyCommandId,
} from './softLaunchRegressionCleanupTypes';
import {
  isAnalyticsSchemaCodeHealthy,
  isAnalyticsSelectorPerfAcceptableForSoftLaunch,
  summarizeCrashSdkStatus,
  summarizeFreezeCompliance,
  summarizePrivacyReadiness,
  summarizeSoftLaunchReviewCodeBlockers,
} from './verificationHealthHelpers';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function classifyCommand(
  command: SoftLaunchVerifyCommandId,
): SoftLaunchVerifyFailureClassification {
  const codeRegressions: string[] = [];
  const manualBlockerIds: string[] = [];
  const staleExpectationIds: string[] = [];
  const dashboardPending: string[] = [];
  const environmentPending: string[] = [];

  if (command === 'soft-launch-review') {
    const { codeBlockers, manualBlockers } = summarizeSoftLaunchReviewCodeBlockers('internal_device_test');
    codeRegressions.push(...codeBlockers);
    for (const m of manualBlockers) {
      if (m.startsWith('stale_expectation:')) staleExpectationIds.push(m);
      else manualBlockerIds.push(m);
    }
    const launch = summarizeSoftLaunchReviewCodeBlockers('launch_candidate');
    if (launch.manualBlockers.length > 0) {
      manualBlockerIds.push('launch_candidate_manual_blockers');
    }
  }

  if (command === 'no-new-system-freeze') {
    const freeze = summarizeFreezeCompliance();
    if (freeze.codeExpansionBlockers.length > 0) {
      codeRegressions.push(...freeze.codeExpansionBlockers);
    }
    if (freeze.manualPending > 0) {
      manualBlockerIds.push('freeze.manual_blockers_remaining');
    }
    staleExpectationIds.push('freeze-store-metadata-cascade-removed');
  }

  if (command === 'privacy-policy-readiness') {
    const privacy = summarizePrivacyReadiness();
    if (privacy.placeholderUrlBlocked) {
      manualBlockerIds.push('manual.privacy_policy_url');
    }
    if (!privacy.sentryProcessorListed) {
      codeRegressions.push('privacy.sentry_processor_missing');
    }
    staleExpectationIds.push('privacy-soft-launch-review-cascade-removed');
  }

  if (command === 'post-launch-telemetry-readiness') {
    const telemetry = runPostLaunchTelemetryReadinessAudit({ mode: 'soft_launch_candidate' });
    if (telemetry.blockers.length > 0) {
      codeRegressions.push(...telemetry.blockers.map((b) => b.id));
    }
    if (telemetry.warnings.some((w) => w.id.startsWith('telemetry.dashboard'))) {
      dashboardPending.push('analytics_dashboard_sdk');
    }
    if (telemetry.warnings.some((w) => w.id.startsWith('telemetry.crash_'))) {
      environmentPending.push('sentry_env_smoke_sourcemaps');
    }
    staleExpectationIds.push('telemetry-nested-soft-launch-review-removed');
  }

  if (command === 'analytics-runtime') {
    if (!isAnalyticsSchemaCodeHealthy()) {
      codeRegressions.push('analytics.schema_definitions_fail');
    }
    const selector = isAnalyticsSelectorPerfAcceptableForSoftLaunch();
    if (!selector.acceptable) {
      codeRegressions.push('performance.selector_fail');
    } else if (selector.health === 'WARN') {
      dashboardPending.push('performance_selector_warn');
    }
    manualBlockerIds.push('manual.analytics_sdk_dashboard');
    staleExpectationIds.push('analytics-iap-decoupled-from-selector-perf');
  }

  const codeHealth =
    codeRegressions.length > 0 ? 'FAIL' : dashboardPending.length > 0 || environmentPending.length > 0 ? 'WARN' : 'PASS';

  const manualLaunchReadiness =
    manualBlockerIds.length > 0 ? 'BLOCKED' : codeHealth === 'FAIL' ? 'WARN' : 'READY';

  let normalizedStatus: SoftLaunchVerifyFailureClassification['normalizedStatus'] = 'PASS';
  if (codeRegressions.length > 0) normalizedStatus = 'FAIL';
  else if (manualBlockerIds.length > 0) normalizedStatus = 'BLOCKED';
  else if (dashboardPending.length > 0 || environmentPending.length > 0) normalizedStatus = 'MANUAL_PENDING';
  else if (staleExpectationIds.length > 0) normalizedStatus = 'WARN';

  return {
    command,
    normalizedStatus,
    codeHealth,
    manualLaunchReadiness,
    summary: `${command}: code=${codeHealth}, manual=${manualLaunchReadiness}`,
    codeRegressions,
    manualBlockerIds,
    staleExpectationIds,
    dashboardPending,
    environmentPending,
  };
}

export function runSoftLaunchRegressionCleanupAudit(
  _options: RunSoftLaunchRegressionCleanupAuditOptions = {},
): SoftLaunchRegressionCleanupResult {
  const commands: SoftLaunchVerifyCommandId[] = [
    'soft-launch-review',
    'no-new-system-freeze',
    'privacy-policy-readiness',
    'post-launch-telemetry-readiness',
    'analytics-runtime',
  ];
  const commandClassifications = commands.map(classifyCommand);

  const codeRegressions = [...new Set(commandClassifications.flatMap((c) => c.codeRegressions))];
  const manualBlockers = [...SOFT_LAUNCH_MANUAL_BLOCKERS];
  const dashboardPending = [...new Set(commandClassifications.flatMap((c) => c.dashboardPending))];
  const environmentPending = [...new Set(commandClassifications.flatMap((c) => c.environmentPending))];

  const crash = summarizeCrashSdkStatus();
  const fullLoop = runFullLoopAnalysis();
  if (!crash.codeIntegrationPass) {
    codeRegressions.push('crash.code_integration_incomplete');
  }
  if (fullLoop.totalFAIL > 0) {
    codeRegressions.push(`full_loop_fail_${fullLoop.totalFAIL}`);
  }

  const unregisteredDirs = detectRecentSystemExpansionRisk().filter((v) => v.id === 'risk.new_core_runtime_dir');
  if (unregisteredDirs.length > 0) {
    codeRegressions.push('freeze.unregistered_core_dirs');
  }

  const codeHealth =
    codeRegressions.length > 0 ? 'FAIL' : dashboardPending.length > 0 || environmentPending.length > 0 ? 'WARN' : 'PASS';

  const manualLaunchReadiness: SoftLaunchRegressionCleanupResult['manualLaunchReadiness'] = 'BLOCKED';
  const launchCandidateDecision: SoftLaunchRegressionCleanupResult['launchCandidateDecision'] = 'blocked';

  let health: SoftLaunchRegressionCleanupResult['health'] = 'PASS';
  if (codeHealth === 'FAIL') health = 'BLOCKED';
  else if (manualLaunchReadiness === 'BLOCKED' || codeHealth === 'WARN') health = 'WARN';

  const completionModules = SOFT_LAUNCH_COMPLETION_MODULE_REGISTRY.map((m) => ({
    ...m,
    allowedBeforeSoftLaunch:
      m.allowedBeforeSoftLaunch &&
      NO_NEW_SYSTEM_FREEZE_REGISTERED_CORE_DIRS.includes(
        m.coreDir.replace('src/core/', 'src/core/') as (typeof NO_NEW_SYSTEM_FREEZE_REGISTERED_CORE_DIRS)[number],
      ),
  }));

  return {
    health,
    codeHealth,
    manualLaunchReadiness,
    launchCandidateDecision,
    blockerCount: manualBlockers.filter((b) => b.status === 'pending' && b.blocksPublicLaunch).length,
    manualBlockers: [...manualBlockers],
    codeRegressions,
    staleExpectationsFixed: [...STALE_EXPECTATION_FIXES],
    dashboardPending,
    environmentPending,
    commandClassifications,
    completionModules,
  };
}

export function buildRegressionCleanupSafetyChecks(): {
  saveVersionOk: boolean;
  persistOk: boolean;
  applyDecisionOk: boolean;
  dayPipelineOk: boolean;
  docsOk: boolean;
} {
  return {
    saveVersionOk: SAVE_VERSION === SOFT_LAUNCH_REGRESSION_CLEANUP_EXPECTED_SAVE_VERSION,
    persistOk: !readRepo('src/store/gamePersist.ts').includes('softLaunchRegressionCleanupState'),
    applyDecisionOk: !readRepo('src/core/game/applyDecision.ts').includes('softLaunchRegressionCleanup'),
    dayPipelineOk: !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes(
      'softLaunchRegressionCleanup',
    ),
    docsOk: existsSync(join(REPO_ROOT, SOFT_LAUNCH_REGRESSION_CLEANUP_DOCS_PATH)),
  };
}
