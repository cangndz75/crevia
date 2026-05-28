import { normalizeContainerNeighborhoodId } from '@/core/containers/containerNeighborhoodBridge';
import type {
  VehicleCategory,
  VehicleOperationalStatus,
  VehicleState,
  VehicleUnit,
} from '@/core/vehicles/vehicleTypes';
import { colors } from '@/ui/theme/colors';

import type { MapDistrictId } from '../data/mapAssets';
import { getCityDistrictRegion } from '../data/cityOverviewGeometry';
import type { MapPin, PinSeverity } from '../types/map';

export type MapVehiclePinSeverity = 'normal' | 'warning' | 'danger' | 'critical';

export type MapVehiclePin = {
  id: string;
  vehicleId: string;
  name: string;
  category: VehicleCategory;
  categoryLabel: string;
  status: VehicleOperationalStatus;
  statusLabel: string;
  neighborhoodId: string;
  x: number;
  y: number;
  severity: MapVehiclePinSeverity;
  iconName: string;
  shortText: string;
  detailText: string;
};

export type NeighborhoodVehicleBadge = {
  neighborhoodId: string;
  severity: 'warning' | 'danger' | 'critical';
  label: string;
  count: number;
};

const VEHICLE_CATEGORY_LABELS: Record<VehicleCategory, string> = {
  garbage_truck: 'Çöp Aracı',
  small_response: 'Müdahale Aracı',
  maintenance_vehicle: 'Bakım Aracı',
  inspection_vehicle: 'Denetim Aracı',
  utility_pickup: 'Pickup',
};

const VEHICLE_STATUS_LABELS: Record<VehicleOperationalStatus, string> = {
  available: 'Müsait',
  assigned: 'Görevde',
  maintenance: 'Bakımda',
  broken: 'Arızalı',
  resting: 'Dinlenmede',
};

const VEHICLE_CATEGORY_ICONS: Record<VehicleCategory, string> = {
  garbage_truck: 'truck',
  small_response: 'car',
  maintenance_vehicle: 'wrench',
  inspection_vehicle: 'shield',
  utility_pickup: 'pickup',
};

const VEHICLE_SEVERITY_COLORS: Record<MapVehiclePinSeverity, string> = {
  normal: colors.secondary,
  warning: colors.warning,
  danger: '#D9933D',
  critical: colors.danger,
};

const VEHICLE_BADGE_COLORS: Record<
  NeighborhoodVehicleBadge['severity'],
  string
> = {
  warning: colors.warning,
  danger: '#D9933D',
  critical: colors.danger,
};

/** Konteyner pinlerinden ayrılmak için ek açı ve daha geniş yarıçap. */
const VEHICLE_POSITION_ANGLE_OFFSET = Math.PI / 5;
const VEHICLE_BASE_RADIUS = 0.052;

function clamp01(value: number): number {
  return Math.max(0.05, Math.min(0.95, value));
}

