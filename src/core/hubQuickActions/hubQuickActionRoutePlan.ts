import type { ContainerState } from '@/core/containers/containerTypes';
import { selectWorstContainerNeighborhood } from '@/core/containers/containerSelectors';
import type { EventCard } from '@/core/models/EventCard';
import type { Neighborhood } from '@/core/models/Neighborhood';
import { VEHICLE_CATEGORY_LABELS } from '@/core/vehicles/vehicleConstants';
import { scoreVehicleForAssignment } from '@/core/vehicles/vehicleSelectors';
import type {
  VehicleCategory,
  VehicleState,
  VehicleUnit,
} from '@/core/vehicles/vehicleTypes';
import { eventSeverity } from '@/core/utils/eventPriority';

import type {
  RoutePreparationAssignment,
  RoutePreparationFocus,
  RoutePreparationSource,
} from './hubQuickActionTypes';

export type RoutePreparationPlanContext = {
  activeEvents: EventCard[];
  neighborhoods: Neighborhood[];
  vehicleState: VehicleState;
  containerState?: ContainerState;
};

const ROUTE_EVENT_KEYWORDS = [
  'çöp',
  'atık',
  'konteyner',
  'rota',
  'toplama',
  'araç',
  'arac',
  'filo',
  'temizlik',
  'waste',
  'route',
  'garbage',
] as const;

const WASTE_KEYWORDS = [
  'çöp',
  'atık',
  'konteyner',
  'toplama',
  'doluluk',
  'waste',
  'garbage',
] as const;

const MAINTENANCE_KEYWORDS = [
  'bakım',
  'bakim',
  'arıza',
  'ariza',
  'tamir',
  'onarım',
  'onarim',
  'maintenance',
] as const;

const RESPONSE_KEYWORDS = [
  'şikayet',
  'sikayet',
  'müdahale',
  'mudahale',
  'saha',
  'vatandaş',
  'vatandas',
  'koordinasyon',
  'response',
] as const;

function normalizeHaystack(...parts: Array<string | undefined>): string {
  return parts
    .filter((p): p is string => typeof p === 'string' && p.length > 0)
    .join(' ')
    .toLowerCase();
}

function includesAny(haystack: string, keywords: readonly string[]): boolean {
  return keywords.some((kw) => haystack.includes(kw));
}

function isRouteThemedEvent(event: EventCard): boolean {
  const haystack = normalizeHaystack(
    event.title,
    event.description,
    event.category,
    event.eventType,
    event.contextTag,
  );
  return includesAny(haystack, ROUTE_EVENT_KEYWORDS);
}

function resolveNeighborhoodId(
  rawId: string | undefined,
  districtName: string | undefined,
  neighborhoods: Neighborhood[],
): string | undefined {
  if (rawId) {
    const byId = neighborhoods.find((n) => n.id === rawId);
    if (byId) return byId.id;
  }
  if (districtName) {
    const byName = neighborhoods.find((n) => n.name === districtName);
    if (byName) return byName.id;
    if (neighborhoods.some((n) => n.id === districtName)) return districtName;
  }
  return rawId;
}

function inferRouteFocus(haystack: string): RoutePreparationFocus {
  if (includesAny(haystack, MAINTENANCE_KEYWORDS)) {
    return 'maintenance_route';
  }
  if (includesAny(haystack, RESPONSE_KEYWORDS)) {
    return 'response_route';
  }
  if (includesAny(haystack, WASTE_KEYWORDS)) {
    return 'waste_route';
  }
  return 'general_route';
}

function categoriesForRouteFocus(focus: RoutePreparationFocus): VehicleCategory[] {
  switch (focus) {
    case 'waste_route':
      return ['garbage_truck', 'utility_pickup'];
    case 'maintenance_route':
      return ['maintenance_vehicle', 'utility_pickup'];
    case 'response_route':
      return ['small_response', 'utility_pickup'];
    case 'general_route':
      return [
        'garbage_truck',
        'small_response',
        'maintenance_vehicle',
        'utility_pickup',
        'inspection_vehicle',
      ];
  }
}

function pickRouteThemedEvent(activeEvents: EventCard[]): EventCard | null {
  const themed = activeEvents.filter(isRouteThemedEvent);
  const pool = themed.length > 0 ? themed : activeEvents;
  if (pool.length === 0) return null;
  return [...pool].sort((a, b) => eventSeverity(b) - eventSeverity(a))[0] ?? null;
}

function pickVehiclePressureNeighborhood(
  vehicleState: VehicleState,
): string | null {
  const ranked = [...vehicleState.units]
    .filter((u) => u.operationalStatus !== 'broken')
    .sort(
      (a, b) =>
        b.breakdownRisk +
        b.workload +
        b.maintenanceNeed -
        (a.breakdownRisk + a.workload + a.maintenanceNeed),
    );
  return ranked[0]?.currentNeighborhoodId ?? null;
}

function fallbackNeighborhoodId(neighborhoods: Neighborhood[]): string {
  const merkez = neighborhoods.find((n) => n.id === 'merkez');
  return merkez?.id ?? neighborhoods[0]?.id ?? 'merkez';
}

function isAssignableVehicle(unit: VehicleUnit): boolean {
  if (unit.operationalStatus !== 'available') return false;
  if (unit.breakdownRisk >= 85 || unit.condition <= 25) return false;
  return true;
}

