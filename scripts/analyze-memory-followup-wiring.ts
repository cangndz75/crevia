/**
 * Diagnostic analyzer for memory & follow-up production wiring.
 * Calistir: npm run analyze:memory-followup-wiring
 */

import { createDay1Seed } from '../src/core/content/day1Seed';
import { buildDailyReport } from '../src/core/game/buildDailyReport';
import { createInitialOperationSignalsState } from '../src/core/operations/operationSignalState';
import type { GameState } from '../src/core/models/GameState';
import type { TomorrowRiskModel } from '../src/core/tomorrowRisk/tomorrowRiskTypes';

import { buildCenterHomePresentation } from '../src/features/hub/utils/centerHomePresentation';
import { buildEndOfDayReportViewModel } from '../src/features/reports/utils/endOfDayReportPresentation';
import { buildMemoryFollowUpPresentationContext } from '../src/features/shared/utils/memoryFollowUpPresentationContext';

type Scenario = {
  label: string;
  day: number;
  hubImpact?: string;
  hubDistrict?: string;
  hubStory?: string;
};

function makeState(day: number) {
  const base = createDay1Seed().gameState;
  return {
    ...base,
    city: { ...base.city, day },
    pilot: { ...base.pilot, currentPilotDay: day },
  };
}

function signals(day: number) {
  return createInitialOperationSignalsState(day);
}

function tomorrowRisk(day: number): TomorrowRiskModel | undefined {
  if (day < 8) return undefined;
  return {
    id: 'risk_route',
    title: 'Yarın rota',
    mainLine: 'Rota baskısı yarın tekrar okunmalı.',
    priority: 'high',
    relatedDomain: 'route',
    sourceSignals: ['operation_signals'],
    shouldShowInHub: true,
    shouldShowInReport: true,
    shouldShowAsCompact: false,
    maxVisibleLines: 2,
    kind: 'route_pressure_tomorrow',
    tone: 'risk',
  };
}

const scenarios: Scenario[] = [
  { label: 'Day 1 no source', day: 1 },
  {
    label: 'Day 3 decision consequence',
    day: 3,
    hubImpact: 'Önceki karar bugünkü önceliği etkiliyor.',
  },
  {
    label: 'Day 8 portfolio defer + city memory',
    day: 8,
    hubImpact: 'Önceki rota tercihi bugün kaynak baskısını artırdı.',
    hubDistrict: 'Mahalle güveni bugünkü kararla değişti.',
  },
  {
    label: 'Day 8 follow-up action',
    day: 8,
    hubImpact: 'Önceki rota tercihi bugün kaynak baskısını artırdı.',
    hubDistrict: 'Mahalle güveni bugünkü kararla değişti.',
  },
  {
    label: 'Day 10 story chain + recovery',
    day: 10,
    hubImpact: 'Önceki rota tercihi bugün kaynak baskısını artırdı.',
    hubDistrict: 'Mahalle güveni bugünkü kararla değişti.',
    hubStory: 'Hikaye zinciri yeni bir iz bıraktı.',
  },
  {
    label: 'Duplicate source across surfaces',
    day: 8,
    hubImpact: 'Rota baskısı yarın tekrar okunmalı.',
    hubDistrict: 'Rota baskısı yarın tekrar okunmalı.',
  },
  { label: 'Low data', day: 8 },
  {
    label: 'Authority permission available',
    day: 8,
    hubImpact: 'Yetki genişlemesi portföy takibini açtı.',
    hubDistrict: 'Mahalle güveni bugünkü kararla değişti.',
  },
];

let hasWarn = false;

for (const scenario of scenarios) {
  const gameState = makeState(scenario.day) as GameState;
  const context = buildMemoryFollowUpPresentationContext({
    day: scenario.day,
    gameState,
    operationSignals: signals(scenario.day),
    hubImpactExplanationLine: scenario.hubImpact,
    hubDistrictReportLine: scenario.hubDistrict,
    hubStoryChainLine: scenario.hubStory,
    authorityPermissionIds: scenario.label.includes('Authority')
      ? ['tomorrow_risk_preview', 'portfolio_defer_reason']
      : undefined,
    hubTomorrowRisk: tomorrowRisk(scenario.day),
  });

  const hub = buildCenterHomePresentation({
    gameState,
    operationSignals: signals(scenario.day),
    hubImpactExplanationLine: scenario.hubImpact,
    hubDistrictReportLine: scenario.hubDistrict,
    hubStoryChainLine: scenario.hubStory,
  });

  const report = buildEndOfDayReportViewModel({
    report: buildDailyReport({
      day: scenario.day,
      metrics: { publicSatisfaction: 70, staffMorale: 70, budget: 100000 },
      decisionHistory: [],
      activeEvents: [],
      resolvedEventIds: [],
      snapshots: [],
    }),
    metrics: { publicSatisfaction: 70, staffMorale: 70, budget: 100000 },
    dailyXpReport: { day: scenario.day, totalXp: 10, categories: [] },
    memoryFollowUpContext: context,
  });

  const memoryCards = hub.continuationCards.cards.filter((card) =>
    card.id.includes('city-memory'),
  ).length;
  const followCards = hub.continuationCards.cards.filter((card) =>
    card.id.includes('follow-up'),
  ).length;

  const duplicateLines = new Set(
    [
      report.oneMoreDayCard?.line,
      report.eceStrategyLine?.text,
      report.cityMemoryNote?.line,
      report.followUpActionHint?.line,
      hub.advisorSuggestion.reason,
    ]
      .filter(Boolean)
      .map((line) => line!.trim().toLowerCase()),
  );

  const visible =
    context.cityMemoryVisibility.traces.length > 0 ||
    Boolean(context.followUpActions.primaryAction && !context.followUpActions.primaryAction.isFallback) ||
    Boolean(report.cityMemoryNote) ||
    Boolean(report.followUpActionHint) ||
    memoryCards > 0 ||
    followCards > 0;

  const day1Noise =
    scenario.day === 1 &&
    (memoryCards > 0 || followCards > 0 || Boolean(report.cityMemoryNote) || Boolean(report.followUpActionHint));

  const status =
    day1Noise ? 'WARN' : scenario.day >= 8 && !visible && scenario.label.includes('Low data') ? 'WARN' : 'PASS';

  if (status === 'WARN') hasWarn = true;

  // eslint-disable-next-line no-console
  console.log(
    `${status} ${scenario.label} | traces=${context.cityMemoryVisibility.traces.length} ` +
      `followUp=${context.followUpActions.actions.length} reportMemory=${report.cityMemoryNote ? 1 : 0} ` +
      `reportFollow=${report.followUpActionHint ? 1 : 0} hubMemoryCard=${memoryCards} hubFollowCard=${followCards} ` +
      `dedupeLines=${duplicateLines.size}`,
  );
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(hasWarn ? 'Analyzer: WARN' : 'Analyzer: PASS');
