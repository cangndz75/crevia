/**
 * District operation selectable action audit.
 * Run: npm run verify:district-operation-actions
 */

import { verifyDistrictOperationActionScenario } from '../src/core/districtOperationActions/verifyDistrictOperationActionScenario';

const outcome = verifyDistrictOperationActionScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!outcome.ok) {
  // eslint-disable-next-line no-console
  console.error('\nDistrict operation action verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(
  `\nDistrict Operation Actions Verify: PASS (${outcome.checks.filter((line) => line.startsWith('PASS')).length} pass, 0 fail)`,
);
