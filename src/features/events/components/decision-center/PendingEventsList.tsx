import { StyleSheet, View } from 'react-native';

import { PendingEventItem } from '@/features/events/components/decision-center/PendingEventItem';
import type { EventCard } from '@/core/models/EventCard';

type PendingEventsListProps = {
  events: EventCard[];
  onEventPress: (eventId: string) => void;
};

export function PendingEventsList({ events, onEventPress }: PendingEventsListProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <View style={styles.list}>
      {events.map((event) => (
        <PendingEventItem
          key={event.id}
          event={event}
          onPress={() => onEventPress(event.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
});
