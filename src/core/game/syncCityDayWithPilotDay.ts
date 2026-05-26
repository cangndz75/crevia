import { PILOT_SCENARIO_DAYS } from '@/core/content/pilotDayPlan';
import type { GameState } from '@/core/models/GameState';

function clampPilotDay(day: number): number {
  return Math.min(PILOT_SCENARIO_DAYS, Math.max(1, Math.round(day)));
}

/**
 * Pilot aktif veya tamamlandıysa city.day'i pilot.currentPilotDay ile hizalar.
 * Pilot MVP'de tek gün algısı için kullanılır.
 */
export function syncCityDayWithPilotDay(gameState: GameState): GameState {
  const { pilot } = gameState;

  if (pilot.status !== 'active' && pilot.status !== 'completed') {
    return gameState;
  }

  const pilotDay = clampPilotDay(pilot.currentPilotDay);

  return {
    ...gameState,
    city: {
      ...gameState.city,
      day: pilotDay,
    },
  };
}
