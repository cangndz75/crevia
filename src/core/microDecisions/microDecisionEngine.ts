import type { EventCard } from '@/core/models/EventCard';
import { isFullMainOperationAccess } from '@/core/monetization/monetizationEngine';
import { normalizePostPilotOperationState } from '@/core/postPilot/postPilotOperationSeed';
import { clampCrisisScore, getCrisisRiskLevel } from '@/core/crisis/crisisState';
import type { CrisisState } from '@/core/crisis/crisisTypes';
import {
  buildOperationSignal,
  clampSignalScore,
} from '@/core/operations/operationSignalState';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import { BALANCE_COPY } from '@/core/balance/gameplayImpactConstants';
import { getCarryOverRiskLine } from '@/core/balance/gameplayImpactPresentation';
import { scaleGameplayDelta } from '@/core/balance/gameplayImpactTuning';
import type { GameplayImpactScaleContext } from '@/core/balance/gameplayImpactTypes';

import {
  ACCESS_MODE_DOMAINS,
  ADVISOR_WARNING_SUMMARIES,
  CRISIS_THRESHOLD_SUMMARIES,
  DISTRICT_REP_SUMMARIES,
  FIELD_UPDATE_SUMMARIES,
  getMaxDailyDecisionsForAccess,
  LIMITED_BLOCKED_TYPES,
  MICRO_DECISION_TYPE_LABELS,
  OPERATION_OPPORTUNITY_SUMMARIES,
  OPTION_LABELS,
  PILOT_LIMITED_TYPES,
  ALL_MICRO_DECISION_TYPES,
} from './microDecisionConstants';
import {
  addMicroDecision,
  buildMicroDecisionDailySummary,
  expireOldMicroDecisions,
  getActiveMicroDecisions,
  hasReachedDailyMicroDecisionLimit,
  markMicroDecisionEffectsApplied,
  pruneMicroDecisionHistory,
} from './microDecisionState';
import type {
  MicroDecision,
  MicroDecisionAccessMode,
  MicroDecisionDomain,
  MicroDecisionEffect,
  MicroDecisionEngineInput,
  MicroDecisionGenerationContext,
  MicroDecisionOption,
  MicroDecisionState,
  MicroDecisionType,
} from './microDecisionTypes';

function decisionId(day: number, type: MicroDecisionType): string {
  return `micro_${day}_${type}`;
}

export function deriveMicroDecisionAccessMode(
  input: Pick<MicroDecisionEngineInput, 'gameState' | 'monetization'>,
): MicroDecisionAccessMode {
  const pilot = input.gameState.pilot;
  if (pilot.status === 'active') {
    const pilotDay = pilot.currentPilotDay ?? input.gameState.city.day;
    if (pilotDay <= 2) return 'inactive';
    if (pilotDay <= 7) return 'pilot_limited';
    return 'inactive';
  }
  if (pilot.status !== 'completed') return 'inactive';
  if (isFullMainOperationAccess(input.gameState, input.monetization)) return 'full';
  if (input.monetization.mainOperationAccess === 'limited') return 'limited';
  const postPilot = normalizePostPilotOperationState(pilot.postPilotOperation, {
    pilotStatus: pilot.status,
    currentPilotDay: pilot.currentPilotDay,
  });
  if (
    postPilot.phase === 'main_operation_light' ||
    postPilot.phase === 'main_operation_full'
  ) {
    return postPilot.phase === 'main_operation_full' ? 'full' : 'limited';
  }
  return 'inactive';
}

function hasActiveCrisisIncident(crisisState: CrisisState): boolean {
  const incident = crisisState.activeIncident;
  if (!incident) return false;
  return incident.status === 'forming' || incident.status === 'active';
}

export function buildMicroDecisionGenerationContext(
  input: MicroDecisionEngineInput,
): MicroDecisionGenerationContext {
  const accessMode = deriveMicroDecisionAccessMode(input);
  const activeCrisis =
    hasActiveCrisisIncident(input.crisisState) ||
    input.crisisState.riskLevel === 'elevated' ||
    input.crisisState.riskLevel === 'critical';
  const maxDailyDecisions = getMaxDailyDecisionsForAccess(accessMode, activeCrisis);
  let allowedTypes = ALL_MICRO_DECISION_TYPES.filter(
    (t) => !LIMITED_BLOCKED_TYPES.includes(t) || accessMode === 'full',
  );
  if (accessMode === 'pilot_limited') {
    allowedTypes = PILOT_LIMITED_TYPES;
  }
  if (accessMode === 'limited') {
    allowedTypes = allowedTypes.filter((t) => t !== 'crisis_threshold');
  }
  return {
    accessMode,
    day: input.day,
    maxDailyDecisions,
    allowedTypes,
    candidateDomains: ACCESS_MODE_DOMAINS[accessMode],
  };
}

