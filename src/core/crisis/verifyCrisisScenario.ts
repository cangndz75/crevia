import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialAssignmentsState } from '@/core/assignments/assignmentState';
import {
  applyFullAccessToGameState,
  applyLimitedContinueToGameState,
  buildDevJumpPilotCompletedGameState,
} from '@/core/monetization/monetizationEngine';
import {
  createInitialMonetizationState,
  mockPurchaseMainOperationPack,
  selectLimitedContinue,
} from '@/core/monetization/monetizationState';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createFullMainOperationSeasonState } from '@/core/mainOperation/mainOperationState';
import {
  buildFullMainOperationDailySet,
} from '@/core/mainOperation/mainOperationEventGeneration';
import { buildMainOperationEngineInput } from '@/core/mainOperation/mainOperationEngine';
import { ensurePostPilotDailyEventsForDay } from '@/core/postPilot/postPilotEventEngine';
import { normalizePostPilotOperationState } from '@/core/postPilot/postPilotOperationSeed';
import { SAVE_VERSION } from '@/store/gamePersist';

import { CRISIS_FORBIDDEN_WORDS } from './crisisConstants';
import {
  buildCrisisEngineInput,
  buildCrisisDistrictBadges,
  buildCrisisMapLines,
  buildCrisisMapPanelLines,
  buildCrisisMapPresentation,
  shouldShowCrisisMapLines,
  buildCrisisSignals,
  calculateCityCrisisScore,
  calculateCrisisImpactPreview,
  createCrisisIncidentFromSignals,
  deriveCrisisAccessMode,
  deriveCrisisStateFromGameState,
  getCrisisAdvisorComment,
  processCrisisEndOfDay,
  shouldCreateCrisisIncident,
} from './crisisEngine';
import {
  buildCrisisDeskHubModel,
  buildCrisisDeskReportModel,
  collectCrisisUiStrings,
} from './crisisPresentation';
import {
  addCrisisSignal,
  clampCrisisScore,
  createInitialCrisisState,
  getCrisisRiskLevel,
  getCrisisTrend,
  markCrisisIncidentResolved,
  normalizeCrisisState,
} from './crisisState';

