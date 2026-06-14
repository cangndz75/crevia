/**
 * Hub Portfolio Surface Lite verify.
 * Calistir: npm run verify:hub-portfolio-surface
 */

import { verifyHubPortfolioSurfaceScenario } from '../src/features/hub/verifyHubPortfolioSurfaceScenario';

const outcome = verifyHubPortfolioSurfaceScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((line) => line.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((line) => line.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}
