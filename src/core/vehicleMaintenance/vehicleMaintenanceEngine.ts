import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import {
  VEHICLE_MAINTENANCE_COMPLETED_SCORE_REDUCTION,
  VEHICLE_MAINTENANCE_FLEET_GROUP_IDS,
  VEHICLE_MAINTENANCE_MAX_SUGGESTED_WINDOWS_PER_DAY,
  VEHICLE_MAINTENANCE_PASSIVE_DAY_MAX,
  VEHICLE_MAINTENANCE_PLAYER_LABELS,
  VEHICLE_MAINTENANCE_SCORE_MAINTENANCE_DUE_MAX,
  VEHICLE_MAINTENANCE_SCORE_MAX,
  VEHICLE_MAINTENANCE_SCORE_STABLE_MAX,
  VEHICLE_MAINTENANCE_SCORE_STRAINED_MAX,
  VEHICLE_MAINTENANCE_SCORE_WATCH_MAX,
  VEHICLE_MAINTENANCE_VISIBLE_DAY_MIN,
  VEHICLE_MAINTENANCE_WINDOW_KIND_BY_GROUP,
} from './vehicleMaintenanceRuntimeConstants';
import {
  createInitialVehicleMaintenanceState,
  pruneVehicleMaintenanceWindows,
} from './vehicleMaintenanceState';
import type {
  VehicleAvailabilityBand,
  VehicleConditionBand,
  VehicleFatigueBand,
  VehicleFleetGroupId,
  VehicleFleetGroupStateV1,
  VehicleMaintenanceDayCloseInput,
  VehicleMaintenanceStateV1,
  VehicleMaintenanceStorySignal,
  VehicleMaintenanceWindowKind,
  VehicleMaintenanceWindowV1,
} from './vehicleMaintenanceRuntimeTypes';

export function stableVehicleMaintenanceHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(VEHICLE_MAINTENANCE_SCORE_MAX, Math.round(score)));
}

function signalPressure(status?: string): boolean {
  return status === 'watch' || status === 'strained' || status === 'critical';
}

export function bandsFromMaintenanceNeedScore(score: number): {
  conditionBand: VehicleConditionBand;
  fatigueBand: VehicleFatigueBand;
  availabilityBand: VehicleAvailabilityBand;
} {
  if (score <= VEHICLE_MAINTENANCE_SCORE_STABLE_MAX) {
    return { conditionBand: 'stable', fatigueBand: 'low', availabilityBand: 'ready' };
  }
  if (score <= VEHICLE_MAINTENANCE_SCORE_WATCH_MAX) {
    return { conditionBand: 'watch', fatigueBand: 'moderate', availabilityBand: 'limited' };
  }
  if (score <= VEHICLE_MAINTENANCE_SCORE_STRAINED_MAX) {
    return { conditionBand: 'strained', fatigueBand: 'high', availabilityBand: 'reduced' };
  }
  if (score <= VEHICLE_MAINTENANCE_SCORE_MAINTENANCE_DUE_MAX) {
    return {
      conditionBand: 'maintenance_due',
      fatigueBand: 'high',
      availabilityBand: 'reduced',
    };
  }
  return {
    conditionBand: 'critical',
    fatigueBand: 'severe',
    availabilityBand: 'unavailable',
  };
}

function mapAssignmentGroupToFleet(vehicleGroup?: string): VehicleFleetGroupId | undefined {
  if (!vehicleGroup) return undefined;
  const normalized = vehicleGroup.toLocaleLowerCase('tr-TR');
  if (normalized.includes('route') || normalized.includes('truck')) return 'route_support';
  if (normalized.includes('container')) return 'container_support';
  if (normalized.includes('field') || normalized.includes('response')) return 'field_response';
  if (normalized.includes('backup')) return 'backup_fleet';
  if (normalized.includes('light') || normalized.includes('service')) return 'light_service';
  return 'route_support';
}

