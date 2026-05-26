import { clamp, clampMetric } from '@/core/game/clamp';
import type { DaySnapshot } from '@/core/models/DaySnapshot';
import type { GameState } from '@/core/models/GameState';
import type {
  PilotFinalResult,
  PilotFinalResultStatus,
} from '@/core/models/PilotGameState';

export const PILOT_FINAL_EVENT_ID = 'shared_day7_final_pilot_report_pressure';

const MAX_PILOT_DAY = 7;
const MAX_COMPLETION_EVENTS = 7;

export type CalculatePilotFinalResultParams = {
  gameState: GameState;
  snapshots?: DaySnapshot[];
};

function resolveStartingBudget(
  gameState: GameState,
  snapshots?: DaySnapshot[],
): number {
  const fromSnapshot = snapshots?.[0]?.metrics?.budget;
  if (fromSnapshot != null && fromSnapshot > 0) {
    return fromSnapshot;
  }
  const fallback = gameState.city.budget;
  return fallback > 0 ? fallback : 1;
}

function budgetPreservationScore(
  currentBudget: number,
  startingBudget: number,
): number {
  if (startingBudget <= 0) {
    return 0;
  }
  return clamp((currentBudget / startingBudget) * 100, 0, 100);
}

function completionTraceScore(completedCount: number): number {
  return (Math.min(completedCount, MAX_COMPLETION_EVENTS) / MAX_COMPLETION_EVENTS) * 100;
}

function statusFromScore(score: number): PilotFinalResultStatus {
  if (score >= 80) return 'successful';
  if (score >= 60) return 'controlled';
  if (score >= 40) return 'risky';
  return 'failed';
}

function summaryForStatus(status: PilotFinalResultStatus): string {
  switch (status) {
    case 'successful':
      return 'Pilot bölge güçlü bir performansla tamamlandı. Hizmet dengesi korundu ve bölge güveni yükseldi.';
    case 'controlled':
      return 'Pilot bölge kontrol altında tamamlandı. Bazı riskler sürse de operasyon sürdürülebilir görünüyor.';
    case 'risky':
      return 'Pilot bölge riskli tamamlandı. Hizmet akışı devam etti ancak bazı kararların etkisi sonraki günlere taşınabilir.';
    case 'failed':
      return 'Pilot bölge zayıf tamamlandı. Şikayet, risk ve kaynak dengesi yeniden ele alınmalı.';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function canCompletePilot(gameState: GameState): boolean {
  const { pilot } = gameState;
  if (pilot.status !== 'active') {
    return false;
  }
  if (pilot.currentPilotDay !== MAX_PILOT_DAY) {
    return false;
  }
  return pilot.completedEventIds.includes(PILOT_FINAL_EVENT_ID);
}

export function calculatePilotFinalResult(
  params: CalculatePilotFinalResultParams,
): PilotFinalResult {
  const { gameState, snapshots } = params;
  const { city, pilot } = gameState;

  const publicSatisfaction = clampMetric(city.publicSatisfaction);
  const morale = clampMetric(city.morale);
  const riskScore = clampMetric(city.riskScore ?? 0);
  const riskComponent = 100 - riskScore;

  const startingBudget = resolveStartingBudget(gameState, snapshots);
  const budgetScore = budgetPreservationScore(city.budget, startingBudget);
  const completionScore = completionTraceScore(pilot.completedEventIds.length);

  const rawScore =
    publicSatisfaction * 0.3 +
    morale * 0.2 +
    riskComponent * 0.25 +
    budgetScore * 0.15 +
    completionScore * 0.1;

  const score = Math.round(clamp(rawScore, 0, 100));
  const status = statusFromScore(score);

  return {
    status,
    score,
    summary: summaryForStatus(status),
    completedAtDay: pilot.currentPilotDay,
  };
}
