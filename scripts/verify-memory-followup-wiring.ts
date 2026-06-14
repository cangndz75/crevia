/**
 * Memory & Follow-up Visibility Wiring Lite verify.
 * Calistir: npm run verify:memory-followup-wiring
 */

import { verifyMemoryFollowUpWiringScenario } from '../src/features/shared/verifyMemoryFollowUpWiringScenario';

const outcome = verifyMemoryFollowUpWiringScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((line) => line.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((line) => line.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}
