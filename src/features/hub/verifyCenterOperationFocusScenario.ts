import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';

import { buildCenterActiveTarget } from './utils/centerActiveTargetPresentation';
import { buildCenterAdvisorSuggestion } from './utils/centerAdvisorPresentation';
import { buildCenterCitySummary } from './utils/centerCitySummaryPresentation';
import { buildCenterDailyReward } from './utils/centerDailyRewardPresentation';
import { buildCenterHomePresentation } from './utils/centerHomePresentation';
import {
  buildCenterOperationFocus,
  centerOperationFocusActiveDomainRepresented,
  centerOperationFocusCoreFieldsValid,
  centerOperationFocusDay1Locked,
  centerOperationFocusMaxItems,
  centerOperationFocusNoFakeRisk,
  centerOperationFocusNotDuplicateAdvisor,
  centerOperationFocusNotDuplicateTitle,
  centerOperationFocusRouteSafety,
  centerOperationFocusUniqueDomains,
} from './utils/centerOperationFocusPresentation';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

const DISPLAY_MODES = ['compact', 'carousel', 'grid', 'locked', 'empty'] as const;
const TONES = ['success', 'stable', 'warning', 'urgent', 'locked', 'neutral'] as const;
const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

export function verifyCenterOperationFocusScenario(): {
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

  const day1Focus = buildCenterOperationFocus({
    gameState: day1State,
    day: 1,
    activeTarget: day1Target,
    advisorSuggestion: day1Advisor,
    citySummary: day1Summary,
    operationSignals: createInitialOperationSignalsState(1),
  });

  assert(checks, centerOperationFocusCoreFieldsValid(day1Focus), 'Day 1 core fields valid');
  assert(checks, centerOperationFocusDay1Locked(day1Focus), 'Day 1 locked teaser state');
  assert(checks, centerOperationFocusMaxItems(day1Focus), 'Day 1 max items');
  assert(checks, DISPLAY_MODES.includes(day1Focus.displayMode), 'Day 1 display mode valid');

  const day3State = {
    ...day1State,
    city: { ...day1State.city, day: 3 },
    pilot: { ...day1State.pilot, currentPilotDay: 3 },
    player: { ...day1State.player, streakDays: 2 },
  };
  const day3Signals = createInitialOperationSignalsState(3);
  const day3Reward = buildCenterDailyReward({ gameState: day3State, day: 3 });
  const day3Target = buildCenterActiveTarget({
    gameState: day3State,
    day: 3,
    operationSignals: day3Signals,
    dailyRewardHelperText: day3Reward.helperText,
  });
  const day3Summary = buildCenterCitySummary({
    gameState: day3State,
    day: 3,
    operationSignals: day3Signals,
    activeTargetTitle: day3Target.title,
  });
  const day3Advisor = buildCenterAdvisorSuggestion({
    gameState: day3State,
    day: 3,
    activeTarget: day3Target,
    dailyReward: day3Reward,
    citySummary: day3Summary,
    operationSignals: day3Signals,
    hubEceContextLine: 'Ece: önce ulaşım hattını güçlendir.',
  });

  const day3Focus = buildCenterOperationFocus({
    gameState: day3State,
    day: 3,
    activeTarget: day3Target,
    advisorSuggestion: day3Advisor,
    citySummary: day3Summary,
    operationSignals: day3Signals,
    operationSignalLabels: ['Yükselen Talep'],
  });

  assert(checks, centerOperationFocusCoreFieldsValid(day3Focus), 'Day 3 core fields valid');
  assert(checks, centerOperationFocusMaxItems(day3Focus), 'Day 3 max items');
  assert(checks, centerOperationFocusUniqueDomains(day3Focus), 'Day 3 unique domains');
  assert(
    checks,
    centerOperationFocusActiveDomainRepresented(day3Focus, day3Target.domain),
    'Day 3 active target domain represented',
  );
  assert(
    checks,
    centerOperationFocusNotDuplicateTitle(day3Focus, day3Target.title),
    'Day 3 not duplicate active target title',
  );
  assert(
    checks,
    centerOperationFocusNotDuplicateAdvisor(day3Focus, day3Advisor.recommendation),
    'Day 3 not duplicate Ece recommendation',
  );
  assert(checks, centerOperationFocusRouteSafety(day3Focus), 'Day 3 route safety');
  assert(
    checks,
    day3Focus.items.every((item) => TONES.includes(item.tone)),
    'Day 3 tone enum valid',
  );
  assert(
    checks,
    day3Focus.items.every((item) => PRIORITIES.includes(item.priority)),
    'Day 3 priority enum valid',
  );

  const day3Presentation = buildCenterHomePresentation({
    gameState: day3State,
    operationSignals: day3Signals,
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(3),
    hubEceContextLine: 'Ece: önce ulaşım hattını güçlendir.',
  });

  assert(
    checks,
    day3Presentation.operationFocus.visibility === 'visible',
    'presentation Day 3 focus visible',
  );
  assert(
    checks,
    centerOperationFocusMaxItems(day3Presentation.operationFocus),
    'presentation max items',
  );

  const emptyFocus = buildCenterOperationFocus({
    gameState: day3State,
    day: 3,
    activeTarget: { ...day3Target, domain: 'general', status: 'empty' },
    advisorSuggestion: day3Advisor,
    citySummary: day3Summary,
    operationSignals: null,
  });

  assert(checks, centerOperationFocusNoFakeRisk(emptyFocus), 'empty state no fake urgent risk');
  assert(
    checks,
    emptyFocus.displayMode === 'empty' || emptyFocus.items.length > 0,
    'empty state renders safely',
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
