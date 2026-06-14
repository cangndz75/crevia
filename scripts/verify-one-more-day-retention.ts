/**
 * One More Day Retention Pass verify.
 * Calistir: npm run verify:one-more-day-retention
 */

import { verifyOneMoreDayRetentionScenario } from '../src/core/oneMoreDayRetention/verifyOneMoreDayRetentionScenario';

const outcome = verifyOneMoreDayRetentionScenario();

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
