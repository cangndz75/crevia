/**
 * Diagnostic analyzer for Day 8+ strategic content candidates.
 * Calistir: npm run analyze:day8-strategic-content
 */

import { buildAuthorityGameplayExpansionSummary } from '../src/core/authorityGameplayExpansion';
import { buildCityMemoryVisibility } from '../src/core/cityMemoryVisibility';
import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '../src/core/dailyCapacityPortfolio';
import { buildDistrictNeglectRecovery } from '../src/core/districtNeglectRecovery';
import { buildDay8StrategicContent } from '../src/core/day8StrategicContent';
import { buildFollowUpActions } from '../src/core/followUpActions';
import { buildOneMoreDayRetention } from '../src/core/oneMoreDayRetention';
import { buildPortfolioDeferRiskBindings } from '../src/core/portfolioDeferRisk';
import { buildPositiveComeback } from '../src/core/positiveComeback';
import {
  DAY8_STRATEGIC_CONTENT_POSITIVE_KINDS,
  DAY8_STRATEGIC_CONTENT_RISK_KINDS,
} from '../src/core/day8StrategicContent/day8StrategicContentConstants';

type Scenario = {
  label: string;
  day: number;
  extra?: Record<string, unknown>;
};

function event(id: string, title: string, district: string, neighborhoodId: string) {
  return { id, title, district, neighborhoodId, day: 8 };
}

function portfolioInput(day: number): DailyCapacityPortfolioInput {
  return {
    day,
    activeEvents: [event('e1', 'Rota', 'Sanayi', 'sanayi')],
    operationSignals: {
      priorityDistrictId: 'sanayi',
      vehicles: {
        status: 'strained',
        score: 70,
        title: 'Rota',
        summary: 'Baski',
        sourceTags: ['route'],
      },
      overall: { status: 'watch', score: 50, title: 'Genel', summary: 'Iz', sourceTags: [] },
    },
    authorityPermissionIds: ['tomorrow_risk_preview', 'district_context_detail', 'portfolio_cost_explanation'],
  };
}

function buildPipeline(day: number, extra: Record<string, unknown> = {}) {
  const portfolio = buildDailyCapacityPortfolio({ ...portfolioInput(day), ...extra });
  const portfolioDeferRisk = buildPortfolioDeferRiskBindings({
    day,
    portfolioResult: portfolio,
    ...extra,
  });
  const oneMoreDayRetention = buildOneMoreDayRetention({
    day,
    portfolioDeferRiskResult: portfolioDeferRisk,
    dailyCapacityPortfolioResult: portfolio,
    ...extra,
  });
  const cityMemoryVisibility = buildCityMemoryVisibility({
    day,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    ...extra,
  });
  const authorityExpansionSummary = buildAuthorityGameplayExpansionSummary({
    day,
    permissionIds: portfolioInput(day).authorityPermissionIds,
    portfolioAvailable: portfolio.items.length > 0,
    ...extra,
  });
  const followUpActions = buildFollowUpActions({
    day,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    dailyCapacityPortfolioResult: portfolio,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    authorityExpansionSummary,
    ...extra,
  });
  const positiveComeback = buildPositiveComeback({
    day,
    dailyCapacityPortfolioResult: portfolio,
    followUpActionResult: followUpActions,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    portfolioDeferRiskResult: portfolioDeferRisk,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    authorityExpansionSummary,
    ...extra,
  });
  const districtNeglectRecovery = buildDistrictNeglectRecovery({
    day,
    dailyCapacityPortfolioResult: portfolio,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    followUpActionResult: followUpActions,
    positiveComebackResult: positiveComeback,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    authorityExpansionSummary,
    ...extra,
  });
  return {
    day,
    authorityPermissionIds: portfolioInput(day).authorityPermissionIds,
    dailyCapacityPortfolioResult: portfolio,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    followUpActionResult: followUpActions,
    positiveComebackResult: positiveComeback,
    districtNeglectRecoveryResult: districtNeglectRecovery,
    authorityExpansionSummary,
  };
}

