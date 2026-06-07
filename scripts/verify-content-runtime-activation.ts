import { verifyContentRuntimeActivationScenario } from '../src/core/contentRuntimeActivation/verifyContentRuntimeActivationScenario';

const outcome = verifyContentRuntimeActivationScenario();
const passes = outcome.checks.filter((line) => line.startsWith('PASS'));
const fails = outcome.checks.filter((line) => line.startsWith('FAIL'));

for (const line of outcome.checks) {
  console.log(line);
}

console.log('');
console.log('--- Summary ---');
console.log(`PASS: ${passes.length}`);
console.log(`FAIL: ${fails.length}`);
console.log('Packs: district_pack_one, vehicle_route_pack_one, container_environment_pack_one');
console.log('Non-goals: SAVE_VERSION, applyDecision, event generation rewrite unchanged');
console.log(outcome.ok ? 'RESULT: PASS' : 'RESULT: FAIL');

process.exit(outcome.ok ? 0 : 1);
