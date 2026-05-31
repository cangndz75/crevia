/**
 * Operational Resources MVP verify.
 * Çalıştır: npm run verify:operational-resources
 */

import { verifyOperationalResourcesScenario } from '../src/core/operationalResources/verifyOperationalResourcesScenario';

const result = verifyOperationalResourcesScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (result.warn) {
  // eslint-disable-next-line no-console
  console.warn(
    `\nOperational resources verify passed with ${result.warnCount} warning(s).`,
  );
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(
    `\nOperational resources verify failed (${result.failCount} check(s)).`,
  );
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nOperational resources verify passed.');
