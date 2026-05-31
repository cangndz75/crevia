import { scaleGameplayDelta } from '@/core/balance/gameplayImpactTuning';
import type { GameplayImpactScaleContext } from '@/core/balance/gameplayImpactTypes';
import type {
  PersonnelAssignmentType,
  ResponseApproachType,
  VehicleAssignmentType,
} from '@/core/assignments/assignmentTypes';
import { getSelectedCrisisActionForDay } from '@/core/crisisActions/crisisActionState';
import type { CrisisActionType } from '@/core/crisisActions/crisisActionTypes';
import { isFullMainOperationAccess } from '@/core/monetization/monetizationEngine';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { resolveFirstTenMinutesDay } from '@/core/onboarding/firstTenMinutesPresentation';

import {
  CONTAINER_NETWORK_DISTRICT_LABELS,
  PERSONNEL_GROUP_DEFINITIONS,
} from './operationalResourceConstants';
import {
  clampResourceScore,
  createInitialOperationalResourcesState,
  markOperationalResourcesProcessed,
  normalizeOperationalResourcesState,
  recomputeGroupSummaries,
  refreshOperationalResourcesForDay,
} from './operationalResourceState';
import type {
  OperationalResourceEffect,
  OperationalResourceEngineInput,
  OperationalResourcesDailySummary,
  OperationalResourcesState,
  PersonnelGroupId,
  VehicleGroupId,
} from './operationalResourceTypes';

function buildScaleContext(input: OperationalResourceEngineInput): GameplayImpactScaleContext {
  const day = resolveFirstTenMinutesDay(input.gameState);
  return {
    gameState: input.gameState,
    monetization: input.monetization,
    isDay1Tutorial: day <= 1,
    postPilotLightPhase: input.monetization
      ? !isFullMainOperationAccess(input.gameState, input.monetization)
      : true,
    isCrisisRelated: false,
    crisisRiskElevated: false,
  };
}

function scaleDelta(delta: number, input: OperationalResourceEngineInput): number {
  return scaleGameplayDelta(delta, buildScaleContext(input));
}

function dayScaleMultiplier(input: OperationalResourceEngineInput): number {
  const day = resolveFirstTenMinutesDay(input.gameState);
  if (day <= 1) return 0.45;
  if (day === 2) return 0.7;
  if (day === 3) return 0.85;
  const pilot = input.gameState.pilot.status === 'active';
  if (pilot) return 0.75;
  if (input.monetization && !isFullMainOperationAccess(input.gameState, input.monetization)) {
    return 0.9;
  }
  return 1;
}

function pushPersonnelEffect(
  effects: OperationalResourceEffect[],
  groupId: PersonnelGroupId,
  metric: 'workload' | 'fatigue' | 'morale',
  delta: number,
  reason: string,
  tags: string[],
  input: OperationalResourceEngineInput,
): void {
  const scaled = Math.round(scaleDelta(delta, input) * dayScaleMultiplier(input));
  if (scaled === 0) return;
  effects.push({
    domain: 'personnel',
    targetId: groupId,
    delta: scaled,
    metric,
    reason,
    sourceTags: tags,
  });
}

function pushVehicleEffect(
  effects: OperationalResourceEffect[],
  groupId: VehicleGroupId,
  metric: 'capacity' | 'maintenance' | 'route',
  delta: number,
  reason: string,
  tags: string[],
  input: OperationalResourceEngineInput,
): void {
  const scaled = Math.round(scaleDelta(delta, input) * dayScaleMultiplier(input));
  if (scaled === 0) return;
  effects.push({
    domain: 'vehicles',
    targetId: groupId,
    delta: scaled,
    metric,
    reason,
    sourceTags: tags,
  });
}

function pushContainerEffect(
  effects: OperationalResourceEffect[],
  districtId: string,
  metric: OperationalResourceEffect['metric'],
  delta: number,
  reason: string,
  tags: string[],
  input: OperationalResourceEngineInput,
): void {
  const scaled = Math.round(scaleDelta(delta, input) * dayScaleMultiplier(input));
  if (scaled === 0) return;
  effects.push({
    domain: 'containers',
    targetId: districtId,
    delta: scaled,
    metric,
    reason,
    sourceTags: tags,
  });
}

function planDistrictId(input: OperationalResourceEngineInput): string {
  return (
    input.dailyOperationsPlan.districtFocusId ||
    input.operationSignals.priorityDistrictId ||
    'merkez'
  );
}

