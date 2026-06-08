import { verifyContentRuntimeActivationFullPlanningScenario } from '@/core/contentRuntimeActivation/verifyContentRuntimeActivationFullPlanningScenario';

const outcome = verifyContentRuntimeActivationFullPlanningScenario();
for (const line of outcome.checks) {
  console.log(line);
}
const failCount = outcome.checks.filter((c) => c.startsWith('FAIL')).length;
console.log(`\nSummary: ${outcome.checks.length - failCount} PASS, ${failCount} FAIL`);
process.exit(failCount > 0 ? 1 : 0);
