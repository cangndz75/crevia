import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { MapDistrictReactionHighlight as MapDistrictReactionHighlightModel } from '@/features/map/utils/mapTacticalMotionPresentation';

type Props = {
  highlight?: MapDistrictReactionHighlightModel | null;
  reducedMotionMode?: boolean;
};

function highlightColors(tone: MapDistrictReactionHighlightModel['tone'], intensity: MapDistrictReactionHighlightModel['intensity']) {
  const alpha = intensity === 'high' ? 0.22 : intensity === 'medium' ? 0.16 : 0.1;
  switch (tone) {
    case 'positive':
      return {
        border: `rgba(20, 184, 166, ${alpha + 0.18})`,
        fill: `rgba(20, 184, 166, ${alpha})`,
      };
    case 'mixed':
      return {
        border: `rgba(216, 167, 46, ${alpha + 0.14})`,
        fill: `rgba(20, 184, 166, ${alpha * 0.75})`,
      };
    case 'warning':
      return {
        border: `rgba(245, 158, 11, ${alpha + 0.16})`,
        fill: `rgba(245, 158, 11, ${alpha * 0.7})`,
      };
    case 'critical':
      return {
        border: `rgba(239, 68, 68, ${alpha + 0.14})`,
        fill: `rgba(245, 158, 11, ${alpha * 0.55})`,
      };
    default:
      return {
        border: `rgba(255, 255, 255, ${alpha + 0.08})`,
        fill: `rgba(255, 255, 255, ${alpha * 0.35})`,
      };
  }
}

export const MapDistrictReactionHighlight = memo(function MapDistrictReactionHighlight({
  highlight,
}: Props) {
  if (!highlight) return null;

  const colors = highlightColors(highlight.tone, highlight.intensity);
  const size = highlight.intensity === 'high' ? 112 : highlight.intensity === 'medium' ? 96 : 84;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          left: `${highlight.coordinate.x}%`,
          top: `${highlight.coordinate.y}%`,
          width: size,
          height: size * 0.55,
          marginLeft: -(size / 2),
          marginTop: -(size * 0.275),
          borderColor: colors.border,
          backgroundColor: colors.fill,
        },
      ]}
      accessibilityLabel={highlight.label}
    />
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    zIndex: 9,
  },
});
