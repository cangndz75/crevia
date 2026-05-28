/**
 * Günlük öncelik döngüsü smoke doğrulaması.
 * Çalıştır: npm run verify:daily-priority
 */

import { verifyDailyPriorityScenario } from '../src/core/dailyPriority/verifyDailyPriorityScenario';

const result = verifyDailyPriorityScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nDaily priority verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nDaily priority verify passed.');
