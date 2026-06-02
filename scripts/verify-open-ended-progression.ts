/**
 * Açık uçlu progression verify.
 * Çalıştır: npm run verify:open-ended-progression
 */

import { verifyOpenEndedProgressionScenario } from '../src/core/openEndedProgression/verifyOpenEndedProgressionScenario';

const outcome = verifyOpenEndedProgressionScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

for (const finding of outcome.findings.slice(0, 30)) {
  if (finding.status !== 'PASS') {
    // eslint-disable-next-line no-console
    console.log(`${finding.status} ${finding.message} ${finding.details?.join(', ') ?? ''}`);
  }
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length + outcome.findings.filter((f) => f.status === 'WARN').length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length + outcome.findings.filter((f) => f.status === 'FAIL').length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}
