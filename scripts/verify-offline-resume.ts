/**
 * Offline / resume robustness verify.
 * Çalıştır: npm run verify:offline-resume
 */

import { verifyOfflineResumeScenario } from '../src/core/offlineResume/verifyOfflineResumeScenario';
import { runOfflineResumeAudit } from '../src/core/offlineResume/offlineResumeAudit';

const outcome = verifyOfflineResumeScenario();
const audit = runOfflineResumeAudit();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(`Release recommendation: ${audit.releaseRecommendation}`);
// eslint-disable-next-line no-console
console.log(`Fixed in pass: ${audit.fixedIssues.join(', ') || 'none'}`);

if (!outcome.ok) {
  process.exit(1);
}
