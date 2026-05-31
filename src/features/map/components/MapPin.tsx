import Animated from 'react-native-reanimated';
import { Circle, G, Text as SvgText } from 'react-native-svg';

import { usePulseAnimation } from '@/core/animations/usePulseAnimation';
import { colors } from '@/ui/theme/colors';

import type { MapPin as MapPinModel } from '../types/map';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  pin: MapPinModel;
  /** viewBox 0 0 1 1 için normalize koordinat */
  normalized?: boolean;
  mapWidth?: number;
  mapHeight?: number;
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

const VEHICLE_PIN_GLYPH: Record<string, string> = {
  truck: '▣',
  car: '◆',
  wrench: '⚙',
  shield: '◉',
  pickup: '▷',
};

export function MapPin({
  pin,
  normalized = true,
  mapWidth = 1,
  mapHeight = 1,
  selected,
  onPress,
}: Props) {
  const cx = normalized ? pin.x : pin.x * mapWidth;
  const cy = normalized ? pin.y : pin.y * mapHeight;
  const isVehicle = pin.type === 'vehicle';
  const isLarge =
    !isVehicle &&
    (pin.severity === 'critical' || pin.severity === 'high' || pin.type === 'crew');
  const r = normalized
    ? pin.type === 'crew'
      ? 0.02
      : isVehicle
        ? 0.01
        : isLarge
          ? 0.016
          : 0.012
    : pin.type === 'crew'
      ? 10
      : isVehicle
        ? 5
        : isLarge
          ? 8
          : 6;
  const icon =
    isVehicle && pin.icon
      ? (VEHICLE_PIN_GLYPH[pin.icon] ?? PIN_ICON.vehicle)
      : (PIN_ICON[pin.type] ?? '•');
  const fontSize = normalized ? 0.02 : 7;

  const crisisAccent = pin.crisisHighlight && !selected;
  const glowColor = selected
    ? colors.primary
    : crisisAccent
      ? '#E59A22'
      : pin.color;
  const glowR =
    r +
    (normalized
      ? selected
        ? 0.012
        : crisisAccent
          ? 0.01
          : 0.008
      : selected
        ? 6
        : crisisAccent
          ? 5
          : 4);
  const isSelected = Boolean(selected);
  const { glowAnimatedProps } = usePulseAnimation(isSelected);

  return (
    <G onPress={() => onPress?.(pin.id)}>
      {(pin.severity === 'critical' || isSelected) &&
        (isSelected ? (
          <AnimatedCircle
            animatedProps={glowAnimatedProps}
            cx={cx}
            cy={cy}
            r={glowR}
            fill={glowColor}
          />
        ) : (
          <Circle cx={cx} cy={cy} r={glowR} fill={glowColor} opacity={0.2} />
        ))}
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        fill={pin.color}
        stroke={isSelected ? colors.primary : isVehicle ? 'rgba(255,255,255,0.95)' : '#FFFFFF'}
        strokeWidth={
          normalized
            ? isSelected
              ? 0.004
              : isVehicle
                ? 0.0025
                : 0.003
            : isSelected
              ? 2.5
              : isVehicle
                ? 1.25
                : 1.5
        }
        opacity={isVehicle ? 0.96 : 1}
      />
      {pin.type === 'crew' ? (
        <SvgText
          x={cx}
          y={cy + (normalized ? 0.008 : 3.5)}
          fontSize={fontSize}
          fontWeight="700"
          fill="#FFFFFF"
          textAnchor="middle"
        >
          {pin.label.replace('Ekip ', '').charAt(0)}
        </SvgText>
      ) : pin.value ? (
        <SvgText
          x={cx}
          y={cy + (normalized ? 0.007 : 3)}
          fontSize={normalized ? 0.014 : 6}
          fontWeight="800"
          fill="#FFFFFF"
          textAnchor="middle"
        >
          {pin.value}
        </SvgText>
      ) : (
        <SvgText
          x={cx}
          y={cy + (normalized ? 0.007 : icon === '▲' ? 3.5 : 3)}
          fontSize={icon.length > 1 ? fontSize * 0.75 : fontSize}
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
