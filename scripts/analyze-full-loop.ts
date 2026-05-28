/**
 * 7 günlük pilot full-loop analizi — tüm alt sistemler birlikte.
 * Çalıştır: npm run analyze:full-loop
 */

import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';

function pad(value: string, width: number): string {
  return value.length >= width ? value.slice(0, width) : value.padEnd(width);
}

function printScenarioBlock(s: ReturnType<typeof runFullLoopAnalysis>['scenarios'][0]): void {
  // eslint-disable-next-line no-console
  console.log(`\nFULL LOOP ANALYSIS`);
  // eslint-disable-next-line no-console
  console.log(`Scenario: ${s.scenario}`);
  // eslint-disable-next-line no-console
  console.log(`Status: ${s.status}`);
  // eslint-disable-next-line no-console
  console.log(`Days: ${s.daysCompleted}/7`);
  // eslint-disable-next-line no-console
  console.log(`Events: ${s.eventsGenerated}`);
  // eslint-disable-next-line no-console
  console.log(`Decisions: ${s.decisionsApplied}`);
  // eslint-disable-next-line no-console
  console.log(`Decision results: ${s.decisionResultsCreated}`);
  // eslint-disable-next-line no-console
  console.log(`Reports: ${s.reportsCreated}`);
  // eslint-disable-next-line no-console
  console.log(`Unique neighborhoods: ${s.uniqueNeighborhoods}`);
  // eslint-disable-next-line no-console
  console.log(`Unique categories: ${s.uniqueCategories}`);
  // eslint-disable-next-line no-console
  console.log(`Repeated titles: ${s.repeatedExactTitles}`);
  // eslint-disable-next-line no-console
  console.log(
    `Priority: fulfilled ${s.priorityFulfilled} / partial ${s.priorityPartial} / failed ${s.priorityFailed} (avg ${s.averagePriorityScore})`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `Hooks: created ${s.hooksCreated} / follow-up ${s.followUpEventsCreated} / duplicate ${s.duplicateHooks}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `Carry-over: signals ${s.carryOverSignalsCreated} / clamp violations ${s.carryOverClampViolations}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `Subsystem: fatigueMax ${s.maxPersonnelFatigue}, vehicleCritical ${s.vehicleCriticalCount}, pubSatMin ${s.publicSatisfactionMin}`,
  );
  const toneParts = Object.entries(s.resultToneDistribution)
    .map(([tone, count]) => `${tone}=${count}`)
    .join(', ');
  if (toneParts) {
    // eslint-disable-next-line no-console
    console.log(`Result tones: ${toneParts}`);
  }
  // eslint-disable-next-line no-console
  console.log(
    `Containers: criticalDays=${s.containerCriticalNeighborhoodDays}, highDays=${s.containerHighNeighborhoodDays}, elevatedDays=${s.containerElevatedNeighborhoodDays}`,
  );
  const critReasons = Object.entries(s.containerCriticalByReason)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
  if (critReasons) {
    // eslint-disable-next-line no-console
    console.log(`Container critical reasons: ${critReasons}`);
  }
  if (s.warnings.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`Warnings: ${s.warnings.join('; ')}`);
  }
  if (s.fails.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`Fails: ${s.fails.join('; ')}`);
  }
  if (s.pilotCompletionGrade) {
    // eslint-disable-next-line no-console
    console.log(
      `Pilot completion: shown=${s.pilotCompletionShown} grade=${s.pilotCompletionGrade} style=${s.managementStyle ?? 'n/a'}`,
    );
  }
}

const result = runFullLoopAnalysis();

// eslint-disable-next-line no-console
console.log('\n══════════════════════════════════════════════════');
// eslint-disable-next-line no-console
console.log('CREVIA — FULL LOOP QA + BALANCE ANALYZER');
// eslint-disable-next-line no-console
console.log('══════════════════════════════════════════════════');
// eslint-disable-next-line no-console
console.log(`SAVE_VERSION ok: ${result.saveVersionOk ? 'yes (10)' : 'NO'}`);

// eslint-disable-next-line no-console
console.log('\n┌─────────────────────────┬────────┬───────┬─────────┬──────┬──────────┐');
// eslint-disable-next-line no-console
console.log('│ Scenario                │ Status │ Days  │ Events  │ Dec  │ Reports  │');
// eslint-disable-next-line no-console
console.log('├─────────────────────────┼────────┼───────┼─────────┼──────┼──────────┤');

for (const s of result.scenarios) {
  const row = [
    pad(s.scenario, 23),
    pad(s.status, 6),
    pad(String(s.daysCompleted), 5),
    pad(String(s.eventsGenerated), 7),
    pad(String(s.decisionsApplied), 4),
    pad(String(s.reportsCreated), 8),
  ].join(' │ ');
  // eslint-disable-next-line no-console
  console.log(`│ ${row} │`);
}

// eslint-disable-next-line no-console
console.log('└─────────────────────────┴────────┴───────┴─────────┴──────┴──────────┘');

for (const s of result.scenarios) {
  printScenarioBlock(s);
}

// eslint-disable-next-line no-console
console.log('\n── Final summary ──');
// eslint-disable-next-line no-console
console.log(`PASS: ${result.totalPASS}`);
// eslint-disable-next-line no-console
console.log(`WARN: ${result.totalWARN}`);
// eslint-disable-next-line no-console
console.log(`FAIL: ${result.totalFAIL}`);

if (result.topWarnings.length > 0) {
  // eslint-disable-next-line no-console
  console.log('\nTop warnings:');
  for (const w of result.topWarnings) {
    // eslint-disable-next-line no-console
    console.log(`  • ${w}`);
  }
}

if (result.recommendedSmallFixes.length > 0) {
  // eslint-disable-next-line no-console
  console.log('\nRecommended small fixes (manual review):');
  for (const fix of result.recommendedSmallFixes) {
    // eslint-disable-next-line no-console
    console.log(`  → ${fix}`);
  }
}

const exitCode = result.totalFAIL > 0 || !result.saveVersionOk ? 1 : 0;
if (exitCode !== 0) {
  // eslint-disable-next-line no-console
  console.error('\nFull loop analysis completed with FAILURES.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nFull loop analysis completed.');
