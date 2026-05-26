import { getDistrictProfile } from '@/core/content/districtProfiles';
import { PILOT_COORDINATOR_ROLE } from '@/core/content/day1Seed';
import {
  DEFAULT_PILOT_DISTRICT_ID,
  type PilotDistrictId,
} from '@/core/models/DistrictProfile';
import type { GameState } from '@/core/models/GameState';

function resolveDistrictProfile(districtId: PilotDistrictId) {
  return (
    getDistrictProfile(districtId) ??
    getDistrictProfile(DEFAULT_PILOT_DISTRICT_ID)
  );
}

/**
 * Seçilen pilot bölgenin başlangıç metriklerini city state'e uygular.
 * cityPulse türetilmiş alan — store tarafında withSyncedPulse ile yenilenir.
 */
export function applyDistrictStartingMetrics(
  gameState: GameState,
  districtId: PilotDistrictId,
): GameState {
  const profile = resolveDistrictProfile(districtId);
  if (!profile) {
    return gameState;
  }

  const { startingMetrics } = profile;

  return {
    ...gameState,
    city: {
      ...gameState.city,
      publicSatisfaction: startingMetrics.publicSatisfaction,
      budget: startingMetrics.budget,
      morale: startingMetrics.staffMorale,
      ...(startingMetrics.riskScore != null
        ? { riskScore: startingMetrics.riskScore }
        : {}),
    },
    player: {
      ...gameState.player,
      role: PILOT_COORDINATOR_ROLE,
    },
  };
}
