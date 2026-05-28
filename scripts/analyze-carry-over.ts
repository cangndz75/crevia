/**
 * Carry-over Signals Lite — 7 günlük senaryo analizi.
 * Çalıştır: npm run analyze:carry-over
 */

import { createDay1Seed } from '@/core/content/day1Seed';
import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import { ensureDailyEventsForDay } from '@/core/game/ensureDailyEventsForDay';
import { finalizeDailyPriority, createNotSelectedPriorityState } from '@/core/dailyPriority/dailyPriorityEngine';
import type { DailyPriorityKey, DailyPriorityState } from '@/core/dailyPriority/dailyPriorityTypes';
import {
  buildCarryOverSignalsForDay,
  findOverlappingButterflyHook,
  getCarryOverWeightDeltaForEvent,
} from '@/core/carryOver/carryOverEngine';
import {
  CARRY_OVER_MAX_NEGATIVE_FRACTION,
  CARRY_OVER_MAX_POSITIVE_FRACTION,
  CARRY_OVER_TOTAL_BIAS_CLAMP,
} from '@/core/carryOver/carryOverConstants';
import { buildCarryOverHubLines, buildCarryOverReportLines } from '@/core/carryOver/carryOverPresentation';
import { createDefaultButterflyHookState } from '@/core/events/butterflyHookEngine';
import type { ButterflyHook } from '@/core/events/butterflyHookTypes';
import type { GameState } from '@/core/models/GameState';
import { pilotEvents } from '@/core/content/pilotEvents';

type ScenarioId =
  | 'fulfilled_public_relief_week'
  | 'failed_public_relief_week'
  | 'fulfilled_operation_week'
  | 'failed_operation_week'
  | 'fulfilled_resource_week'
  | 'failed_resource_week'
  | 'mixed_priority_week'
  | 'butterfly_overlap_week';

function finalize(
  day: number,
  key: DailyPriorityKey,
  status: 'fulfilled' | 'partial' | 'failed',
  score: number,
): DailyPriorityState {
  const base = createNotSelectedPriorityState(day);
  return {
    ...base,
    selectedKey: key,
    status,
    score,
    progressPercent: score,
    selectedAt: Date.now(),
    finalResult: {
      status,
      title: status,
      text: `${key} ${status}`,
      xpBonus: status === 'fulfilled' ? 15 : 8,
    },
  };
}

function scenarioKey(id: ScenarioId, day: number): DailyPriorityKey {
  switch (id) {
    case 'fulfilled_public_relief_week':
    case 'failed_public_relief_week':
      return 'public_relief';
    case 'fulfilled_operation_week':
    case 'failed_operation_week':
      return 'operation_stability';
    case 'fulfilled_resource_week':
    case 'failed_resource_week':
      return 'resource_protection';
    case 'mixed_priority_week':
      return day % 2 === 0 ? 'public_relief' : 'operation_stability';
    case 'butterfly_overlap_week':
      return 'public_relief';
    default:
      return 'public_relief';
  }
}

function scenarioStatus(id: ScenarioId): 'fulfilled' | 'partial' | 'failed' {
  if (id.startsWith('fulfilled')) return 'fulfilled';
  if (id.startsWith('failed')) return 'failed';
  if (id === 'mixed_priority_week') return 'partial';
  return 'failed';
}

