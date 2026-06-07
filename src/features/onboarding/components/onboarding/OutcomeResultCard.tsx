import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

type OutcomeResultCardProps = {
  compact?: boolean;
};

export function OutcomeResultCard({ compact = false }: OutcomeResultCardProps) {
  const progress = useSharedValue(0);
  const ringSize = compact ? 68 : 86;
  const stroke = compact ? 6 : 7;
  const radius = (ringSize - stroke) / 2;
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);

  useEffect(() => {
    progress.value = withTiming(OUTCOME_SUMMARY.progress, { duration: 1000 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(200).duration(500)}
      style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text
            style={[styles.kicker, compact && styles.kickerCompact]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {OUTCOME_SUMMARY.title}
          </Text>
          <Text
            style={[styles.status, compact && styles.statusCompact]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {OUTCOME_SUMMARY.status}
          </Text>
        </View>
        <View style={[styles.checkBadge, compact && styles.checkBadgeCompact]}>
          <Ionicons name="checkmark" size={compact ? 13 : 15} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.mainRow}>
        <View style={[styles.ringWrap, { width: ringSize, height: ringSize }]}>
          <Svg width={ringSize} height={ringSize}>
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke={onboardingTokens.successMuted}
              strokeWidth={stroke}
              fill="none"
            />
            <AnimatedCircle
              animatedProps={animatedProps}
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke={onboardingTokens.green}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={circumference}
              strokeLinecap="round"
              rotation="-90"
              origin={`${ringSize / 2}, ${ringSize / 2}`}
            />
          </Svg>
          <View style={styles.heart}>
            <Ionicons
              name="heart"
              size={compact ? 20 : 25}
              color={onboardingTokens.green}
            />
          </View>
        </View>

        <View style={styles.stats}>
          {OUTCOME_SUMMARY.stats.map((stat) => (
            <View key={stat.label} style={styles.statLine}>
              <Ionicons name={stat.icon} size={compact ? 12 : 14} color={onboardingTokens.green} />
              <Text
                style={[styles.statLabel, compact && styles.statLabelCompact]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {stat.label}
              </Text>
              <Text
                style={[styles.statValue, compact && styles.statValueCompact]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {stat.value}
              </Text>
            </View>
          ))}
        </View>

        <Image
          source={onboardingAssets.outcomeMap}
          style={[styles.mapImage, compact && styles.mapImageCompact]}
          contentFit="contain"
        />
      </View>

      <View style={[styles.noteBand, compact && styles.noteBandCompact]}>
        <Text
          style={[styles.noteText, compact && styles.noteTextCompact]}
          numberOfLines={compact ? 1 : 2}
          ellipsizeMode="tail">
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
  cardCompact: {
    borderRadius: 20,
    padding: 10,
    gap: 8,
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
  kickerCompact: {
    fontSize: 13,
  },
  status: {
    fontSize: 14,
    fontWeight: '900',
    color: onboardingTokens.green,
  },
  statusCompact: {
    fontSize: 12,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: onboardingTokens.green,
  },
  checkBadgeCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  ringWrap: {
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
  statLabelCompact: {
    fontSize: 10,
  },
  statValue: {
    maxWidth: 72,
    fontSize: 12,
    fontWeight: '900',
    color: onboardingTokens.green,
  },
  statValueCompact: {
    maxWidth: 60,
    fontSize: 11,
  },
  mapImage: {
    width: 122,
    height: 116,
    flexShrink: 0,
  },
  mapImageCompact: {
    width: 78,
    height: 74,
  },
  noteBand: {
    borderRadius: onboardingRadii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: onboardingTokens.successMuted,
    borderWidth: 1,
    borderColor: 'rgba(41,185,111,0.16)',
  },
  noteBandCompact: {
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    color: onboardingTokens.textMain,
  },
  noteTextCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
});
