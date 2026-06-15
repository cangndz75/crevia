import { existsSync, readFileSync } from 'node:fs';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { buildAuthorityGameplayExpansionSummary } from '@/core/authorityGameplayExpansion';
import { buildCityMemoryVisibility } from '@/core/cityMemoryVisibility';
import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '@/core/dailyCapacityPortfolio';
import { buildFollowUpActions } from '@/core/followUpActions';
import { buildOneMoreDayRetention } from '@/core/oneMoreDayRetention';
import { buildPortfolioDeferRiskBindings } from '@/core/portfolioDeferRisk';
import { SAVE_VERSION } from '@/store/gamePersist';

import { POSITIVE_COMEBACK_ALLOWED_SOURCE_KINDS, POSITIVE_COMEBACK_COPY, POSITIVE_COMEBACK_FAKE_RECOVERY_PATTERNS, POSITIVE_COMEBACK_MAX_CANDIDATES } from './positiveComebackConstants';
import { buildPositiveComeback, collectPositiveComebackLines } from './positiveComebackModel';
import {
  buildEcePositiveComebackLine,
  buildHubPositiveComebackHint,
  buildPortfolioPositiveComebackSignal,
  buildPositiveComebackCardModels,
  buildPrimaryPositiveComebackCard,
  buildReportPositiveComebackNote,
} from './positiveComebackPresentation';
import type { PositiveComebackCandidate } from './positiveComebackTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;

export type VerifyPositiveComebackOutcome = {
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
    authorityPermissionIds: ['tomorrow_risk_preview', 'district_trust_preview'],
  };
}

function buildDay8Pipeline(extra: Record<string, unknown> = {}) {
  const portfolio = buildDailyCapacityPortfolio({
    ...day8PortfolioInput(),
    ...extra,
  });
  const portfolioDeferRisk = buildPortfolioDeferRiskBindings({
    day: 8,
    portfolioResult: portfolio,
    tomorrowRiskSignals: day8PortfolioInput().tomorrowRiskSignals,
    authorityPermissionIds: day8PortfolioInput().authorityPermissionIds,
  });
  const oneMoreDayRetention = buildOneMoreDayRetention({
    day: 8,
    portfolioDeferRiskResult: portfolioDeferRisk,
    dailyCapacityPortfolioResult: portfolio,
    currentRouteHints: { hubRoute: '/', mapRoute: '/map' },
  });
  const cityMemoryVisibility = buildCityMemoryVisibility({
    day: 8,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
  });
  const authorityExpansionSummary = buildAuthorityGameplayExpansionSummary({
    day: 8,
    permissionIds: day8PortfolioInput().authorityPermissionIds,
    portfolioAvailable: portfolio.items.length > 0,
  });
  const followUpActions = buildFollowUpActions({
    day: 8,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    dailyCapacityPortfolioResult: portfolio,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    authorityExpansionSummary,
    ...extra,
  });
  return {
    portfolio,
    portfolioDeferRisk,
    oneMoreDayRetention,
    cityMemoryVisibility,
    followUpActions,
    authorityExpansionSummary,
  };
}

function validateCandidate(checks: string[], candidate: PositiveComebackCandidate): boolean {
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, candidate.id.trim().length > 0, `${candidate.id} id`, 'empty candidate id'));
  record(assert(checks, candidate.line.trim().length > 0, `${candidate.id} line`, `${candidate.id} empty line`));
  record(assert(checks, candidate.priority >= 0 && candidate.priority <= 100, `${candidate.id} priority clamp`, `${candidate.id} priority out of range`));
  record(assert(checks, unique(candidate.sourceIds), `${candidate.id} source unique`, `${candidate.id} duplicate sourceIds`));
  record(
    assert(
      checks,
      candidate.sourceKinds.every((kind) => POSITIVE_COMEBACK_ALLOWED_SOURCE_KINDS.includes(kind)),
      `${candidate.id} source kind enum`,
      `${candidate.id} invalid source kind`,
    ),
  );
  record(
    assert(
      checks,
      !/[a-z]+_[a-z_]+/.test(`${candidate.title} ${candidate.line} ${candidate.benefitLine}`),
      `${candidate.id} no technical enum`,
      `${candidate.id} technical enum leaked`,
    ),
  );
  record(
    assert(
      checks,
      !POSITIVE_COMEBACK_FAKE_RECOVERY_PATTERNS.some((pattern) =>
        pattern.test(`${candidate.line} ${candidate.benefitLine}`),
      ),
      `${candidate.id} no fake recovery`,
      `${candidate.id} fake recovery language`,
    ),
  );
  if (candidate.isFallback) {
    record(assert(checks, candidate.confidence === 'low', `${candidate.id} fallback low confidence`, `${candidate.id} fallback confidence ${candidate.confidence}`));
  }
  if (candidate.kind === 'trust_recovery') {
    const hasTrustSource = candidate.sourceKinds.some((kind) =>
      ['district_trust', 'district_personality', 'follow_up_action', 'reward_comeback', 'social_pulse'].includes(kind),
    );
    record(assert(checks, hasTrustSource, `${candidate.id} trust source guard`, `${candidate.id} fake trust recovery`));
  }
  if (candidate.kind === 'memory_positive_trace') {
    const hasMemorySource = candidate.sourceKinds.some((kind) =>
      ['city_memory_visibility', 'decision_consequence', 'carry_over', 'portfolio_defer_risk', 'follow_up_action'].includes(kind),
    );
    record(assert(checks, hasMemorySource, `${candidate.id} memory source guard`, `${candidate.id} fake memory trace`));
  }
  return ok;
}

