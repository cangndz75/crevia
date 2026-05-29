import { canCompletePilot } from '@/core/game/calculatePilotFinalResult';
import { isPostPilotLightEventLoopEligible } from '@/core/postPilot/postPilotEventEngine';
import type { GameState } from '@/core/models/GameState';

/**
 * Pilot final tamamlanabilir veya pilot tamamlandıysa aktif olaylar temizlenmeli.
 * Post-pilot hafif operasyon fazında olaylar korunur.
 */
export function shouldClearPilotActiveEvents(gameState: GameState): boolean {
  if (isPostPilotLightEventLoopEligible(gameState)) {
    return false;
  }
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
