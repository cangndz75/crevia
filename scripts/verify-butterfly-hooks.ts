/**
 * Butterfly Hook Lite smoke doğrulaması.
 * Çalıştır: npm run verify:butterfly-hooks
 */

import { verifyButterflyHookScenario } from '../src/core/events/verifyButterflyHookScenario';

const result = verifyButterflyHookScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nButterfly hooks verify failed (${result.failCount} FAIL).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(
  `\nButterfly hooks verify passed (${result.warnCount} WARN).`,
);
