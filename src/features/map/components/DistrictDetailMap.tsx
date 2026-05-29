import { useMemo } from 'react';
import { Ellipse, G, Path, Text as SvgText } from 'react-native-svg';

import type { EventCard } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { colors } from '@/ui/theme/colors';

import { CITY_OVERVIEW_VIEWBOX } from '../data/cityOverviewGeometry';
import { getDistrictPoiPins } from '../data/districtDetailMarkers';
import {
  getDistrictMapAsset,
  MAP_ZOOM_LIMITS,
  type MapDistrictId,
} from '../data/mapAssets';
import { pilotDistrictFromMapDistrict } from '../data/mapDistrictMapping';
import type { ContainerState } from '@/core/containers/containerTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';

import type { ActiveLayers, MapFilterId, MapPin, PilotAreaId } from '../types/map';
import {
  buildContainerMapPins,
  containerMapPinToMapPin,
} from '../utils/containerMapAdapter';
import {
  buildMapVehiclePins,
  vehicleMapPinToMapPin,
} from '../utils/vehicleMapAdapter';
import { buildMapPins, shouldShowHeatmap, shouldShowRoutes } from '../utils/mapFromEvents';
import { useMapDisplaySize } from './MapDisplaySizeContext';
import { MapOverlaySvg } from './MapOverlaySvg';
import { MapPin as MapPinNode } from './MapPin';
import { ZoomableMapCanvas, type ZoomableMapControls } from './ZoomableMapCanvas';

export type DistrictDetailMapProps = {
  mapRef?: React.RefObject<ZoomableMapControls | null>;
  districtId: MapDistrictId;
  districtLabel: string;
  pilotAreaId: PilotAreaId | null;
  selectedDistrictId: PilotDistrictId;
  selectedFilter: MapFilterId;
  activeLayers: ActiveLayers;
  gameDay: number;
  events: EventCard[];
  containerState?: ContainerState;
  vehicleState?: VehicleState;
  hideVehicleSignals?: boolean;
  selectedPinId?: string | null;
  onPinPress?: (pinId: string) => void;
};

export function DistrictDetailMap({
  mapRef,
  districtId,
  districtLabel,
  pilotAreaId,
  selectedDistrictId,
  selectedFilter,
  activeLayers,
  gameDay,
  events,
  containerState,
  vehicleState,
  hideVehicleSignals = false,
  selectedPinId = null,
  onPinPress,
}: DistrictDetailMapProps) {
  const asset = getDistrictMapAsset(districtId);
  const pilotDistrict = pilotDistrictFromMapDistrict(districtId);
  const isPilotDistrict = pilotDistrict === selectedDistrictId && pilotAreaId != null;

  const operationalPins: MapPin[] = useMemo(() => {
    if (!isPilotDistrict || !pilotAreaId) return [];
    return buildMapPins({
      pilotAreaId,
      selectedDistrictId,
      selectedFilter,
      activeLayers,
      gameDay,
      activeEvents: events,
    });
  }, [
    activeLayers,
    events,
    gameDay,
    isPilotDistrict,
    pilotAreaId,
    selectedDistrictId,
    selectedFilter,
  ]);

  const containerPins = useMemo(() => {
    if (!containerState) return [];
    return buildContainerMapPins({
      containerState,
      neighborhoodId: districtId,
    }).map((pin) => containerMapPinToMapPin(pin, districtId));
  }, [containerState, districtId]);

  const vehiclePins = useMemo(() => {
    if (!vehicleState || hideVehicleSignals) return [];
    return buildMapVehiclePins(vehicleState, {
      neighborhoodId: districtId,
      tutorialActive: hideVehicleSignals,
    }).map((pin) => vehicleMapPinToMapPin(pin, districtId));
  }, [districtId, hideVehicleSignals, vehicleState]);

  const poiPins = useMemo(() => {
    const base = getDistrictPoiPins(districtId);
    return base.filter((pin) => {
      if (containerPins.length > 0 && pin.type === 'container') {
        return false;
      }
      if (vehiclePins.length > 0 && pin.type === 'vehicle') {
        return false;
      }
      return true;
    });
  }, [containerPins.length, districtId, vehiclePins.length]);

  const showContainerPins =
    selectedFilter === 'containers' ||
    activeLayers.waste ||
    containerPins.length > 0;

  const showVehiclePins =
    selectedFilter === 'vehicles' || vehiclePins.length > 0;

  const pins = useMemo(() => {
    const merged = [...poiPins];
    const ids = new Set(merged.map((p) => p.id));
    if (showContainerPins) {
      for (const pin of containerPins) {
        if (!ids.has(pin.id)) merged.push(pin);
      }
    }
    if (showVehiclePins) {
      for (const pin of vehiclePins) {
        if (!ids.has(pin.id)) merged.push(pin);
      }
    }
    for (const p of operationalPins) {
      if (!ids.has(p.id)) merged.push(p);
    }
    return merged;
  }, [
    containerPins,
    operationalPins,
    poiPins,
    showContainerPins,
    showVehiclePins,
    vehiclePins,
  ]);

  const showHeat = shouldShowHeatmap(selectedFilter, activeLayers) && isPilotDistrict;
  const showRoutes = shouldShowRoutes(selectedFilter, activeLayers) && isPilotDistrict;

  return (
    <ZoomableMapCanvas
      ref={mapRef}
      asset={asset}
      zoomLimits={MAP_ZOOM_LIMITS.districtDetail}
    >
      <DistrictDetailOverlay
        districtLabel={districtLabel}
        pins={pins}
        showHeat={showHeat}
        showRoutes={showRoutes}
        selectedPinId={selectedPinId}
        onPinPress={onPinPress}
      />
    </ZoomableMapCanvas>
  );
}

type OverlayProps = {
  districtLabel: string;
  pins: MapPin[];
  showHeat: boolean;
  showRoutes: boolean;
  selectedPinId?: string | null;
  onPinPress?: (pinId: string) => void;
};

function DistrictDetailOverlay({
  districtLabel,
  pins,
  showHeat,
  showRoutes,
  selectedPinId = null,
  onPinPress,
}: OverlayProps) {
  const { width: mapWidth, height: mapHeight } = useMapDisplaySize();
  const vb = `0 0 ${CITY_OVERVIEW_VIEWBOX.width} ${CITY_OVERVIEW_VIEWBOX.height}`;

  if (mapWidth <= 0 || mapHeight <= 0) return null;

  return (
    <MapOverlaySvg width={mapWidth} height={mapHeight} viewBox={vb}>
      {showRoutes && (
        <Path
          d="M 0.15 0.4 L 0.45 0.5 L 0.75 0.55"
          fill="none"
          stroke={colors.purple}
          strokeWidth={0.004}
          strokeDasharray="0.012 0.01"
          strokeLinecap="round"
          opacity={0.75}
        />
      )}

      {showHeat && (
        <Ellipse
          cx={0.5}
          cy={0.5}
          rx={0.18}
          ry={0.14}
          fill="rgba(224, 90, 82, 0.18)"
        />
      )}

      <SvgText
        x={0.5}
        y={0.08}
        fontSize={0.04}
        fontWeight="800"
        fill={colors.textPrimary}
        textAnchor="middle"
        opacity={0.85}
      >
        {districtLabel}
      </SvgText>

      <G>
        {pins.map((pin) => (
          <MapPinNode
            key={pin.id}
            pin={pin}
            mapWidth={mapWidth}
            mapHeight={mapHeight}
            selected={pin.id === selectedPinId}
            onPress={onPinPress}
          />
        ))}
      </G>
    </MapOverlaySvg>
  );
}
