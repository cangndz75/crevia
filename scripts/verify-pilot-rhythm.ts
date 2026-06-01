/**
 * Pilot rhythm doğrulaması: event generation rhythm + daily theme rhythm.
 * Çalıştır: npm run verify:pilot-rhythm
 */

import { verifyPilotRhythmScenario as verifyEventPilotRhythm } from '../src/core/events/verifyPilotRhythmScenario';
import { verifyPilotThemeRhythmScenario } from '../src/core/pilotRhythm/verifyPilotRhythmScenario';

function runSection(
  label: string,
  result: { ok: boolean; warn?: boolean; checks: string[] },
): { ok: boolean; warn: boolean } {
  // eslint-disable-next-line no-console
  console.log(`\n=== ${label} ===\n`);
  for (const line of result.checks) {
    // eslint-disable-next-line no-console
    console.log(line);
  }
  const passCount = result.checks.filter((c) => c.startsWith('PASS') || c.startsWith('✓')).length;
  const warnCount = result.checks.filter((c) => c.startsWith('WARN')).length;
  const failCount = result.checks.filter((c) => c.startsWith('FAIL') || c.startsWith('✗')).length;
  // eslint-disable-next-line no-console
  console.log(`\n${label} summary: ${passCount} pass, ${warnCount} warn, ${failCount} fail`);
  return { ok: result.ok, warn: result.warn === true };
}

const themeResult = verifyPilotThemeRhythmScenario();
const eventResult = verifyEventPilotRhythm();

const theme = runSection('Daily Theme Rhythm', themeResult);
const events = runSection('Event Generation Rhythm', eventResult);

// eslint-disable-next-line no-console
console.log('');

if (!theme.ok || !events.ok) {
  // eslint-disable-next-line no-console
  console.error('\nPilot rhythm verify FAILED.');
  process.exit(1);
}

if (theme.warn || events.warn) {
  // eslint-disable-next-line no-console
  console.warn('\nPilot rhythm verify passed with WARN.');
} else {
  // eslint-disable-next-line no-console
  console.log('\nPilot rhythm verify PASS.');
}
