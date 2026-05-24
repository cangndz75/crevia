import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/ui/theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type AnimatedDonutProps = {
  progress: number;
  color: string;
  trackColor?: string;
  size?: number;
  strokeWidth?: number;
  label: string;
  delay?: number;
};

export function AnimatedDonut({
  progress,
  color,
  trackColor = colors.border,
  size = 44,
  strokeWidth = 4,
  label,
  delay = 0,
}: AnimatedDonutProps) {
  const animatedProgress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const play = useCallback(() => {
    animatedProgress.value = 0;
    animatedProgress.value = withDelay(
      delay,
      withTiming(progress, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [animatedProgress, delay, progress]);

  useFocusEffect(
    useCallback(() => {
      play();
    }, [play]),
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={[styles.label, { color, fontSize: size * 0.28 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  label: {
    fontWeight: '800',
  },
});
