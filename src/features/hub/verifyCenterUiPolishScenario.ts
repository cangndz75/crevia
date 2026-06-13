import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';

import { buildCenterHomePresentation } from './utils/centerHomePresentation';
import {
  auditCenterUiPolish,
  centerUiPolishCalmDayUxValid,
  centerUiPolishCompletedUxValid,
  centerUiPolishDay1LimitsValid,
  centerUiPolishDensityValid,
  centerUiPolishFirstFoldValid,
  centerUiPolishHiddenModulesLeaveNoGap,
  centerUiPolishModuleOrderValid,
  centerUiPolishMotionCapValid,
  centerUiPolishReducedMotionPresetSafe,
} from './utils/centerUiPolishPolicy';
import {
  centerPresentationAccessibilityValid,
  centerPresentationNoCriticalDuplicates,
  centerPresentationNoUnsafeText,
  centerPresentationRouteSafetyValid,
} from './utils/centerStatePolicy';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

export function verifyCenterUiPolishScenario(): {
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

  assert(checks, centerUiPolishModuleOrderValid(day1), 'module order');
  assert(checks, centerUiPolishDensityValid(day1), 'density limits Day 1');
  assert(checks, centerUiPolishFirstFoldValid(day1), 'first fold Day 1');
  assert(checks, centerUiPolishDay1LimitsValid(day1), 'Day 1 teaser limits');
  assert(checks, centerUiPolishMotionCapValid(1), 'Day 1 motion cap');
  assert(checks, centerUiPolishReducedMotionPresetSafe(), 'pulse preset bounded');
  assert(checks, centerPresentationNoUnsafeText(day1), 'Day 1 safe text');
  assert(checks, centerPresentationRouteSafetyValid(day1), 'Day 1 route safety');
  assert(checks, centerPresentationAccessibilityValid(day1), 'Day 1 accessibility');
  assert(checks, centerUiPolishHiddenModulesLeaveNoGap(day1), 'Day 1 hidden layout');

  const day1Audit = auditCenterUiPolish(day1, 1);
  assert(checks, day1Audit.ok, 'Day 1 full audit', day1Audit.issues.join(', '));

  const day3State = {
    ...day1State,
    city: { ...day1State.city, day: 3 },
    pilot: { ...day1State.pilot, currentPilotDay: 3 },
    player: { ...day1State.player, streakDays: 2 },
  };

  const calmDay = buildCenterHomePresentation({
    gameState: day3State,
    operationSignals: createInitialOperationSignalsState(3),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(3),
  });

  assert(checks, centerUiPolishCalmDayUxValid(calmDay), 'calm day UX');
  assert(checks, centerUiPolishDensityValid(calmDay), 'density limits Day 3');
  assert(checks, centerPresentationNoCriticalDuplicates(calmDay), 'no critical duplicates');

  const completed: typeof calmDay = {
    ...calmDay,
    activeTarget: {
      ...calmDay.activeTarget,
      status: 'completed',
      cta: {
        label: 'Sonucu Gör',
        route: '/reports',
        actionKey: 'view_result',
        enabled: true,
      },
    },
    dailyReward: {
      ...calmDay.dailyReward,
      claimState: 'claimed',
      ctaEnabled: false,
      claimedToday: true,
    },
  };

  assert(checks, centerUiPolishCompletedUxValid(completed), 'completed UX guides next');
  assert(checks, centerUiPolishMotionCapValid(3), 'Day 3 motion cap');

  const richDay = buildCenterHomePresentation({
    gameState: day3State,
    operationSignals: createInitialOperationSignalsState(3),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(3),
    hubDistrictReportLine: 'Mahalle güveni bugünkü kararla değişti.',
    hubStoryChainLine: 'Mahalle hafızası devam ediyor.',
  });

  const richAudit = auditCenterUiPolish(richDay, 3);
  assert(checks, richAudit.ok, 'rich day audit', richAudit.issues.join(', '));

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
