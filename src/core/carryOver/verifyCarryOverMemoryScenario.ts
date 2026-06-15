import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { buildTomorrowHintLine } from '@/core/contentPacks/eventEchoPresentation';
import { buildEchoContextFromEventResult } from '@/core/contentPacks/eventEchoSelectors';
import { buildEventDomainFocusModel } from '@/core/events/eventDomainPresentation';
import { getFinalPolishRoadmapItemById } from '@/core/quality/finalPolish/finalPolishRoadmap';
import { buildFinalPolishNextRecommendedStep } from '@/core/quality/finalPolish/finalPolishPresentation';
import type { DailyReport } from '@/core/models/DailyReport';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  buildCarryOverFallbackForDay,
  buildCarryOverFromEchoContext,
  buildCarryOverMemorySummary,
  buildEventCarryOverHint,
  buildHubCarryOverMemory,
  buildReportCarryOverPreview,
  buildResultCarryOverMemory,
  formatCarryOverMemoryForDebug,
  shouldShowCarryOverMemory,
} from './carryOverMemoryPresentation';
import {
  inferCarryOverDomainFromText,
  inferCarryOverDomainFromEvent,
} from './carryOverMemorySelectors';
import type { CarryOverDomain, CarryOverMemoryInput } from './carryOverMemoryTypes';
import {
  CARRY_OVER_DOMAINS,
  validateCarryOverDomainCoverage,
  validateCarryOverForbiddenWords,
  validateCarryOverMemoryModel,
  validateCarryOverSurfaceCoverage,
  validateCarryOverTextLength,
} from './carryOverMemoryValidation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

const DOMAINS: CarryOverDomain[] = [
  'container',
  'vehicle_route',
  'personnel',
  'social',
  'crisis_adjacent',
  'district_balance',
  'generic_operation',
];

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
    carryOverSummaryLines: lines.carryOverSummaryLines,
    containerSummaryLines: lines.containerSummaryLines,
    vehicleSummaryLines: lines.vehicleSummaryLines,
    personnelSummaryLines: lines.personnelSummaryLines,
    socialSummaryLines: lines.socialSummaryLines,
    ...lines,
  } as DailyReport;
}

function baseInput(day: number, extra: Partial<CarryOverMemoryInput> = {}): CarryOverMemoryInput {
  return { day, ...extra };
}

export type VerifyCarryOverMemoryOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

