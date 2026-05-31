import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import {
  buildMainOperationEngineInput,
  ensureMainOperationSeasonForGameState,
} from '@/core/mainOperation/mainOperationEngine';
import {
  createInitialMainOperationSeasonState,
  getActiveMainOperationDistrictIds,
  getMainOperationSeasonDay,
} from '@/core/mainOperation/mainOperationState';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import type {
  OperationDomainSignal,
  OperationSignalStatus,
  OperationSignalsState,
} from '@/core/operations/operationSignalTypes';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  CRISIS_INCIDENT_ACTIVE_THRESHOLD,
  CRISIS_INCIDENT_FORMING_THRESHOLD,
  CRISIS_SCORE_DAILY_DECAY,
  CRISIS_SCORE_ELEVATED_MAX,
  CRISIS_SEASON_DAY1_SCORE_CAP,
  CRISIS_SIGNAL_COPY,
  CRISIS_INCIDENT_TEMPLATES,
  MIN_DAYS_BETWEEN_CRISIS_INCIDENTS,
} from './crisisConstants';
import {
  addCrisisSignal,
  buildCrisisSignal,
  clampCrisisScore,
  createInitialCrisisState,
  deriveCrisisAccessModeFromGame,
  getCrisisRiskLevel,
  getCrisisTrend,
  markCrisisIncidentContained,
  markCrisisIncidentResolved,
  normalizeCrisisState,
  refreshCrisisAccessMode,
} from './crisisState';
import type {
  CrisisAccessMode,
  CrisisEngineInput,
  CrisisImpactPreview,
  CrisisIncident,
  CrisisMapLine,
  CrisisSignal,
  CrisisState,
} from './crisisTypes';

function statusPressure(status: OperationSignalStatus): number {
  switch (status) {
    case 'critical':
      return 22;
    case 'strained':
      return 14;
    case 'watch':
      return 6;
    default:
      return 0;
  }
}

function domainPressure(signal: OperationDomainSignal): number {
  return clampCrisisScore(signal.score + statusPressure(signal.status));
}

function resolveSignals(input: CrisisEngineInput): OperationSignalsState {
  if (input.operationSignals) {
    return input.operationSignals;
  }
  return createInitialOperationSignalsState(input.gameState.city.day);
}

export function deriveCrisisAccessMode(
  gameState: GameState,
  monetization: CrisisEngineInput['monetization'],
): CrisisAccessMode {
  return deriveCrisisAccessModeFromGame(gameState, monetization);
}

export function buildCrisisEngineInput(
  params: Omit<CrisisEngineInput, 'crisisState'> & { crisisState?: CrisisState },
): CrisisEngineInput {
  return {
    ...params,
    crisisState: params.crisisState ?? createInitialCrisisState(),
  };
}

export function calculateCityCrisisScore(input: CrisisEngineInput): number {
  const accessMode = deriveCrisisAccessMode(
    input.gameState,
    input.monetization,
  );
  if (accessMode === 'inactive') {
    return clampCrisisScore(20);
  }

  const signals = resolveSignals(input);
  const overall = domainPressure(signals.overall) * 0.25;
  const districts = domainPressure(signals.districts) * 0.2;
  const vehiclesContainers =
    ((domainPressure(signals.vehicles) + domainPressure(signals.containers)) /
      2) *
    0.25;
  const personnel = domainPressure(signals.personnel) * 0.1;

  const weakFit = input.assignments?.dailyAssignmentSummary?.weakFitCount ?? 0;
  const strongFit =
    input.assignments?.dailyAssignmentSummary?.strongFitCount ?? 0;
  const assignmentPart = clampCrisisScore(
    weakFit * 12 - strongFit * 3 + 10,
  ) * 0.1;

  const criticalEvents = input.gameState.events.filter(
    (e) => e.riskLevel === 'critical' || e.riskLevel === 'high',
  ).length;
  const eventPart = clampCrisisScore(criticalEvents * 10) * 0.1;

  let raw = overall + districts + vehiclesContainers + personnel + assignmentPart + eventPart;

  if (accessMode === 'limited_preview') {
    raw = Math.min(CRISIS_SCORE_ELEVATED_MAX, raw * 0.72);
  }

  if (accessMode === 'active') {
    const mainInput = buildMainOperationEngineInput({
      gameState: input.gameState,
      monetization: input.monetization,
      mainOperationSeason:
        input.mainOperationSeason ?? createInitialMainOperationSeasonState(),
      operationSignals: signals,
      assignments: input.assignments,
    });
    const season = ensureMainOperationSeasonForGameState(mainInput);
    const seasonDay = getMainOperationSeasonDay(season, input.gameState.city.day);
    if (seasonDay <= 1) {
      raw = Math.min(CRISIS_SEASON_DAY1_SCORE_CAP, raw);
    }
    const activeDistricts = getActiveMainOperationDistrictIds(season).length;
    if (activeDistricts >= 3) {
      raw += 4;
    }
  }

  if (input.gameState.city.day < 8) {
    raw = Math.min(45, raw);
  }

  return clampCrisisScore(raw);
}

