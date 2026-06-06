import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createDay1Seed } from '@/core/content/day1Seed';
import { buildEventResultSystemsEchoModel } from '@/core/events/eventResultNewSystemsPresentation';
import { buildHubOpenEndedIntegrationModel } from '@/core/hub/hubOpenEndedIntegrationPresentation';
import { buildReportSystemsIntegrationModel } from '@/core/reports/reportSystemsIntegrationPresentation';
import { createInitialMonetizationState } from '@/core/monetization/monetizationState';
import type { GameState } from '@/core/models/GameState';
import type { DailyReport } from '@/core/models/DailyReport';

import {
  DAY_ONE_ADVANCED_SYSTEM_KEYS,
  DAY_ONE_DROPOFF_AUDIT_AREAS,
  DAY_ONE_DROPOFF_FIX_DOCS_PATH,
  DAY_ONE_DROPOFF_FORBIDDEN_COPY,
  DAY_ONE_FIX_ONLY_ALLOWED_SCOPES,
  DAY_ONE_HUB_MAX_FEATURED_CARDS,
  DAY_ONE_LAYOUT_GUARD_FILES,
  DAY_ONE_REPORT_MAX_SYSTEM_LINES,
  DAY_ONE_RESULT_MAX_ECHO_LINES,
} from './dayOneDropoffFixConstants';
import type {
  DayOneDropoffAuditFinding,
  DayOneDropoffCopyGuardResult,
  DayOneDropoffDensitySummary,
  DayOneDropoffFixAuditResult,
} from './dayOneDropoffFixTypes';
import {
  DAY1_ADVISOR_SHORT_COPY,
  DAY1_ASSIGNMENT_COPY,
  DAY1_DAILY_PLAN_COPY,
  DAY1_EVENT_PLAN_COPY,
  DAY1_GUIDANCE_COPY,
  DAY1_REPORT_EDUCATIONAL_LINES,
  FIRST_TEN_MINUTES_FORBIDDEN_WORDS,
  FIRST_TEN_MINUTES_MAX_LINE_LENGTH,
  SURFACE_CTA_LABELS,
} from './firstTenMinutesConstants';
import {
  buildFirstTenMinutesGuidanceModel,
  buildFirstTenMinutesReportGuard,
  buildHubCardVisibilityModel,
  getFirstTenMinutesPrimaryCtaLabel,
  shouldHideAdvancedSystemForFirstTenMinutes,
} from './firstTenMinutesPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

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

function day1GameState(): GameState {
  const seed = createDay1Seed();
  return {
    ...seed.gameState,
    city: { ...seed.gameState.city, day: 1 },
    pilot: {
      ...seed.gameState.pilot,
      status: 'active',
      currentPilotDay: 1,
    },
  };
}

function makeFinding(
  id: string,
  area: DayOneDropoffAuditFinding['area'],
  severity: DayOneDropoffAuditFinding['severity'],
  title: string,
  message: string,
  recommendation: string,
): DayOneDropoffAuditFinding {
  return { id, area, severity, title, message, recommendation };
}

function collectDay1CopyStrings(): string[] {
  return [
    DAY1_GUIDANCE_COPY.title,
    DAY1_GUIDANCE_COPY.summary,
    DAY1_GUIDANCE_COPY.primaryInstruction,
    DAY1_GUIDANCE_COPY.secondaryNote ?? '',
    DAY1_GUIDANCE_COPY.guideCardLine,
    DAY1_ADVISOR_SHORT_COPY.body,
    DAY1_ADVISOR_SHORT_COPY.cta,
    DAY1_DAILY_PLAN_COPY.title,
    DAY1_DAILY_PLAN_COPY.confirmCta,
    DAY1_DAILY_PLAN_COPY.planDescriptionShort,
    DAY1_DAILY_PLAN_COPY.editDisabledNote,
    DAY1_ASSIGNMENT_COPY.explanation,
    DAY1_ASSIGNMENT_COPY.confirmCta,
    DAY1_ASSIGNMENT_COPY.dispatchCta,
    DAY1_EVENT_PLAN_COPY.planSupport,
    ...DAY1_REPORT_EDUCATIONAL_LINES,
    ...Object.values(SURFACE_CTA_LABELS),
  ];
}

