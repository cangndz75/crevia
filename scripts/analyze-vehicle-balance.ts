/**
 * Araç filosu — 7 günlük denge simülasyonu.
 * Çalıştır: npx tsx scripts/analyze-vehicle-balance.ts
 */

import { calculateEventWeight } from '../src/core/game/calculateEventWeight';
import { createDefaultPilotState } from '../src/core/game/createDefaultPilotState';
import type { PilotEventSelectionContext } from '../src/core/game/pilotConditions';
import { applyVehicleDecisionEffects } from '../src/core/vehicles/vehicleDecisionEffects';
import { processVehiclesEndOfDay } from '../src/core/vehicles/vehicleEngine';
import { createVehicleEventSignals } from '../src/core/vehicles/vehicleEventSignals';
import {
  applyVehicleFleetAction,
  canApplyVehicleFleetAction,
  selectRecommendedVehicleFleetActions,
} from '../src/core/vehicles/vehicleManualActions';
import { createInitialVehicleState } from '../src/core/vehicles/vehicleSeed';
import type { VehicleState } from '../src/core/vehicles/vehicleTypes';
import type { GameState } from '../src/core/models/GameState';
import type { PilotDistrictId } from '../src/core/models/DistrictProfile';

const PILOT_DAYS = 7;
const DISTRICT: PilotDistrictId = 'central';

type ScenarioId =
  | 'baseline_no_actions'
  | 'aggressive_collection_decisions'
  | 'maintenance_focused'
  | 'neglect_maintenance'
  | 'route_support_heavy'
  | 'mixed_reasonable';

type DayAction =
  | 'none'
  | 'dispatch_collection'
  | 'maintenance'
  | 'prioritize_route'
  | 'monitor';

type ManualPlan = 'none' | 'maintenance' | 'rest' | 'route_support' | 'recommended';

type BalanceVerdict = 'PASS' | 'WARN' | 'FAIL';

type ScenarioReport = {
  scenario: ScenarioId;
  finalAverageCondition: number;
  finalAverageWorkload: number;
  finalAverageBreakdownRisk: number;
  finalAverageRouteEfficiency: number;
  finalAvailable: number;
  brokenCount: number;
  criticalCount: number;
  vehicleSignalDays: number;
  manualActionsApplied: number;
  manualActionsSkipped: number;
  warnings: string[];
  fails: string[];
};

const WASTE_EVENT = {
  id: 'sim-waste-event',
  title: 'Konteyner taşması ve çöp toplama',
  category: 'waste',
  eventType: 'waste',
  neighborhoodId: 'sanayi',
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
      name: 'Sim',
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
    },
  } as unknown as GameState;
}

function decisionFor(action: DayAction) {
  switch (action) {
    case 'dispatch_collection':
      return { id: 'd-dispatch', title: 'Çöp toplama ekibini sahaya gönder' };
    case 'maintenance':
      return { id: 'd-maint', title: 'Bakım ve servis planla' };
    case 'prioritize_route':
      return { id: 'd-route', title: 'Rotayı optimize et ve güzergahı önceliklendir' };
    case 'monitor':
      return { id: 'd-monitor', title: 'Durumu izle ve raporla' };
    default:
      return { id: 'd-none', title: 'Vatandaşı bilgilendir' };
  }
}

function applyDayDecision(
  state: VehicleState,
  action: DayAction,
  day: number,
): VehicleState {
  if (action === 'none') {
    return state;
  }
  const result = applyVehicleDecisionEffects({
    vehicleState: state,
    event: WASTE_EVENT,
    decision: decisionFor(action),
    day,
  });
  return result.state;
}

function applyManualPlan(
  state: VehicleState,
  plan: ManualPlan,
  day: number,
): { state: VehicleState; applied: number; skipped: number } {
  let next = state;
  let applied = 0;
  let skipped = 0;

  const runAction = (
    type: 'send_to_maintenance' | 'rest_vehicle' | 'route_support',
    vehicleId: string,
  ) => {
    const gate = canApplyVehicleFleetAction(next, type, vehicleId, day);
    if (!gate.allowed) {
      skipped += 1;
      return;
    }
    const result = applyVehicleFleetAction(next, { type, vehicleId, day });
    if (result.applied) {
      next = result.state;
      applied += 1;
    } else {
      skipped += 1;
    }
  };

  if (plan === 'none') {
    return { state: next, applied, skipped };
  }

  if (plan === 'recommended') {
    const recs = selectRecommendedVehicleFleetActions(next, day);
    for (const rec of recs) {
      runAction(rec.type, rec.vehicleId);
    }
    return { state: next, applied, skipped };
  }

  const target =
    [...next.units].sort((a, b) => b.maintenanceNeed - a.maintenanceNeed)[0] ??
    next.units[0];
  if (!target) {
    return { state: next, applied, skipped };
  }

  if (plan === 'maintenance') {
    runAction('send_to_maintenance', target.id);
  } else if (plan === 'rest') {
    const restTarget =
      [...next.units].sort((a, b) => b.workload - a.workload)[0] ?? target;
    runAction('rest_vehicle', restTarget.id);
  } else if (plan === 'route_support') {
    const routeTarget =
      next.units.find((unit) => unit.operationalStatus === 'available') ?? target;
    runAction('route_support', routeTarget.id);
  }

  return { state: next, applied, skipped };
}

