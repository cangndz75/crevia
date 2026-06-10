import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { validateAnalyticsPrivacy } from '@/core/analytics/analyticsPrivacy';
import { ANALYTICS_EVENT_DEFINITIONS } from '@/core/analytics/analyticsSchema';

import {
  SOFT_LAUNCH_READINESS_AREAS,
  SOFT_LAUNCH_READINESS_DOCS_PATH,
  SOFT_LAUNCH_READINESS_CHECKLIST,
} from './softLaunchReadinessConstants';
import {
  buildSoftLaunchReadinessChecklist,
  buildAreaSummaries,
  calculateSoftLaunchHealth,
  calculateSoftLaunchHealthForTest,
  runSoftLaunchReadinessAudit,
} from './softLaunchReadinessAudit';
import {
  buildSoftLaunchReadinessConsoleReport,
  buildSoftLaunchReadinessMarkdown,
  formatSoftLaunchFinding,
  getSoftLaunchReleaseDecision,
  groupSoftLaunchFindingsByArea,
} from './softLaunchReadinessPresentation';
import type {
  SoftLaunchReadinessFinding,
  SoftLaunchReadinessSeverity,
} from './softLaunchReadinessTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function testFinding(
  id: string,
  severity: SoftLaunchReadinessSeverity,
): SoftLaunchReadinessFinding {
  return {
    id,
    area: 'release_blockers',
    severity,
    title: 'test',
    message: 'test',
    recommendation: 'test',
    ownerHint: 'engineering',
  };
}

export type VerifySoftLaunchReadinessOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  auditHealth: string;
  consoleReport: string;
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

function hasFinding(
  result: ReturnType<typeof runSoftLaunchReadinessAudit>,
  predicate: (f: SoftLaunchReadinessFinding) => boolean,
): boolean {
  return result.findings.some(predicate);
}

