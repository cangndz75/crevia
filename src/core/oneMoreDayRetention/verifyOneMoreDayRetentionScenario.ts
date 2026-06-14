import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '@/core/dailyCapacityPortfolio';
import { buildPortfolioDeferRiskBindings } from '@/core/portfolioDeferRisk';
import { SAVE_VERSION } from '@/store/gamePersist';
import { buildEndOfDayReportViewModel } from '@/features/reports/utils/endOfDayReportPresentation';
import { buildCenterContinuationCards } from '@/features/hub/utils/centerContinuationCardsPresentation';
import { createDay1Seed } from '@/core/content/day1Seed';
import { buildCenterActiveTarget } from '@/features/hub/utils/centerActiveTargetPresentation';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { buildDailyReport } from '@/core/game/buildDailyReport';

import { ONE_MORE_DAY_ALLOWED_SOURCE_KINDS } from './oneMoreDayRetentionConstants';
import { buildOneMoreDayRetention } from './oneMoreDayRetentionModel';
import {
  buildReportOneMoreDayCardModel,
  collectOneMoreDayRetentionLines,
} from './oneMoreDayRetentionPresentation';
import type { OneMoreDayRetentionHook } from './oneMoreDayRetentionTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 26;

export type VerifyOneMoreDayRetentionOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function assert(checks: string[], pass: boolean, ok: string, fail: string): boolean {
  checks.push(pass ? `PASS ${ok}` : `FAIL ${fail}`);
  return pass;
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function event(id: string, title: string, district: string, neighborhoodId: string) {
  return { id, title, district, neighborhoodId, day: 8 };
}

function operationSignals() {
  return {
    priorityDistrictId: 'sanayi',
    vehicles: {
      status: 'critical',
      score: 82,
      title: 'Rota baskisi',
      summary: 'Arac rotasi zorlaniyor.',
      sourceTags: ['route_source'],
    },
    containers: {
      status: 'strained',
      score: 70,
      title: 'Konteyner hatti',
      summary: 'Hat ek kaynak istiyor.',
      sourceTags: ['container_source'],
    },
    districts: {
      status: 'watch',
      score: 54,
      title: 'Guven hassasiyeti',
      summary: 'Izleniyor.',
      sourceTags: ['trust_source'],
    },
    overall: {
      status: 'watch',
      score: 50,
      title: 'Genel sinyal',
      summary: 'Izleniyor.',
      sourceTags: ['overall_source'],
    },
  };
}

function day8Input(): DailyCapacityPortfolioInput {
  return {
    day: 8,
    activeEvents: [
      event('active_a', 'Aktif rota operasyonu', 'Sanayi', 'sanayi'),
      event('active_b', 'Aktif konteyner operasyonu', 'Cumhuriyet', 'cumhuriyet'),
    ],
    operationSignals: operationSignals(),
    tomorrowRiskSignals: [
      {
        id: 'risk_route',
        title: 'Yarin rota riski',
        mainLine: 'Rota baskisi yarin tekrar okunmali.',
        priority: 'high',
        relatedDomain: 'route',
        sourceSignals: ['operation_signals'],
      },
    ],
    authorityPermissionIds: ['tomorrow_risk_preview'],
  };
}

function portfolioWithDeferredTomorrowRisk() {
  const portfolio = buildDailyCapacityPortfolio(day8Input());
  const item = portfolio.items.find(
    (candidate) => candidate.deferRisk !== 'none' && candidate.sourceKinds.includes('tomorrow_risk'),
  );
  if (!item) return portfolio;
  const deferred = { ...item, status: 'deferred' as const };
  return {
    ...portfolio,
    items: portfolio.items.map((candidate) => (candidate.id === item.id ? deferred : candidate)),
    deferredItems: [deferred],
    availableItems: portfolio.availableItems.filter((candidate) => candidate.id !== item.id),
  };
}

function validateHook(checks: string[], hook: OneMoreDayRetentionHook): boolean {
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, hook.id.trim().length > 0, `${hook.id} id`, 'empty hook id'));
  record(assert(checks, hook.line.trim().length > 0, `${hook.id} line`, `${hook.id} empty line`));
  record(assert(checks, hook.priority >= 0 && hook.priority <= 100, `${hook.id} priority clamp`, `${hook.id} priority out of range`));
  record(assert(checks, unique(hook.sourceIds), `${hook.id} source unique`, `${hook.id} duplicate sourceIds`));
  record(
    assert(
      checks,
      hook.sourceKinds.every((kind) => ONE_MORE_DAY_ALLOWED_SOURCE_KINDS.includes(kind)),
      `${hook.id} source kind enum`,
      `${hook.id} invalid source kind`,
    ),
  );
  record(assert(checks, !/[a-z]+_[a-z_]+/.test(`${hook.title} ${hook.line} ${hook.tomorrowLine ?? ''}`), `${hook.id} no technical enum`, `${hook.id} technical enum leaked`));
  if (hook.isFallback) {
    record(assert(checks, hook.confidence === 'low', `${hook.id} fallback low confidence`, `${hook.id} fallback confidence ${hook.confidence}`));
  }
  if (!hook.ctaRoute) {
    record(assert(checks, !hook.isActionable, `${hook.id} CTA route safety`, `${hook.id} actionable without route`));
  }
  if (hook.tomorrowLine) {
    const hasSource = hook.sourceKinds.some((kind) =>
      ['portfolio_defer_risk', 'tomorrow_risk', 'decision_consequence', 'carry_over', 'butterfly_effect', 'district_memory', 'city_archive', 'story_chain', 'map_gameplay_binding'].includes(kind),
    );
    record(assert(checks, hasSource, `${hook.id} tomorrow source guard`, `${hook.id} fake tomorrow`));
  }
  if (hook.kind === 'memory_trace') {
    const hasMemory = hook.sourceKinds.some((kind) =>
      ['decision_consequence', 'carry_over', 'district_memory', 'city_archive', 'story_chain'].includes(kind),
    );
    record(assert(checks, hasMemory, `${hook.id} memory source guard`, `${hook.id} fake memory`));
  }
  if (hook.kind === 'recovery_opportunity') {
    const hasOpportunity = hook.sourceKinds.some((kind) =>
      ['daily_capacity_portfolio', 'portfolio_defer_risk'].includes(kind),
    );
    record(assert(checks, hasOpportunity, `${hook.id} opportunity source guard`, `${hook.id} fake opportunity`));
  }
  return ok;
}