function scenarioPlan(
  scenario: ScenarioId,
  day: number,
): { decision: DayAction; manual: ManualPlan } {
  switch (scenario) {
    case 'baseline_no_actions':
      return { decision: 'none', manual: 'none' };
    case 'aggressive_collection_decisions':
      return { decision: 'dispatch_collection', manual: 'none' };
    case 'maintenance_focused':
      return {
        decision: day % 2 === 0 ? 'maintenance' : 'monitor',
        manual: 'maintenance',
      };
    case 'neglect_maintenance':
      return { decision: 'dispatch_collection', manual: 'none' };
    case 'route_support_heavy':
      return {
        decision: 'prioritize_route',
        manual: 'route_support',
      };
    case 'mixed_reasonable':
      if (day <= 2) {
        return { decision: 'monitor', manual: 'none' };
      }
      if (day <= 4) {
        return { decision: 'dispatch_collection', manual: 'recommended' };
      }
      if (day === 5) {
        return { decision: 'maintenance', manual: 'maintenance' };
      }
      return { decision: 'prioritize_route', manual: 'rest' };
    default:
      return { decision: 'none', manual: 'none' };
  }
}

function evaluateScenario(scenario: ScenarioId): ScenarioReport {
  let state = createInitialVehicleState(1);
  let vehicleSignalDays = 0;
  let manualApplied = 0;
  let manualSkipped = 0;
  const warnings: string[] = [];
  const fails: string[] = [];

  for (let day = 1; day <= PILOT_DAYS; day += 1) {
    const plan = scenarioPlan(scenario, day);
    state = applyDayDecision(state, plan.decision, day);
    const manualResult = applyManualPlan(state, plan.manual, day);
    state = manualResult.state;
    manualApplied += manualResult.applied;
    manualSkipped += manualResult.skipped;

    const signals = createVehicleEventSignals(state, {
      day,
      activeDistrictId: DISTRICT,
      tutorialActive: day <= 1,
    });
    if (signals.length > 0) {
      vehicleSignalDays += 1;
    }

    state = processVehiclesEndOfDay(state, day);

    if (state.aggregates.broken > 2) {
      fails.push(`day ${day}: broken fleet spike (${state.aggregates.broken})`);
    }
    if (state.aggregates.available === 0 && scenario !== 'neglect_maintenance') {
      warnings.push(`day ${day}: zero available vehicles`);
    }
  }

  const agg = state.aggregates;
  if (scenario === 'baseline_no_actions' && agg.averageCondition < 40) {
    warnings.push('baseline condition dropped below 40');
  }
  if (scenario === 'neglect_maintenance' && agg.averageBreakdownRisk < 35) {
    warnings.push('neglect scenario did not raise breakdown risk enough');
  }
  if (scenario === 'maintenance_focused') {
    if (agg.averageCondition < 70) {
      warnings.push('maintenance_focused condition below 70');
    }
    if (agg.averageBreakdownRisk > 40) {
      warnings.push('maintenance_focused breakdown risk still high');
    }
  }
  if (scenario === 'route_support_heavy') {
    if (agg.averageRouteEfficiency < 60) {
      warnings.push('route_support_heavy route efficiency gain weak');
    }
    if (agg.averageWorkload < 40) {
      warnings.push('route_support_heavy workload cost not visible');
    }
  }
  if (scenario === 'mixed_reasonable' && agg.broken > 1) {
    warnings.push('mixed_reasonable produced multiple broken vehicles');
  }
  if (agg.broken >= state.units.length) {
    fails.push('entire fleet broken');
  }

  return {
    scenario,
    finalAverageCondition: agg.averageCondition,
    finalAverageWorkload: agg.averageWorkload,
    finalAverageBreakdownRisk: agg.averageBreakdownRisk,
    finalAverageRouteEfficiency: agg.averageRouteEfficiency,
    finalAvailable: agg.available,
    brokenCount: agg.broken,
    criticalCount: agg.criticalCount,
    vehicleSignalDays,
    manualActionsApplied: manualApplied,
    manualActionsSkipped: manualSkipped,
    warnings,
    fails,
  };
}

