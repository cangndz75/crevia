import {
  ADVISOR_DENSITY_WARN_PER_DAY,
  CATEGORY_SPAM_CONSECUTIVE_DAYS,
  FULL_MODE_CRISIS_ACTION_FAIL,
  LIMITED_VS_FULL_VALUE_SCORE_MIN,
  REPORT_DENSITY_MAX,
  REPORT_DENSITY_MIN,
  REPORT_DENSITY_WARN_HIGH,
  SEASON_GOAL_EARLY_COMPLETE_DAY,
  SEASON_GOAL_PROGRESS_FAIL_LOW,
  SIGNAL_HEALTHY_RANGES,
  STRONG_VS_WEAK_GOAL_GAP_MIN,
  STRONG_VS_WEAK_SIGNAL_GAP_MIN,
  classifyCriticalResourceDays,
  classifyCrisisIncidentCount,
  classifyMicroDecisionTotal,
  classifySeasonGoalProgress,
} from './fullSeasonSimulationConstants';
import type {
  FullSeasonSimulationAggregateMetrics,
  FullSeasonSimulationComparison,
  FullSeasonSimulationDayResult,
  FullSeasonSimulationFinding,
  FullSeasonSimulationRun,
} from './fullSeasonSimulationTypes';

export function calculateAverageOverallSignal(
  dayResults: FullSeasonSimulationDayResult[],
): number {
  if (dayResults.length === 0) return 0;
  const sum = dayResults.reduce((s, d) => s + d.operationSignalsOverall, 0);
  return sum / dayResults.length;
}

export function calculateResourcePressureMetrics(dayResults: FullSeasonSimulationDayResult[]): {
  average: number;
  final: number;
  criticalDays: number;
} {
  if (dayResults.length === 0) {
    return { average: 0, final: 0, criticalDays: 0 };
  }
  const pressures = dayResults.map((d) => d.resourcePressureAverage);
  const criticalDays = dayResults.filter((d) => d.highestResourcePressure >= 75).length;
  return {
    average: pressures.reduce((a, b) => a + b, 0) / pressures.length,
    final: dayResults[dayResults.length - 1]!.resourcePressureAverage,
    criticalDays,
  };
}

export function calculateCrisisMetrics(dayResults: FullSeasonSimulationDayResult[]): {
  incidentCount: number;
  actionCount: number;
} {
  return {
    incidentCount: dayResults.filter(
      (d) => d.crisisIncidentTriggered || d.crisisIncidentActive,
    ).length,
    actionCount: dayResults.filter((d) => d.crisisActionSelected).length,
  };
}

export function calculateMicroDecisionMetrics(dayResults: FullSeasonSimulationDayResult[]): {
  total: number;
  averagePerDay: number;
} {
  const total = dayResults.reduce((s, d) => s + d.microDecisionCount, 0);
  return {
    total,
    averagePerDay: dayResults.length > 0 ? total / dayResults.length : 0,
  };
}

export function calculateSeasonGoalMetrics(dayResults: FullSeasonSimulationDayResult[]): {
  average: number;
  final: number;
  tooEarlyComplete: boolean;
} {
  if (dayResults.length === 0) {
    return { average: 0, final: 0, tooEarlyComplete: false };
  }
  const progresses = dayResults.map((d) => d.seasonGoalAverageProgress);
  const tooEarlyComplete = dayResults.some(
    (d) =>
      d.day < SEASON_GOAL_EARLY_COMPLETE_DAY && d.seasonGoalAverageProgress >= 100,
  );
  return {
    average: progresses.reduce((a, b) => a + b, 0) / progresses.length,
    final: progresses[progresses.length - 1]!,
    tooEarlyComplete,
  };
}

export function calculateReportDensityMetrics(dayResults: FullSeasonSimulationDayResult[]): {
  average: number;
} {
  if (dayResults.length === 0) return { average: 0 };
  return {
    average:
      dayResults.reduce((s, d) => s + d.reportLineCount, 0) / dayResults.length,
  };
}

export function calculateAdvisorDensityMetrics(dayResults: FullSeasonSimulationDayResult[]): {
  average: number;
} {
  if (dayResults.length === 0) return { average: 0 };
  return {
    average:
      dayResults.reduce((s, d) => s + d.advisorLineCount, 0) / dayResults.length,
  };
}

export function calculateDuplicateEventMetrics(dayResults: FullSeasonSimulationDayResult[]): {
  total: number;
} {
  return {
    total: dayResults.reduce((s, d) => s + d.duplicateEventCount, 0),
  };
}

function averageEventsPerDay(dayResults: FullSeasonSimulationDayResult[]): number {
  if (dayResults.length === 0) return 0;
  return (
    dayResults.reduce((s, d) => s + d.eventCount, 0) / dayResults.length
  );
}

