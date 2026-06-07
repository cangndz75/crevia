import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { runNoNewSystemFreezeAudit } from '@/core/releaseReadiness/noNewSystemFreezeAudit';
import { runPrivacyPolicyReadinessAudit } from '@/core/releaseReadiness/privacyPolicyReadinessAudit';
import { runSoftLaunchReadinessReview } from '@/core/releaseReadiness/softLaunchReviewAudit';
import {
  isAnalyticsSchemaCodeHealthy,
  summarizeSoftLaunchReviewCodeBlockers,
} from '@/core/softLaunchRegressionCleanup/verificationHealthHelpers';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import { ANALYTICS_EVENT_DEFINITIONS } from './analyticsSchema';
import { verifyAnalyticsNewSystemsScenario } from './verifyAnalyticsNewSystemsScenario';
import {
  POST_LAUNCH_TELEMETRY_FUNNEL_DEFINITIONS,
  POST_LAUNCH_TELEMETRY_MIN_DASHBOARD_CARDS,
  POST_LAUNCH_TELEMETRY_MIN_FUNNELS,
  POST_LAUNCH_TELEMETRY_MIN_KPI_GROUPS,
  POST_LAUNCH_TELEMETRY_MIN_REVIEW_QUESTIONS,
  POST_LAUNCH_TELEMETRY_READINESS_DOCS_PATH,
} from './postLaunchTelemetryReadinessConstants';
import { runPostLaunchTelemetryReadinessAudit } from './postLaunchTelemetryReadinessAudit';
import {
  buildPostLaunchTelemetryConsoleSummary,
  buildPostLaunchTelemetryReadinessMarkdown,
} from './postLaunchTelemetryReadinessPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyPostLaunchTelemetryReadinessOptions = {
  progress?: boolean;
};

export type VerifyPostLaunchTelemetryReadinessOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  telemetryHealth: string;
};

function progressLog(enabled: boolean, message: string): void {
  if (enabled) {
    // eslint-disable-next-line no-console
    console.log(`[telemetry-verify] ${message}`);
  }
}

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

