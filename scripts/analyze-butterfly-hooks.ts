/**
 * Butterfly Hook Lite 7 günlük senaryo analizi.
 * Çalıştır: npm run analyze:butterfly-hooks
 */

import { createDay1Seed } from '@/core/content/day1Seed';
import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import { ensureDailyEventsForDay } from '@/core/game/ensureDailyEventsForDay';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import {
  activateHooksForDay,
  createDefaultButterflyHookState,
  expireOldButterflyHooks,
  tryRegisterButterflyHookAfterDecision,
} from '@/core/events/butterflyHookEngine';
import type { ButterflyHookState } from '@/core/events/butterflyHookTypes';

type ScenarioId =
  | 'fast_fix_week'
  | 'delay_and_monitor_week'
  | 'permanent_solution_week'
  | 'mixed_reasonable_week'
  | 'public_relief_social_week'
  | 'resource_protection_week';

type ScenarioMetrics = {
  scenario: ScenarioId;
  hooksCreated: number;
  hooksDue: number;
  hooksResolved: number;
  hooksExpired: number;
  maxActiveHooks: number;
  duplicateHooks: number;
  followUpEventsCreated: number;
  reportEchoLines: number;
  day1HooksCreated: number;
  hooksAfterDay7: number;
  averageDueDelay: number;
  scenarioWarnings: string[];
};

function decision(
  id: string,
  strategy: string,
  style?: EventDecision['decisionStyle'],
): EventDecision {
  return {
    id,
    title: id,
    description: 'test',
    style: 'balanced',
    effects: { publicSatisfaction: 0, budget: 0, morale: 0, risk: 0, xp: 1 },
    contentStrategyLabel: strategy,
    decisionStyle: style,
  };
}

function eventForDay(
  day: number,
  strategy: string,
  style?: EventDecision['decisionStyle'],
): EventCard {
  return {
    id: `ev-d${day}`,
    title: `Olay ${day}`,
    category: 'operasyon',
    riskLevel: 'medium',
    district: 'Sanayi',
    neighborhoodId: 'sanayi',
    description: 'Test',
    contextTag: 'test',
    urgencyHours: 8,
    decisions: [decision(`dec-d${day}`, strategy, style)],
    previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    day,
    contentProfileId: 'waste_sanayi_line',
    contentCategory: 'waste_container',
    districtIds: ['merkez'],
  };
}

function pickDecision(
  scenario: ScenarioId,
  day: number,
): { strategy: string; style?: EventDecision['decisionStyle'] } {
  switch (scenario) {
    case 'fast_fix_week':
      return { strategy: 'Hızlı çözüm', style: 'fast' };
    case 'delay_and_monitor_week':
      return day % 2 === 0
        ? { strategy: 'Kaynak korur', style: 'planned' }
        : { strategy: 'Kaynak korur', style: 'planned' };
    case 'permanent_solution_week':
      return { strategy: 'Kalıcı çözüm', style: 'permanent' };
    case 'public_relief_social_week':
      return { strategy: 'Sosyal rahatlama', style: 'communication' };
    case 'resource_protection_week':
      return { strategy: 'Kaynak korur', style: 'resource_saving' };
    case 'mixed_reasonable_week':
    default:
      if (day <= 2) return { strategy: 'Hızlı çözüm', style: 'fast' };
      if (day <= 4) return { strategy: 'Dengeli plan', style: 'partial' };
      if (day === 5) return { strategy: 'Kaynak korur', style: 'planned' };
      return { strategy: 'Kalıcı çözüm', style: 'permanent' };
  }
}

