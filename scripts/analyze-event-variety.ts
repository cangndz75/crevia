/**
 * 7 günlük event çeşitlilik simülasyonu.
 * Çalıştır: npm run analyze:event-variety
 */

import { createDay1Seed } from '@/core/content/day1Seed';
import { pilotEvents } from '@/core/content/pilotEvents';
import { mergeEventCatalogs } from '@/core/districts/districtEventIntegration';
import { isDay1LearningEventId } from '@/features/tutorial/tutorialTypes';
import { normalizeContainerNeighborhoodId } from '@/core/containers/containerNeighborhoodBridge';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import { generateDailyEventSet } from '@/core/game/generateDailyEventSet';
import { buildProfilesForEventIds } from '@/core/eventVariety/eventGameplayVarietyModel';
import { buildEventCardPriorityChip } from '@/core/events/eventContentPresentation';
import {
  appendPilotEventContentMemory,
  mapEventToContentCategory,
  pickNeighborhoodIdFromEvent,
  resolveEventNeighborhoodId,
} from '@/core/events/eventVariationEngine';
import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { getRhythmPilotDistrictForDay } from '@/core/events/pilotRhythmEngine';
import { DEFAULT_PILOT_DISTRICT_ID } from '@/core/models/DistrictProfile';

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
    priorityForDay: (day) =>
      day % 2 === 0 ? 'resource_protection' : 'public_relief',
  },
];

type ScenarioResult = {
  id: ScenarioId;
  totalEvents: number;
  uniqueTitles: number;
  uniqueCategories: number;
  uniqueNeighborhoods: number;
  neighborhoodDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  missingNeighborhoodEvents: number;
  unknownNeighborhoodEvents: number;
  repeatedExactTitles: number;
  repeatedProfileWithin2Days: number;
  maxSameCategoryInSingleDay: number;
  maxSameNeighborhoodCategoryInSingleDay: number;
  day1AnchorPreserved: boolean;
  containerVehicleDuplicateSignalDays: number;
  priorityChipCount: number;
  verdict: 'PASS' | 'WARN' | 'FAIL';
  notes: string[];
};

function cloneEvents(events: EventCard[]): EventCard[] {
  return events.map((e) => ({
    ...e,
    decisions: e.decisions.map((d) => ({ ...d })),
  }));
}

function countProfileRepeatsWithin2Days(
  profileIdsByDay: string[][],
): number {
  let repeats = 0;
  for (let day = 0; day < profileIdsByDay.length; day += 1) {
    const window = new Set<string>();
    for (let d = Math.max(0, day - 1); d <= day; d += 1) {
      for (const id of profileIdsByDay[d] ?? []) {
        if (window.has(id)) {
          repeats += 1;
        }
        window.add(id);
      }
    }
  }
  return repeats;
}

