/**
 * City Memory Visibility analyzer.
 * Calistir: npm run analyze:city-memory-visibility
 */

import { buildCityMemoryVisibility } from '../src/core/cityMemoryVisibility/cityMemoryVisibilityModel';
import type { CityMemoryVisibilityInput } from '../src/core/cityMemoryVisibility/cityMemoryVisibilityTypes';
import { CITY_MEMORY_TECHNICAL_TOKEN_PATTERN } from '../src/core/cityMemoryVisibility/cityMemoryVisibilityConstants';

type Scenario = { label: string; input: CityMemoryVisibilityInput };

const scenarios: Scenario[] = [
  { label: 'Day 1 no memory', input: { day: 1 } },
  {
    label: 'Day 3 decision consequence',
    input: {
      day: 3,
      decisionConsequenceThreads: [
        { id: 'd3', causalLine: 'Bu karar sonraki gunlerde tekrar okunabilir.', sourceIds: ['d3'] },
      ],
    },
  },
  {
    label: 'Day 7 carry-over',
    input: {
      day: 7,
      carryOverSignals: [{ id: 'c7', text: 'Onceki kararin etkisi bugune tasinmis olabilir.', sourceIds: ['c7'] }],
    },
  },
  {
    label: 'Day 8 district memory',
    input: {
      day: 8,
      districtMemorySignals: [
        {
          id: 'dm8',
          advisorLine: 'Bu mahalle onceki kararlarla yeniden anlam kazaniyor.',
          districtId: 'cumhuriyet',
          sourceIds: ['dm8'],
        },
      ],
    },
  },
  {
    label: 'Day 8 story chain',
    input: {
      day: 8,
      storyChains: [
        {
          chainId: 'sc8',
          playerVisibleTitle: 'Zincir',
          reportLine: 'Bu olay zinciri sehir hafizasinda ilerliyor.',
          sourceIds: ['sc8'],
        },
      ],
    },
  },
  {
    label: 'Day 10 city archive + map trace',
    input: {
      day: 10,
      cityArchiveEntries: [
        { id: 'a10', title: 'Arsiv', shortLine: 'Sehir arsivi bu karari kaydetti.', isPlayerVisible: true, sourceIds: ['a10'] },
      ],
      mapGameplayBindings: [
        { id: 'm10', role: 'district_memory_trace', mapLine: 'Haritadaki bu iz, onceki kararin sehirdeki karsiligi.', sourceIds: ['m10'] },
      ],
    },
  },
  {
    label: 'Low confidence district personality only',
    input: {
      day: 8,
      districtPersonalityProfiles: [
        {
          districtId: 'sanayi',
          districtName: 'Sanayi',
          criteria: [{ id: 'operation_history_weight', band: 'high', score: 80 }],
          sourceIds: ['sanayi'],
        },
      ],
    },
  },
  {
    label: 'Duplicate with oneMoreDay',
    input: {
      day: 8,
      decisionConsequenceThreads: [
        { id: 'dup', causalLine: 'Ayni iz yarin takip edilebilir.', sourceIds: ['dup'] },
      ],
      oneMoreDayRetentionResult: {
        primaryHook: { id: 'dup', line: 'Ayni iz yarin takip edilebilir.', sourceIds: ['dup'] },
      },
    },
  },
  {
    label: 'Duplicate with Ece',
    input: {
      day: 8,
      decisionConsequenceThreads: [
        { id: 'ece-dup', causalLine: 'Ece zaten bu izi soyledi.', sourceIds: ['ece-dup'] },
      ],
      eceStrategyLineResult: {
        primaryLine: {
          text: 'Ece zaten bu izi soyledi.',
          sourceKinds: ['decision_consequence'],
          sourceIds: ['ece-dup'],
          confidence: 'high',
        },
      },
    },
  },
];

let hasWarn = false;
let hasFail = false;

// eslint-disable-next-line no-console
console.log('=== City Memory Visibility Analyzer ===\n');

for (const scenario of scenarios) {
  const result = buildCityMemoryVisibility(scenario.input);
  const lines = result.traces.map((trace) => trace.line);
  const uniqueLines = new Set(lines.map((line) => line.toLowerCase()));

  // eslint-disable-next-line no-console
  console.log(`--- ${scenario.label} (Day ${scenario.input.day}) ---`);
  // eslint-disable-next-line no-console
  console.log(`traces: ${result.traces.length} | primary: ${result.primaryTrace?.kind ?? 'none'}`);
  for (const trace of result.traces) {
    // eslint-disable-next-line no-console
    console.log(`  [${trace.kind}] ${trace.line.slice(0, 72)}`);
  }

  if (scenario.input.day <= 1 && result.traces.length > 1) {
    // eslint-disable-next-line no-console
    console.log('WARN Day 1 not low-noise');
    hasWarn = true;
  }
  if (scenario.input.day >= 8 && scenario.label.includes('district memory') && result.traces.length === 0) {
    // eslint-disable-next-line no-console
    console.log('WARN Day 8+ source without trace');
    hasWarn = true;
  }
  if (result.traces.length > 3) {
    // eslint-disable-next-line no-console
    console.log('FAIL max 3 trace exceeded');
    hasFail = true;
  }
  if (lines.length !== uniqueLines.size) {
    // eslint-disable-next-line no-console
    console.log('FAIL duplicate exact line');
    hasFail = true;
  }
  for (const trace of result.traces) {
    if (CITY_MEMORY_TECHNICAL_TOKEN_PATTERN.test(trace.line)) {
      // eslint-disable-next-line no-console
      console.log(`FAIL technical enum: ${trace.line}`);
      hasFail = true;
    }
    if (!trace.sourceIds.length && !trace.isFallback) {
      // eslint-disable-next-line no-console
      console.log('FAIL fake memory without source');
      hasFail = true;
    }
  }
  if (scenario.label.includes('story chain') && result.traces.some((t) => t.kind === 'story_chain_trace') === false) {
    // eslint-disable-next-line no-console
    console.log('FAIL story source without story trace');
    hasFail = true;
  }
  if (scenario.label.includes('map trace') && !result.mapTrace) {
    // eslint-disable-next-line no-console
    console.log('WARN map source without map trace');
    hasWarn = true;
  }
  if (
    scenario.input.day >= 8 &&
    !scenario.label.includes('only') &&
    !scenario.label.includes('Duplicate') &&
    !scenario.label.includes('Day 1') &&
    result.traces.every((trace) => trace.isFallback)
  ) {
    // eslint-disable-next-line no-console
    console.log('WARN Day 8+ fell back despite sources');
    hasWarn = true;
  }
}

// eslint-disable-next-line no-console
console.log('\n--- Analyzer result ---');
if (hasFail) {
  // eslint-disable-next-line no-console
  console.log('FAIL');
  process.exit(1);
}
if (hasWarn) {
  // eslint-disable-next-line no-console
  console.log('WARN');
  process.exit(0);
}
// eslint-disable-next-line no-console
console.log('PASS');
