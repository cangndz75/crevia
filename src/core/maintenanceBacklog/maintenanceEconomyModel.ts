import type { MaintenanceActionKind } from './maintenanceActionTypes';
import {
  MAINTENANCE_ECONOMY_DOMAIN_WEIGHT,
  MAINTENANCE_ECONOMY_MAX_ACTIVE_PLANS,
  MAINTENANCE_ECONOMY_NOMINAL_COST,
  MAINTENANCE_ECONOMY_SEVERITY_WEIGHT,
} from './maintenanceEconomyConstants';
import type {
  EstimateMaintenanceEconomyInput,
  MaintenanceEconomyCostBand,
  MaintenanceEconomyEffort,
  MaintenanceEconomyPlan,
  MaintenanceEconomyPreview,
  MaintenanceEconomyStatus,
} from './maintenanceEconomyTypes';
import type {
  MaintenanceBacklogRuntimeState,
  MaintenanceRuntimeItem,
  MaintenanceRuntimeSeverity,
} from './maintenanceBacklogRuntimeTypes';

const VALID_ECONOMY_STATUSES = new Set<MaintenanceEconomyStatus>([
  'none',
  'queued',
  'in_progress',
  'stabilized',
  'resolved',
]);

const ACTION_COST_WEIGHT: Record<MaintenanceActionKind, number> = {
  monitor: 0,
  inspect: 1,
  rebalance: 1.6,
  stabilize: 2.2,
  defer: 0,
};

const ACTION_EFFORT: Record<MaintenanceActionKind, MaintenanceEconomyEffort> = {
  monitor: 'low',
  inspect: 'low',
  rebalance: 'medium',
  stabilize: 'high',
  defer: 'low',
};

function scoreToCostBand(score: number): MaintenanceEconomyCostBand {
  if (score <= 0) return 'none';
  if (score < 1.35) return 'low';
  if (score < 2.4) return 'medium';
  return 'high';
}

function effortForAction(
  kind: MaintenanceActionKind,
  severity: MaintenanceRuntimeSeverity,
): MaintenanceEconomyEffort {
  if (kind === 'inspect' && severity === 'strained') return 'medium';
  if (kind === 'rebalance' && severity === 'critical') return 'high';
  if (kind === 'stabilize') return severity === 'critical' ? 'high' : 'medium';
  return ACTION_EFFORT[kind];
}

function estimatedDaysForAction(
  kind: MaintenanceActionKind,
  severity: MaintenanceRuntimeSeverity,
): number {
  switch (kind) {
    case 'monitor':
      return 0;
    case 'inspect':
      return severity === 'attention' ? 0 : 1;
    case 'rebalance':
      return severity === 'attention' ? 0 : 1;
    case 'stabilize':
      return severity === 'attention' ? 0 : 1;
    case 'defer':
      return 1;
    default:
      return 0;
  }
}

function economyStatusForAction(
  kind: MaintenanceActionKind,
  severity: MaintenanceRuntimeSeverity,
  estimatedDays: number,
): MaintenanceEconomyStatus {
  if (kind === 'defer') return 'queued';
  if (kind === 'monitor') return 'none';
  if (estimatedDays > 0) {
    if (severity === 'critical' || kind === 'stabilize' || kind === 'rebalance') {
      return 'in_progress';
    }
    return 'in_progress';
  }
  if (kind === 'inspect' && severity === 'attention') return 'resolved';
  return 'stabilized';
}

function effectLabelForAction(kind: MaintenanceActionKind, severity: MaintenanceRuntimeSeverity): string {
  switch (kind) {
    case 'monitor':
      return 'Takipte kalır';
    case 'inspect':
      return severity === 'attention' ? 'Sinyal netleşir' : 'Baskıyı azaltır';
    case 'rebalance':
      return 'Baskıyı azaltır';
    case 'stabilize':
      return severity === 'critical' ? '1 gün takip' : 'Akışı sabitler';
    case 'defer':
      return 'Yarına planlı taşınır';
    default:
      return 'İzlenir';
  }
}

export function estimateMaintenanceEconomyPlan(
  input: EstimateMaintenanceEconomyInput,
): MaintenanceEconomyPlan {
  const { domain, severity, actionKind } = input;
  const score =
    MAINTENANCE_ECONOMY_SEVERITY_WEIGHT[severity] *
    MAINTENANCE_ECONOMY_DOMAIN_WEIGHT[domain] *
    ACTION_COST_WEIGHT[actionKind];
  const costBand = scoreToCostBand(score);
  const estimatedDays = estimatedDaysForAction(actionKind, severity);
  const effort = effortForAction(actionKind, severity);

  return {
    estimatedCost: MAINTENANCE_ECONOMY_NOMINAL_COST[costBand],
    costBand,
    effort,
    estimatedDays,
    economyStatus: economyStatusForAction(actionKind, severity, estimatedDays),
    effectLabel: effectLabelForAction(actionKind, severity),
  };
}

