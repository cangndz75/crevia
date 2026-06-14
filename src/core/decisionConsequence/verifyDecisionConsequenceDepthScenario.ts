import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import type { DailyReport } from '@/core/models/DailyReport';
import { buildEndOfDayTomorrowNotes } from '@/features/reports/utils/endOfDayReportPresentation';
import {
  buildDecisionConsequenceThreads,
  buildDecisionConsequenceThreadsFromReport,
  buildDecisionConsequenceThreadsFromResult,
  buildDecisionConsequenceThreadsFromHub,
  DECISION_CONSEQUENCE_ALLOWED_STRENGTHS,
  DECISION_CONSEQUENCE_ALLOWED_TIME_SCOPES,
  DECISION_CONSEQUENCE_ALLOWED_TONES,
  DECISION_CONSEQUENCE_ALLOWED_TYPES,
  DECISION_CONSEQUENCE_MAX_THREADS,
} from './decisionConsequenceThreadModel';
import {
  buildDecisionConsequenceEceLine,
  buildPrimaryTomorrowActionFromThreads,
  decisionConsequenceContainsFakeUrgency,
} from './decisionConsequenceThreadPresentation';
import type { DecisionConsequenceThread } from './decisionConsequenceThreadTypes';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';
import { verifyOperationResultRevealScenario } from '@/features/events/verifyOperationResultRevealScenario';
import { verifyOperationFlowQaScenario } from '@/features/events/verifyOperationFlowQaScenario';
import { verifyCenterRecommendedPlanScenario } from '@/features/hub/verifyCenterRecommendedPlanScenario';
import { verifyCenterContinuationCardsScenario } from '@/features/hub/verifyCenterContinuationCardsScenario';
import { verifyCenterAdvisorScenario } from '@/features/hub/verifyCenterAdvisorScenario';

type Check = { name: string; ok: boolean; detail: string };

export type VerifyDecisionConsequenceDepthOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

function idsUnique(threads: readonly DecisionConsequenceThread[]): boolean {
  const ids = threads.map((thread) => thread.id);
  return new Set(ids).size === ids.length;
}

function sourceIdsUnique(threads: readonly DecisionConsequenceThread[]): boolean {
  const ids = threads.flatMap((thread) => thread.sourceIds);
  return new Set(ids).size === ids.length;
}

function enumsValid(threads: readonly DecisionConsequenceThread[]): boolean {
  return threads.every(
    (thread) =>
      DECISION_CONSEQUENCE_ALLOWED_TYPES.includes(thread.consequenceType) &&
      DECISION_CONSEQUENCE_ALLOWED_STRENGTHS.includes(thread.strength) &&
      DECISION_CONSEQUENCE_ALLOWED_TIME_SCOPES.includes(thread.timeScope) &&
      DECISION_CONSEQUENCE_ALLOWED_TONES.includes(thread.tone),
  );
}

function linesValid(threads: readonly DecisionConsequenceThread[]): boolean {
  return threads.every(
    (thread) =>
      thread.causalLine.trim().length > 0 &&
      (!thread.nextActionHint || thread.nextActionHint.trim().length > 0) &&
      thread.title.trim().length > 0 &&
      thread.summary.trim().length > 0,
  );
}

function highAtMostOne(threads: readonly DecisionConsequenceThread[]): boolean {
  return threads.filter((thread) => thread.strength === 'high').length <= 1;
}

