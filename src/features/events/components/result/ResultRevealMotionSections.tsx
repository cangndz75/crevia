import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type {
  EventResultAction,
  EventResultAdvisorComment,
  EventResultOutcomeSummary,
  EventResultRevealItem,
  EventResultSelectedPlanContext,
} from '@/features/events/utils/eventResultRevealPresentation';
import { CreviaMotionView } from '@/shared/motion';
import { CreviaAnimatedPressable } from '@/core/animations/CreviaAnimatedPressable';
import { shadows } from '@/ui/theme/shadows';

type IconName = ComponentProps<typeof Ionicons>['name'];

const OUTCOME_TONE: Record<EventResultOutcomeSummary['tone'], string> = {
  positive: eventDetail.success,
  neutral: eventDetail.teal,
  warning: eventDetail.orange,
};

const ITEM_TONE: Record<EventResultRevealItem['tone'], string> = {
  positive: eventDetail.success,
  neutral: eventDetail.teal,
  warning: eventDetail.orange,
  gold: '#C58B18',
};

const ADVISOR_TONE: Record<
  EventResultAdvisorComment['tone'],
  { border: string; icon: IconName }
> = {
  calm: { border: 'rgba(11, 107, 97, 0.18)', icon: 'leaf-outline' },
  teaching: { border: 'rgba(216, 167, 46, 0.35)', icon: 'school-outline' },
  warning: { border: 'rgba(199, 137, 37, 0.35)', icon: 'alert-circle-outline' },
  positive: { border: 'rgba(62, 158, 106, 0.28)', icon: 'checkmark-circle-outline' },
};

function resolveIcon(iconKey: string): IconName {
  const known: Record<string, IconName> = {
    'checkmark-circle-outline': 'checkmark-circle-outline',
    'alert-circle-outline': 'alert-circle-outline',
    'pulse-outline': 'pulse-outline',
    'document-text-outline': 'document-text-outline',
    'flag-outline': 'flag-outline',
    'cube-outline': 'cube-outline',
    'location-outline': 'location-outline',
    'chatbubbles-outline': 'chatbubbles-outline',
    'calendar-outline': 'calendar-outline',
    'star-outline': 'star-outline',
    'ribbon-outline': 'ribbon-outline',
    'shield-outline': 'shield-outline',
    'git-branch-outline': 'git-branch-outline',
    'bookmark-outline': 'bookmark-outline',
    'library-outline': 'library-outline',
  };
  return known[iconKey] ?? 'ellipse-outline';
}

type ResultOutcomeHeroProps = {
  outcome: EventResultOutcomeSummary;
  reducedMotion?: boolean;
};

export function ResultOutcomeHero({
  outcome,
  reducedMotion = false,
}: ResultOutcomeHeroProps) {
  return (
    <CreviaMotionView
      motionKind="result_emphasis"
      surface="decision_result"
      index={0}
      reducedMotion={reducedMotion}
      intensity="highlighted"
      style={[styles.outcomeCard, shadows.soft]}>
      <View style={styles.outcomeHeader}>
        <View
          style={[
            styles.outcomeIcon,
            { borderColor: OUTCOME_TONE[outcome.tone] },
          ]}>
          <Ionicons
            name={resolveIcon(outcome.iconKey)}
            size={22}
            color={OUTCOME_TONE[outcome.tone]}
          />
        </View>
        <View style={styles.outcomeCopy}>
          <Text style={styles.outcomeLabel} numberOfLines={1}>
            {outcome.label}
          </Text>
          <Text style={styles.outcomeBody} numberOfLines={2}>
            {outcome.body}
          </Text>
        </View>
      </View>
    </CreviaMotionView>
  );
}

type ResultRevealItemCardProps = {
  item: EventResultRevealItem;
  index: number;
  reducedMotion?: boolean;
};

export function ResultRevealItemCard({
  item,
  index,
  reducedMotion = false,
}: ResultRevealItemCardProps) {
  const accessibilityLabel = `${item.title}. ${item.body}`;

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="decision_result"
      index={index + 1}
      reducedMotion={reducedMotion}
      style={[styles.revealCard, shadows.soft]}>
      <View accessible accessibilityRole="text" accessibilityLabel={accessibilityLabel}>
      <View style={styles.revealHeader}>
        <Ionicons
          name={resolveIcon(item.iconKey)}
          size={16}
          color={ITEM_TONE[item.tone]}
          importantForAccessibility="no"
        />
        <Text style={styles.revealTitle} numberOfLines={1}>
          {item.title}
        </Text>
        {item.deltaText ? (
          <Text style={[styles.revealDelta, { color: ITEM_TONE[item.tone] }]} numberOfLines={1}>
            {item.deltaText}
          </Text>
        ) : null}
      </View>
      <Text style={styles.revealBody} numberOfLines={2}>
        {item.body}
      </Text>
      <Text style={styles.revealSource} numberOfLines={1}>
        {item.sourceLabel}
      </Text>
      </View>
    </CreviaMotionView>
  );
}

