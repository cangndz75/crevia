/**
 * Performance selector/memoization pass 2 audit.
 * Run: npm run verify:performance-selector-pass-two
 */

import { verifyPerformanceSelectorPassTwoScenario } from '../src/core/quality/verifyPerformanceSelectorPassTwoScenario';

const outcome = verifyPerformanceSelectorPassTwoScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(outcome.consoleReport);

if (!outcome.ok) {
  // eslint-disable-next-line no-console
  console.error('\nPerformance selector pass two verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nPerformance selector pass two verify passed.');
