import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { useHubDerivedInput } from '@/features/hub/hooks/useHubDerivedInput';
import { deriveRegionPulse } from '@/features/hub/utils/hubDerived';
import { getNeighborhoodThumb } from '@/features/hub/utils/hubAssets';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

function MiniPulseChart({ color, seed }: { color: string; seed: number }) {
  const heights = useMemo(() => {
    const base = [0.4, 0.7, 0.5, 0.9, 0.6];
    return base.map((h, i) => h + ((seed + i) % 3) * 0.1);
  }, [seed]);

  return (
    <View style={chartStyles.row}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={[
            chartStyles.bar,
            {
              height: 3 + h * 9,
              backgroundColor: color,
              opacity: 0.35 + h * 0.3,
            },
          ]}
        />
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 14,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});

export function HubRegionPulseSection() {
  const input = useHubDerivedInput();
  const neighborhoods = useGameStore((s) => s.neighborhoods);
  const regions = useMemo(
    () => deriveRegionPulse(neighborhoods, input.activeEvents),
    [neighborhoods, input.activeEvents],
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Bölge Nabzı</Text>
        <Pressable style={styles.seeAllBtn} accessibilityLabel="Tüm Bölgeler">
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
            entering={FadeIn.delay(idx * 50).duration(250)}
            style={styles.card}>
            <View style={styles.thumbWrap}>
              <HubAssetImage
                source={getNeighborhoodThumb(r.id)}
                containerStyle={styles.thumb}
                contentFit="cover"
              />
              <View style={styles.moodBadge}>
                <Text style={styles.moodEmoji}>{r.mood}</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.name} numberOfLines={1}>
                {r.shortName}
              </Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: r.pulseColor }]} />
                <Text style={[styles.status, { color: r.pulseColor }]}>
                  {r.statusLabel}
                </Text>
              </View>
              <Text style={styles.detailLine} numberOfLines={1}>
                {r.detailLine}
              </Text>
              <MiniPulseChart color={r.pulseColor} seed={idx * 3 + r.activeCount} />
            </View>
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: 10,
    paddingBottom: 2,
  },
  card: {
    width: 120,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  thumbWrap: {
    width: '100%',
    height: 56,
    position: 'relative',
    backgroundColor: colors.background,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  moodBadge: {
    position: 'absolute',
    bottom: -8,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  moodEmoji: {
    fontSize: 12,
  },
  cardBody: {
    padding: 8,
    paddingTop: 6,
    gap: 3,
  },
  name: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  status: {
    fontSize: 10,
    fontWeight: '700',
  },
  detailLine: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
