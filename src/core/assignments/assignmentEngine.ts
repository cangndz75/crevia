import type { EventCard } from '@/core/models/EventCard';
import {
  buildOperationSignal,
  clampSignalScore,
} from '@/core/operations/operationSignalState';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';

import { BALANCE_COPY } from '@/core/balance/gameplayImpactConstants';
import { scaleGameplayDelta } from '@/core/balance/gameplayImpactTuning';
import type { GameplayImpactScaleContext } from '@/core/balance/gameplayImpactTypes';

import {
  ASSIGNMENT_CATEGORY_TAGS,
  ASSIGNMENT_COPY,
  COMPATIBILITY_THRESHOLDS,
  DEFAULT_ASSIGNMENT_BY_CATEGORY,
  PERSONNEL_ASSIGNMENT_OPTIONS,
  RESPONSE_APPROACH_OPTIONS,
  VEHICLE_ASSIGNMENT_OPTIONS,
} from './assignmentConstants';
import {
  buildDailyAssignmentSummary,
  markEventAssignmentProcessed,
} from './assignmentState';
import type {
  AssignmentCompatibilityResult,
  AssignmentEffect,
  AssignmentEffectDomain,
  AssignmentEngineInput,
  AssignmentImpactPreview,
  AssignmentsState,
  CompatibilityLabel,
  EventAssignmentState,
  PersonnelAssignmentType,
  ResponseApproachType,
  VehicleAssignmentType,
} from './assignmentTypes';

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 50;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export type EventAssignmentCategory =
  | 'container'
  | 'social'
  | 'vehicle'
  | 'personnel'
  | 'crisis'
  | 'default';

function buildAssignmentScaleContext(
  input: AssignmentEngineInput,
): GameplayImpactScaleContext {
  return {
    gameState: input.gameState,
    isDay1Tutorial: input.isDay1Tutorial,
    postPilotLightPhase: input.postPilotLightPhase,
  };
}

function pushEffect(
  effects: AssignmentEffect[],
  domain: AssignmentEffectDomain,
  delta: number,
  reason: string,
  input: AssignmentEngineInput,
  tags: string[] = ['assignment'],
): void {
  const scaled = scaleGameplayDelta(delta, buildAssignmentScaleContext(input));
  if (scaled === 0) return;
  effects.push({
    domain,
    delta: scaled,
    reason,
    sourceTags: [...tags, 'assignment'],
  });
}

function applyCompatibilityModifiers(
  effects: AssignmentEffect[],
  compatibilityScore: number,
  input: AssignmentEngineInput,
): AssignmentEffect[] {
  if (compatibilityScore >= 75) {
    const boosted = effects.map((e) => {
      if (e.delta >= 0) return e;
      const boostedDelta = scaleGameplayDelta(
        Math.round(e.delta * 1.2),
        buildAssignmentScaleContext(input),
      );
      return { ...e, delta: boostedDelta, reason: e.reason };
    });
    boosted.push({
      domain: 'overall',
      delta: scaleGameplayDelta(-3, buildAssignmentScaleContext(input)),
      reason: BALANCE_COPY.strongFitReport,
      sourceTags: ['assignment', 'strong_fit'],
    });
    return boosted;
  }
  if (compatibilityScore < 45) {
    const related =
      effects.find((e) => e.domain !== 'overall')?.domain ?? 'overall';
    return [
      ...effects,
      {
        domain: related,
        delta: scaleGameplayDelta(5, buildAssignmentScaleContext(input)),
        reason: BALANCE_COPY.weakFitReport,
        sourceTags: ['assignment', 'weak_fit', 'carry_over'],
      },
    ];
  }
  return effects;
}

