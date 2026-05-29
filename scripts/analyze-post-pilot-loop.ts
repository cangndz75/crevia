/**
 * 3 günlük post-pilot hafif operasyon simülasyon özeti.
 * Çalıştır: npm run analyze:post-pilot
 */

import { createInitialAuthorityState } from '../src/core/authority/authoritySeed';
import { createInitialBadgeState } from '../src/core/badges/badgeSeed';
import { calculateDailyAuthorityTrustGain } from '../src/core/authority/authorityEngine';
import { buildAuthorityDailyGainInput } from '../src/core/authority/authoritySelectors';
import { processDailyBadgeEvaluation } from '../src/core/badges/badgeEngine';
import { buildDailyBadgeEvaluationInput } from '../src/core/badges/badgeSelectors';
import { createDay1Seed } from '../src/core/content/day1Seed';
import { createDefaultPilotState } from '../src/core/game/createDefaultPilotState';
import {
  applyPostPilotEventGenerationToGameState,
  ensurePostPilotDailyEventsForDay,
} from '../src/core/postPilot/postPilotEventEngine';
import { POST_PILOT_FIRST_OPERATION_DAY } from '../src/core/postPilot/postPilotEventConstants';
import { applyDerivedScopesToPostPilotState } from '../src/core/postPilot/postPilotOperationEngine';
import type { GameState } from '../src/core/models/GameState';

function lightState(day: number) {
  const postPilot = applyDerivedScopesToPostPilotState(
    {
      phase: 'main_operation_light',
      scopes: {
        istasyon: 'agenda',
        yesilvadi: 'preview',
        main_operation: 'agenda',
      },
      operationDay: day,
      lastUpdatedDay: day,
    },
    {
      postPilotOperation: {
        phase: 'main_operation_light',
        scopes: {
          istasyon: 'agenda',
          yesilvadi: 'preview',
          main_operation: 'agenda',
        },
      },
      pilotStatus: 'completed',
      authorityState: { ...createInitialAuthorityState(7), authorityTrust: 420 },
    },
  );

  const seed = createDay1Seed();
  return {
    ...seed.gameState,
    city: { ...seed.gameState.city, day },
    pilot: {
      ...createDefaultPilotState(),
      status: 'completed' as const,
      currentPilotDay: 7,
      selectedDistrictId: 'central' as const,
      authorityState: { ...createInitialAuthorityState(7), authorityTrust: 420 },
      badgeState: createInitialBadgeState(7),
      postPilotOperation: postPilot,
    },
  } as GameState;
}

let gameState = lightState(POST_PILOT_FIRST_OPERATION_DAY);
let warnings = 0;
let completedEvents = 0;
let authorityGainTotal = 0;
let badgeGainTotal = 0;

for (let offset = 0; offset < 3; offset += 1) {
  const day = POST_PILOT_FIRST_OPERATION_DAY + offset;
  gameState = { ...gameState, city: { ...gameState.city, day } };
  const postPilot = gameState.pilot.postPilotOperation!;
  const gen = ensurePostPilotDailyEventsForDay({
    gameState,
    postPilotOperation: { ...postPilot, postPilotDailyEventSet: undefined },
    day,
  });
  gameState = applyPostPilotEventGenerationToGameState(gameState, gen);

  const eventCount = gen.events.length;
  if (eventCount === 0) {
    warnings += 1;
  }

  const resolvedId = gen.events[0]?.id;
  if (resolvedId) {
    gameState = {
      ...gameState,
      solvedEvents: [
        ...gameState.solvedEvents,
        { id: resolvedId, title: gen.events[0]!.title, xpEarned: 4 },
      ],
      pilot: {
        ...gameState.pilot,
        completedEventIds: [...gameState.pilot.completedEventIds, resolvedId],
      },
    };
    completedEvents += 1;
  }

  const authorityGain = calculateDailyAuthorityTrustGain(
    buildAuthorityDailyGainInput({
      day,
      dailyEventSet: null,
      decisionHistory: [],
      activeEvents: gameState.events,
      dailyGoalState: null,
      metricsBefore: {
        publicSatisfaction: gameState.city.publicSatisfaction,
        staffMorale: gameState.city.morale,
        budget: gameState.city.budget,
      },
      metricsAfter: {
        publicSatisfaction: gameState.city.publicSatisfaction,
        staffMorale: gameState.city.morale,
        budget: gameState.city.budget,
      },
      socialPulseStateBefore: null,
      socialPulseStateAfter: null,
      butterflyHookState: gameState.pilot.butterflyHookState,
    }),
    gameState.pilot.authorityState ?? createInitialAuthorityState(day),
  );
  authorityGainTotal += authorityGain.netGain;

  const badgeResult = processDailyBadgeEvaluation({
    badgeState: gameState.pilot.badgeState,
    day,
    input: buildDailyBadgeEvaluationInput({
      day,
      decisionHistory: [],
      activeEvents: gameState.events,
      eventPool: gen.eventPool,
      dailyEventSet: null,
      dailyGoalState: null,
      metricsBefore: {
        publicSatisfaction: gameState.city.publicSatisfaction,
        staffMorale: gameState.city.morale,
        budget: gameState.city.budget,
      },
      metricsAfter: {
        publicSatisfaction: gameState.city.publicSatisfaction,
        staffMorale: gameState.city.morale,
        budget: gameState.city.budget,
      },
      socialPulseStateBefore: null,
      socialPulseStateAfter: null,
      butterflyHookState: gameState.pilot.butterflyHookState,
      containerState: null,
      vehicleState: null,
      personnelState: null,
      hubQuickActionState: null,
      authorityDailyGain: authorityGain,
    }),
  });
  badgeGainTotal += badgeResult.snapshot.earnedBadgeIds.length;
  gameState = {
    ...gameState,
    pilot: { ...gameState.pilot, badgeState: badgeResult.badgeState },
  };

  // eslint-disable-next-line no-console
  console.log(
    `Gün ${day}: events=${eventCount} completed=${completedEvents} authority+${authorityGain.netGain} badges+${badgeResult.snapshot.earnedBadgeIds.length}`,
  );
}

// eslint-disable-next-line no-console
console.log('\nÖzet (3 gün):', {
  completedEvents,
  authorityGainTotal,
  badgeGainTotal,
  warnings,
});
