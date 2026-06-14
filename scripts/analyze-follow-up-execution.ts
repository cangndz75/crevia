/**
 * Diagnostic analyzer for Follow-up Action Execution Lite.
 * Calistir: npm run analyze:follow-up-execution
 */

import { buildFollowUpActions } from '../src/core/followUpActions';
import {
  buildFollowUpExecution,
  buildFollowUpExecutionCardModels,
  executeFollowUpActionLite,
} from '../src/core/followUpExecution';

const scenarios = [
  {
    label: 'Day 1 hidden',
    input: { day: 1 },
  },
  {
    label: 'Day 8 follow-up action',
    input: {
      day: 8,
      followUpActionResult: buildFollowUpActions({
        day: 8,
        rewardComebackSignals: {
          id: 'recovery_8',
          title: 'Toparlanma',
          summary: 'Kucuk takip hamlesi degerli.',
          tone: 'recovery',
          sourceIds: ['recovery_8'],
        },
      }),
    },
  },
  {
    label: 'Day 8 no source',
    input: { day: 8 },
  },
] as const;

let hasFail = false;

for (const scenario of scenarios) {
  const result = buildFollowUpExecution(scenario.input);
  // eslint-disable-next-line no-console
  console.log(`\n=== ${scenario.label} ===`);
  // eslint-disable-next-line no-console
  console.log(
    `active=${result.isActive} available=${result.availableCandidates.length} executed=${result.executedCandidates.length}`,
  );
  for (const candidate of result.availableCandidates) {
    // eslint-disable-next-line no-console
    console.log(`  ${candidate.kind} ${candidate.status} p=${candidate.priority} action=${candidate.actionId}`);
  }

  if (scenario.input.day < 8 && result.isActive) {
    // eslint-disable-next-line no-console
    console.log('FAIL Day <8 visible');
    hasFail = true;
  }
  if (scenario.label === 'Day 8 no source' && result.availableCandidates.length > 0) {
    // eslint-disable-next-line no-console
    console.log('FAIL no-source fallback spam');
    hasFail = true;
  }
  if (scenario.label === 'Day 8 follow-up action') {
    const first = result.availableCandidates[0];
    if (!first) {
      // eslint-disable-next-line no-console
      console.log('FAIL source did not produce candidate');
      hasFail = true;
    } else {
      const executed = executeFollowUpActionLite(scenario.input, {
        day: scenario.input.day,
        actionId: first.actionId,
      });
      const duplicate = executeFollowUpActionLite(
        { ...scenario.input, executedActionIdsToday: [first.actionId] },
        { day: scenario.input.day, actionId: first.actionId },
      );
      // eslint-disable-next-line no-console
      console.log(
        `  execute=${executed.executedCandidates[0]?.status ?? 'none'} duplicate=${duplicate.primaryCandidate?.status ?? 'none'} cards=${buildFollowUpExecutionCardModels(executed).length}`,
      );
      if (executed.executedCandidates[0]?.status !== 'executed') {
        // eslint-disable-next-line no-console
        console.log('FAIL execute did not mark candidate executed');
        hasFail = true;
      }
      if (duplicate.primaryCandidate?.status !== 'blocked') {
        // eslint-disable-next-line no-console
        console.log('FAIL duplicate was not blocked');
        hasFail = true;
      }
    }
  }
}

// eslint-disable-next-line no-console
console.log('\n--- Summary ---');
// eslint-disable-next-line no-console
console.log(hasFail ? 'FAIL detected' : 'PASS');
if (hasFail) process.exit(1);
