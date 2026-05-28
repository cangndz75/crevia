import {
  clearActiveEventsForGameState,
  shouldClearPilotActiveEvents,
} from '@/core/game/clearActiveEventsForGameState';
import { ensureDailyEventsForDay } from '@/core/game/ensureDailyEventsForDay';
import type { ContainerState } from '@/core/containers/containerTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { CarryOverEvaluationInput } from '@/core/carryOver/carryOverTypes';
import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';

export type RefreshPilotEventsFromGameStateOptions = {
  containerState?: ContainerState | null;
  vehicleState?: VehicleState | null;
  dailyPriorityKey?: DailyPriorityKey;
  carryOverEvaluationInput?: CarryOverEvaluationInput;
};

export type RefreshPilotEventsFromGameStateResult = {
  gameState: GameState;
  eventPool: EventCard[];
  refreshed: boolean;
};

/**
 * Pilot aktif gün/bölge için eventPool + active events senkronlar.
 * Selector boş dönerse mevcut değerler korunur.
 * Final tamamlanabilir veya pilot completed ise havuz ve aktif olaylar temizlenir.
 */
export function refreshPilotEventsFromGameState(
  gameState: GameState,
  currentEventPool: EventCard[],
  options?: RefreshPilotEventsFromGameStateOptions,
): RefreshPilotEventsFromGameStateResult {
  if (shouldClearPilotActiveEvents(gameState)) {
    return {
      gameState: clearActiveEventsForGameState(gameState),
      eventPool: [],
      refreshed: true,
    };
  }

  const ensured = ensureDailyEventsForDay(gameState, currentEventPool, undefined, {
    containerState: options?.containerState ?? null,
    vehicleState: options?.vehicleState ?? null,
    dailyPriorityKey: options?.dailyPriorityKey,
    carryOverEvaluationInput: options?.carryOverEvaluationInput,
  });

  if (!ensured.ensured) {
    return {
      gameState,
      eventPool: currentEventPool,
      refreshed: false,
    };
  }

  return {
    gameState: ensured.gameState,
    eventPool: ensured.eventPool,
    refreshed: true,
  };
}
