import type { DistrictEventType } from '@/core/districts/types';

import { CONTAINER_NEIGHBORHOOD_IDS, CONTAINER_OVERFLOW_RISK_PRIORITY } from './containerConstants';
import { normalizeContainerNeighborhoodId } from './containerNeighborhoodBridge';
import type {
  ContainerNeighborhoodId,
  ContainerOverflowRisk,
  ContainerState,
  ContainerType,
  ContainerUnit,
  NeighborhoodContainerStatus,
  NeighborhoodContainerStatusLabel,
} from './containerTypes';

export type ContainerEventSignalType =
  | 'waste_overflow'
  | 'delayed_collection'
  | 'odor_complaint'
  | 'park_cleanliness'
  | 'market_waste'
  | 'container_damage'
  | 'capacity_request'
  | 'recycling_opportunity';

export type ContainerEventSignalSeverity =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type ContainerEventSignal = {
  neighborhoodId: ContainerNeighborhoodId;
  signalType: ContainerEventSignalType;
  severity: ContainerEventSignalSeverity;
  weightBoost: number;
  reason: string;
  sourceUnitIds: string[];
};

const SEVERITY_PRIORITY: Record<ContainerEventSignalSeverity, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/** Event motoru çarpanı — agresif değil, garanti değil. */
export const CONTAINER_SIGNAL_WEIGHT_BOOST: Record<
  ContainerEventSignalSeverity,
  number
> = {
  none: 0,
  low: 0.05,
  medium: 0.1,
  high: 0.18,
  critical: 0.25,
};

const DAY1_CONTAINER_BOOST_MULTIPLIER = 0;

const ODOR_SENSITIVE_TYPES: ContainerType[] = [
  'organic',
  'market_waste',
  'standard_waste',
];

const PARK_NEIGHBORHOODS: ContainerNeighborhoodId[] = ['yesilvadi', 'istasyon'];

const RECYCLING_OPPORTUNITY_NEIGHBORHOODS: ContainerNeighborhoodId[] = [
  'yesilvadi',
  'merkez',
];

function isElevatedOverflow(risk: ContainerOverflowRisk): boolean {
  return risk === 'high' || risk === 'critical';
}

function severityFromStatusLabel(
  label: NeighborhoodContainerStatusLabel,
): ContainerEventSignalSeverity {
  switch (label) {
    case 'Kritik':
      return 'critical';
    case 'Yüksek':
      return 'high';
    case 'Baskılı':
    case 'Takipte':
      return 'medium';
    default:
      return 'low';
  }
}

function bumpSeverity(
  current: ContainerEventSignalSeverity,
  next: ContainerEventSignalSeverity,
): ContainerEventSignalSeverity {
  return SEVERITY_PRIORITY[next] > SEVERITY_PRIORITY[current] ? next : current;
}

function weightBoostForSeverity(
  severity: ContainerEventSignalSeverity,
): number {
  return CONTAINER_SIGNAL_WEIGHT_BOOST[severity];
}

function activeUnits(
  units: ContainerUnit[],
  neighborhoodId: ContainerNeighborhoodId,
): ContainerUnit[] {
  return units.filter(
    (unit) =>
      unit.neighborhoodId === neighborhoodId && unit.status !== 'disabled',
  );
}

function unitsByFillPressure(units: ContainerUnit[], limit = 3): ContainerUnit[] {
  return [...units]
    .sort((a, b) => b.fillRate - a.fillRate)
    .slice(0, limit);
}

function unitsByOverflowPressure(
  units: ContainerUnit[],
  limit = 3,
): ContainerUnit[] {
  return [...units]
    .filter((unit) => isElevatedOverflow(unit.overflowRisk))
    .sort(
      (a, b) =>
        CONTAINER_OVERFLOW_RISK_PRIORITY[b.overflowRisk] -
          CONTAINER_OVERFLOW_RISK_PRIORITY[a.overflowRisk] ||
        b.fillRate - a.fillRate,
    )
    .slice(0, limit);
}

function unitsByCollectionDelay(
  units: ContainerUnit[],
  currentDay: number,
  limit = 3,
): ContainerUnit[] {
  return [...units]
    .sort(
      (a, b) =>
        currentDay -
        b.lastCollectedDay -
        (currentDay - a.lastCollectedDay),
    )
    .slice(0, limit);
}

