import type { LeaderboardEntry } from '@/core/leaderboard/leaderboardTypes';

import type { PodiumSlotKey, PodiumUser } from './leaderboardPodiumTypes';

function emptyPodiumUser(slot: PodiumSlotKey): PodiumUser {
  return {
    id: `podium-placeholder-${slot}`,
    name: 'Bekleniyor',
    title: '—',
    score: 0,
    districtName: '—',
    avatarUrl: null,
  };
}

/** topThree[0]=1., [1]=2., [2]=3. */
export function mapLeaderboardEntriesToPodiumUsers(
  topThree: LeaderboardEntry[],
): Record<PodiumSlotKey, PodiumUser> {
  const mapEntry = (
    entry: LeaderboardEntry | undefined,
    slot: PodiumSlotKey,
  ): PodiumUser => {
    if (!entry) {
      return emptyPodiumUser(slot);
    }
    return {
      id: entry.id,
      name: entry.playerName,
      title: entry.title,
      score: entry.score,
      districtName: entry.neighborhoodName,
      avatarUrl: null,
    };
  };

  return {
    first: mapEntry(topThree[0], 'first'),
    second: mapEntry(topThree[1], 'second'),
    third: mapEntry(topThree[2], 'third'),
  };
}
