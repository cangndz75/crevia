import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type {
  EventDispatchAction,
  EventDispatchActionKey,
  EventDispatchAdvisorComment,
  EventDispatchBlockersPresentation,
  EventDispatchReadinessPanel,
  EventDispatchReadinessRow,
  EventDispatchResourceSummary,
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

const CHIP_TONE_COLOR: Record<'positive' | 'neutral' | 'warning', string> = {
  positive: eventDetail.success,
  neutral: eventDetail.teal,
  warning: eventDetail.orange,
};

const READINESS_TONE: Record<EventDispatchReadinessRow['tone'], string> = {
  positive: eventDetail.success,
  neutral: eventDetail.teal,
  warning: eventDetail.orange,
};

const OVERALL_READINESS_COLOR: Record<
  EventDispatchReadinessPanel['overallStatus'],
  string
> = {
  ready: eventDetail.success,
  limited: '#C58B18',
  strained: eventDetail.orange,
  blocked: '#C44B3F',
};

const ADVISOR_TONE: Record<
  EventDispatchAdvisorComment['tone'],
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

const BLOCKER_TONE_COLOR: Record<'neutral' | 'warning' | 'critical', string> = {
  neutral: eventDetail.teal,
  warning: eventDetail.orange,
  critical: '#C44B3F',
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
    'wallet-outline': 'wallet-outline',
    'chatbubbles-outline': 'chatbubbles-outline',
    'ellipse-outline': 'ellipse-outline',
    'business-outline': 'business-outline',
    'navigate-outline': 'navigate-outline',
    'time-outline': 'time-outline',
    'speedometer-outline': 'speedometer-outline',
    'map-outline': 'map-outline',
    'git-compare-outline': 'git-compare-outline',
    'document-text-outline': 'document-text-outline',
  };
  return known[iconKey] ?? 'ellipse-outline';
}

type DispatchHeaderProps = {
  compact?: boolean;
  title: string;
  subtitle?: string;
  onBack?: () => void;
};

export function DispatchHeader({
  compact = false,
  title,
  subtitle,
  onBack,
}: DispatchHeaderProps) {
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

type DispatchPhaseHeadingProps = {
  heading: string;
  description: string;
};

export function DispatchPhaseHeading({ heading, description }: DispatchPhaseHeadingProps) {
  return (
    <View style={styles.phaseHeadingWrap}>
      <Text style={styles.phaseHeading}>{heading}</Text>
      <Text style={styles.phaseDescription}>{description}</Text>
    </View>
  );
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
      index={1}
      reducedMotion={reducedMotion}
      style={[styles.planStrip, shadows.soft, { borderLeftColor: PLAN_TONE_BORDER[plan.tone] }]}>
      <Text style={styles.planEyebrow} numberOfLines={1}>
        {plan.sourceLabel}: {plan.label}
      </Text>
      <Text style={styles.planSummary} numberOfLines={2}>
        {plan.summary}
      </Text>
      <View style={styles.planChipRow}>
        {plan.chips.map((chip) => (
          <View
            key={chip.label}
            style={[
              styles.planChip,
              { backgroundColor: `${CHIP_TONE_COLOR[chip.tone]}14` },
            ]}>
            <Text style={styles.planChipLabel} numberOfLines={1}>
              {chip.label}:
            </Text>
            <Text
              style={[styles.planChipValue, { color: CHIP_TONE_COLOR[chip.tone] }]}
              numberOfLines={1}>
              {chip.value}
            </Text>
          </View>
        ))}
      </View>
    </CreviaMotionView>
  );
}

type DispatchReadinessPanelProps = {
  readiness: EventDispatchReadinessPanel;
  reducedMotion?: boolean;
  maintenanceActionFeedback?: string | null;
  onMaintenanceAction?: () => void;
};

