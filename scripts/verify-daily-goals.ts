/**
 * Günlük hedef smoke doğrulaması.
 * Çalıştır: npm run verify:daily-goals
 */

import { verifyDailyGoalsScenario } from '../src/core/dailyGoals/verifyDailyGoalsScenario';

const result = verifyDailyGoalsScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nDaily goals verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nDaily goals verify passed.');
