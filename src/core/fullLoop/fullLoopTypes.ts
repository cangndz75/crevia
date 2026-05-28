import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import type { PilotDayRole } from '@/core/events/pilotRhythmTypes';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { EconomyState } from '@/core/economy/types';

export type FullLoopScenarioId =
  | 'balanced_player'
  | 'public_relief_player'
  | 'operation_player'
  | 'resource_player'
  | 'risky_fast_player'
  | 'passive_player'
  | 'wrong_priority_player'
  | 'permanent_solution_player';

export type FullLoopVerdict = 'PASS' | 'WARN' | 'FAIL';

export type FullLoopScenarioConfig = {
  id: FullLoopScenarioId;
  label: string;
  priorityForDay: (day: number) => DailyPriorityKey | undefined;
  pickDecision: (
    event: EventCard,
    priorityKey: DailyPriorityKey | undefined,
    economyState: EconomyState,
  ) => EventDecision | null;
};

export type FullLoopMetrics = {
  scenario: FullLoopScenarioId;
  status: FullLoopVerdict;
  notes: string[];

  daysCompleted: number;
  eventsGenerated: number;
  decisionsApplied: number;
  decisionResultsCreated: number;
  reportsCreated: number;
  crashes: number;
  warnings: string[];
  fails: string[];

  uniqueTitles: number;
  repeatedExactTitles: number;
  uniqueProfiles: number;
  repeatedProfileWithin2Days: number;
  uniqueCategories: number;
  categoryDistribution: Record<string, number>;
  maxSameCategoryInSingleDay: number;
  uniqueNeighborhoods: number;
  neighborhoodDistribution: Record<string, number>;
  missingNeighborhoodEvents: number;
  day1AnchorPreserved: boolean;
  day7FinalStressPresent: boolean;

  dayRoles: Record<number, PilotDayRole>;
  day3HasOperationalPressure: boolean;
  day4HasSocialPressure: boolean;
  day5HasOpportunity: boolean;
  day6HasButterflySeed: boolean;

  prioritySelectedDays: number;
  priorityFulfilled: number;
  priorityPartial: number;
  priorityFailed: number;
  averagePriorityScore: number;
  wrongPriorityPenaltyObserved: boolean;

  goalsGenerated: number;
  primaryGoalsCompleted: number;
  failedGoals: number;
  atRiskGoals: number;
  goalDuplicateDays: number;

  missingDecisionResultCount: number;
  dailyPriorityImpactCount: number;
  dailyGoalImpactCount: number;
  butterflyHintCount: number;
  resultToneDistribution: Record<string, number>;

  hooksCreated: number;
  followUpEventsCreated: number;
  duplicateHooks: number;
  maxActiveHooks: number;
  day1HooksCreated: number;

  carryOverSignalsCreated: number;
  carryOverBiasApplications: number;
  carryOverClampViolations: number;
  duplicateWithButterflyHooks: number;
  butterflyOverlapSignals: number;
  suppressedCarryOverBias: number;
  biasAppliedWithDueHook: number;

  liveFlowEntriesCreated: number;
  /** Hub visible feed duplicate (WARN eşiği). */
  liveFlowDuplicateEntries: number;
  /** Ham feed semantic duplicate (bilgi; WARN tetiklemez). */
  rawLiveFlowDuplicateEntries: number;
  resolvedEventsVisibleSameDay: number;
  resolvedEventsArchivedNextDay: boolean;
  solvedEventStillDecidable: number;

  personnelIncidents: number;
  maxPersonnelFatigue: number;
  minPersonnelMorale: number;
  vehicleCriticalCount: number;
  vehicleBrokenCount: number;
  containerCriticalNeighborhoodDays: number;
  containerHighNeighborhoodDays: number;
  containerElevatedNeighborhoodDays: number;
  containerCriticalByReason: Record<string, number>;
  containerCriticalByNeighborhood: Record<string, number>;
  containerCriticalByDay: Record<number, number>;
  socialCriticalNeighborhoodDays: number;
  operationRiskMax: number;
  publicSatisfactionMin: number;
  budgetMin: number;

  reportsWithDailyPriority: number;
  reportsWithDailyGoals: number;
  reportsWithButterfly: number;
  reportsWithCarryOver: number;
  reportSnapshotMissingCount: number;

  socialRouteValid: boolean;
  decisionResultRouteValid: boolean;
  reportRouteValid: boolean;
  hubRouteValid: boolean;
  mainOperationPreviewRouteValid: boolean;

  pilotCompletionShown: boolean;
  pilotCompletionGrade: string | null;
  managementStyle: string | null;
};

export type FullLoopAnalysisResult = {
  scenarios: FullLoopMetrics[];
  scenarioStatuses: Record<FullLoopScenarioId, FullLoopVerdict>;
  totalPASS: number;
  totalWARN: number;
  totalFAIL: number;
  topWarnings: string[];
  recommendedSmallFixes: string[];
  saveVersionOk: boolean;
};
