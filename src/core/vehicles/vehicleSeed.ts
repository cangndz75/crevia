import {
  VEHICLE_CATEGORIES,
  VEHICLE_DEFAULT_DAY_MODIFIERS,
  VEHICLE_METRIC_MAX,
  VEHICLE_METRIC_MIN,
  VEHICLE_NEIGHBORHOOD_IDS,
  VEHICLE_OPERATIONAL_STATUSES,
} from './vehicleConstants';
import type {
  VehicleAggregates,
  VehicleCategory,
  VehicleDayModifiers,
  VehicleNeighborhoodId,
  VehicleOperationalStatus,
  VehicleState,
  VehicleUnit,
} from './vehicleTypes';

type SeedVehicleDef = {
  id: string;
  name: string;
  category: VehicleCategory;
  homeNeighborhoodId: VehicleNeighborhoodId;
  operationalStatus?: VehicleOperationalStatus;
  condition: number;
  fuelOrCharge: number;
  workload: number;
  routeEfficiency: number;
  maintenanceNeed: number;
  breakdownRisk: number;
  traits?: string[];
};

const SEED_VEHICLE_DEFS: SeedVehicleDef[] = [
  {
    id: 'vehicle-garbage-merkez-1',
    name: 'Çöp Toplama Aracı 1',
    category: 'garbage_truck',
    homeNeighborhoodId: 'merkez',
    condition: 78,
    fuelOrCharge: 82,
    workload: 35,
    routeEfficiency: 72,
    maintenanceNeed: 28,
    breakdownRisk: 12,
  },
  {
    id: 'vehicle-garbage-sanayi-2',
    name: 'Çöp Toplama Aracı 2',
    category: 'garbage_truck',
    homeNeighborhoodId: 'sanayi',
    condition: 66,
    fuelOrCharge: 74,
    workload: 48,
    routeEfficiency: 64,
    maintenanceNeed: 42,
    breakdownRisk: 21,
  },
  {
    id: 'vehicle-small-response-cumhuriyet',
    name: 'Küçük Müdahale Aracı',
    category: 'small_response',
    homeNeighborhoodId: 'cumhuriyet',
    condition: 84,
    fuelOrCharge: 88,
    workload: 22,
    routeEfficiency: 80,
    maintenanceNeed: 18,
    breakdownRisk: 8,
  },
  {
    id: 'vehicle-maintenance-merkez',
    name: 'Bakım Aracı',
    category: 'maintenance_vehicle',
    homeNeighborhoodId: 'merkez',
    condition: 73,
    fuelOrCharge: 79,
    workload: 31,
    routeEfficiency: 68,
    maintenanceNeed: 34,
    breakdownRisk: 16,
  },
  {
    id: 'vehicle-inspection-istasyon',
    name: 'Denetim Aracı',
    category: 'inspection_vehicle',
    homeNeighborhoodId: 'istasyon',
    condition: 88,
    fuelOrCharge: 86,
    workload: 18,
    routeEfficiency: 83,
    maintenanceNeed: 14,
    breakdownRisk: 6,
  },
  {
    id: 'vehicle-utility-yesilvadi',
    name: 'Hizmet Pickup',
    category: 'utility_pickup',
    homeNeighborhoodId: 'yesilvadi',
    condition: 76,
    fuelOrCharge: 81,
    workload: 29,
    routeEfficiency: 74,
    maintenanceNeed: 24,
    breakdownRisk: 11,
  },
];

