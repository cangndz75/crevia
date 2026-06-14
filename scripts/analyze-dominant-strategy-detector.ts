/**
 * Diagnostic analyzer for Dominant Strategy Detector.
 * Calistir: npm run analyze:dominant-strategy-detector
 */

import {
  buildDominantStrategyCardModels,
  buildDominantStrategyDetector,
  dominantStrategyCopySafe,
} from '../src/core/dominantStrategyDetector';
import type { DominantStrategyDetectorInput } from '../src/core/dominantStrategyDetector';

function decision(id: string, kind: string, districtId = 'sanayi', domainTag = kind, day = 8) {
  return { id, selectedDecisionKind: kind, decisionLabel: kind, districtId, domainTag, day, sourceIds: [id] };
}

function repeated(kind: string, count = 5, districtId = 'sanayi', domainTag = kind) {
  return Array.from({ length: count }, (_, index) => decision(`${kind}-${index}`, kind, districtId, domainTag, 8 + index));
}

const scenarios: Array<{ label: string; input: DominantStrategyDetectorInput }> = [
  { label: 'Day 1 hidden', input: { day: 1, decisionRecords: repeated('rapid_response') } },
  { label: 'Day 3 hidden', input: { day: 3, decisionRecords: repeated('rapid_response') } },
  { label: 'Day 4 low teaser', input: { day: 4, decisionRecords: repeated('rapid_response') } },
  { label: 'Day 8 no history', input: { day: 8 } },
  { label: 'Rapid response overuse', input: { day: 8, decisionRecords: repeated('rapid_response', 5, 'sanayi', 'route') } },
  { label: 'Public trust overfocus', input: { day: 8, decisionRecords: repeated('communication_first', 5, 'sanayi', 'trust') } },
  { label: 'District repetition', input: { day: 8, recentDistrictIds: ['sanayi', 'sanayi', 'sanayi', 'cumhuriyet', 'merkez'] } },
  { label: 'Route heavy repetition', input: { day: 8, decisionRecords: repeated('route_review', 5, 'sanayi', 'route') } },
  {
    label: 'Social pressure avoidance',
    input: {
      day: 8,
      decisionRecords: repeated('route_review', 4, 'sanayi', 'route'),
      day8StrategicContentHistory: [{ id: 'social-pressure', kind: 'social_trust_focus', sourceIds: ['social-pressure'] }],
    },
  },
  {
    label: 'Recovery opportunity neglect',
    input: {
      day: 8,
      decisionRecords: repeated('urgent_crisis', 4, 'sanayi', 'crisis'),
      followUpExecutionHistory: [{ id: 'recovery-source', kind: 'support_recovery', sourceIds: ['recovery-source'] }],
    },
  },
  { label: 'Resource saving overuse', input: { day: 8, decisionRecords: repeated('resource_saving', 5, 'sanayi', 'resource') } },
  { label: 'Balanced default overuse', input: { day: 8, decisionRecords: repeated('balanced_plan', 5, 'sanayi', 'balanced') } },
  {
    label: 'Inconsistent switching',
    input: {
      day: 8,
      decisionRecords: [
        decision('mix-a', 'rapid_response', 'sanayi', 'route'),
        decision('mix-b', 'balanced_plan', 'cumhuriyet', 'balanced'),
        decision('mix-c', 'resource_saving', 'merkez', 'resource'),
        decision('mix-d', 'communication_first', 'sahil', 'trust'),
        decision('mix-e', 'safe_watch', 'park', 'watch'),
      ],
    },
  },
  {
    label: 'Tie-break district vs recovery',
    input: {
      day: 8,
      decisionRecords: [
        ...repeated('urgent_crisis', 3, 'sanayi', 'crisis'),
        decision('tie-a', 'balanced_plan', 'cumhuriyet', 'balanced'),
        decision('tie-b', 'resource_saving', 'cumhuriyet', 'resource'),
        decision('tie-c', 'safe_watch', 'cumhuriyet', 'watch'),
      ],
      followUpExecutionHistory: [{ id: 'recovery-source', kind: 'support_recovery', sourceIds: ['recovery-source'] }],
    },
  },
  {
    label: 'Missing selectedDecisionKind safe fallback',
    input: {
      day: 8,
      decisionRecords: [
        { id: 'label-a', decisionLabel: 'Hizli saha cevabi', sourceIds: ['label-a'] },
        { id: 'label-b', decisionLabel: 'Hizli rota cevabi', sourceIds: ['label-b'] },
        { id: 'label-c', decisionLabel: 'Hizli ekip cevabi', sourceIds: ['label-c'] },
      ],
    },
  },
];

let hasFail = false;
let hasWarn = false;

for (const scenario of scenarios) {
  const result = buildDominantStrategyDetector(scenario.input);
  const cards = buildDominantStrategyCardModels(result);
  // eslint-disable-next-line no-console
  console.log(`\n=== ${scenario.label} ===`);
  // eslint-disable-next-line no-console
  console.log(
    `pattern=${result.pattern} confidence=${result.confidence} visible=${result.isVisible} signals=${result.signals.length} visibility=${result.hubCandidate?.visibilityLevel ?? 'hidden'}`,
  );
  // eslint-disable-next-line no-console
  console.log(`counter=${result.counterSignalLine ?? 'none'}`);
  // eslint-disable-next-line no-console
  console.log(`sources=${result.sourceIds.join(',') || 'none'}`);
  // eslint-disable-next-line no-console
  console.log(`preview=${cards[0]?.line ?? 'none'}`);

  if (scenario.input.day < 4 && result.isVisible) {
    // eslint-disable-next-line no-console
    console.log('FAIL Day <4 visible');
    hasFail = true;
  }
  if (scenario.label === 'Day 8 no history' && (result.pattern !== 'none' || result.isVisible)) {
    // eslint-disable-next-line no-console
    console.log('FAIL history yokken strong claim');
    hasFail = true;
  }
  if (result.confidence === 'high' && result.signals.length < 2) {
    // eslint-disable-next-line no-console
    console.log('FAIL high confidence with weak signals');
    hasFail = true;
  }
  if (!dominantStrategyCopySafe(result)) {
    // eslint-disable-next-line no-console
    console.log('FAIL shame/technical copy');
    hasFail = true;
  }
  if (new Set(result.sourceIds).size !== result.sourceIds.length) {
    // eslint-disable-next-line no-console
    console.log('FAIL duplicate sourceIds');
    hasFail = true;
  }
  if (result.pattern === 'none' && scenario.input.day >= 8 && scenario.label !== 'Day 8 no history') {
    // eslint-disable-next-line no-console
    console.log('WARN scenario did not produce a pattern');
    hasWarn = true;
  }
}

// eslint-disable-next-line no-console
console.log('\n--- Summary ---');
// eslint-disable-next-line no-console
console.log(hasFail ? 'FAIL detected' : hasWarn ? 'WARN detected' : 'PASS');
if (hasFail) process.exit(1);
