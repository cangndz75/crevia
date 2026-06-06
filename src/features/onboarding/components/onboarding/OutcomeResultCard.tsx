import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { onboardingAssets } from '@/features/onboarding/data/onboardingAssets';
import { OUTCOME_SUMMARY } from '@/features/onboarding/data/onboardingData';
import { onboardingRadii, onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RING_SIZE = 86;
const STROKE = 7;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function OutcomeResultCard() {
  const progress = useSharedValue(0);
  const { width } = useWindowDimensions();
  const small = width <= 370;

  useEffect(() => {
    progress.value = withTiming(OUTCOME_SUMMARY.progress, { duration: 1000 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker} numberOfLines={1} ellipsizeMode="tail">
            {OUTCOME_SUMMARY.title}
          </Text>
          <Text style={styles.status} numberOfLines={1} ellipsizeMode="tail">
            {OUTCOME_SUMMARY.status}
          </Text>
        </View>
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark" size={15} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.mainRow}>
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
              stroke={onboardingTokens.green}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
          <View style={styles.heart}>
            <Ionicons name="heart" size={25} color={onboardingTokens.green} />
          </View>
        </View>

        <View style={styles.stats}>
          {OUTCOME_SUMMARY.stats.map((stat) => (
            <View key={stat.label} style={styles.statLine}>
              <Ionicons name={stat.icon} size={14} color={onboardingTokens.green} />
              <Text style={styles.statLabel} numberOfLines={1} ellipsizeMode="tail">
                {stat.label}
              </Text>
              <Text style={styles.statValue} numberOfLines={1} ellipsizeMode="tail">
                {stat.value}
              </Text>
            </View>
          ))}
        </View>

        <Image
          source={onboardingAssets.outcomeMap}
          style={[styles.mapImage, small && styles.mapImageSmall]}
          contentFit="contain"
        />
      </View>

      <View style={styles.noteBand}>
        <Text style={styles.noteText} numberOfLines={2} ellipsizeMode="tail">
          {OUTCOME_SUMMARY.note}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: onboardingTokens.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: onboardingTokens.border,
    padding: 14,
    gap: 13,
    shadowColor: onboardingTokens.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  kicker: {
    fontSize: 15,
    fontWeight: '900',
    color: onboardingTokens.textMain,
  },
  status: {
    fontSize: 14,
    fontWeight: '900',
    color: onboardingTokens.green,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: onboardingTokens.green,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heart: {
    position: 'absolute',
  },
  stats: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  statLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    color: onboardingTokens.textMuted,
    fontWeight: '800',
  },
  statValue: {
    maxWidth: 72,
    fontSize: 12,
    fontWeight: '900',
    color: onboardingTokens.green,
  },
  mapImage: {
    width: 122,
    height: 116,
    flexShrink: 0,
  },
  mapImageSmall: {
    width: 96,
    height: 102,
  },
  noteBand: {
    borderRadius: onboardingRadii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: onboardingTokens.successMuted,
    borderWidth: 1,
    borderColor: 'rgba(41,185,111,0.16)',
  },
  noteText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    color: onboardingTokens.textMain,
  },
});
