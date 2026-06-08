/**
 * Dynamic Map Reaction V1 Motion Polish verify.
 * Çalıştır: npm run verify:map-reaction-motion
 */

import { verifyMapReactionMotionScenario } from '../src/core/mapReactionsMotion/verifyMapReactionMotionScenario';

const outcome = verifyMapReactionMotionScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}
