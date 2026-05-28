import { normalizeContainerNeighborhoodId } from '@/core/containers/containerNeighborhoodBridge';
import type { DailyEventSet } from '@/core/models/DailyEventSet';
import type { EventCard } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import type { EventDecision, EventRiskLevel } from '@/core/models/EventCard';

import {
  createInitialVehicleState,
  recomputeVehicleAggregates,
} from './vehicleSeed';
import type {
  VehicleNeighborhoodId,
  VehicleState,
  VehicleUnit,
} from './vehicleTypes';

export type VehicleEventSignalType =
  | 'vehicle_breakdown'
  | 'route_delay'
  | 'maintenance_need'
  | 'fleet_capacity_shortage'
  | 'fuel_pressure'
  | 'inspection_gap';

export type VehicleEventSignalSeverity = 'low' | 'medium' | 'high' | 'critical';

export type VehicleEventSignal = {
  type: VehicleEventSignalType;
  severity: VehicleEventSignalSeverity;
  neighborhoodId?: string | null;
  vehicleId?: string | null;
  weightBoost: number;
  reason: string;
  eventTags: string[];
};

export type VehicleEventSignalContext = {
  day: number;
  activeDistrictId?: string | null;
  tutorialActive?: boolean;
};

const DAY1_VEHICLE_BOOST_MULTIPLIER = 0;
export const MAX_VEHICLE_EVENT_WEIGHT_BOOST = 0.22;
export const MAX_COMBINED_SIGNAL_BOOST = 0.35;
export const VEHICLE_DRIVEN_SUPPLEMENT_ID_PREFIX = 'vehicle-signal-';

/** Sinyal yokken havuzdaki araç adaylarının seçim ağırlığı çarpanı. */
const VEHICLE_CANDIDATE_SUPPRESSION_FACTOR = 0.2;

const SIGNAL_TYPE_PRIORITY: Record<VehicleEventSignalType, number> = {
  vehicle_breakdown: 6,
  fleet_capacity_shortage: 5,
  maintenance_need: 4,
  route_delay: 3,
  fuel_pressure: 2,
  inspection_gap: 1,
};

const SEVERITY_PRIORITY: Record<VehicleEventSignalSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const WEIGHT_BOOST_BY_SIGNAL: Record<
  VehicleEventSignalType,
  Partial<Record<VehicleEventSignalSeverity, number>>
> = {
  vehicle_breakdown: { high: 0.16, critical: 0.22 },
  maintenance_need: { medium: 0.08, high: 0.14, critical: 0.18 },
  route_delay: { medium: 0.07, high: 0.13 },
  fleet_capacity_shortage: { medium: 0.08, high: 0.14, critical: 0.2 },
  fuel_pressure: { medium: 0.06, high: 0.11 },
  inspection_gap: { medium: 0.05 },
};

const LOW_SEVERITY_WEIGHT_BOOST = 0.03;

const PILOT_DISTRICT_LABELS: Record<PilotDistrictId, string> = {
  central: 'Merkez Pilot Bölge',
  cumhuriyet: 'Cumhuriyet Mahallesi',
  industrial_market: 'Sanayi & Pazar Bölgesi',
};

const VEHICLE_SIGNAL_TAG_HINTS: Record<VehicleEventSignalType, string[]> = {
  vehicle_breakdown: ['araç', 'arıza', 'bakım', 'filo', 'servis', 'vehicle'],
  maintenance_need: ['bakım', 'tamir', 'servis', 'ekipman', 'araç', 'maintenance'],
  route_delay: ['rota', 'gecikme', 'toplama', 'güzergah', 'yoğunluk', 'route'],
  fleet_capacity_shortage: [
    'kapasite',
    'takviye',
    'yoğun',
    'saha',
    'filo',
    'fleet',
  ],
  fuel_pressure: ['yakıt', 'şarj', 'ikmal', 'fuel'],
  inspection_gap: ['denetim', 'kontrol', 'devriye', 'inspection'],
};