export function getEventCategoryForAssignment(event: EventCard): EventAssignmentCategory {
  const c = event.category.toLowerCase();
  if (ASSIGNMENT_CATEGORY_TAGS.container.some((t) => c.includes(t))) {
    return 'container';
  }
  if (ASSIGNMENT_CATEGORY_TAGS.social.some((t) => c.includes(t))) {
    return 'social';
  }
  if (ASSIGNMENT_CATEGORY_TAGS.vehicle.some((t) => c.includes(t))) {
    return 'vehicle';
  }
  if (ASSIGNMENT_CATEGORY_TAGS.personnel.some((t) => c.includes(t))) {
    return 'personnel';
  }
  if (
    event.riskLevel === 'critical' ||
    event.riskLevel === 'high' ||
    ASSIGNMENT_CATEGORY_TAGS.crisis.some((t) => c.includes(t))
  ) {
    return 'crisis';
  }
  return 'default';
}

export function resolveEventDistrictId(
  event: Pick<EventCard, 'districtIds' | 'district'>,
): string | undefined {
  if (event.districtIds?.[0]) return event.districtIds[0];
  const name = event.district.toLowerCase();
  if (name.includes('cumhuriyet')) return 'cumhuriyet';
  if (name.includes('sanayi') || name.includes('endüstriyel')) return 'sanayi';
  if (name.includes('merkez') || name.includes('central')) return 'merkez';
  if (name.includes('istasyon')) return 'istasyon';
  if (name.includes('yeşil') || name.includes('yesil')) return 'yesilvadi';
  return undefined;
}

function districtMatchesPlan(
  event: EventCard,
  planDistrictId?: string,
): boolean {
  if (!planDistrictId) return false;
  const eventDistrict = resolveEventDistrictId(event);
  if (eventDistrict === planDistrictId) return true;
  return event.district.toLowerCase().includes(planDistrictId);
}

export function getCompatibilityLabel(score: number): CompatibilityLabel {
  const s = clampScore(score);
  if (s <= COMPATIBILITY_THRESHOLDS.weakMax) return 'Zayıf uyum';
  if (s <= COMPATIBILITY_THRESHOLDS.balancedMax) return 'Dengeli uyum';
  return 'Güçlü uyum';
}

export function buildDefaultAssignmentForEvent(
  input: AssignmentEngineInput,
  event: EventCard,
): EventAssignmentState {
  const day = input.gameState.city.day;
  const category = getEventCategoryForAssignment(event);
  const defaults =
    DEFAULT_ASSIGNMENT_BY_CATEGORY[category] ??
    DEFAULT_ASSIGNMENT_BY_CATEGORY.default;

  let personnel = defaults.personnel;
  let vehicle = defaults.vehicle;
  let approach = defaults.approach;

  if (category === 'container') {
    vehicle =
      event.riskLevel === 'high' || event.riskLevel === 'critical'
        ? 'high_capacity_vehicle'
        : 'maintenance_vehicle';
  }

  const draft: EventAssignmentState = {
    eventId: event.id,
    day,
    status: input.isDay1Tutorial ? 'confirmed' : 'draft',
    source: 'advisor_suggested',
    personnelType: personnel,
    vehicleType: vehicle,
    approachType: approach,
    compatibilityScore: 50,
    compatibilityLabel: 'Dengeli uyum',
    effects: [],
    confirmedAtDay: input.isDay1Tutorial ? day : undefined,
  };

  const compat = calculateAssignmentCompatibility(input, event, draft);
  return {
    ...draft,
    compatibilityScore: compat.score,
    compatibilityLabel: compat.label,
    effects: compat.effects,
    advisorNote: getAssignmentAdvisorComment(input, event, {
      ...draft,
      compatibilityScore: compat.score,
      compatibilityLabel: compat.label,
    }),
  };
}

