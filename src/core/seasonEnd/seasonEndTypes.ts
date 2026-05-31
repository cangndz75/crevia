export type SeasonEndRating =
  | 'excellent'
  | 'strong'
  | 'steady'
  | 'strained'
  | 'critical';

export type SeasonEndTone = 'positive' | 'neutral' | 'warning' | 'critical';

export type SeasonEndCategory =
  | 'city_balance'
  | 'district_coverage'
  | 'operational_resources'
  | 'assignments'
  | 'crisis_management'
  | 'social_trust'
  | 'season_goals';

export type SeasonEndMetricRow = {
  id: string;
  label: string;
  valueLabel: string;
  summary: string;
  tone: SeasonEndTone;
  iconKey: string;
};

export type SeasonEndCategoryEvaluation = {
  category: SeasonEndCategory;
  title: string;
  rating: SeasonEndRating;
  scoreLabel: string;
  summary: string;
  evidenceLines: string[];
  recommendationLine: string;
  tone: SeasonEndTone;
  iconKey: string;
};

export type SeasonEndHighlight = {
  id: string;
  title: string;
  summary: string;
  tone: SeasonEndTone;
  iconKey: string;
};

export type SeasonEndEvaluationModel = {
  seasonId: string;
  title: string;
  subtitle: string;
  overallRating: SeasonEndRating;
  overallScoreLabel: string;
  overallSummary: string;
  completedDayLabel: string;
  categoryEvaluations: SeasonEndCategoryEvaluation[];
  strongestArea?: SeasonEndHighlight;
  weakestArea?: SeasonEndHighlight;
  nextSeasonFocus: SeasonEndHighlight[];
  metricRows: SeasonEndMetricRow[];
  advisorLine: string;
  footerNote: string;
};

export type SeasonEndReportCardModel = {
  title: string;
  subtitle: string;
  ratingLabel: string;
  summary: string;
  highlights: SeasonEndHighlight[];
  ctaLabel?: string;
  tone: SeasonEndTone;
  overallScoreLabel: string;
};

export type SeasonEndDetailSheetModel = {
  title: string;
  subtitle: string;
  overallSummary: string;
  categoryEvaluations: SeasonEndCategoryEvaluation[];
  metricRows: SeasonEndMetricRow[];
  advisorLine: string;
  closeLabel: string;
  overallRating: SeasonEndRating;
  ratingLabel: string;
};