function buildMicroScaleContext(
  input: MicroDecisionEngineInput,
  isCrisisRelated = false,
): GameplayImpactScaleContext {
  const fullAccess = isFullMainOperationAccess(input.gameState, input.monetization);
  return {
    gameState: input.gameState,
    monetization: input.monetization,
    isDay1Tutorial: input.gameState.city.day <= 1,
    postPilotLightPhase: !fullAccess,
    isCrisisRelated,
    crisisRiskElevated:
      input.crisisState.riskLevel === 'elevated' ||
      input.crisisState.riskLevel === 'critical',
  };
}

function scaleMicroEffects(
  effects: MicroDecisionEffect[],
  input: MicroDecisionEngineInput,
  isCrisisRelated = false,
): MicroDecisionEffect[] {
  const ctx = buildMicroScaleContext(input, isCrisisRelated);
  return effects
    .map((e) => ({
      ...e,
      delta: scaleGameplayDelta(
        e.delta,
        e.domain === 'crisis' ? { ...ctx, isCrisisRelated: true } : ctx,
      ),
    }))
    .filter((e) => e.delta !== 0);
}

function safeOption(
  id: string,
  label: string,
  description: string,
  upside: string,
  tradeoff: string,
  tone: MicroDecisionOption['tone'],
  effects: MicroDecisionEffect[],
  sourceTags: string[],
): MicroDecisionOption {
  return { id, label, description, upside, tradeoff, tone, effects, sourceTags };
}

export function buildAdvisorWarningOptions(): MicroDecisionOption[] {
  return [
    safeOption(
      'public_comms',
      OPTION_LABELS.publicComms,
      'Halk iletişimini bugün öne al.',
      'Sosyal baskı yumuşayabilir.',
      'Saha kapasitesi daralır.',
      'positive',
      [
        { domain: 'districts', delta: -5, reason: 'Mahalle gerilimi azalır.', sourceTags: ['advisor'] },
        { domain: 'social', delta: -5, reason: 'Sosyal baskı düşer.', sourceTags: ['advisor'] },
        { domain: 'personnel', delta: 1, reason: 'Ekip yükü artar.', sourceTags: ['advisor'] },
      ],
      ['advisor_warning'],
    ),
    safeOption(
      'keep_plan',
      OPTION_LABELS.keepPlan,
      'Mevcut plana sadık kal.',
      'Operasyon akışı bozulmaz.',
      getCarryOverRiskLine('plan_keep'),
      'neutral',
      [
        { domain: 'districts', delta: 3, reason: getCarryOverRiskLine('plan_keep'), sourceTags: ['advisor'] },
      ],
      ['advisor_warning'],
    ),
    safeOption(
      'monitor',
      OPTION_LABELS.monitor,
      'Sinyali izlemeye al.',
      'Kapasite korunur.',
      getCarryOverRiskLine('monitor'),
      'warning',
      [
        { domain: 'planning', delta: 2, reason: getCarryOverRiskLine('monitor'), sourceTags: ['advisor'] },
        { domain: 'crisis', delta: 1, reason: 'Kriz sinyali izlenir.', sourceTags: ['advisor'] },
      ],
      ['advisor_warning'],
    ),
  ];
}

