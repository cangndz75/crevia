import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EventFilterChips } from '@/features/events/components/decision-center/EventFilterChips';
import { EventSummaryChips } from '@/features/events/components/decision-center/EventSummaryChips';
import { PendingEventsList } from '@/features/events/components/decision-center/PendingEventsList';
import { PriorityEventCard } from '@/features/events/components/decision-center/PriorityEventCard';
import { ResolvedEventsPreview } from '@/features/events/components/decision-center/ResolvedEventsPreview';
import { EventsIntroRow } from '@/features/events/components/EventsIntroRow';
import { eventsScreen } from '@/features/events/theme/eventsScreenTokens';
import {
  computeDaySummary,
  filterPendingEvents,
  pickPriorityEvent,
  shouldShowPriorityEvent,
  type EventScreenFilterKey,
} from '@/features/events/utils/eventsScreenModel';
import {
  selectActiveEvents,
  selectDecisionHistory,
  selectFeaturedEventId,
  useGameStore,
} from '@/store/useGameStore';
import { GameButton } from '@/ui/components/GameButton';
import { GameScreenShell } from '@/ui/components/GameScreenShell';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

export function EventsDecisionCenterScreen() {
  const router = useRouter();

  const activeEvents = useGameStore(selectActiveEvents);
  const featuredEventId = useGameStore(selectFeaturedEventId);
  const decisionHistory = useGameStore(selectDecisionHistory);
  const endCurrentDay = useGameStore((s) => s.endCurrentDay);

  const [filter, setFilter] = useState<EventScreenFilterKey>('all');

  const priorityEvent = useMemo(
    () => pickPriorityEvent(activeEvents, featuredEventId),
    [activeEvents, featuredEventId],
  );

  const summaryStats = useMemo(
    () => computeDaySummary(activeEvents, decisionHistory),
    [activeEvents, decisionHistory],
  );

  const pendingEvents = useMemo(
    () =>
      filterPendingEvents(
        activeEvents,
        priorityEvent?.id ?? null,
        filter,
      ),
    [activeEvents, priorityEvent?.id, filter],
  );

  const showPriority =
    shouldShowPriorityEvent(priorityEvent, filter) && priorityEvent != null;

  const handleEventPress = useCallback(
    (eventId: string) => {
      router.push(`/events/${eventId}`);
    },
    [router],
  );

  const handleEndDay = () => {
    endCurrentDay();
    router.push('/reports');
  };

  return (
    <GameScreenShell
      headerVariant="events"
      backgroundColor={eventsScreen.bg}
      contentStyle={styles.content}>
      <EventsIntroRow />
      <EventSummaryChips stats={summaryStats} />
      <EventFilterChips active={filter} onChange={setFilter} />

      {filter === 'resolved' ? (
        <ResolvedEventsPreview records={decisionHistory} />
      ) : (
        <>
          {showPriority ? <PriorityEventCard event={priorityEvent} /> : null}

          {activeEvents.length === 0 ? (
            <View style={styles.emptyActive}>
              <Text style={typography.subtitle}>Aktif olay kalmadı</Text>
              <Text style={styles.emptyBody}>
                Bugünün kararlarını tamamladın. Günü bitirerek raporu
                görüntüleyebilirsin.
              </Text>
              <GameButton title="Günü Bitir" onPress={handleEndDay} />
            </View>
          ) : null}

          <PendingEventsList
            events={pendingEvents}
            onEventPress={handleEventPress}
          />

          {filter === 'all' ? (
            <ResolvedEventsPreview records={decisionHistory} />
          ) : null}
        </>
      )}
    </GameScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingTop: 4,
  },
  emptyActive: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: eventsScreen.card,
    borderRadius: eventsScreen.radiusMd,
    borderWidth: 1,
    borderColor: eventsScreen.border,
  },
  emptyBody: {
    ...typography.body,
    color: eventsScreen.textMuted,
  },
});
