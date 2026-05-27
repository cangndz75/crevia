import {
  Defs,
  Ellipse,
  FeDropShadow,
  Filter,
  G,
  Path,
  Rect,
  Svg,
} from 'react-native-svg';

import type { EventCard } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { colors } from '@/ui/theme/colors';

import {
  MAP_GREEN_PATCHES,
  MAP_REGIONS,
  MAP_RIVER_PATH,
  MAP_ROADS,
  MAP_VIEWBOX,
} from '../data/mapGeometry';
import type {
  ActiveLayers,
  Container,
  Crew,
  MapFilterId,
  MapPin,
  PilotAreaId,
  Vehicle,
} from '../types/map';
import { buildMapPins, shouldShowGreenPatches, shouldShowHeatmap, shouldShowRoutes } from '../utils/mapFromEvents';
import { MapLegend } from './MapLegend';
import { MapPin as MapPinNode } from './MapPin';
import { MapRegionLabel } from './MapRegionLabel';
import { MapRouteLayer } from './MapRouteLayer';

export type StyledPilotMapProps = {
  selectedPilotArea: PilotAreaId;
  selectedDistrictId: PilotDistrictId;
  selectedFilter: MapFilterId;
  activeLayers: ActiveLayers;
  gameDay: number;
  events: EventCard[];
  crews?: Crew[];
  vehicles?: Vehicle[];
  containers?: Container[];
  onRegionPress?: (areaId: PilotAreaId) => void;
  onPinPress?: (pinId: string) => void;
};

export function StyledPilotMap({
  selectedPilotArea,
  selectedDistrictId,
  selectedFilter,
  activeLayers,
  gameDay,
  events,
  onRegionPress,
  onPinPress,
}: StyledPilotMapProps) {
  const pins: MapPin[] = buildMapPins({
    pilotAreaId: selectedPilotArea,
    selectedDistrictId,
    selectedFilter,
    activeLayers,
    gameDay,
    activeEvents: events,
  });

  const showHeat = shouldShowHeatmap(selectedFilter, activeLayers);
  const showRoutes = shouldShowRoutes(selectedFilter, activeLayers);
  const showGreen = shouldShowGreenPatches(activeLayers);

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <Defs>
        <Filter id="regionGlow" x="-20%" y="-20%" width="140%" height="140%">
          <FeDropShadow dx={0} dy={0} stdDeviation={4} floodColor={colors.primary} floodOpacity={0.45} />
        </Filter>
      </Defs>

      {/* Zemin */}
      <Rect
        x={0}
        y={0}
        width={MAP_VIEWBOX.width}
        height={MAP_VIEWBOX.height}
        fill="#F4F0E6"
      />
      <Rect
        x={8}
        y={8}
        width={MAP_VIEWBOX.width - 16}
        height={MAP_VIEWBOX.height - 16}
        rx={12}
        fill="#FAF7F0"
        stroke="#E8E4DA"
        strokeWidth={1}
      />

      {/* Nehir */}
      <Path
        d={MAP_RIVER_PATH}
        fill="none"
        stroke="#9EC9C4"
        strokeWidth={10}
        strokeLinecap="round"
        opacity={0.35}
      />
      <Path
        d={MAP_RIVER_PATH}
        fill="none"
        stroke="#B8DDD8"
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.5}
      />

      {/* Yollar */}
      {MAP_ROADS.map((d, i) => (
        <Path
          key={`road-${i}`}
          d={d}
          stroke="#E2DDD2"
          strokeWidth={i < 2 ? 3.5 : 2}
          strokeLinecap="round"
          opacity={0.9}
        />
      ))}

      {/* Yeşil alan katmanı */}
      {showGreen &&
        MAP_GREEN_PATCHES.map((patch, i) => (
          <Path
            key={`green-${i}`}
            d={patch.path}
            fill={colors.success}
            opacity={patch.opacity}
          />
        ))}

      {/* Bölgeler (polygon) */}
      {MAP_REGIONS.map((region) => {
        const isSelected = region.districtId === selectedDistrictId;
        const isLocked = !isSelected;

        return (
          <G key={region.districtId}>
            {showHeat &&
              isSelected &&
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
              fillOpacity={isSelected ? 0.22 : 0.06}
              stroke={region.color}
              strokeWidth={isSelected ? 2.8 : 1}
              strokeOpacity={isSelected ? 0.95 : 0.25}
              filter={isSelected ? 'url(#regionGlow)' : undefined}
              onPress={() => onRegionPress?.(region.pilotAreaId)}
            />

            {isLocked && (
              <Path
                d={region.path}
                fill="#FFFFFF"
                fillOpacity={0.35}
                pointerEvents="none"
              />
            )}
          </G>
        );
      })}

      {/* Aydınlatma noktaları — Sanayi */}
      {activeLayers.lighting && selectedPilotArea === 'sanayiPazar' && (
        <G opacity={0.7}>
          {[
            [248, 148],
            [285, 165],
            [310, 188],
            [265, 205],
          ].map(([cx, cy], i) => (
            <Ellipse
              key={`light-${i}`}
              cx={cx}
              cy={cy}
              rx={6}
              ry={6}
              fill={colors.hubGold}
              opacity={0.5}
            />
          ))}
        </G>
      )}

      <MapRouteLayer pilotAreaId={selectedPilotArea} visible={showRoutes} />

      {/* Pinler — yalnızca seçili bölgede */}
      <G>
        {pins.map((pin) => (
          <MapPinNode
            key={pin.id}
            pin={pin}
            onPress={onPinPress}
          />
        ))}
      </G>

      {/* Bölge etiketleri üstte */}
      {MAP_REGIONS.map((region) => (
        <MapRegionLabel
          key={`label-${region.districtId}`}
          region={region}
          isSelected={region.districtId === selectedDistrictId}
          isLocked={region.districtId !== selectedDistrictId}
        />
      ))}
    </Svg>
  );
}

/** MapView geçişi için adapter arayüzü */
export type MapViewAdapterProps = StyledPilotMapProps;

export function createMapViewProps(
  props: StyledPilotMapProps,
): MapViewAdapterProps {
  return props;
}