export function verifyPositiveComebackScenario(): VerifyPositiveComebackOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION unchanged', `SAVE_VERSION ${SAVE_VERSION}`));
  record(assert(checks, !readRepo('src/store/useGameStore.ts').includes('positiveComeback'), 'useGameStore untouched', 'useGameStore wired'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('positiveComeback'), 'applyDecision untouched', 'applyDecision wired'));
  record(assert(checks, !readRepo('src/core/game/endDay.ts').includes('positiveComeback'), 'day pipeline untouched', 'endDay wired'));

  for (const [kind, lines] of Object.entries(POSITIVE_COMEBACK_COPY)) {
    record(assert(checks, lines.length >= 3, `${kind} content lines`, `${kind} insufficient content`));
    for (const line of lines) {
      record(assert(checks, !POSITIVE_COMEBACK_FAKE_RECOVERY_PATTERNS.some((pattern) => pattern.test(line)), `${kind} copy safe`, `${kind} unsafe copy`));
    }
  }

  const day1 = buildPositiveComeback({ day: 1 });
  record(assert(checks, day1.candidates.length <= 1, 'Day 1 low-noise max 1', `Day 1 candidates ${day1.candidates.length}`));
  record(assert(checks, day1.candidates.every((c) => c.isFallback || c.visibilityLevel === 'hidden'), 'Day 1 fallback/hidden only', 'Day 1 positive spam'));

  const noSource = buildPositiveComeback({ day: 8 });
  record(assert(checks, noSource.candidates.length <= POSITIVE_COMEBACK_MAX_CANDIDATES, 'Max 3 candidates', `count ${noSource.candidates.length}`));

  const recovery = buildPositiveComeback({
    day: 10,
    rewardComebackSignals: {
      id: 'recovery_1',
      title: 'Toparlanma firsati',
      summary: 'Bolge kucuk bir takip hamlesine acik.',
      tone: 'recovery',
      districtId: 'cumhuriyet',
      sourceIds: ['recovery_source'],
    },
  });
  record(assert(checks, recovery.primaryCandidate?.sourceKinds.includes('reward_comeback') === true, 'RewardComeback highest priority', 'RewardComeback not primary'));
  record(assert(checks, recovery.candidates.some((c) => c.kind === 'district_recovery'), 'Recovery source mapping', 'missing district_recovery'));

  const pipeline = buildDay8Pipeline({
    rewardComebackSignals: {
      id: 'rc_day8',
      title: 'Toparlanma',
      summary: 'Iyilesme penceresi acik.',
      tone: 'recovery',
      sourceIds: ['rc_day8'],
    },
  });
  const day8 = buildPositiveComeback({
    day: 8,
    rewardComebackSignals: {
      id: 'rc_day8',
      title: 'Toparlanma',
      summary: 'Iyilesme penceresi acik.',
      tone: 'recovery',
      sourceIds: ['rc_day8'],
    },
    dailyCapacityPortfolioResult: pipeline.portfolio,
    followUpActionResult: pipeline.followUpActions,
    oneMoreDayRetentionResult: pipeline.oneMoreDayRetention,
    portfolioDeferRiskResult: pipeline.portfolioDeferRisk,
    cityMemoryVisibilityResult: pipeline.cityMemoryVisibility,
    authorityExpansionSummary: pipeline.authorityExpansionSummary,
    authorityPermissionIds: day8PortfolioInput().authorityPermissionIds,
  });
  record(assert(checks, day8.candidates.length > 0, 'Day 8 has positive candidates', 'Day 8 missing candidates'));
  record(assert(checks, unique(day8.candidates.map((c) => c.id)), 'Candidate ids unique', 'duplicate candidate ids'));
  record(assert(checks, unique(day8.sourceIds), 'Result sourceIds unique', 'duplicate result source ids'));

  const followUpRecovery = buildPositiveComeback({
    day: 8,
    followUpActionResult: buildFollowUpActions({
      day: 8,
      rewardComebackSignals: {
        id: 'fu_recovery',
        title: 'Toparlanma',
        summary: 'Takip firsati.',
        tone: 'recovery',
        sourceIds: ['fu_recovery'],
      },
    }),
  });
  record(
    assert(
      checks,
      followUpRecovery.candidates.some((c) =>
        c.kind === 'district_recovery' || c.kind === 'follow_up_success',
      ),
      'FollowUp support_recovery mapping',
      'missing follow-up recovery candidate',
    ),
  );

  const portfolioRecovery = buildPositiveComeback({
    day: 8,
    dailyCapacityPortfolioResult: buildDailyCapacityPortfolio({
      day: 8,
      rewardComebackSignals: {
        id: 'portfolio_rc',
        title: 'Toparlanma penceresi',
        summary: 'Mahalle toparlanmaya acik.',
        tone: 'recovery',
        sourceIds: ['portfolio_rc'],
      },
    }),
  });
  record(
    assert(
      checks,
      portfolioRecovery.candidates.some((c) =>
        c.kind === 'district_recovery' || c.kind === 'opportunity_window',
      ),
      'Portfolio recovery_opportunity mapping',
      'missing portfolio recovery candidate',
    ),
  );

  const baselineOnly = buildPositiveComeback({
    day: 8,
    districtPersonalityProfiles: [
      {
        districtId: 'merkez',
        districtName: 'Merkez',
        sourceIds: ['baseline'],
        sourceKinds: ['design_baseline'],
        criteria: [{ id: 'recovery_potential', band: 'high' }],
      },
    ],
  });
  record(
    assert(
      checks,
      !baselineOnly.candidates.some((c) => c.kind === 'district_recovery' && c.confidence === 'high'),
      'DistrictPersonality baseline no fake recovery',
      'baseline fake recovery',
    ),
  );

  const noPermission = buildPositiveComeback({
    day: 10,
    rewardComebackSignals: {
      id: 'trust_rc',
      title: 'Guven firsati',
      summary: 'Guven sinyali toparlanmaya acik.',
      tone: 'recovery',
      sourceIds: ['trust_rc'],
    },
    authorityPermissionIds: [],
  });
  record(
    assert(
      checks,
      noPermission.candidates.every((c) => c.visibilityLevel !== 'detailed'),
      'Permission guard no detailed',
      'detailed without permission',
    ),
  );

  const withPermission = buildPositiveComeback({
    day: 10,
    districtTrustSignals: {
      id: 'trust_live',
      band: 'recovering',
      summary: 'Guven toparlaniyor.',
      sourceIds: ['trust_live'],
      districtId: 'merkez',
    },
    authorityPermissionIds: ['district_trust_preview'],
  });
  const trustCandidate = withPermission.candidates.find((c) => c.kind === 'trust_recovery');
  if (trustCandidate) {
    record(assert(checks, trustCandidate.visibilityLevel === 'detailed', 'Authority detailed trust', 'trust not detailed'));
  }

  for (const candidate of [...day8.candidates, ...recovery.candidates]) {
    record(validateCandidate(checks, candidate));
  }

  const cards = buildPositiveComebackCardModels(day8);
  record(assert(checks, cards.length <= POSITIVE_COMEBACK_MAX_CANDIDATES, 'Presentation max 3 cards', `cards ${cards.length}`));
  record(assert(checks, Boolean(buildPrimaryPositiveComebackCard(day8)), 'Primary card model', 'primary card missing'));
  record(assert(checks, Boolean(buildReportPositiveComebackNote(day8)), 'Report note model', 'report note missing'));
  record(assert(checks, Boolean(buildHubPositiveComebackHint(day8)), 'Hub hint model', 'hub hint missing'));
  record(assert(checks, Boolean(buildEcePositiveComebackLine(day8)), 'Ece line model', 'ece line missing'));
  record(assert(checks, Boolean(buildPortfolioPositiveComebackSignal(day8)), 'Portfolio signal model', 'portfolio signal missing'));

  const allLines = collectPositiveComebackLines(day8);
  record(assert(checks, allLines.every((line) => !/[a-z]+_[a-z_]+/.test(line)), 'No technical enum in lines', 'technical enum leaked'));

  const moduleFiles = [
    'src/core/positiveComeback/positiveComebackTypes.ts',
    'src/core/positiveComeback/positiveComebackConstants.ts',
    'src/core/positiveComeback/positiveComebackModel.ts',
    'src/core/positiveComeback/positiveComebackPresentation.ts',
    'src/core/positiveComeback/verifyPositiveComebackScenario.ts',
    'src/core/positiveComeback/index.ts',
    'scripts/verify-positive-comeback.ts',
    'scripts/analyze-positive-comeback.ts',
    'docs/crevia-positive-comeback-event-pass.md',
  ];
  for (const file of moduleFiles) {
    record(assert(checks, existsSync(join(REPO_ROOT, file)), `${file} exists`, `${file} missing`));
  }

  return { ok, warn: false, checks };
}
