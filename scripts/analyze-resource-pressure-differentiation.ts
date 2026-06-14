/**
 * Resource Pressure Cost Differentiation analyzer.
 * Calistir: npm run analyze:resource-pressure-differentiation
 */

import { buildAuthorityGameplayExpansionSummary } from '../src/core/authorityGameplayExpansion';
import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '../src/core/dailyCapacityPortfolio';
import {
  buildResourcePressureDifferentiation,
  directCostSum,
  vectorsEqual,
} from '../src/core/resourcePressureDifferentiation';
import { DOMAIN_BASE_VECTORS, TECHNICAL_ENUM_PATTERN } from '../src/core/resourcePressureDifferentiation/resourcePressureDifferentiationConstants';
import {
  buildResourcePressureCostHintCards,
  collectResourcePressurePresentationLines,
} from '../src/core/resourcePressureDifferentiation/resourcePressureDifferentiationPresentation';
import { verifyResourcePressureDifferentiationScenario } from '../src/core/resourcePressureDifferentiation/verifyResourcePressureDifferentiationScenario';

type Scenario = {
  label: string;
  day: number;
  portfolioInput?: DailyCapacityPortfolioInput;
  extra?: Record<string, unknown>;
};

function event(id: string, title: string, district: string, neighborhoodId: string) {
  return { id, title, district, neighborhoodId, day: 8 };
}

function signals(vehicleStatus = 'strained', containerStatus = 'watch') {
  return {
    priorityDistrictId: 'sanayi',
    vehicles: {
      status: vehicleStatus,
      score: 62,
      title: 'Rota baskisi',
      summary: 'Arac rotasi zorlaniyor.',
      sourceTags: ['route'],
    },
    containers: {
      status: containerStatus,
      score: 58,
      title: 'Konteyner hatti',
      summary: 'Hat izleniyor.',
      sourceTags: ['container'],
    },
    districts: {
      status: 'watch',
      score: 54,
      title: 'Guven hassasiyeti',
      summary: 'Izleniyor.',
      sourceTags: ['trust'],
    },
    overall: {
      status: 'watch',
      score: 50,
      title: 'Genel',
      summary: 'Izleniyor.',
      sourceTags: ['overall'],
    },
  };
}

function diversityScore(domains: string[]): number {
  return new Set(domains).size / Math.max(domains.length, 1);
}

const scenarios: Scenario[] = [
  { label: 'Day 1 hidden/safe', day: 1 },
  { label: 'Day 8 low-data', day: 8 },
  {
    label: 'Day 8 route pressure',
    day: 8,
    portfolioInput: {
      day: 8,
      activeEvents: [event('route_1', 'Rota operasyonu', 'Sanayi', 'sanayi')],
      operationSignals: signals('strained', 'low'),
    },
  },
  {
    label: 'Day 8 container pressure',
    day: 8,
    portfolioInput: {
      day: 8,
      activeEvents: [event('container_1', 'Konteyner operasyonu', 'Cumhuriyet', 'cumhuriyet')],
      operationSignals: signals('low', 'strained'),
    },
  },
  {
    label: 'Day 8 social trust pressure',
    day: 8,
    extra: {
      socialPulseState: { globalPulseScore: 68, id: 'social_pulse', sourceIds: ['social_pulse'] },
    },
  },
  {
    label: 'Day 8 recovery opportunity',
    day: 8,
    extra: {
      positiveComebackResult: {
        candidates: [{ id: 'pc_1', title: 'Toparlanma', line: 'Firsat penceresi.', sourceIds: ['pc_1'] }],
      },
    },
  },
  {
    label: 'Day 8 follow-up pressure',
    day: 8,
    extra: {
      followUpExecutionResult: {
        availableActions: [{ id: 'fu_1', title: 'Takip', reasonLine: 'Kisa takip hamlesi.', sourceIds: ['fu_1'] }],
      },
    },
  },
  {
    label: 'Day 8 risk signal',
    day: 8,
    extra: {
      dailyCapacityPortfolioResult: {
        items: [{ id: 'risk_1', kind: 'risk_signal', title: 'Erken risk', sourceIds: ['risk_1'], priority: 72 }],
      },
    },
  },
  {
    label: 'Day 10 mixed resource + route + social',
    day: 10,
    portfolioInput: {
      day: 10,
      activeEvents: [
        event('mix_a', 'Rota', 'Sanayi', 'sanayi'),
        event('mix_b', 'Sosyal', 'Merkez', 'merkez'),
      ],
      operationSignals: signals(),
    },
    extra: {
      socialPulseState: { globalPulseScore: 60 },
    },
  },
  {
    label: 'vehicle strain',
    day: 8,
    extra: {
      vehicleMaintenanceState: { id: 'vm_1', summary: 'Araç yükü artıyor.', sourceIds: ['vm_1'] },
    },
  },
  {
    label: 'team capacity',
    day: 8,
    extra: {
      teamSpecializationState: { id: 'team_1', summary: 'Ekip kapasitesi dar.', sourceIds: ['team_1'] },
    },
  },
  {
    label: 'authority detailed',
    day: 8,
    extra: {
      authorityExpansionSummary: buildAuthorityGameplayExpansionSummary({
        rankId: 'district_supervisor',
        permissionIds: ['resource_pressure_summary', 'tomorrow_risk_preview'],
        day: 8,
        portfolioAvailable: true,
        mapBindingAvailable: true,
        districtPersonalityAvailable: true,
      }),
    },
  },
];

