import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { DecisionOptions } from '@/features/events/components/decision-center/DecisionOptions';
import { EventEffectsRow } from '@/features/events/components/decision-center/EventEffectsRow';
import { FeaturedEventScene } from '@/features/events/components/decision-center/FeaturedEventScene';
import { getRiskLevelColor } from '@/features/events/utils/eventPresentation';
import {
  formatUrgencyLabel,
  getRiskLevelLabel,
} from '@/core/content/mockGameData';
import type { DecisionAffordabilityCheck } from '@/core/economy/economyAffordability';
import type { EventCard } from '@/core/models/EventCard';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type PriorityEventCardProps = {
  event: EventCard;
  selectedDecisionId: string | null;
  onSelectDecision: (decisionId: string) => void;
  affordabilityByDecisionId?: Record<string, DecisionAffordabilityCheck>;
};

export function PriorityEventCard({
  event,
  selectedDecisionId,
  onSelectDecision,
  affordabilityByDecisionId,
}: PriorityEventCardProps) {
  const riskColor = getRiskLevelColor(event.riskLevel);

  return (
    <Animated.View
      entering={FadeInUp.duration(320).springify().damping(20)}
      style={[styles.card, shadows.card]}>
      <View style={styles.goldAccent} />

      <View style={styles.priorityRow}>
        <View style={styles.priorityBadge}>
          <Ionicons name="pin" size={11} color={colors.hubGoldDark} />
          <Text style={styles.priorityLabel}>ÖNCELİKLİ OLAY</Text>
        </View>
        <View style={styles.timePill}>
          <Ionicons name="time-outline" size={12} color={colors.danger} />
          <Text style={styles.timeText}>
            {formatUrgencyLabel(event.urgencyHours)}
          </Text>
        </View>
      </View>

      <View style={styles.visualWrap}>
        <FeaturedEventScene event={event} />
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

        <View style={styles.metaPill}>
          <Ionicons name="list-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.metaText}>
            {event.decisions.length} seçenek var
          </Text>
        </View>

        <EventEffectsRow effects={event.previewEffects} />

        <DecisionOptions
          decisions={event.decisions}
          selectedId={selectedDecisionId}
          onSelect={onSelectDecision}
          affordabilityByDecisionId={affordabilityByDecisionId}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#EDD9A3',
  },
  goldAccent: {
    height: 3,
    width: '100%',
    backgroundColor: colors.hubGold,
    opacity: 0.9,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.hubGoldDark,
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
  },
  body: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    fontSize: 20,
    letterSpacing: -0.3,
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
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
