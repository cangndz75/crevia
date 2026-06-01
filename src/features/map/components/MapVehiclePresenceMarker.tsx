import { G, Circle, Text as SvgText } from 'react-native-svg';

import type { MapVehiclePresenceMarker as MapVehicleMarker } from '@/core/mapPresence/mapPresenceTypes';
import { mapUi } from '@/features/map/utils/mapUiTokens';

const STATUS_COLORS: Record<string, string> = {
  en_route: mapUi.teal,
  working: mapUi.teal,
  tired: mapUi.gold,
  maintenance_risk: mapUi.gold,
  assigned: mapUi.teal,
};

type Props = {
  marker: MapVehicleMarker | null | undefined;
  compact?: boolean;
};

export function MapVehiclePresenceMarker({ marker, compact = false }: Props) {
  if (!marker?.visible) return null;

  const r = compact ? 0.008 : 0.01;
  const fill = STATUS_COLORS[marker.status] ?? mapUi.teal;
  const glyph =
    marker.status === 'maintenance_risk' ? '⚙' : marker.status === 'tired' ? '…' : '▶';

  return (
    <G pointerEvents="none">
      <Circle
        cx={marker.x}
        cy={marker.y}
        r={r}
        fill={fill}
        stroke="#FFFFFF"
        strokeWidth={0.002}
      />
      <SvgText
        x={marker.x}
        y={marker.y + 0.004}
        fontSize={0.01}
        fontWeight="800"
        fill="#FFFFFF"
        textAnchor="middle">
        {glyph}
      </SvgText>
    </G>
  );
}
