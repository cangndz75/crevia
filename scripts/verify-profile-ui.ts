/**
 * Profil ekranı UI görsel denge verify.
 * Çalıştır: npm run verify:profile-ui
 */

import { verifyProfileUiScenario } from '../src/features/profile/verifyProfileUiScenario';

const result = verifyProfileUiScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nProfile UI verify failed (${result.failCount} checks).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nProfile UI verify passed.');