function unitsByOdorPressure(units: ContainerUnit[], limit = 3): ContainerUnit[] {
  return [...units]
    .sort((a, b) => {
      const typeBoost = (type: ContainerType) =>
        ODOR_SENSITIVE_TYPES.includes(type) ? 8 : 0;
      return (
        b.odorLevel +
        typeBoost(b.type) -
        (a.odorLevel + typeBoost(a.type))
      );
    })
    .slice(0, limit);
}

function unitsByMaintenancePressure(
  units: ContainerUnit[],
  limit = 3,
): ContainerUnit[] {
  return [...units]
    .filter(
      (unit) => unit.maintenanceNeed >= 55 || unit.condition <= 50,
    )
    .sort(
      (a, b) =>
        b.maintenanceNeed - a.maintenanceNeed ||
        a.condition - b.condition,
    )
    .slice(0, limit);
}

function pushSignal(
  signals: ContainerEventSignal[],
  signal: ContainerEventSignal,
): void {
  const existing = signals.find(
    (entry) =>
      entry.neighborhoodId === signal.neighborhoodId &&
      entry.signalType === signal.signalType,
  );
  if (existing) {
    existing.severity = bumpSeverity(existing.severity, signal.severity);
    existing.weightBoost = weightBoostForSeverity(existing.severity);
    existing.reason = signal.reason;
    existing.sourceUnitIds = [
      ...new Set([...existing.sourceUnitIds, ...signal.sourceUnitIds]),
    ];
    return;
  }
  signals.push(signal);
}

function buildWasteOverflowSignal(
  aggregate: NeighborhoodContainerStatus,
  units: ContainerUnit[],
): ContainerEventSignal | null {
  const highPressure =
    aggregate.statusLabel === 'Kritik' ||
    aggregate.statusLabel === 'Yüksek' ||
    aggregate.criticalContainerCount >= 1 ||
    aggregate.highContainerCount >= 2 ||
    aggregate.averageFillRate >= 72;

  if (!highPressure) {
    return null;
  }

  let severity: ContainerEventSignalSeverity = 'medium';
  if (aggregate.statusLabel === 'Kritik' || aggregate.criticalContainerCount >= 2) {
    severity = 'critical';
  } else if (
    aggregate.statusLabel === 'Yüksek' ||
    aggregate.criticalContainerCount >= 1 ||
    aggregate.averageFillRate >= 82
  ) {
    severity = 'high';
  } else if (aggregate.statusLabel === 'Baskılı') {
    severity = 'medium';
  }

  const sourceUnits =
    unitsByOverflowPressure(units).length > 0
      ? unitsByOverflowPressure(units)
      : unitsByFillPressure(units);

  return {
    neighborhoodId: aggregate.neighborhoodId,
    signalType: 'waste_overflow',
    severity,
    weightBoost: weightBoostForSeverity(severity),
    reason: `${aggregate.statusLabel} — doluluk ${Math.round(aggregate.averageFillRate)}%`,
    sourceUnitIds: sourceUnits.map((unit) => unit.id),
  };
}

function buildDelayedCollectionSignal(
  aggregate: NeighborhoodContainerStatus,
  units: ContainerUnit[],
  currentDay: number,
): ContainerEventSignal | null {
  if (aggregate.collectionDelayDays < 2 || aggregate.averageFillRate < 60) {
    return null;
  }

  const severity: ContainerEventSignalSeverity =
    aggregate.collectionDelayDays >= 4 || aggregate.averageFillRate >= 75
      ? 'high'
      : 'medium';

  const sourceUnits = unitsByCollectionDelay(units, currentDay);

  return {
    neighborhoodId: aggregate.neighborhoodId,
    signalType: 'delayed_collection',
    severity,
    weightBoost: weightBoostForSeverity(severity),
    reason: `Toplama gecikmesi ${aggregate.collectionDelayDays} gün`,
    sourceUnitIds: sourceUnits.map((unit) => unit.id),
  };
}

function buildOdorComplaintSignal(
  aggregate: NeighborhoodContainerStatus,
  units: ContainerUnit[],
): ContainerEventSignal | null {
  if (aggregate.odorPressure < 65 && aggregate.complaintPressure < 70) {
    return null;
  }

  const severity: ContainerEventSignalSeverity =
    aggregate.complaintPressure >= 80 || aggregate.odorPressure >= 80
      ? 'high'
      : 'medium';

  const sourceUnits = unitsByOdorPressure(units);

  return {
    neighborhoodId: aggregate.neighborhoodId,
    signalType: 'odor_complaint',
    severity,
    weightBoost: weightBoostForSeverity(severity),
    reason: `Koku/şikayet baskısı (koku ${Math.round(aggregate.odorPressure)}, şikayet ${Math.round(aggregate.complaintPressure)})`,
    sourceUnitIds: sourceUnits.map((unit) => unit.id),
  };
}

