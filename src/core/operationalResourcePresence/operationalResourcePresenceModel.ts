import { resolveContentPackMetaForWiring } from '@/core/contentRuntimeActivation/contentRuntimeActivationWiring';
import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import {
  getOperationalResourceStatus,
  normalizeOperationalResourcesState,
} from '@/core/operationalResources/operationalResourceState';
import type {
  OperationalResourcesState,
  PersonnelGroupState,
  VehicleGroupState,
} from '@/core/operationalResources/operationalResourceTypes';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  OPERATIONAL_RESOURCE_PRESENCE_LITE_DISTRICT_LABELS,
  OPERATIONAL_RESOURCE_PRESENCE_LITE_FALLBACK_LINE,
  OPERATIONAL_RESOURCE_PRESENCE_LITE_FORBIDDEN_WORDS,
  OPERATIONAL_RESOURCE_PRESENCE_LITE_MAX_COPY_LENGTH,
  OPERATIONAL_RESOURCE_PRESENCE_LITE_MAX_VISIBLE_GROUPS,
  OPERATIONAL_RESOURCE_PRESENCE_SIGNAL_STATUS_WEIGHT,
  TEAM_GROUP_DEFINITIONS,
  TEAM_GROUP_ORDER,
  TEAM_GROUP_STATUS_LABELS,
  VEHICLE_GROUP_DEFINITIONS,
  VEHICLE_GROUP_ORDER,
  VEHICLE_GROUP_STATUS_LABELS,
} from './operationalResourcePresenceConstants';
import type {
  OperationalResourcePresenceLiteInput,
  OperationalResourcePresenceLiteModel,
  OperationalResourcePresenceLitePriority,
  OperationalResourcePresenceLiteSourceSignals,
  OperationalResourcePresenceLiteVisibility,
  PresenceBand,
  MaintenanceBand,
  TeamGroupKind,
  TeamGroupPresence,
  TeamGroupStatus,
  VehicleGroupKind,
  VehicleGroupPresence,
  VehicleGroupStatus,
} from './operationalResourcePresenceTypes';

