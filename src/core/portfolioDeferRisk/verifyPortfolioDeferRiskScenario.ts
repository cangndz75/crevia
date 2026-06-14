import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '@/core/dailyCapacityPortfolio';
import { SAVE_VERSION } from '@/store/gamePersist';

import { buildPortfolioDeferRiskBindings } from './portfolioDeferRiskModel';
import {
  buildPortfolioDeferReportLine,
  buildPortfolioDeferTomorrowActionLine,
} from './portfolioDeferRiskPresentation';
import type { PortfolioDeferBinding } from './portfolioDeferRiskTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 26;

export type VerifyPortfolioDeferRiskOutcome = {
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
      domain: 'vehicles',
      status: 'critical',
      score: 82,
      title: 'Rota baskisi',
      summary: 'Arac rotasi zorlaniyor.',
      sourceTags: ['route_source'],
    },
    containers: {
      domain: 'containers',
      status: 'strained',
      score: 72,
      title: 'Konteyner hatti',
      summary: 'Hat ek kaynak istiyor.',
      sourceTags: ['container_source'],
    },
    districts: {
      domain: 'districts',
      status: 'strained',
      score: 62,
      title: 'Guven hassasiyeti',
      summary: 'Bolge guveni izlenmeli.',
      sourceTags: ['trust_source'],
    },
    personnel: {
      domain: 'personnel',
      status: 'stable',
      score: 25,
      title: 'Ekip',
      summary: 'Dengeli',
      sourceTags: [],
    },
    overall: {
      domain: 'overall',
      status: 'watch',
      score: 52,
      title: 'Genel sinyal',
      summary: 'Izleniyor.',
      sourceTags: ['overall_source'],
    },
  };
}

function tomorrowRisk(id = 'risk_route') {
  return {
    id,
    title: 'Yarin rota riski',
    mainLine: 'Yarin rota baskisi buyuyebilir.',
    priority: 'high',
    relatedDomain: 'route',
    sourceSignals: ['operation_signals'],
    tone: 'risk',
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
    tomorrowRiskSignals: [tomorrowRisk()],
    authorityPermissionIds: ['tomorrow_risk_preview'],
  };
}

function validateBinding(checks: string[], binding: PortfolioDeferBinding): boolean {
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, binding.id.trim().length > 0, `${binding.id} id`, 'empty binding id'));
  record(assert(checks, binding.line.trim().length > 0, `${binding.id} line`, `${binding.id} empty line`));
  record(assert(checks, binding.priority >= 0 && binding.priority <= 100, `${binding.id} priority`, `${binding.id} priority out of range`));
  record(assert(checks, unique(binding.sourceIds), `${binding.id} source unique`, `${binding.id} duplicate source ids`));
  record(assert(checks, binding.sourceIds.length > 0, `${binding.id} source exists`, `${binding.id} missing source`));
  record(assert(checks, !binding.sourceKinds.includes('fallback'), `${binding.id} no fallback fake source`, `${binding.id} fallback source`));
  if (binding.reportLine) {
    record(assert(checks, binding.reportLine.length <= 110, `${binding.id} report max 110`, `${binding.id} report too long`));
  }
  const visibleText = [binding.line, binding.reportLine ?? '', binding.tomorrowLine ?? ''].join(' ');
  record(assert(checks, !/[a-z]+_[a-z_]+/.test(visibleText), `${binding.id} no technical enum`, `${binding.id} leaked technical enum`));

  if (binding.tomorrowLine) {
    const hasFutureSource =
      binding.sourceKinds.includes('tomorrow_risk') ||
      binding.sourceKinds.includes('carry_over') ||
      binding.sourceKinds.includes('district_memory') ||
      binding.sourceKinds.includes('decision_consequence');
    record(assert(checks, hasFutureSource, `${binding.id} tomorrow source guard`, `${binding.id} fake tomorrow line`));
  }

  if (binding.kind === 'memory_trace') {
    record(
      assert(
        checks,
        binding.sourceKinds.includes('district_memory') || binding.sourceKinds.includes('decision_consequence'),
        `${binding.id} memory source guard`,
        `${binding.id} fake memory`,
      ),
    );
  }

  if (binding.kind === 'recovery_window' || binding.kind === 'opportunity_window') {
    record(
      assert(
        checks,
        binding.sourceKinds.includes('reward_comeback') || binding.sourceKinds.includes('event_gameplay_variety'),
        `${binding.id} opportunity source guard`,
        `${binding.id} fake opportunity`,
      ),
    );
  }

  return ok;
}

