/**
 * Diagnostic analyzer for One More Day Retention.
 * Calistir: npm run analyze:one-more-day-retention
 */

import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '../src/core/dailyCapacityPortfolio';
import { buildOneMoreDayRetention, collectOneMoreDayRetentionLines } from '../src/core/oneMoreDayRetention';
import { buildPortfolioDeferRiskBindings } from '../src/core/portfolioDeferRisk';

type Scenario = {
  label: string;
  day: number;
  input?: DailyCapacityPortfolioInput;
  extra?: Record<string, unknown>;
  forceDeferredRisk?: boolean;
};

function event(id: string, title: string, district: string, neighborhoodId: string) {
  return { id, title, district, neighborhoodId, day: 8 };
}

function signals(status = 'critical', score = 82) {
  return {
    priorityDistrictId: 'sanayi',
    vehicles: { status, score, title: 'Rota baskisi', summary: 'Arac rotasi zorlaniyor.', sourceTags: ['route'] },
    containers: { status: 'strained', score: 68, title: 'Konteyner hatti', summary: 'Hat ek kaynak istiyor.', sourceTags: ['container'] },
    districts: { status: 'watch', score: 54, title: 'Guven hassasiyeti', summary: 'Izleniyor.', sourceTags: ['trust'] },
    overall: { status: 'watch', score: 50, title: 'Genel', summary: 'Izleniyor.', sourceTags: ['overall'] },
  };
}

function portfolio(input: DailyCapacityPortfolioInput, forceDeferredRisk?: boolean) {
  const raw = buildDailyCapacityPortfolio(input);
  const item = raw.items.find((candidate) => candidate.deferRisk !== 'none' && candidate.sourceKinds.includes('tomorrow_risk'));
  if (!forceDeferredRisk || !item) return raw;
  const deferred = { ...item, status: 'deferred' as const };
  return {
    ...raw,
    items: raw.items.map((candidate) => (candidate.id === item.id ? deferred : candidate)),
    deferredItems: [deferred],
    availableItems: raw.availableItems.filter((candidate) => candidate.id !== item.id),
  };
}

const active = [
  event('active_a', 'Aktif rota operasyonu', 'Sanayi', 'sanayi'),
  event('active_b', 'Aktif konteyner operasyonu', 'Cumhuriyet', 'cumhuriyet'),
];

const scenarios: Scenario[] = [
  { label: 'Day 1 fallback', day: 1 },
  { label: 'Day 3 carry-over', day: 3, extra: { carryOverSignals: { id: 'carry_1', summary: 'Yarin bu karari tekrar kontrol et.', sourceIds: ['carry_1'] } } },
  { label: 'Day 7 pilot transition', day: 7, extra: { decisionConsequenceThreads: [{ id: 'decision_7', title: 'Pilot izi', causalLine: 'Yarin pilot etkisini oku.', sourceIds: ['decision_7'] }] } },
  {
    label: 'Day 8 deferred route pressure',
    day: 8,
    forceDeferredRisk: true,
    input: {
      day: 8,
      activeEvents: active,
      operationSignals: signals(),
      tomorrowRiskSignals: [{ id: 'tr_route', title: 'Yarin rota', mainLine: 'Rota baskisi yarin tekrar okunmali.', priority: 'high', relatedDomain: 'route', sourceSignals: ['operation_signals'] }],
      authorityPermissionIds: ['tomorrow_risk_preview'],
    },
  },
  { label: 'Day 8 safe watch', day: 8, input: { day: 8, operationSignals: { overall: { status: 'watch', score: 50, title: 'Sakin takip', summary: 'Izlenebilir.', sourceTags: ['safe'] } } } },
  { label: 'Day 10 recovery opportunity', day: 10, input: { day: 10, activeEvents: active, operationSignals: signals('strained', 62), rewardComebackSignals: { id: 'recovery', title: 'Toparlanma firsati', summary: 'Kucuk takip hamlesi degerli.', tone: 'recovery', sourceIds: ['recovery_source'] } } },
  { label: 'Memory trace', day: 10, extra: { districtMemorySignals: { id: 'memory_1', title: 'Mahalle hafizasi', summary: 'Bolge yarin tekrar anlam kazanabilir.', sourceIds: ['memory_1'] } } },
  { label: 'No source fallback', day: 9 },
  { label: 'Map recommended source', day: 10, extra: { mapGameplayBindings: [{ id: 'map_1', role: 'route_support', visibilityLevel: 'summary', playerFacingTitle: 'Harita rota odagi', playerFacingLine: 'Yarin haritada rota dengesini oku.', sourceIds: ['map_1'] }] } },
];

let hasFail = false;
let hasWarn = false;

for (const scenario of scenarios) {
  const portfolioResult = scenario.input ? portfolio(scenario.input, scenario.forceDeferredRisk) : undefined;
  const portfolioDeferRiskResult = portfolioResult
    ? buildPortfolioDeferRiskBindings({
        day: scenario.day,
        portfolioResult,
        tomorrowRiskSignals: scenario.input?.tomorrowRiskSignals,
      })
    : undefined;
  const result = buildOneMoreDayRetention({
    day: scenario.day,
    dailyCapacityPortfolioResult: portfolioResult,
    portfolioDeferRiskResult,
    currentRouteHints: { hubRoute: '/', mapRoute: '/map', eventsRoute: '/events' },
    ...scenario.extra,
  });

  // eslint-disable-next-line no-console
  console.log(`\n=== ${scenario.label} (Day ${scenario.day}) ===`);
  console.log(`title=${result.title} cta=${result.ctaLabel} route=${result.ctaRoute ?? 'none'}`);
  console.log(`primary=${result.primaryHook?.kind ?? 'none'} source=${result.primaryHook?.sourceKinds.join(',') ?? 'none'} p=${result.primaryHook?.priority ?? 0}`);
  if (result.primaryHook?.tomorrowLine) console.log(`tomorrow=${result.primaryHook.tomorrowLine}`);
  if (result.secondaryHook) console.log(`secondary=${result.secondaryHook.kind}`);

  const lines = collectOneMoreDayRetentionLines(result);
  if (result.primaryHook?.tomorrowLine && result.primaryHook.sourceKinds.includes('fallback')) {
    console.log('FAIL fake tomorrow from fallback');
    hasFail = true;
  }
  if (result.secondaryHook && result.primaryHook?.sourceIds.some((id) => result.secondaryHook?.sourceIds.includes(id))) {
    console.log('FAIL duplicate source between hooks');
    hasFail = true;
  }
  if (lines.some((line) => /[a-z]+_[a-z_]+/.test(line))) {
    console.log('FAIL technical enum leaked');
    hasFail = true;
  }
  if (!result.ctaRoute && result.primaryHook?.isActionable) {
    console.log('FAIL actionable without route');
    hasFail = true;
  }
  if (
    scenario.day >= 8 &&
    portfolioDeferRiskResult?.tomorrowActionLine &&
    !result.primaryHook?.sourceKinds.includes('portfolio_defer_risk')
  ) {
    console.log('WARN Day 8+ portfolio source did not win');
    hasWarn = true;
  }
}

console.log('\n--- Analyzer result ---');
if (hasFail) {
  console.log('FAIL');
  process.exit(1);
}
if (hasWarn) {
  console.log('WARN');
  process.exit(0);
}
console.log('PASS');
