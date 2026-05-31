import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { getHubRegionPulseImage } from '@/core/assets/creviaAssetPresentation';
import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { useHubDerivedInput } from '@/features/hub/hooks/useHubDerivedInput';
import { deriveRegionPulse } from '@/features/hub/utils/hubDerived';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_LAYOUT,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

function PulseDots({ color, count }: { color: string; count: number }) {
  const dots = Math.min(4, Math.max(1, count));
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: dots }).map((_, i) => (
        <View key={i} style={[dotStyles.dot, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});

export function HubRegionPulseSection() {
  const router = useRouter();
  const input = useHubDerivedInput();
  const neighborhoods = useGameStore((s) => s.neighborhoods);
  const regions = useMemo(
    () => deriveRegionPulse(neighborhoods, input.activeEvents),
    [neighborhoods, input.activeEvents],
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="pulse-outline" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>Bölge Nabzı</Text>
        </View>
        <Pressable
          style={styles.seeAllBtn}
          onPress={() => router.push('/risks')}
          accessibilityRole="button"
          accessibilityLabel="Tüm Bölgeler">
          <Text style={styles.seeAllText}>Tüm Bölgeler</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {regions.map((r, idx) => (
          <Animated.View
            key={r.id}
            entering={FadeIn.delay(idx * 40).duration(240)}
            style={[
              styles.card,
              hubPremiumShadowCard(),
              { borderColor: r.pulseColor },
            ]}>
            <View style={styles.cardTop}>
              <View style={[styles.iconCircle, { borderColor: r.pulseColor }]}>
                <HubAssetImage
                  source={getHubRegionPulseImage(r.id)}
                  containerStyle={styles.regionAsset}
                  contentFit="contain"
                />
              </View>
              <View style={styles.moodBubble}>
                <Text style={styles.moodEmoji}>{r.mood}</Text>
              </View>
            </View>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {r.shortName}
            </Text>
            <Text
              style={[styles.status, { color: r.pulseColor }]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {r.statusLabel}
            </Text>
            <PulseDots color={r.pulseColor} count={r.activeCount + 3} />
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: HUB_PREMIUM_COLORS.textDark,
    letterSpacing: -0.2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: 10,
    paddingBottom: 2,
  },
  card: {
    width: HUB_PREMIUM_LAYOUT.districtCardWidth,
    height: HUB_PREMIUM_LAYOUT.districtCardHeight,
    backgroundColor: HUB_PREMIUM_COLORS.card,
    borderRadius: HUB_PREMIUM_RADIUS.quick,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
    minWidth: 0,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(189, 239, 231, 0.35)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  regionAsset: {
    width: 28,
    height: 28,
  },
  moodBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: HUB_PREMIUM_COLORS.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 14,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: HUB_PREMIUM_COLORS.textDark,
  },
  status: {
    fontSize: 11,
    fontWeight: '700',
  },
});