export function verifyPortfolioDeferRiskScenario(): VerifyPortfolioDeferRiskOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION unchanged', `SAVE_VERSION ${SAVE_VERSION}`));
  record(assert(checks, !readRepo('src/store/useGameStore.ts').includes('portfolioDeferRisk'), 'useGameStore untouched', 'useGameStore wired'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('portfolioDeferRisk'), 'applyDecision untouched', 'applyDecision wired'));
  record(assert(checks, !readRepo('src/core/game/endDay.ts').includes('portfolioDeferRisk'), 'day pipeline untouched', 'endDay wired'));
  record(assert(checks, !readRepo('src/features/hub/components/HubReferenceHome.tsx').includes('portfolioDeferRisk'), 'Hub UI untouched', 'Hub UI wired'));

  const day1Portfolio = buildDailyCapacityPortfolio({ day: 1, activeEvents: [event('d1', 'Ilk operasyon', 'Merkez', 'merkez')] });
  const day1 = buildPortfolioDeferRiskBindings({ day: 1, portfolioResult: day1Portfolio });
  record(assert(checks, day1.bindings.length === 0, 'Day 1 low-noise no binding', `Day 1 bindings ${day1.bindings.length}`));
  record(assert(checks, !day1.reportSummaryLine && !day1.tomorrowActionLine, 'Day 1 no report/tomorrow line', 'Day 1 produced lines'));

  const noPortfolio = buildPortfolioDeferRiskBindings({ day: 8 });
  record(assert(checks, noPortfolio.bindings.length === 0, 'No portfolio source no fake binding', 'No portfolio produced binding'));

  const day8Portfolio = buildDailyCapacityPortfolio(day8Input());
  const deferredRiskItem = day8Portfolio.items.find(
    (item) => item.deferRisk !== 'none' && item.sourceKinds.includes('tomorrow_risk'),
  );
  const day8PortfolioWithDeferredRisk = deferredRiskItem
    ? {
        ...day8Portfolio,
        items: day8Portfolio.items.map((item) =>
          item.id === deferredRiskItem.id ? { ...item, status: 'deferred' as const } : item,
        ),
        deferredItems: [{ ...deferredRiskItem, status: 'deferred' as const }],
        availableItems: day8Portfolio.availableItems.filter((item) => item.id !== deferredRiskItem.id),
      }
    : day8Portfolio;
  const day8 = buildPortfolioDeferRiskBindings({
    day: 8,
    portfolioResult: day8PortfolioWithDeferredRisk,
    tomorrowRiskSignals: [tomorrowRisk()],
  });
  record(assert(checks, day8.bindings.length > 0, 'Day 8 deferred/watch binding', 'Day 8 missing binding'));
  record(assert(checks, day8.bindings.length <= 2, 'Max 2 bindings', `binding count ${day8.bindings.length}`));
  record(assert(checks, Boolean(day8.primaryBinding) === (day8.bindings.length > 0), 'Primary max 1', 'primary mismatch'));
  record(assert(checks, unique(day8.bindings.map((binding) => binding.id)), 'Binding ids unique', 'duplicate binding ids'));
  record(assert(checks, unique(day8.sourceIds), 'Result sourceIds unique', 'duplicate result source ids'));
  record(assert(checks, Boolean(day8.reportSummaryLine), 'Report line candidate', 'missing report line'));
  record(assert(checks, Boolean(day8.tomorrowActionLine), 'Tomorrow line candidate from source', 'missing tomorrow line'));
  for (const binding of day8.bindings) {
    record(validateBinding(checks, binding));
  }

  const duplicateSource = day8.primaryBinding?.sourceIds[0];
  const duplicateSuppressed = buildPortfolioDeferRiskBindings({
    day: 8,
    portfolioResult: day8PortfolioWithDeferredRisk,
    decisionConsequenceThreads: duplicateSource
      ? [{ id: 'thread_dup', sourceIds: [duplicateSource], visibleIn: ['report'], title: 'Karar izi' }]
      : [],
    tomorrowRiskSignals: [tomorrowRisk()],
  });
  record(
    assert(
      checks,
      !duplicateSource || !duplicateSuppressed.bindings.some((binding) => binding.sourceIds.includes(duplicateSource)),
      'DecisionConsequence duplicate source suppress',
      'duplicate source still visible',
    ),
  );

  const safeWatchPortfolio = buildDailyCapacityPortfolio({
    day: 8,
    operationSignals: {
      overall: {
        domain: 'overall',
        status: 'watch',
        score: 50,
        title: 'Sakin takip sinyali',
        summary: 'Bugun izlenebilir.',
        sourceTags: ['safe_watch_source'],
      },
    },
  });
  const safeWatch = buildPortfolioDeferRiskBindings({ day: 8, portfolioResult: safeWatchPortfolio });
  record(assert(checks, safeWatch.bindings.every((binding) => binding.tone === 'neutral'), 'Safe watch neutral', 'safe watch warning'));
  record(assert(checks, safeWatch.bindings.every((binding) => !binding.tomorrowLine), 'Safe watch no fake tomorrow', 'safe watch fake tomorrow'));

  const recoveryPortfolio = buildDailyCapacityPortfolio({
    day: 10,
    activeEvents: [
      event('active_a', 'Aktif rota operasyonu', 'Sanayi', 'sanayi'),
      event('active_b', 'Aktif konteyner operasyonu', 'Cumhuriyet', 'cumhuriyet'),
    ],
    operationSignals: operationSignals(),
    rewardComebackSignals: {
      id: 'recovery_1',
      title: 'Toparlanma firsati',
      summary: 'Bolge kucuk bir takip hamlesine acik.',
      tone: 'recovery',
      districtId: 'cumhuriyet',
      sourceIds: ['recovery_source'],
    },
  });
  const recovery = buildPortfolioDeferRiskBindings({ day: 10, portfolioResult: recoveryPortfolio });
  record(
    assert(
      checks,
      recovery.bindings.every(
        (binding) =>
          binding.kind !== 'recovery_window' ||
          binding.sourceKinds.includes('reward_comeback') ||
          binding.sourceKinds.includes('event_gameplay_variety'),
      ),
      'Recovery opportunity source guard',
      'fake recovery opportunity',
    ),
  );

  const existing = day8.reportSummaryLine ? [day8.reportSummaryLine] : [];
  record(assert(checks, !buildPortfolioDeferReportLine(day8, existing), 'Report duplicate line suppressed', 'report duplicate not suppressed'));
  record(assert(checks, buildPortfolioDeferTomorrowActionLine(day8, []) === day8.tomorrowActionLine, 'Tomorrow presentation line', 'tomorrow presentation mismatch'));

  const moduleFiles = [
    'src/core/portfolioDeferRisk/portfolioDeferRiskTypes.ts',
    'src/core/portfolioDeferRisk/portfolioDeferRiskModel.ts',
    'src/core/portfolioDeferRisk/portfolioDeferRiskPresentation.ts',
    'src/core/portfolioDeferRisk/verifyPortfolioDeferRiskScenario.ts',
    'src/core/portfolioDeferRisk/index.ts',
    'scripts/verify-portfolio-defer-risk.ts',
    'scripts/analyze-portfolio-defer-risk.ts',
    'docs/crevia-portfolio-defer-risk-binding-pass.md',
  ];
  for (const file of moduleFiles) {
    record(assert(checks, existsSync(join(REPO_ROOT, file)), `${file} exists`, `${file} missing`));
  }

  return { ok, warn: false, checks };
}
