/**
 * Diagnostic analyzer for Day 8+ operation feed binding.
 * Calistir: npm run analyze:day8-operation-feed-binding
 */

import { buildAuthorityGameplayExpansionSummary } from '../src/core/authorityGameplayExpansion';
import { buildCityMemoryVisibility } from '../src/core/cityMemoryVisibility';
import { buildCityRhythmDirector } from '../src/core/cityRhythmDirector';
import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '../src/core/dailyCapacityPortfolio';
import { buildDay8StrategicContent } from '../src/core/day8StrategicContent';
import { buildDistrictNeglectRecovery } from '../src/core/districtNeglectRecovery';
import {
  buildEventSelectionCandidates,
  rankEventSelectionCandidates,
} from '../src/core/eventSelection/eventFamilySelectionEngine';
import {
  applyDay8OperationFeedBiasToEventCandidates,
  buildDay8OperationFeedBinding,
  containsForcedSelectionLanguage,
} from '../src/core/day8OperationFeedBinding';
import { buildFollowUpActions } from '../src/core/followUpActions';
import { buildOneMoreDayRetention } from '../src/core/oneMoreDayRetention';
import { buildPortfolioDeferRiskBindings } from '../src/core/portfolioDeferRisk';
import { buildPositiveComeback } from '../src/core/positiveComeback';

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
    authorityPermissionIds: [
      'tomorrow_risk_preview',
      'district_context_detail',
      'portfolio_cost_explanation',
      'ece_analysis_depth',
    ],
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
  const day8StrategicContent = buildDay8StrategicContent({
    day,
    authorityPermissionIds: portfolioInput(day).authorityPermissionIds,
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
  const cityRhythmDirector = buildCityRhythmDirector({
    day,
    day8StrategicContentResult: day8StrategicContent,
    districtNeglectRecoveryResult: districtNeglectRecovery,
    positiveComebackResult: positiveComeback,
    followUpActionResult: followUpActions,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    portfolioDeferRiskResult: portfolioDeferRisk,
    dailyCapacityPortfolioResult: portfolio,
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
    day8StrategicContentResult: day8StrategicContent,
    cityRhythmDirectorResult: cityRhythmDirector,
    authorityExpansionSummary,
    existingOperationFeedItems: portfolio.items.map((item) => ({
      id: item.id,
      title: item.title,
      districtId: item.districtId,
      kind: item.kind,
      tags: item.sourceKinds,
    })),
    ...extra,
  };
}

const scenarios: Scenario[] = [
  { label: 'Day 1 no-op', day: 1 },
  { label: 'Day 7 no-op', day: 7 },
  { label: 'Day 8 no strategic source', day: 8, extra: {
    districtNeglectRecoveryResult: null,
    day8StrategicContentResult: null,
    cityRhythmDirectorResult: null,
    positiveComebackResult: null,
    followUpActionResult: null,
    cityMemoryVisibilityResult: null,
    portfolioDeferRiskResult: null,
    dailyCapacityPortfolioResult: null,
    oneMoreDayRetentionResult: null,
    authorityExpansionSummary: null,
    existingOperationFeedItems: [],
  } },
  { label: 'Day 8 district neglect source', day: 8 },
  { label: 'Day 8 recovery source', day: 8, extra: { positiveComebackResult: { day: 8, candidates: [], primaryCandidate: { id: 'pc1', kind: 'district_recovery', title: 'Toparlanma', line: 'Firsat', benefitLine: 'Iyilesme', districtId: 'sanayi', districtName: 'Sanayi', sourceIds: ['pc1'], sourceKinds: ['positive_comeback'], confidence: 'high', priority: 88, dayPolicy: 'day_8_plus', visibilityLevel: 'summary', tone: 'positive', isActionable: true, isFallback: false } } } },
  { label: 'Day 8 positive comeback', day: 8 },
  { label: 'Day 8 route pressure', day: 8 },
  { label: 'Day 8 resource pressure', day: 8 },
  { label: 'Day 8 city memory', day: 8 },
  { label: 'Day 10 mixed city rhythm', day: 10 },
  { label: 'Authority detailed', day: 8 },
  { label: 'No matching event candidate', day: 8, extra: { existingEventCandidates: [{ id: 'x', title: 'Genel', domains: ['general'], tags: [], districtIds: ['merkez'], score: 40 }] } },
  { label: 'Duplicate feed source', day: 8 },
];

let failCount = 0;
let warnCount = 0;

function log(status: 'OK' | 'WARN' | 'FAIL', message: string) {
  if (status === 'FAIL') failCount += 1;
  if (status === 'WARN') warnCount += 1;
  // eslint-disable-next-line no-console
  console.log(`${status} ${message}`);
}

for (const scenario of scenarios) {
  const ctx = { day: scenario.day, districtId: 'sanayi' };
  const candidates = scenario.day >= 8 ? buildEventSelectionCandidates(ctx) : [];
  const pipeline =
    scenario.day >= 8 && !scenario.label.includes('no strategic source')
      ? buildPipeline(scenario.day, scenario.extra)
      : { day: scenario.day, ...scenario.extra };
  const binding = buildDay8OperationFeedBinding({
    ...(scenario.day >= 8 ? pipeline : { day: scenario.day }),
    existingEventCandidates:
      (Array.isArray(scenario.extra?.existingEventCandidates)
        ? scenario.extra.existingEventCandidates
        : candidates) as unknown[],
  });

  const baseRanked = rankEventSelectionCandidates(candidates, ctx);
  const biasedRanked = rankEventSelectionCandidates(candidates, ctx, binding);
  const boosted = applyDay8OperationFeedBiasToEventCandidates(candidates, binding.biases);
  const maxBoost = boosted.reduce((max, row) => Math.max(max, row.strategicBoost), 0);

  // eslint-disable-next-line no-console
  console.log(`\n[${scenario.label}]`);
  log('OK', `bias count=${binding.biases.length}`);
  log('OK', `boosted candidates=${boosted.filter((row) => row.strategicBoost > 0).length}`);
  log('OK', `max boost=${maxBoost}`);
  log('OK', `primary feed reason=${binding.primaryFeedBinding?.reasonLine ?? 'none'}`);

  log('OK', `matchedCandidateCount=${binding.selectionBiasSummary?.matchedCandidateCount ?? 0}`);
  log('OK', `presentationOnlyBindingCount=${binding.selectionBiasSummary?.presentationOnlyBindingCount ?? 0}`);
  log('OK', `unmatchedBindingReason=${binding.selectionBiasSummary?.unmatchedBindingReason ?? 'none'}`);
  log('OK', `noForcedSelectionCheck=${binding.feedBindings.every((item) => !containsForcedSelectionLanguage(item.reasonLine))}`);

  const presentationOnly = (binding.selectionBiasSummary?.presentationOnlyBindingCount ?? 0) > 0;
  const selectionApplied = binding.selectionBiasSummary?.applied === true;
  if (presentationOnly && !selectionApplied) {
    log('OK', 'Presentation-only binding: no forced selection');
  }
  if (presentationOnly && selectionApplied && (binding.selectionBiasSummary?.matchedCandidateCount ?? 0) === 0) {
    log('FAIL', 'Presentation-only binding forced selected score boost');
  }

  if (scenario.day < 8 && binding.isActive) {
    log('FAIL', 'Day <8 output changed');
  }
  if (scenario.label.includes('no strategic source')) {
    const identical = baseRanked.map((c) => c.id).join('|') === biasedRanked.map((c) => c.id).join('|');
    log(identical ? 'OK' : 'FAIL', `no-source identical check=${identical}`);
    if (binding.isActive) {
      log('FAIL', 'no-source binding should be inactive');
    }
  }
  if (binding.biases.some((bias) => bias.scoreBoost > 20)) {
    log('FAIL', 'scoreBoost > 20');
  }
  if (maxBoost > 25) {
    log('FAIL', 'totalBoost > 25');
  }
  if (biasedRanked.some((candidate) => !candidates.some((base) => base.id === candidate.id))) {
    log('FAIL', 'candidate outside pool');
  }
  if (scenario.label.includes('No matching')) {
    const summary = binding.selectionBiasSummary;
    if ((summary?.presentationOnlyBindingCount ?? 0) > 0 && summary?.applied === false) {
      log('OK', 'No matching event candidate; reason kept out of selection bias');
    } else if (binding.feedBindings.length > 0) {
      log('WARN', `presentation-only policy check: applied=${summary?.applied ?? false}`);
    }
  }
}

// eslint-disable-next-line no-console
console.log(`\nAnalyzer summary: FAIL=${failCount} WARN=${warnCount}`);
if (failCount > 0) {
  process.exit(1);
}
