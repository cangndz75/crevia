import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { HubCriticalEventCard } from '@/features/hub/components/HubCriticalEventCard';
import { HubDevTools } from '@/features/hub/components/HubDevTools';
import { HubDailyPriorityCard } from '@/features/hub/components/HubDailyPriorityCard';
import { HubFooterActionRow } from '@/features/hub/components/HubFooterActionRow';
import { HubPersonnelStrip } from '@/features/hub/components/HubPersonnelStrip';
import { HubPilotOperationPreviewStrip } from '@/features/hub/components/HubPilotOperationPreviewStrip';
import { PostPilotAgendaBanner } from '@/features/hub/components/PostPilotAgendaBanner';
import { HubQuickActionsPanel } from '@/features/hub/components/HubQuickActionsPanel';
import { HubRegionPulseSection } from '@/features/hub/components/HubRegionPulseSection';
import { HubTaskTrackingHero } from '@/features/hub/components/HubTaskTrackingHero';
import { HubSocialSignalCard } from '@/features/tutorial/HubSocialSignalCard';
import {
  TutorialCoachOverlay,
  useTutorialHighlight,
} from '@/features/tutorial/TutorialCoachOverlay';
import { TutorialTarget } from '@/features/tutorial/TutorialTarget';
import { OnboardingCoachBubble } from '@/features/onboarding/components/OnboardingCoachBubble';
import { useOnboardingHint } from '@/features/onboarding/hooks/useOnboardingHint';
import { useOnboardingHubVisibility } from '@/features/onboarding/hooks/useOnboardingHubVisibility';
import { buildHubScreenLayoutModel } from '@/features/hub/utils/hubScreenPresentation';
import {
  selectActiveTutorialStepForScreen,
  selectIsDay1TutorialActive,
  selectShouldShowTutorialSocialCard,
} from '@/features/tutorial/tutorialSelectors';
import {
  selectActiveEvents,
  selectPostPilotOperation,
  useGameStore,
} from '@/store/useGameStore';
import { GameScreenShell } from '@/ui/components/GameScreenShell';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

/**
 * Merkez ekranı — referans dashboard hiyerarşisi:
 * Günlük hedef → Bugünkü plan → Hızlı hazırlıklar → Personel → Bölge nabzı → Alt CTA
 */
export function HubScreen() {
  const router = useRouter();
  const endCurrentDay = useGameStore((s) => s.endCurrentDay);
  const gameState = useGameStore((s) => s.gameState);
  const postPilotOperation = useGameStore(selectPostPilotOperation);
  const activeEvents = useGameStore(selectActiveEvents);
  const eventCount = activeEvents.length;
  const showSocialCard = useGameStore(selectShouldShowTutorialSocialCard);
  const hubTutorialStep = useGameStore((s) =>
    selectActiveTutorialStepForScreen(s, 'hub'),
  );
  const tutorialActive = useGameStore(selectIsDay1TutorialActive);
  const hubVisibility = useOnboardingHubVisibility();
  const isDay1Layout = hubVisibility.showDailyPriorityCompact;

  const hubLayout = useMemo(
    () =>
      buildHubScreenLayoutModel({
        gameState,
        tutorialActive,
        isDay1Layout,
        activeEventCount: eventCount,
        postPilotOperation,
      }),
    [gameState, tutorialActive, isDay1Layout, eventCount, postPilotOperation],
  );

  const { coachHint, dismissHint } = useOnboardingHint('hub');
  const metricsHighlight = useTutorialHighlight('hub', 'hub_metrics');
  const criticalHighlight = useTutorialHighlight('hub', 'critical_event_card');
  const socialHighlight = useTutorialHighlight('hub', 'social_signal_card');

  const handleEndDay = () => {
    playLightImpactHaptic();
    endCurrentDay();
    router.push('/reports');
  };

  const handleContinueOperation = () => {
    playLightImpactHaptic();
    router.push('/events');
  };

  const continueCount = Math.max(1, eventCount);

  return (
    <GameScreenShell
      headerVariant="dashboard"
      backgroundColor={colors.hubCream}
      contentStyle={styles.content}>
      <View
        style={[styles.body, hubTutorialStep ? styles.bodyWithCoach : null]}>
        <TutorialTarget targetKey="hub_metrics" highlighted={metricsHighlight}>
          <HubTaskTrackingHero variant="compact" />
        </TutorialTarget>

        {hubLayout.showPostPilotAgendaInFocus ? (
          <View style={styles.sectionPad}>
            <PostPilotAgendaBanner compact />
          </View>
        ) : null}

        {hubLayout.showCriticalEventInFocus ? (
          <View style={styles.sectionPad}>
            <TutorialTarget
              targetKey="critical_event_card"
              highlighted={criticalHighlight}>
              <HubCriticalEventCard />
            </TutorialTarget>
          </View>
        ) : null}

        <HubDailyPriorityCard />

        {hubLayout.showPilotPreviewStrip ? (
          <View style={styles.sectionPad}>
            <HubPilotOperationPreviewStrip />
          </View>
        ) : null}

        {hubVisibility.showQuickActionsPanel ? <HubQuickActionsPanel /> : null}

        <HubPersonnelStrip />

        {showSocialCard ? (
          <View style={styles.sectionPad}>
            <TutorialTarget
              targetKey="social_signal_card"
              highlighted={socialHighlight}>
              <HubSocialSignalCard />
            </TutorialTarget>
          </View>
        ) : null}

        <HubRegionPulseSection />

        <HubFooterActionRow
          onEndDay={handleEndDay}
          onContinueOperation={handleContinueOperation}
          continueEventCount={continueCount}
          showContinue={eventCount > 0 || isDay1Layout}
        />

        <HubDevTools />
      </View>
      <TutorialCoachOverlay screen="hub" />
      {coachHint && !hubTutorialStep ? (
        <OnboardingCoachBubble
          hint={coachHint}
          onDismiss={() => dismissHint(coachHint.id)}
        />
      ) : null}
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
    gap: 14,
    paddingBottom: spacing.xxxl,
  },
  bodyWithCoach: {
    paddingBottom: spacing.xxxl + 120,
  },
  sectionPad: {
    paddingHorizontal: spacing.lg,
    minWidth: 0,
  },
});
