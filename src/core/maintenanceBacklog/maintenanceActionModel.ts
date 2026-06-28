import type { MaintenanceActionKind } from './maintenanceActionTypes';
import { MAINTENANCE_ACTION_DOMAIN_KINDS } from './maintenanceActionTypes';
import {
  applyMaintenanceEconomyToItem,
  canStartMaintenanceEconomyPlan,
  estimateMaintenanceEconomyPlan,
} from './maintenanceEconomyModel';
import type {
  MaintenanceBacklogRuntimeState,
  MaintenanceRuntimeItem,
  MaintenanceRuntimeSeverity,
  MaintenanceRuntimeStatus,
} from './maintenanceBacklogRuntimeTypes';

const ACTION_LABEL_PREFIX = 'action:';

export function maintenanceActionMarker(kind: MaintenanceActionKind): string {
  return `${ACTION_LABEL_PREFIX}${kind}`;
}

export function hasMaintenanceActionToday(
  item: MaintenanceRuntimeItem,
  currentDay: number,
): boolean {
  return (
    item.updatedDay === currentDay &&
    item.lastReasonLabels.some((label) => label.startsWith(ACTION_LABEL_PREFIX))
  );
}

function softenSeverity(severity: MaintenanceRuntimeSeverity): MaintenanceRuntimeSeverity {
  if (severity === 'critical') return 'strained';
  if (severity === 'strained') return 'attention';
  return 'attention';
}

function appendActionLabel(
  item: MaintenanceRuntimeItem,
  kind: MaintenanceActionKind,
): string[] {
  const marker = maintenanceActionMarker(kind);
  const filtered = item.lastReasonLabels.filter(
    (label) => !label.startsWith(ACTION_LABEL_PREFIX),
  );
  return [marker, ...filtered].slice(0, 4);
}

function applyActionEffect(
  item: MaintenanceRuntimeItem,
  kind: MaintenanceActionKind,
  currentDay: number,
): MaintenanceRuntimeItem {
  let severity = item.severity;
  let status: MaintenanceRuntimeStatus = item.status;
  let carryOverDays = item.carryOverDays;

  switch (kind) {
    case 'monitor':
      status = 'watching';
      break;
    case 'inspect':
      if (severity === 'attention') {
        status = 'resolved';
      } else if (severity === 'strained') {
        status = 'watching';
        severity = 'attention';
      } else {
        status = 'watching';
        severity = 'strained';
      }
      break;
    case 'rebalance':
      if (severity === 'attention') {
        status = 'resolved';
      } else if (severity === 'strained') {
        status = 'watching';
        severity = 'attention';
      } else {
        status = 'watching';
        severity = 'strained';
      }
      break;
    case 'stabilize':
      if (severity === 'attention') {
        status = 'resolved';
      } else if (severity === 'strained') {
        status = 'watching';
        severity = 'attention';
      } else {
        status = item.severity === 'critical' ? 'carried' : 'watching';
        severity = 'strained';
      }
      break;
    case 'defer':
      status = 'carried';
      carryOverDays += 1;
      break;
    default:
      break;
  }

  return {
    ...item,
    severity,
    status,
    carryOverDays,
    updatedDay: currentDay,
    lastReasonLabels: appendActionLabel(item, kind),
  };
}

export function isMaintenanceActionEligible(
  item: MaintenanceRuntimeItem,
  kind: MaintenanceActionKind,
  currentDay: number,
  state?: MaintenanceBacklogRuntimeState,
): boolean {
  if (item.status === 'resolved') return false;
  if (hasMaintenanceActionToday(item, currentDay)) return false;
  if (!MAINTENANCE_ACTION_DOMAIN_KINDS[item.domain].includes(kind)) return false;

  if (kind === 'defer' && item.severity === 'critical') return false;

  if (item.severity === 'critical') {
    if (!(kind === 'inspect' || kind === 'rebalance' || kind === 'stabilize')) return false;
  }

  if (state) {
    const plan = estimateMaintenanceEconomyPlan({
      domain: item.domain,
      severity: item.severity,
      actionKind: kind,
      currentDay,
    });
    if (!canStartMaintenanceEconomyPlan(state, item, plan)) return false;
  }

  return true;
}

export function applyMaintenanceActionToRuntimeState(
  state: MaintenanceBacklogRuntimeState,
  itemId: string,
  actionKind: MaintenanceActionKind,
  currentDay: number,
): MaintenanceBacklogRuntimeState {
  const index = state.items.findIndex((item) => item.id === itemId);
  if (index < 0) return state;

  const item = state.items[index];
  if (!isMaintenanceActionEligible(item, actionKind, currentDay, state)) return state;

  const updatedItem = applyMaintenanceEconomyToItem(
    applyActionEffect(item, actionKind, currentDay),
    actionKind,
    currentDay,
  );
  const items = state.items.slice();
  items[index] = updatedItem;

  return { ...state, items };
}

export function selectPrimaryMaintenanceActionKind(
  item: MaintenanceRuntimeItem,
  currentDay: number,
  preferredKinds?: MaintenanceActionKind[],
): MaintenanceActionKind | null {
  const domainKinds = preferredKinds ?? MAINTENANCE_ACTION_DOMAIN_KINDS[item.domain];

  if (item.severity === 'critical') {
    const criticalOrder: MaintenanceActionKind[] = ['inspect', 'rebalance', 'stabilize'];
    for (const kind of criticalOrder) {
      if (domainKinds.includes(kind) && isMaintenanceActionEligible(item, kind, currentDay)) {
        return kind;
      }
    }
    return null;
  }

  if (item.severity === 'strained') {
    const strainedOrder: MaintenanceActionKind[] = ['rebalance', 'stabilize', 'inspect', 'monitor'];
    for (const kind of strainedOrder) {
      if (domainKinds.includes(kind) && isMaintenanceActionEligible(item, kind, currentDay)) {
        return kind;
      }
    }
  }

  if (item.severity === 'attention') {
    const attentionOrder: MaintenanceActionKind[] = ['inspect', 'monitor', 'rebalance', 'defer'];
    for (const kind of attentionOrder) {
      if (domainKinds.includes(kind) && isMaintenanceActionEligible(item, kind, currentDay)) {
        return kind;
      }
    }
  }

  for (const kind of domainKinds) {
    if (isMaintenanceActionEligible(item, kind, currentDay)) return kind;
  }

  return null;
}
