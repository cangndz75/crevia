import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDistrictProfile } from '@/core/content/districtProfiles';
import { DEFAULT_PILOT_DISTRICT_ID } from '@/core/models/DistrictProfile';
import { useGameStatus } from '@/store/gameSelectors';
import { HeaderAvatar } from '@/ui/components/game-header/HeaderAvatar';
import { HeaderXpBar } from '@/ui/components/game-header/HeaderXpBar';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

export type CompactGameHeaderProps = {
  /** Ekran adı — örn. Yetkiler, Olaylar, Harita */
  screenTitle?: string;
};

function buildMetaLine(day: number, districtShortName: string): string {
  return `${day}. Gün · ${districtShortName}`;
}

/**
 * Merkez dışı tüm oyun sekmeleri — kartlı header (başlık, seviye, bölge, bütçe, XP).
 */
export function CompactGameHeader({
  screenTitle = 'Crevia',
}: CompactGameHeaderProps) {
  const insets = useSafeAreaInsets();
  const status = useGameStatus();

  const districtShortName = useMemo(() => {
    const id = status.selectedDistrictId ?? DEFAULT_PILOT_DISTRICT_ID;
    return getDistrictProfile(id)?.shortName ?? 'Pilot Bölge';
  }, [status.selectedDistrictId]);

  const metaLine = useMemo(
    () => buildMetaLine(status.currentDay, districtShortName),
    [status.currentDay, districtShortName],
  );

  return (
    <View style={[styles.outer, { paddingTop: insets.top + spacing.sm }]}>
      <View style={[styles.card, shadows.card]}>
        <View style={styles.mainRow}>
          <HeaderAvatar size={48} borderColor={colors.surface} />

          <View style={styles.centerCol}>
            <View style={styles.titleRow}>
              <Text style={styles.screenTitle} numberOfLines={1}>
                {screenTitle}
              </Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>
                  Seviye {status.level}
                </Text>
              </View>
            </View>
            <Text style={styles.meta} numberOfLines={1}>
              {metaLine}
            </Text>
          </View>

          <Pressable
            style={styles.budgetCard}
            accessibilityRole="button"
            accessibilityLabel={`Bütçe ${status.budgetFormatted}`}>
            <View style={styles.budgetTextCol}>
              <Text
                style={styles.budgetAmount}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}>
                {status.budgetFormatted}
              </Text>
              <Text style={styles.budgetLabel}>Bütçe</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textInverse}
              style={styles.budgetChevron}
            />
          </Pressable>
        </View>

        <View style={styles.xpSection}>
          <Text style={styles.xpLabel}>XP</Text>
          <View style={styles.xpTrackWrap}>
            <HeaderXpBar
              progress={status.xpProgress}
              trackColor={colors.hubGoldTrack}
              fillColor={colors.primary}
              height={6}
            />
          </View>
          <Text style={styles.xpValue}>
            {status.xp}/{status.xpTarget}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  centerCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.35,
    flexShrink: 1,
  },
  levelBadge: {
    borderWidth: 1,
    borderColor: colors.hubGold,
    backgroundColor: colors.hubGoldMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.hubGoldDark,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  budgetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.headerTealDark,
    borderRadius: radius.lg,
    paddingVertical: 8,
    paddingLeft: spacing.sm,
    paddingRight: 6,
    gap: 2,
    maxWidth: 118,
    flexShrink: 0,
  },
  budgetTextCol: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
  },
  budgetAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: -0.3,
  },
  budgetLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  budgetChevron: {
    opacity: 0.9,
    marginLeft: 2,
  },
  xpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundAlt,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  xpLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    width: 22,
  },
  xpTrackWrap: {
    flex: 1,
    minWidth: 0,
  },
  xpValue: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    minWidth: 52,
    textAlign: 'right',
  },
});