export function buildOperationalResourceEffectsFromDailyPlan(
  input: OperationalResourceEngineInput,
): OperationalResourceEffect[] {
  if (input.dailyOperationsPlan.status !== 'confirmed' &&
      input.dailyOperationsPlan.status !== 'processed') {
    return [];
  }
  const effects: OperationalResourceEffect[] = [];
  const district = planDistrictId(input);
  const pf = input.dailyOperationsPlan.personnelFocus;
  const vf = input.dailyOperationsPlan.vehicleFocus;
  const cf = input.dailyOperationsPlan.containerFocus;

  switch (pf) {
    case 'rapid_response':
      pushPersonnelEffect(effects, 'field_team', 'workload', 5, 'Hızlı müdahale planı', ['daily_plan'], input);
      pushPersonnelEffect(effects, 'field_team', 'fatigue', 4, 'Hızlı müdahale planı', ['daily_plan'], input);
      break;
    case 'rest_rotation':
      pushPersonnelEffect(effects, 'field_team', 'fatigue', -8, 'Dinlenme rotasyonu', ['daily_plan'], input);
      pushPersonnelEffect(effects, 'technical_team', 'workload', -2, 'Dinlenme rotasyonu', ['daily_plan'], input);
      break;
    case 'field_inspection':
      pushPersonnelEffect(effects, 'field_team', 'workload', 3, 'Saha denetimi', ['daily_plan'], input);
      pushPersonnelEffect(effects, 'public_relations_team', 'workload', 2, 'Saha denetimi', ['daily_plan'], input);
      break;
    default:
      break;
  }

  switch (vf) {
    case 'preventive_maintenance':
      pushVehicleEffect(effects, 'maintenance_vehicle', 'maintenance', -8, 'Önleyici bakım', ['daily_plan'], input);
      pushPersonnelEffect(effects, 'technical_team', 'workload', 4, 'Önleyici bakım', ['daily_plan'], input);
      break;
    case 'high_capacity':
      pushVehicleEffect(effects, 'standard_truck', 'capacity', 7, 'Yüksek kapasite', ['daily_plan'], input);
      pushVehicleEffect(effects, 'maintenance_vehicle', 'maintenance', 3, 'Yüksek kapasite', ['daily_plan'], input);
      break;
    case 'route_check':
      pushVehicleEffect(effects, 'route_support_vehicle', 'route', -6, 'Rota kontrolü', ['daily_plan'], input);
      break;
    default:
      break;
  }

  switch (cf) {
    case 'intensive_collection':
      pushVehicleEffect(effects, 'standard_truck', 'capacity', 6, 'Yoğun toplama', ['daily_plan'], input);
      pushContainerEffect(effects, district, 'fill_pressure', -7, 'Yoğun toplama', ['daily_plan'], input);
      break;
    case 'cleanliness_maintenance':
      pushContainerEffect(effects, district, 'cleanliness_pressure', -6, 'Temizlik bakımı', ['daily_plan'], input);
      pushContainerEffect(effects, district, 'social_pressure', -4, 'Temizlik bakımı', ['daily_plan'], input);
      break;
    default:
      break;
  }

  return effects;
}

function mapPersonnelAssignment(type: PersonnelAssignmentType): PersonnelGroupId | null {
  switch (type) {
    case 'field_response_team':
      return 'field_team';
    case 'technical_team':
      return 'technical_team';
    case 'public_relations_team':
      return 'public_relations_team';
    case 'inspection_team':
      return 'field_team';
    case 'balanced_team':
      return null;
    default:
      return null;
  }
}

function mapVehicleAssignment(type: VehicleAssignmentType): VehicleGroupId | null {
  switch (type) {
    case 'standard_truck':
    case 'high_capacity_vehicle':
      return 'standard_truck';
    case 'maintenance_vehicle':
      return 'maintenance_vehicle';
    case 'route_support_vehicle':
    case 'compact_service_vehicle':
      return 'route_support_vehicle';
    default:
      return null;
  }
}

function assignmentPressureScale(input: OperationalResourceEngineInput): number {
  const signals = input.operationSignals;
  const criticalResourceGroups = input.operationalResources
    ? countCriticalOperationalGroups(input.operationalResources)
    : 0;
  let scale = 1;
  if (criticalResourceGroups >= 2) {
    scale *= 0.75;
  } else if (criticalResourceGroups >= 1) {
    scale *= 0.88;
  }
  if (
    signals.personnel.status === 'critical' ||
    signals.vehicles.status === 'critical' ||
    signals.containers.status === 'critical'
  ) {
    return scale * 0.82;
  }
  if (
    signals.personnel.status === 'strained' ||
    signals.vehicles.status === 'strained' ||
    signals.containers.status === 'strained'
  ) {
    return scale * 0.9;
  }
  return scale;
}

