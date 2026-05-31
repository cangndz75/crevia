import { useMemo } from 'react';
import { Circle, Ellipse, G, Path, Text as SvgText } from 'react-native-svg';

import type { ContainerState } from '@/core/containers/containerTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';

import type { EventCard } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { colors } from '@/ui/theme/colors';

import {
  CITY_DISTRICT_REGIONS,
  CITY_OVERVIEW_ROUTES,
  CITY_OVERVIEW_VIEWBOX,
} from '../data/cityOverviewGeometry';
import { mapAssets, MAP_ZOOM_LIMITS, type MapDistrictId } from '../data/mapAssets';
import { mapDistrictFromPilot } from '../data/mapDistrictMapping';
import type { ActiveLayers, MapFilterId, MapPin, PilotAreaId } from '../types/map';
import {
  buildNeighborhoodContainerMapSignals,
  getContainerSignalTone,
  type NeighborhoodContainerMapSignal,
} from '../utils/containerMapAdapter';
import {
  buildNeighborhoodVehicleBadges,
  getVehicleSignalTone,
  type NeighborhoodVehicleBadge,
} from '../utils/vehicleMapAdapter';
import {
  buildCityOverviewPins,
  shouldShowHeatmap,
  shouldShowRoutes,
} from '../utils/mapOverviewPins';
import { useMapDisplaySize } from './MapDisplaySizeContext';
import { MapOverlaySvg } from './MapOverlaySvg';
import { MapPin as MapPinNode } from './MapPin';
import { ZoomableMapCanvas, type ZoomableMapControls } from './ZoomableMapCanvas';

export type CityOverviewMapProps = {
  mapRef?: React.RefObject<ZoomableMapControls | null>;
  selectedDistrictId: PilotDistrictId;
  highlightedDistrictId?: MapDistrictId;
  pilotAreaId: PilotAreaId;
  selectedFilter: MapFilterId;
  activeLayers: ActiveLayers;
  gameDay: number;
  events: EventCard[];
  containerState?: ContainerState;
  vehicleState?: VehicleState;
  hideContainerSignals?: boolean;
  hideVehicleSignals?: boolean;
  selectedPinId?: string | null;
  crisisHighlightDistrictIds?: MapDistrictId[];
  onDistrictPress?: (districtId: MapDistrictId) => void;
  onPinPress?: (pinId: string) => void;
};

export function CityOverviewMap({
  mapRef,
  selectedDistrictId,
  highlightedDistrictId,
  pilotAreaId,
  selectedFilter,
  activeLayers,
  gameDay,
  events,
  containerState,
  vehicleState,
  hideContainerSignals = false,
  hideVehicleSignals = false,
  selectedPinId = null,
  crisisHighlightDistrictIds,
  onDistrictPress,
  onPinPress,
}: CityOverviewMapProps) {
  const activeMapDistrict =
    highlightedDistrictId ?? mapDistrictFromPilot(selectedDistrictId);

  const crisisDistrictSet = useMemo(
    () => new Set(crisisHighlightDistrictIds ?? []),
    [crisisHighlightDistrictIds],
  );

  const pins: MapPin[] = useMemo(
    () =>
      buildCityOverviewPins({
        pilotAreaId,
        selectedDistrictId,
        selectedFilter,
        activeLayers,
        gameDay,
        activeEvents: events,
      }).map((pin) => ({
        ...pin,
        crisisHighlight:
          pin.mapDistrictId != null &&
          crisisDistrictSet.has(pin.mapDistrictId),
      })),
    [
      activeLayers,
      crisisDistrictSet,
      events,
      gameDay,
      pilotAreaId,
      selectedDistrictId,
      selectedFilter,
    ],
  );

  const showHeat = shouldShowHeatmap(selectedFilter, activeLayers);
  const showRoutes = shouldShowRoutes(selectedFilter, activeLayers);

  const containerSignals = useMemo(() => {
    if (!containerState || hideContainerSignals) {
      return [];
    }
    return buildNeighborhoodContainerMapSignals(containerState);
  }, [containerState, hideContainerSignals]);

  const vehicleBadges = useMemo(() => {
    if (!vehicleState || hideVehicleSignals) {
      return [];
    }
    return buildNeighborhoodVehicleBadges(vehicleState, {
      tutorialActive: hideVehicleSignals,
    });
  }, [hideVehicleSignals, vehicleState]);

  return (
    <ZoomableMapCanvas
      ref={mapRef}
      asset={mapAssets.cityOverview}
      zoomLimits={MAP_ZOOM_LIMITS.cityOverview}
    >
      <CityOverviewOverlay
        activeMapDistrict={activeMapDistrict}
        pins={pins}
        showHeat={showHeat}
        showRoutes={showRoutes}
        containerSignals={containerSignals}
        vehicleBadges={vehicleBadges}
        selectedPinId={selectedPinId}
        crisisHighlightDistrictIds={crisisHighlightDistrictIds}
        onDistrictPress={onDistrictPress}
        onPinPress={onPinPress}
      />
    </ZoomableMapCanvas>
  );
}

