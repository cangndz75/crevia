import type { LeaderboardEntry } from '@/core/leaderboard/leaderboardTypes';
import { LeaderboardPodiumHero } from '@/features/leaderboard/components/LeaderboardPodiumHero';
import { mapLeaderboardEntriesToPodiumUsers } from '@/features/leaderboard/utils/mapPodiumUsers';
import { useMemo } from 'react';

type LeaderboardPodiumProps = {
  topThree: LeaderboardEntry[];
};

/**
 * Store/selector `LeaderboardEntry[]` → `LeaderboardPodiumHero` adaptörü.
 * Skor motoruna dokunmaz; yalnızca UI veri eşlemesi.
 */
export function LeaderboardPodium({ topThree }: LeaderboardPodiumProps) {
  const podiumUsers = useMemo(() => {
    const bySlot = mapLeaderboardEntriesToPodiumUsers(topThree);
    return [bySlot.first, bySlot.second, bySlot.third];
  }, [topThree]);

  return <LeaderboardPodiumHero topThree={podiumUsers} />;
}