export function buildOperationalResourceEffectsFromAssignment(
  input: OperationalResourceEngineInput,
): OperationalResourceEffect[] {
  const effects: OperationalResourceEffect[] = [];
  const pressureScale = assignmentPressureScale(input);
  for (const assignment of Object.values(input.assignments.assignmentsByEventId)) {
    if (assignment.status !== 'confirmed' && assignment.status !== 'processed') continue;
    const district = planDistrictId(input);
    const personnel = mapPersonnelAssignment(assignment.personnelType);
    const vehicle = mapVehicleAssignment(assignment.vehicleType);

    if (personnel) {
      pushPersonnelEffect(effects, personnel, 'workload', 4, 'Atama kullanımı', ['assignment'], input);
      if (assignment.personnelType === 'inspection_team') {
        pushPersonnelEffect(effects, 'public_relations_team', 'workload', 2, 'Denetim ataması', ['assignment'], input);
      }
    } else if (assignment.personnelType === 'balanced_team') {
      pushPersonnelEffect(effects, 'field_team', 'workload', 2, 'Dengeli atama', ['assignment'], input);
      pushPersonnelEffect(effects, 'technical_team', 'workload', 1, 'Dengeli atama', ['assignment'], input);
    }

    if (vehicle) {
      pushVehicleEffect(effects, vehicle, 'capacity', 3, 'Araç kullanımı', ['assignment'], input);
    }
    if (assignment.vehicleType === 'high_capacity_vehicle') {
      pushVehicleEffect(effects, 'standard_truck', 'capacity', 8, 'Yüksek kapasite aracı', ['assignment'], input);
      pushContainerEffect(effects, district, 'fill_pressure', -6, 'Yüksek kapasite aracı', ['assignment'], input);
    }
    if (assignment.vehicleType === 'compact_service_vehicle') {
      pushVehicleEffect(effects, 'route_support_vehicle', 'route', 2, 'Kompakt servis', ['assignment'], input);
    }

    applyApproachEffects(effects, assignment.approachType, personnel, district, input);
  }
  if (pressureScale < 1 && effects.length > 0) {
    return effects.map((e) => ({
      ...e,
      delta: Math.round(e.delta * pressureScale),
    })).filter((e) => e.delta !== 0);
  }
  return effects;
}

function applyApproachEffects(
  effects: OperationalResourceEffect[],
  approach: ResponseApproachType,
  personnel: PersonnelGroupId | null,
  district: string,
  input: OperationalResourceEngineInput,
): void {
  switch (approach) {
    case 'rapid_response':
      pushPersonnelEffect(effects, personnel ?? 'field_team', 'workload', 5, 'Hızlı müdahale', ['assignment', 'approach'], input);
      pushPersonnelEffect(effects, personnel ?? 'field_team', 'fatigue', 4, 'Hızlı müdahale', ['assignment', 'approach'], input);
      break;
    case 'lasting_fix':
      pushPersonnelEffect(effects, personnel ?? 'technical_team', 'workload', 4, 'Kalıcı çözüm', ['assignment', 'approach'], input);
      pushContainerEffect(effects, district, 'maintenance_pressure', -4, 'Kalıcı çözüm', ['assignment', 'approach'], input);
      break;
    case 'low_resource':
      pushPersonnelEffect(effects, personnel ?? 'field_team', 'workload', -2, 'Düşük kaynak', ['assignment', 'approach'], input);
      pushContainerEffect(effects, district, 'fill_pressure', 2, 'Yarına taşınan risk', ['assignment', 'approach', 'carry_over'], input);
      pushContainerEffect(effects, district, 'social_pressure', 1, 'Yarına taşınan risk', ['assignment', 'approach', 'carry_over'], input);
      break;
    case 'public_first':
      pushPersonnelEffect(effects, 'public_relations_team', 'workload', 5, 'Halk önceliği', ['assignment', 'approach'], input);
      pushContainerEffect(effects, district, 'social_pressure', -3, 'Halk önceliği', ['assignment', 'approach'], input);
      break;
    default:
      break;
  }
}

export function buildOperationalResourceEffectsFromMicroDecisions(
  input: OperationalResourceEngineInput,
): OperationalResourceEffect[] {
  const effects: OperationalResourceEffect[] = [];
  const day = input.gameState.city.day;
  const resolved = Object.values(input.microDecisionState.decisionsById).filter(
    (d) => d != null && d.day === day && d.status === 'resolved',
  );
  for (const decision of resolved) {
    const optionId = decision.selectedOptionId ?? '';
    if (decision.type === 'field_update') {
      if (optionId.includes('maintenance') || optionId.includes('vehicle')) {
        pushVehicleEffect(effects, 'maintenance_vehicle', 'maintenance', 4, 'Saha bildirimi', ['micro'], input);
      } else {
        pushVehicleEffect(effects, 'route_support_vehicle', 'route', 3, 'Saha bildirimi', ['micro'], input);
      }
    }
    if (decision.type === 'district_representative') {
      pushPersonnelEffect(effects, 'public_relations_team', 'workload', 4, 'Mahalle temsilcisi', ['micro'], input);
      const district = decision.districtId ?? planDistrictId(input);
      pushContainerEffect(effects, district, 'social_pressure', -5, 'Mahalle temsilcisi', ['micro'], input);
    }
    if (decision.type === 'operation_opportunity') {
      const district = decision.districtId ?? planDistrictId(input);
      pushContainerEffect(effects, district, 'fill_pressure', -4, 'Operasyon fırsatı', ['micro'], input);
      pushPersonnelEffect(effects, 'field_team', 'workload', 3, 'Operasyon fırsatı', ['micro'], input);
      pushVehicleEffect(effects, 'standard_truck', 'capacity', 3, 'Operasyon fırsatı', ['micro'], input);
    }
  }
  return effects;
}