function buildParkCleanlinessSignal(
  aggregate: NeighborhoodContainerStatus,
  units: ContainerUnit[],
): ContainerEventSignal | null {
  const parkUnits = units.filter((unit) => unit.type === 'park_bin');
  const stressed = parkUnits.filter(
    (unit) => unit.fillRate >= 65 || unit.odorLevel >= 55,
  );
  if (stressed.length === 0) {
    return null;
  }

  let severity: ContainerEventSignalSeverity = 'medium';
  if (PARK_NEIGHBORHOODS.includes(aggregate.neighborhoodId)) {
    severity =
      stressed.some((unit) => unit.fillRate >= 75) ? 'high' : 'medium';
  } else {
    severity = 'low';
  }

  return {
    neighborhoodId: aggregate.neighborhoodId,
    signalType: 'park_cleanliness',
    severity,
    weightBoost: weightBoostForSeverity(severity),
    reason: 'Park/kamusal alan konteyner baskısı',
    sourceUnitIds: stressed.map((unit) => unit.id),
  };
}

function buildMarketWasteSignal(
  aggregate: NeighborhoodContainerStatus,
  units: ContainerUnit[],
): ContainerEventSignal | null {
  const marketUnits = units.filter((unit) => unit.type === 'market_waste');
  const stressed = marketUnits.filter(
    (unit) => unit.fillRate >= 60 || unit.odorLevel >= 55,
  );
  if (stressed.length === 0) {
    return null;
  }

  const severity: ContainerEventSignalSeverity =
    aggregate.neighborhoodId === 'sanayi' && stressed.some((u) => u.fillRate >= 70)
      ? 'high'
      : 'medium';

  return {
    neighborhoodId: aggregate.neighborhoodId,
    signalType: 'market_waste',
    severity,
    weightBoost: weightBoostForSeverity(severity),
    reason: 'Pazar hattı atık birikimi',
    sourceUnitIds: stressed.map((unit) => unit.id),
  };
}

function buildContainerDamageSignal(
  aggregate: NeighborhoodContainerStatus,
  units: ContainerUnit[],
): ContainerEventSignal | null {
  const damagedUnits = unitsByMaintenancePressure(units);
  if (aggregate.maintenancePressure < 65 && damagedUnits.length === 0) {
    return null;
  }

  const severity: ContainerEventSignalSeverity =
    aggregate.maintenancePressure >= 80 ||
    damagedUnits.some((unit) => unit.condition <= 40)
      ? 'high'
      : 'medium';

  return {
    neighborhoodId: aggregate.neighborhoodId,
    signalType: 'container_damage',
    severity,
    weightBoost: weightBoostForSeverity(severity),
    reason: 'Bakım/kondisyon baskısı',
    sourceUnitIds: damagedUnits.map((unit) => unit.id),
  };
}

function buildCapacityRequestSignal(
  aggregate: NeighborhoodContainerStatus,
): ContainerEventSignal | null {
  if (
    aggregate.averageFillRate < 75 ||
    aggregate.criticalContainerCount < 1
  ) {
    return null;
  }

  const severity: ContainerEventSignalSeverity =
    aggregate.averageFillRate >= 85 ? 'high' : 'medium';

  return {
    neighborhoodId: aggregate.neighborhoodId,
    signalType: 'capacity_request',
    severity,
    weightBoost: weightBoostForSeverity(severity),
    reason: 'Sürekli yüksek doluluk — kapasite talebi',
    sourceUnitIds: [],
  };
}

