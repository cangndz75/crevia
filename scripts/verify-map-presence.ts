import { verifyMapPresenceScenario } from '../src/core/mapPresence/verifyMapPresenceScenario';

const outcome = verifyMapPresenceScenario();
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
console.log('District anchor coverage: 5 districts × container/vehicle/team/social/crisis anchors');
console.log('Domain marker coverage: container, vehicle_route, personnel, social, crisis_adjacent');
console.log('Day visibility: Day1 hidden, Day2 container, Day3+ fleet, Day6 risk, Day7 compact');
console.log('Marker caps: overview ≤7, route hint ≤1, panel ≤2');
console.log('Crisis priority: active crisis mutes non-crisis presence');
console.log('UI integration: MapScreen → CityOverviewMap / DistrictDetailMap / bottom panel');
console.log('Next step: Map Before After State (map-before-after-state)');
console.log('');
console.log(outcome.ok ? 'RESULT: PASS' : 'RESULT: FAIL');
if (outcome.warn) {
  console.log('RESULT: WARN (smoke/regression notes)');
}
process.exit(outcome.ok ? 0 : 1);