function crisisActionResourceEffects(
  actionType: CrisisActionType,
  input: OperationalResourceEngineInput,
  affectedDistricts: string[],
): OperationalResourceEffect[] {
  const effects: OperationalResourceEffect[] = [];
  switch (actionType) {
    case 'crisis_coordination':
      pushPersonnelEffect(effects, 'field_team', 'workload', 4, 'Kriz koordinasyonu', ['crisis_action'], input);
      pushVehicleEffect(effects, 'route_support_vehicle', 'route', 3, 'Kriz koordinasyonu', ['crisis_action'], input);
      break;
    case 'public_briefing':
      pushPersonnelEffect(effects, 'public_relations_team', 'workload', 5, 'Halk açıklaması', ['crisis_action'], input);
      for (const d of affectedDistricts.slice(0, 2)) {
        pushContainerEffect(effects, d, 'social_pressure', -7, 'Halk açıklaması', ['crisis_action'], input);
      }
      break;
    case 'field_rebalance':
      pushPersonnelEffect(effects, 'field_team', 'workload', 2, 'Saha dengeleme', ['crisis_action'], input);
      pushPersonnelEffect(effects, 'field_team', 'fatigue', -4, 'Saha dengeleme', ['crisis_action'], input);
      pushPersonnelEffect(effects, 'technical_team', 'workload', 1, 'Saha dengeleme', ['crisis_action'], input);
      pushVehicleEffect(effects, 'route_support_vehicle', 'route', -4, 'Saha dengeleme', ['crisis_action'], input);
      break;
    case 'preventive_maintenance':
      pushVehicleEffect(effects, 'maintenance_vehicle', 'maintenance', -11, 'Önleyici bakım hamlesi', ['crisis_action'], input);
      pushVehicleEffect(effects, 'standard_truck', 'capacity', -4, 'Önleyici bakım hamlesi', ['crisis_action'], input);
      pushPersonnelEffect(effects, 'technical_team', 'workload', 3, 'Önleyici bakım hamlesi', ['crisis_action'], input);
      for (const d of affectedDistricts.slice(0, 2)) {
        pushContainerEffect(effects, d, 'fill_pressure', -5, 'Önleyici bakım hamlesi', ['crisis_action'], input);
        pushContainerEffect(effects, d, 'maintenance_pressure', -4, 'Önleyici bakım hamlesi', ['crisis_action'], input);
      }
      break;
    case 'monitor_only':
      for (const d of affectedDistricts.slice(0, 2)) {
        pushContainerEffect(effects, d, 'fill_pressure', 2, 'İzlemeye alındı', ['crisis_action', 'carry_over'], input);
        pushContainerEffect(effects, d, 'maintenance_pressure', 1, 'İzlemeye alındı', ['crisis_action', 'carry_over'], input);
      }
      break;
    default:
      break;
  }
  return effects;
}

export function buildOperationalResourceEffectsFromCrisisActions(
  input: OperationalResourceEngineInput,
): OperationalResourceEffect[] {
  const day = input.gameState.city.day;
  const selected = getSelectedCrisisActionForDay(input.crisisActionState, day);
  if (!selected || selected.status === 'expired') return [];
  return crisisActionResourceEffects(
    selected.type,
    input,
    selected.affectedDistrictIds ?? [],
  );
}

export function buildOperationalResourceEffectsFromOperationSignals(
  input: OperationalResourceEngineInput,
): OperationalResourceEffect[] {
  const effects: OperationalResourceEffect[] = [];
  const signals = input.operationSignals;
  const district = planDistrictId(input);

  if (signals.personnel.status === 'strained' || signals.personnel.status === 'critical') {
    pushPersonnelEffect(effects, 'field_team', 'fatigue', 2, 'Personel sinyali', ['signals_nudge'], input);
  }
  if (signals.vehicles.status === 'strained' || signals.vehicles.status === 'critical') {
    pushVehicleEffect(effects, 'maintenance_vehicle', 'maintenance', 2, 'Filo sinyali', ['signals_nudge'], input);
  }
  if (signals.containers.status === 'strained' || signals.containers.status === 'critical') {
    pushContainerEffect(effects, district, 'fill_pressure', 3, 'Konteyner sinyali', ['signals_nudge'], input);
  }
  return effects;
}