type ResultPlanContextStripProps = {
  context: EventResultSelectedPlanContext;
  reducedMotion?: boolean;
};

export function ResultPlanContextStrip({
  context,
  reducedMotion = false,
}: ResultPlanContextStripProps) {
  return (
    <CreviaMotionView
      motionKind="chip_appear"
      surface="decision_result"
      index={0}
      reducedMotion={reducedMotion}
      style={[styles.planStrip, shadows.soft]}>
      <Text style={styles.planLabel} numberOfLines={1}>
        {context.label}
      </Text>
      <Text style={styles.planLine} numberOfLines={2}>
        {context.resultLine}
      </Text>
    </CreviaMotionView>
  );
}

type ResultAdvisorCommentCardProps = {
  comment: EventResultAdvisorComment;
  reducedMotion?: boolean;
};

export function ResultAdvisorCommentCard({
  comment,
  reducedMotion = false,
}: ResultAdvisorCommentCardProps) {
  const tone = ADVISOR_TONE[comment.tone];

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="decision_result"
      index={8}
      reducedMotion={reducedMotion}
      style={[styles.advisorCard, { borderColor: tone.border }]}>
      <View style={styles.advisorHeader}>
        <Ionicons name={tone.icon} size={16} color={eventDetail.tealDark} />
        <Text style={styles.advisorTitle} numberOfLines={1}>
          {comment.title}
        </Text>
      </View>
      <Text style={styles.advisorText} numberOfLines={3}>
        {comment.text}
      </Text>
    </CreviaMotionView>
  );
}

type ResultFinalActionsProps = {
  actions: EventResultAction[];
  onAction: (action: EventResultAction) => void;
  reducedMotion?: boolean;
};

export function ResultFinalActions({
  actions,
  onAction,
  reducedMotion = false,
}: ResultFinalActionsProps) {
  const primary = actions[0];
  const secondary = actions.slice(1).filter((action) => action.enabled);

  if (!primary) return null;

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="decision_result"
      index={9}
      reducedMotion={reducedMotion}
      style={styles.actionsWrap}>
      <CreviaAnimatedPressable
        onPress={() => onAction(primary)}
        disabled={!primary.enabled}
        reduceMotion={reducedMotion}
        accessibilityRole="button"
        accessibilityLabel={primary.label}
        accessibilityState={{ disabled: !primary.enabled }}
        style={[styles.primaryCta, !primary.enabled && styles.ctaDisabled]}>
        <Ionicons name="home-outline" size={18} color="#FFFFFF" />
        <Text style={styles.primaryCtaText} numberOfLines={1}>
          {primary.label}
        </Text>
      </CreviaAnimatedPressable>

      {secondary.map((action) => (
        <CreviaAnimatedPressable
          key={action.id}
          onPress={() => onAction(action)}
          disabled={!action.enabled}
          reduceMotion={reducedMotion}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          accessibilityState={{ disabled: !action.enabled }}
          style={[styles.secondaryCta, !action.enabled && styles.ctaDisabled]}>
          <Text style={styles.secondaryCtaText} numberOfLines={1}>
            {action.label}
          </Text>
        </CreviaAnimatedPressable>
      ))}
    </CreviaMotionView>
  );
}

const styles = StyleSheet.create({
  outcomeCard: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
  },
  outcomeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  outcomeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    flexShrink: 0,
  },
  outcomeCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  outcomeLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  outcomeBody: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  revealCard: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  revealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  revealTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  revealDelta: {
    fontSize: 11,
    fontWeight: '800',
    flexShrink: 0,
  },
  revealBody: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  revealSource: {
    fontSize: 10,
    fontWeight: '700',
    color: eventDetail.tealDark,
    opacity: 0.85,
  },
  planStrip: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderLeftColor: eventDetail.teal,
    gap: 4,
  },
  planLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  planLine: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  advisorCard: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 6,
    borderWidth: 1,
  },
  advisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  advisorTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  advisorText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: eventDetail.textDark,
  },
  actionsWrap: {
    gap: 10,
  },
  primaryCta: {
    minHeight: eventDetail.ctaHeight,
    borderRadius: 999,
    backgroundColor: eventDetail.teal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  primaryCtaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryCta: {
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.12)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryCtaText: {
    fontSize: 14,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
});
