/**
 * Ece Memory & Strategy Line Pack verify.
 * Calistir: npm run verify:ece-strategy-lines
 */

import { verifyEceStrategyLinesScenario } from '../src/core/eceStrategyLines/verifyEceStrategyLinesScenario';

const outcome = verifyEceStrategyLinesScenario();

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
