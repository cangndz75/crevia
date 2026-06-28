import Ionicons from '@expo/vector-icons/Ionicons';
import { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { playSelectionHaptic } from '@/core/feedback/hapticFeedback';
import type { MapMarkerFeedbackPresentation } from '@/features/map/utils/mapMarkerFeedbackPresentation';
import type { MapGameplayMarker as MapGameplayMarkerModel } from '@/features/map/utils/mapGameplayPresentation';
import { mapUi } from '@/features/map/utils/mapUiTokens';
import { CreviaAnimatedPressable } from '@/shared/motion';

type MapGameplayMarkerProps = {
  marker: MapGameplayMarkerModel;
  feedback: MapMarkerFeedbackPresentation;
  reducedMotionMode?: boolean;
  passive?: boolean;
  onPress?: (markerId: string) => void;
};

export const MapGameplayMarker = memo(function MapGameplayMarker({
  marker,
  feedback,
  reducedMotionMode = false,
  passive = false,
  onPress,
}: MapGameplayMarkerProps) {
  const pulse = useSharedValue(0);
  const shouldPulse = feedback.showPulse && !reducedMotionMode;

  useEffect(() => {
    if (!shouldPulse) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    const duration = feedback.tone === 'critical' || feedback.tone === 'warning' ? 1200 : 1400;
    pulse.value = withRepeat(withTiming(1, { duration }), -1, false);
    return () => cancelAnimation(pulse);
  }, [feedback.tone, pulse, shouldPulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: (feedback.tone === 'critical' ? 0.34 : 0.28) * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * (feedback.tone === 'critical' ? 1.15 : 1.05) }],
  }));

  const { size, iconSize } = feedback;
  const opacity = passive ? 0.42 : feedback.state === 'disabled' ? 0.55 : 1;
  const dotSize = feedback.showLift ? Math.round(size * 1.06) : size;

  const handlePress = () => {
    if (!feedback.pressable) return;
    playSelectionHaptic();
    onPress?.(marker.id);
  };

  return (
    <CreviaAnimatedPressable
      onPress={handlePress}
      disabled={!feedback.pressable}
      reducedMotion={reducedMotionMode}
      pressScale={0.94}
      style={[
        styles.wrap,
        {
          left: `${marker.coordinate.x}%`,
          top: `${marker.coordinate.y}%`,
          opacity,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={feedback.accessibilityLabel}
      accessibilityState={{ selected: feedback.state === 'selected', disabled: !feedback.pressable }}
      hitSlop={8}>
      {shouldPulse ? (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size + 22,
              height: size + 22,
              borderRadius: (size + 22) / 2,
              borderColor: feedback.ringColor,
            },
            pulseStyle,
          ]}
        />
      ) : null}

      {feedback.showRing ? (
        <View
          style={[
            styles.selectedRing,
            {
              width: size + 10,
              height: size + 10,
              borderRadius: (size + 10) / 2,
              borderColor: feedback.ringColor,
              opacity: reducedMotionMode ? 0.65 : 0.85,
            },
          ]}
        />
      ) : null}

      {feedback.state === 'completed' ? (
        <View
          style={[
            styles.completedEcho,
            {
              width: size + 12,
              height: size + 12,
              borderRadius: (size + 12) / 2,
            },
          ]}
        />
      ) : null}

      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: feedback.accentColor,
            borderColor: feedback.showRing ? mapUi.gold : 'rgba(255,255,255,0.9)',
            borderWidth: feedback.showRing ? 2.5 : 2,
          },
          feedback.showRing && styles.selectedGlow,
          feedback.state === 'active' && styles.activeGlow,
        ]}>
        <Ionicons name={feedback.icon} size={iconSize} color="#FFFFFF" />
      </View>

      {feedback.showAlertDot ? (
        <View style={styles.alertDot} />
      ) : null}

      {feedback.label ? (
        <View style={styles.labelChip}>
          <Text style={styles.labelText} numberOfLines={1}>
            {feedback.label}
          </Text>
        </View>
      ) : null}
    </CreviaAnimatedPressable>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -19,
    marginTop: -19,
    zIndex: 12,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'rgba(20, 184, 166, 0.06)',
  },
  selectedRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  completedEcho: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(20, 184, 166, 0.32)',
    backgroundColor: 'rgba(20, 184, 166, 0.08)',
  },
  dot: {
    alignItems: 'center',
    justifyContent: 'center',
    ...mapUi.controlShadow,
  },
  selectedGlow: {
    shadowColor: mapUi.gold,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  activeGlow: {
    shadowColor: mapUi.teal,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  alertDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: mapUi.gold,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  labelChip: {
    position: 'absolute',
    top: '100%',
    marginTop: 4,
    maxWidth: 108,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(6, 22, 20, 0.88)',
    borderWidth: 1,
    borderColor: mapUi.goldBorder,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '800',
    color: mapUi.goldSoft,
    letterSpacing: 0.15,
  },
});
