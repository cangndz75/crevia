/**
 * Kriz hamlesi MVP doğrulaması.
 * Çalıştır: npm run verify:crisis-actions
 */

import { verifyCrisisActionScenario } from '../src/core/crisisActions/verifyCrisisActionScenario';

const result = verifyCrisisActionScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nCrisis actions verify FAILED.');
  process.exit(1);
}

if (result.warn) {
  // eslint-disable-next-line no-console
  console.warn('\nCrisis actions verify passed with WARN.');
} else {
  // eslint-disable-next-line no-console
  console.log('\nCrisis actions verify PASS.');
}
