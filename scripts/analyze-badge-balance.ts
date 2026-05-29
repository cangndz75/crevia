/**
 * Rozet ekonomisi denge analizi.
 * Çalıştır: npm run analyze:badges
 */

import { analyzeBadgeBalance } from '../src/core/badges/badgeBalanceSimulation';

const analysis = analyzeBadgeBalance();

for (const scenario of analysis.scenarios) {
  // eslint-disable-next-line no-console
  console.log(`\n[${scenario.status}] ${scenario.scenarioId}`);
  // eslint-disable-next-line no-console
  console.log(`  earnedBadgeCount: ${scenario.earnedBadgeCount}`);
  // eslint-disable-next-line no-console
  console.log(`  earnedBadgeIds: ${scenario.earnedBadgeIds.join(', ') || '—'}`);
  // eslint-disable-next-line no-console
  console.log(
    `  progressNearCompletion: ${
      scenario.progressNearCompletion.length > 0
        ? scenario.progressNearCompletion
            .map((item) => `${item.badgeId} ${item.current}/${item.target}`)
            .join(', ')
        : '—'
    }`,
  );
  // eslint-disable-next-line no-console
  console.log(`  rareBadgeCount: ${scenario.rareBadgeCount}`);
  // eslint-disable-next-line no-console
  console.log(`  epicBadgeCount: ${scenario.epicBadgeCount}`);
  if (scenario.warnings.length > 0) {
    for (const warning of scenario.warnings) {
      // eslint-disable-next-line no-console
      console.log(`  warn: ${warning}`);
    }
  }
}

// eslint-disable-next-line no-console
console.log('\n--- Badge Balance Summary ---');
// eslint-disable-next-line no-console
console.log(`overall: ${analysis.ok ? 'PASS' : 'FAIL'}`);
// eslint-disable-next-line no-console
console.log(`warning count: ${analysis.warnings.length}`);

if (!analysis.ok) {
  // eslint-disable-next-line no-console
  console.error('\nBadge balance analysis failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nBadge balance analysis passed.');
