import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OperationPortfolioBoard } from '@/features/events/components/operation-portfolio/OperationPortfolioBoard';
import {
  CityMapHero,
  EventsBottomSheet,
  OlaylarActiveEventsSection,
  OlaylarEventMetricsRow,
  OlaylarEventsHeader,
  OlaylarFieldStatusMini,
  OlaylarFilterChips,
  OlaylarOperationStatusStrip,
  OlaylarPriorityEventCard,
  ResolvedEventList,
} from '@/features/events/components/olaylar';
import { olaylar } from '@/features/events/theme/olaylarScreenTokens';
import type { OlaylarFilterKey } from '@/features/events/types/olaylarScreenTypes';
import { buildEventsOperationPortfolioPresentation } from '@/features/events/utils/eventsOperationPortfolioPresentation';
import {
  buildActiveEventViews,
  buildOlaylarScreenPresentation,
  buildPriorityEventView,
  buildResolvedEventViews,
  resolveOlaylarPriority,
  resolvePrimaryOperationEventId,
} from '@/features/events/utils/olaylarScreenPresentation';
import { useGameStatus } from '@/store/gameSelectors';
import {
  selectActiveEvents,
  selectDecisionHistory,
  selectFeaturedEventId,
  useGameStore,
} from '@/store/useGameStore';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { GameButton } from '@/ui/components/GameButton';

export function EventsDecisionCenterScreen() {
  const router = useRouter();
  const tabBarHeight = useAppTabBarHeight();
  const status = useGameStatus();

  const activeEvents = useGameStore(selectActiveEvents);
  const featuredEventId = useGameStore(selectFeaturedEventId);
  const decisionHistory = useGameStore(selectDecisionHistory);
  const gameState = useGameStore((s) => s.gameState);
  const operationalResources = useGameStore((s) => s.operationalResources);
  const endCurrentDay = useGameStore((s) => s.endCurrentDay);

  const [filter, setFilter] = useState<OlaylarFilterKey>('all');

  const presentation = useMemo(
    () =>
      buildOlaylarScreenPresentation({
        activeEvents,
        decisionHistory,
        operationalResources,
      }),
    [activeEvents, decisionHistory, operationalResources],
  );

  const operationPortfolio = useMemo(
    () =>
      buildEventsOperationPortfolioPresentation({
        gameState,
        activeEvents,
        featuredEventId,
      }),
    [gameState, activeEvents, featuredEventId],
  );

  const { priorityEvent, showPriority, pendingEvents } = useMemo(
    () => resolveOlaylarPriority(activeEvents, featuredEventId, filter),
    [activeEvents, featuredEventId, filter],
  );

  const priorityView = useMemo(
    () => buildPriorityEventView(priorityEvent),
    [priorityEvent],
  );

  const activeEventViews = useMemo(
    () => buildActiveEventViews(pendingEvents),
    [pendingEvents],
  );

  const resolvedItems = useMemo(
    () => buildResolvedEventViews(decisionHistory, filter !== 'resolved'),
    [decisionHistory, filter],
  );

  const resolvedOnlyItems = useMemo(
    () => buildResolvedEventViews(decisionHistory, false),
    [decisionHistory],
  );

  const primaryOperationEventId = useMemo(
    () => resolvePrimaryOperationEventId(activeEvents, featuredEventId),
    [activeEvents, featuredEventId],
  );

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

  const showResolvedOnly = filter === 'resolved';
  const showEmptyActive = !showResolvedOnly && activeEvents.length === 0;
  const showFieldStatus = !showResolvedOnly && activeEvents.length > 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <OlaylarEventsHeader
        header={{
          level: status.level,
          xp: status.xp,
          xpTarget: status.xpTarget,
          resourceLabel: status.budgetFormatted,
        }}
      />

      <OlaylarOperationStatusStrip status={presentation.operationStatus} />

      <EventsBottomSheet bottomInset={tabBarHeight}>
        <OperationPortfolioBoard presentation={operationPortfolio} />

        {operationPortfolio.isRichDay ? (
          <>
            <OlaylarEventMetricsRow items={presentation.eventStats} />

            <CityMapHero
              mapView={presentation.liveIncidentMap}
              timeline={presentation.incidentTimeline}
            />
          </>
        ) : null}

        <OlaylarFilterChips active={filter} onChange={setFilter} />

        {showResolvedOnly ? (
          resolvedOnlyItems.length > 0 ? (
            <ResolvedEventList items={resolvedOnlyItems} />
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Henüz çözülen olay yok</Text>
              <Text style={styles.emptyBody}>
                Bugün tamamlanan kararlar burada listelenir.
              </Text>
            </View>
          )
        ) : (
          <>
            {showPriority && priorityView && operationPortfolio.isRichDay ? (
              <OlaylarPriorityEventCard
                event={priorityView}
                onPress={() => handleEventPress(priorityView.id)}
              />
            ) : null}

            {showEmptyActive ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Aktif olay kalmadı</Text>
                <Text style={styles.emptyBody}>
                  Bugünün kararlarını tamamladın. Günü bitirerek raporu görüntüleyebilirsin.
                </Text>
                <GameButton title="Günü Bitir" onPress={handleEndDay} />
              </View>
            ) : null}

            {operationPortfolio.isRichDay ? (
              <OlaylarActiveEventsSection
                items={activeEventViews}
                onItemPress={handleEventPress}
              />
            ) : null}

            {filter === 'all' && operationPortfolio.isRichDay ? (
              <ResolvedEventList items={resolvedItems} onItemPress={handleEventPress} />
            ) : null}

            {showFieldStatus ? (
              <OlaylarFieldStatusMini
                status={presentation.fieldStatus}
                onCtaPress={() => {
                  if (primaryOperationEventId) {
                    handleEventPress(primaryOperationEventId);
                  }
                }}
              />
            ) : null}
          </>
        )}
      </EventsBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: olaylar.bg,
  },
  emptyCard: {
    gap: 10,
    padding: 16,
    backgroundColor: olaylar.card,
    borderRadius: olaylar.radiusCard,
    borderWidth: 1,
    borderColor: olaylar.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: olaylar.text,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: olaylar.textMuted,
  },
});
