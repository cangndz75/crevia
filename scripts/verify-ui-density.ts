/**
 * UI density + large text + accessibility polish verify.
 * Çalıştır: npm run verify:ui-density
 */

import { verifyUiDensityScenario } from '../src/core/uiDensity/verifyUiDensityScenario';
import { runUiDensityAudit } from '../src/core/uiDensity/uiDensityAudit';

const outcome = verifyUiDensityScenario();
const audit = runUiDensityAudit();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(`Fixed: ${audit.fixedIssues.join(', ') || 'none'}`);

if (!outcome.ok) {
  process.exit(1);
}