export function calculateAssignmentCompatibility(
  input: AssignmentEngineInput,
  event: EventCard,
  assignment: Pick<
    EventAssignmentState,
    'personnelType' | 'vehicleType' | 'approachType'
  >,
): AssignmentCompatibilityResult {
  const category = getEventCategoryForAssignment(event);
  let score = 50;
  const warnings: string[] = [];
  const strengths: string[] = [];

  const { personnelType, vehicleType, approachType } = assignment;
  const signals = input.operationSignals;
  const plan = input.dailyOperationsPlan;

  if (category === 'container') {
    if (personnelType === 'technical_team') score += 15;
    if (vehicleType === 'maintenance_vehicle') score += 15;
    if (vehicleType === 'high_capacity_vehicle') score += 10;
    if (approachType === 'lasting_fix') score += 10;
    if (approachType === 'public_first') score += 5;
    if (personnelType === 'public_relations_team' && approachType !== 'public_first') {
      score -= 5;
    }
  }

  if (category === 'social') {
    if (personnelType === 'public_relations_team') score += 20;
    if (vehicleType === 'compact_service_vehicle') score += 5;
    if (approachType === 'public_first') score += 15;
    if (personnelType === 'technical_team' && approachType !== 'balanced_response') {
      score -= 5;
    }
  }

  if (category === 'vehicle') {
    if (personnelType === 'technical_team') score += 10;
    if (vehicleType === 'route_support_vehicle') score += 20;
    if (approachType === 'lasting_fix') score += 10;
    if (approachType === 'balanced_response') score += 5;
  }

  if (category === 'personnel') {
    if (personnelType === 'balanced_team') score += 10;
    if (personnelType === 'field_response_team') score += 10;
    if (personnelType === 'inspection_team') score += 10;
  }

  if (event.riskLevel === 'high' || event.riskLevel === 'critical') {
    if (personnelType === 'field_response_team') score += 10;
    if (approachType === 'rapid_response') score += 10;
    if (approachType === 'balanced_response') score += 5;
    if (approachType === 'low_resource') {
      score -= 15;
      warnings.push(
        'Düşük kaynak seçimi yüksek riskli olayda tekrar baskısı artırabilir.',
      );
    }
  }

  if (plan) {
    if (plan.personnelFocus === 'rapid_response') {
      if (
        approachType === 'rapid_response' ||
        personnelType === 'field_response_team'
      ) {
        score += 8;
      }
    }
    if (plan.personnelFocus === 'rest_rotation') {
      if (approachType === 'rapid_response') score -= 8;
      if (personnelType === 'balanced_team') score += 4;
    }
    if (plan.personnelFocus === 'field_inspection') {
      if (personnelType === 'inspection_team') score += 8;
    }
    if (plan.vehicleFocus === 'preventive_maintenance') {
      if (vehicleType === 'high_capacity_vehicle') score -= 6;
      if (vehicleType === 'maintenance_vehicle') score += 6;
    }
    if (plan.vehicleFocus === 'high_capacity') {
      if (vehicleType === 'high_capacity_vehicle') score += 10;
    }
    if (plan.vehicleFocus === 'route_check') {
      if (vehicleType === 'route_support_vehicle') score += 10;
    }
    if (
      plan.containerFocus === 'intensive_collection' &&
      category === 'container'
    ) {
      score += 8;
    }
    if (plan.containerFocus === 'cleanliness_maintenance') {
      if (approachType === 'public_first') score += 8;
      if (vehicleType === 'maintenance_vehicle') score += 8;
    }
    if (districtMatchesPlan(event, plan.districtFocusId)) {
      score += 8;
      strengths.push('Günlük planla güçlü uyum var.');
    }
  }

  if (signals) {
    if (
      (signals.vehicles.status === 'strained' ||
        signals.vehicles.status === 'critical') &&
      vehicleType === 'high_capacity_vehicle'
    ) {
      warnings.push('Filo baskısı yüksekken kapasite aracı ek yük getirebilir.');
      score -= 6;
    }
    if (
      (signals.personnel.status === 'strained' ||
        signals.personnel.status === 'critical') &&
      approachType === 'rapid_response'
    ) {
      warnings.push('Personel baskısı yüksekken hızlı müdahale yorgunluğu artırabilir.');
      score -= 6;
    }
    if (
      (signals.containers.status === 'strained' ||
        signals.containers.status === 'critical') &&
      category === 'container' &&
      (personnelType === 'technical_team' || vehicleType === 'maintenance_vehicle')
    ) {
      score += 6;
      strengths.push('Konteyner sinyali teknik atamayla uyumlu.');
    }
    if (
      (signals.districts.status === 'strained' ||
        signals.districts.status === 'critical') &&
      districtMatchesPlan(event, signals.priorityDistrictId)
    ) {
      if (approachType === 'public_first' || personnelType === 'inspection_team') {
        score += 6;
      }
    }
  }

  score = clampScore(score);
  const label = getCompatibilityLabel(score);

  if (label === 'Güçlü uyum') {
    strengths.push('Teknik ekip bu olayla uyumlu.');
  } else if (label === 'Zayıf uyum') {
    warnings.push('Atama bu olayın ana ihtiyacıyla tam uyumlu değil.');
  }

  const effects = calculateAssignmentEffects(
    input,
    event,
    {
      ...assignment,
      eventId: event.id,
      day: input.gameState.city.day,
      status: 'draft',
      source: 'advisor_suggested',
      compatibilityScore: score,
      compatibilityLabel: label,
      effects: [],
    } as EventAssignmentState,
  );

  const summary =
    strengths[0] ??
    warnings[0] ??
    'Operasyon ataması dengeli görünüyor.';

  return { score, label, summary, warnings, strengths, effects };
}

