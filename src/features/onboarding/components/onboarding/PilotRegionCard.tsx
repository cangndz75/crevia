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

const TONE = {
  low: { bg: onboardingTokens.successMuted, text: onboardingTokens.success },
  mid: { bg: onboardingTokens.warningMuted, text: onboardingTokens.orange },
  high: { bg: '#FFE8E4', text: onboardingTokens.red },
};

type PilotRegionCardProps = {
  region: RegionCardData;
  selected: boolean;
  onPress: () => void;
  index: number;
};

export function PilotRegionCard({ region, selected, onPress, index }: PilotRegionCardProps) {
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? 1.01 : 1, { damping: 18 }) }],
    borderColor: withSpring(selected ? onboardingTokens.primary : onboardingTokens.border),
  }));

  return (
    <Animated.View entering={FadeInUp.delay(index * 80).springify()} style={styles.wrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={region.title}
        accessibilityState={{ selected }}>
        <Animated.View style={[styles.card, selected && styles.cardSelected, anim]}>
          {region.recommended ? (
            <View style={styles.recommended}>
              <Ionicons name="star" size={11} color="#FFFFFF" />
              <Text style={styles.recommendedText} numberOfLines={1}>
                Önerilen
              </Text>
            </View>
          ) : selected ? (
            <View style={styles.recommended}>
              <Ionicons name="checkmark" size={11} color="#FFFFFF" />
              <Text style={styles.recommendedText} numberOfLines={1}>
                Seçildi
              </Text>
            </View>
          ) : null}

          <View style={styles.inner}>
            <View style={styles.textCol}>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {region.title}
              </Text>
              <View style={styles.badges}>
                {region.badges.map((badge) => (
                  <View key={badge.label} style={styles.badge}>
                    <Ionicons name={badge.icon} size={11} color={onboardingTokens.textMuted} />
                    <Text style={styles.badgeText} numberOfLines={1} ellipsizeMode="tail">
                      {badge.label}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={styles.desc} numberOfLines={2} ellipsizeMode="tail">
                {region.description}
              </Text>
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
                      <Text style={styles.metricLabel} numberOfLines={1} ellipsizeMode="tail">
                        {m.label}
                      </Text>
                      <View style={[styles.metricPill, { backgroundColor: tone.bg }]}>
                        <Text
                          style={[styles.metricValue, { color: tone.text }]}
                          numberOfLines={1}
                          ellipsizeMode="tail">
                          {m.value}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.visual}>
              <Image
                source={getDistrictAsset(region.id)}
                style={styles.visualImage}
                contentFit="contain"
              />
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  card: {
    backgroundColor: onboardingTokens.card,
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: onboardingTokens.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  cardSelected: {
    backgroundColor: '#F9F7FF',
    shadowColor: onboardingTokens.primary,
    shadowOpacity: 0.18,
  },
  recommended: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: onboardingTokens.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  inner: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
    minWidth: 0,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  title: {
    maxWidth: '72%',
    fontSize: 17,
    fontWeight: '900',
    color: onboardingTokens.textMain,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
  },
  badge: {
    maxWidth: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: onboardingRadii.sm,
    backgroundColor: onboardingTokens.cardSoft,
    borderWidth: 1,
    borderColor: onboardingTokens.border,
  },
  badgeText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 10,
    fontWeight: '800',
    color: onboardingTokens.textMuted,
  },
  desc: {
    fontSize: 12,
    lineHeight: 17,
    color: onboardingTokens.textMuted,
    fontWeight: '600',
  },
  metrics: {
    flexDirection: 'row',
    gap: 6,
    minWidth: 0,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: onboardingTokens.textMuted,
  },
  metricPill: {
    minHeight: 22,
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  metricValue: {
    fontSize: 10,
    fontWeight: '900',
  },
  visual: {
    width: 86,
    height: 106,
    borderRadius: onboardingRadii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: onboardingTokens.lavender,
    flexShrink: 0,
    marginTop: 12,
  },
  visualImage: {
    width: 96,
    height: 96,
  },
});