export function calculateFleetGroupMaintenanceNeed(
  groupId: VehicleFleetGroupId,
  input: VehicleMaintenanceDayCloseInput,
  previous?: VehicleFleetGroupStateV1,
): number {
  let score = previous?.maintenanceNeedScore ?? 0;

  if (previous && previous.consecutiveUseDays > 1) {
    score += (previous.consecutiveUseDays - 1) * 10;
  }

  if (groupId === 'route_support') {
    if (input.vehicleRoutePressure || signalPressure(input.operationSignals?.vehicles?.status)) {
      score += 15;
    }
    if (input.routeBalanced) score -= 8;
    if (input.comebackCompleted) score -= 8;
  }

  if (groupId === 'container_support' && signalPressure(input.operationSignals?.containers?.status)) {
    score += 12;
  }

  if (groupId === 'field_response' && input.resourcePressure) {
    score += 8;
  }

  if (groupId === 'backup_fleet' && (previous?.consecutiveUseDays ?? 0) >= 1) {
    score += 10;
  }

  if (input.resourcePressure) score += 12;
  if (input.resourceRecovery) score -= 10;

  if (input.contentPackDomains?.some((d) => d.includes('vehicle_route'))) {
    if (groupId === 'route_support') score += 10;
  }
  if (input.contentPackDomains?.some((d) => d.includes('resource_pressure'))) {
    if (groupId === 'route_support' || groupId === 'backup_fleet') score += 8;
  }

  const assignmentFleet = mapAssignmentGroupToFleet(input.assignmentVehicleGroup);
  if (assignmentFleet === groupId) {
    const compat = input.assignmentCompatibilityScore ?? 70;
    if (compat < 50) score += 10;
    if (compat >= 75) score -= 6;
    if (input.assignmentApproach?.includes('balanced')) score -= 4;
  }

  if (input.storyChainKinds?.includes('route_pressure_chain') && groupId === 'route_support') {
    score += 10;
  }
  if (input.storyChainKinds?.includes('resource_fatigue_chain')) {
    if (groupId === 'route_support' || groupId === 'backup_fleet') score += 10;
  }

  const completedToday = input.day;
  const completedWindow = previous?.lastMaintenanceDay === completedToday;
  if (completedWindow) score -= VEHICLE_MAINTENANCE_COMPLETED_SCORE_REDUCTION;

  return clampScore(score);
}

function buildPlayerVisibleLine(
  groupId: VehicleFleetGroupId,
  bands: ReturnType<typeof bandsFromMaintenanceNeedScore>,
): string {
  const label = VEHICLE_MAINTENANCE_PLAYER_LABELS[groupId];
  if (bands.conditionBand === 'stable') {
    return `${label} dengede.`;
  }
  if (bands.conditionBand === 'watch' || bands.conditionBand === 'strained') {
    return `${label} yorgunluk izleniyor.`;
  }
  if (bands.conditionBand === 'maintenance_due') {
    return `${label} hafif bakım penceresi istiyor.`;
  }
  return `${label} destek hattı zorlanıyor; planlı müdahale gerekli.`;
}

export function deriveInitialFleetScoresFromSignals(
  input: VehicleMaintenanceDayCloseInput,
): VehicleMaintenanceStateV1 {
  const state = createInitialVehicleMaintenanceState(input.day);
  const fleetGroups = { ...state.fleetGroups };

  for (const groupId of VEHICLE_MAINTENANCE_FLEET_GROUP_IDS) {
    const need = calculateFleetGroupMaintenanceNeed(groupId, input, fleetGroups[groupId]);
    const bands = bandsFromMaintenanceNeedScore(need);
    fleetGroups[groupId] = {
      ...fleetGroups[groupId],
      ...bands,
      maintenanceNeedScore: need,
      playerVisibleLine: buildPlayerVisibleLine(groupId, bands),
      duplicateKey: `fleet_group:${groupId}:d${input.day}`,
    };
  }

  return { ...state, fleetGroups, updatedAtDay: input.day };
}

function resolveWindowKind(groupId: VehicleFleetGroupId, score: number): VehicleMaintenanceWindowKind {
  const base = VEHICLE_MAINTENANCE_WINDOW_KIND_BY_GROUP[groupId];
  if (score >= 80 && groupId === 'field_response') return 'emergency_repair_watch';
  return base;
}

