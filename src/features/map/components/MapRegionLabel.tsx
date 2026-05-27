import { G, Rect, Text as SvgText } from 'react-native-svg';

import { colors } from '@/ui/theme/colors';

import type { RegionGeometry } from '../data/mapGeometry';

type Props = {
  region: RegionGeometry;
  isSelected: boolean;
  isLocked: boolean;
};

export function MapRegionLabel({ region, isSelected, isLocked }: Props) {
  const { x, y } = region.label;
  const title = isLocked
    ? region.displayName.split(' ').slice(0, 2).join(' ')
    : region.displayName;
  const line2 = isSelected
    ? region.population.toLocaleString('tr-TR')
    : isLocked
      ? 'Ana operasyonda'
      : '';

  const w = isSelected ? 118 : 92;
  const h = isSelected ? 36 : 28;
  const rx = 10;

  return (
    <G opacity={isLocked ? 0.75 : 1}>
      <Rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={rx}
        ry={rx}
        fill={isSelected ? region.color : colors.surface}
        stroke={region.color}
        strokeWidth={isSelected ? 0 : 1}
        opacity={isSelected ? 0.95 : 0.92}
      />
      <SvgText
        x={x}
        y={y - (line2 ? 4 : 0)}
        fontSize={isSelected ? 9 : 8}
        fontWeight="800"
        fill={isSelected ? colors.textInverse : region.color}
        textAnchor="middle"
      >
        {title.length > 22 ? `${title.slice(0, 20)}…` : title}
      </SvgText>
      {line2 ? (
        <SvgText
          x={x}
          y={y + 10}
          fontSize={7}
          fontWeight="600"
          fill={isSelected ? colors.textInverse : colors.textSecondary}
          textAnchor="middle"
          opacity={0.95}
        >
          {line2}
        </SvgText>
      ) : null}
    </G>
  );
}
