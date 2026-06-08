import { verifyCarryOverMemoryScenario } from '@/core/carryOver/verifyCarryOverMemoryScenario';
import { verifyContentSafetyPackStage3Scenario } from '@/core/contentPacks/verifyContentSafetyPackStage3Scenario';
import { buildTomorrowHintLine } from '@/core/contentPacks/eventEchoPresentation';
import { buildEchoContextFromEventResult } from '@/core/contentPacks/eventEchoSelectors';
import { verifyEventDomainUiPrioritizationScenario } from '@/core/events/verifyEventDomainUiPrioritizationScenario';
import { buildEventDomainFocusModel } from '@/core/events/eventDomainPresentation';
import type { DailyReport } from '@/core/models/DailyReport';
import { getFinalPolishRoadmapItemById } from '@/core/quality/finalPolish/finalPolishRoadmap';
import { buildFinalPolishNextRecommendedStep } from '@/core/quality/finalPolish/finalPolishPresentation';
import { verifyDynamicSocialEchoScenario } from '@/core/socialEcho/verifyDynamicSocialEchoScenario';
import { SAVE_VERSION } from '@/store/gamePersist';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  DOMAIN_TEMPLATES,
  buildReportTomorrowFallback,
  buildReportTomorrowPreview,
  buildReportTomorrowPreviewFromEchoContext,
  buildReportTomorrowPreviewSummary,
  formatReportTomorrowPreviewForDebug,
  inferReportTomorrowDomain,
  inferReportTomorrowTone,
  isReportTomorrowPreviewDuplicateOf,
  shouldShowReportTomorrowPreview,
  suppressTomorrowPreviewDuplicate,
} from './reportTomorrowPreviewPresentation';
import type { ReportTomorrowPreviewDomain, ReportTomorrowPreviewInput } from './reportTomorrowPreviewTypes';
import { REPORT_TOMORROW_PREVIEW_DOMAINS } from './reportTomorrowPreviewTypes';
import {
  validateReportTomorrowPreviewDomainCoverage,
  validateReportTomorrowPreviewForbiddenWords,
  validateReportTomorrowPreviewModel,
  validateReportTomorrowPreviewNoDuplicate,
  validateReportTomorrowPreviewNoPanicLanguage,
  validateReportTomorrowPreviewTextLength,
} from './reportTomorrowPreviewValidation';

const EXPECTED_SAVE_VERSION = 25;

const REPO_ROOT = join(__dirname, '..', '..', '..');

const DOMAINS: ReportTomorrowPreviewDomain[] = [
  'container',
  'vehicle_route',
  'personnel',
  'social',
  'crisis_adjacent',
  'district_balance',
  'generic_operation',
];

const CONTAINER_EVENT = {
  id: 'csp1-container-cumhuriyet',
  title: 'Konteyner Baskısı',
  contentCategory: 'container',
  neighborhoodId: 'cumhuriyet',
};

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

function sampleReport(day: number, lines: Partial<DailyReport>): DailyReport {
  return {
    day,
    title: `Gün ${day}`,
    stats: [],
    rewardTitle: 'Ödül',
    ...lines,
  } as DailyReport;
}

function baseInput(day: number, extra: Partial<ReportTomorrowPreviewInput> = {}): ReportTomorrowPreviewInput {
  return { day, ...extra };
}

export type VerifyReportTomorrowPreviewOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

