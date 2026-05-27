import { createDay1Seed } from '@/core/content/day1Seed';
import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import type { DaySnapshot } from '@/core/models/DaySnapshot';
import type { GameState } from '@/core/models/GameState';
import { createInitialPersonnelState } from '@/core/personnel/personnelSeed';
import type { PersonnelState } from '@/core/personnel/personnelTypes';

import { LEADERBOARD_MAX_SCORE, LEADERBOARD_MIN_SCORE } from './leaderboardConstants';
import {
  calculateLeaderboardPenalties,
  calculateLeaderboardScore,
  getNeighborhoodDifficultyMultiplier,
} from './leaderboardScore';
import {
  selectCurrentPilotLeaderboardEntry,
  selectLeaderboardRank,
  selectMockLeaderboard,
} from './leaderboardSelectors';

type ScenarioCheck = {
  name: string;
  passed: boolean;
  detail: string;
};

function baseGameState(overrides: Partial<GameState['city']> = {}): GameState {
  const seed = createDay1Seed();
  return {
    ...seed.gameState,
    city: {
      ...seed.gameState.city,
      day: 7,
      publicSatisfaction: 72,
      budget: 68_000,
      morale: 70,
      riskScore: 32,
      ...overrides,
    },
    player: {
      ...seed.gameState.player,
      name: 'Test Oyuncu',
    },
    solvedEvents: [
      { id: 'e1', title: 'Şikayet 1', xpEarned: 10 },
      { id: 'e2', title: 'Şikayet 2', xpEarned: 12 },
      { id: 'e3', title: 'Şikayet 3', xpEarned: 8 },
      { id: 'e4', title: 'Şikayet 4', xpEarned: 9 },
      { id: 'e5', title: 'Şikayet 5', xpEarned: 11 },
    ],
    pilot: {
      ...createDefaultPilotState(),
      status: 'completed',
      currentPilotDay: 7,
      selectedDistrictId: 'central',
      completedEventIds: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7'],
      flags: { day1ResponseStyle: 'planned' },
      run: {
        id: 'verify-run-balanced',
        localPlayerId: 'local',
        selectedDistrictId: 'central',
        selectedDistrictName: 'Merkez',
        currentDay: 7,
        isCompleted: true,
        startedAt: '2026-01-01T08:00:00.000Z',
        completedAt: '2026-01-08T08:00:00.000Z',
        finalMetrics: null,
        dailySnapshots: [],
        eventHistory: [],
        unlockState: {
          cityMapPreviewUnlocked: false,
          mainOperationPreviewUnlocked: false,
          fullMainOperationUnlocked: false,
        },
      },
    },
  };
}

function balancedPersonnel(): PersonnelState {
  const state = createInitialPersonnelState();
  return {
    ...state,
    teams: state.teams.map((team) => ({
      ...team,
      fatigue: 42,
      morale: 74,
      status: 'idle',
      restMode: 'full_rest',
    })),
  };
}

function stressedPersonnel(): PersonnelState {
  const state = createInitialPersonnelState();
  return {
    ...state,
    teams: state.teams.map((team) => ({
      ...team,
      fatigue: 92,
      morale: 38,
      status: 'exhausted',
      warningTags: [...team.warningTags, 'risky_fatigue'],
    })),
  };
}

function balancedDecisions() {
  return [
    {
      id: 'd1',
      day: 1,
      eventId: 'market_cleanup',
      eventTitle: 'Pazar',
      decisionId: 'market-planned',
      decisionLabel: 'Planlı kalıcı düzenleme',
      neighborhoodId: 'merkez',
      neighborhoodName: 'Merkez',
      appliedEffects: { publicSatisfaction: 6, budget: -1200 },
      createdAt: '2026-01-01T10:00:00.000Z',
    },
    {
      id: 'd2',
      day: 2,
      eventId: 'citizen_complaint',
      eventTitle: 'Şikayet',
      decisionId: 'complaint-root',
      decisionLabel: 'Kök neden çözümü',
      neighborhoodId: 'merkez',
      neighborhoodName: 'Merkez',
      appliedEffects: { publicSatisfaction: 5, trust: 4 },
      createdAt: '2026-01-02T10:00:00.000Z',
    },
    {
      id: 'd3',
      day: 3,
      eventId: 'waste_route',
      eventTitle: 'Rota',
      decisionId: 'route-efficient',
      decisionLabel: 'Verimli rota',
      appliedEffects: { publicSatisfaction: 3, budget: -800 },
      createdAt: '2026-01-03T10:00:00.000Z',
    },
  ];
}

function partialHeavyDecisions() {
  return [
    ...balancedDecisions(),
    {
      id: 'd4',
      day: 4,
      eventId: 'social_media_day4',
      eventTitle: 'Sosyal medya',
      decisionId: 'social-partial',
      decisionLabel: 'Geçici partial müdahale',
      appliedEffects: { publicSatisfaction: 2, risk: 8 },
      createdAt: '2026-01-04T10:00:00.000Z',
    },
    {
      id: 'd5',
      day: 5,
      eventId: 'social_media_day5',
      eventTitle: 'Sosyal medya tekrar',
      decisionId: 'social-partial-2',
      decisionLabel: 'partial hızlı müdahale',
      appliedEffects: { publicSatisfaction: 1, risk: 6 },
      createdAt: '2026-01-05T10:00:00.000Z',
    },
    {
      id: 'd6',
      day: 6,
      eventId: 'social_media_day6',
      eventTitle: 'Sosyal medya',
      decisionId: 'social-partial-3',
      decisionLabel: 'temporary fix',
      appliedEffects: { risk: 5 },
      createdAt: '2026-01-06T10:00:00.000Z',
    },
    {
      id: 'd7',
      day: 7,
      eventId: 'social_media_day7',
      eventTitle: 'Sosyal medya',
      decisionId: 'social-partial-4',
      decisionLabel: 'gecici çözüm',
      appliedEffects: { risk: 4 },
      createdAt: '2026-01-07T10:00:00.000Z',
    },
  ];
}