let failCount = 0;
let warnCount = 0;

for (const scenario of scenarios) {
  // eslint-disable-next-line no-console
  console.log(`\n=== ${scenario.label} ===`);

  const portfolio =
    scenario.portfolioInput && scenario.day >= 8
      ? buildDailyCapacityPortfolio(scenario.portfolioInput)
      : undefined;

  const result = buildResourcePressureDifferentiation({
    day: scenario.day,
    dailyCapacityPortfolioResult: portfolio ?? scenario.extra?.dailyCapacityPortfolioResult,
    ...scenario.extra,
  });

  const domains = result.profiles.map((profile) => profile.domain);
  const overlapWarnings: string[] = [];

  if (scenario.day < 8 && result.isActive) {
    overlapWarnings.push('FAIL Day <8 should be inactive');
    failCount += 1;
  }

  const route = result.profiles.find((profile) => profile.domain === 'route_pressure');
  if (route && route.dominantAxis !== 'vehicle' && route.dominantAxis !== 'time') {
    overlapWarnings.push(`WARN route_pressure dominant axis=${route.dominantAxis}`);
    warnCount += 1;
  }

  const social = result.profiles.find((profile) => profile.domain === 'social_trust_pressure');
  if (social && social.dominantAxis !== 'trust' && social.dominantAxis !== 'attention') {
    overlapWarnings.push(`WARN social_trust dominant axis=${social.dominantAxis}`);
    warnCount += 1;
  }

  const general = result.profiles.find((profile) => profile.domain === 'general_resource');
  const container = result.profiles.find((profile) => profile.domain === 'container_pressure');
  if (general && container && vectorsEqual(general.costVector, container.costVector)) {
    overlapWarnings.push('FAIL container_pressure identical to general_resource');
    failCount += 1;
  }

  const risk = result.profiles.find((profile) => profile.domain === 'risk_signal');
  if (risk && risk.costVector.attention === 0 && risk.costVector.futureRisk === 0 && directCostSum(risk.costVector) === 0) {
    overlapWarnings.push('FAIL risk_signal all zero');
    failCount += 1;
  }

  const followUp = result.profiles.find((profile) => profile.domain === 'follow_up_pressure');
  if (followUp && directCostSum(followUp.costVector) > 90) {
    overlapWarnings.push('WARN follow_up_pressure high direct cost');
    warnCount += 1;
  }

  const recovery = result.profiles.find((profile) => profile.domain === 'recovery_opportunity');
  const crisis = result.profiles.find((profile) => profile.domain === 'district_neglect_pressure');
  if (recovery && crisis && directCostSum(recovery.costVector) >= directCostSum(crisis.costVector)) {
    overlapWarnings.push('WARN recovery not cheaper than crisis');
    warnCount += 1;
  }

  const presentation = collectResourcePressurePresentationLines(result);
  if (presentation.some((line) => TECHNICAL_ENUM_PATTERN.test(line))) {
    overlapWarnings.push('FAIL technical enum in UI');
    failCount += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`profiles: ${result.profiles.length}`);
  // eslint-disable-next-line no-console
  console.log(`primary: ${result.primaryProfile?.domain ?? 'none'}`);
  // eslint-disable-next-line no-console
  console.log(`dominant: ${result.primaryProfile?.dominantAxis ?? 'none'}`);
  // eslint-disable-next-line no-console
  console.log(`diversity: ${(diversityScore(domains) * 100).toFixed(0)}%`);
  // eslint-disable-next-line no-console
  console.log(`direct vs future risk: direct=${directCostSum(result.primaryProfile?.costVector ?? DOMAIN_BASE_VECTORS.fallback)} future=${result.primaryProfile?.costVector.futureRisk ?? 0}`);

  for (const profile of result.profiles) {
    // eslint-disable-next-line no-console
    console.log(
      `  - ${profile.domain} axis=${profile.dominantAxis} vector=${JSON.stringify(profile.costVector)}`,
    );
  }

  const cards = buildResourcePressureCostHintCards(result);
  if (cards.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`presentation: ${cards.map((card) => card.reasonLine).join(' | ')}`);
  }

  for (const warning of overlapWarnings) {
    // eslint-disable-next-line no-console
    console.log(warning);
  }
}

const verify = verifyResourcePressureDifferentiationScenario();
// eslint-disable-next-line no-console
console.log('\n=== verify summary ===');
// eslint-disable-next-line no-console
console.log(
  `${verify.checks.filter((line) => line.startsWith('PASS')).length} PASS, ` +
    `${verify.checks.filter((line) => line.startsWith('WARN')).length} WARN, ` +
    `${verify.checks.filter((line) => line.startsWith('FAIL')).length} FAIL`,
);

if (!verify.ok || failCount > 0) {
  process.exit(1);
}

if (warnCount > 0) {
  // eslint-disable-next-line no-console
  console.log(`Analyzer warnings: ${warnCount}`);
}
