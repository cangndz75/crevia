/**
 * Soft launch regression cleanup verify.
 * Çalıştır: npm run verify:soft-launch-regression-cleanup
 */

import { buildRegressionCleanupConsoleSummary } from '../src/core/softLaunchRegressionCleanup/softLaunchRegressionCleanupPresentation';
import { runSoftLaunchRegressionCleanupAudit } from '../src/core/softLaunchRegressionCleanup/softLaunchRegressionCleanupAudit';
import { verifySoftLaunchRegressionCleanupScenario } from '../src/core/softLaunchRegressionCleanup/verifySoftLaunchRegressionCleanupScenario';

const outcome = verifySoftLaunchRegressionCleanupScenario();
const audit = runSoftLaunchRegressionCleanupAudit({ mode: 'soft_launch_candidate' });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildRegressionCleanupConsoleSummary(audit));

if (!outcome.ok) {
  process.exit(1);
}
