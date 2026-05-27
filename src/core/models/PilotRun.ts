import type { PilotDistrictId } from './DistrictProfile';
import type { DecisionAppliedEffects } from './DecisionRecord';
import type { PilotEventType } from './PilotDayPlan';

/** Pilot final / günlük metrik özeti — backend senkronu için düz sayılar. */
export type PilotRunMetrics = {
  publicSatisfaction: number;
  budget: number;
  staffMorale: number;
  operationRisk: number;
};

export type PilotDailySnapshot = {
  day: number;
  startMetrics: PilotRunMetrics;
  endMetrics: PilotRunMetrics;
  completedEvents: string[];
  criticalDecisionCount: number;
};

export type PilotEventHistoryEntry = {
  day: number;
  eventId: string;
  eventTitle: string;
  eventType: string;
  selectedChoiceId: string;
  selectedChoiceText: string;
  effects: DecisionAppliedEffects;
  createdAt: string;
};

export type PilotUnlockState = {
  cityMapPreviewUnlocked: boolean;
  mainOperationPreviewUnlocked: boolean;
  fullMainOperationUnlocked: boolean;
};

/** 7 günlük pilot koşusu — ileride API ile senkronlanabilir. */
export type PilotRun = {
  id: string;
  localPlayerId: string;
  selectedDistrictId: PilotDistrictId;
  selectedDistrictName: string;
  currentDay: number;
  isCompleted: boolean;
  startedAt: string;
  completedAt: string | null;
  finalMetrics: PilotRunMetrics | null;
  dailySnapshots: PilotDailySnapshot[];
  eventHistory: PilotEventHistoryEntry[];
  unlockState: PilotUnlockState;
};

export const DEFAULT_PILOT_UNLOCK_STATE: PilotUnlockState = {
  cityMapPreviewUnlocked: false,
  mainOperationPreviewUnlocked: false,
  fullMainOperationUnlocked: false,
};