export function applyOperationalResourceEffects(
  state: OperationalResourcesState,
  effects: OperationalResourceEffect[],
  day: number,
): OperationalResourcesState {
  let next = normalizeOperationalResourcesState(state, day);

  for (const effect of effects) {
    if (effect.domain === 'personnel') {
      const id = effect.targetId as PersonnelGroupId;
      const group = next.personnelGroups[id];
      if (!group) continue;
      const updated = { ...group, usedToday: true, lastAssignedDay: day };
      if (effect.metric === 'workload' || !effect.metric) {
        updated.workloadScore = clampResourceScore(updated.workloadScore + effect.delta);
      } else if (effect.metric === 'fatigue') {
        updated.fatigueScore = clampResourceScore(updated.fatigueScore + effect.delta);
      } else if (effect.metric === 'morale') {
        updated.moraleScore = clampResourceScore(updated.moraleScore + effect.delta);
      }
      next.personnelGroups[id] = updated;
    } else if (effect.domain === 'vehicles') {
      const id = effect.targetId as VehicleGroupId;
      const group = next.vehicleGroups[id];
      if (!group) continue;
      const updated = { ...group, usedToday: true, lastUsedDay: day };
      if (effect.metric === 'capacity' || !effect.metric) {
        updated.capacityPressure = clampResourceScore(
          updated.capacityPressure + effect.delta,
        );
      } else if (effect.metric === 'maintenance') {
        updated.maintenanceRisk = clampResourceScore(
          updated.maintenanceRisk + effect.delta,
        );
      } else if (effect.metric === 'route') {
        updated.routePressure = clampResourceScore(updated.routePressure + effect.delta);
      }
      next.vehicleGroups[id] = updated;
    } else if (effect.domain === 'containers') {
      const network = next.containerNetworksByDistrictId[effect.targetId];
      if (!network) continue;
      const updated = { ...network };
      const metric = effect.metric ?? 'fill_pressure';
      if (metric === 'fill_pressure') {
        updated.fillPressure = clampResourceScore(updated.fillPressure + effect.delta);
      } else if (metric === 'cleanliness_pressure') {
        updated.cleanlinessPressure = clampResourceScore(
          updated.cleanlinessPressure + effect.delta,
        );
      } else if (metric === 'maintenance_pressure') {
        updated.maintenancePressure = clampResourceScore(
          updated.maintenancePressure + effect.delta,
        );
      } else if (metric === 'social_pressure') {
        updated.socialPressure = clampResourceScore(updated.socialPressure + effect.delta);
      }
      updated.sourceTags = [...new Set([...updated.sourceTags, ...effect.sourceTags])];
      next.containerNetworksByDistrictId[effect.targetId] = updated;
    }
  }

  return recomputeGroupSummaries(next);
}

function busiestPersonnel(state: OperationalResourcesState): PersonnelGroupId {
  let best: PersonnelGroupId = 'field_team';
  let max = -1;
  for (const id of Object.keys(state.personnelGroups) as PersonnelGroupId[]) {
    const g = state.personnelGroups[id];
    const pressure = g.workloadScore + g.fatigueScore;
    if (pressure > max) {
      max = pressure;
      best = id;
    }
  }
  return best;
}

function busiestVehicle(state: OperationalResourcesState): VehicleGroupId {
  let best: VehicleGroupId = 'standard_truck';
  let max = -1;
  for (const id of Object.keys(state.vehicleGroups) as VehicleGroupId[]) {
    const g = state.vehicleGroups[id];
    const pressure = g.capacityPressure + g.maintenanceRisk + g.routePressure;
    if (pressure > max) {
      max = pressure;
      best = id;
    }
  }
  return best;
}

function highestContainerDistrict(
  state: OperationalResourcesState,
): { districtId: string; score: number } {
  let bestId = 'merkez';
  let bestScore = -1;
  for (const [districtId, network] of Object.entries(state.containerNetworksByDistrictId)) {
    const score =
      network.fillPressure +
      network.cleanlinessPressure +
      network.maintenancePressure +
      network.socialPressure;
    if (score > bestScore) {
      bestScore = score;
      bestId = districtId;
    }
  }
  return { districtId: bestId, score: bestScore };
}