function uniqueEventCategories(dayResults: FullSeasonSimulationDayResult[]): number {
  return dayResults.reduce((max, d) => Math.max(max, d.eventCount), 0);
}

export function calculateLimitedVsFullValueScore(
  limitedRun: FullSeasonSimulationRun,
  fullRun: FullSeasonSimulationRun,
): number {
  let score = 0;
  const limitedEvents = averageEventsPerDay(limitedRun.dayResults);
  const fullEvents = averageEventsPerDay(fullRun.dayResults);
  if (fullEvents > limitedEvents + 0.2) score += 1;
  if (uniqueEventCategories(fullRun.dayResults) > uniqueEventCategories(limitedRun.dayResults)) {
    score += 1;
  }

  if (fullRun.aggregate.crisisActionCount > limitedRun.aggregate.crisisActionCount) {
    score += 1;
  }
  if (fullRun.aggregate.crisisIncidentCount > limitedRun.aggregate.crisisIncidentCount) {
    score += 1;
  }
  if (
    fullRun.aggregate.finalSeasonGoalAverageProgress >
    limitedRun.aggregate.finalSeasonGoalAverageProgress + 5
  ) {
    score += 1;
  }
  if (fullRun.aggregate.microDecisionTotal > limitedRun.aggregate.microDecisionTotal) {
    score += 1;
  }
  return score;
}

export function collectAggregateMetrics(
  profile: FullSeasonSimulationRun['playerProfile'],
  mode: FullSeasonSimulationRun['mode'],
  dayResults: FullSeasonSimulationDayResult[],
): FullSeasonSimulationAggregateMetrics {
  const resource = calculateResourcePressureMetrics(dayResults);
  const crisis = calculateCrisisMetrics(dayResults);
  const micro = calculateMicroDecisionMetrics(dayResults);
  const goals = calculateSeasonGoalMetrics(dayResults);
  const report = calculateReportDensityMetrics(dayResults);
  const advisor = calculateAdvisorDensityMetrics(dayResults);
  const dupes = calculateDuplicateEventMetrics(dayResults);

  const warnings: string[] = [];
  if (goals.tooEarlyComplete) {
    warnings.push('Season goals reached 100% before day 10');
  }
  if (resource.criticalDays > 4) {
    warnings.push(`Critical resource pressure on ${resource.criticalDays} days`);
  }

  return {
    playerProfile: profile,
    mode,
    daysSimulated: dayResults.length,
    averageOverallSignal: calculateAverageOverallSignal(dayResults),
    finalOverallSignal:
      dayResults[dayResults.length - 1]?.operationSignalsOverall ?? 0,
    averageResourcePressure: resource.average,
    finalResourcePressure: resource.final,
    criticalResourceDays: resource.criticalDays,
    crisisIncidentCount: crisis.incidentCount,
    crisisActionCount: crisis.actionCount,
    microDecisionTotal: micro.total,
    averageMicroDecisionsPerDay: micro.averagePerDay,
    seasonGoalAverageProgress: goals.average,
    finalSeasonGoalAverageProgress: goals.final,
    duplicateEventTotal: dupes.total,
    reportDensityAverage: report.average,
    advisorDensityAverage: advisor.average,
    warnings,
  };
}

