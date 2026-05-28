/**
 * Container critical tuning smoke tests.
 * Çalıştır: npm run verify:container-tuning
 */

import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import {
  CONTAINER_COMPOSITE_CRITICAL,
  CONTAINER_FILL_THRESHOLDS,
  CONTAINER_ODOR_THRESHOLDS,
} from '@/core/containers/containerConstants';
import {
  applyContainerDecisionEffects,
  classifyContainerDecisionAction,
} from '@/core/containers/containerDecisionEffects';
import {
  applyContainerDailyUpdate,
  buildNeighborhoodContainerStatus,
  calculateOverflowRisk,
} from '@/core/containers/containerEngine';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { mapContainerSeverityFromStatus } from '@/core/containers/containerUiHelpers';
import type { ContainerUnit } from '@/core/containers/containerTypes';

const checks: string[] = [];
function assert(label: string, ok: boolean): void {
  checks.push(ok ? `✓ ${label}` : `✗ ${label}`);
  if (!ok) process.exitCode = 1;
}

const analysis = runFullLoopAnalysis();
const balanced = analysis.scenarios.find((s) => s.scenario === 'balanced_player');
const operation = analysis.scenarios.find((s) => s.scenario === 'operation_player');
const risky = analysis.scenarios.find((s) => s.scenario === 'risky_fast_player');
const passive = analysis.scenarios.find((s) => s.scenario === 'passive_player');

assert(
  'balanced containerCriticalDays < 6',
  (balanced?.containerCriticalNeighborhoodDays ?? 99) < 6,
);
assert(
  'operation containerCriticalDays <= balanced',
  (operation?.containerCriticalNeighborhoodDays ?? 99) <=
    (balanced?.containerCriticalNeighborhoodDays ?? 0),
);
let driftOnly = createInitialContainerState(1);
for (let d = 1; d <= 7; d++) {
  driftOnly = applyContainerDailyUpdate(driftOnly, { day: d }).state;
}
const driftCriticalHoods = Object.values(driftOnly.aggregates).filter(
  (s) => s.statusLabel === 'Kritik' || s.criticalContainerCount >= 1,
).length;
assert(
  '7-day drift can still produce critical pressure',
  driftCriticalHoods > 0,
);
assert(
  'elevated/high pressure still visible in loop',
  analysis.scenarios.some(
    (s) =>
      s.containerHighNeighborhoodDays > 0 || s.containerElevatedNeighborhoodDays > 0,
  ),
);

const seed = createInitialContainerState(1);
const singleSpikeCritical = calculateOverflowRisk({
  fillRate: CONTAINER_FILL_THRESHOLDS.critical,
  odorLevel: 40,
  maintenanceNeed: 30,
  condition: 80,
});
assert(
  'single fill spike alone is not critical',
  singleSpikeCritical !== 'critical',
);

const compositeCritical = calculateOverflowRisk({
  fillRate: CONTAINER_COMPOSITE_CRITICAL.fillMin,
  odorLevel: CONTAINER_COMPOSITE_CRITICAL.odorMin,
  maintenanceNeed: 30,
  condition: 80,
});
assert('composite fill+odor is critical', compositeCritical === 'critical');

const units = seed.units.filter((u) => u.neighborhoodId === 'sanayi');
const oneBad: ContainerUnit = {
  ...units[0]!,
  fillRate: 95,
  odorLevel: 75,
  maintenanceNeed: 40,
  condition: 50,
  overflowRisk: 'critical',
};
const othersNormal = units.slice(1).map((u) => ({
  ...u,
  fillRate: 48,
  odorLevel: 35,
  maintenanceNeed: 25,
  condition: 75,
  overflowRisk: 'medium' as const,
}));
const aggOneBad = buildNeighborhoodContainerStatus(
  'sanayi',
  [oneBad, ...othersNormal],
  3,
);
assert(
  'one critical unit does not make neighborhood Kritik',
  aggOneBad.statusLabel !== 'Kritik',
);

const twoBad = units.map((u, i) =>
  i < 2
    ? {
        ...u,
        fillRate: 95,
        odorLevel: 78,
        maintenanceNeed: 50,
        condition: 40,
        overflowRisk: 'critical' as const,
      }
    : {
        ...u,
        fillRate: 70,
        odorLevel: 55,
        maintenanceNeed: 40,
        condition: 60,
        overflowRisk: 'high' as const,
      },
);
const aggTwoBad = buildNeighborhoodContainerStatus('sanayi', twoBad, 5);
assert(
  'two critical units can make neighborhood Kritik',
  aggTwoBad.statusLabel === 'Kritik',
);

const wasteEvent = {
  id: 'e-waste',
  eventType: 'waste',
  title: 'Konteyner taşması',
  category: 'Temizlik',
  neighborhoodId: 'sanayi',
};
const dispatch = applyContainerDecisionEffects({
  containerState: seed,
  event: wasteEvent,
  decision: { id: 'd1', title: 'Ekibi yönlendir', decisionStyle: 'fast' },
  day: 1,
  personnelAssigned: true,
});
const beforeFill =
  seed.units.find((u) => u.id === dispatch.affectedUnitIds[0])?.fillRate ?? 0;
const afterFill =
  dispatch.state.units.find((u) => u.id === dispatch.affectedUnitIds[0])
    ?.fillRate ?? 0;
assert('dispatch lowers container fill', afterFill < beforeFill);

const comm = applyContainerDecisionEffects({
  containerState: seed,
  event: { ...wasteEvent, neighborhoodId: 'merkez' },
  decision: { id: 'd2', title: 'İletişim kur', decisionStyle: 'communication' },
  day: 1,
});
const commUnit = seed.units.find((u) => u.neighborhoodId === 'merkez')!;
const commAfter = comm.state.units.find((u) => u.id === commUnit.id)!;
assert(
  'communicate does not heavily drop fill',
  commUnit.fillRate - commAfter.fillRate <= 5,
);

const highLabelSeverity = mapContainerSeverityFromStatus({
  ...aggOneBad,
  statusLabel: 'Yüksek',
});
assert('Yüksek label maps to high not critical UI', highLabelSeverity === 'high');

const day1 = createInitialContainerState(1);
assert(
  'day1 tutorial aggregate still present',
  Object.keys(day1.aggregates).length === 5,
);

const routeAction = classifyContainerDecisionAction({
  event: wasteEvent,
  decision: { id: 'r', title: 'Toplama rotasını öne al' },
});
assert('route action classified', routeAction === 'prioritize_route');

for (const line of checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (process.exitCode === 1) {
  // eslint-disable-next-line no-console
  console.error('\nContainer tuning verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nContainer tuning verify passed.');
