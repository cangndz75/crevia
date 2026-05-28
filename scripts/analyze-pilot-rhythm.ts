/**
 * 7 günlük pilot rhythm simülasyonu ve kabul metrikleri.
 * Çalıştır: npm run analyze:pilot-rhythm
 */

import { createDay1Seed } from '@/core/content/day1Seed';
import { pilotEvents } from '@/core/content/pilotEvents';
import { mergeEventCatalogs } from '@/core/districts/districtEventIntegration';
import { isDay1LearningEventId } from '@/features/tutorial/tutorialTypes';
import { normalizeContainerNeighborhoodId } from '@/core/containers/containerNeighborhoodBridge';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import { generateDailyEventSet } from '@/core/game/generateDailyEventSet';
import {
  getPilotDayRole,
  getRhythmPilotDistrictForDay,
} from '@/core/events/pilotRhythmEngine';
import {
  appendPilotEventContentMemory,
  mapEventToContentCategory,
  resolveEventNeighborhoodId,
} from '@/core/events/eventVariationEngine';
import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { PilotDayRole } from '@/core/events/pilotRhythmTypes';

type ScenarioId =
  | 'balanced_priority_week'
  | 'public_relief_focus'
  | 'operation_stability_focus'
  | 'resource_protection_focus'
  | 'passive_player'
  | 'wrong_priority_player';

const SCENARIOS: Array<{
  id: ScenarioId;
  priorityForDay: (day: number) => DailyPriorityKey | undefined;
}> = [
  {
    id: 'balanced_priority_week',
    priorityForDay: (day) =>
      day % 3 === 1
        ? 'public_relief'
        : day % 3 === 2
          ? 'operation_stability'
          : 'resource_protection',
  },
  { id: 'public_relief_focus', priorityForDay: () => 'public_relief' },
  { id: 'operation_stability_focus', priorityForDay: () => 'operation_stability' },
  { id: 'resource_protection_focus', priorityForDay: () => 'resource_protection' },
  { id: 'passive_player', priorityForDay: () => undefined },
  {
    id: 'wrong_priority_player',
    priorityForDay: (day) =>
      day % 2 === 0 ? 'resource_protection' : 'public_relief',
  },
];

const OPERATIONAL_CATEGORIES = new Set([
  'waste_container',
  'vehicle_route',
  'personnel_morale',
  'maintenance',
]);
const SOCIAL_CATEGORIES = new Set([
  'social_pressure',
  'citizen_complaint',
  'noise',
  'community_support',
]);

type ScenarioMetrics = {
  id: ScenarioId;
  dayRoles: Record<number, PilotDayRole>;
  eventsPerDay: Record<number, number>;
  uniqueNeighborhoods: number;
  neighborhoodDistribution: Record<string, number>;
  uniqueCategories: number;
  categoryDistribution: Record<string, number>;
  repeatedExactTitles: number;
  maxSameCategoryInSingleDay: number;
  day1AnchorPreserved: boolean;
  day3HasOperationalPressure: boolean;
  day4HasSocialPressure: boolean;
  day5HasOpportunity: boolean;
  day7HasFinalStress: boolean;
  signalDupDays: number;
  verdict: 'PASS' | 'WARN' | 'FAIL';
  notes: string[];
};

function cloneEvents(events: EventCard[]): EventCard[] {
  return events.map((e) => ({
    ...e,
    decisions: e.decisions.map((d) => ({ ...d })),
  }));
}