function buildRecyclingOpportunitySignal(
  aggregate: NeighborhoodContainerStatus,
  units: ContainerUnit[],
): ContainerEventSignal | null {
  if (!RECYCLING_OPPORTUNITY_NEIGHBORHOODS.includes(aggregate.neighborhoodId)) {
    return null;
  }

  const recyclingUnits = units.filter((unit) => unit.type === 'recycling');
  const healthy = recyclingUnits.filter(
    (unit) =>
      unit.condition >= 70 &&
      unit.fillRate <= 55 &&
      unit.maintenanceNeed <= 40,
  );
  if (healthy.length === 0) {
    return null;
  }

  const severity: ContainerEventSignalSeverity =
    healthy.length >= 2 ? 'medium' : 'low';

  return {
    neighborhoodId: aggregate.neighborhoodId,
    signalType: 'recycling_opportunity',
    severity,
    weightBoost: weightBoostForSeverity(severity),
    reason: 'Geri dönüşüm hattı iyi durumda — fırsat sinyali',
    sourceUnitIds: healthy.map((unit) => unit.id),
  };
}

function buildSignalsForNeighborhood(
  containerState: ContainerState,
  neighborhoodId: ContainerNeighborhoodId,
): ContainerEventSignal[] {
  const aggregate = containerState.aggregates[neighborhoodId];
  const units = activeUnits(containerState.units, neighborhoodId);
  const currentDay = Math.max(1, containerState.lastProcessedDay);
  const signals: ContainerEventSignal[] = [];

  const candidates = [
    buildWasteOverflowSignal(aggregate, units),
    buildDelayedCollectionSignal(aggregate, units, currentDay),
    buildOdorComplaintSignal(aggregate, units),
    buildParkCleanlinessSignal(aggregate, units),
    buildMarketWasteSignal(aggregate, units),
    buildContainerDamageSignal(aggregate, units),
    buildCapacityRequestSignal(aggregate),
    buildRecyclingOpportunitySignal(aggregate, units),
  ];

  for (const signal of candidates) {
    if (signal) {
      pushSignal(signals, signal);
    }
  }

  return signals;
}

export function buildContainerEventSignals(
  containerState: ContainerState,
): ContainerEventSignal[] {
  const signals: ContainerEventSignal[] = [];
  for (const neighborhoodId of CONTAINER_NEIGHBORHOOD_IDS) {
    const hoodSignals = buildSignalsForNeighborhood(
      containerState,
      neighborhoodId,
    );
    signals.push(...hoodSignals);
  }
  return signals;
}

export function getContainerSignalWeightBoost(
  signal: ContainerEventSignal,
): number {
  return CONTAINER_SIGNAL_WEIGHT_BOOST[signal.severity] ?? 0;
}

export function mapContainerSignalToEventType(
  signal: ContainerEventSignal,
): string {
  switch (signal.signalType) {
    case 'waste_overflow':
      return 'waste_overflow';
    case 'delayed_collection':
      return 'delayed_collection';
    case 'odor_complaint':
      return 'social_media_complaint';
    case 'park_cleanliness':
      return 'park_cleanliness';
    case 'market_waste':
      return 'market_crowding';
    case 'container_damage':
      return 'waste';
    case 'capacity_request':
      return 'opportunity';
    case 'recycling_opportunity':
      return 'opportunity';
    default:
      return 'waste';
  }
}

export function compareContainerEventSignals(
  a: ContainerEventSignal,
  b: ContainerEventSignal,
): number {
  const severityDelta =
    SEVERITY_PRIORITY[b.severity] - SEVERITY_PRIORITY[a.severity];
  if (severityDelta !== 0) {
    return severityDelta;
  }
  const boostDelta = b.weightBoost - a.weightBoost;
  if (boostDelta !== 0) {
    return boostDelta;
  }
  return 0;
}

export function selectStrongestContainerSignals(
  containerState: ContainerState,
  limit = 3,
): ContainerEventSignal[] {
  return [...buildContainerEventSignals(containerState)]
    .sort(compareContainerEventSignals)
    .slice(0, limit);
}

export function selectContainerSignalForNeighborhood(
  containerState: ContainerState,
  neighborhoodId: string | null | undefined,
): ContainerEventSignal | null {
  const resolved = normalizeContainerNeighborhoodId(neighborhoodId);
  if (!resolved) {
    return null;
  }

  const signals = buildContainerEventSignals(containerState).filter(
    (signal) => signal.neighborhoodId === resolved,
  );
  if (signals.length === 0) {
    return null;
  }

  return [...signals].sort(compareContainerEventSignals)[0] ?? null;
}

function normalizeCandidateHaystack(
  eventType?: string | null,
  title?: string | null,
  category?: string | null,
): string {
  return [eventType, title, category]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(' ')
    .toLowerCase();
}

