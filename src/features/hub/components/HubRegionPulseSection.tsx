import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useHubDerivedInput } from '@/features/hub/hooks/useHubDerivedInput';
import { deriveRegionPulse } from '@/features/hub/utils/hubDerived';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

function regionIcon(id: string): keyof typeof Ionicons.glyphMap {
  if (id.includes('sanayi') || id.includes('industrial')) {
    return 'business-outline';
  }
  if (id.includes('cumhuriyet') || id.includes('pazar')) {
    return 'storefront-outline';
  }
  return 'home-outline';
}

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
            style={[styles.card, shadows.soft]}>
            <View style={styles.cardTop}>
              <View style={styles.iconCircle}>
                <Ionicons name={regionIcon(r.id)} size={18} color={colors.primary} />
              </View>
              <Text style={styles.moodEmoji}>{r.mood}</Text>
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {r.shortName}
            </Text>
            <Text style={[styles.status, { color: r.pulseColor }]} numberOfLines={1}>
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
    color: colors.textPrimary,
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
    width: 112,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 2,
    minWidth: 0,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 16,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  status: {
    fontSize: 11,
    fontWeight: '700',
  },
});