export function buildCrisisSignals(input: CrisisEngineInput): CrisisSignal[] {
  const accessMode = deriveCrisisAccessMode(
    input.gameState,
    input.monetization,
  );
  if (accessMode === 'inactive') {
    return [];
  }

  const signals: CrisisSignal[] = [];
  const op = resolveSignals(input);
  const day = input.gameState.city.day;

  const highPressureDistricts =
    input.mainOperationSeason != null
      ? Object.values(input.mainOperationSeason.districtScopes).filter(
          (s) =>
            (s.status === 'active' || s.status === 'agenda') &&
            s.pressureScore >= 55,
        ).length
      : 0;

  if (
    highPressureDistricts >= 2 ||
    op.districts.status === 'strained' ||
    op.districts.status === 'critical'
  ) {
    signals.push(
      buildCrisisSignal({
        id: `crisis-sig-multi-district-d${day}`,
        domain: 'districts',
        score: clampCrisisScore(op.districts.score + 8),
        title: CRISIS_SIGNAL_COPY.multiDistrict.title,
        summary: CRISIS_SIGNAL_COPY.multiDistrict.summary,
        sourceTags: ['districts', 'multi_neighborhood'],
      }),
    );
  }

  const vehicleStrained =
    op.vehicles.status === 'strained' || op.vehicles.status === 'critical';
  const containerStrained =
    op.containers.status === 'strained' || op.containers.status === 'critical';
  if (vehicleStrained && containerStrained) {
    signals.push(
      buildCrisisSignal({
        id: `crisis-sig-vehicle-container-d${day}`,
        domain: 'vehicles',
        score: clampCrisisScore(
          (op.vehicles.score + op.containers.score) / 2 + 10,
        ),
        title: CRISIS_SIGNAL_COPY.vehicleContainerChain.title,
        summary: CRISIS_SIGNAL_COPY.vehicleContainerChain.summary,
        sourceTags: ['vehicles', 'containers', 'chain'],
      }),
    );
  }

  const weakFit = input.assignments?.dailyAssignmentSummary?.weakFitCount ?? 0;
  if (weakFit > 0) {
    signals.push(
      buildCrisisSignal({
        id: `crisis-sig-assignment-d${day}`,
        domain: 'assignments',
        score: clampCrisisScore(50 + weakFit * 10),
        title: CRISIS_SIGNAL_COPY.assignmentWeak.title,
        summary: CRISIS_SIGNAL_COPY.assignmentWeak.summary,
        sourceTags: ['assignments', 'coordination'],
      }),
    );
  }

  if (
    op.districts.score >= 60 &&
    (op.overall.status === 'strained' || op.overall.status === 'critical')
  ) {
    signals.push(
      buildCrisisSignal({
        id: `crisis-sig-social-d${day}`,
        domain: 'social',
        score: clampCrisisScore(op.districts.score),
        title: CRISIS_SIGNAL_COPY.socialGap.title,
        summary: CRISIS_SIGNAL_COPY.socialGap.summary,
        sourceTags: ['social', 'districts'],
      }),
    );
  }

  const plan = input.dailyOperationsPlan;
  if (
    plan?.status === 'confirmed' &&
    vehicleStrained &&
    plan.vehicleFocus === 'preventive_maintenance'
  ) {
    signals.push(
      buildCrisisSignal({
        id: `crisis-sig-plan-d${day}`,
        domain: 'city',
        score: 58,
        title: CRISIS_SIGNAL_COPY.planConflict.title,
        summary: CRISIS_SIGNAL_COPY.planConflict.summary,
        sourceTags: ['daily_plan', 'tradeoff'],
      }),
    );
  }

  return signals.slice(0, 5);
}

function pickAffectedDistrictIds(input: CrisisEngineInput): string[] {
  const ids = new Set<string>();
  const season = input.mainOperationSeason;
  if (season) {
    for (const id of getActiveMainOperationDistrictIds(season)) {
      ids.add(id);
    }
  }
  const priority = resolveSignals(input).priorityDistrictId;
  if (priority) ids.add(priority);
  for (const event of input.gameState.events) {
    if (event.neighborhoodId) ids.add(event.neighborhoodId);
  }
  return [...ids].slice(0, 3);
}

