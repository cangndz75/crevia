import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildAuthorityGameplayExpansionSummary } from '@/core/authorityGameplayExpansion';
import { buildCityMemoryVisibility } from '@/core/cityMemoryVisibility';
import { buildDailyCapacityPortfolio } from '@/core/dailyCapacityPortfolio';
import { buildDay8OperationFeedBinding } from '@/core/day8OperationFeedBinding';
import { buildFollowUpActions } from '@/core/followUpActions';
import { buildOneMoreDayRetention } from '@/core/oneMoreDayRetention';
import { buildPortfolioDeferRiskBindings } from '@/core/portfolioDeferRisk';
import { buildPositiveComeback } from '@/core/positiveComeback';
import { SAVE_VERSION } from '@/store/gamePersist';
import {
  appendStrategyFollowUpExecutionRecord,
  buildExecutedFollowUpActionIdsForDay,
  createEmptyStrategyHistoryState,
} from '@/core/strategyHistory/strategyHistoryModel';
import { buildStrategyFollowUpExecutionRecord } from '@/core/strategyHistory/strategyHistoryAdapters';

import {
  FOLLOW_UP_EXECUTION_ALLOWED_SOURCE_KINDS,
  FOLLOW_UP_EXECUTION_MAX_CANDIDATES,
  FOLLOW_UP_EXECUTION_MIN_DAY,
} from './followUpExecutionConstants';
import {
  buildCityMemorySourceFromFollowUpExecution,
  buildEceFollowUpExecutionLine,
  buildFollowUpExecution,
  buildFollowUpExecutionCardModels,
  buildHubFollowUpExecutionHint,
  buildPositiveComebackSourceFromFollowUpExecution,
  buildReportFollowUpExecutionNote,
  executeFollowUpActionLite,
} from './index';
import type { FollowUpExecutionCandidate } from './followUpExecutionTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 27;
const TECHNICAL_ENUM_PATTERN = /\b[a-z]+_[a-z_]+\b/;

export type VerifyFollowUpExecutionOutcome = {
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

function validateCandidate(checks: string[], candidate: FollowUpExecutionCandidate): boolean {
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };
  record(assert(checks, candidate.id.trim().length > 0, `${candidate.id} id`, 'empty id'));
  record(assert(checks, candidate.actionId.trim().length > 0, `${candidate.id} actionId`, `${candidate.id} empty actionId`));
  record(assert(checks, candidate.priority >= 0 && candidate.priority <= 100, `${candidate.id} priority clamp`, `${candidate.id} priority out of range`));
  record(assert(checks, unique(candidate.sourceIds), `${candidate.id} source unique`, `${candidate.id} duplicate sourceIds`));
  record(assert(checks, candidate.isPresentationOnly === true, `${candidate.id} presentation-only`, `${candidate.id} not presentation-only`));
  record(
    assert(
      checks,
      candidate.sourceKinds.every((kind) => FOLLOW_UP_EXECUTION_ALLOWED_SOURCE_KINDS.includes(kind)),
      `${candidate.id} source kind enum`,
      `${candidate.id} invalid source kind`,
    ),
  );
  record(
    assert(
      checks,
      !TECHNICAL_ENUM_PATTERN.test(`${candidate.title} ${candidate.line} ${candidate.resultLine}`),
      `${candidate.id} no technical enum`,
      `${candidate.id} technical enum leaked`,
    ),
  );
  return ok;
}

function event(id: string, title: string, district: string, neighborhoodId: string) {
  return { id, title, district, neighborhoodId, day: 8 };
}

