/**
 * Privacy Policy + Data Safety Text Pack verify.
 * Çalıştır: npm run verify:privacy-policy-text
 */

import { runPrivacyPolicyTextAudit } from '../src/core/privacyPolicyText/privacyPolicyTextAudit';
import { buildPrivacyPolicyTextConsoleSummary } from '../src/core/privacyPolicyText/privacyPolicyTextPresentation';
import { verifyPrivacyPolicyTextScenario } from '../src/core/privacyPolicyText/verifyPrivacyPolicyTextScenario';

const outcome = verifyPrivacyPolicyTextScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildPrivacyPolicyTextConsoleSummary(runPrivacyPolicyTextAudit()));
