import { verifyContentRuntimeActivationFullImplementationScenario } from '../src/core/contentRuntimeActivation/verifyContentRuntimeActivationFullImplementationScenario';

const outcome = verifyContentRuntimeActivationFullImplementationScenario();
const passes = outcome.checks.filter((line) => line.startsWith('PASS'));
const fails = outcome.checks.filter((line) => line.startsWith('FAIL'));

for (const line of outcome.checks) {
  console.log(line);
}

console.log('');
console.log('--- Summary ---');
console.log(`PASS: ${passes.length}`);
console.log(`FAIL: ${fails.length}`);
console.log('Mode: limited_full Day 8+ full access (max 2 pack-origin/day)');
console.log('Non-goals: SAVE_VERSION 24, pilot Day 1-7, public launch blocked');
console.log(outcome.ok ? 'RESULT: PASS' : 'RESULT: FAIL');

process.exit(outcome.ok ? 0 : 1);
