import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';

import { buildCenterActiveTarget } from './utils/centerActiveTargetPresentation';
import { buildCenterAdvisorSuggestion } from './utils/centerAdvisorPresentation';
import { buildCenterCitySummary } from './utils/centerCitySummaryPresentation';
import { buildCenterDailyReward } from './utils/centerDailyRewardPresentation';
import { buildCenterHeaderSummary } from './utils/centerHeaderPresentation';
import { buildCenterHomePresentation } from './utils/centerHomePresentation';
import { buildCenterQuickActions } from './utils/centerQuickActionsPresentation';
import {
  buildCenterContinuationCards,
  centerContinuationCardsCoreFieldsValid,
  centerContinuationCardsDay1Safe,
  centerContinuationCardsEmptySafe,
  centerContinuationCardsEnumsValid,
  centerContinuationCardsMaxItems,
  centerContinuationCardsNotDuplicateActiveTarget,
  centerContinuationCardsNotDuplicateAdvisor,
  centerContinuationCardsNotDuplicateQuickActions,
  centerContinuationCardsNotDuplicateRecommendedPlan,
  centerContinuationCardsNotDuplicateSignals,
  centerContinuationCardsRouteSafety,
  centerContinuationCardsUniqueIds,
  centerContinuationCardsUniqueSourceIds,
} from './utils/centerContinuationCardsPresentation';
import { buildCenterRecommendedPlan } from './utils/centerRecommendedPlanPresentation';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

export function verifyCenterContinuationCardsScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];
  const day1State = createDay1Seed().gameState;
  const day1Reward = buildCenterDailyReward({ gameState: day1State, day: 1 });
  const day1Target = buildCenterActiveTarget({
    gameState: day1State,
    day: 1,
    operationSignals: createInitialOperationSignalsState(1),
    dailyRewardHelperText: day1Reward.helperText,
  });
  const day1Advisor = buildCenterAdvisorSuggestion({
    gameState: day1State,
    day: 1,
    activeTarget: day1Target,
    dailyReward: day1Reward,
    operationSignals: createInitialOperationSignalsState(1),
  });

  const day1Continuation = buildCenterContinuationCards({
    gameState: day1State,
    day: 1,
    activeTarget: day1Target,
    advisorSuggestion: day1Advisor,
    dailyReward: day1Reward,
  });

  assert(checks, centerContinuationCardsCoreFieldsValid(day1Continuation), 'Day 1 core fields valid');
  assert(checks, centerContinuationCardsDay1Safe(day1Continuation), 'Day 1 max 2 cards');
  assert(checks, centerContinuationCardsMaxItems(day1Continuation), 'Day 1 max items');
  assert(checks, centerContinuationCardsEnumsValid(day1Continuation), 'Day 1 enums valid');
  assert(checks, day1Continuation.displayMode === 'locked', 'Day 1 locked mode', day1Continuation.displayMode);

  const day3State = {
    ...day1State,
    city: { ...day1State.city, day: 3 },
    pilot: { ...day1State.pilot, currentPilotDay: 3 },
    player: { ...day1State.player, streakDays: 2 },
  };
  const day3Target = buildCenterActiveTarget({
    gameState: day3State,
    day: 3,
    operationSignals: createInitialOperationSignalsState(3),
  });
  const day3Advisor = buildCenterAdvisorSuggestion({
    gameState: day3State,
    day: 3,
    activeTarget: day3Target,
    operationSignals: createInitialOperationSignalsState(3),
  });
  const day3Plan = buildCenterRecommendedPlan({
    gameState: day3State,
    day: 3,
    activeTarget: day3Target,
    advisorSuggestion: day3Advisor,
    hubStoryChainLine: 'Mahalle hafızası devam ediyor.',
  });
  const day3Quick = buildCenterQuickActions({
    gameState: day3State,
    day: 3,
    activeTarget: day3Target,
    advisorSuggestion: day3Advisor,
    hubQuickActionState: createInitialHubQuickActionState(3),
  });

  const richContinuation = buildCenterContinuationCards({
    gameState: day3State,
    day: 3,
    activeTarget: day3Target,
    advisorSuggestion: day3Advisor,
    quickActions: day3Quick,
    recommendedPlan: day3Plan,
    hubDistrictReportLine: 'Mahalle güveni bugünkü kararla değişti.',
    hubStoryChainLine: 'Mahalle hafızası devam ediyor.',
    hubImpactExplanationLine: 'Önceki rota tercihi bugün kaynak baskısını artırdı.',
    hubVehicleMaintenanceLine: 'Araç yorgunluğu izleniyor.',
  });

  assert(checks, centerContinuationCardsMaxItems(richContinuation), 'Day 3 max 3 cards');
  assert(checks, centerContinuationCardsUniqueIds(richContinuation), 'Day 3 unique card ids');
  assert(checks, centerContinuationCardsUniqueSourceIds(richContinuation), 'Day 3 unique source ids');
  assert(checks, centerContinuationCardsRouteSafety(richContinuation), 'Day 3 route safety');
  assert(checks, centerContinuationCardsEnumsValid(richContinuation), 'Day 3 enums valid');
  assert(
    checks,
    centerContinuationCardsNotDuplicateRecommendedPlan(richContinuation, day3Plan),
    'Day 3 not duplicate recommended plan',
  );
  assert(
    checks,
    centerContinuationCardsNotDuplicateActiveTarget(richContinuation, day3Target),
    'Day 3 not duplicate active target',
  );
  assert(
    checks,
    centerContinuationCardsNotDuplicateAdvisor(richContinuation, day3Advisor.recommendation),
    'Day 3 not duplicate advisor',
  );
  assert(
    checks,
    centerContinuationCardsNotDuplicateQuickActions(
      richContinuation,
      day3Quick.items.map((item) => item.label),
    ),
    'Day 3 not duplicate quick actions',
  );

  const sparseContinuation = buildCenterContinuationCards({
    gameState: day3State,
    day: 3,
    activeTarget: { ...day3Target, status: 'empty' },
    advisorSuggestion: day3Advisor,
    hubDistrictReportLine: undefined,
    hubStoryChainLine: undefined,
    hubImpactExplanationLine: undefined,
    hubVehicleMaintenanceLine: undefined,
    hubTeamSpecializationLine: undefined,
  });

  assert(
    checks,
    sparseContinuation.cards.every(
      (card) => card.kind !== 'story_chain' && card.kind !== 'city_journal' && card.kind !== 'carry_over',
    ),
    'sparse no narrative hub lines',
    `kinds=${sparseContinuation.cards.map((card) => card.kind).join(',')}`,
  );
  assert(
    checks,
    sparseContinuation.cards.every((card) => !/(sahte|fake|uydurma)/i.test(card.body)),
    'sparse no fake text',
  );
  assert(
    checks,
    centerContinuationCardsEmptySafe({
      visibility: 'hidden',
      cards: [],
      displayMode: 'empty',
      accessibilityLabel: 'hidden',
    }),
    'empty mode safe',
  );

  const day3Presentation = buildCenterHomePresentation({
    gameState: day3State,
    operationSignals: createInitialOperationSignalsState(3),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(3),
    hubDistrictReportLine: 'Mahalle güveni bugünkü kararla değişti.',
    hubStoryChainLine: 'Mahalle hafızası devam ediyor.',
  });

  assert(
    checks,
    day3Presentation.continuationCards.cards.length <= 3,
    'presentation max 3 cards',
    `count=${day3Presentation.continuationCards.cards.length}`,
  );
  assert(
    checks,
    centerContinuationCardsNotDuplicateSignals(
      day3Presentation.continuationCards,
      day3Presentation.operationSignals.signals.map((signal) => signal.title),
    ),
    'presentation not duplicate signals',
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
