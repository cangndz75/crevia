import type { LeaderboardEntry } from '@/core/leaderboard/leaderboardTypes';
import {
  getNeighborhoodDisplayName,
  normalizeNeighborhoodId,
} from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';

import { formatLeaderboardScore } from './leaderboardUiModel';

function formatNeighborhoodName(raw: string | undefined): string {
  if (!raw?.trim()) {
    return 'Pilot bekleniyor';
  }
  const normalized = normalizeNeighborhoodId(raw);
  if (normalized) {
    return getNeighborhoodDisplayName(normalized);
  }
  return raw;
}

export type LeaderboardPrestigeSummary = {
  bestScoreText: string;
  highestTitle: string;
  bestNeighborhoodName: string;
  completedPilotCount: number;
  lastScoreText: string | null;
  lastTitle: string | null;
  hasAnyScore: boolean;
};

function dedupePilotScores(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const seen = new Set<string>();
  const unique: LeaderboardEntry[] = [];

  for (const entry of entries) {
    const key = entry.runId ?? entry.id;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(entry);
  }

  return unique;
}

function findHighestScoreEntry(entries: LeaderboardEntry[]): LeaderboardEntry | null {
  if (entries.length === 0) {
    return null;
  }

  return entries.reduce((best, entry) => (entry.score >= best.score ? entry : best));
}

export function buildLeaderboardPrestigeSummary(
  bestPilotScores: LeaderboardEntry[],
  lastPilotScore?: LeaderboardEntry,
): LeaderboardPrestigeSummary {
  const completedRuns = dedupePilotScores(bestPilotScores);
  const bestEntry = findHighestScoreEntry(completedRuns);
  const hasAnyScore = bestEntry != null || lastPilotScore != null;

  return {
    bestScoreText: bestEntry
      ? formatLeaderboardScore(bestEntry.score)
      : '—',
    highestTitle: bestEntry?.title ?? 'Henüz oluşmadı',
    bestNeighborhoodName: formatNeighborhoodName(bestEntry?.neighborhoodName),
    completedPilotCount: completedRuns.length,
    lastScoreText: lastPilotScore
      ? formatLeaderboardScore(lastPilotScore.score)
      : null,
    lastTitle: lastPilotScore?.title ?? null,
    hasAnyScore,
  };
}
