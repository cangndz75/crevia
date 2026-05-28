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
import { buildLeaderboardScreenStats } from '@/features/leaderboard/utils/leaderboardUiModel';
import { useGameStore } from '@/store/useGameStore';

export type LeaderboardScreenStats = {
  totalParticipants: number;
  weeklyRise: number;
  playerTitle: string;
};

export type LeaderboardScreenData = {
  hasPlayerScore: boolean;
  currentEntry: LeaderboardEntry | null;
  bestEntry: LeaderboardEntry | null;
  entries: LeaderboardEntry[];
  rank: number | null;
  topThree: LeaderboardEntry[];
  listEntries: LeaderboardEntry[];
  stats: LeaderboardScreenStats;
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
    const topThree = entries.slice(0, 3);
    const listEntries = entries.slice(3);
    const showSeparateCurrentRow =
      currentEntry != null && rank != null && rank > 3;

    const stats = buildLeaderboardScreenStats({
      entryCount: entries.length,
      playerTitle: currentEntry?.title ?? bestEntry?.title,
    });

    return {
      hasPlayerScore,
      currentEntry,
      bestEntry,
      entries,
      rank,
      topThree,
      listEntries,
      stats,
      showSeparateCurrentRow,
    };
  }, [storeSlice, category, period]);
}