export function calculateAssignmentEffects(
  input: AssignmentEngineInput,
  event: EventCard,
  assignment: EventAssignmentState,
): AssignmentEffect[] {
  const effects: AssignmentEffect[] = [];
  const category = getEventCategoryForAssignment(event);
  const related: AssignmentEffectDomain =
    category === 'container'
      ? 'containers'
      : category === 'social'
        ? 'districts'
        : category === 'vehicle'
          ? 'vehicles'
          : 'overall';

  if (
    assignment.personnelType === 'technical_team' &&
    assignment.vehicleType === 'maintenance_vehicle' &&
    category === 'container'
  ) {
    pushEffect(effects, 'containers', -8, 'Teknik ekip ve bakım aracı konteyner etkisini güçlendirdi', input);
    pushEffect(effects, 'vehicles', 2, 'Bakım aracı filo üzerinde hafif yük', input);
    pushEffect(effects, 'overall', -3, 'Genel konteyner riski azaldı', input);
  }

  if (
    assignment.personnelType === 'public_relations_team' &&
    assignment.approachType === 'public_first' &&
    category === 'social'
  ) {
    pushEffect(effects, 'districts', -8, 'Halk odaklı atama sosyal tepkiyi yumuşattı', input);
    pushEffect(effects, 'personnel', 2, 'İletişim ekibi ek koordinasyon yükü', input);
    pushEffect(effects, 'overall', -3, 'Genel mahalle gerilimi azaldı', input);
  }

  if (
    assignment.vehicleType === 'high_capacity_vehicle' &&
    assignment.approachType === 'rapid_response'
  ) {
    pushEffect(effects, related, -7, 'Hızlı kapasite müdahalesi bugünkü baskıyı düşürdü', input);
    pushEffect(effects, 'vehicles', 6, 'Filo kapasitesi zorlandı', input);
    pushEffect(effects, 'personnel', 4, 'Saha ekibi yorgunluk riski taşıdı', input);
  }

  if (assignment.approachType === 'low_resource') {
    pushEffect(effects, 'overall', -1, BALANCE_COPY.lowResourceReport, input);
    pushEffect(effects, related, 4, 'Sorun yarına taşınabilir', input);
  }

  if (assignment.approachType === 'lasting_fix') {
    pushEffect(effects, related, -6, 'Kalıcı çözüm yarınki riski azalttı', input);
    pushEffect(effects, 'overall', -3, 'Genel operasyon dengesi iyileşti', input);
    pushEffect(effects, 'personnel', 2, 'Kalıcı çözüm bugünkü hızı sınırladı', input);
  }

  if (assignment.approachType === 'balanced_response') {
    pushEffect(effects, 'overall', -2, 'Dengeli müdahale genel riski hafifletti', input);
    pushEffect(effects, related, -3, 'Olay alanında dengeli etki', input);
  }

  if (assignment.personnelType === 'field_response_team') {
    pushEffect(effects, 'personnel', 3, 'Saha müdahale ekibi personel yükünü artırdı', input);
    pushEffect(effects, related, -3, 'Acil müdahale hızlandı', input);
  }

  if (assignment.vehicleType === 'route_support_vehicle') {
    pushEffect(effects, 'vehicles', -5, 'Rota desteği filo gecikmesini azalttı', input);
    pushEffect(effects, 'districts', -5, 'Mahalle rotaları dengelendi', input);
    pushEffect(effects, 'personnel', 1, 'Rota desteği ek koordinasyon istedi', input);
  }

  if (effects.length === 0) {
    pushEffect(effects, related, -2, 'Seçilen atama operasyon sinyalini hafifletti', input);
  }

  const score =
    typeof assignment.compatibilityScore === 'number'
      ? assignment.compatibilityScore
      : 50;
  return applyCompatibilityModifiers(effects, score, input);
}

