/**
 * Canlı operasyon mikro kararları MVP doğrulaması.
 * Çalıştır: npm run verify:micro-decisions
 */

import { verifyMicroDecisionScenario } from '../src/core/microDecisions/verifyMicroDecisionScenario';

const result = verifyMicroDecisionScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nMicro decisions verify FAILED.');
  process.exit(1);
}

if (result.warn) {
  // eslint-disable-next-line no-console
  console.warn('\nMicro decisions verify passed with WARN.');
} else {
  // eslint-disable-next-line no-console
  console.log('\nMicro decisions verify PASS.');
}