export function buildMaintenanceWindowSuggestions(
  state: VehicleMaintenanceStateV1,
  input: VehicleMaintenanceDayCloseInput,
): VehicleMaintenanceWindowV1[] {
  if (input.day < VEHICLE_MAINTENANCE_VISIBLE_DAY_MIN) return [];

  const existingToday = state.maintenanceWindows.filter((w) => w.day === input.day);
  const usedGroups = new Set(existingToday.map((w) => w.groupId));

  const ranked = VEHICLE_MAINTENANCE_FLEET_GROUP_IDS.map((groupId) => ({
    groupId,
    score: state.fleetGroups[groupId]?.maintenanceNeedScore ?? 0,
  }))
    .filter((item) => item.score >= VEHICLE_MAINTENANCE_SCORE_WATCH_MAX)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (
        stableVehicleMaintenanceHash(`${input.day}|${a.groupId}`) -
        stableVehicleMaintenanceHash(`${input.day}|${b.groupId}`)
      );
    });

  const suggestions: VehicleMaintenanceWindowV1[] = [];
  for (const item of ranked) {
    if (suggestions.length >= VEHICLE_MAINTENANCE_MAX_SUGGESTED_WINDOWS_PER_DAY) break;
    if (usedGroups.has(item.groupId)) continue;

    const windowKind = resolveWindowKind(item.groupId, item.score);
    const id = `vmw_${item.groupId}_d${input.day}`;
    const duplicateKey = `vehicle_maintenance_suggested:${item.groupId}:${input.day}`;
    suggestions.push({
      id,
      groupId: item.groupId,
      day: input.day,
      status: 'suggested',
      windowKind,
      priority: item.score,
      tradeoffLine: 'Kısa vadede araç hattı kısılabilir; yorgunluk düşer.',
      expectedEffect: 'Yarın rota desteği daha dengeli çalışır.',
      districtId: input.districtId,
      sourceKind: 'day_close',
      duplicateKey,
      createdAtDay: input.day,
    });
    usedGroups.add(item.groupId);
  }

  return suggestions;
}

export function applyMaintenanceWindowOutcomes(
  state: VehicleMaintenanceStateV1,
  day: number,
): VehicleMaintenanceStateV1 {
  const maintenanceWindows = state.maintenanceWindows.map((window) => {
    if (window.day !== day - 1) return window;
    if (window.status === 'completed') {
      return { ...window, resolvedAtDay: day };
    }
    if (window.status === 'suggested' && day - window.day >= 2) {
      return { ...window, status: 'expired' as const, resolvedAtDay: day };
    }
    return window;
  });

  const fleetGroups = { ...state.fleetGroups };
  for (const window of maintenanceWindows) {
    if (window.status !== 'completed' || window.resolvedAtDay !== day) continue;
    const group = fleetGroups[window.groupId];
    if (!group) continue;
    const need = clampScore(group.maintenanceNeedScore - VEHICLE_MAINTENANCE_COMPLETED_SCORE_REDUCTION);
    const bands = bandsFromMaintenanceNeedScore(need);
    fleetGroups[window.groupId] = {
      ...group,
      ...bands,
      maintenanceNeedScore: need,
      lastMaintenanceDay: day,
      consecutiveUseDays: 0,
      playerVisibleLine: buildPlayerVisibleLine(window.groupId, bands),
    };
  }

  return { ...state, maintenanceWindows, fleetGroups };
}

export function buildVehicleMaintenanceDayCloseInput(
  input: VehicleMaintenanceDayCloseInput,
): VehicleMaintenanceDayCloseInput {
  return input;
}