function buildFieldUpdateOptions(): MicroDecisionOption[] {
  return [
    safeOption(
      'maintenance',
      OPTION_LABELS.maintenanceFocus,
      'Araçları bakım odağına çek.',
      'Araç riski düşebilir.',
      'Konteyner gecikmesi artabilir.',
      'positive',
      [
        { domain: 'vehicles', delta: -7, reason: 'Araç baskısı azalır.', sourceTags: ['field'] },
        { domain: 'personnel', delta: 2, reason: 'Ekip yükü artar.', sourceTags: ['field'] },
        { domain: 'containers', delta: 2, reason: BALANCE_COPY.preventiveTradeoff, sourceTags: ['field'] },
      ],
      ['field_update'],
    ),
    safeOption(
      'continue',
      OPTION_LABELS.continueTask,
      'Göreve devam et.',
      'Saha hedefi korunur.',
      'Araç baskısı artabilir.',
      'warning',
      [
        { domain: 'vehicles', delta: 5, reason: 'Araç yükü artar.', sourceTags: ['field'] },
        { domain: 'assignments', delta: -5, reason: 'Atama verimi artar.', sourceTags: ['field'] },
        { domain: 'personnel', delta: 3, reason: 'Saha ekibi yükü artar.', sourceTags: ['field'] },
      ],
      ['field_update'],
    ),
    safeOption(
      'keep_plan',
      OPTION_LABELS.keepPlan,
      'Planı koru.',
      'Akış sade kalır.',
      'Baskı izlenir.',
      'neutral',
      [
        { domain: 'planning', delta: 1, reason: 'Genel risk hafif artar.', sourceTags: ['field'] },
      ],
      ['field_update'],
    ),
  ];
}

export function buildCrisisThresholdOptions(): MicroDecisionOption[] {
  return [
    safeOption(
      'crisis_coord',
      OPTION_LABELS.crisisCoord,
      'Kriz koordinasyonunu başlat.',
      'Şehir baskısı düşebilir.',
      'Kapasite daralır.',
      'positive',
      [
        { domain: 'crisis', delta: -10, reason: BALANCE_COPY.crisisPreventiveReduced, sourceTags: ['crisis'] },
        { domain: 'personnel', delta: 3, reason: 'Ekip yükü artar.', sourceTags: ['crisis'] },
        { domain: 'vehicles', delta: 3, reason: 'Araç yükü artar.', sourceTags: ['crisis'] },
        { domain: 'planning', delta: -4, reason: 'Koordinasyon genel baskıyı düşürür.', sourceTags: ['crisis'] },
      ],
      ['crisis_threshold'],
    ),
    safeOption(
      'rebalance',
      OPTION_LABELS.rebalanceAssignment,
      'Saha atamasını yeniden dengele.',
      'Atama riski azalır.',
      'Gün içi tempo yavaşlar.',
      'warning',
      [
        { domain: 'assignments', delta: -7, reason: 'Atama dengelenir.', sourceTags: ['crisis'] },
        { domain: 'crisis', delta: -5, reason: 'Kriz baskısı düşer.', sourceTags: ['crisis'] },
        { domain: 'personnel', delta: 2, reason: 'Ekip yükü artar.', sourceTags: ['crisis'] },
      ],
      ['crisis_threshold'],
    ),
    safeOption(
      'monitor',
      OPTION_LABELS.monitor,
      'İzlemeye al.',
      'Kapasite korunur.',
      'Kriz riski artabilir.',
      'warning',
      [
        { domain: 'crisis', delta: 6, reason: BALANCE_COPY.crisisMonitorCarry, sourceTags: ['crisis'] },
        { domain: 'planning', delta: 3, reason: getCarryOverRiskLine('monitor'), sourceTags: ['crisis'] },
      ],
      ['crisis_threshold'],
    ),
  ];
}

function buildDistrictRepOptions(): MicroDecisionOption[] {
  return [
    safeOption(
      'inform',
      OPTION_LABELS.informRep,
      'Temsilciye bilgi ver.',
      'Mahalle gerilimi azalır.',
      'Ekip zamanı harcanır.',
      'positive',
      [
        { domain: 'districts', delta: -6, reason: 'Mahalle baskısı düşer.', sourceTags: ['district'] },
        { domain: 'social', delta: -5, reason: 'Sosyal baskı düşer.', sourceTags: ['district'] },
        { domain: 'personnel', delta: 1, reason: 'Ekip yükü artar.', sourceTags: ['district'] },
      ],
      ['district_representative'],
    ),
    safeOption(
      'inspection',
      OPTION_LABELS.inspectionTeam,
      'Denetim ekibi yönlendir.',
      'Bölge kontrolü artar.',
      'Kapasite daralır.',
      'warning',
      [
        { domain: 'districts', delta: -6, reason: 'Mahalle baskısı düşer.', sourceTags: ['district'] },
        { domain: 'personnel', delta: 3, reason: 'Ekip yükü artar.', sourceTags: ['district'] },
      ],
      ['district_representative'],
    ),
    safeOption(
      'keep_plan',
      OPTION_LABELS.keepPlan,
      'Planı koru.',
      'Operasyon akışı korunur.',
      'Geri bildirim bekler.',
      'neutral',
      [
        { domain: 'districts', delta: 3, reason: getCarryOverRiskLine('plan_keep'), sourceTags: ['district'] },
      ],
      ['district_representative'],
    ),
  ];
}

