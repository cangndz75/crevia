import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import {
  buildEndOfDayReportClosurePresentation,
  closurePresentationHasDuplicateCopy,
} from '@/features/reports/presentation/closure/endOfDayReportClosurePresentation';
import {
  buildEndOfDayClosingTonePresentation,
  resolveEndOfDayClosingToneId,
} from '@/features/reports/presentation/closure/endOfDayReportClosingTonePresentation';
import { buildEndOfDayDecisionStoryPresentation } from '@/features/reports/presentation/closure/endOfDayDecisionStoryPresentation';
import { buildEndOfDayNeighborhoodPulsePresentation } from '@/features/reports/presentation/closure/endOfDayNeighborhoodPulsePresentation';
import { buildEndOfDayTradeoffBalancePresentation } from '@/features/reports/presentation/closure/endOfDayTradeoffBalancePresentation';
import { buildEndOfDayTomorrowFocusPresentation } from '@/features/reports/presentation/closure/endOfDayTomorrowFocusPresentation';
import { buildEndOfDayReplayTimelinePresentation } from '@/features/reports/presentation/closure/endOfDayReplayTimelinePresentation';
import { buildEndOfDayManagerStyleSurface } from '@/features/reports/presentation/closure/endOfDayManagerStylePresentation';
import { reportPresentationContainsBannedWords } from '@/features/reports/utils/endOfDayReportPresentation';

function readRepo(rel: string): string {
  return readFileSync(join(process.cwd(), rel), 'utf8');
}

export type VerifyEndOfDayReportClosureOutcome = {
  ok: boolean;
  checks: string[];
  failCount: number;
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `✓ ${pass}` : `✗ ${fail}`);
  return ok;
}

function baseMetrics() {
  return { publicSatisfaction: 58, staffMorale: 56, budget: 72_000 };
}

