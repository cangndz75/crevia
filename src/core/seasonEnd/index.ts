export type {
  SeasonEndCategory,
  SeasonEndCategoryEvaluation,
  SeasonEndDetailSheetModel,
  SeasonEndEvaluationModel,
  SeasonEndHighlight,
  SeasonEndMetricRow,
  SeasonEndRating,
  SeasonEndReportCardModel,
  SeasonEndTone,
} from './seasonEndTypes';

export {
  SEASON_END_CATEGORY_META,
  SEASON_END_FORBIDDEN_WORDS,
  SEASON_END_RATING_LABELS,
  SEASON_END_UI_COPY,
  getSeasonEndRatingFromScore,
  getSeasonEndToneFromRating,
} from './seasonEndConstants';

export {
  SEASON_END_EXPECTED_LENGTH_DAYS,
  buildSeasonEndAdvisorLine,
  buildSeasonEndEvaluationModel,
  buildNextSeasonFocus,
  calculateSeasonEndOverallScore,
  evaluateAssignments,
  evaluateCityBalance,
  evaluateCrisisManagement,
  evaluateDistrictCoverage,
  evaluateOperationalResources,
  evaluateSeasonGoals,
  evaluateSocialTrust,
  formatSeasonEndRatingLabel,
  isSeasonEndEligible,
  isSeasonEndReadyForPresentation,
  pickStrongestSeasonArea,
  pickWeakestSeasonArea,
  type SeasonEndEvaluationInput,
} from './seasonEndEvaluation';

export {
  buildSeasonEndCompactSummary,
  buildSeasonEndDetailSheetModel,
  buildSeasonEndEvaluationModelFromGameState,
  buildSeasonEndReportCardModel,
  formatSeasonEndRating,
  formatSeasonEndScore,
  getSeasonEndHeroTone,
} from './seasonEndPresentation';

export {
  verifySeasonEndScenario,
  type VerifySeasonEndOutcome,
} from './verifySeasonEndScenario';
