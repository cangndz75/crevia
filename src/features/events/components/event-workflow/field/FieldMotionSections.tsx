import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type {
  EventFieldAdvisorComment,
  EventFieldAssignmentEffect,
  EventFieldPhasePresentation,
  EventFieldSelectedPlanSummary,
  EventFieldTimelineStep,
} from '@/features/events/utils/eventFieldPhasePresentation';
import { CreviaMotionView } from '@/shared/motion';
import { shadows } from '@/ui/theme/shadows';

type IconName = ComponentProps<typeof Ionicons>['name'];

const PLAN_TONE_BORDER: Record<EventFieldSelectedPlanSummary['tone'], string> = {
  teal: eventDetail.teal,
  green: eventDetail.success,
  gold: '#C58B18',
  warning: eventDetail.orange,
  neutral: eventDetail.textMuted,
};

const EFFECT_TONE: Record<EventFieldAssignmentEffect['tone'], string> = {
  positive: eventDetail.success,
  neutral: eventDetail.teal,
  warning: eventDetail.orange,
};

const STEP_STATE_COLOR: Record<EventFieldTimelineStep['state'], string> = {
  done: eventDetail.success,
  current: eventDetail.tealDark,
  next: eventDetail.textMuted,
  blocked: eventDetail.orange,
};

const ADVISOR_TONE: Record<
  EventFieldAdvisorComment['tone'],
  { border: string; icon: IconName }
> = {
  calm: { border: 'rgba(11, 107, 97, 0.18)', icon: 'leaf-outline' },
  teaching: { border: 'rgba(216, 167, 46, 0.35)', icon: 'school-outline' },
  warning: { border: 'rgba(199, 137, 37, 0.35)', icon: 'alert-circle-outline' },
  positive: { border: 'rgba(62, 158, 106, 0.28)', icon: 'checkmark-circle-outline' },
};

function resolveIcon(iconKey: string): IconName {
  const known: Record<string, IconName> = {
    'people-outline': 'people-outline',
    'git-network-outline': 'git-network-outline',
    'construct-outline': 'construct-outline',
    'shield-checkmark-outline': 'shield-checkmark-outline',
    'checkmark-circle-outline': 'checkmark-circle-outline',
  };
  return known[iconKey] ?? 'ellipse-outline';
}

type FieldPhaseHeaderProps = {
  title: string;
  subtitle?: string;
  liveLabel?: string;
};

