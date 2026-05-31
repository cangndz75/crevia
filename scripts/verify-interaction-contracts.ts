/**
 * Etkileşim sözleşmesi (clickability) doğrulaması.
 * Çalıştır: npm run verify:interaction-contracts
 */

import { verifyInteractionContractsScenario } from '../src/core/quality/interactionContracts/verifyInteractionContractsScenario';

const result = verifyInteractionContractsScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nInteraction contracts verify FAILED.');
  process.exit(1);
}

if (result.warn) {
  // eslint-disable-next-line no-console
  console.warn('\nInteraction contracts verify passed with WARN.');
} else {
  // eslint-disable-next-line no-console
  console.log('\nInteraction contracts verify PASS.');
}
