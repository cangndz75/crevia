/**
 * Yetki permission preview smoke doğrulaması.
 * Çalıştır: npm run verify:authority-permission-preview
 */

import { verifyAuthorityPermissionPreviewScenario } from '../src/core/authority/verifyAuthorityPermissionPreviewScenario';

const result = verifyAuthorityPermissionPreviewScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nAuthority permission preview verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nAuthority permission preview verify passed.');