export function DispatchReadinessPanel({
  readiness,
  reducedMotion = false,
  maintenanceActionFeedback,
  onMaintenanceAction,
}: DispatchReadinessPanelProps) {
  const overallColor = OVERALL_READINESS_COLOR[readiness.overallStatus];
  const maintenanceAction = readiness.maintenanceAction;

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={2}
      reducedMotion={reducedMotion}
      style={[styles.readinessCard, shadows.soft]}>
      <View style={styles.readinessHeader}>
        <Text style={styles.readinessTitle} numberOfLines={1}>
          {readiness.title}
        </Text>
        <View style={[styles.overallPill, { backgroundColor: `${overallColor}18` }]}>
          <Text style={[styles.overallPillText, { color: overallColor }]} numberOfLines={1}>
            {readiness.overallLabel}
          </Text>
        </View>
      </View>
      <View style={styles.readinessGrid}>
        {readiness.items.map((row) => {
          const color = READINESS_TONE[row.tone];
          return (
            <View key={row.id} style={styles.readinessGridItem}>
              <View style={[styles.readinessIcon, { backgroundColor: `${color}18` }]}>
                <Ionicons name={resolveIcon(row.iconKey)} size={14} color={color} />
              </View>
              <View style={styles.readinessCopy}>
                <Text style={styles.readinessLabel} numberOfLines={1}>
                  {row.label}
                </Text>
                <Text style={styles.readinessReason} numberOfLines={2}>
                  {row.reason}
                </Text>
              </View>
              <View style={[styles.readinessStatus, { backgroundColor: `${color}18` }]}>
                <Text style={[styles.readinessStatusText, { color }]} numberOfLines={1}>
                  {row.statusLabel}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      {readiness.maintenanceHint ? (
        <View style={styles.maintenanceHintRow}>
          {readiness.maintenanceHint.countLabel ? (
            <View style={styles.maintenanceCountPill}>
              <Text style={styles.maintenanceCountText} numberOfLines={1}>
                {readiness.maintenanceHint.countLabel}
              </Text>
            </View>
          ) : null}
          <Text
            style={[
              styles.maintenanceHintText,
              {
                color:
                  readiness.maintenanceHint.tone === 'critical'
                    ? BLOCKER_TONE_COLOR.critical
                    : readiness.maintenanceHint.tone === 'warning'
                      ? BLOCKER_TONE_COLOR.warning
                      : eventDetail.textMuted,
              },
            ]}
            numberOfLines={2}>
            {readiness.maintenanceHint.text}
          </Text>
        </View>
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
    </CreviaMotionView>
  );
}

type DispatchResourceSummaryCardProps = {
  summary: EventDispatchResourceSummary;
  reducedMotion?: boolean;
};

export function DispatchResourceSummaryCard({
  summary,
  reducedMotion = false,
}: DispatchResourceSummaryCardProps) {
  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={3}
      reducedMotion={reducedMotion}
      style={[styles.resourceCard, shadows.soft]}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        {summary.title}
      </Text>
      <View style={styles.resourceGrid}>
        {summary.items.map((item) => {
          const color =
            item.tone === 'warning'
              ? eventDetail.orange
              : item.tone === 'positive'
                ? eventDetail.success
                : eventDetail.tealDark;
          return (
            <View key={item.id} style={styles.resourceItem}>
              <View style={[styles.resourceIcon, { backgroundColor: `${color}14` }]}>
                <Ionicons name={resolveIcon(item.iconKey)} size={13} color={color} />
              </View>
              <Text style={styles.resourceLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={styles.resourceValue} numberOfLines={1}>
                {item.value}
              </Text>
            </View>
          );
        })}
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
      index={4}
      reducedMotion={reducedMotion}
      style={[
        styles.routeCard,
        shadows.soft,
        highlight && !reducedMotion && styles.routeCardHighlight,
      ]}>
      <View style={styles.routeHeader}>
        <Text style={styles.sectionTitle} numberOfLines={1}>
          {route.title}
        </Text>
        {route.estimatedLabel ? (
          <Text style={styles.routeEstimate} numberOfLines={1}>
            {route.estimatedLabel}
          </Text>
        ) : null}
      </View>
      <Text style={styles.routeCopy} numberOfLines={2}>
        {route.routeCopy}
      </Text>
      <View style={styles.pathStrip}>
        {route.pathLabels.map((label, index) => (
          <View key={`${label}-${index}`} style={styles.pathStep}>
            <Text
              style={[
                styles.pathLabel,
                index === route.pathLabels.length - 1 && styles.pathLabelActive,
              ]}
              numberOfLines={1}>
              {label}
            </Text>
            {index < route.pathLabels.length - 1 ? (
              <Ionicons name="chevron-forward" size={12} color={eventDetail.textMuted} />
            ) : null}
          </View>
        ))}
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

type DispatchBlockersListProps = {
  blockers: EventDispatchBlockersPresentation;
  reducedMotion?: boolean;
};

export function DispatchBlockersList({
  blockers,
  reducedMotion = false,
}: DispatchBlockersListProps) {
  if (blockers.items.length === 0) return null;

  return (
    <CreviaMotionView
      motionKind="line_appear"
      surface="shared"
      index={5}
      reducedMotion={reducedMotion}
      style={[styles.blockersCard, shadows.soft]}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        {blockers.title}
      </Text>
      <View style={styles.blockerList}>
        {blockers.items.map((item) => {
          const color = BLOCKER_TONE_COLOR[item.tone];
          return (
            <View key={item.id} style={styles.blockerRow}>
              <Ionicons name={resolveIcon(item.iconKey)} size={14} color={color} />
              <Text style={styles.blockerText} numberOfLines={2}>
                {item.message}
              </Text>
            </View>
          );
        })}
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
      motionKind="line_appear"
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
          <Ionicons name={tone.icon} size={11} color={tone.pillText} />
          <Text style={[styles.advisorToneText, { color: tone.pillText }]} numberOfLines={1}>
            {comment.toneLabel}
          </Text>
        </View>
      </View>
      <Text style={styles.advisorText} numberOfLines={3}>
        {comment.text}
      </Text>
    </CreviaMotionView>
  );
}

type DispatchSecondaryActionsRowProps = {
  actions: EventDispatchAction[];
  onActionPress?: (actionKey: EventDispatchActionKey) => void;
  reducedMotion?: boolean;
};

export function DispatchSecondaryActionsRow({
  actions,
  onActionPress,
  reducedMotion = false,
}: DispatchSecondaryActionsRowProps) {
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
              onPress={() => {
                playLightImpactHaptic();
                onActionPress?.(action.actionKey);
              }}
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

/** @deprecated use DispatchHeader + DispatchPhaseHeading */
export function DispatchPhaseHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return <DispatchPhaseHeading heading={title} description={subtitle ?? ''} />;
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6,63,59,0.08)',
  },
  headerIconButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  headerTitleCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
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
    backgroundColor: 'rgba(198, 139, 24, 0.35)',
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
    borderWidth: 1,
  },
  resourceBadgeMint: {
    backgroundColor: 'rgba(11, 107, 97, 0.08)',
    borderColor: 'rgba(11, 107, 97, 0.12)',
  },
  resourceBadgeGold: {
    backgroundColor: 'rgba(198, 139, 24, 0.1)',
    borderColor: 'rgba(198, 139, 24, 0.18)',
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
    paddingHorizontal: eventDetail.screenPadding,
    gap: 4,
  },
  phaseHeading: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  phaseDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  planStrip: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    gap: 6,
  },
  planEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  planSummary: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: eventDetail.textDark,
  },
  planChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  planChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  planChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  planChipValue: {
    fontSize: 10,
    fontWeight: '800',
  },
  readinessCard: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  readinessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  readinessTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  overallPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 1,
  },
  overallPillText: {
    fontSize: 10,
    fontWeight: '900',
  },
  readinessGrid: {
    gap: 8,
  },
  readinessGridItem: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readinessIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  readinessCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  readinessLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  readinessReason: {
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.textMuted,
    lineHeight: 15,
  },
  readinessStatus: {
    minWidth: 58,
    maxWidth: 88,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
  },
  readinessStatusText: {
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },
  maintenanceHintRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(6, 63, 59, 0.06)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  maintenanceCountPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(6, 63, 59, 0.06)',
    flexShrink: 0,
  },
  maintenanceCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.textMuted,
  },
  maintenanceHintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  maintenanceActionBlock: {
    marginTop: 10,
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
  resourceCard: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  resourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resourceItem: {
    width: '47%',
    minWidth: 0,
    gap: 4,
    padding: 8,
    borderRadius: 12,
    backgroundColor: eventDetail.mintSoft,
  },
  resourceIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  resourceValue: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  routeCard: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 8,
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
  routeEstimate: {
    fontSize: 11,
    fontWeight: '700',
    color: eventDetail.tealDark,
    flexShrink: 1,
  },
  routeCopy: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  pathStrip: {
    minHeight: 32,
    borderRadius: 14,
    backgroundColor: eventDetail.mintSoft,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pathStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
    flexShrink: 1,
  },
  pathLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.textMuted,
    maxWidth: 96,
  },
  pathLabelActive: {
    color: eventDetail.tealDark,
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
    maxWidth: 72,
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
  blockersCard: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  blockerList: {
    gap: 8,
  },
  blockerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  blockerText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
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
    gap: 8,
  },
  advisorMonogram: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: eventDetail.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advisorMonogramText: {
    fontSize: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 1,
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
    paddingHorizontal: eventDetail.screenPadding,
  },
  actionsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  actionMotion: {
    flexShrink: 0,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
  },
  actionChipPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.tealDark,
  },
});