export function runDayOneCopyGuard(): DayOneDropoffCopyGuardResult {
  const samples = collectDay1CopyStrings();
  const violations: DayOneDropoffCopyGuardResult['violations'] = [];

  for (const text of samples) {
    const lower = text.toLowerCase();
    for (const term of [...DAY_ONE_DROPOFF_FORBIDDEN_COPY, ...FIRST_TEN_MINUTES_FORBIDDEN_WORDS]) {
      if (lower.includes(term.toLowerCase())) {
        violations.push({ term, sample: text.slice(0, 60) });
      }
    }
    if (text.length > FIRST_TEN_MINUTES_MAX_LINE_LENGTH) {
      violations.push({ term: 'line_too_long', sample: text.slice(0, 60) });
    }
  }

  return {
    passed: violations.length === 0,
    scannedStringCount: samples.length,
    violations,
  };
}

export function auditDayOneLayoutGuards(): DayOneDropoffAuditFinding[] {
  const findings: DayOneDropoffAuditFinding[] = [];

  for (const file of DAY_ONE_LAYOUT_GUARD_FILES) {
    const content = readRepo(file);
    if (content.length === 0) {
      findings.push(
        makeFinding(
          `layout.missing_${file.replace(/[/\\]/g, '_')}`,
          'text_overflow_guard',
          'blocker',
          `Layout guard file missing: ${file}`,
          file,
          'Restore layout guard source file',
        ),
      );
      continue;
    }

    const hasNumberOfLines = content.includes('numberOfLines');
    const hasFlexShrink = content.includes('flexShrink');
    const hasMinWidth = content.includes('minWidth');

    findings.push(
      makeFinding(
        `layout.guards_${file.replace(/[/\\]/g, '_')}`,
        'text_overflow_guard',
        hasNumberOfLines && hasFlexShrink && hasMinWidth ? 'pass' : 'warn',
        `Layout guards in ${file}`,
        `numberOfLines=${hasNumberOfLines} flexShrink=${hasFlexShrink} minWidth=${hasMinWidth}`,
        'Ensure Day 1 surfaces use overflow guards',
      ),
    );
  }

  return findings;
}

