import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import {
  REGION_OPTIONS,
  type RegionOption,
} from '@/features/onboarding/content/onboardingContent';
import { onboardingTheme } from '@/features/onboarding/theme/onboardingTheme';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const TONE_COLORS = {
  low: { bg: onboardingTheme.successMuted, text: onboardingTheme.success },
  mid: { bg: onboardingTheme.warningMuted, text: onboardingTheme.warning },
  high: { bg: onboardingTheme.dangerMuted, text: onboardingTheme.danger },
};

type OnboardingRegionStepProps = {
  selectedId: PilotDistrictId;
  onSelect: (id: PilotDistrictId) => void;
};

function RegionCard({
  region,
  selected,
  onPress,
  index,
}: {
  region: RegionOption;
  selected: boolean;
  onPress: () => void;
  index: number;
}) {
  const selectionStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(selected ? 1.02 : 1, { damping: 18, stiffness: 200 }) },
    ],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70).springify()}
      style={selectionStyle}>
      <Pressable
        onPress={onPress}
        style={[
          styles.card,
          shadows.card,
          selected && styles.cardSelected,
        ]}>
        {region.recommended && (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>ÖNERİLEN</Text>
          </View>
        )}

        <View style={styles.cardInner}>
          <View style={styles.textCol}>
            <Text style={styles.cardTitle}>{region.title}</Text>
            <View style={styles.tagRow}>
              {region.tags.map((tag) => (
                <View key={tag.label} style={styles.tag}>
                  <Ionicons
                    name={tag.icon}
                    size={12}
                    color={onboardingTheme.textMuted}
                  />
                  <Text style={styles.tagText}>{tag.label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.cardDesc}>{region.description}</Text>
            <View style={styles.statsRow}>
              {(
                [
                  region.stats.socialRisk,
                  region.stats.staffPace,
                  region.stats.difficulty,
                ] as const
              ).map((stat) => {
                const tone = TONE_COLORS[stat.tone];
                return (
                  <View key={stat.label} style={styles.stat}>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    <View style={[styles.statPill, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.statValue, { color: tone.text }]}>
                        {stat.value}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.illustration}>
            <View style={styles.isoBlockA} />
            <View style={styles.isoBlockB} />
            <View style={styles.isoPin}>
              <Ionicons name="location" size={14} color={onboardingTheme.primary} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function OnboardingRegionStep({
  selectedId,
  onSelect,
}: OnboardingRegionStepProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Ionicons name="star" size={14} color={onboardingTheme.primary} />
        <Text style={styles.badgeText}>3 farklı başlangıç</Text>
      </View>
      <View style={styles.list}>
        {REGION_OPTIONS.map((region, i) => (
          <RegionCard
            key={region.id}
            region={region}
            selected={selectedId === region.id}
            onPress={() => onSelect(region.id)}
            index={i}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: onboardingTheme.primaryMuted,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: onboardingTheme.primary,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: onboardingTheme.glass,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: onboardingTheme.primary,
    backgroundColor: '#F0EFFE',
    shadowColor: onboardingTheme.primary,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  recommendedBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 2,
    backgroundColor: onboardingTheme.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardInner: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  textCol: {
    flex: 1,
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: onboardingTheme.navy,
    paddingRight: 72,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: onboardingTheme.textMuted,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: onboardingTheme.textMuted,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  stat: {
    gap: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: onboardingTheme.textMuted,
  },
  statPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  statValue: {
    fontSize: 10,
    fontWeight: '800',
  },
  illustration: {
    width: 72,
    height: 72,
    position: 'relative',
  },
  isoBlockA: {
    position: 'absolute',
    bottom: 8,
    left: 4,
    width: 40,
    height: 28,
    borderRadius: 6,
    backgroundColor: onboardingTheme.primaryMuted,
    transform: [{ skewX: '-10deg' }],
  },
  isoBlockB: {
    position: 'absolute',
    top: 12,
    right: 0,
    width: 32,
    height: 36,
    borderRadius: 6,
    backgroundColor: onboardingTheme.successMuted,
    transform: [{ skewX: '-8deg' }],
  },
  isoPin: {
    position: 'absolute',
    top: 0,
    left: 20,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: onboardingTheme.primaryMuted,
  },
});
