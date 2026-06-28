import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type {
  EventFieldAction,
  EventFieldActionKey,
  EventFieldAdvisorComment,
  EventFieldFeedbackPresentation,
  EventFieldFirstImpactPresentation,
  EventFieldPhasePresentation,
  EventFieldResourcePulsePresentation,
  EventFieldStatusHero,
  EventFieldTimelineStep,
} from '@/features/events/utils/eventFieldPhasePresentation';
import { CreviaMotionView } from '@/shared/motion';
import { shadows } from '@/ui/theme/shadows';

type IconName = ComponentProps<typeof Ionicons>['name'];

const PLAN_TONE_BORDER: Record<EventFieldStatusHero['tone'], string> = {
  teal: eventDetail.teal,
  green: eventDetail.success,
  gold: '#C58B18',
  warning: eventDetail.orange,
  neutral: eventDetail.textMuted,
};

const STEP_STATE_COLOR: Record<EventFieldTimelineStep['state'], string> = {
  done: eventDetail.success,
  current: eventDetail.tealDark,
  next: eventDetail.textMuted,
  blocked: eventDetail.orange,
};

const TONE_COLOR: Record<'positive' | 'neutral' | 'warning', string> = {
  positive: eventDetail.success,
  neutral: eventDetail.teal,
  warning: eventDetail.orange,
};

const ADVISOR_TONE: Record<
  EventFieldAdvisorComment['tone'],
  { border: string; pillBg: string; pillText: string }
> = {
  calm: {
    border: 'rgba(11, 107, 97, 0.18)',
    pillBg: 'rgba(11, 107, 97, 0.1)',
    pillText: eventDetail.tealDark,
  },
  teaching: {
    border: 'rgba(216, 167, 46, 0.35)',
    pillBg: 'rgba(216, 167, 46, 0.14)',
    pillText: '#B77713',
  },
  warning: {
    border: 'rgba(199, 137, 37, 0.35)',
    pillBg: 'rgba(199, 137, 37, 0.14)',
    pillText: eventDetail.orange,
  },
  positive: {
    border: 'rgba(62, 158, 106, 0.28)',
    pillBg: 'rgba(62, 158, 106, 0.12)',
    pillText: eventDetail.success,
  },
};

const INDICATOR_ICON: Record<
  EventFieldFirstImpactPresentation['items'][number]['indicator'],
  IconName
> = {
  up: 'trending-up-outline',
  down: 'trending-down-outline',
  neutral: 'remove-outline',
};

function resolveIcon(iconKey: string): IconName {
  const known: Record<string, IconName> = {
    'people-outline': 'people-outline',
    'car-outline': 'car-outline',
    'construct-outline': 'construct-outline',
    'shield-checkmark-outline': 'shield-checkmark-outline',
    'checkmark-circle-outline': 'checkmark-circle-outline',
    'alert-circle-outline': 'alert-circle-outline',
    'pulse-outline': 'pulse-outline',
    'chatbubbles-outline': 'chatbubbles-outline',
    'wallet-outline': 'wallet-outline',
    'time-outline': 'time-outline',
    'map-outline': 'map-outline',
    'document-text-outline': 'document-text-outline',
  };
  return known[iconKey] ?? 'ellipse-outline';
}

type FieldHeaderProps = {
  compact?: boolean;
  title: string;
  subtitle?: string;
  onBack?: () => void;
};

