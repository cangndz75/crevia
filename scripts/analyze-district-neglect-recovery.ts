/**
 * Diagnostic analyzer for district neglect & recovery signals.
 * Calistir: npm run analyze:district-neglect-recovery
 */

import { buildAuthorityGameplayExpansionSummary } from '../src/core/authorityGameplayExpansion';
import { buildCityMemoryVisibility } from '../src/core/cityMemoryVisibility';
import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '../src/core/dailyCapacityPortfolio';
import { buildDistrictPersonalityProfile } from '../src/core/districtPersonality';
import { buildDistrictNeglectRecovery } from '../src/core/districtNeglectRecovery';
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
    authorityPermissionIds: ['tomorrow_risk_preview'],
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
  return {
    dailyCapacityPortfolioResult: portfolio,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    followUpActionResult: followUpActions,
    positiveComebackResult: positiveComeback,
    authorityExpansionSummary,
  };
}

const scenarios: Scenario[] = [
  { label: 'Day 1 no source', day: 1 },
  { label: 'Day 8 deferred district pressure', day: 8 },
  {
    label: 'Day 8 trust fragility',
    day: 8,
    extra: {
      decisionConsequenceThreads: [
        {
          id: 'trust-dc',
          tone: 'warning',
          causalLine: 'Guven sinyali.',
          sourceIds: ['trust-dc'],
          districtName: 'Sanayi',
        },
      ],
    },
  },
  {
    label: 'Day 8 route backlog',
    day: 8,
    extra: {
      dailyCapacityPortfolioResult: undefined,
    },
  },
  {
    label: 'Day 8 recovery opportunity',
    day: 8,
    extra: {
      rewardComebackSignals: {
        id: 'recovery-1',
        title: 'Toparlanma',
        summary: 'Kucuk firsat.',
        tone: 'recovery',
        districtName: 'Sanayi',
        sourceIds: ['recovery-1'],
      },
    },
  },
  {
    label: 'Day 8 positive comeback district recovery',
    day: 8,
  },
  {
    label: 'Day 10 city memory + recovery',
    day: 10,
    extra: {
      cityMemoryVisibilityResult: {
        traces: [
          {
            id: 'trace-pos',
            kind: 'district_trace',
            tone: 'positive',
            line: 'Olumlu iz.',
            districtName: 'Sanayi',
            sourceIds: ['trace-pos'],
          },
        ],
        sourceIds: ['trace-pos'],
      },
    },
  },
  {
    label: 'Personality baseline only',
    day: 8,
    extra: {
      districtPersonalityProfiles: [
        buildDistrictPersonalityProfile({ day: 8, districtId: 'sanayi', districtName: 'Sanayi' }),
      ],
    },
  },
  {
    label: 'Conflict high neglect + high recovery',
    day: 8,
    extra: {
      decisionConsequenceThreads: [
        {
          id: 'neg',
          tone: 'warning',
          causalLine: 'Baski.',
          sourceIds: ['neg'],
        },
      ],
      positiveComebackResult: {
        candidates: [
          {
            id: 'pc1',
            kind: 'district_recovery',
            title: 'Toparlanma',
            line: 'Firsat var.',
            benefitLine: 'Kucuk hamle.',
            sourceIds: ['pc1'],
            sourceKinds: ['positive_comeback'],
            confidence: 'high',
            priority: 80,
            dayPolicy: 'day_8_plus',
            isActionable: false,
            isFallback: false,
            visibilityLevel: 'summary',
            tone: 'positive',
            districtName: 'Sanayi',
          },
        ],
        sourceIds: ['pc1'],
        day: 8,
      },
    },
  },
  { label: 'Low data fallback', day: 8 },
];

let hasWarn = false;

for (const scenario of scenarios) {
  const pipeline =
    scenario.label === 'Personality baseline only'
      ? null
      : buildPipeline(scenario.day, scenario.extra ?? {});

  const result = buildDistrictNeglectRecovery({
    day: scenario.day,
    ...(pipeline ?? {}),
    positiveComebackResult:
      (scenario.extra?.positiveComebackResult as never) ?? pipeline?.positiveComebackResult,
    cityMemoryVisibilityResult:
      (scenario.extra?.cityMemoryVisibilityResult as never) ?? pipeline?.cityMemoryVisibilityResult,
    decisionConsequenceThreads: scenario.extra?.decisionConsequenceThreads as never,
    districtPersonalityProfiles: scenario.extra?.districtPersonalityProfiles as never,
  });

  const visible = result.signals.filter((signal) => !signal.isFallback).length;
  const primary = result.primarySignal;
  const day1Noise = scenario.day === 1 && visible > 0;
  const day8Empty = scenario.day >= 8 && visible === 0 && scenario.label.includes('deferred');
  const status = day1Noise || day8Empty ? 'WARN' : 'PASS';
  if (status === 'WARN') hasWarn = true;

  // eslint-disable-next-line no-console
  console.log(
    `${status} ${scenario.label} | visible=${visible} primary=${primary?.kind ?? 'none'} ` +
      `neglect=${primary?.neglectScore ?? 0}/${primary?.neglectBand ?? 'none'} ` +
      `recovery=${primary?.recoveryScore ?? 0}/${primary?.recoveryBand ?? 'none'} ` +
      `confidence=${primary?.confidence ?? 'none'}`,
  );
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(hasWarn ? 'Analyzer: WARN' : 'Analyzer: PASS');
