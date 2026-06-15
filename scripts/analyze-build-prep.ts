/**
 * EAS / store build prep analyzer.
 * Calistir: npm run analyze:build-prep
 */

import {
  buildBuildPrepConsoleSummary,
  runBuildPrepAudit,
} from '../src/core/buildPrep/buildPrepAudit';

const result = runBuildPrepAudit();

// eslint-disable-next-line no-console
console.log(buildBuildPrepConsoleSummary(result));

if (result.health === 'fail') {
  process.exit(1);
}
