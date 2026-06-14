import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createDay1Seed } from '@/core/content/day1Seed';
import { pilotEvents } from '@/core/content/pilotEvents';
import { mergeEventCatalogs } from '@/core/districts/districtEventIntegration';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import { generateDailyEventSet } from '@/core/game/generateDailyEventSet';
import { buildProfilesForEventIds } from '@/core/eventVariety/eventGameplayVarietyModel';
import { appendPilotEventContentMemory } from '@/core/events/eventVariationEngine';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { getRhythmPilotDistrictForDay } from '@/core/events/pilotRhythmEngine';
import { isDay1LearningEventId } from '@/features/tutorial/tutorialTypes';
import { SAVE_VERSION } from '@/store/gamePersist';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 26;
const TECHNICAL_ENUM_PATTERN = /\b[a-z]+_[a-z_]+\b/;

export type VerifyEventVarietyOutcome = {
  ok: boolean;
  checks: string[];
};

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function assert(checks: string[], pass: boolean, ok: string, fail: string): boolean {
  checks.push(pass ? `PASS ${ok}` : `FAIL ${fail}`);
  return pass;
}

function cloneEvents(events: EventCard[]): EventCard[] {
  return events.map((event) => ({
    ...event,
    decisions: event.decisions.map((decision) => ({ ...decision })),
  }));
}

function simulateBalancedWeek(): {
  totalEvents: number;
  uniqueTitles: number;
  repeatedExactTitles: number;
  maxSameCategoryInSingleDay: number;
  day1AnchorPreserved: boolean;
  collectedEvents: EventCard[];
} {
  const bundle = createDay1Seed();
  let gameState: GameState = bundle.gameState;
  let eventPool: EventCard[] = [];
  const allTitles: string[] = [];
  const titleSet = new Set<string>();
  let repeatedExactTitles = 0;
  let maxSameCategoryInSingleDay = 0;
  let totalEvents = 0;
  let day1AnchorPreserved = true;
  const collectedEvents: EventCard[] = [];

  const day1AnchorId = gameState.pilot.dailyEventSet?.anchorEventId;
  const day1AnchorTitle = bundle.eventPool.find((event) => event.id === day1AnchorId)?.title;

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
      dailyPriorityKey:
        day % 3 === 1 ? 'public_relief' : day % 3 === 2 ? 'operation_stability' : 'resource_protection',
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

    const dayCategoryCount: Record<string, number> = {};
    for (const id of dailySet.allEventIds) {
      const card = catalog.find((event) => event.id === id);
      if (!card) continue;
      totalEvents += 1;
      collectedEvents.push(card);
      const category = card.contentCategory ?? 'general';
      dayCategoryCount[category] = (dayCategoryCount[category] ?? 0) + 1;
      if (day > 1) {
        if (titleSet.has(card.title)) repeatedExactTitles += 1;
        titleSet.add(card.title);
      }
      allTitles.push(card.title);
    }
    maxSameCategoryInSingleDay = Math.max(
      maxSameCategoryInSingleDay,
      ...Object.values(dayCategoryCount),
      0,
    );

    if (day === 1 && day1AnchorId && isDay1LearningEventId(day1AnchorId)) {
      const after = catalog.find((event) => event.id === day1AnchorId);
      if (after?.title !== day1AnchorTitle || after?.contentProfileId) {
        day1AnchorPreserved = false;
      }
    }
  }

  return {
    totalEvents,
    uniqueTitles: new Set(allTitles).size,
    repeatedExactTitles,
    maxSameCategoryInSingleDay,
    day1AnchorPreserved,
    collectedEvents,
  };
}

export function verifyEventVarietyScenario(): VerifyEventVarietyOutcome {
  const checks: string[] = [];
  let ok = true;

  ok =
    assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION unchanged', `v${SAVE_VERSION}`) &&
    ok;
  ok =
    assert(
      checks,
      !readRepo('src/store/gamePersist.ts').includes('eventVarietySimulation'),
      'gamePersist shape unchanged',
      'persist wired',
    ) && ok;
  ok =
    assert(
      checks,
      !readRepo('src/core/game/applyDecision.ts').includes('verifyEventVariety'),
      'applyDecision unchanged',
      'applyDecision wired',
    ) && ok;
  ok =
    assert(
      checks,
      !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('eventVariety'),
      'day pipeline unchanged',
      'day pipeline wired',
    ) && ok;

  const week = simulateBalancedWeek();
  ok =
    assert(checks, week.totalEvents > 0, 'Variety profile build safe', 'no events generated') && ok;
  ok =
    assert(checks, week.repeatedExactTitles === 0, 'Duplicate title guard safe', `repeats=${week.repeatedExactTitles}`) &&
    ok;
  ok =
    assert(checks, week.day1AnchorPreserved, 'Day 1 anchor preserved', 'anchor broken') && ok;
  ok =
    assert(
      checks,
      week.maxSameCategoryInSingleDay <= 2,
      'Day 1-7 category cap safe',
      `max=${week.maxSameCategoryInSingleDay}`,
    ) && ok;
  ok =
    assert(checks, week.uniqueTitles >= 8, 'Day 1-7 variety safe', `unique=${week.uniqueTitles}`) && ok;

  const profiles = buildProfilesForEventIds(week.collectedEvents.slice(0, 24), { day: 8 });
  ok = assert(checks, profiles.length > 0, 'Day 8+ profile build safe', 'no profiles') && ok;
  ok =
    assert(
      checks,
      profiles.every((profile) => profile.playerFacingLine.trim().length > 0),
      'Player-facing lines non-empty',
      'empty line',
    ) && ok;
  ok =
    assert(
      checks,
      !profiles.some((profile) => TECHNICAL_ENUM_PATTERN.test(profile.playerFacingLine)),
      'No technical enum in presentation',
      'enum in line',
    ) && ok;
  ok =
    assert(
      checks,
      new Set(profiles.map((profile) => profile.eventId)).size === profiles.length,
      'Profile event ids unique',
      'duplicate profile event id',
    ) && ok;
  ok =
    assert(
      checks,
      profiles.every((profile) => profile.sourceIds.length > 0),
      'Profile source ids present',
      'missing source ids',
    ) && ok;

  ok =
    assert(
      checks,
      existsSync(join(REPO_ROOT, 'scripts/analyze-event-variety.ts')),
      'analyze:event-variety script exists',
      'missing analyzer',
    ) && ok;
  ok =
    assert(
      checks,
      !readRepo('src/core/game/generateDailyEventSet.ts').includes('spawnExtra'),
      'No event spawn rewrite',
      'spawn rewrite',
    ) && ok;

  return { ok, checks };
}
