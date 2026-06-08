import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  verifyDecisionImpactExplanationScenario,
} from '../src/core/decisionImpactExplanation/verifyDecisionImpactExplanationScenario';

const result = verifyDecisionImpactExplanationScenario();
const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

function record(label: string, condition: boolean, detail?: string): void {
  result.checks.push(condition ? `✓ ${label}` : `✗ ${label}${detail ? `: ${detail}` : ''}`);
}

const resultScreen = read('src/features/events/screens/DecisionResultScreen.tsx');
const reportView = read('src/features/reports/components/end-of-day/EndOfDayReportView.tsx');
const hubScreen = read('src/features/hub/screens/HubScreen.tsx');
const hubHome = read('src/features/hub/components/HubReferenceHome.tsx');
const packageJson = read('package.json');
const docs = read('docs/crevia-decision-impact-explanation.md');
const persist = read('src/store/gamePersist.ts');
const applyDecision = read('src/core/game/applyDecision.ts');
const dayPipeline = read('src/core/game/ensureDailyEventsForDay.ts');

record('result screen integration var', resultScreen.includes('EventResultImpactExplanationCard'));
record('report echo integration var', reportView.includes('decisionImpactReportEcho'));
record('hub carry-over echo integration var', hubScreen.includes('hubImpactExplanationLine') && hubHome.includes('previousImpactLine'));
record('SAVE_VERSION 25', persist.includes('export const SAVE_VERSION = 25;'));
record('applyDecision değiştirilmedi', !applyDecision.includes('decisionImpactExplanation'));
record('event generation değiştirilmedi', !dayPipeline.includes('decisionImpactExplanation'));
record('package.json script var', packageJson.includes('"verify:decision-impact-explanation"'));
record('docs dosyası var', docs.includes('Decision Impact Explanation'));

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.checks.every((line) => line.startsWith('✓'))) {
  // eslint-disable-next-line no-console
  console.error('\nDecision impact explanation verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nDecision impact explanation verify passed.');
