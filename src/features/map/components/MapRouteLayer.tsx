import { G, Path } from 'react-native-svg';

import { colors } from '@/ui/theme/colors';

import { CREW_ROUTE_PATHS } from '../data/mapGeometry';
import type { PilotAreaId } from '../types/map';

type Props = {
  pilotAreaId: PilotAreaId;
  visible: boolean;
};

export function MapRouteLayer({ pilotAreaId, visible }: Props) {
  if (!visible) return null;

  const paths = CREW_ROUTE_PATHS[pilotAreaId] ?? [];

  return (
    <G>
      {paths.map((d, i) => (
        <Path
          key={`route-${i}`}
          d={d}
          fill="none"
          stroke={colors.purple}
          strokeWidth={2}
          strokeDasharray="6 5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.75}
        />
      ))}
    </G>
  );
}
