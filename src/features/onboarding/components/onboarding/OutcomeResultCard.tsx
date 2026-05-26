import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { OUTCOME_SUMMARY } from '@/features/onboarding/data/onboardingData';
import { onboardingAssets } from '@/features/onboarding/data/onboardingAssets';
import { onboardingRadii, onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';
import { spacing } from '@/ui/theme/spacing';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RING_SIZE = 64;
const STROKE = 5;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function OutcomeResultCard() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(OUTCOME_SUMMARY.progress, { duration: 1000 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.kicker}>{OUTCOME_SUMMARY.title}</Text>
        <Text style={styles.status}>{OUTCOME_SUMMARY.status}</Text>

        <View style={styles.ringRow}>
          <View style={styles.ringWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke={onboardingTokens.successMuted}
                strokeWidth={STROKE}
                fill="none"
              />
              <AnimatedCircle
                animatedProps={animatedProps}
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke={onboardingTokens.mint}
                strokeWidth={STROKE}
                fill="none"
                strokeDasharray={CIRCUMFERENCE}
                strokeLinecap="round"
                rotation="-90"
                origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
              />
            </Svg>
            <View style={styles.heart}>
              <Ionicons name="heart" size={22} color={onboardingTokens.mint} />
            </View>
          </View>

          <View style={styles.stats}>
            {OUTCOME_SUMMARY.stats.map((stat) => (
              <View key={stat.label} style={styles.statLine}>
                <Ionicons
                  name={stat.icon}
                  size={13}
                  color={stat.positive ? onboardingTokens.success : onboardingTokens.dangerSoft}
                />
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: stat.positive ? onboardingTokens.success : onboardingTokens.dangerSoft },
                  ]}>
                  {stat.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.right}>
        <Image
          source={onboardingAssets.outcomeMap}
          style={styles.mapImage}
          contentFit="cover"
        />
        <View style={styles.mapBadge}>
          <Ionicons name="globe-outline" size={12} color={onboardingTokens.primary} />
          <Text style={styles.mapBadgeText}>{OUTCOME_SUMMARY.mapBadge}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: onboardingTokens.card,
    borderRadius: onboardingRadii.lg,
    borderWidth: 1,
    borderColor: onboardingTokens.border,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: onboardingTokens.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 5,
  },
  left: {
    flex: 1.05,
    gap: spacing.xs,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    color: onboardingTokens.textMain,
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
    color: onboardingTokens.success,
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {
    position: 'absolute',
  },
  stats: {
    flex: 1,
    gap: 4,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    flex: 1,
    fontSize: 9,
    color: onboardingTokens.textMuted,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 10,
    fontWeight: '800',
  },
  right: {
    flex: 0.95,
    borderRadius: onboardingRadii.md,
    overflow: 'hidden',
    minHeight: 130,
    borderWidth: 1,
    borderColor: onboardingTokens.border,
  },
  mapImage: {
    width: '100%',
    height: '100%',
    minHeight: 100,
  },
  mapBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: 6,
    borderRadius: onboardingRadii.sm,
    borderWidth: 1,
    borderColor: onboardingTokens.border,
  },
  mapBadgeText: {
    flex: 1,
    fontSize: 8,
    fontWeight: '700',
    color: onboardingTokens.primary,
  },
});
