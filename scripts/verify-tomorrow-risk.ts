import { verifyTomorrowRiskScenario } from '../src/core/tomorrowRisk/verifyTomorrowRiskScenario';

const outcome = verifyTomorrowRiskScenario();
const passes = outcome.checks.filter((line) => line.startsWith('PASS'));
const fails = outcome.checks.filter((line) => line.startsWith('FAIL'));

for (const line of outcome.checks) {
  console.log(line);
}

console.log('');
console.log('--- Summary ---');
console.log(`PASS: ${passes.length}`);
console.log(`FAIL: ${fails.length}`);
console.log('Kinds: route, container, social, personnel, vehicle, district, crisis, resource, recovery, operation, post-pilot, fallback');
console.log('Non-goals: SAVE_VERSION, applyDecision, event generation unchanged');
console.log(outcome.ok ? 'RESULT: PASS' : 'RESULT: FAIL');

process.exit(outcome.ok ? 0 : 1);
