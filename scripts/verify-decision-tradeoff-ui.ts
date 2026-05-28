/**
 * Karar tradeoff UI presentation smoke doğrulaması.
 * Çalıştır: npm run verify:decision-tradeoff-ui
 */

import { verifyDecisionTradeoffUiScenario } from '../src/features/events/utils/verifyDecisionTradeoffUiScenario';

const result = verifyDecisionTradeoffUiScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nDecision tradeoff UI verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nDecision tradeoff UI verify passed.');