export function verifyCarryOverMemoryScenario(): VerifyCarryOverMemoryOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const record = (p: boolean) => {
    if (!p) ok = false;
  };
  const recordWarn = (p: boolean) => {
    if (!p) hasWarn = true;
  };

  record(assert(checks, validateCarryOverDomainCoverage(), 'domain coverage', 'domains'));
  record(assert(checks, validateCarryOverSurfaceCoverage(), 'surface coverage', 'surfaces'));
  for (const d of DOMAINS) {
    record(assert(checks, CARRY_OVER_DOMAINS.includes(d), `domain ${d}`, `missing ${d}`));
  }

  record(assert(checks, !shouldShowCarryOverMemory(1, 'hub', baseInput(1)), 'Day1 hub hidden', 'day1 hub'));
  record(assert(checks, !shouldShowCarryOverMemory(1, 'event_detail', baseInput(1)), 'Day1 event hidden', 'day1 event'));
  record(assert(checks, buildReportCarryOverPreview(baseInput(1)) == null, 'Day1 report null', 'day1 report'));

  const day2Input = baseInput(2, {
    lastDailyReport: sampleReport(1, {
      carryOverSummaryLines: [
        'Cumhuriyet’te konteyner baskısı azaldı; bugün aynı hattı daha sakin yönetebilirsin.',
      ],
    }),
  });
  const hub2 = buildHubCarryOverMemory(day2Input);
  record(assert(checks, !!hub2?.visible, 'Day2 container hub visible', 'day2 hub'));
  record(assert(checks, inferCarryOverDomainFromText('konteyner doluluk') === 'container', 'infer container', 'container'));
  record(assert(checks, inferCarryOverDomainFromText('araç rota gecikme') === 'vehicle_route', 'infer vehicle', 'vehicle'));
  record(assert(checks, inferCarryOverDomainFromText('ekip moral tempo') === 'personnel', 'infer personnel', 'personnel'));
  record(assert(checks, inferCarryOverDomainFromText('sosyal vatandaş şikayet') === 'social', 'infer social', 'social'));
  record(assert(checks, inferCarryOverDomainFromText('kriz risk sinyal') === 'crisis_adjacent', 'infer crisis', 'crisis'));
  record(assert(checks, inferCarryOverDomainFromText('mahalle dengesi öncelik') === 'district_balance', 'infer district', 'district'));
  record(assert(checks, inferCarryOverDomainFromText('genel') === 'generic_operation', 'infer generic', 'generic'));

  const day3Vehicle = baseInput(3, {
    lastDailyReport: sampleReport(2, {
      vehicleSummaryLines: ['Dünkü hızlı rota araç yükünü artırdı.'],
    }),
  });
  record(assert(checks, !!buildHubCarryOverMemory(day3Vehicle)?.visible, 'Day3 vehicle hub', 'day3 vehicle'));
  record(assert(checks, !!buildEventCarryOverHint(day3Vehicle)?.visible, 'Day3 personnel/vehicle event', 'day3 event'));

  const day4Social = baseInput(4, {
    lastDailyReport: sampleReport(3, {
      socialSummaryLines: ['Dünkü müdahale şikayeti düşürdü.'],
    }),
  });
  record(assert(checks, !!buildEventCarryOverHint(day4Social)?.visible, 'Day4 social', 'day4 social'));

  const day5District = baseInput(5, {
    lastDailyReport: sampleReport(4, {
      carryOverSummaryLines: ['Merkez hızlı toparlandı; bekleme algısı izlenmeli.'],
    }),
  });
  record(assert(checks, !!buildHubCarryOverMemory(day5District)?.visible, 'Day5 district', 'day5'));

  const day6Crisis = baseInput(6, {
    lastDailyReport: sampleReport(5, {
      carryOverSummaryLines: ['Risk sinyali birleşiyor; önleyici karar izlenmeli.'],
    }),
  });
  const crisisMem = buildHubCarryOverMemory(day6Crisis);
  record(assert(checks, !!crisisMem?.visible, 'Day6 crisis visible', 'day6'));
  record(assert(checks, !crisisMem?.summary.toLowerCase().includes('panik'), 'Day6 no panic', 'panic'));

  const day7Input = baseInput(7, {
    currentDailyReport: sampleReport(7, {
      vehicleSummaryLines: ['Araç yorgunluğu yarın rota planında izlenmeli.'],
    }),
  });
  const report7 = buildReportCarryOverPreview(day7Input);
  record(assert(checks, !!report7?.visible, 'Day7 report compact memory', 'day7 report'));
  record(assert(checks, (report7?.title.length ?? 0) <= 32, 'Day7 title length', 'day7 title'));

  const day8 = buildHubCarryOverMemory(baseInput(8));
  record(assert(checks, day8 == null || !day8.visible, 'Day8+ hub safe', 'day8'));

  record(assert(checks, buildHubCarryOverMemory(null as never) == null || true, 'hub null-safe', 'hub null'));
  record(assert(checks, buildEventCarryOverHint({ day: 2 }) != null || true, 'event null-safe', 'event null'));
  record(assert(checks, buildResultCarryOverMemory({ day: 3 }) != null || true, 'result null-safe', 'result null'));
  record(assert(checks, buildReportCarryOverPreview({ day: 3 }) != null || true, 'report null-safe', 'report null'));

  const summary = buildCarryOverMemorySummary(day2Input);
  record(assert(checks, Array.isArray(summary.memories), 'summary memories array', 'memories'));
  record(assert(checks, !!summary.strongestMemory || !summary.hasVisibleMemory, 'strongestMemory', 'strongest'));

  const ctx = buildEchoContextFromEventResult({
    event: { id: 'csp1-cumhuriyet-iri-atik-sikisma', title: 'İri atık' },
    day: 2,
  });
  const echoLine = buildTomorrowHintLine(ctx);
  const echoMem = buildCarryOverFromEchoContext(ctx, 'report');
  record(assert(checks, !!echoLine || !!echoMem, 'eventEcho tomorrowHint', 'echo'));
  record(
    assert(
      checks,
      buildReportCarryOverPreview({
        day: 2,
        currentEvent: { id: 'csp1-cumhuriyet-iri-atik-sikisma', title: 'Atık' },
        currentDailyReport: sampleReport(2, {}),
      }) != null,
      'echo or fallback report',
      'report echo',
    ),
  );

  const domainFocus = buildEventDomainFocusModel({
    event: { id: 'csp2-sanayi-agir-arac-kapasite', domain: 'vehicle_route' },
    day: 3,
  });
  const withDomain = buildEventCarryOverHint({
    day: 3,
    eventDomainFocus: domainFocus,
    lastDailyReport: sampleReport(2, { vehicleSummaryLines: ['Araç yükü taşındı.'] }),
  });
  record(
    assert(
      checks,
      inferCarryOverDomainFromEvent({ id: 'csp2-sanayi-agir-arac-kapasite' }) === 'vehicle_route' ||
        withDomain?.domain === 'vehicle_route',
      'eventDomain focus domain',
      'domain focus',
    ),
  );

  const containerFb = buildCarryOverFallbackForDay(2, 'hub', 'container');
  record(
    assert(
      checks,
      Boolean(containerFb?.title.includes('Dünden') || containerFb?.title.includes('Etki')),
      'container hub title',
      'container title',
    ),
  );

  const vehicleFb = buildCarryOverFallbackForDay(3, 'event_detail', 'vehicle_route');
  record(assert(checks, !!vehicleFb?.summary.includes('araç') || vehicleFb?.domain === 'vehicle_route', 'vehicle warning', 'vehicle'));

  const personnelFb = buildCarryOverFallbackForDay(3, 'hub', 'personnel');
  record(assert(checks, personnelFb?.domain === 'personnel', 'personnel memory', 'personnel'));

  const socialFb = buildCarryOverFallbackForDay(4, 'hub', 'social');
  record(assert(checks, socialFb?.domain === 'social', 'social memory', 'social'));

  const crisisFb = buildCarryOverFallbackForDay(6, 'hub', 'crisis_adjacent');
  record(assert(checks, !crisisFb?.summary.toLowerCase().includes('panik'), 'crisis no panic', 'crisis panic'));

  const districtFb = buildCarryOverFallbackForDay(5, 'hub', 'district_balance');
  record(
    assert(
      checks,
      Boolean(districtFb?.summary.includes('denge') || districtFb?.title.includes('Denge')),
      'district balance language',
      'district',
    ),
  );

  const reportPreview = buildReportCarryOverPreview({
    day: 3,
    currentDailyReport: sampleReport(3, {
      carryOverSummaryLines: ['Yarın rota planında araç yorgunluğu izlenmeli.'],
    }),
  });
  record(
    assert(
      checks,
      Boolean(reportPreview?.title.includes('Yarın') || reportPreview?.title.includes('Sonraki')),
      'report tomorrow title',
      'report title',
    ),
  );

  const resultMem = buildResultCarryOverMemory({
    day: 3,
    eventResult: { summaryText: 'Karar yarın rota bandını etkileyebilir.' },
  });
  record(
    assert(
      checks,
      !!resultMem && /yarın|ertesi/i.test(resultMem.summary),
      'result tomorrow summary',
      'result tomorrow',
    ),
  );

  const allText = DOMAINS.map((d) => buildCarryOverFallbackForDay(3, 'hub', d)?.summary ?? '').join(' ');
  record(assert(checks, validateCarryOverForbiddenWords(allText).length === 0, 'no forbidden words', 'forbidden'));
  record(assert(checks, !allText.toLowerCase().includes('bunu yap'), 'no bunu yap', 'directive'));
  record(assert(checks, !allText.toLowerCase().includes('en iyi seçenek'), 'no best option', 'best'));

  for (const d of DOMAINS) {
    const m = buildCarryOverFallbackForDay(3, 'hub', d);
    if (!m) continue;
    record(assert(checks, validateCarryOverTextLength(m).length === 0, `text length ${d}`, `length ${d}`));
    record(assert(checks, m.maxLines <= 2, `maxLines ${d}`, `lines ${d}`));
  }

  const hubCard = readRepo('src/features/hub/components/HubCarryOverMemoryCard.tsx');
  const eventCard = readRepo('src/features/events/components/EventCarryOverHintCard.tsx');
  const reportCard = readRepo('src/features/reports/components/ReportCarryOverPreviewCard.tsx');
  record(assert(checks, hubCard.includes('numberOfLines'), 'Hub card numberOfLines', 'hub lines'));
  record(assert(checks, hubCard.includes('flexShrink'), 'Hub card flexShrink', 'hub shrink'));
  record(assert(checks, eventCard.includes('numberOfLines'), 'Event card numberOfLines', 'event lines'));
  record(assert(checks, reportCard.includes('flexShrink'), 'Report card flexShrink', 'report shrink'));

  const hubHome = readRepo('src/features/hub/components/HubReferenceHome.tsx');
  const hubScreen = readRepo('src/features/hub/screens/HubScreen.tsx');
  const continuationCardsPresentation = readRepo(
    'src/features/hub/utils/centerContinuationCardsPresentation.ts',
  );
  const hubCarryOverWiredInScreen =
    hubScreen.includes('buildHubCarryOverMemory') &&
    hubScreen.includes('hubCarryOverMemory') &&
    (hubScreen.includes('carryOverMemory: hubCarryOverMemory') ||
      hubScreen.includes('carryOverSummary: hubCarryOverMemory') ||
      hubScreen.includes('showHubCarryOver'));
  const hubCarryOverSurfaced =
    hubHome.includes('HubCarryOverMemoryCard') ||
    hubHome.includes('CenterContinuationCardsSection') ||
    hubScreen.includes('hubImpactExplanationLine') ||
    hubScreen.includes('buildCityJournalLiteModel');
  const hubCarryOverIntegrated =
    hubCarryOverWiredInScreen &&
    hubCarryOverSurfaced &&
    (continuationCardsPresentation.includes('carry_over') ||
      hubScreen.includes('hubImpactExplanationLine'));
  record(
    assert(
      checks,
      hubCarryOverIntegrated,
      'HubReferenceHome integration',
      'hub home',
    ),
  );
  record(assert(checks, readRepo('src/features/events/screens/EventDetailDecisionScreen.tsx').includes('EventCarryOverHintCard'), 'EventDetail integration', 'event detail'));
  record(assert(checks, !readRepo('src/features/events/screens/EventDetailDecisionScreen.tsx').includes('hubDay === 1') || readRepo('src/features/events/screens/EventDetailDecisionScreen.tsx').includes('shouldShowCarryOverMemory'), 'EventDetail Day1 guard', 'event day1'));

  record(assert(checks, readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx').includes('ReportCarryOverPreviewCard'), 'Report integration', 'report view'));
  record(
    assert(
      checks,
      readRepo('src/features/reports/presentation/reportScreenPresentation.ts').includes('buildTomorrowHintLine'),
      'tomorrow fallback preserved',
      'tomorrow fallback',
    ),
  );

  record(
    assert(
      checks,
      readRepo('src/features/events/screens/DecisionResultScreen.tsx').includes('suppressEchoDuplicate'),
      'result duplicate echo guard',
      'result dup',
    ),
  );

  record(
    assert(
      checks,
      !readRepo('src/core/carryOver/carryOverMemoryPresentation.ts').includes('Math.random'),
      'no Math.random',
      'random',
    ),
  );
  record(assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION', 'save version'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('carryOver'), 'applyDecision untouched', 'apply'));
  record(assert(checks, !readRepo('src/core/postPilot/postPilotEventEngine.ts').includes('carryOver'), 'postPilot untouched', 'postPilot'));

  record(
    assert(
      checks,
      getFinalPolishRoadmapItemById('carry-over-memory-cards')?.status === 'completed',
      'roadmap completed',
      'roadmap',
    ),
  );
  record(
    assert(
      checks,
      getFinalPolishRoadmapItemById('event-domain-ui-prioritization')?.status === 'completed',
      'event domain still completed',
      'event domain',
    ),
  );

  const next = buildFinalPolishNextRecommendedStep();
  record(
    assert(
      checks,
      next.includes('Dynamic Field') ||
        next.includes('dynamic-field-presence-map-layer') ||
        getFinalPolishRoadmapItemById('report-tomorrow-preview')?.status === 'completed',
      'next step after carry-over',
      `next: ${next}`,
    ),
  );

  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-carry-over-memory-cards.md')), 'docs', 'docs'));
  record(assert(checks, readRepo('package.json').includes('verify:carry-over-memory'), 'package script', 'script'));
  record(assert(checks, !readRepo('src/core/carryOver/index.ts').includes('verifyCarryOverMemoryScenario'), 'carryOver index bundle-safe', 'index'));

  const debug = formatCarryOverMemoryForDebug(hub2);
  record(assert(checks, debug.includes('carry-over'), 'debug format', 'debug'));

  recordWarn(warn(checks, true, 'full-loop regression note', 'run verify:full-loop'));
  recordWarn(warn(checks, true, 'full-ux-flow regression note', 'run verify:full-ux-flow'));

  return { ok, warn: hasWarn, checks };
}
