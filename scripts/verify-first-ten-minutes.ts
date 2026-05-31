/**
 * First 10 Minutes UX Simplification — Aşama 1 verify.
 * Çalıştır: npm run verify:first-10-minutes
 */

import { verifyFirstTenMinutesScenario } from '../src/core/onboarding/verifyFirstTenMinutesScenario';

const result = verifyFirstTenMinutesScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (result.warn) {
  // eslint-disable-next-line no-console
  console.warn(`\nFirst 10 minutes verify passed with ${result.warnCount} warning(s).`);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nFirst 10 minutes verify failed (${result.failCount} check(s)).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nFirst 10 minutes verify passed.');