function buildDay8Pipeline() {
  const dailyCapacityPortfolio = buildDailyCapacityPortfolio({
    day: 8,
    activeEvents: [
      event('route_event', 'Rota baskisi', 'Sanayi', 'sanayi'),
      event('container_event', 'Konteyner hatti', 'Cumhuriyet', 'cumhuriyet'),
    ],
    operationSignals: {
      priorityDistrictId: 'sanayi',
      vehicles: {
        status: 'strained',
        score: 68,
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
        score: 55,
        title: 'Guven hassasiyeti',
        summary: 'Mahalle guveni izleniyor.',
        sourceTags: ['trust_source'],
      },
      overall: {
        status: 'watch',
        score: 52,
        title: 'Genel sinyal',
        summary: 'Izleme suruyor.',
        sourceTags: ['overall_source'],
      },
    },
    tomorrowRiskSignals: [
      {
        id: 'route_risk',
        title: 'Yarin rota riski',
        mainLine: 'Rota baskisi yarin tekrar okunmali.',
        priority: 'high',
        relatedDomain: 'route',
        sourceSignals: ['route_source'],
      },
    ],
    authorityPermissionIds: ['tomorrow_risk_preview', 'district_trust_preview'],
  });
  const portfolioDeferRisk = buildPortfolioDeferRiskBindings({
    day: 8,
    portfolioResult: dailyCapacityPortfolio,
    authorityPermissionIds: ['tomorrow_risk_preview', 'district_trust_preview'],
  });
  const oneMoreDayRetention = buildOneMoreDayRetention({
    day: 8,
    portfolioDeferRiskResult: portfolioDeferRisk,
    dailyCapacityPortfolioResult: dailyCapacityPortfolio,
    currentRouteHints: { hubRoute: '/', reportRoute: '/reports' },
  });
  const cityMemoryVisibility = buildCityMemoryVisibility({
    day: 8,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
  });
  const authorityExpansionSummary = buildAuthorityGameplayExpansionSummary({
    day: 8,
    permissionIds: ['tomorrow_risk_preview', 'district_trust_preview'],
    portfolioAvailable: dailyCapacityPortfolio.items.length > 0,
  });
  const followUpActions = buildFollowUpActions({
    day: 8,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    dailyCapacityPortfolioResult: dailyCapacityPortfolio,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    authorityExpansionSummary,
  });
  const positiveComeback = buildPositiveComeback({
    day: 8,
    dailyCapacityPortfolioResult: dailyCapacityPortfolio,
    followUpActionResult: followUpActions,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    portfolioDeferRiskResult: portfolioDeferRisk,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    authorityExpansionSummary,
  });
  const day8OperationFeedBinding = buildDay8OperationFeedBinding({
    day: 8,
    dailyCapacityPortfolioResult: dailyCapacityPortfolio,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    followUpActionResult: followUpActions,
    positiveComebackResult: positiveComeback,
    authorityExpansionSummary,
  });
  return {
    dailyCapacityPortfolio,
    portfolioDeferRisk,
    oneMoreDayRetention,
    cityMemoryVisibility,
    followUpActions,
    positiveComeback,
    day8OperationFeedBinding,
  };
}

