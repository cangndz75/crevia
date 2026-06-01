import { verifyEventDomainUiPrioritizationScenario } from '../src/core/events/verifyEventDomainUiPrioritizationScenario';

const outcome = verifyEventDomainUiPrioritizationScenario();
const fails = outcome.checks.filter((c) => c.startsWith('FAIL'));
const warns = outcome.checks.filter((c) => c.startsWith('WARN'));
const passes = outcome.checks.filter((c) => c.startsWith('PASS'));

for (const line of outcome.checks) {
  console.log(line);
}

console.log('');
console.log('--- Summary ---');
console.log(`PASS: ${passes.length}`);
console.log(`WARN: ${warns.length}`);
console.log(`FAIL: ${fails.length}`);
console.log(`Domain inference: ${passes.filter((p) => p.includes('infer')).length} checks`);
console.log(`Surface priority: ${passes.filter((p) => p.includes('surface') || p.includes('primary')).length} checks`);
console.log(`UI integration: ${passes.filter((p) => p.includes('strip') || p.includes('detail') || p.includes('impact')).length} checks`);
console.log(`Next step: Carry-over Memory Cards (carry-over-memory-cards)`);
console.log('');
console.log(outcome.ok ? 'RESULT: PASS' : 'RESULT: FAIL');
if (outcome.warn) {
  console.log('RESULT: WARN (acceptable documentation/smoke notes)');
}
process.exit(outcome.ok ? 0 : 1);
