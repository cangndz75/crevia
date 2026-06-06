import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { verifyNoNewSystemFreezeScenario } from '@/core/releaseReadiness/verifyNoNewSystemFreezeScenario';
import { runSoftLaunchReadinessReview } from '@/core/releaseReadiness/softLaunchReviewAudit';
import { verifySoftLaunchReviewScenario } from '@/core/releaseReadiness/verifySoftLaunchReviewScenario';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { createDay1Seed } from '@/core/content/day1Seed';
import { buildEventResultSystemsEchoModel } from '@/core/events/eventResultNewSystemsPresentation';
import { buildHubOpenEndedIntegrationModel } from '@/core/hub/hubOpenEndedIntegrationPresentation';
import { buildReportSystemsIntegrationModel } from '@/core/reports/reportSystemsIntegrationPresentation';
import { createInitialMonetizationState } from '@/core/monetization/monetizationState';
import type { DailyReport } from '@/core/models/DailyReport';
import { verifyDispatchFieldUiScenario } from '@/features/events/verifyDispatchFieldUiScenario';
import { verifyEventResultUiScenario } from '@/features/events/verifyEventResultUiScenario';
import { verifyHubUiScenario } from '@/features/hub/verifyHubUiScenario';
import { verifyReportUiScenario } from '@/features/reports/verifyReportUiScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  DAY_ONE_DROPOFF_FIX_DOCS_PATH,
  DAY_ONE_HUB_MAX_FEATURED_CARDS,
  DAY_ONE_REPORT_MAX_SYSTEM_LINES,
  DAY_ONE_RESULT_MAX_ECHO_LINES,
} from './dayOneDropoffFixConstants';
import {
  buildDayOneDropoffSoftLaunchFindings,
  getDayOneDropoffAuditAreaCount,
  runDayOneDropoffFixAudit,
} from './dayOneDropoffFixAudit';
import {
  buildDayOneDropoffFixConsoleSummary,
  buildDayOneDropoffFixMarkdown,
} from './dayOneDropoffFixPresentation';
import { verifyFirstTenMinutesScenario } from './verifyFirstTenMinutesScenario';
import { buildHubCardVisibilityModel, shouldHideAdvancedSystemForFirstTenMinutes } from './firstTenMinutesPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyDayOneDropoffFixOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  auditHealth: string;
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

function sampleDay1Report(): DailyReport {
  return {
    day: 1,
    title: 'Gün 1',
    stats: [],
    rewardTitle: 'İlk gün',
    summaryLines: ['Test'],
    carryOverSummaryLines: [],
  };
}

function day1Gs() {
  const seed = createDay1Seed();
  return {
    ...seed.gameState,
    city: { ...seed.gameState.city, day: 1 },
    pilot: { ...seed.gameState.pilot, status: 'active' as const, currentPilotDay: 1 },
  };
}

