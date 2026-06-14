/**
 * Final UI visual unification analyzer.
 * Calistir: npm run analyze:final-ui-visual-unification
 */

import {
  analyzeFinalUiVisualUnification,
  verifyFinalUiVisualUnificationScenario,
} from '../src/features/finalUi/verifyFinalUiVisualUnificationScenario';

const analysis = analyzeFinalUiVisualUnification();
const verify = verifyFinalUiVisualUnificationScenario();

for (const line of analysis.lines) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('\n=== Snapshots ===');
for (const snapshot of analysis.snapshots) {
  // eslint-disable-next-line no-console
  console.log(
    `${snapshot.scenario}: cards=${snapshot.cardCount} large=${snapshot.largeCardCount} ` +
      `compact=${snapshot.compactInsightCount} dupes=${snapshot.duplicateTextCount} ` +
      `cta=${snapshot.ctaCount} a11yMissing=${snapshot.accessibilityMissingCount} ` +
      `motion=${snapshot.motionMarkerCount}`,
  );
}

// eslint-disable-next-line no-console
console.log(
  `\nVerify: ${verify.checks.filter((l) => l.startsWith('PASS')).length} PASS, ` +
    `${verify.checks.filter((l) => l.startsWith('FAIL')).length} FAIL`,
);

if (!analysis.ok || !verify.ok) {
  process.exit(1);
}
