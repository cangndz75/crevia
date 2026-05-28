/**
 * Onboarding / First 10 Minutes smoke doğrulaması.
 * Çalıştır: npm run verify:onboarding
 */

import { verifyOnboardingScenario } from '../src/core/onboarding/verifyOnboardingScenario';
import { verifyHubUiPresentationScenario } from '../src/features/hub/verifyHubUiPresentationScenario';

const result = verifyOnboardingScenario();
const hubUi = verifyHubUiPresentationScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

for (const line of hubUi.checks) {
  // eslint-disable-next-line no-console
  console.log(`[hub-ui] ${line}`);
}

// eslint-disable-next-line no-console
console.log('\nMetrics:', result.metrics);

if (!result.ok || !hubUi.ok) {
  // eslint-disable-next-line no-console
  console.error(
    `\nOnboarding verify failed (onboarding=${result.failCount}, hub-ui=${hubUi.failCount} FAIL).`,
  );
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(`\nOnboarding verify passed (${result.warnCount} WARN).`);
