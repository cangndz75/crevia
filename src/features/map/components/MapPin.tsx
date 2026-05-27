import { Circle, G, Text as SvgText } from 'react-native-svg';

import type { MapPin as MapPinModel } from '../types/map';
import { MAP_VIEWBOX } from '../data/mapGeometry';

type Props = {
  pin: MapPinModel;
  selected?: boolean;
  onPress?: (pinId: string) => void;
};

const PIN_ICON: Record<string, string> = {
  event: '!',
  risk: '▲',
  crew: '●',
  vehicle: '▶',
  container: '♻',
  social: '◉',
  opportunity: '★',
};

export function MapPin({ pin, selected, onPress }: Props) {
  const cx = pin.x * MAP_VIEWBOX.width;
  const cy = pin.y * MAP_VIEWBOX.height;
  const isLarge =
    pin.severity === 'critical' || pin.severity === 'high' || pin.type === 'crew';
  const r = pin.type === 'crew' ? 11 : isLarge ? 9 : 7;
  const icon = PIN_ICON[pin.type] ?? '•';

  return (
    <G onPress={() => onPress?.(pin.id)}>
      {(pin.severity === 'critical' || selected) && (
        <Circle
          cx={cx}
          cy={cy}
          r={r + 5}
          fill={pin.color}
          opacity={0.2}
        />
      )}
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        fill={pin.color}
        stroke="#FFFFFF"
        strokeWidth={selected ? 2.5 : 1.5}
      />
      {pin.type === 'crew' ? (
        <SvgText
          x={cx}
          y={cy + 3.5}
          fontSize={9}
          fontWeight="700"
          fill="#FFFFFF"
          textAnchor="middle"
        >
          {pin.label.replace('Ekip ', '').charAt(0)}
        </SvgText>
      ) : pin.value ? (
        <SvgText
          x={cx}
          y={cy + 3}
          fontSize={6}
          fontWeight="800"
          fill="#FFFFFF"
          textAnchor="middle"
        >
          {pin.value}
        </SvgText>
      ) : (
        <SvgText
          x={cx}
          y={cy + (icon === '▲' ? 3.5 : 3)}
          fontSize={icon.length > 1 ? 5 : 7}
          fontWeight="800"
          fill="#FFFFFF"
          textAnchor="middle"
        >
          {icon}
        </SvgText>
      )}
    </G>
  );
}
