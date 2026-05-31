import {
  createPilotRun,
  finalizePilotRun,
  metricsFromCity,
  unlockStateForCompletedRun,
} from '@/core/game/pilotRun';
import type { GameState } from '@/core/models/GameState';
import type { PilotFinalResult } from '@/core/models/PilotGameState';
import { applyDerivedScopesToPostPilotState } from '@/core/postPilot/postPilotOperationEngine';
import {
  createInitialPostPilotOperationState,
  normalizePostPilotOperationState,
} from '@/core/postPilot/postPilotOperationSeed';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  canShowPostPilotOffer,
  getMainOperationAccess,
  isMainOperationOfferAvailable,
  isMainOperationPackOwned,
  syncMonetizationAfterPilotComplete,
  syncMonetizationForActivePilot,
} from './monetizationState';
import type { MainOperationAccess, MonetizationState } from './monetizationTypes';

export type PostPilotAccessMode = 'pilot' | 'offer' | 'limited' | 'full';

export function deriveMonetizationStateFromGameState(
  gameState: GameState,
  persisted?: MonetizationState,
): MonetizationState {
  const base = persisted ?? {
    mainOperationAccess: 'none' as const,
    offerStatus: 'not_available' as const,
    hasSeenMainOperationOffer: false,
    ownedPacks: [],
  };

  if (gameState.pilot.status !== 'completed') {
    return syncMonetizationForActivePilot(base);
  }

  if (isMainOperationPackOwned(base)) {
    return {
      ...base,
      mainOperationAccess: 'full',
      offerStatus: 'mock_purchased',
    };
  }

  if (base.mainOperationAccess === 'limited') {
    return {
      ...base,
      mainOperationAccess: 'limited',
      offerStatus: 'limited_selected',
    };
  }

  if (isMainOperationOfferAvailable(gameState)) {
    return syncMonetizationAfterPilotComplete(
      base,
      Math.max(gameState.city.day, gameState.pilot.currentPilotDay),
    );
  }

  return base;
}

export function shouldRouteToPostPilotOffer(
  gameState: GameState,
  monetization: MonetizationState,
): boolean {
  if (!isMainOperationOfferAvailable(gameState)) {
    return false;
  }
  const day = gameState.pilot.currentPilotDay;
  if (day < 7) {
    return false;
  }
  return canShowPostPilotOffer(gameState, monetization);
}

export function getPostPilotAccessMode(
  gameState: GameState,
  monetization: MonetizationState,
): PostPilotAccessMode {
  if (gameState.pilot.status !== 'completed') {
    return 'pilot';
  }
  const access = getMainOperationAccess(monetization);
  if (access === 'full') return 'full';
  if (access === 'limited') return 'limited';
  if (access === 'offer_available') return 'offer';
  return 'pilot';
}

export function shouldShowMainOperationOfferCta(
  gameState: GameState,
  monetization: MonetizationState,
): boolean {
  return getPostPilotAccessMode(gameState, monetization) === 'offer';
}

export function shouldShowLimitedContinueCta(
  gameState: GameState,
  monetization: MonetizationState,
): boolean {
  const mode = getPostPilotAccessMode(gameState, monetization);
  return mode === 'offer' || mode === 'limited';
}

export function isFullMainOperationAccess(
  gameState: GameState,
  monetization: MonetizationState,
): boolean {
  if (getMainOperationAccess(monetization) === 'full') {
    return true;
  }
  return gameState.pilot.run?.unlockState?.fullMainOperationUnlocked === true;
}