function pickIncidentTemplate(
  signals: CrisisSignal[],
): (typeof CRISIS_INCIDENT_TEMPLATES)[keyof typeof CRISIS_INCIDENT_TEMPLATES] {
  const domains = signals.map((s) => s.domain);
  if (domains.includes('vehicles') || domains.includes('containers')) {
    return CRISIS_INCIDENT_TEMPLATES.vehicle_container_chain;
  }
  if (domains.includes('assignments')) {
    return CRISIS_INCIDENT_TEMPLATES.assignment_coordination_risk;
  }
  if (domains.includes('social')) {
    return CRISIS_INCIDENT_TEMPLATES.social_response_gap;
  }
  return CRISIS_INCIDENT_TEMPLATES.multi_district_pressure;
}

export function shouldCreateCrisisIncident(
  input: CrisisEngineInput,
  crisisState: CrisisState,
): boolean {
  if (crisisState.accessMode !== 'active') {
    return false;
  }
  if (crisisState.activeIncident?.status === 'active') {
    return false;
  }
  if (crisisState.activeIncident?.status === 'forming') {
    return false;
  }
  const day = input.gameState.city.day;
  if (
    crisisState.lastIncidentDay != null &&
    day - crisisState.lastIncidentDay < MIN_DAYS_BETWEEN_CRISIS_INCIDENTS
  ) {
    return false;
  }
  const score = crisisState.cityCrisisScore;
  const mainInput = buildMainOperationEngineInput({
    gameState: input.gameState,
    monetization: input.monetization,
    mainOperationSeason:
      input.mainOperationSeason ?? createInitialMainOperationSeasonState(),
  });
  const season = ensureMainOperationSeasonForGameState(mainInput);
  const seasonDay = getMainOperationSeasonDay(season, day);
  if (seasonDay < 2 && score < CRISIS_INCIDENT_ACTIVE_THRESHOLD) {
    return false;
  }
  return score >= CRISIS_INCIDENT_FORMING_THRESHOLD;
}

export function createCrisisIncidentFromSignals(
  input: CrisisEngineInput,
  signals: CrisisSignal[],
  crisisState: CrisisState,
): CrisisIncident | undefined {
  if (!shouldCreateCrisisIncident(input, crisisState)) {
    return undefined;
  }
  const template = pickIncidentTemplate(signals);
  const score = crisisState.cityCrisisScore;
  const day = input.gameState.city.day;
  const severity =
    score >= CRISIS_INCIDENT_ACTIVE_THRESHOLD
      ? 'critical'
      : score >= CRISIS_INCIDENT_FORMING_THRESHOLD
        ? 'high'
        : 'medium';
  const status =
    score >= CRISIS_INCIDENT_ACTIVE_THRESHOLD ? 'active' : 'forming';

  return {
    id: `crisis-incident-${day}-${template.id}`,
    day,
    status,
    title: template.title,
    summary: template.summary,
    affectedDistrictIds: pickAffectedDistrictIds(input),
    primaryDomain: template.domain,
    severity,
    sourceSignalIds: signals.map((s) => s.id),
  };
}

export function applyCrisisResolutionFromDayOutcome(
  input: CrisisEngineInput,
  crisisState: CrisisState,
): CrisisState {
  const incident = crisisState.activeIncident;
  if (!incident || incident.status === 'resolved') {
    return crisisState;
  }
  const day = input.gameState.city.day;
  const prev = crisisState.previousCityCrisisScore ?? crisisState.cityCrisisScore;
  const current = crisisState.cityCrisisScore;
  const drop = prev - current;
  const strongFit =
    input.assignments?.dailyAssignmentSummary?.strongFitCount ?? 0;
  const riskLevel = crisisState.riskLevel;

  if (riskLevel === 'stable' || riskLevel === 'watch') {
    return markCrisisIncidentResolved(
      crisisState,
      day,
      'Şehir baskısı izleme seviyesine döndü.',
    );
  }
  if (drop >= 20 || strongFit >= 2) {
    if (incident.status === 'forming') {
      return markCrisisIncidentResolved(crisisState, day);
    }
    return markCrisisIncidentContained(
      crisisState,
      day,
      'Güçlü saha atamaları kriz riskini düşürdü.',
    );
  }
  return crisisState;
}

