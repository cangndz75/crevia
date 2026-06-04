/**
 * Çalıştır: npm run verify:profile-career-showcase
 */

import { verifyProfileCareerShowcaseScenario } from '../src/core/profile/verifyProfileCareerShowcaseScenario';

const result = verifyProfileCareerShowcaseScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nProfile career showcase verify failed (${result.failCount} checks).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nProfile career showcase verify passed.');
