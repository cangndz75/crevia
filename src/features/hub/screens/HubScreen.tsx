import { useEffect, useMemo } from 'react';

import {
  buildCrisisAnalyticsPayload,
  buildResourceAnalyticsPayload,
} from '@/core/analytics/analyticsPayloadBuilders';
import {
  buildCommonAnalyticsBase,
  trackOncePerRuntime,
} from '@/core/analytics/analyticsRuntime';
import {
  buildCityEchoBinding,
  buildCityEchoHubLine,
} from '@/core/cityEchoBinding';
import {
  buildDecisionImpactExplanationForHub,
  buildDecisionImpactHubEcho,
} from '@/core/decisionImpactExplanation';
import {
  buildContentRuntimeActivationSelection,
  resolveContentPackMetaForWiring,
} from '@/core/contentRuntimeActivation';
import { resolveEventCardById } from '@/core/liveFlow/eventLifecycleEngine';
import { deriveMainOperationAccessMode } from '@/core/mainOperation/mainOperationEngine';
import {
  buildMainOperationFeelEceLine,
  buildMainOperationFeelFromStore,
} from '@/core/mainOperationFeel';
import {
  buildHubCarryOverMemory,
  shouldShowCarryOverMemory,
} from '@/core/carryOver/carryOverMemoryPresentation';
import { buildTomorrowRiskPresentation } from '@/core/tomorrowRisk';
import { buildHubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesPresentation';
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
import {
  selectDecisionHistory,
  useGameStore,
} from '@/store/useGameStore';
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
  const operationSignals = useGameStore((s) => s.operationSignals);
  const decisionHistory = useGameStore(selectDecisionHistory);
  const eventPool = useGameStore((s) => s.eventPool);
  const socialPulseState = useGameStore((s) => s.socialPulseState);
  const tutorialActive = useGameStore(selectIsDay1TutorialActive);
  const hubTutorialStep = useGameStore((s) =>
    selectActiveTutorialStepForScreen(s, 'hub'),
  );
  useTutorialHighlight('hub', 'hub_metrics');

  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const postPilotOperation = useGameStore((s) => s.gameState.pilot.postPilotOperation);

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

  const hubPackWiringContext = useMemo(() => {
    const lastDecision = decisionHistory.filter((record) => record.day === hubDay - 1).at(-1);
    if (!lastDecision?.eventId) {
      return { event: undefined, contentPackMeta: undefined };
    }
    const event = resolveEventCardById(lastDecision.eventId, gameState.events, eventPool);
    const contentPackMeta = resolveContentPackMetaForWiring({
      event,
      eventId: lastDecision.eventId,
      districtId: lastDecision.neighborhoodId,
      day: hubDay,
      eventPool,
    });
    return { event, contentPackMeta };
  }, [decisionHistory, eventPool, gameState.events, hubDay]);

  const hubImpactExplanationLine = useMemo(
    () =>
      buildDecisionImpactHubEcho(
        buildDecisionImpactExplanationForHub({
          day: hubDay,
          recentDecisions: decisionHistory,
          event: hubPackWiringContext.event,
          operationSignals,
          resourceFatigue: operationalResources,
          carryOverSummary: hubCarryOverMemory?.summary,
        }),
      ),
    [
      decisionHistory,
      hubCarryOverMemory?.summary,
      hubDay,
      hubPackWiringContext.event,
      operationSignals,
      operationalResources,
    ],
  );

  const tomorrowRiskPresentation = useMemo(
    () =>
      buildTomorrowRiskPresentation({
        day: hubDay,
        carryOver: hubCarryOverMemory ?? undefined,
        operationSignals,
        resourceFatigue: operationalResources,
        socialPulse: {
          globalPulseScore: socialPulseState.globalPulseScore,
        },
        postPilotOperation: gameState.pilot.postPilotOperation ?? undefined,
        contentPackMeta: hubPackWiringContext.contentPackMeta,
        event: hubPackWiringContext.event,
        existingLines: [
          showHubCarryOver ? hubCarryOverMemory?.summary ?? '' : '',
          showHubCarryOver ? hubCarryOverMemory?.detail ?? '' : '',
          hubImpactExplanationLine ?? '',
        ].filter(Boolean),
      }),
    [
      gameState.pilot.postPilotOperation,
      hubCarryOverMemory,
      hubDay,
      hubImpactExplanationLine,
      hubPackWiringContext.contentPackMeta,
      hubPackWiringContext.event,
      operationSignals,
      operationalResources,
      showHubCarryOver,
      socialPulseState.globalPulseScore,
    ],
  );

  const cityEchoHubLine = useMemo(
    () =>
      buildCityEchoHubLine(
        buildCityEchoBinding({
          day: hubDay,
          decisionImpact: buildDecisionImpactExplanationForHub({
            day: hubDay,
            recentDecisions: decisionHistory,
            event: hubPackWiringContext.event,
            operationSignals,
            resourceFatigue: operationalResources,
            carryOverSummary: hubCarryOverMemory?.summary,
          }),
          tomorrowRisk: tomorrowRiskPresentation.hub,
          carryOverSummary: hubCarryOverMemory?.summary,
          event: hubPackWiringContext.event,
          contentPackMeta: hubPackWiringContext.contentPackMeta,
          operationSignals,
          socialPulse: {
            globalPulseScore: socialPulseState.globalPulseScore,
          },
          postPilotPhase: gameState.pilot.postPilotOperation?.phase,
          existingLines: [
            hubCarryOverMemory?.summary ?? '',
            tomorrowRiskPresentation.hub?.mainLine ?? '',
            hubImpactExplanationLine ?? '',
          ].filter(Boolean),
        }),
      ),
    [
      decisionHistory,
      gameState.pilot.postPilotOperation?.phase,
      hubCarryOverMemory?.summary,
      hubDay,
      hubImpactExplanationLine,
      hubPackWiringContext.contentPackMeta,
      hubPackWiringContext.event,
      operationSignals,
      operationalResources,
      socialPulseState.globalPulseScore,
      tomorrowRiskPresentation.hub,
    ],
  );

  const contentPackActivation = useMemo(
    () =>
      buildContentRuntimeActivationSelection({
        day: hubDay,
        postPilotPhase: gameState.pilot.postPilotOperation?.phase,
        accessMode: deriveMainOperationAccessMode(gameState, monetization),
        operationSignals,
        focusDistrictId: operationSignals.priorityDistrictId,
        stableSeed: `${hubDay}|hub`,
      }),
    [gameState, hubDay, monetization, operationSignals],
  );

  const mainOperationFeel = useMemo(
    () =>
      buildMainOperationFeelFromStore({
        gameState,
        monetization,
        mainOperationSeason,
        operationSignals,
        postPilotOperation: postPilotOperation ?? undefined,
        tomorrowRisk: tomorrowRiskPresentation.hub,
        contentPackPresentationHint: contentPackActivation.model.presentationHint,
        cityEchoBinding: buildCityEchoBinding({
          day: hubDay,
          decisionImpact: buildDecisionImpactExplanationForHub({
            day: hubDay,
            recentDecisions: decisionHistory,
            operationSignals,
            resourceFatigue: operationalResources,
            carryOverSummary: hubCarryOverMemory?.summary,
          }),
          tomorrowRisk: tomorrowRiskPresentation.hub,
          carryOverSummary: hubCarryOverMemory?.summary,
          operationSignals,
          socialPulse: {
            globalPulseScore: socialPulseState.globalPulseScore,
          },
          postPilotPhase: gameState.pilot.postPilotOperation?.phase,
          existingLines: [
            hubCarryOverMemory?.summary ?? '',
            tomorrowRiskPresentation.hub?.mainLine ?? '',
          ].filter(Boolean),
        }),
        existingLines: [
          showHubCarryOver ? hubCarryOverMemory?.summary ?? '' : '',
          tomorrowRiskPresentation.hub?.mainLine ?? '',
          cityEchoHubLine ?? '',
        ].filter(Boolean),
      }),
    [
      cityEchoHubLine,
      decisionHistory,
      gameState,
      hubCarryOverMemory?.summary,
      hubDay,
      mainOperationSeason,
      monetization,
      operationSignals,
      operationalResources,
      postPilotOperation,
      showHubCarryOver,
      socialPulseState.globalPulseScore,
      tomorrowRiskPresentation.hub,
      contentPackActivation.model.presentationHint,
    ],
  );

  const hubEceContextLine = useMemo(
    () =>
      buildMainOperationFeelEceLine(mainOperationFeel, [
        cityEchoHubLine ?? '',
        hubImpactExplanationLine ?? '',
        tomorrowRiskPresentation.hub?.mainLine ?? '',
      ].filter(Boolean)),
    [
      cityEchoHubLine,
      hubImpactExplanationLine,
      mainOperationFeel,
      tomorrowRiskPresentation.hub?.mainLine,
    ],
  );

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
      scrollable={false}
      headerVariant="none"
      backgroundColor="#F7F1E6"
      contentStyle={{ paddingHorizontal: 0, paddingTop: 0, gap: 0 }}>
      <HubReferenceHome
        hubCarryOverMemory={hubCarryOverMemory}
        hubImpactExplanationLine={cityEchoHubLine ?? hubImpactExplanationLine}
        hubTomorrowRisk={tomorrowRiskPresentation.hub}
        hubEceContextLine={hubEceContextLine}
        hubMainOperationFeelExistingLines={[
          showHubCarryOver ? hubCarryOverMemory?.summary ?? '' : '',
          tomorrowRiskPresentation.hub?.mainLine ?? '',
          cityEchoHubLine ?? '',
        ].filter(Boolean)}
        showHubCarryOver={showHubCarryOver}
        scrollFooter={
          __DEV__ && !hubCardVisibility.suppressDevTools ? <HubDevTools /> : undefined
        }
      />
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
