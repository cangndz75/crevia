/**
 * Strategy history persist binding verify.
 * Calistir: npm run verify:strategy-history-persist
 */

import { verifyStrategyHistoryScenario } from '../src/core/strategyHistory/verifyStrategyHistoryScenario';

const outcome = verifyStrategyHistoryScenario();

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
