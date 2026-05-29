/**
 * Meta progression QA + balance audit.
 * Çalıştır: npm run verify:meta-progression
 */

import { verifyMetaProgressionScenario } from '../src/core/metaProgression/verifyMetaProgressionScenario';

const result = verifyMetaProgressionScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('\n--- Meta Progression Audit ---');
// eslint-disable-next-line no-console
console.log(
  `average daily authority trust gain: ${result.analytics.averageDailyAuthorityTrustGain}`,
);
// eslint-disable-next-line no-console
console.log(
  `earned badge count after pilot: ${result.analytics.earnedBadgeCountAfterPilot}`,
);
// eslint-disable-next-line no-console
console.log(`final formalRankId: ${result.analytics.finalFormalRankId}`);
// eslint-disable-next-line no-console
console.log(
  `progression primary preview: ${result.analytics.progressionPrimaryPreview}`,
);
// eslint-disable-next-line no-console
console.log(`warning count: ${result.analytics.warningCount}`);
if (result.analytics.warnings.length > 0) {
  for (const warning of result.analytics.warnings) {
    // eslint-disable-next-line no-console
    console.log(`  warn: ${warning}`);
  }
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nMeta progression verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nMeta progression verify passed.');
