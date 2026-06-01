import { G, Line, Circle } from 'react-native-svg';

import type { MapRoutePresenceHint } from '@/core/mapPresence/mapPresenceTypes';
import { mapUi } from '@/features/map/utils/mapUiTokens';

type Props = {
  hint: MapRoutePresenceHint | null | undefined;
  compact?: boolean;
};

const STATUS_STROKE: Record<MapRoutePresenceHint['status'], string> = {
  preview: mapUi.teal,
  active: mapUi.teal,
  delayed: mapUi.gold,
  balanced: mapUi.teal,
  overloaded: mapUi.gold,
};

export function MapRouteHintLayer({ hint, compact = false }: Props) {
  if (!hint?.visible) return null;

  const stroke = STATUS_STROKE[hint.status] ?? mapUi.teal;
  const fromX = hint.fromX ?? hint.toX - 0.04;
  const fromY = hint.fromY ?? hint.toY - 0.03;

  if (compact || fromX == null || fromY == null) {
    return (
      <G pointerEvents="none">
        <Circle cx={hint.toX} cy={hint.toY - 0.02} r={0.006} fill={stroke} opacity={0.85} />
        <Circle cx={hint.toX + 0.012} cy={hint.toY - 0.018} r={0.004} fill={stroke} opacity={0.55} />
        <Circle cx={hint.toX + 0.02} cy={hint.toY - 0.014} r={0.003} fill={stroke} opacity={0.35} />
      </G>
    );
  }

  return (
    <G pointerEvents="none">
      <Line
        x1={fromX}
        y1={fromY}
        x2={hint.toX}
        y2={hint.toY}
        stroke={stroke}
        strokeWidth={0.0025}
        strokeDasharray="0.008 0.006"
        strokeLinecap="round"
        opacity={0.75}
      />
      <Circle cx={hint.toX} cy={hint.toY} r={0.005} fill={stroke} />
    </G>
  );
}