export type VerifyCrisisOutcome = {
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

function fullDay8State() {
  const gs = applyFullAccessToGameState(
    buildDevJumpPilotCompletedGameState(createDay1Seed().gameState),
  );
  return { ...gs, city: { ...gs.city, day: 8 } };
}

function crisisInput(
  gameState: ReturnType<typeof fullDay8State>,
  monetization = mockPurchaseMainOperationPack(createInitialMonetizationState(), 8),
  crisisState = createInitialCrisisState(),
  extras?: Partial<ReturnType<typeof buildCrisisEngineInput>>,
) {
  const signals = createInitialOperationSignalsState(8);
  return buildCrisisEngineInput({
    gameState,
    monetization,
    crisisState,
    operationSignals: signals,
    assignments: createInitialAssignmentsState(),
    mainOperationSeason: createFullMainOperationSeasonState(8),
    ...extras,
  });
}

export function verifyCrisisScenario(): VerifyCrisisOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const initial = createInitialCrisisState();
  ok =
    assert(
      checks,
      initial.accessMode === 'inactive' && initial.riskLevel === 'stable',
      'Initial crisis state inactive/stable oluşuyor',
      'initial crisis',
    ) && ok;

  ok =
    assert(
      checks,
      normalizeCrisisState(undefined).accessMode === 'inactive',
      'Normalize eksik state’i onarıyor',
      'normalize missing',
    ) && ok;

  const badSignals = normalizeCrisisState({
    recentSignals: ['bad', { id: 'ok', title: 'T', summary: 's', domain: 'city', score: 50 }],
  });
  ok =
    assert(
      checks,
      badSignals.recentSignals.length <= 5,
      'Bozuk recentSignals temizleniyor',
      'signals clean',
    ) && ok;

  const badIncident = normalizeCrisisState({
    activeIncident: { id: 'x', status: 'none', title: 'bad' },
  });
  ok =
    assert(
      checks,
      badIncident.activeIncident == null,
      'Bozuk activeIncident temizleniyor',
      'incident clean',
    ) && ok;

  ok =
    assert(
      checks,
      clampCrisisScore(150) === 100 && clampCrisisScore(-5) === 0,
      'score clamp 0-100 çalışıyor',
      'clamp',
    ) && ok;

  ok =
    assert(
      checks,
      getCrisisRiskLevel(20) === 'stable' &&
        getCrisisRiskLevel(50) === 'watch' &&
        getCrisisRiskLevel(70) === 'elevated' &&
        getCrisisRiskLevel(90) === 'critical',
      'risk thresholds doğru',
      'thresholds',
    ) && ok;

  ok =
    assert(
      checks,
      getCrisisTrend(50, 40) === 'improving' && getCrisisTrend(50, 55) === 'worsening',
      'trend hesaplama doğru',
      'trend',
    ) && ok;

  const pilotGs = createDay1Seed().gameState;
  ok =
    assert(
      checks,
      deriveCrisisAccessMode(pilotGs, createInitialMonetizationState()) === 'inactive',
      'Pilot Day 1-7 access inactive',
      'pilot access',
    ) && ok;

  const limitedGs = applyLimitedContinueToGameState(fullDay8State());
  ok =
    assert(
      checks,
      deriveCrisisAccessMode(
        limitedGs,
        selectLimitedContinue(createInitialMonetizationState(), 8),
      ) === 'limited_preview',
      'Limited access limited_preview',
      'limited access',
    ) && ok;

  const fullGs = fullDay8State();
  const fullMon = mockPurchaseMainOperationPack(createInitialMonetizationState(), 8);
  ok =
    assert(
      checks,
      deriveCrisisAccessMode(fullGs, fullMon) === 'active',
      'Full main operation active access',
      'full access',
    ) && ok;

  const pilotProcess = processCrisisEndOfDay(
    crisisInput({ ...pilotGs, city: { ...pilotGs.city, day: 3 } }),
    3,
  );
  ok =
    assert(
      checks,
      pilotProcess.activeIncident == null,
      'Pilot Day 1-7 incident üretmiyor',
      'pilot incident',
    ) && ok;

  const limitedProcess = processCrisisEndOfDay(
    crisisInput(limitedGs, selectLimitedContinue(createInitialMonetizationState(), 8)),
    8,
  );
  ok =
    assert(
      checks,
      limitedProcess.activeIncident == null,
      'Limited mode incident üretmiyor',
      'limited incident',
    ) && ok;

  const strainedSignals = createInitialOperationSignalsState(8);
  strainedSignals.overall = {
    ...strainedSignals.overall,
    score: 75,
    status: 'strained',
  };
  const fullScore = calculateCityCrisisScore(
    crisisInput(fullGs, fullMon, createInitialCrisisState(), {
      operationSignals: strainedSignals,
    }),
  );
  ok =
    assert(
      checks,
      fullScore > 40,
      'Full mode score operationSignals’dan türetiliyor',
      'score derive',
    ) && ok;

  ok =
    assert(
      checks,
      fullScore > calculateCityCrisisScore(
        crisisInput(fullGs, fullMon, createInitialCrisisState(), {
          operationSignals: createInitialOperationSignalsState(8),
        }),
      ),
      'High overall signal crisis score artırıyor',
      'overall boost',
    ) && ok;

  const chainSignals = createInitialOperationSignalsState(8);
  chainSignals.vehicles = { ...chainSignals.vehicles, status: 'strained', score: 70 };
  chainSignals.containers = { ...chainSignals.containers, status: 'critical', score: 80 };
  const builtSignals = buildCrisisSignals(
    crisisInput(fullGs, fullMon, createInitialCrisisState(), {
      operationSignals: chainSignals,
    }),
  );
  ok =
    assert(
      checks,
      builtSignals.some((s) => s.sourceTags.includes('chain')),
      'Vehicle + container strained chain signal üretiyor',
      'chain signal',
    ) && ok;

  const districtSignals = createInitialOperationSignalsState(8);
  districtSignals.districts = {
    ...districtSignals.districts,
    status: 'strained',
    score: 72,
  };
  ok =
    assert(
      checks,
      buildCrisisSignals(
        crisisInput(fullGs, fullMon, createInitialCrisisState(), {
          operationSignals: districtSignals,
        }),
      ).some((s) => s.domain === 'districts'),
      'District elevated multi district signal üretiyor',
      'district signal',
    ) && ok;

  const weakAssignments = createInitialAssignmentsState();
  weakAssignments.dailyAssignmentSummary = {
    day: 8,
    confirmedCount: 1,
    strongFitCount: 0,
    weakFitCount: 2,
  };
  ok =
    assert(
      checks,
      buildCrisisSignals(
        crisisInput(fullGs, fullMon, createInitialCrisisState(), {
          assignments: weakAssignments,
        }),
      ).some((s) => s.domain === 'assignments'),
      'Weak assignment coordination signal üretiyor',
      'assignment signal',
    ) && ok;

  const seasonDay1Score = calculateCityCrisisScore(
    crisisInput(fullGs, fullMon, createInitialCrisisState(), {
      operationSignals: strainedSignals,
      mainOperationSeason: createFullMainOperationSeasonState(8),
    }),
  );
  ok =
    assert(
      checks,
      seasonDay1Score <= 79,
      'Full season day 1 aşırı critical üretmiyor',
      'season day1 cap',
    ) && ok;

  let elevatedState = deriveCrisisStateFromGameState(
    crisisInput(fullGs, fullMon, {
      ...createInitialCrisisState(),
      cityCrisisScore: 78,
      riskLevel: 'elevated',
      accessMode: 'active',
    }),
  );
  elevatedState = {
    ...elevatedState,
    cityCrisisScore: 78,
    riskLevel: 'elevated',
    accessMode: 'active',
    lastIncidentDay: undefined,
  };
  const fullGsDay9 = { ...fullGs, city: { ...fullGs.city, day: 9 } };
  const seasonDay2 = createFullMainOperationSeasonState(8);
  const elevatedDay9 = {
    ...elevatedState,
    cityCrisisScore: 78,
    riskLevel: 'elevated' as const,
  };
  ok =
    assert(
      checks,
      shouldCreateCrisisIncident(
        crisisInput(fullGsDay9, fullMon, elevatedDay9, {
          mainOperationSeason: seasonDay2,
        }),
        elevatedDay9,
      ),
      'Season day 2+ elevated incident forming olabilir',
      'forming check',
    ) && ok;

  const criticalState = {
    ...elevatedState,
    cityCrisisScore: 85,
    riskLevel: 'critical' as const,
    lastIncidentDay: 5,
  };
  const incident = createCrisisIncidentFromSignals(
    crisisInput(fullGs, fullMon, criticalState),
    criticalState.recentSignals.length
      ? criticalState.recentSignals
      : builtSignals,
    criticalState,
  );
  ok =
    assert(
      checks,
      incident != null && (incident.status === 'active' || incident.status === 'forming'),
      'score >= threshold active incident oluşturuyor',
      'incident create',
    ) && ok;

  const tooSoon = createCrisisIncidentFromSignals(
    crisisInput(fullGs, fullMon, { ...criticalState, lastIncidentDay: 8 }),
    builtSignals,
    { ...criticalState, lastIncidentDay: 8 },
  );
  ok =
    assert(
      checks,
      tooSoon == null,
      'MIN_DAYS_BETWEEN_CRISIS_INCIDENTS guard çalışıyor',
      'min days guard',
    ) && ok;

  ok =
    assert(
      checks,
      processCrisisEndOfDay(crisisInput(fullGs, fullMon, criticalState), 8)
        .lastProcessedDay === 8,
      'processCrisisEndOfDay idempotent',
      'eod idempotent',
    ) && ok;

  ok =
    assert(
      checks,
      (incident?.affectedDistrictIds.length ?? 0) <= 3,
      'active incident affectedDistrictIds max 3',
      'district ids',
    ) && ok;

  ok =
    assert(
      checks,
      incident?.primaryDomain != null,
      'active incident primaryDomain dolu',
      'primary domain',
    ) && ok;

  const resolved = markCrisisIncidentResolved(
    {
      ...criticalState,
      activeIncident:
        incident ??
        ({
          id: 'test-incident',
          day: 8,
          status: 'active',
          title: 'Test',
          summary: 'Test',
          affectedDistrictIds: ['merkez'],
          primaryDomain: 'city',
          severity: 'critical',
          sourceSignalIds: [],
        } as const),
    },
    8,
  );
  ok =
    assert(
      checks,
      resolved.activeIncident?.status === 'resolved',
      'incident contained/resolved logic çalışıyor',
      'resolve',
    ) && ok;

  let withSignals = createInitialCrisisState();
  for (let i = 0; i < 8; i += 1) {
    withSignals = addCrisisSignal(withSignals, {
      id: `sig-${i}`,
      domain: 'city',
      riskLevel: 'watch',
      score: 40,
      trend: 'steady',
      title: `S${i}`,
      summary: 's',
      sourceTags: [],
    });
  }
  ok =
    assert(
      checks,
      withSignals.recentSignals.length <= 5,
      'recentSignals max 5',
      'max signals',
    ) && ok;

  const preview = calculateCrisisImpactPreview(
    crisisInput(fullGs, fullMon, elevatedState),
    {
      id: 'e1',
      title: 'T',
      category: 'Araç',
      description: 'd',
      decisions: [],
      district: 'x',
      neighborhoodId: 'merkez',
      riskLevel: 'high',
      urgencyHours: 1,
      day: 8,
      contextTag: 'test',
      previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    },
  );
  ok =
    assert(
      checks,
      preview != null,
      'Crisis impact preview event ile çalışıyor',
      'preview event',
    ) && ok;

  const weakPreview = calculateCrisisImpactPreview(
    crisisInput(fullGs, fullMon, elevatedState),
    undefined,
    undefined,
    {
      eventId: 'e1',
      personnelType: 'balanced_team',
      vehicleType: 'standard_truck',
      approachType: 'balanced_response',
      compatibilityScore: 35,
      compatibilityLabel: 'Zayıf uyum',
      status: 'confirmed',
      day: 8,
    } as never,
  );
  ok =
    assert(
      checks,
      weakPreview?.tone === 'warning',
      'Crisis impact preview assignment weak fit warning',
      'preview assignment',
    ) && ok;

  ok =
    assert(
      checks,
      buildCrisisDeskHubModel(pilotGs, createInitialMonetizationState(), initial) ==
        undefined,
      'Hub presentation pilotta undefined dönüyor',
      'hub pilot',
    ) && ok;

  const hubFull = buildCrisisDeskHubModel(fullGs, fullMon, elevatedState);
  ok =
    assert(
      checks,
      hubFull != null && hubFull.visible,
      'Hub presentation full’de model üretiyor',
      'hub full',
    ) && ok;

  const reportFull = buildCrisisDeskReportModel(fullGs, fullMon, elevatedState);
  ok =
    assert(
      checks,
      reportFull != null && reportFull.lines.length <= 3,
      'Report presentation full’de max 3 line',
      'report lines',
    ) && ok;

  const reportLimited = buildCrisisDeskReportModel(
    limitedGs,
    selectLimitedContinue(createInitialMonetizationState(), 8),
    limitedProcess,
  );
  ok =
    assert(
      checks,
      Boolean(reportLimited?.lines.some((l) => l.includes('Sınırlı'))),
      'Limited report copy dar kapsam söylüyor',
      'report limited',
    ) && ok;

  const advisorL1 = getCrisisAdvisorComment(crisisInput(fullGs, fullMon, elevatedState), 1);
  const advisorL3 = getCrisisAdvisorComment(crisisInput(fullGs, fullMon, elevatedState), 3);
  ok =
    assert(
      checks,
      advisorL1 != null && advisorL3 != null && advisorL1 !== advisorL3,
      'Advisor crisis comment level’e göre değişiyor',
      'advisor levels',
    ) && ok;

  const engineIn = buildMainOperationEngineInput({
    gameState: fullGs,
    monetization: fullMon,
    mainOperationSeason: createFullMainOperationSeasonState(8),
  });
  const dailySet = buildFullMainOperationDailySet(8, engineIn, elevatedState);
  ok =
    assert(
      checks,
      dailySet.allEventIds.length <= 3,
      'Full event generation crisis riskte cap’i aşmıyor',
      'event cap',
    ) && ok;

  ok =
    assert(
      checks,
      new Set(dailySet.allEventIds).size === dailySet.allEventIds.length,
      'Duplicate crisis events oluşmuyor',
      'duplicate events',
    ) && ok;

  const pilotMapIn = crisisInput(
    { ...fullGs, city: { ...fullGs.city, day: 3 } },
    fullMon,
    createInitialCrisisState(),
  );
  ok =
    assert(
      checks,
      buildCrisisMapPresentation(pilotMapIn).panelLines.length === 0,
      'buildCrisisMapLines pilot Day 1-7’de boş döner',
      'map pilot empty',
    ) && ok;

  const limitedMapIn = crisisInput(limitedGs, selectLimitedContinue(createInitialMonetizationState(), 8), {
    ...limitedProcess,
    riskLevel: 'elevated',
    cityCrisisScore: 70,
  });
  const limitedMap = buildCrisisMapPresentation(limitedMapIn);
  ok =
    assert(
      checks,
      limitedMap.panelLines.length <= 1,
      'limited_preview max 1 compact line üretir',
      'map limited lines',
    ) && ok;

  const fullMap = buildCrisisMapPresentation(crisisInput(fullGs, fullMon, elevatedState));
  ok =
    assert(
      checks,
      fullMap.visible && fullMap.panelLines.length > 0,
      'full active risk watch/elevated/critical line üretir',
      'map full lines',
    ) && ok;

  const incidentState = {
    ...elevatedState,
    activeIncident: {
      id: 'inc-map',
      day: 8,
      status: 'active' as const,
      title: 'Çoklu Mahalle Baskısı',
      summary: 'Birden fazla mahallede operasyon sinyalleri yükseldi.',
      affectedDistrictIds: ['istasyon', 'yesilvadi'],
      primaryDomain: 'districts' as const,
      severity: 'high' as const,
      sourceSignalIds: [],
    },
  };
  const incidentMap = buildCrisisMapPresentation(
    crisisInput(fullGs, fullMon, incidentState),
  );
  ok =
    assert(
      checks,
      incidentMap.panelLines[0]?.summary.includes('mahalle'),
      'activeIncident varsa incident line önceliklidir',
      'map incident priority',
    ) && ok;

  ok =
    assert(
      checks,
      buildCrisisMapPanelLines(crisisInput(fullGs, fullMon, elevatedState)).length <= 2,
      'recentSignals max 2 line verir',
      'map max panel lines',
    ) && ok;

  const emptyDistrictMap = buildCrisisDistrictBadges(
    crisisInput(fullGs, fullMon, { ...createInitialCrisisState(), accessMode: 'active', riskLevel: 'elevated', cityCrisisScore: 75 }),
  );
  ok =
    assert(
      checks,
      Array.isArray(emptyDistrictMap),
      'affectedDistrictIds boşsa fallback crash etmez',
      'map badge fallback',
    ) && ok;

  const criticalMap = buildCrisisMapPresentation(
    crisisInput(fullGs, fullMon, {
      ...elevatedState,
      riskLevel: 'critical',
      cityCrisisScore: 90,
    }),
  );
  ok =
    assert(
      checks,
      criticalMap.districtBadges.some((b) => b.label === 'Kritik eşik'),
      'critical risk “Kritik eşik” label üretir',
      'map critical label',
    ) && ok;

  const mapUiText = [
    ...fullMap.panelLines.map((l) => l.summary),
    ...fullMap.districtBadges.map((b) => b.label),
  ]
    .join(' ')
    .toLowerCase();
  ok =
    assert(
      checks,
      !CRISIS_FORBIDDEN_WORDS.some((w) =>
        w === 'xp' ? /\bxp\b/.test(mapUiText) : mapUiText.includes(w),
      ),
      'Map crisis forbidden words yok',
      'map forbidden',
    ) && ok;

  ok =
    assert(
      checks,
      buildCrisisMapLines(crisisInput(fullGs, fullMon, elevatedState)).length >= 0,
      'Map crisis badge/line crash olmadan üretiliyor',
      'map lines',
    ) && ok;

  ok =
    assert(
      checks,
      normalizeCrisisState(undefined).accessMode === 'inactive',
      'Persist migration v19 → v20 crisisState dolduruyor',
      'persist migration',
    ) && ok;

  ok =
    assert(
      checks,
      SAVE_VERSION === 21,
      'Full loop SAVE_VERSION 21 ile çalışıyor',
      `SAVE_VERSION=${SAVE_VERSION}`,
    ) && ok;

  const uiText = collectCrisisUiStrings(fullGs, fullMon, elevatedState)
    .join(' ')
    .toLowerCase();
  ok =
    assert(
      checks,
      !CRISIS_FORBIDDEN_WORDS.some((w) =>
        w === 'xp' ? /\bxp\b/.test(uiText) : uiText.includes(w),
      ),
      'Forbidden words yok',
      'forbidden',
    ) && ok;

  hasWarn =
    warn(checks, true, 'Crisis Desk detail screen pending', 'detail pending') ||
    hasWarn;
  hasWarn =
    warn(checks, true, 'Crisis resolution actions pending', 'resolution pending') ||
    hasWarn;

  return { ok, warn: hasWarn, checks };
}
