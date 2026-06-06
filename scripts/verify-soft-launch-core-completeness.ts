/**
 * Crevia Soft Launch Core Completeness Audit - Stage 1.
 * Run: npm run verify:soft-launch-core-completeness
 */

import { runSoftLaunchCoreCompletenessAudit } from '../src/core/softLaunchCoreCompleteness';
import { buildSoftLaunchCoreCompletenessConsoleSummary } from '../src/core/softLaunchCoreCompleteness/softLaunchCoreCompletenessPresentation';
import { verifySoftLaunchCoreCompletenessScenario } from '../src/core/softLaunchCoreCompleteness/verifySoftLaunchCoreCompletenessScenario';

const outcome = verifySoftLaunchCoreCompletenessScenario();
const result = runSoftLaunchCoreCompletenessAudit();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildSoftLaunchCoreCompletenessConsoleSummary(result));
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(`Decision: ${outcome.decision} | Health: ${outcome.overallHealth}`);

if (!outcome.ok) {
  process.exit(1);
}
