/**
 * Araç event sinyali — 7 günlük pilot event üretim simülasyonu.
 * vehicleDrivenSupplementDays ile random/district adayları ayrıştırılır.
 * Çalıştır: npx tsx scripts/analyze-vehicle-event-signals.ts
 */

import { pilotEvents } from '../src/core/content/pilotEvents';
import { mergeEventCatalogs } from '../src/core/districts/districtEventIntegration';
import { calculateEventWeight } from '../src/core/game/calculateEventWeight';
import { createDefaultPilotState } from '../src/core/game/createDefaultPilotState';
import { createPilotRun } from '../src/core/game/pilotRun';
import type { PilotEventSelectionContext } from '../src/core/game/pilotConditions';
import { generateDailyEventSet } from '../src/core/game/generateDailyEventSet';
import {
  buildVehicleStateForScenario,
  countVehicleDrivenSupplements,
  createVehicleEventSignals,
  isVehicleDrivenSupplementEvent,
  isVehicleEventCandidate,
} from '../src/core/vehicles/vehicleEventSignals';
import type { DailyEventSet } from '../src/core/models/DailyEventSet';
import type { EventCard } from '../src/core/models/EventCard';
import type { GameState } from '../src/core/models/GameState';
import type { PilotDistrictId } from '../src/core/models/DistrictProfile';

const PILOT_DAYS = 7;
const DISTRICT: PilotDistrictId = 'central';
const RUN_ID = 'analyze-vehicle-event-signals';

type ScenarioId =
  | 'healthy_fleet'
  | 'high_workload'
  | 'broken_vehicle'
  | 'no_available_vehicle'
  | 'maintenance_neglect';

type ScenarioReport = {
  scenario: ScenarioId;
  vehicleSignalDays: number;
  vehicleDrivenSupplementDays: number;
  randomVehicleCandidateDays: number;
  duplicateVehicleEventDays: number;
  averageBoost: number;
  maxBoost: number;
  day1BoostPresent: boolean;
};

function mockGameState(day: number): GameState {
  return {
    city: {
      day,
      publicSatisfaction: 55,
      budget: 75_000,
      morale: 65,
      riskScore: 55,
    },
    player: {
      name: 'Can',
      xp: 0,
      xpToNextLevel: 100,
      authorityPoints: 0,
      level: 1,
      title: 'Koordinatör',
      role: 'Pilot',
      notificationCount: 0,
      streakDays: 1,
    },
    cityPulse: [],
    dailyMissions: [],
    events: [],
    featuredEventId: '',
    eventOpportunity: { id: 'o', title: '', description: '', xpReward: 0 },
    solvedEvents: [],
    eventAdvisor: { body: '', attribution: '', tokenCost: 0 },
    risks: { total: 0, activeThreats: 0, critical: 0 },
    abilities: [],
    dailyReport: { day, title: '', stats: [], rewardTitle: '' },
    riskSummary: { total: 0, activeThreats: 0, critical: 0 },
    operationsBrief: { title: '', summary: '' },
    pilot: {
      ...createDefaultPilotState(),
      status: 'active',
      selectedDistrictId: DISTRICT,
      currentPilotDay: day,
      run: { ...createPilotRun(DISTRICT), id: RUN_ID },
    },
  } as unknown as GameState;
}

function buildWeightContext(
  gameState: GameState,
  day: number,
): PilotEventSelectionContext {
  return {
    gameState,
    selectedDistrictId: DISTRICT,
    pilot: gameState.pilot,
    currentDay: day,
    flags: gameState.pilot.flags ?? {},
  };
}

function resolveDailySetCards(
  dailySet: DailyEventSet,
  catalog: EventCard[] = pilotEvents,
): EventCard[] {
  const merged = mergeEventCatalogs(catalog, dailySet.supplementalEvents ?? []);
  return dailySet.allEventIds
    .map((id) => merged.find((event) => event.id === id))
    .filter((event): event is EventCard => event != null);
}

function countVehicleCandidatesInSet(cards: EventCard[]): number {
  return cards.filter((card) =>
    isVehicleEventCandidate({
      eventType: card.eventType,
      title: card.title,
      category: card.category,
      tags: card.filterTags,
      districtEventType: card.districtEventType,
    }),
  ).length;
}