const VEHICLE_EVENT_KEYWORDS: Record<VehicleEventSignalType, string[]> = {
  vehicle_breakdown: [
    'araç',
    'arac',
    'arıza',
    'ariza',
    'bakım',
    'bakim',
    'filo',
    'servis',
    'vehicle',
    'breakdown',
  ],
  maintenance_need: [
    'bakım',
    'bakim',
    'tamir',
    'servis',
    'ekipman',
    'araç',
    'arac',
    'maintenance',
  ],
  route_delay: [
    'rota',
    'gecikme',
    'toplama',
    'güzergah',
    'guzergah',
    'yoğunluk',
    'yogunluk',
    'route',
    'delay',
  ],
  fleet_capacity_shortage: [
    'kapasite',
    'takviye',
    'yoğun',
    'yogun',
    'saha aracı',
    'saha araci',
    'filo',
    'fleet',
    'capacity',
  ],
  fuel_pressure: ['yakıt', 'yakit', 'şarj', 'sarj', 'ikmal', 'fuel', 'charge'],
  inspection_gap: ['denetim', 'kontrol', 'devriye', 'inspection'],
};

const VEHICLE_CANDIDATE_TAG_TOKENS = [
  'vehicle',
  'fleet',
  'route',
  'maintenance',
  'araç',
  'filo',
  'rota',
] as const;

const VEHICLE_CANDIDATE_TYPE_TOKENS = [
  'vehicle',
  'fleet',
  'route',
  'maintenance',
] as const;

type SupplementTemplate = {
  title: string;
  description: string;
  riskLevel: EventRiskLevel;
  eventType: EventCard['eventType'];
};

const VEHICLE_SUPPLEMENT_TEMPLATES: Record<
  VehicleEventSignalType,
  SupplementTemplate
> = {
  vehicle_breakdown: {
    title: 'Araç Arızası Rota Planını Zorluyor',
    description:
      'Arızalı veya riskli araçlar günlük rota planını sıkıştırıyor; müdahale gecikebilir.',
    riskLevel: 'high',
    eventType: 'vehicle',
  },
  maintenance_need: {
    title: 'Filo Bakım İhtiyacı Artıyor',
    description:
      'Bakım ve kondisyon baskısı artıyor; sahada kullanılabilir filo kapasitesi daralıyor.',
    riskLevel: 'medium',
    eventType: 'vehicle',
  },
  route_delay: {
    title: 'Rota Gecikmesi Riski',
    description:
      'Rota verimliliği ve iş yükü dengesiz; toplama ve müdahale süreleri uzayabilir.',
    riskLevel: 'medium',
    eventType: 'vehicle',
  },
  fleet_capacity_shortage: {
    title: 'Müsait Araç Kapasitesi Düşüyor',
    description:
      'Müsait araç sayısı kritik seviyede; yoğun bölgelere ek takviye ihtiyacı doğuyor.',
    riskLevel: 'high',
    eventType: 'vehicle',
  },
  fuel_pressure: {
    title: 'Yakıt ve Şarj Baskısı Artıyor',
    description:
      'Filo ortalama yakıt/şarj seviyesi düşük; saha operasyonu için ikmal planı gerekli.',
    riskLevel: 'medium',
    eventType: 'vehicle',
  },
  inspection_gap: {
    title: 'Denetim Aracı Müsait Değil',
    description:
      'Denetim aracı sahada kullanılamıyor; kontrol ve devriye kapasitesi zayıflıyor.',
    riskLevel: 'medium',
    eventType: 'vehicle',
  },
};

function normalizeHaystack(
  eventType?: string | null,
  title?: string | null,
  category?: string | null,
): string {
  return [eventType, title, category]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(' ')
    .toLowerCase();
}

