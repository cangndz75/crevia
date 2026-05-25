import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActiveEventCompactCard } from '@/features/events/components/ActiveEventCompactCard';
import {
  EventsFilterBar,
  EventsFilterKey,
} from '@/features/events/components/EventsFilterBar';
import { EventsStatusHeader } from '@/features/events/components/EventsStatusHeader';
import { FeaturedEventCard } from '@/features/events/components/FeaturedEventCard';
import { OpportunityEventCard } from '@/features/events/components/OpportunityEventCard';
import { SolvedEventsSection } from '@/features/events/components/SolvedEventsSection';
import { EventCard } from '@/core/models/EventCard';
import {
  selectActiveEvents,
  selectEventOpportunity,
  selectFeaturedEventId,
  useGameStore,
} from '@/store/useGameStore';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { GameButton } from '@/ui/components/GameButton';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

function matchesFilter(event: EventCard, filter: EventsFilterKey): boolean {
  if (filter === 'all') return true;
  if (filter === 'urgent') {
    return (
      event.urgencyHours <= 6 ||
      event.filterTags?.includes('urgent') === true
    );
  }
  if (filter === 'crisis') {
    return (
      event.riskLevel === 'high' ||
      event.riskLevel === 'critical' ||
      event.filterTags?.includes('crisis') === true
    );
  }
  return false;
}

function getCriticalEventCount(events: EventCard[]): number {
  return events.filter(
    (e) => e.riskLevel === 'critical' || e.riskLevel === 'high',
  ).length;
}

export function EventsScreen() {
  const router = useRouter();
  const tabBarHeight = useAppTabBarHeight();
  const bottomPadding = tabBarHeight + spacing.lg;
  const [filter, setFilter] = useState<EventsFilterKey>('all');

  const activeEvents = useGameStore(selectActiveEvents);
  const featuredEventId = useGameStore(selectFeaturedEventId);
  const eventOpportunity = useGameStore(selectEventOpportunity);
  const endCurrentDay = useGameStore((s) => s.endCurrentDay);

  const featured = useMemo(() => {
    return (
      activeEvents.find((e) => e.id === featuredEventId) ?? activeEvents[0]
    );
  }, [activeEvents, featuredEventId]);

  const activeAll = useMemo(() => {
    if (!featured) return activeEvents;
    return activeEvents.filter((e) => e.id !== featured.id);
  }, [activeEvents, featured]);

  const eventCount = activeEvents.length;
  const criticalCount = getCriticalEventCount(activeEvents);

  const showListSections = filter !== 'solved' && filter !== 'opportunity';
  const showOpportunity = filter === 'all' || filter === 'opportunity';
  const showSolved = filter === 'all' || filter === 'solved';

  const showFeatured =
    showListSections &&
    featured != null &&
    matchesFilter(featured, filter === 'all' ? 'all' : filter);

  const activeFiltered = useMemo(() => {
    if (!showListSections) return [];
    const f = filter === 'all' ? 'all' : filter;
    return activeAll.filter((e) => matchesFilter(e, f));
  }, [activeAll, filter, showListSections]);

  const handleEndDay = () => {
    endCurrentDay();
    router.push('/reports');
  };

  return (
    <View style={styles.root}>
      <EventsStatusHeader />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={typography.title}>Olaylar</Text>
          <Text style={styles.subtitle}>
            Şehirde bekleyen kararları yönet.
          </Text>

          <View style={styles.quickStats}>
            <View style={[styles.statPill, styles.statOrange]}>
              <Ionicons name="briefcase-outline" size={14} color={colors.warning} />
              <Text style={[styles.statText, { color: colors.warning }]}>
                {eventCount} aktif olay
              </Text>
            </View>
            <View style={[styles.statPill, styles.statRed]}>
              <Ionicons name="flame-outline" size={14} color={colors.danger} />
              <Text style={[styles.statText, { color: colors.danger }]}>
                {criticalCount} kritik
              </Text>
            </View>
          </View>

          <EventsFilterBar active={filter} onChange={setFilter} />
        </View>

        {showFeatured && featured ? <FeaturedEventCard event={featured} /> : null}

        {showListSections && activeFiltered.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="Aktif Olaylar"
              icon="briefcase-outline"
              iconColor={colors.warning}
            />
            <View style={styles.list}>
              {activeFiltered.map((event) => (
                <ActiveEventCompactCard key={event.id} event={event} />
              ))}
            </View>
          </View>
        ) : null}

        {showListSections && activeEvents.length === 0 ? (
          <View style={styles.emptyActive}>
            <Text style={typography.subtitle}>Aktif olay kalmadı</Text>
            <Text style={styles.emptyBody}>
              Bugünü bitirerek operasyon raporunu görüntüleyebilirsin.
            </Text>
            <GameButton title="Günü Bitir" onPress={handleEndDay} />
          </View>
        ) : null}

        {showOpportunity ? (
          <View style={styles.section}>
            <SectionHeader
              title="Fırsat"
              icon="gift-outline"
              iconColor={colors.success}
            />
            <OpportunityEventCard opportunity={eventOpportunity} />
          </View>
        ) : null}

        {showSolved ? <SolvedEventsSection /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
    paddingTop: spacing.sm,
  },
  intro: {
    gap: spacing.sm,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 20,
  },
  quickStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  statOrange: {
    backgroundColor: colors.warningMuted,
  },
  statRed: {
    backgroundColor: colors.dangerMuted,
  },
  statText: {
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    gap: 0,
  },
  list: {
    gap: spacing.md,
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
