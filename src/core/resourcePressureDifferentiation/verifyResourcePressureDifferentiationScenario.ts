import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildAuthorityGameplayExpansionSummary } from '@/core/authorityGameplayExpansion';
import { buildCityMemoryVisibility } from '@/core/cityMemoryVisibility';
import { buildCityRhythmDirector } from '@/core/cityRhythmDirector';
import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '@/core/dailyCapacityPortfolio';
import { buildDay8OperationFeedBinding, buildExistingEventCandidatesFromActiveEvents } from '@/core/day8OperationFeedBinding';
import { buildDay8StrategicContent } from '@/core/day8StrategicContent';
import { buildDistrictNeglectRecovery } from '@/core/districtNeglectRecovery';
import { buildFollowUpActions } from '@/core/followUpActions';
import { buildFollowUpExecution } from '@/core/followUpExecution';
import { buildOneMoreDayRetention } from '@/core/oneMoreDayRetention';
import { buildPortfolioDeferRiskBindings } from '@/core/portfolioDeferRisk';
import { buildPositiveComeback } from '@/core/positiveComeback';
import { verifyDailyCapacityPortfolioScenario } from '@/core/dailyCapacityPortfolio/verifyDailyCapacityPortfolioScenario';
import { verifyPortfolioDeferRiskScenario } from '@/core/portfolioDeferRisk/verifyPortfolioDeferRiskScenario';
import { verifyDay8OperationFeedBindingScenario } from '@/core/day8OperationFeedBinding/verifyDay8OperationFeedBindingScenario';
import { verifyFollowUpExecutionScenario } from '@/core/followUpExecution/verifyFollowUpExecutionScenario';
import { verifyGameplayLoopQaScenario } from '@/core/quality/gameplayLoopQaScenario';
import { verifyFinalUiVisualUnificationScenario } from '@/features/finalUi/verifyFinalUiVisualUnificationScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import { DOMAIN_BASE_VECTORS, TECHNICAL_ENUM_PATTERN } from './resourcePressureDifferentiationConstants';
import {
  buildResourcePressureDifferentiation,
  collectResourcePressureDifferentiationLines,
  directCostSum,
  vectorsEqual,
} from './resourcePressureDifferentiationModel';
import {
  buildDeferRiskCostReasonLine,
  buildEceResourcePressureLine,
  buildOperationFeedCostReasonLine,
  buildPortfolioCostReasonLine,
  buildPrimaryResourcePressureCostHint,
  buildReportResourcePressureNote,
  buildResourcePressureCostHintCards,
  collectResourcePressurePresentationLines,
} from './resourcePressureDifferentiationPresentation';
import type { ResourcePressureDifferentiationInput } from './resourcePressureDifferentiationTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 27;

export type VerifyResourcePressureDifferentiationOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function assert(checks: string[], pass: boolean, ok: string, fail: string): boolean {
  checks.push(pass ? `PASS ${ok}` : `FAIL ${fail}`);
  return pass;
}