function sampleSnapshot(): DecisionResultSnapshot {
  return {
    id: 'snapshot_1',
    day: 4,
    eventId: 'event_1',
    eventTitle: 'Rota baskisi',
    neighborhoodId: 'sanayi',
    neighborhoodName: 'Sanayi',
    decisionId: 'decision_1',
    decisionTitle: 'Hizli mudahale',
    decisionTone: 'risky',
    createdAt: 1,
    summaryTitle: 'Rota baskisi kontrol edildi',
    summaryText: 'Karar kaynak kullanimini artirdi.',
    resultTone: 'mixed',
    metricChanges: [
      {
        key: 'budget',
        label: 'Kaynak',
        before: 20_000,
        after: 17_000,
        delta: -3000,
        direction: 'down',
        isGood: false,
      },
      {
        key: 'publicSatisfaction',
        label: 'Halk',
        before: 50,
        after: 55,
        delta: 5,
        direction: 'up',
        isGood: true,
      },
    ],
    subsystemOutcomes: [
      {
        key: 'vehicle',
        title: 'Arac baskisi',
        status: 'warning',
        primaryText: 'Rota araci yarin daha dikkatli kullanilmali.',
      },
      {
        key: 'social',
        title: 'Sosyal nabiz',
        status: 'good',
        primaryText: 'Sosyal tepki sakinlesti.',
      },
    ],
    highlightLines: [],
    riskLines: ['Yarin rota baskisi izlenmeli.'],
    butterflyHint: {
      title: 'Kucuk iz',
      text: 'Bu karar sonraki planin tonunu etkileyebilir.',
      tone: 'warning',
    },
  };
}

function sampleReport(): DailyReport {
  return {
    day: 4,
    title: 'Gun raporu',
    rewardTitle: 'Dengeli gun',
    stats: [],
    carryOverSummaryLines: ['Rota karari yarina kaynak baskisi olarak tasindi.'],
    butterflySummaryLines: ['Kucuk rota tercihi yarin yeniden gorulebilir.'],
    warnings: ['Arac yorgunlugu yarin atamayi etkileyebilir.'],
    vehicleSummaryLines: ['Rota araci yorgunluk sinirinda.'],
    socialSummaryLines: ['Sosyal tepki sakinlesti.'],
    authoritySummaryLines: ['Yetki guveni artti.'],
    summaryLines: ['Gun sonucu sehir kaydina islendi.'],
  };
}