function weightBoostForSignal(
  type: VehicleEventSignalType,
  severity: VehicleEventSignalSeverity,
): number {
  if (severity === 'low') {
    return LOW_SEVERITY_WEIGHT_BOOST;
  }
  return WEIGHT_BOOST_BY_SIGNAL[type][severity] ?? 0;
}

function resolveNeighborhoodForVehicle(
  unit: VehicleUnit | undefined,
  context: VehicleEventSignalContext,
): VehicleNeighborhoodId | null {
  if (unit) {
    return unit.currentNeighborhoodId ?? unit.homeNeighborhoodId;
  }
  const fromDistrict = normalizeContainerNeighborhoodId(
    context.activeDistrictId ?? null,
  );
  return fromDistrict as VehicleNeighborhoodId | null;
}

function averageFuelOrCharge(units: VehicleUnit[]): number {
  if (units.length === 0) {
    return 100;
  }
  return Math.round(
    units.reduce((sum, unit) => sum + unit.fuelOrCharge, 0) / units.length,
  );
}

function findRiskiestBrokenVehicle(units: VehicleUnit[]): VehicleUnit | null {
  const broken = units.filter((unit) => unit.operationalStatus === 'broken');
  if (broken.length === 0) {
    return null;
  }
  return [...broken].sort((a, b) => b.breakdownRisk - a.breakdownRisk)[0] ?? null;
}

function buildVehicleBreakdownSignal(
  state: VehicleState,
  context: VehicleEventSignalContext,
): VehicleEventSignal | null {
  const { aggregates, units } = state;
  if (aggregates.broken <= 0) {
    return null;
  }

  const severity: VehicleEventSignalSeverity =
    aggregates.broken >= 2 ? 'critical' : 'high';
  const riskUnit = findRiskiestBrokenVehicle(units);

  return {
    type: 'vehicle_breakdown',
    severity,
    neighborhoodId: resolveNeighborhoodForVehicle(riskUnit ?? undefined, context),
    vehicleId: riskUnit?.id ?? null,
    weightBoost: weightBoostForSignal('vehicle_breakdown', severity),
    reason: `${aggregates.broken} araç arızalı`,
    eventTags: VEHICLE_SIGNAL_TAG_HINTS.vehicle_breakdown,
  };
}

function buildMaintenanceNeedSignal(
  state: VehicleState,
  context: VehicleEventSignalContext,
): VehicleEventSignal | null {
  const { aggregates, units } = state;
  const stressed =
    aggregates.criticalCount > 0 ||
    aggregates.averageCondition <= 50 ||
    aggregates.averageBreakdownRisk >= 50;

  if (!stressed) {
    return null;
  }

  let severity: VehicleEventSignalSeverity = 'medium';
  if (
    aggregates.criticalCount >= 2 ||
    aggregates.averageBreakdownRisk >= 65
  ) {
    severity = 'high';
  }
  if (aggregates.criticalCount >= 3 || aggregates.averageBreakdownRisk >= 80) {
    severity = 'critical';
  }

  const criticalUnit =
    [...units]
      .filter(
        (unit) =>
          unit.condition <= 35 ||
          unit.breakdownRisk >= 70 ||
          unit.maintenanceNeed >= 75,
      )
      .sort((a, b) => b.maintenanceNeed - a.maintenanceNeed)[0] ?? units[0];

  return {
    type: 'maintenance_need',
    severity,
    neighborhoodId: resolveNeighborhoodForVehicle(criticalUnit, context),
    vehicleId: criticalUnit?.id ?? null,
    weightBoost: weightBoostForSignal('maintenance_need', severity),
    reason: 'Filo bakım ve kondisyon baskısı yükseldi',
    eventTags: VEHICLE_SIGNAL_TAG_HINTS.maintenance_need,
  };
}

