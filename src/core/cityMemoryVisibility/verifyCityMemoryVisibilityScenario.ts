import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildCenterContinuationCards } from '@/features/hub/utils/centerContinuationCardsPresentation';
import { buildCenterActiveTarget } from '@/features/hub/utils/centerActiveTargetPresentation';
import { buildEndOfDayReportViewModel } from '@/features/reports/utils/endOfDayReportPresentation';
import { buildDailyReport } from '@/core/game/buildDailyReport';
import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  CITY_MEMORY_VISIBILITY_EXPECTED_SAVE_VERSION,
  CITY_MEMORY_VISIBILITY_LINE_MAX,
  CITY_MEMORY_VISIBILITY_MAX_TRACES,
  CITY_MEMORY_TECHNICAL_TOKEN_PATTERN,
} from './cityMemoryVisibilityConstants';
import { buildCityMemoryVisibility } from './cityMemoryVisibilityModel';
import {
  buildEceCityMemoryHint,
  buildHubCityMemoryHint,
  buildMapCityMemoryHint,
  buildReportCityMemoryNote,
} from './cityMemoryVisibilityPresentation';
import type { CityMemoryVisibilityInput } from './cityMemoryVisibilityTypes';

export type CityMemoryVisibilityVerifyOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

const REPO_ROOT = process.cwd();

function pass(checks: string[], label: string): boolean {
  checks.push(`PASS ${label}`);
  return true;
}

function fail(checks: string[], label: string, detail: string): boolean {
  checks.push(`FAIL ${label}: ${detail}`);
  return false;
}

function assert(checks: string[], condition: boolean, label: string, detail = 'failed'): boolean {
  return condition ? pass(checks, label) : fail(checks, label, detail);
}

function warn(checks: string[], condition: boolean, label: string, warning: string): boolean {
  checks.push(condition ? `PASS ${label}` : `WARN ${warning}`);
  return condition;
}

function readRepo(path: string): string {
  return readFileSync(join(REPO_ROOT, path), 'utf8');
}

function richInput(overrides: Partial<CityMemoryVisibilityInput> = {}): CityMemoryVisibilityInput {
  return {
    day: 8,
    decisionConsequenceThreads: [
      {
        id: 'decision-1',
        title: 'Karar izi',
        causalLine: 'Onceki karar bugunku rota kararinda iz birakti.',
        sourceIds: ['decision-1'],
        strength: 'high',
      },
    ],
    carryOverSignals: [
      {
        id: 'carry-1',
        title: 'Devam eden etki',
        text: 'Dunku secim bugunku onceligi etkiliyor.',
        sourceIds: ['carry-1'],
      },
    ],
    districtMemorySignals: [
      {
        id: 'district-memory-1',
        title: 'Mahalle hafizasi',
        advisorLine: 'Bu mahalle onceki kararlarla yeniden anlam kazaniyor.',
        districtId: 'cumhuriyet',
        districtName: 'Cumhuriyet',
        sourceIds: ['district-memory-1'],
      },
    ],
    storyChains: [
      {
        chainId: 'story-1',
        playerVisibleTitle: 'Hikaye zinciri',
        reportLine: 'Bu olay zinciri sehir hafizasinda ilerliyor.',
        districtId: 'merkez',
        sourceIds: ['story-1'],
      },
    ],
    cityArchiveEntries: [
      {
        id: 'archive-1',
        title: 'Arsiv izi',
        shortLine: 'Sehir arsivi bu karari kaydetti.',
        isPlayerVisible: true,
        sourceIds: ['archive-1'],
      },
    ],
    mapGameplayBindings: [
      {
        id: 'map-1',
        role: 'district_memory_trace',
        mapLine: 'Haritadaki bu iz, onceki kararin sehirdeki karsiligi.',
        sourceIds: ['map-1'],
      },
    ],
    ...overrides,
  };
}

