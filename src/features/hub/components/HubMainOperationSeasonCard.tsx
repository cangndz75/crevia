import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { buildMainOperationHubModel } from '@/core/mainOperation';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { useGameStore } from '@/store/useGameStore';
import { spacing } from '@/ui/theme/spacing';

type HubMainOperationSeasonCardProps = {
  compact?: boolean;
};

export function HubMainOperationSeasonCard({
  compact = false,
}: HubMainOperationSeasonCardProps) {
  const router = useRouter();
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);

  const model = useMemo(
    () =>
      buildMainOperationHubModel(gameState, monetization, mainOperationSeason, {
        compact,
      }),
    [gameState, monetization, mainOperationSeason, compact],
  );

  if (!model.visible) {
    return null;
  }

  const handleCta = () => {
    if (model.accessLabel.includes('aktif')) {
      router.push('/events/main-operation-preview');
      return;
    }
    router.push('/post-pilot-offer');
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <LinearGradient
        colors={['#F7FBF8', '#EEF8F3', '#F5F0E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, hubPremiumShadowCard()]}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {model.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {model.subtitle}
            </Text>
          </View>
          <View style={styles.accessPill}>
            <Text style={styles.accessPillText} numberOfLines={1}>
              {model.accessLabel}
            </Text>
          </View>
        </View>

        <Text style={styles.seasonLine} numberOfLines={1}>
          {model.seasonProgressLabel}
        </Text>
        <Text style={styles.districtLine} numberOfLines={2}>
          {model.activeDistrictLine}
        </Text>

        {model.goalRows.length > 0 ? (
          <View style={styles.goals}>
            {model.goalRows.map((row) => (
              <View key={row.id} style={styles.goalRow}>
                <Text style={styles.goalTitle} numberOfLines={1}>
                  {row.title}
                </Text>
                <Text style={styles.goalProgress} numberOfLines={1}>
                  {row.progressLabel}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.footer} numberOfLines={2}>
          {model.footerNote}
        </Text>

        {model.ctaLabel ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleCta}
            style={({ pressed }) => [
              styles.cta,
              pressed && styles.ctaPressed,
            ]}>
            <Text style={styles.ctaText}>{model.ctaLabel}</Text>
          </Pressable>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  wrapCompact: {
    marginBottom: spacing.xs,
  },
  card: {
    borderRadius: HUB_PREMIUM_RADIUS.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.12)',
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.tealDark,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: HUB_PREMIUM_COLORS.textMuted,
    marginTop: 2,
  },
  accessPill: {
    backgroundColor: 'rgba(15, 143, 134, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    maxWidth: '46%',
  },
  accessPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F8F86',
  },
  seasonLine: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A4F4A',
  },
  districtLine: {
    fontSize: 13,
    color: HUB_PREMIUM_COLORS.textMuted,
    lineHeight: 18,
  },
  goals: {
    gap: 6,
    marginTop: 4,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  goalTitle: {
    flex: 1,
    fontSize: 12,
    color: HUB_PREMIUM_COLORS.tealDark,
  },
  goalProgress: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F8F86',
  },
  footer: {
    fontSize: 12,
    color: HUB_PREMIUM_COLORS.textMuted,
    marginTop: 4,
  },
  cta: {
    marginTop: spacing.sm,
    backgroundColor: '#0D3B37',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaText: {
    color: '#F7FBF8',
    fontSize: 14,
    fontWeight: '600',
  },
});