function checkCombinedBoostClamp(): BalanceVerdict {
  const gameState = mockGameState(3);
  const context: PilotEventSelectionContext = {
    gameState,
    selectedDistrictId: DISTRICT,
    pilot: gameState.pilot,
    currentDay: 3,
    flags: {},
  };
  const vehicleState = createInitialVehicleState(3);
  const stressed = {
    ...vehicleState,
    units: vehicleState.units.map((unit, index) =>
      index === 0
        ? { ...unit, operationalStatus: 'broken' as const, breakdownRisk: 90 }
        : { ...unit, operationalStatus: 'assigned' as const, workload: 85 },
    ),
  };
  const event = {
    id: 'boost-test',
    title: 'Araç arızası filo rota',
    category: 'Filo',
    riskLevel: 'high' as const,
    district: 'Merkez',
    description: 'test',
    contextTag: 'test',
    urgencyHours: 4,
    eventType: 'vehicle' as const,
    priority: 2,
    decisions: [],
    previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
  };

  const base = calculateEventWeight({ event, context, vehicleState: null });
  const vehicleOnly = calculateEventWeight({ event, context, vehicleState: stressed });
  const vehicleBoost = (vehicleOnly - base) / base;

  if (vehicleBoost > 0.22 + 0.01) {
    console.log(`WARN vehicle-only boost ${vehicleBoost.toFixed(3)} exceeds 0.22 cap`);
    return 'WARN';
  }
  console.log(`OK vehicle boost cap sample=${vehicleBoost.toFixed(3)}`);
  return 'PASS';
}

function printReport(report: ScenarioReport) {
  console.log(`--- ${report.scenario} ---`);
  console.log(`  finalAverageCondition: ${report.finalAverageCondition}`);
  console.log(`  finalAverageWorkload: ${report.finalAverageWorkload}`);
  console.log(`  finalAverageBreakdownRisk: ${report.finalAverageBreakdownRisk}`);
  console.log(`  finalAverageRouteEfficiency: ${report.finalAverageRouteEfficiency}`);
  console.log(`  finalAvailable: ${report.finalAvailable}`);
  console.log(`  brokenCount: ${report.brokenCount}`);
  console.log(`  criticalCount: ${report.criticalCount}`);
  console.log(`  vehicleSignalDays: ${report.vehicleSignalDays}`);
  console.log(`  manualActionsApplied: ${report.manualActionsApplied}`);
  console.log(`  manualActionsSkipped: ${report.manualActionsSkipped}`);
  if (report.warnings.length > 0) {
    console.log(`  warnings: ${report.warnings.join('; ')}`);
  }
  if (report.fails.length > 0) {
    console.log(`  fails: ${report.fails.join('; ')}`);
  }
  console.log('');
}

const scenarios: ScenarioId[] = [
  'baseline_no_actions',
  'aggressive_collection_decisions',
  'maintenance_focused',
  'neglect_maintenance',
  'route_support_heavy',
  'mixed_reasonable',
];

console.log('=== Araç Filosu Denge Analizi (7 gün) ===\n');

const reports = scenarios.map(evaluateScenario);
for (const report of reports) {
  printReport(report);
}

console.log('--- Boost clamp smoke ---');
checkCombinedBoostClamp();

const totalFails = reports.reduce((sum, report) => sum + report.fails.length, 0);
const totalWarnings = reports.reduce((sum, report) => sum + report.warnings.length, 0);
const baseline = reports.find((r) => r.scenario === 'baseline_no_actions')!;
const neglect = reports.find((r) => r.scenario === 'neglect_maintenance')!;
const maintenance = reports.find((r) => r.scenario === 'maintenance_focused')!;
const mixed = reports.find((r) => r.scenario === 'mixed_reasonable')!;

console.log('--- Freeze özeti ---');
console.log(
  `baseline condition=${baseline.finalAverageCondition} broken=${baseline.brokenCount}`,
);
console.log(
  `neglect risk=${neglect.finalAverageBreakdownRisk} broken=${neglect.brokenCount} signals=${neglect.vehicleSignalDays}`,
);
console.log(
  `maintenance condition=${maintenance.finalAverageCondition} risk=${maintenance.finalAverageBreakdownRisk}`,
);
console.log(
  `mixed condition=${mixed.finalAverageCondition} available=${mixed.finalAvailable} broken=${mixed.brokenCount}`,
);
console.log(`totalWarnings=${totalWarnings} totalFails=${totalFails}`);

if (totalFails > 0) {
  console.log('\nFREEZE: FAIL');
  process.exitCode = 1;
} else if (totalWarnings > 4) {
  console.log('\nFREEZE: WARN');
} else {
  console.log('\nFREEZE: PASS');
}