export function verifyDecisionConsequenceDepthScenario(): VerifyDecisionConsequenceDepthOutcome {
  const checks: Check[] = [];

  const direct = buildDecisionConsequenceThreads({
    day: 3,
    sourceDay: 2,
    decisionLabel: 'Hizli mudahale',
    sources: [
      {
        id: 'carry',
        type: 'carry_over',
        line: 'Rota baskisi yarina tasindi.',
        sourceLabel: 'Carry-over',
        sourceIds: ['carry'],
      },
      {
        id: 'butterfly',
        type: 'butterfly',
        line: 'Kucuk karar sonraki plani etkileyebilir.',
        sourceLabel: 'Butterfly',
        sourceIds: ['butterfly'],
      },
      {
        id: 'resource',
        type: 'resource_pressure',
        line: 'Kaynak yorgunlugu artti.',
        sourceLabel: 'Kaynak',
        sourceIds: ['resource'],
      },
      {
        id: 'social',
        type: 'social_echo',
        line: 'Sosyal tepki sakinlesti.',
        sourceLabel: 'Sosyal',
        sourceIds: ['social'],
      },
    ],
  });

  assert(checks, direct.length <= DECISION_CONSEQUENCE_MAX_THREADS, 'max 3 thread', String(direct.length));
  assert(checks, idsUnique(direct), 'thread id duplicate yok');
  assert(checks, sourceIdsUnique(direct), 'sourceIds duplicate yok');
  assert(checks, enumsValid(direct), 'enum degerleri valid');
  assert(checks, linesValid(direct), 'causal/next action lines dolu');
  assert(checks, highAtMostOne(direct), 'high strength en fazla 1');
  assert(checks, direct[0]?.consequenceType === 'carry_over', 'priority carry-over first', direct[0]?.consequenceType);

  const day1Fallback = buildDecisionConsequenceThreads({ day: 1 });
  assert(checks, day1Fallback.length === 1, 'Day 1 low-data neutral fallback');
  assert(checks, day1Fallback[0]?.consequenceType === 'neutral_record', 'Day 1 fake carry-over yok');
  assert(checks, !decisionConsequenceContainsFakeUrgency(day1Fallback), 'neutral fallback fake urgent degil');

  const noFakeNarrative = buildDecisionConsequenceThreads({
    day: 2,
    sources: [
      {
        id: 'resource-only',
        type: 'resource_pressure',
        line: 'Kaynak baskisi yarin izlenmeli.',
        sourceLabel: 'Kaynak',
        sourceIds: ['resource-only'],
      },
    ],
  });
  assert(
    checks,
    !noFakeNarrative.some((thread) => thread.consequenceType === 'butterfly' || thread.consequenceType === 'carry_over' || thread.consequenceType === 'story_chain'),
    'fake butterfly/carry-over/story uretilmez',
  );

  const resultThreads = buildDecisionConsequenceThreadsFromResult({
    snapshot: sampleSnapshot(),
    carryOverSummary: 'Dunku tercih bugunku rota baskisini etkiledi.',
    authorityProgressLine: 'Yetki guveni artti.',
  });
  assert(checks, resultThreads.length <= 3, 'result thread cap');
  assert(checks, resultThreads.some((thread) => thread.visibleIn.includes('result')), 'result visibility var');
  assert(checks, highAtMostOne(resultThreads), 'result high max 1');

  const reportThreads = buildDecisionConsequenceThreadsFromReport(sampleReport());
  const tomorrowNotes = buildEndOfDayTomorrowNotes(sampleReport(), 3);
  assert(checks, reportThreads.length <= 3, 'report thread cap');
  assert(checks, tomorrowNotes.length <= 3, 'report tomorrow notes cap');
  assert(checks, buildPrimaryTomorrowActionFromThreads(reportThreads).trim().length > 0, 'primary tomorrow action dolu');
  assert(
    checks,
    tomorrowNotes.filter((line) => /yarin|yarın/i.test(line)).length <= 1,
    'report primary tomorrow action max 1',
    tomorrowNotes.join(' | '),
  );

  const hubThreads = buildDecisionConsequenceThreadsFromHub({
    day: 5,
    impactLine: 'Dunku rota tercihi bugun kaynak baskisini artirdi.',
    storyLine: 'Mahalle hafizasi devam ediyor.',
  });
  const eceLine = buildDecisionConsequenceEceLine(hubThreads);
  assert(checks, Boolean(eceLine?.trim()), 'Hub/Ece consequence line uretir');
  assert(checks, !hubThreads.some((thread) => thread.causalLine === eceLine && thread.nextActionHint === eceLine), 'Hub/Ece ayni metni tekrar etmez');

  const resultReveal = verifyOperationResultRevealScenario();
  const operationFlowQa = verifyOperationFlowQaScenario();
  const centerRecommendedPlan = verifyCenterRecommendedPlanScenario();
  const centerContinuation = verifyCenterContinuationCardsScenario();
  const centerAdvisor = verifyCenterAdvisorScenario();

  assert(checks, resultReveal.ok, 'verify:operation-result-reveal PASS kalir', String(resultReveal.failCount));
  assert(checks, operationFlowQa.ok, 'verify:operation-flow-qa PASS kalir', String(operationFlowQa.failCount));
  assert(checks, centerRecommendedPlan.ok, 'verify:center-recommended-plan PASS kalir', String(centerRecommendedPlan.failCount));
  assert(checks, centerContinuation.ok, 'verify:center-continuation-cards PASS kalir', String(centerContinuation.failCount));
  assert(checks, centerAdvisor.ok, 'verify:center-advisor PASS kalir', String(centerAdvisor.failCount));

  assert(checks, SAVE_VERSION === 26, 'SAVE_VERSION degismedi', String(SAVE_VERSION));
  assert(
    checks,
    !source('src/core/game/applyDecision.ts').includes('decisionConsequence'),
    'applyDecision semantigi untouched',
  );
  assert(
    checks,
    !source('src/store/gamePersist.ts').includes('decisionConsequence'),
    'gamePersist shape untouched',
  );
  assert(
    checks,
    !source('src/store/useGameStore.ts').includes('decisionConsequence'),
    'day pipeline/store semantics untouched',
  );

  const failCount = checks.filter((check) => !check.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((check) => `${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.detail ? ` — ${check.detail}` : ''}`),
  };
}
