import { existsSync, readFileSync } from 'node:fs';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import {
  appendStrategyDecisionRecord,
  buildDominantStrategyInputFromPersistedHistory,
  createEmptyStrategyHistoryState,
} from '@/core/strategyHistory/strategyHistoryModel';
import { buildStrategyDecisionRecordFromDecisionRecord } from '@/core/strategyHistory/strategyHistoryAdapters';

import {
  DOMINANT_STRATEGY_MAX_SIGNALS,
  DOMINANT_STRATEGY_PATTERNS,
} from './dominantStrategyDetectorConstants';
import {
  buildDominantStrategyCardModels,
  buildDominantStrategyDetector,
  buildEceDominantStrategyLine,
  buildHubDominantStrategyHint,
  buildReportDominantStrategyNote,
  dominantStrategyCopySafe,
} from './index';
import type {
  DominantStrategyDetectorInput,
  DominantStrategyDetectorResult,
  DominantStrategyPattern,
} from './dominantStrategyDetectorTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;
const TECHNICAL_ENUM_PATTERN = /\b[a-z]+_[a-z_]+\b/;

export type VerifyDominantStrategyDetectorOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function assert(checks: string[], pass: boolean, ok: string, fail: string): boolean {
  checks.push(pass ? `PASS ${ok}` : `FAIL ${fail}`);
  return pass;
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function decision(id: string, kind: string, districtId = 'sanayi', domainTag = kind, day = 8) {
  return {
    id,
    selectedDecisionKind: kind,
    decisionLabel: kind,
    districtId,
    districtName: districtId === 'sanayi' ? 'Sanayi' : 'Cumhuriyet',
    domainTag,
    day,
    sourceIds: [id],
  };
}

function repeated(kind: string, count = 5, districtId = 'sanayi', domainTag = kind) {
  return Array.from({ length: count }, (_, index) =>
    decision(`${kind}-${index}`, kind, districtId, domainTag, 8 + index),
  );
}

function inputFor(pattern: DominantStrategyPattern): DominantStrategyDetectorInput {
  switch (pattern) {
    case 'rapid_response_overuse':
      return { day: 8, decisionRecords: repeated('rapid_response', 5, 'sanayi', 'route') };
    case 'preventive_overuse':
      return { day: 8, decisionRecords: repeated('safe_watch', 5, 'sanayi', 'watch') };
    case 'balanced_default_overuse':
      return { day: 8, decisionRecords: repeated('balanced_plan', 5, 'sanayi', 'balanced') };
    case 'resource_saving_overuse':
      return { day: 8, decisionRecords: repeated('resource_saving', 5, 'sanayi', 'resource') };
    case 'public_trust_overfocus':
      return { day: 8, decisionRecords: repeated('communication_first', 5, 'sanayi', 'trust') };
    case 'crisis_priority_overfocus':
      return { day: 8, decisionRecords: repeated('urgent_crisis', 5, 'sanayi', 'crisis') };
    case 'district_repetition':
      return {
        day: 8,
        decisionRecords: [
          decision('district-a', 'balanced_plan', 'sanayi', 'container'),
          decision('district-b', 'resource_saving', 'sanayi', 'resource'),
          decision('district-c', 'rapid_response', 'sanayi', 'route'),
          decision('district-d', 'safe_watch', 'sanayi', 'watch'),
          decision('district-e', 'communication_first', 'cumhuriyet', 'trust'),
        ],
      };
    case 'route_heavy_repetition':
      return { day: 8, decisionRecords: repeated('route_review', 5, 'sanayi', 'route') };
    case 'social_pressure_avoidance':
      return {
        day: 8,
        decisionRecords: repeated('route_review', 4, 'sanayi', 'route'),
        day8StrategicContentHistory: [
          { id: 'social-pressure', kind: 'social_trust_focus', title: 'Sosyal sinyal', sourceIds: ['social-pressure'] },
        ],
      };
    case 'recovery_opportunity_neglect':
      return {
        day: 8,
        decisionRecords: repeated('urgent_crisis', 4, 'sanayi', 'crisis'),
        followUpExecutionHistory: [
          { id: 'recovery-source', kind: 'support_recovery', title: 'Toparlanma', sourceIds: ['recovery-source'] },
        ],
      };
    case 'inconsistent_switching':
      return {
        day: 8,
        decisionRecords: [
          decision('mix-a', 'rapid_response', 'sanayi', 'route'),
          decision('mix-b', 'balanced_plan', 'cumhuriyet', 'balanced'),
          decision('mix-c', 'resource_saving', 'merkez', 'resource'),
          decision('mix-d', 'communication_first', 'sahil', 'trust'),
          decision('mix-e', 'safe_watch', 'park', 'watch'),
        ],
      };
    default:
      return { day: 8 };
  }
}

function validateResult(checks: string[], result: DominantStrategyDetectorResult): boolean {
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };
  record(assert(checks, DOMINANT_STRATEGY_PATTERNS.includes(result.pattern), `${result.pattern} taxonomy`, `${result.pattern} invalid`));
  record(assert(checks, result.signals.length <= DOMINANT_STRATEGY_MAX_SIGNALS, `${result.pattern} max signal`, `${result.pattern} too many signals`));
  record(assert(checks, unique(result.sourceIds), `${result.pattern} source unique`, `${result.pattern} duplicate sourceIds`));
  record(assert(checks, ['low', 'medium', 'high'].includes(result.confidence), `${result.pattern} confidence clamp`, `${result.pattern} confidence invalid`));
  record(assert(checks, dominantStrategyCopySafe(result), `${result.pattern} no shame language`, `${result.pattern} unsafe copy`));
  record(assert(checks, !TECHNICAL_ENUM_PATTERN.test(`${result.title} ${result.line} ${result.counterSignalLine ?? ''}`), `${result.pattern} no technical enum`, `${result.pattern} technical enum leaked`));
  return ok;
}

