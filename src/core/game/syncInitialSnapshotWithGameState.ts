import type { DaySnapshot } from '@/core/models/DaySnapshot';
import type { GameState } from '@/core/models/GameState';

function metricsFromCity(gameState: GameState): DaySnapshot['metrics'] {
  return {
    publicSatisfaction: gameState.city.publicSatisfaction,
    budget: gameState.city.budget,
    staffMorale: gameState.city.morale,
  };
}

/**
 * İlk gün / initial snapshot metriklerini güncel city değerleriyle hizalar.
 * Yalnızca snapshots[0] güncellenir; diğer snapshot'lara dokunulmaz.
 */
export function syncInitialSnapshotWithGameState(
  snapshots: DaySnapshot[],
  gameState: GameState,
): DaySnapshot[] {
  if (snapshots.length === 0) {
    return snapshots;
  }

  const first = snapshots[0];
  if (!first) {
    return snapshots;
  }

  const isInitialBaseline =
    first.reason === 'initial' || first.day === gameState.city.day;

  if (!isInitialBaseline) {
    return snapshots;
  }

  const syncedFirst: DaySnapshot = {
    ...first,
    day: gameState.city.day,
    metrics: metricsFromCity(gameState),
  };

  return [syncedFirst, ...snapshots.slice(1)];
}
