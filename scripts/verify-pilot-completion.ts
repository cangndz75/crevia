/**
 * Pilot completion + Ana Operasyon Önizleme bağlantı smoke doğrulaması.
 * Çalıştır: npm run verify:pilot-completion
 */

import { verifyPilotCompletionScenario } from '../src/core/pilotCompletion/verifyPilotCompletionScenario';

const result = verifyPilotCompletionScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nPilot completion verify failed (${result.failCount} FAIL).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(`\nPilot completion verify passed (${result.warnCount} WARN).`);
