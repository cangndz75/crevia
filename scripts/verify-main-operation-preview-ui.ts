/**
 * Ana Operasyon Önizlemesi referans UI verify.
 * Çalıştır: npx tsx scripts/verify-main-operation-preview-ui.ts
 */

import { verifyMainOperationPreviewUiScenario } from '../src/features/pilot/verifyMainOperationPreviewUiScenario';

const result = verifyMainOperationPreviewUiScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nMain operation preview UI verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nMain operation preview UI verify passed.');
