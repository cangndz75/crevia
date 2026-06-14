/**
 * Prints deterministic Ece strategy line scenarios.
 * Calistir: npm run analyze:ece-strategy-lines
 */

import { buildEceStrategyLineResult } from '../src/core/eceStrategyLines/eceStrategyLineModel';
import type { EceStrategyLineInput } from '../src/core/eceStrategyLines/eceStrategyLineTypes';

type Scenario = {
  name: string;
  input: EceStrategyLineInput;
};

const scenarios: Scenario[] = [
  { name: 'day-1-fallback', input: { day: 1 } },
  {
    name: 'retention-priority',
    input: {
      day: 8,
      oneMoreDayRetentionResult: {
        primaryHook: {
          id: 'retention',
          tomorrowLine: 'Yarin ayni hatta kisa bir devam hamlesi sec.',
          sourceIds: ['retention'],
        },
      },
    },
  },
  {
    name: 'portfolio-defer',
    input: {
      day: 8,
      portfolioDeferRiskResult: {
        tomorrowActionLine: 'Secmedigin sinyal yarin ilk kontrol edilecek alan olsun.',
        sourceIds: ['defer'],
      },
    },
  },
  {
    name: 'memory-map-resource-style',
    input: {
      day: 10,
      districtMemorySignals: [{ line: 'Sehir hafizasi bu bolgeyi tekrar isaret ediyor.' }],
      mapGameplayBindings: [{ mapLine: 'Haritadaki baski tek noktada toplanmis.' }],
      resourcePressureSignals: [{ warningLine: 'Kaynak sikisikligi buyumeden kisa hamle sec.' }],
      playerStyleInsight: {
        visible: true,
        confidence: 'high',
        advisorLine: 'Karar tarzinda sakin takip gucleniyor.',
      },
    },
  },
  {
    name: 'duplicate-guard',
    input: {
      day: 8,
      oneMoreDayRetentionResult: {
        primaryHook: {
          id: 'retention',
          tomorrowLine: 'Yarin ayni hatta kisa bir devam hamlesi sec.',
          sourceIds: ['retention'],
        },
      },
      portfolioDeferRiskResult: {
        tomorrowActionLine: 'Secmedigin sinyal yarin ilk kontrol edilecek alan olsun.',
        sourceIds: ['defer'],
      },
      recentLineTexts: ['Yarin ayni hatta kisa bir devam hamlesi sec.'],
    },
  },
];

const technicalPattern = /\b[a-z]+_[a-z_]+\b/;
let hasIssue = false;

for (const scenario of scenarios) {
  const result = buildEceStrategyLineResult(scenario.input);
  const lines = [
    ['primary', result.primaryLine],
    ['secondary', result.secondaryLine],
    ['report', result.reportLine],
    ['continuation', result.continuationLine],
  ] as const;

  // eslint-disable-next-line no-console
  console.log(`\nScenario: ${scenario.name}`);
  for (const [slot, line] of lines) {
    if (!line) continue;
    const flags: string[] = [];
    if (line.text.length > 120) flags.push('long');
    if (technicalPattern.test(line.text)) flags.push('technical-token');
    if (line.tone === 'warning' && slot !== 'primary') flags.push('warning-secondary');
    if (flags.length > 0) hasIssue = true;
    // eslint-disable-next-line no-console
    console.log(
      `${slot}: [${line.tone}] ${line.text} | source=${line.sourceKinds.join(',')} | flags=${flags.join(',') || 'none'}`,
    );
  }
}

// eslint-disable-next-line no-console
console.log(`\n${hasIssue ? 'WARN' : 'PASS'} Ece strategy line analysis complete.`);

if (hasIssue) {
  process.exitCode = 1;
}
