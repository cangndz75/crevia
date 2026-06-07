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

import { getDistrictAsset } from '@/features/onboarding/data/onboardingAssets';
import type { OnboardingRoadmapPreview } from '@/features/onboarding/utils/onboardingRoadmapPresentation';
import { onboardingRadii, onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_COLORS = {
  green: onboardingTokens.green,
  blue: onboardingTokens.blue,
  orange: onboardingTokens.orange,
} as const;

type PilotLaunchPreviewCardProps = {
  preview: OnboardingRoadmapPreview;
  compact?: boolean;
};

export function PilotLaunchPreviewCard({
  preview,
  compact = false,
}: PilotLaunchPreviewCardProps) {
  const progress = useSharedValue(0);
  const ringSize = compact ? 64 : 80;
  const stroke = compact ? 6 : 7;
  const radius = (ringSize - stroke) / 2;
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);
  const ringColor = RING_COLORS[preview.ringTone];

  useEffect(() => {
    progress.value = withTiming(preview.ringProgress, { duration: 900 });
  }, [preview.ringProgress, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(180).duration(480)}
      style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text
            style={[styles.kicker, compact && styles.kickerCompact]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {preview.headline}
          </Text>
          <Text
            style={[styles.status, compact && styles.statusCompact, { color: ringColor }]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {preview.statusLine}
          </Text>
        </View>
        <View style={[styles.launchBadge, compact && styles.launchBadgeCompact]}>
          <Ionicons name="rocket-outline" size={compact ? 13 : 15} color="#FFFFFF" />
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
              stroke={ringColor}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={circumference}
              strokeLinecap="round"
              rotation="-90"
              origin={`${ringSize / 2}, ${ringSize / 2}`}
            />
          </Svg>
          <View style={styles.ringIcon}>
            <Ionicons name="play" size={compact ? 16 : 18} color={ringColor} />
          </View>
        </View>

        <View style={styles.stats}>
          {preview.stats.map((stat) => (
            <View key={stat.label} style={styles.statLine}>
              <Ionicons
                name={stat.icon}
                size={compact ? 12 : 13}
                color={stat.positive ? onboardingTokens.green : onboardingTokens.textMuted}
              />
              <Text
                style={[styles.statLabel, compact && styles.statLabelCompact]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {stat.label}
              </Text>
              <Text
                style={[
                  styles.statValue,
                  compact && styles.statValueCompact,
                  stat.positive && styles.statValuePositive,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {stat.value}
              </Text>
            </View>
          ))}
        </View>

        <Image
          source={getDistrictAsset(preview.districtId)}
          style={[styles.mapImage, compact && styles.mapImageCompact]}
          contentFit="contain"
        />
      </View>

      <View style={[styles.noteBand, compact && styles.noteBandCompact]}>
        <Text
          style={[styles.noteText, compact && styles.noteTextCompact]}
          numberOfLines={compact ? 2 : 3}
          ellipsizeMode="tail">
          {preview.noteLine}
        </Text>
      </View>

      <View style={[styles.butterflyBand, compact && styles.butterflyBandCompact]}>
        <Ionicons name="infinite-outline" size={14} color={onboardingTokens.primary} />
        <Text
          style={[styles.butterflyText, compact && styles.butterflyTextCompact]}
          numberOfLines={compact ? 2 : 3}
          ellipsizeMode="tail">
          {preview.butterflyTeaser}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: onboardingTokens.card,
    borderRadius: onboardingRadii.xl,
    borderWidth: 1,
    borderColor: onboardingTokens.border,
    padding: 14,
    gap: 10,
    shadowColor: onboardingTokens.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  cardCompact: {
    borderRadius: onboardingRadii.lg,
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
    gap: 2,
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
    fontSize: 13,
    fontWeight: '800',
  },
  statusCompact: {
    fontSize: 11,
  },
  launchBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: onboardingTokens.primary,
  },
  launchBadgeCompact: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ringIcon: {
    position: 'absolute',
  },
  stats: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  statLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    color: onboardingTokens.textMuted,
    fontWeight: '800',
  },
  statLabelCompact: {
    fontSize: 9,
  },
  statValue: {
    fontSize: 11,
    fontWeight: '900',
    color: onboardingTokens.textMain,
  },
  statValueCompact: {
    fontSize: 10,
  },
  statValuePositive: {
    color: onboardingTokens.green,
  },
  mapImage: {
    width: 72,
    height: 72,
    flexShrink: 0,
  },
  mapImageCompact: {
    width: 58,
    height: 58,
  },
  noteBand: {
    borderRadius: onboardingRadii.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: onboardingTokens.successMuted,
    borderWidth: 1,
    borderColor: 'rgba(41,185,111,0.14)',
  },
  noteBandCompact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: onboardingTokens.textMain,
  },
  noteTextCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
  butterflyBand: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: onboardingRadii.md,
    backgroundColor: onboardingTokens.lavender,
  },
  butterflyBandCompact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  butterflyText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    color: onboardingTokens.primaryDark,
  },
  butterflyTextCompact: {
    fontSize: 10,
    lineHeight: 14,
  },
});