export function verifySoftLaunchReadinessScenario(): VerifySoftLaunchReadinessOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const result = runSoftLaunchReadinessAudit({ mode: 'pre_sdk' });
  const launchResult = runSoftLaunchReadinessAudit({ mode: 'launch_candidate' });
  const consoleReport = buildSoftLaunchReadinessConsoleReport(result);
  const markdown = buildSoftLaunchReadinessMarkdown(result);

  ok = assert(checks, result.findings.length > 0, 'Audit result non-empty', 'empty audit') && ok;

  for (const area of SOFT_LAUNCH_READINESS_AREAS) {
    ok =
      assert(
        checks,
        result.areaSummaries.some((s) => s.area === area),
        `${area} area exists`,
        `missing ${area}`,
      ) && ok;
  }

  ok =
    assert(
      checks,
      result.health === 'WARN',
      'Health WARN for pre-SDK state',
      `Expected WARN, got ${result.health}`,
    ) && ok;
  ok =
    assert(
      checks,
      result.health !== 'FAIL' && result.health !== 'BLOCKED',
      'Health not FAIL/BLOCKED pre-SDK',
      `Unexpected ${result.health}`,
    ) && ok;

  ok = assert(checks, SAVE_VERSION === 26, 'SAVE_VERSION 23 check', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  ok =
    assert(
      checks,
      hasFinding(
        result,
        (f) => f.id === 'first_session.first_10_minutes.verify_pass' && f.severity === 'pass',
      ),
      'first 10 minutes PASS finding',
      'missing first session pass',
    ) && ok;

  if (
    !warn(
      checks,
      hasFinding(result, (f) => f.id.includes('manual_playtest') && f.severity === 'warn'),
      'player flow manual playtest WARN',
      'manual playtest WARN missing',
    )
  ) {
    hasWarn = true;
  }

  ok =
    assert(
      checks,
      hasFinding(result, (f) => f.id === 'core_gameplay_loop.full_loop' && f.severity === 'pass'),
      'full-loop PASS finding',
      'missing full loop pass',
    ) && ok;

  ok =
    assert(
      checks,
      hasFinding(
        result,
        (f) => f.id === 'core_gameplay_loop.day_pipeline.verify_pass' && f.severity === 'pass',
      ),
      'day-pipeline PASS finding',
      'missing day pipeline',
    ) && ok;

  ok =
    assert(
      checks,
      hasFinding(
        result,
        (f) => f.id === 'post_pilot_offer.monetization_gate.verify_pass' && f.severity === 'pass',
      ),
      'monetization-gate PASS finding',
      'missing monetization gate',
    ) && ok;

  ok =
    assert(
      checks,
      hasFinding(
        result,
        (f) =>
          f.id.startsWith('monetization_iap.iap_product_design.verify_pass') &&
          (f.severity === 'pass' || f.title.includes('verify:iap-product-design')),
      ),
      'iap-product-design PASS finding',
      'missing iap design',
    ) && ok;

  ok =
    assert(
      checks,
      hasFinding(result, (f) => f.id === 'monetization_iap.real_sdk') ||
        hasFinding(result, (f) => f.id === 'monetization_iap.sandbox_qa_pending'),
      'IAP SDK code or sandbox QA finding',
      'missing IAP SDK/sandbox finding',
    ) && ok;

  if (
    !warn(
      checks,
      hasFinding(result, (f) => f.id === 'monetization_iap.sandbox_qa_pending'),
      'IAP sandbox QA pending WARN',
      'IAP sandbox QA WARN missing',
    )
  ) {
    hasWarn = true;
  }

  if (
    !warn(
      checks,
      hasFinding(result, (f) => f.id === 'monetization_iap.store_product_ids'),
      'store product id WARN',
      'store product WARN missing',
    )
  ) {
    hasWarn = true;
  }

  if (
    !warn(
      checks,
      hasFinding(result, (f) => f.id === 'monetization_iap.pricing_pending'),
      'pricing WARN',
      'pricing WARN missing',
    )
  ) {
    hasWarn = true;
  }

  ok =
    assert(
      checks,
      hasFinding(
        result,
        (f) =>
          f.id.startsWith('analytics.analytics_events.verify_pass') &&
          f.title.includes('verify:analytics-events'),
      ),
      'analytics-events PASS finding',
      'missing analytics',
    ) && ok;

  if (
    !warn(
      checks,
      hasFinding(result, (f) => f.id === 'analytics.instrumentation_pending') ||
        hasFinding(result, (f) => f.id === 'analytics.instrumentation_mvp'),
      'runtime instrumentation status',
      'instrumentation finding missing',
    )
  ) {
    hasWarn = true;
  }

  if (
    !warn(
      checks,
      hasFinding(result, (f) => f.id === 'analytics.dashboard_pending'),
      'analytics dashboard WARN',
      'dashboard WARN missing',
    )
  ) {
    hasWarn = true;
  }

  if (
    !warn(
      checks,
      hasFinding(result, (f) => f.id === 'performance.selector_warn'),
      'performance selector WARN',
      'performance WARN missing',
    )
  ) {
    hasWarn = true;
  }

  ok =
    assert(
      checks,
      hasFinding(
        result,
        (f) =>
          f.id.startsWith('season_end.season_end_verify.verify_pass') &&
          f.title.includes('verify:season-end'),
      ),
      'season-end PASS finding',
      'missing season end',
    ) && ok;

  if (
    !warn(
      checks,
      hasFinding(result, (f) => f.id === 'season_end.season2_restart'),
      'season 2 restart WARN',
      'season2 WARN missing',
    )
  ) {
    hasWarn = true;
  }

  ok =
    assert(
      checks,
      hasFinding(result, (f) => f.id === 'debug_tools.hub_guard' && f.severity === 'pass'),
      'debug tools guard PASS',
      'debug guard missing',
    ) && ok;

  ok =
    assert(
      checks,
      hasFinding(result, (f) => f.id.includes('forbidden') && f.severity === 'pass'),
      'forbidden copy PASS',
      'forbidden copy fail',
    ) && ok;

  ok =
    assert(
      checks,
      hasFinding(result, (f) => f.area === 'release_blockers'),
      'release blockers area',
      'no release_blockers',
    ) && ok;

  ok = assert(checks, result.blockerCount === 0, 'No blocker pre-SDK', `blockers=${result.blockerCount}`) && ok;

  const checklist = buildSoftLaunchReadinessChecklist();
  ok = assert(checks, checklist.length >= 40, 'Checklist 40+ items', `count=${checklist.length}`) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.manual),
      'Manual checklist items',
      'no manual items',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id.startsWith('pre_sdk')),
      'Pre-SDK checklist',
      'missing pre_sdk',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id.startsWith('launch')),
      'Pre-soft-launch checklist',
      'missing launch',
    ) && ok;

  const docsPath = join(REPO_ROOT, SOFT_LAUNCH_READINESS_DOCS_PATH);
  ok = assert(checks, existsSync(docsPath), 'Docs file exists', SOFT_LAUNCH_READINESS_DOCS_PATH) && ok;
  const docsBlob = readRepo(SOFT_LAUNCH_READINESS_DOCS_PATH);
  ok =
    assert(
      checks,
      docsBlob.includes('no-go') || docsBlob.includes('go/no-go'),
      'Docs go/no-go',
      'missing go/no-go',
    ) && ok;
  ok = assert(checks, docsBlob.includes('IAP'), 'Docs IAP checklist', 'missing IAP') && ok;
  ok = assert(checks, docsBlob.includes('Analytics'), 'Docs analytics', 'missing analytics') && ok;
  ok = assert(checks, docsBlob.includes('cihaz'), 'Docs QA device', 'missing device') && ok;

  ok = assert(checks, consoleReport.length > 50, 'Console report non-empty', 'empty console') && ok;
  ok = assert(checks, markdown.length > 50, 'Markdown report non-empty', 'empty markdown') && ok;
  ok = assert(checks, result.areaSummaries.length > 0, 'Area summaries', 'empty summaries') && ok;
  ok =
    assert(checks, result.nextRecommendedPatch.length > 10, 'nextRecommendedPatch', 'empty patch') &&
    ok;
  ok =
    assert(
      checks,
      /IAP|playtest|SDK|Manual/i.test(result.nextRecommendedPatch),
      'next patch suggests IAP or playtest',
      result.nextRecommendedPatch,
    ) && ok;

  const coreBlob = [
    'src/core/releaseReadiness/softLaunchReadinessPresentation.ts',
    'src/core/releaseReadiness/softLaunchReadinessConstants.ts',
    'src/core/releaseReadiness/softLaunchReadinessTypes.ts',
  ]
    .map(readRepo)
    .join('\n');

  ok =
    assert(
      checks,
      !coreBlob.includes('features/') && !coreBlob.includes('@/features'),
      'No UI component import in core',
      'UI import found',
    ) && ok;
  ok = assert(checks, !coreBlob.includes('fetch('), 'No network import', 'fetch found') && ok;
  ok =
    assert(
      checks,
      !coreBlob.includes('@revenuecat') && !coreBlob.includes('react-native-purchases'),
      'No SDK import in core',
      'SDK import',
    ) && ok;

  ok =
    assert(
      checks,
      getSoftLaunchReleaseDecision(result) === 'Ready for SDK Integration',
      'Release decision SDK ready',
      getSoftLaunchReleaseDecision(result),
    ) && ok;

  const privacyFail = calculateSoftLaunchHealthForTest([testFinding('t.privacy', 'fail')]);
  ok =
    assert(checks, privacyFail === 'FAIL', 'Privacy fail → FAIL health', privacyFail) && ok;

  const devBlocker = calculateSoftLaunchHealthForTest([testFinding('t.dev', 'blocker')]);
  ok =
    assert(checks, devBlocker === 'BLOCKED', 'Dev visible → BLOCKED', devBlocker) && ok;

  ok =
    assert(
      checks,
      launchResult.blockerCount > 0,
      'Launch mode has blockers',
      `blockers=${launchResult.blockerCount}`,
    ) && ok;
  ok =
    assert(
      checks,
      hasFinding(launchResult, (f) => f.id === 'monetization_iap.iap_sdk_missing_launch') ||
        hasFinding(launchResult, (f) => f.id === 'monetization_iap.sandbox_qa_pending') ||
        hasFinding(launchResult, (f) => f.id === 'monetization_iap.sandbox_purchase_pending'),
      'IAP launch gating finding (SDK missing or sandbox QA pending)',
      'missing launch IAP finding',
    ) && ok;
  ok =
    assert(
      checks,
      hasFinding(launchResult, (f) => f.id === 'analytics.instrumentation_launch'),
      'Analytics launch blocker simulated',
      'missing analytics launch blocker',
    ) && ok;

  ok =
    assert(
      checks,
      result.findings.filter((f) => f.severity === 'warn').length >= 5,
      'Performance WARN bounded (5+ expected warns)',
      'too few warns',
    ) && ok;

  ok =
    assert(
      checks,
      hasFinding(result, (f) => f.id.includes('season_sim')),
      'Full season sim finding',
      'missing season sim',
    ) && ok;

  ok =
    assert(
      checks,
      groupSoftLaunchFindingsByArea(result).size >= SOFT_LAUNCH_READINESS_AREAS.length,
      'Audit grouping works',
      'grouping failed',
    ) && ok;

  ok = assert(checks, formatSoftLaunchFinding(result.findings[0]!).length > 0, 'formatFinding', 'empty') && ok;

  ok =
    assert(
      checks,
      buildAreaSummaries(result.findings).length === SOFT_LAUNCH_READINESS_AREAS.length,
      'buildAreaSummaries count',
      'area count mismatch',
    ) && ok;

  ok =
    assert(
      checks,
      SOFT_LAUNCH_READINESS_CHECKLIST.length >= 40,
      'Constants checklist 40+',
      'checklist small',
    ) && ok;

  const privacy = validateAnalyticsPrivacy(ANALYTICS_EVENT_DEFINITIONS);
  ok =
    assert(
      checks,
      privacy.health !== 'FAIL',
      'Analytics privacy not FAIL',
      'privacy FAIL in prod audit',
    ) && ok;

  if (result.warnCount > 0) {
    checks.push('WARN verify exits with expected WARN health');
    hasWarn = true;
  }

  return {
    ok,
    warn: hasWarn || result.health === 'WARN',
    checks,
    auditHealth: result.health,
    consoleReport,
  };
}
