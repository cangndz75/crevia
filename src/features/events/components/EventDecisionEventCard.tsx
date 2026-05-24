import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { EventPreviewImpactRow } from '@/features/events/components/EventPreviewImpactRow';
import { EventVisualBanner } from '@/features/events/components/EventVisualBanner';
import { getRiskLevelColor } from '@/features/events/utils/eventPresentation';
import {
  formatUrgencyLabel,
  getRiskLevelLabel,
} from '@/core/content/mockGameData';
import { EventCard } from '@/core/models/EventCard';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type EventDecisionEventCardProps = {
  event: EventCard;
};

export function EventDecisionEventCard({ event }: EventDecisionEventCardProps) {
  const riskColor = getRiskLevelColor(event.riskLevel);

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={[styles.topStripe, { backgroundColor: colors.danger }]} />
      <View style={styles.badges}>
        <View style={[styles.badge, styles.badgeDanger]}>
          <View style={[styles.dot, { backgroundColor: riskColor }]} />
          <Text style={styles.badgeDangerText}>
            {getRiskLevelLabel(event.riskLevel)} Risk
          </Text>
        </View>
        <View style={[styles.badge, styles.badgeDanger]}>
          <Ionicons name="time-outline" size={12} color={colors.danger} />
          <Text style={styles.badgeDangerText}>
            {formatUrgencyLabel(event.urgencyHours)}
          </Text>
        </View>
        <View style={[styles.badge, styles.badgeDanger]}>
          <Ionicons name="star" size={11} color={colors.danger} />
          <Text style={styles.badgeDangerText}>Öncelikli</Text>
        </View>
      </View>

      <View style={styles.visual}>
        <EventVisualBanner event={event} height={140} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.description}>{event.description}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="list-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>{event.decisions.length} seçenek var</Text>
          </View>
          {event.delayHint ? (
            <View style={[styles.metaPill, styles.metaWarn]}>
              <Ionicons name="calendar-outline" size={12} color={colors.warning} />
              <Text style={[styles.metaText, { color: colors.warning }]}>
                Yarın etkisi olabilir
              </Text>
            </View>
          ) : null}
        </View>
        <EventPreviewImpactRow effects={event.previewEffects} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  topStripe: {
    height: 3,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeDanger: {
    backgroundColor: colors.dangerMuted,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeDangerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
  },
  visual: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  body: {
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    fontSize: 20,
  },
  description: {
    ...typography.caption,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  metaWarn: {
    backgroundColor: colors.warningMuted,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