export function verifyCityMemoryVisibilityScenario(): CityMemoryVisibilityVerifyOutcome {
  const checks: string[] = [];
  let ok = true;

  ok =
    assert(
      checks,
      SAVE_VERSION === CITY_MEMORY_VISIBILITY_EXPECTED_SAVE_VERSION,
      'SAVE_VERSION unchanged',
      `SAVE_VERSION ${SAVE_VERSION}`,
    ) && ok;

  const persistBody = readRepo('src/store/gamePersist.ts');
  const storeBody = readRepo('src/store/useGameStore.ts');
  ok = assert(checks, !persistBody.includes('cityMemoryVisibility'), 'persist shape unchanged', 'persist field found') && ok;
  ok = assert(checks, !storeBody.includes('cityMemoryVisibility'), 'store shape unchanged', 'store field found') && ok;
  ok = assert(checks, !storeBody.includes('buildCityMemoryVisibility'), 'day pipeline not wired', 'store wiring found') && ok;

  const day1 = buildCityMemoryVisibility({ day: 1 });
  ok = assert(checks, day1.traces.length <= 1, 'Day 1 low-noise max 1 trace', `count ${day1.traces.length}`) && ok;
  ok = assert(checks, day1.primaryTrace?.isFallback === true, 'Day 1 fallback primary', 'missing fallback') && ok;

  const day8 = buildCityMemoryVisibility(richInput());
  ok = assert(checks, day8.traces.length >= 1 && day8.traces.length <= CITY_MEMORY_VISIBILITY_MAX_TRACES, 'max 3 traces', `count ${day8.traces.length}`) && ok;
  ok = assert(checks, new Set(day8.traces.map((trace) => trace.id)).size === day8.traces.length, 'trace id unique', 'duplicate id') && ok;
  ok = assert(checks, day8.traces.every((trace) => trace.priority >= 0 && trace.priority <= 100), 'priority clamp', 'priority out of range') && ok;
  ok = assert(checks, new Set(day8.sourceIds).size === day8.sourceIds.length, 'sourceIds deduped', 'duplicate sourceIds') && ok;
  ok = assert(checks, Boolean(day8.primaryTrace), 'Day 8+ primary trace', 'missing primary') && ok;
  ok = assert(checks, Boolean(day8.reportTrace), 'report trace available', 'missing report trace') && ok;

  const noDecision = buildCityMemoryVisibility({ day: 8 });
  ok = assert(checks, !noDecision.traces.some((trace) => trace.kind === 'decision_trace'), 'no decision source no decision trace', 'fake decision trace') && ok;
  ok = assert(checks, !noDecision.traces.some((trace) => trace.kind === 'story_chain_trace'), 'no story source no story trace', 'fake story trace') && ok;
  ok = assert(checks, !noDecision.traces.some((trace) => trace.sourceKinds.includes('city_archive')), 'no archive source no archive trace', 'fake archive trace') && ok;
  ok = assert(checks, !noDecision.traces.some((trace) => trace.kind === 'carry_over_trace'), 'no carry-over source no carry trace', 'fake carry trace') && ok;
  ok = assert(checks, !noDecision.traces.some((trace) => trace.kind === 'butterfly_trace'), 'no butterfly source no butterfly trace', 'fake butterfly trace') && ok;
  ok = assert(checks, !noDecision.traces.some((trace) => trace.kind === 'map_memory_hint'), 'no map source no map hint', 'fake map hint') && ok;

  const personalityOnly = buildCityMemoryVisibility({
    day: 8,
    districtPersonalityProfiles: [
      {
        districtId: 'sanayi',
        districtName: 'Sanayi',
        criteria: [{ id: 'operation_history_weight', band: 'high', score: 80 }],
        sourceIds: ['sanayi'],
      },
    ],
  });
  ok = assert(checks, !personalityOnly.traces.some((trace) => trace.line.toLowerCase().includes('iz birakti')), 'personality baseline no fake memory claim', 'fake memory claim') && ok;
  ok = warn(checks, personalityOnly.traces.some((trace) => trace.confidence === 'low'), 'personality only low confidence', 'personality confidence too high') && ok;

  const duplicate = buildCityMemoryVisibility(
    richInput({
      oneMoreDayRetentionResult: {
        primaryHook: {
          id: 'decision-1',
          line: 'Onceki karar bugunku rota kararinda iz birakti.',
          sourceIds: ['decision-1'],
        },
      },
    }),
  );
  ok = assert(checks, !duplicate.traces.some((trace) => trace.sourceIds.includes('decision-1')), 'duplicate guard suppresses shared source', 'duplicate source kept') && ok;

  const duplicateText = buildCityMemoryVisibility(
    richInput({ recentTraceTexts: ['Onceki karar bugunku rota kararinda iz birakti.'] }),
  );
  ok = assert(checks, !duplicateText.traces.some((trace) => trace.line === 'Onceki karar bugunku rota kararinda iz birakti.'), 'duplicate exact line guard', 'duplicate line kept') && ok;

  for (const trace of day8.traces) {
    ok = assert(checks, !CITY_MEMORY_TECHNICAL_TOKEN_PATTERN.test(trace.line), `no technical enum (${trace.id})`, trace.line) && ok;
    ok = assert(checks, trace.line.length <= CITY_MEMORY_VISIBILITY_LINE_MAX + 1, `line clamp (${trace.id})`, `${trace.line.length}`) && ok;
  }

  const reportNote = buildReportCityMemoryNote(day8, []);
  ok = assert(checks, Boolean(reportNote), 'report helper produces note', 'missing report note') && ok;

  const hubHint = buildHubCityMemoryHint(day8, []);
  ok = assert(checks, Boolean(hubHint), 'hub helper produces hint', 'missing hub hint') && ok;

  const mapHint = buildMapCityMemoryHint(
    buildCityMemoryVisibility({
      day: 10,
      mapGameplayBindings: [
        {
          id: 'map-only',
          role: 'district_memory_trace',
          mapLine: 'Haritadaki bu iz, onceki kararin sehirdeki karsiligi.',
          sourceIds: ['map-only'],
        },
      ],
    }),
    [],
  );
  ok = assert(checks, Boolean(mapHint), 'map helper produces hint', 'missing map hint') && ok;

  const report = buildDailyReport({
    day: 8,
    metrics: { publicSatisfaction: 70, staffMorale: 70, budget: 100000 },
    decisionHistory: [],
    activeEvents: [],
    resolvedEventIds: [],
    snapshots: [],
  });
  const reportVm = buildEndOfDayReportViewModel({
    report,
    metrics: { publicSatisfaction: 70, staffMorale: 70, budget: 100000 },
    dailyXpReport: { day: 8, totalXp: 10, categories: [] },
    cityMemoryVisibility: day8,
    oneMoreDayRetention: null,
    eceStrategyLines: null,
  });
  ok = assert(checks, Boolean(reportVm.cityMemoryNote), 'report integration optional field', 'missing cityMemoryNote') && ok;

  const gameState = createDay1Seed().gameState;
  const activeTarget = buildCenterActiveTarget({
    gameState,
    day: 8,
    operationSignals: createInitialOperationSignalsState(8),
  });
  const continuation = buildCenterContinuationCards({
    gameState,
    day: 8,
    activeTarget,
    cityMemoryVisibility: day8,
  });
  ok = assert(checks, continuation.cards.some((card) => card.id === 'city-memory-continuation'), 'continuation integration memory card', 'missing city-memory-continuation') && ok;

  return { ok, warn: checks.some((line) => line.startsWith('WARN')), checks };
}