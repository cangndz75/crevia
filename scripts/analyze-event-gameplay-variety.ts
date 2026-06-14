/**
 * Event gameplay variety analizi.
 * Çalıştır: npm run analyze:event-gameplay-variety
 */

import { createDay1Seed } from '@/core/content/day1Seed';
import { pilotEvents } from '@/core/content/pilotEvents';
import { mergeEventCatalogs } from '@/core/districts/districtEventIntegration';
import {
  buildProfilesForEventIds,
  resolveEventGameplayPressureDomain,
} from '@/core/eventVariety/eventGameplayVarietyModel';
import type {
  EventGameplayDecisionShape,
  EventGameplayPressureKind,
} from '@/core/eventVariety/eventGameplayVarietyTypes';
import { generateDailyEventSet } from '@/core/game/generateDailyEventSet';
import { appendPilotEventContentMemory } from '@/core/events/eventVariationEngine';
import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { getRhythmPilotDistrictForDay } from '@/core/events/pilotRhythmEngine';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import { buildPostPilotLightGameState } from '@/core/postPilot/postPilotLoopAudit';
import { ensurePostPilotDailyEventsForDay } from '@/core/postPilot/postPilotEventEngine';
import { normalizePostPilotOperationState } from '@/core/postPilot/postPilotOperationSeed';

type ScenarioId =
  | 'balanced_priority_week'
  | 'public_relief_focus'
  | 'operation_stability_focus'
  | 'resource_protection_focus'
  | 'passive_player'
  | 'wrong_priority_player';

type ScenarioConfig = {
  id: ScenarioId;
  priorityForDay: (day: number) => DailyPriorityKey | undefined;
};

const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'balanced_priority_week',
    priorityForDay: (day) =>
      day % 3 === 1
        ? 'public_relief'
        : day % 3 === 2
          ? 'operation_stability'
          : 'resource_protection',
  },
  {
    id: 'public_relief_focus',
    priorityForDay: () => 'public_relief',
  },
  {
    id: 'operation_stability_focus',
    priorityForDay: () => 'operation_stability',
  },
  {
    id: 'resource_protection_focus',
    priorityForDay: () => 'resource_protection',
  },
  {
    id: 'passive_player',
    priorityForDay: () => undefined,
  },
  {
    id: 'wrong_priority_player',
    priorityForDay: (day) => (day % 2 === 0 ? 'resource_protection' : 'public_relief'),
  },
];

type ScenarioGameplayResult = {
  id: ScenarioId;
  totalEvents: number;
  uniqueDecisionShapes: number;
  uniquePrimaryPressures: number;
  sameDaySameShapeDays: number;
  consecutivePrimaryPressureRuns: number;
  day8PlusSameShapePairs: number;
  decisionShapeDistribution: Record<string, number>;
  primaryPressureDistribution: Record<string, number>;
  verdict: 'PASS' | 'WARN' | 'FAIL';
  notes: string[];
};

function cloneEvents(events: EventCard[]): EventCard[] {
  return events.map((e) => ({
    ...e,
    decisions: e.decisions.map((d) => ({ ...d })),
  }));
}

