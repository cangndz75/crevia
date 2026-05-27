import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import type { LeaderboardCategory, LeaderboardEntry, LeaderboardPeriod } from '@/core/leaderboard/leaderboardTypes';
import {
  selectBestLocalPilotScore,
  selectCurrentPilotLeaderboardEntry,
  selectLeaderboardRank,
  selectMockLeaderboard,
  type LeaderboardPersistSlice,
} from '@/core/leaderboard/leaderboardSelectors';
import { useGameStore } from '@/store/useGameStore';

export type LeaderboardScreenData = {
  hasPlayerScore: boolean;
  currentEntry: LeaderboardEntry | null;
  bestEntry: LeaderboardEntry | null;
  entries: LeaderboardEntry[];
  rank: number | null;
  topTen: LeaderboardEntry[];
  showSeparateCurrentRow: boolean;
};

function canShowPlayerScore(
  pilotStatus: string,
  lastPilotScore?: LeaderboardEntry,
): boolean {
  return pilotStatus === 'completed' || lastPilotScore != null;
}

export function useLeaderboardScreenData(
  category: LeaderboardCategory,
  period: LeaderboardPeriod,
): LeaderboardScreenData {
  const storeSlice = useGameStore(
    useShallow((s) => ({
      gameState: s.gameState,
      personnelState: s.personnelState,
      containerState: s.containerState,
      decisionHistory: s.decisionHistory,
      snapshots: s.snapshots,
      economyState: s.economyState,
      bestPilotScores: s.bestPilotScores,
      lastPilotScore: s.lastPilotScore,
      pilotStatus: s.gameState.pilot.status,
      playerName: s.gameState.player.name,
    })),
  );

  return useMemo(() => {
    const persistSlice: LeaderboardPersistSlice = {
      bestPilotScores: storeSlice.bestPilotScores,
      lastPilotScore: storeSlice.lastPilotScore,
    };

    const hasPlayerScore = canShowPlayerScore(
      storeSlice.pilotStatus,
      storeSlice.lastPilotScore,
    );

    const selectorParams = {
      gameState: storeSlice.gameState,
      personnelState: storeSlice.personnelState,
      containerState: storeSlice.containerState,
      decisionHistory: storeSlice.decisionHistory,
      snapshots: storeSlice.snapshots,
      economyState: storeSlice.economyState,
      playerName: storeSlice.playerName,
      category,
      period,
    };

    const currentEntry = hasPlayerScore
      ? selectCurrentPilotLeaderboardEntry(selectorParams)
      : null;

    const bestEntry = selectBestLocalPilotScore(persistSlice, category);
    const entries = selectMockLeaderboard(category, period, currentEntry ?? undefined);
    const rank = currentEntry
      ? selectLeaderboardRank(entries, currentEntry.id)
      : null;
    const topTen = entries.slice(0, 10);
    const showSeparateCurrentRow =
      currentEntry != null && rank != null && rank > 10;

    return {
      hasPlayerScore,
      currentEntry,
      bestEntry,
      entries,
      rank,
      topTen,
      showSeparateCurrentRow,
    };
  }, [storeSlice, category, period]);
}
