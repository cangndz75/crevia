import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CRISIS_ACTION_UI_COPY } from '@/core/crisisActions/crisisActionConstants';
import {
  buildCrisisActionPresentationInputFromStore,
  buildCrisisActionSheetModel,
} from '@/core/crisisActions/crisisActionPresentation';
import type { CrisisActionType } from '@/core/crisisActions/crisisActionTypes';
import { buildCrisisAnalyticsPayload } from '@/core/analytics/analyticsPayloadBuilders';
import { trackCreviaEvent } from '@/core/analytics/analyticsRuntime';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
} from '@/features/hub/utils/hubPremiumPresentation';
import { useGameStore } from '@/store/useGameStore';
import { getPressFeedbackStyle } from '@/ui/feedback/pressFeedback';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type CrisisActionSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  shield: 'shield-checkmark-outline',
  megaphone: 'megaphone-outline',
  people: 'people-outline',
  construct: 'construct-outline',
  eye: 'eye-outline',
};

export function CrisisActionSheet({ visible, onClose }: CrisisActionSheetProps) {
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const crisisState = useGameStore((s) => s.crisisState);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const assignments = useGameStore((s) => s.assignments);
  const dailyOperationsPlan = useGameStore((s) => s.dailyOperationsPlan);
  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const advisorState = useGameStore((s) => s.advisorState);
  const crisisActionState = useGameStore((s) => s.crisisActionState);
  const selectAction = useGameStore((s) => s.selectCrisisResolutionAction);

  const [selectedType, setSelectedType] = useState<CrisisActionType | null>(null);

  const sheetModel = useMemo(() => {
    const input = buildCrisisActionPresentationInputFromStore({
      gameState,
      monetization,
      crisisState,
      operationSignals,
      assignments,
      dailyOperationsPlan,
      mainOperationSeason,
      advisorState,
      crisisActionState,
    });
    return buildCrisisActionSheetModel(input);
  }, [
    advisorState,
    assignments,
    crisisActionState,
    crisisState,
    dailyOperationsPlan,
    gameState,
    mainOperationSeason,
    monetization,
    operationSignals,
  ]);

  if (!sheetModel) {
    return null;
  }

  const handleConfirm = () => {
    if (!selectedType) return;
    playLightImpactHaptic();
    trackCreviaEvent(
      'crisis_action_selected',
      buildCrisisAnalyticsPayload(crisisState, gameState, monetization),
      { optionId: selectedType, source: 'crisis_sheet' },
    );
    selectAction(selectedType);
    setSelectedType(null);
    onClose();
  };

  const handleClose = () => {
    setSelectedType(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title} numberOfLines={1}>
            {sheetModel.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {sheetModel.subtitle}
          </Text>

          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {sheetModel.actionRows.map((row) => {
              const selected = selectedType === row.id;
              const iconName = ICON_MAP[row.iconKey] ?? 'pulse-outline';
              return (
                <Pressable
                  key={row.id}
                  accessibilityRole="button"
                  accessibilityLabel={row.label}
                  onPress={() => {
                    playLightImpactHaptic();
                    setSelectedType(row.id);
                  }}
                  style={[
                    styles.row,
                    selected && styles.rowSelected,
                  ]}>
                  <View style={styles.rowHeader}>
                    <Ionicons
                      name={iconName}
                      size={18}
                      color={selected ? HUB_PREMIUM_COLORS.teal : colors.textSecondary}
                    />
                    <Text
                      style={[styles.rowLabel, selected && styles.rowLabelSelected]}
                      numberOfLines={2}>
                      {row.label}
                    </Text>
                    {row.isRecommended ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText} numberOfLines={1}>
                          {CRISIS_ACTION_UI_COPY.recommendedBadge}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.rowSummary} numberOfLines={2}>
                    {row.summary}
                  </Text>
                  <Text style={styles.rowTradeoff} numberOfLines={2}>
                    {row.tradeoff}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.footer} numberOfLines={3}>
            {sheetModel.footerNote}
          </Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              onPress={handleClose}
              style={({ pressed }) => [
                styles.cancelBtn,
                getPressFeedbackStyle({ pressed }),
              ]}>
              <Text style={styles.cancelText} numberOfLines={1}>
                Kapat
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={sheetModel.confirmLabel}
              disabled={selectedType == null}
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.confirmBtn,
                selectedType == null && styles.confirmBtnDisabled,
                getPressFeedbackStyle({ pressed }),
              ]}>
              <Text style={styles.confirmText} numberOfLines={1}>
                {sheetModel.confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(30, 40, 38, 0.35)',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#FFFBF5',
    borderTopLeftRadius: HUB_PREMIUM_RADIUS.cardLg,
    borderTopRightRadius: HUB_PREMIUM_RADIUS.cardLg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  scroll: {
    maxHeight: 360,
    minWidth: 0,
  },
  row: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(214, 162, 60, 0.22)',
    backgroundColor: '#FFF8EE',
    padding: spacing.sm,
    marginBottom: spacing.sm,
    minWidth: 0,
  },
  rowSelected: {
    borderColor: HUB_PREMIUM_COLORS.teal,
    backgroundColor: 'rgba(15, 143, 134, 0.08)',
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  rowLabel: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rowLabelSelected: {
    color: HUB_PREMIUM_COLORS.teal,
  },
  badge: {
    backgroundColor: 'rgba(245, 230, 200, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9A6B12',
  },
  rowSummary: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 17,
  },
  rowTradeoff: {
    fontSize: 11,
    color: '#9A6B12',
    marginTop: 4,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  footer: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  cancelBtn: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 1.4,
    minWidth: 0,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: HUB_PREMIUM_COLORS.teal,
  },
  confirmBtnDisabled: {
    opacity: 0.45,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
