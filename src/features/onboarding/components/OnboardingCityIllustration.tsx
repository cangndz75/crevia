import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { colors } from '@/ui/theme/colors';

const FLOAT_ICONS = [
  { id: 'risk', cx: 42, cy: 28, fill: colors.purple, icon: '!' },
  { id: 'people', cx: 118, cy: 18, fill: colors.primary, icon: '◉' },
  { id: 'chart', cx: 195, cy: 32, fill: colors.secondary, icon: '▮' },
  { id: 'shield', cx: 248, cy: 22, fill: colors.purple, icon: '✓' },
] as const;

function FloatingBadge({
  cx,
  cy,
  fill,
  label,
  delay,
}: {
  cx: number;
  cy: number;
  fill: string;
  label: string;
  delay: number;
}) {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1400 + delay, easing: Easing.inOut(Easing.sin) }),
        withTiming(4, { duration: 1400 + delay, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [delay, offset]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.floatBadge,
        { left: cx - 16, top: cy - 16 },
        style,
      ]}>
      <View style={[styles.floatCircle, { backgroundColor: fill }]}>
        <Text style={styles.floatLabel}>{label}</Text>
      </View>
    </Animated.View>
  );
}

export function OnboardingCityIllustration() {
  return (
    <Animated.View entering={FadeInUp.delay(120).springify()} style={styles.wrap}>
      <View style={styles.floatLayer}>
        {FLOAT_ICONS.map((item, i) => (
          <FloatingBadge
            key={item.id}
            cx={item.cx}
            cy={item.cy}
            fill={item.fill}
            label={item.icon}
            delay={i * 120}
          />
        ))}
      </View>

      <Svg width={280} height={160} viewBox="0 0 280 160">
        <Ellipse cx={140} cy={148} rx={120} ry={10} fill="#E8E6E1" />
        <Rect x={48} y={72} width={52} height={68} rx={4} fill="#B8D4E8" />
        <Rect x={54} y={58} width={40} height={18} rx={2} fill="#9BBDD6" />
        <Rect x={108} y={48} width={64} height={92} rx={6} fill="#E8EDF2" />
        <Rect x={118} y={38} width={44} height={14} rx={2} fill="#D0D8E0" />
        <Path
          d="M108 88 L172 88 L172 140 L140 140 L108 120 Z"
          fill="#F5F7FA"
        />
        <Rect x={178} y={64} width={48} height={76} rx={4} fill="#C5E8E6" />
        <Rect x={186} y="52" width="32" height="14" rx="2" fill="#9FD9D5" />
        <Circle cx={200} cy={118} r={14} fill="#7B5BB8" opacity={0.35} />
        <Rect x={72} y={128} width={36} height={14} rx={3} fill="#FFFFFF" />
        <Rect x={76} y="132" width="28" height="6" rx="2" fill="#D0D8E0" />
        <Circle cx={168} cy={132} r={10} fill="#3BAF7A" opacity={0.5} />
        <Path
          d="M20 140 Q60 120 100 135 T180 130 T260 140"
          stroke="#D8E8E7"
          strokeWidth={2}
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    width: '100%',
  },
  floatLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  floatBadge: {
    position: 'absolute',
    width: 32,
    height: 32,
  },
  floatCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  floatLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
