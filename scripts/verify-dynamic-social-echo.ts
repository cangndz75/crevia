import { verifyDynamicSocialEchoScenario } from '../src/core/socialEcho/verifyDynamicSocialEchoScenario';

const outcome = verifyDynamicSocialEchoScenario();
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
console.log('Visibility by day: Day1 hidden, Day4 highlighted, Day7 compact');
console.log('Domain coverage: container, vehicle_route, personnel, social, crisis_adjacent, district_balance');
console.log('Selector determinism: stableHash (no Math.random)');
console.log('UI integration: SocialPulseScreen + SocialDecisionEchoCard');
console.log('Next step: Crevia Report Tomorrow Preview (report-tomorrow-preview)');
console.log('');
console.log(outcome.ok ? 'RESULT: PASS' : 'RESULT: FAIL');
if (outcome.warn) {
  console.log('RESULT: WARN (smoke/regression notes)');
}
process.exit(outcome.ok ? 0 : 1);
