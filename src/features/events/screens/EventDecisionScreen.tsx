import { EventDetailDecisionScreen } from '@/features/events/screens/EventDetailDecisionScreen';

type EventDecisionScreenProps = {
  eventId: string;
};

/** Olay detayı + karar ekranı — premium UI sarmalayıcı. */
export function EventDecisionScreen({ eventId }: EventDecisionScreenProps) {
  return <EventDetailDecisionScreen eventId={eventId} />;
}
