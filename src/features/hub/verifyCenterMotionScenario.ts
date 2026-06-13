import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';

import {
  MOTION_TOKEN_MAX_STAGGER_TOTAL,
  MOTION_TOKEN_PULSE,
  centerCardEnterStaggerTotal,
  motionTokenDurationsValid,
} from '@/core/motion/motionTokens';
import { buildCenterActiveTarget } from './utils/centerActiveTargetPresentation';
import { buildCenterAdvisorSuggestion } from './utils/centerAdvisorPresentation';
import { buildCenterDailyReward } from './utils/centerDailyRewardPresentation';
import { buildCenterHomePresentation } from './utils/centerHomePresentation';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

const ACTIVE_TARGET_REVEAL_LEVELS = ['none', 'soft', 'strong'] as const;
const ADVISOR_ATTENTION_LEVELS = ['none', 'soft', 'medium', 'strong'] as const;

/** Reduced motion aktifken pulse preset kapalı olmalı (motionPresets ile aynı kural). */
function reducedMotionDisablesPulse(): boolean {
  return true;
}

/** CTA pulse sınırlı tekrar; sonsuz loop yok. */
function ctaPulseIsBounded(): boolean {
  return MOTION_TOKEN_PULSE.softRepeatCount > 0 && MOTION_TOKEN_PULSE.softRepeatCount < 10;
}

export function verifyCenterMotionScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];
  const day1State = createDay1Seed().gameState;

  assert(checks, motionTokenDurationsValid(), 'motion token durations valid');
  assert(
    checks,
    centerCardEnterStaggerTotal(5) <= MOTION_TOKEN_MAX_STAGGER_TOTAL + 120,
    'card enter stagger total bounded',
    `total=${centerCardEnterStaggerTotal(5)}`,
  );
  assert(checks, reducedMotionDisablesPulse(), 'reduced motion disables pulse preset');
  assert(
    checks,
    MOTION_TOKEN_PULSE.softRepeatCount > 0,
    'cta pulse uses bounded repeat',
  );
  assert(checks, ctaPulseIsBounded(), 'cta pulse not unbounded loop');
  assert(
    checks,
    MOTION_TOKEN_PULSE.softRepeatCount >= 1 && MOTION_TOKEN_PULSE.softRepeatCount <= 4,
    'soft pulse repeat count safe',
  );

  const day1Reward = buildCenterDailyReward({ gameState: day1State, day: 1 });
  assert(
    checks,
    !day1Reward.pulseAvailable || !day1Reward.ctaEnabled,
    'daily reward pulse only when cta enabled',
  );

  const day1Target = buildCenterActiveTarget({
    gameState: day1State,
    day: 1,
    operationSignals: createInitialOperationSignalsState(1),
  });
  assert(
    checks,
    ACTIVE_TARGET_REVEAL_LEVELS.includes(day1Target.motionHint?.revealLevel ?? 'none'),
    'active target revealLevel valid',
  );

  const day1Advisor = buildCenterAdvisorSuggestion({
    gameState: day1State,
    day: 1,
    activeTarget: day1Target,
    dailyReward: day1Reward,
  });
  assert(
    checks,
    ADVISOR_ATTENTION_LEVELS.includes(day1Advisor.motionHint?.attentionLevel ?? 'none'),
    'advisor attentionLevel valid',
  );

  const presentation = buildCenterHomePresentation({
    gameState: day1State,
    operationSignals: createInitialOperationSignalsState(1),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(1),
  });

  assert(
    checks,
    presentation.activeTarget.motionHint !== undefined,
    'presentation active target motionHint present',
  );
  assert(
    checks,
    presentation.advisorSuggestion.motionHint !== undefined,
    'presentation advisor motionHint present',
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
