import {
  MOCK_LEADERBOARD_SIZE,
  MOCK_SCORE_MAX,
  MOCK_SCORE_MIN,
  NEIGHBORHOOD_DISPLAY_NAMES,
} from './leaderboardConstants';
import {
  calculateCategoryScore,
  getLeaderboardTitle,
  getNeighborhoodDifficultyMultiplier,
} from './leaderboardScore';
import type {
  LeaderboardCategory,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardScoreBreakdown,
} from './leaderboardTypes';

const MOCK_PLAYER_NAMES = [
  'Ayşe Kaya',
  'Mehmet Demir',
  'Elif Yıldız',
  'Can Öztürk',
  'Zeynep Arslan',
  'Burak Şahin',
  'Selin Aydın',
  'Emre Koç',
  'Deniz Polat',
  'Merve Çelik',
  'Kerem Aksoy',
  'Gamze Erdoğan',
  'Onur Kılıç',
  'Ece Tunç',
  'Barış Güneş',
  'Seda Yalçın',
  'Tolga Karaca',
  'İrem Bozkurt',
  'Uğur Taş',
  'Pınar Acar',
  'Serkan Uçar',
  'Hande Kurt',
  'Oğuz Bayrak',
  'Aslı Sarı',
  'Volkan Tekin',
  'Ceren Bulut',
] as const;

const MOCK_NEIGHBORHOOD_IDS = [
  'cumhuriyet',
  'merkez',
  'yesilvadi',
  'istasyon',
  'sanayi',
] as const;

const MOCK_CATEGORIES: LeaderboardCategory[] = [
  'overall',
  'efficient_municipality',
  'citizen_favorite',
  'crisis_master',
  'personnel_friendly',
];

/** Deterministik 0–1 arası değer — render’lar arası sabit. */
function seededUnit(seed: number): number {
  const x = Math.sin(seed * 12_989.847233) * 43_758.5453123;
  return x - Math.floor(x);
}

function buildMockBreakdown(index: number, neighborhoodIndex: number): LeaderboardScoreBreakdown {
  const base = 58 + seededUnit(index * 17 + neighborhoodIndex * 3) * 34;
  const spread = (seededUnit(index * 31 + 7) - 0.5) * 18;

  return {
    citizenSatisfaction: clampBreakdown(base + spread),
    riskControl: clampBreakdown(base - spread * 0.6 + 6),
    budgetEfficiency: clampBreakdown(base - 4 + seededUnit(index * 5) * 12),
    personnelSustainability: clampBreakdown(base - 8 + seededUnit(index * 11) * 16),
    complaintResolution: clampBreakdown(base + 2),
    butterflyControl: clampBreakdown(66 + seededUnit(index * 23) * 22),
    neighborhoodFit: clampBreakdown(68 + seededUnit(index * 41) * 20),
  };
}

function clampBreakdown(value: number): number {
  return Math.min(100, Math.max(35, Math.round(value)));
}

function mockBaseScoreFromBreakdown(breakdown: LeaderboardScoreBreakdown): number {
  const weights = {
    citizenSatisfaction: 0.22,
    riskControl: 0.18,
    budgetEfficiency: 0.16,
    personnelSustainability: 0.16,
    complaintResolution: 0.12,
    butterflyControl: 0.1,
    neighborhoodFit: 0.06,
  };

  const weighted =
    breakdown.citizenSatisfaction * weights.citizenSatisfaction +
    breakdown.riskControl * weights.riskControl +
    breakdown.budgetEfficiency * weights.budgetEfficiency +
    breakdown.personnelSustainability * weights.personnelSustainability +
    breakdown.complaintResolution * weights.complaintResolution +
    breakdown.butterflyControl * weights.butterflyControl +
    breakdown.neighborhoodFit * weights.neighborhoodFit;

  return Math.min(100, Math.max(52, Math.round(weighted)));
}

function mockPenaltyTotal(index: number): number {
  const roll = seededUnit(index * 97);
  if (roll < 0.15) {
    return 320;
  }
  if (roll < 0.35) {
    return 140;
  }
  return 0;
}

function buildMockEntry(
  index: number,
  category: LeaderboardCategory,
  period: LeaderboardPeriod,
): LeaderboardEntry {
  const neighborhoodIndex = index % MOCK_NEIGHBORHOOD_IDS.length;
  const neighborhoodId = MOCK_NEIGHBORHOOD_IDS[neighborhoodIndex];
  const neighborhoodName =
    NEIGHBORHOOD_DISPLAY_NAMES[neighborhoodId] ?? neighborhoodId;
  const breakdown = buildMockBreakdown(index, neighborhoodIndex);
  const baseScore = mockBaseScoreFromBreakdown(breakdown);
  const difficultyMultiplier = getNeighborhoodDifficultyMultiplier(neighborhoodId);
  const penaltyTotal = mockPenaltyTotal(index);
  const score = calculateCategoryScore(
    breakdown,
    category,
    difficultyMultiplier,
    penaltyTotal,
  );
  const clampedScore = Math.min(
    MOCK_SCORE_MAX,
    Math.max(MOCK_SCORE_MIN, score),
  );

  const completedDay = 7;
  const completedAt = `2026-0${(index % 4) + 1}-${String((index % 20) + 1).padStart(2, '0')}T18:00:00.000Z`;

  return {
    id: `mock-player-${index}-${category}`,
    playerName: MOCK_PLAYER_NAMES[index % MOCK_PLAYER_NAMES.length],
    neighborhoodId,
    neighborhoodName,
    category,
    period,
    score: clampedScore,
    baseScore,
    difficultyMultiplier,
    penalties:
      penaltyTotal > 0
        ? [
            {
              key: 'mock_penalty',
              label: 'Operasyonel yük',
              amount: penaltyTotal,
              reason: 'Mock pilot koşusu sonrası küçük düzeltme.',
            },
          ]
        : [],
    title: getLeaderboardTitle(clampedScore),
    breakdown,
    completedAt,
    isCurrentPlayer: false,
  };
}

let cachedMockEntries: LeaderboardEntry[] | null = null;

/** Deterministik mock leaderboard — her çağrıda aynı liste. */
export function createMockLeaderboardSeed(): LeaderboardEntry[] {
  if (cachedMockEntries) {
    return cachedMockEntries.map((entry) => ({ ...entry, penalties: [...entry.penalties] }));
  }

  const entries: LeaderboardEntry[] = [];
  for (let index = 0; index < MOCK_LEADERBOARD_SIZE; index += 1) {
    for (const category of MOCK_CATEGORIES) {
      entries.push(buildMockEntry(index, category, 'pilot'));
    }
  }

  cachedMockEntries = entries;
  return entries.map((entry) => ({
    ...entry,
    penalties: [...entry.penalties],
    breakdown: { ...entry.breakdown },
  }));
}

export function getMockLeaderboardEntries(
  category: LeaderboardCategory,
  period: LeaderboardPeriod,
): LeaderboardEntry[] {
  return createMockLeaderboardSeed().filter(
    (entry) => entry.category === category && entry.period === period,
  );
}