function buildOpportunityOptions(): MicroDecisionOption[] {
  return [
    safeOption(
      'seize',
      OPTION_LABELS.seizeOpportunity,
      'Fırsatı değerlendir.',
      'Baskı azalabilir.',
      'Kaynak kullanımı artar.',
      'positive',
      [
        { domain: 'containers', delta: -7, reason: 'Konteyner baskısı düşer.', sourceTags: ['opportunity'] },
        { domain: 'vehicles', delta: 3, reason: 'Araç yükü artar.', sourceTags: ['opportunity'] },
        { domain: 'personnel', delta: 3, reason: 'Ekip yükü artar.', sourceTags: ['opportunity'] },
      ],
      ['operation_opportunity'],
    ),
    safeOption(
      'balanced',
      OPTION_LABELS.balanced,
      'Dengeli devam et.',
      'Risk kontrollü kalır.',
      'Fırsat kaçabilir.',
      'neutral',
      [
        { domain: 'planning', delta: -2, reason: 'Operasyon dengesi korunur.', sourceTags: ['opportunity'] },
      ],
      ['operation_opportunity'],
    ),
    safeOption(
      'monitor',
      OPTION_LABELS.monitor,
      'İzlemeye al.',
      'Kapasite korunur.',
      'Fırsat kaçabilir.',
      'warning',
      [
        { domain: 'containers', delta: 2, reason: getCarryOverRiskLine('monitor'), sourceTags: ['opportunity'] },
      ],
      ['operation_opportunity'],
    ),
  ];
}

function pickSummary(lines: readonly string[], seed: number): string {
  return lines[seed % lines.length] ?? lines[0];
}

function hasWeakAssignment(input: MicroDecisionEngineInput): boolean {
  return Object.values(input.assignments.assignmentsByEventId).some(
    (a) => a.compatibilityLabel === 'Zayıf uyum',
  );
}

function hasDispatchedAssignment(input: MicroDecisionEngineInput): boolean {
  return Object.values(input.assignments.assignmentsByEventId).some(
    (a) => a.status === 'dispatched' || a.status === 'confirmed',
  );
}

function signalsWorsening(input: MicroDecisionEngineInput): boolean {
  const domains = [
    input.operationSignals.personnel,
    input.operationSignals.vehicles,
    input.operationSignals.containers,
    input.operationSignals.districts,
    input.operationSignals.overall,
  ];
  return domains.some((d) => d.trend === 'worsening');
}

function planEventConflict(input: MicroDecisionEngineInput): boolean {
  const plan = input.dailyOperationsPlan;
  if (plan.status !== 'confirmed') return false;
  const focus = plan.districtFocusId;
  if (!focus) return false;
  const conflicting = input.activeEvents.find(
    (e) => e.neighborhoodId && e.neighborhoodId !== focus,
  );
  return conflicting != null;
}

function districtPressure(input: MicroDecisionEngineInput): boolean {
  const d = input.operationSignals.districts;
  return (
    d.status === 'watch' ||
    d.status === 'strained' ||
    d.status === 'critical'
  );
}

function hasMeaningfulSignalContext(input: MicroDecisionEngineInput): boolean {
  if (signalsWorsening(input)) return true;
  if (hasWeakAssignment(input)) return true;
  if (hasDispatchedAssignment(input)) return true;
  if (input.advisorState.lastMissedSignal && !input.advisorState.lastMissedSignal.acknowledged) {
    return true;
  }
  if (
    input.crisisState.riskLevel !== 'stable' ||
    hasActiveCrisisIncident(input.crisisState)
  ) {
    return true;
  }
  if (districtPressure(input)) return true;
  if (planEventConflict(input)) return true;
  if (
    input.operationSignals.overall.status === 'stable' ||
    input.operationSignals.overall.status === 'watch'
  ) {
    return input.activeEvents.length > 0;
  }
  return true;
}

type CandidateSpec = {
  type: MicroDecisionType;
  priority: number;
  build: () => MicroDecision | undefined;
};

