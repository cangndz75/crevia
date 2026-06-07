/**
 * Release Candidate Polish Pack verify.
 * Çalıştır: npm run verify:release-candidate-polish
 */

import { verifyReleaseCandidatePolishScenario } from '../src/core/releaseCandidatePolish/verifyReleaseCandidatePolishScenario';

const outcome = verifyReleaseCandidatePolishScenario();

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