export function applyFullAccessToGameState(gameState: GameState): GameState {
  const closingDay = gameState.pilot.currentPilotDay;
  const operationDay = Math.max(
    POST_PILOT_FIRST_OPERATION_DAY,
    gameState.city.day,
    closingDay + 1,
  );

  let postPilot = normalizePostPilotOperationState(
    gameState.pilot.postPilotOperation,
    { pilotStatus: 'completed', currentPilotDay: closingDay },
  );

  postPilot = {
    ...postPilot,
    phase: 'main_operation_full',
    lastUpdatedDay: operationDay,
    operationDay,
    lightOperationStartedAt:
      postPilot.lightOperationStartedAt ?? new Date().toISOString(),
  };

  postPilot = applyDerivedScopesToPostPilotState(postPilot, {
    postPilotOperation: postPilot,
    pilotStatus: 'completed',
    authorityState: gameState.pilot.authorityState,
  });

  const finalMetrics = metricsFromCity(gameState.city);
  let run = gameState.pilot.run;
  if (!run && gameState.pilot.selectedDistrictId) {
    run = finalizePilotRun(
      createPilotRun(gameState.pilot.selectedDistrictId),
      finalMetrics,
      closingDay,
    );
  }
  const nextRun = run
    ? {
        ...run,
        isCompleted: true,
        completedAt: run.completedAt ?? new Date().toISOString(),
        unlockState: {
          ...unlockStateForCompletedRun(),
          fullMainOperationUnlocked: true,
          mainOperationPreviewUnlocked: true,
          cityMapPreviewUnlocked: true,
        },
      }
    : run;

  return {
    ...gameState,
    city: {
      ...gameState.city,
      day: operationDay,
    },
    pilot: {
      ...gameState.pilot,
      status: 'completed',
      run: nextRun,
      postPilotOperation: postPilot,
    },
  };
}

export function applyLimitedContinueToGameState(gameState: GameState): GameState {
  const closingDay = gameState.pilot.currentPilotDay;
  const operationDay = Math.max(
    POST_PILOT_FIRST_OPERATION_DAY,
    gameState.city.day,
    closingDay + 1,
  );

  let postPilot = normalizePostPilotOperationState(
    gameState.pilot.postPilotOperation,
    { pilotStatus: 'completed', currentPilotDay: closingDay },
  );

  if (postPilot.phase !== 'main_operation_light') {
    postPilot = {
      ...postPilot,
      phase: 'main_operation_light',
      lightOperationStartedAt:
        postPilot.lightOperationStartedAt ?? new Date().toISOString(),
      lastUpdatedDay: operationDay,
      operationDay,
      postPilotDailyEventSet: undefined,
    };
    postPilot = applyDerivedScopesToPostPilotState(postPilot, {
      postPilotOperation: postPilot,
      pilotStatus: 'completed',
      authorityState: gameState.pilot.authorityState,
    });
  }

  const run = gameState.pilot.run;
  const nextRun = run
    ? {
        ...run,
        unlockState: {
          ...run.unlockState,
          mainOperationPreviewUnlocked: true,
          cityMapPreviewUnlocked: true,
          fullMainOperationUnlocked: false,
        },
      }
    : run;

  return {
    ...gameState,
    city: {
      ...gameState.city,
      day: operationDay,
    },
    pilot: {
      ...gameState.pilot,
      status: 'completed',
      run: nextRun,
      postPilotOperation: postPilot,
    },
  };
}

export function buildDevJumpPilotCompletedGameState(
  gameState: GameState,
): GameState {
  const finalMetrics = metricsFromCity(gameState.city);
  const finalResult: PilotFinalResult = gameState.pilot.finalResult ?? {
    status: 'controlled',
    score: 72,
    summary: 'Pilot test tamamlandı.',
    completedAtDay: 7,
  };

  let pilot = {
    ...gameState.pilot,
    status: 'completed' as const,
    currentPilotDay: 7,
    finalResult,
    postPilotOperation: createInitialPostPilotOperationState({
      pilotStatus: 'completed',
      currentPilotDay: 7,
    }),
  };

  if (pilot.run) {
    pilot = {
      ...pilot,
      run: finalizePilotRun(
        { ...pilot.run, currentDay: 7, isCompleted: false },
        finalMetrics,
        7,
      ),
    };
  }

  pilot = {
    ...pilot,
    postPilotOperation: {
      ...normalizePostPilotOperationState(pilot.postPilotOperation, {
        pilotStatus: 'completed',
        currentPilotDay: 7,
      }),
      phase: 'pilot_complete_idle',
      lastUpdatedDay: 7,
    },
  };

  return {
    ...gameState,
    city: {
      ...gameState.city,
      day: Math.max(8, gameState.city.day),
    },
    pilot,
    events: [],
    solvedEvents: gameState.solvedEvents ?? [],
  };
}

export function getMainOperationAccessFromStore(input: {
  gameState: GameState;
  monetization: MonetizationState;
}): MainOperationAccess {
  return deriveMonetizationStateFromGameState(
    input.gameState,
    input.monetization,
  ).mainOperationAccess;
}