function buildRouteDelaySignal(
  state: VehicleState,
  context: VehicleEventSignalContext,
): VehicleEventSignal | null {
  const { aggregates } = state;
  const routeStressed =
    aggregates.averageRouteEfficiency <= 55 || aggregates.averageWorkload >= 70;

  if (!routeStressed) {
    return null;
  }

  let severity: VehicleEventSignalSeverity = 'medium';
  if (aggregates.averageWorkload >= 82 || aggregates.averageRouteEfficiency <= 45) {
    severity = 'high';
  }
  if (aggregates.available <= 2 && severity === 'medium') {
    severity = 'high';
  }

  return {
    type: 'route_delay',
    severity,
    neighborhoodId: normalizeContainerNeighborhoodId(
      context.activeDistrictId ?? null,
    ),
    vehicleId: null,
    weightBoost: weightBoostForSignal('route_delay', severity),
    reason: 'Rota verimliliği ve iş yükü dengesiz',
    eventTags: VEHICLE_SIGNAL_TAG_HINTS.route_delay,
  };
}

function buildFleetCapacityShortageSignal(
  state: VehicleState,
  context: VehicleEventSignalContext,
): VehicleEventSignal | null {
  const { aggregates } = state;
  if (aggregates.available > 2) {
    return null;
  }

  let severity: VehicleEventSignalSeverity = 'medium';
  if (aggregates.available <= 1) {
    severity = 'high';
  }
  if (aggregates.available === 0) {
    severity = 'critical';
  }

  return {
    type: 'fleet_capacity_shortage',
    severity,
    neighborhoodId: normalizeContainerNeighborhoodId(
      context.activeDistrictId ?? null,
    ),
    vehicleId: null,
    weightBoost: weightBoostForSignal('fleet_capacity_shortage', severity),
    reason: `Müsait araç sayısı: ${aggregates.available}`,
    eventTags: VEHICLE_SIGNAL_TAG_HINTS.fleet_capacity_shortage,
  };
}

function buildFuelPressureSignal(
  state: VehicleState,
  context: VehicleEventSignalContext,
): VehicleEventSignal | null {
  const avgFuel = averageFuelOrCharge(state.units);
  if (avgFuel > 45) {
    return null;
  }

  const severity: VehicleEventSignalSeverity = avgFuel <= 30 ? 'high' : 'medium';
  const lowFuelUnit =
    [...state.units].sort((a, b) => a.fuelOrCharge - b.fuelOrCharge)[0] ??
    undefined;

  return {
    type: 'fuel_pressure',
    severity,
    neighborhoodId: resolveNeighborhoodForVehicle(lowFuelUnit, context),
    vehicleId: lowFuelUnit?.id ?? null,
    weightBoost: weightBoostForSignal('fuel_pressure', severity),
    reason: `Ortalama yakıt/şarj: ${avgFuel}`,
    eventTags: VEHICLE_SIGNAL_TAG_HINTS.fuel_pressure,
  };
}

function buildInspectionGapSignal(
  state: VehicleState,
): VehicleEventSignal | null {
  const inspectionUnits = state.units.filter(
    (unit) => unit.category === 'inspection_vehicle',
  );
  if (inspectionUnits.length === 0) {
    return {
      type: 'inspection_gap',
      severity: 'medium',
      neighborhoodId: null,
      vehicleId: null,
      weightBoost: weightBoostForSignal('inspection_gap', 'medium'),
      reason: 'Denetim aracı filoda yok',
      eventTags: VEHICLE_SIGNAL_TAG_HINTS.inspection_gap,
    };
  }

  const hasAvailable = inspectionUnits.some(
    (unit) => unit.operationalStatus === 'available',
  );
  if (hasAvailable) {
    return null;
  }

  const unit = inspectionUnits[0];
  return {
    type: 'inspection_gap',
    severity: 'medium',
    neighborhoodId: unit.currentNeighborhoodId ?? unit.homeNeighborhoodId,
    vehicleId: unit.id,
    weightBoost: weightBoostForSignal('inspection_gap', 'medium'),
    reason: 'Denetim aracı müsait değil',
    eventTags: VEHICLE_SIGNAL_TAG_HINTS.inspection_gap,
  };
}