export function FieldHeader({
  compact = false,
  title,
  subtitle,
  onBack,
}: FieldHeaderProps) {
  return (
    <CreviaMotionView motionKind="card_enter" surface="shared" index={0} style={styles.header}>
      <Pressable
        onPress={onBack}
        disabled={!onBack}
        style={({ pressed }) => [
          styles.headerIconButton,
          pressed && onBack && styles.headerIconButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Geri">
        <Ionicons name="chevron-back" size={21} color={eventDetail.tealDark} />
      </Pressable>
      <View style={styles.headerTitleBlock}>
        <Text style={[styles.headerTitle, compact && styles.headerTitleCompact]}>{title}</Text>
        {subtitle ? (
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : (
          <View style={styles.headerAccent}>
            <View style={styles.headerAccentLine} />
            <Ionicons name="sparkles" size={10} color="#C58B18" />
            <View style={styles.headerAccentLine} />
          </View>
        )}
      </View>
      <View style={styles.resourceBadges}>
        <View style={[styles.resourceBadge, styles.resourceBadgeMint]}>
          <Ionicons name="diamond-outline" size={13} color={eventDetail.teal} />
          <Text style={styles.resourceText}>1.250</Text>
        </View>
        <View style={[styles.resourceBadge, styles.resourceBadgeGold]}>
          <Ionicons name="medal-outline" size={13} color="#B77713" />
          <Text style={[styles.resourceText, styles.resourceTextGold]}>860</Text>
        </View>
      </View>
    </CreviaMotionView>
  );
}

type FieldPhaseHeadingProps = {
  heading: string;
  description: string;
};

export function FieldPhaseHeading({ heading, description }: FieldPhaseHeadingProps) {
  return (
    <View style={styles.phaseHeadingWrap}>
      <Text style={styles.phaseHeading}>{heading}</Text>
      <Text style={styles.phaseDescription}>{description}</Text>
    </View>
  );
}

type FieldStatusHeroCardProps = {
  hero: EventFieldStatusHero;
  reducedMotion?: boolean;
};

export function FieldStatusHeroCard({ hero, reducedMotion = false }: FieldStatusHeroCardProps) {
  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={1}
      reducedMotion={reducedMotion}
      style={[styles.heroCard, shadows.soft, { borderLeftColor: PLAN_TONE_BORDER[hero.tone] }]}>
      <View style={styles.heroHeader}>
        <Text style={styles.heroSectionTitle} numberOfLines={1}>
          {hero.title}
        </Text>
        <View style={styles.livePill}>
          <View style={styles.livePillDot} />
          <Text style={styles.livePillText} numberOfLines={1}>
            {hero.livePillLabel}
          </Text>
        </View>
      </View>
      <Text style={styles.heroEventTitle} numberOfLines={2}>
        {hero.eventTitle}
      </Text>
      <View style={styles.heroMetaRow}>
        <Ionicons name="location-outline" size={12} color={eventDetail.teal} />
        <Text style={styles.heroMetaText} numberOfLines={1}>
          {hero.districtName}
        </Text>
        <Text style={styles.heroMetaDivider}>·</Text>
        <Text style={styles.heroMetaText} numberOfLines={1}>
          {hero.selectedPlanLabel}
        </Text>
      </View>
      <View style={styles.heroStatusRow}>
        <Text style={styles.heroStatusLabel} numberOfLines={1}>
          {hero.statusLabel}
        </Text>
      </View>
      <Text style={styles.heroSummary} numberOfLines={2}>
        {hero.summary}
      </Text>
    </CreviaMotionView>
  );
}

type FieldProgressStepperProps = {
  timeline: EventFieldPhasePresentation['timeline'];
  operationStatus: EventFieldPhasePresentation['operationStatus'];
  reducedMotion?: boolean;
};

export function FieldProgressStepper({
  timeline,
  operationStatus,
  reducedMotion = false,
}: FieldProgressStepperProps) {
  const isCompleted = operationStatus === 'completed';

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={2}
      reducedMotion={reducedMotion}
      style={[styles.progressCard, shadows.soft, isCompleted && styles.progressCompleted]}>
      <Text style={styles.progressTitle} numberOfLines={1}>
        {timeline.title}
      </Text>
      {timeline.helperText ? (
        <Text style={styles.progressHelper} numberOfLines={2}>
          {timeline.helperText}
        </Text>
      ) : null}
      <View style={styles.stepper}>
        {timeline.steps.map((step, index) => {
          const isLast = index === timeline.steps.length - 1;
          const stateColor = STEP_STATE_COLOR[step.state];
          return (
            <CreviaMotionView
              key={step.id}
              motionKind="chip_appear"
              surface="shared"
              index={index}
              reducedMotion={reducedMotion}
              style={styles.stepperRow}>
              <View style={styles.stepperTrack}>
                <View
                  style={[
                    styles.stepperNode,
                    step.state === 'done' && styles.stepperNodeDone,
                    step.state === 'current' && styles.stepperNodeCurrent,
                    { borderColor: stateColor },
                  ]}>
                  <Ionicons
                    name={
                      step.state === 'done'
                        ? 'checkmark'
                        : resolveIcon(step.iconKey)
                    }
                    size={step.state === 'done' ? 12 : 11}
                    color={stateColor}
                  />
                </View>
                {!isLast ? (
                  <View
                    style={[
                      styles.stepperLine,
                      step.state === 'done' && styles.stepperLineDone,
                    ]}
                  />
                ) : null}
              </View>
              <View style={styles.stepperContent}>
                <View style={styles.stepperTitleRow}>
                  <Text
                    style={[
                      styles.stepperTitle,
                      step.state === 'current' && styles.stepperTitleCurrent,
                      step.state === 'done' && styles.stepperTitleDone,
                    ]}
                    numberOfLines={1}>
                    {step.label}
                  </Text>
                  <View
                    style={[
                      styles.stepStatusPill,
                      { backgroundColor: `${stateColor}14` },
                    ]}>
                    <Text style={[styles.stepStatusText, { color: stateColor }]} numberOfLines={1}>
                      {step.statusLabel}
                    </Text>
                  </View>
                </View>
                <Text style={styles.stepperDescription} numberOfLines={2}>
                  {step.description}
                </Text>
              </View>
            </CreviaMotionView>
          );
        })}
      </View>
    </CreviaMotionView>
  );
}

/** @deprecated use FieldProgressStepper */
export const FieldTimelineList = FieldProgressStepper;

type FieldFeedbackListProps = {
  feedback: EventFieldFeedbackPresentation;
  reducedMotion?: boolean;
};

export function FieldFeedbackList({ feedback, reducedMotion = false }: FieldFeedbackListProps) {
  if (feedback.items.length === 0) return null;

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={3}
      reducedMotion={reducedMotion}
      style={[styles.feedbackCard, shadows.soft]}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        {feedback.title}
      </Text>
      <View style={styles.feedbackList}>
        {feedback.items.map((item, index) => {
          const color = TONE_COLOR[item.tone];
          return (
            <CreviaMotionView
              key={item.id}
              motionKind="chip_appear"
              surface="shared"
              index={index}
              reducedMotion={reducedMotion}
              style={styles.feedbackRow}>
              <View style={[styles.feedbackSourcePill, { backgroundColor: `${color}14` }]}>
                <Ionicons name={resolveIcon(item.iconKey)} size={11} color={color} />
                <Text style={[styles.feedbackSourceText, { color }]} numberOfLines={1}>
                  {item.sourceLabel}
                </Text>
              </View>
              <Text style={styles.feedbackMessage} numberOfLines={2}>
                {item.message}
              </Text>
              {item.timeLabel ? (
                <Text style={styles.feedbackTime} numberOfLines={1}>
                  {item.timeLabel}
                </Text>
              ) : null}
            </CreviaMotionView>
          );
        })}
      </View>
    </CreviaMotionView>
  );
}

