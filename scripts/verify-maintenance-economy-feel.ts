import { verifyMaintenanceEconomyFeelScenario } from '../src/core/maintenanceBacklog/verifyMaintenanceEconomyFeelScenario';

const outcome = verifyMaintenanceEconomyFeelScenario();
for (const line of outcome.checks) {
  console.log(line);
}
if (!outcome.ok) {
  console.error(`verify:maintenance-economy-feel FAILED (${outcome.failCount} checks)`);
  process.exit(1);
}
console.log('verify:maintenance-economy-feel PASSED');
