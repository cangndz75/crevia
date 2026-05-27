import { createId } from '@/core/game/createId';
import { applyXpTransactions } from '@/core/xp/xpEngine';
import type { PlayerProgress, XpTransaction } from '@/core/xp/types';

import {
  DAILY_GOAL_CONFIG_BY_DAY,
  FALLBACK_DAILY_GOAL_CONFIG,
} from '@/core/dailyGoals/dailyGoalConfig';
import type {
  DailyGoal,
  DailyGoalClaimResult,
  DailyGoalConfigEntry,
  DailyGoalProgressEvent,
} from '@/core/dailyGoals/types';

const STAFF_FATIGUE_LIMIT = 70;

function isCriticalSeverity(severity?: string): boolean {
  if (!severity) return false;
  const normalized = severity.toLowerCase();
  return normalized === 'high' || normalized === 'critical';
}

function clampProgress(progress: number, target: number): number {
  return Math.min(target, Math.max(0, progress));
}

function markCompleted(goal: DailyGoal): DailyGoal {
  if (goal.completed) {
    return goal;
  }
  return {
    ...goal,
    completed: true,
    completedAt: new Date().toISOString(),
  };
}

export function getDailyGoalForDay(day: number): DailyGoalConfigEntry {
  const safeDay = Math.max(1, Math.floor(day));
  return DAILY_GOAL_CONFIG_BY_DAY[safeDay] ?? FALLBACK_DAILY_GOAL_CONFIG;
}

export function createDailyGoalForDay(day: number): DailyGoal {
  const config = getDailyGoalForDay(day);
  const safeDay = Math.max(1, Math.floor(day));

  return {
    id: createId(`day_${safeDay}_goal`),
    day: safeDay,
    type: config.type,
    title: config.title,
    description: config.description,
    target: config.target,
    progress: 0,
    completed: false,
    xpReward: config.xpReward,
    xpClaimed: false,
    createdAt: new Date().toISOString(),
  };
}

export function updateDailyGoalProgress(
  goal: DailyGoal,
  event: DailyGoalProgressEvent,
): DailyGoal {
  if (goal.completed && goal.xpClaimed) {
    return goal;
  }

  let next = { ...goal };

  switch (goal.type) {
    case 'resolve_critical_event': {
      if (event.type !== 'decision_applied') break;
      const severity =
        event.event?.severity ?? event.event?.riskLevel ?? undefined;
      if (isCriticalSeverity(severity)) {
        next.progress = clampProgress(next.progress + 1, next.target);
      }
      break;
    }
    case 'resolve_events_count': {
      if (event.type === 'decision_applied') {
        next.progress = clampProgress(next.progress + 1, next.target);
      }
      break;
    }
    case 'reduce_risk': {
      if (event.type !== 'decision_applied') break;
      const riskDelta = event.decisionResult?.riskDelta ?? 0;
      if (riskDelta < 0) {
        next.progress = clampProgress(
          next.progress + Math.abs(riskDelta),
          next.target,
        );
      }
      break;
    }
    case 'improve_satisfaction': {
      if (event.type !== 'decision_applied') break;
      const delta = event.decisionResult?.satisfactionDelta ?? 0;
      if (delta > 0) {
        next.progress = clampProgress(next.target, next.target);
      }
      break;
    }
    case 'use_quick_action': {
      if (event.type === 'quick_action_used') {
        next.progress = clampProgress(next.progress + 1, next.target);
      }
      break;
    }
    case 'keep_staff_fatigue_under': {
      if (event.type !== 'day_ended') break;
      const fatigue = event.daySummary?.maxStaffFatigue;
      if (fatigue != null && fatigue < STAFF_FATIGUE_LIMIT) {
        next.progress = clampProgress(next.target, next.target);
      }
      break;
    }
    case 'stay_under_budget': {
      if (event.type !== 'day_ended') break;
      if (event.daySummary?.budgetExceeded === false) {
        next.progress = clampProgress(next.target, next.target);
      }
      break;
    }
    default:
      break;
  }

  if (next.progress >= next.target) {
    next = markCompleted(next);
  }

  return next;
}

export function maybeCreateDailyGoalXpTransaction(
  goal: DailyGoal,
  day: number,
): XpTransaction | null {
  if (!goal.completed || goal.xpClaimed || goal.xpReward <= 0) {
    return null;
  }

  return {
    id: createId('xp'),
    day,
    amount: goal.xpReward,
    category: 'daily_goal',
    sourceId: goal.id,
    sourceType: 'goal',
    title: 'Günlük hedef tamamlandı',
    description: goal.title,
    createdAt: new Date().toISOString(),
  };
}

export function claimDailyGoalXp(params: {
  playerProgress: PlayerProgress;
  goal: DailyGoal;
}): DailyGoalClaimResult {
  const previousLevel = params.playerProgress.currentLevel;

  if (!params.goal.completed || params.goal.xpClaimed || params.goal.xpReward <= 0) {
    return {
      goal: params.goal,
      playerProgress: params.playerProgress,
      leveledUp: false,
      previousLevel,
      newLevel: params.playerProgress.currentLevel,
    };
  }

  const transaction = maybeCreateDailyGoalXpTransaction(params.goal, params.goal.day);
  if (!transaction) {
    return {
      goal: params.goal,
      playerProgress: params.playerProgress,
      leveledUp: false,
      previousLevel,
      newLevel: params.playerProgress.currentLevel,
    };
  }

  const applyResult = applyXpTransactions(params.playerProgress, [transaction]);

  return {
    goal: { ...params.goal, xpClaimed: true },
    playerProgress: applyResult.progress,
    xpTransaction: transaction,
    leveledUp: applyResult.leveledUp,
    previousLevel: applyResult.previousLevel,
    newLevel: applyResult.newLevel,
  };
}

export type ProcessDailyGoalResult = {
  goal: DailyGoal;
  playerProgress: PlayerProgress;
  claim: DailyGoalClaimResult | null;
};

export function processDailyGoalEvent(params: {
  goal: DailyGoal;
  playerProgress: PlayerProgress;
  event: DailyGoalProgressEvent;
}): ProcessDailyGoalResult {
  const wasCompleted = params.goal.completed;
  const updatedGoal = updateDailyGoalProgress(params.goal, params.event);

  if (!updatedGoal.completed || updatedGoal.xpClaimed) {
    return {
      goal: updatedGoal,
      playerProgress: params.playerProgress,
      claim: null,
    };
  }

  if (!wasCompleted && updatedGoal.completed) {
    const claim = claimDailyGoalXp({
      goal: updatedGoal,
      playerProgress: params.playerProgress,
    });
    return {
      goal: claim.goal,
      playerProgress: claim.playerProgress,
      claim,
    };
  }

  return {
    goal: updatedGoal,
    playerProgress: params.playerProgress,
    claim: null,
  };
}
