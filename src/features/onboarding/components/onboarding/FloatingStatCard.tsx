import { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInLeft,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { FloatingMetricData } from '@/features/onboarding/data/onboardingData';
import { MetricBadge } from '@/features/onboarding/components/onboarding/MetricBadge';

const POSITION: Record<FloatingMetricData['position'], ViewStyle> = {
  tl: { top: 4, left: 0 },
  tr: { top: 4, right: 0 },
  bl: { bottom: 8, left: 0 },
  br: { bottom: 8, right: 0 },
};

type FloatingStatCardProps = {
  metric: FloatingMetricData;
  index: number;
  animateIdle?: boolean;
};

export function FloatingStatCard({
  metric,
  index,
  animateIdle = true,
}: FloatingStatCardProps) {
  const floatY = useSharedValue(0);

  useEffect(() => {
    if (!animateIdle) return;
    floatY.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(3, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [animateIdle, floatY]);

  const idleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const entering =
    metric.position === 'tl' || metric.position === 'bl'
      ? FadeInLeft.delay(280 + index * 90).springify()
      : FadeInRight.delay(280 + index * 90).springify();

  return (
    <Animated.View
      entering={entering}
      style={[styles.wrap, POSITION[metric.position], idleStyle]}>
      <MetricBadge metric={metric} compact />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 3,
    maxWidth: 108,
  },
});
