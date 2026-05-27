import type { PlayerProgress, XpTransaction } from '@/core/xp/types';

export type DailyGoalType =
  | 'resolve_critical_event'
  | 'resolve_events_count'
  | 'reduce_risk'
  | 'keep_staff_fatigue_under'
  | 'stay_under_budget'
  | 'use_quick_action'
  | 'improve_satisfaction';

export type DailyGoal = {
  id: string;
  day: number;
  type: DailyGoalType;
  title: string;
  description?: string;
  target: number;
  progress: number;
  completed: boolean;
  xpReward: number;
  xpClaimed: boolean;
  createdAt?: string;
  completedAt?: string;
};

export type DailyGoalConfigEntry = {
  type: DailyGoalType;
  title: string;
  description?: string;
  target: number;
  xpReward: number;
};

export type DailyGoalProgressEvent =
  | {
      type: 'decision_applied';
      decisionResult?: {
        satisfactionDelta?: number;
        riskDelta?: number;
        budgetSpent?: number;
        expectedBudget?: number;
      };
      event?: {
        severity?: string;
        riskLevel?: string;
      };
    }
  | {
      type: 'quick_action_used';
      quickActionId?: string;
    }
  | {
      type: 'day_ended';
      daySummary?: {
        maxStaffFatigue?: number;
        budgetExceeded?: boolean;
      };
    };

export type DailyGoalClaimResult = {
  goal: DailyGoal;
  playerProgress: PlayerProgress;
  xpTransaction?: XpTransaction;
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
};