export function verifyLeaderboardScenario(): {
  ok: boolean;
  checks: ScenarioCheck[];
} {
  const checks: ScenarioCheck[] = [];

  const balancedScore = calculateLeaderboardScore({
    gameState: baseGameState({
      publicSatisfaction: 82,
      morale: 78,
      riskScore: 28,
      budget: 74_000,
    }),
    personnelState: balancedPersonnel(),
    decisionHistory: balancedDecisions(),
    snapshots: [
      {
        id: 'snap-1',
        day: 1,
        createdAt: '2026-01-01T08:00:00.000Z',
        reason: 'initial',
        metrics: { publicSatisfaction: 55, budget: 75_000, staffMorale: 65 },
        activeEventIds: [],
        resolvedEventIds: [],
        xp: 0,
        level: 1,
      } satisfies DaySnapshot,
    ],
  });

  checks.push({
    name: 'Dengeli iyi oyuncu 8000+',
    passed: balancedScore.score >= 8000,
    detail: `score=${balancedScore.score}, base=${balancedScore.baseScore}`,
  });

  const stressedScore = calculateLeaderboardScore({
    gameState: baseGameState({
      publicSatisfaction: 88,
      riskScore: 82,
      morale: 40,
    }),
    personnelState: stressedPersonnel(),
    decisionHistory: partialHeavyDecisions(),
  });

  checks.push({
    name: 'Yüksek memnuniyet + kötü risk/yorgunluk cezalanır',
    passed: stressedScore.score < balancedScore.score,
    detail: `stressed=${stressedScore.score}, balanced=${balancedScore.score}, penalties=${stressedScore.penalties.length}`,
  });

  const sharedBase = 78;
  const breakdown = balancedScore.breakdown;
  const cumhuriyetMultiplier = getNeighborhoodDifficultyMultiplier('cumhuriyet');
  const sanayiMultiplier = getNeighborhoodDifficultyMultiplier('sanayi');
  const cumhuriyetFinal = Math.round(sharedBase * 100 * cumhuriyetMultiplier);
  const sanayiFinal = Math.round(sharedBase * 100 * sanayiMultiplier);

  checks.push({
    name: 'Zor mahalle (sanayi) aynı baseScore ile daha yüksek final',
    passed: sanayiFinal > cumhuriyetFinal,
    detail: `sanayi=${sanayiFinal}, cumhuriyet=${cumhuriyetFinal}, base=${sharedBase}`,
  });

  const negativeBudgetPenalties = calculateLeaderboardPenalties({
    gameState: baseGameState({ budget: -2500 }),
    personnelState: balancedPersonnel(),
    decisionHistory: balancedDecisions(),
  });

  checks.push({
    name: 'Negatif bütçe cezası görünür',
    passed: negativeBudgetPenalties.some((penalty) => penalty.key === 'negative_budget'),
    detail: negativeBudgetPenalties.map((penalty) => penalty.key).join(', '),
  });

  const currentEntry = selectCurrentPilotLeaderboardEntry({
    gameState: baseGameState(),
    personnelState: balancedPersonnel(),
    decisionHistory: balancedDecisions(),
  });
  const mockBoard = selectMockLeaderboard('overall', 'pilot', currentEntry);
  const rank = selectLeaderboardRank(mockBoard, currentEntry.id);

  checks.push({
    name: 'Mock leaderboard current player sıralaması',
    passed: rank != null && rank > 0 && mockBoard.some((entry) => entry.isCurrentPlayer),
    detail: `rank=${rank ?? 'null'}, size=${mockBoard.length}`,
  });

  const clampLow = calculateLeaderboardScore({
    gameState: baseGameState({
      publicSatisfaction: 0,
      morale: 0,
      riskScore: 100,
      budget: -50_000,
    }),
    personnelState: stressedPersonnel(),
    decisionHistory: partialHeavyDecisions(),
  });

  const clampHigh = calculateLeaderboardScore({
    gameState: baseGameState({
      publicSatisfaction: 100,
      morale: 100,
      riskScore: 0,
      budget: 120_000,
    }),
    personnelState: balancedPersonnel(),
    decisionHistory: balancedDecisions(),
  });

  const boundsOk =
    clampLow.score >= LEADERBOARD_MIN_SCORE &&
    clampLow.score <= LEADERBOARD_MAX_SCORE &&
    clampHigh.score >= LEADERBOARD_MIN_SCORE &&
    clampHigh.score <= LEADERBOARD_MAX_SCORE;

  checks.push({
    name: 'Skor 0–10000 aralığında kalır',
    passed: boundsOk,
    detail: `low=${clampLow.score}, high=${clampHigh.score}`,
  });

  checks.push({
    name: 'Breakdown alanları 0–100',
    passed: Object.values(breakdown).every((value) => value >= 0 && value <= 100),
    detail: JSON.stringify(breakdown),
  });

  const ok = checks.every((check) => check.passed);
  return { ok, checks };
}
