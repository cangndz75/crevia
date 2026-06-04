/**
 * Analytics runtime expansion for new systems verify.
 * Calistir: npm run verify:analytics-new-systems
 */

import { verifyAnalyticsNewSystemsScenario } from '../src/core/analytics/verifyAnalyticsNewSystemsScenario';

const outcome = verifyAnalyticsNewSystemsScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(outcome.consoleReport);
// eslint-disable-next-line no-console
console.log('');

const pass = outcome.checks.filter((c) => c.startsWith('PASS')).length;
const fail = outcome.checks.filter((c) => c.startsWith('FAIL')).length;

// eslint-disable-next-line no-console
console.log(`Summary: ${pass} PASS, ${fail} FAIL`);

if (!outcome.ok) {
  process.exit(1);
}
