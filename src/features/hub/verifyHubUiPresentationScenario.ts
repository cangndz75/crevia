import { selectHubQuickActionCards } from '@/core/hubQuickActions';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { mobileSafeLine } from '@/core/onboarding/onboardingPresentation';
import type { LiveFlowEntry } from '@/core/liveFlow';

import {
  areAllHubQuickActionsLocked,
  clampHubTodayFlowLines,
  DAY1_FLOW_PLACEHOLDER_LINE,
  DAY1_FLOW_TIMELINE_PREVIEW_LINES,
  HUB_TODAY_FLOW_MAX_LINES,
  resolveHubQuickActionsLayoutMode,
} from './hubUiPresentation';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

export function verifyHubUiPresentationScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  const day1Cards = selectHubQuickActionCards({
    hubQuickActionState: createInitialHubQuickActionState(1),
    currentDay: 1,
    day1Disabled: true,
  });

  assert(
    checks,
    areAllHubQuickActionsLocked(day1Cards),
    'Day 1 all quick actions locked',
  );
  assert(
    checks,
    resolveHubQuickActionsLayoutMode(day1Cards, true) === 'locked-rail',
    'Day 1 quick actions locked-rail mode',
  );

  const day2Cards = selectHubQuickActionCards({
    hubQuickActionState: createInitialHubQuickActionState(2),
    currentDay: 2,
    day1Disabled: false,
  });
  assert(
    checks,
    resolveHubQuickActionsLayoutMode(day2Cards, false) === 'compact-rail',
    'Day 2 active quick actions compact-rail mode',
  );
  assert(
    checks,
    !areAllHubQuickActionsLocked(day2Cards),
    'Day 2 quick actions not all locked',
  );

  const sampleLines: LiveFlowEntry[] = [
    {
      id: 'a',
      day: 1,
      timestampOrder: 1,
      type: 'event_created',
      title: 'one',
      text: 'one',
      tone: 'neutral',
    },
    {
      id: 'b',
      day: 1,
      timestampOrder: 2,
      type: 'decision_applied',
      title: 'two',
      text: 'two',
      tone: 'info',
    },
    {
      id: 'c',
      day: 1,
      timestampOrder: 3,
      type: 'event_resolved',
      title: 'three',
      text: 'three',
      tone: 'positive',
    },
    {
      id: 'd',
      day: 1,
      timestampOrder: 4,
      type: 'report_ready',
      title: 'four',
      text: 'four',
      tone: 'warning',
    },
  ];
  const clamped = clampHubTodayFlowLines(sampleLines);
  assert(
    checks,
    clamped.length === HUB_TODAY_FLOW_MAX_LINES,
    'HubTodayFlowStrip max 3 lines',
    `count=${clamped.length}`,
  );

  assert(
    checks,
    DAY1_FLOW_PLACEHOLDER_LINE.length > 0,
    'Day 1 flow placeholder single line',
  );
  assert(
    checks,
    DAY1_FLOW_TIMELINE_PREVIEW_LINES.length === 2,
    'Day 1 flow timeline preview rows',
  );

  const truncated = mobileSafeLine(
    'Kararlarından sonra gelişmeler burada kısa satırlar halinde görünür ve taşmamalı.',
    96,
  );
  assert(
    checks,
    truncated.length <= 97,
    'Onboarding hint mobileSafeLine truncate',
    `len=${truncated.length}`,
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
