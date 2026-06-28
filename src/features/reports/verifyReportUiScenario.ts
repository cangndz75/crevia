import { buildReportBadgeSummaryModel } from '@/core/badges/badgePresentation';
import { buildProgressionBridgePilotReportLines } from '@/core/progression/progressionPresentation';
import { buildDay1AuthoritySummaryLines } from '@/core/authority/authorityPresentation';
import { applyDay1TutorialReportCopy } from '@/features/tutorial/tutorialSelectors';
import { buildDailyReport } from '@/core/game/buildDailyReport';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';

import {
  buildEndOfDayReportViewModel,
  buildEndOfDaySystemSummarySections,
  collectReportPresentationStrings,
  reportPresentationContainsBannedWords,
  type EndOfDaySystemSummarySection,
} from './utils/endOfDayReportPresentation';
import {
  auditEndDayCliffhangerPresentation,
  buildEndDayCliffhangerPresentation,
  cliffhangerStringsForAudit,
} from './utils/endDayCliffhangerPresentation';
import { buildReportReplayPresentation } from '@/core/reportReplay';

export type VerifyReportUiOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(
  checks: string[],
  ok: boolean,
  pass: string,
  fail: string,
): boolean {
  checks.push(ok ? `✓ ${pass}` : `✗ ${fail}`);
  return ok;
}

function baseReportParams(day: number) {
  return {
    day,
    metrics: { publicSatisfaction: 58, staffMorale: 56, budget: 72_000 },
    decisionHistory: [],
    activeEvents: [],
    resolvedEventIds: [],
    snapshots: [],
    containerState: createInitialContainerState(day),
    vehicleState: createInitialVehicleState(day),
    socialPulseState: createInitialSocialPulseState(day),
  };
}