export function FieldPhaseHeader({ title, subtitle, liveLabel }: FieldPhaseHeaderProps) {
  return (
    <View style={styles.phaseHeader}>
      <View style={styles.liveRow}>
        <View style={styles.liveDot} />
        <Text style={styles.liveLabel} numberOfLines={1}>
          {liveLabel ?? 'Operasyon sahada'}
        </Text>
      </View>
      <Text style={styles.phaseTitle} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.phaseSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

type FieldPlanSummaryStripProps = {
  plan: EventFieldSelectedPlanSummary;
  reducedMotion?: boolean;
};

export function FieldPlanSummaryStrip({
  plan,
  reducedMotion = false,
}: FieldPlanSummaryStripProps) {
  return (
    <CreviaMotionView
      motionKind="chip_appear"
      surface="shared"
      index={0}
      reducedMotion={reducedMotion}
      style={[styles.planStrip, shadows.soft, { borderLeftColor: PLAN_TONE_BORDER[plan.tone] }]}>
      <Text style={styles.planLabel} numberOfLines={1}>
        {plan.label}
      </Text>
      <Text style={styles.planEffect} numberOfLines={2}>
        {plan.effectLine}
      </Text>
    </CreviaMotionView>
  );
}

type FieldAssignmentEffectStripProps = {
  effect: EventFieldAssignmentEffect;
  reducedMotion?: boolean;
};

export function FieldAssignmentEffectStrip({
  effect,
  reducedMotion = false,
}: FieldAssignmentEffectStripProps) {
  return (
    <CreviaMotionView
      motionKind="chip_appear"
      surface="shared"
      index={1}
      reducedMotion={reducedMotion}
      style={[styles.effectCard, shadows.soft]}>
      <View
        style={[
          styles.effectPill,
          { backgroundColor: `${EFFECT_TONE[effect.tone]}18` },
        ]}>
        <Ionicons
          name={
            effect.tone === 'warning'
              ? 'alert-circle-outline'
              : effect.tone === 'positive'
                ? 'checkmark-circle-outline'
                : 'pulse-outline'
          }
          size={14}
          color={EFFECT_TONE[effect.tone]}
        />
        <Text style={[styles.effectLabel, { color: EFFECT_TONE[effect.tone] }]} numberOfLines={1}>
          {effect.label}
        </Text>
      </View>
      <Text style={styles.effectBody} numberOfLines={2}>
        {effect.body}
      </Text>
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
      index={4}
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

type FieldTimelineListProps = {
  timeline: EventFieldPhasePresentation['timeline'];
  operationStatus: EventFieldPhasePresentation['operationStatus'];
  reducedMotion?: boolean;
};

export function FieldTimelineList({
  timeline,
  operationStatus,
  reducedMotion = false,
}: FieldTimelineListProps) {
  const isCompleted = operationStatus === 'completed';

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={2}
      reducedMotion={reducedMotion}
      style={[styles.timelineCard, shadows.soft, isCompleted && styles.timelineCompleted]}>
      <View style={styles.timelineHeader}>
        <Text style={styles.timelineTitle} numberOfLines={1}>
          Canlı operasyon
        </Text>
        <Text style={styles.timelinePercent} numberOfLines={1}>
          %{timeline.progressPercent}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${timeline.progressPercent}%` }]} />
      </View>

      {timeline.helperText ? (
        <Text style={styles.helperText} numberOfLines={2}>
          {timeline.helperText}
        </Text>
      ) : null}

      <View style={styles.steps}>
        {timeline.steps.map((step, index) => (
          <CreviaMotionView
            key={step.id}
            motionKind="chip_appear"
            surface="shared"
            index={index}
            reducedMotion={reducedMotion}
            style={styles.stepRow}>
            <View
              style={[
                styles.stepIcon,
                { borderColor: STEP_STATE_COLOR[step.state] },
              ]}>
              <Ionicons
                name={resolveIcon(step.iconKey)}
                size={12}
                color={STEP_STATE_COLOR[step.state]}
              />
            </View>
            <Text
              style={[
                styles.stepLabel,
                step.state === 'current' && styles.stepLabelCurrent,
                step.state === 'done' && styles.stepLabelDone,
              ]}
              numberOfLines={2}>
              {step.label}
            </Text>
          </CreviaMotionView>
        ))}
      </View>
    </CreviaMotionView>
  );
}

const styles = StyleSheet.create({
  phaseHeader: {
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
  phaseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  phaseSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  planStrip: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    gap: 4,
  },
  planLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  planEffect: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  effectCard: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  effectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  effectLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  effectBody: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  timelineCard: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.12)',
  },
  timelineCompleted: {
    borderColor: 'rgba(62, 158, 106, 0.28)',
    backgroundColor: eventDetail.mintSoft,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.textDark,
    flex: 1,
    minWidth: 0,
  },
  timelinePercent: {
    fontSize: 11,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: eventDetail.mintSoft,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: eventDetail.teal,
  },
  helperText: {
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.textMuted,
    lineHeight: 16,
  },
  steps: {
    gap: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    flexShrink: 0,
  },
  stepLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.textMuted,
    lineHeight: 15,
  },
  stepLabelCurrent: {
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  stepLabelDone: {
    color: eventDetail.textDark,
  },
  advisorCard: {
    marginHorizontal: eventDetail.screenPadding,
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
});
