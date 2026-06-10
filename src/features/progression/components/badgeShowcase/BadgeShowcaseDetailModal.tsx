import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { resolveIoniconForRegistryKey } from '@/core/presentation/creviaIconPresentation';
import type { BadgeShowcaseItem } from '@/core/badges/badgeShowcaseTypes';
import { BadgeShowcaseStatePill } from '@/features/progression/components/badgeShowcase/BadgeShowcaseStatePill';
import {
  BADGE_SHOWCASE_THEME,
  resolveBadgeShowcaseRarityStyle,
} from '@/features/progression/utils/badgeShowcaseTheme';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type BadgeShowcaseDetailModalProps = {
  item: BadgeShowcaseItem | null;
  visible: boolean;
  onClose: () => void;
};

export function BadgeShowcaseDetailModal({
  item,
  visible,
  onClose,
}: BadgeShowcaseDetailModalProps) {
  if (!item) {
    return null;
  }

  const rarityStyle = resolveBadgeShowcaseRarityStyle(item.rarity, item.state);
  const iconName = resolveIoniconForRegistryKey(item.iconKey);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Kapat">
        <Pressable
          style={[styles.sheet, shadows.card]}
          onPress={(event) => event.stopPropagation()}
          accessibilityViewIsModal>
          <View style={[styles.iconHero, { backgroundColor: rarityStyle.iconBg }]}>
            <Ionicons name={iconName} size={28} color={rarityStyle.iconColor} />
          </View>

          <Text style={styles.title}>{item.detailTitle}</Text>
          <Text style={styles.prestige}>{item.prestigeBandLabel}</Text>
          <BadgeShowcaseStatePill label={item.statePillLabel} state={item.state} />

          <View style={styles.metaRow}>
            <Text style={styles.metaChip}>{item.categoryLabel}</Text>
            <Text style={styles.metaChip}>{item.systemTag}</Text>
          </View>

          <Text style={styles.body}>{item.detailBody}</Text>

          {item.styleSignal ? (
            <View style={styles.signalBlock}>
              <Text style={styles.signalLabel}>Operasyon tarzı</Text>
              <Text style={styles.signalText}>{item.styleSignal}</Text>
            </View>
          ) : null}

          {item.progressLabel ? (
            <Text style={styles.progress} accessibilityLabel={`İlerleme ${item.progressLabel}`}>
              İlerleme: {item.progressLabel}
            </Text>
          ) : null}

          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Kapat">
            <Text style={styles.closeText}>Kapat</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 58, 54, 0.42)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    backgroundColor: BADGE_SHOWCASE_THEME.cardBg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: BADGE_SHOWCASE_THEME.border,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  iconHero: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: BADGE_SHOWCASE_THEME.textPrimary,
    letterSpacing: -0.3,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  prestige: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.hubGoldDark,
    alignSelf: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  metaChip: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryMuted,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  body: {
    fontSize: 14,
    fontWeight: '500',
    color: BADGE_SHOWCASE_THEME.textSecondary,
    lineHeight: 20,
    alignSelf: 'stretch',
  },
  signalBlock: {
    alignSelf: 'stretch',
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: 4,
  },
  signalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },
  signalText: {
    fontSize: 13,
    fontWeight: '700',
    color: BADGE_SHOWCASE_THEME.textPrimary,
    lineHeight: 18,
  },
  progress: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    alignSelf: 'stretch',
  },
  closeButton: {
    alignSelf: 'stretch',
    marginTop: spacing.xs,
    backgroundColor: BADGE_SHOWCASE_THEME.tealDark,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textInverse,
  },
});
