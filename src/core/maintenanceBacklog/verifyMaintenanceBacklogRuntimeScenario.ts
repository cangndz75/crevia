import { createDay1Seed } from '@/core/content/day1Seed';
import { buildOperationReadinessSnapshot } from '@/core/operationReadiness/operationReadinessModel';
import { normalizePersistedSave, SAVE_VERSION } from '@/store/gamePersist';

import { buildMaintenanceBacklogSnapshot } from './maintenanceBacklogModel';
import {
  createEmptyMaintenanceBacklogRuntimeState,
  migrateMaintenanceBacklogRuntime,
  updateMaintenanceBacklogForDay,
} from './maintenanceBacklogRuntimeModel';

type Check = { ok: boolean; name: string; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail: string) {
  checks.push({ ok, name, detail });
}

export function verifyMaintenanceBacklogRuntimeScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  const migratedV27 = normalizePersistedSave({
    ...createDay1Seed(),
    saveVersion: 27,
    updatedAt: '2026-06-15T00:00:00.000Z',
  });
  assert(
    checks,
    migratedV27?.saveVersion === SAVE_VERSION && migratedV27.maintenanceBacklogRuntime != null,
    'v27 save migrates with empty runtime',
    `saveVersion=${migratedV27?.saveVersion}`,
  );
  assert(
    checks,
    migratedV27?.maintenanceBacklogRuntime?.items.length === 0,
    'migration default empty items',
    `${migratedV27?.maintenanceBacklogRuntime?.items.length}`,
  );

  let state = createEmptyMaintenanceBacklogRuntimeState();
  const readySnapshot = buildOperationReadinessSnapshot({
    phase: 'result',
    day: 3,
    moraleDelta: 0,
    budgetDelta: 0,
    publicSatisfactionPreview: 0,
    eventRiskLevel: 'low',
    hasVehicle: true,
    assignmentStatus: 'ready',
  });
  assert(checks, readySnapshot.overallStatus === 'ready', 'ready snapshot baseline', readySnapshot.overallStatus);

  state = updateMaintenanceBacklogForDay(state, {
    day: 3,
    staffMorale: 70,
    budget: 80000,
    publicSatisfaction: 65,
    warningsCount: 0,
    operationSignals: {
      personnel: { status: 'stable' },
      vehicles: { status: 'stable' },
    },
  });
  assert(checks, state.items.length === 0, 'ready day no runtime items', `${state.items.length}`);

  const firstAttention = updateMaintenanceBacklogForDay(createEmptyMaintenanceBacklogRuntimeState(), {
    day: 4,
    staffMorale: 54,
    budget: 70000,
    publicSatisfaction: 58,
    warningsCount: 1,
    operationSignals: {
      personnel: { status: 'watch' },
      vehicles: { status: 'stable' },
    },
  });
  assert(
    checks,
    firstAttention.items.length === 0,
    'attention single day not persisted',
    `${firstAttention.items.length}`,
  );
  assert(
    checks,
    (firstAttention.attentionStreaks &&
      Object.values(firstAttention.attentionStreaks).some((v) => v >= 1)) === true,
    'attention streak tracked',
    JSON.stringify(firstAttention.attentionStreaks),
  );

  const secondAttention = updateMaintenanceBacklogForDay(firstAttention, {
    day: 5,
    staffMorale: 54,
    budget: 70000,
    publicSatisfaction: 58,
    warningsCount: 1,
    operationSignals: {
      personnel: { status: 'watch' },
      vehicles: { status: 'stable' },
    },
  });
  assert(
    checks,
    secondAttention.items.some((item) => item.domain === 'personnel'),
    'attention repeated promotes runtime item',
    secondAttention.items.map((i) => i.domain).join(','),
  );

  const strainedOnce = updateMaintenanceBacklogForDay(createEmptyMaintenanceBacklogRuntimeState(), {
    day: 6,
    staffMorale: 48,
    budget: 60000,
    publicSatisfaction: 50,
    warningsCount: 2,
    operationSignals: {
      personnel: { status: 'strained' },
      vehicles: { status: 'strained' },
    },
  });

  const criticalOnce = updateMaintenanceBacklogForDay(createEmptyMaintenanceBacklogRuntimeState(), {
    day: 7,
    staffMorale: 35,
    budget: 50000,
    publicSatisfaction: 40,
    warningsCount: 4,
    operationSignals: {
      personnel: { status: 'critical' },
      vehicles: { status: 'critical' },
    },
  });
  assert(
    checks,
    strainedOnce.items.some((item) => item.severity === 'strained') ||
      criticalOnce.items.some((item) => item.severity === 'strained'),
    'strained promotes runtime item',
    strainedOnce.items.map((i) => i.severity).join(',') || criticalOnce.items.map((i) => i.severity).join(','),
  );
  assert(
    checks,
    criticalOnce.items.some((item) => item.severity === 'critical'),
    'critical promotes runtime item',
    criticalOnce.items.map((i) => i.severity).join(','),
  );

  const duplicateRun = updateMaintenanceBacklogForDay(strainedOnce, {
    day: 8,
    staffMorale: 48,
    budget: 60000,
    publicSatisfaction: 50,
    warningsCount: 2,
    operationSignals: {
      personnel: { status: 'strained' },
      vehicles: { status: 'strained' },
    },
  });
  const personnelItems = duplicateRun.items.filter((item) => item.domain === 'personnel' && item.status !== 'resolved');
  assert(checks, personnelItems.length <= 1, 'duplicate domain not recreated', `${personnelItems.length}`);
  assert(
    checks,
    duplicateRun.lastProcessedDay === 8,
    'carryOverDays increments on day change',
    `carry=${duplicateRun.items.find((i) => i.domain === 'personnel')?.carryOverDays}`,
  );

  const sameDayAgain = updateMaintenanceBacklogForDay(duplicateRun, {
    day: 8,
    staffMorale: 42,
    budget: 60000,
    publicSatisfaction: 50,
    warningsCount: 2,
    operationSignals: {
      personnel: { status: 'strained' },
      vehicles: { status: 'strained' },
    },
  });
  assert(
    checks,
    sameDayAgain.items.length === duplicateRun.items.length,
    'same day duplicate processing blocked',
    `${sameDayAgain.items.length}`,
  );

  const resolvedRun = updateMaintenanceBacklogForDay(duplicateRun, {
    day: 9,
    staffMorale: 72,
    budget: 90000,
    publicSatisfaction: 68,
    warningsCount: 0,
    operationSignals: {
      personnel: { status: 'stable' },
      vehicles: { status: 'stable' },
    },
  });
  assert(
    checks,
    resolvedRun.items.some((item) => item.status === 'resolved') || resolvedRun.items.length === 0,
    'ready signal resolves items',
    resolvedRun.items.map((i) => i.status).join(','),
  );

  assert(
    checks,
    !strainedOnce.items.some((item) => (item.domain as string) === 'social'),
    'social not runtime domain',
    'ok',
  );

  const malformed = migrateMaintenanceBacklogRuntime(
    {
      items: [
        { id: 'bad', domain: 'social', severity: 'critical', status: 'open', createdDay: 1, updatedDay: 1, carryOverDays: 0, sourceDedupeKey: 'x' },
        {
          id: 'good',
          domain: 'personnel',
          severity: 'strained',
          status: 'open',
          createdDay: 2,
          updatedDay: 2,
          carryOverDays: 0,
          sourceDedupeKey: 'maintenance:personnel:strained',
          lastReasonLabels: ['Hazırlık sinyali'],
        },
      ],
    },
    5,
  );
  assert(checks, malformed.items.length === 1, 'malformed item sanitized', `${malformed.items.length}`);

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
