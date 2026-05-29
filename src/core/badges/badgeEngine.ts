import {
  buildBadgeEarnedLines,
  buildBadgeEvaluationSnapshot,
  buildBadgeProgressLines,
  buildBadgeSummaryLines,
} from './badgePresentation';
import { BADGE_BY_ID } from './badgeConstants';
import { createInitialBadgeState, normalizeBadgeState } from './badgeSeed';
import type {
  BadgeEvaluationResult,
  BadgeEvaluationSnapshot,
  BadgeId,
  BadgeProgressUpdate,
  BadgeState,
  EvaluateDailyBadgesInput,
  EvaluatePilotCompletionBadgesInput,
} from './badgeTypes';
import type { BadgeDefinition } from './badgeTypes';

function isAlreadyEarned(state: BadgeState, badgeId: BadgeId): boolean {
  return state.earnedBadgeIds.includes(badgeId);
}

function updateStreakProgress(
  state: BadgeState,
  badgeId: BadgeId,
  qualifying: boolean,
  day: number,
): BadgeProgressUpdate {
  const target = BADGE_BY_ID[badgeId].target;
  if (isAlreadyEarned(state, badgeId)) {
    return { badgeId, current: target, target, completed: true, updatedDay: day };
  }
  const previous = state.badgeProgress[badgeId]?.current ?? 0;
  const current = qualifying
    ? Math.min(target, previous + 1)
    : 0;
  return {
    badgeId,
    current,
    target,
    completed: current >= target,
    updatedDay: day,
  };
}

function updateOneShotProgress(
  state: BadgeState,
  badgeId: BadgeId,
  condition: boolean,
  day: number,
): BadgeProgressUpdate {
  const target = BADGE_BY_ID[badgeId].target;
  if (isAlreadyEarned(state, badgeId)) {
    return { badgeId, current: target, target, completed: true, updatedDay: day };
  }
  const previous = state.badgeProgress[badgeId]?.current ?? 0;
  const current = condition ? target : previous;
  return {
    badgeId,
    current: Math.min(target, current),
    target,
    completed: condition || previous >= target,
    updatedDay: day,
  };
}

function collectNewlyEarned(
  state: BadgeState,
  updates: BadgeProgressUpdate[],
): BadgeId[] {
  const earned: BadgeId[] = [];
  for (const update of updates) {
    if (update.completed && !isAlreadyEarned(state, update.badgeId)) {
      earned.push(update.badgeId);
    }
  }
  return earned;
}

export function evaluateDailyBadges(
  input: EvaluateDailyBadgesInput,
): BadgeEvaluationResult {
  const { day, badgeState } = input;
  const updates: BadgeProgressUpdate[] = [
    updateOneShotProgress(
      badgeState,
      'first_step',
      input.dailyOperationCompleted === true,
      day,
    ),
    updateStreakProgress(
      badgeState,
      'steady_operator',
      input.positiveOperationDay === true,
      day,
    ),
    updateStreakProgress(
      badgeState,
      'public_listener',
      input.socialPulseBalanced === true,
      day,
    ),
    updateStreakProgress(
      badgeState,
      'budget_guardian',
      input.budgetNotSeriouslyDamaged === true,
      day,
    ),
    updateStreakProgress(
      badgeState,
      'team_caretaker',
      input.personnelMoraleMaintained === true,
      day,
    ),
    updateOneShotProgress(
      badgeState,
      'crisis_cooler',
      input.criticalRiskClosedWithoutGrowth === true,
      day,
    ),
    updateStreakProgress(
      badgeState,
      'route_mind',
      input.vehicleDayPositive === true,
      day,
    ),
    updateStreakProgress(
      badgeState,
      'container_watch',
      input.containerRiskControlled === true,
      day,
    ),
    updateOneShotProgress(
      badgeState,
      'butterfly_handler',
      input.butterflyFollowUpWellManaged === true,
      day,
    ),
  ];

  const earnedBadgeIds = collectNewlyEarned(badgeState, updates);
  const reasonLines = earnedBadgeIds.map(
    (badgeId) => `${BADGE_BY_ID[badgeId].title} koşulu sağlandı`,
  );

  return {
    progressUpdates: updates,
    earnedBadgeIds,
    reasonLines,
    source: 'daily_report',
  };
}

