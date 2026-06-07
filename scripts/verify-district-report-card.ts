import { verifyDistrictReportCardScenario } from '../src/core/districtReportCard/verifyDistrictReportCardScenario';

const outcome = verifyDistrictReportCardScenario();
const passes = outcome.checks.filter((line) => line.startsWith('PASS'));
const fails = outcome.checks.filter((line) => line.startsWith('FAIL'));

for (const line of outcome.checks) {
  console.log(line);
}

console.log('');
console.log('--- Summary ---');
console.log(`PASS: ${passes.length}`);
console.log(`FAIL: ${fails.length}`);
console.log('Surfaces: map district report card, hub/report helpers');
console.log('Non-goals: SAVE_VERSION, applyDecision, persist, event generation unchanged');
console.log(outcome.ok ? 'RESULT: PASS' : 'RESULT: FAIL');

process.exit(outcome.ok ? 0 : 1);