export function deriveCrisisStateFromGameState(
  input: CrisisEngineInput,
): CrisisState {
  let state = normalizeCrisisState(input.crisisState);
  state = refreshCrisisAccessMode(
    state,
    input.gameState,
    input.monetization,
  );

  const previousScore = state.cityCrisisScore;
  const score = calculateCityCrisisScore(input);
  const mainOpInput = buildMainOperationEngineInput({
    gameState: input.gameState,
    monetization: input.monetization,
    mainOperationSeason:
      input.mainOperationSeason ?? createInitialMainOperationSeasonState(),
    operationSignals: input.operationSignals,
    assignments: input.assignments,
  });
  const signals = buildCrisisSignals({
    ...input,
    mainOperationSeason: ensureMainOperationSeasonForGameState(mainOpInput),
  });

  let recentSignals = [...state.recentSignals];
  for (const sig of signals) {
    recentSignals = [sig, ...recentSignals.filter((s) => s.id !== sig.id)];
  }
  recentSignals = recentSignals.slice(0, 5);

  const day = input.gameState.city.day;
  return {
    ...state,
    cityCrisisScore: score,
    riskLevel: getCrisisRiskLevel(score),
    trend: getCrisisTrend(previousScore, score),
    previousCityCrisisScore: previousScore,
    recentSignals,
    lastRefreshedDay: day,
  };
}

export function processCrisisEndOfDay(
  input: CrisisEngineInput,
  closingDay: number,
): CrisisState {
  if (closingDay < POST_PILOT_FIRST_OPERATION_DAY) {
    return refreshCrisisAccessMode(
      normalizeCrisisState(input.crisisState),
      input.gameState,
      input.monetization,
    );
  }

  let state = deriveCrisisStateFromGameState(input);

  if (state.lastProcessedDay === closingDay) {
    return state;
  }

  const decayed = clampCrisisScore(
    Math.max(0, state.cityCrisisScore - CRISIS_SCORE_DAILY_DECAY),
  );
  state = {
    ...state,
    cityCrisisScore: Math.max(decayed, calculateCityCrisisScore(input)),
    riskLevel: getCrisisRiskLevel(
      Math.max(decayed, calculateCityCrisisScore(input)),
    ),
  };

  const freshSignals = buildCrisisSignals(input);
  for (const sig of freshSignals) {
    state = addCrisisSignal(state, sig);
  }

  if (
    state.accessMode === 'active' &&
    !state.activeIncident &&
    shouldCreateCrisisIncident(input, state)
  ) {
    const incident = createCrisisIncidentFromSignals(
      input,
      state.recentSignals,
      state,
    );
    if (incident) {
      state = {
        ...state,
        activeIncident: incident,
        lastIncidentDay: closingDay,
      };
    }
  }

  state = applyCrisisResolutionFromDayOutcome(input, state);

  if (
    state.activeIncident?.status === 'resolved' ||
    state.activeIncident?.status === 'contained'
  ) {
    state = {
      ...state,
      activeIncident: undefined,
    };
  }

  return {
    ...state,
    lastProcessedDay: closingDay,
    lastRefreshedDay: closingDay,
  };
}

export function calculateCrisisImpactPreview(
  input: CrisisEngineInput,
  event?: EventCard,
  decision?: EventDecision,
  assignment?: EventAssignmentState,
): CrisisImpactPreview | undefined {
  const accessMode = deriveCrisisAccessMode(
    input.gameState,
    input.monetization,
  );
  if (accessMode === 'inactive' || input.gameState.city.day < 8) {
    return undefined;
  }

  const riskLevel = input.crisisState.riskLevel ?? getCrisisRiskLevel(
    input.crisisState.cityCrisisScore,
  );

  if (accessMode === 'limited_preview') {
    if (riskLevel === 'stable') return undefined;
    return {
      title: 'Kriz sinyali',
      summary:
        'Sınırlı gündemde kriz sinyali dar kapsamda izlenir.',
      riskDelta: 0,
      riskLabel: 'Dar kapsam',
      tone: 'neutral',
      sourceTags: ['crisis', 'limited'],
    };
  }

  if (riskLevel === 'stable') {
    return undefined;
  }

  const category = event?.category?.toLowerCase() ?? '';
  const approach = assignment?.approachType;

  if (approach === 'public_first') {
    return {
      title: 'Kriz etkisi',
      summary: 'Halk odaklı yaklaşım sosyal kriz riskini azaltabilir.',
      riskDelta: -4,
      riskLabel: 'Sosyal denge',
      tone: 'positive',
      sourceTags: ['crisis', 'social'],
    };
  }

  if (
    assignment &&
    (assignment.compatibilityLabel === 'Zayıf uyum' ||
      assignment.compatibilityScore < 45)
  ) {
    return {
      title: 'Kriz etkisi',
      summary: 'Zayıf atama uyumu kriz riskini artırabilir.',
      riskDelta: 6,
      riskLabel: 'Koordinasyon riski',
      tone: 'warning',
      sourceTags: ['crisis', 'assignments'],
    };
  }

  if (
    category.includes('araç') ||
    category.includes('vehicle') ||
    category.includes('konteyner')
  ) {
    return {
      title: 'Kriz etkisi',
      summary:
        'Bu karar araç ve konteyner baskısını aynı anda etkiliyor.',
      riskDelta: 5,
      riskLabel: 'Zincir baskısı',
      tone: 'warning',
      sourceTags: ['crisis', 'vehicles', 'containers'],
    };
  }

  if (
    approach === 'lasting_fix' ||
    decision?.decisionStyle === 'permanent'
  ) {
    return {
      title: 'Kriz etkisi',
      summary:
        'Kalıcı çözüm yarına taşınan kriz baskısını düşürebilir.',
      riskDelta: -3,
      riskLabel: 'Önleyici hamle',
      tone: 'positive',
      sourceTags: ['crisis', 'planned'],
    };
  }

  if (riskLevel === 'elevated' || riskLevel === 'critical') {
    return {
      title: 'Kriz etkisi',
      summary: 'Şehir baskısı kritik eşiğe yaklaşıyor; planı buna göre seç.',
      riskDelta: 2,
      riskLabel: 'Kritik eşik',
      tone: 'warning',
      sourceTags: ['crisis', 'city'],
    };
  }

  return undefined;
}

