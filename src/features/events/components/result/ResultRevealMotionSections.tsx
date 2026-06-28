import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type {
  EventResultAction,
  EventResultAdvisorComment,
  EventResultImpactCard,
  EventResultOutcomeSummary,
  EventResultRevealItem,
  EventResultSelectedPlanContext,
} from '@/features/events/utils/eventResultRevealPresentation';
import type { PostDecisionCityReactionPresentation } from '@/features/events/utils/postDecisionCityReactionPresentation';
import type { SocialEchoPresentation } from '@/core/socialEcho';
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

const CITY_REACTION_TONE: Record<
  PostDecisionCityReactionPresentation['tone'],
  { color: string; bg: string; border: string; label: string }
> = {
  positive: {
    color: eventDetail.success,
    bg: 'rgba(62, 158, 106, 0.10)',
    border: 'rgba(62, 158, 106, 0.24)',
    label: 'Olumlu',
  },
  mixed: {
    color: eventDetail.tealDark,
    bg: 'rgba(11, 107, 97, 0.10)',
    border: 'rgba(11, 107, 97, 0.20)',
    label: 'Karma',
  },
  warning: {
    color: eventDetail.orange,
    bg: 'rgba(199, 137, 37, 0.12)',
    border: 'rgba(199, 137, 37, 0.28)',
    label: 'İzle',
  },
  critical: {
    color: '#B84A35',
    bg: 'rgba(184, 74, 53, 0.12)',
    border: 'rgba(184, 74, 53, 0.28)',
    label: 'Kritik',
  },
  neutral: {
    color: eventDetail.teal,
    bg: 'rgba(11, 107, 97, 0.08)',
    border: 'rgba(11, 107, 97, 0.16)',
    label: 'Dengeli',
  },
};