export function verifyDominantStrategyDetectorScenario(): VerifyDominantStrategyDetectorOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  const modelFile = readRepo('src/core/dominantStrategyDetector/dominantStrategyDetectorModel.ts');
  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION 27', `SAVE_VERSION ${SAVE_VERSION}`));
  record(assert(checks, readRepo('src/store/gamePersist.ts').includes('strategyHistory'), 'strategyHistory persisted', 'strategyHistory missing'));
  record(assert(checks, readRepo('src/store/useGameStore.ts').includes('strategyHistory'), 'store has strategyHistory', 'strategyHistory store missing'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('dominantStrategy'), 'applyDecision unchanged', 'applyDecision wired'));
  record(assert(checks, !modelFile.includes('ensureDailyEventsForDay'), 'day pipeline unchanged', 'day pipeline wired'));
  record(assert(checks, !modelFile.includes('scoreBoost'), 'event/resource mutation absent', 'mutation-looking boost found'));

  for (const day of [1, 2, 3]) {
    const result = buildDominantStrategyDetector({ ...inputFor('rapid_response_overuse'), day });
    record(assert(checks, !result.isVisible && result.pattern === 'rapid_response_overuse', `Day ${day} hidden`, `Day ${day} visible`));
  }

  const day4 = buildDominantStrategyDetector({ ...inputFor('rapid_response_overuse'), day: 4 });
  record(assert(checks, day4.eceCandidate?.visibilityLevel === 'teaser', 'Day 4-7 teaser', 'Day 4 not teaser'));
  record(assert(checks, day4.confidence !== 'high', 'Day 4-7 no high confidence', 'Day 4 high confidence'));

  const noHistory = buildDominantStrategyDetector({ day: 8 });
  record(assert(checks, noHistory.pattern === 'none' && !noHistory.isVisible, 'Day 8 no history none/hidden', `Day 8 no history ${noHistory.pattern}`));

  let persistedHistory = createEmptyStrategyHistoryState();
  for (const record of repeated('rapid_response', 5, 'sanayi', 'route')) {
    persistedHistory = appendStrategyDecisionRecord(
      persistedHistory,
      buildStrategyDecisionRecordFromDecisionRecord({
        id: record.id,
        day: record.day,
        eventId: record.id,
        eventTitle: 'Rota baskisi',
        decisionId: record.id,
        decisionLabel: 'Hizli rota cevabi',
        neighborhoodId: record.districtId,
        neighborhoodName: record.districtName,
        appliedEffects: { publicSatisfaction: 2 },
        createdAt: '2026-06-15T00:00:00.000Z',
      }, { domainTags: [record.domainTag] }),
    );
  }
  const fromPersisted = buildDominantStrategyDetector(
    buildDominantStrategyInputFromPersistedHistory(persistedHistory, 12),
  );
  record(assert(checks, fromPersisted.pattern === 'rapid_response_overuse', 'persisted strategy history adapter', `persisted -> ${fromPersisted.pattern}`));

  for (const pattern of [
    'rapid_response_overuse',
    'public_trust_overfocus',
    'district_repetition',
    'route_heavy_repetition',
    'social_pressure_avoidance',
    'recovery_opportunity_neglect',
    'inconsistent_switching',
    'resource_saving_overuse',
    'balanced_default_overuse',
    'preventive_overuse',
    'crisis_priority_overfocus',
  ] as const) {
    const result = buildDominantStrategyDetector(inputFor(pattern));
    record(assert(checks, result.pattern === pattern, `${pattern} detected`, `${pattern} -> ${result.pattern}`));
    record(validateResult(checks, result));
  }

  const tie = buildDominantStrategyDetector({
    day: 8,
    decisionRecords: [
      ...repeated('urgent_crisis', 3, 'sanayi', 'crisis'),
      decision('tie-district-a', 'balanced_plan', 'cumhuriyet', 'balanced'),
      decision('tie-district-b', 'resource_saving', 'cumhuriyet', 'resource'),
      decision('tie-district-c', 'safe_watch', 'cumhuriyet', 'watch'),
    ],
  });
  record(assert(checks, tie.pattern === 'district_repetition', 'Tie-break deterministic', `tie -> ${tie.pattern}`));

  const missingKind = buildDominantStrategyDetector({
    day: 8,
    decisionRecords: [
      { id: 'label-a', decisionLabel: 'Hizli saha cevabi', districtId: 'sanayi' },
      { id: 'label-b', decisionLabel: 'Hizli ekip cevabi', districtId: 'sanayi' },
      { id: 'label-c', decisionLabel: 'Hizli rota cevabi', districtId: 'sanayi' },
    ],
  });
  record(assert(checks, missingKind.pattern !== 'none', 'Missing selectedDecisionKind safe fallback', 'missing kind failed'));

  const presentation = buildDominantStrategyCardModels(buildDominantStrategyDetector(inputFor('public_trust_overfocus')));
  record(assert(checks, presentation.length <= 2, 'Presentation max 2 cards', 'too many presentation cards'));
  record(assert(checks, Boolean(buildEceDominantStrategyLine(buildDominantStrategyDetector(inputFor('public_trust_overfocus')))), 'Ece line helper', 'Ece line missing'));
  record(assert(checks, Boolean(buildReportDominantStrategyNote(buildDominantStrategyDetector(inputFor('public_trust_overfocus')))), 'Report note helper', 'Report note missing'));
  record(assert(checks, Boolean(buildHubDominantStrategyHint(buildDominantStrategyDetector(inputFor('public_trust_overfocus')))), 'Hub hint helper', 'Hub hint missing'));

  return { ok, warn: false, checks };
}