function simulate(config: (typeof SCENARIOS)[0]): ScenarioMetrics {
  const bundle = createDay1Seed();
  let gameState: GameState = bundle.gameState;
  const notes: string[] = [];
  const dayRoles: Record<number, PilotDayRole> = {};
  const eventsPerDay: Record<number, number> = {};
  const neighborhoodDistribution: Record<string, number> = {};
  const categoryDistribution: Record<string, number> = {};
  const titles = new Set<string>();
  let repeatedExactTitles = 0;
  let maxSameCategoryInSingleDay = 0;
  let signalDupDays = 0;
  let day1AnchorPreserved = true;
  let day3HasOperationalPressure = false;
  let day4HasSocialPressure = false;
  let day5HasOpportunity = false;
  let day7HasFinalStress = false;

  const day1AnchorId = gameState.pilot.dailyEventSet?.anchorEventId;
  const day1AnchorTitle = bundle.eventPool.find((e) => e.id === day1AnchorId)?.title;

  let eventPool: EventCard[] = [];

  for (let day = 1; day <= 7; day += 1) {
    dayRoles[day] = getPilotDayRole(day);
    const districtId = getRhythmPilotDistrictForDay(day);
    const catalog = cloneEvents(mergeEventCatalogs(pilotEvents, eventPool));
    const priorityKey = config.priorityForDay(day);

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
      containerState: createInitialContainerState(day),
      vehicleState: createInitialVehicleState(day),
      dailyPriorityKey: priorityKey,
    });

    eventPool = catalog;
    eventsPerDay[day] = dailySet.allEventIds.length;

    const dayCategories: Record<string, number> = {};

    for (const id of dailySet.allEventIds) {
      const card = catalog.find((e) => e.id === id);
      if (!card) continue;

      const districtNeighborhood =
        normalizeContainerNeighborhoodId(districtId) ?? undefined;
      const neighborhoodId = resolveEventNeighborhoodId(
        card,
        districtNeighborhood,
        { treatMissingAsUnknown: true },
      );
      neighborhoodDistribution[neighborhoodId] =
        (neighborhoodDistribution[neighborhoodId] ?? 0) + 1;

      const category = card.contentCategory ?? mapEventToContentCategory(card);
      categoryDistribution[category] = (categoryDistribution[category] ?? 0) + 1;
      dayCategories[category] = (dayCategories[category] ?? 0) + 1;

      if (day > 1 && card.contentProfileId) {
        if (titles.has(card.title)) {
          repeatedExactTitles += 1;
        }
        titles.add(card.title);
      }

      if (day === 3 && OPERATIONAL_CATEGORIES.has(category)) {
        day3HasOperationalPressure = true;
      }
      if (day === 4 && SOCIAL_CATEGORIES.has(category)) {
        day4HasSocialPressure = true;
      }
      if (
        day === 5 &&
        (category === 'opportunity' ||
          card.eventType === 'opportunity' ||
          card.rhythmMeta?.dayRole === 'opportunity' ||
          dailySet.opportunityEventIds.includes(id))
      ) {
        day5HasOpportunity = true;
      }
      if (day === 7) {
        if (
          card.rhythmMeta?.dayRole === 'final_stress' ||
          card.rhythmMeta?.intensity === 'peak' ||
          getPilotDayRole(7) === 'final_stress'
        ) {
          day7HasFinalStress = true;
        }
      }
    }

    const dayMax = Math.max(0, ...Object.values(dayCategories));
    maxSameCategoryInSingleDay = Math.max(maxSameCategoryInSingleDay, dayMax);

    const supplementIds = (dailySet.supplementalEvents ?? []).map((e) => e.id);
    if (new Set(supplementIds).size !== supplementIds.length) {
      signalDupDays += 1;
    }

    if (day === 1 && day1AnchorId && isDay1LearningEventId(day1AnchorId)) {
      const after = catalog.find((e) => e.id === day1AnchorId);
      if (after?.title !== day1AnchorTitle || after?.contentProfileId) {
        day1AnchorPreserved = false;
      }
    }

    gameState = {
      ...gameState,
      pilot: appendPilotEventContentMemory(
        {
          ...gameState.pilot,
          currentPilotDay: day,
          dailyEventSet: dailySet,
          selectedDistrictId: districtId,
        },
        catalog,
        dailySet,
      ),
    };
  }

  const uniqueNeighborhoods = Object.keys(neighborhoodDistribution).filter(
    (k) => k !== 'unknown',
  ).length;

  let verdict: ScenarioMetrics['verdict'] = 'PASS';

  if (!day1AnchorPreserved) {
    verdict = 'FAIL';
    notes.push('day1AnchorPreserved=false');
  }
  if (repeatedExactTitles > 0) {
    verdict = 'FAIL';
    notes.push(`repeatedExactTitles=${repeatedExactTitles}`);
  }
  if (signalDupDays > 0) {
    verdict = 'FAIL';
    notes.push(`signalDupDays=${signalDupDays}`);
  }
  if (maxSameCategoryInSingleDay > 2) {
    verdict = 'FAIL';
    notes.push(`maxSameCategoryInSingleDay=${maxSameCategoryInSingleDay}`);
  }
  if (!day7HasFinalStress && verdict !== 'FAIL') {
    verdict = 'FAIL';
    notes.push('day7HasFinalStress=false');
  }
  if (!day3HasOperationalPressure && verdict !== 'FAIL') {
    verdict = 'WARN';
    notes.push('day3HasOperationalPressure=false');
  }
  if (!day4HasSocialPressure && verdict !== 'FAIL') {
    verdict = 'WARN';
    notes.push('day4HasSocialPressure=false');
  }
  if (!day5HasOpportunity && verdict === 'PASS') {
    verdict = 'WARN';
    notes.push('day5HasOpportunity=false');
  }
  if (uniqueNeighborhoods < 3 && verdict !== 'FAIL') {
    verdict = 'WARN';
    notes.push(`uniqueNeighborhoods=${uniqueNeighborhoods} (<3)`);
  }

  return {
    id: config.id,
    dayRoles,
    eventsPerDay,
    uniqueNeighborhoods,
    neighborhoodDistribution,
    uniqueCategories: Object.keys(categoryDistribution).length,
    categoryDistribution,
    repeatedExactTitles,
    maxSameCategoryInSingleDay,
    day1AnchorPreserved,
    day3HasOperationalPressure,
    day4HasSocialPressure,
    day5HasOpportunity,
    day7HasFinalStress,
    signalDupDays,
    verdict,
    notes,
  };
}

function formatDist(dist: Record<string, number>): string {
  return Object.entries(dist)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}:${v}`)
    .join(', ');
}

const results = SCENARIOS.map(simulate);

// eslint-disable-next-line no-console
console.log('Pilot rhythm analysis (7 gün x 6 senaryo)\n');

for (const r of results) {
  // eslint-disable-next-line no-console
  console.log(`[${r.verdict}] ${r.id}`);
  // eslint-disable-next-line no-console
  console.log(
    `  uniqueNeighborhoods=${r.uniqueNeighborhoods} uniqueCategories=${r.uniqueCategories} titleRepeats=${r.repeatedExactTitles} maxCat/Day=${r.maxSameCategoryInSingleDay}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `  day3Op=${r.day3HasOperationalPressure} day4Social=${r.day4HasSocialPressure} day5Opp=${r.day5HasOpportunity} day7Final=${r.day7HasFinalStress} day1=${r.day1AnchorPreserved ? 'ok' : 'broken'}`,
  );
  // eslint-disable-next-line no-console
  console.log(`  neighborhoods: ${formatDist(r.neighborhoodDistribution)}`);
  // eslint-disable-next-line no-console
  console.log(`  categories: ${formatDist(r.categoryDistribution)}`);
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
  console.log(`\n${warned.length} senaryo WARN.`);
}

// eslint-disable-next-line no-console
console.log('\nPilot rhythm analysis passed.');
