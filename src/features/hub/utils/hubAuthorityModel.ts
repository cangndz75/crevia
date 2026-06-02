import { calculateAuthorityProgress } from '@/core/authority/authorityEngine';
import { buildAuthorityRankLabel } from '@/core/authority/authorityPresentation';
import { createInitialAuthorityState, normalizeAuthorityState } from '@/core/authority/authoritySeed';
import type { AuthorityEvaluationSnapshot, AuthorityState } from '@/core/authority/authorityTypes';
import { buildCompactRankUnlockLine } from '@/core/rankPermissions';

export type HubAuthorityChipAccent = 'candidate' | 'promoted' | null;

export type HubAuthorityChipSummary = {
  rankLabel: string;
  progressLine: string;
  accentLine?: string;
  nextUnlockLine?: string;
  progressPercent: number;
  evaluationAccent: HubAuthorityChipAccent;
};

function resolveEvaluationAccent(
  evaluation: AuthorityEvaluationSnapshot | undefined,
): {
  accentLine?: string;
  evaluationAccent: HubAuthorityChipAccent;
} {
  if (!evaluation) {
    return { evaluationAccent: null };
  }

  if (evaluation.promoted) {
    return {
      accentLine: 'Yeni görevlendirme aktif',
      evaluationAccent: 'promoted',
    };
  }

  if (evaluation.evaluationStatus === 'promotion_candidate') {
    return {
      accentLine: 'Terfi adaylığı izleniyor',
      evaluationAccent: 'candidate',
    };
  }

  return { evaluationAccent: null };
}

function buildProgressLine(
  authorityState: AuthorityState,
  progress: ReturnType<typeof calculateAuthorityProgress>,
): string {
  if (!progress.nextRank) {
    return 'En üst görev seviyesi';
  }

  if (progress.trustRemainingToNext <= 120) {
    return `${progress.nextRank.label} için ${progress.trustRemainingToNext} güven kaldı`;
  }

  return `${progress.nextRank.label} için %${progress.progressToNextPercent}`;
}

export function buildHubAuthorityChipSummary(
  authorityStateInput: unknown,
  day: number = 1,
): HubAuthorityChipSummary {
  const authorityState = normalizeAuthorityState(
    authorityStateInput ?? createInitialAuthorityState(day),
    day,
  );
  const progress = calculateAuthorityProgress(authorityState);
  const evaluationPresentation = resolveEvaluationAccent(
    authorityState.lastEvaluation,
  );

  return {
    rankLabel: buildAuthorityRankLabel(authorityState.formalRankId),
    progressLine: buildProgressLine(authorityState, progress),
    accentLine: evaluationPresentation.accentLine,
    nextUnlockLine:
      day <= 1
        ? undefined
        : buildCompactRankUnlockLine({
            authorityState,
            currentTitle: authorityState.formalRankId,
            compact: true,
          }),
    progressPercent: progress.progressToNextPercent,
    evaluationAccent: evaluationPresentation.evaluationAccent,
  };
}

export function buildHubAuthorityChipSummaryFromPilot(
  pilotAuthorityState: unknown,
  pilotDay: number,
): HubAuthorityChipSummary {
  return buildHubAuthorityChipSummary(
    pilotAuthorityState,
    Math.max(1, pilotDay),
  );
}
