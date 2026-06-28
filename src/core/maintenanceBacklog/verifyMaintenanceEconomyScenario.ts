import { createDay1Seed } from '@/core/content/day1Seed';
import { normalizePersistedSave, SAVE_VERSION } from '@/store/gamePersist';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';

/** Economy fields hydrate at load for v28 saves — separate persist bump deferred. */
const MAINTENANCE_ECONOMY_MIGRATION_FROM_VERSION = 28;

import {
  applyMaintenanceActionToRuntimeState,
  isMaintenanceActionEligible,
} from './maintenanceActionModel';
import {
  estimateMaintenanceEconomyPlan,
  processMaintenanceEconomyDayClose,
  sanitizeMaintenanceEconomyFields,
} from './maintenanceEconomyModel';
import { migrateMaintenanceBacklogRuntime } from './maintenanceBacklogRuntimeModel';
import { resolveMaintenanceBacklogRuntimeOnPersistLoad } from './maintenanceBacklogRuntimeMigration';
import type { MaintenanceRuntimeItem } from './maintenanceBacklogRuntimeTypes';

type Check = { ok: boolean; name: string; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail: string) {
  checks.push({ ok, name, detail });
}

function item(
  overrides: Partial<MaintenanceRuntimeItem> & Pick<MaintenanceRuntimeItem, 'id' | 'domain'>,
): MaintenanceRuntimeItem {
  return sanitizeMaintenanceEconomyFields({
    severity: 'attention',
    status: 'open',
    createdDay: 3,
    updatedDay: 3,
    carryOverDays: 0,
    sourceDedupeKey: `k-${overrides.id}`,
    lastReasonLabels: ['test'],
    economyStatus: 'none',
    ...overrides,
  });
}

export function verifyMaintenanceEconomyScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  assert(checks, isCurrentSaveVersion(28), 'SAVE_VERSION is 28', `SAVE_VERSION=${SAVE_VERSION}`);
  assert(
    checks,
    MAINTENANCE_ECONOMY_MIGRATION_FROM_VERSION === 28,
    'economy migration from v28',
    String(MAINTENANCE_ECONOMY_MIGRATION_FROM_VERSION ?? 'missing'),
  );

  const migrated = resolveMaintenanceBacklogRuntimeOnPersistLoad({
    rawMaintenanceBacklogRuntime: {
      items: [
        {
          id: 'legacy-1',
          domain: 'personnel',
          severity: 'strained',
          status: 'open',
          createdDay: 2,
          updatedDay: 2,
          carryOverDays: 0,
          sourceDedupeKey: 'legacy',
          lastReasonLabels: ['legacy'],
          economyStatus: 'bogus',
          estimatedCost: -5,
        },
      ],
      attentionStreaks: {},
    },
    saveVersion: 28,
    currentDay: 5,
  });
  const legacyItem = migrated.items[0];
  assert(checks, legacyItem?.economyStatus === 'none', 'v28 migration economyStatus default', legacyItem?.economyStatus ?? 'missing');
  assert(
    checks,
    legacyItem?.estimatedCost == null || legacyItem.estimatedCost >= 0,
    'malformed economy cost sanitized',
    String(legacyItem?.estimatedCost),
  );

  const monitorPlan = estimateMaintenanceEconomyPlan({
    domain: 'personnel',
    severity: 'attention',
    actionKind: 'monitor',
    currentDay: 4,
  });
  assert(checks, monitorPlan.costBand === 'none', 'monitor cost none/low', monitorPlan.costBand);

  const attention = item({ id: 'a1', domain: 'vehicle', severity: 'attention', status: 'open' });
  const afterInspect = applyMaintenanceActionToRuntimeState(
    { items: [attention], attentionStreaks: {} },
    'a1',
    'inspect',
    5,
  );
  assert(
    checks,
    afterInspect.items[0]?.status === 'resolved',
    'inspect attention resolves',
    afterInspect.items[0]?.status ?? 'missing',
  );

  const critical = item({ id: 'c1', domain: 'route', severity: 'critical', status: 'open' });
  const afterCriticalInspect = applyMaintenanceActionToRuntimeState(
    { items: [critical], attentionStreaks: {} },
    'c1',
    'inspect',
    5,
  );
  assert(
    checks,
    afterCriticalInspect.items[0]?.status !== 'resolved',
    'critical inspect not fully resolved',
    afterCriticalInspect.items[0]?.status ?? 'missing',
  );
  assert(
    checks,
    afterCriticalInspect.items[0]?.economyStatus === 'in_progress',
    'critical inspect economy in_progress',
    afterCriticalInspect.items[0]?.economyStatus ?? 'missing',
  );

  const rebalancePlan = estimateMaintenanceEconomyPlan({
    domain: 'budget',
    severity: 'strained',
    actionKind: 'rebalance',
    currentDay: 4,
  });
  assert(
    checks,
    rebalancePlan.costBand !== 'none' && rebalancePlan.estimatedDays >= 1,
    'rebalance produces cost and duration',
    `${rebalancePlan.costBand}/${rebalancePlan.estimatedDays}`,
  );

  const inProgress = item({
    id: 'p1',
    domain: 'operation',
    severity: 'critical',
    status: 'watching',
    economyStatus: 'in_progress',
    startedDay: 4,
    dueDay: 5,
    estimatedDays: 1,
  });
  const closed = processMaintenanceEconomyDayClose(
    { items: [inProgress], attentionStreaks: {}, lastProcessedDay: 4 },
    5,
  );
  assert(
    checks,
    closed.items[0]?.economyStatus === 'stabilized',
    'dueDay day-close processing',
    closed.items[0]?.economyStatus ?? 'missing',
  );

  assert(
    checks,
    isMaintenanceActionEligible(critical, 'monitor', 5) === false,
    'critical monitor disabled',
    'ok',
  );

  const migratedV28Save = normalizePersistedSave({
    ...createDay1Seed(),
    saveVersion: 28,
    maintenanceBacklogRuntime: {
      items: [
        {
          id: 'save-1',
          domain: 'vehicle',
          severity: 'strained',
          status: 'open',
          createdDay: 3,
          updatedDay: 3,
          carryOverDays: 0,
          sourceDedupeKey: 'veh',
          lastReasonLabels: [],
        },
      ],
      attentionStreaks: {},
    },
  });
  assert(
    checks,
    migratedV28Save?.saveVersion === SAVE_VERSION,
    'v28 save migrates to current version',
    String(migratedV28Save?.saveVersion),
  );
  assert(
    checks,
    migratedV28Save?.maintenanceBacklogRuntime?.items[0]?.economyStatus === 'none',
    'v28 save hydrates economy defaults',
    migratedV28Save?.maintenanceBacklogRuntime?.items[0]?.economyStatus ?? 'missing',
  );

  const failCount = checks.filter((check) => !check.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((check) => `${check.ok ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`),
  };
}
