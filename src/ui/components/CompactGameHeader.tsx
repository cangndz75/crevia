import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGameStatus } from '@/store/gameSelectors';
import { HeaderAvatar } from '@/ui/components/game-header/HeaderAvatar';
import { HeaderNotifyButton } from '@/ui/components/game-header/HeaderNotifyButton';
import { HeaderXpBar } from '@/ui/components/game-header/HeaderXpBar';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

export type CompactGameHeaderProps = {
  /** Ekran adı — örn. Yetkiler, Olaylar, Harita */
  screenTitle?: string;
};

function buildPilotMetaLine(day: number, districtName: string): string {
  return `${day}. Gün · ${districtName}`;
}

/**
 * Merkez dışı tüm oyun ekranları — kartlı kompakt header (sayfa başlığı + XP + bütçe).
 */
export function CompactGameHeader({
  screenTitle = 'Crevia',
}: CompactGameHeaderProps) {
  const insets = useSafeAreaInsets();
  const status = useGameStatus();
  const metaLine = useMemo(
    () => buildPilotMetaLine(status.currentDay, status.selectedDistrictName),
    [status.currentDay, status.selectedDistrictName],
  );

  return (
    <View style={[styles.outer, { paddingTop: insets.top + spacing.sm }]}>
      <View style={[styles.card, shadows.card]}>
        <View style={styles.mainRow}>
          <HeaderAvatar size={44} borderColor={colors.surface} />

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

          <View style={styles.rightCol}>
            <View style={styles.budgetPill}>
              <View style={styles.walletIcon}>
                <Ionicons
                  name="wallet-outline"
                  size={13}
                  color={colors.authority}
                />
              </View>
              <View style={styles.budgetTextCol}>
                <Text style={styles.budgetLabel}>BÜTÇE</Text>
                <Text
                  style={styles.budgetAmount}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}>
                  {status.budgetFormatted}
                </Text>
              </View>
            </View>
            <HeaderNotifyButton
              count={status.notificationCount}
              dotColor={colors.authority}
              dotOnly
              compact
            />
          </View>
        </View>

        <View style={styles.xpRow}>
          <Text style={styles.xpLabel}>XP</Text>
          <View style={styles.xpTrackWrap}>
            <HeaderXpBar
              progress={status.xpProgress}
              trackColor={colors.hubGoldTrack}
              fillColor={colors.primary}
              height={5}
            />
          </View>
          <Text style={styles.xpValue}>
            {status.xp.toLocaleString('tr-TR')}/
            {status.xpTarget.toLocaleString('tr-TR')}
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
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  centerCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    paddingTop: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
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
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
    maxWidth: '46%',
    justifyContent: 'flex-end',
  },
  budgetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: `${colors.hubGold}88`,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingLeft: 3,
    paddingRight: 7,
    paddingVertical: 3,
    flex: 1,
    minWidth: 0,
    maxWidth: 118,
  },
  budgetTextCol: {
    flex: 1,
    minWidth: 0,
  },
  walletIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.authorityMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  budgetLabel: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.textSecondary,
    lineHeight: 9,
  },
  budgetAmount: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
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
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    minWidth: 48,
    textAlign: 'right',
  },
});
