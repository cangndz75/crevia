import { clampVehicleValue } from './vehicleEngine';
import { recomputeVehicleAggregates } from './vehicleSeed';
import type {
  VehicleFleetActionApplyResult,
  VehicleFleetActionGateResult,
  VehicleFleetActionInput,
  VehicleFleetActionRecommendation,
  VehicleFleetActionType,
  VehicleState,
  VehicleUnit,
} from './vehicleTypes';

const ACTION_LABELS: Record<VehicleFleetActionType, string> = {
  send_to_maintenance: 'Bakımı Başlat',
  rest_vehicle: 'Dinlendir',
  route_support: 'Rota Desteği',
};

function findVehicle(
  state: VehicleState,
  vehicleId?: string | null,
): VehicleUnit | null {
  if (!vehicleId) {
    return null;
  }
  return state.units.find((unit) => unit.id === vehicleId) ?? null;
}

function applyMetricDelta(current: number, delta: number): number {
  return clampVehicleValue(current + delta);
}

function updateUnit(
  state: VehicleState,
  vehicleId: string,
  patch: Partial<VehicleUnit>,
): VehicleState {
  const units = state.units.map((unit) =>
    unit.id === vehicleId ? { ...unit, ...patch } : unit,
  );
  return {
    ...state,
    units,
    aggregates: recomputeVehicleAggregates(units),
  };
}

export function canApplyVehicleFleetAction(
  vehicleState: VehicleState,
  actionType: VehicleFleetActionType,
  vehicleId: string | undefined | null,
  day: number,
): VehicleFleetActionGateResult {
  void day;

  const vehicle = findVehicle(vehicleState, vehicleId);
  if (!vehicle) {
    return { allowed: false, reason: 'Araç bulunamadı.' };
  }

  if (!vehicleId) {
    return { allowed: false, reason: 'Araç seçilmedi.' };
  }

  switch (actionType) {
    case 'send_to_maintenance': {
      if (vehicle.operationalStatus === 'broken') {
        return {
          allowed: false,
          reason: 'Arızalı araç için servis süreci gerekli.',
        };
      }
      if (vehicle.operationalStatus === 'maintenance') {
        return { allowed: false, reason: 'Araç zaten bakımda.' };
      }
      if (vehicle.operationalStatus === 'assigned') {
        return { allowed: false, reason: 'Görevdeki araç bakıma alınamaz.' };
      }
      if (vehicle.operationalStatus === 'resting') {
        return { allowed: false, reason: 'Dinlenen araç şu an bakıma alınamaz.' };
      }
      if (vehicle.condition >= 90 && vehicle.maintenanceNeed <= 15) {
        return {
          allowed: false,
          reason: 'Bu araç için bakım önceliği düşük.',
        };
      }
      return { allowed: true };
    }
    case 'rest_vehicle': {
      if (
        vehicle.operationalStatus === 'broken' ||
        vehicle.operationalStatus === 'maintenance' ||
        vehicle.operationalStatus === 'assigned' ||
        vehicle.operationalStatus === 'resting'
      ) {
        return { allowed: false, reason: 'Bu araç şu an dinlendirilemez.' };
      }
      if (vehicle.workload < 25 && vehicle.breakdownRisk < 25) {
        return {
          allowed: false,
          reason: 'Bu araç için dinlendirme önceliği düşük.',
        };
      }
      return { allowed: true };
    }
    case 'route_support': {
      if (vehicle.operationalStatus !== 'available') {
        return { allowed: false, reason: 'Rota desteği yalnızca müsait araçlara verilir.' };
      }
      if (vehicle.fuelOrCharge <= 25) {
        return { allowed: false, reason: 'Yakıt/şarj seviyesi düşük.' };
      }
      return { allowed: true };
    }
    default:
      return { allowed: false, reason: 'Geçersiz filo aksiyonu.' };
  }
}

