/**
 * Gameplay impact balance doğrulaması.
 * Çalıştır: npm run verify:gameplay-impact-balance
 */

import { verifyGameplayImpactBalanceScenario } from '../src/core/balance/verifyGameplayImpactBalanceScenario';

const result = verifyGameplayImpactBalanceScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (result.simulationSummary) {
  // eslint-disable-next-line no-console
  console.log(`\n${result.simulationSummary}`);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nGameplay impact balance verify FAILED.');
  process.exit(1);
}

if (result.warn) {
  // eslint-disable-next-line no-console
  console.warn('\nGameplay impact balance verify passed with WARN.');
} else {
  // eslint-disable-next-line no-console
  console.log('\nGameplay impact balance verify PASS.');
}