export function verifyFollowUpExecutionScenario(): VerifyFollowUpExecutionOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  const modelFile = readRepo('src/core/followUpExecution/followUpExecutionModel.ts');
  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION 27', `SAVE_VERSION ${SAVE_VERSION}`));
  record(assert(checks, readRepo('src/store/useGameStore.ts').includes('strategyHistory'), 'useGameStore strategyHistory slice', 'strategyHistory missing'));
  record(assert(checks, readRepo('src/store/gamePersist.ts').includes('strategyHistory'), 'gamePersist strategyHistory slice', 'strategyHistory missing'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('followUpExecution'), 'applyDecision untouched', 'applyDecision wired'));
  record(assert(checks, !modelFile.includes('ensureDailyEventsForDay'), 'event spawn absent', 'event spawn reference found'));
  record(assert(checks, !modelFile.includes('applyDecision'), 'no decision executor call', 'applyDecision reference found'));
  record(assert(checks, !modelFile.includes('rewardPayout'), 'reward payout absent', 'reward payout reference found'));

  const day7 = buildFollowUpExecution({ day: FOLLOW_UP_EXECUTION_MIN_DAY - 1 });
  record(assert(checks, !day7.isActive && day7.availableCandidates.length === 0, 'Day <8 hidden', 'Day <8 visible'));

  const pipeline = buildDay8Pipeline();
  const day8 = buildFollowUpExecution({
    day: 8,
    followUpActionResult: pipeline.followUpActions,
    day8OperationFeedBindingResult: pipeline.day8OperationFeedBinding,
    positiveComebackResult: pipeline.positiveComeback,
    cityMemoryVisibilityResult: pipeline.cityMemoryVisibility,
    dailyCapacityPortfolioResult: pipeline.dailyCapacityPortfolio,
    portfolioDeferRiskResult: pipeline.portfolioDeferRisk,
    oneMoreDayRetentionResult: pipeline.oneMoreDayRetention,
  });
  record(assert(checks, day8.isActive, 'Day 8+ active', 'Day 8+ inactive'));
  record(assert(checks, day8.availableCandidates.length > 0, 'Day 8+ candidates', 'Day 8 no candidates'));
  record(assert(checks, day8.availableCandidates.length <= FOLLOW_UP_EXECUTION_MAX_CANDIDATES, 'candidate cap', 'candidate cap exceeded'));
  for (const candidate of [...day8.availableCandidates, ...day8.executedCandidates]) {
    record(validateCandidate(checks, candidate));
  }

  const executionInput = {
    day: 8,
    followUpActionResult: pipeline.followUpActions,
    day8OperationFeedBindingResult: pipeline.day8OperationFeedBinding,
    positiveComebackResult: pipeline.positiveComeback,
    cityMemoryVisibilityResult: pipeline.cityMemoryVisibility,
    dailyCapacityPortfolioResult: pipeline.dailyCapacityPortfolio,
    portfolioDeferRiskResult: pipeline.portfolioDeferRisk,
    oneMoreDayRetentionResult: pipeline.oneMoreDayRetention,
  };
  const command = { day: 8, actionId: day8.availableCandidates[0]?.actionId ?? '' };
  const executed = executeFollowUpActionLite(executionInput, command);
  record(assert(checks, executed.executedCandidates.length === 1, 'execute result valid', 'execute result missing'));
  record(assert(checks, executed.executedCandidates[0]?.status === 'executed', 'execute status', 'execute status invalid'));
  record(assert(checks, Boolean(buildReportFollowUpExecutionNote(executed)), 'report can show executed result', 'report note missing'));
  record(assert(checks, Boolean(buildHubFollowUpExecutionHint(executed)), 'hub can show executed result', 'hub hint missing'));
  record(assert(checks, Boolean(buildEceFollowUpExecutionLine(executed)), 'ece can show executed result', 'ece line missing'));
  record(assert(checks, Boolean(buildCityMemorySourceFromFollowUpExecution(executed)), 'city memory adapter safe', 'city memory adapter missing'));
  record(assert(checks, Boolean(buildPositiveComebackSourceFromFollowUpExecution(executed)), 'positive comeback adapter safe', 'positive comeback adapter missing'));

  const duplicate = executeFollowUpActionLite({
    ...executionInput,
    executedActionIdsToday: [command.actionId],
  }, command);
  record(assert(checks, duplicate.primaryCandidate?.status === 'blocked', 'duplicate blocked', 'duplicate not blocked'));

  const persistedHistory = appendStrategyFollowUpExecutionRecord(
    createEmptyStrategyHistoryState(),
    buildStrategyFollowUpExecutionRecord({
      day: 8,
      candidate: day8.availableCandidates[0]!,
      status: 'executed',
    }),
  );
  const persistedDuplicate = executeFollowUpActionLite({
    ...executionInput,
    executedActionIdsToday: buildExecutedFollowUpActionIdsForDay(persistedHistory, 8),
  }, command);
  record(assert(checks, persistedDuplicate.primaryCandidate?.status === 'blocked', 'persisted duplicate blocked', 'persisted duplicate not blocked'));

  const noSource = buildFollowUpExecution({ day: 8 });
  record(assert(checks, noSource.availableCandidates.length === 0, 'Day 8 no-source safe', 'Day 8 no-source fallback spam'));

  const cards = buildFollowUpExecutionCardModels(executed);
  record(assert(checks, cards.length <= FOLLOW_UP_EXECUTION_MAX_CANDIDATES, 'card cap', 'card cap exceeded'));
  record(assert(checks, cards.every((card) => !TECHNICAL_ENUM_PATTERN.test(`${card.title} ${card.line}`)), 'cards no technical enum', 'card technical enum leaked'));

  return { ok, warn: false, checks };
}
