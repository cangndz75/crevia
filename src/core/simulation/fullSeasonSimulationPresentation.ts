import type {
  FullSeasonSimulationAuditResult,
  FullSeasonSimulationFinding,
  FullSeasonSimulationRun,
} from './fullSeasonSimulationTypes';

export function getSimulationHealth(
  result: FullSeasonSimulationAuditResult,
): 'PASS' | 'WARN' | 'FAIL' {
  return result.health;
}

export function formatSimulationFinding(finding: FullSeasonSimulationFinding): string {
  const tag = finding.severity.toUpperCase();
  return `[${tag}] ${finding.id}: ${finding.message} → ${finding.recommendation}`;
}

export function buildStrongIncidentDebugSummary(run: FullSeasonSimulationRun): string {
  const incidentDays = run.dayResults.filter((d) => d.crisisIncidentTriggered);
  if (incidentDays.length === 0) {
    return '  strong incident debug: none';
  }
  const parts = incidentDays.map(
    (d) =>
      `day${d.day}(events=${d.eventCount},signal=${d.operationSignalsOverall.toFixed(0)},pressure=${d.highestResourcePressure.toFixed(0)})`,
  );
  return `  strong incident debug: ${parts.join(', ')}`;
}

export function buildRunSummaryTable(run: FullSeasonSimulationRun): string {
  const lines = [
    `Run ${run.id}`,
    `  profile=${run.playerProfile} mode=${run.mode} days=${run.length}`,
    `  avgSignal=${run.aggregate.averageOverallSignal.toFixed(1)} finalSignal=${run.aggregate.finalOverallSignal.toFixed(1)}`,
    `  resourcePressure avg=${run.aggregate.averageResourcePressure.toFixed(1)} criticalDays=${run.aggregate.criticalResourceDays}`,
    `  crisis incidents=${run.aggregate.crisisIncidentCount} actions=${run.aggregate.crisisActionCount}`,
    `  microDecisions=${run.aggregate.microDecisionTotal} (avg/day ${run.aggregate.averageMicroDecisionsPerDay.toFixed(2)})`,
    `  seasonGoals avg=${run.aggregate.seasonGoalAverageProgress.toFixed(1)} final=${run.aggregate.finalSeasonGoalAverageProgress.toFixed(1)}`,
    `  reportDensity=${run.aggregate.reportDensityAverage.toFixed(1)} advisorDensity=${run.aggregate.advisorDensityAverage.toFixed(1)}`,
    `  duplicateEvents=${run.aggregate.duplicateEventTotal}`,
  ];
  if (run.aggregate.warnings.length > 0) {
    lines.push(`  warnings: ${run.aggregate.warnings.slice(0, 3).join('; ')}`);
  }
  return lines.join('\n');
}

export function buildComparisonSummary(
  comparison: FullSeasonSimulationAuditResult['comparison'],
): string[] {
  return [
    `Strong vs weak signal gap: ${comparison.strongVsWeakSignalGap.toFixed(1)}`,
    `Strong vs weak season goal gap: ${comparison.strongVsWeakGoalGap.toFixed(1)}`,
    `Limited vs full event gap: ${comparison.limitedVsFullEventGap}`,
    `Limited vs full feature gap: ${comparison.limitedVsFullFeatureGap}`,
    `Crisis frequency: ${comparison.crisisFrequencyStatus}`,
    `Resource pressure: ${comparison.resourcePressureStatus}`,
    `Micro decisions: ${comparison.microDecisionFrequencyStatus}`,
    `Season goals: ${comparison.seasonGoalProgressStatus}`,
  ];
}

export function buildFullSeasonSimulationConsoleReport(
  result: FullSeasonSimulationAuditResult,
): string {
  const lines: string[] = [
    '=== Full Season Balance Simulation ===',
    `Health: ${result.health}`,
    `Checks: pass=${result.passCount} warn=${result.warnCount} fail=${result.failCount}`,
    '',
    '--- Profile summaries ---',
  ];

  for (const run of result.runs) {
    lines.push(buildRunSummaryTable(run));
    if (run.playerProfile === 'strong_player' && run.mode === 'full') {
      lines.push(buildStrongIncidentDebugSummary(run));
    }
    lines.push('');
  }

  lines.push('--- Comparison ---');
  lines.push(...buildComparisonSummary(result.comparison));

  if (result.comparison.warnings.length > 0) {
    lines.push('', '--- Comparison warnings ---');
    for (const w of result.comparison.warnings) {
      lines.push(`  • ${w}`);
    }
  }

  lines.push('', '--- Findings ---');
  for (const f of result.findings) {
    lines.push(formatSimulationFinding(f));
  }

  const tuning = result.findings.filter(
    (f) => f.severity !== 'pass' && !f.id.includes('analytics'),
  );
  if (tuning.length > 0) {
    lines.push('', '--- Recommended next tuning patch ---');
    for (const f of tuning.slice(0, 5)) {
      lines.push(`  • ${f.recommendation}`);
    }
  }

  return lines.join('\n');
}
