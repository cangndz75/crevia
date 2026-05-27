import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import type { LeaderboardEntry } from '@/core/leaderboard/leaderboardTypes';
import {
  selectCurrentPilotLeaderboardEntry,
  selectLeaderboardRank,
  selectMockLeaderboard,
} from '@/core/leaderboard/leaderboardSelectors';
import { useGameStore } from '@/store/useGameStore';

export type PilotLeaderboardResult = {
  entry: LeaderboardEntry;
  rank: number | null;
  totalEntries: number;
};

export function usePilotLeaderboardResult(): PilotLeaderboardResult | null {
  const storeSlice = useGameStore(
    useShallow((s) => ({
      pilotStatus: s.gameState.pilot.status,
      lastPilotScore: s.lastPilotScore,
      gameState: s.gameState,
      personnelState: s.personnelState,
      containerState: s.containerState,
      decisionHistory: s.decisionHistory,
      snapshots: s.snapshots,
      economyState: s.economyState,
      playerName: s.gameState.player.name,
    })),
  );

  return useMemo(() => {
    const canResolve =
      storeSlice.pilotStatus === 'completed' || storeSlice.lastPilotScore != null;
    if (!canResolve) {
      return null;
    }

    const entry =
      storeSlice.lastPilotScore ??
      selectCurrentPilotLeaderboardEntry({
        gameState: storeSlice.gameState,
        personnelState: storeSlice.personnelState,
        containerState: storeSlice.containerState,
        decisionHistory: storeSlice.decisionHistory,
        snapshots: storeSlice.snapshots,
        economyState: storeSlice.economyState,
        playerName: storeSlice.playerName,
        category: 'overall',
        period: 'pilot',
      });

    const entries = selectMockLeaderboard('overall', 'pilot', entry);
    const rank = selectLeaderboardRank(entries, entry.id);

    return {
      entry,
      rank,
      totalEntries: entries.length,
    };
  }, [storeSlice]);
}
