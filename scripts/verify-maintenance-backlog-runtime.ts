/**
 * Maintenance backlog runtime persist verify.
 * Calistir: npm run verify:maintenance-backlog-runtime
 */

import { verifyMaintenanceBacklogRuntimeScenario } from '../src/core/maintenanceBacklog/verifyMaintenanceBacklogRuntimeScenario';

const outcome = verifyMaintenanceBacklogRuntimeScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!outcome.ok) {
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nAll maintenance backlog runtime checks passed.');