function applySendToMaintenance(
  state: VehicleState,
  vehicle: VehicleUnit,
  day: number,
): VehicleState {
  return updateUnit(state, vehicle.id, {
    operationalStatus: 'maintenance',
    assignedEventId: null,
    lastMaintenanceDay: day,
    workload: applyMetricDelta(vehicle.workload, -8),
    condition: applyMetricDelta(vehicle.condition, 4),
    maintenanceNeed: applyMetricDelta(vehicle.maintenanceNeed, -12),
    breakdownRisk: applyMetricDelta(vehicle.breakdownRisk, -8),
    fuelOrCharge: applyMetricDelta(vehicle.fuelOrCharge, -1),
    routeEfficiency: applyMetricDelta(vehicle.routeEfficiency, 1),
  });
}

function applyRestVehicle(
  state: VehicleState,
  vehicle: VehicleUnit,
): VehicleState {
  return updateUnit(state, vehicle.id, {
    operationalStatus: 'resting',
    assignedEventId: null,
    workload: applyMetricDelta(vehicle.workload, -15),
    condition: applyMetricDelta(vehicle.condition, 2),
    maintenanceNeed: applyMetricDelta(vehicle.maintenanceNeed, -4),
    breakdownRisk: applyMetricDelta(vehicle.breakdownRisk, -4),
    fuelOrCharge: applyMetricDelta(vehicle.fuelOrCharge, 2),
    routeEfficiency: applyMetricDelta(vehicle.routeEfficiency, 1),
  });
}

function applyRouteSupport(
  state: VehicleState,
  vehicle: VehicleUnit,
  day: number,
): VehicleState {
  return updateUnit(state, vehicle.id, {
    operationalStatus: 'assigned',
    assignedEventId: `manual-route-support-${day}`,
    lastAssignedDay: day,
    workload: applyMetricDelta(vehicle.workload, 7),
    fuelOrCharge: applyMetricDelta(vehicle.fuelOrCharge, -5),
    condition: applyMetricDelta(vehicle.condition, -1),
    routeEfficiency: applyMetricDelta(vehicle.routeEfficiency, 5),
    maintenanceNeed: applyMetricDelta(vehicle.maintenanceNeed, 2),
    breakdownRisk: applyMetricDelta(vehicle.breakdownRisk, 1),
  });
}

export function applyVehicleFleetAction(
  vehicleState: VehicleState,
  action: VehicleFleetActionInput,
): VehicleFleetActionApplyResult {
  const gate = canApplyVehicleFleetAction(
    vehicleState,
    action.type,
    action.vehicleId,
    action.day,
  );
  if (!gate.allowed) {
    return {
      state: vehicleState,
      applied: false,
      message: gate.reason ?? 'İşlem uygulanamadı.',
    };
  }

  const vehicle = findVehicle(vehicleState, action.vehicleId);
  if (!vehicle) {
    return {
      state: vehicleState,
      applied: false,
      message: 'Araç bulunamadı.',
    };
  }

  let nextState = vehicleState;
  switch (action.type) {
    case 'send_to_maintenance':
      nextState = applySendToMaintenance(nextState, vehicle, action.day);
      break;
    case 'rest_vehicle':
      nextState = applyRestVehicle(nextState, vehicle);
      break;
    case 'route_support':
      nextState = applyRouteSupport(nextState, vehicle, action.day);
      break;
    default:
      return {
        state: vehicleState,
        applied: false,
        message: 'Geçersiz filo aksiyonu.',
      };
  }

  const messages: Record<VehicleFleetActionType, string> = {
    send_to_maintenance: `${vehicle.name} bakıma alındı — gün sonunda toparlanma devam eder.`,
    rest_vehicle: `${vehicle.name} dinlendirme modunda — iş yükü azalır.`,
    route_support: `${vehicle.name} rota desteğine yönlendirildi — gün sonunda müsaitliğe döner.`,
  };

  return {
    state: nextState,
    applied: true,
    message: messages[action.type],
    affectedVehicleId: vehicle.id,
  };
}

type RecommendationCandidate = VehicleFleetActionRecommendation & {
  score: number;
};

