/**
 * Post-launch telemetry readiness verify.
 * Çalıştır: npm run verify:post-launch-telemetry-readiness
 */

import { runPostLaunchTelemetryReadinessAudit } from '../src/core/analytics/postLaunchTelemetryReadinessAudit';
import { buildPostLaunchTelemetryConsoleSummary } from '../src/core/analytics/postLaunchTelemetryReadinessPresentation';
import { verifyPostLaunchTelemetryReadinessScenario } from '../src/core/analytics/verifyPostLaunchTelemetryReadinessScenario';

const outcome = verifyPostLaunchTelemetryReadinessScenario();
const result = runPostLaunchTelemetryReadinessAudit({ mode: 'soft_launch_candidate' });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildPostLaunchTelemetryConsoleSummary(result));
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);
// eslint-disable-next-line no-console
console.log(`Telemetry health: ${outcome.telemetryHealth}`);

if (!outcome.ok) {
  process.exit(1);
}