export function evaluatePilotCompletionBadges(
  input: EvaluatePilotCompletionBadgesInput,
): BadgeEvaluationResult {
  const { day, badgeState, pilotRunId } = input;
  const updates: BadgeProgressUpdate[] = [
    updateOneShotProgress(badgeState, 'pilot_finisher', true, day),
    updateOneShotProgress(
      badgeState,
      'authority_candidate',
      input.authorityEvaluationStatus === 'promotion_candidate' &&
        input.authorityPromoted !== true,
      day,
    ),
    updateOneShotProgress(
      badgeState,
      'promoted_operator',
      input.authorityPromoted === true,
      day,
    ),
  ];

  const earnedBadgeIds = collectNewlyEarned(badgeState, updates);
  const reasonLines = earnedBadgeIds.map(
    (badgeId) => `${BADGE_BY_ID[badgeId].title} pilot dönemi tamamlandı`,
  );

  return {
    progressUpdates: updates,
    earnedBadgeIds,
    reasonLines,
    source: 'pilot_completion',
    pilotRunId,
  };
}

function hasHistoryEntry(
  state: BadgeState,
  badgeId: BadgeId,
  earnedDay: number,
  source: BadgeEvaluationResult['source'],
  pilotRunId?: string,
): boolean {
  return state.history.some(
    (entry) =>
      entry.badgeId === badgeId &&
      entry.earnedDay === earnedDay &&
      entry.source === source &&
      (pilotRunId == null || entry.pilotRunId === pilotRunId),
  );
}

export function applyBadgeEvaluation(
  badgeState: BadgeState,
  result: BadgeEvaluationResult,
  day: number,
): BadgeState {
  const earnedSet = new Set(badgeState.earnedBadgeIds);
  const newlyEarned: BadgeId[] = [];
  const history = [...badgeState.history];
  const badgeProgress = { ...badgeState.badgeProgress };

  for (const update of result.progressUpdates) {
    badgeProgress[update.badgeId] = {
      badgeId: update.badgeId,
      current: Math.min(update.target, Math.max(0, update.current)),
      target: update.target,
      completed: update.completed || earnedSet.has(update.badgeId),
      updatedDay: update.updatedDay ?? day,
    };
  }

  for (const badgeId of result.earnedBadgeIds) {
    if (earnedSet.has(badgeId)) {
      continue;
    }
    if (
      hasHistoryEntry(
        badgeState,
        badgeId,
        day,
        result.source,
        result.pilotRunId,
      )
    ) {
      continue;
    }

    earnedSet.add(badgeId);
    newlyEarned.push(badgeId);
    badgeProgress[badgeId] = {
      badgeId,
      current: BADGE_BY_ID[badgeId].target,
      target: BADGE_BY_ID[badgeId].target,
      completed: true,
      updatedDay: day,
    };
    history.push({
      badgeId,
      earnedDay: day,
      source: result.source,
      pilotRunId: result.pilotRunId,
    });
  }

  return {
    earnedBadgeIds: [...earnedSet],
    badgeProgress,
    recentlyEarnedBadgeIds: newlyEarned,
    history,
    lastEvaluatedDay:
      result.source === 'daily_report' ? day : badgeState.lastEvaluatedDay,
    lastEvaluatedPilotRunId:
      result.source === 'pilot_completion' && result.pilotRunId
        ? result.pilotRunId
        : badgeState.lastEvaluatedPilotRunId,
  };
}

export function getEarnedBadges(badgeState: BadgeState): BadgeDefinition[] {
  return badgeState.earnedBadgeIds
    .map((badgeId) => BADGE_BY_ID[badgeId])
    .filter(Boolean);
}

export function getRecentBadges(badgeState: BadgeState): BadgeDefinition[] {
  return badgeState.recentlyEarnedBadgeIds
    .map((badgeId) => BADGE_BY_ID[badgeId])
    .filter(Boolean);
}