const scenarios: Scenario[] = [
  { label: 'Day 1 hidden', day: 1 },
  { label: 'Day 7 hidden', day: 7 },
  { label: 'Day 8 low data', day: 8 },
  { label: 'Day 8 district neglect', day: 8 },
  {
    label: 'Day 8 recovery opportunity',
    day: 8,
    extra: {
      dailyCapacityPortfolioResult: undefined,
    },
  },
  { label: 'Day 8 positive comeback', day: 8 },
  { label: 'Day 8 portfolio defer risk', day: 8 },
  {
    label: 'Day 8 resource pressure',
    day: 8,
    extra: {
      operationalResourceSignals: {
        id: 'resource_1',
        title: 'Kaynak baskisi',
        summary: 'Kaynak sinirli.',
        sourceIds: ['resource_1'],
      },
    },
  },
  {
    label: 'Day 8 route pressure',
    day: 8,
    extra: {
      vehicleMaintenanceSignals: {
        id: 'vehicle_1',
        title: 'Arac yorgunlugu',
        summary: 'Rota zorlaniyor.',
        sourceIds: ['vehicle_1'],
      },
    },
  },
  {
    label: 'Day 8 city memory',
    day: 8,
    extra: {
      cityMemoryVisibilityResult: {
        traces: [
          {
            id: 'trace_1',
            kind: 'district_trace',
            line: 'Mahalle izi.',
            districtName: 'Sanayi',
            sourceIds: ['trace_1'],
          },
        ],
        sourceIds: ['trace_1'],
      },
    },
  },
  { label: 'Day 10 mixed neglect recovery memory', day: 10 },
  {
    label: 'Authority detailed',
    day: 10,
    extra: {
      authorityPermissionIds: [
        'portfolio_cost_explanation',
        'district_context_detail',
        'map_layer_detail',
        'ece_analysis_depth',
      ],
    },
  },
  { label: 'Duplicate source across systems', day: 8 },
];

let hasWarn = false;
let hasFail = false;

for (const scenario of scenarios) {
  const pipeline = scenario.day >= 8 ? buildPipeline(scenario.day, scenario.extra ?? {}) : null;
  const result = buildDay8StrategicContent({
    day: scenario.day,
    ...(pipeline ?? {}),
    cityMemoryVisibilityResult:
      (scenario.extra?.cityMemoryVisibilityResult as never) ?? pipeline?.cityMemoryVisibilityResult,
    operationalResourceSignals: scenario.extra?.operationalResourceSignals,
    vehicleMaintenanceSignals: scenario.extra?.vehicleMaintenanceSignals,
    authorityPermissionIds:
      (scenario.extra?.authorityPermissionIds as never) ?? pipeline?.authorityPermissionIds,
  });

  const visible = result.candidates.filter((candidate) => !candidate.isFallback && candidate.visibilityLevel !== 'hidden');
  const primary = result.primaryCandidate;
  const kinds = visible.map((candidate) => candidate.kind);
  const districts = visible.map((candidate) => candidate.districtName ?? 'city');
  const sourceKinds = [...new Set(visible.flatMap((candidate) => candidate.sourceKinds))];
  const riskCount = visible.filter((candidate) => DAY8_STRATEGIC_CONTENT_RISK_KINDS.includes(candidate.kind)).length;
  const positiveCount = visible.filter((candidate) =>
    DAY8_STRATEGIC_CONTENT_POSITIVE_KINDS.includes(candidate.kind),
  ).length;

  let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
  if (scenario.day < 8 && visible.length > 0) status = 'FAIL';
  if (scenario.day >= 8 && visible.length === 0 && !result.candidates.some((c) => c.isFallback)) status = 'WARN';
  if (scenario.day >= 8 && visible.length === 0 && result.candidates.every((c) => c.isFallback) && scenario.label.includes('neglect')) status = 'WARN';
  if (new Set(kinds).size < kinds.length && kinds.length >= 3) status = 'WARN';
  if (new Set(districts).size < 2 && districts.length >= 3) status = 'WARN';
  if (positiveCount === 0 && scenario.label.includes('recovery')) status = 'WARN';
  if (riskCount === 0 && scenario.label.includes('neglect')) status = 'WARN';
  if (scenario.day >= 8 && visible.every((c) => c.isFallback) && !scenario.label.includes('low data')) status = 'WARN';

  if (status === 'WARN') hasWarn = true;
  if (status === 'FAIL') hasFail = true;

  // eslint-disable-next-line no-console
  console.log(
    `${status} ${scenario.label} | count=${visible.length} primary=${primary?.kind ?? 'none'} ` +
      `sources=${sourceKinds.length} risk=${riskCount} positive=${positiveCount} ` +
      `fallback=${result.candidates.some((c) => c.isFallback)}`,
  );
  if (primary?.line) {
    // eslint-disable-next-line no-console
    console.log(`  line: ${primary.line}`);
  }
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(hasFail ? 'Analyzer: FAIL' : hasWarn ? 'Analyzer: WARN' : 'Analyzer: PASS');

if (hasFail) {
  process.exit(1);
}