export function buildMaintenanceEconomyPreview(plan: MaintenanceEconomyPlan): MaintenanceEconomyPreview {
  const costLabel =
    plan.costBand === 'none'
      ? 'Tahmini maliyet: yok'
      : plan.costBand === 'low'
        ? 'Tahmini maliyet: düşük'
        : plan.costBand === 'medium'
          ? 'Tahmini maliyet: orta'
          : 'Tahmini maliyet: yüksek';

  const effortLabel =
    plan.effort === 'low'
      ? 'Düşük efor'
      : plan.effort === 'medium'
        ? 'Orta efor'
        : 'Yüksek efor';

  const durationLabel =
    plan.estimatedDays <= 0 ? 'Süre: bugün' : `Süre: ${plan.estimatedDays} gün`;

  return {
    costLabel,
    effortLabel,
    durationLabel,
    effectLabel: `Etki: ${plan.effectLabel.toLowerCase()}`,
  };
}

export function buildMaintenanceEconomyCompactPreview(plan: MaintenanceEconomyPlan): string {
  const preview = buildMaintenanceEconomyPreview(plan);
  if (plan.costBand === 'none') {
    return `${preview.durationLabel.replace('Süre: ', '')}`;
  }
  const costShort =
    plan.costBand === 'low' ? 'düşük maliyet' : plan.costBand === 'medium' ? 'orta maliyet' : 'yüksek maliyet';
  if (plan.estimatedDays <= 0) return costShort;
  return `${preview.durationLabel.replace('Süre: ', '')} · ${costShort}`;
}

export function sanitizeMaintenanceEconomyFields(
  item: MaintenanceRuntimeItem,
): MaintenanceRuntimeItem {
  const economyStatus = VALID_ECONOMY_STATUSES.has(item.economyStatus as MaintenanceEconomyStatus)
    ? (item.economyStatus as MaintenanceEconomyStatus)
    : 'none';

  const estimatedCost =
    typeof item.estimatedCost === 'number' && Number.isFinite(item.estimatedCost) && item.estimatedCost >= 0
      ? Math.round(item.estimatedCost)
      : undefined;

  const estimatedDays =
    typeof item.estimatedDays === 'number' && Number.isFinite(item.estimatedDays) && item.estimatedDays >= 0
      ? Math.min(3, Math.round(item.estimatedDays))
      : undefined;

  const startedDay =
    typeof item.startedDay === 'number' && Number.isFinite(item.startedDay) ? item.startedDay : undefined;
  const dueDay =
    typeof item.dueDay === 'number' && Number.isFinite(item.dueDay) ? item.dueDay : undefined;
  const paidCost =
    typeof item.paidCost === 'number' && Number.isFinite(item.paidCost) && item.paidCost >= 0
      ? Math.round(item.paidCost)
      : undefined;

  return {
    ...item,
    economyStatus,
    estimatedCost,
    estimatedDays,
    startedDay,
    dueDay,
    paidCost,
  };
}

export function countActiveEconomyPlans(items: MaintenanceRuntimeItem[]): number {
  return items.filter(
    (item) =>
      item.status !== 'resolved' &&
      (item.economyStatus === 'in_progress' || item.economyStatus === 'queued'),
  ).length;
}

export function canStartMaintenanceEconomyPlan(
  state: MaintenanceBacklogRuntimeState,
  item: MaintenanceRuntimeItem,
  plan: MaintenanceEconomyPlan,
): boolean {
  if (plan.economyStatus !== 'in_progress' && plan.economyStatus !== 'queued') return true;
  if (item.economyStatus === 'in_progress' || item.economyStatus === 'queued') return true;
  return countActiveEconomyPlans(state.items) < MAINTENANCE_ECONOMY_MAX_ACTIVE_PLANS;
}

export function applyMaintenanceEconomyToItem(
  item: MaintenanceRuntimeItem,
  actionKind: MaintenanceActionKind,
  currentDay: number,
): MaintenanceRuntimeItem {
  const plan = estimateMaintenanceEconomyPlan({
    domain: item.domain,
    severity: item.severity,
    actionKind,
    currentDay,
  });

  const startedDay = plan.estimatedDays > 0 ? currentDay : undefined;
  const dueDay = plan.estimatedDays > 0 ? currentDay + plan.estimatedDays : undefined;

  return sanitizeMaintenanceEconomyFields({
    ...item,
    economyStatus:
      item.status === 'resolved'
        ? 'resolved'
        : plan.economyStatus === 'none' && actionKind === 'monitor'
          ? 'none'
          : plan.economyStatus,
    estimatedCost: plan.estimatedCost > 0 ? plan.estimatedCost : undefined,
    estimatedDays: plan.estimatedDays > 0 ? plan.estimatedDays : undefined,
    startedDay,
    dueDay,
    paidCost: plan.estimatedCost > 0 ? plan.estimatedCost : undefined,
  });
}