export function calculateOperationalResourceDailySummary(
  state: OperationalResourcesState,
  day: number,
): OperationalResourcesDailySummary {
  const personnelId = busiestPersonnel(state);
  const vehicleId = busiestVehicle(state);
  const container = highestContainerDistrict(state);
  const personnel = state.personnelGroups[personnelId];
  const vehicle = state.vehicleGroups[vehicleId];
  const network = state.containerNetworksByDistrictId[container.districtId];
  const containerLabel =
    CONTAINER_NETWORK_DISTRICT_LABELS[container.districtId] ?? container.districtId;

  const warnings: string[] = [];
  if (personnel.status === 'critical' || personnel.status === 'strained') {
    warnings.push(`${personnel.label} bugün yoğun kullanıldı.`);
  }
  if (vehicle.status === 'critical' || vehicle.status === 'strained') {
    warnings.push(`${vehicle.label} risk izlenmeli.`);
  }
  if (network && (network.status === 'critical' || network.status === 'strained')) {
    warnings.push(`${containerLabel} konteyner ağı yarın izlenmeli.`);
  }

  return {
    day,
    personnelLine: personnel.usedToday
      ? `${personnel.label} bugün operasyonda yoğunlaştı.`
      : `${personnel.label} dengeli kaldı.`,
    vehicleLine: vehicle.usedToday
      ? `${vehicle.summary}`
      : `${vehicle.label} dengeli kaldı.`,
    containerLine: network
      ? `${containerLabel} konteyner ağı ${network.status === 'stable' ? 'dengeli' : 'baskı taşıyor'}.`
      : 'Konteyner ağı izleniyor.',
    warnings: warnings.slice(0, 3),
  };
}

export function deriveOperationalResourcesFromGameState(
  input: OperationalResourceEngineInput,
): OperationalResourcesState {
  const day = input.gameState.city.day;
  let state = refreshOperationalResourcesForDay(
    normalizeOperationalResourcesState(input.operationalResources, day),
    day,
  );

  const nudges = buildOperationalResourceEffectsFromOperationSignals(input);
  if (nudges.length > 0 && state.lastProcessedDay !== day) {
    state = applyOperationalResourceEffects(state, nudges, day);
  }
  return state;
}

export function processOperationalResourcesEndOfDay(
  input: OperationalResourceEngineInput,
  closingDay: number,
): OperationalResourcesState {
  let state = normalizeOperationalResourcesState(input.operationalResources, closingDay);
  if (state.lastProcessedDay === closingDay) {
    return state;
  }

  const effects = [
    ...buildOperationalResourceEffectsFromDailyPlan(input),
    ...buildOperationalResourceEffectsFromAssignment(input),
    ...buildOperationalResourceEffectsFromMicroDecisions(input),
    ...buildOperationalResourceEffectsFromCrisisActions(input),
    ...buildOperationalResourceEffectsFromOperationSignals(input),
  ];

  state = applyOperationalResourceEffects(state, effects, closingDay);
  state = applyNightlyOperationalResourceRecovery(state, input);
  const summary = calculateOperationalResourceDailySummary(state, closingDay);
  return markOperationalResourcesProcessed(state, closingDay, summary);
}

function crisisActionNightlyRecoveryBonus(
  actionType: CrisisActionType | undefined,
): number {
  switch (actionType) {
    case 'preventive_maintenance':
      return 8;
    case 'field_rebalance':
      return 6;
    case 'public_briefing':
      return 5;
    case 'crisis_coordination':
      return 5;
    default:
      return 0;
  }
}

function countCriticalOperationalGroups(state: OperationalResourcesState): number {
  let count = 0;
  for (const g of Object.values(state.personnelGroups)) {
    if (g.status === 'critical') count += 1;
  }
  for (const g of Object.values(state.vehicleGroups)) {
    if (g.status === 'critical') count += 1;
  }
  for (const n of Object.values(state.containerNetworksByDistrictId)) {
    if (n.status === 'critical') count += 1;
  }
  return count;
}