function isRecord(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

export function clampVehicleMetric(value: number): number {
  if (!Number.isFinite(value)) {
    return VEHICLE_METRIC_MIN;
  }
  return Math.round(
    Math.min(VEHICLE_METRIC_MAX, Math.max(VEHICLE_METRIC_MIN, value)),
  );
}

function normalizeVehicleNeighborhoodId(
  value: unknown,
  fallback: VehicleNeighborhoodId = 'merkez',
): VehicleNeighborhoodId {
  if (
    typeof value === 'string' &&
    VEHICLE_NEIGHBORHOOD_IDS.includes(value as VehicleNeighborhoodId)
  ) {
    return value as VehicleNeighborhoodId;
  }
  return fallback;
}

function normalizeVehicleOperationalStatus(
  value: unknown,
): VehicleOperationalStatus {
  if (
    typeof value === 'string' &&
    VEHICLE_OPERATIONAL_STATUSES.includes(value as VehicleOperationalStatus)
  ) {
    return value as VehicleOperationalStatus;
  }
  return 'available';
}

function normalizeVehicleCategory(value: unknown): VehicleCategory | null {
  if (
    typeof value === 'string' &&
    VEHICLE_CATEGORIES.includes(value as VehicleCategory)
  ) {
    return value as VehicleCategory;
  }
  return null;
}

export function isVehicleUnitCritical(unit: VehicleUnit): boolean {
  return (
    unit.condition <= 35 ||
    unit.breakdownRisk >= 70 ||
    unit.maintenanceNeed >= 75
  );
}

export function recomputeVehicleAggregates(
  units: VehicleUnit[],
): VehicleAggregates {
  const total = units.length;
  if (total === 0) {
    return {
      total: 0,
      available: 0,
      assigned: 0,
      inMaintenance: 0,
      broken: 0,
      averageCondition: 0,
      averageWorkload: 0,
      averageRouteEfficiency: 0,
      averageBreakdownRisk: 0,
      criticalCount: 0,
    };
  }

  let available = 0;
  let assigned = 0;
  let inMaintenance = 0;
  let broken = 0;
  let criticalCount = 0;
  let conditionSum = 0;
  let workloadSum = 0;
  let routeEfficiencySum = 0;
  let breakdownRiskSum = 0;

  for (const unit of units) {
    switch (unit.operationalStatus) {
      case 'available':
        available += 1;
        break;
      case 'assigned':
        assigned += 1;
        break;
      case 'maintenance':
        inMaintenance += 1;
        break;
      case 'broken':
        broken += 1;
        break;
      default:
        break;
    }

    if (isVehicleUnitCritical(unit)) {
      criticalCount += 1;
    }

    conditionSum += unit.condition;
    workloadSum += unit.workload;
    routeEfficiencySum += unit.routeEfficiency;
    breakdownRiskSum += unit.breakdownRisk;
  }

  return {
    total,
    available,
    assigned,
    inMaintenance,
    broken,
    averageCondition: Math.round(conditionSum / total),
    averageWorkload: Math.round(workloadSum / total),
    averageRouteEfficiency: Math.round(routeEfficiencySum / total),
    averageBreakdownRisk: Math.round(breakdownRiskSum / total),
    criticalCount,
  };
}

function buildSeedUnit(def: SeedVehicleDef): VehicleUnit {
  const homeNeighborhoodId = def.homeNeighborhoodId;
  return {
    id: def.id,
    name: def.name,
    category: def.category,
    homeNeighborhoodId,
    currentNeighborhoodId: homeNeighborhoodId,
    operationalStatus: def.operationalStatus ?? 'available',
    condition: clampVehicleMetric(def.condition),
    fuelOrCharge: clampVehicleMetric(def.fuelOrCharge),
    workload: clampVehicleMetric(def.workload),
    routeEfficiency: clampVehicleMetric(def.routeEfficiency),
    maintenanceNeed: clampVehicleMetric(def.maintenanceNeed),
    breakdownRisk: clampVehicleMetric(def.breakdownRisk),
    assignedEventId: null,
    lastAssignedDay: null,
    lastMaintenanceDay: null,
    traits: def.traits,
  };
}

export function normalizeVehicleUnit(raw: Record<string, unknown>): VehicleUnit | null {
  const category = normalizeVehicleCategory(raw.category);
  if (!category || typeof raw.id !== 'string' || typeof raw.name !== 'string') {
    return null;
  }

  const homeNeighborhoodId = normalizeVehicleNeighborhoodId(
    raw.homeNeighborhoodId,
  );
  const currentNeighborhoodId = normalizeVehicleNeighborhoodId(
    raw.currentNeighborhoodId,
    homeNeighborhoodId,
  );

  return {
    id: raw.id,
    name: raw.name,
    category,
    homeNeighborhoodId,
    currentNeighborhoodId,
    operationalStatus: normalizeVehicleOperationalStatus(raw.operationalStatus),
    condition: clampVehicleMetric(
      typeof raw.condition === 'number' ? raw.condition : 100,
    ),
    fuelOrCharge: clampVehicleMetric(
      typeof raw.fuelOrCharge === 'number' ? raw.fuelOrCharge : 100,
    ),
    workload: clampVehicleMetric(
      typeof raw.workload === 'number' ? raw.workload : 0,
    ),
    routeEfficiency: clampVehicleMetric(
      typeof raw.routeEfficiency === 'number' ? raw.routeEfficiency : 70,
    ),
    maintenanceNeed: clampVehicleMetric(
      typeof raw.maintenanceNeed === 'number' ? raw.maintenanceNeed : 0,
    ),
    breakdownRisk: clampVehicleMetric(
      typeof raw.breakdownRisk === 'number' ? raw.breakdownRisk : 0,
    ),
    assignedEventId:
      raw.assignedEventId === null || typeof raw.assignedEventId === 'string'
        ? raw.assignedEventId
        : null,
    lastAssignedDay:
      raw.lastAssignedDay === null || typeof raw.lastAssignedDay === 'number'
        ? raw.lastAssignedDay
        : null,
    lastMaintenanceDay:
      raw.lastMaintenanceDay === null ||
      typeof raw.lastMaintenanceDay === 'number'
        ? raw.lastMaintenanceDay
        : null,
    traits: Array.isArray(raw.traits)
      ? raw.traits.filter((trait): trait is string => typeof trait === 'string')
      : undefined,
  };
}

function normalizeDayModifiers(raw: unknown): VehicleDayModifiers {
  if (!isRecord(raw)) {
    return { ...VEHICLE_DEFAULT_DAY_MODIFIERS };
  }

  return {
    routePressure:
      typeof raw.routePressure === 'number'
        ? clampVehicleMetric(raw.routePressure)
        : VEHICLE_DEFAULT_DAY_MODIFIERS.routePressure,
    maintenancePressure:
      typeof raw.maintenancePressure === 'number'
        ? clampVehicleMetric(raw.maintenancePressure)
        : VEHICLE_DEFAULT_DAY_MODIFIERS.maintenancePressure,
    fuelPressure:
      typeof raw.fuelPressure === 'number'
        ? clampVehicleMetric(raw.fuelPressure)
        : VEHICLE_DEFAULT_DAY_MODIFIERS.fuelPressure,
  };
}

export function createInitialVehicleState(day = 1): VehicleState {
  const resolvedDay = Math.max(1, day);
  const units = SEED_VEHICLE_DEFS.map(buildSeedUnit);

  return {
    units,
    aggregates: recomputeVehicleAggregates(units),
    lastProcessedDay: Math.max(0, resolvedDay - 1),
    dayModifiers: { ...VEHICLE_DEFAULT_DAY_MODIFIERS },
  };
}

export function normalizePersistedVehicleState(
  raw: unknown,
  currentDay: number,
): VehicleState {
  const day = Math.max(1, currentDay);

  if (!isRecord(raw) || !Array.isArray(raw.units)) {
    return createInitialVehicleState(day);
  }

  const units: VehicleUnit[] = [];
  for (const item of raw.units) {
    if (!isRecord(item)) {
      continue;
    }
    const unit = normalizeVehicleUnit(item);
    if (unit) {
      units.push(unit);
    }
  }

  if (units.length === 0) {
    return createInitialVehicleState(day);
  }

  const lastProcessedDay =
    typeof raw.lastProcessedDay === 'number' ? raw.lastProcessedDay : day;

  return {
    units,
    aggregates: recomputeVehicleAggregates(units),
    lastProcessedDay,
    dayModifiers: normalizeDayModifiers(raw.dayModifiers),
  };
}
