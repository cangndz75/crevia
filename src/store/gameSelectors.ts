import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { getDistrictProfile } from '@/core/content/districtProfiles';
import { createInitialPlayerProgress } from '@/core/xp/levelProgress';
import type { PlayerProgress } from '@/core/xp/types';
import {
  calculateLevelProgress,
  calculateXpProgress,
  formatBudgetDelta,
  formatCurrency,
} from '@/core/utils/gameFormatters';
import {
  DEFAULT_PILOT_DISTRICT_ID,
  type PilotDistrictId,
} from '@/core/models/DistrictProfile';
import type { DecisionAppliedEffects } from '@/core/models/DecisionRecord';

import type { GameStore } from './useGameStore';
import { useGameStore } from './useGameStore';

const WEEKDAYS_TR = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
] as const;

export type GameStatusSnapshot = {
  playerName: string;
  role: string;
  currentDay: number;
  dayLabel: string;
  selectedDistrictId: PilotDistrictId | null;
  selectedDistrictName: string;
  /** Header XP bar — mevcut seviye içi ilerleme (currentLevelXp). */
  xp: number;
  /** Header XP bar — bu seviye aralığında gereken XP (nextLevelXp). */
  xpTarget: number;
  /** Header "X XP kaldı" metni. */
  xpToNextLevel: number;
  xpProgress: number;
  level: number;
  levelProgress: number;
  /** Toplam kazanılan XP — header dışı ekranlar için. */
  totalXp: number;
  budget: number;
  budgetFormatted: string;
  budgetDelta: number | null;
  budgetDeltaLabel: string | null;
  notificationCount: number;
  publicSatisfaction: number;
  districtPulse: number;
  staffMorale: number;
  operationRisk: number;
  activeEventsCount: number;
  criticalEventsCount: number;
  solvedEventsCount: number;
};

function averageDistrictPulse(
  neighborhoods: GameStore['neighborhoods'],
  fallback: number,
): number {
  if (neighborhoods.length === 0) return fallback;
  const sum = neighborhoods.reduce((acc, n) => acc + n.cleanliness, 0);
  return Math.round(sum / neighborhoods.length);
}

function countCriticalEvents(events: GameStore['gameState']['events']): number {
  return events.filter(
    (e) => e.riskLevel === 'critical' || e.riskLevel === 'high',
  ).length;
}

function resolvePlayerProgress(state: GameStore): PlayerProgress {
  return state.playerProgress ?? createInitialPlayerProgress();
}

function clampProgressRatio(ratio: number): number {
  if (!Number.isFinite(ratio)) {
    return 0;
  }
  return Math.min(1, Math.max(0, ratio));
}

function resolveHeaderXpProgress(progress: PlayerProgress): number {
  if (progress.nextLevelXp > 0) {
    return clampProgressRatio(progress.currentLevelXp / progress.nextLevelXp);
  }
  return progress.xpToNextLevel <= 0 ? 1 : 0;
}

export function buildDayLabel(day: number): string {
  const weekday = WEEKDAYS_TR[new Date().getDay()];
  return `Gün ${day} · ${weekday}`;
}

/** Düz oyun durumu — store şeklinden türetilir. */
export function selectGameStatus(state: GameStore): GameStatusSnapshot {
  const { city, player, events, solvedEvents, pilot } = state.gameState;
  const districtId: PilotDistrictId =
    pilot.selectedDistrictId ?? DEFAULT_PILOT_DISTRICT_ID;
  const district = getDistrictProfile(districtId);
  const playerProgress = resolvePlayerProgress(state);
  const budgetDelta = state.lastBudgetDelta;
  const headerXp = playerProgress.currentLevelXp;
  const headerXpTarget = playerProgress.nextLevelXp;
  const headerXpProgress = resolveHeaderXpProgress(playerProgress);

  return {
    playerName: player.name ?? 'Can',
    role: player.role,
    currentDay: city.day,
    dayLabel: buildDayLabel(city.day),
    selectedDistrictId: pilot.selectedDistrictId,
    selectedDistrictName: district?.name ?? 'Pilot Bölge',
    xp: headerXp,
    xpTarget: headerXpTarget,
    xpToNextLevel: Math.max(0, playerProgress.xpToNextLevel),
    xpProgress: headerXpProgress,
    level: playerProgress.currentLevel,
    levelProgress: headerXpProgress,
    totalXp: playerProgress.totalXp,
    budget: city.budget,
    budgetFormatted: formatCurrency(city.budget),
    budgetDelta,
    budgetDeltaLabel: formatBudgetDelta(budgetDelta),
    notificationCount: player.notificationCount,
    publicSatisfaction: city.publicSatisfaction,
    districtPulse: averageDistrictPulse(
      state.neighborhoods,
      city.publicSatisfaction,
    ),
    staffMorale: city.morale,
    operationRisk: city.riskScore,
    activeEventsCount: events.length,
    criticalEventsCount: countCriticalEvents(events),
    solvedEventsCount: solvedEvents.length,
  };
}

export const selectGameStatusShallow = selectGameStatus;

/** Header ve kartlar için merkezi oyun durumu hook'u. */
export function useGameStatus(): GameStatusSnapshot {
  return useGameStore(useShallow(selectGameStatus));
}

export function useXpProgress(): number {
  const { xp, xpTarget } = useGameStatus();
  return useMemo(() => calculateXpProgress(xp, xpTarget), [xp, xpTarget]);
}

export type MetricEffectsInput = DecisionAppliedEffects;
