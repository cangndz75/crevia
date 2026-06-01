import { verifyPlayerStyleScenario } from '../src/core/playerStyle/verifyPlayerStyleScenario';

const outcome = verifyPlayerStyleScenario();
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
console.log('Style coverage: fast_responder, preventive_planner, public_focused, resource_guardian, crisis_watcher, balanced_operator, inconsistent_operator, unknown');
console.log('Observation sources: event_result, carry_over, resource_fatigue, social_echo, map_before_after, decision_history');
console.log('Confidence: none (day1), low (2-3 obs), medium (4-6), high (7+ or dominant score)');
console.log('UI integration: HubAdvisorCard + ReportAdvisorCommentCard');
console.log('Next step: Crevia Advisor Seniority System (advisor-seniority-system)');
console.log('');
console.log(outcome.ok ? 'RESULT: PASS' : 'RESULT: FAIL');
process.exit(outcome.ok ? 0 : 1);