export function verifyDayOneDropoffFixScenario(): VerifyDayOneDropoffFixOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const audit = runDayOneDropoffFixAudit();
  const sl = buildDayOneDropoffSoftLaunchFindings(audit);
  const gs = day1Gs();
  const monetization = createInitialMonetizationState();
  const hub = buildHubCardVisibilityModel(gs, monetization);

  ok =
    assert(
      checks,
      getDayOneDropoffAuditAreaCount() >= 15,
      `Audit areas >= 15 (${getDayOneDropoffAuditAreaCount()})`,
      'Insufficient audit areas',
    ) && ok;

  ok =
    assert(
      checks,
      hub.maxFeaturedCards <= DAY_ONE_HUB_MAX_FEATURED_CARDS,
      'Day 1 Hub max density guard',
      `maxFeatured=${hub.maxFeaturedCards}`,
    ) && ok;

  ok =
    assert(
      checks,
      !hub.showOpenEndedCard && !hub.showQuickPreparationStrip && !hub.showOperationSignalsCard,
      'Day 1 Hub secondary surfaces suppressed',
      'Hub surfaces not suppressed',
    ) && ok;

  ok =
    assert(
      checks,
      buildHubOpenEndedIntegrationModel({ gameState: gs, day: 1 }).visible === false,
      'Day 1 operation era / open-ended hidden',
      'Open-ended visible on Day 1',
    ) && ok;

  ok =
    assert(
      checks,
      shouldHideAdvancedSystemForFirstTenMinutes(gs, 'story_chain', monetization),
      'Day 1 story chain hidden',
      'Story chain not hidden',
    ) && ok;

  ok =
    assert(
      checks,
      shouldHideAdvancedSystemForFirstTenMinutes(gs, 'district_operation_action', monetization),
      'Day 1 district operation action hidden',
      'District action not hidden',
    ) && ok;

  ok =
    assert(
      checks,
      shouldHideAdvancedSystemForFirstTenMinutes(gs, 'operation_era', monetization),
      'Day 1 operation era hidden',
      'Operation era not hidden',
    ) && ok;

  const resultEcho = buildEventResultSystemsEchoModel({ day: 1 });
  ok =
    assert(
      checks,
      resultEcho.lines.length <= DAY_ONE_RESULT_MAX_ECHO_LINES,
      'Result Day 1 max echo line guard',
      `lines=${resultEcho.lines.length}`,
    ) && ok;

  const reportSystems = buildReportSystemsIntegrationModel({
    day: 1,
    dailyReport: sampleDay1Report(),
  });
  ok =
    assert(
      checks,
      reportSystems.lines.length <= DAY_ONE_REPORT_MAX_SYSTEM_LINES,
      'Day 1 report density safe',
      `lines=${reportSystems.lines.length}`,
    ) && ok;

  ok = assert(checks, audit.copyGuard.passed, 'Copy guard forbidden terms', 'Copy violations') && ok;

  const hubFile = readRepo('src/features/hub/components/HubReferenceHome.tsx');
  ok =
    assert(
      checks,
      hubFile.includes('numberOfLines') &&
        hubFile.includes('flexShrink') &&
        hubFile.includes('minWidth'),
      'Layout guard numberOfLines/flexShrink/minWidth',
      'Missing layout guards in HubReferenceHome',
    ) && ok;

  ok = assert(checks, sl.dropoffFixPassPresent, 'Fix pass docs present', 'Missing docs') && ok;
  ok = assert(checks, sl.hubDensityGuardPass, 'Soft launch hub density finding', 'Hub density fail') && ok;
  ok = assert(checks, sl.eventFlowCtaGuardPass, 'Soft launch event flow CTA finding', 'CTA fail') && ok;
  ok = assert(checks, sl.reportDensityGuardPass, 'Soft launch report density finding', 'Report density fail') && ok;
  ok =
    assert(
      checks,
      sl.forbiddenAdvancedSystemsHidden,
      'Soft launch forbidden systems hidden',
      'Advanced systems visible',
    ) && ok;
  ok = assert(checks, sl.copyGuardPass, 'Soft launch copy guard finding', 'Copy guard fail') && ok;

  const review = runSoftLaunchReadinessReview({ mode: 'internal_device_test' });
  const day1FindingIds = [
    'day1.dropoff_fix_pass_present',
    'day1.hub_density_guard_pass',
    'day1.event_flow_cta_guard_pass',
    'day1.report_density_guard_pass',
    'day1.forbidden_advanced_systems_hidden',
    'day1.copy_guard_pass',
  ];
  for (const id of day1FindingIds) {
    ok =
      assert(
        checks,
        review.findings.some((f) => f.id === id),
        `Soft launch review reads ${id}`,
        `Missing ${id}`,
      ) && ok;
  }

  ok = assert(checks, verifyNoNewSystemFreezeScenario().ok, 'verify:no-new-system-freeze compatible', 'Freeze broken') && ok;
  ok = assert(checks, verifyFirstTenMinutesScenario().ok, 'verify:first-10-minutes compatible', 'First10 broken') && ok;
  ok = assert(checks, verifyHubUiScenario().ok, 'verify:hub-ui compatible', 'Hub UI broken') && ok;
  ok = assert(checks, verifyDispatchFieldUiScenario().ok, 'verify:dispatch-field-ui compatible', 'Dispatch broken') && ok;
  ok = assert(checks, verifyEventResultUiScenario().ok, 'verify:event-result-ui compatible', 'Result UI broken') && ok;
  ok = assert(checks, verifyReportUiScenario().ok, 'verify:report-ui compatible', 'Report UI broken') && ok;
  ok = assert(checks, verifySoftLaunchReviewScenario().ok, 'verify:soft-launch-review compatible', 'Review broken') && ok;

  const fullLoop = runFullLoopAnalysis();
  ok = assert(checks, fullLoop.totalFAIL === 0, 'verify:full-loop compatible', `FAIL=${fullLoop.totalFAIL}`) && ok;
  ok = assert(checks, verifyFullUxFlowScenario().ok, 'verify:full-ux-flow compatible', 'UX broken') && ok;
  ok = assert(checks, SAVE_VERSION === 23, 'SAVE_VERSION 23 unchanged', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  ok =
    assert(
      checks,
      !readRepo('src/store/gamePersist.ts').includes('dayOneDropoffFixState'),
      'No persist shape change',
      'Persist polluted',
    ) && ok;

  ok = assert(checks, audit.health !== 'BLOCKED', 'Audit not blocked', audit.health) && ok;

  const markdown = buildDayOneDropoffFixMarkdown(audit);
  ok = assert(checks, markdown.includes('## Amaç'), 'Markdown generated', 'Markdown incomplete') && ok;

  const consoleReport = buildDayOneDropoffFixConsoleSummary(audit);
  ok = assert(checks, consoleReport.length > 200, 'Console summary non-empty', 'Empty console') && ok;

  if (audit.health === 'WARN') {
    hasWarn = true;
  }

  return {
    ok,
    warn: hasWarn,
    checks,
    auditHealth: audit.health,
  };
}
