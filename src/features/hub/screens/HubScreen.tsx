import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HubContainerSignalCard } from '@/features/hub/components/HubContainerSignalCard';
import { HubCriticalEventCard } from '@/features/hub/components/HubCriticalEventCard';
import { HubDevTools } from '@/features/hub/components/HubDevTools';
import { HubDailyGoalCard } from '@/features/hub/components/HubDailyGoalCard';
import { HubDailyGoalsCard } from '@/features/hub/components/HubDailyGoalsCard';
import { HubDailyPriorityCard } from '@/features/hub/components/HubDailyPriorityCard';
import { HubMiniStatusStrip } from '@/features/hub/components/HubMiniStatusStrip';
import { HubPersonnelStrip } from '@/features/hub/components/HubPersonnelStrip';
import { HubVehicleFleetCard } from '@/features/hub/components/HubVehicleFleetCard';
import { HubPilotReportBanner } from '@/features/hub/components/HubPilotReportBanner';
import { HubLeaderboardShortcut } from '@/features/hub/components/HubLeaderboardShortcut';
import { HubSocialPulseShortcut } from '@/features/hub/components/HubSocialPulseShortcut';
import { HubQuickActions } from '@/features/hub/components/HubQuickActions';
import { HubRegionPulseSection } from '@/features/hub/components/HubRegionPulseSection';
import { HubSocialSignalCard } from '@/features/tutorial/HubSocialSignalCard';
import {
  TutorialCoachOverlay,
  useTutorialHighlight,
} from '@/features/tutorial/TutorialCoachOverlay';
import { TutorialTarget } from '@/features/tutorial/TutorialTarget';
import {
  selectActiveTutorialStepForScreen,
  selectIsDay1TutorialActive,
  selectShouldShowTutorialSocialCard,
} from '@/features/tutorial/tutorialSelectors';
import { selectHubContainerSignal } from '@/core/containers/containerSelectors';
import {
  selectActiveEvents,
  selectContainerState,
  useGameStore,
} from '@/store/useGameStore';
import { GameScreenShell } from '@/ui/components/GameScreenShell';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

export function HubScreen() {
  const router = useRouter();
  const endCurrentDay = useGameStore((s) => s.endCurrentDay);
  const eventCount = useGameStore(selectActiveEvents).length;
  const showSocialCard = useGameStore(selectShouldShowTutorialSocialCard);
  const hubTutorialStep = useGameStore((s) =>
    selectActiveTutorialStepForScreen(s, 'hub'),
  );
  const tutorialActive = useGameStore(selectIsDay1TutorialActive);
  const containerState = useGameStore(selectContainerState);
  const pilotDay = useGameStore(
    (s) => s.gameState.pilot.currentPilotDay ?? s.gameState.city.day,
  );

  const containerSignalCompact = useMemo(() => {
    const signal = selectHubContainerSignal(containerState);
    return pilotDay <= 1 || signal?.severity === 'low';
  }, [containerState, pilotDay]);

  const metricsHighlight = useTutorialHighlight('hub', 'hub_metrics');
  const criticalHighlight = useTutorialHighlight('hub', 'critical_event_card');
  const socialHighlight = useTutorialHighlight('hub', 'social_signal_card');

  const handleEndDay = () => {
    endCurrentDay();
    router.push('/reports');
  };

  return (
    <GameScreenShell
      headerVariant="dashboard"
      backgroundColor={colors.hubCream}
      contentStyle={styles.content}>
      <View
        style={[
          styles.body,
          hubTutorialStep ? styles.bodyWithCoach : null,
        ]}>
        <TutorialTarget targetKey="hub_metrics" highlighted={metricsHighlight}>
          <HubMiniStatusStrip />
        </TutorialTarget>

        <HubDailyPriorityCard />
        <HubDailyGoalsCard />

        <TutorialTarget
          targetKey="critical_event_card"
          highlighted={criticalHighlight}>
          <HubCriticalEventCard />
        </TutorialTarget>

        <HubQuickActions />
        <HubRegionPulseSection />

        <View style={styles.secondarySection}>
          <HubContainerSignalCard
            hidden={tutorialActive}
            compact={containerSignalCompact}
          />
          <HubSocialPulseShortcut hidden={tutorialActive} />
          <HubPersonnelStrip />
          <HubVehicleFleetCard hidden={tutorialActive} />
          <HubLeaderboardShortcut />
        </View>

        {showSocialCard ? (
          <TutorialTarget
            targetKey="social_signal_card"
            highlighted={socialHighlight}>
            <HubSocialSignalCard />
          </TutorialTarget>
        ) : null}

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
      <TutorialCoachOverlay screen="hub" />
    </GameScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    gap: 0,
    paddingTop: 0,
  },
  body: {
    gap: 12,
    paddingBottom: spacing.xxxl,
  },
  bodyWithCoach: {
    paddingBottom: spacing.xxxl + 150,
  },
  secondarySection: {
    gap: 12,
    marginTop: 4,
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