export function generateMicroDecisionCandidates(
  input: MicroDecisionEngineInput,
): MicroDecision[] {
  const ctx = buildMicroDecisionGenerationContext(input);
  if (ctx.accessMode === 'inactive' || ctx.maxDailyDecisions === 0) return [];
  if (!hasMeaningfulSignalContext(input)) return [];

  const day = input.day;
  const specs: CandidateSpec[] = [];

  if (ctx.allowedTypes.includes('advisor_warning')) {
    const advisorBand = input.advisorState.reliabilityBand;
    const missed = input.advisorState.lastMissedSignal;
    const trigger =
      ((advisorBand === 'early_observation' || advisorBand === 'developing') &&
        signalsWorsening(input)) ||
      (missed != null && missed.day <= day) ||
      planEventConflict(input);
    if (trigger) {
      specs.push({
        type: 'advisor_warning',
        priority: missed && !missed.acknowledged ? 100 : 60,
        build: () => ({
          id: decisionId(day, 'advisor_warning'),
          day,
          type: 'advisor_warning',
          status: 'available',
          domain: 'planning',
          title: MICRO_DECISION_TYPE_LABELS.advisor_warning,
          summary: pickSummary(ADVISOR_WARNING_SUMMARIES, day),
          reasonLine: missed
            ? 'Kaçırılan sinyal sonrası plan ile saha arasında uyumsuzluk riski.'
            : 'Operasyon sinyalleri plan beklentisinin üstünde yükseliyor.',
          options: buildAdvisorWarningOptions(),
          createdAtDay: day,
          expiresAtDay: day + 1,
          sourceTags: ['advisor', 'operation_signals'],
        }),
      });
    }
  }

  if (ctx.allowedTypes.includes('field_update')) {
    const trigger = hasWeakAssignment(input) || hasDispatchedAssignment(input);
    const strained =
      input.operationSignals.vehicles.status === 'strained' ||
      input.operationSignals.vehicles.status === 'critical' ||
      input.operationSignals.personnel.status === 'strained';
    if (trigger || strained) {
      const related = Object.values(input.assignments.assignmentsByEventId).find(
        (a) => a.status === 'dispatched' || a.compatibilityLabel === 'Zayıf uyum',
      );
      specs.push({
        type: 'field_update',
        priority: hasWeakAssignment(input) ? 90 : 50,
        build: () => ({
          id: decisionId(day, 'field_update'),
          day,
          type: 'field_update',
          status: 'available',
          domain: 'assignments',
          title: MICRO_DECISION_TYPE_LABELS.field_update,
          summary: pickSummary(FIELD_UPDATE_SUMMARIES, day + 1),
          reasonLine: hasWeakAssignment(input)
            ? 'Zayıf uyumlu atama sahada risk taşıyor.'
            : 'Saha ekibi kapasite baskısı bildirdi.',
          relatedEventId: related?.eventId,
          options: buildFieldUpdateOptions(),
          createdAtDay: day,
          expiresAtDay: day + 1,
          sourceTags: ['assignments', 'field'],
        }),
      });
    }
  }

  if (ctx.allowedTypes.includes('crisis_threshold')) {
    const risk = input.crisisState.riskLevel;
    const trigger =
      risk === 'watch' ||
      risk === 'elevated' ||
      risk === 'critical' ||
      hasActiveCrisisIncident(input.crisisState);
    const combined =
      input.operationSignals.vehicles.score >= 55 &&
      input.operationSignals.containers.score >= 55;
    if (trigger || combined) {
      specs.push({
        type: 'crisis_threshold',
        priority: hasActiveCrisisIncident(input.crisisState) ? 95 : 70,
        build: () => ({
          id: decisionId(day, 'crisis_threshold'),
          day,
          type: 'crisis_threshold',
          status: 'available',
          domain: 'crisis',
          title: MICRO_DECISION_TYPE_LABELS.crisis_threshold,
          summary: pickSummary(CRISIS_THRESHOLD_SUMMARIES, day + 2),
          reasonLine: `Kriz seviyesi ${risk}; araç ve konteyner sinyalleri birleşiyor.`,
          relatedIncidentId: input.crisisState.activeIncident?.id,
          options: buildCrisisThresholdOptions(),
          createdAtDay: day,
          expiresAtDay: day + 1,
          sourceTags: ['crisis', 'operation_signals'],
        }),
      });
    }
  }

  if (ctx.allowedTypes.includes('district_representative')) {
    if (districtPressure(input)) {
      const districtId =
        input.dailyOperationsPlan.districtFocusId ??
        input.operationSignals.priorityDistrictId;
      specs.push({
        type: 'district_representative',
        priority: 55,
        build: () => ({
          id: decisionId(day, 'district_representative'),
          day,
          type: 'district_representative',
          status: 'available',
          domain: 'districts',
          title: MICRO_DECISION_TYPE_LABELS.district_representative,
          summary: pickSummary(DISTRICT_REP_SUMMARIES, day + 3),
          reasonLine: 'Mahalle sinyali izleme veya baskı bandında.',
          districtId,
          options: buildDistrictRepOptions(),
          createdAtDay: day,
          expiresAtDay: day + 1,
          sourceTags: ['districts'],
        }),
      });
    }
  }

  if (ctx.allowedTypes.includes('operation_opportunity')) {
    const stableOverall =
      input.operationSignals.overall.status === 'stable' ||
      input.operationSignals.overall.status === 'watch';
    const planMatch = input.activeEvents.some(
      (e) =>
        e.neighborhoodId === input.dailyOperationsPlan.districtFocusId ||
        e.district === input.dailyOperationsPlan.districtFocusId,
    );
    const strongAssignments =
      (input.assignments.dailyAssignmentSummary?.confirmedCount ?? 0) >= 1;
    if (stableOverall && (planMatch || strongAssignments) && input.activeEvents.length > 0) {
      const evt = input.activeEvents[0];
      specs.push({
        type: 'operation_opportunity',
        priority: 40,
        build: () => ({
          id: decisionId(day, 'operation_opportunity'),
          day,
          type: 'operation_opportunity',
          status: 'available',
          domain: 'containers',
          title: MICRO_DECISION_TYPE_LABELS.operation_opportunity,
          summary: pickSummary(OPERATION_OPPORTUNITY_SUMMARIES, day + 4),
          reasonLine: 'Plan odağı ile uyumlu kısa operasyon penceresi.',
          relatedEventId: evt?.id,
          districtId: evt?.neighborhoodId,
          options: buildOpportunityOptions(),
          createdAtDay: day,
          expiresAtDay: day + 1,
          sourceTags: ['opportunity', 'plan'],
        }),
      });
    }
  }

  return specs
    .sort((a, b) => b.priority - a.priority)
    .map((s) => s.build())
    .filter((d): d is MicroDecision => d != null);
}

