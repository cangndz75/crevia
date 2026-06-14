/**
 * Diagnostic analyzer for portfolio defer risk bindings.
 * Calistir: npm run analyze:portfolio-defer-risk
 */

import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '../src/core/dailyCapacityPortfolio';
import {
  buildPortfolioDeferRiskBindings,
  buildPortfolioDeferBindingDebugRows,
} from '../src/core/portfolioDeferRisk';

type Scenario = {
  label: string;
  input: DailyCapacityPortfolioInput;
  duplicatePrimary?: boolean;
};

function event(id: string, title: string, district: string, neighborhoodId: string) {
  return { id, title, district, neighborhoodId, day: 8 };
}

function signals(status = 'critical', score = 78) {
  return {
    priorityDistrictId: 'sanayi',
    vehicles: { status, score, title: 'Rota baskisi', summary: 'Arac rotasi zorlaniyor.', sourceTags: ['route'] },
    containers: { status: 'strained', score: 68, title: 'Konteyner hatti', summary: 'Hat ek kaynak istiyor.', sourceTags: ['container'] },
    districts: { status: 'watch', score: 54, title: 'Guven hassasiyeti', summary: 'Izleniyor.', sourceTags: ['trust'] },
    personnel: { status: 'stable', score: 25, title: 'Ekip', summary: 'Dengeli', sourceTags: [] },
    overall: { status: 'watch', score: 50, title: 'Genel', summary: 'Izleniyor.', sourceTags: ['overall'] },
  };
}

const active = [
  event('active_a', 'Aktif rota operasyonu', 'Sanayi', 'sanayi'),
  event('active_b', 'Aktif konteyner operasyonu', 'Cumhuriyet', 'cumhuriyet'),
];

const scenarios: Scenario[] = [
  { label: 'Day 1', input: { day: 1, activeEvents: [event('d1', 'Ilk operasyon', 'Merkez', 'merkez')] } },
  {
    label: 'Day 8 deferred route pressure',
    input: {
      day: 8,
      activeEvents: active,
      operationSignals: signals(),
      tomorrowRiskSignals: [{ id: 'tr_route', title: 'Yarin rota', mainLine: 'Rota baskisi buyuyebilir.', priority: 'high', relatedDomain: 'route', sourceSignals: ['operation_signals'] }],
      authorityPermissionIds: ['tomorrow_risk_preview'],
    },
  },
  { label: 'Day 8 safe watch', input: { day: 8, operationSignals: { overall: { status: 'watch', score: 50, title: 'Sakin takip', summary: 'Izlenebilir.', sourceTags: ['safe'] } } } },
  {
    label: 'Day 10 recovery opportunity',
    input: {
      day: 10,
      activeEvents: active,
      operationSignals: signals('strained', 62),
      rewardComebackSignals: { id: 'recovery', title: 'Toparlanma firsati', summary: 'Kucuk takip hamlesi degerli.', tone: 'recovery', sourceIds: ['recovery_source'] },
    },
  },
  {
    label: 'Decision consequence duplicate source',
    duplicatePrimary: true,
    input: {
      day: 8,
      activeEvents: active,
      operationSignals: signals(),
      tomorrowRiskSignals: [{ id: 'tr_route', title: 'Yarin rota', mainLine: 'Rota baskisi buyuyebilir.', priority: 'high', relatedDomain: 'route', sourceSignals: ['operation_signals'] }],
    },
  },
  { label: 'No portfolio source', input: { day: 8 } },
  {
    label: 'Low confidence fallback',
    input: {
      day: 1,
    },
  },
];

let hasFail = false;

for (const scenario of scenarios) {
  const rawPortfolio = buildDailyCapacityPortfolio(scenario.input);
  const forcedDeferred = rawPortfolio.items.find(
    (item) => item.deferRisk !== 'none' && item.sourceKinds.includes('tomorrow_risk'),
  );
  const portfolio =
    scenario.label.includes('deferred') && forcedDeferred
      ? {
          ...rawPortfolio,
          items: rawPortfolio.items.map((item) =>
            item.id === forcedDeferred.id ? { ...item, status: 'deferred' as const } : item,
          ),
          deferredItems: [{ ...forcedDeferred, status: 'deferred' as const }],
          availableItems: rawPortfolio.availableItems.filter((item) => item.id !== forcedDeferred.id),
        }
      : rawPortfolio;
  const duplicateId = scenario.duplicatePrimary
    ? [...portfolio.deferredItems, ...portfolio.watchOnlyItems][0]?.sourceIds[0]
    : undefined;
  const result = buildPortfolioDeferRiskBindings({
    day: scenario.input.day,
    portfolioResult: scenario.label === 'No portfolio source' ? undefined : portfolio,
    decisionConsequenceThreads: duplicateId ? [{ id: 'dup', sourceIds: [duplicateId] }] : [],
    tomorrowRiskSignals: scenario.input.tomorrowRiskSignals,
  });

  // eslint-disable-next-line no-console
  console.log(`\n=== ${scenario.label} (Day ${scenario.input.day}) ===`);
  // eslint-disable-next-line no-console
  console.log(`bindings=${result.bindings.length} actionable=${result.hasActionableDeferredRisk}`);
  if (result.reportSummaryLine) console.log(`report: ${result.reportSummaryLine}`);
  if (result.tomorrowActionLine) console.log(`tomorrow: ${result.tomorrowActionLine}`);
  for (const row of buildPortfolioDeferBindingDebugRows(result)) console.log(`- ${row}`);

  if (result.bindings.length > 2) {
    console.log('FAIL too many bindings');
    hasFail = true;
  }
  if (scenario.input.day <= 1 && result.bindings.length > 0) {
    console.log('FAIL Day 1 not low-noise');
    hasFail = true;
  }
  if (scenario.label === 'No portfolio source' && result.bindings.length > 0) {
    console.log('FAIL fake binding without portfolio source');
    hasFail = true;
  }
  if (duplicateId && result.bindings.some((binding) => binding.sourceIds.includes(duplicateId))) {
    console.log('FAIL duplicate source was not suppressed');
    hasFail = true;
  }
  if (result.bindings.some((binding) => binding.tomorrowLine && !binding.sourceKinds.some((kind) => ['tomorrow_risk', 'carry_over', 'district_memory', 'decision_consequence'].includes(kind)))) {
    console.log('FAIL fake tomorrow line');
    hasFail = true;
  }
}

// eslint-disable-next-line no-console
console.log('\n--- Analyzer result ---');
if (hasFail) {
  console.log('FAIL');
  process.exit(1);
}
console.log('PASS');