function buildMaintenanceCandidate(
  state: VehicleState,
  unit: VehicleUnit,
  day: number,
): RecommendationCandidate | null {
  if (unit.operationalStatus === 'broken') {
    return null;
  }
  const gate = canApplyVehicleFleetAction(
    state,
    'send_to_maintenance',
    unit.id,
    day,
  );
  if (!gate.allowed) {
    return null;
  }
  if (unit.maintenanceNeed < 45 && unit.condition > 60) {
    return null;
  }

  const score = unit.maintenanceNeed + (100 - unit.condition);
  const tone =
    unit.maintenanceNeed >= 70 || unit.condition <= 40 ? 'danger' : 'warning';

  return {
    type: 'send_to_maintenance',
    vehicleId: unit.id,
    vehicleName: unit.name,
    label: ACTION_LABELS.send_to_maintenance,
    description: `${unit.name} bakım ihtiyacı yüksek.`,
    tone,
    score: score + 30,
  };
}

function buildRestCandidate(
  state: VehicleState,
  unit: VehicleUnit,
  day: number,
): RecommendationCandidate | null {
  if (unit.operationalStatus === 'broken') {
    return null;
  }
  const gate = canApplyVehicleFleetAction(state, 'rest_vehicle', unit.id, day);
  if (!gate.allowed) {
    return null;
  }
  if (unit.workload < 55) {
    return null;
  }

  return {
    type: 'rest_vehicle',
    vehicleId: unit.id,
    vehicleName: unit.name,
    label: ACTION_LABELS.rest_vehicle,
    description: `${unit.name} iş yükü yüksek — dinlendirme önerilir.`,
    tone: unit.workload >= 75 ? 'warning' : 'neutral',
    score: unit.workload + unit.breakdownRisk * 0.4,
  };
}

function buildRouteSupportCandidate(
  state: VehicleState,
  unit: VehicleUnit,
  day: number,
): RecommendationCandidate | null {
  if (unit.operationalStatus === 'broken') {
    return null;
  }
  const gate = canApplyVehicleFleetAction(state, 'route_support', unit.id, day);
  if (!gate.allowed) {
    return null;
  }
  if (unit.routeEfficiency > 58) {
    return null;
  }

  return {
    type: 'route_support',
    vehicleId: unit.id,
    vehicleName: unit.name,
    label: ACTION_LABELS.route_support,
    description: `${unit.name} rota verimliliği düşük — destek verilebilir.`,
    tone: unit.routeEfficiency <= 45 ? 'warning' : 'good',
    score: 100 - unit.routeEfficiency + unit.workload * 0.2,
  };
}

export function selectRecommendedVehicleFleetActions(
  vehicleState: VehicleState,
  day = Math.max(1, vehicleState.lastProcessedDay),
): VehicleFleetActionRecommendation[] {
  const candidates: RecommendationCandidate[] = [];

  for (const unit of vehicleState.units) {
    const maintenance = buildMaintenanceCandidate(vehicleState, unit, day);
    const rest = buildRestCandidate(vehicleState, unit, day);
    const route = buildRouteSupportCandidate(vehicleState, unit, day);
    if (maintenance) {
      candidates.push(maintenance);
    }
    if (rest) {
      candidates.push(rest);
    }
    if (route) {
      candidates.push(route);
    }
  }

  const usedVehicleIds = new Set<string>();
  const picked: VehicleFleetActionRecommendation[] = [];

  for (const candidate of [...candidates].sort((a, b) => b.score - a.score)) {
    if (usedVehicleIds.has(candidate.vehicleId)) {
      continue;
    }
    usedVehicleIds.add(candidate.vehicleId);
    picked.push({
      type: candidate.type,
      vehicleId: candidate.vehicleId,
      vehicleName: candidate.vehicleName,
      label: candidate.label,
      description: candidate.description,
      tone: candidate.tone,
    });
    if (picked.length >= 2) {
      break;
    }
  }

  return picked;
}
