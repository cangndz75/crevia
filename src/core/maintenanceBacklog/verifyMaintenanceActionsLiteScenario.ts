import { SAVE_VERSION } from '@/store/gamePersist';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';

import {
  applyMaintenanceActionToRuntimeState,
  hasMaintenanceActionToday,
  isMaintenanceActionEligible,
  selectPrimaryMaintenanceActionKind,
} from './maintenanceActionModel';
import {
  buildMaintenanceActionPresentation,
  buildMaintenanceActionResultPresentation,
  selectPrimaryMaintenanceAction,
} from './maintenanceActionPresentation';
import type { MaintenanceActionKind } from './maintenanceActionTypes';
import { createEmptyMaintenanceBacklogRuntimeState } from './maintenanceBacklogRuntimeModel';
import type {
  MaintenanceBacklogRuntimeState,
  MaintenanceRuntimeItem,
} from './maintenanceBacklogRuntimeTypes';

type Check = { ok: boolean; name: string; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail: string) {
  checks.push({ ok, name, detail });
}

function item(
  overrides: Partial<MaintenanceRuntimeItem> & Pick<MaintenanceRuntimeItem, 'id' | 'domain'>,
): MaintenanceRuntimeItem {
  return {
    severity: 'attention',
    status: 'open',
    createdDay: 3,
    updatedDay: 3,
    carryOverDays: 0,
    sourceDedupeKey: `k-${overrides.id}`,
    lastReasonLabels: ['test'],
    ...overrides,
  };
}

function stateWith(items: MaintenanceRuntimeItem[]): MaintenanceBacklogRuntimeState {
  return { items, attentionStreaks: {} };
}

export function verifyMaintenanceActionsLiteScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION unchanged', `SAVE_VERSION=${SAVE_VERSION}`);

  const resolved = item({ id: 'r1', domain: 'personnel', status: 'resolved' });
  assert(
    checks,
    !isMaintenanceActionEligible(resolved, 'inspect', 5),
    'resolved item no action',
    'ok',
  );

  const attention = item({ id: 'a1', domain: 'vehicle', severity: 'attention', status: 'open' });
  const afterInspect = applyMaintenanceActionToRuntimeState(
    stateWith([attention]),
    'a1',
    'inspect',
    5,
  );
  const inspected = afterInspect.items[0];
  assert(
    checks,
    inspected?.status === 'resolved',
    'attention inspect resolves',
    inspected?.status ?? 'missing',
  );

  const strained = item({ id: 's1', domain: 'personnel', severity: 'strained', status: 'open' });
  const afterRebalance = applyMaintenanceActionToRuntimeState(
    stateWith([strained]),
    's1',
    'rebalance',
    5,
  );
  const rebalanced = afterRebalance.items[0];
  assert(
    checks,
    rebalanced?.status === 'watching' && rebalanced.severity === 'attention',
    'strained rebalance softens',
    `${rebalanced?.status}/${rebalanced?.severity}`,
  );

  const critical = item({ id: 'c1', domain: 'route', severity: 'critical', status: 'open' });
  const afterCriticalInspect = applyMaintenanceActionToRuntimeState(
    stateWith([critical]),
    'c1',
    'inspect',
    5,
  );
  const criticalAfter = afterCriticalInspect.items[0];
  assert(
    checks,
    criticalAfter?.status !== 'resolved',
    'critical inspect not fully resolved',
    criticalAfter?.status ?? 'missing',
  );
  assert(
    checks,
    criticalAfter?.severity === 'strained',
    'critical inspect softens severity',
    criticalAfter?.severity ?? 'missing',
  );

  const actedItem = item({ id: 'a2', domain: 'route', severity: 'attention', status: 'open' });
  const acted = applyMaintenanceActionToRuntimeState(stateWith([actedItem]), 'a2', 'monitor', 5);
  assert(
    checks,
    hasMaintenanceActionToday(acted.items[0], 5),
    'same day action marker',
    String(hasMaintenanceActionToday(acted.items[0], 5)),
  );
  const repeat = applyMaintenanceActionToRuntimeState(acted, 'a2', 'monitor', 5);
  assert(
    checks,
    repeat === acted,
    'same day repeat no-op',
    'ok',
  );

  const primary = selectPrimaryMaintenanceAction(
    stateWith([strained]),
    5,
    'dispatch',
  );
  assert(checks, primary?.actionKind === 'rebalance', 'primary action selected', primary?.actionKind ?? 'none');

  const emptyPrimary = selectPrimaryMaintenanceAction(createEmptyMaintenanceBacklogRuntimeState(), 1, 'dispatch');
  assert(checks, emptyPrimary === null, 'no runtime no action', String(Boolean(emptyPrimary)));

  const presentation = buildMaintenanceActionPresentation(attention, 'inspect', 5);
  assert(checks, presentation.label === 'Kontrol Et', 'action label', presentation.label);

  const result = buildMaintenanceActionResultPresentation(
    { ...attention, status: 'resolved' },
    'inspect',
  );
  assert(checks, result.title.length > 0, 'feedback non-empty', result.title);

  const kind = selectPrimaryMaintenanceActionKind(critical, 5);
  assert(
    checks,
    kind === 'inspect' || kind === 'rebalance' || kind === 'stabilize',
    'critical allows mitigation kinds',
    kind ?? 'none',
  );

  assert(
    checks,
    !isMaintenanceActionEligible(critical, 'defer', 5),
    'critical defer disabled',
    'ok',
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
