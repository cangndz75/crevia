import { verifyMainOperationFeelScenario } from '../src/core/mainOperationFeel/verifyMainOperationFeelScenario';

const outcome = verifyMainOperationFeelScenario();
const passes = outcome.checks.filter((line) => line.startsWith('PASS'));
const fails = outcome.checks.filter((line) => line.startsWith('FAIL'));

for (const line of outcome.checks) {
  console.log(line);
}

console.log('');
console.log('--- Summary ---');
console.log(`PASS: ${passes.length}`);
console.log(`FAIL: ${fails.length}`);
console.log('Surfaces: hub hero, report line, map hint, ece context');
console.log('Non-goals: SAVE_VERSION, applyDecision, event generation, persistence unchanged');
console.log(outcome.ok ? 'RESULT: PASS' : 'RESULT: FAIL');

process.exit(outcome.ok ? 0 : 1);
