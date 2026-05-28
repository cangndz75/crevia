/**
 * Micro interaction + haptic smoke doğrulaması.
 * Çalıştır: npm run verify:micro-interactions
 */

import { verifyMicroInteractionsScenario } from '../src/core/feedback/verifyMicroInteractionsScenario';

const result = verifyMicroInteractionsScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nMicro interactions verify failed (${result.failCount} FAIL).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nMicro interactions verify passed.');
