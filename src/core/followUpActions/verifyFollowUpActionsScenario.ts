import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { verifyAuthorityGameplayExpansionScenario } from '@/core/authorityGameplayExpansion/verifyAuthorityGameplayExpansionScenario';
import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '@/core/dailyCapacityPortfolio';
import { verifyDailyCapacityPortfolioScenario } from '@/core/dailyCapacityPortfolio/verifyDailyCapacityPortfolioScenario';
import { verifyEceStrategyLinesScenario } from '@/core/eceStrategyLines/verifyEceStrategyLinesScenario';
import { verifyOneMoreDayRetentionScenario } from '@/core/oneMoreDayRetention/verifyOneMoreDayRetentionScenario';
import { buildPortfolioDeferRiskBindings } from '@/core/portfolioDeferRisk';
import { verifyPortfolioDeferRiskScenario } from '@/core/portfolioDeferRisk/verifyPortfolioDeferRiskScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import { FOLLOW_UP_ALLOWED_SOURCE_KINDS } from './followUpActionConstants';
import { FOLLOW_UP_ACTION_CONTENT } from './followUpActionContentPack';
import { buildFollowUpActions } from './followUpActionModel';
import {
  buildFollowUpActionCardModels,
  buildPrimaryFollowUpActionCard,
  buildReportFollowUpActionHint,
} from './followUpActionPresentation';
import type { FollowUpAction, FollowUpActionInput } from './followUpActionTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 26;
const TECHNICAL_ENUM_PATTERN = /[a-z]+_[a-z_]+/;

export type VerifyFollowUpActionsOutcome = {
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
      status: 'critical',
      score: 82,
      title: 'Rota baskisi',
      summary: 'Arac rotasi zorlaniyor.',
      sourceTags: ['route_source'],
    },
    containers: {
      status: 'strained',
      score: 70,
      title: 'Konteyner hatti',
      summary: 'Hat ek kaynak istiyor.',
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

function day8Input(): DailyCapacityPortfolioInput {
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
    authorityPermissionIds: ['tomorrow_risk_preview', 'portfolio_defer_reason'],
  };
}

function buildDay8Pipeline(input: FollowUpActionInput): FollowUpActionInput {
  const portfolioInput = day8Input();
  const portfolio = buildDailyCapacityPortfolio(portfolioInput);
  const deferredItem = portfolio.items.find(
    (item) => item.deferRisk !== 'none' && item.sourceKinds.includes('tomorrow_risk'),
  );
  const portfolioWithDeferred = deferredItem
    ? {
        ...portfolio,
        items: portfolio.items.map((item) =>
          item.id === deferredItem.id ? { ...item, status: 'deferred' as const } : item,
        ),
        deferredItems: [{ ...deferredItem, status: 'deferred' as const }],
        availableItems: portfolio.availableItems.filter((item) => item.id !== deferredItem.id),
      }
    : portfolio;
  const deferRisk = buildPortfolioDeferRiskBindings({
    day: 8,
    portfolioResult: portfolioWithDeferred,
    tomorrowRiskSignals: portfolioInput.tomorrowRiskSignals,
  });

  return {
    ...input,
    day: 8,
    dailyCapacityPortfolioResult: portfolioWithDeferred,
    portfolioDeferRiskResult: deferRisk,
    tomorrowRiskSignals: portfolioInput.tomorrowRiskSignals,
  };
}

function validateAction(checks: string[], action: FollowUpAction): boolean {
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, action.id.trim().length > 0, `${action.id} id`, 'empty action id'));
  record(assert(checks, action.priority >= 0 && action.priority <= 100, `${action.id} priority range`, `${action.id} priority out of range`));
  record(assert(checks, unique(action.sourceIds), `${action.id} source unique`, `${action.id} duplicate source ids`));
  record(assert(checks, action.sourceIds.length > 0 || action.isFallback, `${action.id} source guard`, `${action.id} fake source`));
  record(assert(checks, !action.isFallback || action.confidence === 'low', `${action.id} fallback low confidence`, `${action.id} fallback not low`));
  record(assert(checks, ['none', 'low', 'medium'].includes(action.costBand), `${action.id} cost band`, `${action.id} invalid cost`));
  record(assert(checks, ['low', 'medium', 'high'].includes(action.impactBand), `${action.id} impact band`, `${action.id} invalid impact`));
  record(assert(checks, action.line.length <= 90, `${action.id} line max 90`, `${action.id} line too long`));
  record(assert(checks, action.benefitLine.length <= 100, `${action.id} benefit max 100`, `${action.id} benefit too long`));
  if (action.riskLine) {
    record(assert(checks, action.riskLine.length <= 90, `${action.id} risk max 90`, `${action.id} risk too long`));
  }

  const visibleText = [action.title, action.line, action.benefitLine, action.riskLine ?? ''].join(' ');
  record(assert(checks, !TECHNICAL_ENUM_PATTERN.test(visibleText), `${action.id} no technical enum`, `${action.id} leaked enum`));

  if (action.kind === 'support_recovery') {
    record(assert(checks, action.costBand === 'low' || action.costBand === 'none', `${action.id} recovery cost incentive`, `${action.id} recovery too costly`));
  }

  if (action.visibilityLevel !== 'detailed') {
    record(assert(checks, !action.riskLine, `${action.id} no detailed reason without permission`, `${action.id} detailed reason without permission`));
  }

  return ok;
}

