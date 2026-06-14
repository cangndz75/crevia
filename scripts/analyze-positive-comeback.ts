/**
 * Diagnostic analyzer for Positive & Comeback.
 * Calistir: npm run analyze:positive-comeback
 */

import { buildAuthorityGameplayExpansionSummary } from '../src/core/authorityGameplayExpansion';
import { buildCityMemoryVisibility } from '../src/core/cityMemoryVisibility';
import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '../src/core/dailyCapacityPortfolio';
import { buildFollowUpActions } from '../src/core/followUpActions';
import { buildOneMoreDayRetention } from '../src/core/oneMoreDayRetention';
import { buildPortfolioDeferRiskBindings } from '../src/core/portfolioDeferRisk';
import {
  buildPositiveComeback,
  collectPositiveComebackLines,
  POSITIVE_COMEBACK_FAKE_RECOVERY_PATTERNS,
} from '../src/core/positiveComeback';

type Scenario = {
  label: string;
  day: number;
  input?: Record<string, unknown>;
  portfolioInput?: DailyCapacityPortfolioInput;
  authorityPermissionIds?: string[];
};

function event(id: string, title: string, district: string, neighborhoodId: string) {
  return { id, title, district, neighborhoodId, day: 8 };
}

function signals(status = 'strained', score = 62) {
  return {
    priorityDistrictId: 'sanayi',
    vehicles: { status, score, title: 'Rota baskisi', summary: 'Arac rotasi zorlaniyor.', sourceTags: ['route'] },
    containers: { status: 'watch', score: 58, title: 'Konteyner hatti', summary: 'Hat izleniyor.', sourceTags: ['container'] },
    districts: { status: 'watch', score: 54, title: 'Guven hassasiyeti', summary: 'Izleniyor.', sourceTags: ['trust'] },
    overall: { status: 'watch', score: 50, title: 'Genel', summary: 'Izleniyor.', sourceTags: ['overall'] },
  };
}

function personality(id: string, name: string, criteria: string[]) {
  return {
    districtId: id,
    districtName: name,
    sourceIds: [`personality_${id}`],
    sourceKinds: ['district_trust'],
    criteria: criteria.map((criterionId) => ({ id: criterionId, band: 'high' })),
  };
}

const active = [
  event('active_a', 'Aktif rota operasyonu', 'Sanayi', 'sanayi'),
  event('active_b', 'Aktif konteyner operasyonu', 'Cumhuriyet', 'cumhuriyet'),
];

const scenarios: Scenario[] = [
  { label: 'Day 1 no source', day: 1 },
  {
    label: 'Day 8 recovery opportunity',
    day: 8,
    portfolioInput: {
      day: 8,
      activeEvents: active,
      operationSignals: signals(),
      rewardComebackSignals: {
        id: 'rc8',
        title: 'Toparlanma',
        summary: 'Iyilesme penceresi acik.',
        tone: 'recovery',
        sourceIds: ['rc8'],
      },
    },
  },
  {
    label: 'Day 8 follow-up support_recovery',
    day: 8,
    input: {
      followUpActionResult: buildFollowUpActions({
        day: 8,
        rewardComebackSignals: {
          id: 'fu_rc',
          title: 'Toparlanma firsati',
          summary: 'Kucuk takip hamlesi degerli.',
          tone: 'recovery',
          sourceIds: ['fu_rc'],
        },
      }),
    },
  },
  {
    label: 'Day 8 trust recovery',
    day: 8,
    input: {
      districtTrustSignals: {
        id: 'trust_8',
        band: 'recovering',
        summary: 'Guven toparlanmaya acik.',
        sourceIds: ['trust_8'],
        districtId: 'merkez',
        districtName: 'Merkez',
      },
      authorityPermissionIds: ['district_trust_preview'],
    },
  },
  {
    label: 'Day 10 memory positive trace',
    day: 10,
    input: {
      decisionConsequenceThreads: [
        {
          id: 'memory_thread',
          title: 'Karar izi',
          summary: 'Olumlu iz birakti.',
          tone: 'positive',
          causalLine: 'Bu bolgede olumlu bir iz olusabilir.',
          sourceIds: ['memory_thread'],
        },
      ],
    },
  },
  {
    label: 'Container improvement',
    day: 9,
    input: {
      containerNetworkSignals: {
        id: 'container_9',
        trend: 'improving',
        summary: 'Konteyner hatti toparlanmaya acik.',
        sourceIds: ['container_9'],
        districtId: 'cumhuriyet',
      },
    },
  },
  {
    label: 'Route relief',
    day: 9,
    input: {
      followUpActionResult: buildFollowUpActions({
        day: 9,
        portfolioDeferRiskResult: {
          bindings: [
            {
              id: 'defer_route',
              deferRisk: 'route_may_strain',
              title: 'Rota baskisi',
              line: 'Rota hatti izlenmeli.',
              sourceIds: ['defer_route'],
              sourceKinds: ['portfolio_defer_risk'],
              priority: 72,
              confidence: 'medium',
              isFallback: false,
            },
          ],
        },
      }),
    },
  },
  {
    label: 'Social support',
    day: 9,
    input: {
      socialPulseSignals: {
        id: 'social_9',
        tone: 'positive',
        summary: 'Sosyal nabiz olumlu etkiye acik.',
        sourceIds: ['social_9'],
      },
    },
  },
  {
    label: 'RewardComeback source',
    day: 10,
    input: {
      rewardComebackSignals: {
        id: 'rc10',
        title: 'Toparlanma firsati',
        summary: 'Mahalle toparlanmaya acik.',
        tone: 'recovery',
        sourceIds: ['rc10'],
      },
    },
  },
  { label: 'Low data fallback', day: 9 },
  {
    label: 'Authority detailed',
    day: 10,
    input: {
      rewardComebackSignals: {
        id: 'auth_rc',
        title: 'Firsat',
        summary: 'Detayli firsat okunabilir.',
        tone: 'recovery',
        sourceIds: ['auth_rc'],
      },
      authorityPermissionIds: ['district_trust_preview', 'advisor_specialist_notes_preview'],
    },
  },
];

