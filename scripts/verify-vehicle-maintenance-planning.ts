import { verifyVehicleMaintenancePlanningScenario } from '../src/core/vehicleMaintenance/verifyVehicleMaintenancePlanningScenario';

const outcome = verifyVehicleMaintenancePlanningScenario();
for (const line of outcome.checks) {
  console.log(line);
}
const failCount = outcome.checks.filter((c) => c.startsWith('FAIL')).length;
const passCount = outcome.checks.length - failCount;
console.log(`\nSummary: ${passCount} PASS, ${failCount} FAIL`);
console.log('Mode: planning audit — runtime V1 open, SAVE_VERSION 25');
console.log(outcome.ok ? 'RESULT: PASS' : 'RESULT: FAIL');
process.exit(failCount > 0 ? 1 : 0);