export function pickMicroDecisionsForDay(
  input: MicroDecisionEngineInput,
  candidates: MicroDecision[],
): MicroDecision[] {
  const ctx = buildMicroDecisionGenerationContext(input);
  if (candidates.length === 0 || ctx.maxDailyDecisions === 0) return [];

  const existingTypes = new Set(
    Object.values(input.microDecisionState.decisionsById)
      .filter((d) => d.createdAtDay === input.day)
      .map((d) => d.type),
  );

  const picked: MicroDecision[] = [];
  const usedTypes = new Set<MicroDecisionType>();

  for (const candidate of candidates) {
    if (picked.length >= ctx.maxDailyDecisions) break;
    if (usedTypes.has(candidate.type)) continue;
    if (existingTypes.has(candidate.type)) continue;
    if (!ctx.allowedTypes.includes(candidate.type)) continue;
    const existing = input.microDecisionState.decisionsById[candidate.id];
    if (existing) continue;
    picked.push(candidate);
    usedTypes.add(candidate.type);
  }

  return picked.slice(0, ctx.maxDailyDecisions);
}

export function refreshMicroDecisionsForDay(
  input: MicroDecisionEngineInput,
): MicroDecisionState {
  let state = expireOldMicroDecisions(input.microDecisionState, input.day);
  if (state.lastGeneratedDay === input.day) {
    return state;
  }
  const ctx = buildMicroDecisionGenerationContext(input);
  if (ctx.accessMode === 'inactive') {
    return { ...state, lastGeneratedDay: input.day };
  }
  if (hasReachedDailyMicroDecisionLimit(state, input.day, ctx.maxDailyDecisions)) {
    return { ...state, lastGeneratedDay: input.day };
  }

  const candidates = generateMicroDecisionCandidates(input);
  const picked = pickMicroDecisionsForDay(input, candidates);
  for (const decision of picked) {
    if (getActiveMicroDecisions(state).length >= ctx.maxDailyDecisions) break;
    state = addMicroDecision(state, decision);
  }
  return { ...state, lastGeneratedDay: input.day };
}

export function resolveMicroDecisionEffects(
  input: MicroDecisionEngineInput,
  decision: MicroDecision,
  option: MicroDecisionOption,
): MicroDecisionEffect[] {
  const isCrisis =
    decision.type === 'crisis_threshold' || option.effects.some((e) => e.domain === 'crisis');
  return scaleMicroEffects(option.effects, input, isCrisis);
}

