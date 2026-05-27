import type { ContainerState } from '@/core/containers/containerTypes';
import type { EconomyState } from '@/core/economy/types';
import type { GameState } from '@/core/models/GameState';
import type { PersonnelState } from '@/core/personnel/personnelTypes';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DaySnapshot } from '@/core/models/DaySnapshot';

import { CURRENT_PLAYER_ID } from './leaderboardConstants';
import { getMockLeaderboardEntries } from './leaderboardSeed';
import {
  calculateCategoryScore,
  calculateLeaderboardScore,
  getLeaderboardTitle,
} from './leaderboardScore';
import type {
  LeaderboardCategory,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardScoreInput,
} from './leaderboardTypes';

export type LeaderboardPersistSlice = {
  bestPilotScores: LeaderboardEntry[];
  lastPilotScore?: LeaderboardEntry;
};

export type SelectCurrentPilotLeaderboardParams = {
  gameState: GameState;
  personnelState: PersonnelState;
  containerState?: ContainerState;
  decisionHistory: DecisionRecord[];
  snapshots?: DaySnapshot[];
  economyState?: EconomyState;
  playerName?: string;
  category?: LeaderboardCategory;
  period?: LeaderboardPeriod;
};

function buildEntryFromScore(
  params: SelectCurrentPilotLeaderboardParams,
  scoreResult: ReturnType<typeof calculateLeaderboardScore>,
): LeaderboardEntry {
  const category = params.category ?? 'overall';
  const period = params.period ?? 'pilot';
  const playerName =
    params.playerName?.trim() ||
    params.gameState.player.name?.trim() ||
    'Sen';
  const runId = params.gameState.pilot.run?.id;
  const completedAt =
    params.gameState.pilot.run?.completedAt ?? new Date().toISOString();

  const categoryScore =
    category === 'overall'
      ? scoreResult.score
      : calculateCategoryScore(
          scoreResult.breakdown,
          category,
          scoreResult.difficultyMultiplier,
          scoreResult.penaltyTotal,
        );

  return {
    id: runId ? `pilot-run-${runId}` : `pilot-local-${completedAt}`,
    playerName,
    neighborhoodId: scoreResult.neighborhoodId,
    neighborhoodName: scoreResult.neighborhoodName,
    category,
    period,
    score: categoryScore,
    baseScore: scoreResult.baseScore,
    difficultyMultiplier: scoreResult.difficultyMultiplier,
    penalties: scoreResult.penalties,
    title: getLeaderboardTitle(categoryScore),
    breakdown: scoreResult.breakdown,
    completedAt,
    isCurrentPlayer: true,
    runId,
  };
}

export function selectCurrentPilotLeaderboardEntry(
  params: SelectCurrentPilotLeaderboardParams,
): LeaderboardEntry {
  const input: LeaderboardScoreInput = {
    gameState: params.gameState,
    personnelState: params.personnelState,
    containerState: params.containerState,
    decisionHistory: params.decisionHistory,
    snapshots: params.snapshots,
    economyState: params.economyState,
    playerName: params.playerName,
    category: params.category,
    period: params.period,
    isCurrentPlayer: true,
    runId: params.gameState.pilot.run?.id,
    completedAt: params.gameState.pilot.run?.completedAt ?? undefined,
  };

  const scoreResult = calculateLeaderboardScore(input);
  return buildEntryFromScore(params, scoreResult);
}

export function selectBestLocalPilotScore(
  state: LeaderboardPersistSlice,
  category: LeaderboardCategory = 'overall',
): LeaderboardEntry | null {
  const matches = state.bestPilotScores.filter(
    (entry) => entry.category === category,
  );
  if (matches.length === 0) {
    return null;
  }

  return matches.reduce((best, entry) => (entry.score > best.score ? entry : best));
}

export function selectMockLeaderboard(
  category: LeaderboardCategory,
  period: LeaderboardPeriod,
  currentEntry?: LeaderboardEntry,
): LeaderboardEntry[] {
  let sourcePeriod = period;
  let mockEntries = getMockLeaderboardEntries(category, sourcePeriod);
  if (mockEntries.length === 0 && period !== 'pilot') {
    sourcePeriod = 'pilot';
    mockEntries = getMockLeaderboardEntries(category, sourcePeriod);
  }

  const normalizedMock = mockEntries.map((entry) => ({
    ...entry,
    period,
    penalties: [...entry.penalties],
    breakdown: { ...entry.breakdown },
  }));

  const merged = currentEntry
    ? [
        ...normalizedMock.filter((entry) => entry.id !== currentEntry.id),
        { ...currentEntry, isCurrentPlayer: true, period },
      ]
    : normalizedMock;

  return merged.sort((a, b) => b.score - a.score);
}

export function selectLeaderboardRank(
  entries: LeaderboardEntry[],
  currentPlayerId: string = CURRENT_PLAYER_ID,
): number | null {
  const current =
    entries.find((entry) => entry.isCurrentPlayer) ??
    entries.find((entry) => entry.id === currentPlayerId || entry.runId === currentPlayerId);

  if (!current) {
    return null;
  }

  const sorted = [...entries].sort((a, b) => b.score - a.score);
  const index = sorted.findIndex((entry) => entry.id === current.id);
  if (index < 0) {
    return null;
  }
  return index + 1;
}

function entryRunKey(entry: LeaderboardEntry): string | null {
  if (entry.runId) {
    return entry.runId;
  }
  return entry.id;
}

/** Pilot tamamlandığında tek seferlik skor kaydı — aynı runId ile tekrar eklemez. */
export function appendPilotLeaderboardIfNew(
  slice: LeaderboardPersistSlice,
  entry: LeaderboardEntry,
): LeaderboardPersistSlice {
  const runKey = entryRunKey(entry);
  if (runKey && slice.bestPilotScores.some((existing) => entryRunKey(existing) === runKey)) {
    return {
      ...slice,
      lastPilotScore: entry,
    };
  }

  const nextBest = [...slice.bestPilotScores, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return {
    bestPilotScores: nextBest,
    lastPilotScore: entry,
  };
}

/** Store completePilot hook — mevcut state’ten skor üretir ve persist dilimine yazar. */
export function buildPilotLeaderboardPersistUpdate(
  params: SelectCurrentPilotLeaderboardParams & LeaderboardPersistSlice,
): LeaderboardPersistSlice {
  const entry = selectCurrentPilotLeaderboardEntry({
    ...params,
    category: 'overall',
    period: 'pilot',
  });
  return appendPilotLeaderboardIfNew(
    {
      bestPilotScores: params.bestPilotScores,
      lastPilotScore: params.lastPilotScore,
    },
    entry,
  );
}
