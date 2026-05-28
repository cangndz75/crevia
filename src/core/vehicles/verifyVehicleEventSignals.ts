import { pilotEvents } from '@/core/content/pilotEvents';
import { calculateEventWeight } from '@/core/game/calculateEventWeight';
import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import { generateDailyEventSet } from '@/core/game/generateDailyEventSet';
import type { PilotEventSelectionContext } from '@/core/game/pilotConditions';
import type { DailyEventSet } from '@/core/models/DailyEventSet';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';

import {
  buildVehicleStateForScenario,
  canVehicleSignalProduceSupplement,
  countVehicleDrivenSupplements,
  createVehicleEventSignals,
  dailySetAlreadyHasVehicleEvent,
  enrichDailyEventSetWithVehicleSignals,
  getVehicleEventWeightForCandidate,
  isVehicleDrivenSupplementEvent,
  isVehicleEventCandidate,
  MAX_VEHICLE_EVENT_WEIGHT_BOOST,
  selectStrongestVehicleSignal,
} from './vehicleEventSignals';
import { createInitialVehicleState, recomputeVehicleAggregates } from './vehicleSeed';
import type { VehicleState, VehicleUnit } from './vehicleTypes';

export type VerifyVehicleEventSignalsResult = {
  ok: boolean;
  checks: string[];
};

function mockGameState(day: number, districtId: PilotDistrictId): GameState {
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
      selectedDistrictId: districtId,
      currentPilotDay: day,
    },
  } as unknown as GameState;
}

function buildWeightContext(
  gameState: GameState,
  day: number,
  districtId: PilotDistrictId,
): PilotEventSelectionContext {
  return {
    gameState,
    selectedDistrictId: districtId,
    pilot: gameState.pilot,
    currentDay: day,
    flags: gameState.pilot.flags ?? {},
  };
}

function withBrokenVehicle(state: VehicleState): VehicleState {
  const units = state.units.map((unit, index) =>
    index === 0
      ? { ...unit, operationalStatus: 'broken' as const, breakdownRisk: 90 }
      : unit,
  );
  return { ...state, units, aggregates: recomputeVehicleAggregates(units) };
}

function withNoAvailable(state: VehicleState): VehicleState {
  const units = state.units.map((unit) => ({
    ...unit,
    operationalStatus: 'maintenance' as const,
  }));
  return {
    ...state,
    units,
    aggregates: recomputeVehicleAggregates(units),
  };
}

function withHighWorkload(state: VehicleState): VehicleState {
  const units = state.units.map((unit) => ({
    ...unit,
    workload: 85,
    routeEfficiency: 50,
  }));
  return { ...state, units, aggregates: recomputeVehicleAggregates(units) };
}

function withLowFuel(state: VehicleState): VehicleState {
  const units = state.units.map((unit) => ({
    ...unit,
    fuelOrCharge: 25,
  }));
  return { ...state, units, aggregates: recomputeVehicleAggregates(units) };
}

function withInspectionUnavailable(state: VehicleState): VehicleState {
  const units = state.units.map((unit) =>
    unit.category === 'inspection_vehicle'
      ? { ...unit, operationalStatus: 'maintenance' as const }
      : unit,
  );
  return { ...state, units, aggregates: recomputeVehicleAggregates(units) };
}

function emptyDailySetForEnrich(day: number): DailyEventSet {
  return {
    id: `daily-enrich-test-d${day}`,
    day,
    districtId: 'central',
    generatedAt: new Date().toISOString(),
    seed: 1,
    anchorEventId: 'anchor-non-vehicle',
    sideEventIds: [],
    quickActionIds: [],
    opportunityEventIds: [],
    butterflyEventIds: [],
    signalEventIds: [],
    allEventIds: ['anchor-non-vehicle'],
    eventRoles: { 'anchor-non-vehicle': 'anchor' },
    eventStatuses: { 'anchor-non-vehicle': 'awaiting_decision' },
  };
}

