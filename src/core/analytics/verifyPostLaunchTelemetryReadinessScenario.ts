import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { runSoftLaunchReadinessReview } from '@/core/releaseReadiness/softLaunchReviewAudit';
import { verifyNoNewSystemFreezeScenario } from '@/core/releaseReadiness/verifyNoNewSystemFreezeScenario';
import { verifyPrivacyPolicyReadinessScenario } from '@/core/releaseReadiness/verifyPrivacyPolicyReadinessScenario';
import { verifySoftLaunchReviewScenario } from '@/core/releaseReadiness/verifySoftLaunchReviewScenario';
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

export type VerifyPostLaunchTelemetryReadinessOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  telemetryHealth: string;
};

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

export function verifyPostLaunchTelemetryReadinessScenario(): VerifyPostLaunchTelemetryReadinessOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const result = runPostLaunchTelemetryReadinessAudit({ mode: 'soft_launch_candidate' });
  const internalReview = runSoftLaunchReadinessReview({ mode: 'internal_device_test' });
  const schemaEventCount = ANALYTICS_EVENT_DEFINITIONS.length;

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

  ok = assert(checks, verifyAnalyticsNewSystemsScenario().ok, 'verify:analytics-new-systems compatible', 'Broken') && ok;
  ok = assert(checks, verifySoftLaunchReviewScenario().ok, 'verify:soft-launch-review compatible', 'Broken') && ok;
  ok = assert(checks, verifyNoNewSystemFreezeScenario().ok, 'verify:no-new-system-freeze compatible', 'Broken') && ok;
  ok = assert(checks, verifyPrivacyPolicyReadinessScenario().ok, 'verify:privacy-policy-readiness compatible', 'Broken') && ok;

  const fullLoop = runFullLoopAnalysis();
  ok = assert(checks, fullLoop.totalFAIL === 0, 'verify:full-loop compatible', `FAIL=${fullLoop.totalFAIL}`) && ok;
  ok = assert(checks, verifyFullUxFlowScenario().ok, 'verify:full-ux-flow compatible', 'Broken') && ok;
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

  return {
    ok,
    warn: hasWarn,
    checks,
    telemetryHealth: result.health,
  };
}