export function runDayOneDropoffFixAudit(): DayOneDropoffFixAuditResult {
  const findings: DayOneDropoffAuditFinding[] = [];
  const gs = day1GameState();
  const monetization = createInitialMonetizationState();
  const hub = buildHubCardVisibilityModel(gs, monetization);
  const guidance = buildFirstTenMinutesGuidanceModel({ gameState: gs });
  const reportGuard = buildFirstTenMinutesReportGuard(gs);
  const openEnded = buildHubOpenEndedIntegrationModel({ gameState: gs, day: 1 });
  const resultEcho = buildEventResultSystemsEchoModel({ day: 1 });
  const reportSystems = buildReportSystemsIntegrationModel({
    day: 1,
    dailyReport: sampleDay1Report(),
  });
  const copyGuard = runDayOneCopyGuard();

  findings.push(
    makeFinding(
      'day1.hub_max_density',
      'hub_day1_card_count',
      hub.maxFeaturedCards <= DAY_ONE_HUB_MAX_FEATURED_CARDS ? 'pass' : 'blocker',
      'Hub Day 1 max featured cards',
      `maxFeaturedCards=${hub.maxFeaturedCards}`,
      `Keep <= ${DAY_ONE_HUB_MAX_FEATURED_CARDS}`,
    ),
    makeFinding(
      'day1.hub_suppressed_surfaces',
      'scroll_fatigue_risk',
      !hub.showQuickPreparationStrip &&
        !hub.showOperationSignalsCard &&
        !hub.showOpenEndedCard
        ? 'pass'
        : 'warn',
      'Hub Day 1 suppressed secondary surfaces',
      `quickPrep=${hub.showQuickPreparationStrip} signals=${hub.showOperationSignalsCard} openEnded=${hub.showOpenEndedCard}`,
      'Suppress non-essential Hub cards on Day 1',
    ),
    makeFinding(
      'day1.hub_cta_clarity',
      'hub_day1_cta_clarity',
      guidance.primaryInstruction.includes('onayla') ? 'pass' : 'warn',
      'Hub Day 1 primary CTA clarity',
      guidance.primaryInstruction,
      'Primary instruction must name plan confirm action',
    ),
    makeFinding(
      'day1.first_event_cta',
      'first_event_discoverability',
      getFirstTenMinutesPrimaryCtaLabel('event_dispatch', '') === 'Önerilen Atamayı Onayla'
        ? 'pass'
        : 'warn',
      'First event dispatch CTA label',
      getFirstTenMinutesPrimaryCtaLabel('event_dispatch', ''),
      'Use recommended assignment CTA on Day 1',
    ),
    makeFinding(
      'day1.plan_copy_short',
      'plan_option_clarity',
      DAY1_EVENT_PLAN_COPY.planSupport.split(' ').length <= 8 ? 'pass' : 'warn',
      'Plan support copy density',
      DAY1_EVENT_PLAN_COPY.planSupport,
      'Keep plan support to 1-2 short lines',
    ),
    makeFinding(
      'day1.dispatch_copy',
      'dispatch_assignment_clarity',
      DAY1_ASSIGNMENT_COPY.confirmCta.length > 0 ? 'pass' : 'warn',
      'Dispatch assignment CTA present',
      DAY1_ASSIGNMENT_COPY.confirmCta,
      'Confirm CTA must be explicit',
    ),
    makeFinding(
      'day1.field_cta',
      'field_micro_decision_clarity',
      getFirstTenMinutesPrimaryCtaLabel('event_field', '') === 'Sonucu Gör' ? 'pass' : 'warn',
      'Field phase next-step CTA',
      getFirstTenMinutesPrimaryCtaLabel('event_field', ''),
      'Field CTA should read Sonucu Gör',
    ),
    makeFinding(
      'day1.result_echo_hidden',
      'result_impact_clarity',
      resultEcho.lines.length <= DAY_ONE_RESULT_MAX_ECHO_LINES ? 'pass' : 'blocker',
      'Result Day 1 systems echo density',
      `lines=${resultEcho.lines.length} max=${DAY_ONE_RESULT_MAX_ECHO_LINES}`,
      'Hide deep system echo on Day 1 result',
    ),
    makeFinding(
      'day1.report_systems_density',
      'report_day1_density',
      reportSystems.lines.length <= DAY_ONE_REPORT_MAX_SYSTEM_LINES ? 'pass' : 'warn',
      'Report Day 1 systems card density',
      `lines=${reportSystems.lines.length} mode=${reportSystems.visibility.mode}`,
      `Keep <= ${DAY_ONE_REPORT_MAX_SYSTEM_LINES} learning line(s)`,
    ),
    makeFinding(
      'day1.report_learning_mode',
      'report_day1_density',
      reportGuard.compactPrimaryImpact && reportGuard.shortAdvisor ? 'pass' : 'warn',
      'Report Day 1 learning mode guard',
      `compact=${reportGuard.compactPrimaryImpact} shortAdvisor=${reportGuard.shortAdvisor}`,
      'Keep Day 1 report in learning mode',
    ),
    makeFinding(
      'day1.tomorrow_preview',
      'tomorrow_preview_clarity',
      !reportSystems.tomorrowSummary.visible || reportSystems.lines.length <= 1 ? 'pass' : 'warn',
      'Tomorrow preview Day 1 clarity',
      `tomorrowVisible=${reportSystems.tomorrowSummary.visible}`,
      'Tomorrow preview should be minimal on Day 1',
    ),
  );

  const hiddenSystems: string[] = [];
  const visibleAdvanced: string[] = [];
  for (const key of DAY_ONE_ADVANCED_SYSTEM_KEYS) {
    if (shouldHideAdvancedSystemForFirstTenMinutes(gs, key, monetization)) {
      hiddenSystems.push(key);
    } else {
      visibleAdvanced.push(key);
    }
  }

  findings.push(
    makeFinding(
      'day1.advanced_systems_hidden',
      'forbidden_early_systems_visibility',
      visibleAdvanced.length === 0 && !openEnded.visible ? 'pass' : 'blocker',
      'Forbidden advanced systems hidden on Day 1',
      visibleAdvanced.length > 0
        ? `Visible: ${visibleAdvanced.join(', ')}`
        : `openEnded.visible=${openEnded.visible}`,
      'Hide operation era, story chain, crisis, district ops on Day 1',
    ),
    makeFinding(
      'day1.open_ended_hidden',
      'forbidden_early_systems_visibility',
      !openEnded.visible ? 'pass' : 'blocker',
      'Hub open-ended card hidden Day 1',
      `visible=${openEnded.visible}`,
      'Open-ended card must not show on Day 1',
    ),
    makeFinding(
      'day1.copy_guard',
      'duplicate_hint_copy_risk',
      copyGuard.passed ? 'pass' : 'blocker',
      'Day 1 copy guard',
      copyGuard.violations.map((v) => v.term).join(', ') || 'clean',
      'Remove forbidden/punitive copy from Day 1 surfaces',
    ),
    makeFinding(
      'day1.devtools_suppressed',
      'forbidden_early_systems_visibility',
      hub.suppressDevTools ? 'pass' : 'warn',
      'DevTools suppressed on Day 1',
      `suppressDevTools=${hub.suppressDevTools}`,
      'Hide devtools on Day 1 playtest builds',
    ),
  );

  findings.push(...auditDayOneLayoutGuards());

  const docsPresent = existsSync(join(REPO_ROOT, DAY_ONE_DROPOFF_FIX_DOCS_PATH));
  findings.push(
    makeFinding(
      'day1.fix_pass_docs',
      'hub_day1_card_count',
      docsPresent ? 'pass' : 'warn',
      'Day 1 drop-off fix pass docs',
      DAY_ONE_DROPOFF_FIX_DOCS_PATH,
      'Document fix pass scope and playtest notes',
    ),
  );

  const blockerCount = findings.filter((f) => f.severity === 'blocker').length;
  const health: DayOneDropoffFixAuditResult['health'] =
    blockerCount > 0 ? 'BLOCKED' : findings.some((f) => f.severity === 'warn') ? 'WARN' : 'PASS';

  const density: DayOneDropoffDensitySummary = {
    hubMaxFeaturedCards: hub.maxFeaturedCards,
    hubSuppressedSurfaces: [
      ...(hub.showQuickPreparationStrip ? [] : ['quick_preparation']),
      ...(hub.showOperationSignalsCard ? [] : ['operation_signals']),
      ...(hub.showOpenEndedCard ? [] : ['open_ended_card']),
    ],
    resultMaxEchoLines: resultEcho.lines.length,
    reportMaxSystemLines: reportSystems.lines.length,
    advancedSystemsHidden: hiddenSystems,
  };

  return {
    health,
    findings,
    copyGuard,
    density,
    fixOnlyScope: [...DAY_ONE_FIX_ONLY_ALLOWED_SCOPES],
    docsPath: DAY_ONE_DROPOFF_FIX_DOCS_PATH,
  };
}

