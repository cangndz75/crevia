import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { DistrictUnlockBindingItem } from '@/core/progression/districtOperationUnlockBindingTypes';
import { DistrictExpansionStatePill } from '@/features/progression/components/districtExpansion/DistrictExpansionStatePill';
import {
  DISTRICT_EXPANSION_THEME,
  resolveDistrictExpansionStateStyle,
} from '@/features/progression/utils/districtExpansionTheme';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type DistrictExpansionDetailModalProps = {
  item: DistrictUnlockBindingItem | null;
  visible: boolean;
  onClose: () => void;
};

export function DistrictExpansionDetailModal({
  item,
  visible,
  onClose,
}: DistrictExpansionDetailModalProps) {
  if (!item) return null;

  const stateStyle = resolveDistrictExpansionStateStyle(item.state);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, shadows.card]}
          onPress={(e) => e.stopPropagation()}
          accessibilityViewIsModal>
          <View style={[styles.iconHero, { backgroundColor: stateStyle.pillBg }]}>
            <Ionicons name="map-outline" size={26} color={stateStyle.pillText} />
          </View>
          <Text style={styles.title}>{item.detailTitle}</Text>
          <DistrictExpansionStatePill label={item.statePillLabel} state={item.state} />
          <Text style={styles.body}>{item.detailBody}</Text>
          {item.trustLabel ? (
            <Text style={styles.meta}>Güven: {item.trustLabel}</Text>
          ) : null}
          <View style={styles.chipRow}>
            <Text style={styles.chip}>{item.categoryLabel}</Text>
            {item.authorityRequirementLabel ? (
              <Text style={styles.chip}>{item.authorityRequirementLabel}</Text>
            ) : null}
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
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
    backgroundColor: DISTRICT_EXPANSION_THEME.cardBg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: DISTRICT_EXPANSION_THEME.border,
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
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: DISTRICT_EXPANSION_THEME.textPrimary,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    fontWeight: '500',
    color: DISTRICT_EXPANSION_THEME.textSecondary,
    lineHeight: 20,
    alignSelf: 'stretch',
  },
  meta: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryMuted,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  closeButton: {
    alignSelf: 'stretch',
    backgroundColor: DISTRICT_EXPANSION_THEME.tealDark,
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