export function buildAssignmentImpactPreview(
  input: AssignmentEngineInput,
  event: EventCard,
  assignment: EventAssignmentState,
): AssignmentImpactPreview {
  const compat = calculateAssignmentCompatibility(input, event, assignment);
  let tone: AssignmentImpactPreview['tone'] = 'neutral';
  if (compat.label === 'Güçlü uyum') tone = 'positive';
  if (compat.label === 'Zayıf uyum') tone = 'warning';

  let summary = compat.summary;
  if (compat.label === 'Güçlü uyum') {
    summary = BALANCE_COPY.strongFitReport;
  } else if (compat.label === 'Zayıf uyum') {
    summary = `${BALANCE_COPY.weakFitReport} ${BALANCE_COPY.carryOverMonitor}`;
  }
  if (assignment.approachType === 'low_resource') {
    summary = BALANCE_COPY.lowResourceReport;
    tone = 'warning';
  }
  if (compat.strengths.some((s) => s.includes('Günlük plan'))) {
    summary = 'Günlük planla güçlü uyum var.';
    tone = 'positive';
  }

  return {
    title: ASSIGNMENT_COPY.impactPreviewTitle,
    summary,
    compatibilityLabel: compat.label,
    effects: compat.effects,
    tone,
  };
}

export function applyAssignmentEffectsToOperationSignals(
  signals: OperationSignalsState,
  effects: AssignmentEffect[],
): OperationSignalsState {
  if (effects.length === 0) return signals;

  let personnelScore = signals.personnel.score;
  let vehiclesScore = signals.vehicles.score;
  let containersScore = signals.containers.score;
  let districtsScore = signals.districts.score;
  let overallScore = signals.overall.score;
  const day = signals.personnel.lastUpdatedDay;

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
        districtsScore += e.delta;
        break;
      case 'overall':
        overallScore += e.delta;
        break;
      default:
        break;
    }
  }

  const tags = ['assignment'];
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
      prev.summary,
      [...new Set([...prev.sourceTags, ...tags])],
    );

  return {
    ...signals,
    personnel: mk('personnel', personnelScore, signals.personnel),
    vehicles: mk('vehicles', vehiclesScore, signals.vehicles),
    containers: mk('containers', containersScore, signals.containers),
    districts: mk('districts', districtsScore, signals.districts),
    overall: mk('overall', overallScore, signals.overall),
  };
}

