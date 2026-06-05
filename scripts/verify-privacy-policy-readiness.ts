/**
 * Privacy policy & data safety draft readiness verify.
 * Çalıştır: npm run verify:privacy-policy-readiness
 */

import { runPrivacyPolicyReadinessAudit } from '../src/core/releaseReadiness/privacyPolicyReadinessAudit';
import { buildPrivacyPolicyReadinessConsoleSummary } from '../src/core/releaseReadiness/privacyPolicyReadinessPresentation';
import { verifyPrivacyPolicyReadinessScenario } from '../src/core/releaseReadiness/verifyPrivacyPolicyReadinessScenario';

const outcome = verifyPrivacyPolicyReadinessScenario();
const result = runPrivacyPolicyReadinessAudit({ mode: 'launch_candidate' });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildPrivacyPolicyReadinessConsoleSummary(result));
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);
// eslint-disable-next-line no-console
console.log(`Readiness health (launch_candidate): ${outcome.readinessHealth}`);
// eslint-disable-next-line no-console
console.log('NOTE: Draft only — not legal advice. Published URL is placeholder.');

if (!outcome.ok) {
  process.exit(1);
}
