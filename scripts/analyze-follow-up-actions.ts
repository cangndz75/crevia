/**
 * Follow-up Action Content Pack analyzer.
 * Calistir: npm run analyze:follow-up-actions
 */

import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '../src/core/dailyCapacityPortfolio';
import { buildPortfolioDeferRiskBindings } from '../src/core/portfolioDeferRisk';
import {
  buildFollowUpActionDebugRows,
  buildFollowUpActions,
  type FollowUpActionInput,
} from '../src/core/followUpActions';

type Scenario = {
  label: string;
  input: FollowUpActionInput;
  expectActions?: boolean;
};

const TECHNICAL_ENUM_PATTERN = /[a-z]+_[a-z_]+/;

function event(id: string, title: string, district: string, neighborhoodId: string) {
  return { id, title, district, neighborhoodId, day: 8 };
}

function signals(status = 'critical', score = 78) {
  return {
    priorityDistrictId: 'sanayi',
    vehicles: { status, score, title: 'Rota baskisi', summary: 'Arac rotasi zorlaniyor.', sourceTags: ['route'] },
    containers: { status: 'strained', score: 68, title: 'Konteyner hatti', summary: 'Hat ek kaynak istiyor.', sourceTags: ['container'] },
    districts: { status: 'watch', score: 54, title: 'Guven hassasiyeti', summary: 'Izleniyor.', sourceTags: ['trust'] },
    overall: { status: 'watch', score: 50, title: 'Genel', summary: 'Izleniyor.', sourceTags: ['overall'] },
  };
}

function buildPortfolioPipeline(day: number, input: DailyCapacityPortfolioInput): FollowUpActionInput {
  const portfolio = buildDailyCapacityPortfolio(input);
  const deferred = portfolio.items.find((item) => item.deferRisk !== 'none');
  const portfolioWithDeferred = deferred
    ? {
        ...portfolio,
        items: portfolio.items.map((item) =>
          item.id === deferred.id ? { ...item, status: 'deferred' as const } : item,
        ),
        deferredItems: [{ ...deferred, status: 'deferred' as const }],
      }
    : portfolio;
  const deferRisk = buildPortfolioDeferRiskBindings({
    day,
    portfolioResult: portfolioWithDeferred,
    tomorrowRiskSignals: input.tomorrowRiskSignals,
  });
  return {
    day,
    dailyCapacityPortfolioResult: portfolioWithDeferred,
    portfolioDeferRiskResult: deferRisk,
    tomorrowRiskSignals: input.tomorrowRiskSignals,
    authorityExpansionSummary: input.authorityPermissionIds
      ? {
          unlockedBenefits: input.authorityPermissionIds.map((id) => ({
            requiredPermissionId: id,
            isUnlocked: true,
          })),
        }
      : undefined,
  };
}

const active = [
  event('active_a', 'Aktif rota operasyonu', 'Sanayi', 'sanayi'),
  event('active_b', 'Aktif konteyner operasyonu', 'Cumhuriyet', 'cumhuriyet'),
];

