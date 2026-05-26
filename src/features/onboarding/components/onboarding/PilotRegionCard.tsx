import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import type { RegionCardData } from '@/features/onboarding/data/onboardingData';
import { getDistrictAsset } from '@/features/onboarding/data/onboardingAssets';
import { onboardingRadii, onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';
import { spacing } from '@/ui/theme/spacing';

const TONE = {
  low: { bg: onboardingTokens.successMuted, text: onboardingTokens.success },
  mid: { bg: onboardingTokens.warningMuted, text: '#D97706' },
  high: { bg: '#FFE8E4', text: onboardingTokens.dangerSoft },
};

type PilotRegionCardProps = {
  region: RegionCardData;
  selected: boolean;
  onPress: () => void;
  index: number;
};

export function PilotRegionCard({ region, selected, onPress, index }: PilotRegionCardProps) {
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? 1.02 : 1, { damping: 16 }) }],
    borderColor: withSpring(selected ? onboardingTokens.primary : 'transparent'),
  }));

  const parallaxStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(selected ? 3 : 0, { damping: 20 }) }],
  }));

  return (
    <Animated.View entering={FadeInUp.delay(index * 80).springify()}>
      <Pressable onPress={onPress}>
        <Animated.View style={[styles.card, selected && styles.cardSelected, anim]}>
          {region.recommended ? (
            <View style={styles.recommended}>
              <Text style={styles.recommendedText}>Önerilen</Text>
            </View>
          ) : null}

          <View style={styles.inner}>
            <View style={styles.textCol}>
              <Text style={styles.title}>{region.title}</Text>
              <View style={styles.badges}>
                {region.badges.map((badge) => (
                  <View key={badge.label} style={styles.badge}>
                    <Ionicons name={badge.icon} size={11} color={onboardingTokens.textMuted} />
                    <Text style={styles.badgeText}>{badge.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.desc}>{region.description}</Text>
              <View style={styles.metrics}>
                {(
                  [
                    region.metrics.socialRisk,
                    region.metrics.staffPace,
                    region.metrics.difficulty,
                  ] as const
                ).map((m) => {
                  const tone = TONE[m.tone];
                  return (
                    <View key={m.label} style={styles.metric}>
                      <Text style={styles.metricLabel}>{m.label}</Text>
                      <View style={[styles.metricPill, { backgroundColor: tone.bg }]}>
                        <Text style={[styles.metricValue, { color: tone.text }]}>{m.value}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <Animated.View style={[styles.visual, parallaxStyle]}>
              <Image
                source={getDistrictAsset(region.id)}
                style={styles.visualImage}
                contentFit="cover"
              />
            </Animated.View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: onboardingTokens.card,
    borderRadius: onboardingRadii.lg,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: onboardingTokens.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  cardSelected: {
    backgroundColor: 'rgba(240, 237, 255, 0.95)',
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  recommended: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 2,
    backgroundColor: onboardingTokens.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: onboardingRadii.sm,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  inner: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  textCol: {
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: onboardingTokens.textMain,
    paddingRight: 64,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: onboardingRadii.sm,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: onboardingTokens.border,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: onboardingTokens.textMuted,
  },
  desc: {
    fontSize: 12,
    lineHeight: 17,
    color: onboardingTokens.textMuted,
    fontWeight: '500',
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metric: {
    gap: 2,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: onboardingTokens.textMuted,
  },
  metricPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metricValue: {
    fontSize: 10,
    fontWeight: '800',
  },
  visual: {
    width: 76,
    height: 76,
    borderRadius: onboardingRadii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: onboardingTokens.border,
  },
  visualImage: {
    width: '100%',
    height: '100%',
  },
});
