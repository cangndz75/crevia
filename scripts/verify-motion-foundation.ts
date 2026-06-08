/**
 * Motion Foundation verify.
 * Run: npm run verify:motion-foundation
 */

import { verifyMotionFoundationScenario } from '../src/core/motion/verifyMotionFoundationScenario';

const outcome = verifyMotionFoundationScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log(
  `\nSummary: ${outcome.checks.filter((line) => line.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((line) => line.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}
