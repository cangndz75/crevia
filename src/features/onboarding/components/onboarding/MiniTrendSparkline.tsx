import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

type MiniTrendSparklineProps = {
  color: string;
  up?: boolean;
  width?: number;
  height?: number;
};

export function MiniTrendSparkline({
  color,
  up = true,
  width = 36,
  height = 14,
}: MiniTrendSparklineProps) {
  const progress = useSharedValue(0);
  const points = up ? '2,12 10,8 18,10 26,4 34,6' : '2,4 10,8 18,6 26,10 34,12';

  useEffect(() => {
    progress.value = withTiming(1, { duration: 700 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: 40 * (1 - progress.value),
  }));

  return (
    <Svg width={width} height={height} style={styles.svg}>
      <AnimatedPolyline
        animatedProps={animatedProps}
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={40}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  svg: {
    marginTop: 2,
  },
});