export function compareSimulationRuns(runs: FullSeasonSimulationRun[]): FullSeasonSimulationComparison {
  const strong = runs.find((r) => r.playerProfile === 'strong_player' && r.mode === 'full');
  const weak = runs.find((r) => r.playerProfile === 'weak_player' && r.mode === 'full');
  const limited = runs.find((r) => r.mode === 'limited');
  const fullBalanced = runs.find(
    (r) => r.playerProfile === 'balanced_player' && r.mode === 'full',
  );

  const strongVsWeakSignalGap =
    (weak?.aggregate.averageOverallSignal ?? 0) -
    (strong?.aggregate.averageOverallSignal ?? 0);
  const strongVsWeakGoalGap =
    (strong?.aggregate.finalSeasonGoalAverageProgress ?? 0) -
    (weak?.aggregate.finalSeasonGoalAverageProgress ?? 0);

  const limitedEvents = limited
    ? averageEventsPerDay(limited.dayResults) * limited.dayResults.length
    : 0;
  const fullEvents = fullBalanced
    ? averageEventsPerDay(fullBalanced.dayResults) * fullBalanced.dayResults.length
    : 0;
  const limitedAvgEvents = limited ? averageEventsPerDay(limited.dayResults) : 0;
  const fullAvgEvents = fullBalanced ? averageEventsPerDay(fullBalanced.dayResults) : 0;

  let limitedVsFullFeatureGap = 0;
  if ((fullBalanced?.aggregate.crisisActionCount ?? 0) > (limited?.aggregate.crisisActionCount ?? 0)) {
    limitedVsFullFeatureGap += 1;
  }
  if ((fullBalanced?.aggregate.microDecisionTotal ?? 0) > (limited?.aggregate.microDecisionTotal ?? 0)) {
    limitedVsFullFeatureGap += 1;
  }
  if (
    (fullBalanced?.aggregate.seasonGoalAverageProgress ?? 0) >
    (limited?.aggregate.seasonGoalAverageProgress ?? 0)
  ) {
    limitedVsFullFeatureGap += 1;
  }

  const referenceFull = strong ?? fullBalanced;
  const crisisFrequencyStatus = classifyCrisisIncidentCount(
    referenceFull?.aggregate.crisisIncidentCount ?? 0,
    'full',
  );
  const resourcePressureStatus = classifyCriticalResourceDays(
    referenceFull?.aggregate.criticalResourceDays ?? 0,
  );
  const microDecisionFrequencyStatus = classifyMicroDecisionTotal(
    referenceFull?.aggregate.microDecisionTotal ?? 0,
    'full',
  );
  const seasonGoalProgressStatus = classifySeasonGoalProgress(
    referenceFull?.aggregate.finalSeasonGoalAverageProgress ?? 0,
    referenceFull?.dayResults[referenceFull.dayResults.length - 1]?.day ?? 21,
  );

  const warnings: string[] = [];
  if (strongVsWeakSignalGap < STRONG_VS_WEAK_SIGNAL_GAP_MIN) {
    warnings.push('Strong vs weak signal gap should be monitored in real playtest');
  }
  if (strongVsWeakGoalGap < STRONG_VS_WEAK_GOAL_GAP_MIN) {
    warnings.push('Season goal pacing between profiles needs tuning');
  }

  let limitedVsFullValueScore: number | undefined;
  if (limited && fullBalanced) {
    limitedVsFullValueScore = calculateLimitedVsFullValueScore(limited, fullBalanced);
    if (limitedVsFullValueScore < LIMITED_VS_FULL_VALUE_SCORE_MIN) {
      warnings.push('Full and limited runs look too similar on feature surface');
    }
  }

  return {
    strongVsWeakSignalGap,
    strongVsWeakGoalGap,
    limitedVsFullEventGap: Math.round((fullAvgEvents - limitedAvgEvents) * 10) / 10,
    limitedVsFullFeatureGap,
    crisisFrequencyStatus,
    resourcePressureStatus,
    microDecisionFrequencyStatus,
    seasonGoalProgressStatus,
    warnings,
  };
}

export function detectCategorySpamWarnings(
  dayResults: FullSeasonSimulationDayResult[],
  categoriesByDay: string[][],
): string[] {
  const warnings: string[] = [];
  for (let i = 0; i < categoriesByDay.length; i += 1) {
    const cat = categoriesByDay[i]?.[0];
    if (!cat) continue;
    let streak = 1;
    for (let j = i + 1; j < categoriesByDay.length; j += 1) {
      if (categoriesByDay[j]?.[0] === cat) streak += 1;
      else break;
    }
    if (streak >= CATEGORY_SPAM_CONSECUTIVE_DAYS) {
      warnings.push(
        `Category "${cat}" appeared ${streak}+ consecutive days starting day ${dayResults[i]?.day}`,
      );
      break;
    }
  }
  return warnings;
}

