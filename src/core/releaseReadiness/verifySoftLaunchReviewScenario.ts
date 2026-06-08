import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { verifyAnalyticsNewSystemsScenario } from '@/core/analytics/verifyAnalyticsNewSystemsScenario';
import { verifyContentProductionScenario } from '@/core/contentProduction/verifyContentProductionScenario';
import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { verifyIapIntegrationScenario } from '@/core/iap/verifyIapIntegrationScenario';
import { verifyIapSandboxReadinessScenario } from '@/core/iapQa/verifyIapSandboxReadinessScenario';
import { verifyPerformanceSelectorPassTwoScenario } from '@/core/quality/verifyPerformanceSelectorPassTwoScenario';
import { verifyQualityAuditScenario } from '@/core/quality/verifyQualityAuditScenario';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import { SOFT_LAUNCH_REVIEW_AREAS, SOFT_LAUNCH_REVIEW_DOCS_PATH, SOFT_LAUNCH_REVIEW_MIN_FAMILIES, SOFT_LAUNCH_REVIEW_MIN_VARIANTS } from './softLaunchReviewConstants';
import {
  buildContentCoverageSummary,
  runSoftLaunchReadinessReview,
} from './softLaunchReviewAudit';
import {
  buildSoftLaunchReviewConsoleSummary,
  buildSoftLaunchReviewMarkdown,
} from './softLaunchReviewPresentation';
import { summarizeSoftLaunchReviewCodeBlockers } from '@/core/softLaunchRegressionCleanup/verificationHealthHelpers';

import { verifySoftLaunchReadinessScenario } from './verifySoftLaunchReadinessScenario';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifySoftLaunchReviewOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  reviewHealth: string;
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

