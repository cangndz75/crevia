import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useHubDerivedInput } from '@/features/hub/hooks/useHubDerivedInput';
import { deriveRegionPulse } from '@/features/hub/utils/hubDerived';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

function WaveLine({ color }: { color: string }) {
  return (
    <View style={styles.waveRow}>
      {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8].map((h, i) => (
        <View
          key={i}
          style={[
            styles.waveBar,
            {
              height: 8 + h * 12,
              backgroundColor: color,
              opacity: 0.35 + h * 0.4,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function HubRegionPulseSection() {
  const input = useHubDerivedInput();
  const neighborhoods = useGameStore((s) => s.neighborhoods);
  const regions = useMemo(
    () => deriveRegionPulse(neighborhoods, input.activeEvents),
    [neighborhoods, input.activeEvents],
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Bölge Nabzı</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {regions.map((r, i) => (
          <Animated.View
            key={r.id}
            entering={FadeIn.delay(i * 80).duration(350)}
            style={[styles.card, shadows.soft]}>
            <View style={styles.cardTop}>
              <Text style={styles.name}>{r.shortName}</Text>
              <Text style={styles.mood}>{r.mood}</Text>
            </View>
            <Text style={styles.eventCount}>
              {r.activeCount > 0
                ? `${r.activeCount} aktif olay`
                : 'Sakin'}
            </Text>
            <WaveLine color={r.pulseColor} />
            <View style={styles.contactRow}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactInitial}>
                  {r.shortName.charAt(0)}
                </Text>
              </View>
              <Text style={styles.contactLabel} numberOfLines={1}>
                {r.contactLabel}
              </Text>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  card: {
    width: 148,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  mood: {
    fontSize: 18,
  },
  eventCount: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 24,
    marginVertical: spacing.xs,
  },
  waveBar: {
    width: 5,
    borderRadius: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  contactAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.hubGoldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInitial: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.hubGoldDark,
  },
  contactLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
});
