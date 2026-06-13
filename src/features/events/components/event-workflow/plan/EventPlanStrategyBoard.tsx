import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { operationMotionPlanSelectDurationMs } from '@/core/motion/operationMotionTokens';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type {
  EventPlanAdvisorComment,
  EventPlanExpectedImpact,
  EventPlanImpactPreview,
  EventPlanInspectSummaryItem,
  EventPlanStrategyCard,
} from '@/features/events/utils/eventPlanPhasePresentation';
import { CreviaMotionView } from '@/shared/motion';
import { shadows } from '@/ui/theme/shadows';

type IconName = ComponentProps<typeof Ionicons>['name'];

const SUMMARY_TONE_COLORS: Record<EventPlanInspectSummaryItem['tone'], string> = {
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

const IMPACT_BAND_LABEL: Record<EventPlanExpectedImpact['band'], string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
};

const ADVISOR_TONE: Record<
  EventPlanAdvisorComment['tone'],
  { border: string; icon: IconName }
> = {
  calm: { border: 'rgba(11, 107, 97, 0.18)', icon: 'leaf-outline' },
  teaching: { border: 'rgba(216, 167, 46, 0.35)', icon: 'school-outline' },
  warning: { border: 'rgba(199, 137, 37, 0.35)', icon: 'alert-circle-outline' },
  positive: { border: 'rgba(62, 158, 106, 0.28)', icon: 'checkmark-circle-outline' },
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
  };
  return known[iconKey] ?? 'ellipse-outline';
}

type PlanInspectSummaryStripProps = {
  items: EventPlanInspectSummaryItem[];
  reducedMotion?: boolean;
};

export function PlanInspectSummaryStrip({
  items,
  reducedMotion = false,
}: PlanInspectSummaryStripProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.summaryRow}>
      {items.map((item, index) => (
        <CreviaMotionView
          key={item.id}
          motionKind="chip_appear"
          surface="shared"
          index={index}
          reducedMotion={reducedMotion}
          style={styles.summaryChipMotion}>
          <View
            style={[
              styles.summaryChip,
              { borderColor: `${SUMMARY_TONE_COLORS[item.tone]}44` },
            ]}>
            <Ionicons
              name={resolveIcon(item.iconKey)}
              size={12}
              color={SUMMARY_TONE_COLORS[item.tone]}
            />
            <Text style={styles.summaryLabel} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        </CreviaMotionView>
      ))}
    </ScrollView>
  );
}

type EventPlanStrategyCardViewProps = {
  strategy: EventPlanStrategyCard;
  onSelect: () => void;
  reducedMotion?: boolean;
};

export function EventPlanStrategyCardView({
  strategy,
  onSelect,
  reducedMotion = false,
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
          </View>
          <Text style={styles.strategyDescription} numberOfLines={2}>
            {strategy.description}
          </Text>
        </View>

        <View style={styles.tradeoffRow}>
          {strategy.tradeoffs.slice(0, 4).map((tradeoff) => (
            <View key={tradeoff.id} style={styles.tradeoffPill}>
              <Ionicons
                name={resolveIcon(tradeoff.iconKey)}
                size={11}
                color={eventDetail.tealDark}
              />
              <Text style={styles.tradeoffLabel} numberOfLines={1}>
                {tradeoff.label}
              </Text>
              <Text style={styles.tradeoffValue} numberOfLines={1}>
                {tradeoff.valueText}
              </Text>
            </View>
          ))}
        </View>
      </Pressable>
    </Animated.View>
  );
}

type EventPlanImpactPreviewCardProps = {
  preview: EventPlanImpactPreview;
  reducedMotion?: boolean;
};

export function EventPlanImpactPreviewCard({
  preview,
  reducedMotion = false,
}: EventPlanImpactPreviewCardProps) {
  return (
    <CreviaMotionView
      motionKind="line_appear"
      surface="shared"
      index={0}
      reducedMotion={reducedMotion}
      style={styles.impactMotionWrap}>
      <View style={[styles.impactCard, shadows.soft]}>
        <Text style={styles.impactTitle} numberOfLines={1}>
          {preview.title}
        </Text>
        <Text style={styles.impactSummary} numberOfLines={2}>
          {preview.summary}
        </Text>
        <View style={styles.impactGrid}>
          {preview.impacts.map((impact) => (
            <View key={impact.id} style={styles.impactPill}>
              <Text style={styles.impactPillLabel} numberOfLines={1}>
                {impact.label}
              </Text>
              <Text style={styles.impactPillValue} numberOfLines={1}>
                {IMPACT_BAND_LABEL[impact.band]}
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
      index={1}
      reducedMotion={reducedMotion}
      style={styles.advisorMotionWrap}>
      <View style={[styles.advisorCard, { borderColor: palette.border }]}>
        <View style={styles.advisorHeader}>
          <Ionicons name={palette.icon} size={16} color={eventDetail.tealDark} />
          <Text style={styles.advisorTitle} numberOfLines={1}>
            {comment.title}
          </Text>
        </View>
        <Text style={styles.advisorText} numberOfLines={3}>
          {comment.text}
        </Text>
      </View>
    </CreviaMotionView>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    paddingHorizontal: eventDetail.screenPadding,
    gap: 8,
  },
  summaryChipMotion: {
    flexShrink: 0,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: eventDetail.card,
    borderWidth: 1,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: eventDetail.textDark,
    maxWidth: 120,
  },
  strategyCard: {
    marginHorizontal: eventDetail.screenPadding,
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
    opacity: 0.92,
  },
  strategyPressed: {
    opacity: 0.94,
  },
  strategyHeader: {
    gap: 4,
  },
  strategyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  strategyTitle: {
    flex: 1,
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
  strategyDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 17,
  },
  tradeoffRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tradeoffPill: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 0,
    borderRadius: 8,
    backgroundColor: '#F6F2EA',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 2,
  },
  tradeoffLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  tradeoffValue: {
    fontSize: 11,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  impactMotionWrap: {
    marginHorizontal: eventDetail.screenPadding,
  },
  impactCard: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.cardRadius,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    gap: 8,
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  impactSummary: {
    fontSize: 12,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 17,
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
    borderRadius: 8,
    backgroundColor: '#E8F4EF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 2,
  },
  impactPillLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  impactPillValue: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  advisorMotionWrap: {
    marginHorizontal: eventDetail.screenPadding,
  },
  advisorCard: {
    backgroundColor: '#FFFCF5',
    borderRadius: eventDetail.cardRadius,
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  advisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  advisorTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  advisorText: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textDark,
    lineHeight: 18,
  },
});
