import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { operationMotionPlanSelectDurationMs } from '@/core/motion/operationMotionTokens';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type {
  EventPlanAction,
  EventPlanAdvisorComment,
  EventPlanContextSummary,
  EventPlanInspectSummaryTone,
  EventPlanPhaseContextChip,
  EventPlanResourceBalance,
  EventPlanSelectedPreview,
  EventPlanStrategyCard,
} from '@/features/events/utils/eventPlanPhasePresentation';
import { CreviaMotionView } from '@/shared/motion';
import { shadows } from '@/ui/theme/shadows';

type IconName = ComponentProps<typeof Ionicons>['name'];

const SUMMARY_TONE_COLORS: Record<EventPlanInspectSummaryTone, string> = {
  positive: eventDetail.success,
  neutral: eventDetail.teal,
  warning: eventDetail.orange,
  urgent: eventDetail.red,
};

const STRATEGY_BORDER: Record<EventPlanStrategyCard['tone'], string> = {
  teal: eventDetail.teal,
  green: eventDetail.success,
  gold: '#C58B18',
  warning: eventDetail.orange,
  neutral: eventDetail.textMuted,
};

const ADVISOR_TONE: Record<
  EventPlanAdvisorComment['tone'],
  { border: string; icon: IconName; pillBg: string; pillText: string }
> = {
  calm: {
    border: 'rgba(11, 107, 97, 0.18)',
    icon: 'leaf-outline',
    pillBg: 'rgba(11, 107, 97, 0.12)',
    pillText: eventDetail.tealDark,
  },
  teaching: {
    border: 'rgba(216, 167, 46, 0.35)',
    icon: 'school-outline',
    pillBg: 'rgba(216, 167, 46, 0.16)',
    pillText: '#9E6E0D',
  },
  warning: {
    border: 'rgba(199, 137, 37, 0.35)',
    icon: 'alert-circle-outline',
    pillBg: 'rgba(199, 137, 37, 0.16)',
    pillText: '#9E6E0D',
  },
  positive: {
    border: 'rgba(62, 158, 106, 0.28)',
    icon: 'checkmark-circle-outline',
    pillBg: 'rgba(62, 158, 106, 0.14)',
    pillText: eventDetail.tealDark,
  },
};

function resolveIcon(iconKey: string): IconName {
  const known: Record<string, IconName> = {
    'pulse-outline': 'pulse-outline',
    'location-outline': 'location-outline',
    'briefcase-outline': 'briefcase-outline',
    'chatbubbles-outline': 'chatbubbles-outline',
    'git-network-outline': 'git-network-outline',
    'people-outline': 'people-outline',
    'analytics-outline': 'analytics-outline',
    'document-text-outline': 'document-text-outline',
    'time-outline': 'time-outline',
    'shield-checkmark-outline': 'shield-checkmark-outline',
    'warning-outline': 'warning-outline',
    'map-outline': 'map-outline',
    'create-outline': 'create-outline',
  };
  return known[iconKey] ?? 'ellipse-outline';
}

type PlanPhaseContextChipsProps = {
  chips: EventPlanPhaseContextChip[];
  reducedMotion?: boolean;
};

export function PlanPhaseContextChips({
  chips,
  reducedMotion = false,
}: PlanPhaseContextChipsProps) {
  if (chips.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.phaseContextRow}>
      {chips.map((chip, index) => (
        <CreviaMotionView
          key={`${chip.label}-${chip.value}`}
          motionKind="chip_appear"
          surface="shared"
          index={index}
          reducedMotion={reducedMotion}
          style={styles.phaseContextMotion}>
          <View
            style={[
              styles.phaseContextChip,
              { borderColor: `${SUMMARY_TONE_COLORS[chip.tone]}44` },
            ]}>
            <Text style={styles.phaseContextLabel}>{chip.label}</Text>
            <Text style={styles.phaseContextValue} numberOfLines={1}>
              {chip.value}
            </Text>
          </View>
        </CreviaMotionView>
      ))}
    </ScrollView>
  );
}