function cleanText(value: string | null | undefined, limit = OPERATIONAL_RESOURCE_PRESENCE_LITE_MAX_COPY_LENGTH): string {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

export function normalizeOperationalResourcePresenceText(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{Letter}\p{Number}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function operationalResourcePresenceContainsForbiddenWords(
  text: string | null | undefined,
): boolean {
  if (!text?.trim()) return false;
  const normalized = normalizeOperationalResourcePresenceText(text);
  return OPERATIONAL_RESOURCE_PRESENCE_LITE_FORBIDDEN_WORDS.some((word) =>
    normalized.includes(normalizeOperationalResourcePresenceText(word)),
  );
}

export function isOperationalResourcePresenceDuplicate(
  line: string | null | undefined,
  existingLines: string[] = [],
): boolean {
  if (!line?.trim()) return true;
  const normalized = normalizeOperationalResourcePresenceText(line);
  return existingLines.some((existing) => {
    const other = normalizeOperationalResourcePresenceText(existing);
    if (!other) return false;
    if (other === normalized) return true;
    if (normalized.length >= 22 && other.includes(normalized.slice(0, 22))) return true;
    if (other.length >= 22 && normalized.includes(other.slice(0, 22))) return true;
    return false;
  });
}

function sanitizeCopy(text: string, fallback: string): string {
  const cleaned = cleanText(text);
  if (!cleaned || operationalResourcePresenceContainsForbiddenWords(cleaned)) {
    return cleanText(fallback);
  }
  return cleaned;
}

function scoreToBand(score: number): PresenceBand {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function maintenanceScoreToBand(score: number): MaintenanceBand {
  if (score >= 70) return 'risk';
  if (score >= 40) return 'watch';
  return 'ok';
}

function signalWeight(status?: string): number {
  return OPERATIONAL_RESOURCE_PRESENCE_SIGNAL_STATUS_WEIGHT[status ?? 'stable'] ?? 0;
}

function resolveDistrictId(input: OperationalResourcePresenceLiteInput): MapDistrictId {
  const raw =
    input.focusDistrictId ??
    input.operationSignals?.priorityDistrictId ??
    input.contentPackMeta?.districtId ??
    'merkez';
  return normalizeMapDistrictId(raw) ?? 'merkez';
}

function districtLabel(id: MapDistrictId | string | undefined): string {
  if (!id) return 'saha';
  const normalized = normalizeMapDistrictId(id) ?? 'merkez';
  return OPERATIONAL_RESOURCE_PRESENCE_LITE_DISTRICT_LABELS[normalized] ?? normalized;
}

function isPostPilot(input: OperationalResourcePresenceLiteInput): boolean {
  return (
    input.isPostPilot === true ||
    input.isPilotCompleted === true ||
    (input.day ?? 1) >= POST_PILOT_FIRST_OPERATION_DAY
  );
}

export function buildOperationalResourcePresenceLiteVisibility(
  input: OperationalResourcePresenceLiteInput = {},
): OperationalResourcePresenceLiteVisibility {
  const day = input.day ?? 1;
  if (day <= 1) return 'hidden';
  if (day <= 3) return 'compact';
  if (day <= 7) return 'standard';
  if (isPostPilot(input) && input.accessMode === 'full') return 'detailed_preview';
  if (isPostPilot(input)) return 'standard';
  return 'standard';
}

function personnelToTeamStatus(group: PersonnelGroupState): TeamGroupStatus {
  const pressure = group.workloadScore * 0.55 + group.fatigueScore * 0.45;
  const status = getOperationalResourceStatus(pressure);
  if (status === 'critical') return group.trend === 'improving' ? 'recovering' : 'fatigued';
  if (status === 'strained') return group.fatigueScore >= group.workloadScore ? 'fatigued' : 'busy';
  if (status === 'busy') return group.usedToday ? 'assigned' : 'busy';
  return group.usedToday ? 'assigned' : 'ready';
}

function vehicleToStatus(group: VehicleGroupState): VehicleGroupStatus {
  const pressure =
    group.capacityPressure * 0.4 + group.maintenanceRisk * 0.35 + group.routePressure * 0.25;
  const status = getOperationalResourceStatus(pressure);
  if (group.maintenanceRisk >= 60 && group.id === 'maintenance_vehicle') return 'maintenance_watch';
  if (group.routePressure >= 60) return 'route_pressure';
  if (group.routePressure >= 60 && group.maintenanceRisk < 50) return 'fatigue_watch';
  if (status === 'critical' || status === 'strained') {
    return group.maintenanceRisk >= 50 ? 'maintenance_watch' : 'fatigue_watch';
  }
  if (status === 'busy') return group.usedToday ? 'assigned' : 'route_pressure';
  if (group.capacityPressure >= 60) return 'limited';
  return group.usedToday ? 'assigned' : 'ready';
}

function priorityFromBands(workload: PresenceBand, fatigue: PresenceBand): OperationalResourcePresenceLitePriority {
  if (workload === 'high' || fatigue === 'high') return 'high';
  if (workload === 'medium' || fatigue === 'medium') return 'medium';
  return 'low';
}

function buildTeamLine(
  kind: TeamGroupKind,
  status: TeamGroupStatus,
  districtName: string,
  workloadBand: PresenceBand,
  fatigueBand: PresenceBand,
): string {
  const def = TEAM_GROUP_DEFINITIONS[kind];
  const label = def.label.toLocaleLowerCase('tr-TR');

  if (kind === 'route_team' && (status === 'busy' || status === 'assigned')) {
    return `${def.label} ${districtName} hattında yoğun.`;
  }
  if (kind === 'route_team' && status === 'watch') {
    return `${def.label} ${districtName} tarafında izleme notunda.`;
  }
  if (kind === 'cleanup_team' && status === 'busy') {
    return `${def.label} bugün ${districtName} hattında yoğun.`;
  }
  if (kind === 'container_team') {
    return `${def.label} görünür hizmet etkisini destekliyor.`;
  }
  if (kind === 'rapid_response_team' && status === 'ready') {
    return `${def.label} hazır, fakat ekip temposu yükseliyor.`;
  }
  if (kind === 'support_team' && status === 'watch') {
    return `${def.label} ${districtName} çevresinde izleme notunda.`;
  }
  if (status === 'fatigued') {
    return `${def.label} temposu yükseldi; yarın izlenmeli.`;
  }
  if (status === 'recovering') {
    return `${def.label} toparlanma çizgisinde.`;
  }
  if (workloadBand === 'high') {
    return `${def.label} bugün ${districtName} hattında yoğun.`;
  }
  if (fatigueBand === 'high') {
    return `${label} yorgunluk izleniyor.`;
  }
  return def.fallbackLine;
}

function buildTeamDetailLine(
  kind: TeamGroupKind,
  status: TeamGroupStatus,
  districtName: string,
  workloadBand: PresenceBand,
  fatigueBand: PresenceBand,
): string {
  if (status === 'busy' || status === 'assigned') {
    if (kind === 'route_team') {
      return `${districtName} hattında rota baskısını dengelemeye çalışıyor.`;
    }
    return `Ekip temposu ${workloadBand === 'high' ? 'yüksek' : 'orta-yüksek'}, yarın izlenmeli.`;
  }
  if (status === 'fatigued' || fatigueBand === 'high') {
    return 'Ekip temposu yükseldi; yarın personel dengesi izlenmeli.';
  }
  if (status === 'watch') {
    return `${districtName} tarafında izleme notu sürüyor.`;
  }
  if (kind === 'coordination_team') {
    return 'Saha akışı bir arada tutuluyor; tempo dengeli.';
  }
  return 'Günlük plan ve atamalarla uyumlu tempo.';
}

function buildVehicleLine(
  kind: VehicleGroupKind,
  status: VehicleGroupStatus,
  districtName: string,
  capacityBand: PresenceBand,
  fatigueBand: PresenceBand,
  maintenanceBand: MaintenanceBand,
): string {
  const def = VEHICLE_GROUP_DEFINITIONS[kind];

  if (kind === 'route_support_vehicle' && (status === 'route_pressure' || status === 'assigned')) {
    return `${def.label} ${districtName} hattında baskı altında.`;
  }
  if (kind === 'container_vehicle' && status !== 'ready') {
    return `${def.label} ${districtName} çevresinde izleme notunda.`;
  }
  if (kind === 'light_service_vehicle' && fatigueBand === 'low') {
    return `${def.label}nda yorgunluk düşük.`;
  }
  if (maintenanceBand === 'watch' || status === 'maintenance_watch') {
    return 'Araç kapasitesi yeterli, fakat bakım izleme sürüyor.';
  }
  if (status === 'fatigue_watch') {
    return `${def.label} yorgunluğu izleniyor.`;
  }
  if (capacityBand === 'high') {
    return `${def.label} bugün yoğun kullanımda.`;
  }
  if (status === 'limited') {
    return `${def.label} sınırlı kapasiteyle devam ediyor.`;
  }
  return def.fallbackLine;
}

function buildVehicleDetailLine(
  kind: VehicleGroupKind,
  status: VehicleGroupStatus,
  districtName: string,
  fatigueBand: PresenceBand,
): string {
  if (status === 'route_pressure' || kind === 'route_support_vehicle') {
    return 'Yarın rota kararları bu baskıyı etkileyebilir.';
  }
  if (status === 'fatigue_watch' || fatigueBand === 'high') {
    return 'Bugünkü hızlı müdahale araç yorgunluğunu artırdı.';
  }
  if (status === 'maintenance_watch') {
    return 'Bakım izleme sürüyor; kapasite dengeli tutulmalı.';
  }
  if (kind === 'container_vehicle') {
    return `${districtName} çevresinde konteyner hizmeti destekleniyor.`;
  }
  return 'Araç grubu günlük planla uyumlu tempo içinde.';
}

function buildTeamGroupFromPersonnel(
  kind: TeamGroupKind,
  group: PersonnelGroupState,
  districtName: string,
  priorityBoost: number,
): TeamGroupPresence {
  const def = TEAM_GROUP_DEFINITIONS[kind];
  const workloadBand = scoreToBand(group.workloadScore);
  const fatigueBand = scoreToBand(group.fatigueScore);
  const moraleBand = scoreToBand(100 - group.moraleScore);
  const status = personnelToTeamStatus(group);
  const priority = priorityFromBands(workloadBand, fatigueBand);
  const priorityScore =
    (priority === 'high' ? 3 : priority === 'medium' ? 2 : 1) + priorityBoost;

  return {
    id: kind,
    label: def.label,
    kind,
    status,
    workloadBand,
    fatigueBand,
    moraleBand: moraleBand !== 'low' ? moraleBand : undefined,
    districtFocus: districtName,
    line: buildTeamLine(kind, status, districtName, workloadBand, fatigueBand),
    detailLine: buildTeamDetailLine(kind, status, districtName, workloadBand, fatigueBand),
    iconKey: def.iconKey,
    priority: priorityScore >= 4 ? 'high' : priorityScore >= 3 ? 'medium' : priority,
  };
}

function buildVehicleGroupFromState(
  kind: VehicleGroupKind,
  group: VehicleGroupState,
  districtName: string,
  priorityBoost: number,
): VehicleGroupPresence {
  const def = VEHICLE_GROUP_DEFINITIONS[kind];
  const capacityBand = scoreToBand(group.capacityPressure);
  const fatigueBand = scoreToBand(group.routePressure);
  const maintenanceBand = maintenanceScoreToBand(group.maintenanceRisk);
  const status = vehicleToStatus(group);
  const priority = priorityFromBands(capacityBand, fatigueBand);
  const priorityScore =
    (priority === 'high' ? 3 : priority === 'medium' ? 2 : 1) + priorityBoost;

  return {
    id: kind,
    label: def.label,
    kind,
    status,
    capacityBand,
    fatigueBand,
    maintenanceBand,
    districtFocus: districtName,
    line: buildVehicleLine(kind, status, districtName, capacityBand, fatigueBand, maintenanceBand),
    detailLine: buildVehicleDetailLine(kind, status, districtName, fatigueBand),
    iconKey: def.iconKey,
    priority: priorityScore >= 4 ? 'high' : priorityScore >= 3 ? 'medium' : priority,
  };
}

function resolveResources(input: OperationalResourcePresenceLiteInput): OperationalResourcesState {
  if (input.operationalResources) return input.operationalResources;
  if (input.resourceFatigue && typeof input.resourceFatigue === 'object') {
    return normalizeOperationalResourcesState(input.resourceFatigue, input.day ?? 1);
  }
  return normalizeOperationalResourcesState(undefined, input.day ?? 1);
}

function packBoostForTeam(kind: TeamGroupKind, packId?: string, variantKind?: string): number {
  if (packId === 'vehicle_route_pack_one') {
    return kind === 'route_team' ? 2 : 0;
  }
  if (packId === 'container_environment_pack_one') {
    return kind === 'container_team' || kind === 'cleanup_team' ? 2 : 0;
  }
  if (packId === 'district_pack_one') {
    return kind === 'coordination_team' || kind === 'support_team' ? 2 : 0;
  }
  if (variantKind === 'resource_fatigue') return 1;
  if (variantKind === 'personnel_coordination') {
    return kind === 'coordination_team' || kind === 'support_team' ? 2 : 0;
  }
  return 0;
}

function packBoostForVehicle(kind: VehicleGroupKind, packId?: string, variantKind?: string): number {
  if (packId === 'vehicle_route_pack_one') {
    return kind === 'route_support_vehicle' ? 2 : 0;
  }
  if (packId === 'container_environment_pack_one') {
    return kind === 'container_vehicle' ? 2 : 0;
  }
  if (variantKind === 'resource_fatigue') {
    return kind === 'route_support_vehicle' || kind === 'light_service_vehicle' ? 1 : 0;
  }
  return 0;
}

function signalBoostForTeam(kind: TeamGroupKind, input: OperationalResourcePresenceLiteInput): number {
  const signals = input.operationSignals;
  if (!signals) return 0;
  const personnelWeight = signalWeight(signals.personnel?.status);
  if (personnelWeight >= 2 && (kind === 'route_team' || kind === 'rapid_response_team')) {
    return personnelWeight;
  }
  if (signalWeight(signals.containers?.status) >= 2 && kind === 'container_team') return 2;
  if (signalWeight(signals.districts?.status) >= 2 && kind === 'coordination_team') return 2;
  return 0;
}

function signalBoostForVehicle(kind: VehicleGroupKind, input: OperationalResourcePresenceLiteInput): number {
  const signals = input.operationSignals;
  if (!signals) return 0;
  const vehicleWeight = signalWeight(signals.vehicles?.status);
  if (vehicleWeight >= 2 && kind === 'route_support_vehicle') return vehicleWeight;
  if (signalWeight(signals.containers?.status) >= 2 && kind === 'container_vehicle') return 2;
  return 0;
}

function applyPackStatusOverrides(
  team: TeamGroupPresence,
  vehicle: VehicleGroupPresence | undefined,
  packId?: string,
  variantKind?: string,
  domain?: string,
): { team: TeamGroupPresence; vehicle?: VehicleGroupPresence } {
  let nextTeam = team;
  let nextVehicle = vehicle;

  if (variantKind === 'resource_fatigue') {
    if (nextTeam.kind === 'route_team' || nextTeam.kind === 'rapid_response_team') {
      nextTeam = { ...nextTeam, status: 'fatigued' };
    }
    if (nextVehicle?.kind === 'route_support_vehicle') {
      nextVehicle = { ...nextVehicle, status: 'fatigue_watch' };
    }
  }

  if (domain === 'vehicle_maintenance' || packId === 'vehicle_route_pack_one') {
    if (nextVehicle?.kind === 'maintenance_watch_vehicle' || nextVehicle?.kind === 'field_support_vehicle') {
      nextVehicle = {
        ...nextVehicle,
        status: 'maintenance_watch',
        maintenanceBand: 'watch',
      };
    }
  }

  if (packId === 'vehicle_route_pack_one') {
    if (nextTeam.kind === 'route_team') {
      nextTeam = { ...nextTeam, status: 'busy' };
    }
    if (nextVehicle?.kind === 'route_support_vehicle') {
      nextVehicle = { ...nextVehicle, status: 'route_pressure' };
    }
  }

  if (packId === 'container_environment_pack_one') {
    if (nextTeam.kind === 'container_team') {
      nextTeam = { ...nextTeam, status: 'assigned' };
    }
    if (nextVehicle?.kind === 'container_vehicle') {
      nextVehicle = { ...nextVehicle, status: 'assigned' };
    }
  }

  if (packId === 'district_pack_one') {
    if (nextTeam.kind === 'support_team') {
      nextTeam = { ...nextTeam, status: 'watch' };
    }
  }

  return { team: nextTeam, vehicle: nextVehicle };
}

function buildTeamGroups(input: OperationalResourcePresenceLiteInput): TeamGroupPresence[] {
  const resources = resolveResources(input);
  const districtName = districtLabel(resolveDistrictId(input));
  const packMeta =
    input.contentPackMeta ??
    resolveContentPackMetaForWiring({
      contentPackMeta: input.contentPackMeta,
      districtId: resolveDistrictId(input),
      day: input.day,
    });

  const mapping: Record<TeamGroupKind, PersonnelGroupState> = {
    cleanup_team: resources.personnelGroups.field_team,
    route_team: resources.personnelGroups.field_team,
    container_team: resources.personnelGroups.technical_team,
    support_team: resources.personnelGroups.public_relations_team,
    rapid_response_team: resources.personnelGroups.field_team,
    coordination_team: resources.personnelGroups.public_relations_team,
  };

  return TEAM_GROUP_ORDER.map((kind) => {
    const group = mapping[kind];
    const boost =
      packBoostForTeam(kind, packMeta?.packId, packMeta?.variantKind) +
      signalBoostForTeam(kind, input);
    let presence = buildTeamGroupFromPersonnel(kind, group, districtName, boost);
    const vehicleKind =
      kind === 'route_team'
        ? 'route_support_vehicle'
        : kind === 'container_team'
          ? 'container_vehicle'
          : undefined;
    const vehicleState = vehicleKind
      ? resources.vehicleGroups[
          vehicleKind === 'route_support_vehicle' ? 'route_support_vehicle' : 'standard_truck'
        ]
      : undefined;
    const vehiclePresence = vehicleState
      ? buildVehicleGroupFromState(
          vehicleKind!,
          vehicleState,
          districtName,
          packBoostForVehicle(vehicleKind!, packMeta?.packId, packMeta?.variantKind),
        )
      : undefined;
    const overridden = applyPackStatusOverrides(
      presence,
      vehiclePresence,
      packMeta?.packId,
      packMeta?.variantKind,
      packMeta?.domain,
    );
    presence = {
      ...overridden.team,
      line: buildTeamLine(
        kind,
        overridden.team.status,
        districtName,
        presence.workloadBand,
        presence.fatigueBand,
      ),
      detailLine: buildTeamDetailLine(
        kind,
        overridden.team.status,
        districtName,
        presence.workloadBand,
        presence.fatigueBand,
      ),
      priority:
        boost >= 2 ? 'high' : presence.priority,
    };
    return presence;
  }).sort((a, b) => {
    const rank = (p: OperationalResourcePresenceLitePriority) =>
      p === 'high' ? 3 : p === 'medium' ? 2 : 1;
    return rank(b.priority) - rank(a.priority);
  });
}

function buildVehicleGroups(input: OperationalResourcePresenceLiteInput): VehicleGroupPresence[] {
  const resources = resolveResources(input);
  const districtName = districtLabel(resolveDistrictId(input));
  const packMeta =
    input.contentPackMeta ??
    resolveContentPackMetaForWiring({
      contentPackMeta: input.contentPackMeta,
      districtId: resolveDistrictId(input),
      day: input.day,
    });

  const mapping: Record<VehicleGroupKind, VehicleGroupState> = {
    light_service_vehicle: resources.vehicleGroups.standard_truck,
    route_support_vehicle: resources.vehicleGroups.route_support_vehicle,
    container_vehicle: resources.vehicleGroups.standard_truck,
    field_support_vehicle: resources.vehicleGroups.maintenance_vehicle,
    maintenance_watch_vehicle: resources.vehicleGroups.maintenance_vehicle,
  };

  const resourceBlob = JSON.stringify(input.resourceFatigue ?? resources).toLocaleLowerCase('tr-TR');
  const highFatigue =
    resourceBlob.includes('tired') ||
    resourceBlob.includes('fatigue') ||
    resourceBlob.includes('yorgun') ||
    signalWeight(input.operationSignals?.vehicles?.status) >= 3;

  return VEHICLE_GROUP_ORDER.map((kind) => {
    const group = mapping[kind];
    const boost =
      packBoostForVehicle(kind, packMeta?.packId, packMeta?.variantKind) +
      signalBoostForVehicle(kind, input);
    let presence = buildVehicleGroupFromState(kind, group, districtName, boost);

    if (highFatigue && (kind === 'route_support_vehicle' || kind === 'light_service_vehicle')) {
      presence = { ...presence, status: 'fatigue_watch', fatigueBand: 'high' };
    }

    if (packMeta?.domain === 'vehicle_maintenance' && kind === 'maintenance_watch_vehicle') {
      presence = {
        ...presence,
        status: 'maintenance_watch',
        maintenanceBand: 'watch',
        priority: 'high',
      };
    }

    if (packMeta?.domain === 'vehicle_maintenance' && kind === 'field_support_vehicle') {
      presence = {
        ...presence,
        status: 'maintenance_watch',
        maintenanceBand: 'watch',
        priority: 'medium',
      };
    }

    if (packMeta?.packId === 'vehicle_route_pack_one' && kind === 'route_support_vehicle') {
      presence = { ...presence, status: 'route_pressure' };
    }

    presence = {
      ...presence,
      line: buildVehicleLine(
        kind,
        presence.status,
        districtName,
        presence.capacityBand,
        presence.fatigueBand,
        presence.maintenanceBand,
      ),
      detailLine: buildVehicleDetailLine(kind, presence.status, districtName, presence.fatigueBand),
      priority: boost >= 2 ? 'high' : presence.priority,
    };

    return presence;
  }).sort((a, b) => {
    const rank = (p: OperationalResourcePresenceLitePriority) =>
      p === 'high' ? 3 : p === 'medium' ? 2 : 1;
    return rank(b.priority) - rank(a.priority);
  });
}

function pickPrimaryPressureLine(
  teams: TeamGroupPresence[],
  vehicles: VehicleGroupPresence[],
  existing: string[],
): string {
  const candidates = [
    ...vehicles.filter((v) => v.priority === 'high').map((v) => v.line),
    ...teams.filter((t) => t.priority === 'high').map((t) => t.line),
    ...vehicles.filter((v) => v.priority === 'medium').map((v) => v.line),
    ...teams.filter((t) => t.priority === 'medium').map((t) => t.line),
    vehicles[0]?.line,
    teams[0]?.line,
    OPERATIONAL_RESOURCE_PRESENCE_LITE_FALLBACK_LINE,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const line = sanitizeCopy(candidate!, OPERATIONAL_RESOURCE_PRESENCE_LITE_FALLBACK_LINE);
    if (!isOperationalResourcePresenceDuplicate(line, existing)) return line;
  }
  return sanitizeCopy(OPERATIONAL_RESOURCE_PRESENCE_LITE_FALLBACK_LINE, OPERATIONAL_RESOURCE_PRESENCE_LITE_FALLBACK_LINE);
}

function buildSourceSignals(
  input: OperationalResourcePresenceLiteInput,
  packId?: string,
): OperationalResourcePresenceLiteSourceSignals {
  const signals = input.operationSignals;
  return {
    hasOperationSignals: Boolean(signals),
    hasResourceFatigue: Boolean(input.resourceFatigue ?? input.operationalResources),
    hasContentPack: Boolean(input.contentPackMeta),
    hasDecisionImpact: Boolean(input.decisionImpact),
    hasTomorrowRisk: Boolean(input.tomorrowRisk?.mainLine),
    hasCityEcho: Boolean(input.cityEcho),
    hasVehicleRoutePack: packId === 'vehicle_route_pack_one',
    hasContainerPack: packId === 'container_environment_pack_one',
    hasDistrictPack: packId === 'district_pack_one',
    personnelPressure: signalWeight(signals?.personnel?.status) >= 2,
    vehiclePressure: signalWeight(signals?.vehicles?.status) >= 2,
    containerPressure: signalWeight(signals?.containers?.status) >= 2,
  };
}

export function getTeamGroupStatusLabel(status: TeamGroupStatus): string {
  return TEAM_GROUP_STATUS_LABELS[status];
}

export function getVehicleGroupStatusLabel(status: VehicleGroupStatus): string {
  return VEHICLE_GROUP_STATUS_LABELS[status];
}

function slicePresenceGroups<T extends { kind: string }>(
  groups: T[],
  max: number,
  requiredKinds: string[] = [],
): T[] {
  const selected: T[] = [];
  const seen = new Set<string>();
  for (const kind of requiredKinds) {
    const item = groups.find((group) => group.kind === kind);
    if (item) {
      selected.push(item);
      seen.add(kind);
    }
  }
  for (const item of groups) {
    if (selected.length >= max) break;
    if (seen.has(item.kind)) continue;
    selected.push(item);
    seen.add(item.kind);
  }
  return selected.slice(0, max);
}

function requiredVehicleKinds(input: OperationalResourcePresenceLiteInput): string[] {
  const domain = input.contentPackMeta?.domain;
  if (domain === 'vehicle_maintenance') return ['maintenance_watch_vehicle'];
  if (input.contentPackMeta?.packId === 'container_environment_pack_one') {
    return ['container_vehicle'];
  }
  if (input.contentPackMeta?.packId === 'vehicle_route_pack_one') {
    return ['route_support_vehicle'];
  }
  return [];
}

function requiredTeamKinds(input: OperationalResourcePresenceLiteInput): string[] {
  if (input.contentPackMeta?.packId === 'vehicle_route_pack_one') return ['route_team'];
  if (input.contentPackMeta?.packId === 'container_environment_pack_one') return ['container_team'];
  if (input.contentPackMeta?.packId === 'district_pack_one') return ['support_team'];
  return [];
}

export function buildOperationalResourcePresenceLiteModel(
  input: OperationalResourcePresenceLiteInput = {},
): OperationalResourcePresenceLiteModel {
  const day = input.day ?? 1;
  const visibility = buildOperationalResourcePresenceLiteVisibility(input);
  const existing = [
    ...(input.existingLines ?? []),
    input.decisionImpact?.mainLine ?? '',
    input.tomorrowRisk?.mainLine ?? '',
    input.cityEcho?.reportLine ?? '',
    input.cityEcho?.eceLine ?? '',
    input.mainOperationScopeHintLine ?? '',
    input.operationSignalsSummaryLine ?? '',
    input.resourceFatigueSummaryLine ?? '',
    input.districtReportCardLine ?? '',
    input.cityJournalLine ?? '',
    input.mapResourceOverlayLine ?? '',
  ].filter(Boolean);

  const teamGroupsRaw = buildTeamGroups(input);
  const vehicleGroupsRaw = buildVehicleGroups(input);

  const maxGroups =
    visibility === 'compact'
      ? 1
      : visibility === 'standard'
        ? 3
        : OPERATIONAL_RESOURCE_PRESENCE_LITE_MAX_VISIBLE_GROUPS;

  const teamGroups = slicePresenceGroups(teamGroupsRaw, maxGroups, requiredTeamKinds(input));
  const vehicleGroups = slicePresenceGroups(vehicleGroupsRaw, maxGroups, requiredVehicleKinds(input));

  const primaryPressureLine = pickPrimaryPressureLine(teamGroupsRaw, vehicleGroupsRaw, existing);

  let hubLine: string | undefined;
  if (visibility !== 'hidden') {
    const vehicleLine = vehicleGroupsRaw.find((v) => v.priority === 'high')?.line ?? vehicleGroupsRaw[0]?.line;
    const teamLine = teamGroupsRaw.find((t) => t.priority === 'high')?.line ?? teamGroupsRaw[0]?.line;
    const combined = [vehicleLine, teamLine].filter(Boolean).join(' ');
    hubLine = sanitizeCopy(
      combined || primaryPressureLine,
      primaryPressureLine,
    );
    if (isOperationalResourcePresenceDuplicate(hubLine, existing)) {
      hubLine = sanitizeCopy(
        teamGroupsRaw[0]?.line ?? primaryPressureLine,
        primaryPressureLine,
      );
    }
  }

  let mapPresenceLine: string | undefined;
  if (visibility !== 'hidden' && day > 2) {
    const districtName = districtLabel(resolveDistrictId(input));
    const topVehicle = vehicleGroupsRaw[0];
    if (topVehicle?.status === 'route_pressure') {
      mapPresenceLine = sanitizeCopy(
        `Araç baskısı ${districtName} hattında izleniyor.`,
        `Araç baskısı ${districtName} hattında izleniyor.`,
      );
    } else if (topVehicle?.status === 'fatigue_watch') {
      mapPresenceLine = sanitizeCopy(
        `Araç yorgunluğu ${districtName} rotasında izleniyor.`,
        `Araç yorgunluğu ${districtName} rotasında izleniyor.`,
      );
    } else {
      const topTeam = teamGroupsRaw[0];
      if (topTeam && topTeam.workloadBand !== 'low') {
        mapPresenceLine = sanitizeCopy(
          `Ekip temposu ${districtName} çevresinde yükseldi.`,
          `Ekip temposu ${districtName} çevresinde yükseldi.`,
        );
      } else if (topVehicle?.kind === 'container_vehicle') {
        mapPresenceLine = sanitizeCopy(
          'Konteyner aracı grubu izleme notunda.',
          'Konteyner aracı grubu izleme notunda.',
        );
      }
    }
    if (mapPresenceLine && isOperationalResourcePresenceDuplicate(mapPresenceLine, [...existing, hubLine ?? ''])) {
      mapPresenceLine = undefined;
    }
  }

  let reportLine: string | undefined;
  if (day >= 4 && visibility !== 'hidden') {
    const vehicleNote = vehicleGroupsRaw.find((v) => v.status === 'fatigue_watch' || v.status === 'route_pressure');
    if (vehicleNote) {
      reportLine = sanitizeCopy(
        `Bugünkü karar saha etkisini taşıdı; ${vehicleNote.label.toLocaleLowerCase('tr-TR')} yarına izleme notu bıraktı.`,
        primaryPressureLine,
      );
    }
    if (reportLine && isOperationalResourcePresenceDuplicate(reportLine, [...existing, input.decisionImpact?.mainLine ?? ''])) {
      reportLine = undefined;
    }
  }

  let eceLine: string | undefined;
  if (day >= 4 && input.cityEcho?.eceLine) {
    eceLine = sanitizeCopy(
      input.cityEcho.eceLine,
      'Bugün rota desteği işe yaradı; araç yorgunluğunu üst üste zorlamamak daha güvenli.',
    );
  } else if (day >= 8 && vehicleGroupsRaw.some((v) => v.status === 'fatigue_watch')) {
    eceLine = sanitizeCopy(
      'Bugün rota desteği işe yaradı; araç yorgunluğunu üst üste zorlamamak daha güvenli.',
      'Ekip ve araç temposunu birlikte izlemek daha güvenli.',
    );
  }

  const packMeta = input.contentPackMeta;
  const sourceSignals = buildSourceSignals(input, packMeta?.packId);

  const dominantKind = vehicleGroupsRaw[0]?.priority === 'high' ? vehicleGroupsRaw[0]?.kind : teamGroupsRaw[0]?.kind;

  return {
    day,
    visibility,
    teamGroups,
    vehicleGroups,
    primaryPressureLine,
    mapPresenceLine,
    reportLine,
    hubLine: visibility === 'hidden' ? undefined : hubLine,
    eceLine,
    sourceSignals,
    maxVisibleGroups: maxGroups,
    duplicateKey: [
      dominantKind ?? 'fallback',
      resolveDistrictId(input),
      packMeta?.domain ?? 'none',
      packMeta?.familyId ?? 'none',
    ].join(':'),
  };
}

export function shouldShowOperationalResourcePresenceLite(
  model: OperationalResourcePresenceLiteModel | null | undefined,
): boolean {
  return Boolean(model && model.visibility !== 'hidden');
}

export function collectOperationalResourcePresenceVisibleLines(
  model: OperationalResourcePresenceLiteModel | null | undefined,
): string[] {
  if (!model) return [];
  return [
    model.primaryPressureLine,
    model.hubLine ?? '',
    model.mapPresenceLine ?? '',
    model.reportLine ?? '',
    model.eceLine ?? '',
    ...model.teamGroups.map((g) => g.line),
    ...model.vehicleGroups.map((g) => g.line),
  ].filter(Boolean);
}