function simulateScenario(config: ScenarioConfig): ScenarioGameplayResult {
  const bundle = createDay1Seed();
  let gameState: GameState = bundle.gameState;
  let eventPool: EventCard[] = [];

  const allProfiles: ReturnType<typeof buildProfilesForEventIds> = [];
  let sameDaySameShapeDays = 0;
  let consecutivePrimaryPressureRuns = 0;
  let lastDayPrimary: EventGameplayPressureKind | null = null;
  let dayRunLength = 0;

  const decisionShapeDistribution: Record<string, number> = {};
  const primaryPressureDistribution: Record<string, number> = {};

  for (let day = 1; day <= 7; day += 1) {
    const catalog = cloneEvents(mergeEventCatalogs(pilotEvents, eventPool));
    const dailySet = generateDailyEventSet({
      gameState: {
        ...gameState,
        pilot: {
          ...gameState.pilot,
          currentPilotDay: day,
          selectedDistrictId: getRhythmPilotDistrictForDay(day),
        },
      },
      day,
      districtId: getRhythmPilotDistrictForDay(day),
      events: catalog,
      containerState: createInitialContainerState(day),
      vehicleState: createInitialVehicleState(day),
      dailyPriorityKey: config.priorityForDay(day),
    });

    eventPool = catalog;
    gameState = {
      ...gameState,
      pilot: appendPilotEventContentMemory(
        {
          ...gameState.pilot,
          currentPilotDay: day,
          dailyEventSet: dailySet,
        },
        catalog,
        dailySet,
      ),
    };

    const dayCards = dailySet.allEventIds
      .map((id) => catalog.find((e) => e.id === id))
      .filter(Boolean) as EventCard[];

    const dayProfiles = buildProfilesForEventIds(dayCards, {
      day,
      recentProfiles: allProfiles.map((p) => ({
        domain: p.domain,
        primaryPressure: p.primaryPressure,
        decisionShape: p.decisionShape,
      })),
    });

    if (dayProfiles.length >= 2) {
      const shapes = dayProfiles.map((p) => p.decisionShape);
      if (shapes[0] === shapes[1]) {
        sameDaySameShapeDays += 1;
      }
    }

    for (const profile of dayProfiles) {
      decisionShapeDistribution[profile.decisionShape] =
        (decisionShapeDistribution[profile.decisionShape] ?? 0) + 1;
      primaryPressureDistribution[profile.primaryPressure] =
        (primaryPressureDistribution[profile.primaryPressure] ?? 0) + 1;

      if (lastDayPrimary === profile.primaryPressure) {
        dayRunLength += 1;
      } else {
        if (dayRunLength >= 2) consecutivePrimaryPressureRuns += 1;
        lastDayPrimary = profile.primaryPressure;
        dayRunLength = 1;
      }
    }

    allProfiles.push(...dayProfiles);
  }

  let day8PlusSameShapePairs = 0;
  for (const day of [8, 9, 10]) {
    const gs = buildPostPilotLightGameState(day);
    const postPilot = normalizePostPilotOperationState(gs.pilot.postPilotOperation, {
      pilotStatus: gs.pilot.status,
      currentPilotDay: gs.pilot.currentPilotDay,
    });
    const result = ensurePostPilotDailyEventsForDay({
      gameState: gs,
      postPilotOperation: postPilot,
      day,
    });
    const profiles = buildProfilesForEventIds(result.events.slice(0, 2), { day });
    if (
      profiles.length >= 2 &&
      profiles[0]!.decisionShape === profiles[1]!.decisionShape
    ) {
      day8PlusSameShapePairs += 1;
    }
  }

  const uniqueDecisionShapes = Object.keys(decisionShapeDistribution).length;
  const uniquePrimaryPressures = Object.keys(primaryPressureDistribution).length;
  const notes: string[] = [];
  let verdict: ScenarioGameplayResult['verdict'] = 'PASS';

  if (uniqueDecisionShapes < 4) {
    verdict = 'FAIL';
    notes.push(`uniqueDecisionShapes=${uniqueDecisionShapes} (<4)`);
  }
  if (uniquePrimaryPressures < 5) {
    verdict = 'FAIL';
    notes.push(`uniquePrimaryPressures=${uniquePrimaryPressures} (<5)`);
  }
  if (sameDaySameShapeDays > 3 && verdict !== 'FAIL') {
    verdict = 'WARN';
    notes.push(`sameDaySameShapeDays=${sameDaySameShapeDays}`);
  }
  if (consecutivePrimaryPressureRuns > 2 && verdict !== 'FAIL') {
    verdict = 'WARN';
    notes.push(`consecutivePrimaryPressureRuns=${consecutivePrimaryPressureRuns}`);
  }
  if (day8PlusSameShapePairs >= 2 && verdict !== 'FAIL') {
    verdict = 'WARN';
    notes.push(`day8PlusSameShapePairs=${day8PlusSameShapePairs}`);
  }

  return {
    id: config.id,
    totalEvents: allProfiles.length,
    uniqueDecisionShapes,
    uniquePrimaryPressures,
    sameDaySameShapeDays,
    consecutivePrimaryPressureRuns,
    day8PlusSameShapePairs,
    decisionShapeDistribution,
    primaryPressureDistribution,
    verdict,
    notes,
  };
}

const results = SCENARIOS.map(simulateScenario);

// eslint-disable-next-line no-console
console.log('Event gameplay variety analysis (7 gün x 6 senaryo + Day 8+)\n');

for (const r of results) {
  // eslint-disable-next-line no-console
  console.log(`[${r.verdict}] ${r.id}`);
  // eslint-disable-next-line no-console
  console.log(
    `  totalEvents=${r.totalEvents} uniqueDecisionShapes=${r.uniqueDecisionShapes} uniquePrimaryPressures=${r.uniquePrimaryPressures}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `  sameDaySameShapeDays=${r.sameDaySameShapeDays} consecutivePrimaryPressureRuns=${r.consecutivePrimaryPressureRuns} day8PlusSameShapePairs=${r.day8PlusSameShapePairs}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `  decisionShapes: ${Object.entries(r.decisionShapeDistribution)
      .map(([k, v]) => `${k}:${v}`)
      .join(', ')}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `  primaryPressures: ${Object.entries(r.primaryPressureDistribution)
      .map(([k, v]) => `${k}:${v}`)
      .join(', ')}`,
  );
  if (r.notes.length) {
    // eslint-disable-next-line no-console
    console.log(`  → ${r.notes.join('; ')}`);
  }
}

const failed = results.filter((r) => r.verdict === 'FAIL');
if (failed.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`\n${failed.length} senaryo FAIL.`);
  process.exit(1);
}

const warned = results.filter((r) => r.verdict === 'WARN');
if (warned.length > 0) {
  // eslint-disable-next-line no-console
  console.log(`\n${warned.length} senaryo WARN (kabul edilebilir sapma).`);
}

// eslint-disable-next-line no-console
console.log('\nEvent gameplay variety analysis passed.');
