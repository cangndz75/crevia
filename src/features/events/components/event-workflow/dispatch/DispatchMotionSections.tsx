import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type {
  EventDispatchAdvisorComment,
  EventDispatchCompatibility,
  EventDispatchRoutePreview,
  EventDispatchSelectedPlanSummary,
} from '@/features/events/utils/eventDispatchPhasePresentation';
import { CreviaMotionView } from '@/shared/motion';
import { shadows } from '@/ui/theme/shadows';

type IconName = ComponentProps<typeof Ionicons>['name'];

const PLAN_TONE_BORDER: Record<EventDispatchSelectedPlanSummary['tone'], string> = {
  teal: eventDetail.teal,
  green: eventDetail.success,
  gold: '#C58B18',
  warning: eventDetail.orange,
  neutral: eventDetail.textMuted,
};

const COMPAT_TONE: Record<EventDispatchCompatibility['tone'], string> = {
  positive: eventDetail.success,
  neutral: eventDetail.teal,
  warning: eventDetail.orange,
};

const REASON_TONE_BG: Record<'positive' | 'neutral' | 'warning', string> = {
  positive: 'rgba(62, 158, 106, 0.12)',
  neutral: 'rgba(11, 107, 97, 0.08)',
  warning: 'rgba(199, 137, 37, 0.14)',
};

const ADVISOR_TONE: Record<
  EventDispatchAdvisorComment['tone'],
  { border: string; icon: IconName }
> = {
  calm: { border: 'rgba(11, 107, 97, 0.18)', icon: 'leaf-outline' },
  teaching: { border: 'rgba(216, 167, 46, 0.35)', icon: 'school-outline' },
  warning: { border: 'rgba(199, 137, 37, 0.35)', icon: 'alert-circle-outline' },
  positive: { border: 'rgba(62, 158, 106, 0.28)', icon: 'checkmark-circle-outline' },
};

const ROUTE_STATE_COLOR: Record<
  EventDispatchRoutePreview['steps'][number]['state'],
  string
> = {
  ready: eventDetail.teal,
  current: eventDetail.tealDark,
  locked: eventDetail.textMuted,
  done: eventDetail.success,
};

function resolveIcon(iconKey: string): IconName {
  const known: Record<string, IconName> = {
    'people-outline': 'people-outline',
    'car-outline': 'car-outline',
    'git-network-outline': 'git-network-outline',
    'location-outline': 'location-outline',
    'checkmark-circle-outline': 'checkmark-circle-outline',
    'alert-circle-outline': 'alert-circle-outline',
    'briefcase-outline': 'briefcase-outline',
    'ellipse-outline': 'ellipse-outline',
  };
  return known[iconKey] ?? 'ellipse-outline';
}

type DispatchPlanSummaryStripProps = {
  plan: EventDispatchSelectedPlanSummary;
  reducedMotion?: boolean;
};

export function DispatchPlanSummaryStrip({
  plan,
  reducedMotion = false,
}: DispatchPlanSummaryStripProps) {
  return (
    <CreviaMotionView
      motionKind="chip_appear"
      surface="shared"
      index={0}
      reducedMotion={reducedMotion}
      style={[styles.planStrip, shadows.soft, { borderLeftColor: PLAN_TONE_BORDER[plan.tone] }]}>
      <Text style={styles.planEyebrow} numberOfLines={1}>
        Seçili plan: {plan.label}
      </Text>
      <Text style={styles.planSummary} numberOfLines={2}>
        Beklenen etki: {plan.summary}
      </Text>
    </CreviaMotionView>
  );
}

type DispatchCompatibilityStripProps = {
  compatibility: EventDispatchCompatibility;
  reducedMotion?: boolean;
};

