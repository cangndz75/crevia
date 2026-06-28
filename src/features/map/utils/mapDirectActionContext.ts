import type { ActiveOperationMapBinding } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import type { ActiveOperationMapCardModel } from '@/core/activeOperationMapBinding';
import type { MaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeTypes';
import { selectActiveMaintenanceRuntimeItems } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeModel';
import { MAINTENANCE_RUNTIME_DOMAIN_TITLES } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeConstants';
import type {
  BuildMapActionBundleInput,
  MapDirectActionDistrictContext,
  MapDirectActionMaintenanceContext,
  MapDirectActionMarkerContext,
  MapDirectActionOperationContext,
  MapDirectActionPeriodGoalContext,
} from '@/core/mapDirectAction';
import type { MapGameplayMarker } from '@/features/map/utils/mapGameplayPresentation';
import { pilotAreaFromMapDistrict } from '@/features/map/data/mapDistrictMapping';
import type { MapDistrictId } from '@/features/map/data/mapAssets';

const READINESS_PHASES = new Set([
  'planning',
  'dispatch_ready',
  'dispatching',
]);

function resolveBindingPhase(
  marker: MapGameplayMarker,
  binding: ActiveOperationMapBinding | null,
): ActiveOperationMapBinding['phase'] | undefined {
  if (!binding?.eventId || marker.eventId !== binding.eventId) return undefined;
  return binding.phase;
}

function markerToContext(marker: MapGameplayMarker): MapDirectActionMarkerContext {
  return {
    markerId: marker.id,
    markerType: marker.type,
    markerStatus: marker.status,
    eventId: marker.eventId,
    eventDetailRoute: marker.eventDetailRoute,
    districtName: marker.districtName,
  };
}

function resolveDistrictIdFromName(districtName?: string): string | undefined {
  if (!districtName?.trim()) return undefined;
  const normalized = districtName.trim().toLocaleLowerCase('tr-TR');
  const map: Record<string, MapDistrictId> = {
    merkez: 'merkez',
    cumhuriyet: 'cumhuriyet',
    sanayi: 'sanayi',
    istasyon: 'istasyon',
    yeşilvadi: 'yesilvadi',
    yesilvadi: 'yesilvadi',
    güneştepe: 'cumhuriyet',
    gunestepe: 'cumhuriyet',
  };
  for (const [key, id] of Object.entries(map)) {
    if (normalized.includes(key)) return id;
  }
  return undefined;
}

export function buildMapDirectActionMaintenanceContext(params: {
  maintenanceRuntime?: MaintenanceBacklogRuntimeState | null;
  districtId?: string;
  readinessRoute?: string;
}): MapDirectActionMaintenanceContext | undefined {
  const runtime = params.maintenanceRuntime;
  if (!runtime) return undefined;
  const active = selectActiveMaintenanceRuntimeItems(runtime);
  if (active.length === 0) return undefined;

  const districtLinked = params.districtId
    ? active.filter((item) => {
        const domain = item.domain;
        if (params.districtId === 'sanayi' && domain === 'vehicle') return true;
        if (params.districtId === 'cumhuriyet' && domain === 'personnel') return true;
        if (params.districtId === 'merkez') return true;
        return false;
      })
    : active;

  const top = active[0];
  return {
    activeItemCount: active.length,
    districtLinkedItemCount: districtLinked.length,
    topItemLabel: top ? MAINTENANCE_RUNTIME_DOMAIN_TITLES[top.domain] : undefined,
    readinessRouteAvailable: Boolean(params.readinessRoute),
    readinessRoute: params.readinessRoute,
  };
}

export function buildMapDirectActionOperationContext(params: {
  marker: MapGameplayMarker;
  binding: ActiveOperationMapBinding | null;
  card: ActiveOperationMapCardModel | null;
}): MapDirectActionOperationContext {
  const phase = resolveBindingPhase(params.marker, params.binding);
  const route =
    params.marker.eventDetailRoute ??
    params.binding?.eventDetailRoute ??
    params.card?.ctaRoute;
  return {
    eventId: params.marker.eventId ?? params.binding?.eventId,
    eventDetailRoute: route,
    phase,
    districtId: params.binding?.districtId,
    districtName: params.marker.districtName ?? params.binding?.districtName,
    hasReadinessContext: Boolean(phase && READINESS_PHASES.has(phase)),
    resultRouteAvailable: phase === 'result_trace_available' || phase === 'completed',
  };
}

export function buildMapDirectActionDistrictContext(params: {
  marker: MapGameplayMarker;
  personalitySignalLine?: string;
  canOpenDistrictDetail?: boolean;
}): MapDirectActionDistrictContext {
  const districtId =
    resolveDistrictIdFromName(params.marker.districtName) ??
    (params.marker.type === 'district' ? resolveDistrictIdFromName(params.marker.title) : undefined);
  return {
    districtId,
    districtName: params.marker.districtName,
    personalitySignalLine: params.personalitySignalLine,
    canOpenDistrictDetail:
      params.canOpenDistrictDetail ?? Boolean(districtId && pilotAreaFromMapDistrict(districtId as MapDistrictId)),
  };
}

export function buildMapDirectActionPeriodGoalContext(params: {
  shortTitle?: string;
  currentSignal?: string;
}): MapDirectActionPeriodGoalContext | undefined {
  if (!params.shortTitle?.trim()) return undefined;
  return {
    shortTitle: params.shortTitle,
    currentSignal: params.currentSignal,
  };
}

export function buildMarkerActionBundleInput(params: {
  marker: MapGameplayMarker;
  binding: ActiveOperationMapBinding | null;
  card: ActiveOperationMapCardModel | null;
  maintenanceRuntime?: MaintenanceBacklogRuntimeState | null;
  personalitySignalLine?: string;
  periodGoalShortTitle?: string;
  layerToggleAvailable?: boolean;
  excludeDedupeKeys?: string[];
}): BuildMapActionBundleInput {
  const operation = buildMapDirectActionOperationContext({
    marker: params.marker,
    binding: params.binding,
    card: params.card,
  });
  const districtId = buildMapDirectActionDistrictContext({
    marker: params.marker,
    personalitySignalLine: params.personalitySignalLine,
  }).districtId;

  return {
    surface: 'map_bottom_sheet',
    marker: markerToContext(params.marker),
    operation,
    maintenance: buildMapDirectActionMaintenanceContext({
      maintenanceRuntime: params.maintenanceRuntime,
      districtId,
      readinessRoute: operation.eventDetailRoute,
    }),
    district: buildMapDirectActionDistrictContext({
      marker: params.marker,
      personalitySignalLine: params.personalitySignalLine,
    }),
    periodGoal: buildMapDirectActionPeriodGoalContext({
      shortTitle: params.periodGoalShortTitle,
    }),
    layerToggleAvailable: params.layerToggleAvailable,
    reportRouteAvailable: true,
    excludeDedupeKeys: params.excludeDedupeKeys,
  };
}
