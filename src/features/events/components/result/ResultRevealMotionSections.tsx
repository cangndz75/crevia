import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type {
  EventResultAction,
  EventResultAdvisorComment,
  EventResultCityImpactSection,
  EventResultDistrictReaction,
  EventResultImpactCard,
  EventResultOutcomeSummary,
  EventResultOutcomeTone,
  EventResultReportBridge,
  EventResultResourceCostSection,
  EventResultRevealItem,
  EventResultSecondaryAction,
  EventResultSelectedPlanOutcome,
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

const RESULT_TONE: Record<EventResultOutcomeTone, { color: string; bg: string; border: string }> =
  {
    positive: {
      color: eventDetail.success,
      bg: 'rgba(62, 158, 106, 0.12)',
      border: 'rgba(62, 158, 106, 0.24)',
    },
    mixed: {
      color: eventDetail.tealDark,
      bg: 'rgba(11, 107, 97, 0.10)',
      border: 'rgba(11, 107, 97, 0.20)',
    },
    warning: {
      color: eventDetail.orange,
      bg: 'rgba(199, 137, 37, 0.12)',
      border: 'rgba(199, 137, 37, 0.28)',
    },
    critical: {
      color: '#B84A35',
      bg: 'rgba(184, 74, 53, 0.12)',
      border: 'rgba(184, 74, 53, 0.28)',
    },
    neutral: {
      color: eventDetail.teal,
      bg: 'rgba(11, 107, 97, 0.08)',
      border: 'rgba(11, 107, 97, 0.16)',
    },
  };

const DISTRICT_TONE: Record<EventResultDistrictReaction['tone'], string> = {
  positive: eventDetail.success,
  mixed: eventDetail.tealDark,
  warning: eventDetail.orange,
  critical: '#B84A35',
  neutral: eventDetail.teal,
};

const ITEM_TONE: Record<EventResultRevealItem['tone'], string> = {
  positive: eventDetail.success,
  neutral: eventDetail.teal,
  warning: eventDetail.orange,
  gold: '#C58B18',
};

const ADVISOR_TONE: Record<
  EventResultAdvisorComment['tone'],
  { border: string; icon: IconName; pillBg: string; pillText: string }
> = {
  calm: {
    border: 'rgba(11, 107, 97, 0.18)',
    icon: 'leaf-outline',
    pillBg: 'rgba(11, 107, 97, 0.1)',
    pillText: eventDetail.tealDark,
  },
  teaching: {
    border: 'rgba(216, 167, 46, 0.35)',
    icon: 'school-outline',
    pillBg: 'rgba(216, 167, 46, 0.14)',
    pillText: '#B77713',
  },
  warning: {
    border: 'rgba(199, 137, 37, 0.35)',
    icon: 'alert-circle-outline',
    pillBg: 'rgba(199, 137, 37, 0.14)',
    pillText: eventDetail.orange,
  },
  positive: {
    border: 'rgba(62, 158, 106, 0.28)',
    icon: 'checkmark-circle-outline',
    pillBg: 'rgba(62, 158, 106, 0.12)',
    pillText: eventDetail.success,
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
    'shield-checkmark-outline': 'shield-checkmark-outline',
    'chatbubble-ellipses-outline': 'chatbubble-ellipses-outline',
    'map-outline': 'map-outline',
    'arrow-forward': 'arrow-forward',
  };
  return known[iconKey] ?? 'ellipse-outline';
}

type ResultPhaseHeaderProps = {
  title: string;
  subtitle?: string;
  sourceShort?: string;
  xpLabel?: string;
};

export function ResultPhaseHeader({
  title,
  subtitle,
  sourceShort,
  xpLabel,
}: ResultPhaseHeaderProps) {
  return (
    <CreviaMotionView motionKind="card_enter" surface="shared" index={0} style={styles.phaseHeader}>
      <View style={styles.phaseHeaderSpacer} />
      <View style={styles.phaseHeaderTitleBlock}>
        <Text style={styles.phaseHeaderTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.phaseHeaderSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : (
          <View style={styles.phaseHeaderAccent}>
            <View style={styles.phaseHeaderAccentLine} />
            <Ionicons name="sparkles" size={10} color="#C58B18" />
            <View style={styles.phaseHeaderAccentLine} />
          </View>
        )}
      </View>
      <View style={styles.resourceBadges}>
        {sourceShort ? (
          <View style={[styles.resourceBadge, styles.resourceBadgeMint]}>
            <Ionicons name="diamond-outline" size={13} color={eventDetail.teal} />
            <Text style={styles.resourceText}>{sourceShort}</Text>
          </View>
        ) : null}
        {xpLabel ? (
          <View style={[styles.resourceBadge, styles.resourceBadgeGold]}>
            <Ionicons name="star-outline" size={13} color="#B77713" />
            <Text style={[styles.resourceText, styles.resourceTextGold]}>{xpLabel}</Text>
          </View>
        ) : null}
      </View>
    </CreviaMotionView>
  );
}

type ResultPhaseHeadingProps = {
  heading: string;
  description: string;
};

export function ResultPhaseHeading({ heading, description }: ResultPhaseHeadingProps) {
  return (
    <View style={styles.phaseHeadingWrap}>
      <Text style={styles.phaseHeading}>{heading}</Text>
      <Text style={styles.phaseDescription}>{description}</Text>
    </View>
  );
}

type ResultCityImpactGridProps = {
  section: EventResultCityImpactSection;
  reducedMotion?: boolean;
};

export function ResultCityImpactGrid({
  section,
  reducedMotion = false,
}: ResultCityImpactGridProps) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <CreviaMotionView
        motionKind="card_enter"
        surface="decision_result"
        index={2}
        reducedMotion={reducedMotion}
        style={styles.impactGrid}>
        {section.items.map((card, cardIndex) => (
          <View
            key={card.id}
            style={[
              styles.impactCard,
              shadows.soft,
              cardIndex % 2 === 0 && styles.impactCardLeft,
            ]}>
            <View style={styles.impactHeader}>
              <Ionicons
                name={resolveIcon(card.iconKey)}
                size={15}
                color={ITEM_TONE[card.tone]}
              />
              <Text
                style={[styles.impactValueLabel, { color: ITEM_TONE[card.tone] }]}
                numberOfLines={1}>
                {card.valueLabel}
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
    </View>
  );
}

/** @deprecated use ResultCityImpactGrid */
export function ResultImpactCardGrid({
  cards,
  reducedMotion = false,
}: {
  cards: EventResultImpactCard[];
  reducedMotion?: boolean;
}) {
  return (
    <ResultCityImpactGrid
      section={{ title: 'Şehir Etkisi', items: cards }}
      reducedMotion={reducedMotion}
    />
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
  const toneStyle = RESULT_TONE[outcome.resultTone];

  return (
    <CreviaMotionView
      motionKind="result_emphasis"
      surface="decision_result"
      index={0}
      reducedMotion={reducedMotion}
      intensity="highlighted"
      style={[
        styles.outcomeCard,
        shadows.soft,
        { borderColor: toneStyle.border, backgroundColor: '#FFFDF7' },
      ]}>
      <View style={styles.outcomeTopRow}>
        <Text style={styles.outcomeSectionTitle} numberOfLines={1}>
          {outcome.label}
        </Text>
        <View style={[styles.outcomeStatusPill, { backgroundColor: toneStyle.bg }]}>
          <Text style={[styles.outcomeStatusText, { color: toneStyle.color }]} numberOfLines={1}>
            {outcome.statusLabel}
          </Text>
        </View>
      </View>
      <Text style={styles.outcomeEventTitle} numberOfLines={2}>
        {outcome.eventTitle}
      </Text>
      <View style={styles.outcomeMetaRow}>
        <Ionicons name="location-outline" size={12} color={eventDetail.teal} />
        <Text style={styles.outcomeMetaText} numberOfLines={1}>
          {outcome.districtName}
        </Text>
      </View>
      <Text style={styles.outcomeBody} numberOfLines={3}>
        {outcome.body}
      </Text>
    </CreviaMotionView>
  );
}

type ResultDistrictReactionCardProps = {
  reaction: EventResultDistrictReaction;
  reducedMotion?: boolean;
};

export function ResultDistrictReactionCard({
  reaction,
  reducedMotion = false,
}: ResultDistrictReactionCardProps) {
  const color = DISTRICT_TONE[reaction.tone];

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="decision_result"
      index={3}
      reducedMotion={reducedMotion}
      style={[styles.districtCard, shadows.soft]}>
      <Text style={styles.sectionTitle}>{reaction.title}</Text>
      <View style={styles.districtQuoteRow}>
        <View style={[styles.districtSourcePill, { backgroundColor: `${color}18` }]}>
          <Text style={[styles.districtSourceText, { color }]} numberOfLines={1}>
            {reaction.sourceLabel}
          </Text>
        </View>
        <Text style={styles.districtMessage} numberOfLines={2}>
          {reaction.message}
        </Text>
      </View>
    </CreviaMotionView>
  );
}

type ResultResourceCostCardProps = {
  section: EventResultResourceCostSection;
  reducedMotion?: boolean;
  onMaintenanceAction?: () => void;
  maintenanceActionFeedback?: string | null;
};

export function ResultResourceCostCard({
  section,
  reducedMotion = false,
  onMaintenanceAction,
  maintenanceActionFeedback,
}: ResultResourceCostCardProps) {
  const maintenanceAction = section.maintenanceAction;

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="decision_result"
      index={4}
      reducedMotion={reducedMotion}
      style={[styles.resourceCostCard, shadows.soft]}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.resourceCostSummary} numberOfLines={2}>
        {section.summary}
      </Text>
      {section.maintenanceHint ? (
        <Text
          style={[
            styles.resourceCostMaintenanceHint,
            {
              color:
                section.maintenanceHintTone === 'critical'
                  ? '#C44B3F'
                  : section.maintenanceHintTone === 'warning'
                    ? eventDetail.orange
                    : eventDetail.textMuted,
            },
          ]}
          numberOfLines={2}>
          {section.maintenanceHint}
        </Text>
      ) : null}
      {maintenanceAction ? (
        <View style={styles.maintenanceActionBlock}>
          <Pressable
            accessibilityRole="button"
            disabled={!maintenanceAction.enabled || !onMaintenanceAction}
            onPress={() => {
              if (!maintenanceAction.enabled || !onMaintenanceAction) return;
              void playLightImpactHaptic();
              onMaintenanceAction();
            }}
            style={({ pressed }) => [
              styles.maintenanceActionButton,
              !maintenanceAction.enabled && styles.maintenanceActionButtonDisabled,
              pressed && maintenanceAction.enabled && styles.maintenanceActionButtonPressed,
            ]}>
            <Text style={styles.maintenanceActionLabel} numberOfLines={1}>
              {maintenanceAction.label}
              {maintenanceAction.compactPreview
                ? ` · ${maintenanceAction.compactPreview}`
                : ''}
            </Text>
          </Pressable>
          {maintenanceActionFeedback ? (
            <Text style={styles.maintenanceActionFeedback} numberOfLines={2}>
              {maintenanceActionFeedback}
            </Text>
          ) : (
            <Text style={styles.maintenanceActionDescription} numberOfLines={3}>
              {maintenanceAction.effectPreview
                ? `${maintenanceAction.effectPreview} ${maintenanceAction.costPreview ?? ''}`.trim()
                : maintenanceAction.description}
            </Text>
          )}
        </View>
      ) : null}
      <View style={styles.resourceCostRow}>
        {section.items.map((item) => (
          <View key={item.id} style={styles.resourceCostChip}>
            <Text style={styles.resourceCostChipLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Text
              style={[
                styles.resourceCostChipValue,
                { color: ITEM_TONE[item.tone === 'positive' ? 'positive' : item.tone] },
              ]}
              numberOfLines={1}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </CreviaMotionView>
  );
}

type ResultSelectedPlanOutcomeCardProps = {
  outcome: EventResultSelectedPlanOutcome;
  reducedMotion?: boolean;
};

export function ResultSelectedPlanOutcomeCard({
  outcome,
  reducedMotion = false,
}: ResultSelectedPlanOutcomeCardProps) {
  return (
    <CreviaMotionView
      motionKind="chip_appear"
      surface="decision_result"
      index={5}
      reducedMotion={reducedMotion}
      style={[styles.planOutcomeCard, shadows.soft]}>
      <Text style={styles.sectionTitle}>{outcome.title}</Text>
      <View style={styles.planOutcomeTagRow}>
        <View style={styles.planOutcomeTag}>
          <Text style={styles.planOutcomeTagText} numberOfLines={1}>
            {outcome.planLabel}
          </Text>
        </View>
      </View>
      <Text style={styles.planOutcomeSummary} numberOfLines={2}>
        {outcome.summary}
      </Text>
    </CreviaMotionView>
  );
}

type ResultReportBridgeCardProps = {
  bridge: EventResultReportBridge;
  reducedMotion?: boolean;
};

export function ResultReportBridgeCard({
  bridge,
  reducedMotion = false,
}: ResultReportBridgeCardProps) {
  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="decision_result"
      index={7}
      reducedMotion={reducedMotion}
      style={[styles.reportBridgeCard, shadows.soft]}>
      <Text style={styles.sectionTitle}>{bridge.title}</Text>
      <Text style={styles.reportBridgeSummary} numberOfLines={2}>
        {bridge.summary}
      </Text>
      <View style={styles.reportBridgeChipRow}>
        {bridge.chips.map((chip) => (
          <View key={chip.label} style={styles.reportBridgeChip}>
            <Text style={styles.reportBridgeChipLabel} numberOfLines={1}>
              {chip.label}
            </Text>
            <Text
              style={[
                styles.reportBridgeChipValue,
                { color: ITEM_TONE[chip.tone === 'positive' ? 'positive' : chip.tone] },
              ]}
              numberOfLines={1}>
              {chip.value}
            </Text>
          </View>
        ))}
      </View>
    </CreviaMotionView>
  );
}

type ResultSecondaryActionsRowProps = {
  actions: EventResultSecondaryAction[];
  onAction: (action: EventResultSecondaryAction) => void;
  reducedMotion?: boolean;
};

export function ResultSecondaryActionsRow({
  actions,
  onAction,
  reducedMotion = false,
}: ResultSecondaryActionsRowProps) {
  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="decision_result"
      index={8}
      reducedMotion={reducedMotion}
      style={styles.secondaryActionsGrid}>
      {actions.map((action) => (
        <CreviaAnimatedPressable
          key={action.id}
          onPress={() => onAction(action)}
          disabled={!action.enabled}
          reduceMotion={reducedMotion}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={[styles.secondaryActionTile, !action.enabled && styles.ctaDisabled]}>
          <Ionicons name={resolveIcon(action.iconKey)} size={16} color={eventDetail.tealDark} />
          <Text style={styles.secondaryActionLabel} numberOfLines={2}>
            {action.label}
          </Text>
        </CreviaAnimatedPressable>
      ))}
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
      index={6}
      reducedMotion={reducedMotion}
      style={[styles.advisorCard, { borderColor: tone.border }]}>
      <View style={styles.advisorHeader}>
        <View style={styles.advisorMonogram}>
          <Text style={styles.advisorMonogramText}>E</Text>
        </View>
        <Text style={styles.advisorTitle} numberOfLines={1}>
          {comment.title}
        </Text>
        <View style={[styles.advisorTonePill, { backgroundColor: tone.pillBg }]}>
          <Text style={[styles.advisorTonePillText, { color: tone.pillText }]} numberOfLines={1}>
            {comment.toneLabel}
          </Text>
        </View>
      </View>
      <Text style={styles.advisorText} numberOfLines={2}>
        {comment.text}
      </Text>
    </CreviaMotionView>
  );
}

type ResultFinalActionsProps = {
  primary: EventResultAction;
  secondary?: EventResultAction[];
  onAction: (action: EventResultAction) => void;
  reducedMotion?: boolean;
};

export function ResultFinalActions({
  primary,
  secondary = [],
  onAction,
  reducedMotion = false,
}: ResultFinalActionsProps) {
  const enabledSecondary = secondary.filter((action) => action.enabled);

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
        <Text style={styles.primaryCtaText} numberOfLines={1}>
          {primary.label}
        </Text>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </CreviaAnimatedPressable>

      {enabledSecondary.map((action) => (
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
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
    minWidth: 0,
  },
  phaseHeaderSpacer: {
    width: 40,
    flexShrink: 0,
  },
  phaseHeaderTitleBlock: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 4,
  },
  phaseHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  phaseHeaderSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  phaseHeaderAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    justifyContent: 'center',
  },
  phaseHeaderAccentLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(6, 63, 59, 0.10)',
    maxWidth: 48,
  },
  resourceBadges: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 0,
  },
  resourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
  },
  resourceBadgeMint: {
    backgroundColor: 'rgba(11, 107, 97, 0.08)',
    borderColor: 'rgba(11, 107, 97, 0.14)',
  },
  resourceBadgeGold: {
    backgroundColor: 'rgba(216, 167, 46, 0.12)',
    borderColor: 'rgba(216, 167, 46, 0.22)',
  },
  resourceText: {
    fontSize: 11,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  resourceTextGold: {
    color: '#B77713',
  },
  phaseHeadingWrap: {
    gap: 4,
    paddingHorizontal: 2,
  },
  phaseHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  phaseDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  sectionWrap: {
    gap: 8,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  outcomeCard: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 14,
    borderWidth: 1,
    gap: 8,
    minWidth: 0,
  },
  outcomeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  outcomeSectionTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.tealDark,
    textTransform: 'uppercase',
  },
  outcomeStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexShrink: 0,
  },
  outcomeStatusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  outcomeEventTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: eventDetail.textDark,
    lineHeight: 22,
  },
  outcomeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  outcomeMetaText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.teal,
  },
  outcomeBody: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  impactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    minWidth: 0,
  },
  impactCard: {
    width: '48%',
    flexGrow: 1,
    minHeight: 108,
    borderRadius: eventDetail.smallRadius,
    backgroundColor: eventDetail.card,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
    padding: 10,
    gap: 5,
    minWidth: 0,
  },
  impactCardLeft: {},
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
  },
  impactValueLabel: {
    fontSize: 11,
    fontWeight: '900',
    flexShrink: 1,
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
  districtCard: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
    minWidth: 0,
  },
  districtQuoteRow: {
    gap: 6,
    minWidth: 0,
  },
  districtSourcePill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  districtSourceText: {
    fontSize: 10,
    fontWeight: '900',
  },
  districtMessage: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: eventDetail.textDark,
  },
  resourceCostCard: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
    minWidth: 0,
  },
  resourceCostSummary: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  resourceCostMaintenanceHint: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  maintenanceActionBlock: {
    marginTop: 8,
    gap: 6,
  },
  maintenanceActionButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.14)',
    backgroundColor: 'rgba(6, 63, 59, 0.04)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  maintenanceActionButtonPressed: {
    opacity: 0.88,
  },
  maintenanceActionButtonDisabled: {
    opacity: 0.45,
  },
  maintenanceActionLabel: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  maintenanceActionDescription: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: eventDetail.textMuted,
  },
  maintenanceActionFeedback: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: eventDetail.success,
  },
  resourceCostRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  resourceCostChip: {
    flex: 1,
    minWidth: '30%',
    borderRadius: 10,
    backgroundColor: 'rgba(6, 63, 59, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 2,
  },
  resourceCostChipLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.textMuted,
  },
  resourceCostChipValue: {
    fontSize: 12,
    fontWeight: '900',
  },
  planOutcomeCard: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
    minWidth: 0,
  },
  planOutcomeTagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  planOutcomeTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(11, 107, 97, 0.10)',
  },
  planOutcomeTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  planOutcomeSummary: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: eventDetail.textDark,
  },
  reportBridgeCard: {
    backgroundColor: '#F4FBF8',
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(31, 107, 94, 0.16)',
    minWidth: 0,
  },
  reportBridgeSummary: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: '#2A5C56',
  },
  reportBridgeChipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reportBridgeChip: {
    flex: 1,
    minWidth: 0,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(31, 107, 94, 0.10)',
  },
  reportBridgeChipLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.textMuted,
  },
  reportBridgeChipValue: {
    fontSize: 12,
    fontWeight: '900',
  },
  secondaryActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  secondaryActionTile: {
    width: '31%',
    flexGrow: 1,
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.10)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 8,
    minWidth: 0,
  },
  secondaryActionLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    color: eventDetail.tealDark,
    textAlign: 'center',
  },
  advisorCard: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    minWidth: 0,
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
    borderRadius: 14,
    backgroundColor: 'rgba(11, 107, 97, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  advisorMonogramText: {
    fontSize: 13,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  advisorTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  advisorTonePill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  advisorTonePillText: {
    fontSize: 10,
    fontWeight: '900',
  },
  advisorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: eventDetail.textDark,
  },
  actionsWrap: {
    gap: 10,
  },
  primaryCta: {
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: eventDetail.tealDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(217, 170, 43, 0.35)',
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