function scoreRoutePreparationVehicle(
  unit: VehicleUnit,
  targetNeighborhoodId: string,
  preferredCategories: VehicleCategory[],
): number {
  const categoryIndex = preferredCategories.indexOf(unit.category);
  const categoryScore = categoryIndex >= 0 ? 30 - categoryIndex * 4 : 0;
  const neighborhoodScore =
    unit.currentNeighborhoodId === targetNeighborhoodId
      ? 18
      : unit.homeNeighborhoodId === targetNeighborhoodId
        ? 12
        : 0;
  const riskPenalty = unit.breakdownRisk * 0.25 + unit.workload * 0.15;
  const qualityBonus =
    unit.condition * 0.12 + unit.routeEfficiency * 0.1 + unit.fuelOrCharge * 0.05;

  return categoryScore + neighborhoodScore + qualityBonus - riskPenalty;
}

export function selectRoutePreparationVehicle(
  vehicleState: VehicleState,
  targetNeighborhoodId: string,
  routeFocus: RoutePreparationFocus,
): VehicleUnit | null {
  const preferredCategories = categoriesForRouteFocus(routeFocus);
  const candidates = vehicleState.units.filter(isAssignableVehicle);
  if (candidates.length === 0) return null;

  const scored = candidates
    .map((unit) => ({
      unit,
      score: scoreRoutePreparationVehicle(
        unit,
        targetNeighborhoodId,
        preferredCategories,
      ),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.unit.id.localeCompare(b.unit.id);
    });

  const categoryMatch = scored.find((entry) =>
    preferredCategories.includes(entry.unit.category),
  );
  if (categoryMatch) return categoryMatch.unit;

  return (
    [...candidates].sort(
      (a, b) =>
        scoreVehicleForAssignment(b) - scoreVehicleForAssignment(a) ||
        a.id.localeCompare(b.id),
    )[0] ?? null
  );
}

export function buildRoutePreparationAssignment(
  context: RoutePreparationPlanContext,
  currentDay: number,
): RoutePreparationAssignment | null {
  const { activeEvents, neighborhoods, vehicleState, containerState } = context;

  let targetNeighborhoodId: string | undefined;
  let routeFocus: RoutePreparationFocus = 'general_route';
  let source: RoutePreparationSource = 'fallback';

  const primaryEvent = pickRouteThemedEvent(activeEvents);
  if (primaryEvent) {
    targetNeighborhoodId = resolveNeighborhoodId(
      primaryEvent.neighborhoodId,
      primaryEvent.district,
      neighborhoods,
    );
    const previewDecision = primaryEvent.decisions[0];
    routeFocus = inferRouteFocus(
      normalizeHaystack(
        primaryEvent.title,
        primaryEvent.description,
        primaryEvent.category,
        previewDecision?.title,
        previewDecision?.description,
      ),
    );
    source = 'active_event';
  } else {
    const containerWorst = containerState
      ? selectWorstContainerNeighborhood(containerState)
      : null;
    if (containerWorst) {
      targetNeighborhoodId = containerWorst.neighborhoodId;
      routeFocus = 'waste_route';
      source = 'container_pressure';
    } else {
      const vehicleNeighborhood = pickVehiclePressureNeighborhood(vehicleState);
      if (vehicleNeighborhood) {
        targetNeighborhoodId = vehicleNeighborhood;
        routeFocus = 'general_route';
        source = 'vehicle_pressure';
      }
    }
  }

  if (!targetNeighborhoodId) {
    targetNeighborhoodId = fallbackNeighborhoodId(neighborhoods);
    source = 'fallback';
  }

  const neighborhood =
    neighborhoods.find((n) => n.id === targetNeighborhoodId) ??
    neighborhoods.find((n) => n.name === targetNeighborhoodId);
  const targetNeighborhoodLabel =
    neighborhood?.name ?? targetNeighborhoodId ?? 'Merkez';

  const vehicle = selectRoutePreparationVehicle(
    vehicleState,
    targetNeighborhoodId,
    routeFocus,
  );
  if (!vehicle) {
    return null;
  }

  const vehicleCategoryLabel = VEHICLE_CATEGORY_LABELS[vehicle.category];
  const label = `${targetNeighborhoodLabel} rotası — ${vehicle.name}`;
  const effectLabel = `${targetNeighborhoodLabel} ${vehicleCategoryLabel.toLowerCase()} rotası`;

  return {
    day: currentDay,
    targetNeighborhoodId,
    targetNeighborhoodLabel,
    targetVehicleId: vehicle.id,
    targetVehicleLabel: vehicle.name,
    targetVehicleCategory: vehicle.category,
    routeFocus,
    source,
    label,
    effectLabel,
  };
}

export function buildRoutePreparationResultLines(
  assignment: RoutePreparationAssignment,
): { resultLine: string; detailLine: string } {
  const neighborhood = assignment.targetNeighborhoodLabel;
  if (assignment.targetVehicleLabel) {
    return {
      resultLine: `Rota Hazırlığı tamamlandı: ${neighborhood} rotası hazır.`,
      detailLine:
        'Eşleşen araç ve rota kararlarında küçük yük/risk avantajı sağlar.',
    };
  }
  return {
    resultLine: `Rota Hazırlığı tamamlandı: ${neighborhood} rotası hazır.`,
    detailLine:
      'Eşleşen araç ve rota kararlarında küçük yük/risk avantajı sağlar.',
  };
}
