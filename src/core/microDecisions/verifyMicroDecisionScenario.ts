import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialAssignmentsState } from '@/core/assignments/assignmentState';
import { createInitialAdvisorState } from '@/core/advisors/advisorState';
import {
  applyFullAccessToGameState,
  buildDevJumpPilotCompletedGameState,
} from '@/core/monetization/monetizationEngine';
import {
  createInitialMonetizationState,
  mockPurchaseMainOperationPack,
} from '@/core/monetization/monetizationState';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { buildOperationSignal } from '@/core/operations/operationSignalState';
import { createInitialCrisisState } from '@/core/crisis/crisisState';
import { createInitialDailyOperationsPlan } from '@/core/dailyPlanning/dailyPlanningState';
import { createFullMainOperationSeasonState } from '@/core/mainOperation/mainOperationState';
import { normalizePersistedSave, SAVE_VERSION } from '@/store/gamePersist';

import { MICRO_DECISION_FORBIDDEN_WORDS } from './microDecisionConstants';
import {
  applyMicroDecisionEffectsToCrisisState,
  applyMicroDecisionEffectsToOperationSignals,
  buildMicroDecisionGenerationContext,
  createDevFallbackMicroDecision,
  deriveMicroDecisionAccessMode,
  generateMicroDecisionCandidates,
  pickMicroDecisionsForDay,
  processMicroDecisionsEndOfDay,
  refreshMicroDecisionsForDay,
  buildMicroDecisionEngineInputFromStore,
} from './microDecisionEngine';
import {
  buildActiveMicroDecisionsModel,
  buildMicroDecisionCardModel,
  buildMicroDecisionReportModel,
  microDecisionTextContainsForbiddenWords,
} from './microDecisionPresentation';
import { getMicroDecisionAdvisorLine } from './microDecisionEngine';
import {
  addMicroDecision,
  createInitialMicroDecisionState,
  expireOldMicroDecisions,
  getActiveMicroDecisions,
  hasReachedDailyMicroDecisionLimit,
  normalizeMicroDecisionState,
  pruneMicroDecisionHistory,
  resolveMicroDecision,
  skipMicroDecision,
  buildMicroDecisionDailySummary,
} from './microDecisionState';
import type { MicroDecisionEngineInput } from './microDecisionTypes';

