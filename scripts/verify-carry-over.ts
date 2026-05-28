/**
 * Carry-over Signals Lite smoke doğrulaması.
 * Çalıştır: npm run verify:carry-over
 */

import { verifyCarryOverScenario } from '../src/core/carryOver/verifyCarryOverScenario';

const result = verifyCarryOverScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nCarry-over verify failed (${result.failCount} FAIL).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(`\nCarry-over verify passed (${result.warnCount} WARN).`);
