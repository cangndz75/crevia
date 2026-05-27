import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';

type HeaderXpBarProps = {
  progress: number;
  trackColor?: string;
  fillColor?: string;
  height?: number;
};

export function HeaderXpBar({
  progress,
  trackColor = colors.hubGoldTrack,
  fillColor = colors.hubGold,
  height = 6,
}: HeaderXpBarProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const fillWidth = useSharedValue(0);

  const play = useCallback(
    (width: number) => {
      if (width <= 0) return;
      fillWidth.value = 0;
      fillWidth.value = withTiming(width * progress, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      });
    },
    [fillWidth, progress],
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

  const fillStyle = useAnimatedStyle(() => ({
    width: fillWidth.value,
  }));

  return (
    <View
      style={[styles.track, { height, backgroundColor: trackColor }]}
      onLayout={onLayout}>
      <Animated.View
        style={[styles.fill, { height, backgroundColor: fillColor }, fillStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 3,
  },
});
