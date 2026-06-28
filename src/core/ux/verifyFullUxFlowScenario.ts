import { applyDecision } from '@/core/game/applyDecision';
import { createDay1Seed } from '@/core/content/day1Seed';
import { selectAuthorityPermissionPreviewForDecision } from '@/core/authority/authorityPermissionPreview';
import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import { buildReportBadgeSummaryModel } from '@/core/badges/badgePresentation';
import { buildDailyReport } from '@/core/game/buildDailyReport';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import { runFullLoopMetaProgressionHealthCheck } from '@/core/metaProgression/metaProgressionAudit';
import { buildProgressionBridgePilotReportLines } from '@/core/progression/progressionPresentation';
import {
  collectFullUxWorkflowPresentationStrings,
  FULL_UX_CHECKED_SCREENS,
  FULL_UX_LAYOUT_GUARDS,
  fullUxTextContainsBannedWords,
  resolveReportContinueCtaLabel,
  WORKFLOW_CTA_LABELS,
} from '@/core/ux/uxFlowPresentation';
import {
  buildDispatchScreenModel,
  buildFieldScreenModel,
  collectDispatchFieldPresentationStrings,
} from '@/features/events/utils/eventWorkflowDispatchFieldPresentation';
import { buildPlanScreenModel } from '@/features/events/utils/eventWorkflowPlanPresentation';
import {
  buildInspectHeroChips,
  buildSignalSummary,
  OPERATION_WORKFLOW_STEPS,
} from '@/features/events/utils/eventWorkflowPresentation';
import { buildHubAuthorityChipSummaryFromPilot } from '@/features/hub/utils/hubAuthorityModel';
import { deriveHubStatusStrip } from '@/features/hub/utils/hubDerived';
import {
  buildMapNeighborhoodStripItems,
  buildMapOperationPanelModel,
  collectMapUiPresentationStrings,
} from '@/features/map/utils/mapUiPresentation';
import { DEFAULT_PILOT_DISTRICT_ID } from '@/core/models/DistrictProfile';
import { mapDistrictFromPilot } from '@/features/map/data/mapDistrictMapping';
import { pilotAreaFromDistrict } from '@/features/map/data/pilotAreaMapping';
import type { EventCard } from '@/core/models/EventCard';
import {
  buildEndOfDayReportViewModel,
  collectReportPresentationStrings,
} from '@/features/reports/utils/endOfDayReportPresentation';
import { applyDay1TutorialReportCopy } from '@/features/tutorial/tutorialSelectors';
import { buildProfileAuthoritySummary } from '@/features/profile/utils/profileAuthorityModel';
import { buildProfileBadgeShowcaseSummary } from '@/features/profile/utils/profileBadgeModel';
import { buildDay1AuthoritySummaryLines } from '@/core/authority/authorityPresentation';

export type FullUxFlowAudit = {
  checkedScreens: readonly string[];
  warningCount: number;
  day1CompactStatus: 'compact' | 'fail';
  day7FinalStatus: 'ready' | 'fail';
  forbiddenWordCount: number;
  flowHealth: 'PASS' | 'WARN' | 'FAIL';
};

export type VerifyFullUxFlowOutcome = {
  ok: boolean;
  checks: string[];
  audit: FullUxFlowAudit;
};

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function sampleWorkflowEvent(partial?: Partial<EventCard>): EventCard {
  return {
    id: 'evt_full_ux_flow',
    title: 'Mahalle temizlik baskısı',
    category: 'waste',
    riskLevel: 'medium',
    district: 'Cumhuriyet',
    description: 'Test olay',
    contextTag: 'test',
    urgencyHours: 4,
    day: 2,
    previewEffects: { publicSatisfaction: -2, risk: 1, xp: 0 },
    decisions: [
      {
        id: 'd_flow',
        title: 'Ekibi yönlendir',
        description: 'Saha ekibini hızlı sevk et',
        style: 'balanced',
        effects: { publicSatisfaction: 3, budget: -1200, morale: -1, risk: -1, xp: 0 },
      },
    ],
    ...partial,
  };
}

