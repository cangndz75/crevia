import type { GameState } from '@/core/models/GameState';

import {
  buildSeasonEndEvaluationModel,
  type SeasonEndEvaluationInput,
} from './seasonEndEvaluation';
import {
  formatSeasonEndRatingLabel,
  SEASON_END_UI_COPY,
} from './seasonEndConstants';
import type {
  SeasonEndDetailSheetModel,
  SeasonEndReportCardModel,
  SeasonEndTone,
} from './seasonEndTypes';
import type { SeasonEndEvaluationModel } from './seasonEndTypes';

export type { SeasonEndEvaluationInput } from './seasonEndEvaluation';

export function buildSeasonEndReportCardModel(
  input: SeasonEndEvaluationInput,
): SeasonEndReportCardModel | undefined {
  const evaluation = buildSeasonEndEvaluationModel(input);
  if (!evaluation) return undefined;

  const highlights = [
    evaluation.strongestArea,
    evaluation.weakestArea,
  ].filter((h): h is NonNullable<typeof h> => h != null);

  return {
    title: SEASON_END_UI_COPY.evaluationTitle,
    subtitle: SEASON_END_UI_COPY.evaluationSubtitle,
    ratingLabel: formatSeasonEndRatingLabel(evaluation.overallRating),
    summary: evaluation.overallSummary,
    highlights,
    ctaLabel: SEASON_END_UI_COPY.detailCta,
    tone: getSeasonEndHeroTone(evaluation),
    overallScoreLabel: evaluation.overallScoreLabel,
  };
}

export function buildSeasonEndDetailSheetModel(
  input: SeasonEndEvaluationInput,
): SeasonEndDetailSheetModel | undefined {
  const evaluation = buildSeasonEndEvaluationModel(input);
  if (!evaluation) return undefined;

  return {
    title: SEASON_END_UI_COPY.detailTitle,
    subtitle: evaluation.completedDayLabel,
    overallSummary: evaluation.overallSummary,
    categoryEvaluations: evaluation.categoryEvaluations,
    metricRows: evaluation.metricRows,
    advisorLine: evaluation.advisorLine,
    closeLabel: SEASON_END_UI_COPY.detailClose,
    overallRating: evaluation.overallRating,
    ratingLabel: formatSeasonEndRatingLabel(evaluation.overallRating),
  };
}

export function buildSeasonEndCompactSummary(
  input: SeasonEndEvaluationInput,
): string[] {
  const evaluation = buildSeasonEndEvaluationModel(input);
  if (!evaluation) return [];
  const lines = [
    evaluation.overallSummary,
    evaluation.strongestArea?.summary,
    evaluation.weakestArea?.summary,
  ].filter((line): line is string => Boolean(line));
  return lines.slice(0, 3);
}

export function formatSeasonEndRating(
  rating: SeasonEndEvaluationModel['overallRating'],
): string {
  return formatSeasonEndRatingLabel(rating);
}

export function formatSeasonEndScore(score: number): string {
  return `${Math.max(0, Math.min(100, Math.round(score)))}/100`;
}

export function getSeasonEndHeroTone(
  model: Pick<SeasonEndEvaluationModel, 'overallRating'>,
): SeasonEndTone {
  switch (model.overallRating) {
    case 'excellent':
    case 'strong':
      return 'positive';
    case 'steady':
      return 'neutral';
    case 'strained':
      return 'warning';
    case 'critical':
      return 'critical';
    default:
      return 'neutral';
  }
}

export function buildSeasonEndEvaluationModelFromGameState(
  gameState: GameState,
  slices: Omit<SeasonEndEvaluationInput, 'gameState'>,
): ReturnType<typeof buildSeasonEndEvaluationModel> {
  return buildSeasonEndEvaluationModel({ gameState, ...slices });
}
