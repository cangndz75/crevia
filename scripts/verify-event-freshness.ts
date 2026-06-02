/**
 * Event freshness guard verify.
 * Çalıştır: npm run verify:event-freshness
 */

import { verifyEventFreshnessScenario } from '../src/core/eventFreshness/verifyEventFreshnessScenario';

const outcome = verifyEventFreshnessScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}