const scenarios: Scenario[] = [
  { label: 'Day 1 no source', input: { day: 1 } },
  {
    label: 'Day 8 deferred route',
    input: buildPortfolioPipeline(8, {
      day: 8,
      activeEvents: active,
      operationSignals: signals(),
      tomorrowRiskSignals: [{ id: 'tr_route', title: 'Yarin rota', mainLine: 'Rota baskisi buyuyebilir.', priority: 'high', relatedDomain: 'route', sourceSignals: ['operation_signals'] }],
    }),
    expectActions: true,
  },
  {
    label: 'Day 8 social watch',
    input: buildPortfolioPipeline(8, {
      day: 8,
      operationSignals: {
        districts: { status: 'strained', score: 72, title: 'Sosyal nabiz', summary: 'Tepki izleniyor.', sourceTags: ['social'] },
      },
    }),
  },
  {
    label: 'Day 10 recovery opportunity',
    input: {
      day: 10,
      rewardComebackSignals: { id: 'recovery', title: 'Toparlanma firsati', summary: 'Kucuk takip hamlesi degerli.', tone: 'recovery', sourceIds: ['recovery_source'] },
    },
    expectActions: true,
  },
  {
    label: 'Memory trace',
    input: {
      day: 8,
      decisionConsequenceThreads: [{ id: 'mem', title: 'Karar izi', summary: 'Iz suruyor.', consequenceType: 'district_memory', sourceIds: ['mem_src'] }],
    },
    expectActions: true,
  },
  {
    label: 'District neglect baseline only',
    input: {
      day: 8,
      districtPersonalityProfiles: [{ districtId: 'merkez', sourceKinds: ['design_baseline'], criteria: [{ id: 'neglect_risk', band: 'high' }] }],
    },
  },
  {
    label: 'Resource pressure',
    input: buildPortfolioPipeline(8, {
      day: 8,
      activeEvents: active,
      operationSignals: signals('strained', 65),
      resourceSignals: { id: 'res_1', title: 'Kaynak baskisi', summary: 'Malzeme daraliyor.', score: 72, sourceIds: ['resource_1'] },
    }),
  },
  { label: 'Low data', input: { day: 8 } },
  {
    label: 'Authority detailed',
    input: buildPortfolioPipeline(8, {
      day: 8,
      activeEvents: active,
      operationSignals: signals(),
      tomorrowRiskSignals: [{ id: 'tr_route', title: 'Yarin rota', mainLine: 'Rota baskisi buyuyebilir.', priority: 'high', relatedDomain: 'route', sourceSignals: ['operation_signals'] }],
      authorityPermissionIds: ['portfolio_defer_reason', 'tomorrow_risk_preview'],
    }),
    expectActions: true,
  },
  {
    label: 'Duplicate actions',
    input: {
      day: 8,
      portfolioDeferRiskResult: {
        bindings: [
          { id: 'b1', deferRisk: 'route_may_strain', kind: 'deferred_risk', title: 'Rota', line: 'x', priority: 90, confidence: 'high', sourceIds: ['dup_src'], sourceKinds: ['tomorrow_risk'], isFallback: false },
          { id: 'b2', deferRisk: 'route_may_strain', kind: 'deferred_risk', title: 'Rota 2', line: 'y', priority: 85, confidence: 'high', sourceIds: ['dup_src2'], sourceKinds: ['tomorrow_risk'], isFallback: false },
        ],
        sourceIds: ['dup_src', 'dup_src2'],
      },
      decisionConsequenceThreads: [{ id: 't1', title: 'Iz', summary: 's', sourceIds: ['dup_src'] }],
    },
  },
];

let hasFail = false;
let warnCount = 0;

for (const scenario of scenarios) {
  const result = buildFollowUpActions(scenario.input);

  // eslint-disable-next-line no-console
  console.log(`\n=== ${scenario.label} (Day ${scenario.input.day}) ===`);
  // eslint-disable-next-line no-console
  console.log(`actions=${result.actions.length} primary=${result.primaryAction?.kind ?? 'none'}`);
  for (const row of buildFollowUpActionDebugRows(result)) console.log(`- ${row}`);

  if (result.actions.length > 3) {
    console.log('FAIL max 3 action exceeded');
    hasFail = true;
  }
  if (scenario.expectActions && result.actions.length === 0) {
    console.log('WARN Day 8+ source varken action yok');
    warnCount += 1;
  }
  if (result.actions.some((a) => !a.isFallback && a.sourceIds.length === 0)) {
    console.log('FAIL fake source claim');
    hasFail = true;
  }
  if (result.actions.some((a) => a.kind === 'support_recovery' && a.costBand === 'medium')) {
    console.log('WARN recovery cost medium/high');
    warnCount += 1;
  }
  const kindCounts = new Map<string, number>();
  for (const action of result.actions) {
    kindCounts.set(action.kind, (kindCounts.get(action.kind) ?? 0) + 1);
  }
  for (const [kind, count] of kindCounts) {
    if (count > 2) {
      console.log(`WARN same kind spam: ${kind}=${count}`);
      warnCount += 1;
    }
  }
  const visible = result.actions.map((a) => `${a.title} ${a.line} ${a.benefitLine}`).join(' ');
  if (TECHNICAL_ENUM_PATTERN.test(visible)) {
    console.log('FAIL technical enum in UI text');
    hasFail = true;
  }
  if (scenario.input.day === 1 && result.actions.length > 1) {
    console.log('FAIL Day 1 low-noise');
    hasFail = true;
  }
  if (result.actions.some((a) => a.kind === 'capture_memory_trace' && !a.sourceKinds.some((k) => ['decision_consequence', 'district_memory', 'city_archive', 'city_memory_visibility', 'district_personality'].includes(k)))) {
    console.log('FAIL fake memory');
    hasFail = true;
  }
}

// eslint-disable-next-line no-console
console.log(`\n--- Analyzer result: ${warnCount} WARN ---`);
if (hasFail) {
  console.log('FAIL');
  process.exit(1);
}
console.log('PASS');