type FieldFirstImpactPanelProps = {
  impact: EventFieldFirstImpactPresentation;
  reducedMotion?: boolean;
};

export function FieldFirstImpactPanel({
  impact,
  reducedMotion = false,
}: FieldFirstImpactPanelProps) {
  if (impact.items.length === 0) return null;

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={4}
      reducedMotion={reducedMotion}
      style={[styles.impactCard, shadows.soft]}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        {impact.title}
      </Text>
      <View style={styles.impactGrid}>
        {impact.items.map((item) => {
          const color = TONE_COLOR[item.tone];
          return (
            <View key={item.id} style={styles.impactTile}>
              <View style={styles.impactTileHeader}>
                <Text style={styles.impactLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                <Ionicons
                  name={INDICATOR_ICON[item.indicator]}
                  size={12}
                  color={color}
                />
              </View>
              <Text style={[styles.impactValue, { color }]} numberOfLines={1}>
                {item.valueLabel}
              </Text>
              <Text style={styles.impactDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          );
        })}
      </View>
    </CreviaMotionView>
  );
}

type FieldResourcePulsePanelProps = {
  pulse: EventFieldResourcePulsePresentation;
  reducedMotion?: boolean;
};

export function FieldResourcePulsePanel({
  pulse,
  reducedMotion = false,
}: FieldResourcePulsePanelProps) {
  if (pulse.items.length === 0) return null;

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={5}
      reducedMotion={reducedMotion}
      style={[styles.pulseCard, shadows.soft]}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        {pulse.title}
      </Text>
      <View style={styles.pulseGrid}>
        {pulse.items.map((item) => {
          const color = TONE_COLOR[item.tone];
          return (
            <View key={item.id} style={styles.pulseTile}>
              <View style={[styles.pulseIcon, { backgroundColor: `${color}18` }]}>
                <Ionicons name={resolveIcon(item.iconKey)} size={14} color={color} />
              </View>
              <Text style={styles.pulseLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={[styles.pulseValue, { color }]} numberOfLines={1}>
                {item.value}
              </Text>
            </View>
          );
        })}
      </View>
      {pulse.maintenanceHint ? (
        <Text
          style={[
            styles.pulseMaintenanceHint,
            {
              color:
                pulse.maintenanceHint.tone === 'critical'
                  ? '#C44B3F'
                  : pulse.maintenanceHint.tone === 'warning'
                    ? eventDetail.orange
                    : eventDetail.textMuted,
            },
          ]}
          numberOfLines={2}>
          {pulse.maintenanceHint.text}
        </Text>
      ) : null}
    </CreviaMotionView>
  );
}

type FieldAdvisorCommentCardProps = {
  comment: EventFieldAdvisorComment;
  reducedMotion?: boolean;
};

export function FieldAdvisorCommentCard({
  comment,
  reducedMotion = false,
}: FieldAdvisorCommentCardProps) {
  const tone = ADVISOR_TONE[comment.tone];

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
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
          <Text style={[styles.advisorToneText, { color: tone.pillText }]} numberOfLines={1}>
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

type FieldSecondaryActionsRowProps = {
  actions: EventFieldAction[];
  onActionPress?: (actionKey: EventFieldActionKey) => void;
  reducedMotion?: boolean;
};

export function FieldSecondaryActionsRow({
  actions,
  onActionPress,
  reducedMotion = false,
}: FieldSecondaryActionsRowProps) {
  if (actions.length === 0) return null;

  return (
    <View style={styles.actionsWrap}>
      <View style={styles.actionsGrid}>
        {actions.map((action, index) => (
          <CreviaMotionView
            key={action.id}
            motionKind="chip_appear"
            surface="shared"
            index={index}
            reducedMotion={reducedMotion}
            style={styles.actionMotion}>
            <Pressable
              onPress={() => {
                playLightImpactHaptic();
                onActionPress?.(action.actionKey);
              }}
              style={({ pressed }) => [styles.actionTile, pressed && styles.actionTilePressed]}
              accessibilityRole="button"
              accessibilityLabel={action.label}>
              <Ionicons
                name={resolveIcon(action.iconKey)}
                size={16}
                color={eventDetail.tealDark}
              />
              <Text style={styles.actionLabel} numberOfLines={2}>
                {action.label}
              </Text>
            </Pressable>
          </CreviaMotionView>
        ))}
      </View>
    </View>
  );
}

/** @deprecated use FieldPhaseHeading */
export function FieldPhaseHeader({
  title,
  subtitle,
  liveLabel,
}: {
  title: string;
  subtitle?: string;
  liveLabel?: string;
}) {
  return (
    <View style={styles.legacyPhaseHeader}>
      <View style={styles.liveRow}>
        <View style={styles.liveDot} />
        <Text style={styles.liveLabel} numberOfLines={1}>
          {liveLabel ?? 'Operasyon sahada'}
        </Text>
      </View>
      <Text style={styles.legacyPhaseTitle} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.legacyPhaseSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 52,
    paddingHorizontal: eventDetail.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 107, 97, 0.08)',
  },
  headerIconButtonPressed: {
    opacity: 0.85,
  },
  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: eventDetail.textDark,
    letterSpacing: 0.2,
  },
  headerTitleCompact: {
    fontSize: 16,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  headerAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  headerAccentLine: {
    width: 18,
    height: 1,
    backgroundColor: 'rgba(197, 139, 24, 0.35)',
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
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  resourceBadgeMint: {
    backgroundColor: 'rgba(26, 143, 138, 0.12)',
  },
  resourceBadgeGold: {
    backgroundColor: 'rgba(216, 167, 46, 0.14)',
  },
  resourceText: {
    fontSize: 11,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  resourceTextGold: {
    color: '#B77713',
  },
  phaseHeadingWrap: {
    marginHorizontal: eventDetail.screenPadding,
    gap: 4,
  },
  phaseHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: eventDetail.textDark,
    letterSpacing: -0.2,
  },
  phaseDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  heroCard: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 14,
    gap: 8,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroSectionTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.tealDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(26, 143, 138, 0.12)',
  },
  livePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: eventDetail.teal,
  },
  livePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  heroEventTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: eventDetail.textDark,
    lineHeight: 20,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  heroMetaText: {
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.textMuted,
    flexShrink: 1,
  },
  heroMetaDivider: {
    fontSize: 11,
    color: eventDetail.textMuted,
  },
  heroStatusRow: {
    alignSelf: 'flex-start',
  },
  heroStatusLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  heroSummary: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  progressCard: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.12)',
  },
  progressCompleted: {
    borderColor: 'rgba(62, 158, 106, 0.28)',
    backgroundColor: eventDetail.mintSoft,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  progressHelper: {
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.textMuted,
    lineHeight: 16,
  },
  stepper: {
    gap: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  stepperTrack: {
    alignItems: 'center',
    width: 24,
  },
  stepperNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  stepperNodeDone: {
    backgroundColor: 'rgba(62, 158, 106, 0.12)',
  },
  stepperNodeCurrent: {
    backgroundColor: 'rgba(11, 107, 97, 0.08)',
    borderWidth: 2,
  },
  stepperLine: {
    flex: 1,
    width: 2,
    minHeight: 16,
    backgroundColor: 'rgba(6, 63, 59, 0.1)',
    marginVertical: 2,
  },
  stepperLineDone: {
    backgroundColor: 'rgba(62, 158, 106, 0.35)',
  },
  stepperContent: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 10,
    gap: 3,
  },
  stepperTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepperTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  stepperTitleCurrent: {
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  stepperTitleDone: {
    color: eventDetail.textDark,
  },
  stepStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    flexShrink: 0,
  },
  stepStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  stepperDescription: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  feedbackCard: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  feedbackList: {
    gap: 10,
  },
  feedbackRow: {
    gap: 4,
  },
  feedbackSourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  feedbackSourceText: {
    fontSize: 10,
    fontWeight: '800',
  },
  feedbackMessage: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: eventDetail.textDark,
  },
  feedbackTime: {
    fontSize: 10,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  impactCard: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  impactGrid: {
    gap: 8,
  },
  impactTile: {
    borderRadius: 12,
    backgroundColor: eventDetail.mintSoft,
    padding: 10,
    gap: 3,
  },
  impactTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  impactLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  impactValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  impactDescription: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  pulseCard: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  pulseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pulseTile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 76,
    borderRadius: 12,
    backgroundColor: eventDetail.mintSoft,
    padding: 10,
    gap: 4,
  },
  pulseIcon: {
    width: 28,
    height: 28,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.textMuted,
  },
  pulseValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  pulseMaintenanceHint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  advisorCard: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 8,
    borderWidth: 1,
  },
  advisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  advisorMonogram: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(11, 107, 97, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  advisorMonogramText: {
    fontSize: 12,
    fontWeight: '800',
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 0,
  },
  advisorToneText: {
    fontSize: 10,
    fontWeight: '800',
  },
  advisorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: eventDetail.textDark,
  },
  actionsWrap: {
    marginHorizontal: eventDetail.screenPadding,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionMotion: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  actionTile: {
    minHeight: 64,
    borderRadius: 14,
    backgroundColor: eventDetail.card,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    padding: 10,
    gap: 6,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  actionTilePressed: {
    opacity: 0.9,
    backgroundColor: eventDetail.mintSoft,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: eventDetail.tealDark,
    lineHeight: 14,
  },
  legacyPhaseHeader: {
    marginHorizontal: eventDetail.screenPadding,
    gap: 4,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: eventDetail.teal,
  },
  liveLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: eventDetail.tealDark,
    letterSpacing: 0.2,
  },
  legacyPhaseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  legacyPhaseSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
});