export function verifyReportUiScenario(): VerifyReportUiOutcome {
  const checks: string[] = [];
  let ok = true;

  const day1Tutorial = applyDay1TutorialReportCopy(
    {
      ...buildDailyReport(baseReportParams(1)),
      badgeEvaluation: {
        earnedBadgeIds: ['first_step'],
        earnedLines: ['Yeni rozet kazanıldı: İlk Saha İmzası'],
        progressLines: [],
      },
    },
    true,
  );

  ok =
    assert(
      checks,
      buildEndOfDayReportViewModel({
        report: day1Tutorial,
        metrics: { publicSatisfaction: 52, staffMorale: 50, budget: 60_000 },
        dailyXpReport: { day: 1, totalXp: 0, categories: [] },
        day1PriorityLine: 'İlk gün odağı',
        day1GoalsLine: 'İlk gün hedeflerini tanı.',
      }).isDay1 === true,
      'Day 1 report render path crash olmaz',
      'Day 1 view model hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      day1Tutorial.badgeEvaluation == null &&
        (day1Tutorial.authoritySummaryLines?.length ?? 0) <= 2,
      'Day 1 tutorial rozet gizli ve yetki max 2 satır',
      'Day 1 tutorial compact hatalı',
    ) && ok;

  const normalReport = {
    ...buildDailyReport(baseReportParams(3)),
    authoritySummaryLines: ['Yetki güveni arttı.', 'Yeni izin açıldı.'],
    badgeEvaluation: {
      earnedBadgeIds: [],
      earnedLines: [],
      progressLines: ['Rozet ilerlemesi: Halkın Sesi 2/3'],
    },
    containerSummaryLines: ['Konteyner durumu dengede.'],
    vehicleSummaryLines: ['Araç filosu uygun.'],
    socialSummaryLines: ['Sosyal nabız stabil.'],
    personnelSummaryLines: ['Personel morali korundu.'],
  };

  const normalModel = buildEndOfDayReportViewModel({
    report: normalReport,
    metrics: { publicSatisfaction: 58, staffMorale: 56, budget: 72_000 },
    dailyXpReport: { day: 3, totalXp: 40, categories: [] },
  });

  ok =
    assert(
      checks,
      normalModel.impactMetrics.length === 3 &&
        normalModel.systemSections.length >= 1 &&
        normalModel.showSystemSummaries === true,
      'Normal day report authority + badge + system summaries ile crash olmaz',
      'Normal day view model hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildReportBadgeSummaryModel(undefined).visible === false &&
        buildReportBadgeSummaryModel({
          earnedBadgeIds: [],
          earnedLines: [],
          progressLines: [],
        }).visible === false,
      'Badge kazanımı yoksa ReportBadgeSummary gizli kalır',
      'Empty badge summary visible hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildReportBadgeSummaryModel({
        earnedBadgeIds: ['first_step'],
        earnedLines: ['Yeni rozet kazanıldı: İlk Saha İmzası'],
        progressLines: [],
      }).mode === 'earned',
      'Badge kazanımı varsa earned mode görünür',
      'Earned badge mode hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildDay1AuthoritySummaryLines().length <= 2,
      'Authority summary max 2 satır modelini korur',
      'Authority max satır hatalı',
    ) && ok;

  const day7Report = {
    ...buildDailyReport(baseReportParams(7)),
    authoritySummaryLines: ['Yetki güveni güncellendi.'],
    authorityEvaluation: {
      day: 7,
      pilotScore: 78,
      trustAtEvaluation: 420,
      previousFormalRankId: 'field_coordinator' as const,
      evaluationStatus: 'promotion_candidate' as const,
      promoted: false,
      summaryLines: ['Terfi adaylığı oluştu.'],
    },
    authorityEvaluationLines: ['Terfi adaylığı oluştu.'],
  };

  const day7Model = buildEndOfDayReportViewModel({
    report: day7Report,
    metrics: { publicSatisfaction: 62, staffMorale: 58, budget: 68_000 },
    dailyXpReport: { day: 7, totalXp: 55, categories: [] },
  });

  const progressionLines = buildProgressionBridgePilotReportLines({
    authorityState: undefined,
    currentDay: 7,
  });

  ok =
    assert(
      checks,
      day7Model.isDay7 === true &&
        day7Report.authorityEvaluation != null &&
        progressionLines?.scopeLine.includes('Sıradaki kapsam:') === true,
      'Day 7 report PilotCompletionCard ile authorityEvaluation + progression korunur',
      'Day 7 report model hatalı',
    ) && ok;

  const presentationStrings = collectReportPresentationStrings(normalModel, normalReport);
  const bannedHits = presentationStrings.flatMap((line: string) =>
    reportPresentationContainsBannedWords(line),
  );

  ok =
    assert(
      checks,
      bannedHits.length === 0,
      'Yasaklı kelimeler report presentation metinlerinde geçmez',
      `Yasaklı kelime bulundu: ${[...new Set(bannedHits)].join(', ')}`,
    ) && ok;

  ok =
    assert(
      checks,
      buildEndOfDaySystemSummarySections(normalReport, 2).every(
        (section: EndOfDaySystemSummarySection) => section.lines.length <= 2,
      ),
      'Sistem özetleri max 2 satır sınırını korur',
      'System summary satır limiti hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      normalModel.impactMetrics.length <= 3 &&
        normalModel.tomorrowNotes.length <= 3,
      'Report ordering tutarlı kalır (impact + notes sınırları)',
      'Report ordering/limit hatalı',
    ) && ok;

  const cliffhangerDay3 = buildEndDayCliffhangerPresentation({
    day: 3,
    socialPulseScore: 62,
    operationSignals: {
      personnel: { status: 'watch', summary: 'Ekip temposu yüksek' },
      overall: { status: 'watch' },
    },
    lastDistrictName: 'Cumhuriyet Mahallesi',
    reportSummaryLines: normalReport.summaryLines,
  });
  const cliffhangerAudit = auditEndDayCliffhangerPresentation(cliffhangerDay3);

  ok =
    assert(
      checks,
      cliffhangerDay3.visible === true &&
        cliffhangerDay3.closingBridge.title === 'Yarına Kalan İz' &&
        cliffhangerDay3.tomorrowRisk.title.length > 0 &&
        cliffhangerDay3.districtWatch.districts.length <= 2 &&
        cliffhangerDay3.carriedPressures.items.length === 3 &&
        cliffhangerAudit.length === 0,
      'Gün sonu cliffhanger presentation derive edilir ve audit geçer',
      `Cliffhanger audit: ${cliffhangerAudit.join(', ')}`,
    ) && ok;

  const cliffhangerBanned = cliffhangerStringsForAudit(cliffhangerDay3).flatMap((line) =>
    reportPresentationContainsBannedWords(line),
  );
  ok =
    assert(
      checks,
      cliffhangerBanned.length === 0,
      'Cliffhanger metinleri yasaklı kelime içermez',
      `Cliffhanger yasaklı: ${[...new Set(cliffhangerBanned)].join(', ')}`,
    ) && ok;

  const cliffhangerDay1 = buildEndDayCliffhangerPresentation({ day: 1 });
  ok =
    assert(
      checks,
      cliffhangerDay1.closingBridge.summary.length > 0 &&
        cliffhangerDay1.primaryCta.label === 'Yarına Hazırlan',
      'Gün 1 cliffhanger hafif fallback ve CTA üretir',
      'Gün 1 cliffhanger hatalı',
    ) && ok;

  const replayEmpty = buildReportReplayPresentation({ day: 1 });
  ok =
    assert(
      checks,
      replayEmpty.items.length >= 3 && replayEmpty.title === 'Gün Akışı',
      'Gün akışı replay fallback üretir',
      `${replayEmpty.items.length} item`,
    ) && ok;

  return { ok, checks };
}
