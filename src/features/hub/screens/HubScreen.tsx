import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { DAY1_STATUS_MUTED_NOTE } from '@/core/onboarding/onboardingPresentation';
import { HubAuthorityProgressChip } from '@/features/hub/components/HubAuthorityProgressChip';
import { HubCriticalEventCard } from '@/features/hub/components/HubCriticalEventCard';
import { HubDevTools } from '@/features/hub/components/HubDevTools';
import { HubDailyGoalCard } from '@/features/hub/components/HubDailyGoalCard';
import { HubCarryOverSignalStrip } from '@/features/hub/components/HubCarryOverSignalStrip';
import { HubTodayFlowStrip } from '@/features/hub/components/HubTodayFlowStrip';
import { HubDailyPriorityCard } from '@/features/hub/components/HubDailyPriorityCard';
import { HubPersonnelStrip } from '@/features/hub/components/HubPersonnelStrip';
import { HubPilotReportBanner } from '@/features/hub/components/HubPilotReportBanner';
import { HubQuickActionsPanel } from '@/features/hub/components/HubQuickActionsPanel';
import { HubRegionPulseSection } from '@/features/hub/components/HubRegionPulseSection';
import { HubRewardsJourney } from '@/features/hub/components/HubRewardsJourney';
import { HubStatusCardsRow } from '@/features/hub/components/HubStatusCardsRow';
import { HubTaskTrackingHero } from '@/features/hub/components/HubTaskTrackingHero';
import { HubSocialSignalCard } from '@/features/tutorial/HubSocialSignalCard';
import {
  TutorialCoachOverlay,
  useTutorialHighlight,
} from '@/features/tutorial/TutorialCoachOverlay';
import { TutorialTarget } from '@/features/tutorial/TutorialTarget';
import { OnboardingCoachBubble } from '@/features/onboarding/components/OnboardingCoachBubble';
import { OnboardingFocusHint } from '@/features/onboarding/components/OnboardingFocusHint';
import { useOnboardingHint } from '@/features/onboarding/hooks/useOnboardingHint';
import { useOnboardingHubVisibility } from '@/features/onboarding/hooks/useOnboardingHubVisibility';
import {
  selectActiveTutorialStepForScreen,
  selectIsDay1TutorialActive,
  selectShouldShowTutorialSocialCard,
} from '@/features/tutorial/tutorialSelectors';
import { selectActiveEvents, useGameStore } from '@/store/useGameStore';
import { GameScreenShell } from '@/ui/components/GameScreenShell';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

/**
 * Merkez ekranı — mockup sırası:
 * Görev Takibi → Kritik Olay → Ödüller → Hızlı Aksiyonlar → Sosyal/Filo → Personel → Bölge → Gün Bitir
 */
export function HubScreen() {
  const router = useRouter();
  const endCurrentDay = useGameStore((s) => s.endCurrentDay);
  const eventCount = useGameStore(selectActiveEvents).length;
  const showSocialCard = useGameStore(selectShouldShowTutorialSocialCard);
  const hubTutorialStep = useGameStore((s) =>
    selectActiveTutorialStepForScreen(s, 'hub'),
  );
  const tutorialActive = useGameStore(selectIsDay1TutorialActive);
  const hubVisibility = useOnboardingHubVisibility();
  const isDay1Layout = hubVisibility.showDailyPriorityCompact;
  const { coachHint, dismissHint } = useOnboardingHint('hub');
  const { focusHint: criticalEventHint } = useOnboardingHint(
    'hub',
    'critical_event_card',
    'critical_event_intro',
  );
  const { focusHint: liveFlowHint } = useOnboardingHint(
    'hub',
    undefined,
    'live_flow_intro',
  );
  const { focusHint: day2GoalsHint } = useOnboardingHint(
    'hub',
    undefined,
    'day2_goals_intro',
  );

  const showInlineFocusHints = !coachHint && !hubTutorialStep;
  const showLiveFlowHint =
    showInlineFocusHints &&
    !!liveFlowHint &&
    !hubVisibility.showTodayFlowPlaceholder;

  const metricsHighlight = useTutorialHighlight('hub', 'hub_metrics');
  const criticalHighlight = useTutorialHighlight('hub', 'critical_event_card');
  const socialHighlight = useTutorialHighlight('hub', 'social_signal_card');

  const handleEndDay = () => {
    playLightImpactHaptic();
    endCurrentDay();
    router.push('/reports');
  };

  const todayFlowBlock =
    hubVisibility.showTodayFlow || hubVisibility.showTodayFlowPlaceholder ? (
      <>
        <HubTodayFlowStrip />
        {showLiveFlowHint ? (
          <OnboardingFocusHint
            hint={liveFlowHint!}
            onDismiss={() => dismissHint(liveFlowHint!.id)}
          />
        ) : null}
      </>
    ) : null;

  const day1FocusStack = isDay1Layout ? (
    <View style={styles.day1Focus}>
      <HubDailyPriorityCard />
      {hubVisibility.showQuickActionsPanel ? <HubQuickActionsPanel /> : null}
      {todayFlowBlock}
    </View>
  ) : null;

  const day2PriorityBlock = !isDay1Layout ? (
    <View style={styles.priorityWrap}>
      <HubDailyPriorityCard />
      {hubVisibility.showCarryOverStrip ? <HubCarryOverSignalStrip /> : null}
    </View>
  ) : null;

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
          <HubTaskTrackingHero />
        </TutorialTarget>

        <HubAuthorityProgressChip />

        <View style={styles.criticalWrap}>
          {showInlineFocusHints && criticalEventHint ? (
            <View style={styles.hintPad}>
              <OnboardingFocusHint
                hint={criticalEventHint}
                onDismiss={() => dismissHint(criticalEventHint.id)}
              />
            </View>
          ) : null}
          <TutorialTarget
            targetKey="critical_event_card"
            highlighted={criticalHighlight}>
            <HubCriticalEventCard />
          </TutorialTarget>
        </View>

        <HubRewardsJourney />

        {day1FocusStack}

        {!isDay1Layout && showInlineFocusHints && day2GoalsHint ? (
          <View style={styles.hintPad}>
            <OnboardingFocusHint
              hint={day2GoalsHint}
              onDismiss={() => dismissHint(day2GoalsHint.id)}
            />
          </View>
        ) : null}

        {!isDay1Layout ? day2PriorityBlock : null}

        {!isDay1Layout && hubVisibility.showQuickActionsPanel ? (
          <HubQuickActionsPanel />
        ) : null}

        {!isDay1Layout ? (
          <View style={styles.priorityWrap}>{todayFlowBlock}</View>
        ) : null}

        <HubStatusCardsRow
          hidden={tutorialActive}
          mutedNote={
            hubVisibility.muteStatusCards ? DAY1_STATUS_MUTED_NOTE : undefined
          }
        />

        <HubPersonnelStrip />

        {showSocialCard ? (
          <TutorialTarget
            targetKey="social_signal_card"
            highlighted={socialHighlight}>
            <HubSocialSignalCard />
          </TutorialTarget>
        ) : null}

        <HubRegionPulseSection />

        <HubDailyGoalCard onEndDay={handleEndDay} endDayOnly />
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
  priorityWrap: {
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  day1Focus: {
    gap: 16,
  },
  criticalWrap: {
    marginTop: -2,
  },
  hintPad: {
    paddingHorizontal: spacing.lg,
  },
  moreEventsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  moreEventsText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.hubGoldDark,
  },
});