function warn(checks: string[], pass: boolean, ok: string, warnMsg: string): boolean {
  checks.push(pass ? `PASS ${ok}` : `WARN ${warnMsg}`);
  return pass;
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function event(id: string, title: string, district: string, neighborhoodId: string) {
  return { id, title, district, neighborhoodId, day: 8 };
}

function operationSignals() {
  return {
    priorityDistrictId: 'sanayi',
    vehicles: {
      status: 'strained',
      score: 62,
      title: 'Rota baskisi',
      summary: 'Arac rotasi zorlaniyor.',
      sourceTags: ['route_source'],
    },
    containers: {
      status: 'watch',
      score: 58,
      title: 'Konteyner hatti',
      summary: 'Hat izleniyor.',
      sourceTags: ['container_source'],
    },
    districts: {
      status: 'watch',
      score: 54,
      title: 'Guven hassasiyeti',
      summary: 'Izleniyor.',
      sourceTags: ['trust_source'],
    },
    overall: {
      status: 'watch',
      score: 50,
      title: 'Genel sinyal',
      summary: 'Izleniyor.',
      sourceTags: ['overall_source'],
    },
  };
}

function day8PortfolioInput(): DailyCapacityPortfolioInput {
  return {
    day: 8,
    activeEvents: [
      event('active_a', 'Aktif rota operasyonu', 'Sanayi', 'sanayi'),
      event('active_b', 'Aktif konteyner operasyonu', 'Cumhuriyet', 'cumhuriyet'),
    ],
    operationSignals: operationSignals(),
    tomorrowRiskSignals: [
      {
        id: 'risk_route',
        title: 'Yarin rota riski',
        mainLine: 'Rota baskisi yarin tekrar okunmali.',
        priority: 'high',
        relatedDomain: 'route',
        sourceSignals: ['operation_signals'],
      },
    ],
  };
}

function buildMemoryStack(day: number, portfolioInput?: DailyCapacityPortfolioInput) {
  const portfolio = buildDailyCapacityPortfolio(portfolioInput ?? { ...day8PortfolioInput(), day });
  const portfolioDeferRisk = buildPortfolioDeferRiskBindings({ day, portfolioResult: portfolio });
  const oneMoreDay = buildOneMoreDayRetention({ day, portfolioDeferRiskResult: portfolioDeferRisk });
  const cityMemory = buildCityMemoryVisibility({ day });
  const followUpActions = buildFollowUpActions({
    day,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDay,
    cityMemoryVisibilityResult: cityMemory,
  });
  const positiveComeback = buildPositiveComeback({
    day,
    dailyCapacityPortfolioResult: portfolio,
    followUpActionResult: followUpActions,
    oneMoreDayRetentionResult: oneMoreDay,
    portfolioDeferRiskResult: portfolioDeferRisk,
    cityMemoryVisibilityResult: cityMemory,
  });
  const districtNeglectRecovery = buildDistrictNeglectRecovery({
    day,
    dailyCapacityPortfolioResult: portfolio,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDay,
    followUpActionResult: followUpActions,
    positiveComebackResult: positiveComeback,
    cityMemoryVisibilityResult: cityMemory,
  });
  const day8StrategicContent = buildDay8StrategicContent({
    day,
    dailyCapacityPortfolioResult: portfolio,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDay,
    followUpActionResult: followUpActions,
    positiveComebackResult: positiveComeback,
    districtNeglectRecoveryResult: districtNeglectRecovery,
    cityMemoryVisibilityResult: cityMemory,
  });
  const cityRhythmDirector = buildCityRhythmDirector({
    day,
    day8StrategicContentResult: day8StrategicContent,
    districtNeglectRecoveryResult: districtNeglectRecovery,
    positiveComebackResult: positiveComeback,
    followUpActionResult: followUpActions,
    cityMemoryVisibilityResult: cityMemory,
    oneMoreDayRetentionResult: oneMoreDay,
    portfolioDeferRiskResult: portfolioDeferRisk,
    dailyCapacityPortfolioResult: portfolio,
  });
  const events = portfolioInput?.activeEvents ?? day8PortfolioInput().activeEvents;
  const day8OperationFeedBinding = buildDay8OperationFeedBinding({
    day,
    dailyCapacityPortfolioResult: portfolio,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDay,
    cityMemoryVisibilityResult: cityMemory,
    followUpActionResult: followUpActions,
    positiveComebackResult: positiveComeback,
    districtNeglectRecoveryResult: districtNeglectRecovery,
    day8StrategicContentResult: day8StrategicContent,
    cityRhythmDirectorResult: cityRhythmDirector,
    existingEventCandidates: buildExistingEventCandidatesFromActiveEvents(events ?? [], day),
    existingOperationFeedItems: portfolio.items.map((item) => ({
      id: item.id,
      title: item.title,
      districtId: item.districtId,
      districtName: item.districtName,
      kind: item.kind,
      tags: item.sourceKinds,
    })),
  });
  const followUpExecution = buildFollowUpExecution({
    day,
    followUpActionResult: followUpActions,
    day8OperationFeedBindingResult: day8OperationFeedBinding,
    positiveComebackResult: positiveComeback,
    cityMemoryVisibilityResult: cityMemory,
    districtNeglectRecoveryResult: districtNeglectRecovery,
    dailyCapacityPortfolioResult: portfolio,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDay,
    cityRhythmDirectorResult: cityRhythmDirector,
  });

  return {
    portfolio,
    portfolioDeferRisk,
    day8OperationFeedBinding,
    followUpExecution,
    day8StrategicContent,
    cityRhythmDirector,
    districtNeglectRecovery,
    positiveComeback,
  };
}

function differentiationInput(
  day: number,
  overrides: Partial<ResourcePressureDifferentiationInput> = {},
): ResourcePressureDifferentiationInput {
  const stack = buildMemoryStack(day);
  return {
    day,
    dailyCapacityPortfolioResult: stack.portfolio,
    portfolioDeferRiskResult: stack.portfolioDeferRisk,
    day8OperationFeedBindingResult: stack.day8OperationFeedBinding,
    followUpExecutionResult: stack.followUpExecution,
    day8StrategicContentResult: stack.day8StrategicContent,
    cityRhythmDirectorResult: stack.cityRhythmDirector,
    districtNeglectRecoveryResult: stack.districtNeglectRecovery,
    positiveComebackResult: stack.positiveComeback,
    ...overrides,
  };
}

function costVectorInRange(vector: { [key: string]: number }): boolean {
  return Object.values(vector).every((value) => value >= 0 && value <= 100);
}

function noNegativeCost(vector: { [key: string]: number }): boolean {
  return Object.values(vector).every((value) => value >= 0);
}

export function verifyResourcePressureDifferentiationScenario(): VerifyResourcePressureDifferentiationOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const record = (pass: boolean, isWarn = false) => {
    if (!pass) {
      if (isWarn) hasWarn = true;
      else ok = false;
    }
  };

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION 27', 'SAVE_VERSION changed'));
  record(
    assert(
      checks,
      !readRepo('src/store/gamePersist.ts').includes('resourcePressureDifferentiation'),
      'persist shape unchanged',
      'persist references differentiation',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/decision/applyDecision.ts').includes('resourcePressureDifferentiation'),
      'applyDecision unchanged',
      'applyDecision touched',
    ),
  );

  const memoryContext = readRepo('src/features/shared/utils/memoryFollowUpPresentationContext.ts');
  record(
    assert(
      checks,
      memoryContext.includes('buildResourcePressureDifferentiation'),
      'Memory context wiring',
      'Memory context missing differentiation',
    ),
  );

  const day1 = buildResourcePressureDifferentiation({ day: 1 });
  record(assert(checks, !day1.isActive, 'Day <8 inactive', 'Day <8 active'));
  record(
    assert(
      checks,
      day1.profiles.every((profile) => profile.intensity === 'low' || profile.domain === 'safe_watch'),
      'Day <8 safe/low',
      'Day <8 high pressure',
    ),
  );

  const day8 = buildResourcePressureDifferentiation(differentiationInput(8));
  record(assert(checks, day8.isActive, 'Day 8+ active', 'Day 8 inactive'));
  record(assert(checks, day8.sourceIds.length > 0, 'Day 8+ has source', 'Day 8+ no source'));
  record(assert(checks, day8.profiles.length <= 5, 'Max 5 profiles', 'Too many profiles'));
  record(
    assert(
      checks,
      day8.profiles.filter((profile) => profile.id === day8.primaryProfile?.id).length <= 1,
      'Max 1 primary',
      'Multiple primary',
    ),
  );
  record(assert(checks, unique(day8.sourceIds), 'sourceIds unique', 'sourceIds duplicate'));

  for (const profile of day8.profiles) {
    record(assert(checks, costVectorInRange(profile.costVector), `Cost clamp ${profile.domain}`, `Cost out of range ${profile.domain}`));
    record(assert(checks, noNegativeCost(profile.costVector), `No negative ${profile.domain}`, `Negative cost ${profile.domain}`));
    record(
      assert(
        checks,
        !TECHNICAL_ENUM_PATTERN.test(profile.reasonLine),
        `No technical enum ${profile.domain}`,
        `Technical enum in ${profile.domain}`,
      ),
    );
  }

  const generalVector = day8.profiles.find((profile) => profile.domain === 'general_resource')?.costVector;
  const containerVector = day8.profiles.find((profile) => profile.domain === 'container_pressure')?.costVector;
  if (generalVector && containerVector) {
    record(
      assert(
        checks,
        !vectorsEqual(generalVector, containerVector),
        'container != general_resource vector',
        'container identical to general_resource',
      ),
    );
  } else {
    const baseGeneral = DOMAIN_BASE_VECTORS.general_resource;
    const baseContainer = DOMAIN_BASE_VECTORS.container_pressure;
    record(
      assert(
        checks,
        !vectorsEqual(baseGeneral, baseContainer),
        'container != general_resource base policy',
        'base vectors identical',
      ),
    );
  }

  const routeProfile = day8.profiles.find((profile) => profile.domain === 'route_pressure');
  if (routeProfile) {
    const axisOk =
      routeProfile.dominantAxis === 'vehicle' || routeProfile.dominantAxis === 'time';
    record(
      warn(
        checks,
        axisOk,
        'route_pressure dominant vehicle/time',
        'route_pressure dominant axis unexpected',
      ),
    );
    if (!axisOk) hasWarn = true;
  }

  const socialProfile = day8.profiles.find((profile) => profile.domain === 'social_trust_pressure');
  if (socialProfile) {
    const axisOk =
      socialProfile.dominantAxis === 'trust' || socialProfile.dominantAxis === 'attention';
    record(
      warn(
        checks,
        axisOk,
        'social_trust dominant trust/attention',
        'social_trust dominant axis unexpected',
      ),
    );
    if (!axisOk) hasWarn = true;
  }

  const riskProfile =
    day8.profiles.find((profile) => profile.domain === 'risk_signal') ??
    buildResourcePressureDifferentiation({
      day: 8,
      dailyCapacityPortfolioResult: {
        items: [{ id: 'risk_1', kind: 'risk_signal', title: 'Risk', sourceIds: ['risk_1'], priority: 70 }],
      },
    }).profiles.find((profile) => profile.domain === 'risk_signal');

  if (riskProfile) {
    const notAllZero =
      riskProfile.costVector.attention > 0 ||
      riskProfile.costVector.futureRisk > 0 ||
      directCostSum(riskProfile.costVector) > 0;
    record(assert(checks, notAllZero, 'risk_signal not all zero', 'risk_signal all zero'));
  }

  const followUpProfile =
    day8.profiles.find((profile) => profile.domain === 'follow_up_pressure') ??
    buildResourcePressureDifferentiation({
      day: 8,
      followUpExecutionResult: {
        availableActions: [{ id: 'fu_1', title: 'Takip', reasonLine: 'Kisa takip.', sourceIds: ['fu_1'] }],
      },
    }).profiles.find((profile) => profile.domain === 'follow_up_pressure');

  if (followUpProfile) {
    record(
      warn(
        checks,
        directCostSum(followUpProfile.costVector) <= 90,
        'follow_up low direct cost',
        'follow_up high direct cost',
      ),
    );
    if (directCostSum(followUpProfile.costVector) > 90) hasWarn = true;
  }

  const recoveryProfile =
    day8.profiles.find((profile) => profile.domain === 'recovery_opportunity') ??
    buildResourcePressureDifferentiation({ day: 8, positiveComebackResult: { candidates: [{ id: 'pc_1', title: 'Toparlanma', line: 'Firsat', sourceIds: ['pc_1'] }] } })
      .profiles.find((profile) => profile.domain === 'recovery_opportunity');
  const crisisProfile =
    day8.profiles.find((profile) => profile.domain === 'district_neglect_pressure') ??
    buildResourcePressureDifferentiation({ day: 8, districtNeglectRecoveryResult: { signals: [{ id: 'dn_1', kind: 'neglect', title: 'Ihmal', line: 'Risk', sourceIds: ['dn_1'] }] } })
      .profiles.find((profile) => profile.domain === 'district_neglect_pressure');

  if (recoveryProfile && crisisProfile) {
    record(
      warn(
        checks,
        directCostSum(recoveryProfile.costVector) < directCostSum(crisisProfile.costVector),
        'recovery cheaper than crisis direct cost',
        'recovery not cheaper than crisis',
      ),
    );
    if (directCostSum(recoveryProfile.costVector) >= directCostSum(crisisProfile.costVector)) {
      hasWarn = true;
    }
  }

  const lowData = buildResourcePressureDifferentiation({ day: 8 });
  record(
    assert(
      checks,
      lowData.profiles.some((profile) => profile.domain === 'safe_watch' || profile.intensity === 'low'),
      'Day 8 low-data safe_watch/light',
      'Day 8 low-data harsh',
    ),
  );

  const authority = buildAuthorityGameplayExpansionSummary({
    rankId: 'district_supervisor',
    permissionIds: ['resource_pressure_summary', 'tomorrow_risk_preview'],
    day: 8,
    portfolioAvailable: true,
    mapBindingAvailable: true,
    districtPersonalityAvailable: true,
  });
  const beforeAuthority = buildResourcePressureDifferentiation(differentiationInput(8));
  const afterAuthority = buildResourcePressureDifferentiation({
    ...differentiationInput(8),
    authorityExpansionSummary: authority,
  });
  const sameVectors =
    beforeAuthority.profiles.length === afterAuthority.profiles.length &&
    beforeAuthority.profiles.every((profile, index) =>
      vectorsEqual(profile.costVector, afterAuthority.profiles[index]?.costVector ?? profile.costVector),
    );
  record(assert(checks, sameVectors, 'Authority no cost mutation', 'Authority mutated cost'));

  const cards = buildResourcePressureCostHintCards(day8);
  record(assert(checks, cards.length <= 3, 'Presentation max 3 cards', 'Too many cards'));
  for (const card of cards) {
    record(assert(checks, card.reasonLine.length <= 110, 'reasonLine max 110', 'reasonLine too long'));
    record(assert(checks, card.badgeLabel.length <= 24, 'badgeLabel max 24', 'badgeLabel too long'));
    record(assert(checks, card.accessibilityLabel.length <= 160, 'a11y max 160', 'a11y too long'));
    record(
      assert(
        checks,
        !TECHNICAL_ENUM_PATTERN.test(card.reasonLine),
        'card no technical enum',
        'technical enum in card',
      ),
    );
  }

  record(assert(checks, Boolean(buildPrimaryResourcePressureCostHint(day8)), 'Primary hint', 'No primary hint'));
  record(assert(checks, Boolean(buildPortfolioCostReasonLine(day8)), 'Portfolio reason line', 'No portfolio reason'));
  record(assert(checks, Boolean(buildOperationFeedCostReasonLine(day8)), 'Operation feed reason', 'No feed reason'));
  record(assert(checks, Boolean(buildReportResourcePressureNote(day8)), 'Report note', 'No report note'));
  record(assert(checks, Boolean(buildEceResourcePressureLine(day8)), 'Ece line', 'No ece line'));

  const presentationLines = collectResourcePressurePresentationLines(day8);
  record(assert(checks, presentationLines.length > 0, 'Presentation lines', 'No presentation lines'));
  record(
    assert(
      checks,
      collectResourcePressureDifferentiationLines(day8).length > 0,
      'Model collect lines',
      'No model lines',
    ),
  );

  const requiredFiles = [
    'src/core/resourcePressureDifferentiation/resourcePressureDifferentiationTypes.ts',
    'src/core/resourcePressureDifferentiation/resourcePressureDifferentiationConstants.ts',
    'src/core/resourcePressureDifferentiation/resourcePressureDifferentiationModel.ts',
    'src/core/resourcePressureDifferentiation/resourcePressureDifferentiationPresentation.ts',
    'src/core/resourcePressureDifferentiation/verifyResourcePressureDifferentiationScenario.ts',
    'src/core/resourcePressureDifferentiation/index.ts',
    'scripts/verify-resource-pressure-differentiation.ts',
    'scripts/analyze-resource-pressure-differentiation.ts',
    'docs/crevia-resource-pressure-cost-differentiation-pass.md',
  ];
  for (const file of requiredFiles) {
    record(assert(checks, existsSync(join(REPO_ROOT, file)), `${file} exists`, `${file} missing`));
  }

  record(
    assert(
      checks,
      verifyDailyCapacityPortfolioScenario().ok,
      'verify:daily-capacity-portfolio PASS',
      'verify:daily-capacity-portfolio FAIL',
    ),
  );
  record(
    assert(
      checks,
      verifyPortfolioDeferRiskScenario().ok,
      'verify:portfolio-defer-risk PASS',
      'verify:portfolio-defer-risk FAIL',
    ),
  );
  record(
    assert(
      checks,
      verifyDay8OperationFeedBindingScenario().ok,
      'verify:day8-operation-feed-binding PASS',
      'verify:day8-operation-feed-binding FAIL',
    ),
  );
  record(
    assert(
      checks,
      verifyFollowUpExecutionScenario().ok,
      'verify:follow-up-execution PASS',
      'verify:follow-up-execution FAIL',
    ),
  );
  record(
    assert(
      checks,
      verifyGameplayLoopQaScenario().ok,
      'verify:gameplay-loop-qa PASS',
      'verify:gameplay-loop-qa FAIL',
    ),
  );
  record(
    assert(
      checks,
      verifyFinalUiVisualUnificationScenario().ok,
      'verify:final-ui-visual-unification PASS',
      'verify:final-ui-visual-unification FAIL',
    ),
  );

  return { ok, warn: hasWarn, checks };
}
