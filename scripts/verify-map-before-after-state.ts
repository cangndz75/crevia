import { verifyMapBeforeAfterScenario } from '../src/core/mapPresence/verifyMapBeforeAfterScenario';

const outcome = verifyMapBeforeAfterScenario();
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
console.log('Domain coverage: container, vehicle_route, personnel, social, crisis_adjacent, district_balance, generic_operation');
console.log('Outcome coverage: improved, partially_improved, unchanged, worsened, carried_over, prevented, unknown');
console.log('Day visibility: Day1 hidden, Day2+ container, Day3+ vehicle/personnel, Day6 crisis-adjacent panic-free, Day7 compact');
console.log('Duplicate suppression: carry-over, reportTomorrow, socialEcho, eventDomain echo');
console.log('UI integration: DecisionResultScreen + MapOperationBottomPanel (max 1 strip)');
console.log('Next step: Crevia Ece Player Style Recognition (ece-player-style-recognition)');
console.log('');
console.log(outcome.ok ? 'RESULT: PASS' : 'RESULT: FAIL');
if (outcome.warn) {
  console.log('RESULT: WARN (smoke/regression notes)');
}
process.exit(outcome.ok ? 0 : 1);
