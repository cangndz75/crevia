import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PendingEventItem } from '@/features/events/components/decision-center/PendingEventItem';
import type { EventCard } from '@/core/models/EventCard';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type PendingEventsListProps = {
  events: EventCard[];
  onEventPress: (eventId: string) => void;
};

export function PendingEventsList({ events, onEventPress }: PendingEventsListProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name="hourglass-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.header}>
            <Text style={typography.subtitle}>Bekleyenler</Text>
            <Text style={styles.subtitle}>Sıradaki olaylar kuyruğu</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{events.length} olay</Text>
          </View>
          <Pressable
            onPress={() => {
              // TODO: tüm bekleyenler listesi
            }}
            hitSlop={8}>
            <Text style={styles.seeAll}>Tümünü Gör</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.list}>
        {events.map((event) => (
          <PendingEventItem
            key={event.id}
            event={event}
            onPress={() => onEventPress(event.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flex: 1,
    gap: 2,
    paddingTop: 2,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  countBadge: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  list: {
    gap: spacing.md,
  },
});