const PILOT_TYPE_ALIASES: Record<string, string[]> = {
  waste: ['waste', 'waste_overflow', 'delayed_collection', 'park_cleanliness', 'atık', 'çöp', 'konteyner', 'temizlik'],
  market: ['market', 'market_crowding', 'market_waste', 'pazar'],
  social_media: ['social_media', 'social_media_complaint', 'citizen_complaint', 'şikayet', 'koku'],
  opportunity: ['opportunity', 'capacity', 'recycling'],
  citizen_complaint: ['citizen_complaint', 'complaint', 'şikayet'],
};

function haystackMatchesMappedType(haystack: string, mappedType: string): boolean {
  if (haystack.includes(mappedType)) {
    return true;
  }

  for (const [pilotType, aliases] of Object.entries(PILOT_TYPE_ALIASES)) {
    if (!aliases.some((alias) => mappedType.includes(alias) || alias === mappedType)) {
      continue;
    }
    if (haystack.includes(pilotType) || aliases.some((alias) => haystack.includes(alias))) {
      return true;
    }
  }

  const containerKeywords = [
    'waste',
    'overflow',
    'container',
    'çöp',
    'konteyner',
    'atık',
    'temizlik',
    'park',
    'pazar',
    'market',
    'collection',
    'toplama',
    'koku',
    'odor',
    'clean',
  ];

  if (
    mappedType.includes('waste') ||
    mappedType.includes('overflow') ||
    mappedType.includes('collection') ||
    mappedType.includes('park') ||
    mappedType.includes('market')
  ) {
    return containerKeywords.some((keyword) => haystack.includes(keyword));
  }

  if (mappedType === 'opportunity') {
    return haystack.includes('opportunity') || haystack.includes('fırsat');
  }

  return false;
}

function candidateMatchesSignal(
  signal: ContainerEventSignal,
  input: {
    neighborhoodId?: string | null;
    eventType?: string | null;
    title?: string | null;
    category?: string | null;
  },
): boolean {
  const resolvedNeighborhood = normalizeContainerNeighborhoodId(
    input.neighborhoodId,
  );
  if (resolvedNeighborhood && resolvedNeighborhood !== signal.neighborhoodId) {
    return false;
  }

  const haystack = normalizeCandidateHaystack(
    input.eventType,
    input.title,
    input.category,
  );
  if (!haystack) {
    return false;
  }

  const mappedType = mapContainerSignalToEventType(signal);
  return haystackMatchesMappedType(haystack, mappedType);
}

function applyDayGuard(boost: number, day?: number): number {
  if (day === 1) {
    return boost * DAY1_CONTAINER_BOOST_MULTIPLIER;
  }
  return boost;
}

export function getContainerEventWeightForCandidate(input: {
  containerState: ContainerState;
  neighborhoodId?: string | null;
  eventType?: string | null;
  title?: string | null;
  category?: string | null;
  day?: number;
}): number {
  const signals = buildContainerEventSignals(input.containerState);
  if (signals.length === 0) {
    return 0;
  }

  let maxBoost = 0;
  for (const signal of signals) {
    if (signal.severity === 'none') {
      continue;
    }
    if (
      signal.severity === 'low' &&
      signal.signalType !== 'recycling_opportunity'
    ) {
      continue;
    }
    if (!candidateMatchesSignal(signal, input)) {
      continue;
    }
    maxBoost = Math.max(maxBoost, getContainerSignalWeightBoost(signal));
  }

  return applyDayGuard(maxBoost, input.day);
}

const CONTAINER_WASTE_DISTRICT_EVENT_TYPES = new Set<string>([
  'waste_overflow',
  'delayed_collection',
  'park_cleanliness',
  'market_crowding',
]);

const CONTAINER_WASTE_TYPE_CATEGORY_TOKENS = [
  'waste',
  'trash',
  'container',
  'cleaning',
  'delayed_collection',
  'waste_overflow',
  'park_cleanliness',
  'market_crowding',
] as const;

const CONTAINER_WASTE_TITLE_KEYWORDS = [
  'çöp',
  'cop',
  'konteyner',
  'container',
  'atık',
  'atik',
  'koku',
  'taşma',
  'tasma',
  'toplama',
  'temizlik',
  'pazar atığı',
  'park çöp',
] as const;

const CONTAINER_WASTE_TAG_TOKENS = [
  'waste',
  'container',
  'trash',
  'cleaning',
  'collection',
] as const;

