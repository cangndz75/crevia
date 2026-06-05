import { useEffect, useMemo } from 'react';

import {
  buildCrisisAnalyticsPayload,
  buildResourceAnalyticsPayload,
} from '@/core/analytics/analyticsPayloadBuilders';
import {
  buildCommonAnalyticsBase,
  trackOncePerRuntime,
} from '@/core/analytics/analyticsRuntime';
import { buildHubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesPresentation';
import {
  buildHubCarryOverMemory,
  shouldShowCarryOverMemory,
} from '@/core/carryOver/carryOverMemoryPresentation';
import { HubDevTools } from '@/features/hub/components/HubDevTools';
import { HubReferenceHome } from '@/features/hub/components/HubReferenceHome';
import { buildHubScreenLayoutModel } from '@/features/hub/utils/hubScreenPresentation';
import { OnboardingCoachBubble } from '@/features/onboarding/components/OnboardingCoachBubble';
import { useOnboardingHint } from '@/features/onboarding/hooks/useOnboardingHint';
import {
  TutorialCoachOverlay,
  useTutorialHighlight,
} from '@/features/tutorial/TutorialCoachOverlay';
import {
  selectActiveTutorialStepForScreen,
  selectIsDay1TutorialActive,
} from '@/features/tutorial/tutorialSelectors';
import { useGameStore } from '@/store/useGameStore';
import { GameScreenShell } from '@/ui/components/GameScreenShell';

/**
 * Merkez ekranı — referans görseldeki premium mobil home kompozisyonu.
 * Scope: presentation/UI only. Core gameplay, persist ve navigation route yapısı değişmez.
 */
export function HubScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const crisisState = useGameStore((s) => s.crisisState);
  const operationalResources = useGameStore((s) => s.operationalResources);
  const tutorialActive = useGameStore(selectIsDay1TutorialActive);
  const hubTutorialStep = useGameStore((s) =>
    selectActiveTutorialStepForScreen(s, 'hub'),
  );
  useTutorialHighlight('hub', 'hub_metrics');

  const hubCardVisibility = buildHubCardVisibilityModel(gameState, monetization);
  const hubDay = gameState.city.day;
  const hubLayoutModel = useMemo(
    () =>
      buildHubScreenLayoutModel({
        gameState,
        tutorialActive,
        isDay1Layout: hubDay <= 1,
        activeEventCount: gameState.events.length,
        postPilotOperation: gameState.pilot.postPilotOperation,
      }),
    [gameState, hubDay, tutorialActive],
  );

  const hubCarryOverMemory = useMemo(
    () => buildHubCarryOverMemory({ day: hubDay }),
    [hubDay],
  );

  const showHubCarryOver =
    hubCarryOverMemory?.visible === true &&
    shouldShowCarryOverMemory(hubDay, 'hub', { day: hubDay });

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
  void hubLayoutModel;

  return (
    <GameScreenShell
      headerVariant="none"
      backgroundColor="#F7F1E6"
      contentStyle={{ paddingHorizontal: 0, paddingTop: 0, gap: 0, paddingBottom: 118 }}>
      <HubReferenceHome
        hubCarryOverMemory={hubCarryOverMemory}
        showHubCarryOver={showHubCarryOver}
      />
      {__DEV__ ? <HubDevTools /> : null}
      <TutorialCoachOverlay screen="hub" />
      {coachHint && !hubTutorialStep && tutorialActive ? (
        <OnboardingCoachBubble
          hint={coachHint}
          onDismiss={() => dismissHint(coachHint.id)}
        />
      ) : null}
    </GameScreenShell>
  );
}