function applyNightlyOperationalResourceRecovery(
  state: OperationalResourcesState,
  input: OperationalResourceEngineInput,
): OperationalResourcesState {
  const plan = input.dailyOperationsPlan;
  const day = input.gameState.city.day;
  const selectedCrisisAction = getSelectedCrisisActionForDay(
    input.crisisActionState,
    day,
  );
  const crisisRecoveryBonus =
    selectedCrisisAction?.status === 'selected'
      ? crisisActionNightlyRecoveryBonus(selectedCrisisAction.type)
      : 0;
  const criticalGroupCount = countCriticalOperationalGroups(state);
  const streakRecoveryBonus =
    criticalGroupCount >= 3 ? 8 : criticalGroupCount >= 2 ? 6 : criticalGroupCount >= 1 ? 2 : 0;
  let next = { ...state, personnelGroups: { ...state.personnelGroups } };

  for (const id of Object.keys(next.personnelGroups) as PersonnelGroupId[]) {
    const g = { ...next.personnelGroups[id]! };
    let recovery =
      (g.usedToday ? 4 : 6) + crisisRecoveryBonus + streakRecoveryBonus;
    if (plan?.personnelFocus === 'rest_rotation') recovery += 5;
    if (plan?.vehicleFocus === 'preventive_maintenance' && id === 'technical_team') {
      recovery += 5;
    }
    if (selectedCrisisAction?.type === 'field_rebalance') recovery += 4;
    if (selectedCrisisAction?.type === 'crisis_coordination') recovery += 3;
    if (selectedCrisisAction?.type === 'public_briefing') recovery += 2;
    if (g.status === 'critical') {
      recovery += criticalGroupCount >= 2 ? 7 : 6;
      g.workloadScore = clampResourceScore(Math.min(g.workloadScore, 90));
      g.fatigueScore = clampResourceScore(Math.min(g.fatigueScore, 90));
    }
    g.workloadScore = clampResourceScore(g.workloadScore - recovery);
    g.fatigueScore = clampResourceScore(g.fatigueScore - Math.ceil(recovery / 2));
    next.personnelGroups[id] = g;
  }

  const vehicleGroups = { ...next.vehicleGroups };
  for (const id of Object.keys(vehicleGroups) as VehicleGroupId[]) {
    const g = { ...vehicleGroups[id]! };
    let recovery =
      (g.usedToday ? 4 : 6) + crisisRecoveryBonus + streakRecoveryBonus;
    if (plan?.vehicleFocus === 'preventive_maintenance') recovery += 6;
    if (plan?.vehicleFocus === 'route_check') recovery += 4;
    if (selectedCrisisAction?.type === 'preventive_maintenance') recovery += 4;
    if (g.status === 'critical') {
      recovery += 5;
    }
    g.capacityPressure = clampResourceScore(g.capacityPressure - recovery);
    g.maintenanceRisk = clampResourceScore(g.maintenanceRisk - Math.ceil(recovery / 2));
    g.routePressure = clampResourceScore(g.routePressure - Math.ceil(recovery / 2));
    vehicleGroups[id] = g;
  }
  next.vehicleGroups = vehicleGroups;

  const containerNetworksByDistrictId = { ...next.containerNetworksByDistrictId };
  for (const districtId of Object.keys(containerNetworksByDistrictId)) {
    const n = { ...containerNetworksByDistrictId[districtId]! };
    let recovery =
      (plan?.containerFocus === 'cleanliness_maintenance' ||
      plan?.containerFocus === 'risk_inspection'
        ? 5
        : 3) +
      streakRecoveryBonus;
    if (selectedCrisisAction?.type === 'public_briefing') recovery += 5;
    if (selectedCrisisAction?.type === 'preventive_maintenance') recovery += 4;
    if (n.status === 'critical') {
      recovery += 4;
    }
    n.fillPressure = clampResourceScore(n.fillPressure - recovery);
    n.cleanlinessPressure = clampResourceScore(n.cleanlinessPressure - recovery);
    n.socialPressure = clampResourceScore(
      n.socialPressure - Math.ceil(recovery / 2),
    );
    containerNetworksByDistrictId[districtId] = n;
  }
  next.containerNetworksByDistrictId = containerNetworksByDistrictId;

  let nextWithStatus = recomputeGroupSummaries(next);
  const criticalAfterRecovery = countCriticalOperationalGroups(nextWithStatus);
  nextWithStatus = applyCriticalRecoveryFloor(nextWithStatus, criticalAfterRecovery);
  nextWithStatus = softenStuckCriticalGroups(nextWithStatus, criticalAfterRecovery);
  return recomputeGroupSummaries(nextWithStatus);
}

function softenStuckCriticalGroups(
  state: OperationalResourcesState,
  criticalGroupCount: number,
): OperationalResourcesState {
  if (criticalGroupCount < 2) return state;

  let next = {
    ...state,
    personnelGroups: { ...state.personnelGroups },
    vehicleGroups: { ...state.vehicleGroups },
    containerNetworksByDistrictId: { ...state.containerNetworksByDistrictId },
  };

  for (const id of Object.keys(next.personnelGroups) as PersonnelGroupId[]) {
    const g = { ...next.personnelGroups[id]! };
    if (g.status === 'critical') {
      g.workloadScore = clampResourceScore(Math.min(g.workloadScore, 79));
      g.fatigueScore = clampResourceScore(Math.min(g.fatigueScore, 79));
    }
    next.personnelGroups[id] = g;
  }

  for (const id of Object.keys(next.vehicleGroups) as VehicleGroupId[]) {
    const g = { ...next.vehicleGroups[id]! };
    if (g.status === 'critical') {
      g.capacityPressure = clampResourceScore(Math.min(g.capacityPressure, 79));
      g.maintenanceRisk = clampResourceScore(Math.min(g.maintenanceRisk, 79));
      g.routePressure = clampResourceScore(Math.min(g.routePressure, 79));
    }
    next.vehicleGroups[id] = g;
  }

  for (const districtId of Object.keys(next.containerNetworksByDistrictId)) {
    const n = { ...next.containerNetworksByDistrictId[districtId]! };
    if (n.status === 'critical') {
      n.fillPressure = clampResourceScore(Math.min(n.fillPressure, 79));
      n.cleanlinessPressure = clampResourceScore(Math.min(n.cleanlinessPressure, 79));
      n.socialPressure = clampResourceScore(Math.min(n.socialPressure, 79));
    }
    next.containerNetworksByDistrictId[districtId] = n;
  }

  return next;
}