export function verifyEndOfDayReportClosureScenario(): VerifyEndOfDayReportClosureOutcome {
  const checks: string[] = [];
  let ok = true;

  ok =
    assert(
      checks,
      SAVE_VERSION === 28,
      'SAVE_VERSION 28 korunur',
      `SAVE_VERSION beklenen 28, bulunan ${SAVE_VERSION}`,
    ) && ok;

  const day1Closure = buildEndOfDayReportClosurePresentation({
    day: 1,
    metrics: { publicSatisfaction: 52, staffMorale: 50, budget: 60_000 },
    decisionsToday: [],
    replayInput: { day: 1 },
    hideScoreRing: true,
  });

  ok =
    assert(checks, day1Closure.isDay1 === true, 'Day 1 closure modeli üretilir', 'Day 1 flag hatalı') &&
    ok;
  ok =
    assert(
      checks,
      day1Closure.outcomeChips.length <= 2,
      'Day 1 en fazla 2 outcome chip',
      `${day1Closure.outcomeChips.length} chip`,
    ) && ok;
  ok =
    assert(
      checks,
      day1Closure.replayTimeline.items.length <= 3,
      'Day 1 replay timeline max 3',
      `${day1Closure.replayTimeline.items.length} item`,
    ) && ok;
  ok =
    assert(
      checks,
      !day1Closure.decisionStory.playerStyleTag,
      'Day 1 player style gizli',
      'Day 1 style tag görünür',
    ) && ok;
  ok =
    assert(
      checks,
      day1Closure.managerStyle.visible && day1Closure.managerStyle.status === 'no_history',
      'Day 1 manager style no_history kartı',
      `Day 1 manager style ${day1Closure.managerStyle.status}`,
    ) && ok;
  ok =
    assert(
      checks,
      day1Closure.eceClosing.line.length <= 120,
      'Day 1 Ece yorumu kısa ve bounded',
      `Ece ${day1Closure.eceClosing.line.length} char`,
    ) && ok;

  const day8Closure = buildEndOfDayReportClosurePresentation({
    day: 8,
    metrics: baseMetrics(),
    successScore: 74,
    decisionsToday: [
      {
        id: 'd8-1',
        day: 8,
        eventId: 'evt-1',
        eventTitle: 'Saha operasyonu',
        neighborhoodId: 'n1',
        neighborhoodName: 'Cumhuriyet',
        decisionId: 'dec-1',
        decisionLabel: 'Hızlı müdahale',
        createdAt: new Date().toISOString(),
        appliedEffects: { publicSatisfaction: 5, staffMorale: -3, budget: -1200 },
        appliedCosts: {},
      },
    ],
    managementStyleLine: 'Hızlı müdahale çizgisi',
    periodGoalProgress: true,
    maintenanceRiskHigh: true,
    replayInput: {
      day: 8,
      decision: {
        decisionLabel: 'Hızlı müdahale',
        eventTitle: 'Saha operasyonu',
        neighborhoodName: 'Cumhuriyet',
      },
    },
  });

  ok =
    assert(checks, day8Closure.isRichDay === true, 'Day 8+ rich closure', 'Day 8 rich flag hatalı') &&
    ok;
  ok =
    assert(
      checks,
      day8Closure.outcomeChips.length <= 4,
      'Outcome chip max 4 bounded',
      `${day8Closure.outcomeChips.length}`,
    ) && ok;
  ok =
    assert(
      checks,
      day8Closure.decisionStory.visible && day8Closure.decisionStory.impactLines.length === 2,
      'Günün karar hikayesi + 2 etki satırı',
      'Decision story eksik',
    ) && ok;
  ok =
    assert(
      checks,
      day8Closure.neighborhoodPulse.visible && day8Closure.neighborhoodPulse.chips.length <= 3,
      'Mahalle tepkisi + bounded chip',
      'Neighborhood pulse eksik',
    ) && ok;
  ok =
    assert(
      checks,
      day8Closure.tradeoffBalance.visible &&
        day8Closure.tradeoffBalance.gains.length >= 1 &&
        day8Closure.tradeoffBalance.costs.length >= 1,
      'Kayıp/kazanç dengesi görünür',
      'Tradeoff eksik',
    ) && ok;
  ok =
    assert(
      checks,
      day8Closure.managerStyle.visible &&
        day8Closure.managerStyle.styleLabel.length > 0 &&
        day8Closure.managerStyle.behaviorSignals.length >= 1,
      'Day 8+ manager style kartı + davranış sinyali',
      'Manager style eksik',
    ) && ok;
  ok =
    assert(
      checks,
      day8Closure.tomorrowFocus.visible && day8Closure.tomorrowFocus.focusLine.length > 10,
      'Yarın tek odak üretilir',
      'Tomorrow focus eksik',
    ) && ok;
  ok =
    assert(
      checks,
      day8Closure.replayTimeline.items.length >= 3 && day8Closure.replayTimeline.items.length <= 5,
      'Replay timeline 3-5 an',
      `${day8Closure.replayTimeline.items.length} item`,
    ) && ok;

  const tone = buildEndOfDayClosingTonePresentation({
    day: 3,
    successScore: 48,
    metrics: baseMetrics(),
    maintenanceRiskHigh: true,
  });
  ok =
    assert(
      checks,
      tone.heroTitle.length > 0 && tone.statusBadge.length > 0,
      'Kapanış tonu hero + rozet üretir',
      'Tone model eksik',
    ) && ok;
  ok =
    assert(
      checks,
      resolveEndOfDayClosingToneId({ day: 3, successScore: 48, metrics: baseMetrics(), maintenanceRiskHigh: true }) ===
        'maintenance_risk',
      'Maintenance sinyali tone seçer',
      'Tone resolve hatalı',
    ) && ok;

  const dupes = closurePresentationHasDuplicateCopy(day8Closure);
  ok =
    assert(checks, dupes.length === 0, 'Closure duplicate copy guard', `Dupes: ${dupes.join(', ')}`) &&
    ok;

  const banned = day8Closure
    .collectStrings()
    .flatMap((line) => reportPresentationContainsBannedWords(line));
  ok =
    assert(
      checks,
      banned.length === 0,
      'Closure metinleri yasaklı kelime içermez',
      banned.join(', '),
    ) && ok;

  const reportView = readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx');
  const closureFlow = readRepo('src/features/reports/components/end-of-day/closure/EndOfDayClosurePrimaryFlow.tsx');
  ok =
    assert(
      checks,
      reportView.includes('EndOfDayClosurePrimaryFlow') &&
        reportView.includes('buildEndOfDayReportClosurePresentation') &&
        closureFlow.includes('EndOfDayManagerStyleCard'),
      'EndOfDayReportView closure flow bağlı',
      'View wiring eksik',
    ) && ok;
  ok =
    assert(
      checks,
      !reportView.includes('EndOfDayReportMetricGrid') || reportView.includes('cityMemoryNote'),
      'Dashboard grid yoğunluğu yok; strategic insight korunur',
      'View density/regression',
    ) && ok;

  const replay = buildEndOfDayReplayTimelinePresentation({ day: 5, isDay1: false });
  ok =
    assert(checks, replay.title === 'Gün Akışı' || replay.items.length >= 3, 'Replay timeline presentation', 'Replay hatalı') &&
    ok;

  const storyOnly = buildEndOfDayDecisionStoryPresentation({
    day: 5,
    metrics: baseMetrics(),
    decisionsToday: [],
  });
  ok = assert(checks, storyOnly.decisionSentence.length > 0, 'Decision story fallback', 'Story boş') && ok;

  const pulse = buildEndOfDayNeighborhoodPulsePresentation({ day: 5, socialPulseScore: 55 });
  ok = assert(checks, pulse.headline.length > 0, 'Neighborhood pulse headline', 'Pulse boş') && ok;

  const tradeoff = buildEndOfDayTradeoffBalancePresentation({
    day: 5,
    metrics: baseMetrics(),
    decisionsToday: [],
  });
  ok = assert(checks, tradeoff.balanceLabel.length > 0, 'Tradeoff balance label', 'Tradeoff boş') && ok;

  const tomorrow = buildEndOfDayTomorrowFocusPresentation({ day: 5, tomorrowNotes: ['Yarın bakım kontrolü'] });
  ok = assert(checks, tomorrow.focusLine.includes('bakım'), 'Tomorrow focus kaynaklardan türetilir', 'Focus hatalı') && ok;

  const earlyStyle = buildEndOfDayManagerStyleSurface({
    day: 5,
    metrics: baseMetrics(),
    decisionsToday: [
      {
        id: 'd5-1',
        day: 5,
        eventId: 'evt-1',
        eventTitle: 'Saha',
        decisionId: 'dec-1',
        decisionLabel: 'Hızlı müdahale',
        createdAt: new Date().toISOString(),
        appliedEffects: { publicSatisfaction: 2, budget: -800 },
        appliedCosts: {},
      },
    ],
    showStyleDetailCta: true,
  });
  ok =
    assert(
      checks,
      earlyStyle.status === 'early_signal' && earlyStyle.styleLabel.length > 0,
      'Gün 1-7 erken sinyal manager style',
      `early style ${earlyStyle.status}`,
    ) && ok;

  const failCount = checks.filter((c) => c.startsWith('✗')).length;
  return { ok, checks, failCount };
}
