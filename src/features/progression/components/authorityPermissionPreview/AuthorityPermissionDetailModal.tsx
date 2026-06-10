import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { AuthorityPermissionPreviewItem } from '@/core/authority/authorityPermissionPreviewTypes';
import { AuthorityPermissionStatePill } from '@/features/progression/components/authorityPermissionPreview/AuthorityPermissionStatePill';
import {
  AUTHORITY_PERMISSION_PREVIEW_THEME,
  resolveAuthorityPermissionStateStyle,
} from '@/features/progression/utils/authorityPermissionPreviewTheme';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type AuthorityPermissionDetailModalProps = {
  item: AuthorityPermissionPreviewItem | null;
  visible: boolean;
  onClose: () => void;
};

export function AuthorityPermissionDetailModal({
  item,
  visible,
  onClose,
}: AuthorityPermissionDetailModalProps) {
  if (!item) {
    return null;
  }

  const stateStyle = resolveAuthorityPermissionStateStyle(item.state);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Kapat">
        <Pressable
          style={[styles.sheet, shadows.card]}
          onPress={(event) => event.stopPropagation()}
          accessibilityViewIsModal>
          <View style={[styles.iconHero, { backgroundColor: stateStyle.pillBg }]}>
            <Ionicons name="shield-outline" size={26} color={stateStyle.pillText} />
          </View>

          <Text style={styles.title}>{item.detailTitle}</Text>
          <AuthorityPermissionStatePill label={item.statePillLabel} state={item.state} />

          <View style={styles.metaRow}>
            <Text style={styles.metaChip}>{item.categoryLabel}</Text>
            <Text style={styles.metaChip}>{item.systemTag}</Text>
          </View>

          <Text style={styles.body}>{item.detailBody}</Text>

          <View style={styles.benefitBlock}>
            <Text style={styles.benefitLabel}>Oyuncuya faydası</Text>
            <Text style={styles.benefitText}>{item.playerBenefit}</Text>
          </View>

          {item.unlockRankTitle && item.state !== 'active' ? (
            <Text style={styles.rankLine}>Yetki: {item.unlockRankTitle}</Text>
          ) : null}

          <Text style={styles.reason}>{item.reasonLabel}</Text>

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
    backgroundColor: AUTHORITY_PERMISSION_PREVIEW_THEME.cardBg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: AUTHORITY_PERMISSION_PREVIEW_THEME.border,
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
    color: AUTHORITY_PERMISSION_PREVIEW_THEME.textPrimary,
    alignSelf: 'stretch',
    textAlign: 'center',
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
  },
  body: {
    fontSize: 14,
    fontWeight: '500',
    color: AUTHORITY_PERMISSION_PREVIEW_THEME.textSecondary,
    lineHeight: 20,
    alignSelf: 'stretch',
  },
  benefitBlock: {
    alignSelf: 'stretch',
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: 4,
  },
  benefitLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },
  benefitText: {
    fontSize: 13,
    fontWeight: '700',
    color: AUTHORITY_PERMISSION_PREVIEW_THEME.textPrimary,
    lineHeight: 18,
  },
  rankLine: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.hubGoldDark,
    alignSelf: 'stretch',
  },
  reason: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    alignSelf: 'stretch',
  },
  closeButton: {
    alignSelf: 'stretch',
    marginTop: spacing.xs,
    backgroundColor: AUTHORITY_PERMISSION_PREVIEW_THEME.tealDark,
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
