/**
 * Crevia Soft Launch Readiness Review — comprehensive quality report.
 * Çalıştır: npm run verify:soft-launch-review
 */

import { runSoftLaunchReadinessReview } from '../src/core/releaseReadiness/softLaunchReviewAudit';
import { buildSoftLaunchReviewConsoleSummary } from '../src/core/releaseReadiness/softLaunchReviewPresentation';
import { verifySoftLaunchReviewScenario } from '../src/core/releaseReadiness/verifySoftLaunchReviewScenario';

const outcome = verifySoftLaunchReviewScenario();
const review = runSoftLaunchReadinessReview({ mode: 'internal_device_test' });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildSoftLaunchReviewConsoleSummary(review));
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);
// eslint-disable-next-line no-console
console.log(`Review health (internal_device_test): ${outcome.reviewHealth}`);
// eslint-disable-next-line no-console
console.log(`Decision: ${review.decision} | Level: ${review.readinessLevel}`);

if (!outcome.ok) {
  process.exit(1);
}
