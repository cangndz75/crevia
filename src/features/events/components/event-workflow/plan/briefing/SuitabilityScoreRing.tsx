import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { EventPlanBriefingPresentation } from '@/features/events/utils/eventPlanBriefingPresentation';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type SuitabilityScoreRingProps = {
  suitability: EventPlanBriefingPresentation['suitability'];
  reducedMotion?: boolean;
  size?: number;
};

export function SuitabilityScoreRing({
  suitability,
  reducedMotion = false,
  size = 68,
}: SuitabilityScoreRingProps) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetProgress = suitability.value / suitability.max;

  const progress = useSharedValue(reducedMotion ? targetProgress : 0);
  const [displayValue, setDisplayValue] = useState(reducedMotion ? suitability.value : 0);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(suitability.value);
      progress.value = targetProgress;
      return;
    }

    progress.value = withDelay(340, withTiming(targetProgress, { duration: 650 }));

    const start = Date.now();
    const duration = 650;
    const delay = 340;
    const timer = setTimeout(() => {
      const tick = () => {
        const elapsed = Date.now() - start - delay;
        const t = Math.min(1, Math.max(0, elapsed / duration));
        setDisplayValue(Math.round(suitability.value * t));
        if (t < 1) {
          requestAnimationFrame(tick);
        }
      };
      tick();
    }, delay);

    return () => clearTimeout(timer);
  }, [progress, reducedMotion, suitability.value, targetProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel={suitability.accessibilityLabel}>
      <View style={[styles.ringWrap, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(11, 107, 97, 0.12)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={eventDetail.teal}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.scoreCenter}>
          <Text style={styles.scoreValue}>
            {displayValue}
            <Text style={styles.scoreMax}>/{suitability.max}</Text>
          </Text>
        </View>
      </View>
      <View style={styles.textBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{suitability.title}</Text>
          <Ionicons name="information-circle-outline" size={14} color={eventDetail.textMuted} />
        </View>
        <Text style={styles.body}>{suitability.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(6, 63, 59, 0.06)',
    marginTop: 14,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 15,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  scoreMax: {
    fontSize: 10,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  body: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 18,
  },
});