export function isDailyBadgeEvaluationApplied(
  badgeState: BadgeState,
  day: number,
): boolean {
  return badgeState.lastEvaluatedDay === day;
}

export function isPilotBadgeEvaluationApplied(
  badgeState: BadgeState,
  pilotRunId?: string,
): boolean {
  if (!pilotRunId || !badgeState.lastEvaluatedPilotRunId) {
    return false;
  }
  return badgeState.lastEvaluatedPilotRunId === pilotRunId;
}

export type ProcessDailyBadgeEvaluationParams = {
  badgeState: unknown;
  day: number;
  input: Omit<EvaluateDailyBadgesInput, 'badgeState' | 'day'>;
  skipIfAlreadyApplied?: boolean;
};

export type ProcessDailyBadgeEvaluationResult = {
  badgeState: BadgeState;
  result: BadgeEvaluationResult;
  snapshot: BadgeEvaluationSnapshot;
  summaryLines: string[];
  alreadyApplied: boolean;
};

export function processDailyBadgeEvaluation(
  params: ProcessDailyBadgeEvaluationParams,
): ProcessDailyBadgeEvaluationResult {
  const normalized = normalizeBadgeState(params.badgeState, params.day);

  if (
    params.skipIfAlreadyApplied !== false &&
    isDailyBadgeEvaluationApplied(normalized, params.day)
  ) {
    return {
      badgeState: normalized,
      result: {
        progressUpdates: [],
        earnedBadgeIds: [],
        reasonLines: [],
        source: 'daily_report',
      },
      snapshot: buildBadgeEvaluationSnapshot({
        progressUpdates: [],
        earnedBadgeIds: [],
        reasonLines: [],
        source: 'daily_report',
      }),
      summaryLines: [],
      alreadyApplied: true,
    };
  }

  const result = evaluateDailyBadges({
    day: params.day,
    badgeState: normalized,
    ...params.input,
  });
  const badgeState = applyBadgeEvaluation(normalized, result, params.day);
  const snapshot = buildBadgeEvaluationSnapshot(result, badgeState);
  const summaryLines = buildBadgeSummaryLines(snapshot, badgeState);

  return {
    badgeState,
    result,
    snapshot,
    summaryLines,
    alreadyApplied: false,
  };
}

export type ProcessPilotCompletionBadgeEvaluationParams = {
  badgeState: unknown;
  day: number;
  pilotRunId?: string;
  authorityEvaluationStatus?: EvaluatePilotCompletionBadgesInput['authorityEvaluationStatus'];
  authorityPromoted?: boolean;
  skipIfAlreadyApplied?: boolean;
};

export type ProcessPilotCompletionBadgeEvaluationResult = {
  badgeState: BadgeState;
  result: BadgeEvaluationResult;
  alreadyApplied: boolean;
};

export function processPilotCompletionBadgeEvaluation(
  params: ProcessPilotCompletionBadgeEvaluationParams,
): ProcessPilotCompletionBadgeEvaluationResult {
  const normalized = normalizeBadgeState(params.badgeState, params.day);

  if (
    params.skipIfAlreadyApplied !== false &&
    isPilotBadgeEvaluationApplied(normalized, params.pilotRunId)
  ) {
    return {
      badgeState: normalized,
      result: {
        progressUpdates: [],
        earnedBadgeIds: [],
        reasonLines: [],
        source: 'pilot_completion',
        pilotRunId: params.pilotRunId,
      },
      alreadyApplied: true,
    };
  }

  const result = evaluatePilotCompletionBadges({
    day: params.day,
    badgeState: normalized,
    pilotRunId: params.pilotRunId,
    authorityEvaluationStatus: params.authorityEvaluationStatus,
    authorityPromoted: params.authorityPromoted,
  });
  const badgeState = applyBadgeEvaluation(normalized, result, params.day);

  return {
    badgeState,
    result,
    alreadyApplied: false,
  };
}

export { createInitialBadgeState, normalizeBadgeState };
