import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

type FeaturedEventCardProps = {
  event: EventCard;
};

export function FeaturedEventCard({ event }: FeaturedEventCardProps) {
  const router = useRouter();
  const riskColor = getRiskLevelColor(event.riskLevel);

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={[styles.topAccent, { backgroundColor: colors.warning }]} />
      <View style={styles.priorityRow}>
        <View style={styles.priorityLeft}>
          <Ionicons name="pin" size={12} color={colors.warning} />
          <Text style={styles.priorityLabel}>ÖNCELİKLİ OLAY</Text>
        </View>
        <View style={styles.timePill}>
          <Ionicons name="time-outline" size={12} color={colors.danger} />
          <Text style={styles.timeText}>{formatUrgencyLabel(event.urgencyHours)}</Text>
        </View>
      </View>

      <View style={styles.visualWrap}>
        <EventVisualBanner event={event} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{event.title}</Text>
        <View style={styles.riskRow}>
          <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
          <Text style={[styles.riskLabel, { color: riskColor }]}>
            {getRiskLevelLabel(event.riskLevel)} Risk
          </Text>
        </View>
        <Text style={styles.description}>{event.description}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="list-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>{event.decisions.length} seçenek var</Text>
          </View>
          {event.delayHint ? (
            <View style={[styles.metaPill, styles.metaOrange]}>
              <Ionicons name="calendar-outline" size={12} color={colors.warning} />
              <Text style={[styles.metaText, styles.metaOrangeText]}>
                Yarın etkisi olabilir
              </Text>
            </View>
          ) : null}
        </View>

        <EventPreviewImpactRow effects={event.previewEffects} />

        <Pressable
          onPress={() => router.push(`/events/${event.id}`)}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
          <Text style={styles.ctaText}>Karar Ver</Text>
          <View style={styles.ctaIcon}>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={colors.textInverse}
            />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  topAccent: {
    height: 3,
    width: '100%',
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  priorityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.warning,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
  },
  visualWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  body: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    fontSize: 20,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  description: {
    ...typography.caption,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  metaOrange: {
    backgroundColor: colors.warningMuted,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  metaOrangeText: {
    color: colors.warning,
  },
  cta: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textInverse,
  },
  ctaIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
