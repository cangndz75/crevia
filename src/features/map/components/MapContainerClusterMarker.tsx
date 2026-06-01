import { G, Circle, Text as SvgText } from 'react-native-svg';

import type { MapContainerPresenceMarker } from '@/core/mapPresence/mapPresenceTypes';
import { mapUi } from '@/features/map/utils/mapUiTokens';

const STATUS_COLORS: Record<string, string> = {
  normal: mapUi.teal,
  pressure: mapUi.gold,
  critical: '#E8A07A',
  resolved: mapUi.teal,
  carry_over: mapUi.gold,
  in_progress: '#7BC4B8',
  risk_watch: mapUi.gold,
  working: mapUi.teal,
  tired: mapUi.gold,
  maintenance_risk: mapUi.gold,
};

type Props = {
  marker: MapContainerPresenceMarker | null | undefined;
  compact?: boolean;
  normalized?: boolean;
};

export function MapContainerClusterMarker({
  marker,
  compact = false,
  normalized = true,
}: Props) {
  if (!marker?.visible) return null;

  const r = compact ? 0.009 : 0.012;
  const fill = STATUS_COLORS[marker.status] ?? mapUi.teal;
  const cx = marker.x;
  const cy = marker.y;
  const glyph =
    marker.status === 'resolved'
      ? '✓'
      : marker.status === 'carry_over'
        ? '↻'
        : marker.status === 'in_progress'
          ? '↺'
          : marker.status === 'pressure' || marker.status === 'critical'
            ? '!'
            : '▣';

  return (
    <G pointerEvents="none">
      {marker.pulse ? (
        <Circle cx={cx} cy={cy} r={r * 1.35} fill={fill} opacity={0.22} />
      ) : null}
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        stroke="#FFFFFF"
        strokeWidth={normalized ? 0.002 : 1}
        opacity={marker.intensity === 'low' ? 0.88 : 1}
      />
      <SvgText
        x={cx}
        y={cy + (normalized ? 0.004 : 2)}
        fontSize={compact ? 0.01 : 0.011}
        fontWeight="800"
        fill="#FFFFFF"
        textAnchor="middle">
        {glyph}
      </SvgText>
    </G>
  );
}