function runScenario(
  scenario: ScenarioId,
  priority: DailyPriorityKey,
): ScenarioMetrics {
  const seed = createDay1Seed();
  let hookState: ButterflyHookState = createDefaultButterflyHookState();
  let hooksCreated = 0;
  let hooksDue = 0;
  let hooksResolved = 0;
  let hooksExpired = 0;
  let maxActiveHooks = 0;
  let duplicateHooks = 0;
  let followUpEventsCreated = 0;
  let reportEchoLines = 0;
  let day1HooksCreated = 0;
  let hooksAfterDay7 = 0;
  let dueDelaySum = 0;
  let dueDelayCount = 0;
  const warnings: string[] = [];
  const seenKeys = new Set<string>();

  let gameState: GameState = {
    ...seed.gameState,
    pilot: {
      ...createDefaultPilotState(),
      status: 'active',
      selectedDistrictId: 'central',
      currentPilotDay: 1,
    },
  };

  for (let day = 1; day <= 7; day += 1) {
    gameState = {
      ...gameState,
      city: { ...gameState.city, day },
      pilot: { ...gameState.pilot, currentPilotDay: day, butterflyHookState: hookState },
    };

    hookState = expireOldButterflyHooks(hookState, day);
    hooksExpired += hookState.hooks.filter((h) => h.status === 'expired').length;

    if (day > 1) {
      const pick = pickDecision(scenario, day);
      const ev = eventForDay(day, pick.strategy, pick.style);
      const dec = decision(`dec-d${day}`, pick.strategy, pick.style);
      const before = hookState.hooks.length;
      const reg = tryRegisterButterflyHookAfterDecision({
        day,
        event: ev,
        decision: dec,
        hookState,
        dailyPriorityKey: priority,
        neighborhoodId: 'sanayi',
      });
      hookState = reg.state;
      if (reg.hook) {
        hooksCreated += 1;
        dueDelaySum += reg.hook.dueDay - reg.hook.createdDay;
        dueDelayCount += 1;
        const key = `${reg.hook.sourceEventId}:${reg.hook.triggerTag}`;
        if (seenKeys.has(key)) duplicateHooks += 1;
        seenKeys.add(key);
        if (reg.hook.kind === 'report_echo') reportEchoLines += 1;
        if (reg.hook.createdDay > 7) hooksAfterDay7 += 1;
      }
      if (day === 1 && hookState.hooks.length > before) {
        day1HooksCreated += hookState.hooks.length - before;
      }
    }

    const active = hookState.hooks.filter((h) => h.status === 'active').length;
    maxActiveHooks = Math.max(maxActiveHooks, active);

    const dueToday = activateHooksForDay(hookState, day);
    hooksDue += dueToday.length;

    gameState = {
      ...gameState,
      pilot: { ...gameState.pilot, butterflyHookState: hookState },
    };

    const ensured = ensureDailyEventsForDay(gameState, [], undefined, {
      dailyPriorityKey: priority,
    });
    gameState = ensured.gameState;
    hookState =
      normalizeHookFromPilot(gameState) ?? hookState;

    const injected = (ensured.dailyEventSet?.allEventIds ?? []).filter((id) =>
      id.startsWith('butterfly-hook-'),
    );
    followUpEventsCreated += injected.length;

    for (const id of injected) {
      hookState = {
        ...hookState,
        hooks: hookState.hooks.map((h) =>
          id.includes(h.id) ? { ...h, status: 'resolved', resolvedAt: Date.now() } : h,
        ),
      };
      hooksResolved += 1;
    }
  }

  return {
    scenario,
    hooksCreated,
    hooksDue,
    hooksResolved,
    hooksExpired,
    maxActiveHooks,
    duplicateHooks,
    followUpEventsCreated,
    reportEchoLines,
    day1HooksCreated,
    hooksAfterDay7,
    averageDueDelay: dueDelayCount > 0 ? dueDelaySum / dueDelayCount : 0,
    scenarioWarnings: warnings,
  };
}

function normalizeHookFromPilot(gameState: GameState): ButterflyHookState | null {
  return gameState.pilot.butterflyHookState ?? null;
}

const scenarios: Array<{ id: ScenarioId; priority: DailyPriorityKey }> = [
  { id: 'fast_fix_week', priority: 'operation_stability' },
  { id: 'delay_and_monitor_week', priority: 'resource_protection' },
  { id: 'permanent_solution_week', priority: 'resource_protection' },
  { id: 'mixed_reasonable_week', priority: 'operation_stability' },
  { id: 'public_relief_social_week', priority: 'public_relief' },
  { id: 'resource_protection_week', priority: 'resource_protection' },
];

let failCount = 0;
let warnCount = 0;

// eslint-disable-next-line no-console
console.log('=== Butterfly Hook Lite — 7 Day Analysis ===\n');

for (const { id, priority } of scenarios) {
  const m = runScenario(id, priority);
  // eslint-disable-next-line no-console
  console.log(`--- ${m.scenario} ---`);
  // eslint-disable-next-line no-console
  console.log(
    `hooksCreated=${m.hooksCreated} hooksDue=${m.hooksDue} resolved=${m.hooksResolved} expired=${m.hooksExpired}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `maxActive=${m.maxActiveHooks} duplicates=${m.duplicateHooks} followUpEvents=${m.followUpEventsCreated} reportEcho=${m.reportEchoLines}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `day1Hooks=${m.day1HooksCreated} afterDay7=${m.hooksAfterDay7} avgDueDelay=${m.averageDueDelay.toFixed(2)}`,
  );

  if (m.day1HooksCreated > 0) {
    failCount += 1;
    // eslint-disable-next-line no-console
    console.log('FAIL: day1HooksCreated > 0');
  }
  if (m.hooksAfterDay7 > 0) {
    failCount += 1;
    // eslint-disable-next-line no-console
    console.log('FAIL: hooksAfterDay7 > 0');
  }
  if (m.maxActiveHooks > 3) {
    failCount += 1;
    // eslint-disable-next-line no-console
    console.log('FAIL: maxActiveHooks > 3');
  }
  if (m.duplicateHooks > 0) {
    failCount += 1;
    // eslint-disable-next-line no-console
    console.log('FAIL: duplicateHooks > 0');
  }
  if (m.followUpEventsCreated > 3) {
    warnCount += 1;
    // eslint-disable-next-line no-console
    console.log('WARN: followUpEventsCreated > 3 per scenario');
  }
  if (id === 'permanent_solution_week' && m.hooksCreated > 3) {
    warnCount += 1;
    // eslint-disable-next-line no-console
    console.log('WARN: permanent_solution_week hook count high');
  }
  // eslint-disable-next-line no-console
  console.log('');
}

if (failCount > 0) {
  // eslint-disable-next-line no-console
  console.error(`Analysis finished with ${failCount} FAIL condition(s).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(`Analysis PASS (${warnCount} WARN).`);
