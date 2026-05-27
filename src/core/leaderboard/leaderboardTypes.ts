import type { ContainerState } from '@/core/containers/containerTypes';
import type { EconomyState } from '@/core/economy/types';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { GameState } from '@/core/models/GameState';
import type { DaySnapshot } from '@/core/models/DaySnapshot';
import type { PersonnelState } from '@/core/personnel/personnelTypes';

export type LeaderboardCategory =
  | 'overall'
  | 'efficient_municipality'
  | 'citizen_favorite'
  | 'crisis_master'
  | 'personnel_friendly';

export type LeaderboardPeriod = 'pilot' | 'weekly' | 'season' | 'all_time';

export type LeaderboardScoreBreakdown = {
  citizenSatisfaction: number;
  riskControl: number;
  budgetEfficiency: number;
  personnelSustainability: number;
  complaintResolution: number;
  butterflyControl: number;
  neighborhoodFit: number;
};

export type LeaderboardPenalty = {
  key: string;
  label: string;
  amount: number;
  reason: string;
};

export type LeaderboardEntry = {
  id: string;
  playerName: string;
  neighborhoodId: string;
  neighborhoodName: string;
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  score: number;
  baseScore: number;
  difficultyMultiplier: number;
  penalties: LeaderboardPenalty[];
  title: string;
  breakdown: LeaderboardScoreBreakdown;
  completedAt: string;
  isCurrentPlayer: boolean;
  /** Pilot koşusu tekrar kaydı engeli — persist ile birlikte saklanır. */
  runId?: string;
};

export type LeaderboardScoreInput = {
  gameState: GameState;
  personnelState: PersonnelState;
  containerState?: ContainerState;
  decisionHistory: DecisionRecord[];
  snapshots?: DaySnapshot[];
  economyState?: EconomyState;
  playerName?: string;
  category?: LeaderboardCategory;
  period?: LeaderboardPeriod;
  isCurrentPlayer?: boolean;
  completedAt?: string;
  runId?: string;
};

export type LeaderboardScoreResult = {
  baseScore: number;
  score: number;
  difficultyMultiplier: number;
  penalties: LeaderboardPenalty[];
  penaltyTotal: number;
  breakdown: LeaderboardScoreBreakdown;
  title: string;
  neighborhoodId: string;
  neighborhoodName: string;
};
