import { verifyReportTomorrowPreviewScenario } from '../src/core/reports/verifyReportTomorrowPreviewScenario';

const outcome = verifyReportTomorrowPreviewScenario();
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
console.log('Source priority: carry_over → event_echo → event_domain → dynamic_social_echo → daily_report → operation_signal → pilot_theme → fallback');
console.log('Day visibility: Day1 hidden, Day2-6 standard/compact, Day7 final_safe, Day>7 real-data only');
console.log('Duplicate suppression: carry-over, social echo, event result echo');
console.log('UI integration: EndOfDayReportView after impact section');
console.log('Next step: Resource Fatigue Visual States (resource-fatigue-visual-states)');
console.log('');
console.log(outcome.ok ? 'RESULT: PASS' : 'RESULT: FAIL');
if (outcome.warn) {
  console.log('RESULT: WARN (smoke/regression notes)');
}
process.exit(outcome.ok ? 0 : 1);
