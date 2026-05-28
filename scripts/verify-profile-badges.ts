/**
 * Profil rozet vitrini smoke doğrulaması.
 * Çalıştır: npm run verify:profile-badges
 */

import { verifyProfileBadgeScenario } from '../src/features/profile/utils/verifyProfileBadgeScenario';

const result = verifyProfileBadgeScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nProfile badge verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nProfile badge verify passed.');
