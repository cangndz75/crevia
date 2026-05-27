/**
 * Konteyner Aşama 1 smoke doğrulaması.
 * Çalıştır: npx tsx scripts/verify-container-scenario.ts
 */

import { runVerifyContainerScenario, verifyContainerScenario } from '../src/core/containers/verifyContainerScenario';

const result = verifyContainerScenario();
if (!result.ok) {
  console.error('Container verify failed:\n', result.checks.join('\n'));
  process.exit(1);
}

runVerifyContainerScenario();