export function DispatchCompatibilityStrip({
  compatibility,
  reducedMotion = false,
}: DispatchCompatibilityStripProps) {
  return (
    <CreviaMotionView
      motionKind="chip_appear"
      surface="shared"
      index={1}
      reducedMotion={reducedMotion}
      style={[styles.compatCard, shadows.soft]}>
      <View style={styles.compatHeader}>
        <View
          style={[
            styles.compatPill,
            { backgroundColor: `${COMPAT_TONE[compatibility.tone]}22` },
          ]}>
          <Ionicons
            name={
              compatibility.tone === 'warning'
                ? 'alert-circle-outline'
                : compatibility.tone === 'positive'
                  ? 'checkmark-circle-outline'
                  : 'pulse-outline'
            }
            size={14}
            color={COMPAT_TONE[compatibility.tone]}
          />
          <Text
            style={[styles.compatLabel, { color: COMPAT_TONE[compatibility.tone] }]}
            numberOfLines={1}>
            {compatibility.label}
          </Text>
        </View>
      </View>
      <View style={styles.reasonRow}>
        {compatibility.reasons.map((reason) => (
          <View
            key={reason.id}
            style={[styles.reasonChip, { backgroundColor: REASON_TONE_BG[reason.tone] }]}>
            <Ionicons
              name={resolveIcon(reason.iconKey)}
              size={11}
              color={COMPAT_TONE[reason.tone === 'warning' ? 'warning' : reason.tone === 'positive' ? 'positive' : 'neutral']}
            />
            <Text style={styles.reasonText} numberOfLines={1}>
              {reason.label}
            </Text>
          </View>
        ))}
      </View>
    </CreviaMotionView>
  );
}

type DispatchRouteStepStripProps = {
  route: EventDispatchRoutePreview;
  highlight?: boolean;
  reducedMotion?: boolean;
};

export function DispatchRouteStepStrip({
  route,
  highlight = false,
  reducedMotion = false,
}: DispatchRouteStepStripProps) {
  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={2}
      reducedMotion={reducedMotion}
      style={[
        styles.routeCard,
        shadows.soft,
        highlight && !reducedMotion && styles.routeCardHighlight,
      ]}>
      <View style={styles.routeHeader}>
        <Text style={styles.routeTitle} numberOfLines={1}>
          {route.title}
        </Text>
        {route.estimatedLabel ? (
          <Text style={styles.routeEstimate} numberOfLines={1}>
            {route.estimatedLabel}
          </Text>
        ) : null}
      </View>
      <View style={styles.routeSteps}>
        {route.steps.map((step, index) => (
          <View key={step.id} style={styles.routeStepWrap}>
            <View style={styles.routeStepNode}>
              <View
                style={[
                  styles.routeIconWrap,
                  { borderColor: ROUTE_STATE_COLOR[step.state] },
                ]}>
                <Ionicons
                  name={resolveIcon(step.iconKey)}
                  size={13}
                  color={ROUTE_STATE_COLOR[step.state]}
                />
              </View>
              <Text style={styles.routeStepLabel} numberOfLines={1}>
                {step.label}
              </Text>
            </View>
            {index < route.steps.length - 1 ? (
              <View
                style={[
                  styles.routeConnector,
                  step.state === 'done' || step.state === 'current'
                    ? styles.routeConnectorActive
                    : null,
                ]}
              />
            ) : null}
          </View>
        ))}
      </View>
    </CreviaMotionView>
  );
}

type DispatchAdvisorCommentCardProps = {
  comment: EventDispatchAdvisorComment;
  reducedMotion?: boolean;
};

export function DispatchAdvisorCommentCard({
  comment,
  reducedMotion = false,
}: DispatchAdvisorCommentCardProps) {
  const tone = ADVISOR_TONE[comment.tone];

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={3}
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

type DispatchPhaseHeaderProps = {
  title: string;
  subtitle?: string;
};

export function DispatchPhaseHeader({ title, subtitle }: DispatchPhaseHeaderProps) {
  return (
    <View style={styles.phaseHeader}>
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

const styles = StyleSheet.create({
  planStrip: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    gap: 4,
  },
  planEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  planSummary: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  compatCard: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  compatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  compatLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: '100%',
  },
  reasonText: {
    fontSize: 10,
    fontWeight: '700',
    color: eventDetail.textDark,
    flexShrink: 1,
  },
  routeCard: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  routeCardHighlight: {
    borderColor: 'rgba(11, 107, 97, 0.35)',
    backgroundColor: eventDetail.mintSoft,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  routeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: eventDetail.textMuted,
    letterSpacing: 0.2,
    flex: 1,
    minWidth: 0,
  },
  routeEstimate: {
    fontSize: 10,
    fontWeight: '700',
    color: eventDetail.tealDark,
    flexShrink: 1,
  },
  routeSteps: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeStepWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  routeStepNode: {
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  routeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  routeStepLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: eventDetail.textDark,
    textAlign: 'center',
    maxWidth: 56,
  },
  routeConnector: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(6, 63, 59, 0.1)',
    marginTop: 13,
    marginHorizontal: 2,
    minWidth: 4,
  },
  routeConnectorActive: {
    backgroundColor: eventDetail.teal,
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
  phaseHeader: {
    marginHorizontal: eventDetail.screenPadding,
    gap: 2,
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
});
