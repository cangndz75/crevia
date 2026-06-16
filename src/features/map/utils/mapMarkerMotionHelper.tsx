import { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { buildMotionAccessibilityModel, MOTION_DURATION } from '@/core/motion';
import { CreviaSoftPulseDot } from '@/shared/motion/CreviaSoftPulseDot';

import type { MapMarkerMotionKind, MapMarkerMotionModel } from './mapMotionPresentation';
import { mapUi } from './mapUiTokens';

export function resolveMapMotionAccentColor(kind: MapMarkerMotionKind): string {
  switch (kind) {
    case 'active_operation':
      return mapUi.tealDark;
    case 'route_pressure':
      return mapUi.teal;
    case 'district_neglect':
      return mapUi.riskHigh;
    case 'district_recovery':
    case 'positive_opportunity':
      return mapUi.gold;
    case 'city_memory_trace':
      return mapUi.teal;
    case 'resource_pressure':
    case 'container_pressure':
      return mapUi.riskMedium;
    case 'social_trust':
      return '#5A7BA8';
    case 'safe_watch':
      return mapUi.textSecondary;
    default:
      return mapUi.teal;
  }
}

function motionBadgeLabel(kind: MapMarkerMotionKind): string | null {
  switch (kind) {
    case 'active_operation':
      return 'Aktif';
    case 'route_pressure':
      return 'Rota';
    case 'district_neglect':
      return 'Risk';
    case 'district_recovery':
      return 'Toparlanma';
    case 'city_memory_trace':
      return 'Iz';
    case 'positive_opportunity':
      return 'Firsat';
    case 'resource_pressure':
      return 'Kaynak';
    case 'container_pressure':
      return 'Konteyner';
    case 'social_trust':
      return 'Guven';
    default:
      return null;
  }
}

type MapDistrictMotionOverlayProps = {
  motionModel?: MapMarkerMotionModel | null;
  reducedMotionMode?: boolean;
};

function PulseRing({
  color,
  active,
  reducedMotionMode,
  strong,
}: {
  color: string;
  active: boolean;
  reducedMotionMode: boolean;
  strong: boolean;
}) {
  const pulse = useSharedValue(0);
  const accessibility = buildMotionAccessibilityModel({
    reduceMotionEnabled: reducedMotionMode,
    motionKind: 'soft_pulse',
  });

  useEffect(() => {
    if (!active || !accessibility.allowPulseMotion) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }

    pulse.value = withRepeat(withTiming(1, { duration: strong ? 1300 : 1600 }), -1, false);
  }, [accessibility.allowPulseMotion, active, pulse, strong]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: (strong ? 0.22 : 0.14) * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * (strong ? 1.15 : 0.85) }],
  }));

  if (!active) return null;

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.pulseRing,
        pulseStyle,
        {
          borderColor: color,
          backgroundColor: `${color}22`,
        },
        reducedMotionMode && styles.staticRing,
      ]}
    />
  );
}

function SoftGlow({
  color,
  active,
  reducedMotionMode,
}: {
  color: string;
  active: boolean;
  reducedMotionMode: boolean;
}) {
  const opacity = useSharedValue(active ? 0.55 : 0);

  useEffect(() => {
    if (!active || reducedMotionMode) {
      cancelAnimation(opacity);
      opacity.value = active ? 0.45 : 0;
      return;
    }

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: MOTION_DURATION.slow }),
        withTiming(0.45, { duration: MOTION_DURATION.slow }),
      ),
      2,
      true,
    );
  }, [active, opacity, reducedMotionMode]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!active) return null;

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.glow,
        glowStyle,
        { backgroundColor: color, shadowColor: color },
        reducedMotionMode && styles.staticGlow,
      ]}
    />
  );
}

export const MapDistrictMotionOverlay = memo(function MapDistrictMotionOverlay({
  motionModel,
  reducedMotionMode = false,
}: MapDistrictMotionOverlayProps) {
  if (!motionModel || motionModel.intensity === 'none') return null;

  const color = resolveMapMotionAccentColor(motionModel.kind);
  const badge = motionModel.portfolioBadgeLabel ?? motionBadgeLabel(motionModel.kind);
  const showPulse = motionModel.pulse && !reducedMotionMode;
  const showStaticEmphasis = motionModel.reducedMotionFallback || reducedMotionMode;
  const showGlow = motionModel.glow && !showStaticEmphasis;

  return (
    <View
      pointerEvents="none"
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel={motionModel.accessibilityLabel}>
      <PulseRing
        color={color}
        active={showPulse || (showStaticEmphasis && motionModel.pulse)}
        reducedMotionMode={reducedMotionMode}
        strong={motionModel.intensity === 'strong'}
      />
      <SoftGlow color={color} active={showGlow} reducedMotionMode={reducedMotionMode} />
      {motionModel.routeHint ? (
        <View style={[styles.routeBadge, { borderColor: color }]}>
          <View style={[styles.routeDash, { backgroundColor: color }]} />
          <View style={[styles.routeDash, styles.routeDashMid, { backgroundColor: color }]} />
          <View style={[styles.routeDash, { backgroundColor: color }]} />
        </View>
      ) : null}
      {badge ? (
        <View style={[styles.kindBadge, { backgroundColor: `${color}18`, borderColor: `${color}55` }]}>
          <CreviaSoftPulseDot
            active={showPulse && motionModel.kind === 'active_operation'}
            reducedMotion={reducedMotionMode}
            color={color}
            style={styles.kindDot}
          />
          <Text style={[styles.kindBadgeText, { color }]} numberOfLines={1}>
            {badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

export function pickDistrictMotionModel(
  markers: readonly MapMarkerMotionModel[],
  districtId: string,
): MapMarkerMotionModel | null {
  const matches = markers.filter((marker) => marker.districtId === districtId);
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.priority - a.priority)[0] ?? null;
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  pulseRing: {
    position: 'absolute',
    width: 118,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
  },
  staticRing: {
    opacity: 0.35,
  },
  glow: {
    position: 'absolute',
    width: 104,
    height: 36,
    borderRadius: 18,
    opacity: 0.35,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  staticGlow: {
    opacity: 0.28,
  },
  routeBadge: {
    position: 'absolute',
    top: -10,
    right: -18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  routeDash: {
    width: 4,
    height: 2,
    borderRadius: 1,
  },
  routeDashMid: {
    opacity: 0.55,
  },
  kindBadge: {
    position: 'absolute',
    bottom: -12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  kindDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  kindBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
