import { createDay1Seed } from '@/core/content/day1Seed';
import { buildDominantStrategyDetector } from '@/core/dominantStrategyDetector/dominantStrategyDetectorModel';
import type { FollowUpExecutionCandidate } from '@/core/followUpExecution/followUpExecutionTypes';
import { executeFollowUpActionLite } from '@/core/followUpExecution/followUpExecutionModel';
import { normalizePersistedSave, SAVE_VERSION } from '@/store/gamePersist';

import {
  appendStrategyDecisionRecord,
  appendStrategyDominantSurfacedRecord,
  appendStrategyFollowUpExecutionRecord,
  appendStrategyOperationChoiceRecord,
  appendStrategyPortfolioChoiceRecord,
  buildDominantStrategyInputFromPersistedHistory,
  buildExecutedFollowUpActionIdsForDay,
  createEmptyStrategyHistoryState,
  hasSurfacedDominantStrategyRecently,
  migrateStrategyHistoryState,
  STRATEGY_DECISION_HISTORY_MAX,
  STRATEGY_HISTORY_MAX_AGE_DAYS,
} from './strategyHistoryModel';
import {
  buildStrategyDecisionRecordFromDecisionRecord,
  buildStrategyDominantSurfacedRecord,
  buildStrategyFollowUpExecutionRecord,
  buildStrategyOperationChoiceRecord,
  buildStrategyPortfolioChoiceRecord,
} from './strategyHistoryAdapters';

export type VerifyStrategyHistoryOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(checks: string[], pass: boolean, ok: string, fail = ok): boolean {
  checks.push(pass ? `PASS ${ok}` : `FAIL ${fail}`);
  return pass;
}

function makeCandidate(actionId: string): FollowUpExecutionCandidate {
  return {
    id: `candidate-${actionId}`,
    actionId,
    kind: 'support_recovery',
    title: 'Geri kazanimi izle',
    line: 'Mahalle toparlanmasi bugun tekrar okunur.',
    resultLine: 'Takip isaretlendi.',
    districtId: 'sanayi',
    districtName: 'Sanayi',
    status: 'available',
    tone: 'positive',
    priority: 80,
    sourceIds: [actionId],
    sourceKinds: ['follow_up_action'],
    isPresentationOnly: true,
  };
}

export function verifyStrategyHistoryScenario(): VerifyStrategyHistoryOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === 27, 'SAVE_VERSION 27', `SAVE_VERSION ${SAVE_VERSION}`));

  let state = createEmptyStrategyHistoryState();
  const decisionRecord = buildStrategyDecisionRecordFromDecisionRecord(
    {
      id: 'decision-a',
      day: 8,
      eventId: 'event-a',
      eventTitle: 'Rota baskisi',
      decisionId: 'rapid-a',
      decisionLabel: 'Hizli rota cevabi',
      neighborhoodId: 'sanayi',
      neighborhoodName: 'Sanayi',
      appliedEffects: { publicSatisfaction: 5, budget: -2500 },
      createdAt: '2026-06-15T00:00:00.000Z',
    },
    { domainTags: ['route'] },
  );
  state = appendStrategyDecisionRecord(state, decisionRecord);
  state = appendStrategyOperationChoiceRecord(
    state,
    buildStrategyOperationChoiceRecord({
      day: 8,
      operationId: 'operation-a',
      choiceId: 'route-review',
      choiceLabel: 'Rota gozden gecir',
      districtId: 'sanayi',
      districtName: 'Sanayi',
      domainTags: ['route'],
    }),
  );
  state = appendStrategyPortfolioChoiceRecord(
    state,
    buildStrategyPortfolioChoiceRecord({
      day: 8,
      itemId: 'portfolio-a',
      itemKind: 'route_pressure',
      decision: 'select',
      districtId: 'sanayi',
      domainTags: ['route'],
    }),
  );

  const candidate = makeCandidate('follow-up-a');
  state = appendStrategyFollowUpExecutionRecord(
    state,
    buildStrategyFollowUpExecutionRecord({ day: 8, candidate, status: 'executed' }),
  );
  const executedIds = buildExecutedFollowUpActionIdsForDay(state, 8);
  record(assert(checks, executedIds.includes('follow-up-a'), 'executed follow-up ids from history'));

  const duplicate = executeFollowUpActionLite(
    {
      day: 8,
      followUpActionResult: {
        actions: [candidate],
      },
      executedActionIdsToday: executedIds,
    },
    { day: 8, actionId: 'follow-up-a' },
  );
  record(assert(checks, duplicate.primaryCandidate?.status === 'blocked', 'reload duplicate follow-up blocked'));

  let dominantHistory = createEmptyStrategyHistoryState();
  dominantHistory = appendStrategyDecisionRecord(dominantHistory, decisionRecord);
  const dominantInput = buildDominantStrategyInputFromPersistedHistory(dominantHistory, 8);
  const dominant = buildDominantStrategyDetector({
    ...dominantInput,
    decisionRecords: [
      ...Array.from({ length: 4 }, (_, index) => ({
        ...decisionRecord,
        id: `decision-rapid-${index}`,
        day: 8 + index,
        selectedDecisionKind: 'rapid_response',
        decisionLabel: 'Hizli rota cevabi',
        districtId: undefined,
        domainTags: [],
        sourceIds: [`decision-rapid-${index}`],
      })),
      ...(dominantInput.decisionRecords ?? []),
    ],
  });
  record(
    assert(
      checks,
      dominant.pattern === 'rapid_response_overuse',
      'dominant detector reads persisted history',
      `dominant detector reads ${dominant.pattern}`,
    ),
  );

  state = appendStrategyDominantSurfacedRecord(
    state,
    buildStrategyDominantSurfacedRecord(dominant, 'hub'),
  );
  record(
    assert(
      checks,
      hasSurfacedDominantStrategyRecently(state, 9, dominant.pattern, 'hub'),
      'dominant surfaced cooldown reads history',
    ),
  );

  let capped = createEmptyStrategyHistoryState();
  for (let index = 0; index < STRATEGY_DECISION_HISTORY_MAX + 5; index += 1) {
    capped = appendStrategyDecisionRecord(capped, {
      ...decisionRecord,
      id: `capped-${index}`,
      day: 30,
      sourceIds: [`capped-${index}`],
    });
  }
  record(assert(checks, capped.decisionHistory.length === STRATEGY_DECISION_HISTORY_MAX, 'decision history cap'));
  const pruned = migrateStrategyHistoryState(
    {
      decisionHistory: [
        { ...decisionRecord, id: 'old', day: 1 },
        { ...decisionRecord, id: 'fresh', day: 30 },
      ],
    },
    30,
  );
  record(
    assert(
      checks,
      pruned.decisionHistory.length === 1 &&
        pruned.decisionHistory[0]?.id === 'fresh' &&
        STRATEGY_HISTORY_MAX_AGE_DAYS === 21,
      'age prune on migrate',
    ),
  );

  const v26Save = {
    ...createDay1Seed(),
    saveVersion: 26,
    updatedAt: '2026-06-15T00:00:00.000Z',
  };
  const migrated = normalizePersistedSave(v26Save);
  record(
    assert(
      checks,
      migrated?.saveVersion === 27 &&
        migrated.strategyHistory.decisionHistory.length === 0,
      'v26 save migrates with empty strategyHistory',
    ),
  );

  return { ok, checks };
}
