import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { verifyCityEchoBindingScenario } from '../src/core/cityEchoBinding/verifyCityEchoBindingScenario';

const result = verifyCityEchoBindingScenario();
const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

function record(label: string, condition: boolean, detail?: string): void {
  result.checks.push(condition ? `✓ ${label}` : `✗ ${label}${detail ? `: ${detail}` : ''}`);
}

const advisor = read('src/features/hub/components/HubAdvisorCard.tsx');
const social = read('src/features/social/utils/socialPulsePresentation.ts');
const report = read('src/features/reports/components/end-of-day/EndOfDayReportView.tsx');
const hub = read('src/features/hub/screens/HubScreen.tsx');
const packageJson = read('package.json');
const docs = read('docs/crevia-city-echo-binding.md');
const persist = read('src/store/gamePersist.ts');
const applyDecision = read('src/core/game/applyDecision.ts');
const dayPipeline = read('src/core/game/ensureDailyEventsForDay.ts');

record('Ece integration helper var', advisor.includes('buildCityEchoAdvisorLine'));
record('Social Pulse integration helper var', social.includes('buildCityEchoSocialLine'));
record('Report integration helper var', report.includes('buildCityEchoReportLine'));
record('Hub compact integration helper var', hub.includes('buildCityEchoHubLine'));
record('Decision Impact Explanation ile bağ kuruluyor', report.includes('buildDecisionImpactExplanation') && hub.includes('buildDecisionImpactExplanationForHub'));
record('Tomorrow Risk ile bağ kuruluyor', report.includes('tomorrowRiskPresentation') && hub.includes('tomorrowRiskPresentation'));
record('SAVE_VERSION değişmedi', persist.includes('export const SAVE_VERSION = 23;'));
record('applyDecision değişmedi', !applyDecision.includes('cityEchoBinding'));
record('event generation değişmedi', !dayPipeline.includes('cityEchoBinding'));
record('package.json script var', packageJson.includes('"verify:city-echo-binding"'));
record('docs var', docs.includes('City Echo Binding'));

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.checks.every((line) => line.startsWith('✓'))) {
  // eslint-disable-next-line no-console
  console.error('\nCity echo binding verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nCity echo binding verify passed.');
