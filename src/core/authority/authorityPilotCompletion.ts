import type { LeaderboardEntry } from '@/core/leaderboard/leaderboardTypes';
import type { DailyReport } from '@/core/models/DailyReport';
import type { PilotFinalResult } from '@/core/models/PilotGameState';

import {
  applyAuthorityEvaluation,
  evaluateAuthorityPromotion,
} from './authorityEngine';
import {
  buildAuthorityEvaluationLines,
  buildPilotAuthorityCompletionPresentation,
} from './authorityPresentation';
import { createInitialAuthorityState, normalizeAuthorityState } from './authoritySeed';
import type {
  AuthorityEvaluationSnapshot,
  AuthorityState,
} from './authorityTypes';

const PILOT_FINAL_EVALUATION_DAY = 7;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizeLeaderboardScoreToPilot(score: number): number {
  if (score <= 100) return clampScore(score);
  return clampScore(score / 100);
}

export type ResolvePilotAuthorityEvaluationScoreParams = {
  finalResult?: PilotFinalResult | null;
  lastPilotScore?: LeaderboardEntry | null;
  fallbackScore?: number;
};

export function resolvePilotAuthorityEvaluationScore(
  params: ResolvePilotAuthorityEvaluationScoreParams,
): number {
  if (params.finalResult?.score != null) {
    return clampScore(params.finalResult.score);
  }
  if (params.lastPilotScore?.score != null) {
    return normalizeLeaderboardScoreToPilot(params.lastPilotScore.score);
  }
  return clampScore(params.fallbackScore ?? 0);
}

export function isPilotAuthorityEvaluationApplied(
  authorityState: AuthorityState,
  evaluationDay: number,
  pilotRunId?: string,
): boolean {
  const evaluation = authorityState.lastEvaluation;
  if (!evaluation || evaluation.day !== evaluationDay) {
    return false;
  }
  if (pilotRunId && evaluation.pilotRunId && evaluation.pilotRunId !== pilotRunId) {
    return false;
  }
  return authorityState.history.some(
    (entry) => entry.type === 'evaluation' && entry.day === evaluationDay,
  );
}

export type ProcessPilotCompletionAuthorityParams = {
  authorityState: unknown;
  evaluationDay?: number;
  pilotScore: number;
  pilotRunId?: string;
  skipIfAlreadyApplied?: boolean;
};

export type ProcessPilotCompletionAuthorityResult = {
  authorityState: AuthorityState;
  evaluation: AuthorityEvaluationSnapshot;
  evaluationLines: string[];
  alreadyApplied: boolean;
};

export function processPilotCompletionAuthority(
  params: ProcessPilotCompletionAuthorityParams,
): ProcessPilotCompletionAuthorityResult {
  const evaluationDay = params.evaluationDay ?? PILOT_FINAL_EVALUATION_DAY;
  const normalized = normalizeAuthorityState(
    params.authorityState,
    evaluationDay,
  );

  if (
    params.skipIfAlreadyApplied !== false &&
    isPilotAuthorityEvaluationApplied(
      normalized,
      evaluationDay,
      params.pilotRunId,
    ) &&
    normalized.lastEvaluation
  ) {
    return {
      authorityState: normalized,
      evaluation: normalized.lastEvaluation,
      evaluationLines: buildAuthorityEvaluationLines(normalized.lastEvaluation),
      alreadyApplied: true,
    };
  }

  const evaluation = evaluateAuthorityPromotion({
    authorityState: normalized,
    pilotScore: params.pilotScore,
    day: evaluationDay,
  });

  const evaluationWithMeta: AuthorityEvaluationSnapshot = {
    ...evaluation,
    pilotRunId: params.pilotRunId,
  };

  const authorityState = applyAuthorityEvaluation(
    normalized,
    evaluationWithMeta,
  );

  return {
    authorityState,
    evaluation: evaluationWithMeta,
    evaluationLines: buildAuthorityEvaluationLines(evaluationWithMeta),
    alreadyApplied: false,
  };
}

export type BuildPilotCompletionAuthorityFieldsParams = {
  authorityState: unknown;
  day?: number;
};

export function buildPilotCompletionAuthorityFields(
  params: BuildPilotCompletionAuthorityFieldsParams,
) {
  const day = params.day ?? PILOT_FINAL_EVALUATION_DAY;
  const state = normalizeAuthorityState(params.authorityState, day);
  const evaluation = state.lastEvaluation;
  const presentation = buildPilotAuthorityCompletionPresentation(
    evaluation,
    state,
  );

  return {
    authorityEvaluation: evaluation,
    authorityTitle: presentation?.authorityTitle,
    authoritySubtitle: presentation?.authoritySubtitle,
    authorityLines: presentation?.authorityLines,
  };
}

export function mergeAuthorityEvaluationIntoDailyReport(
  report: DailyReport | null | undefined,
  evaluation: AuthorityEvaluationSnapshot,
  evaluationLines: string[],
): DailyReport | null {
  if (!report || report.day < PILOT_FINAL_EVALUATION_DAY) {
    return report ?? null;
  }

  return {
    ...report,
    authorityEvaluation: evaluation,
    authorityEvaluationLines: evaluationLines,
  };
}

export function ensureAuthorityStateForPilot(
  authorityState: unknown,
  day: number,
): AuthorityState {
  return normalizeAuthorityState(authorityState ?? createInitialAuthorityState(day), day);
}

export { PILOT_FINAL_EVALUATION_DAY };