export function applyMicroDecisionEffectsToOperationSignals(
  operationSignals: OperationSignalsState,
  effects: MicroDecisionEffect[],
): OperationSignalsState {
  if (effects.length === 0) return operationSignals;

  let personnelScore = operationSignals.personnel.score;
  let vehiclesScore = operationSignals.vehicles.score;
  let containersScore = operationSignals.containers.score;
  let districtsScore = operationSignals.districts.score;
  let overallScore = operationSignals.overall.score;
  const day = operationSignals.personnel.lastUpdatedDay;

  for (const e of effects) {
    switch (e.domain) {
      case 'personnel':
        personnelScore += e.delta;
        break;
      case 'vehicles':
        vehiclesScore += e.delta;
        break;
      case 'containers':
        containersScore += e.delta;
        break;
      case 'districts':
      case 'social':
        districtsScore += e.delta;
        break;
      case 'planning':
      case 'assignments':
      case 'season':
      case 'crisis':
        overallScore += e.delta;
        break;
      default:
        break;
    }
  }

  const tags = ['micro_decision'];
  const mk = (
    domain: 'personnel' | 'vehicles' | 'containers' | 'districts' | 'overall',
    score: number,
    prev: OperationSignalsState['personnel'],
  ) =>
    buildOperationSignal(
      domain,
      clampSignalScore(score),
      prev.score,
      day,
      prev.title,
      'Canlı operasyon kararı etkisi.',
      [...prev.sourceTags, ...tags],
    );

  return {
    ...operationSignals,
    personnel: mk('personnel', personnelScore, operationSignals.personnel),
    vehicles: mk('vehicles', vehiclesScore, operationSignals.vehicles),
    containers: mk('containers', containersScore, operationSignals.containers),
    districts: mk('districts', districtsScore, operationSignals.districts),
    overall: mk('overall', overallScore, operationSignals.overall),
  };
}

export function applyMicroDecisionEffectsToCrisisState(
  crisisState: CrisisState,
  effects: MicroDecisionEffect[],
): CrisisState {
  let score = crisisState.cityCrisisScore;
  for (const e of effects) {
    if (e.domain === 'crisis') {
      score += e.delta;
    }
  }
  const clamped = clampCrisisScore(score);
  return {
    ...crisisState,
    cityCrisisScore: clamped,
    riskLevel: getCrisisRiskLevel(clamped),
    previousCityCrisisScore: crisisState.cityCrisisScore,
  };
}

export function processMicroDecisionsEndOfDay(
  input: MicroDecisionEngineInput,
  closingDay: number,
): {
  microDecisionState: MicroDecisionState;
  operationSignals: OperationSignalsState;
  crisisState: CrisisState;
} {
  if (input.microDecisionState.lastProcessedDay === closingDay) {
    return {
      microDecisionState: input.microDecisionState,
      operationSignals: input.operationSignals,
      crisisState: input.crisisState,
    };
  }

  let state = expireOldMicroDecisions(input.microDecisionState, closingDay);
  let operationSignals = input.operationSignals;
  let crisisState = input.crisisState;

  for (const decision of Object.values(state.decisionsById)) {
    if (decision.status !== 'resolved' || decision.effectsApplied) continue;
    if (decision.resolvedAtDay !== closingDay) continue;
    const option = decision.options.find((o) => o.id === decision.selectedOptionId);
    if (!option) continue;
    const effects = resolveMicroDecisionEffects(input, decision, option);
    operationSignals = applyMicroDecisionEffectsToOperationSignals(
      operationSignals,
      effects,
    );
    crisisState = applyMicroDecisionEffectsToCrisisState(crisisState, effects);
    state = markMicroDecisionEffectsApplied(state, decision.id);
  }

  for (const decision of Object.values(state.decisionsById)) {
    if (decision.status === 'available' && decision.day === closingDay) {
      state = addMicroDecision(state, {
        ...decision,
        status: 'expired',
      });
    }
  }

  const summary = buildMicroDecisionDailySummary(state, closingDay);
  summary.reportLines = buildMicroDecisionReportLines(input, summary);

  state = {
    ...state,
    dailySummary: summary,
    lastProcessedDay: closingDay,
  };
  state = pruneMicroDecisionHistory(state, closingDay);

  return { microDecisionState: state, operationSignals, crisisState };
}