let hasFail = false;
let hasWarn = false;

for (const scenario of scenarios) {
  let pipelineInput: Record<string, unknown> = { ...(scenario.input ?? {}) };

  if (scenario.portfolioInput) {
    const portfolio = buildDailyCapacityPortfolio(scenario.portfolioInput);
    const portfolioDeferRisk = buildPortfolioDeferRiskBindings({
      day: scenario.day,
      portfolioResult: portfolio,
      tomorrowRiskSignals: scenario.portfolioInput.tomorrowRiskSignals,
      authorityPermissionIds: scenario.authorityPermissionIds,
    });
    const oneMoreDayRetention = buildOneMoreDayRetention({
      day: scenario.day,
      portfolioDeferRiskResult: portfolioDeferRisk,
      dailyCapacityPortfolioResult: portfolio,
      currentRouteHints: { hubRoute: '/' },
    });
    const cityMemoryVisibility = buildCityMemoryVisibility({
      day: scenario.day,
      portfolioDeferRiskResult: portfolioDeferRisk,
      oneMoreDayRetentionResult: oneMoreDayRetention,
    });
    const authorityExpansionSummary = buildAuthorityGameplayExpansionSummary({
      day: scenario.day,
      permissionIds: scenario.authorityPermissionIds,
      portfolioAvailable: portfolio.items.length > 0,
    });
    pipelineInput = {
      ...pipelineInput,
      dailyCapacityPortfolioResult: portfolio,
      portfolioDeferRiskResult: portfolioDeferRisk,
      oneMoreDayRetentionResult: oneMoreDayRetention,
      cityMemoryVisibilityResult: cityMemoryVisibility,
      authorityExpansionSummary,
    };
  }

  const result = buildPositiveComeback({
    day: scenario.day,
    authorityPermissionIds: scenario.authorityPermissionIds,
    ...pipelineInput,
  });

  // eslint-disable-next-line no-console
  console.log(`\n=== ${scenario.label} (Day ${scenario.day}) ===`);
  console.log(`candidates=${result.candidates.length} primary=${result.primaryCandidate?.kind ?? 'none'}`);
  for (const candidate of result.candidates) {
    console.log(
      `  ${candidate.kind} p=${candidate.priority} conf=${candidate.confidence} src=${candidate.sourceKinds.join(',')} vis=${candidate.visibilityLevel}`,
    );
  }

  const lines = collectPositiveComebackLines(result);
  if (lines.some((line) => /[a-z]+_[a-z_]+/.test(line))) {
    console.log('FAIL technical enum leaked');
    hasFail = true;
  }
  if (lines.some((line) => POSITIVE_COMEBACK_FAKE_RECOVERY_PATTERNS.some((pattern) => pattern.test(line)))) {
    console.log('FAIL fake recovery language');
    hasFail = true;
  }
  if (
    scenario.day >= 8 &&
    (scenario.input?.rewardComebackSignals || scenario.portfolioInput?.rewardComebackSignals) &&
    result.candidates.length === 0
  ) {
    console.log('WARN Day 8+ recovery source but no candidate');
    hasWarn = true;
  }
  if (scenario.day <= 1 && result.candidates.some((c) => !c.isFallback && c.visibilityLevel !== 'hidden')) {
    console.log('FAIL Day 1 positive spam');
    hasFail = true;
  }
  if (
    scenario.day >= 8 &&
    result.candidates.some((c) => c.isFallback) &&
    result.candidates.some((c) => !c.isFallback)
  ) {
    console.log('INFO real source present with fallback available');
  }
  const kinds = result.candidates.map((c) => c.kind);
  if (new Set(kinds).size !== kinds.length) {
    console.log('WARN same kind spam');
    hasWarn = true;
  }
  const punitive = result.candidates.some((c) => /kaybedersin|kacti|ceza/i.test(`${c.line} ${c.benefitLine}`));
  if (punitive) {
    console.log('WARN recovery line punitive');
    hasWarn = true;
  }
  if (
    scenario.label === 'Authority detailed' &&
    result.candidates.some((c) => c.visibilityLevel === 'detailed' && !scenario.authorityPermissionIds?.length)
  ) {
    console.log('FAIL detailed without permission');
    hasFail = true;
  }
}

// eslint-disable-next-line no-console
console.log('\n--- Summary ---');
console.log(hasFail ? 'FAIL detected' : hasWarn ? 'WARN detected' : 'PASS');
if (hasFail) process.exit(1);
