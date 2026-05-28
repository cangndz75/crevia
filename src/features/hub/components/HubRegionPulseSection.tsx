import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
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
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

function PulseIndicator({
  color,
  level,
}: {
  color: string;
  level: number;
}) {
  const bars = useMemo(() => {
    const base = [0.35, 0.55, 0.75, 0.5, 0.9];
    const bias = Math.min(1, Math.max(0.2, level / 5));
    return base.map((h) => h * bias);
  }, [level]);

  return (
    <View style={chartStyles.row}>
      {bars.map((h, i) => (
        <View
          key={i}
          style={[
            chartStyles.bar,
            {
              height: 4 + h * 10,
              backgroundColor: color,
              opacity: 0.28 + h * 0.55,
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
    gap: 3,
    height: 16,
    marginTop: 2,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    maxWidth: 6,
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
        <Text style={styles.sectionTitle}>BÖLGE NABZI</Text>
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
            style={[styles.card, shadows.soft]}>
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
              <PulseIndicator
                color={r.pulseColor}
                level={Math.max(1, r.activeCount + 1)}
              />
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
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.4,
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
    width: 108,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.08)',
    overflow: 'hidden',
  },
  thumbWrap: {
    width: '100%',
    height: 46,
    position: 'relative',
    backgroundColor: colors.background,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  moodBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.soft,
  },
  moodEmoji: {
    fontSize: 11,
  },
  cardBody: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 2,
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
});
