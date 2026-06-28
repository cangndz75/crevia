import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { MapTacticalRoutePresentation } from '@/features/map/utils/mapTacticalMotionPresentation';
import { mapUi } from '@/features/map/utils/mapUiTokens';

type MapTacticalRouteLayerProps = {
  route?: MapTacticalRoutePresentation | null;
  reducedMotionMode?: boolean;
};

function segmentStyle(tone: MapTacticalRoutePresentation['tone']) {
  switch (tone) {
    case 'completed':
      return { color: 'rgba(148, 163, 184, 0.55)', opacity: 0.45 };
    case 'critical':
      return { color: 'rgba(245, 158, 11, 0.75)', opacity: 0.62 };
    case 'warning':
      return { color: 'rgba(245, 158, 11, 0.65)', opacity: 0.58 };
    case 'active':
      return { color: mapUi.tealGlow, opacity: 0.68 };
    default:
      return { color: mapUi.gold, opacity: 0.52 };
  }
}

function RouteSegment({
  from,
  to,
  tone,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  tone: MapTacticalRoutePresentation['tone'];
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy) * 3.4;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const accent = segmentStyle(tone);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.segment,
        {
          left: `${from.x}%`,
          top: `${from.y}%`,
          width: `${Math.min(38, Math.max(8, length))}%`,
          transform: [{ rotate: `${angle}deg` }],
          backgroundColor: accent.color,
          opacity: accent.opacity,
        },
      ]}
    />
  );
}

export const MapTacticalRouteLayer = memo(function MapTacticalRouteLayer({
  route,
}: MapTacticalRouteLayerProps) {
  if (!route || route.points.length < 2) return null;

  const segments: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }> = [];
  for (let index = 0; index < route.points.length - 1; index += 1) {
    segments.push({
      from: route.points[index]!,
      to: route.points[index + 1]!,
    });
  }

  return (
    <View style={styles.layer} pointerEvents="none">
      {segments.map((segment, index) => (
        <RouteSegment
          key={`${route.id}-${index}`}
          from={segment.from}
          to={segment.to}
          tone={route.tone}
        />
      ))}
      <View
        style={[
          styles.routeDot,
          {
            left: `${route.points[route.points.length - 1]!.x}%`,
            top: `${route.points[route.points.length - 1]!.y}%`,
            borderColor: segmentStyle(route.tone).color,
          },
        ]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 10,
  },
  segment: {
    position: 'absolute',
    height: 2,
    marginTop: -1,
    borderRadius: 999,
  },
  routeDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    marginLeft: -4,
    marginTop: -4,
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
});