type PlanContextBridgeCardProps = {
  contextSummary: EventPlanContextSummary;
  reducedMotion?: boolean;
};

export function PlanContextBridgeCard({
  contextSummary,
  reducedMotion = false,
}: PlanContextBridgeCardProps) {
  if (!contextSummary.summary && contextSummary.chips.length === 0) return null;

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={2}
      reducedMotion={reducedMotion}
      style={styles.sectionWrap}>
      <View style={[styles.contextCard, shadows.soft]}>
        <Text style={styles.sectionTitle}>{contextSummary.title}</Text>
        {contextSummary.chips.length > 0 ? (
          <View style={styles.contextChipRow}>
            {contextSummary.chips.map((chip) => (
              <View
                key={`${chip.label}-${chip.value}`}
                style={[
                  styles.contextChip,
                  { borderColor: `${SUMMARY_TONE_COLORS[chip.tone]}44` },
                ]}>
                <Text style={styles.contextChipLabel} numberOfLines={1}>
                  {chip.label}
                </Text>
                <Text style={styles.contextChipValue} numberOfLines={1}>
                  {chip.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {contextSummary.summary ? (
          <Text style={styles.contextSummary} numberOfLines={2}>
            {contextSummary.summary}
          </Text>
        ) : null}
      </View>
    </CreviaMotionView>
  );
}

type EventPlanStrategyCardViewProps = {
  strategy: EventPlanStrategyCard;
  onSelect: () => void;
  reducedMotion?: boolean;
  index?: number;
};

export function EventPlanStrategyCardView({
  strategy,
  onSelect,
  reducedMotion = false,
  index = 0,
}: EventPlanStrategyCardViewProps) {
  const scale = useSharedValue(strategy.isSelected ? 1.01 : 1);
  const duration = operationMotionPlanSelectDurationMs(reducedMotion);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (!reducedMotion) {
      scale.value = withTiming(0.985, { duration: duration / 2 }, () => {
        scale.value = withTiming(strategy.isSelected ? 1.01 : 1.015, { duration });
      });
    }
    onSelect();
  };

  const accent = STRATEGY_BORDER[strategy.tone];

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={index}
      reducedMotion={reducedMotion}
      style={styles.strategyMotionWrap}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.strategyCard,
            shadows.soft,
            strategy.isSelected ? styles.strategyCardSelected : styles.strategyCardDefault,
            strategy.isSelected && { borderColor: accent },
            !strategy.isSelected && styles.strategyCardIdle,
            pressed && styles.strategyPressed,
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: strategy.isSelected }}
          accessibilityLabel={strategy.title}>
          <View style={styles.strategyHeader}>
            <View style={styles.strategyTitleRow}>
              <Text style={styles.strategyTitle} numberOfLines={1}>
                {strategy.title}
              </Text>
              {strategy.isRecommended ? (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Önerilen</Text>
                </View>
              ) : null}
              {strategy.isSelected ? (
                <View style={[styles.selectedBadge, { backgroundColor: `${accent}22` }]}>
                  <Text style={[styles.selectedBadgeText, { color: accent }]}>Seçildi</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.strategyDescription} numberOfLines={2}>
              {strategy.description}
            </Text>
          </View>

          <View style={styles.prosConsRow}>
            {strategy.pros.slice(0, 2).map((pro) => (
              <View key={pro} style={styles.proChip}>
                <Ionicons name="add-circle-outline" size={11} color={eventDetail.success} />
                <Text style={styles.proText} numberOfLines={1}>
                  {pro}
                </Text>
              </View>
            ))}
            {strategy.cons.slice(0, 1).map((con) => (
              <View key={con} style={styles.conChip}>
                <Ionicons name="remove-circle-outline" size={11} color={eventDetail.orange} />
                <Text style={styles.conText} numberOfLines={1}>
                  {con}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Ionicons name="wallet-outline" size={11} color={eventDetail.tealDark} />
              <Text style={styles.metaText} numberOfLines={1}>
                {strategy.costLabel}
              </Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="pulse-outline" size={11} color={eventDetail.tealDark} />
              <Text style={styles.metaText} numberOfLines={1}>
                {strategy.riskLabel}
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </CreviaMotionView>
  );
}

type EventPlanSelectedPreviewCardProps = {
  preview: EventPlanSelectedPreview;
  reducedMotion?: boolean;
};

export function EventPlanSelectedPreviewCard({
  preview,
  reducedMotion = false,
}: EventPlanSelectedPreviewCardProps) {
  return (
    <CreviaMotionView
      key={preview.items.map((item) => item.id).join('-')}
      motionKind="line_appear"
      surface="shared"
      index={0}
      reducedMotion={reducedMotion}
      style={styles.sectionWrap}>
      <View style={[styles.impactCard, shadows.soft]}>
        <Text style={styles.sectionTitle}>{preview.title}</Text>
        <Text style={styles.impactHint}>Seçili plana göre olası etki önizlemesi.</Text>
        <View style={styles.impactGrid}>
          {preview.items.map((item) => (
            <View key={item.id} style={styles.impactPill}>
              <Text style={styles.impactPillDelta} numberOfLines={1}>
                {item.deltaLabel}
              </Text>
              <Text style={styles.impactPillLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={styles.impactPillDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </CreviaMotionView>
  );
}

type EventPlanResourceBalanceCardProps = {
  balance: EventPlanResourceBalance;
  reducedMotion?: boolean;
};

export function EventPlanResourceBalanceCard({
  balance,
  reducedMotion = false,
}: EventPlanResourceBalanceCardProps) {
  return (
    <CreviaMotionView
      motionKind="line_appear"
      surface="shared"
      index={1}
      reducedMotion={reducedMotion}
      style={styles.sectionWrap}>
      <View style={[styles.balanceCard, shadows.soft]}>
        <Text style={styles.sectionTitle}>{balance.title}</Text>
        <View style={styles.balanceRow}>
          {balance.items.map((item) => (
            <View
              key={item.label}
              style={[
                styles.balancePill,
                { borderColor: `${SUMMARY_TONE_COLORS[item.tone]}44` },
              ]}>
              <Text style={styles.balanceLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={styles.balanceValue} numberOfLines={1}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </CreviaMotionView>
  );
}

type EventPlanAdvisorCommentCardProps = {
  comment: EventPlanAdvisorComment;
  reducedMotion?: boolean;
};

export function EventPlanAdvisorCommentCard({
  comment,
  reducedMotion = false,
}: EventPlanAdvisorCommentCardProps) {
  const palette = ADVISOR_TONE[comment.tone];

  return (
    <CreviaMotionView
      motionKind="line_appear"
      surface="shared"
      index={2}
      reducedMotion={reducedMotion}
      style={styles.sectionWrap}>
      <View style={[styles.advisorCard, { borderColor: palette.border }]}>
        <View style={styles.advisorHeader}>
          <View style={styles.advisorMonogram}>
            <Text style={styles.advisorMonogramText}>E</Text>
          </View>
          <Text style={styles.advisorTitle} numberOfLines={1}>
            {comment.title}
          </Text>
          <View style={[styles.advisorTonePill, { backgroundColor: palette.pillBg }]}>
            <Ionicons name={palette.icon} size={11} color={palette.pillText} />
            <Text style={[styles.advisorToneText, { color: palette.pillText }]} numberOfLines={1}>
              {comment.toneLabel}
            </Text>
          </View>
        </View>
        <Text style={styles.advisorText} numberOfLines={2}>
          {comment.text}
        </Text>
      </View>
    </CreviaMotionView>
  );
}

type PlanSecondaryActionsRowProps = {
  actions: EventPlanAction[];
  onActionPress?: (actionKey: EventPlanAction['actionKey']) => void;
  reducedMotion?: boolean;
};

export function PlanSecondaryActionsRow({
  actions,
  onActionPress,
  reducedMotion = false,
}: PlanSecondaryActionsRowProps) {
  if (actions.length === 0) return null;

  return (
    <View style={styles.actionsWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsRow}>
        {actions.map((action, index) => (
          <CreviaMotionView
            key={action.id}
            motionKind="chip_appear"
            surface="shared"
            index={index}
            reducedMotion={reducedMotion}
            style={styles.actionMotion}>
            <Pressable
              onPress={() => onActionPress?.(action.actionKey)}
              style={({ pressed }) => [styles.actionChip, pressed && styles.actionChipPressed]}
              accessibilityRole="button"
              accessibilityLabel={action.label}>
              <Ionicons
                name={resolveIcon(action.iconKey)}
                size={13}
                color={eventDetail.tealDark}
              />
              <Text style={styles.actionLabel} numberOfLines={1}>
                {action.label}
              </Text>
            </Pressable>
          </CreviaMotionView>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrap: {
    marginHorizontal: eventDetail.screenPadding,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  phaseContextRow: {
    paddingHorizontal: eventDetail.screenPadding,
    gap: 8,
  },
  phaseContextMotion: {
    flexShrink: 0,
  },
  phaseContextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: eventDetail.card,
    borderWidth: 1,
  },
  phaseContextLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  phaseContextValue: {
    fontSize: 11,
    fontWeight: '800',
    color: eventDetail.textDark,
    maxWidth: 100,
  },
  contextCard: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.cardRadius,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    gap: 10,
  },
  contextChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  contextChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#F6F2EA',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  contextChipLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  contextChipValue: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.textDark,
    maxWidth: 72,
  },
  contextSummary: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 18,
  },
  strategyMotionWrap: {
    marginHorizontal: eventDetail.screenPadding,
  },
  strategyCard: {
    borderRadius: eventDetail.cardRadius,
    padding: 14,
    borderWidth: 1.5,
    gap: 10,
    backgroundColor: eventDetail.card,
  },
  strategyCardDefault: {
    borderColor: 'rgba(6, 63, 59, 0.08)',
  },
  strategyCardSelected: {
    backgroundColor: '#FFFCF5',
  },
  strategyCardIdle: {
    opacity: 0.94,
  },
  strategyPressed: {
    opacity: 0.92,
  },
  strategyHeader: {
    gap: 4,
  },
  strategyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    flexWrap: 'wrap',
  },
  strategyTitle: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  recommendedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(11, 107, 97, 0.12)',
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  selectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  selectedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  strategyDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 18,
  },
  prosConsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  proChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#E8F4EF',
    maxWidth: '48%',
    flexGrow: 1,
  },
  proText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: eventDetail.tealDark,
  },
  conChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFF4E5',
    maxWidth: '48%',
    flexGrow: 1,
  },
  conText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: '#9E6E0D',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
  },
  metaPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F6F2EA',
  },
  metaText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  impactCard: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.cardRadius,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    gap: 8,
  },
  impactHint: {
    fontSize: 12,
    fontWeight: '500',
    color: eventDetail.textMuted,
  },
  impactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  impactPill: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 0,
    borderRadius: 10,
    backgroundColor: '#F6F2EA',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  impactPillDelta: {
    fontSize: 10,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  impactPillLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  impactPillDescription: {
    fontSize: 10,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 14,
  },
  balanceCard: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.cardRadius,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    gap: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  balancePill: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 0,
    borderRadius: 10,
    backgroundColor: '#F6F2EA',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  balanceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  balanceValue: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  advisorCard: {
    backgroundColor: '#FFFCF5',
    borderRadius: eventDetail.cardRadius,
    padding: 12,
    borderWidth: 1,
    gap: 6,
  },
  advisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  advisorMonogram: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDF4E8',
  },
  advisorMonogramText: {
    fontSize: 13,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  advisorTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  advisorTonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  advisorToneText: {
    fontSize: 9,
    fontWeight: '800',
  },
  advisorText: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textDark,
    lineHeight: 18,
  },
  actionsWrap: {
    marginTop: 2,
  },
  actionsRow: {
    paddingHorizontal: eventDetail.screenPadding,
    gap: 8,
  },
  actionMotion: {
    flexShrink: 0,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: eventDetail.card,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.1)',
  },
  actionChipPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.textDark,
  },
});
