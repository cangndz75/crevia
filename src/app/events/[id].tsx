import { useLocalSearchParams } from 'expo-router';

import { EventDecisionScreen } from '@/features/events/screens/EventDecisionScreen';

export default function EventDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = typeof id === 'string' ? id : '';

  return <EventDecisionScreen eventId={eventId} />;
}
