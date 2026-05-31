import {
  DAILY_CONTAINER_FOCUS_OPTIONS,
  DAILY_PERSONNEL_FOCUS_OPTIONS,
  DAILY_VEHICLE_FOCUS_OPTIONS,
  DEFAULT_DISTRICT_FOCUS_FALLBACK,
  DEFAULT_OPERATION_FOCUS_POINTS,
} from './dailyPlanningConstants';
import type {
  DailyContainerFocus,
  DailyOperationsPlanState,
  DailyPersonnelFocus,
  DailyPlanEffect,
  DailyPlanSource,
  DailyPlanStatus,
  DailyVehicleFocus,
} from './dailyPlanningTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';

const PERSONNEL_KEYS = Object.keys(
  DAILY_PERSONNEL_FOCUS_OPTIONS,
) as DailyPersonnelFocus[];
const VEHICLE_KEYS = Object.keys(
  DAILY_VEHICLE_FOCUS_OPTIONS,
) as DailyVehicleFocus[];
const CONTAINER_KEYS = Object.keys(
  DAILY_CONTAINER_FOCUS_OPTIONS,
) as DailyContainerFocus[];

export function clampOperationFocusPoints(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(
    DEFAULT_OPERATION_FOCUS_POINTS,
    Math.max(0, Math.round(value)),
  );
}

export function getDailyPlanTotalCost(
  plan: Pick<
    DailyOperationsPlanState,
    'personnelFocus' | 'vehicleFocus' | 'containerFocus'
  >,
): number {
  return (
    DAILY_PERSONNEL_FOCUS_OPTIONS[plan.personnelFocus].cost +
    DAILY_VEHICLE_FOCUS_OPTIONS[plan.vehicleFocus].cost +
    DAILY_CONTAINER_FOCUS_OPTIONS[plan.containerFocus].cost
  );
}

export function syncPlanFocusPoints(
  plan: DailyOperationsPlanState,
): DailyOperationsPlanState {
  const used = getDailyPlanTotalCost(plan);
  const total = DEFAULT_OPERATION_FOCUS_POINTS;
  return {
    ...plan,
    operationFocusPoints: {
      total,
      used,
      remaining: Math.max(0, total - used),
    },
  };
}

function isPersonnelFocus(val: unknown): val is DailyPersonnelFocus {
  return typeof val === 'string' && PERSONNEL_KEYS.includes(val as DailyPersonnelFocus);
}

function isVehicleFocus(val: unknown): val is DailyVehicleFocus {
  return typeof val === 'string' && VEHICLE_KEYS.includes(val as DailyVehicleFocus);
}

function isContainerFocus(val: unknown): val is DailyContainerFocus {
  return typeof val === 'string' && CONTAINER_KEYS.includes(val as DailyContainerFocus);
}

function isPlanStatus(val: unknown): val is DailyPlanStatus {
  return (
    val === 'unplanned' ||
    val === 'suggested' ||
    val === 'confirmed' ||
    val === 'processed'
  );
}

function isPlanSource(val: unknown): val is DailyPlanSource {
  return val === 'player' || val === 'advisor_suggested' || val === 'auto_default';
}

function normalizeEffects(input: unknown): DailyPlanEffect[] {
  if (!Array.isArray(input)) return [];
  const result: DailyPlanEffect[] = [];
  for (const item of input) {
    if (item == null || typeof item !== 'object') continue;
    const raw = item as Record<string, unknown>;
    const domain = raw.domain;
    if (
      domain !== 'personnel' &&
      domain !== 'vehicles' &&
      domain !== 'containers' &&
      domain !== 'districts' &&
      domain !== 'overall'
    ) {
      continue;
    }
    if (typeof raw.reason !== 'string') continue;
    result.push({
      domain,
      delta: typeof raw.delta === 'number' ? Math.round(raw.delta) : 0,
      reason: raw.reason,
    });
  }
  return result;
}

export function createInitialDailyOperationsPlan(
  day: number,
  priorityDistrictId?: string,
): DailyOperationsPlanState {
  const plan: DailyOperationsPlanState = {
    day,
    status: 'suggested',
    source: 'advisor_suggested',
    districtFocusId: priorityDistrictId ?? DEFAULT_DISTRICT_FOCUS_FALLBACK,
    personnelFocus: 'balanced_shift',
    vehicleFocus: 'ready_fleet',
    containerFocus: 'standard_collection',
    operationFocusPoints: {
      total: DEFAULT_OPERATION_FOCUS_POINTS,
      used: 3,
      remaining: 2,
    },
    advisorSuggested: true,
    appliedEffects: [],
  };
  return syncPlanFocusPoints(plan);
}