export function verifyOneMoreDayRetentionScenario(): VerifyOneMoreDayRetentionOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION unchanged', `SAVE_VERSION ${SAVE_VERSION}`));
  record(assert(checks, !readRepo('src/store/useGameStore.ts').includes('oneMoreDayRetention'), 'useGameStore untouched', 'useGameStore wired'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('oneMoreDayRetention'), 'applyDecision untouched', 'applyDecision wired'));
  record(assert(checks, !readRepo('src/core/game/endDay.ts').includes('oneMoreDayRetention'), 'day pipeline untouched', 'endDay wired'));
  record(assert(checks, !readRepo('src/core/authority/authorityGameplayUnlockModel.ts').includes('oneMoreDayRetention'), 'authority expansion untouched', 'authority touched'));
  record(assert(checks, !readRepo('src/features/hub/components/CenterPortfolioSurface.tsx').includes('oneMoreDayRetention'), 'Hub Portfolio Surface untouched', 'Hub Portfolio Surface touched'));

  const day1 = buildOneMoreDayRetention({
    day: 1,
    currentRouteHints: { hubRoute: '/' },
  });
  record(assert(checks, day1.primaryHook?.isFallback === true, 'Day 1 fallback hook', 'Day 1 not fallback'));
  record(assert(checks, !day1.secondaryHook, 'Day 1 low-noise single hook', 'Day 1 secondary hook'));
  record(assert(checks, day1.title === 'Ilk gun tamamlandi', 'Day 1 title', `Day 1 title ${day1.title}`));

  const noRoute = buildOneMoreDayRetention({ day: 8 });
  record(assert(checks, noRoute.primaryHook?.isActionable === false, 'CTA route missing disables hook', 'actionable without route'));

  const portfolio = portfolioWithDeferredTomorrowRisk();
  const deferRisk = buildPortfolioDeferRiskBindings({
    day: 8,
    portfolioResult: portfolio,
    tomorrowRiskSignals: day8Input().tomorrowRiskSignals,
  });
  const day8 = buildOneMoreDayRetention({
    day: 8,
    portfolioDeferRiskResult: deferRisk,
    dailyCapacityPortfolioResult: portfolio,
    currentRouteHints: { hubRoute: '/', mapRoute: '/map', eventsRoute: '/events' },
  });
  record(assert(checks, day8.primaryHook?.sourceKinds.includes('portfolio_defer_risk') === true, 'Day 8 portfolio defer priority', 'Day 8 did not prioritize portfolio defer'));
  record(assert(checks, day8.primaryHook?.tone === 'strategic' || day8.primaryHook?.tone === 'positive', 'Day 8 strategic tone', `tone=${day8.primaryHook?.tone}`));
  record(assert(checks, day8.sourceIds.length > 0, 'Day 8 source ids', 'Day 8 missing source ids'));

  for (const hook of [day1.primaryHook, day8.primaryHook, day8.secondaryHook].filter(Boolean)) {
    record(validateHook(checks, hook as OneMoreDayRetentionHook));
  }

  const tomorrowOnly = buildOneMoreDayRetention({
    day: 9,
    tomorrowRiskSignals: [
      {
        id: 'tomorrow_social',
        title: 'Guven takibi',
        mainLine: 'Yarin guven etkisini izle.',
        priority: 'medium',
        relatedDomain: 'social',
        sourceSignals: ['district_trust'],
      },
    ],
    currentRouteHints: { hubRoute: '/' },
  });
  record(assert(checks, tomorrowOnly.primaryHook?.sourceKinds.includes('tomorrow_risk') === true, 'TomorrowRisk source hook', 'TomorrowRisk hook missing'));

  const memory = buildOneMoreDayRetention({
    day: 10,
    decisionConsequenceThreads: [
      {
        id: 'decision_memory',
        title: 'Karar izi',
        summary: 'Karar bolgede iz birakti.',
        causalLine: 'Yarin bu bolgeyi tekrar kontrol et.',
        sourceIds: ['decision_memory_source'],
      },
    ],
    currentRouteHints: { hubRoute: '/' },
  });
  record(assert(checks, memory.primaryHook?.kind === 'memory_trace', 'Memory trace source hook', `kind=${memory.primaryHook?.kind}`));

  const reportCard = buildReportOneMoreDayCardModel(day8, [deferRisk.reportSummaryLine ?? '']);
  record(assert(checks, Boolean(reportCard), 'Report card model max 1', 'Report card missing'));
  record(assert(checks, Boolean(reportCard?.accessibilityLabel.trim()), 'Report accessibility label', 'Report accessibility empty'));

  const report = buildDailyReport({
    day: 8,
    metrics: { publicSatisfaction: 70, staffMorale: 70, budget: 100000 },
    decisionHistory: [],
    activeEvents: [],
    resolvedEventIds: [],
    snapshots: [],
  });
  const reportModel = buildEndOfDayReportViewModel({
    report,
    metrics: { publicSatisfaction: 70, staffMorale: 70, budget: 100000 },
    dailyXpReport: { day: 8, totalXp: 10, categories: [] },
    oneMoreDayRetention: day8,
    portfolioDeferRisk: deferRisk,
  });
  record(assert(checks, Boolean(reportModel.oneMoreDayCard), 'Report integration optional card', 'Report model missing retention card'));

  const gameState = createDay1Seed().gameState;
  const activeTarget = buildCenterActiveTarget({
    gameState,
    day: 8,
    operationSignals: createInitialOperationSignalsState(8),
  });
  const continuation = buildCenterContinuationCards({
    gameState,
    day: 8,
    activeTarget,
    oneMoreDayRetention: day8,
  });
  record(assert(checks, continuation.cards.some((card) => card.id === 'one-more-day-retention'), 'Hub continuation optional retention card', 'Continuation retention missing'));
  record(assert(checks, continuation.cards.length <= 3, 'Hub continuation max 3', `cards=${continuation.cards.length}`));

  const allLines = collectOneMoreDayRetentionLines(day8);
  record(assert(checks, allLines.every((line) => !/[a-z]+_[a-z_]+/.test(line)), 'No technical enum in retention lines', 'technical enum leaked'));
  record(assert(checks, unique(day8.sourceIds), 'Result sourceIds unique', 'duplicate result source ids'));

  const moduleFiles = [
    'src/core/oneMoreDayRetention/oneMoreDayRetentionTypes.ts',
    'src/core/oneMoreDayRetention/oneMoreDayRetentionConstants.ts',
    'src/core/oneMoreDayRetention/oneMoreDayRetentionModel.ts',
    'src/core/oneMoreDayRetention/oneMoreDayRetentionPresentation.ts',
    'src/core/oneMoreDayRetention/verifyOneMoreDayRetentionScenario.ts',
    'src/core/oneMoreDayRetention/index.ts',
    'scripts/verify-one-more-day-retention.ts',
    'scripts/analyze-one-more-day-retention.ts',
    'docs/crevia-one-more-day-retention-pass.md',
  ];
  for (const file of moduleFiles) {
    record(assert(checks, existsSync(join(REPO_ROOT, file)), `${file} exists`, `${file} missing`));
  }

  return { ok, warn: false, checks };
}
