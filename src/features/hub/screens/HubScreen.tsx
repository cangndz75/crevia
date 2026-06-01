import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  buildCrisisAnalyticsPayload,
  buildResourceAnalyticsPayload,
} from '@/core/analytics/analyticsPayloadBuilders';
import {
  buildCommonAnalyticsBase,
  trackOncePerRuntime,
} from '@/core/analytics/analyticsRuntime';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { HubFirstTenMinutesGuideCard } from '@/features/hub/components/HubFirstTenMinutesGuideCard';
import { HubAdvisorCard } from '@/features/hub/components/HubAdvisorCard';
import { HubDailyOperationsPlanCard } from '@/features/hub/components/HubDailyOperationsPlanCard';
import { HubCrisisActionCard } from '@/features/hub/components/HubCrisisActionCard';
import { HubCrisisDeskCard } from '@/features/hub/components/HubCrisisDeskCard';
import { HubMainOperationSeasonCard } from '@/features/hub/components/HubMainOperationSeasonCard';
import { HubLiveOperationsCard } from '@/features/hub/components/HubLiveOperationsCard';
import { HubOperationalResourcesCard } from '@/features/hub/components/HubOperationalResourcesCard';
import { HubOperationSignalsCard } from '@/features/hub/components/HubOperationSignalsCard';
import { HubCriticalEventCard } from '@/features/hub/components/HubCriticalEventCard';
import { HubDevTools } from '@/features/hub/components/HubDevTools';
import { HubDailyGoalHeroCard } from '@/features/hub/components/HubDailyGoalHeroCard';
import { HubPilotThemeCard } from '@/features/hub/components/HubPilotThemeCard';
import { HubDailyPriorityCard } from '@/features/hub/components/HubDailyPriorityCard';
import { HubFooterActionRow } from '@/features/hub/components/HubFooterActionRow';
import { HubPersonnelStrip } from '@/features/hub/components/HubPersonnelStrip';
import { HubPilotOperationPreviewStrip } from '@/features/hub/components/HubPilotOperationPreviewStrip';
import { HubPremiumHeader } from '@/features/hub/components/HubPremiumHeader';
import { PostPilotAgendaBanner } from '@/features/hub/components/PostPilotAgendaBanner';
import { HubQuickActionsPanel } from '@/features/hub/components/HubQuickActionsPanel';
import { HubRegionPulseSection } from '@/features/hub/components/HubRegionPulseSection';
import { hubAssets } from '@/features/hub/utils/hubAssets';
import { HubSocialSignalCard } from '@/features/tutorial/HubSocialSignalCard';
import {
  TutorialCoachOverlay,
  useTutorialHighlight,
} from '@/features/tutorial/TutorialCoachOverlay';
import { TutorialTarget } from '@/features/tutorial/TutorialTarget';
import { OnboardingCoachBubble } from '@/features/onboarding/components/OnboardingCoachBubble';
import { useOnboardingHint } from '@/features/onboarding/hooks/useOnboardingHint';
import { useOnboardingHubVisibility } from '@/features/onboarding/hooks/useOnboardingHubVisibility';
import { buildHubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesPresentation';
import { buildHubScreenLayoutModel } from '@/features/hub/utils/hubScreenPresentation';
import { HUB_PREMIUM_LAYOUT } from '@/features/hub/utils/hubPremiumPresentation';
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
 * Merkez ekranı — premium mobil oyun merkezi hiyerarşisi:
 * Header → Günlük hedef → Kritik olay → Öncelik → Hızlı aksiyonlar → Personel → Bölge nabzı → Alt CTA
 */
export function HubScreen() {
  const router = useRouter();
  const endCurrentDay = useGameStore((s) => s.endCurrentDay);
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const crisisState = useGameStore((s) => s.crisisState);
  const operationalResources = useGameStore((s) => s.operationalResources);
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

  const hubCardVisibility = useMemo(
    () => buildHubCardVisibilityModel(gameState, monetization),
    [gameState, monetization],
  );

  const hubDay = gameState.city.day;

  useEffect(() => {
    const base = buildCommonAnalyticsBase(gameState, 'hub', monetization);
    trackOncePerRuntime(`day_started:${hubDay}`, 'day_started', base);

    if (hubCardVisibility.showFirstDayGuide) {
      trackOncePerRuntime(`first_guide_seen:${hubDay}`, 'first_guide_seen', base, {
        isTutorial: true,
      });
    }

    if (hubCardVisibility.showDailyPlan !== 'hidden') {
      trackOncePerRuntime(`daily_plan_seen:${hubDay}`, 'daily_plan_seen', base);
    }

    if (hubCardVisibility.showOperationalResources) {
      trackOncePerRuntime(
        `operational_resources_card_seen:${hubDay}`,
        'operational_resources_card_seen',
        base,
        buildResourceAnalyticsPayload(operationalResources),
      );
    }

    if (hubCardVisibility.showMainOperationSeason) {
      trackOncePerRuntime(`season_goal_card_seen:${hubDay}`, 'season_goal_card_seen', base);
    }

    if (hubCardVisibility.showCrisis) {
      trackOncePerRuntime(
        `crisis_desk_seen:${hubDay}`,
        'crisis_desk_seen',
        base,
        buildCrisisAnalyticsPayload(crisisState, gameState, monetization),
      );
    }
  }, [
    crisisState,
    gameState,
    hubCardVisibility.showCrisis,
    hubCardVisibility.showDailyPlan,
    hubCardVisibility.showFirstDayGuide,
    hubCardVisibility.showMainOperationSeason,
    hubCardVisibility.showOperationalResources,
    hubDay,
    monetization,
    operationalResources,
  ]);

  const { coachHint, dismissHint } = useOnboardingHint('hub');
  const metricsHighlight = useTutorialHighlight('hub', 'hub_metrics');
  const criticalHighlight = useTutorialHighlight('hub', 'critical_event_card');
  const socialHighlight = useTutorialHighlight('hub', 'social_signal_card');

  const handleEndDay = useCallback(() => {
    playLightImpactHaptic();
    endCurrentDay();
    router.push('/reports');
  }, [endCurrentDay, router]);

  const handleContinueOperation = useCallback(() => {
    playLightImpactHaptic();
    router.push('/events');
  }, [router]);

  const continueCount = Math.max(1, eventCount);

  return (
    <GameScreenShell
      headerVariant="none"
      backgroundColor={colors.hubCream}
      contentStyle={styles.content}>
      <HubPremiumHeader />

      <View
        style={[styles.body, hubTutorialStep ? styles.bodyWithCoach : null]}>
        <TutorialTarget targetKey="hub_metrics" highlighted={metricsHighlight}>
          <HubDailyGoalHeroCard imageSource={hubAssets.dailyGoalBadge} />
        </TutorialTarget>

        {hubDay >= 1 && hubDay <= 7 ? <HubPilotThemeCard /> : null}

        {hubCardVisibility.showFirstDayGuide ? <HubFirstTenMinutesGuideCard /> : null}

        {hubCardVisibility.showAdvisor !== 'hidden' ? (
          <HubAdvisorCard
            compact={
              hubCardVisibility.showAdvisor === 'compact' || isDay1Layout
            }
          />
        ) : null}

        {hubCardVisibility.showDailyPlan !== 'hidden' ? (
          <HubDailyOperationsPlanCard
            compact={
              hubCardVisibility.showDailyPlan === 'compact' || isDay1Layout
            }
          />
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

        {hubCardVisibility.showPostPilotPreview && hubLayout.showPostPilotAgendaInFocus ? (
          <View style={styles.sectionPad}>
            <PostPilotAgendaBanner compact />
          </View>
        ) : null}

        {hubCardVisibility.showOperationSignals !== 'hidden' ? (
          <HubOperationSignalsCard
            compact={hubCardVisibility.showOperationSignals === 'compact'}
          />
        ) : null}

        {hubCardVisibility.showOperationalResources ? (
          <HubOperationalResourcesCard />
        ) : null}

        {hubCardVisibility.showLiveOperations ? (
          <HubLiveOperationsCard compact={isDay1Layout} />
        ) : null}

        {hubCardVisibility.showMainOperationSeason ? (
          <HubMainOperationSeasonCard compact={isDay1Layout} />
        ) : null}

        {hubCardVisibility.showCrisis ? (
          <HubCrisisDeskCard compact={isDay1Layout} />
        ) : null}

        {hubCardVisibility.showCrisisActions ? (
          <HubCrisisActionCard compact={isDay1Layout} />
        ) : null}

        <HubDailyPriorityCard />

        {hubCardVisibility.showPostPilotPreview && hubLayout.showPilotPreviewStrip ? (
          <View style={styles.sectionPad}>
            <HubPilotOperationPreviewStrip />
          </View>
        ) : null}

        {hubVisibility.showQuickActionsPanel ? <HubQuickActionsPanel /> : null}

        {hubCardVisibility.showPersonnelStrip ? <HubPersonnelStrip /> : null}

        {showSocialCard ? (
          <View style={styles.sectionPad}>
            <TutorialTarget
              targetKey="social_signal_card"
              highlighted={socialHighlight}>
              <HubSocialSignalCard />
            </TutorialTarget>
          </View>
        ) : null}

        {hubCardVisibility.showRegionPulse ? <HubRegionPulseSection /> : null}

        <HubFooterActionRow
          onEndDay={handleEndDay}
          onContinueOperation={handleContinueOperation}
          continueEventCount={continueCount}
          showContinue={eventCount > 0 || isDay1Layout}
        />

        {__DEV__ ? <HubDevTools /> : null}
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
    paddingBottom: HUB_PREMIUM_LAYOUT.scrollBottomMin,
  },
  body: {
    gap: 12,
    paddingBottom: spacing.xl,
  },
  bodyWithCoach: {
    paddingBottom: spacing.xl + 120,
  },
  sectionPad: {
    minWidth: 0,
  },
});
