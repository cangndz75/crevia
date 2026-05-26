import type { GameState } from '@/core/models/GameState';

const MAX_PILOT_DAY = 7;

/**
 * Pilot aktifken günü ilerletir (max 7). completed yapmaz.
 */
export function advancePilotDayForGameState(gameState: GameState): GameState {
  if (gameState.pilot.status !== 'active') {
    return gameState;
  }

  const { currentPilotDay } = gameState.pilot;
  if (currentPilotDay >= MAX_PILOT_DAY) {
    return gameState;
  }

  return {
    ...gameState,
    pilot: {
      ...gameState.pilot,
      currentPilotDay: currentPilotDay + 1,
    },
  };
}
