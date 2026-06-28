/**
 * Karar derinliği ve tradeoff sertleştirme doğrulaması.
 * Çalıştır: npm run verify:decision-tradeoff-depth
 */

import { verifyDecisionTradeoffDepthScenario } from '../src/features/events/verifyDecisionTradeoffDepthScenario';

const outcome = verifyDecisionTradeoffDepthScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!outcome.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nDecision tradeoff depth verify failed (${outcome.failCount} checks).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nDecision tradeoff depth verify passed.');
