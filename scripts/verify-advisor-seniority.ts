import { verifyAdvisorSeniorityScenario } from '../src/core/advisors/verifyAdvisorSeniorityScenario';

const outcome = verifyAdvisorSeniorityScenario();
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
console.log('Tier coverage: trainee, assistant, field_advisor, operations_specialist, chief_advisor_preview');
console.log('Capability coverage: event → tradeoff → resource/social → carry-over/style → strategic preview');
console.log('Day visibility: Day1 compact, Day2-3 short, Day4+ depth, Day7 chief preview safe');
console.log('UI integration: HubAdvisorCard + ReportAdvisorCommentCard');
console.log('Next step: Crevia Specialist Advisor Notes MVP (specialist-advisor-notes-mvp)');
console.log('');
console.log(outcome.ok ? 'RESULT: PASS' : 'RESULT: FAIL');
process.exit(outcome.ok ? 0 : 1);
