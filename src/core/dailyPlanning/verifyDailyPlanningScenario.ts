import { createDay1Seed } from '@/core/content/day1Seed';
import type { EventCard } from '@/core/models/EventCard';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { normalizePersistedSave, SAVE_VERSION } from '@/store/gamePersist';

import {
  DAILY_PLANNING_COPY,
  DAILY_PLAN_UI_FORBIDDEN_WORDS,
  DEFAULT_OPERATION_FOCUS_POINTS,
  MAX_PLAN_REPORT_LINES,
} from './dailyPlanningConstants';
import {
  applyDailyPlanEffectsToOperationSignals,
  buildDailyPlanImpactPreview,
  calculateDailyPlanEffects,
  getDailyPlanAdvisorComment,
  processDailyPlanEndOfDay,
} from './dailyPlanningEngine';
import {
  buildDailyPlanEditModel,
  buildDailyPlanHubModel,
  buildDailyPlanReportModel,
  buildDailyPlanningEngineInputFromStore,
} from './dailyPlanningPresentation';
import {
  confirmDailyOperationsPlan,
  createDefaultSuggestedPlan,
  createInitialDailyOperationsPlan,
  getDailyPlanTotalCost,
  markDailyPlanProcessed,
  normalizeDailyOperationsPlan,
  refreshDailyOperationsPlanForDay,
  updateDailyOperationsPlanFocus,
} from './dailyPlanningState';

