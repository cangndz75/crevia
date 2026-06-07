/**
 * Release candidate audit verify.
 * Çalıştır: npm run verify:release-candidate
 */

import { buildReleaseCandidateConsoleSummary } from '../src/core/releaseCandidate/releaseCandidatePresentation';
import { runReleaseCandidateAudit } from '../src/core/releaseCandidate/releaseCandidateAudit';
import { verifyReleaseCandidateScenario } from '../src/core/releaseCandidate/verifyReleaseCandidateScenario';

const outcome = verifyReleaseCandidateScenario();
const audit = runReleaseCandidateAudit({ mode: 'internal_device_test' });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildReleaseCandidateConsoleSummary(audit));

if (!outcome.ok) {
  process.exit(1);
}
