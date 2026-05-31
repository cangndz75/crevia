/**
 * Operasyon sinyalleri MVP doğrulaması.
 * Çalıştır: npm run verify:operation-signals
 */

import { verifyOperationSignalsScenario } from '../src/core/operations/verifyOperationSignalsScenario';

const result = verifyOperationSignalsScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nOperation signals verify FAILED.');
  process.exit(1);
}

if (result.warn) {
  // eslint-disable-next-line no-console
  console.warn('\nOperation signals verify passed with WARN.');
} else {
  // eslint-disable-next-line no-console
  console.log('\nOperation signals verify PASS.');
}
