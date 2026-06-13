import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';

import {
  CENTER_HOME_MODULE_ORDER,
  buildCenterHomePresentation,
  centerHomeAdvisorAndPlanShareText,
  centerHomeHasDuplicateModuleKeys,
} from './utils/centerHomePresentation';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

export function verifyCenterHomeIaScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  const day1State = createDay1Seed().gameState;
  const day1 = buildCenterHomePresentation({
    gameState: day1State,
    operationSignals: createInitialOperationSignalsState(1),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(1),
  });

  assert(
    checks,
    day1.moduleOrder.join('|') === CENTER_HOME_MODULE_ORDER.join('|'),
    'module order matches final IA',
  );
  assert(
    checks,
    !centerHomeHasDuplicateModuleKeys(day1),
    'no duplicate module keys',
  );
  assert(
    checks,
    day1.visibilityFlags.operationFocus === 'locked',
    'Day 1 operation focus locked',
  );
  assert(
    checks,
    day1.visibilityFlags.quickActions === 'locked',
    'Day 1 quick actions locked',
  );
  assert(
    checks,
    day1.activeTarget.visibility === 'visible',
    'Day 1 active target visible',
  );
  assert(
    checks,
    day1.quickActions.items.length <= 4,
    'quick actions capped at safe count',
    `count=${day1.quickActions.items.length}`,
  );
  assert(
    checks,
    !centerHomeAdvisorAndPlanShareText(day1),
    'Day 1 Ece and plan do not duplicate text',
  );

  const day1NoSignals = buildCenterHomePresentation({
    gameState: day1State,
    operationSignals: createInitialOperationSignalsState(1),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(1),
    hubTomorrowRisk: undefined,
    hubImpactExplanationLine: undefined,
  });

  assert(
    checks,
    day1NoSignals.operationSignals.visibility === 'empty' ||
      day1NoSignals.operationSignals.signals.length <= 2,
    'empty or compact operation signals on Day 1 without risk lines',
  );

  const day3State = {
    ...day1State,
    city: { ...day1State.city, day: 3 },
    pilot: { ...day1State.pilot, currentPilotDay: 3 },
    player: { ...day1State.player, streakDays: 2 },
  };
  const day3 = buildCenterHomePresentation({
    gameState: day3State,
    operationSignals: createInitialOperationSignalsState(3),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(3),
    hubTomorrowRisk: {
      id: 'test-risk',
      kind: 'generic_city_preparation',
      title: 'Yükselen Talep',
      mainLine: 'Mahallede hizmet talebi artıyor.',
      tone: 'watch',
      priority: 'medium',
      sourceSignals: ['fallback'],
      shouldShowInReport: true,
      shouldShowInHub: true,
      shouldShowAsCompact: false,
      maxVisibleLines: 2,
    },
    hubEceContextLine: 'Ece: önce ulaşım hattını güçlendir.',
    hubCityJournal: {
      title: 'Bugünkü Plan',
      primaryLine: 'Gün planı operasyon merkezinde.',
      secondaryLine: null,
      visible: true,
    },
  });

  assert(
    checks,
    day3.visibilityFlags.operationFocus === 'visible',
    'Day 3 operation focus visible',
  );
  assert(
    checks,
    day3.operationSignals.signals.length <= 3,
    'operation signals max 3',
    `count=${day3.operationSignals.signals.length}`,
  );
  assert(
    checks,
    !centerHomeAdvisorAndPlanShareText(day3),
    'Day 3 Ece and recommended plan differ',
  );

  const claimedReward = buildCenterHomePresentation({
    gameState: {
      ...day3State,
      player: { ...day3State.player, streakDays: 3 },
    },
    operationSignals: createInitialOperationSignalsState(3),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(3),
  });

  assert(
    checks,
    claimedReward.dailyReward.claimState === 'claimed' ||
      claimedReward.dailyReward.days.some((day) => day.state === 'done'),
    'daily reward distinguishes claimed/done states',
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
