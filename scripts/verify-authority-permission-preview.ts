/**
 * Yetki permission preview smoke doğrulaması.
 * Çalıştır: npm run verify:authority-permission-preview
 */

import { verifyAuthorityPermissionPreviewScenario } from '../src/core/authority/verifyAuthorityPermissionPreviewScenario';
import { verifyAuthorityPermissionShowcaseScenario } from '../src/core/authority/verifyAuthorityPermissionShowcaseScenario';

let failed = false;

const decisionResult = verifyAuthorityPermissionPreviewScenario();
for (const line of decisionResult.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}
if (!decisionResult.ok) {
  failed = true;
  // eslint-disable-next-line no-console
  console.error('\nAuthority decision permission preview verify failed.');
} else {
  // eslint-disable-next-line no-console
  console.log('\nAuthority decision permission preview verify passed.');
}

// eslint-disable-next-line no-console
console.log('\n--- Showcase ---\n');

const showcaseResult = verifyAuthorityPermissionShowcaseScenario();
for (const line of showcaseResult.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}
if (!showcaseResult.ok) {
  failed = true;
  // eslint-disable-next-line no-console
  console.error('\nAuthority permission showcase verify failed.');
} else {
  // eslint-disable-next-line no-console
  console.log('\nAuthority permission showcase verify passed.');
}

if (failed) {
  process.exit(1);
}