const CONTAINER_WASTE_CONTEXT_KEYWORDS = [
  'atık',
  'atik',
  'waste',
  'overflow',
  'taşma',
  'tasma',
  'collection',
  'toplama',
  'koku',
  'çöp',
  'cop',
  'konteyner',
] as const;

function haystackHasContainerWasteTitleSignals(haystack: string): boolean {
  return CONTAINER_WASTE_TITLE_KEYWORDS.some((keyword) =>
    haystack.includes(keyword),
  );
}

function haystackHasWasteContextForMarket(haystack: string): boolean {
  return CONTAINER_WASTE_CONTEXT_KEYWORDS.some((keyword) =>
    haystack.includes(keyword),
  );
}

/**
 * Günlük set spam guard — park/maintenance/market tek başına waste sayılmaz.
 */
export function isContainerOrWasteEventCandidate(input: {
  eventType?: string | null;
  category?: string | null;
  title?: string | null;
  tags?: string[];
  districtEventType?: string | null;
}): boolean {
  if (
    input.districtEventType &&
    CONTAINER_WASTE_DISTRICT_EVENT_TYPES.has(input.districtEventType)
  ) {
    return true;
  }

  const haystack = normalizeCandidateHaystack(
    input.eventType,
    input.title,
    input.category,
  );
  const tagTokens = (input.tags ?? []).map((tag) => tag.toLowerCase());

  if (
    tagTokens.some((tag) =>
      (CONTAINER_WASTE_TAG_TOKENS as readonly string[]).includes(tag),
    )
  ) {
    return true;
  }

  if (
    CONTAINER_WASTE_TYPE_CATEGORY_TOKENS.some((token) => haystack.includes(token))
  ) {
    if (
      (haystack.includes('maintenance') || input.eventType === 'maintenance') &&
      !haystackHasContainerWasteTitleSignals(haystack)
    ) {
      return false;
    }
    return true;
  }

  if (haystackHasContainerWasteTitleSignals(haystack)) {
    return true;
  }

  if (input.eventType === 'maintenance' || haystack.includes('maintenance')) {
    return haystackHasContainerWasteTitleSignals(haystack);
  }

  if (input.eventType === 'market' || haystack.includes('market')) {
    return haystackHasWasteContextForMarket(haystack);
  }

  if (haystack.includes('pazar') && !haystack.includes('pazar atığı')) {
    return haystackHasWasteContextForMarket(haystack);
  }

  return false;
}

export function isContainerInfluencedEventCandidate(input: {
  eventType?: string | null;
  title?: string | null;
  category?: string | null;
  districtEventType?: string | null;
}): boolean {
  const haystack = normalizeCandidateHaystack(
    input.eventType,
    input.title,
    input.category,
  );
  if (input.districtEventType) {
    const districtHaystack = `${haystack} ${input.districtEventType}`.trim();
    return (
      haystackMatchesMappedType(districtHaystack, 'waste_overflow') ||
      haystackMatchesMappedType(districtHaystack, 'delayed_collection') ||
      haystackMatchesMappedType(districtHaystack, 'park_cleanliness') ||
      haystackMatchesMappedType(districtHaystack, 'market_crowding')
    );
  }

  return (
    haystackMatchesMappedType(haystack, 'waste') ||
    haystackMatchesMappedType(haystack, 'waste_overflow') ||
    haystackMatchesMappedType(haystack, 'delayed_collection') ||
    haystackMatchesMappedType(haystack, 'park_cleanliness') ||
    haystackMatchesMappedType(haystack, 'market_crowding')
  );
}

export function mapContainerSignalToDistrictEventType(
  signal: ContainerEventSignal,
): DistrictEventType | null {
  switch (signal.signalType) {
    case 'waste_overflow':
      return 'waste_overflow';
    case 'delayed_collection':
      return 'delayed_collection';
    case 'odor_complaint':
      return 'social_media_complaint';
    case 'park_cleanliness':
      return 'park_cleanliness';
    case 'market_waste':
      return 'market_crowding';
    case 'container_damage':
      return 'waste_overflow';
    case 'capacity_request':
      return 'public_trust_drop';
    case 'recycling_opportunity':
      return null;
    default:
      return null;
  }
}

export function resolveContainerBoostMultiplier(day?: number): number {
  if (day === 1) {
    return DAY1_CONTAINER_BOOST_MULTIPLIER;
  }
  return 1;
}