export function verifyPostLaunchTelemetryReadinessScenario(
  options: VerifyPostLaunchTelemetryReadinessOptions = {},
): VerifyPostLaunchTelemetryReadinessOutcome {
  const progress = options.progress !== false;
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  progressLog(progress, 'audit: post-launch telemetry readiness...');
  const result = runPostLaunchTelemetryReadinessAudit({ mode: 'soft_launch_candidate' });
  const schemaEventCount = ANALYTICS_EVENT_DEFINITIONS.length;

  progressLog(progress, 'audit: soft launch review (internal summary)...');
  const internalReview = runSoftLaunchReadinessReview({ mode: 'internal_device_test' });

  ok =
    assert(
      checks,
      result.kpiGroups.length >= POST_LAUNCH_TELEMETRY_MIN_KPI_GROUPS,
      `KPI groups >= ${POST_LAUNCH_TELEMETRY_MIN_KPI_GROUPS}`,
      `groups=${result.kpiGroups.length}`,
    ) && ok;
  ok =
    assert(
      checks,
      result.funnels.length >= POST_LAUNCH_TELEMETRY_MIN_FUNNELS,
      `Funnels >= ${POST_LAUNCH_TELEMETRY_MIN_FUNNELS}`,
      `funnels=${result.funnels.length}`,
    ) && ok;
  ok =
    assert(
      checks,
      result.dashboardCards.length >= POST_LAUNCH_TELEMETRY_MIN_DASHBOARD_CARDS,
      `Dashboard cards >= ${POST_LAUNCH_TELEMETRY_MIN_DASHBOARD_CARDS}`,
      `cards=${result.dashboardCards.length}`,
    ) && ok;
  ok =
    assert(
      checks,
      result.reviewQuestions.length >= POST_LAUNCH_TELEMETRY_MIN_REVIEW_QUESTIONS,
      `Review questions >= ${POST_LAUNCH_TELEMETRY_MIN_REVIEW_QUESTIONS}`,
      `questions=${result.reviewQuestions.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      result.funnels.some((f) => f.id === 'first_session_funnel'),
      'First session funnel defined',
      'Missing first_session_funnel',
    ) && ok;
  ok =
    assert(
      checks,
      result.funnels.some((f) => f.id === 'day_1_completion_funnel'),
      'Day 1 completion funnel defined',
      'Missing day_1_completion_funnel',
    ) && ok;
  ok =
    assert(
      checks,
      result.funnels.some((f) => f.id === 'pilot_completion_funnel'),
      'Pilot completion funnel defined',
      'Missing pilot_completion_funnel',
    ) && ok;
  ok =
    assert(
      checks,
      result.funnels.some((f) => f.id === 'iap_funnel'),
      'IAP funnel defined',
      'Missing iap_funnel',
    ) && ok;

  ok =
    assert(
      checks,
      result.eventCoverage.length > 0,
      'Event coverage audit runs',
      'Empty coverage',
    ) && ok;
  ok =
    assert(
      checks,
      result.eventCoverage.every((r) => typeof r.existsInSchema === 'boolean'),
      'Coverage schema flags',
      'Invalid coverage rows',
    ) && ok;

  if (
    !warn(
      checks,
      result.warnings.some((w) => w.id === 'telemetry.dashboard_sdk_pending'),
      'Dashboard SDK pending WARN',
      'Missing dashboard SDK WARN',
    )
  ) {
    hasWarn = true;
  }

  ok =
    assert(
      checks,
      result.privacyGuard.rawCopyBlocked && result.privacyGuard.saveDumpBlocked,
      'Raw copy / PII guard PASS',
      'Privacy guard constants missing',
    ) && ok;
  ok =
    assert(
      checks,
      result.privacyGuard.purchasePayloadAligned,
      'Purchase telemetry privacy docs aligned',
      'Purchase privacy misaligned',
    ) && ok;

  const telemetryFindingIds = [
    'telemetry.post_launch_readiness_present',
    'telemetry.kpi_definitions_present',
    'telemetry.funnel_definitions_present',
    'telemetry.dashboard_cards_present',
    'telemetry.privacy_guard_pass',
    'telemetry.dashboard_sdk_pending',
  ];
  for (const id of telemetryFindingIds) {
    ok =
      assert(
        checks,
        internalReview.findings.some((f) => f.id === id),
        `Soft launch review reads ${id}`,
        `Missing ${id}`,
      ) && ok;
  }

  progressLog(progress, 'compatibility: analytics-new-systems...');
  ok = assert(checks, verifyAnalyticsNewSystemsScenario().ok, 'verify:analytics-new-systems compatible', 'analytics-new-systems broken') && ok;

  progressLog(progress, 'compatibility: soft-launch-review (summary, no nested CLI)...');
  const reviewSummary = summarizeSoftLaunchReviewCodeBlockers('internal_device_test');
  if (
    !warn(
      checks,
      reviewSummary.codeBlockers.length === 0,
      'soft-launch-review code health PASS',
      `manual_blocker_or_stale: ${reviewSummary.manualBlockers.join('; ') || 'see soft-launch-review'}`,
    )
  ) {
    hasWarn = true;
  }

  progressLog(progress, 'compatibility: no-new-system-freeze (audit only)...');
  const freezeAudit = runNoNewSystemFreezeAudit({ mode: 'soft_launch_candidate' });
  ok =
    assert(
      checks,
      freezeAudit.violations.filter((v) => v.severity === 'blocker').length === 0,
      'freeze compliance no code expansion blockers',
      `freeze_violations=${freezeAudit.violations.length}`,
    ) && ok;
  if (
    !warn(
      checks,
      freezeAudit.manualBlockers.some((b) => b.status === 'pending'),
      'freeze manual blockers visible',
      'freeze manual blockers missing',
    )
  ) {
    hasWarn = true;
  }

  progressLog(progress, 'compatibility: privacy-policy-readiness (audit only)...');
  const privacyAudit = runPrivacyPolicyReadinessAudit({ mode: 'launch_candidate' });
  ok =
    assert(
      checks,
      isAnalyticsSchemaCodeHealthy(),
      'analytics schema healthy for telemetry pass',
      'analytics schema regression',
    ) && ok;
  if (
    !warn(
      checks,
      privacyAudit.publishedPrivacyUrlIsPlaceholder,
      'manual_blocker: privacy_url_placeholder',
      'privacy URL should remain placeholder blocker',
    )
  ) {
    hasWarn = true;
  }
  if (
    !warn(
      checks,
      privacyAudit.thirdPartyProcessors.some((p) => p.id === 'crash_reporting' && p.name.includes('Sentry')),
      'privacy Sentry processor listed',
      'privacy Sentry processor missing',
    )
  ) {
    hasWarn = true;
  }

  progressLog(progress, 'compatibility: full-loop + full-ux-flow...');
  const fullLoop = runFullLoopAnalysis();
  ok = assert(checks, fullLoop.totalFAIL === 0, 'verify:full-loop compatible', `FAIL=${fullLoop.totalFAIL}`) && ok;
  ok = assert(checks, verifyFullUxFlowScenario().ok, 'verify:full-ux-flow compatible', 'full-ux-flow broken') && ok;
  ok = assert(checks, SAVE_VERSION === 23, 'SAVE_VERSION 23 unchanged', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  ok =
    assert(
      checks,
      ANALYTICS_EVENT_DEFINITIONS.length === schemaEventCount,
      'No new analytics events in verify pass',
      'Event count changed during verify',
    ) && ok;

  const markdown = buildPostLaunchTelemetryReadinessMarkdown(result);
  ok = assert(checks, markdown.includes('## KPI list'), 'Markdown KPI section', 'Missing KPI') && ok;
  ok = assert(checks, markdown.includes('## Funnel definitions'), 'Markdown funnel section', 'Missing funnel') && ok;

  const consoleReport = buildPostLaunchTelemetryConsoleSummary(result);
  ok = assert(checks, consoleReport.length > 200, 'Console summary non-empty', 'Empty console') && ok;

  const doc = readRepo(POST_LAUNCH_TELEMETRY_READINESS_DOCS_PATH);
  ok = assert(checks, doc.length > 500, 'Telemetry readiness docs exist', 'Missing docs') && ok;

  ok =
    assert(
      checks,
      POST_LAUNCH_TELEMETRY_FUNNEL_DEFINITIONS.length >= 5,
      'Constants funnel count',
      'Funnel constants low',
    ) && ok;

  if (result.health === 'WARN') {
    hasWarn = true;
  }
  if (result.warnings.length > 0) {
    hasWarn = true;
  }

  progressLog(progress, 'done.');

  return {
    ok,
    warn: hasWarn,
    checks,
    telemetryHealth: result.health,
  };
}
