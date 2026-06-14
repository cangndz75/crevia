/**
 * Event variety verify — strict invariants for pilot week variety.
 * Calistir: npm run verify:event-variety
 */

import { verifyEventVarietyScenario } from '../src/core/eventVariety/verifyEventVarietyScenario';

const outcome = verifyEventVarietyScenario();

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
