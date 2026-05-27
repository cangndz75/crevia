import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HubCriticalEventCard } from '@/features/hub/components/HubCriticalEventCard';
import { HubDevTools } from '@/features/hub/components/HubDevTools';
import { HubDailyGoalCard } from '@/features/hub/components/HubDailyGoalCard';
import { HubMetricsGrid } from '@/features/hub/components/HubMetricsGrid';
import { HubPersonnelStrip } from '@/features/hub/components/HubPersonnelStrip';
import { HubPilotReportBanner } from '@/features/hub/components/HubPilotReportBanner';
import { HubQuickActions } from '@/features/hub/components/HubQuickActions';
import { HubRegionPulseSection } from '@/features/hub/components/HubRegionPulseSection';
import { HubStatusSummaryCard } from '@/features/hub/components/HubStatusSummaryCard';
import { selectActiveEvents, useGameStore } from '@/store/useGameStore';
import { GameScreenShell } from '@/ui/components/GameScreenShell';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

export function HubScreen() {
  const router = useRouter();
  const endCurrentDay = useGameStore((s) => s.endCurrentDay);
  const eventCount = useGameStore(selectActiveEvents).length;

  const handleEndDay = () => {
    endCurrentDay();
    router.push('/reports');
  };

  return (
    <GameScreenShell
      headerVariant="dashboard"
      backgroundColor={colors.hubCream}
      contentStyle={styles.content}>
      <View style={styles.body}>
        <HubStatusSummaryCard />
        <HubMetricsGrid />
        <HubPersonnelStrip />

        <View style={styles.lowerSection}>
          <HubCriticalEventCard />
          <HubQuickActions />
        </View>

        <HubRegionPulseSection />
        <HubDailyGoalCard onEndDay={handleEndDay} />
        <HubPilotReportBanner />

        {eventCount > 1 && (
          <Pressable
            onPress={() => router.push('/events')}
            style={styles.moreEventsLink}>
            <Text style={styles.moreEventsText}>
              +{eventCount - 1} bekleyen olay daha
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.hubGoldDark}
            />
          </Pressable>
        )}

        <HubDevTools />
      </View>
    </GameScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    gap: 0,
  },
  body: {
    gap: 14,
    paddingBottom: spacing.xxxl,
  },
  lowerSection: {
    gap: 14,
    marginTop: 2,
  },
  moreEventsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  moreEventsText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.hubGoldDark,
  },
});