function applyCriticalRecoveryFloor(
  state: OperationalResourcesState,
  criticalGroupCount: number,
): OperationalResourcesState {
  if (criticalGroupCount < 2) return state;

  let next = {
    ...state,
    personnelGroups: { ...state.personnelGroups },
    vehicleGroups: { ...state.vehicleGroups },
    containerNetworksByDistrictId: { ...state.containerNetworksByDistrictId },
  };

  const floorPull =
    criticalGroupCount >= 4 ? 10 : criticalGroupCount >= 3 ? 8 : criticalGroupCount >= 2 ? 7 : 0;
  if (floorPull === 0) return state;

  for (const id of Object.keys(next.personnelGroups) as PersonnelGroupId[]) {
    const g = { ...next.personnelGroups[id]! };
    const pressure = g.workloadScore * 0.55 + g.fatigueScore * 0.45;
    if (g.status === 'critical' || pressure >= 76) {
      g.workloadScore = clampResourceScore(g.workloadScore - floorPull);
      g.fatigueScore = clampResourceScore(g.fatigueScore - Math.ceil(floorPull * 0.7));
    }
    next.personnelGroups[id] = g;
  }

  for (const id of Object.keys(next.vehicleGroups) as VehicleGroupId[]) {
    const g = { ...next.vehicleGroups[id]! };
    const pressure =
      g.capacityPressure * 0.4 + g.maintenanceRisk * 0.35 + g.routePressure * 0.25;
    if (g.status === 'critical' || pressure >= 76) {
      g.capacityPressure = clampResourceScore(g.capacityPressure - floorPull);
      g.maintenanceRisk = clampResourceScore(g.maintenanceRisk - Math.ceil(floorPull * 0.6));
      g.routePressure = clampResourceScore(g.routePressure - Math.ceil(floorPull * 0.5));
    }
    next.vehicleGroups[id] = g;
  }

  for (const districtId of Object.keys(next.containerNetworksByDistrictId)) {
    const n = { ...next.containerNetworksByDistrictId[districtId]! };
    const pressure =
      n.fillPressure * 0.35 +
      n.cleanlinessPressure * 0.25 +
      n.maintenancePressure * 0.2 +
      n.socialPressure * 0.2;
    if (n.status === 'critical' || pressure >= 76) {
      n.fillPressure = clampResourceScore(n.fillPressure - floorPull);
      n.cleanlinessPressure = clampResourceScore(n.cleanlinessPressure - Math.ceil(floorPull * 0.8));
      n.maintenancePressure = clampResourceScore(n.maintenancePressure - Math.ceil(floorPull * 0.6));
      n.socialPressure = clampResourceScore(n.socialPressure - Math.ceil(floorPull * 0.5));
    }
    next.containerNetworksByDistrictId[districtId] = n;
  }

  return next;
}

export function getRecommendedResourceForEvent(
  gameState: GameState,
  event: EventCard,
): {
  personnelGroupId?: PersonnelGroupId;
  vehicleGroupId?: VehicleGroupId;
  reason: string;
} {
  const category = event.category ?? 'container';
  if (category === 'social') {
    return {
      personnelGroupId: 'public_relations_team',
      reason: 'Sosyal olay için halk iletişim ekibi önerilir.',
    };
  }
  if (category === 'vehicle' || category === 'infrastructure') {
    return {
      personnelGroupId: 'technical_team',
      vehicleGroupId: 'maintenance_vehicle',
      reason: 'Teknik ekip ve bakım aracı önerilir.',
    };
  }
  return {
    personnelGroupId: 'field_team',
    vehicleGroupId: 'standard_truck',
    reason: 'Saha ekibi ve standart kamyon önerilir.',
  };
}

export function getDistrictContainerNetworkSummary(
  state: OperationalResourcesState,
  districtId: string,
): string | undefined {
  const network = state.containerNetworksByDistrictId[districtId];
  if (!network) return undefined;
  const label = CONTAINER_NETWORK_DISTRICT_LABELS[districtId] ?? districtId;
  return `${label}: ${network.summary}`;
}

export function buildOperationalResourceEngineInputFromStore(
  store: Pick<
    OperationalResourceEngineInput,
    | 'gameState'
    | 'monetization'
    | 'operationSignals'
    | 'dailyOperationsPlan'
    | 'assignments'
    | 'microDecisionState'
    | 'crisisActionState'
    | 'operationalResources'
  >,
): OperationalResourceEngineInput {
  return { ...store };
}

export function resetOperationalResourcesForTesting(day: number): OperationalResourcesState {
  return createInitialOperationalResourcesState(day);
}
