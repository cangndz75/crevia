/**
 * Day 8+ Operation Feed Binding verify.
 * Calistir: npm run verify:day8-operation-feed-binding
 */

import { verifyDay8OperationFeedBindingScenario } from '../src/core/day8OperationFeedBinding/verifyDay8OperationFeedBindingScenario';

const outcome = verifyDay8OperationFeedBindingScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((line) => line.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((line) => line.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((line) => line.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}
