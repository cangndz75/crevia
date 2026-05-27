import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

type AnimatedProgressBarProps = {
  progress: number;
  color: string;
  trackColor?: string;
  delayMs?: number;
  height?: number;
};

export function AnimatedProgressBar({
  progress,
  color,
  trackColor = 'rgba(26,143,138,0.15)',
  delayMs = 200,
  height = 6,
}: AnimatedProgressBarProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const fillWidth = useSharedValue(0);

  const play = useCallback(
    (width: number) => {
      if (width <= 0) return;
      fillWidth.value = 0;
      fillWidth.value = withDelay(
        delayMs,
        withTiming(width * progress, {
          duration: 900,
          easing: Easing.out(Easing.cubic),
        }),
      );
    },
    [delayMs, fillWidth, progress],
  );

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      setTrackWidth(w);
      play(w);
    },
    [play],
  );

  useFocusEffect(
    useCallback(() => {
      play(trackWidth);
    }, [play, trackWidth]),
  );

  const fillStyle = useAnimatedStyle(() => ({ width: fillWidth.value }));

  return (
    <View
      style={[styles.track, { height, backgroundColor: trackColor }]}
      onLayout={onLayout}>
      <Animated.View
        style={[styles.fill, { height, backgroundColor: color }, fillStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
});