export function normalizeDailyOperationsPlan(
  input: unknown,
  day: number,
  priorityDistrictId?: string,
): DailyOperationsPlanState {
  if (input == null || typeof input !== 'object') {
    return createInitialDailyOperationsPlan(day, priorityDistrictId);
  }
  const raw = input as Record<string, unknown>;
  const planDay =
    typeof raw.day === 'number' && raw.day > 0 ? Math.floor(raw.day) : day;

  let plan: DailyOperationsPlanState = {
    day: planDay,
    status: isPlanStatus(raw.status) ? raw.status : 'suggested',
    source: isPlanSource(raw.source) ? raw.source : 'advisor_suggested',
    districtFocusId:
      typeof raw.districtFocusId === 'string' && raw.districtFocusId.length > 0
        ? raw.districtFocusId
        : priorityDistrictId ?? DEFAULT_DISTRICT_FOCUS_FALLBACK,
    personnelFocus: isPersonnelFocus(raw.personnelFocus)
      ? raw.personnelFocus
      : 'balanced_shift',
    vehicleFocus: isVehicleFocus(raw.vehicleFocus)
      ? raw.vehicleFocus
      : 'ready_fleet',
    containerFocus: isContainerFocus(raw.containerFocus)
      ? raw.containerFocus
      : 'standard_collection',
    operationFocusPoints: {
      total: DEFAULT_OPERATION_FOCUS_POINTS,
      used: 0,
      remaining: DEFAULT_OPERATION_FOCUS_POINTS,
    },
    confirmedAtDay:
      typeof raw.confirmedAtDay === 'number' ? Math.floor(raw.confirmedAtDay) : undefined,
    lastProcessedDay:
      typeof raw.lastProcessedDay === 'number'
        ? Math.floor(raw.lastProcessedDay)
        : undefined,
    lastEditedDay:
      typeof raw.lastEditedDay === 'number' ? Math.floor(raw.lastEditedDay) : undefined,
    advisorSuggested: raw.advisorSuggested === true,
    appliedEffects: normalizeEffects(raw.appliedEffects),
  };

  plan = syncPlanFocusPoints(plan);
  if (plan.operationFocusPoints.used > DEFAULT_OPERATION_FOCUS_POINTS) {
    return createInitialDailyOperationsPlan(day, priorityDistrictId);
  }
  return plan;
}

export function createDefaultSuggestedPlan(
  day: number,
  operationSignals?: OperationSignalsState,
): DailyOperationsPlanState {
  const districtId =
    operationSignals?.priorityDistrictId ?? DEFAULT_DISTRICT_FOCUS_FALLBACK;
  let personnel: DailyPersonnelFocus = 'balanced_shift';
  let vehicle: DailyVehicleFocus = 'ready_fleet';
  let container: DailyContainerFocus = 'standard_collection';

  if (operationSignals) {
    if (
      operationSignals.personnel.status === 'strained' ||
      operationSignals.personnel.status === 'critical'
    ) {
      personnel = 'rest_rotation';
    }
    if (
      operationSignals.vehicles.status === 'strained' ||
      operationSignals.vehicles.status === 'critical'
    ) {
      vehicle = 'preventive_maintenance';
    }
    if (
      operationSignals.containers.status === 'strained' ||
      operationSignals.containers.status === 'critical'
    ) {
      container = 'intensive_collection';
    }
    if (operationSignals.dailyFocus === 'personnel') {
      personnel = 'rapid_response';
    }
    if (operationSignals.dailyFocus === 'vehicles') {
      vehicle = 'preventive_maintenance';
    }
    if (operationSignals.dailyFocus === 'containers') {
      container = 'cleanliness_maintenance';
    }
  }

  let plan = createInitialDailyOperationsPlan(day, districtId);
  plan = {
    ...plan,
    personnelFocus: personnel,
    vehicleFocus: vehicle,
    containerFocus: container,
    status: 'suggested',
    source: 'advisor_suggested',
    advisorSuggested: true,
  };
  plan = syncPlanFocusPoints(plan);
  if (plan.operationFocusPoints.used > DEFAULT_OPERATION_FOCUS_POINTS) {
    return createInitialDailyOperationsPlan(day, districtId);
  }
  return plan;
}

export function refreshDailyOperationsPlanForDay(
  plan: DailyOperationsPlanState,
  day: number,
  operationSignals?: OperationSignalsState,
): DailyOperationsPlanState {
  if (plan.day === day && plan.status !== 'processed') {
    return syncPlanFocusPoints({ ...plan, day });
  }
  return createDefaultSuggestedPlan(day, operationSignals);
}

export function updateDailyOperationsPlanFocus(
  plan: DailyOperationsPlanState,
  partial: Partial<
    Pick<
      DailyOperationsPlanState,
      | 'districtFocusId'
      | 'personnelFocus'
      | 'vehicleFocus'
      | 'containerFocus'
    >
  >,
  editedDay?: number,
): DailyOperationsPlanState {
  const next = syncPlanFocusPoints({
    ...plan,
    ...partial,
    lastEditedDay: editedDay ?? plan.lastEditedDay,
    source: 'player',
    advisorSuggested: false,
  });
  if (next.operationFocusPoints.used > DEFAULT_OPERATION_FOCUS_POINTS) {
    return plan;
  }
  return next;
}

export function confirmDailyOperationsPlan(
  plan: DailyOperationsPlanState,
  updates?: Partial<
    Pick<
      DailyOperationsPlanState,
      | 'districtFocusId'
      | 'personnelFocus'
      | 'vehicleFocus'
      | 'containerFocus'
    >
  >,
): DailyOperationsPlanState {
  let next = updateDailyOperationsPlanFocus(plan, updates ?? {}, plan.day);
  if (next.operationFocusPoints.used > DEFAULT_OPERATION_FOCUS_POINTS) {
    return plan;
  }
  return {
    ...next,
    status: 'confirmed',
    source: 'player',
    confirmedAtDay: plan.day,
    advisorSuggested: false,
  };
}

export function isDailyPlanConfirmedForDay(
  plan: DailyOperationsPlanState,
  day: number,
): boolean {
  return (
    plan.day === day &&
    (plan.status === 'confirmed' || plan.status === 'processed') &&
    plan.confirmedAtDay === day
  );
}

export function getDailyPlanRemainingFocusPoints(
  plan: DailyOperationsPlanState,
): number {
  return plan.operationFocusPoints.remaining;
}

export function markDailyPlanProcessed(
  plan: DailyOperationsPlanState,
  day: number,
  effects: DailyPlanEffect[],
): DailyOperationsPlanState {
  return {
    ...plan,
    status: 'processed',
    lastProcessedDay: day,
    appliedEffects: effects,
  };
}
