import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EventThumbnail } from '@/features/events/components/decision-center/EventThumbnail';
import { buildCompactEffectChips } from '@/features/events/utils/eventUiHelpers';
import {
  getRiskLevelColor,
  getRiskLevelMuted,
} from '@/features/events/utils/eventPresentation';
import {
  formatUrgencyLabel,
  getRiskLevelLabel,
} from '@/core/content/mockGameData';
import type { EventCard } from '@/core/models/EventCard';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const EFFECT_TONE_BG: Record<string, string> = {
  positive: colors.successMuted,
  negative: colors.dangerMuted,
  neutral: colors.background,
  xp: colors.purpleMuted,
  risk: colors.primaryMuted,
  budget: '#FCE8EC',
};

const EFFECT_TONE_TEXT: Record<string, string> = {
  positive: colors.success,
  negative: colors.danger,
  neutral: colors.textSecondary,
  xp: colors.purple,
  risk: colors.primary,
  budget: colors.danger,
};

type PendingEventItemProps = {
  event: EventCard;
  onPress: () => void;
};

export function PendingEventItem({ event, onPress }: PendingEventItemProps) {
  const accent = getRiskLevelColor(event.riskLevel);
  const muted = getRiskLevelMuted(event.riskLevel);
  const isOpportunity = event.filterTags?.includes('opportunity');
  const isCritical =
    event.riskLevel === 'critical' || event.riskLevel === 'high';
  const effectChips = buildCompactEffectChips(event.previewEffects, 2);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadows.soft,
        pressed && styles.pressed,
      ]}>
      <EventThumbnail event={event} size={76} />

      <View style={styles.body}>
        {isCritical ? (
          <View style={styles.criticalRow}>
            <Ionicons name="water" size={11} color={colors.danger} />
            <Text style={styles.criticalLabel}>KRİTİK OLAY</Text>
          </View>
        ) : null}

        <Text style={styles.title} numberOfLines={1}>
          {event.title}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.location} numberOfLines={1}>
            {event.district}
          </Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>

        {effectChips.length > 0 ? (
          <View style={styles.effectRow}>
            {effectChips.map((chip) => (
              <View
                key={chip.key}
                style={[
                  styles.effectChip,
                  { backgroundColor: EFFECT_TONE_BG[chip.tone] },
                ]}>
                <Text
                  style={[
                    styles.effectText,
                    { color: EFFECT_TONE_TEXT[chip.tone] },
                  ]}>
                  {chip.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.trailing}>
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={12} color={colors.danger} />
          <Text style={styles.time}>{formatUrgencyLabel(event.urgencyHours)}</Text>
        </View>
        <View style={[styles.riskBadge, { backgroundColor: muted }]}>
          <Text style={[styles.riskText, { color: accent }]}>
            {isOpportunity
              ? 'Fırsat'
              : `${getRiskLevelLabel(event.riskLevel)} Risk`}
          </Text>
        </View>
        <View style={styles.goBtn}>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingTop: 2,
  },
  criticalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  criticalLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.danger,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  location: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    marginTop: 2,
  },
  effectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  effectChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  effectText: {
    fontSize: 10,
    fontWeight: '800',
  },
  trailing: {
    alignItems: 'flex-end',
    gap: spacing.sm,
    minWidth: 68,
    paddingTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  time: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
  },
  riskBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '800',
  },
  goBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
