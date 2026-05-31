import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  buildDailyPlanEditModel,
  buildDailyPlanHubModel,
  buildDailyPlanningEngineInputFromStore,
} from '@/core/dailyPlanning';
import type {
  DailyContainerFocus,
  DailyPersonnelFocus,
  DailyPlanOption,
  DailyVehicleFocus,
} from '@/core/dailyPlanning/dailyPlanningTypes';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { selectIsDay1TutorialEligible } from '@/features/tutorial/tutorialSelectors';
import { useGameStore } from '@/store/useGameStore';
import { getPressFeedbackStyle } from '@/ui/feedback/pressFeedback';
import { spacing } from '@/ui/theme/spacing';

type HubDailyOperationsPlanCardProps = {
  compact?: boolean;
};

export function HubDailyOperationsPlanCard({
  compact = false,
}: HubDailyOperationsPlanCardProps) {
  const gameState = useGameStore((s) => s.gameState);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const advisorState = useGameStore((s) => s.advisorState);
  const dailyOperationsPlan = useGameStore((s) => s.dailyOperationsPlan);
  const isDay1 = useGameStore(selectIsDay1TutorialEligible);
  const confirmPlan = useGameStore((s) => s.confirmDailyOperationsPlan);
  const updatePlan = useGameStore((s) => s.updateDailyOperationsPlan);

  const [editorOpen, setEditorOpen] = useState(false);
  const [draftDistrict, setDraftDistrict] = useState(dailyOperationsPlan.districtFocusId);
  const [draftPersonnel, setDraftPersonnel] = useState(dailyOperationsPlan.personnelFocus);
  const [draftVehicle, setDraftVehicle] = useState(dailyOperationsPlan.vehicleFocus);
  const [draftContainer, setDraftContainer] = useState(dailyOperationsPlan.containerFocus);

  const planningInput = useMemo(
    () =>
      buildDailyPlanningEngineInputFromStore({
        gameState,
        operationSignals,
        advisorState,
        dailyOperationsPlan,
        isDay1Tutorial: isDay1,
      }),
    [gameState, operationSignals, advisorState, dailyOperationsPlan, isDay1],
  );

  const hubModel = useMemo(
    () => buildDailyPlanHubModel(planningInput),
    [planningInput],
  );

  const editModel = useMemo(() => {
    const draftPlan = {
      ...dailyOperationsPlan,
      districtFocusId: draftDistrict,
      personnelFocus: draftPersonnel,
      vehicleFocus: draftVehicle,
      containerFocus: draftContainer,
    };
    return buildDailyPlanEditModel({
      ...planningInput,
      dailyOperationsPlan: draftPlan,
    });
  }, [
    planningInput,
    dailyOperationsPlan,
    draftDistrict,
    draftPersonnel,
    draftVehicle,
    draftContainer,
  ]);

  const openEditor = () => {
    playLightImpactHaptic();
    setDraftDistrict(dailyOperationsPlan.districtFocusId);
    setDraftPersonnel(dailyOperationsPlan.personnelFocus);
    setDraftVehicle(dailyOperationsPlan.vehicleFocus);
    setDraftContainer(dailyOperationsPlan.containerFocus);
    setEditorOpen(true);
  };

  const handleConfirm = () => {
    playLightImpactHaptic();
    if (hubModel.canConfirm) {
      confirmPlan();
      return;
    }
    if (!isDay1 && hubModel.canEdit) {
      openEditor();
    }
  };

  const handleEditorConfirm = () => {
    playLightImpactHaptic();
    if (!editModel.canConfirm) return;
    confirmPlan({
      districtFocusId: draftDistrict,
      personnelFocus: draftPersonnel,
      vehicleFocus: draftVehicle,
      containerFocus: draftContainer,
    });
    setEditorOpen(false);
  };

  const selectOption = (
    section: 'district' | 'personnel' | 'vehicles' | 'containers',
    option: DailyPlanOption,
  ) => {
    playLightImpactHaptic();
    if (section === 'district') setDraftDistrict(option.id);
    if (section === 'personnel') setDraftPersonnel(option.id as DailyPersonnelFocus);
    if (section === 'vehicles') setDraftVehicle(option.id as DailyVehicleFocus);
    if (section === 'containers') setDraftContainer(option.id as DailyContainerFocus);
    updatePlan({
      districtFocusId: section === 'district' ? option.id : draftDistrict,
      personnelFocus:
        section === 'personnel'
          ? (option.id as DailyPersonnelFocus)
          : draftPersonnel,
      vehicleFocus:
        section === 'vehicles' ? (option.id as DailyVehicleFocus) : draftVehicle,
      containerFocus:
        section === 'containers'
          ? (option.id as DailyContainerFocus)
          : draftContainer,
    });
  };

  const isSelected = (
    section: 'district' | 'personnel' | 'vehicles' | 'containers',
    optionId: string,
  ) => {
    if (section === 'district') return draftDistrict === optionId;
    if (section === 'personnel') return draftPersonnel === optionId;
    if (section === 'vehicles') return draftVehicle === optionId;
    return draftContainer === optionId;
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <LinearGradient
        colors={['#FFFCF7', '#F4FBF8', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, hubPremiumShadowCard(), compact && styles.cardCompact]}>
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            <Text style={styles.title} numberOfLines={1}>
              {hubModel.title}
            </Text>
            {!compact ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {hubModel.subtitle}
              </Text>
            ) : null}
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText} numberOfLines={1}>
              {hubModel.statusLabel}
            </Text>
          </View>
        </View>

        {hubModel.focusRows.map((row) => (
          <View key={row.key} style={styles.focusRow}>
            <Text style={styles.focusLabel} numberOfLines={1}>
              {row.label}
            </Text>
            <Text style={styles.focusValue} numberOfLines={1}>
              {row.value}
            </Text>
          </View>
        ))}

        <Text style={styles.metaLine} numberOfLines={1}>
          {hubModel.focusPointsLabel}
        </Text>
        <Text style={styles.advisorLine} numberOfLines={2} ellipsizeMode="tail">
          {hubModel.advisorLine}
        </Text>

        {isDay1 ? (
          <Text style={styles.day1Hint} numberOfLines={2}>
            İlk gün plan düzenlemesi kapalı; önerilen planı onaylayın.
          </Text>
        ) : null}

        <View style={styles.ctaRow}>
          <Pressable
            onPress={handleConfirm}
            accessibilityRole="button"
            accessibilityLabel={hubModel.ctaLabel}
            style={({ pressed }) => [
              styles.ctaPrimary,
              getPressFeedbackStyle({ pressed }),
            ]}>
            <Text style={styles.ctaPrimaryText} numberOfLines={1}>
              {hubModel.ctaLabel}
            </Text>
          </Pressable>
          {!isDay1 && hubModel.secondaryCtaLabel ? (
            <Pressable
              onPress={openEditor}
              accessibilityRole="button"
              accessibilityLabel={hubModel.secondaryCtaLabel}
              style={({ pressed }) => [
                styles.ctaSecondary,
                getPressFeedbackStyle({ pressed }),
              ]}>
              <Text style={styles.ctaSecondaryText} numberOfLines={1}>
                {hubModel.secondaryCtaLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>

      <Modal
        visible={editorOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setEditorOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {editModel.title}
            </Text>
            <Text style={styles.modalMeta} numberOfLines={1}>
              {editModel.focusPointsLabel}
            </Text>
            {editModel.warningLine ? (
              <Text style={styles.modalWarning} numberOfLines={2}>
                {editModel.warningLine}
              </Text>
            ) : null}
            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {editModel.sections.map((section) => (
                <View key={section.key} style={styles.section}>
                  <Text style={styles.sectionTitle} numberOfLines={1}>
                    {section.title}
                  </Text>
                  {section.options.map((option) => {
                    const selected = isSelected(section.key, option.id);
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => selectOption(section.key, option)}
                        style={[
                          styles.optionCard,
                          selected && styles.optionCardSelected,
                        ]}>
                        <View style={styles.optionHeader}>
                          <Text
                            style={[
                              styles.optionLabel,
                              selected && styles.optionLabelSelected,
                            ]}
                            numberOfLines={1}>
                            {option.label}
                          </Text>
                          {option.cost > 0 ? (
                            <Text style={styles.optionCost} numberOfLines={1}>
                              Odak {option.cost}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={styles.optionUpside} numberOfLines={2}>
                          {option.upside}
                        </Text>
                        <Text style={styles.optionTradeoff} numberOfLines={2}>
                          {option.tradeoff}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setEditorOpen(false)}
                style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </Pressable>
              <Pressable
                onPress={handleEditorConfirm}
                disabled={!editModel.canConfirm}
                style={[
                  styles.modalConfirm,
                  !editModel.canConfirm && styles.modalConfirmDisabled,
                ]}>
                <Text style={styles.modalConfirmText}>{editModel.confirmLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    minWidth: 0,
  },
  wrapCompact: {
    paddingHorizontal: spacing.sm,
  },
  card: {
    borderRadius: HUB_PREMIUM_RADIUS.card,
    padding: spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.12)',
    minWidth: 0,
  },
  cardCompact: {
    padding: spacing.sm,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.tealDark,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 11,
    color: '#6B7F7B',
    flexShrink: 1,
  },
  statusPill: {
    backgroundColor: 'rgba(198, 235, 220, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    maxWidth: '42%',
    flexShrink: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2A6B64',
    flexShrink: 1,
  },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  focusLabel: {
    width: 72,
    fontSize: 11,
    fontWeight: '600',
    color: '#5E726E',
    flexShrink: 0,
  },
  focusValue: {
    flex: 1,
    fontSize: 12,
    color: '#3D4F4C',
    flexShrink: 1,
    minWidth: 0,
  },
  metaLine: {
    fontSize: 11,
    color: '#0F8F86',
    fontWeight: '600',
    flexShrink: 1,
  },
  advisorLine: {
    fontSize: 12,
    lineHeight: 17,
    color: '#3D4F4C',
    flexShrink: 1,
  },
  day1Hint: {
    fontSize: 11,
    lineHeight: 16,
    color: '#6B7F7B',
    fontStyle: 'italic',
    flexShrink: 1,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    minWidth: 0,
  },
  ctaPrimary: {
    flex: 1,
    backgroundColor: HUB_PREMIUM_COLORS.tealDark,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 0,
  },
  ctaPrimaryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  ctaSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.25)',
    minWidth: 0,
  },
  ctaSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: HUB_PREMIUM_COLORS.teal,
    flexShrink: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 74, 70, 0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFCF7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.md,
    maxHeight: '82%',
    gap: 8,
    minWidth: 0,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.tealDark,
    flexShrink: 1,
  },
  modalMeta: {
    fontSize: 12,
    color: '#0F8F86',
    fontWeight: '600',
    flexShrink: 1,
  },
  modalWarning: {
    fontSize: 12,
    color: '#B8860B',
    flexShrink: 1,
  },
  modalScroll: {
    flexGrow: 0,
    minWidth: 0,
  },
  section: {
    gap: 8,
    marginBottom: 12,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F4A46',
    flexShrink: 1,
  },
  optionCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.12)',
    padding: 10,
    gap: 4,
    backgroundColor: '#fff',
    minWidth: 0,
  },
  optionCardSelected: {
    borderColor: HUB_PREMIUM_COLORS.teal,
    backgroundColor: 'rgba(198, 235, 220, 0.35)',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3D4F4C',
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  optionLabelSelected: {
    color: HUB_PREMIUM_COLORS.tealDark,
  },
  optionCost: {
    fontSize: 10,
    color: '#6B7F7B',
    flexShrink: 0,
  },
  optionUpside: {
    fontSize: 11,
    color: '#3D4F4C',
    flexShrink: 1,
  },
  optionTradeoff: {
    fontSize: 10,
    color: '#6B7F7B',
    flexShrink: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  modalCancel: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 0,
  },
  modalCancelText: {
    fontSize: 13,
    color: '#6B7F7B',
  },
  modalConfirm: {
    flex: 1,
    backgroundColor: HUB_PREMIUM_COLORS.tealDark,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 0,
  },
  modalConfirmDisabled: {
    opacity: 0.45,
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
