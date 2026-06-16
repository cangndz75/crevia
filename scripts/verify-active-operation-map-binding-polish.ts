/**
 * Active Operation Map Binding Polish Pass verify.
 * Calistir: npm run verify:active-operation-map-binding-polish
 */

import { verifyActiveOperationMapBindingPolishScenario } from '../src/core/activeOperationMapBinding/verifyActiveOperationMapBindingPolishScenario';

const outcome = verifyActiveOperationMapBindingPolishScenario();

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
