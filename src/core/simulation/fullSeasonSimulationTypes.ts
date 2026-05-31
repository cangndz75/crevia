export type FullSeasonSimulationLength = 14 | 21;

export type FullSeasonPlayerProfile =
  | 'strong_player'
  | 'weak_player'
  | 'balanced_player'
  | 'random_player'
  | 'crisis_heavy_player'
  | 'low_resource_player'
  | 'limited_player';

export type FullSeasonSimulationMode = 'limited' | 'full';

export type FullSeasonSimulationDayResult = {
  day: number;
  mode: FullSeasonSimulationMode;
  playerProfile: FullSeasonPlayerProfile;
  eventCount: number;
  resolvedEventCount: number;
  microDecisionCount: number;
  resolvedMicroDecisionCount: number;
  crisisIncidentActive: boolean;
  crisisIncidentTriggered: boolean;
  crisisActionSelected: boolean;
  operationSignalsOverall: number;
  resourcePressureAverage: number;
  highestResourcePressure: number;
  seasonGoalAverageProgress: number;
  reportLineCount: number;
  advisorLineCount: number;
  duplicateEventCount: number;
  warnings: string[];
};

export type FullSeasonSimulationAggregateMetrics = {
  playerProfile: FullSeasonPlayerProfile;
  mode: FullSeasonSimulationMode;
  daysSimulated: number;
  averageOverallSignal: number;
  finalOverallSignal: number;
  averageResourcePressure: number;
  finalResourcePressure: number;
  criticalResourceDays: number;
  crisisIncidentCount: number;
  crisisActionCount: number;
  microDecisionTotal: number;
  averageMicroDecisionsPerDay: number;
  seasonGoalAverageProgress: number;
  finalSeasonGoalAverageProgress: number;
  duplicateEventTotal: number;
  reportDensityAverage: number;
  advisorDensityAverage: number;
  limitedVsFullValueScore?: number;
  warnings: string[];
};

export type FullSeasonSimulationRun = {
  id: string;
  length: FullSeasonSimulationLength;
  mode: FullSeasonSimulationMode;
  playerProfile: FullSeasonPlayerProfile;
  dayResults: FullSeasonSimulationDayResult[];
  aggregate: FullSeasonSimulationAggregateMetrics;
};

export type CrisisFrequencyStatus = 'too_low' | 'healthy' | 'too_high';
export type ResourcePressureStatus = 'too_low' | 'healthy' | 'too_high';
export type MicroDecisionFrequencyStatus = 'too_low' | 'healthy' | 'too_high';
export type SeasonGoalProgressStatus = 'too_slow' | 'healthy' | 'too_fast';

export type FullSeasonSimulationComparison = {
  strongVsWeakSignalGap: number;
  strongVsWeakGoalGap: number;
  limitedVsFullEventGap: number;
  limitedVsFullFeatureGap: number;
  crisisFrequencyStatus: CrisisFrequencyStatus;
  resourcePressureStatus: ResourcePressureStatus;
  microDecisionFrequencyStatus: MicroDecisionFrequencyStatus;
  seasonGoalProgressStatus: SeasonGoalProgressStatus;
  warnings: string[];
};

export type FullSeasonSimulationFindingSeverity = 'pass' | 'warn' | 'fail';

export type FullSeasonSimulationFinding = {
  id: string;
  severity: FullSeasonSimulationFindingSeverity;
  message: string;
  recommendation: string;
};

export type FullSeasonSimulationAuditHealth = 'PASS' | 'WARN' | 'FAIL';

export type FullSeasonSimulationAuditResult = {
  health: FullSeasonSimulationAuditHealth;
  runs: FullSeasonSimulationRun[];
  comparison: FullSeasonSimulationComparison;
  checkedCount: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  findings: FullSeasonSimulationFinding[];
};

export type RunFullSeasonSimulationParams = {
  profile: FullSeasonPlayerProfile;
  mode: FullSeasonSimulationMode;
  length?: FullSeasonSimulationLength;
  seed?: number;
};