function hashVehicleId(vehicleId: string): number {
  let hash = 0;
  for (let i = 0; i < vehicleId.length; i += 1) {
    hash = (hash * 31 + vehicleId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function resolveNeighborhoodId(unit: VehicleUnit): MapDistrictId | null {
  const resolved = normalizeContainerNeighborhoodId(
    unit.currentNeighborhoodId ?? unit.homeNeighborhoodId,
  );
  return resolved as MapDistrictId | null;
}

export function resolveVehiclePinSeverity(
  unit: VehicleUnit,
): MapVehiclePinSeverity {
  if (
    unit.operationalStatus === 'broken' ||
    unit.breakdownRisk >= 85 ||
    unit.condition <= 25
  ) {
    return 'critical';
  }
  if (
    unit.operationalStatus === 'maintenance' ||
    unit.maintenanceNeed >= 75 ||
    unit.breakdownRisk >= 65
  ) {
    return 'danger';
  }
  if (
    unit.operationalStatus === 'assigned' ||
    unit.operationalStatus === 'resting' ||
    unit.workload >= 65 ||
    unit.fuelOrCharge <= 35
  ) {
    return 'warning';
  }
  return 'normal';
}

function resolveVehicleStatusLabel(unit: VehicleUnit): string {
  if (
    unit.assignedEventId?.startsWith('manual-route-support-') &&
    unit.operationalStatus === 'assigned'
  ) {
    return 'Rota desteği';
  }
  return VEHICLE_STATUS_LABELS[unit.operationalStatus];
}

function fallbackVehiclePosition(
  unit: VehicleUnit,
  indexInNeighborhood: number,
  neighborhoodCenters?: Record<string, { x: number; y: number }>,
): { x: number; y: number } {
  const hoodId = resolveNeighborhoodId(unit) ?? 'merkez';
  const customCenter = neighborhoodCenters?.[hoodId];
  const region = getCityDistrictRegion(hoodId);
  const cx = customCenter?.x ?? region?.label.x ?? 0.5;
  const cy = customCenter?.y ?? region?.label.y ?? 0.5;
  const hash = hashVehicleId(unit.id);
  const angle =
    ((hash % 360) / 360) * Math.PI * 2 + VEHICLE_POSITION_ANGLE_OFFSET;
  const radius = VEHICLE_BASE_RADIUS + (indexInNeighborhood % 5) * 0.011;
  return {
    x: clamp01(cx + Math.cos(angle) * radius),
    y: clamp01(cy + Math.sin(angle) * radius),
  };
}

function buildShortText(unit: VehicleUnit): string {
  const categoryLabel = VEHICLE_CATEGORY_LABELS[unit.category];
  const statusLabel = resolveVehicleStatusLabel(unit);
  return `${categoryLabel} · ${statusLabel}`;
}

function buildDetailText(unit: VehicleUnit): string {
  return `Yük %${Math.round(unit.workload)} · Risk %${Math.round(unit.breakdownRisk)} · Yakıt %${Math.round(unit.fuelOrCharge)}`;
}

export type BuildMapVehiclePinsOptions = {
  neighborhoodId?: string | null;
  neighborhoodCenters?: Record<string, { x: number; y: number }>;
  tutorialActive?: boolean;
};

export function buildMapVehiclePins(
  vehicleState: VehicleState | null | undefined,
  options?: BuildMapVehiclePinsOptions,
): MapVehiclePin[] {
  if (!vehicleState || options?.tutorialActive) {
    return [];
  }

  const filterNeighborhood = normalizeContainerNeighborhoodId(
    options?.neighborhoodId ?? null,
  );

  const units = vehicleState.units.filter((unit) => {
    const hood = resolveNeighborhoodId(unit);
    if (!hood) {
      return false;
    }
    if (filterNeighborhood && hood !== filterNeighborhood) {
      return false;
    }
    return true;
  });

  const indexByNeighborhood = new Map<string, number>();

  return units.map((unit) => {
    const neighborhoodId = resolveNeighborhoodId(unit) ?? 'merkez';
    const indexInNeighborhood = indexByNeighborhood.get(neighborhoodId) ?? 0;
    indexByNeighborhood.set(neighborhoodId, indexInNeighborhood + 1);

    const position = fallbackVehiclePosition(
      unit,
      indexInNeighborhood,
      options?.neighborhoodCenters,
    );

    return {
      id: `vehicle-pin-${unit.id}`,
      vehicleId: unit.id,
      name: unit.name,
      category: unit.category,
      categoryLabel: VEHICLE_CATEGORY_LABELS[unit.category],
      status: unit.operationalStatus,
      statusLabel: resolveVehicleStatusLabel(unit),
      neighborhoodId,
      x: position.x,
      y: position.y,
      severity: resolveVehiclePinSeverity(unit),
      iconName: VEHICLE_CATEGORY_ICONS[unit.category],
      shortText: buildShortText(unit),
      detailText: buildDetailText(unit),
    };
  });
}

function unitsForNeighborhood(
  vehicleState: VehicleState,
  neighborhoodId: MapDistrictId,
): VehicleUnit[] {
  return vehicleState.units.filter(
    (unit) => resolveNeighborhoodId(unit) === neighborhoodId,
  );
}

function resolveNeighborhoodVehicleBadge(
  neighborhoodId: MapDistrictId,
  units: VehicleUnit[],
): NeighborhoodVehicleBadge | null {
  if (units.length === 0) {
    return null;
  }

  const brokenCount = units.filter(
    (unit) => unit.operationalStatus === 'broken',
  ).length;
  if (brokenCount > 0) {
    return {
      neighborhoodId,
      severity: 'critical',
      label: 'Araç arızası',
      count: brokenCount,
    };
  }

  const maintenanceRiskCount = units.filter(
    (unit) =>
      unit.operationalStatus === 'maintenance' ||
      unit.maintenanceNeed >= 75 ||
      unit.breakdownRisk >= 65,
  ).length;
  if (maintenanceRiskCount > 0) {
    return {
      neighborhoodId,
      severity: 'danger',
      label: 'Bakım riski',
      count: maintenanceRiskCount,
    };
  }

  const availableCount = units.filter(
    (unit) => unit.operationalStatus === 'available',
  ).length;
  if (availableCount <= 1 && units.length >= 2) {
    return {
      neighborhoodId,
      severity: 'warning',
      label: 'Araç az',
      count: availableCount,
    };
  }

  const busyCount = units.filter(
    (unit) =>
      unit.operationalStatus === 'assigned' ||
      unit.operationalStatus === 'resting',
  ).length;
  if (busyCount >= 2 && busyCount / units.length >= 0.5) {
    return {
      neighborhoodId,
      severity: 'warning',
      label: 'Yoğun filo',
      count: busyCount,
    };
  }

  return null;
}

export function buildNeighborhoodVehicleBadges(
  vehicleState: VehicleState | null | undefined,
  options?: { tutorialActive?: boolean },
): NeighborhoodVehicleBadge[] {
  if (!vehicleState || options?.tutorialActive) {
    return [];
  }

  const neighborhoods = new Set<MapDistrictId>();
  for (const unit of vehicleState.units) {
    const hood = resolveNeighborhoodId(unit);
    if (hood) {
      neighborhoods.add(hood);
    }
  }

  const badges: NeighborhoodVehicleBadge[] = [];
  for (const neighborhoodId of neighborhoods) {
    const badge = resolveNeighborhoodVehicleBadge(
      neighborhoodId,
      unitsForNeighborhood(vehicleState, neighborhoodId),
    );
    if (badge) {
      badges.push(badge);
    }
  }

  return badges;
}

function mapVehicleSeverityToPinSeverity(
  severity: MapVehiclePinSeverity,
): PinSeverity {
  switch (severity) {
    case 'critical':
      return 'critical';
    case 'danger':
      return 'high';
    case 'warning':
      return 'medium';
    default:
      return 'low';
  }
}

export function vehicleMapPinToMapPin(
  pin: MapVehiclePin,
  mapDistrictId?: MapDistrictId,
): MapPin {
  return {
    id: pin.id,
    type: 'vehicle',
    label: pin.shortText,
    x: pin.x,
    y: pin.y,
    color: VEHICLE_SEVERITY_COLORS[pin.severity],
    icon: pin.iconName,
    severity: mapVehicleSeverityToPinSeverity(pin.severity),
    mapDistrictId: mapDistrictId ?? (pin.neighborhoodId as MapDistrictId),
  };
}

export function getVehicleSignalTone(
  severity: NeighborhoodVehicleBadge['severity'],
): string {
  return VEHICLE_BADGE_COLORS[severity];
}