export function createVehicleEventSignals(
  vehicleState: VehicleState,
  context: VehicleEventSignalContext,
): VehicleEventSignal[] {
  if (context.day <= 1 || context.tutorialActive) {
    return [];
  }

  const candidates = [
    buildVehicleBreakdownSignal(vehicleState, context),
    buildMaintenanceNeedSignal(vehicleState, context),
    buildRouteDelaySignal(vehicleState, context),
    buildFleetCapacityShortageSignal(vehicleState, context),
    buildFuelPressureSignal(vehicleState, context),
    buildInspectionGapSignal(vehicleState),
  ];

  return candidates.filter((signal): signal is VehicleEventSignal => signal != null);
}

export function compareVehicleEventSignals(
  a: VehicleEventSignal,
  b: VehicleEventSignal,
): number {
  const typeDelta = SIGNAL_TYPE_PRIORITY[b.type] - SIGNAL_TYPE_PRIORITY[a.type];
  if (typeDelta !== 0) {
    return typeDelta;
  }
  const severityDelta = SEVERITY_PRIORITY[b.severity] - SEVERITY_PRIORITY[a.severity];
  if (severityDelta !== 0) {
    return severityDelta;
  }
  return b.weightBoost - a.weightBoost;
}

export function selectStrongestVehicleSignal(
  signals: VehicleEventSignal[],
): VehicleEventSignal | null {
  if (signals.length === 0) {
    return null;
  }
  return [...signals].sort(compareVehicleEventSignals)[0] ?? null;
}

export function canVehicleSignalProduceSupplement(
  signal: VehicleEventSignal,
): boolean {
  return signal.severity === 'high' || signal.severity === 'critical';
}

function candidateMatchesSignal(
  signal: VehicleEventSignal,
  input: {
    neighborhoodId?: string | null;
    eventType?: string | null;
    title?: string | null;
    category?: string | null;
    tags?: string[];
  },
): boolean {
  if (signal.neighborhoodId) {
    const resolved = normalizeContainerNeighborhoodId(input.neighborhoodId);
    const signalHood = normalizeContainerNeighborhoodId(signal.neighborhoodId);
    if (resolved && signalHood && resolved !== signalHood) {
      return false;
    }
  }

  const haystack = normalizeHaystack(
    input.eventType,
    input.title,
    input.category,
  );
  const tagHaystack = (input.tags ?? []).join(' ').toLowerCase();
  const combined = `${haystack} ${tagHaystack}`.trim();
  if (!combined) {
    return false;
  }

  const keywords = VEHICLE_EVENT_KEYWORDS[signal.type];
  return keywords.some((keyword) => combined.includes(keyword));
}

function applyDayGuard(boost: number, day?: number, tutorialActive?: boolean): number {
  if (day === 1 || tutorialActive) {
    return boost * DAY1_VEHICLE_BOOST_MULTIPLIER;
  }
  return boost;
}

export function getVehicleEventWeightForCandidate(input: {
  vehicleState: VehicleState;
  neighborhoodId?: string | null;
  eventType?: string | null;
  title?: string | null;
  category?: string | null;
  tags?: string[];
  day?: number;
  tutorialActive?: boolean;
  activeDistrictId?: string | null;
}): number {
  const signals = createVehicleEventSignals(input.vehicleState, {
    day: input.day ?? input.vehicleState.lastProcessedDay,
    activeDistrictId: input.activeDistrictId,
    tutorialActive: input.tutorialActive,
  });
  if (signals.length === 0) {
    return 0;
  }

  let maxBoost = 0;
  for (const signal of signals) {
    if (!candidateMatchesSignal(signal, input)) {
      continue;
    }
    maxBoost = Math.max(maxBoost, Math.min(signal.weightBoost, MAX_VEHICLE_EVENT_WEIGHT_BOOST));
  }

  return applyDayGuard(maxBoost, input.day, input.tutorialActive);
}

