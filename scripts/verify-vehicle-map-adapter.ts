/**
 * Araç harita adapter smoke doğrulaması.
 * Çalıştır: npx tsx scripts/verify-vehicle-map-adapter.ts
 */

import { createInitialVehicleState, recomputeVehicleAggregates } from '../src/core/vehicles/vehicleSeed';
import type { VehicleState } from '../src/core/vehicles/vehicleTypes';
import {
  buildMapVehiclePins,
  buildNeighborhoodVehicleBadges,
  resolveVehiclePinSeverity,
} from '../src/features/map/utils/vehicleMapAdapter';

function pass(message: string) {
  console.log(`OK ${message}`);
}

function fail(message: string): never {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
  throw new Error(message);
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    fail(message);
  }
  pass(message);
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function run() {
  let ok = true;

  const tryAssert = (condition: boolean, message: string) => {
    try {
      assert(condition, message);
    } catch {
      ok = false;
    }
  };

  tryAssert(buildMapVehiclePins(null).length === 0, 'null vehicleState returns no pins');
  tryAssert(buildMapVehiclePins(undefined).length === 0, 'undefined vehicleState returns no pins');

  const seedState = createInitialVehicleState(3);
  tryAssert(
    buildMapVehiclePins(seedState, { tutorialActive: true }).length === 0,
    'tutorialActive returns no pins',
  );

  const seedPins = buildMapVehiclePins(seedState);
  tryAssert(seedPins.length === 6, 'seed state produces 6 pins');

  const pinIds = new Set(seedPins.map((pin) => pin.id));
  tryAssert(pinIds.size === seedPins.length, 'pin ids are unique');

  const seedPinsAgain = buildMapVehiclePins(seedState);
  tryAssert(
    JSON.stringify(seedPins) === JSON.stringify(seedPinsAgain),
    'pin output is deterministic',
  );

  const byHood = new Map<string, typeof seedPins>();
  for (const pin of seedPins) {
    const list = byHood.get(pin.neighborhoodId) ?? [];
    list.push(pin);
    byHood.set(pin.neighborhoodId, list);
  }
  for (const [, pins] of byHood) {
    if (pins.length < 2) {
      continue;
    }
    for (let i = 0; i < pins.length; i += 1) {
      for (let j = i + 1; j < pins.length; j += 1) {
        tryAssert(
          distance(pins[i]!, pins[j]!) > 0.008,
          `pins in ${pins[i]!.neighborhoodId} are not stacked`,
        );
      }
    }
  }

  const brokenState: VehicleState = {
    ...seedState,
    units: seedState.units.map((unit, index) =>
      index === 0
        ? { ...unit, operationalStatus: 'broken', breakdownRisk: 90, condition: 20 }
        : unit,
    ),
  };
  brokenState.aggregates = recomputeVehicleAggregates(brokenState.units);
  const brokenPin = buildMapVehiclePins(brokenState).find(
    (pin) => pin.vehicleId === brokenState.units[0]!.id,
  );
  tryAssert(brokenPin?.severity === 'critical', 'broken vehicle pin is critical');

  const maintenanceState: VehicleState = {
    ...seedState,
    units: seedState.units.map((unit, index) =>
      index === 1
        ? {
            ...unit,
            operationalStatus: 'maintenance',
            maintenanceNeed: 82,
            breakdownRisk: 70,
          }
        : unit,
    ),
  };
  maintenanceState.aggregates = recomputeVehicleAggregates(maintenanceState.units);
  const maintenancePin = buildMapVehiclePins(maintenanceState).find(
    (pin) => pin.vehicleId === maintenanceState.units[1]!.id,
  );
  tryAssert(
    maintenancePin?.severity === 'danger',
    'maintenance-risk vehicle pin is danger',
  );

  const workloadState: VehicleState = {
    ...seedState,
    units: seedState.units.map((unit, index) =>
      index === 2
        ? { ...unit, workload: 78, operationalStatus: 'assigned' as const }
        : unit,
    ),
  };
  workloadState.aggregates = recomputeVehicleAggregates(workloadState.units);
  const workloadPin = buildMapVehiclePins(workloadState).find(
    (pin) => pin.vehicleId === workloadState.units[2]!.id,
  );
  tryAssert(
    workloadPin?.severity === 'warning',
    'high workload assigned vehicle pin is warning',
  );

  const criticalOnSeed = seedPins.filter((pin) => pin.severity === 'critical').length;
  tryAssert(
    criticalOnSeed === 0,
    'healthy seed pins avoid unnecessary critical severity',
  );

  const seedBadges = buildNeighborhoodVehicleBadges(seedState);
  tryAssert(
    seedBadges.length <= 1,
    'healthy seed avoids badge spam',
  );

  const brokenBadges = buildNeighborhoodVehicleBadges(brokenState);
  const sanayiBadge = brokenBadges.find(
    (badge) => badge.neighborhoodId === 'sanayi' || badge.neighborhoodId === 'merkez',
  );
  tryAssert(
    brokenBadges.some((badge) => badge.severity === 'critical' && badge.label === 'Araç arızası'),
    'broken vehicle neighborhood gets critical badge',
  );
  void sanayiBadge;

  const snapshot = JSON.stringify(seedState);
  buildMapVehiclePins(seedState);
  buildNeighborhoodVehicleBadges(seedState);
  tryAssert(
    JSON.stringify(seedState) === snapshot,
    'adapter helpers do not mutate vehicleState',
  );

  tryAssert(
    buildNeighborhoodVehicleBadges(seedState, { tutorialActive: true }).length === 0,
    'tutorialActive returns no neighborhood badges',
  );

  const unit = seedState.units[0]!;
  tryAssert(
    resolveVehiclePinSeverity({ ...unit, operationalStatus: 'broken' }) === 'critical',
    'resolveVehiclePinSeverity marks broken as critical',
  );

  console.log(ok ? '\nPASS' : '\nFAIL');
  if (!ok) {
    process.exitCode = 1;
  }
}

run();
