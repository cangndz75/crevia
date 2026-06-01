import { G } from 'react-native-svg';

import type { MapPresenceViewModel } from '@/core/mapPresence/mapPresenceTypes';

import { MapContainerClusterMarker } from './MapContainerClusterMarker';
import { MapRouteHintLayer } from './MapRouteHintLayer';
import { MapTeamPresenceMarker } from './MapTeamPresenceMarker';
import { MapVehiclePresenceMarker } from './MapVehiclePresenceMarker';

type Props = {
  viewModel?: MapPresenceViewModel | null;
  compact?: boolean;
};

export function MapPresenceSvgLayer({ viewModel, compact = false }: Props) {
  if (!viewModel?.visible) return null;

  return (
    <G pointerEvents="none">
      {viewModel.routeHints.map((hint) => (
        <MapRouteHintLayer key={hint.id} hint={hint} compact={compact} />
      ))}
      {viewModel.containerMarkers.map((marker) => (
        <MapContainerClusterMarker key={marker.id} marker={marker} compact={compact} />
      ))}
      {viewModel.vehicleMarkers.map((marker) => (
        <MapVehiclePresenceMarker key={marker.id} marker={marker} compact={compact} />
      ))}
      {viewModel.teamMarkers.map((marker) => (
        <MapTeamPresenceMarker key={marker.id} marker={marker} compact={compact} />
      ))}
    </G>
  );
}