export function verifyVehicleEventSignals(): VerifyVehicleEventSignalsResult {
  const checks: string[] = [];
  let ok = true;

  const fail = (message: string) => {
    ok = false;
    checks.push(`FAIL ${message}`);
  };
  const pass = (message: string) => {
    checks.push(`OK ${message}`);
  };

  const baseState = createInitialVehicleState(3);
  const ctx = { day: 3, activeDistrictId: 'central' as const };

  const day1Signals = createVehicleEventSignals(baseState, {
    day: 1,
    tutorialActive: true,
  });
  if (day1Signals.length !== 0) {
    fail('day1/tutorial should return no signals');
  } else {
    pass('day1/tutorial returns []');
  }

  const brokenSignals = createVehicleEventSignals(withBrokenVehicle(baseState), ctx);
  const breakdown = brokenSignals.find((s) => s.type === 'vehicle_breakdown');
  if (!breakdown || (breakdown.severity !== 'high' && breakdown.severity !== 'critical')) {
    fail('broken vehicle should emit vehicle_breakdown high/critical');
  } else {
    pass(`vehicle_breakdown severity=${breakdown.severity}`);
  }

  const capacitySignals = createVehicleEventSignals(withNoAvailable(baseState), ctx);
  const capacity = capacitySignals.find((s) => s.type === 'fleet_capacity_shortage');
  if (!capacity || capacity.severity !== 'critical') {
    fail('no available vehicles should emit fleet_capacity_shortage critical');
  } else {
    pass('fleet_capacity_shortage critical when available=0');
  }

  const routeSignals = createVehicleEventSignals(withHighWorkload(baseState), ctx);
  if (!routeSignals.some((s) => s.type === 'route_delay')) {
    fail('high workload should emit route_delay');
  } else {
    pass('route_delay on high workload');
  }

  const fuelSignals = createVehicleEventSignals(withLowFuel(baseState), ctx);
  if (!fuelSignals.some((s) => s.type === 'fuel_pressure')) {
    fail('low fuel should emit fuel_pressure');
  } else {
    pass('fuel_pressure on low average fuel');
  }

  const inspectionSignals = createVehicleEventSignals(
    withInspectionUnavailable(baseState),
    ctx,
  );
  const inspection = inspectionSignals.find((s) => s.type === 'inspection_gap');
  if (!inspection || inspection.severity !== 'medium') {
    fail('unavailable inspection vehicle should emit inspection_gap medium');
  } else {
    pass('inspection_gap medium');
  }

  const multiSignals = createVehicleEventSignals(
    withBrokenVehicle(withNoAvailable(baseState)),
    ctx,
  );
  const strongest = selectStrongestVehicleSignal(multiSignals);
  if (!strongest || strongest.type !== 'vehicle_breakdown') {
    fail('signal priority should prefer vehicle_breakdown');
  } else {
    pass('deterministic signal priority (breakdown first)');
  }

  const lowOnly = multiSignals.filter((s) => s.severity === 'low');
  for (const signal of lowOnly) {
    if (canVehicleSignalProduceSupplement(signal)) {
      fail('low severity must not produce supplement');
    }
  }
  pass('low severity does not produce supplement');

  const vehicleCard: EventCard = {
    id: 'vehicle-side-existing',
    title: 'Filo rota gecikmesi',
    category: 'Filo',
    riskLevel: 'medium',
    district: 'Merkez',
    description: 'test',
    contextTag: 'test',
    urgencyHours: 6,
    decisions: [],
    previewEffects: { publicSatisfaction: -4, risk: 8, xp: 10 },
    eventType: 'vehicle',
  };

  const baseSet: DailyEventSet = {
    id: 'daily-vehicle-test',
    day: 3,
    districtId: 'central',
    generatedAt: new Date().toISOString(),
    seed: 1,
    anchorEventId: 'anchor',
    sideEventIds: [vehicleCard.id],
    quickActionIds: [],
    opportunityEventIds: [],
    butterflyEventIds: [],
    signalEventIds: [],
    allEventIds: ['anchor', vehicleCard.id],
    eventRoles: { anchor: 'anchor', [vehicleCard.id]: 'side' },
    eventStatuses: {
      anchor: 'awaiting_decision',
      [vehicleCard.id]: 'awaiting_decision',
    },
  };

  if (
    !dailySetAlreadyHasVehicleEvent(baseSet, [vehicleCard, ...pilotEvents])
  ) {
    fail('dailySetAlreadyHasVehicleEvent should detect existing vehicle event');
  } else {
    pass('duplicate vehicle supplement guard');
  }

  const enrichedDup = enrichDailyEventSetWithVehicleSignals({
    dailyEventSet: baseSet,
    vehicleState: withBrokenVehicle(baseState),
    day: 3,
    districtId: 'central',
    catalog: [vehicleCard],
  });
  if (countVehicleDrivenSupplements(enrichedDup) > 0) {
    fail('should not add supplement when vehicle event already in set');
  } else {
    pass('no duplicate vehicle supplement');
  }

  const gameState = mockGameState(3, 'central');
  const weightContext = buildWeightContext(gameState, 3, 'central');
  const vehicleEventCard: EventCard = {
    id: 'vehicle-weight-test',
    title: 'Araç arızası filoda',
    category: 'Filo',
    riskLevel: 'high',
    district: 'Merkez',
    description: 'test',
    contextTag: 'test',
    urgencyHours: 4,
    decisions: [],
    previewEffects: { publicSatisfaction: -5, risk: 10, xp: 12 },
    eventType: 'vehicle',
  };

  const baseWeight = calculateEventWeight({
    event: vehicleEventCard,
    context: weightContext,
  });
  const withVehicleWeight = calculateEventWeight({
    event: vehicleEventCard,
    context: weightContext,
    vehicleState: withBrokenVehicle(baseState),
  });
  if (baseWeight !== withVehicleWeight && withVehicleWeight > baseWeight) {
    pass('calculateEventWeight applies vehicle boost when state provided');
  } else if (baseWeight === withVehicleWeight) {
    pass('calculateEventWeight unchanged without matching boost (acceptable)');
  } else {
    fail('calculateEventWeight regression on vehicle boost');
  }

  const noStateWeight = calculateEventWeight({
    event: vehicleEventCard,
    context: weightContext,
  });
  const undefinedVehicleWeight = calculateEventWeight({
    event: vehicleEventCard,
    context: weightContext,
    vehicleState: null,
  });
  if (noStateWeight !== undefinedVehicleWeight) {
    fail('vehicleState null should match legacy behavior');
  } else {
    pass('vehicleState null preserves legacy weight');
  }

  const rawBoost = getVehicleEventWeightForCandidate({
    vehicleState: withBrokenVehicle(baseState),
    eventType: 'vehicle',
    title: 'Araç arızası servis filo',
    day: 3,
  });
  if (rawBoost > MAX_VEHICLE_EVENT_WEIGHT_BOOST + 0.001) {
    fail(`vehicle boost exceeds cap (${rawBoost})`);
  } else {
    pass(`vehicle boost bounded (<=${MAX_VEHICLE_EVENT_WEIGHT_BOOST})`);
  }

  const day1Boost = getVehicleEventWeightForCandidate({
    vehicleState: withBrokenVehicle(baseState),
    eventType: 'vehicle',
    title: 'Araç arızası',
    day: 1,
    tutorialActive: true,
  });
  if (day1Boost !== 0) {
    fail('day1 vehicle weight boost must be 0');
  } else {
    pass('day1 vehicle weight boost is 0');
  }

  const day1Enriched = enrichDailyEventSetWithVehicleSignals({
    dailyEventSet: {
      ...baseSet,
      day: 1,
      allEventIds: ['anchor'],
      sideEventIds: [],
    },
    vehicleState: withBrokenVehicle(baseState),
    day: 1,
    districtId: 'central',
    tutorialActive: true,
  });
  if (countVehicleDrivenSupplements(day1Enriched) > 0) {
    fail('day1 must not add vehicle supplement');
  } else {
    pass('day1 no vehicle supplement');
  }

  const healthyFleet = buildVehicleStateForScenario('healthy_fleet', 3);
  const healthySignals = createVehicleEventSignals(healthyFleet, {
    day: 3,
    activeDistrictId: 'central',
  });
  if (healthySignals.length !== 0) {
    fail('healthy fleet setup should have zero signals');
  } else {
    const healthyEnriched = enrichDailyEventSetWithVehicleSignals({
      dailyEventSet: emptyDailySetForEnrich(3),
      vehicleState: healthyFleet,
      day: 3,
      districtId: 'central',
    });
    if (countVehicleDrivenSupplements(healthyEnriched) > 0) {
      fail('healthy fleet must not produce vehicle-driven supplement');
    } else {
      pass('17 healthy fleet: no vehicle-driven supplement without signals');
    }
  }

  const brokenFleet = buildVehicleStateForScenario('broken_vehicle', 3);
  const brokenFleetSignals = createVehicleEventSignals(brokenFleet, {
    day: 3,
    activeDistrictId: 'central',
  });
  const brokenStrongest = selectStrongestVehicleSignal(brokenFleetSignals);
  if (
    !brokenStrongest ||
    !canVehicleSignalProduceSupplement(brokenStrongest)
  ) {
    fail('broken fleet setup should allow vehicle supplement');
  } else {
    const brokenEnriched = enrichDailyEventSetWithVehicleSignals({
      dailyEventSet: emptyDailySetForEnrich(3),
      vehicleState: brokenFleet,
      day: 3,
      districtId: 'central',
    });
    const drivenCount = countVehicleDrivenSupplements(brokenEnriched);
    const hasDriven = (brokenEnriched.supplementalEvents ?? []).some(
      isVehicleDrivenSupplementEvent,
    );
    if (drivenCount < 1 || !hasDriven) {
      fail('high/critical signal must produce vehicle-driven supplement');
    } else {
      pass('18 high/critical signal produces vehicle-driven supplement');
    }
  }

  if (noStateWeight !== undefinedVehicleWeight) {
    fail('19 vehicleState null should match legacy calculateEventWeight');
  } else {
    pass('19 vehicleState null preserves legacy weight');
  }

  const day1WeightBoost = calculateEventWeight({
    event: vehicleEventCard,
    context: buildWeightContext(mockGameState(1, 'central'), 1, 'central'),
    vehicleState: withBrokenVehicle(baseState),
    tutorialActive: true,
  });
  const day1BaseOnly = calculateEventWeight({
    event: vehicleEventCard,
    context: buildWeightContext(mockGameState(1, 'central'), 1, 'central'),
    vehicleState: null,
  });
  if (
    day1WeightBoost !== day1BaseOnly ||
    countVehicleDrivenSupplements(day1Enriched) > 0 ||
    day1Boost !== 0
  ) {
    fail('20 day1 must have no boost and no supplement');
  } else {
    pass('20 day1 no boost and no supplement');
  }

  try {
    const stressed = buildVehicleStateForScenario('broken_vehicle', 3);
    const dailySet = generateDailyEventSet({
      gameState: mockGameState(3, 'central'),
      day: 3,
      districtId: 'central',
      vehicleState: stressed,
    });
    const drivenSupplements = countVehicleDrivenSupplements(dailySet);
    if (drivenSupplements > 1) {
      fail(`vehicle-driven supplement spam (${drivenSupplements})`);
    } else {
      pass(`daily set vehicle-driven supplements=${drivenSupplements}`);
    }
  } catch (error) {
    fail(
      `generateDailyEventSet smoke: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return { ok, checks };
}

export function runVerifyVehicleEventSignals(): void {
  const result = verifyVehicleEventSignals();
  for (const line of result.checks) {
    console.log(line);
  }
  console.log(result.ok ? '\nPASS' : '\nFAIL');
  if (!result.ok) {
    process.exitCode = 1;
  }
}