function resolveIcon(iconKey: string): IconName {
  const known: Record<string, IconName> = {
    'checkmark-circle-outline': 'checkmark-circle-outline',
    'alert-circle-outline': 'alert-circle-outline',
    'pulse-outline': 'pulse-outline',
    'document-text-outline': 'document-text-outline',
    'flag-outline': 'flag-outline',
    'people-outline': 'people-outline',
    'wallet-outline': 'wallet-outline',
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

type ResultImpactCardGridProps = {
  cards: EventResultImpactCard[];
  reducedMotion?: boolean;
};

export function ResultImpactCardGrid({
  cards,
  reducedMotion = false,
}: ResultImpactCardGridProps) {
  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="decision_result"
      index={1}
      reducedMotion={reducedMotion}
      style={styles.impactGrid}>
      {cards.map((card) => (
        <View key={card.id} style={[styles.impactCard, shadows.soft]}>
          <View style={styles.impactHeader}>
            <Ionicons
              name={resolveIcon(card.iconKey)}
              size={15}
              color={ITEM_TONE[card.tone]}
            />
            <Text style={[styles.impactDelta, { color: ITEM_TONE[card.tone] }]} numberOfLines={1}>
              {card.deltaText}
            </Text>
          </View>
          <Text style={styles.impactTitle} numberOfLines={1}>
            {card.title}
          </Text>
          <Text style={styles.impactBody} numberOfLines={2}>
            {card.body}
          </Text>
        </View>
      ))}
    </CreviaMotionView>
  );
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

type ResultCityReactionCardProps = {
  reaction: PostDecisionCityReactionPresentation;
  socialEcho?: SocialEchoPresentation | null;
  reducedMotion?: boolean;
};

export function ResultCityReactionCard({
  reaction,
  socialEcho,
  reducedMotion = false,
}: ResultCityReactionCardProps) {
  const tone = CITY_REACTION_TONE[reaction.tone];
  const socialTone = socialEcho ? CITY_REACTION_TONE[socialEcho.tone] : tone;

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="decision_result"
      index={2}
      reducedMotion={reducedMotion}
      style={[styles.cityReactionCard, { borderColor: tone.border }, shadows.soft]}>
      <View style={styles.cityReactionHeader}>
        <View style={[styles.cityReactionIcon, { backgroundColor: tone.bg }]}>
          <Ionicons name="pulse-outline" size={17} color={tone.color} />
        </View>
        <View style={styles.cityReactionTitleBlock}>
          <Text style={styles.cityReactionEyebrow} numberOfLines={1}>
            Şehir Tepkisi
          </Text>
          <Text style={styles.cityReactionTitle} numberOfLines={2}>
            {reaction.headline}
          </Text>
        </View>
        <View style={[styles.cityReactionToneChip, { backgroundColor: tone.bg }]}>
          <Text style={[styles.cityReactionToneText, { color: tone.color }]} numberOfLines={1}>
            {tone.label}
          </Text>
        </View>
      </View>

      <Text style={styles.cityReactionSummary} numberOfLines={2}>
        {reaction.shortSummary}
      </Text>

      <View style={styles.cityReactionImpactGrid}>
        {reaction.impactItems.map((item) => {
          const itemTone = CITY_REACTION_TONE[item.tone];
          return (
            <View key={item.id} style={[styles.cityReactionImpact, { borderColor: itemTone.border }]}>
              <Text style={styles.cityReactionImpactLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={[styles.cityReactionImpactValue, { color: itemTone.color }]} numberOfLines={1}>
                {item.valueText}
              </Text>
              <Text style={styles.cityReactionImpactLine} numberOfLines={2}>
                {item.line}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.cityReactionEchoList}>
        {reaction.resourceEchoes.slice(0, 4).map((echo) => {
          const echoTone = CITY_REACTION_TONE[echo.tone];
          return (
            <View key={echo.id} style={styles.cityReactionEchoRow}>
              <View style={styles.cityReactionEchoTitleWrap}>
                <Text style={styles.cityReactionEchoTitle} numberOfLines={1}>
                  {echo.title}
                </Text>
                <View style={[styles.cityReactionEchoStatus, { backgroundColor: echoTone.bg }]}>
                  <Text style={[styles.cityReactionEchoStatusText, { color: echoTone.color }]} numberOfLines={1}>
                    {echo.statusLabel}
                  </Text>
                </View>
              </View>
              <Text style={styles.cityReactionEchoLine} numberOfLines={1}>
                {echo.line}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.cityReactionSocialRow}>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={14}
          color={socialTone.color}
        />
        <View style={[styles.cityReactionSocialSource, { backgroundColor: socialTone.bg }]}>
          <Text
            style={[styles.cityReactionSocialSourceText, { color: socialTone.color }]}
            numberOfLines={1}>
            {socialEcho?.title ?? reaction.socialEcho.sourceLabel}
          </Text>
        </View>
        <Text style={styles.cityReactionSocialText} numberOfLines={2}>
          {socialEcho?.message ?? reaction.socialEcho.line}
        </Text>
      </View>
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
  impactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  impactCard: {
    flexBasis: '31%',
    flexGrow: 1,
    minHeight: 112,
    borderRadius: eventDetail.smallRadius,
    backgroundColor: eventDetail.card,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
    padding: 10,
    gap: 6,
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
  },
  impactDelta: {
    fontSize: 10,
    fontWeight: '900',
  },
  impactTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  impactBody: {
    fontSize: 10,
    lineHeight: 14,
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
  cityReactionCard: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 10,
    borderWidth: 1,
  },
  cityReactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  cityReactionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cityReactionTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cityReactionEyebrow: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    color: eventDetail.tealDark,
    textTransform: 'uppercase',
  },
  cityReactionTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  cityReactionToneChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  cityReactionToneText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
  },
  cityReactionSummary: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  cityReactionImpactGrid: {
    flexDirection: 'row',
    gap: 7,
  },
  cityReactionImpact: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    padding: 8,
    gap: 3,
  },
  cityReactionImpactLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    color: eventDetail.textMuted,
  },
  cityReactionImpactValue: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  cityReactionImpactLine: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    color: eventDetail.textDark,
  },
  cityReactionEchoList: {
    gap: 6,
  },
  cityReactionEchoRow: {
    borderRadius: 11,
    backgroundColor: 'rgba(6, 63, 59, 0.04)',
    paddingHorizontal: 9,
    paddingVertical: 7,
    gap: 3,
  },
  cityReactionEchoTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cityReactionEchoTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  cityReactionEchoStatus: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexShrink: 0,
  },
  cityReactionEchoStatusText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
  },
  cityReactionEchoLine: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  cityReactionSocialRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(11, 107, 97, 0.07)',
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  cityReactionSocialSource: {
    maxWidth: 106,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexShrink: 0,
  },
  cityReactionSocialSourceText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
  },
  cityReactionSocialText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
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