type OverlayProps = {
  activeMapDistrict: MapDistrictId;
  pins: MapPin[];
  containerSignals: NeighborhoodContainerMapSignal[];
  vehicleBadges: NeighborhoodVehicleBadge[];
  selectedPinId?: string | null;
  crisisHighlightDistrictIds?: MapDistrictId[];
  showHeat: boolean;
  showRoutes: boolean;
  onDistrictPress?: (districtId: MapDistrictId) => void;
  onPinPress?: (pinId: string) => void;
};

function CityOverviewOverlay({
  activeMapDistrict,
  pins,
  containerSignals,
  vehicleBadges,
  selectedPinId = null,
  crisisHighlightDistrictIds,
  showHeat,
  showRoutes,
  onDistrictPress,
  onPinPress,
}: OverlayProps) {
  const { width: mapWidth, height: mapHeight } = useMapDisplaySize();
  const vb = `0 0 ${CITY_OVERVIEW_VIEWBOX.width} ${CITY_OVERVIEW_VIEWBOX.height}`;

  if (mapWidth <= 0 || mapHeight <= 0) return null;

  return (
    <MapOverlaySvg width={mapWidth} height={mapHeight} viewBox={vb}>
      {showRoutes &&
        CITY_OVERVIEW_ROUTES.map((d, i) => (
          <Path
            key={`route-${i}`}
            d={d}
            fill="none"
            stroke={colors.purple}
            strokeWidth={0.004}
            strokeDasharray="0.012 0.01"
            strokeLinecap="round"
            opacity={0.75}
          />
        ))}

      {CITY_DISTRICT_REGIONS.map((region) => {
        const isActive = region.id === activeMapDistrict;
        const isCrisisDistrict = crisisHighlightDistrictIds?.includes(region.id);
        const signal = containerSignals.find(
          (entry) => entry.neighborhoodId === region.id,
        );
        const vehicleBadge = vehicleBadges.find(
          (entry) => entry.neighborhoodId === region.id,
        );
        const showSignal =
          signal != null &&
          (signal.severity === 'high' ||
            signal.severity === 'critical' ||
            signal.severity === 'medium');
        const showVehicleBadge = vehicleBadge != null;

        return (
          <G key={region.id}>
            {showHeat &&
              isActive &&
              region.heatZones.map((zone, zi) => (
                <Ellipse
                  key={`heat-${zi}`}
                  cx={zone.cx}
                  cy={zone.cy}
                  rx={zone.rx}
                  ry={zone.ry}
                  fill={zone.fill}
                />
              ))}

            <Path
              d={region.path}
              fill={region.color}
              fillOpacity={isActive ? 0.2 : isCrisisDistrict ? 0.12 : 0.06}
              stroke={isCrisisDistrict ? '#E59A22' : region.color}
              strokeWidth={isCrisisDistrict ? 0.007 : isActive ? 0.006 : 0.003}
              strokeOpacity={isCrisisDistrict ? 0.7 : isActive ? 0.95 : 0.35}
              onPress={() => onDistrictPress?.(region.id)}
            />

            {isCrisisDistrict ? (
              <Circle
                cx={region.label.x + 0.08}
                cy={region.label.y - 0.05}
                r={0.008}
                fill="#E59A22"
                stroke="#FFFFFF"
                strokeWidth={0.002}
                opacity={0.9}
              />
            ) : null}

            <SvgText
              x={region.label.x}
              y={region.label.y}
              fontSize={0.028}
              fontWeight="700"
              fill={isActive ? region.color : colors.textSecondary}
              textAnchor="middle"
              opacity={isActive ? 1 : 0.75}
              onPress={() => onDistrictPress?.(region.id)}
            >
              {region.displayName}
            </SvgText>

            {showSignal ? (
              <G>
                <Circle
                  cx={region.label.x + 0.055}
                  cy={region.label.y - 0.04}
                  r={
                    signal.severity === 'critical' || signal.severity === 'high'
                      ? 0.014
                      : 0.009
                  }
                  fill={getContainerSignalTone(signal.severity)}
                  stroke="#FFFFFF"
                  strokeWidth={0.002}
                  opacity={
                    signal.severity === 'medium' ? 0.85 : 1
                  }
                />
                {(signal.severity === 'high' || signal.severity === 'critical') && (
                  <SvgText
                    x={region.label.x + 0.055}
                    y={region.label.y - 0.033}
                    fontSize={0.012}
                    fontWeight="800"
                    fill="#FFFFFF"
                    textAnchor="middle"
                  >
                    !
                  </SvgText>
                )}
              </G>
            ) : null}

            {showVehicleBadge ? (
              <G>
                <Circle
                  cx={region.label.x - 0.055}
                  cy={region.label.y - 0.04}
                  r={
                    vehicleBadge.severity === 'critical' ||
                    vehicleBadge.severity === 'danger'
                      ? 0.012
                      : 0.009
                  }
                  fill={getVehicleSignalTone(vehicleBadge.severity)}
                  stroke="#FFFFFF"
                  strokeWidth={0.002}
                  opacity={vehicleBadge.severity === 'warning' ? 0.9 : 1}
                />
                <SvgText
                  x={region.label.x - 0.055}
                  y={region.label.y - 0.033}
                  fontSize={0.011}
                  fontWeight="800"
                  fill="#FFFFFF"
                  textAnchor="middle"
                >
                  {vehicleBadge.severity === 'critical' ? '!' : 'A'}
                </SvgText>
              </G>
            ) : null}
          </G>
        );
      })}

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