function vehicleBoostFromCalculateEventWeight(
  card: EventCard,
  context: PilotEventSelectionContext,
  vehicleState: ReturnType<typeof buildVehicleStateForScenario>,
  day: number,
): number {
  const withoutVehicle = calculateEventWeight({
    event: card,
    context,
    vehicleState: null,
  });
  const withVehicle = calculateEventWeight({
    event: card,
    context,
    vehicleState,
    tutorialActive: day <= 1,
  });
  if (withVehicle <= withoutVehicle) {
    return 0;
  }
  return (withVehicle - withoutVehicle) / withoutVehicle;
}

function analyzeScenario(scenario: ScenarioId): ScenarioReport {
  let vehicleSignalDays = 0;
  let vehicleDrivenSupplementDays = 0;
  let randomVehicleCandidateDays = 0;
  let duplicateVehicleEventDays = 0;
  let boostSum = 0;
  let boostSamples = 0;
  let maxBoost = 0;
  let day1BoostCount = 0;

  for (let day = 1; day <= PILOT_DAYS; day += 1) {
    const vehicleState = buildVehicleStateForScenario(scenario, day);
    const tutorialActive = day <= 1;
    const signals = createVehicleEventSignals(vehicleState, {
      day,
      activeDistrictId: DISTRICT,
      tutorialActive,
    });
    if (signals.length > 0) {
      vehicleSignalDays += 1;
    }

    const gameState = mockGameState(day);
    const context = buildWeightContext(gameState, day);
    const dailySet = generateDailyEventSet({
      gameState,
      day,
      districtId: DISTRICT,
      vehicleState,
    });

    if (countVehicleDrivenSupplements(dailySet) > 0) {
      vehicleDrivenSupplementDays += 1;
    }

    const cards = resolveDailySetCards(dailySet);
    const vehicleCandidateCount = countVehicleCandidatesInSet(cards);
    if (vehicleCandidateCount > 1) {
      duplicateVehicleEventDays += 1;
    }

    let dayMaxBoost = 0;
    for (const card of cards) {
      const boost = vehicleBoostFromCalculateEventWeight(
        card,
        context,
        vehicleState,
        day,
      );
      if (boost > 0) {
        dayMaxBoost = Math.max(dayMaxBoost, boost);
      }
    }

    if (day === 1 && dayMaxBoost > 0) {
      day1BoostCount += 1;
    }
    if (dayMaxBoost > 0) {
      boostSum += dayMaxBoost;
      boostSamples += 1;
      maxBoost = Math.max(maxBoost, dayMaxBoost);
    }

    const hasNonDrivenVehicleCandidate = cards.some(
      (card) =>
        isVehicleEventCandidate({
          eventType: card.eventType,
          title: card.title,
          category: card.category,
          tags: card.filterTags,
          districtEventType: card.districtEventType,
        }) && !isVehicleDrivenSupplementEvent(card),
    );
    const drivenSupplements = countVehicleDrivenSupplements(dailySet);

    if (
      signals.length === 0 &&
      hasNonDrivenVehicleCandidate &&
      drivenSupplements === 0 &&
      dayMaxBoost === 0
    ) {
      randomVehicleCandidateDays += 1;
    }
  }

  return {
    scenario,
    vehicleSignalDays,
    vehicleDrivenSupplementDays,
    randomVehicleCandidateDays,
    duplicateVehicleEventDays,
    averageBoost: boostSamples > 0 ? Number((boostSum / boostSamples).toFixed(3)) : 0,
    maxBoost: Number(maxBoost.toFixed(3)),
    day1BoostPresent: day1BoostCount > 0,
  };
}

const scenarios: ScenarioId[] = [
  'healthy_fleet',
  'high_workload',
  'broken_vehicle',
  'no_available_vehicle',
  'maintenance_neglect',
];

console.log('=== Araç Event Sinyali Analizi (7 gün) ===\n');

for (const scenario of scenarios) {
  const report = analyzeScenario(scenario);
  console.log(`--- ${scenario} ---`);
  console.log(`  vehicleSignalDays: ${report.vehicleSignalDays}`);
  console.log(`  vehicleDrivenSupplementDays: ${report.vehicleDrivenSupplementDays}`);
  console.log(`  randomVehicleCandidateDays: ${report.randomVehicleCandidateDays}`);
  console.log(`  duplicateVehicleEventDays: ${report.duplicateVehicleEventDays}`);
  console.log(`  averageBoost: ${report.averageBoost}`);
  console.log(`  maxBoost: ${report.maxBoost}`);
  console.log(`  day1BoostPresent: ${report.day1BoostPresent}`);
  console.log('');
}

console.log(
  'Beklenen healthy_fleet: signal=0, drivenSupplement=0, boost=0, day1Boost=false; randomVehicleCandidateDays 0-1 kabul.',
);
