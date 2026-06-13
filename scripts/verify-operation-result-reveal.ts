/**
 * Operasyon Sonuç fazı impact reveal verify.
 * Çalıştır: npm run verify:operation-result-reveal
 */

import { verifyOperationResultRevealScenario } from '../src/features/events/verifyOperationResultRevealScenario';

const outcome = verifyOperationResultRevealScenario();

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
console.log('\nAll operation result reveal checks passed.');