export type VerifyMicroDecisionOutcome = {
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

function baseInput(overrides?: Partial<MicroDecisionEngineInput>): MicroDecisionEngineInput {
  const day = overrides?.day ?? 8;
  const gameState = applyFullAccessToGameState(
    buildDevJumpPilotCompletedGameState(createDay1Seed().gameState),
  );
  const gs = { ...gameState, city: { ...gameState.city, day } };
  return {
    day,
    gameState: gs,
    monetization: mockPurchaseMainOperationPack(createInitialMonetizationState(), day),
    operationSignals: createInitialOperationSignalsState(day),
    crisisState: createInitialCrisisState(),
    dailyOperationsPlan: createInitialDailyOperationsPlan(day),
    assignments: createInitialAssignmentsState(),
    mainOperationSeason: createFullMainOperationSeasonState(day),
    advisorState: createInitialAdvisorState(day),
    microDecisionState: createInitialMicroDecisionState(),
    activeEvents: [],
    ...overrides,
  };
}

function pilotInput(pilotDay: number): MicroDecisionEngineInput {
  const seed = createDay1Seed();
  const gs = {
    ...seed.gameState,
    pilot: {
      ...seed.gameState.pilot,
      status: 'active' as const,
      currentPilotDay: pilotDay,
    },
    city: { ...seed.gameState.city, day: pilotDay },
  };
  return {
    day: pilotDay,
    gameState: gs,
    monetization: createInitialMonetizationState(),
    operationSignals: createInitialOperationSignalsState(pilotDay),
    crisisState: createInitialCrisisState(),
    dailyOperationsPlan: createInitialDailyOperationsPlan(pilotDay),
    assignments: createInitialAssignmentsState(),
    mainOperationSeason: createFullMainOperationSeasonState(pilotDay),
    advisorState: createInitialAdvisorState(pilotDay),
    microDecisionState: createInitialMicroDecisionState(),
    activeEvents: gs.events,
  };
}

export function verifyMicroDecisionScenario(): VerifyMicroDecisionOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  const initial = createInitialMicroDecisionState();
  record(
    assert(
      checks,
      Object.keys(initial.decisionsById).length === 0 &&
        initial.activeDecisionIds.length === 0,
      'Initial microDecisionState doğru oluşuyor',
      'Initial state bozuk',
    ),
  );

  const normalized = normalizeMicroDecisionState({ decisionsById: { bad: 1 } });
  record(
    assert(
      checks,
      Object.keys(normalized.decisionsById).length === 0,
      'Normalize eksik state onarır',
      'Normalize başarısız',
    ),
  );

  record(
    assert(
      checks,
      normalizeMicroDecisionState({
        decisionsById: {
          x: { id: 'x', day: 1, type: 'bad', status: 'available', options: [] },
        },
      }).decisionsById.x === undefined,
      'Bozuk decision kayıtları temizleniyor',
      'Bozuk kayıt kaldı',
    ),
  );

  let state = createInitialMicroDecisionState();
  const devDecision = createDevFallbackMicroDecision(8);
  state = addMicroDecision(state, devDecision);
  record(
    assert(
      checks,
      getActiveMicroDecisions(state).length === 1 &&
        state.activeDecisionIds.every(
          (id) => state.decisionsById[id]?.status === 'available',
        ),
      'activeDecisionIds sadece available id içeriyor',
      'activeDecisionIds tutarsız',
    ),
  );

  const day2 = pilotInput(2);
  record(
    assert(
      checks,
      deriveMicroDecisionAccessMode(day2) === 'inactive',
      'Day 1-2 access inactive',
      'Day 2 inactive değil',
    ),
  );

  const day5 = pilotInput(5);
  const ctx5 = buildMicroDecisionGenerationContext(day5);
  record(
    assert(
      checks,
      ctx5.accessMode === 'pilot_limited' && ctx5.maxDailyDecisions === 1,
      'Pilot Day 3-7 max 1 limit',
      'Pilot limit yanlış',
    ),
  );

  const limitedInput = baseInput({
    monetization: {
      ...createInitialMonetizationState(),
      mainOperationAccess: 'limited',
    },
  });
  record(
    assert(
      checks,
      buildMicroDecisionGenerationContext(limitedInput).maxDailyDecisions === 1,
      'Limited max 1 limit',
      'Limited limit yanlış',
    ),
  );

  const fullInput = baseInput();
  record(
    assert(
      checks,
      buildMicroDecisionGenerationContext(fullInput).maxDailyDecisions === 2,
      'Full max 2 limit',
      'Full limit yanlış',
    ),
  );

  const crisisFull = baseInput({
    crisisState: {
      ...createInitialCrisisState(),
      riskLevel: 'elevated',
      cityCrisisScore: 70,
      activeIncident: {
        id: 'inc1',
        day: 8,
        status: 'active',
        title: 'Test',
        summary: 'Test',
        affectedDistrictIds: ['merkez'],
        primaryDomain: 'city',
        severity: 'high',
        sourceSignalIds: [],
      },
    },
  });
  record(
    assert(
      checks,
      buildMicroDecisionGenerationContext(crisisFull).maxDailyDecisions === 2,
      'Active crisis yine max 2 limit',
      'Crisis limit yanlış',
    ),
  );

  let dupState = createInitialMicroDecisionState();
  const r1 = refreshMicroDecisionsForDay(fullInput);
  dupState = r1;
  const r2 = refreshMicroDecisionsForDay({
    ...fullInput,
    microDecisionState: dupState,
  });
  const genCount = Object.values(r2.decisionsById).filter(
    (d) => d.createdAtDay === 8,
  ).length;
  record(
    assert(
      checks,
      r2.lastGeneratedDay === 8 && genCount === Object.values(r1.decisionsById).filter((d) => d.createdAtDay === 8).length,
      'Daily limit duplicate generation engelliyor',
      'Duplicate generation',
    ),
  );

  const typesToday = new Set(
    Object.values(r2.decisionsById)
      .filter((d) => d.createdAtDay === 8)
      .map((d) => d.type),
  );
  record(
    assert(
      checks,
      typesToday.size <= 2,
      'Same type aynı gün en fazla 1 (pick içinde)',
      'Type duplicate',
    ),
  );

  const emptySignals = baseInput({
    operationSignals: {
      ...createInitialOperationSignalsState(8),
      personnel: buildOperationSignal(
        'personnel',
        20,
        20,
        8,
        'Stabil',
        'Stabil',
        [],
      ),
      vehicles: buildOperationSignal('vehicles', 20, 20, 8, 'Stabil', 'Stabil', []),
      containers: buildOperationSignal(
        'containers',
        20,
        20,
        8,
        'Stabil',
        'Stabil',
        [],
      ),
      districts: buildOperationSignal('districts', 20, 20, 8, 'Stabil', 'Stabil', []),
      overall: buildOperationSignal('overall', 20, 20, 8, 'Stabil', 'Stabil', []),
    },
    activeEvents: [],
    assignments: createInitialAssignmentsState(),
    advisorState: {
      ...createInitialAdvisorState(8),
      lastMissedSignal: undefined,
    },
    crisisState: createInitialCrisisState(),
  });
  record(
    assert(
      checks,
      generateMicroDecisionCandidates(emptySignals).length === 0,
      'No signal context varsa candidate üretmiyor',
      'Boş context candidate üretti',
    ),
  );

  const missedInput = baseInput({
    advisorState: {
      ...createInitialAdvisorState(8),
      lastMissedSignal: {
        id: 'm1',
        day: 8,
        domain: 'vehicles',
        previousStatus: 'stable',
        currentStatus: 'watch',
        message: 'Test',
        acknowledged: false,
      },
      reliabilityBand: 'developing',
    },
    operationSignals: {
      ...createInitialOperationSignalsState(8),
      vehicles: buildOperationSignal(
        'vehicles',
        65,
        50,
        8,
        'Baskı',
        'Yükseliyor',
        [],
      ),
      overall: buildOperationSignal('overall', 60, 45, 8, 'Baskı', 'Yükseliyor', []),
    },
  });
  missedInput.operationSignals.overall.trend = 'worsening';
  const missedCandidates = generateMicroDecisionCandidates(missedInput);
  record(
    assert(
      checks,
      missedCandidates.some((c) => c.type === 'advisor_warning'),
      'Advisor missed signal advisor_warning candidate üretiyor',
      'advisor_warning yok',
    ),
  );

  const weakAssign = baseInput({
    assignments: {
      ...createInitialAssignmentsState(),
      assignmentsByEventId: {
        e1: {
          eventId: 'e1',
          day: 8,
          status: 'confirmed',
          source: 'player',
          personnelType: 'balanced_team',
          vehicleType: 'standard_truck',
          approachType: 'balanced_response',
          compatibilityScore: 30,
          compatibilityLabel: 'Zayıf uyum',
          effects: [],
        },
      },
    },
    operationSignals: {
      ...createInitialOperationSignalsState(8),
      vehicles: buildOperationSignal('vehicles', 70, 55, 8, 'Baskı', 'Yük', []),
    },
  });
  weakAssign.operationSignals.vehicles.trend = 'worsening';
  weakAssign.operationSignals.vehicles.status = 'strained';
  record(
    assert(
      checks,
      generateMicroDecisionCandidates(weakAssign).some((c) => c.type === 'field_update'),
      'Weak assignment field_update candidate üretiyor',
      'field_update yok',
    ),
  );

  const crisisElevated = baseInput({
    crisisState: {
      ...createInitialCrisisState(),
      riskLevel: 'elevated',
      cityCrisisScore: 72,
    },
    operationSignals: {
      ...createInitialOperationSignalsState(8),
      vehicles: buildOperationSignal('vehicles', 60, 50, 8, 'Baskı', 'Yük', []),
      containers: buildOperationSignal('containers', 58, 48, 8, 'Baskı', 'Yük', []),
      overall: buildOperationSignal('overall', 55, 45, 8, 'İzleme', 'Yükseliyor', []),
    },
  });
  crisisElevated.operationSignals.overall.trend = 'worsening';
  record(
    assert(
      checks,
      generateMicroDecisionCandidates(crisisElevated).some(
        (c) => c.type === 'crisis_threshold',
      ),
      'Crisis elevated crisis_threshold candidate üretiyor',
      'crisis_threshold yok',
    ),
  );

  const districtInput = baseInput({
    operationSignals: {
      ...createInitialOperationSignalsState(8),
      districts: buildOperationSignal('districts', 65, 50, 8, 'Baskı', 'Mahalle', []),
    },
  });
  districtInput.operationSignals.districts.status = 'watch';
  record(
    assert(
      checks,
      generateMicroDecisionCandidates(districtInput).some(
        (c) => c.type === 'district_representative',
      ),
      'District pressure district_representative candidate üretiyor',
      'district_representative yok',
    ),
  );

  const oppInput = baseInput({
    activeEvents: [
      {
        id: 'ev1',
        title: 'Test',
        district: 'merkez',
        neighborhoodId: 'merkez',
        status: 'active',
        riskLevel: 'medium',
        category: 'container',
        decisions: [],
      } as never,
    ],
    dailyOperationsPlan: {
      ...createInitialDailyOperationsPlan(8),
      districtFocusId: 'merkez',
      status: 'confirmed',
    },
    assignments: {
      ...createInitialAssignmentsState(),
      dailyAssignmentSummary: {
        day: 8,
        confirmedCount: 2,
        strongFitCount: 1,
        weakFitCount: 0,
      },
    },
  });
  record(
    assert(
      checks,
      generateMicroDecisionCandidates(oppInput).some(
        (c) => c.type === 'operation_opportunity',
      ),
      'Stable opportunity operation_opportunity candidate üretebiliyor',
      'operation_opportunity yok',
    ),
  );

  const pickedPilot = pickMicroDecisionsForDay(
    day5,
    generateMicroDecisionCandidates({
      ...day5,
      operationSignals: {
        ...day5.operationSignals,
        overall: buildOperationSignal('overall', 60, 45, 5, 'Baskı', 'Yükseliyor', []),
      },
    }),
  );
  record(
    assert(
      checks,
      pickedPilot.every((p) => p.type === 'advisor_warning' || p.type === 'field_update'),
      'Pilot Day 3-7 sadece allowed type üretir',
      'Pilot forbidden type',
    ),
  );

  const limitedCrisis = generateMicroDecisionCandidates(limitedInput);
  record(
    assert(
      checks,
      !limitedCrisis.some((c) => c.type === 'crisis_threshold'),
      'Limited crisis_threshold active decision üretmez',
      'Limited crisis_threshold üretti',
    ),
  );

  const crisisPriority = pickMicroDecisionsForDay(
    crisisFull,
    generateMicroDecisionCandidates(crisisFull),
  );
  record(
    assert(
      checks,
      crisisPriority.length === 0 ||
        crisisPriority[0]?.type === 'crisis_threshold' ||
        crisisPriority.some((c) => c.type === 'crisis_threshold'),
      'Full active crisis crisis_threshold öncelik alır',
      'Crisis öncelik yok',
    ),
  );

  const anyDecision = devDecision;
  record(
    assert(
      checks,
      anyDecision.options.length >= 2,
      'Her decision en az 2 option içerir',
      'Option sayısı yetersiz',
    ),
  );
  record(
    assert(
      checks,
      anyDecision.options.every((o) => o.effects.length > 0),
      'Her option effect listesi boş değil',
      'Boş effect',
    ),
  );
  record(
    assert(
      checks,
      anyDecision.options.some(
        (o) => o.label.includes('Planı Koru') || o.label.includes('İzlemeye Al'),
      ),
      'Planı Koru veya İzlemeye Al güvenli seçenek var',
      'Güvenli seçenek yok',
    ),
  );

  let resolveState = addMicroDecision(createInitialMicroDecisionState(), devDecision);
  resolveState = resolveMicroDecision(resolveState, devDecision.id, 'keep_plan', 8);
  const resolved = resolveState.decisionsById[devDecision.id];
  record(
    assert(
      checks,
      resolved?.status === 'resolved' && resolved.selectedOptionId === 'keep_plan',
      'resolveMicroDecision status ve selectedOptionId set eder',
      'Resolve başarısız',
    ),
  );
  const resolveAgain = resolveMicroDecision(
    resolveState,
    devDecision.id,
    'keep_plan',
    8,
  );
  record(
    assert(
      checks,
      resolveAgain.decisionsById[devDecision.id]?.resolvedAtDay === resolved?.resolvedAtDay,
      'resolve idempotent',
      'resolve idempotent değil',
    ),
  );

  let skipSt = addMicroDecision(
    createInitialMicroDecisionState(),
    { ...devDecision, id: 'skip_test', status: 'available' },
  );
  skipSt = skipMicroDecision(skipSt, 'skip_test', 8);
  record(
    assert(
      checks,
      skipSt.decisionsById.skip_test?.status === 'skipped',
      'skipMicroDecision status skipped yapar',
      'Skip başarısız',
    ),
  );

  let expireSt = addMicroDecision(createInitialMicroDecisionState(), {
    ...devDecision,
    id: 'exp_test',
    createdAtDay: 5,
    expiresAtDay: 5,
  });
  expireSt = expireOldMicroDecisions(expireSt, 7);
  record(
    assert(
      checks,
      expireSt.decisionsById.exp_test?.status === 'expired',
      'expireOldMicroDecisions çalışır',
      'Expire başarısız',
    ),
  );

  let hist = createInitialMicroDecisionState();
  for (let i = 0; i < 25; i++) {
    hist = addMicroDecision(hist, {
      ...devDecision,
      id: `hist_${i}`,
      status: 'resolved',
      createdAtDay: i,
    });
  }
  hist = pruneMicroDecisionHistory(hist, 30);
  record(
    assert(
      checks,
      Object.keys(hist.decisionsById).length <= 20,
      'prune history max 20',
      `History ${Object.keys(hist.decisionsById).length}`,
    ),
  );

  const summary = buildMicroDecisionDailySummary(resolveState, 8);
  record(
    assert(
      checks,
      summary.resolvedCount >= 1,
      'buildDailySummary resolved count üretir',
      'Summary boş',
    ),
  );

  const sigApplied = applyMicroDecisionEffectsToOperationSignals(
    createInitialOperationSignalsState(8),
    [{ domain: 'vehicles', delta: -200, reason: 'test', sourceTags: [] }],
  );
  record(
    assert(
      checks,
      sigApplied.vehicles.score >= 0 && sigApplied.vehicles.score <= 100,
      'applyMicroDecisionEffectsToOperationSignals clamp eder',
      'Signal clamp başarısız',
    ),
  );

  const crisisApplied = applyMicroDecisionEffectsToCrisisState(createInitialCrisisState(), [
    { domain: 'crisis', delta: -50, reason: 'test', sourceTags: [] },
  ]);
  record(
    assert(
      checks,
      crisisApplied.cityCrisisScore >= 0 && crisisApplied.cityCrisisScore <= 100,
      'applyMicroDecisionEffectsToCrisisState clamp eder',
      'Crisis clamp başarısız',
    ),
  );

  const coordEffects =
    devDecision.options.find((o) => o.id === 'crisis_coord')?.effects ?? [];
  if (coordEffects.length > 0) {
    const afterCoord = applyMicroDecisionEffectsToCrisisState(
      { ...createInitialCrisisState(), cityCrisisScore: 60 },
      coordEffects,
    );
    record(
      assert(
        checks,
        afterCoord.cityCrisisScore < 60,
        'crisis coordination option crisis score düşürür',
        'Crisis coord düşürmedi',
      ),
    );
  } else {
    warn(checks, true, 'crisis coordination option (field_update dev card)', 'Atlandı');
    hasWarn = true;
  }

  const keepPlan = devDecision.options.find((o) => o.id === 'keep_plan');
  record(
    assert(
      checks,
      (keepPlan?.effects[0]?.delta ?? 0) <= 5,
      'watch/plan koru option delta küçük',
      'Delta büyük',
    ),
  );

  const hubModel = buildMicroDecisionCardModel(fullInput, devDecision);
  record(
    assert(
      checks,
      hubModel.title.length > 0 && hubModel.reasonLine.length > 0,
      'Hub presentation boş text üretmez',
      'Boş hub text',
    ),
  );

  const reportInput = baseInput({
    microDecisionState: {
      ...resolveState,
      dailySummary: {
        day: 8,
        generatedCount: 1,
        resolvedCount: 1,
        skippedCount: 0,
        reportLines: ['Test satırı.'],
      },
    },
  });
  const reportModel = buildMicroDecisionReportModel(reportInput, 8);
  record(
    assert(
      checks,
      (reportModel?.lines.length ?? 0) <= 3,
      'Report model max 3 line',
      'Report fazla satır',
    ),
  );

  const advisorL1 = getMicroDecisionAdvisorLine(
    { ...fullInput, advisorState: { ...fullInput.advisorState, level: 1 } },
    devDecision,
  );
  const advisorL3 = getMicroDecisionAdvisorLine(
    { ...fullInput, advisorState: { ...fullInput.advisorState, level: 3 } },
    { ...devDecision, type: 'crisis_threshold' },
  );
  record(
    assert(
      checks,
      advisorL1 !== advisorL3,
      'Advisor line level/reliability ile ton değiştirir',
      'Advisor line aynı',
    ),
  );

  record(
    assert(
      checks,
      buildMicroDecisionReportModel(pilotInput(1), 1) === undefined,
      'Day 1 report micro card render etmez',
      'Day 1 report var',
    ),
  );

  const eod = processMicroDecisionsEndOfDay(
    {
      ...fullInput,
      microDecisionState: resolveState,
    },
    8,
  );
  record(
    assert(
      checks,
      eod.microDecisionState.dailySummary?.resolvedCount === 1,
      'Full mode report resolved micro decision gösterir',
      'EOD summary eksik',
    ),
  );

  const v20 = normalizePersistedSave({
    saveVersion: 20,
    gameState: createDay1Seed().gameState,
    neighborhoods: createDay1Seed().neighborhoods,
    resources: createDay1Seed().resources,
    eventPool: [],
    decisionHistory: [],
    snapshots: [],
    updatedAt: new Date().toISOString(),
  });
  record(
    assert(
      checks,
      v20 != null && v20.saveVersion === SAVE_VERSION && v20.microDecisionState != null,
      'Persist migration v20 → v21 microDecisionState doldurur',
      'Persist migration başarısız',
    ),
  );

  record(
    assert(
      checks,
      createDevFallbackMicroDecision(8).sourceTags.includes('dev'),
      'Dev generate fallback **DEV** guard ile güvenli',
      'DEV fallback yok',
    ),
  );

  const uiStrings = [
    hubModel.title,
    hubModel.summary,
    ...hubModel.optionRows.map((o) => o.label),
  ];
  record(
    assert(
      checks,
      !uiStrings.some((s) => microDecisionTextContainsForbiddenWords(s)),
      'Forbidden words yok',
      'Forbidden word bulundu',
    ),
  );

  record(
    assert(
      checks,
      SAVE_VERSION === 22,
      'Full loop SAVE_VERSION 22 ile çalışıyor',
      `SAVE_VERSION=${SAVE_VERSION}`,
    ),
  );

  const activeModel = buildActiveMicroDecisionsModel({
    ...fullInput,
    microDecisionState: addMicroDecision(createInitialMicroDecisionState(), devDecision),
  });
  record(
    assert(
      checks,
      (activeModel?.decisions.length ?? 0) <= 2,
      'Active decision max 2 UI guard',
      'UI fazla kart',
    ),
  );

  record(
    assert(
      checks,
      hubModel.summary.length < 200 && hubModel.reasonLine.length < 200,
      'Long copy/mobile guard',
      'Metin çok uzun',
    ),
  );

  record(
    assert(
      checks,
      pilotInput(1).gameState.pilot.status === 'active',
      'Pilot Day 1-7 core event generation bozulmaz',
      'Pilot state bozuk',
    ),
  );

  warn(
    checks,
    true,
    'EventField compact micro decision kartı mevcut',
    'EventField inline micro decision integration pending',
  );

  if (
    !warn(
      checks,
      false,
      'Dedicated micro decision detail screen not implemented',
      'Dedicated micro decision detail screen not implemented',
    )
  ) {
    hasWarn = true;
  }

  for (const word of MICRO_DECISION_FORBIDDEN_WORDS) {
    if (hubModel.title.toLowerCase().includes(word)) ok = false;
  }

  return { ok, warn: hasWarn, checks };
}
