import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CityMapHero } from '@/features/events/components/olaylar/CityMapHero';
import { EventsBottomSheet } from '@/features/events/components/olaylar/EventsBottomSheet';
import { FloatingEventStats } from '@/features/events/components/olaylar/FloatingEventStats';
import { OlaylarEventsHeader } from '@/features/events/components/olaylar/OlaylarEventsHeader';
import { OlaylarFilterChips } from '@/features/events/components/olaylar/OlaylarFilterChips';
import { OlaylarPriorityEventCard } from '@/features/events/components/olaylar/OlaylarPriorityEventCard';
import { ResolvedEventList } from '@/features/events/components/olaylar/ResolvedEventList';
import { olaylar } from '@/features/events/theme/olaylarScreenTokens';
import type { OlaylarFilterKey } from '@/features/events/types/olaylarScreenTypes';
import {
  buildOlaylarStats,
  buildPriorityEventView,
  buildResolvedEventViews,
  resolveOlaylarPriority,
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
  const endCurrentDay = useGameStore((s) => s.endCurrentDay);

  const [filter, setFilter] = useState<OlaylarFilterKey>('all');

  const stats = useMemo(
    () => buildOlaylarStats(activeEvents, decisionHistory),
    [activeEvents, decisionHistory],
  );

  const { priorityEvent, showPriority } = useMemo(
    () => resolveOlaylarPriority(activeEvents, featuredEventId, filter),
    [activeEvents, featuredEventId, filter],
  );

  const priorityView = useMemo(
    () => buildPriorityEventView(priorityEvent),
    [priorityEvent],
  );

  const resolvedItems = useMemo(
    () => buildResolvedEventViews(decisionHistory, filter !== 'resolved'),
    [decisionHistory, filter],
  );

  const resolvedOnlyItems = useMemo(
    () => buildResolvedEventViews(decisionHistory, false),
    [decisionHistory],
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

      <View style={styles.mapSection}>
        <CityMapHero />
        <FloatingEventStats stats={stats} />
      </View>

      <EventsBottomSheet bottomInset={tabBarHeight}>
        <OlaylarFilterChips active={filter} onChange={setFilter} />

        {showResolvedOnly ? (
          resolvedOnlyItems.length > 0 ? (
            <ResolvedEventList
              items={resolvedOnlyItems}
              onSeeAll={() => {
                // TODO: tüm çözülenler geçmişi
              }}
            />
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
            {showPriority && priorityView ? (
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

            {filter === 'all' ? (
              <ResolvedEventList
                items={resolvedItems}
                onSeeAll={() => {
                  // TODO: tüm çözülenler geçmişi
                }}
                onItemPress={() => {
                  // TODO: çözülen olay detayı
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
  mapSection: {
    height: olaylar.mapHeight + 8,
    position: 'relative',
    zIndex: 1,
  },
  emptyCard: {
    gap: 10,
    padding: 16,
    backgroundColor: olaylar.bg,
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