export function buildSimulationFindings(
  runs: FullSeasonSimulationRun[],
  comparison: FullSeasonSimulationComparison,
): FullSeasonSimulationFinding[] {
  const findings: FullSeasonSimulationFinding[] = [];

  const strong = runs.find((r) => r.playerProfile === 'strong_player' && r.mode === 'full');
  const weak = runs.find((r) => r.playerProfile === 'weak_player' && r.mode === 'full');

  if (strong && weak) {
    const gap = comparison.strongVsWeakSignalGap;
    findings.push({
      id: 'strong_vs_weak_signal',
      severity: gap >= STRONG_VS_WEAK_SIGNAL_GAP_MIN ? 'pass' : 'warn',
      message: `Strong avg signal ${strong.aggregate.averageOverallSignal.toFixed(1)} vs weak ${weak.aggregate.averageOverallSignal.toFixed(1)} (gap ${gap.toFixed(1)})`,
      recommendation:
        gap < STRONG_VS_WEAK_SIGNAL_GAP_MIN
          ? 'Tune daily plan / assignment trade-offs so skilled play separates more clearly'
          : 'Maintain current skill expression; validate with human playtest',
    });
  }

  findings.push({
    id: 'crisis_frequency',
    severity:
      comparison.crisisFrequencyStatus === 'healthy' ? 'pass' : 'warn',
    message: `Crisis incident frequency: ${comparison.crisisFrequencyStatus}`,
    recommendation:
      comparison.crisisFrequencyStatus === 'healthy'
        ? 'Crisis pacing within simulation targets'
        : 'Adjust crisis incident thresholds or preventive triggers',
  });

  findings.push({
    id: 'resource_pressure',
    severity:
      comparison.resourcePressureStatus === 'healthy' ? 'pass' : 'warn',
    message: `Resource pressure status: ${comparison.resourcePressureStatus}`,
    recommendation: 'Review operational resource nudges if critical days cluster',
  });

  findings.push({
    id: 'micro_decisions',
    severity:
      comparison.microDecisionFrequencyStatus === 'healthy'
        ? 'pass'
        : comparison.microDecisionFrequencyStatus === 'too_high'
          ? 'warn'
          : 'warn',
    message: `Micro decision frequency: ${comparison.microDecisionFrequencyStatus}`,
    recommendation: 'Tune micro decision generation thresholds if too sparse or dense',
  });

  findings.push({
    id: 'season_goals',
    severity:
      comparison.seasonGoalProgressStatus === 'healthy'
        ? 'pass'
        : 'warn',
    message: `Season goal progress: ${comparison.seasonGoalProgressStatus}`,
    recommendation: 'Adjust season goal daily progress cap if pacing feels off',
  });

  const fullRef = strong ?? runs.find((r) => r.mode === 'full');
  if (fullRef && fullRef.aggregate.duplicateEventTotal > 0) {
    findings.push({
      id: 'duplicate_events',
      severity: 'fail',
      message: `Duplicate event ids detected: ${fullRef.aggregate.duplicateEventTotal}`,
      recommendation: 'Fix event generation dedupe for same-day ids',
    });
  } else {
    findings.push({
      id: 'duplicate_events',
      severity: 'pass',
      message: 'No same-day duplicate event ids',
      recommendation: 'Keep dedupe guards in main operation event generation',
    });
  }

  if (fullRef && fullRef.aggregate.crisisActionCount > FULL_MODE_CRISIS_ACTION_FAIL) {
    findings.push({
      id: 'crisis_actions_volume',
      severity: 'warn',
      message: `Crisis actions ${fullRef.aggregate.crisisActionCount} over 14 days`,
      recommendation: 'Clamp crisis action generation frequency',
    });
  }

  const reportAvg = fullRef?.aggregate.reportDensityAverage ?? 0;
  findings.push({
    id: 'report_density',
    severity:
      reportAvg >= REPORT_DENSITY_MIN && reportAvg <= REPORT_DENSITY_MAX
        ? 'pass'
        : reportAvg > REPORT_DENSITY_WARN_HIGH
          ? 'warn'
          : 'warn',
    message: `Report density average ${reportAvg.toFixed(1)} lines/cards`,
    recommendation: 'Apply report density guard if end-of-day feels crowded',
  });

  const advisorAvg = fullRef?.aggregate.advisorDensityAverage ?? 0;
  findings.push({
    id: 'advisor_density',
    severity: advisorAvg <= ADVISOR_DENSITY_WARN_PER_DAY ? 'pass' : 'warn',
    message: `Advisor density average ${advisorAvg.toFixed(1)} per day`,
    recommendation: 'Reduce advisor note frequency if Ece feels chatty',
  });

  const fullBalancedRun = runs.find(
    (r) => r.playerProfile === 'balanced_player' && r.mode === 'full',
  );
  const fullThreeEventDays =
    fullBalancedRun?.dayResults.filter((d) => d.day >= 9 && d.eventCount >= 3).length ??
    0;
  findings.push({
    id: 'limited_vs_full',
    severity:
      comparison.limitedVsFullFeatureGap >= 2 &&
      (comparison.limitedVsFullEventGap > 0 || fullThreeEventDays > 0)
        ? 'pass'
        : 'warn',
    message: `Limited vs full feature gap ${comparison.limitedVsFullFeatureGap}, avg event gap ${comparison.limitedVsFullEventGap}, full 3-event days ${fullThreeEventDays}`,
    recommendation: 'Ensure full access unlocks crisis desk, wider events, and season goals',
  });

  findings.push({
    id: 'analytics_playtest',
    severity: 'warn',
    message: 'Analytics integration and real human playtest pending',
    recommendation: 'Run docs/crevia-player-flow-playtest-checklist.md after tuning',
  });

  return findings;
}

export function deriveAuditHealth(
  findings: FullSeasonSimulationFinding[],
): 'PASS' | 'WARN' | 'FAIL' {
  if (findings.some((f) => f.severity === 'fail')) return 'FAIL';
  if (findings.some((f) => f.severity === 'warn')) return 'WARN';
  return 'PASS';
}