export function isVehicleEventCandidate(input: {
  eventType?: string | null;
  category?: string | null;
  title?: string | null;
  tags?: string[];
  districtEventType?: string | null;
}): boolean {
  if (
    input.districtEventType === 'vehicle_breakdown_risk' ||
    input.districtEventType === 'route_delay'
  ) {
    return true;
  }

  const haystack = normalizeHaystack(
    input.eventType,
    input.title,
    input.category,
  );
  const tagTokens = (input.tags ?? []).map((tag) => tag.toLowerCase());

  if (
    tagTokens.some((tag) =>
      (VEHICLE_CANDIDATE_TAG_TOKENS as readonly string[]).includes(tag),
    )
  ) {
    return true;
  }

  if (
    VEHICLE_CANDIDATE_TYPE_TOKENS.some((token) => haystack.includes(token))
  ) {
    return true;
  }

  const allKeywords = Object.values(VEHICLE_EVENT_KEYWORDS).flat();
  return allKeywords.some((keyword) => haystack.includes(keyword));
}

function vehicleCandidateInput(
  event: Pick<
    EventCard,
    'eventType' | 'title' | 'category' | 'filterTags' | 'districtEventType'
  >,
): Parameters<typeof isVehicleEventCandidate>[0] {
  return {
    eventType: event.eventType,
    title: event.title,
    category: event.category,
    tags: event.filterTags,
    districtEventType: event.districtEventType,
  };
}

export function isVehicleDrivenSupplementEvent(
  eventOrId: Pick<EventCard, 'id'> | string,
): boolean {
  const id = typeof eventOrId === 'string' ? eventOrId : eventOrId.id;
  return id.startsWith(VEHICLE_DRIVEN_SUPPLEMENT_ID_PREFIX);
}

export function countVehicleDrivenSupplements(dailySet: DailyEventSet): number {
  return (dailySet.supplementalEvents ?? []).filter((event) =>
    isVehicleDrivenSupplementEvent(event),
  ).length;
}

/**
 * Araç sinyali yokken ve havuzda alternatif varken araç temalı adayları düşük önceliğe iter.
 */
export function shouldDeprioritizeVehicleCandidate(
  event: EventCard,
  pool: EventCard[],
  vehicleSignals: VehicleEventSignal[],
  day: number,
  tutorialActive?: boolean,
): boolean {
  if (day <= 1 || tutorialActive) {
    return false;
  }
  if (vehicleSignals.length > 0) {
    return false;
  }
  if (!isVehicleEventCandidate(vehicleCandidateInput(event))) {
    return false;
  }
  return pool.some(
    (candidate) =>
      candidate.id !== event.id &&
      !isVehicleEventCandidate(vehicleCandidateInput(candidate)),
  );
}

export function applyVehicleCandidateWeightSuppression(
  weight: number,
  event: EventCard,
  pool: EventCard[],
  vehicleSignals: VehicleEventSignal[],
  day: number,
  tutorialActive?: boolean,
): number {
  if (
    !shouldDeprioritizeVehicleCandidate(
      event,
      pool,
      vehicleSignals,
      day,
      tutorialActive,
    )
  ) {
    return weight;
  }
  return Math.max(1, Math.round(weight * VEHICLE_CANDIDATE_SUPPRESSION_FACTOR));
}

