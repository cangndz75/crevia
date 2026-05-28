/**
 * Live Flow — 7 günlük senaryo analizi.
 * Çalıştır: npm run analyze:live-flow
 */

import { FULL_LOOP_SCENARIOS, runFullLoopScenario } from '@/core/fullLoop/runFullLoopSimulation';

const SCENARIO_IDS = [
  'balanced_player',
  'public_relief_player',
  'risky_fast_player',
  'passive_player',
] as const;

let failCount = 0;

// eslint-disable-next-line no-console
console.log('=== Live Flow — 7 Day Analysis ===\n');

for (const id of SCENARIO_IDS) {
  const config = FULL_LOOP_SCENARIOS.find((s) => s.id === id)!;
  const m = runFullLoopScenario(config);

  // eslint-disable-next-line no-console
  console.log(`--- ${id} ---`);
  // eslint-disable-next-line no-console
  console.log(
    `flowEntries=${m.liveFlowEntriesCreated} resolvedSameDay=${m.resolvedEventsVisibleSameDay} solvedDecidable=${m.solvedEventStillDecidable} visibleDup=${m.liveFlowDuplicateEntries} rawDup=${m.rawLiveFlowDuplicateEntries} archivedNext=${m.resolvedEventsArchivedNextDay}`,
  );

  if (m.solvedEventStillDecidable > 0) {
    failCount += 1;
    // eslint-disable-next-line no-console
    console.log('FAIL: solvedStillDecidable');
  }
  if (m.decisionsApplied > 0 && m.resolvedEventsVisibleSameDay === 0) {
    failCount += 1;
    // eslint-disable-next-line no-console
    console.log('FAIL: resolvedEventsVisibleSameDay');
  }
  if (!m.resolvedEventsArchivedNextDay && m.decisionsApplied > 0) {
    failCount += 1;
    // eslint-disable-next-line no-console
    console.log('FAIL: archived next day');
  }
  // eslint-disable-next-line no-console
  console.log('');
}

if (failCount > 0) {
  // eslint-disable-next-line no-console
  console.error(`Analysis finished with ${failCount} FAIL condition(s).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('Analysis PASS.');
