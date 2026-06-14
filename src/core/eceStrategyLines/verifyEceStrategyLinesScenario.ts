import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildCenterActiveTarget } from '@/features/hub/utils/centerActiveTargetPresentation';
import { buildCenterAdvisorSuggestion } from '@/features/hub/utils/centerAdvisorPresentation';
import { buildCenterContinuationCards } from '@/features/hub/utils/centerContinuationCardsPresentation';
import { buildEndOfDayReportViewModel } from '@/features/reports/utils/endOfDayReportPresentation';
import { buildDailyReport } from '@/core/game/buildDailyReport';
import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { SAVE_VERSION } from '@/store/gamePersist';

import { ECE_STRATEGY_LINE_CONTENT_PACK } from './eceStrategyLineContentPack';
import {
  ECE_STRATEGY_LINE_EXPECTED_SAVE_VERSION,
  ECE_STRATEGY_LINE_MAX,
  ECE_STRATEGY_LINE_SHORT_MAX,
} from './eceStrategyLineConstants';
import { buildEceStrategyLineResult } from './eceStrategyLineModel';
import {
  buildEceContinuationLine,
  buildEceHubAdvisorLine,
  buildEceMapHintLine,
  buildEceReportAdvisorLine,
  buildEceStrategyLineCardModel,
} from './eceStrategyLinePresentation';
import type { EceStrategyLineInput } from './eceStrategyLineTypes';

export type EceStrategyLinesVerifyOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

const REPO_ROOT = process.cwd();
const TECHNICAL_PATTERN = /\b[a-z]+_[a-z_]+\b/;

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

function readRepo(path: string): string {
  return readFileSync(join(REPO_ROOT, path), 'utf8');
}

function allLines(input: ReturnType<typeof buildEceStrategyLineResult>): string[] {
  return [
    input.primaryLine?.text,
    input.secondaryLine?.text,
    input.reportLine?.text,
    input.continuationLine?.text,
    input.fallbackLine.text,
  ].filter((line): line is string => Boolean(line));
}

function richSourceInput(overrides: Partial<EceStrategyLineInput> = {}): EceStrategyLineInput {
  return {
    day: 8,
    oneMoreDayRetentionResult: {
      primaryHook: {
        id: 'retention-hook',
        line: 'Bugunku izin yarin takip edilebilir.',
        tomorrowLine: 'Yarin ayni hatta kisa bir devam hamlesi sec.',
        sourceIds: ['retention-hook'],
        sourceKinds: ['portfolio_defer_risk'],
      },
      ctaLabel: 'Devam Et',
      sourceIds: ['retention-result'],
    },
    portfolioDeferRiskResult: {
      primaryBinding: {
        id: 'defer-binding',
        line: 'Erteledigimiz saha baskisi kapanmadi.',
        tomorrowLine: 'Secmedigin sinyal yarin ilk kontrol edilecek alan olsun.',
        sourceIds: ['defer-binding'],
      },
      reportSummaryLine: 'Secmedigin sinyal raporda takip listesine girdi.',
      tomorrowActionLine: 'Secmedigin sinyal yarin ilk kontrol edilecek alan olsun.',
      sourceIds: ['defer-result'],
    },
    dailyCapacityPortfolioResult: {
      primaryTradeoffLine: 'Portfoyde bugun secilmeyen riskler yarina acik not olarak kaldi.',
      ecePortfolioLine: 'Bugun kaynaklari tek hatta toplamak daha iyi.',
      sourceIds: ['daily-capacity'],
    },
    authorityExpansionSummary: {
      eceAuthorityLine: 'Yeni yetki daha net bir operasyon okuma alani aciyor.',
      sourceIds: ['authority-expansion'],
    },
    decisionConsequenceThreads: [
      {
        id: 'decision-thread',
        line: 'Onceki karar bugunku rota kararinda iz birakti.',
        sourceIds: ['decision-thread'],
      },
    ],
    districtMemorySignals: [
      {
        id: 'district-memory',
        line: 'Sehir hafizasi bu bolgedeki eski karari hatirlatiyor.',
        sourceIds: ['district-memory'],
      },
    ],
    mapGameplayBindings: [
      {
        id: 'map-binding',
        mapLine: 'Haritadaki baski tek noktada toplanmis.',
        sourceIds: ['map-binding'],
      },
    ],
    resourcePressureSignals: [
      {
        id: 'resource-pressure',
        warningLine: 'Kaynak sikisikligi buyumeden kisa hamle sec.',
        sourceIds: ['resource-pressure'],
      },
    ],
    playerStyleInsight: {
      id: 'style-strategic',
      visible: true,
      confidence: 'high',
      advisorLine: 'Karar tarzinda sakin takip gucleniyor.',
      sourceIds: ['style-strategic'],
    },
    ...overrides,
  };
}