function runScenario(id: ScenarioId) {
  const seed = createDay1Seed();
  let gameState: GameState = {
    ...seed.gameState,
    pilot: {
      ...createDefaultPilotState(),
      status: 'active',
      selectedDistrictId: 'central',
      currentPilotDay: 1,
      butterflyHookState: createDefaultButterflyHookState(),
    },
  };

  const dailyPriorityByDay: Record<number, DailyPriorityState> = {};
  let signalsCreated = 0;
  let positiveSignals = 0;
  let warningSignals = 0;
  let mixedSignals = 0;
  let mediumStrengthSignals = 0;
  let eventBiasApplications = 0;
  let maxBiasDelta = 0;
  let minBiasDelta = 0;
  let totalBiasClampViolations = 0;
  let duplicateWithButterflyHooks = 0;
  let butterflyOverlapSignals = 0;
  let suppressedCarryOverBias = 0;
  let biasAppliedWithDueHook = 0;
  let signalShownOnDay1 = 0;
  let reportLinesCreated = 0;
  let hubLinesCreated = 0;
  const warnings: string[] = [];
  let eventsPerDayTotal = 0;
  const titles = new Set<string>();

  for (let day = 1; day <= 7; day += 1) {
    const prevDay = day - 1;
    if (prevDay >= 1) {
      const key = scenarioKey(id, prevDay);
      const st = scenarioStatus(id);
      const score = st === 'fulfilled' ? 85 : st === 'partial' ? 55 : 25;
      dailyPriorityByDay[prevDay] = finalize(prevDay, key, st, score);
    }

    let butterflyHooks = gameState.pilot.butterflyHookState?.hooks ?? [];
    if (id === 'butterfly_overlap_week' && day === 4) {
      const hook: ButterflyHook = {
        id: 'overlap-hook',
        source: 'decision',
        kind: 'follow_up_event',
        status: 'active',
        createdDay: 3,
        dueDay: 4,
        expiresDay: 7,
        severity: 'medium',
        title: 'Takip',
        description: 'd',
        triggerTag: 'social_follow',
        neighborhoodId: 'merkez',
        category: 'social_pressure',
        createdAt: 1,
      };
      butterflyHooks = [...butterflyHooks, hook];
      gameState = {
        ...gameState,
        pilot: {
          ...gameState.pilot,
          butterflyHookState: { hooks: butterflyHooks, lastProcessedDay: 3 },
        },
      };
    }

    const signals = buildCarryOverSignalsForDay({
      day,
      previousDay: prevDay,
      dailyPriorityByDay,
      dailyGoalsByDay: {},
      butterflyHookState: gameState.pilot.butterflyHookState,
      focalNeighborhoodId: 'merkez',
    });

    if (day === 1 && signals.length > 0) signalShownOnDay1 += signals.length;
    signalsCreated += signals.length;
    for (const s of signals) {
      if (s.tone === 'positive') positiveSignals += 1;
      if (s.tone === 'warning') warningSignals += 1;
      if (s.tone === 'mixed') mixedSignals += 1;
      if (s.strength === 'medium') mediumStrengthSignals += 1;
      if (s.kind === 'butterfly_overlap') {
        butterflyOverlapSignals += 1;
      }
      if (s.eventWeightHint) {
        const overlapHook = findOverlappingButterflyHook(
          s,
          { hooks: butterflyHooks, lastProcessedDay: day },
          day,
        );
        if (overlapHook) {
          let biasApplied = false;
          for (const card of pilotEvents.slice(0, 20)) {
            if (getCarryOverWeightDeltaForEvent(card, [s]) !== 0) {
              biasApplied = true;
              break;
            }
          }
          if (biasApplied) {
            duplicateWithButterflyHooks += 1;
            biasAppliedWithDueHook += 1;
          } else {
            suppressedCarryOverBias += 1;
          }
        }
      }
    }

    hubLinesCreated += buildCarryOverHubLines(signals).length;
    reportLinesCreated += buildCarryOverReportLines(signals).length;

    gameState = {
      ...gameState,
      city: { ...gameState.city, day },
      pilot: { ...gameState.pilot, currentPilotDay: day },
    };

    const ensured = ensureDailyEventsForDay(gameState, [], pilotEvents, {
      dailyPriorityKey: dailyPriorityByDay[day]?.selectedKey,
      carryOverSignals: signals,
    });
    gameState = ensured.gameState;
    const count = ensured.dailyEventSet?.allEventIds.length ?? 0;
    eventsPerDayTotal += count;

    for (const eid of ensured.dailyEventSet?.allEventIds ?? []) {
      const card = pilotEvents.find((e) => e.id === eid);
      if (card?.title) titles.add(card.title);
    }

    for (const card of pilotEvents.slice(0, 20)) {
      const delta = getCarryOverWeightDeltaForEvent(card, signals);
      if (delta !== 0) {
        eventBiasApplications += 1;
        maxBiasDelta = Math.max(maxBiasDelta, delta);
        minBiasDelta = Math.min(minBiasDelta, delta);
        const frac = delta / 100;
        if (frac > CARRY_OVER_MAX_POSITIVE_FRACTION + 0.001) {
          totalBiasClampViolations += 1;
        }
        if (frac < CARRY_OVER_MAX_NEGATIVE_FRACTION - 0.001) {
          totalBiasClampViolations += 1;
        }
        if (Math.abs(frac) > CARRY_OVER_TOTAL_BIAS_CLAMP + 0.001) {
          totalBiasClampViolations += 1;
        }
      }
    }
  }

  return {
    scenario: id,
    signalsCreated,
    positiveSignals,
    warningSignals,
    mixedSignals,
    mediumStrengthSignals,
    eventBiasApplications,
    maxBiasDelta,
    minBiasDelta,
    totalBiasClampViolations,
    duplicateWithButterflyHooks,
    butterflyOverlapSignals,
    suppressedCarryOverBias,
    biasAppliedWithDueHook,
    eventsPerDayAvg: eventsPerDayTotal / 7,
    uniqueTitles: titles.size,
    signalShownOnDay1,
    reportLinesCreated,
    hubLinesCreated,
    warnings,
  };
}

