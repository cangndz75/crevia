/**
 * Onboarding / First 10 Minutes smoke doğrulaması.
 * Çalıştır: npm run verify:onboarding
 */

import { verifyOnboardingScenario } from '../src/core/onboarding/verifyOnboardingScenario';

const result = verifyOnboardingScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('\nMetrics:', result.metrics);

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nOnboarding verify failed (${result.failCount} FAIL).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(`\nOnboarding verify passed (${result.warnCount} WARN).`);
