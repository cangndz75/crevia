import { verifyResourceFatigueVisualScenario } from '../src/core/resources/verifyResourceFatigueVisualScenario';

const outcome = verifyResourceFatigueVisualScenario();
const passes = outcome.checks.filter((c) => c.startsWith('PASS'));
const warns = outcome.checks.filter((c) => c.startsWith('WARN'));
const fails = outcome.checks.filter((c) => c.startsWith('FAIL'));

for (const line of outcome.checks) {
  console.log(line);
}

console.log('');
console.log('--- Summary ---');
console.log(`PASS: ${passes.length}`);
console.log(`WARN: ${warns.length}`);
console.log(`FAIL: ${fails.length}`);
console.log('Domain coverage: vehicle, personnel, container, route, mixed');
console.log('State coverage: ready → critical, recovering, resolved');
console.log('Day visibility: Day1 hidden, Day2 container, Day3+ fleet, Day7 compact');
console.log('UI: Hub, Map presence, Assignment, Field, Result, Report');
console.log('Next step: Map Before After State (map-before-after-state)');
console.log('');
console.log(outcome.ok ? 'RESULT: PASS' : 'RESULT: FAIL');
if (outcome.warn) {
  console.log('RESULT: WARN (smoke/regression notes)');
}
process.exit(outcome.ok ? 0 : 1);