const scenarios: ScenarioId[] = [
  'fulfilled_public_relief_week',
  'failed_public_relief_week',
  'fulfilled_operation_week',
  'failed_operation_week',
  'fulfilled_resource_week',
  'failed_resource_week',
  'mixed_priority_week',
  'butterfly_overlap_week',
];

let failCount = 0;
let warnCount = 0;

// eslint-disable-next-line no-console
console.log('=== Carry-over Signals Lite — 7 Day Analysis ===\n');

for (const id of scenarios) {
  const m = runScenario(id);
  // eslint-disable-next-line no-console
  console.log(`--- ${m.scenario} ---`);
  // eslint-disable-next-line no-console
  console.log(
    `signals=${m.signalsCreated} +${m.positiveSignals} !${m.warningSignals} ~${m.mixedSignals} medium=${m.mediumStrengthSignals}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `biasApps=${m.eventBiasApplications} maxΔ=${m.maxBiasDelta} minΔ=${m.minBiasDelta} clampViol=${m.totalBiasClampViolations} butterflyDup=${m.duplicateWithButterflyHooks} overlap=${m.butterflyOverlapSignals} suppressed=${m.suppressedCarryOverBias} biasWithHook=${m.biasAppliedWithDueHook}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `day1=${m.signalShownOnDay1} eventsAvg=${m.eventsPerDayAvg.toFixed(1)} hub=${m.hubLinesCreated} report=${m.reportLinesCreated}`,
  );

  if (m.signalShownOnDay1 > 0) {
    failCount += 1;
    // eslint-disable-next-line no-console
    console.log('FAIL: day1 signals');
  }
  if (m.maxBiasDelta > 3) {
    failCount += 1;
    // eslint-disable-next-line no-console
    console.log('FAIL: maxBiasDelta');
  }
  if (m.minBiasDelta < -2) {
    failCount += 1;
    // eslint-disable-next-line no-console
    console.log('FAIL: minBiasDelta');
  }
  if (m.totalBiasClampViolations > 0) {
    failCount += 1;
    // eslint-disable-next-line no-console
    console.log('FAIL: clamp violations');
  }
  if (m.duplicateWithButterflyHooks > 0) {
    failCount += 1;
    // eslint-disable-next-line no-console
    console.log('FAIL: butterfly duplicate bias');
  }
  if (m.eventsPerDayAvg > 6) {
    failCount += 1;
    // eslint-disable-next-line no-console
    console.log('FAIL: event count arttı');
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