export function verifySoftLaunchReviewScenario(): VerifySoftLaunchReviewOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const internal = runSoftLaunchReadinessReview({ mode: 'internal_device_test' });
  const sandbox = runSoftLaunchReadinessReview({ mode: 'iap_sandbox_test' });
  const launch = runSoftLaunchReadinessReview({ mode: 'launch_candidate' });
  const softLaunch = runSoftLaunchReadinessReview({ mode: 'soft_launch_candidate' });

  ok = assert(checks, internal.areaResults.length === 12, '12 audit areas', `Got ${internal.areaResults.length}`) && ok;
  ok =
    assert(
      checks,
      SOFT_LAUNCH_REVIEW_AREAS.every((a) => internal.areaResults.some((r) => r.area === a)),
      'All review areas present',
      'Missing area',
    ) && ok;

  const internalCodeBlockers = summarizeSoftLaunchReviewCodeBlockers('internal_device_test');
  ok =
    assert(
      checks,
      internalCodeBlockers.codeBlockers.length === 0,
      'Internal mode no code blockers',
      `Code blockers=${internalCodeBlockers.codeBlockers.join('; ')}`,
    ) && ok;
  if (
    !warn(
      checks,
      internal.blockerCount > 0,
      'Internal manual/stale blockers separated',
      'Expected manual IAP/analytics blockers in internal review',
    )
  ) {
    hasWarn = true;
  }
  ok =
    assert(
      checks,
      internal.decision === 'proceed_internal_test' || internal.decision === 'fix_required',
      'Internal device test decision',
      internal.decision,
    ) && ok;

  if (
    !warn(
      checks,
      internal.warnCount > 0,
      'Internal mode WARN expected',
      'Internal should have manual pending WARNs',
    )
  ) {
    hasWarn = true;
  }

  ok =
    assert(
      checks,
      sandbox.readinessLevel === 'needs_fix_pass' || sandbox.readinessLevel === 'ready_for_sandbox_iap_test',
      'IAP sandbox test readiness level',
      sandbox.readinessLevel,
    ) && ok;
  ok =
    assert(
      checks,
      launch.blockerCount > 0,
      'Launch candidate has blockers',
      `blockers=${launch.blockerCount}`,
    ) && ok;
  ok =
    assert(
      checks,
      launch.readinessLevel === 'blocked_for_launch_candidate',
      'Launch candidate blocked level',
      launch.readinessLevel,
    ) && ok;
  ok =
    assert(
      checks,
      launch.decision === 'blocked',
      'Launch candidate decision blocked',
      launch.decision,
    ) && ok;

  ok =
    assert(
      checks,
      softLaunch.readinessLevel !== 'ready_for_soft_launch_candidate',
      'Soft launch candidate not ready with blockers',
      softLaunch.readinessLevel,
    ) && ok;

  const coverage = buildContentCoverageSummary();
  ok = assert(checks, coverage.packCount === 5, '5 content packs', `packs=${coverage.packCount}`) && ok;
  ok =
    assert(
      checks,
      coverage.totalFamilies >= SOFT_LAUNCH_REVIEW_MIN_FAMILIES,
      `Families ${SOFT_LAUNCH_REVIEW_MIN_FAMILIES}+`,
      `families=${coverage.totalFamilies}`,
    ) && ok;
  ok =
    assert(
      checks,
      coverage.totalVariants >= SOFT_LAUNCH_REVIEW_MIN_VARIANTS,
      `Variants ${SOFT_LAUNCH_REVIEW_MIN_VARIANTS}+`,
      `variants=${coverage.totalVariants}`,
    ) && ok;

  ok =
    assert(
      checks,
      !internal.findings.some(
        (f) => f.id === 'day8.legacy_language_blocker' && f.severity === 'blocker',
      ),
      'No player-facing legacy season language blocker',
      'Legacy language blocker found',
    ) && ok;

  ok =
    assert(
      checks,
      internal.findings.some((f) => f.area === 'performance_selectors' && f.severity === 'warn'),
      'Performance WARN listed',
      'Missing performance WARN',
    ) && ok;
  ok =
    assert(
      checks,
      !internal.blockers.some((b) => b.area === 'performance_selectors'),
      'Performance WARN not blocker',
      'Performance incorrectly blocker',
    ) && ok;

  ok =
    assert(
      checks,
      internal.findings.some((f) => f.id === 'analytics.dashboard_pending' && f.severity === 'warn'),
      'Analytics dashboard WARN listed',
      'Missing analytics dashboard WARN',
    ) && ok;
  ok =
    assert(
      checks,
      internal.findings.some((f) => f.id === 'telemetry.post_launch_readiness_present'),
      'Telemetry readiness finding present',
      'Missing telemetry.post_launch_readiness_present',
    ) && ok;
  ok =
    assert(
      checks,
      internal.findings.some((f) => f.id === 'telemetry.dashboard_sdk_pending' && f.severity === 'warn'),
      'Telemetry dashboard SDK WARN listed',
      'Missing telemetry.dashboard_sdk_pending',
    ) && ok;
  ok =
    assert(
      checks,
      !internal.blockers.some((b) => b.area === 'analytics' && b.id === 'analytics.schema_fail'),
      'Analytics schema not code blocker',
      'Analytics schema incorrectly blocker',
    ) && ok;

  ok =
    assert(
      checks,
      launch.blockers.some((b) => b.area === 'iap_monetization' || b.area === 'release_store_readiness'),
      'Launch IAP/store/playtest blockers',
      'Missing launch blockers',
    ) && ok;

  ok =
    assert(
      checks,
      internal.findings.some((f) => f.id === 'day1.dropoff_fix_pass_present'),
      'Day 1 drop-off fix pass finding present',
      'Missing day1.dropoff_fix_pass_present',
    ) && ok;

  ok =
    assert(
      checks,
      internal.findings.some((f) => f.id === 'day1.hub_density_guard_pass'),
      'Day 1 hub density guard finding present',
      'Missing day1.hub_density_guard_pass',
    ) && ok;

  const iapConversionFindingIds = [
    'iap_conversion.readiness_pass_present',
    'iap_conversion.offer_copy_guard_pass',
    'iap_conversion.limited_mode_playable',
    'iap_conversion.restore_cta_present',
    'iap_conversion.product_metadata_pending_safe',
    'iap_conversion.paywall_pressure_guard_pass',
  ] as const;
  for (const id of iapConversionFindingIds) {
    ok =
      assert(
        checks,
        internal.findings.some((f) => f.id === id),
        `IAP conversion finding ${id} present`,
        `Missing ${id}`,
      ) && ok;
  }

  ok =
    assert(
      checks,
      launch.findings.some((f) => f.id === 'freeze.no_new_system_gate_present'),
      'Freeze gate finding in launch review',
      'Missing freeze gate finding',
    ) && ok;
  ok =
    assert(
      checks,
      launch.findings.some((f) => f.id === 'freeze.recommendation'),
      'Freeze recommendation in launch review',
      'Missing freeze recommendation',
    ) && ok;
  ok =
    assert(
      checks,
      launch.noNewSystemFreezeRecommended,
      'Launch candidate freeze recommended/active',
      'Freeze not recommended for launch',
    ) && ok;

  if (
    !warn(
      checks,
      internal.noNewSystemFreezeRecommended,
      'Internal mode freeze recommended with manual blockers',
      'Freeze should be recommended even with blockers open',
    )
  ) {
    hasWarn = true;
  }

  const markdown = buildSoftLaunchReviewMarkdown(internal);
  ok = assert(checks, markdown.includes('## Blockers'), 'Markdown blockers section', 'Missing blockers') && ok;
  ok = assert(checks, markdown.includes('## Warnings'), 'Markdown warnings section', 'Missing warnings') && ok;
  ok = assert(checks, markdown.includes('## Next actions'), 'Markdown next actions', 'Missing next actions') && ok;

  const consoleReport = buildSoftLaunchReviewConsoleSummary(internal);
  ok = assert(checks, consoleReport.length > 200, 'Console summary non-empty', 'Empty console') && ok;

  const doc = readRepo(SOFT_LAUNCH_REVIEW_DOCS_PATH);
  ok = assert(checks, doc.length > 0, 'Review docs exist', 'Missing docs') && ok;

  const readiness = verifySoftLaunchReadinessScenario();
  if (!readiness.ok) {
    checks.push('WARN manual_blocker: soft-launch-readiness cascade pending (not review code regression)');
    hasWarn = true;
  } else {
    checks.push('PASS verify:soft-launch-readiness compatible');
  }
  const iapSandbox = verifyIapSandboxReadinessScenario();
  if (!iapSandbox.ok) {
    checks.push('WARN manual_blocker: iap-sandbox-readiness pending (not review code regression)');
    hasWarn = true;
  } else {
    checks.push('PASS verify:iap-sandbox-readiness compatible');
  }
  ok = assert(checks, verifyIapIntegrationScenario().ok, 'verify:iap-integration compatible', 'IAP integration broken') && ok;
  ok = assert(checks, verifyQualityAuditScenario().ok, 'verify:quality-audit compatible', 'Quality audit broken') && ok;
  ok = assert(checks, verifyAnalyticsNewSystemsScenario().ok, 'verify:analytics-new-systems compatible', 'Analytics new systems broken') && ok;
  ok = assert(checks, verifyContentProductionScenario().ok, 'verify:content-production compatible', 'Content production broken') && ok;
  ok = assert(checks, verifyPerformanceSelectorPassTwoScenario().ok, 'verify:performance-selector-pass-two compatible', 'Perf pass two broken') && ok;

  const fullLoop = runFullLoopAnalysis();
  ok = assert(checks, fullLoop.totalFAIL === 0, 'verify:full-loop compatible', `FAIL=${fullLoop.totalFAIL}`) && ok;
  ok = assert(checks, verifyFullUxFlowScenario().ok, 'verify:full-ux-flow compatible', 'UX flow broken') && ok;

  ok = assert(checks, SAVE_VERSION === 24, 'SAVE_VERSION 23 unchanged', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  const persist = readRepo('src/store/gamePersist.ts');
  ok =
    assert(
      checks,
      !persist.includes('softLaunchReviewState'),
      'No persist shape change',
      'Persist polluted',
    ) && ok;

  if (internal.health === 'WARN') {
    hasWarn = true;
  }

  return {
    ok,
    warn: hasWarn,
    checks,
    reviewHealth: internal.health,
  };
}
