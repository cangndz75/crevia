import { createDay1Seed } from '@/core/content/day1Seed';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import type { EventCard } from '@/core/models/EventCard';
import { createInitialAdvisorState } from '@/core/advisors/advisorState';
import { createInitialDailyOperationsPlan } from '@/core/dailyPlanning/dailyPlanningState';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { normalizePersistedSave, SAVE_VERSION } from '@/store/gamePersist';

import {
  ASSIGNMENT_COPY,
  ASSIGNMENT_UI_FORBIDDEN_WORDS,
  MAX_ASSIGNMENT_REPORT_LINES,
} from './assignmentConstants';
import {
  applyAssignmentEffectsToOperationSignals,
  buildDefaultAssignmentForEvent,
  calculateAssignmentCompatibility,
  calculateAssignmentEffects,
  getAssignmentAdvisorComment,
  getEventCategoryForAssignment,
  isAssignmentStrongFit,
  isAssignmentWeakFit,
  processAssignmentsEndOfDay,
} from './assignmentEngine';
import {
  buildAssignmentEditorModel,
  buildAssignmentEngineInputFromStore,
  buildAssignmentImpactPreviewModel,
  buildAssignmentPanelModel,
  buildAssignmentReportModel,
} from './assignmentPresentation';
import {
  confirmEventAssignment as confirmAssignmentState,
  createInitialAssignmentsState,
  getEventAssignment,
  markEventAssignmentDispatched,
  markEventAssignmentProcessed,
  normalizeAssignmentsState,
  upsertEventAssignment,
} from './assignmentState';
import type { AssignmentEngineInput, EventAssignmentState } from './assignmentTypes';