export function verifyFollowUpActionsScenario(): VerifyFollowUpActionsOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION unchanged', `SAVE_VERSION ${SAVE_VERSION}`));
  record(assert(checks, !readRepo('src/store/useGameStore.ts').includes('followUpAction'), 'useGameStore untouched', 'useGameStore wired'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('followUpAction'), 'applyDecision untouched', 'applyDecision wired'));
  record(assert(checks, !readRepo('src/core/game/endDay.ts').includes('followUpAction'), 'day pipeline untouched', 'endDay wired'));
  record(assert(checks, !readRepo('src/features/hub/components/HubReferenceHome.tsx').includes('followUpAction'), 'Hub UI untouched', 'Hub UI wired'));
  const reportPresentation = readRepo('src/features/reports/utils/endOfDayReportPresentation.ts');
  record(
    assert(
      checks,
      reportPresentation.includes('followUpActionHint'),
      'Report presentation wired',
      'followUpActionHint missing',
    ),
  );
  record(
    assert(
      checks,
      !reportPresentation.includes('executeFollowUp') &&
        !reportPresentation.includes('applyFollowUp'),
      'Report no follow-up execution',
      'execution wired',
    ),
  );
  record(assert(checks, !readRepo('src/features/map/screens/MapScreen.tsx').includes('followUpAction'), 'Map UI untouched', 'Map UI wired'));

  const kindCount = Object.keys(FOLLOW_UP_ACTION_CONTENT).length;
  record(assert(checks, kindCount >= 12, 'At least 12 action kinds', `kind count ${kindCount}`));
  for (const [kind, lines] of Object.entries(FOLLOW_UP_ACTION_CONTENT)) {
    record(assert(checks, lines.length >= 4, `${kind} content lines`, `${kind} insufficient content`));
  }
  record(assert(checks, FOLLOW_UP_ALLOWED_SOURCE_KINDS.length >= 10, 'Source kinds catalog', 'missing source kinds'));

  const day1 = buildFollowUpActions({ day: 1 });
  record(assert(checks, day1.actions.length <= 1, 'Day 1 max 1 action', `Day 1 actions ${day1.actions.length}`));
  record(assert(checks, day1.actions.every((a) => a.kind === 'safe_watch' || day1.actions.length === 0), 'Day 1 safe only', 'Day 1 non-safe action'));
  record(assert(checks, day1.actions.length === 0 || day1.primaryAction?.kind === 'safe_watch', 'Day 1 low-noise', 'Day 1 noisy'));

  const noSource = buildFollowUpActions({ day: 8 });
  record(assert(checks, noSource.actions.length === 0, 'No source no fake action', 'fake action without source'));

  const day8 = buildFollowUpActions(buildDay8Pipeline({ day: 8 }));
  record(assert(checks, day8.actions.length > 0, 'Day 8 has follow-up actions', 'Day 8 missing actions'));
  record(assert(checks, day8.actions.length <= 3, 'Max 3 actions', `action count ${day8.actions.length}`));
  record(assert(checks, Boolean(day8.primaryAction) === (day8.actions.length > 0), 'Primary max 1', 'primary mismatch'));
  record(assert(checks, !day8.secondaryAction || day8.actions.length > 1, 'Secondary max 1', 'secondary mismatch'));
  record(assert(checks, unique(day8.actions.map((a) => a.id)), 'Action ids unique', 'duplicate action ids'));
  record(assert(checks, unique(day8.sourceIds), 'Result sourceIds unique', 'duplicate result source ids'));

  const routeAction = day8.actions.find((a) => a.sourceKinds.includes('portfolio_defer_risk'));
  if (routeAction) {
    record(assert(checks, routeAction.kind === 'review_route' || routeAction.kind === 'monitor_signal', 'PortfolioDefer route mapping', `unexpected kind ${routeAction.kind}`));
  }

  const trustPortfolio = buildFollowUpActions(
    buildDay8Pipeline({
      day: 8,
      districtPersonalityProfiles: [
        {
          districtId: 'merkez',
          districtName: 'Merkez',
          sourceIds: ['trust_live'],
          sourceKinds: ['district_trust'],
          criteria: [{ id: 'trust_fragility', band: 'high' }],
        },
      ],
    }),
  );
  const trustAction = trustPortfolio.actions.find((a) => a.kind === 'reinforce_trust');
  if (trustAction) {
    record(assert(checks, trustAction.sourceKinds.includes('district_personality'), 'PortfolioDefer trust mapping', 'trust mapping missing'));
  }

  const recovery = buildFollowUpActions({
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
  record(assert(checks, recovery.actions.some((a) => a.kind === 'support_recovery'), 'Recovery source mapping', 'missing support_recovery'));
  record(assert(checks, recovery.actions.every((a) => a.kind !== 'support_recovery' || a.costBand !== 'medium'), 'Recovery cost incentive', 'recovery medium cost'));

  const memory = buildFollowUpActions({
    day: 8,
    decisionConsequenceThreads: [
      {
        id: 'thread_memory',
        title: 'Karar izi',
        summary: 'Bolgede iz kaldi.',
        consequenceType: 'district_memory',
        sourceIds: ['memory_thread'],
      },
    ],
  });
  record(assert(checks, memory.actions.some((a) => a.kind === 'capture_memory_trace'), 'Memory source mapping', 'missing capture_memory_trace'));

  const baselineOnly = buildFollowUpActions({
    day: 8,
    districtPersonalityProfiles: [
      {
        districtId: 'merkez',
        districtName: 'Merkez',
        sourceKinds: ['design_baseline'],
        criteria: [{ id: 'neglect_risk', band: 'high' }],
      },
    ],
  });
  record(assert(checks, baselineOnly.actions.length === 0, 'DistrictPersonality baseline no fake risk', 'baseline produced action'));

  const noPermission = buildFollowUpActions(buildDay8Pipeline({ day: 8, authorityExpansionSummary: undefined }));
  record(assert(checks, noPermission.actions.every((a) => a.visibilityLevel !== 'detailed' || !a.riskLine), 'No permission no detailed reason', 'detailed reason without permission'));

  const cards = buildFollowUpActionCardModels(day8);
  record(assert(checks, cards.length <= 3, 'Presentation max 3 cards', `cards ${cards.length}`));
  record(assert(checks, Boolean(buildPrimaryFollowUpActionCard(day8)), 'Primary card model', 'missing primary card'));
  record(assert(checks, Boolean(buildReportFollowUpActionHint(day8)), 'Report hint', 'missing report hint'));

  for (const action of day8.actions) {
    record(validateAction(checks, action));
  }

  record(assert(checks, verifyPortfolioDeferRiskScenario().ok, 'verify:portfolio-defer-risk PASS', 'portfolio defer failed'));
  record(assert(checks, verifyOneMoreDayRetentionScenario().ok, 'verify:one-more-day-retention PASS', 'one more day failed'));
  record(assert(checks, verifyDailyCapacityPortfolioScenario().ok, 'verify:daily-capacity-portfolio PASS', 'portfolio failed'));
  record(assert(checks, verifyEceStrategyLinesScenario().ok, 'verify:ece-strategy-lines PASS', 'ece failed'));
  record(assert(checks, verifyAuthorityGameplayExpansionScenario().ok, 'verify:authority-gameplay-expansion PASS', 'authority failed'));

  const moduleFiles = [
    'src/core/followUpActions/followUpActionTypes.ts',
    'src/core/followUpActions/followUpActionConstants.ts',
    'src/core/followUpActions/followUpActionContentPack.ts',
    'src/core/followUpActions/followUpActionModel.ts',
    'src/core/followUpActions/followUpActionPresentation.ts',
    'src/core/followUpActions/verifyFollowUpActionsScenario.ts',
    'src/core/followUpActions/index.ts',
    'scripts/verify-follow-up-actions.ts',
    'scripts/analyze-follow-up-actions.ts',
    'docs/crevia-follow-up-action-content-pack.md',
  ];
  for (const file of moduleFiles) {
    record(assert(checks, existsSync(join(REPO_ROOT, file)), `${file} exists`, `${file} missing`));
  }

  return { ok, warn: false, checks };
}
