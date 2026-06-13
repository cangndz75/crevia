/**
 * Günlük Ödül Rotası runtime binding verify.
 * Çalıştır: npm run verify:center-daily-reward
 */

import { verifyCenterDailyRewardScenario } from '../src/features/hub/verifyCenterDailyRewardScenario';

const outcome = verifyCenterDailyRewardScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!outcome.ok) {
  // eslint-disable-next-line no-console
  console.error(`\n${outcome.failCount} check(s) failed.`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nAll center daily reward checks passed.');
