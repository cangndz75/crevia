import type { FullLoopMetrics, FullLoopVerdict } from '@/core/fullLoop/fullLoopTypes';

export function evaluateScenarioVerdict(metrics: FullLoopMetrics): FullLoopVerdict {
  const fails: string[] = [...metrics.fails];
  const warnings: string[] = [...metrics.warnings];

  if (metrics.crashes > 0) fails.push(`crashes=${metrics.crashes}`);
  if (!metrics.day1AnchorPreserved) fails.push('day1AnchorPreserved=false');
  if (metrics.reportsCreated < 7) fails.push(`reportsCreated=${metrics.reportsCreated}`);
  if (metrics.decisionsApplied > 0 && metrics.missingDecisionResultCount > 0) {
    fails.push(`missingDecisionResult=${metrics.missingDecisionResultCount}`);
  }
  if (metrics.repeatedExactTitles > 0) fails.push(`repeatedExactTitles=${metrics.repeatedExactTitles}`);
  if (metrics.maxSameCategoryInSingleDay > 2) {
    fails.push(`maxSameCategoryInSingleDay=${metrics.maxSameCategoryInSingleDay}`);
  }
  if (metrics.duplicateHooks > 0) fails.push(`duplicateHooks=${metrics.duplicateHooks}`);
  if (metrics.day1HooksCreated > 0) fails.push(`day1HooksCreated=${metrics.day1HooksCreated}`);
  if (metrics.carryOverClampViolations > 0) {
    fails.push(`carryOverClampViolations=${metrics.carryOverClampViolations}`);
  }
  if (metrics.duplicateWithButterflyHooks > 2) {
    fails.push(`duplicateWithButterfly=${metrics.duplicateWithButterflyHooks}`);
  } else if (metrics.duplicateWithButterflyHooks > 0) {
    warnings.push(`duplicateWithButterfly=${metrics.duplicateWithButterflyHooks}`);
  }
  if (!metrics.socialRouteValid) fails.push('socialRouteInvalid');
  if (!metrics.mainOperationPreviewRouteValid) {
    fails.push('mainOperationPreviewRouteInvalid');
  }
  if (metrics.eventsGenerated === 0) fails.push('eventsGenerated=0');
  if (
    metrics.daysCompleted >= 7 &&
    !metrics.pilotCompletionShown &&
    metrics.scenario === 'balanced_player'
  ) {
    warnings.push('pilotCompletionSummaryMissing');
  }

  if (metrics.uniqueNeighborhoods < 3) {
    warnings.push(`uniqueNeighborhoods=${metrics.uniqueNeighborhoods}`);
  }
  if (metrics.repeatedProfileWithin2Days > 0) {
    warnings.push(`repeatedProfileWithin2Days=${metrics.repeatedProfileWithin2Days}`);
  }
  if (!metrics.day3HasOperationalPressure) warnings.push('day3NoOperationalPressure');
  if (!metrics.day4HasSocialPressure) warnings.push('day4NoSocialPressure');
  if (!metrics.day5HasOpportunity) warnings.push('day5NoOpportunity');
  if (!metrics.day7FinalStressPresent) warnings.push('day7NoFinalStress');
  if (metrics.prioritySelectedDays < 6) {
    warnings.push(`prioritySelectedDays=${metrics.prioritySelectedDays}`);
  }
  if (metrics.averagePriorityScore < 35) {
    warnings.push(`avgPriorityScoreLow=${metrics.averagePriorityScore}`);
  }
  if (metrics.averagePriorityScore > 95) {
    warnings.push(`avgPriorityScoreHigh=${metrics.averagePriorityScore}`);
  }
  if (metrics.maxPersonnelFatigue >= 90) {
    warnings.push(`maxPersonnelFatigue=${metrics.maxPersonnelFatigue}`);
  }
  if (metrics.vehicleCriticalCount >= 4) {
    warnings.push(`vehicleCriticalCount=${metrics.vehicleCriticalCount}`);
  }
  if (metrics.containerCriticalNeighborhoodDays >= 6) {
    warnings.push(`containerCriticalDays=${metrics.containerCriticalNeighborhoodDays}`);
  }
  if (
    metrics.containerCriticalNeighborhoodDays >= 7 &&
    metrics.scenario !== 'risky_fast_player' &&
    metrics.scenario !== 'passive_player'
  ) {
    warnings.push('containerCriticalEveryDay');
  }
  if (metrics.socialCriticalNeighborhoodDays >= 5) {
    warnings.push(`socialCriticalDays=${metrics.socialCriticalNeighborhoodDays}`);
  }
  if (metrics.reportsWithButterfly === 0) warnings.push('noButterflyInReports');
  if (metrics.carryOverSignalsCreated === 0) warnings.push('noCarryOverSignals');

  if (metrics.solvedEventStillDecidable > 0) {
    fails.push(`solvedEventStillDecidable=${metrics.solvedEventStillDecidable}`);
  }
  if (!metrics.resolvedEventsArchivedNextDay && metrics.decisionsApplied > 0) {
    fails.push('resolvedEventsArchivedNextDay=false');
  }
  if (metrics.liveFlowEntriesCreated === 0 && metrics.decisionsApplied > 0) {
    warnings.push('liveFlowEntriesCreated=0');
  }
  if (metrics.liveFlowDuplicateEntries > 0) {
    warnings.push(`visibleLiveFlowDuplicateEntries=${metrics.liveFlowDuplicateEntries}`);
  }

  const toneTotal = Object.values(metrics.resultToneDistribution).reduce(
    (a, b) => a + b,
    0,
  );
  if (toneTotal >= 3) {
    const maxToneShare = Math.max(
      ...Object.values(metrics.resultToneDistribution),
    ) / toneTotal;
    const toneKindCount = Object.keys(metrics.resultToneDistribution).length;
    const monotoneThreshold =
      metrics.scenario === 'passive_player' ? 0.92 : 0.85;
    if (toneKindCount <= 1) {
      warnings.push('resultToneMonotone:singleTone');
    } else if (maxToneShare >= monotoneThreshold) {
      warnings.push(
        `resultToneMonotone:${Math.round(maxToneShare * 100)}%`,
      );
    }
  }

  const topCategory = Object.entries(metrics.categoryDistribution).sort(
    (a, b) => b[1] - a[1],
  )[0];
  if (topCategory && metrics.eventsGenerated > 0) {
    const ratio = topCategory[1] / metrics.eventsGenerated;
    if (ratio > 0.45) {
      warnings.push(`categorySkew=${topCategory[0]}:${Math.round(ratio * 100)}%`);
    }
  }

  metrics.fails = fails;
  metrics.warnings = warnings;
  metrics.notes = [...fails, ...warnings];

  if (fails.length > 0) return 'FAIL';
  if (warnings.length > 0) return 'WARN';
  return 'PASS';
}

export function collectRecommendedFixes(
  scenarios: FullLoopMetrics[],
): string[] {
  const fixes = new Set<string>();
  for (const m of scenarios) {
    if (m.repeatedExactTitles > 0) {
      fixes.add('Event title repeat guard — generateDailyEventSet veya content memory kontrolü');
    }
    if (m.duplicateHooks > 0) {
      fixes.add('Butterfly hook dedupe — tryRegisterButterflyHookAfterDecision');
    }
    if (m.carryOverClampViolations > 0) {
      fixes.add('Carry-over bias clamp — getCarryOverWeightDeltaForEvent');
    }
    if (m.missingDecisionResultCount > 0) {
      fixes.add('Decision result snapshot — buildDecisionResultSnapshot çağrı zinciri');
    }
    if (!m.socialRouteValid) {
      fixes.add('Social route — src/app/social/index.tsx veya verify path');
    }
    if (m.uniqueNeighborhoods < 3) {
      fixes.add('Mahalle rotasyonu — pilot rhythm district veya neighborhood resolver');
    }
  }
  return [...fixes];
}