function buildGenericVehicleDecisions(eventId: string): EventDecision[] {
  return [
    {
      id: `${eventId}-dispatch`,
      title: 'Saha Aracı Yönlendir',
      description: 'Müsait aracı rotaya al; operasyonu kısa sürede toparla.',
      style: 'bold',
      recommended: true,
      decisionStyle: 'fast',
      effects: {
        publicSatisfaction: 5,
        budget: -3500,
        morale: -3,
        risk: -12,
        xp: 14,
      },
      costs: { budget: 3500, staffHours: 8, vehicleUsage: 1 },
      resultText: 'Saha aracı yönlendirildi.',
    },
    {
      id: `${eventId}-plan`,
      title: 'Filo ve Rota Planla',
      description: 'Bakım ve rota planını güncelle; risk kontrollü azalır.',
      style: 'balanced',
      decisionStyle: 'planned',
      effects: {
        publicSatisfaction: 7,
        budget: -5000,
        morale: -1,
        risk: -16,
        xp: 18,
      },
      costs: { budget: 5000, staffHours: 10, vehicleUsage: 1 },
      resultText: 'Filo planı güncellendi.',
    },
    {
      id: `${eventId}-monitor`,
      title: 'İzle ve Raporla',
      description: 'Durumu izle; düşük maliyetli geçici çözüm.',
      style: 'cautious',
      decisionStyle: 'communication',
      effects: {
        publicSatisfaction: 2,
        budget: -800,
        morale: 0,
        risk: -6,
        xp: 8,
      },
      costs: { budget: 800, staffHours: 2 },
      resultText: 'Filo durumu izlemeye alındı.',
    },
  ];
}

export function buildVehicleSupplementEventCard(
  signal: VehicleEventSignal,
  pilotDistrictId: PilotDistrictId,
  day: number,
): EventCard {
  const template = VEHICLE_SUPPLEMENT_TEMPLATES[signal.type];
  const severity =
    signal.severity === 'critical'
      ? 'critical'
      : signal.severity === 'high'
        ? 'high'
        : ('medium' as EventRiskLevel);
  const eventId = `vehicle-signal-${signal.type}-d${day}-${pilotDistrictId}`;

  return {
    id: eventId,
    title: template.title,
    category: 'Filo Operasyonu',
    riskLevel: severity,
    district:
      PILOT_DISTRICT_LABELS[pilotDistrictId] ?? 'Pilot Bölge',
    description: template.description,
    contextTag: 'Filo sinyali',
    urgencyHours: severity === 'critical' ? 3 : severity === 'high' ? 5 : 7,
    decisions: buildGenericVehicleDecisions(eventId),
    previewEffects: {
      publicSatisfaction: severity === 'critical' ? -7 : -4,
      risk: severity === 'low' ? 6 : 10,
      xp: severity === 'critical' ? 18 : 12,
    },
    day,
    districtIds: [pilotDistrictId],
    eventType: template.eventType,
    filterTags: severity === 'critical' || severity === 'high' ? ['urgent'] : undefined,
    neighborhoodId: signal.neighborhoodId ?? undefined,
    priority: severity === 'critical' ? 4 : 3,
  };
}

function resolveEventCardById(
  id: string,
  catalog: EventCard[],
  supplemental: EventCard[] = [],
): EventCard | undefined {
  return (
    supplemental.find((event) => event.id === id) ??
    catalog.find((event) => event.id === id)
  );
}

export function dailySetAlreadyHasVehicleEvent(
  dailyEventSet: DailyEventSet,
  catalog: EventCard[],
): boolean {
  const supplemental = dailyEventSet.supplementalEvents ?? [];
  const eventIds = new Set<string>([
    ...dailyEventSet.allEventIds,
    dailyEventSet.anchorEventId,
    ...dailyEventSet.sideEventIds,
    ...dailyEventSet.quickActionIds,
    ...dailyEventSet.opportunityEventIds,
    ...dailyEventSet.butterflyEventIds,
    ...dailyEventSet.signalEventIds,
  ]);

  for (const eventId of eventIds) {
    if (!eventId) {
      continue;
    }
    const card = resolveEventCardById(eventId, catalog, supplemental);
    if (
      card &&
      isVehicleEventCandidate({
        eventType: card.eventType,
        title: card.title,
        category: card.category,
        tags: card.filterTags,
        districtEventType: card.districtEventType,
      })
    ) {
      return true;
    }
  }
  return false;
}