export type VerifyAssignmentOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${fail}`);
  return ok;
}

function eventOf(
  partial: Partial<EventCard> & Pick<EventCard, 'id' | 'category'>,
): EventCard {
  return {
    title: 'Test Olay',
    district: 'merkez',
    districtIds: ['merkez'],
    description: 'Test',
    contextTag: 'test',
    riskLevel: 'medium',
    urgencyHours: 4,
    decisions: [],
    previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    ...partial,
  };
}

function baseInput(
  overrides?: Partial<AssignmentEngineInput>,
): AssignmentEngineInput {
  const day1 = createDay1Seed();
  return {
    gameState: day1.gameState,
    operationSignals: createInitialOperationSignalsState(
      day1.gameState.city.day,
    ),
    assignments: createInitialAssignmentsState(),
    isDay1Tutorial: false,
    ...overrides,
  };
}

export function verifyAssignmentScenario(): VerifyAssignmentOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const initial = createInitialAssignmentsState();
  ok =
    assert(
      checks,
      Object.keys(initial.assignmentsByEventId).length === 0,
      'Initial assignments state doğru oluşuyor',
      'Initial state boş değil',
    ) && ok;

  const normalizedEmpty = normalizeAssignmentsState(undefined);
  ok =
    assert(
      checks,
      Object.keys(normalizedEmpty.assignmentsByEventId).length === 0,
      'Normalize eksik assignments state onarıyor',
      'Normalize başarısız',
    ) && ok;

  const broken = normalizeAssignmentsState({
    assignmentsByEventId: {
      bad: { foo: 'bar' },
      good: {
        eventId: 'good',
        day: 2,
        status: 'draft',
        source: 'player',
        personnelType: 'balanced_team',
        vehicleType: 'standard_truck',
        approachType: 'balanced_response',
        compatibilityScore: 55,
        compatibilityLabel: 'Dengeli uyum',
        effects: [],
      },
    },
  });
  ok =
    assert(
      checks,
      broken.assignmentsByEventId.bad === undefined &&
        broken.assignmentsByEventId.good != null,
      'Bozuk assignment kayıtları güvenli atılıyor',
      'Bozuk kayıt temizlenmedi',
    ) && ok;

  const containerEvent = eventOf({
    id: 'evt-container',
    category: 'container_overflow',
    riskLevel: 'high',
  });
  const socialEvent = eventOf({
    id: 'evt-social',
    category: 'social_complaint',
    district: 'cumhuriyet',
  });
  const routeEvent = eventOf({
    id: 'evt-route',
    category: 'vehicle_route_delay',
    riskLevel: 'high',
  });

  const containerDefault = buildDefaultAssignmentForEvent(
    baseInput(),
    containerEvent,
  );
  ok =
    assert(
      checks,
      containerDefault.personnelType === 'technical_team' &&
        (containerDefault.vehicleType === 'maintenance_vehicle' ||
          containerDefault.vehicleType === 'high_capacity_vehicle'),
      'Default assignment container event için teknik/bakım odaklı geliyor',
      `container default: ${containerDefault.personnelType}/${containerDefault.vehicleType}`,
    ) && ok;

  const socialDefault = buildDefaultAssignmentForEvent(baseInput(), socialEvent);
  ok =
    assert(
      checks,
      socialDefault.personnelType === 'public_relations_team' &&
        socialDefault.approachType === 'public_first',
      'Default assignment social event için halk iletişim odaklı geliyor',
      `social default: ${socialDefault.personnelType}`,
    ) && ok;

  const routeDefault = buildDefaultAssignmentForEvent(baseInput(), routeEvent);
  ok =
    assert(
      checks,
      routeDefault.vehicleType === 'route_support_vehicle',
      'Default assignment vehicle/route event için rota odaklı geliyor',
      `route default vehicle: ${routeDefault.vehicleType}`,
    ) && ok;

  const compatMid = calculateAssignmentCompatibility(
    baseInput(),
    containerEvent,
    containerDefault,
  );
  ok =
    assert(
      checks,
      compatMid.score >= 0 && compatMid.score <= 100,
      'Compatibility score 0-100 clamp ediliyor',
      `score=${compatMid.score}`,
    ) && ok;

  ok =
    assert(
      checks,
      compatMid.label === 'Güçlü uyum' || compatMid.label === 'Dengeli uyum',
      'Compatibility label thresholds doğru',
      `label=${compatMid.label}`,
    ) && ok;

  const strongAssignment: EventAssignmentState = {
    ...containerDefault,
    compatibilityLabel: 'Güçlü uyum',
    compatibilityScore: 80,
  };
  ok =
    assert(
      checks,
      isAssignmentStrongFit(baseInput(), containerEvent, strongAssignment),
      'Strong fit doğru tespit ediliyor',
      'strong fit false',
    ) && ok;

  const weakAssignment: EventAssignmentState = {
    ...containerDefault,
    personnelType: 'public_relations_team',
    vehicleType: 'compact_service_vehicle',
    approachType: 'low_resource',
    compatibilityLabel: 'Zayıf uyum',
    compatibilityScore: 30,
  };
  ok =
    assert(
      checks,
      isAssignmentWeakFit(baseInput(), containerEvent, weakAssignment),
      'Weak fit doğru tespit ediliyor',
      'weak fit false',
    ) && ok;

  const planBase = createInitialDailyOperationsPlan(3, 'merkez');
  const planDistrictInput = baseInput({
    dailyOperationsPlan: {
      ...planBase,
      status: 'confirmed',
      districtFocusId: 'merkez',
      personnelFocus: 'balanced_shift',
      vehicleFocus: 'route_check',
      containerFocus: 'standard_collection',
      confirmedAtDay: 3,
    },
  });
  const districtCompat = calculateAssignmentCompatibility(
    planDistrictInput,
    eventOf({ id: 'd1', category: 'test', districtIds: ['merkez'] }),
    containerDefault,
  );
  ok =
    assert(
      checks,
      districtCompat.strengths.some((s) => s.includes('Günlük plan')),
      'Daily plan districtFocus aynı district event bonus veriyor',
      'district bonus yok',
    ) && ok;

  const rapidPlanInput = baseInput({
    dailyOperationsPlan: {
      ...planBase,
      status: 'confirmed',
      personnelFocus: 'rapid_response',
      vehicleFocus: 'ready_fleet',
      confirmedAtDay: 3,
    },
  });
  const rapidCompat = calculateAssignmentCompatibility(
    rapidPlanInput,
    routeEvent,
    {
      ...routeDefault,
      approachType: 'rapid_response',
      personnelType: 'field_response_team',
    },
  );
  ok =
    assert(
      checks,
      rapidCompat.score >= 50,
      'Daily plan rapid_response assignment bonus veriyor',
      `rapid score=${rapidCompat.score}`,
    ) && ok;

  const maintPlanCompat = calculateAssignmentCompatibility(
    baseInput({
      dailyOperationsPlan: {
        ...planBase,
        status: 'confirmed',
        vehicleFocus: 'preventive_maintenance',
        confirmedAtDay: 3,
      },
    }),
    containerEvent,
    { ...containerDefault, vehicleType: 'high_capacity_vehicle' },
  );
  ok =
    assert(
      checks,
      maintPlanCompat.warnings.length > 0 ||
        maintPlanCompat.score < compatMid.score + 20,
      'Daily plan preventive_maintenance high_capacity uyarı/bonus dengesi',
      'preventive maintenance etkisi yok',
    ) && ok;

  const strainedVehicles = createInitialOperationSignalsState(3);
  strainedVehicles.vehicles = {
    ...strainedVehicles.vehicles,
    status: 'strained',
    score: 72,
  };
  const vehicleWarnCompat = calculateAssignmentCompatibility(
    baseInput({ operationSignals: strainedVehicles }),
    containerEvent,
    { ...containerDefault, vehicleType: 'high_capacity_vehicle' },
  );
  ok =
    assert(
      checks,
      vehicleWarnCompat.warnings.some((w) => w.includes('Filo')),
      'operationSignals vehicle strained high_capacity warning üretiyor',
      'vehicle warning yok',
    ) && ok;

  const strainedPersonnel = createInitialOperationSignalsState(3);
  strainedPersonnel.personnel = {
    ...strainedPersonnel.personnel,
    status: 'strained',
    score: 70,
  };
  const personnelWarnCompat = calculateAssignmentCompatibility(
    baseInput({ operationSignals: strainedPersonnel }),
    routeEvent,
    { ...routeDefault, approachType: 'rapid_response' },
  );
  ok =
    assert(
      checks,
      personnelWarnCompat.warnings.some((w) => w.includes('Personel')),
      'operationSignals personnel strained rapid_response warning üretiyor',
      'personnel warning yok',
    ) && ok;

  const techEffects = calculateAssignmentEffects(
    baseInput(),
    containerEvent,
    {
      ...containerDefault,
      personnelType: 'technical_team',
      vehicleType: 'maintenance_vehicle',
    },
  );
  ok =
    assert(
      checks,
      techEffects.some((e) => e.domain === 'containers' && e.delta < 0),
      'technical_team + maintenance_vehicle container event etkisi üretiyor',
      'tech container effect yok',
    ) && ok;

  const socialEffects = calculateAssignmentEffects(baseInput(), socialEvent, {
    ...socialDefault,
    personnelType: 'public_relations_team',
    approachType: 'public_first',
  });
  ok =
    assert(
      checks,
      socialEffects.some((e) => e.domain === 'districts' && e.delta < 0),
      'public_relations + public_first social event etkisi üretiyor',
      'social effect yok',
    ) && ok;

  const rapidEffects = calculateAssignmentEffects(baseInput(), containerEvent, {
    ...containerDefault,
    vehicleType: 'high_capacity_vehicle',
    approachType: 'rapid_response',
  });
  ok =
    assert(
      checks,
      rapidEffects.some((e) => e.domain === 'vehicles' && e.delta > 0),
      'high_capacity + rapid_response tradeoff etkisi üretiyor',
      'rapid tradeoff yok',
    ) && ok;

  const criticalEvent = eventOf({
    id: 'evt-critical',
    category: 'container_overflow',
    riskLevel: 'critical',
  });
  const lowCompat = calculateAssignmentCompatibility(
    baseInput(),
    criticalEvent,
    { ...containerDefault, approachType: 'low_resource' },
  );
  ok =
    assert(
      checks,
      lowCompat.warnings.length > 0 || lowCompat.label === 'Zayıf uyum',
      'low_resource high severity event warning üretiyor',
      'low resource warning yok',
    ) && ok;

  const lastingEffects = calculateAssignmentEffects(baseInput(), containerEvent, {
    ...containerDefault,
    approachType: 'lasting_fix',
  });
  ok =
    assert(
      checks,
      lastingEffects.some((e) => e.delta < 0),
      'lasting_fix carry-over/risk azaltıcı etki üretiyor',
      'lasting_fix effect yok',
    ) && ok;

  let assignState = upsertEventAssignment(initial, containerDefault);
  assignState = confirmAssignmentState(
    assignState,
    containerEvent.id,
    {},
    3,
  );
  ok =
    assert(
      checks,
      getEventAssignment(assignState, containerEvent.id)?.status === 'confirmed',
      'confirmEventAssignment status confirmed yapıyor',
      'confirm failed',
    ) && ok;

  assignState = markEventAssignmentDispatched(assignState, containerEvent.id, 3);
  ok =
    assert(
      checks,
      getEventAssignment(assignState, containerEvent.id)?.status === 'dispatched',
      'markAssignmentDispatched status dispatched yapıyor',
      'dispatch failed',
    ) && ok;

  const processedOnce = markEventAssignmentProcessed(
    assignState,
    containerEvent.id,
    3,
    techEffects,
  );
  const processedTwice = markEventAssignmentProcessed(
    processedOnce,
    containerEvent.id,
    3,
    techEffects,
  );
  ok =
    assert(
      checks,
      processedOnce === processedTwice,
      'processed assignment tekrar işlenmiyor',
      'processed tekrar işlendi',
    ) && ok;

  const eodInput = baseInput({
    assignments: upsertEventAssignment(
      createInitialAssignmentsState(),
      {
        ...containerDefault,
        status: 'dispatched',
        dispatchedAtDay: 3,
        day: 3,
      },
    ),
  });
  const eod1 = processAssignmentsEndOfDay({
    assignments: eodInput.assignments,
    closingDay: 3,
    engineInput: eodInput,
    events: [containerEvent],
  });
  const eod2 = processAssignmentsEndOfDay({
    assignments: eod1.state,
    closingDay: 3,
    engineInput: eodInput,
    events: [containerEvent],
  });
  ok =
    assert(
      checks,
      eod1.effects.length > 0 && eod2.effects.length === 0,
      'processAssignmentsForEndOfDay idempotent',
      'EOD idempotent değil',
    ) && ok;

  const signalsBase = createInitialOperationSignalsState(3);
  const signalsAfter = applyAssignmentEffectsToOperationSignals(
    signalsBase,
    techEffects,
  );
  ok =
    assert(
      checks,
      signalsAfter.overall.score >= 0 && signalsAfter.overall.score <= 100,
      'applyAssignmentEffectsToOperationSignals clamp ediyor',
      `overall=${signalsAfter.overall.score}`,
    ) && ok;

  const summaryState = buildAssignmentReportModel(
    baseInput({
      assignments: {
        ...eod1.state,
        dailyAssignmentSummary: {
          day: 3,
          confirmedCount: 2,
          strongFitCount: 1,
          weakFitCount: 1,
          dominantDomain: 'containers',
        },
      },
    }),
    {
      day: 3,
      title: 'Test',
      stats: [],
      rewardTitle: 'Test',
      createdAt: new Date().toISOString(),
    },
  );
  ok =
    assert(
      checks,
      summaryState.lines.length > 0,
      'dailyAssignmentSummary confirmed/strong/weak count üretiyor',
      'summary lines boş',
    ) && ok;

  const panel = buildAssignmentPanelModel(
    baseInput(),
    containerEvent,
    containerDefault,
  );
  ok =
    assert(
      checks,
      panel.title.length > 0 &&
        panel.rows.every((r) => r.value.length > 0 && r.label.length > 0),
      'Assignment panel presentation boş text üretmiyor',
      'panel boş alan',
    ) && ok;

  const editor = buildAssignmentEditorModel(
    baseInput(),
    containerEvent,
    containerDefault,
  );
  ok =
    assert(
      checks,
      editor.sections.every((s) => s.options.length >= 5),
      'Assignment editor options boş değil',
      'editor options eksik',
    ) && ok;

  const impactModel = buildAssignmentImpactPreviewModel(
    baseInput(),
    containerEvent,
    containerDefault,
  );
  ok =
    assert(
      checks,
      impactModel != null && impactModel.summary.length < 200,
      'Impact preview kısa summary üretiyor',
      'impact preview yok/uzun',
    ) && ok;

  const advisorFallback = getAssignmentAdvisorComment(
    baseInput({ advisorState: undefined }),
    containerEvent,
    containerDefault,
  );
  ok =
    assert(
      checks,
      advisorFallback.length > 10,
      'Advisor assignment comment fallback çalışıyor',
      'advisor fallback boş',
    ) && ok;

  const advisorL3State = createInitialAdvisorState(3);
  advisorL3State.level = 3;
  advisorL3State.experience = 500;
  advisorL3State.reliabilityScore = 80;
  advisorL3State.reliabilityBand = 'expert';
  const advisorL3 = getAssignmentAdvisorComment(
    baseInput({
      advisorState: advisorL3State,
    }),
    containerEvent,
    containerDefault,
  );
  ok =
    assert(
      checks,
      advisorL3.length > advisorFallback.length / 2,
      'Advisor assignment comment level/reliability ile ton değiştiriyor',
      'advisor level ton yok',
    ) && ok;

  const day1Panel = buildAssignmentPanelModel(
    baseInput({ isDay1Tutorial: true }),
    containerEvent,
    { ...containerDefault, status: 'confirmed' },
  );
  ok =
    assert(
      checks,
      day1Panel.compact && day1Panel.ctaLabel.includes('Önerilen'),
      'Day 1 compact behavior güvenli',
      'day1 panel uyumsuz',
    ) && ok;

  const seed = createDay1Seed();
  const hydratedV16 = normalizePersistedSave({
    saveVersion: 16,
    gameState: seed.gameState,
    neighborhoods: seed.neighborhoods,
    resources: seed.resources,
    eventPool: seed.eventPool,
    decisionHistory: seed.decisionHistory,
    snapshots: seed.snapshots,
  });
  ok =
    assert(
      checks,
      hydratedV16 != null &&
        hydratedV16.saveVersion === SAVE_VERSION &&
        hydratedV16.assignments != null,
      'Persist migration v16 → v17 assignments dolduruyor',
      'v16 migration failed',
    ) && ok;

  ok =
    assert(
      checks,
      isCurrentSaveVersion(SAVE_VERSION) && hydratedV16?.assignments != null,
      'Full loop SAVE_VERSION 22 ile çalışıyor',
      `SAVE_VERSION=${SAVE_VERSION}`,
    ) && ok;

  const uiCopy = [
    ASSIGNMENT_COPY.panelTitle,
    ASSIGNMENT_COPY.confirmLabel,
    panel.advisorLine,
  ]
    .join(' ')
    .toLowerCase();
  const forbiddenHit = ASSIGNMENT_UI_FORBIDDEN_WORDS.find((w) =>
    uiCopy.includes(w),
  );
  ok =
    assert(
      checks,
      forbiddenHit === undefined,
      'UI forbidden words yok: XP, premium, satın al, kilitli',
      `forbidden: ${forbiddenHit}`,
    ) && ok;

  ok =
    assert(
      checks,
      MAX_ASSIGNMENT_REPORT_LINES === 3 && summaryState.lines.length <= 3,
      'Hub/report/full-ux presentation guard satır limiti',
      'report line limit',
    ) && ok;

  ok =
    assert(
      checks,
      getEventCategoryForAssignment(containerEvent) === 'container',
      'OperationSignals verify ile uyumlu category',
      'category mismatch',
    ) && ok;

  if (
    !warn(
      checks,
      compatMid.effects.length > 0,
      'DailyPlanning verify ile uyumlu effect üretimi',
      'compat effects boş',
    )
  ) {
    hasWarn = true;
  }

  return { ok, warn: hasWarn, checks };
}