function completeInProgressItem(
  item: MaintenanceRuntimeItem,
  closingDay: number,
): MaintenanceRuntimeItem {
  if (item.severity === 'critical') {
    return sanitizeMaintenanceEconomyFields({
      ...item,
      severity: 'strained',
      status: 'watching',
      economyStatus: 'stabilized',
      estimatedDays: undefined,
      startedDay: undefined,
      dueDay: undefined,
      updatedDay: closingDay,
    });
  }

  if (item.severity === 'strained') {
    return sanitizeMaintenanceEconomyFields({
      ...item,
      severity: 'attention',
      status: 'watching',
      economyStatus: 'stabilized',
      estimatedDays: undefined,
      startedDay: undefined,
      dueDay: undefined,
      updatedDay: closingDay,
    });
  }

  return sanitizeMaintenanceEconomyFields({
    ...item,
    status: 'resolved',
    economyStatus: 'resolved',
    estimatedDays: undefined,
    startedDay: undefined,
    dueDay: undefined,
    updatedDay: closingDay,
  });
}

function advanceStabilizedItem(
  item: MaintenanceRuntimeItem,
  closingDay: number,
): MaintenanceRuntimeItem {
  if (closingDay - item.updatedDay < 1) return item;
  return sanitizeMaintenanceEconomyFields({
    ...item,
    status: 'resolved',
    economyStatus: 'resolved',
    estimatedDays: undefined,
    startedDay: undefined,
    dueDay: undefined,
    updatedDay: closingDay,
  });
}

export function processMaintenanceEconomyDayClose(
  state: MaintenanceBacklogRuntimeState,
  closingDay: number,
): MaintenanceBacklogRuntimeState {
  if (state.lastProcessedDay === closingDay) return state;

  const items = state.items.map((item) => {
    if (item.status === 'resolved') return item;

    if (item.economyStatus === 'in_progress' && item.dueDay != null && item.dueDay <= closingDay) {
      return completeInProgressItem(item, closingDay);
    }

    if (item.economyStatus === 'stabilized') {
      return advanceStabilizedItem(item, closingDay);
    }

    return item;
  });

  return { ...state, items };
}

export function buildMaintenanceEconomyHubSummary(
  runtime: MaintenanceBacklogRuntimeState,
): string | null {
  const inProgress = runtime.items.filter(
    (item) => item.economyStatus === 'in_progress' && item.status !== 'resolved',
  ).length;
  if (inProgress <= 0) return null;
  return inProgress === 1 ? '1 sinyal işlemde' : `${inProgress} sinyal işlemde`;
}

export function buildMaintenanceEconomyReportLine(
  runtime: MaintenanceBacklogRuntimeState,
  avoidLines: string[] = [],
): string | null {
  const stabilized = runtime.items.filter((item) => item.economyStatus === 'stabilized');
  const queued = runtime.items.filter((item) => item.economyStatus === 'queued');
  const inProgress = runtime.items.filter((item) => item.economyStatus === 'in_progress');

  let line: string | null = null;
  if (stabilized.length > 0) {
    line = 'Hazırlık baskısı stabilize edildi.';
  } else if (inProgress.length > 0) {
    line = 'Hazırlık takibi işlemde.';
  } else if (queued.length > 0) {
    line = 'Bir bakım sinyali yarına planlı taşındı.';
  }

  if (!line) return null;
  const normalized = line.toLocaleLowerCase('tr-TR');
  if (avoidLines.some((avoid) => avoid.toLocaleLowerCase('tr-TR').includes(normalized.slice(0, 18)))) {
    return null;
  }
  return line;
}

export function buildMaintenanceEconomyReplayDescription(
  runtime: MaintenanceBacklogRuntimeState,
): string | null {
  const inProgress = runtime.items.some(
    (item) => item.economyStatus === 'in_progress' && item.status !== 'resolved',
  );
  const stabilized = runtime.items.some((item) => item.economyStatus === 'stabilized');
  if (stabilized) return 'Hazırlık baskısı azaltıldı.';
  if (inProgress) return 'Hazırlık takibi işlemde.';
  return null;
}