function simulateScenario(config: ScenarioConfig): ScenarioResult {
  const bundle = createDay1Seed();
  let gameState: GameState = bundle.gameState;
  const notes: string[] = [];
  const allTitles: string[] = [];
  const titleSet = new Set<string>();
  let repeatedExactTitles = 0;
  let maxSameCategoryInSingleDay = 0;
  let maxSameNeighborhoodCategoryInSingleDay = 0;
  let containerVehicleDuplicateSignalDays = 0;
  let priorityChipCount = 0;
  let day1AnchorPreserved = true;
  let missingNeighborhoodEvents = 0;
  let unknownNeighborhoodEvents = 0;
  let totalEvents = 0;

  const neighborhoodDistribution: Record<string, number> = {};
  const categoryDistribution: Record<string, number> = {};
  const profileIdsByDay: string[][] = [];

  const day1AnchorId = gameState.pilot.dailyEventSet?.anchorEventId;
  const day1AnchorTitle = bundle.eventPool.find((e) => e.id === day1AnchorId)?.title;

  let eventPool: EventCard[] = [];

  for (let day = 1; day <= 7; day += 1) {
    const catalog = cloneEvents(mergeEventCatalogs(pilotEvents, eventPool));
    const containerState = createInitialContainerState(day);
    const vehicleState = createInitialVehicleState(day);
    const priorityKey = config.priorityForDay(day);

    const districtId = getRhythmPilotDistrictForDay(day);

    const dailySet = generateDailyEventSet({
      gameState: {
        ...gameState,
        pilot: {
          ...gameState.pilot,
          currentPilotDay: day,
          selectedDistrictId: districtId,
        },
      },
      day,
      districtId,
      events: catalog,
      containerState,
      vehicleState,
      dailyPriorityKey: priorityKey,
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

    const dayProfileIds: string[] = [];
    const dayCategoryCount: Record<string, number> = {};
    const dayNeighborhoodCategoryCount: Record<string, number> = {};

    for (const id of dailySet.allEventIds) {
      const card = catalog.find((e) => e.id === id);
      if (!card) continue;

      totalEvents += 1;

      const districtNeighborhood =
        normalizeContainerNeighborhoodId(districtId) ?? undefined;
      const strictNeighborhood = resolveEventNeighborhoodId(card, undefined, {
        treatMissingAsUnknown: true,
      });
      const neighborhoodId = resolveEventNeighborhoodId(
        card,
        districtNeighborhood,
        { treatMissingAsUnknown: true },
      );

      if (pickNeighborhoodIdFromEvent(card) == null) {
        missingNeighborhoodEvents += 1;
      }
      if (strictNeighborhood === 'unknown') {
        unknownNeighborhoodEvents += 1;
      }
      neighborhoodDistribution[neighborhoodId] =
        (neighborhoodDistribution[neighborhoodId] ?? 0) + 1;

      const category = card.contentCategory ?? mapEventToContentCategory(card);
      categoryDistribution[category] = (categoryDistribution[category] ?? 0) + 1;
      dayCategoryCount[category] = (dayCategoryCount[category] ?? 0) + 1;

      const nhCatKey = `${neighborhoodId}:${category}`;
      dayNeighborhoodCategoryCount[nhCatKey] =
        (dayNeighborhoodCategoryCount[nhCatKey] ?? 0) + 1;

      if (card.contentProfileId) {
        dayProfileIds.push(card.contentProfileId);
      }

      const chip = buildEventCardPriorityChip(card, priorityKey);
      if (chip) {
        priorityChipCount += 1;
      }

      if (day > 1 && card.contentProfileId) {
        if (titleSet.has(card.title)) {
          repeatedExactTitles += 1;
        }
        titleSet.add(card.title);
      }
      allTitles.push(card.title);
    }

    profileIdsByDay.push(dayProfileIds);

    const dayMaxCategory = Math.max(0, ...Object.values(dayCategoryCount));
    maxSameCategoryInSingleDay = Math.max(maxSameCategoryInSingleDay, dayMaxCategory);

    const dayMaxNeighborhoodCategory = Math.max(
      0,
      ...Object.values(dayNeighborhoodCategoryCount),
    );
    maxSameNeighborhoodCategoryInSingleDay = Math.max(
      maxSameNeighborhoodCategoryInSingleDay,
      dayMaxNeighborhoodCategory,
    );

    const supplementIds = (dailySet.supplementalEvents ?? []).map((e) => e.id);
    if (new Set(supplementIds).size !== supplementIds.length) {
      containerVehicleDuplicateSignalDays += 1;
    }

    if (day === 1 && day1AnchorId && isDay1LearningEventId(day1AnchorId)) {
      const after = catalog.find((e) => e.id === day1AnchorId);
      if (after?.title !== day1AnchorTitle || after?.contentProfileId) {
        day1AnchorPreserved = false;
      }
    }
  }

  const uniqueTitles = new Set(allTitles).size;
  const uniqueCategories = Object.keys(categoryDistribution).length;
  const uniqueNeighborhoods = Object.keys(neighborhoodDistribution).filter(
    (id) => id !== 'unknown',
  ).length;
  const repeatedProfileWithin2Days = countProfileRepeatsWithin2Days(profileIdsByDay);

  let verdict: ScenarioResult['verdict'] = 'PASS';

  if (repeatedExactTitles > 0) {
    verdict = 'FAIL';
    notes.push(`repeatedExactTitles=${repeatedExactTitles}`);
  }
  if (!day1AnchorPreserved) {
    verdict = 'FAIL';
    notes.push('day1AnchorPreserved=false');
  }
  if (containerVehicleDuplicateSignalDays > 0) {
    verdict = 'FAIL';
    notes.push(
      `containerVehicleDuplicateSignalDays=${containerVehicleDuplicateSignalDays}`,
    );
  }
  if (maxSameCategoryInSingleDay > 2) {
    verdict = 'FAIL';
    notes.push(`maxSameCategoryInSingleDay=${maxSameCategoryInSingleDay}`);
  }

  if (uniqueNeighborhoods < 3 && verdict !== 'FAIL') {
    verdict = 'WARN';
    notes.push(
      `uniqueNeighborhoods=${uniqueNeighborhoods} (<3); rhythm rotasyonu aktif — dar havuz veya gün 1 unknown`,
    );
  }

  const missingRatio =
    totalEvents === 0 ? 0 : missingNeighborhoodEvents / totalEvents;
  if (missingRatio > 0.3 && verdict !== 'FAIL') {
    verdict = 'WARN';
    notes.push(
      `missingNeighborhoodEvents=${missingNeighborhoodEvents} (${Math.round(missingRatio * 100)}%)`,
    );
  }

  if (uniqueTitles < 12 && verdict !== 'FAIL') {
    verdict = 'WARN';
    notes.push(`uniqueTitles=${uniqueTitles} (<12)`);
  }

  if (repeatedProfileWithin2Days > 0 && verdict === 'PASS') {
    verdict = 'WARN';
    notes.push(`repeatedProfileWithin2Days=${repeatedProfileWithin2Days}`);
  }

  return {
    id: config.id,
    totalEvents,
    uniqueTitles,
    uniqueCategories,
    uniqueNeighborhoods,
    neighborhoodDistribution,
    categoryDistribution,
    missingNeighborhoodEvents,
    unknownNeighborhoodEvents,
    repeatedExactTitles,
    repeatedProfileWithin2Days,
    maxSameCategoryInSingleDay,
    maxSameNeighborhoodCategoryInSingleDay,
    day1AnchorPreserved,
    containerVehicleDuplicateSignalDays,
    priorityChipCount,
    verdict,
    notes,
  };
}

function formatDistribution(dist: Record<string, number>): string {
  return Object.entries(dist)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}:${v}`)
    .join(', ');
}

const results = SCENARIOS.map(simulateScenario);

// eslint-disable-next-line no-console
console.log('Event variety analysis (7 gün x 6 senaryo)\n');

for (const r of results) {
  // eslint-disable-next-line no-console
  console.log(`[${r.verdict}] ${r.id}`);
  // eslint-disable-next-line no-console
  console.log(
    `  totalEvents=${r.totalEvents} uniqueTitles=${r.uniqueTitles} uniqueCategories=${r.uniqueCategories} uniqueNeighborhoods=${r.uniqueNeighborhoods}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `  repeatedExactTitles=${r.repeatedExactTitles} repeatedProfileWithin2Days=${r.repeatedProfileWithin2Days} maxSameCategoryInSingleDay=${r.maxSameCategoryInSingleDay} maxSameNeighborhoodCategoryInSingleDay=${r.maxSameNeighborhoodCategoryInSingleDay}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `  missingNeighborhoodEvents=${r.missingNeighborhoodEvents} unknownNeighborhoodEvents=${r.unknownNeighborhoodEvents} day1Anchor=${r.day1AnchorPreserved ? 'ok' : 'broken'} signalDupDays=${r.containerVehicleDuplicateSignalDays}`,
  );
  // eslint-disable-next-line no-console
  console.log(`  neighborhoods: ${formatDistribution(r.neighborhoodDistribution)}`);
  // eslint-disable-next-line no-console
  console.log(`  categories: ${formatDistribution(r.categoryDistribution)}`);
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
console.log('\nEvent variety analysis passed.');

const gameplayProbeEvents: EventCard[] = [];
for (const config of SCENARIOS) {
  const bundle = createDay1Seed();
  let gameState: GameState = bundle.gameState;
  let eventPool: EventCard[] = [];

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
        { ...gameState.pilot, currentPilotDay: day, dailyEventSet: dailySet },
        catalog,
        dailySet,
      ),
    };
    for (const id of dailySet.allEventIds) {
      const card = catalog.find((e) => e.id === id);
      if (card) gameplayProbeEvents.push(card);
    }
  }
}

const probeProfiles = buildProfilesForEventIds(gameplayProbeEvents.slice(0, 40), { day: 4 });
const shapeSet = new Set(probeProfiles.map((p) => p.decisionShape));
const pressureSet = new Set(probeProfiles.map((p) => p.primaryPressure));

// eslint-disable-next-line no-console
console.log(
  `\nGameplay pressure probe (sample): decisionShapes=${shapeSet.size} primaryPressures=${pressureSet.size}`,
);
// eslint-disable-next-line no-console
console.log(
  `  shapes: ${[...shapeSet].join(', ')} | pressures: ${[...pressureSet].join(', ')}`,
);
