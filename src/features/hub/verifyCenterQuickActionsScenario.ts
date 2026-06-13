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
import {
  buildCenterQuickActions,
  centerQuickActionsCoreFieldsValid,
  centerQuickActionsDay1Safe,
  centerQuickActionsLinkedTarget,
  centerQuickActionsMaxItems,
  centerQuickActionsNoFakeSpend,
  centerQuickActionsNotDuplicateAdvisor,
  centerQuickActionsNotDuplicateTargetCta,
  centerQuickActionsRouteSafety,
  centerQuickActionsUniqueIds,
} from './utils/centerQuickActionsPresentation';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

export function verifyCenterQuickActionsScenario(): {
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
  const day1Header = buildCenterHeaderSummary({
    gameState: day1State,
    day: 1,
    operationSignals: createInitialOperationSignalsState(1),
  });
  const day1Summary = buildCenterCitySummary({
    gameState: day1State,
    day: 1,
    operationSignals: createInitialOperationSignalsState(1),
    activeTargetTitle: day1Target.title,
  });
  const day1Advisor = buildCenterAdvisorSuggestion({
    gameState: day1State,
    day: 1,
    activeTarget: day1Target,
    dailyReward: day1Reward,
    citySummary: day1Summary,
    operationSignals: createInitialOperationSignalsState(1),
  });

  const day1Quick = buildCenterQuickActions({
    gameState: day1State,
    day: 1,
    activeTarget: day1Target,
    advisorSuggestion: day1Advisor,
    headerSummary: day1Header,
    hubQuickActionState: createInitialHubQuickActionState(1),
  });

  assert(checks, centerQuickActionsCoreFieldsValid(day1Quick), 'Day 1 core fields valid');
  assert(checks, centerQuickActionsDay1Safe(day1Quick), 'Day 1 safe locked grid');
  assert(checks, centerQuickActionsMaxItems(day1Quick), 'Day 1 max items');
  assert(checks, centerQuickActionsRouteSafety(day1Quick), 'Day 1 route safety');
  assert(checks, centerQuickActionsLinkedTarget(day1Quick), 'Day 1 linked target');

  const day3State = {
    ...day1State,
    city: { ...day1State.city, day: 3 },
    pilot: { ...day1State.pilot, currentPilotDay: 3 },
    player: { ...day1State.player, streakDays: 2 },
  };
  const day3QuickState = createInitialHubQuickActionState(3);
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

  const day3Quick = buildCenterQuickActions({
    gameState: day3State,
    day: 3,
    activeTarget: day3Target,
    advisorSuggestion: day3Advisor,
    hubQuickActionState: day3QuickState,
  });

  assert(checks, centerQuickActionsCoreFieldsValid(day3Quick), 'Day 3 core fields valid');
  assert(checks, centerQuickActionsMaxItems(day3Quick), 'Day 3 max items');
  assert(checks, centerQuickActionsUniqueIds(day3Quick), 'Day 3 unique ids');
  assert(checks, centerQuickActionsNoFakeSpend(day3Quick), 'Day 3 no fake resource spend');
  assert(checks, centerQuickActionsRouteSafety(day3Quick), 'Day 3 route safety');
  assert(
    checks,
    centerQuickActionsNotDuplicateTargetCta(day3Quick, day3Target.cta.label),
    'Day 3 not duplicate target CTA',
  );
  assert(
    checks,
    centerQuickActionsNotDuplicateAdvisor(
      day3Quick,
      day3Advisor.action?.label ?? '',
    ),
    'Day 3 not duplicate advisor action',
  );

  const day3Presentation = buildCenterHomePresentation({
    gameState: day3State,
    operationSignals: createInitialOperationSignalsState(3),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: day3QuickState,
  });

  assert(
    checks,
    day3Presentation.quickActions.items.length <= 4,
    'presentation max 4 items',
    `count=${day3Presentation.quickActions.items.length}`,
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
