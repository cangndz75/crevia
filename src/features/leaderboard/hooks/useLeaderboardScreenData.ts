import { useMemo } from 'react';

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
  const gameState = useGameStore((s) => s.gameState);
  const personnelState = useGameStore((s) => s.personnelState);
  const containerState = useGameStore((s) => s.containerState);
  const decisionHistory = useGameStore((s) => s.decisionHistory);
  const snapshots = useGameStore((s) => s.snapshots);
  const economyState = useGameStore((s) => s.economyState);
  const bestPilotScores = useGameStore((s) => s.bestPilotScores);
  const lastPilotScore = useGameStore((s) => s.lastPilotScore);
  const pilotStatus = useGameStore((s) => s.gameState.pilot.status);
  const playerName = useGameStore((s) => s.gameState.player.name);

  return useMemo(() => {
    const persistSlice: LeaderboardPersistSlice = {
      bestPilotScores,
      lastPilotScore,
    };

    const hasPlayerScore = canShowPlayerScore(pilotStatus, lastPilotScore);

    const selectorParams = {
      gameState,
      personnelState,
      containerState,
      decisionHistory,
      snapshots,
      economyState,
      playerName,
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
  }, [
    bestPilotScores,
    category,
    containerState,
    decisionHistory,
    economyState,
    gameState,
    lastPilotScore,
    period,
    personnelState,
    pilotStatus,
    playerName,
    snapshots,
  ]);
}