export function updateVehicleMaintenanceForDay(
  state: VehicleMaintenanceStateV1,
  input: VehicleMaintenanceDayCloseInput,
): VehicleMaintenanceStateV1 {
  let next = { ...state, updatedAtDay: input.day };
  const fleetGroups = { ...next.fleetGroups };
  const sourceSignals = new Set(next.sourceSignals);

  if (input.operationSignals) sourceSignals.add('operation_signals');
  if (input.assignmentVehicleGroup) sourceSignals.add('assignment');
  if (input.cityArchiveRecentKinds?.length) sourceSignals.add('city_archive');
  if (input.contentPackDomains?.length) sourceSignals.add('content_pack');
  if (input.storyChainKinds?.length) sourceSignals.add('story_chain');

  let highestScore = 0;
  let highestGroup: VehicleFleetGroupId | undefined;

  for (const groupId of VEHICLE_MAINTENANCE_FLEET_GROUP_IDS) {
    const prev = fleetGroups[groupId];
    const assignmentFleet = mapAssignmentGroupToFleet(input.assignmentVehicleGroup);
    const usedToday = assignmentFleet === groupId;
    const consecutiveUseDays = usedToday ? (prev.consecutiveUseDays ?? 0) + 1 : 0;
    const need = calculateFleetGroupMaintenanceNeed(groupId, input, {
      ...prev,
      consecutiveUseDays,
    });
    const bands = bandsFromMaintenanceNeedScore(need);

    if (need > highestScore) {
      highestScore = need;
      highestGroup = groupId;
    }

    fleetGroups[groupId] = {
      ...prev,
      ...bands,
      maintenanceNeedScore: need,
      consecutiveUseDays,
      lastUsedDay: usedToday ? input.day : prev.lastUsedDay,
      routePressureScore:
        groupId === 'route_support' && input.vehicleRoutePressure ? need : prev.routePressureScore,
      assignmentPressureScore:
        assignmentFleet === groupId
          ? Math.max(0, 100 - (input.assignmentCompatibilityScore ?? 70))
          : prev.assignmentPressureScore,
      districtPressureIds: input.districtId
        ? [...new Set([...(prev.districtPressureIds ?? []), input.districtId as MapDistrictId])].slice(
            -3,
          )
        : prev.districtPressureIds,
      playerVisibleLine: buildPlayerVisibleLine(groupId, bands),
      duplicateKey: `fleet_group:${groupId}:d${input.day}`,
    };
  }

  const suggestions =
    input.day > VEHICLE_MAINTENANCE_PASSIVE_DAY_MAX
      ? buildMaintenanceWindowSuggestions({ ...next, fleetGroups }, input)
      : [];

  const existingKeys = new Set(next.maintenanceWindows.map((w) => w.duplicateKey));
  const newWindows = suggestions.filter((w) => !existingKeys.has(w.duplicateKey));

  next = {
    ...next,
    fleetGroups,
    maintenanceWindows: [...next.maintenanceWindows, ...newWindows],
    fatigueSummary: {
      overallBand:
        highestScore >= VEHICLE_MAINTENANCE_SCORE_MAINTENANCE_DUE_MAX
          ? 'severe'
          : highestScore >= VEHICLE_MAINTENANCE_SCORE_STRAINED_MAX
            ? 'high'
            : highestScore >= VEHICLE_MAINTENANCE_SCORE_WATCH_MAX
              ? 'moderate'
              : 'low',
      highestPressureGroupId: highestGroup,
      consecutiveHeavyDays:
        highestScore >= VEHICLE_MAINTENANCE_SCORE_STRAINED_MAX
          ? (next.fatigueSummary.consecutiveHeavyDays ?? 0) + 1
          : 0,
      playerLine: highestGroup
        ? fleetGroups[highestGroup].playerVisibleLine
        : undefined,
    },
    routePressureSummary: {
      dominantDistrictId: input.districtId,
      routePressureScore: fleetGroups.route_support.maintenanceNeedScore,
      linkedStoryChainKind: input.storyChainKinds?.find((k) => k.includes('route')),
    },
    assignmentImpactSummary: {
      lastVehicleGroupUsed: input.assignmentVehicleGroup,
      compatibilityScore: input.assignmentCompatibilityScore,
      pressureDelta: input.assignmentCompatibilityScore
        ? 100 - input.assignmentCompatibilityScore
        : 0,
    },
    sourceSignals: [...sourceSignals],
  };

  next = applyMaintenanceWindowOutcomes(next, input.day);
  return pruneVehicleMaintenanceWindows(next, input.day);
}

export function normalizeVehicleMaintenanceStateFromInput(
  state: VehicleMaintenanceStateV1 | null | undefined,
  input: VehicleMaintenanceDayCloseInput,
): VehicleMaintenanceStateV1 {
  const base = state ?? createInitialVehicleMaintenanceState(input.day);
  return updateVehicleMaintenanceForDay(base, input);
}

export function buildVehicleMaintenanceStorySignal(
  state: VehicleMaintenanceStateV1,
): VehicleMaintenanceStorySignal {
  const routeScore = state.fleetGroups.route_support?.maintenanceNeedScore ?? 0;
  const backupScore = state.fleetGroups.backup_fleet?.maintenanceNeedScore ?? 0;
  const fatigueHigh = routeScore >= VEHICLE_MAINTENANCE_SCORE_STRAINED_MAX || backupScore >= 60;
  const completed = state.maintenanceWindows.some(
    (w) => w.status === 'completed' && w.resolvedAtDay === state.updatedAtDay,
  );

  return {
    canStrengthenRouteChain: routeScore >= VEHICLE_MAINTENANCE_SCORE_WATCH_MAX,
    canStrengthenFatigueChain: fatigueHigh,
    shouldSoftenChain: completed,
    reason: completed
      ? 'Maintenance completed softens active chain.'
      : fatigueHigh
        ? 'High fleet fatigue may strengthen resource chain signal.'
        : 'No maintenance story pressure.',
  };
}
