import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { DistrictContextCard } from '@/features/events/components/decision-center/DistrictContextCard';
import { EventFilterChips } from '@/features/events/components/decision-center/EventFilterChips';
import { EventSummaryChips } from '@/features/events/components/decision-center/EventSummaryChips';
import { PendingEventsList } from '@/features/events/components/decision-center/PendingEventsList';
import { PriorityEventCard } from '@/features/events/components/decision-center/PriorityEventCard';
import { ResolvedEventsPreview } from '@/features/events/components/decision-center/ResolvedEventsPreview';
import { checkDecisionAffordability } from '@/core/economy/economyAffordability';
import {
  buildDistrictContext,
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
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

export function EventsDecisionCenterScreen() {
  const router = useRouter();

  const activeEvents = useGameStore(selectActiveEvents);
  const featuredEventId = useGameStore(selectFeaturedEventId);
  const decisionHistory = useGameStore(selectDecisionHistory);
  const applyDecisionAction = useGameStore((s) => s.applyDecision);
  const economyState = useGameStore((s) => s.economyState);
  const endCurrentDay = useGameStore((s) => s.endCurrentDay);

  const [filter, setFilter] = useState<EventScreenFilterKey>('all');
  const [focusOverrideId, setFocusOverrideId] = useState<string | null>(null);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(
    null,
  );

  const storePriority = useMemo(
    () => pickPriorityEvent(activeEvents, featuredEventId),
    [activeEvents, featuredEventId],
  );

  const priorityEvent = useMemo(() => {
    if (focusOverrideId) {
      return (
        activeEvents.find((e) => e.id === focusOverrideId) ?? storePriority
      );
    }
    return storePriority;
  }, [activeEvents, focusOverrideId, storePriority]);

  const summaryStats = useMemo(
    () => computeDaySummary(activeEvents, decisionHistory),
    [activeEvents, decisionHistory],
  );

  const districtContext = useMemo(
    () => buildDistrictContext(priorityEvent, activeEvents),
    [priorityEvent, activeEvents],
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

  const priorityAffordability = useMemo(() => {
    if (!priorityEvent) {
      return {};
    }
    return Object.fromEntries(
      priorityEvent.decisions.map((d) => [
        d.id,
        checkDecisionAffordability({ economyState, decision: d }),
      ]),
    );
  }, [economyState, priorityEvent]);

  const handleSelectDecision = useCallback(
    (decisionId: string) => {
      if (!priorityEvent) return;

      const decision = priorityEvent.decisions.find((d) => d.id === decisionId);
      if (!decision) return;

      const affordability = priorityAffordability[decisionId];
      if (affordability && !affordability.canAfford) {
        Alert.alert(
          'Kaynak yetersiz',
          `Bu karar için ${affordability.formattedMissingSource} Kaynak daha gerekiyor.`,
          [{ text: 'Tamam' }],
        );
        return;
      }

      setSelectedDecisionId(decisionId);

      Alert.alert(
        'Kararı Onayla',
        `"${decision.title}" seçeneğini uygulamak istiyor musun?`,
        [
          {
            text: 'İptal',
            style: 'cancel',
            onPress: () => setSelectedDecisionId(null),
          },
          {
            text: 'Onayla',
            onPress: () => {
              try {
                const result = applyDecisionAction(priorityEvent.id, decisionId);
                if (
                  result.success === false &&
                  result.reason === 'insufficient_source'
                ) {
                  const blocked = checkDecisionAffordability({
                    economyState,
                    decision,
                  });
                  Alert.alert(
                    'Kaynak yetersiz',
                    `Bu karar için ${blocked.formattedMissingSource} Kaynak daha gerekiyor.`,
                    [{ text: 'Tamam' }],
                  );
                  setSelectedDecisionId(null);
                  return;
                }
                setSelectedDecisionId(null);
                setFocusOverrideId(null);
              } catch {
                Alert.alert(
                  'Karar uygulanamadı',
                  'Bu olay artık aktif değil. Listeyi yenile.',
                );
                setSelectedDecisionId(null);
              }
            },
          },
        ],
      );
    },
    [applyDecisionAction, economyState, priorityAffordability, priorityEvent],
  );

  const handlePendingPress = useCallback((eventId: string) => {
    setFocusOverrideId(eventId);
    setSelectedDecisionId(null);
  }, []);

  const handleEndDay = () => {
    endCurrentDay();
    router.push('/reports');
  };

  return (
    <GameScreenShell screenTitle="Olaylar" contentStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.subtitle}>
          Şehirdeki gelişmeleri takip et, karar ver ve etkilerini yönet.
        </Text>
      </View>

      <EventSummaryChips stats={summaryStats} />
      <EventFilterChips active={filter} onChange={setFilter} />
      <DistrictContextCard context={districtContext} />

      {filter === 'resolved' ? (
        <ResolvedEventsPreview records={decisionHistory} />
      ) : (
        <>
          {showPriority ? (
            <PriorityEventCard
              event={priorityEvent}
              selectedDecisionId={selectedDecisionId}
              onSelectDecision={handleSelectDecision}
              affordabilityByDecisionId={priorityAffordability}
            />
          ) : null}

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
            onEventPress={handlePendingPress}
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
    gap: spacing.lg,
  },
  intro: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    maxWidth: '95%',
  },
  emptyActive: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
