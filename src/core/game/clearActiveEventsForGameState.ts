import { canCompletePilot } from '@/core/game/calculatePilotFinalResult';
import type { GameState } from '@/core/models/GameState';

/**
 * Pilot final tamamlanabilir veya pilot tamamlandıysa aktif olaylar temizlenmeli.
 */
export function shouldClearPilotActiveEvents(gameState: GameState): boolean {
  if (gameState.pilot.status === 'completed') {
    return true;
  }
  return canCompletePilot(gameState);
}

/**
 * Aktif olay listesini ve öne çıkan event id'yi sıfırlar (immutable).
 */
export function clearActiveEventsForGameState(gameState: GameState): GameState {
  return {
    ...gameState,
    events: [],
    featuredEventId: '',
  };
}