export type VerifyDailyPlanningOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(
  checks: string[],
  ok: boolean,
  pass: string,
  fail: string,
): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${fail}`);
  return ok;
}

function minimalEvent(): EventCard {
  return {
    id: 'evt-plan',
    title: 'Test',
    category: 'vehicle_route',
    riskLevel: 'high',
    district: 'merkez',
    description: 'Test',
    contextTag: 'test',
    urgencyHours: 4,
    decisions: [],
    previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
  };
}

export function verifyDailyPlanningScenario(): VerifyDailyPlanningOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const signals = createInitialOperationSignalsState(3);
  const initial = createInitialDailyOperationsPlan(3, signals.priorityDistrictId);

  ok =
    assert(
      checks,
      initial.status === 'suggested' &&
        initial.operationFocusPoints.total === DEFAULT_OPERATION_FOCUS_POINTS,
      'Initial daily plan doğru oluşuyor',
      'Initial plan hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      initial.districtFocusId === signals.priorityDistrictId,
      'Default priorityDistrict operationSignals’dan geliyor',
      'District focus hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      normalizeDailyOperationsPlan(undefined, 4).day === 4,
      'Normalize eksik planı onarıyor',
      'Normalize başarısız',
    ) && ok;

  ok =
    assert(
      checks,
      normalizeDailyOperationsPlan(
        { personnelFocus: 'invalid_focus', vehicleFocus: 'nope' },
        2,
      ).personnelFocus === 'balanced_shift',
      'Normalize bozuk focus değerlerini default’a çekiyor',
      'Bozuk focus normalize edilmedi',
    ) && ok;

  const expensivePlan = {
    ...initial,
    personnelFocus: 'rapid_response' as const,
    vehicleFocus: 'high_capacity' as const,
    containerFocus: 'intensive_collection' as const,
  };
  ok =
    assert(
      checks,
      getDailyPlanTotalCost(expensivePlan) === 6,
      'Focus point cost doğru hesaplanıyor',
      'Cost hesabı hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      getDailyPlanTotalCost(expensivePlan) > DEFAULT_OPERATION_FOCUS_POINTS,
      'Cost 5’i aşınca over budget oluşuyor',
      'Over budget algılanmadı',
    ) && ok;

  const rejectedUpdate = updateDailyOperationsPlanFocus(initial, {
    personnelFocus: 'rapid_response',
    vehicleFocus: 'high_capacity',
    containerFocus: 'intensive_collection',
  });
  ok =
    assert(
      checks,
      rejectedUpdate.personnelFocus === initial.personnelFocus,
      'Over budget update planı değiştirmiyor',
      'Over budget update kabul edildi',
    ) && ok;

  const confirmed = confirmDailyOperationsPlan(initial);
  ok =
    assert(
      checks,
      confirmed.status === 'confirmed' && confirmed.confirmedAtDay === 3,
      'confirmDailyOperationsPlan status confirmed yapıyor',
      'Confirm başarısız',
    ) && ok;

  const refreshed = refreshDailyOperationsPlanForDay(confirmed, 4, signals);
  ok =
    assert(
      checks,
      refreshed.day === 4 && refreshed.status === 'suggested',
      'Gün değişince yeni suggested plan oluşuyor',
      'Gün refresh başarısız',
    ) && ok;

  const seed = createDay1Seed();
  const processed = markDailyPlanProcessed(confirmed, 3, [
    { domain: 'vehicles', delta: -2, reason: 't' },
  ]);
  const reprocessed = processDailyPlanEndOfDay({
    plan: processed,
    closingDay: 3,
    engineInput: buildDailyPlanningEngineInputFromStore({
      gameState: { ...seed.gameState, city: { ...seed.gameState.city, day: 3 } },
      operationSignals: signals,
      dailyOperationsPlan: processed,
    }),
  });
  ok =
    assert(
      checks,
      reprocessed.plan.lastProcessedDay === 3,
      'Aynı gün processed plan tekrar işlenmiyor',
      'Idempotent process başarısız',
    ) && ok;

  const baseInput = {
    gameState: seed.gameState,
    operationSignals: signals,
    dailyOperationsPlan: initial,
    isDay1Tutorial: false,
  };

  const balancedFx = calculateDailyPlanEffects(baseInput, {
    ...initial,
    personnelFocus: 'balanced_shift',
  });
  ok =
    assert(
      checks,
      balancedFx.some((e) => e.domain === 'personnel' && e.delta < 0),
      'Personnel balanced effect küçük iyileştirme veriyor',
      'Balanced effect yok',
    ) && ok;

  const rapidFx = calculateDailyPlanEffects(baseInput, {
    ...initial,
    personnelFocus: 'rapid_response',
  });
  ok =
    assert(
      checks,
      rapidFx.some((e) => e.domain === 'personnel' && e.delta > 0),
      'Rapid response personnel risk tradeoff üretiyor',
      'Rapid tradeoff yok',
    ) && ok;

  const restFx = calculateDailyPlanEffects(baseInput, {
    ...initial,
    personnelFocus: 'rest_rotation',
  });
  ok =
    assert(
      checks,
      restFx.some((e) => e.domain === 'personnel' && e.delta < 0),
      'Rest rotation personel riskini azaltıyor',
      'Rest effect yok',
    ) && ok;

  const inspectFx = calculateDailyPlanEffects(baseInput, {
    ...initial,
    personnelFocus: 'field_inspection',
  });
  ok =
    assert(
      checks,
      inspectFx.some((e) => e.domain === 'districts' && e.delta < 0),
      'Field inspection district riskini azaltıyor',
      'Inspection district effect yok',
    ) && ok;

  const maintFx = calculateDailyPlanEffects(baseInput, {
    ...initial,
    vehicleFocus: 'preventive_maintenance',
  });
  ok =
    assert(
      checks,
      maintFx.some((e) => e.domain === 'vehicles' && e.delta < 0),
      'Preventive maintenance vehicle riskini azaltıyor',
      'Maintenance effect yok',
    ) && ok;

  const capacityFx = calculateDailyPlanEffects(baseInput, {
    ...initial,
    vehicleFocus: 'high_capacity',
  });
  ok =
    assert(
      checks,
      capacityFx.some((e) => e.domain === 'vehicles' && e.delta > 0) &&
        capacityFx.some((e) => e.domain === 'containers' && e.delta < 0),
      'High capacity container/vehicle tradeoff üretiyor',
      'Capacity tradeoff yok',
    ) && ok;

  const routeFx = calculateDailyPlanEffects(baseInput, {
    ...initial,
    vehicleFocus: 'route_check',
  });
  ok =
    assert(
      checks,
      routeFx.some((e) => e.domain === 'vehicles') &&
        routeFx.some((e) => e.domain === 'districts'),
      'Route check vehicle/district etkisi üretiyor',
      'Route effect yok',
    ) && ok;

  const intensiveFx = calculateDailyPlanEffects(baseInput, {
    ...initial,
    containerFocus: 'intensive_collection',
  });
  ok =
    assert(
      checks,
      intensiveFx.some((e) => e.domain === 'containers' && e.delta < 0) &&
        intensiveFx.some((e) => e.domain === 'vehicles' && e.delta > 0),
      'Intensive collection container riskini azaltıp vehicle riskini artırıyor',
      'Intensive effect yok',
    ) && ok;

  const cleanFx = calculateDailyPlanEffects(baseInput, {
    ...initial,
    containerFocus: 'cleanliness_maintenance',
  });
  ok =
    assert(
      checks,
      cleanFx.some((e) => e.domain === 'containers' && e.delta < 0) &&
        cleanFx.some((e) => e.domain === 'districts' && e.delta < 0),
      'Cleanliness maintenance container/district etkisi üretiyor',
      'Cleanliness effect yok',
    ) && ok;

  const riskFx = calculateDailyPlanEffects(baseInput, {
    ...initial,
    containerFocus: 'risk_inspection',
  });
  ok =
    assert(
      checks,
      riskFx.some((e) => e.domain === 'containers') &&
        riskFx.some((e) => e.domain === 'districts'),
      'Risk inspection district/container etkisi üretiyor',
      'Risk inspection effect yok',
    ) && ok;

  const districtFx = calculateDailyPlanEffects(baseInput, {
    ...initial,
    districtFocusId: 'cumhuriyet',
  });
  ok =
    assert(
      checks,
      districtFx.some((e) => e.domain === 'districts' && e.delta < 0),
      'District focus selected district etkisi üretiyor',
      'District effect yok',
    ) && ok;

  const applied = applyDailyPlanEffectsToOperationSignals(signals, [
    { domain: 'vehicles', delta: -200, reason: 'clamp' },
  ]);
  ok =
    assert(
      checks,
      applied.vehicles.score >= 0 && applied.vehicles.score <= 100,
      'applyDailyPlanEffectsToOperationSignals score clamp ediyor',
      'Clamp başarısız',
    ) && ok;

  const day1Fx = calculateDailyPlanEffects(
    { ...baseInput, isDay1Tutorial: true },
    initial,
  );
  ok =
    assert(
      checks,
      day1Fx.every((e) => Math.abs(e.delta) <= 4),
      'Day 1 effects düşük etkiyle çalışıyor',
      'Day1 effect çok büyük',
    ) && ok;

  const event = minimalEvent();
  const previewInput = {
    ...baseInput,
    gameState: { ...seed.gameState, city: { ...seed.gameState.city, day: 3 } },
  };
  ok =
    assert(
      checks,
      buildDailyPlanImpactPreview(previewInput, event) != null,
      'buildDailyPlanImpactPreview event ile crashesız çalışıyor',
      'Event preview crash',
    ) && ok;

  ok =
    assert(
      checks,
      buildDailyPlanImpactPreview(previewInput, event) != null,
      'buildDailyPlanImpactPreview decision fallback ile çalışıyor',
      'Decision preview başarısız',
    ) && ok;

  const hub = buildDailyPlanHubModel(baseInput);
  ok =
    assert(
      checks,
      hub.title.length > 0 && hub.advisorLine.length > 0 && hub.focusRows.length === 4,
      'Hub presentation model boş text üretmiyor',
      'Hub model boş',
    ) && ok;

  const edit = buildDailyPlanEditModel(baseInput);
  ok =
    assert(
      checks,
      edit.sections.every((s) => s.options.length > 0),
      'Edit presentation options boş değil',
      'Edit options boş',
    ) && ok;

  const report = buildDailyPlanReportModel(baseInput);
  ok =
    assert(
      checks,
      report.lines.length <= MAX_PLAN_REPORT_LINES,
      'Report model max 3 line koruyor',
      'Report çok uzun',
    ) && ok;

  ok =
    assert(
      checks,
      getDailyPlanAdvisorComment(baseInput).length > 10,
      'Advisor daily line daily planı okuyabiliyor',
      'Advisor line boş',
    ) && ok;

  ok =
    assert(
      checks,
      buildDailyPlanHubModel({ gameState: seed.gameState, dailyOperationsPlan: initial })
        .title.length > 0,
      'operationSignals yoksa planning fallback çalışıyor',
      'Signals fallback başarısız',
    ) && ok;

  ok =
    assert(
      checks,
      buildDailyPlanHubModel({ gameState: seed.gameState, dailyOperationsPlan: initial })
        .advisorLine.length > 0,
      'advisor yoksa planning fallback çalışıyor',
      'Advisor fallback başarısız',
    ) && ok;

  const hydrated = normalizePersistedSave({
    saveVersion: 15,
    gameState: seed.gameState,
    neighborhoods: seed.neighborhoods,
    resources: seed.resources,
    eventPool: seed.eventPool,
    decisionHistory: seed.decisionHistory,
    snapshots: seed.snapshots,
  });
  const persistOk =
    SAVE_VERSION === 25 &&
    hydrated != null &&
    hydrated.dailyOperationsPlan.day === seed.gameState.city.day;

  if (
    !warn(
      checks,
      persistOk,
      `Persist v${SAVE_VERSION} dailyOperationsPlan migration`,
      'Persist migration uyarısı',
    )
  ) {
    hasWarn = true;
  }

  let eodPlan = initial;
  eodPlan = markDailyPlanProcessed(eodPlan, 3, [{ domain: 'overall', delta: -1, reason: 't' }]);
  const eodAgain = markDailyPlanProcessed(eodPlan, 3, [
    { domain: 'overall', delta: -1, reason: 't2' },
  ]);
  ok =
    assert(
      checks,
      eodAgain.appliedEffects.length === eodPlan.appliedEffects.length,
      'EndCurrentDay idempotency bozulmuyor',
      'Plan process idempotent değil',
    ) && ok;

  const uiBlob = JSON.stringify({
    hub,
    edit,
    report,
    copy: DAILY_PLANNING_COPY,
  }).toLowerCase();
  const forbidden = DAILY_PLAN_UI_FORBIDDEN_WORDS.find((w) => uiBlob.includes(w));
  ok =
    assert(
      checks,
      forbidden == null,
      'Forbidden words yok: XP, premium, satın al, kilitli',
      `Yasaklı kelime: ${forbidden ?? '?'}`,
    ) && ok;

  ok =
    assert(
      checks,
      createDefaultSuggestedPlan(5, signals).day === 5,
      'Suggested plan üretilebiliyor',
      'Suggested plan başarısız',
    ) && ok;

  if (!warn(checks, SAVE_VERSION === 25, 'Full loop SAVE_VERSION 22', `SAVE_VERSION=${SAVE_VERSION}`)) {
    hasWarn = true;
  }

  return { ok, warn: hasWarn, checks };
}
