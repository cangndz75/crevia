export type DailyGoalMetricKey =
  | 'publicSatisfaction'
  | 'budget'
  | 'personnelMorale'
  | 'operationRisk'
  | 'resolvedEvents'
  | 'containerPressure'
  | 'vehicleRisk'
  | 'socialPulse'
  | 'personnelFatigue';

export type DailyGoalStatus =
  | 'active'
  | 'completed'
  | 'at_risk'
  | 'failed'
  | 'locked';

export type DailyGoalPriority = 'primary' | 'secondary';

export type DailyGoalKind =
  | 'keep_metric_above'
  | 'keep_metric_below'
  | 'resolve_event_count'
  | 'resolve_main_event'
  | 'reduce_neighborhood_pressure'
  | 'avoid_critical_subsystem'
  | 'improve_social_pulse'
  | 'protect_personnel'
  | 'protect_budget'
  | 'complete_day_report';

export type DailyGoalSubsystem =
  | 'personnel'
  | 'container'
  | 'vehicle'
  | 'social'
  | 'general';

export type DailyGoal = {
  id: string;
  day: number;
  priority: DailyGoalPriority;
  kind: DailyGoalKind;
  metricKey?: DailyGoalMetricKey;
  title: string;
  description: string;
  shortLabel: string;

  targetValue?: number;
  startValue?: number;
  currentValue?: number;
  progressPercent: number;

  status: DailyGoalStatus;
  isCompleted: boolean;
  isFailed: boolean;

  rewardXp?: number;
  rewardText?: string;
  riskText?: string;

  relatedEventId?: string;
  relatedNeighborhoodId?: string;
  relatedSubsystem?: DailyGoalSubsystem;

  createdAt: number;
  completedAt?: number;
  failedAt?: number;
  xpClaimed?: boolean;
};

export type DailyGoalState = {
  day: number;
  goals: DailyGoal[];
  lastEvaluatedAt: number;
};

export type DailyGoalEvaluationTrigger =
  | 'day_start'
  | 'after_decision'
  | 'after_social_quick_action'
  | 'end_of_day';

export type DailyGoalReportResult = {
  title: string;
  status: 'completed' | 'failed' | 'at_risk' | 'active';
  resultText: string;
};
