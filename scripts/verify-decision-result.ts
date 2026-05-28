/**
 * Karar sonuç ekranı smoke doğrulaması.
 * Çalıştır: npm run verify:decision-result
 */

import { verifyDecisionResultScenario } from '../src/features/events/utils/verifyDecisionResultScenario';

const result = verifyDecisionResultScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nDecision result verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nDecision result verify passed.');
