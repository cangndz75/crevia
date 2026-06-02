/**
 * District-specific operations runtime-lite verify.
 * Çalıştır: npm run verify:district-operations-runtime
 */

import { verifyDistrictOperationsRuntimeScenario } from '../src/core/districtOperationsRuntime/verifyDistrictOperationsRuntimeScenario';

const outcome = verifyDistrictOperationsRuntimeScenario();

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
