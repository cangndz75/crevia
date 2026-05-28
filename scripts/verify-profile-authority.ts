/**
 * Profil yetki kartı smoke doğrulaması.
 * Çalıştır: npm run verify:profile-authority
 */

import { verifyProfileAuthorityScenario } from '../src/features/profile/utils/verifyProfileAuthorityScenario';

const result = verifyProfileAuthorityScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nProfile authority verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nProfile authority verify passed.');
