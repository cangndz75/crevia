import { useGameStore } from '@/store/useGameStore';

import { EventsDecisionCenterScreen } from './EventsDecisionCenterScreen';
import { OperationalEventsListScreen } from './OperationalEventsListScreen';

/**
 * Pilot aktifken: günün karar merkezi.
 * Pilot tamamlandıktan sonra: genişletilmiş operasyon olay listesi.
 */
export function EventsScreen() {
  const pilotCompleted = useGameStore(
    (s) => s.gameState.pilot.status === 'completed',
  );

  if (pilotCompleted) {
    return <OperationalEventsListScreen />;
  }

  return <EventsDecisionCenterScreen />;
}
