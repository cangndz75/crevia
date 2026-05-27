import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EventEffectChips } from '@/features/events/components/decision-center/EventEffectChips';
import { EventThumbnail } from '@/features/events/components/decision-center/EventThumbnail';
import { eventsScreen } from '@/features/events/theme/eventsScreenTokens';
import {
  buildPremiumPreviewChips,
  getEventAccentKind,
  type EventAccentKind,
} from '@/features/events/utils/eventUiHelpers';
import {
  formatUrgencyLabel,
  getRiskLevelLabel,
} from '@/core/content/mockGameData';
import type { EventCard } from '@/core/models/EventCard';
import { shadows } from '@/ui/theme/shadows';

const ACCENT_COLORS: Record<EventAccentKind, string> = {
  critical: eventsScreen.critical,
  urgent: eventsScreen.urgent,
  opportunity: eventsScreen.opportunity,
  resolved: eventsScreen.resolved,
  default: eventsScreen.urgent,
};

const ACCENT_BADGE: Record<EventAccentKind, { bg: string; text: string; label: string }> = {
  critical: {
    bg: eventsScreen.criticalMuted,
    text: eventsScreen.critical,
    label: 'YÜKSEK RİSK',
  },
  urgent: {
    bg: eventsScreen.urgentMuted,
    text: eventsScreen.urgent,
    label: 'YÜKSEK RİSK',
  },
  opportunity: {
    bg: eventsScreen.opportunityMuted,
    text: eventsScreen.opportunity,
    label: 'FIRSAT',
  },
  resolved: {
    bg: eventsScreen.resolvedMuted,
    text: eventsScreen.resolved,
    label: 'ÇÖZÜLDÜ',
  },
  default: {
    bg: eventsScreen.urgentMuted,
    text: eventsScreen.urgent,
    label: 'ORTA RİSK',
  },
};

type PendingEventItemProps = {
  event: EventCard;
  onPress: () => void;
};

export function PendingEventItem({ event, onPress }: PendingEventItemProps) {
  const accentKind = getEventAccentKind(event);
  const stripeColor = ACCENT_COLORS[accentKind];
  const badge = ACCENT_COLORS[accentKind]
    ? ACCENT_BADGE[accentKind]
    : ACCENT_BADGE.default;
  const isOpportunity = accentKind === 'opportunity';
  const effectChips = buildPremiumPreviewChips(event.previewEffects, 2, event);
  const riskLabel = isOpportunity
    ? 'FIRSAT'
    : `${getRiskLevelLabel(event.riskLevel).toUpperCase()} RİSK`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadows.soft,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${event.district}`}>
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />

      <EventThumbnail event={event} size={72} />

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={eventsScreen.textMuted} />
          <Text style={styles.location} numberOfLines={1}>
            {event.district}
          </Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>
        <EventEffectChips chips={effectChips} compact />
      </View>

      <View style={styles.trailing}>
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={12} color={eventsScreen.urgent} />
          <Text style={styles.time}>{formatUrgencyLabel(event.urgencyHours)}</Text>
        </View>
        <View style={[styles.riskBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.riskText, { color: badge.text }]} numberOfLines={1}>
            {isOpportunity ? badge.label : riskLabel}
          </Text>
        </View>
        <View style={styles.chevronBtn}>
          <Ionicons name="chevron-forward" size={18} color={eventsScreen.textMuted} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: eventsScreen.card,
    borderRadius: eventsScreen.radiusMd,
    paddingVertical: 12,
    paddingRight: 10,
    paddingLeft: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: eventsScreen.border,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },
  stripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    paddingTop: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: eventsScreen.text,
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  location: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: eventsScreen.textMuted,
  },
  description: {
    fontSize: 11,
    lineHeight: 16,
    color: eventsScreen.textMuted,
    marginTop: 1,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 8,
    minWidth: 72,
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
    color: eventsScreen.urgent,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: 88,
  },
  riskText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'right',
  },
  chevronBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: eventsScreen.bg,
    borderWidth: 1,
    borderColor: eventsScreen.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