export type EnrichDailyEventSetWithVehicleSignalsParams = {
  dailyEventSet: DailyEventSet;
  vehicleState?: VehicleState | null;
  day: number;
  districtId: PilotDistrictId;
  tutorialActive?: boolean;
  catalog?: EventCard[];
};

/**
 * Günlük sete en fazla 1 araç kaynaklı supplement ekler (gün 1 ve düşük şiddet hariç).
 */
export function enrichDailyEventSetWithVehicleSignals(
  params: EnrichDailyEventSetWithVehicleSignalsParams,
): DailyEventSet {
  const catalog = params.catalog ?? [];
  const vehicleState = params.vehicleState;

  if (
    params.day <= 1 ||
    params.tutorialActive ||
    vehicleState == null ||
    vehicleState.units.length === 0
  ) {
    return params.dailyEventSet;
  }

  if (dailySetAlreadyHasVehicleEvent(params.dailyEventSet, catalog)) {
    return params.dailyEventSet;
  }

  const signals = createVehicleEventSignals(vehicleState, {
    day: params.day,
    activeDistrictId: params.districtId,
    tutorialActive: params.tutorialActive,
  });
  const strongest = selectStrongestVehicleSignal(signals);
  if (!strongest || !canVehicleSignalProduceSupplement(strongest)) {
    return params.dailyEventSet;
  }

  const supplementCard = buildVehicleSupplementEventCard(
    strongest,
    params.districtId,
    params.day,
  );

  const existingIds = new Set(params.dailyEventSet.allEventIds);
  if (existingIds.has(supplementCard.id)) {
    return params.dailyEventSet;
  }

  const sideEventIds = [...params.dailyEventSet.sideEventIds, supplementCard.id];
  const eventRoles = {
    ...params.dailyEventSet.eventRoles,
    [supplementCard.id]: 'side' as const,
  };
  const eventStatuses = {
    ...params.dailyEventSet.eventStatuses,
    [supplementCard.id]: 'awaiting_decision' as const,
  };

  return {
    ...params.dailyEventSet,
    sideEventIds,
    allEventIds: [...new Set([...params.dailyEventSet.allEventIds, supplementCard.id])],
    eventRoles,
    eventStatuses,
    supplementalEvents: [
      ...(params.dailyEventSet.supplementalEvents ?? []),
      supplementCard,
    ],
  };
}

/** Test / analiz — filo stres senaryoları için state üretir. */
export function buildVehicleStateForScenario(
  scenario:
    | 'healthy_fleet'
    | 'high_workload'
    | 'broken_vehicle'
    | 'no_available_vehicle'
    | 'maintenance_neglect',
  day = 3,
): VehicleState {
  let state = createInitialVehicleState(day);

  switch (scenario) {
    case 'healthy_fleet':
      return state;
    case 'high_workload':
      state = {
        ...state,
        units: state.units.map((unit) => ({
          ...unit,
          workload: 88,
          routeEfficiency: 48,
        })),
      };
      break;
    case 'broken_vehicle':
      state = {
        ...state,
        units: state.units.map((unit, index) =>
          index === 0
            ? { ...unit, operationalStatus: 'broken', breakdownRisk: 85 }
            : unit,
        ),
      };
      break;
    case 'no_available_vehicle':
      state = {
        ...state,
        units: state.units.map((unit) => ({
          ...unit,
          operationalStatus:
            unit.operationalStatus === 'available'
              ? ('maintenance' as const)
              : unit.operationalStatus,
        })),
      };
      break;
    case 'maintenance_neglect':
      state = {
        ...state,
        units: state.units.map((unit) => ({
          ...unit,
          condition: 32,
          maintenanceNeed: 78,
          breakdownRisk: 72,
        })),
      };
      break;
    default:
      break;
  }

  return {
    ...state,
    aggregates: recomputeVehicleAggregates(state.units),
    lastProcessedDay: day,
  };
}