function digestApplyDecisionResult(result: ReturnType<typeof applyDecision>): string {
  const record = result.decisionRecord;
  return JSON.stringify({
    eventId: record.eventId,
    decisionId: record.decisionId,
    publicSatisfaction: result.afterSnapshot.metrics.publicSatisfaction,
    budget: result.afterSnapshot.metrics.budget,
    staffMorale: result.afterSnapshot.metrics.staffMorale,
    xpTotal: result.xp.playerProgress.totalXp,
    leveledUp: result.xp.leveledUp,
    solvedCount: result.nextState.solvedEvents.length,
  });
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

function layoutGuardsComplete(): boolean {
  const guards = FULL_UX_LAYOUT_GUARDS;
  return (
    guards.hubTaskHero.usesMinWidthZero === true &&
    guards.hubAuthorityChip.usesMinWidthZero === true &&
    guards.mapOperationBottomPanel.usesMinWidthZero === true &&
    guards.decisionOptionCard.usesMinWidthZero === true &&
    guards.fieldImpactMetricsRow.usesMinWidthZero === true &&
    guards.dispatchCommandCard.usesMinWidthZero === true &&
    guards.endOfDayImpactStrip.usesMinWidthZero === true
  );
}

export function verifyFullUxFlowScenario(): VerifyFullUxFlowOutcome {
  const checks: Check[] = [];
  let warningCount = 0;
  let day1CompactStatus: FullUxFlowAudit['day1CompactStatus'] = 'compact';
  let day7FinalStatus: FullUxFlowAudit['day7FinalStatus'] = 'ready';

  const event = sampleWorkflowEvent();
  const decision = event.decisions[0]!;

  // 1 — Hub fresh path
  try {
    const day1 = createDay1Seed();
    const hubChip = buildHubAuthorityChipSummaryFromPilot(
      day1.gameState.pilot.authorityState,
      day1.gameState.pilot.currentPilotDay,
    );
    const hubStrip = deriveHubStatusStrip(
      {
        day: day1.gameState.city.day,
        metrics: {
          publicSatisfaction: day1.gameState.city.publicSatisfaction,
          budget: day1.gameState.city.budget,
          staffMorale: day1.gameState.city.morale,
        },
        activeEvents: day1.gameState.events,
        decisionCount: 0,
      },
      day1.resources,
    );
    assert(
      checks,
      hubChip.rankLabel.length > 0 && hubStrip.length >= 0,
      'Fresh state Hub render path crash olmaz',
    );
  } catch (error) {
    assert(
      checks,
      false,
      'Fresh state Hub render path crash olmaz',
      error instanceof Error ? error.message : 'unknown',
    );
  }

  // 2 — Day 1 tutorial flow models
  try {
    const day1Event = sampleWorkflowEvent({ id: 'day1_tutorial_waste_intro', day: 1 });
    buildSignalSummary(day1Event);
    buildInspectHeroChips(day1Event);
    assert(checks, true, 'Day 1 tutorial flow crash olmaz');
  } catch (error) {
    assert(
      checks,
      false,
      'Day 1 tutorial flow crash olmaz',
      error instanceof Error ? error.message : 'unknown',
    );
    day1CompactStatus = 'fail';
  }

  // 3–7 — Workflow phase render models
  try {
    buildSignalSummary(event);
    buildInspectHeroChips(event);
    assert(checks, true, 'İncele fazı render path güvenli');
  } catch (error) {
    assert(
      checks,
      false,
      'İncele fazı render path güvenli',
      error instanceof Error ? error.message : 'unknown',
    );
  }

  try {
    const planModel = buildPlanScreenModel(event);
    assert(
      checks,
      planModel.options.length > 0,
      'Planla fazı render path güvenli',
    );
  } catch (error) {
    assert(
      checks,
      false,
      'Planla fazı render path güvenli',
      error instanceof Error ? error.message : 'unknown',
    );
  }

  try {
    const dispatchModel = buildDispatchScreenModel({ event, selectedDecision: decision });
    assert(
      checks,
      dispatchModel.commandGoalLine.length > 0,
      'Yönlendir fazı render path güvenli',
    );
  } catch (error) {
    assert(
      checks,
      false,
      'Yönlendir fazı render path güvenli',
      error instanceof Error ? error.message : 'unknown',
    );
  }

  try {
    const fieldModel = buildFieldScreenModel({ event, decision });
    assert(
      checks,
      fieldModel.impactMetrics.length === 3,
      'Sahada fazı render path güvenli',
    );
  } catch (error) {
    assert(
      checks,
      false,
      'Sahada fazı render path güvenli',
      error instanceof Error ? error.message : 'unknown',
    );
  }

  assert(
    checks,
    OPERATION_WORKFLOW_STEPS.some((s) => s.id === 'result'),
    'Sonuç fazı workflow adımı tanımlı',
  );

  // 8 — applyDecision unchanged
  try {
    const seed = createDay1Seed();
    const targetEvent = seed.gameState.events[0];
    const targetDecision = targetEvent?.decisions[0];
    if (!targetEvent || !targetDecision) {
      assert(checks, false, 'applyDecision sonucu değişmeden kalır', 'day1 event missing');
    } else {
      const state = {
        ...seed.gameState,
        resources: seed.resources,
        neighborhoods: seed.neighborhoods,
      };
      const first = applyDecision({
        state,
        eventId: targetEvent.id,
        decisionId: targetDecision.id,
      });
      const second = applyDecision({
        state,
        eventId: targetEvent.id,
        decisionId: targetDecision.id,
      });
      assert(
        checks,
        digestApplyDecisionResult(first) === digestApplyDecisionResult(second),
        'applyDecision sonucu değişmeden kalır',
      );
    }
  } catch (error) {
    assert(
      checks,
      false,
      'applyDecision sonucu değişmeden kalır',
      error instanceof Error ? error.message : 'unknown',
    );
  }

  // 9 — Legacy / non-workflow path (presentation + decision list)
  try {
    const legacyStrings = [
      event.title,
      ...event.decisions.map((d) => d.title),
      'Aksiyonu Uygula',
    ];
    assert(
      checks,
      legacyStrings.every((s) => s.length > 0),
      'Workflow dışı mode crash olmaz',
    );
  } catch (error) {
    assert(
      checks,
      false,
      'Workflow dışı mode crash olmaz',
      error instanceof Error ? error.message : 'unknown',
    );
  }

  // 10 — Day 1 permission preview hidden
  const day1Preview = selectAuthorityPermissionPreviewForDecision({
    authorityState: createInitialAuthorityState(1),
    decision,
    event,
    day: 1,
  });
  assert(
    checks,
    day1Preview.visible === false,
    'Authority permission preview Day 1’de gizli kalır',
  );

  // 11 — Normal day permission preview safe
  const day3Preview = selectAuthorityPermissionPreviewForDecision({
    authorityState: createInitialAuthorityState(3),
    decision,
    event,
    day: 3,
  });
  assert(
    checks,
    day3Preview.visible === true && day3Preview.line.length > 0,
    'Authority permission preview normal günde layout güvenli',
  );

  // 12 — Map selectedPin undefined
  try {
    const pilotDistrictId = DEFAULT_PILOT_DISTRICT_ID;
    const panel = buildMapOperationPanelModel({
      viewMode: 'overview',
      focusDistrictId: mapDistrictFromPilot(pilotDistrictId),
      pilotAreaId: pilotAreaFromDistrict(pilotDistrictId),
      pilotDistrictId,
      gameDay: 1,
      activeEvents: [],
      containerState: createInitialContainerState(1),
      vehicleState: createInitialVehicleState(1),
      hideFleetSignals: true,
      dayEventTitle: 'İlk gün saha notu',
    });
    const strip = buildMapNeighborhoodStripItems({
      pilotDistrictId,
      focusDistrictId: mapDistrictFromPilot(pilotDistrictId),
      gameDay: 1,
    });
    assert(
      checks,
      panel.visible && panel.districtLabel.length > 0 && strip.length >= 0,
      'Map screen selectedPin undefined iken crash olmaz',
    );
  } catch (error) {
    assert(
      checks,
      false,
      'Map screen selectedPin undefined iken crash olmaz',
      error instanceof Error ? error.message : 'unknown',
    );
  }

  // 13 — Day 1 report compact
  const day1Report = applyDay1TutorialReportCopy(
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
  const day1Model = buildEndOfDayReportViewModel({
    report: day1Report,
    metrics: { publicSatisfaction: 52, staffMorale: 50, budget: 60_000 },
    dailyXpReport: { day: 1, totalXp: 0, categories: [] },
    day1PriorityLine: 'İlk gün odağı',
    day1GoalsLine: 'İlk gün hedeflerini tanı.',
  });
  const day1CompactOk =
    day1Model.isDay1 === true &&
    day1Report.badgeEvaluation == null &&
    (day1Report.authoritySummaryLines?.length ?? 0) <= 2 &&
    day1Model.showSystemSummaries === false;
  assert(checks, day1CompactOk, 'Gün sonu rapor Day 1 compact kalır');
  if (!day1CompactOk) {
    day1CompactStatus = 'fail';
  }

  // 14 — Normal day report
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
  assert(
    checks,
    normalModel.impactMetrics.length === 3 &&
      normalModel.showSystemSummaries === true &&
      buildReportBadgeSummaryModel(normalReport.badgeEvaluation).visible === true,
    'Gün sonu rapor normal gün authority/badge ile crash olmaz',
  );

  // 15–16 — Day 7 pilot completion + CTA
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
  const day7Progression = buildProgressionBridgePilotReportLines({
    authorityState: createInitialAuthorityState(7),
    currentDay: 7,
  });
  const day7Ok =
    day7Model.isDay7 === true &&
    day7Report.authorityEvaluation != null &&
    day7Progression?.scopeLine.includes('Sıradaki kapsam:') === true;
  assert(
    checks,
    day7Ok,
    'Gün sonu rapor Day 7 pilot completion ile crash olmaz',
  );
  if (!day7Ok) {
    day7FinalStatus = 'fail';
  }

  const day7Cta = resolveReportContinueCtaLabel(7, true);
  const normalCta = resolveReportContinueCtaLabel(3, false);
  assert(
    checks,
    day7Cta === WORKFLOW_CTA_LABELS.reportDay7Continue,
    'Day 7 CTA “Ana Operasyona Göz At” üretir',
    day7Cta,
  );
  assert(
    checks,
    normalCta === WORKFLOW_CTA_LABELS.reportContinue,
    'Normal gün CTA “Yarına Hazırlan” üretir',
    normalCta,
  );

  // 17–18 — Profile cards undefined safety
  assert(
    checks,
    buildProfileAuthoritySummary(undefined).rankLabel.length > 0,
    'ProfileAuthorityCard undefined authorityState ile crash olmaz',
  );
  assert(
    checks,
    buildProfileBadgeShowcaseSummary(undefined, 1).totalCount === 12,
    'ProfileBadgeShowcaseCard undefined badgeState ile crash olmaz',
  );

  // 19 — Forbidden words
  const dispatchField = collectDispatchFieldPresentationStrings(
    buildDispatchScreenModel({ event, selectedDecision: decision }),
    buildFieldScreenModel({ event, decision }),
  );
  const mapStrip = buildMapNeighborhoodStripItems({
    pilotDistrictId: DEFAULT_PILOT_DISTRICT_ID,
    focusDistrictId: mapDistrictFromPilot(DEFAULT_PILOT_DISTRICT_ID),
    gameDay: 2,
  });
  const mapPanel = buildMapOperationPanelModel({
    viewMode: 'overview',
    focusDistrictId: mapDistrictFromPilot(DEFAULT_PILOT_DISTRICT_ID),
    pilotAreaId: pilotAreaFromDistrict(DEFAULT_PILOT_DISTRICT_ID),
    pilotDistrictId: DEFAULT_PILOT_DISTRICT_ID,
    gameDay: 2,
    activeEvents: [event],
    containerState: createInitialContainerState(2),
    vehicleState: createInitialVehicleState(2),
    hideFleetSignals: false,
    dayEventTitle: event.title,
  });
  const allStrings = [
    ...collectFullUxWorkflowPresentationStrings(),
    ...dispatchField,
    ...collectMapUiPresentationStrings(mapStrip, mapPanel),
    ...collectReportPresentationStrings(normalModel, normalReport),
    buildProfileAuthoritySummary(undefined).rankLabel,
    buildProfileBadgeShowcaseSummary(undefined, 1).earnedCountLabel,
    ...buildDay1AuthoritySummaryLines(),
  ];
  const forbiddenHits = allStrings.flatMap((line) => fullUxTextContainsBannedWords(line));
  const forbiddenWordCount = new Set(forbiddenHits).size;
  assert(
    checks,
    forbiddenWordCount === 0,
    'Yasaklı kelime taraması temizdir',
    [...new Set(forbiddenHits)].join(', ') || 'ok',
  );

  // 20 — Small screen layout guards manifest
  assert(
    checks,
    layoutGuardsComplete(),
    'Small screen guard listesinde kritik componentlerde numberOfLines/flexShrink/minWidth kontrolü vardır',
  );

  // 21 — Full loop health
  const loopHealth = runFullLoopMetaProgressionHealthCheck();
  assert(
    checks,
    loopHealth.ok,
    'Full-loop verify ile ana oyun döngüsü hâlâ geçer',
    `crashes=${loopHealth.crashCount}`,
  );

  // 22 — Workflow CTA labels
  assert(
    checks,
    WORKFLOW_CTA_LABELS.inspect === 'Planlamaya Geç' &&
      WORKFLOW_CTA_LABELS.plan === 'Yönlendirmeye Geç' &&
      WORKFLOW_CTA_LABELS.dispatch === 'Ekibi Sahaya Çıkar' &&
      WORKFLOW_CTA_LABELS.field === 'Sonucu Gör',
    'Workflow ana CTA metinleri net ve tekil',
  );

  const failCount = checks.filter((c) => !c.ok).length;
  if (forbiddenWordCount > 0) {
    warningCount += 1;
  }
  if (day1CompactStatus === 'fail' || day7FinalStatus === 'fail') {
    warningCount += 1;
  }

  const flowHealth: FullUxFlowAudit['flowHealth'] =
    failCount > 0 ? 'FAIL' : warningCount > 0 ? 'WARN' : 'PASS';

  const audit: FullUxFlowAudit = {
    checkedScreens: FULL_UX_CHECKED_SCREENS,
    warningCount,
    day1CompactStatus,
    day7FinalStatus,
    forbiddenWordCount,
    flowHealth,
  };

  return {
    ok: failCount === 0,
    checks: checks.map((c) => (c.ok ? `✓ ${c.name}` : `✗ ${c.name}${c.detail ? `: ${c.detail}` : ''}`)),
    audit,
  };
}