export function buildMicroDecisionReportLines(
  input: MicroDecisionEngineInput,
  summary: import('./microDecisionTypes').MicroDecisionDailySummary,
): string[] {
  const lines: string[] = [];
  const day = summary.day;
  for (const decision of Object.values(input.microDecisionState.decisionsById)) {
    if (decision.day !== day || decision.status !== 'resolved') continue;
    const option = decision.options.find((o) => o.id === decision.selectedOptionId);
    if (!option) continue;
    switch (decision.type) {
      case 'advisor_warning':
        if (option.id === 'keep_plan' || option.id === 'monitor') {
          lines.push(getCarryOverRiskLine(option.id === 'keep_plan' ? 'plan_keep' : 'monitor'));
        } else {
          lines.push(
            `Ece uyarısı sonrası ${option.label.toLowerCase()} seçildi; saha etkisi belirginleşti.`,
          );
        }
        break;
      case 'field_update':
        lines.push(
          `Saha bildirimi ${option.label.toLowerCase()} ile yanıtlandı; araç riski güncellendi.`,
        );
        break;
      case 'crisis_threshold':
        if (option.id === 'crisis_coord') {
          lines.push(BALANCE_COPY.crisisPreventiveReduced);
        } else if (option.id === 'monitor') {
          lines.push(BALANCE_COPY.crisisMonitorCarry);
        } else {
          lines.push(
            `Kriz eşiği kartında ${option.label.toLowerCase()} seçildi; şehir baskısı güncellendi.`,
          );
        }
        break;
      case 'district_representative':
        lines.push(
          `Mahalle temsilcisi geri bildirimi için ${option.label.toLowerCase()} uygulandı.`,
        );
        break;
      case 'operation_opportunity':
        lines.push(`Operasyon fırsatı ${option.label.toLowerCase()} ile değerlendirildi.`);
        break;
      default:
        break;
    }
    if (lines.length >= 3) break;
  }
  return lines.slice(0, 3);
}

export function getMicroDecisionAdvisorLine(
  input: MicroDecisionEngineInput,
  decision: MicroDecision,
): string {
  const level = input.advisorState.level;
  if (level === 1) {
    return 'Bu sinyal tam net değil ama planı korumak riski yarına taşıyabilir.';
  }
  if (level === 2) {
    if (decision.type === 'crisis_threshold') {
      return 'Bu uyarı araç ve konteyner sinyalinin birlikte yükselmesinden geliyor.';
    }
    return 'Ece bu kararı operasyon analizinde izliyor; küçük bir sapma olabilir.';
  }
  if (decision.type === 'crisis_threshold') {
    return 'Önleyici hamle kriz riskini düşürür, fakat bugünkü operasyon kapasitesini daraltır.';
  }
  return 'Ece bu sinyali günlük plan bağlamında değerlendirdi.';
}

export function buildMicroDecisionEngineInputFromStore(
  store: Pick<
    MicroDecisionEngineInput,
    | 'day'
    | 'gameState'
    | 'monetization'
    | 'operationSignals'
    | 'crisisState'
    | 'dailyOperationsPlan'
    | 'assignments'
    | 'mainOperationSeason'
    | 'advisorState'
    | 'microDecisionState'
  > & { activeEvents?: EventCard[] },
): MicroDecisionEngineInput {
  const activeEvents =
    store.activeEvents ?? store.gameState.events;
  return {
    day: store.day,
    gameState: store.gameState,
    monetization: store.monetization,
    operationSignals: store.operationSignals,
    crisisState: store.crisisState,
    dailyOperationsPlan: store.dailyOperationsPlan,
    assignments: store.assignments,
    mainOperationSeason: store.mainOperationSeason,
    advisorState: store.advisorState,
    microDecisionState: store.microDecisionState,
    activeEvents,
  };
}

export function createDevFallbackMicroDecision(day: number): MicroDecision {
  return {
    id: decisionId(day, 'field_update'),
    day,
    type: 'field_update',
    status: 'available',
    domain: 'assignments',
    title: MICRO_DECISION_TYPE_LABELS.field_update,
    summary: FIELD_UPDATE_SUMMARIES[0],
    reasonLine: 'Dev: test canlı operasyon kartı.',
    options: buildFieldUpdateOptions(),
    createdAtDay: day,
    expiresAtDay: day + 1,
    sourceTags: ['dev'],
  };
}
