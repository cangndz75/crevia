import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { PlanOptionVisualBlock } from '@/features/events/components/event-workflow/plan/PlanOptionVisual';
import { PLAN_OPTION_VISUALS } from '@/features/events/components/event-workflow/plan/planOptionVisuals';
import type {
  PlanDetail,
  PlanOptionId,
} from '@/features/events/utils/eventWorkflowPlanPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

type RecommendedPlanCardProps = {
  plan: PlanDetail;
  planId: PlanOptionId;
  selected: boolean;
};

function HighlightPill({
  icon,
  label,
  value,
  accent,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={13} color={accent ?? eventDetail.teal} />
      <View style={styles.pillText}>
        <Text style={styles.pillLabel}>{label}</Text>
        <Text style={[styles.pillValue, accent ? { color: accent } : null]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCell}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function RecommendedPlanCard({ plan, planId, selected }: RecommendedPlanCardProps) {
  const visual = PLAN_OPTION_VISUALS[planId];

  return (
    <View style={[styles.outer, shadows.card]}>
      <LinearGradient
        colors={['#FFFFFF', visual.gradient[0], eventDetail.mintSoft]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          selected ? styles.cardSelected : styles.cardDefault,
          { borderColor: selected ? eventDetail.teal : 'rgba(6, 63, 59, 0.08)' },
        ]}>
        <View style={[styles.accentBar, { backgroundColor: visual.iconColor }]} />

        <View style={styles.heroRow}>
          <PlanOptionVisualBlock planId={planId} size="lg" selected={selected} visual={visual} />

          <View style={styles.heroText}>
            {plan.isRecommended ? (
              <View style={styles.badge}>
                <Ionicons name="sparkles" size={11} color={eventDetail.tealDark} />
                <Text style={styles.badgeText}>Önerilen plan</Text>
              </View>
            ) : (
              <View style={styles.taglinePill}>
                <Text style={styles.taglineText} numberOfLines={1}>
                  {visual.tagline}
                </Text>
              </View>
            )}
            <Text style={styles.title} numberOfLines={2}>
              {plan.title}
            </Text>
          </View>

          {selected ? (
            <View style={styles.activeDot}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          ) : null}
        </View>

        <View style={styles.highlightRow}>
          <HighlightPill icon="time-outline" label="Süre" value={plan.durationLabel} />
          <HighlightPill
            icon="trending-up-outline"
            label="Başarı"
            value={plan.successLabel}
            accent={eventDetail.tealDark}
          />
          <HighlightPill icon="cash-outline" label="Maliyet" value={plan.costLabel} />
        </View>

        <View style={styles.metricsGrid}>
          <MetricCell label="Ekip" value={plan.team} />
          <MetricCell label="Araç" value={plan.vehicle} />
        </View>

        <View style={styles.noteBox}>
          <Ionicons name="bulb-outline" size={16} color={eventDetail.teal} />
          <Text style={styles.note} numberOfLines={2}>
            {plan.note}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: eventDetail.cardRadius,
    overflow: 'hidden',
  },
  card: {
    borderRadius: eventDetail.cardRadius,
    padding: 16,
    paddingTop: 18,
    borderWidth: 2,
    overflow: 'hidden',
  },
  cardDefault: {
    backgroundColor: eventDetail.card,
  },
  cardSelected: {
    backgroundColor: eventDetail.mintSoft,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.85,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  heroText: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    paddingTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.12)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.tealDark,
    letterSpacing: 0.15,
  },
  taglinePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  taglineText: {
    fontSize: 10,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: eventDetail.textDark,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  activeDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: eventDetail.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  highlightRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
    minWidth: '30%',
    flexGrow: 1,
  },
  pillText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  pillLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: eventDetail.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },
  pillValue: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  metricCell: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.05)',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: eventDetail.textMuted,
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255,255,255, 0.6)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.08)',
  },
  note: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 17,
  },
});
