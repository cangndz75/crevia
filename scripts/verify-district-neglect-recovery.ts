/**
 * District Neglect & Recovery Pass verify.
 * Calistir: npm run verify:district-neglect-recovery
 */

import { verifyDistrictNeglectRecoveryScenario } from '../src/core/districtNeglectRecovery/verifyDistrictNeglectRecoveryScenario';

const outcome = verifyDistrictNeglectRecoveryScenario();

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
