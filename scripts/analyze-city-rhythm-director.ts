/**
 * Diagnostic analyzer for City Rhythm Director.
 * Calistir: npm run analyze:city-rhythm-director
 */

import { buildAuthorityGameplayExpansionSummary } from '../src/core/authorityGameplayExpansion';
import { buildCityMemoryVisibility } from '../src/core/cityMemoryVisibility';
import { buildCityRhythmDirector } from '../src/core/cityRhythmDirector';
import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '../src/core/dailyCapacityPortfolio';
import { buildDay8StrategicContent } from '../src/core/day8StrategicContent';
import { buildDistrictNeglectRecovery } from '../src/core/districtNeglectRecovery';
import { buildFollowUpActions } from '../src/core/followUpActions';
import { buildOneMoreDayRetention } from '../src/core/oneMoreDayRetention';
import { buildPortfolioDeferRiskBindings } from '../src/core/portfolioDeferRisk';
import { buildPositiveComeback } from '../src/core/positiveComeback';
import type { CityRhythmKind, CityRhythmSourceKind } from '../src/core/cityRhythmDirector';

type Scenario = {
  label: string;
  day: number;
  extra?: Record<string, unknown>;
  recentRhythmKinds?: CityRhythmKind[];
  recentDistrictIds?: string[];
};

function portfolioInput(day: number): DailyCapacityPortfolioInput {
  return {
    day,
    activeEvents: [
      { id: 'e1', title: 'Rota', district: 'Sanayi', neighborhoodId: 'sanayi', day },
    ],
    operationSignals: {
      priorityDistrictId: 'sanayi',
      vehicles: { status: 'strained', score: 70, title: 'Rota', summary: 'Baski', sourceTags: ['route'] },
      overall: { status: 'watch', score: 50, title: 'Genel', summary: 'Iz', sourceTags: [] },
    },
    authorityPermissionIds: ['district_context_detail'],
  };
}

function buildPipeline(day: number, extra: Record<string, unknown> = {}) {
  const portfolio = buildDailyCapacityPortfolio({ ...portfolioInput(day), ...extra });
  const portfolioDeferRisk = buildPortfolioDeferRiskBindings({ day, portfolioResult: portfolio, ...extra });
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
  const day8StrategicContent = buildDay8StrategicContent({
    day,
    dailyCapacityPortfolioResult: portfolio,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    followUpActionResult: followUpActions,
    positiveComebackResult: positiveComeback,
    districtNeglectRecoveryResult: districtNeglectRecovery,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    authorityExpansionSummary,
    ...extra,
  });
  return {
    day8StrategicContentResult: day8StrategicContent,
    districtNeglectRecoveryResult: districtNeglectRecovery,
    positiveComebackResult: positiveComeback,
    followUpActionResult: followUpActions,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    portfolioDeferRiskResult: portfolioDeferRisk,
    dailyCapacityPortfolioResult: portfolio,
    authorityExpansionSummary,
  };
}

const scenarios: Scenario[] = [
  { label: 'Day 1 hidden', day: 1 },
  { label: 'Day 7 hidden', day: 7 },
  { label: 'Day 8 low data', day: 8 },
  { label: 'Day 8 strategic pressure', day: 8 },
  { label: 'Day 8 recovery window', day: 8 },
  { label: 'Day 8 neglect attention', day: 8 },
  {
    label: 'Day 8 memory echo',
    day: 8,
    extra: {
      cityMemoryVisibilityResult: {
        traces: [{ id: 't1', kind: 'district_trace', line: 'Iz.', sourceIds: ['t1'] }],
        sourceIds: ['t1'],
      },
    },
  },
  { label: 'Day 10 mixed city day', day: 10 },
  {
    label: 'Same kind repetition',
    day: 10,
    recentRhythmKinds: ['neglect_attention_day', 'neglect_attention_day'],
  },
  {
    label: 'Same district repetition',
    day: 10,
    recentDistrictIds: ['sanayi', 'sanayi'],
  },
  { label: 'Positive + high risk conflict', day: 10 },
  {
    label: 'Authority detailed',
    day: 10,
    extra: { authorityPermissionIds: ['district_context_detail', 'ece_analysis_depth'] },
  },
];

let hasWarn = false;
let hasFail = false;

for (const scenario of scenarios) {
  const pipeline = scenario.day >= 8 ? buildPipeline(scenario.day, scenario.extra ?? {}) : null;
  const result = buildCityRhythmDirector({
    day: scenario.day,
    ...(pipeline ?? {}),
    cityMemoryVisibilityResult:
      (scenario.extra?.cityMemoryVisibilityResult as never) ?? pipeline?.cityMemoryVisibilityResult,
    recentRhythmKinds: scenario.recentRhythmKinds,
    recentDistrictIds: scenario.recentDistrictIds,
  });

  const visible = result.slots.filter((s) => !s.isFallback && s.visibilityLevel !== 'hidden').length;
  const sourceKinds = [
    ...new Set(result.slots.flatMap((s) => s.sourceKinds)),
  ] as CityRhythmSourceKind[];

  let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
  if (scenario.day < 8 && result.isVisible) status = 'FAIL';
  if (scenario.day >= 8 && visible === 0 && !result.slots.some((s) => s.isFallback)) status = 'WARN';
  if (scenario.day >= 8 && result.intensity === 'high' && scenario.label.includes('low data')) status = 'WARN';
  if (visible >= 3 && new Set(result.slots.map((s) => s.sourceKinds[0])).size < 2) status = 'WARN';

  if (status === 'WARN') hasWarn = true;
  if (status === 'FAIL') hasFail = true;

  // eslint-disable-next-line no-console
  console.log(
    `${status} ${scenario.label} | visible=${visible} kind=${result.rhythmKind} ` +
      `intensity=${result.intensity} sources=${sourceKinds.length} suppressed=${result.suppressSourceIds.length}`,
  );
  if (result.summaryLine) {
    // eslint-disable-next-line no-console
    console.log(`  line: ${result.summaryLine}`);
  }
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(hasFail ? 'Analyzer: FAIL' : hasWarn ? 'Analyzer: WARN' : 'Analyzer: PASS');

if (hasFail) {
  process.exit(1);
}