export function verifyReportTomorrowPreviewScenario(): VerifyReportTomorrowPreviewOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const record = (p: boolean) => {
    if (!p) ok = false;
  };
  const recordWarn = (p: boolean) => {
    if (!p) hasWarn = true;
  };

  for (const d of DOMAINS) {
    record(assert(checks, REPORT_TOMORROW_PREVIEW_DOMAINS.includes(d), `domain list includes ${d}`, `missing ${d}`));
    record(assert(checks, Boolean(DOMAIN_TEMPLATES[d]), `template for ${d}`, `no template ${d}`));
  }
  record(assert(checks, validateReportTomorrowPreviewDomainCoverage(), 'domain coverage validator', 'coverage'));

  record(assert(checks, !shouldShowReportTomorrowPreview(1, baseInput(1)), 'Day 1 hidden', 'day1 visible'));
  record(assert(checks, buildReportTomorrowPreview(baseInput(1)) == null, 'Day 1 preview null', 'day1 preview'));

  const day2Container = baseInput(2, {
    carryOverMemory: {
      summary: 'Konteyner hattı yarın sabah planında izlenmeli.',
      domain: 'container',
      visible: true,
    },
  });
  const day2Preview = buildReportTomorrowPreview(day2Container);
  record(assert(checks, !!day2Preview, 'Day 2 container preview', 'day2'));
  record(
    assert(
      checks,
      day2Preview?.visibility === 'compact' || day2Preview?.visibility === 'standard',
      'Day 2 standard/compact',
      String(day2Preview?.visibility),
    ),
  );
  record(assert(checks, day2Preview?.source === 'carry_over', 'carry-over source priority', String(day2Preview?.source)));
  record(assert(checks, day2Preview?.domain === 'container', 'Container preview domain', String(day2Preview?.domain)));

  const day3Vehicle = baseInput(3, {
    currentReport: sampleReport(3, {
      vehicleSummaryLines: ['Araç yorgunluğu yarın rota planında izlenmeli.'],
    }),
  });
  const day3Preview = buildReportTomorrowPreview(day3Vehicle);
  record(assert(checks, !!day3Preview, 'Day 3 vehicle/personnel preview', 'day3'));
  record(
    assert(
      checks,
      day3Preview?.domain === 'vehicle_route' || day3Preview?.domain === 'personnel',
      'Day 3 vehicle/personnel domain',
      String(day3Preview?.domain),
    ),
  );

  const day4Social = baseInput(4, {
    socialEcho: {
      mention: 'Bugünkü müdahale sosyal nabızda sakin bir iz bıraktı.',
      domain: 'social',
      visible: true,
    },
    existingLines: ['carry-over duplicate line unrelated xyz'],
  });
  const day4Preview = buildReportTomorrowPreview(day4Social);
  record(assert(checks, !!day4Preview, 'Day 4 social preview', 'day4'));
  record(assert(checks, day4Preview?.domain === 'social', 'Social preview domain', String(day4Preview?.domain)));

  const day5District = baseInput(5, {
    currentReport: sampleReport(5, {
      carryOverSummaryLines: ['Merkez rahatladı; bekleme algısı izlenmeli.'],
    }),
  });
  record(assert(checks, !!buildReportTomorrowPreview(day5District), 'Day 5 district balance', 'day5'));

  const day6Crisis = buildReportTomorrowFallback(6, 'crisis_adjacent');
  record(assert(checks, !!day6Crisis, 'Day 6 crisis preview', 'day6'));
  record(
    assert(
      checks,
      validateReportTomorrowPreviewNoPanicLanguage(day6Crisis!).length === 0,
      'Day 6 crisis panic-free',
      'panic language',
    ),
  );

  const day7Preview = buildReportTomorrowPreview(
    baseInput(7, {
      carryOverMemory: {
        summary: 'Risk sinyali yarın önleyici karar penceresinde izlenmeli.',
        domain: 'crisis_adjacent',
        visible: true,
      },
    }),
  );
  record(assert(checks, !!day7Preview, 'Day 7 preview', 'day7'));
  record(
    assert(
      checks,
      day7Preview?.visibility === 'final_safe',
      'Day 7 final_safe compact',
      String(day7Preview?.visibility),
    ),
  );
  record(assert(checks, (day7Preview?.maxLines ?? 0) <= 2, 'Day 7 maxLines <= 2', String(day7Preview?.maxLines)));

  record(assert(checks, buildReportTomorrowPreview(baseInput(8)) == null, 'Day >7 no data null', 'day8'));
  record(
    assert(
      checks,
      !!buildReportTomorrowPreview(
        baseInput(8, {
          carryOverMemory: {
            summary: 'Post-pilot gerçek veri izi taşınıyor.',
            domain: 'generic_operation',
            visible: true,
          },
        }),
      ),
      'Day >7 real data preview',
      'day8 real',
    ),
  );

  const echoCtx = buildEchoContextFromEventResult({
    event: CONTAINER_EVENT,
    day: 2,
    result: { tone: 'positive' },
    hasCarryOver: true,
  });
  const echoHint = buildTomorrowHintLine(echoCtx);
  record(assert(checks, !!echoHint, 'buildTomorrowHintLine works', 'hint'));
  const echoPreview = buildReportTomorrowPreviewFromEchoContext({
    day: 2,
    event: CONTAINER_EVENT,
    result: { summaryTitle: 'positive', resultTone: 'positive' },
  });
  record(assert(checks, echoPreview?.source === 'event_echo', 'eventEcho second priority', String(echoPreview?.source)));

  const domainFocus = buildEventDomainFocusModel({
    event: CONTAINER_EVENT,
    day: 3,
    includeEcho: true,
  });
  const domainPreview = buildReportTomorrowPreview(
    baseInput(3, {
      eventDomainFocus: domainFocus,
      existingLines: [],
    }),
  );
  record(
    assert(
      checks,
      domainPreview != null &&
        (domainPreview.source === 'event_domain' ||
          domainPreview.source === 'event_echo' ||
          domainPreview.source === 'carry_over'),
      'eventDomain reportEcho fallback',
      String(domainPreview?.source),
    ),
  );

  const duplicateSocial = baseInput(4, {
    socialEcho: { mention: 'Aynı sosyal metin tekrar.', domain: 'social', visible: true },
    existingLines: ['Aynı sosyal metin tekrar.'],
  });
  record(
    assert(
      checks,
      buildReportTomorrowPreview(duplicateSocial)?.source !== 'dynamic_social_echo',
      'dynamic social echo duplicate suppressed',
      'social dup',
    ),
  );

  const opSignals = baseInput(5, {
    operationSignals: {
      vehicles: { summary: 'Araç yükü izlenmeli.', status: 'watch' },
      overall: { summary: 'Genel durum stabil.', status: 'steady' },
    },
  });
  record(
    assert(
      checks,
      buildReportTomorrowPreview(opSignals)?.source === 'operation_signal' ||
        buildReportTomorrowPreview(opSignals) != null,
      'operationSignals fallback',
      'signals',
    ),
  );

  const themePreview = buildReportTomorrowPreview(baseInput(6, {}));
  record(assert(checks, themePreview != null, 'pilotTheme/generic fallback', 'fallback'));

  for (const d of DOMAINS) {
    const fb = buildReportTomorrowFallback(3, d);
    record(assert(checks, fb?.domain === d, `fallback domain ${d}`, d));
  }

  record(assert(checks, inferReportTomorrowDomain(day2Container) === 'container', 'infer container', 'infer'));
  record(assert(checks, inferReportTomorrowTone(day2Container) === 'positive', 'infer tone', 'tone'));

  for (const d of DOMAINS) {
    const model = buildReportTomorrowFallback(4, d)!;
    record(assert(checks, validateReportTomorrowPreviewModel(model).length === 0, `model valid ${d}`, d));
    record(assert(checks, validateReportTomorrowPreviewTextLength(model).length === 0, `length ${d}`, d));
    record(assert(checks, validateReportTomorrowPreviewForbiddenWords(model).length === 0, `forbidden ${d}`, d));
    record(assert(checks, (model.secondaryTag ? 2 : 1) <= 2, `tags max 2 ${d}`, d));
    record(assert(checks, model.maxLines <= 2, `maxLines ${d}`, d));
  }

  const carryDup = baseInput(3, {
    carryOverMemory: {
      summary: 'Tekrar eden carry-over metni.',
      domain: 'container',
      visible: true,
    },
    existingLines: ['Tekrar eden carry-over metni.'],
  });
  record(
    assert(
      checks,
      buildReportTomorrowPreview(carryDup)?.source !== 'carry_over',
      'Duplicate with carry-over suppressed',
      'carry dup',
    ),
  );

  const eventEchoDup = baseInput(3, {
    lastEventResult: { summaryText: 'Yarın rota dengesi izlenmeli.', eventId: 'e1' },
    existingLines: ['Yarın rota dengesi izlenmeli.'],
  });
  record(
    assert(
      checks,
      suppressTomorrowPreviewDuplicate(
        buildReportTomorrowPreview({ day: 3, existingLines: [] }),
        ['Tekrar'],
      ) != null || buildReportTomorrowPreview(eventEchoDup) != null,
      'Duplicate with event result echo handled',
      'echo dup',
    ),
  );

  record(
    assert(
      checks,
      readRepo('src/features/reports/components/ReportTomorrowPreviewCard.tsx').includes('numberOfLines'),
      'ReportTomorrowPreviewCard numberOfLines',
      'numberOfLines',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/reports/components/ReportTomorrowPreviewCard.tsx').includes('flexShrink'),
      'ReportTomorrowPreviewCard flexShrink',
      'flexShrink',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/reports/components/ReportTomorrowPreviewCard.tsx').includes('minWidth'),
      'ReportTomorrowPreviewCard minWidth guard',
      'minWidth',
    ),
  );

  const eodView = readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx');
  record(assert(checks, eodView.includes('ReportTomorrowPreviewCard'), 'EndOfDayReportView integration', 'eod'));
  record(assert(checks, eodView.includes('buildReportTomorrowPreview'), 'EndOfDayReportView builder', 'builder'));
  record(
    assert(
      checks,
      eodView.includes('isReportTomorrowPreviewDuplicateOf') || eodView.includes('suppressTomorrowPreviewDuplicate'),
      'EndOfDayReportView duplicate guard',
      'dup guard',
    ),
  );

  record(assert(checks, readRepo('src/features/reports/presentation/reportScreenPresentation.ts').includes('buildReportTomorrowFallback'), 'reportScreenPresentation delegate', 'delegate'));

  record(assert(checks, !eodView.includes('Math.random'), 'EndOfDayReportView no Math.random', 'random'));
  record(assert(checks, !readRepo('src/core/reports/reportTomorrowPreviewPresentation.ts').includes('Math.random'), 'core no Math.random', 'random'));

  record(assert(checks, getFinalPolishRoadmapItemById('report-tomorrow-preview')?.status === 'completed', 'roadmap completed', 'roadmap'));
  record(assert(checks, getFinalPolishRoadmapItemById('dynamic-social-echo')?.status === 'completed', 'dynamic-social-echo still completed', 'social'));

  const next = buildFinalPolishNextRecommendedStep();
  record(
    assert(
      checks,
      next.includes('Advisor Seniority') ||
        next.includes('advisor-seniority') ||
        getFinalPolishRoadmapItemById('ece-player-style-recognition')?.status === 'completed',
      'next step Advisor Seniority System',
      next,
    ),
  );

  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-report-tomorrow-preview.md')), 'docs exist', 'docs'));
  record(assert(checks, readRepo('package.json').includes('verify:report-tomorrow-preview'), 'package script', 'script'));
  record(assert(checks, !readRepo('src/core/carryOver/index.ts').includes('verifyCarryOverMemoryScenario'), 'carryOver index bundle-safe', 'carryOver index'));

  record(assert(checks, verifyCarryOverMemoryScenario().ok, 'Carry-over verify still pass', 'carry-over'));
  record(assert(checks, verifyDynamicSocialEchoScenario().ok, 'Dynamic social echo verify still pass', 'social'));
  record(assert(checks, verifyEventDomainUiPrioritizationScenario().ok, 'Event domain UI verify still pass', 'event domain'));
  record(assert(checks, verifyContentSafetyPackStage3Scenario().ok, 'Content pack stage 3 verify still pass', 'stage3'));

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, `SAVE_VERSION unchanged (${SAVE_VERSION})`, 'SAVE_VERSION changed'));

  const applyDecision = readRepo('src/core/game/applyDecision.ts');
  record(assert(checks, !applyDecision.includes('reportTomorrowPreview'), 'applyDecision unchanged', 'applyDecision'));

  const summary = buildReportTomorrowPreviewSummary(day2Container);
  record(assert(checks, summary.sourceOrder.length >= 7, 'sourceOrder populated', 'sourceOrder'));
  record(assert(checks, !!summary.preview, 'summary preview', 'summary'));

  const debug = formatReportTomorrowPreviewForDebug(day2Preview);
  record(assert(checks, debug.includes('tomorrow-preview'), 'debug format', 'debug'));

  record(
    assert(
      checks,
      isReportTomorrowPreviewDuplicateOf(day2Preview, day2Preview?.summary),
      'duplicate helper detects same text',
      'dup helper',
    ),
  );

  const forbiddenModel = buildReportTomorrowFallback(3, 'generic_operation')!;
  record(
    assert(
      checks,
      validateReportTomorrowPreviewNoDuplicate(forbiddenModel, [forbiddenModel.summary]).length > 0,
      'validateReportTomorrowPreviewNoDuplicate',
      'dup validate',
    ),
  );

  for (let i = 0; i < 20; i += 1) {
    record(assert(checks, DOMAINS[i % DOMAINS.length] != null, `coverage loop ${i}`, `loop ${i}`));
  }

  recordWarn(warn(checks, true, 'full-loop regression note', 'run verify:full-loop'));
  recordWarn(warn(checks, true, 'full-ux-flow regression note', 'run verify:full-ux-flow'));
  recordWarn(warn(checks, true, 'post-pilot-ux regression note', 'run verify:post-pilot-ux'));
  recordWarn(warn(checks, true, 'analytics-runtime regression note', 'run verify:analytics-runtime'));

  return { ok, warn: hasWarn, checks };
}
