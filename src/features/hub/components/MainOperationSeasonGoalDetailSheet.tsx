import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { MainOperationSeasonDetailModel } from '@/core/mainOperation/mainOperationGoalPresentation';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { spacing } from '@/ui/theme/spacing';

type MainOperationSeasonGoalDetailSheetProps = {
  visible: boolean;
  model: MainOperationSeasonDetailModel | undefined;
  onClose: () => void;
};

const TONE_COLORS = {
  positive: '#0F8F86',
  neutral: '#5C7A75',
  warning: '#C9922E',
  critical: '#C45C4A',
} as const;

export function MainOperationSeasonGoalDetailSheet({
  visible,
  model,
  onClose,
}: MainOperationSeasonGoalDetailSheetProps) {
  if (!model) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, hubPremiumShadowCard()]}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderText}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {model.title}
              </Text>
              <Text style={styles.sheetSubtitle} numberOfLines={1}>
                {model.subtitle}
              </Text>
              <Text style={styles.sheetMeta} numberOfLines={1}>
                {model.seasonDayLabel}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closePressed]}>
              <Ionicons name="close" size={22} color={HUB_PREMIUM_COLORS.tealDark} />
            </Pressable>
          </View>

          <Text style={styles.topInsight} numberOfLines={2}>
            {model.topInsightLine}
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {model.goalDetails.map((goal) => (
              <View key={goal.goalId} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalTitleRow}>
                    <View
                      style={[
                        styles.toneDot,
                        { backgroundColor: TONE_COLORS[goal.tone] },
                      ]}
                    />
                    <Text style={styles.goalTitle} numberOfLines={2}>
                      {goal.title}
                    </Text>
                  </View>
                  <Text style={styles.goalProgress} numberOfLines={1}>
                    {goal.progressLabel}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.round(goal.progressRatio * 100)}%`,
                        backgroundColor: TONE_COLORS[goal.tone],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.statusLabel} numberOfLines={1}>
                  {goal.statusLabel}
                </Text>

                <Text style={styles.sectionLabel} numberOfLines={1}>
                  Bugün ne etkiledi?
                </Text>
                <Text style={styles.sectionBody} numberOfLines={3}>
                  {goal.sourceLine}
                </Text>

                <Text style={styles.sectionLabel} numberOfLines={1}>
                  Yarın önerisi
                </Text>
                <Text style={styles.sectionBody} numberOfLines={3}>
                  {goal.recommendationLine}
                </Text>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.footer} numberOfLines={2}>
            {model.footerNote}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13, 59, 55, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#F7FBF8',
    borderTopLeftRadius: HUB_PREMIUM_RADIUS.card + 4,
    borderTopRightRadius: HUB_PREMIUM_RADIUS.card + 4,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.12)',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sheetHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.tealDark,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: HUB_PREMIUM_COLORS.textMuted,
    marginTop: 2,
  },
  sheetMeta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A4F4A',
    marginTop: 4,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 143, 134, 0.1)',
  },
  closePressed: {
    opacity: 0.85,
  },
  topInsight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A4F4A',
    marginBottom: spacing.sm,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.1)',
    gap: 6,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  goalTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
  },
  toneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  goalTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.tealDark,
  },
  goalProgress: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F8F86',
    flexShrink: 0,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(15, 143, 134, 0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 12,
    color: HUB_PREMIUM_COLORS.textMuted,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F8F86',
    marginTop: 4,
  },
  sectionBody: {
    fontSize: 13,
    color: HUB_PREMIUM_COLORS.textMuted,
    lineHeight: 18,
  },
  footer: {
    fontSize: 12,
    color: HUB_PREMIUM_COLORS.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
