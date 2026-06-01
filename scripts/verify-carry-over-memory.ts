import { verifyCarryOverMemoryScenario } from '../src/core/carryOver/verifyCarryOverMemoryScenario';

const outcome = verifyCarryOverMemoryScenario();
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
console.log(`Surface coverage: hub, event_detail, plan, result, report`);
console.log(`Domain coverage: ${passes.filter((p) => p.includes('domain')).length} checks`);
console.log(`Day visibility: Day1 hidden, Day2-7 visible patterns`);
console.log(`UI integration: Hub, Event, Result, Report`);
console.log(`Next step: Report Tomorrow Preview (report-tomorrow-preview)`);
console.log('');
console.log(outcome.ok ? 'RESULT: PASS' : 'RESULT: FAIL');
if (outcome.warn) {
  console.log('RESULT: WARN (smoke/regression notes)');
}
process.exit(outcome.ok ? 0 : 1);
