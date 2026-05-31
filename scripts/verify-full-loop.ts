/**
 * Full loop smoke doğrulaması — kritik invariant'lar.
 * Çalıştır: npm run verify:full-loop
 */

import { pilotEvents } from '@/core/content/pilotEvents';
import { createDay1Seed } from '@/core/content/day1Seed';
import { checkDecisionAffordability } from '@/core/economy/economyAffordability';
import {
  FINAL_LOW_COST_CLOSEOUT_DECISION_ID,
  ensureAtLeastOneAffordableDecision,
} from '@/core/game/decisionAffordabilityFallback';
import { PILOT_FINAL_EVENT_ID } from '@/core/game/calculatePilotFinalResult';
import {
  FULL_LOOP_SCENARIOS,
  runFullLoopAnalysis,
} from '@/core/fullLoop/runFullLoopSimulation';
import { normalizePersistedSave, SAVE_VERSION } from '@/store/gamePersist';

const checks: string[] = [];

function assert(label: string, condition: boolean): void {
  checks.push(condition ? `✓ ${label}` : `✗ ${label}`);
}

const analysis = runFullLoopAnalysis();

assert('SAVE_VERSION 23', SAVE_VERSION === 23 && analysis.saveVersionOk);

const balanced = analysis.scenarios.find((s) => s.scenario === 'balanced_player');
assert('balanced_player 7 days', (balanced?.daysCompleted ?? 0) === 7);
assert('balanced_player 7 reports', (balanced?.reportsCreated ?? 0) === 7);
assert('balanced_player no crash', (balanced?.crashes ?? 1) === 0);
assert('balanced_player day1 anchor', balanced?.day1AnchorPreserved === true);
assert('balanced_player day7 stress signal', balanced?.day7FinalStressPresent === true);
assert('balanced_player no repeated titles', (balanced?.repeatedExactTitles ?? 1) === 0);
assert('balanced_player no duplicate hooks', (balanced?.duplicateHooks ?? 1) === 0);
assert('balanced_player no day1 hooks', (balanced?.day1HooksCreated ?? 1) === 0);
assert('balanced_player no carry clamp violations', (balanced?.carryOverClampViolations ?? 1) === 0);
assert('balanced_player social route', balanced?.socialRouteValid === true);
assert(
  'balanced_player decision results',
  (balanced?.decisionsApplied ?? 0) > 0 && balanced?.missingDecisionResultCount === 0,
);
assert(
  'balanced_player priority day2+',
  (balanced?.prioritySelectedDays ?? 0) >= 6,
);
assert('balanced_player events not empty', (balanced?.eventsGenerated ?? 0) > 0);
assert(
  'balanced_player reports have priority snapshot',
  (balanced?.reportsWithDailyPriority ?? 0) >= 6,
);
assert(
  'balanced_player reports have goals snapshot',
  (balanced?.reportsWithDailyGoals ?? 0) >= 6,
);

assert('8 scenarios simulated', analysis.scenarios.length === FULL_LOOP_SCENARIOS.length);
assert(
  'all scenarios no crash',
  analysis.scenarios.every((s) => s.crashes === 0),
);
assert(
  'all scenarios events generated',
  analysis.scenarios.every((s) => s.eventsGenerated > 0),
);
assert(
  'all scenarios no repeated titles',
  analysis.scenarios.every((s) => s.repeatedExactTitles === 0),
);
assert(
  'all scenarios no duplicate hooks',
  analysis.scenarios.every((s) => s.duplicateHooks === 0),
);
assert(
  'all scenarios no carry clamp violations',
  analysis.scenarios.every((s) => s.carryOverClampViolations === 0),
);
assert(
  'all scenarios day1 anchor',
  analysis.scenarios.every((s) => s.day1AnchorPreserved),
);
assert(
  'all scenarios 7 reports',
  analysis.scenarios.every((s) => s.reportsCreated === 7),
);

const bundle = createDay1Seed();
const hydrated = normalizePersistedSave({
  saveVersion: 6,
  gameState: bundle.gameState,
  neighborhoods: bundle.neighborhoods,
  resources: bundle.resources,
  eventPool: bundle.eventPool,
  decisionHistory: [],
  snapshots: [],
  playerProgress: { level: 1, totalXp: 0, xpIntoLevel: 0, xpToNextLevel: 100 },
  updatedAt: new Date().toISOString(),
});
assert(
  'hydrate v6 does not crash',
  hydrated != null && hydrated.saveVersion === SAVE_VERSION,
);

const finalEvent = pilotEvents.find((e) => e.id === PILOT_FINAL_EVENT_ID);
assert('day7 final event exists', finalEvent != null);
if (finalEvent) {
  const patched = ensureAtLeastOneAffordableDecision(finalEvent, 400);
  assert(
    'day7 final has affordable option at low budget',
    patched.decisions.some(
      (d) =>
        checkDecisionAffordability({
          economyState: {
            currentSource: 400,
            startingSource: 400,
            totalEarned: 0,
            totalSpent: 0,
            transactions: [],
          },
          decision: d,
        }).canAfford,
    ),
  );
  assert(
    'day7 final includes low-cost closeout',
    patched.decisions.some((d) => d.id === FINAL_LOW_COST_CLOSEOUT_DECISION_ID),
  );
}

const riskyFast = analysis.scenarios.find((s) => s.scenario === 'risky_fast_player');
const wrongPriority = analysis.scenarios.find(
  (s) => s.scenario === 'wrong_priority_player',
);
assert(
  'risky_fast no day7 noAffordableDecision warn',
  !riskyFast?.warnings.some((w) => w.includes('noAffordableDecision')),
);
assert(
  'wrong_priority no day7 noAffordableDecision warn',
  !wrongPriority?.warnings.some((w) => w.includes('noAffordableDecision')),
);

const toneKeys = Object.keys(balanced?.resultToneDistribution ?? {});
assert(
  'balanced resultToneDistribution not empty',
  toneKeys.length > 0,
);
assert(
  'balanced containerCriticalDays < 6',
  (balanced?.containerCriticalNeighborhoodDays ?? 99) < 6,
);
const operationPlayer = analysis.scenarios.find(
  (s) => s.scenario === 'operation_player',
);
assert(
  'operation containerCriticalDays <= balanced',
  (operationPlayer?.containerCriticalNeighborhoodDays ?? 99) <=
    (balanced?.containerCriticalNeighborhoodDays ?? 0),
);
assert(
  'container pressure bands tracked',
  analysis.scenarios.some(
    (s) =>
      s.containerHighNeighborhoodDays > 0 ||
      s.containerElevatedNeighborhoodDays > 0,
  ),
);
assert(
  'main operation preview route valid',
  analysis.scenarios.every((s) => s.mainOperationPreviewRouteValid),
);
assert(
  'balanced pilot completion summary',
  balanced?.pilotCompletionShown === true && balanced?.pilotCompletionGrade != null,
);
assert(
  'all scenarios pilot completion grade when 7 days',
  analysis.scenarios.every(
    (s) => s.daysCompleted === 7 && s.pilotCompletionShown && s.pilotCompletionGrade,
  ),
);

for (const line of checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

const ok = checks.every((c) => c.startsWith('✓'));
if (!ok) {
  // eslint-disable-next-line no-console
  console.error('\nFull loop verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nFull loop verify passed.');
