/**
 * Progression bridge smoke doğrulaması.
 * Çalıştır: npm run verify:progression-bridge
 */

import { verifyProgressionBridgeScenario } from '../src/core/progression/verifyProgressionBridgeScenario';

const result = verifyProgressionBridgeScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nProgression bridge verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nProgression bridge verify passed.');