export function buildDayOneDropoffSoftLaunchFindings(
  audit: DayOneDropoffFixAuditResult,
): {
  dropoffFixPassPresent: boolean;
  hubDensityGuardPass: boolean;
  eventFlowCtaGuardPass: boolean;
  reportDensityGuardPass: boolean;
  forbiddenAdvancedSystemsHidden: boolean;
  copyGuardPass: boolean;
} {
  const byId = (id: string) => audit.findings.find((f) => f.id === id);

  return {
    dropoffFixPassPresent: existsSync(join(REPO_ROOT, DAY_ONE_DROPOFF_FIX_DOCS_PATH)),
    hubDensityGuardPass: byId('day1.hub_max_density')?.severity === 'pass',
    eventFlowCtaGuardPass:
      byId('day1.first_event_cta')?.severity === 'pass' &&
      byId('day1.field_cta')?.severity === 'pass',
    reportDensityGuardPass: byId('day1.report_systems_density')?.severity === 'pass',
    forbiddenAdvancedSystemsHidden:
      byId('day1.advanced_systems_hidden')?.severity === 'pass' &&
      byId('day1.open_ended_hidden')?.severity === 'pass',
    copyGuardPass: audit.copyGuard.passed,
  };
}

export function getDayOneDropoffAuditAreaCount(): number {
  return DAY_ONE_DROPOFF_AUDIT_AREAS.length;
}
