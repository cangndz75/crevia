/**
 * 7 günlük event çeşitlilik simülasyonu.
 * Çalıştır: npm run analyze:event-variety
 */

import { createDay1Seed } from '@/core/content/day1Seed';
import { pilotEvents } from '@/core/content/pilotEvents';
import { mergeEventCatalogs } from '@/core/districts/districtEventIntegration';
import { isDay1LearningEventId } from '@/features/tutorial/tutorialTypes';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import { generateDailyEventSet } from '@/core/game/generateDailyEventSet';
import { buildEventCardPriorityChip } from '@/core/events/eventContentPresentation';
import {
  appendPilotEventContentMemory,
  mapEventToContentCategory,
} from '@/core/events/eventVariationEngine';
import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
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

type DayMetrics = {
  day: number;
  titles: string[];
  categories: string[];
  profileIds: string[];
  neighborhoods: string[];
  supplementDuplicate: boolean;
};

type ScenarioResult = {
  id: ScenarioId;
  uniqueTitles: number;
  uniqueCategories: number;
  exactTitleRepeats: number;
  maxSameCategoryPerDay: number;
  profileRepeatRate: number;
  day1AnchorPreserved: boolean;
  supplementDuplicateDays: number;
  priorityChipCount: number;
  neighborhoodSpread: number;
  verdict: 'PASS' | 'WARN' | 'FAIL';
  notes: string[];
};

function cloneEvents(events: EventCard[]): EventCard[] {
  return events.map((e) => ({
    ...e,
    decisions: e.decisions.map((d) => ({ ...d })),
  }));
}

function simulateScenario(config: ScenarioConfig): ScenarioResult {
  const bundle = createDay1Seed();
  let gameState: GameState = bundle.gameState;
  const notes: string[] = [];
  const allTitles: string[] = [];
  const allCategories: string[] = [];
  const allProfileIds: string[] = [];
  const allNeighborhoods: string[] = [];
  let exactTitleRepeats = 0;
  const titleSet = new Set<string>();
  let maxSameCategoryPerDay = 0;
  let supplementDuplicateDays = 0;
  let priorityChipCount = 0;
  let day1AnchorPreserved = true;

  const day1AnchorId = gameState.pilot.dailyEventSet?.anchorEventId;
  const day1AnchorTitle = bundle.eventPool.find((e) => e.id === day1AnchorId)?.title;

  let eventPool: EventCard[] = [];

  for (let day = 1; day <= 7; day += 1) {
    const catalog = cloneEvents(mergeEventCatalogs(pilotEvents, eventPool));
    const containerState = createInitialContainerState(day);
    const vehicleState = createInitialVehicleState(day);
    const priorityKey = config.priorityForDay(day);

    const dailySet = generateDailyEventSet({
      gameState: { ...gameState, pilot: { ...gameState.pilot, currentPilotDay: day } },
      day,
      districtId: DEFAULT_PILOT_DISTRICT_ID,
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

    const dayTitles: string[] = [];
    const dayCategories: string[] = [];
    const categoryCount: Record<string, number> = {};

    for (const id of dailySet.allEventIds) {
      const card = catalog.find((e) => e.id === id);
      if (!card) continue;
      dayTitles.push(card.title);
      const category = card.contentCategory ?? mapEventToContentCategory(card);
      dayCategories.push(category);
      categoryCount[category] = (categoryCount[category] ?? 0) + 1;
      if (card.contentProfileId) {
        allProfileIds.push(card.contentProfileId);
      }
      if (card.neighborhoodId) {
        allNeighborhoods.push(card.neighborhoodId);
      }
      const chip = buildEventCardPriorityChip(card, priorityKey);
      if (chip) {
        priorityChipCount += 1;
      }
    }

    if (day > 1) {
      for (const title of dayTitles) {
        if (titleSet.has(title)) {
          exactTitleRepeats += 1;
        }
        titleSet.add(title);
      }
    }
    allTitles.push(...dayTitles);
    allCategories.push(...dayCategories);

    const dayMaxCategory = Math.max(0, ...Object.values(categoryCount));
    maxSameCategoryPerDay = Math.max(maxSameCategoryPerDay, dayMaxCategory);

    const supplementIds = (dailySet.supplementalEvents ?? []).map((e) => e.id);
    if (new Set(supplementIds).size !== supplementIds.length) {
      supplementDuplicateDays += 1;
    }

    if (day === 1 && day1AnchorId && isDay1LearningEventId(day1AnchorId)) {
      const after = catalog.find((e) => e.id === day1AnchorId);
      if (after?.title !== day1AnchorTitle || after?.contentProfileId) {
        day1AnchorPreserved = false;
      }
    }
  }

  const uniqueTitles = new Set(allTitles).size;
  const uniqueCategories = new Set(allCategories).size;
  const profileRepeatRate =
    allProfileIds.length === 0
      ? 0
      : 1 - new Set(allProfileIds).size / allProfileIds.length;
  const neighborhoodSpread = new Set(allNeighborhoods).size;

  let verdict: ScenarioResult['verdict'] = 'PASS';

  if (uniqueTitles < 12) {
    verdict = 'FAIL';
    notes.push(`unique title < 12 (${uniqueTitles})`);
  }
  if (exactTitleRepeats > 0) {
    verdict = 'FAIL';
    notes.push(`exact title repeat: ${exactTitleRepeats}`);
  }
  if (maxSameCategoryPerDay > 2) {
    verdict = 'FAIL';
    notes.push(`category spam day max: ${maxSameCategoryPerDay}`);
  }
  if (!day1AnchorPreserved) {
    verdict = 'FAIL';
    notes.push('day1 anchor changed');
  }
  if (supplementDuplicateDays > 0) {
    verdict = 'FAIL';
    notes.push(`supplement dup days: ${supplementDuplicateDays}`);
  }
  if (uniqueCategories < 4 && verdict === 'PASS') {
    verdict = 'WARN';
    notes.push('category spread düşük');
  }
  if (neighborhoodSpread < 3 && verdict === 'PASS') {
    verdict = 'WARN';
    notes.push('mahalle dağılımı dar');
  }

  return {
    id: config.id,
    uniqueTitles,
    uniqueCategories,
    exactTitleRepeats,
    maxSameCategoryPerDay,
    profileRepeatRate: Math.round(profileRepeatRate * 100) / 100,
    day1AnchorPreserved,
    supplementDuplicateDays,
    priorityChipCount,
    neighborhoodSpread,
    verdict,
    notes,
  };
}

const results = SCENARIOS.map(simulateScenario);

// eslint-disable-next-line no-console
console.log('Event variety analysis (7 gün x 6 senaryo)\n');

for (const r of results) {
  // eslint-disable-next-line no-console
  console.log(
    `[${r.verdict}] ${r.id}: titles=${r.uniqueTitles} categories=${r.uniqueCategories} titleRepeats=${r.exactTitleRepeats} maxCat/Day=${r.maxSameCategoryPerDay} profileRepeat=${r.profileRepeatRate} chips=${r.priorityChipCount} neighborhoods=${r.neighborhoodSpread} day1=${r.day1AnchorPreserved ? 'ok' : 'broken'}`,
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

// eslint-disable-next-line no-console
console.log('\nEvent variety analysis passed.');