function verifyNoForbiddenRuntimeCalls(checks: string[]): boolean {
  const files = [
    'src/core/eceStrategyLines/eceStrategyLineTypes.ts',
    'src/core/eceStrategyLines/eceStrategyLineConstants.ts',
    'src/core/eceStrategyLines/eceStrategyLineModel.ts',
    'src/core/eceStrategyLines/eceStrategyLinePresentation.ts',
    'src/core/eceStrategyLines/eceStrategyLineContentPack.ts',
    'src/core/eceStrategyLines/index.ts',
  ];
  const forbidden = [
    { token: 'open' + 'ai', label: 'AI provider' },
    { token: 'fet' + 'ch(', label: 'network call' },
    { token: 'l' + 'lm', label: 'generated text engine' },
  ];
  let ok = true;
  for (const file of files) {
    const body = readRepo(file).toLowerCase();
    for (const item of forbidden) {
      ok =
        assert(checks, !body.includes(item.token), `${file} has no ${item.label}`, item.label) &&
        ok;
    }
  }
  return ok;
}

export function verifyEceStrategyLinesScenario(): EceStrategyLinesVerifyOutcome {
  const checks: string[] = [];
  let ok = true;

  ok =
    assert(
      checks,
      SAVE_VERSION === ECE_STRATEGY_LINE_EXPECTED_SAVE_VERSION &&
        readRepo('src/store/gamePersist.ts').includes('export const SAVE_VERSION = 26;'),
      'SAVE_VERSION unchanged',
      `SAVE_VERSION ${SAVE_VERSION}`,
    ) && ok;
  ok = verifyNoForbiddenRuntimeCalls(checks) && ok;

  const storeBody = readRepo('src/store/useGameStore.ts');
  const persistBody = readRepo('src/store/gamePersist.ts');
  ok = assert(checks, !persistBody.includes('eceStrategyLines'), 'persist shape unchanged', 'persist field found') && ok;
  ok = assert(checks, !storeBody.includes('eceStrategyLines'), 'store shape unchanged', 'store field found') && ok;
  ok = assert(checks, !storeBody.includes('buildEceStrategyLineResult'), 'day pipeline not wired', 'core store wiring found') && ok;

  const day1 = buildEceStrategyLineResult({ day: 1 });
  ok = assert(checks, day1.primaryLine?.id === 'ece-fallback-day-1', 'Day 1 uses guarded fallback', day1.primaryLine?.id ?? 'none') && ok;
  ok = assert(checks, !day1.secondaryLine && !day1.reportLine && !day1.continuationLine, 'Day 1 primary only', 'extra line emitted') && ok;

  const rich = buildEceStrategyLineResult(richSourceInput());
  ok = assert(checks, rich.primaryLine?.sourceKinds.includes('one_more_day_retention') === true, 'Source priority uses One More Day first', rich.primaryLine?.sourceKinds.join(',') ?? 'none') && ok;
  ok = assert(checks, Boolean(rich.secondaryLine), 'Secondary line available when sourced', 'secondary missing') && ok;
  ok = assert(checks, rich.reportLine?.phases.includes('report') === true, 'Report line phase selected', 'report line missing') && ok;
  ok = assert(checks, rich.continuationLine?.phases.includes('continuation') === true, 'Continuation line phase selected', 'continuation missing') && ok;

  const duplicateGuard = buildEceStrategyLineResult(
    richSourceInput({ recentLineTexts: [rich.primaryLine?.text ?? ''] }),
  );
  ok = assert(checks, duplicateGuard.primaryLine?.text !== rich.primaryLine?.text, 'Exact repetition guard changes primary', 'duplicate primary kept') && ok;

  const noTomorrowSource = buildEceStrategyLineResult({
    day: 8,
    playerStyleInsight: {
      visible: true,
      confidence: 'high',
      advisorLine: 'Karar tarzinda sakin takip gucleniyor.',
    },
  });
  ok = assert(checks, !allLines(noTomorrowSource).some((line) => /yarin/i.test(line)), 'No fake tomorrow without tomorrow source', allLines(noTomorrowSource).join(' | ')) && ok;

  const noMemorySource = buildEceStrategyLineResult({ day: 8 });
  ok = assert(checks, !allLines(noMemorySource).some((line) => /sehir hafizasi|mahalle/i.test(line)), 'No fake memory without memory source', allLines(noMemorySource).join(' | ')) && ok;

  const noAuthoritySource = buildEceStrategyLineResult({ day: 8 });
  ok = assert(checks, !allLines(noAuthoritySource).some((line) => /yetki/i.test(line)), 'No fake authority without authority source', allLines(noAuthoritySource).join(' | ')) && ok;

  const noMapSource = buildEceStrategyLineResult({ day: 8 });
  ok = assert(checks, !allLines(noMapSource).some((line) => /harita/i.test(line)), 'No fake map without map source', allLines(noMapSource).join(' | ')) && ok;

  const lowStyle = buildEceStrategyLineResult({
    day: 8,
    playerStyleInsight: {
      visible: true,
      confidence: 'low',
      advisorLine: 'Bu satir gorunmemeli.',
    },
  });
  ok = assert(checks, !lowStyle.primaryLine?.sourceKinds.includes('player_style'), 'Low confidence player style suppressed', lowStyle.primaryLine?.sourceKinds.join(',') ?? 'none') && ok;

  const card = buildEceStrategyLineCardModel(rich, 'report');
  ok = assert(checks, Boolean(card), 'Card model builds', 'card missing') && ok;
  ok = assert(checks, (card?.text.length ?? 0) <= ECE_STRATEGY_LINE_MAX, 'Card text length clamped', String(card?.text.length ?? 0)) && ok;
  ok = assert(checks, (card?.shortText?.length ?? 0) <= ECE_STRATEGY_LINE_SHORT_MAX, 'Card short text length clamped', String(card?.shortText?.length ?? 0)) && ok;
  ok = assert(checks, !allLines(rich).some((line) => TECHNICAL_PATTERN.test(line)), 'No technical enum leaks', allLines(rich).join(' | ')) && ok;
  ok = assert(checks, ECE_STRATEGY_LINE_CONTENT_PACK.length >= 40, 'Content pack has at least 40 lines', String(ECE_STRATEGY_LINE_CONTENT_PACK.length)) && ok;

  ok = assert(checks, Boolean(buildEceHubAdvisorLine(rich)), 'Hub helper returns line', 'missing') && ok;
  ok = assert(checks, Boolean(buildEceReportAdvisorLine(rich)), 'Report helper returns line', 'missing') && ok;
  ok = assert(checks, Boolean(buildEceContinuationLine(rich)), 'Continuation helper returns line', 'missing') && ok;
  ok = assert(checks, Boolean(buildEceMapHintLine(buildEceStrategyLineResult(richSourceInput({ oneMoreDayRetentionResult: null, portfolioDeferRiskResult: null, dailyCapacityPortfolioResult: null })))), 'Map helper can return sourced map line', 'missing') && ok;

  const report = buildDailyReport({
    day: 8,
    metrics: { publicSatisfaction: 70, staffMorale: 70, budget: 100000 },
    decisionHistory: [],
    activeEvents: [],
    resolvedEventIds: [],
    snapshots: [],
  });
  const reportModel = buildEndOfDayReportViewModel({
    report,
    metrics: { publicSatisfaction: 70, staffMorale: 70, budget: 100000 },
    dailyXpReport: { day: 8, totalXp: 10, categories: [] },
    eceStrategyLines: rich,
  });
  ok = assert(checks, Boolean(reportModel.eceStrategyLine), 'Report optional Ece line field', 'report field missing') && ok;

  const gameState = createDay1Seed().gameState;
  const activeTarget = buildCenterActiveTarget({
    gameState,
    day: 8,
    operationSignals: createInitialOperationSignalsState(8),
  });
  const advisor = buildCenterAdvisorSuggestion({
    gameState,
    day: 8,
    activeTarget,
    eceStrategyLines: rich,
  });
  ok = assert(checks, Boolean(advisor.accessibilityLabel.trim()), 'Advisor optional hook keeps core fields', 'advisor invalid') && ok;

  const continuation = buildCenterContinuationCards({
    gameState,
    day: 8,
    activeTarget,
    eceStrategyLines: rich,
  });
  ok = assert(checks, continuation.cards.length <= 3, 'Continuation max cards preserved', `cards=${continuation.cards.length}`) && ok;

  const files = [
    'src/core/eceStrategyLines/eceStrategyLineTypes.ts',
    'src/core/eceStrategyLines/eceStrategyLineConstants.ts',
    'src/core/eceStrategyLines/eceStrategyLineModel.ts',
    'src/core/eceStrategyLines/eceStrategyLinePresentation.ts',
    'src/core/eceStrategyLines/eceStrategyLineContentPack.ts',
    'src/core/eceStrategyLines/verifyEceStrategyLinesScenario.ts',
    'src/core/eceStrategyLines/index.ts',
    'scripts/verify-ece-strategy-lines.ts',
    'scripts/analyze-ece-strategy-lines.ts',
    'docs/crevia-ece-memory-strategy-line-pack.md',
  ];
  for (const file of files) {
    ok = assert(checks, existsSync(join(REPO_ROOT, file)), `${file} exists`, `${file} missing`) && ok;
  }

  return { ok, warn: false, checks };
}
