/**
 * Readiness strategic priority verify.
 * Calistir: npm run verify:readiness-strategic-priority
 */

import { verifyReadinessStrategicPriorityScenario } from '../src/core/readinessStrategicPriority/verifyReadinessStrategicPriorityScenario';

const outcome = verifyReadinessStrategicPriorityScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!outcome.ok) {
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nAll readiness strategic priority checks passed.');
