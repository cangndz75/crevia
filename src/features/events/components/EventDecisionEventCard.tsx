import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { EventPreviewImpactRow } from '@/features/events/components/EventPreviewImpactRow';
import { EventVisualBanner } from '@/features/events/components/EventVisualBanner';
import { getRiskLevelColor } from '@/features/events/utils/eventPresentation';
import { POST_PILOT_EVENT_CARD_LAYOUT_GUARDS } from '@/core/postPilot/postPilotOperationUxPresentation';
import { PostPilotEventContextChip } from '@/features/events/components/PostPilotEventContextChip';
import { getEventContextTags } from '@/features/events/utils/eventDecisionPresentation';
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
  /** Oyun günü — event.day yoksa store günü. */
  day?: number;
};

function getPriorityLabel(riskLevel: EventCard['riskLevel']): string {
  switch (riskLevel) {
    case 'critical':
    case 'high':
      return 'Yüksek Öncelik';
    case 'medium':
      return 'Orta Öncelik';
    default:
      return 'Düşük Öncelik';
  }
}

export function EventDecisionEventCard({ event, day }: EventDecisionEventCardProps) {
  const riskColor = getRiskLevelColor(event.riskLevel);
  const displayDay = event.day ?? day;
  const contextTags = getEventContextTags(event);

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={[styles.topStripe, { backgroundColor: riskColor }]} />

      <View style={styles.hero}>
        <PostPilotEventContextChip event={event} />
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: getRiskLevelMutedBg(event.riskLevel) }]}>
            <View style={[styles.dot, { backgroundColor: riskColor }]} />
            <Text style={[styles.badgeText, { color: riskColor }]}>
              {getRiskLevelLabel(event.riskLevel)}
            </Text>
          </View>
          <View style={[styles.badge, styles.badgeNeutral]}>
            <Ionicons name="flag-outline" size={11} color={colors.textSecondary} />
            <Text style={styles.badgeNeutralText}>{getPriorityLabel(event.riskLevel)}</Text>
          </View>
          {displayDay != null ? (
            <View style={[styles.badge, styles.badgeTeal]}>
              <Ionicons name="calendar-outline" size={11} color={colors.primary} />
              <Text style={styles.badgeTealText}>Gün {displayDay}</Text>
            </View>
          ) : null}
          <View style={[styles.badge, styles.badgeDanger]}>
            <Ionicons name="time-outline" size={12} color={colors.danger} />
            <Text style={styles.badgeDangerText}>
              {formatUrgencyLabel(event.urgencyHours)}
            </Text>
          </View>
        </View>

        <Text
          style={styles.title}
          numberOfLines={POST_PILOT_EVENT_CARD_LAYOUT_GUARDS.titleNumberOfLines}>
          {event.title}
        </Text>

        <View style={styles.metaBlock}>
          <View style={styles.metaLine}>
            <Ionicons name="location-outline" size={14} color={colors.primary} />
            <Text style={styles.metaDistrict}>{event.district}</Text>
          </View>
          <View style={styles.metaLine}>
            <Ionicons name="layers-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaCategory}>{event.category}</Text>
          </View>
        </View>

        {contextTags.length > 0 ? (
          <View style={styles.tagRow}>
            {contextTags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.visual}>
        <EventVisualBanner event={event} height={120} />
      </View>

      <View style={styles.body}>
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

function getRiskLevelMutedBg(level: EventCard['riskLevel']): string {
  switch (level) {
    case 'low':
      return colors.successMuted;
    case 'medium':
      return colors.warningMuted;
    case 'high':
      return '#FFF0E6';
    case 'critical':
      return colors.criticalMuted;
    default:
      return colors.background;
  }
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
  hero: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
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
  badgeNeutral: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeTeal: {
    backgroundColor: colors.primaryMuted,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeDangerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
  },
  badgeNeutralText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  badgeTealText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  title: {
    ...typography.title,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  metaBlock: {
    gap: 4,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaDistrict: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  metaCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.hubGoldMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.xpGold}44`,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.hubGoldDark,
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