export function processAssignmentsEndOfDay(input: {
  assignments: AssignmentsState;
  closingDay: number;
  engineInput: AssignmentEngineInput;
  events: EventCard[];
}): { state: AssignmentsState; effects: AssignmentEffect[] } {
  const { closingDay, engineInput, events } = input;
  if (input.assignments.lastProcessedDay === closingDay) {
    return { state: input.assignments, effects: [] };
  }

  const merged: AssignmentEffect[] = [];
  let state = { ...input.assignments };

  for (const event of events) {
    const assignment = state.assignmentsByEventId[event.id];
    if (!assignment) continue;
    if (assignment.day !== closingDay) continue;
    if (assignment.processedAtDay === closingDay) continue;
    if (
      assignment.status !== 'dispatched' &&
      assignment.status !== 'confirmed'
    ) {
      continue;
    }

    const effects = calculateAssignmentEffects(engineInput, event, assignment);
    state = markEventAssignmentProcessed(state, event.id, closingDay, effects);
    merged.push(...effects);
  }

  state = buildDailyAssignmentSummary(state, closingDay);
  return {
    state: { ...state, lastProcessedDay: closingDay },
    effects: mergeEffectsByDomain(merged),
  };
}

function mergeEffectsByDomain(effects: AssignmentEffect[]): AssignmentEffect[] {
  const map = new Map<AssignmentEffectDomain, AssignmentEffect>();
  for (const e of effects) {
    const prev = map.get(e.domain);
    if (prev) {
      map.set(e.domain, {
        ...prev,
        delta: prev.delta + e.delta,
        reason: prev.reason,
      });
    } else {
      map.set(e.domain, { ...e });
    }
  }
  return [...map.values()];
}

export function isAssignmentStrongFit(
  _input: AssignmentEngineInput,
  _event: EventCard,
  assignment: EventAssignmentState,
): boolean {
  return assignment.compatibilityLabel === 'Güçlü uyum';
}

export function isAssignmentWeakFit(
  _input: AssignmentEngineInput,
  _event: EventCard,
  assignment: EventAssignmentState,
): boolean {
  return assignment.compatibilityLabel === 'Zayıf uyum';
}

export function getAssignmentAdvisorComment(
  input: AssignmentEngineInput,
  event: EventCard,
  assignment: EventAssignmentState,
): string {
  const level = input.advisorState?.level ?? 1;
  const band = input.advisorState?.reliabilityBand ?? 'early_observation';
  const personnel = PERSONNEL_ASSIGNMENT_OPTIONS[assignment.personnelType].label;
  const vehicle = VEHICLE_ASSIGNMENT_OPTIONS[assignment.vehicleType].label;

  if (level === 1 || band === 'early_observation') {
    if (assignment.approachType === 'low_resource') {
      return BALANCE_COPY.eceLevel1Cautious;
    }
    if (assignment.compatibilityLabel === 'Güçlü uyum') {
      return 'Bu atama genel olarak uygun görünüyor. Araç tarafını izlemek iyi olur.';
    }
    return 'Teknik taraf önemli olabilir, ama sinyal tam net değil.';
  }

  if (assignment.compatibilityLabel === 'Zayıf uyum') {
    return `${BALANCE_COPY.weakFitReport} ${BALANCE_COPY.carryOverMonitor}`;
  }

  if (assignment.approachType === 'low_resource' && level >= 2) {
    return BALANCE_COPY.eceLevel2LowResource;
  }

  if (level >= 3) {
    return `${personnel} + ${vehicle} bu olayda ${assignment.compatibilityLabel.toLowerCase()} sağlar; gün sonunda filo ve personel sinyalini kontrol etmek gerekir.`;
  }

  if (
    assignment.personnelType === 'technical_team' &&
    assignment.vehicleType === 'maintenance_vehicle'
  ) {
    return 'Teknik Ekip + Bakım Aracı bu konteyner olayıyla uyumlu.';
  }

  if (assignment.approachType === 'rapid_response') {
    return 'Hızlı müdahale seçimi personel baskısını artırabilir.';
  }

  if (assignment.approachType === 'public_first') {
    return 'Halk odaklı yaklaşım sosyal tepkiyi azaltabilir.';
  }

  return `${personnel} ve ${vehicle} bugünkü operasyon için dengeli bir atama.`;
}