export function getCrisisAdvisorComment(
  input: CrisisEngineInput,
  advisorLevel: 1 | 2 | 3 = 2,
): string | undefined {
  const accessMode = deriveCrisisAccessMode(
    input.gameState,
    input.monetization,
  );
  if (accessMode === 'inactive' || input.gameState.city.day < 8) {
    return undefined;
  }

  if (accessMode === 'limited_preview') {
    return 'Sınırlı gündemde kriz sinyali dar kapsamda izleniyor. Tam kriz yönetimi Ana Operasyon kapsamına bağlı.';
  }

  const state = input.crisisState;
  const incident = state.activeIncident;

  if (incident?.status === 'active' || incident?.status === 'forming') {
    if (advisorLevel === 1) {
      return 'Kriz Masası birden fazla sinyali aynı hatta görüyor. Zayıf atamalar riski büyütebilir.';
    }
    if (advisorLevel === 3) {
      return 'Bu kombinasyon yarın çoklu mahalle krizine dönebilir. Atama ve planı birlikte düşün.';
    }
    return 'Kriz Masası birden fazla sinyali aynı hatta görüyor. Zayıf atamalar riski büyütebilir.';
  }

  if (state.riskLevel === 'elevated' || state.riskLevel === 'critical') {
    if (advisorLevel === 1) {
      return 'Kriz sinyali oluşuyor olabilir.';
    }
    if (advisorLevel === 2) {
      return 'Şehir baskısı kritik eşiğe yaklaşıyor. Bugünkü planı tek mahalleye değil, araç ve konteyner zincirine göre düşünmek iyi olur.';
    }
    return 'Araç ve konteyner baskısı birlikte yükseliyor; sezon hedeflerini göz ardı etme.';
  }

  return undefined;
}

export function shouldAddCrisisRelatedEvent(
  crisisState: CrisisState,
): boolean {
  if (crisisState.accessMode !== 'active') {
    return false;
  }
  if (
    crisisState.riskLevel !== 'elevated' &&
    crisisState.riskLevel !== 'critical'
  ) {
    return false;
  }
  return true;
}

export function buildCrisisMapLines(
  input: CrisisEngineInput,
): CrisisMapLine[] {
  const accessMode = deriveCrisisAccessMode(
    input.gameState,
    input.monetization,
  );
  if (accessMode === 'inactive') {
    return [];
  }
  const incident = input.crisisState.activeIncident;
  if (accessMode === 'limited_preview' && input.crisisState.riskLevel === 'stable') {
    return [];
  }
  const lines: CrisisMapLine[] = [];
  const affected = incident?.affectedDistrictIds ?? [];
  for (const districtId of affected) {
    lines.push({
      districtId,
      label: 'Kriz sinyali',
      tone: incident?.severity === 'critical' ? 'critical' : 'warning',
    });
  }
  if (lines.length === 0 && input.crisisState.riskLevel !== 'stable') {
    lines.push({
      districtId: resolveSignals(input).priorityDistrictId,
      label:
        input.crisisState.riskLevel === 'critical'
          ? 'Kriz eşiği'
          : 'Kritik eşik',
      tone:
        input.crisisState.riskLevel === 'critical' ? 'critical' : 'warning',
    });
  }
  return lines.slice(0, 3);
}
