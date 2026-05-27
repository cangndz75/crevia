import {
  normalizeContainerUnit,
  recomputeContainerAggregates,
} from './containerEngine';
import {
  normalizeContainerNeighborhoodId,
  requireContainerNeighborhoodId,
} from './containerNeighborhoodBridge';
import type {
  ContainerNeighborhoodId,
  ContainerState,
  ContainerType,
  ContainerUnit,
} from './containerTypes';

type SeedUnitDef = {
  id: string;
  neighborhoodId: ContainerNeighborhoodId;
  name: string;
  type: ContainerType;
  locationKey: string;
  locationLabel: string;
  fillRate: number;
  condition: number;
  odorLevel: number;
  maintenanceNeed: number;
  lastCollectedDayOffset: number;
  capacity?: number;
  x?: number;
  y?: number;
  tags?: string[];
};

const SEED_UNIT_DEFS: SeedUnitDef[] = [
  {
    id: 'merkez-main-waste',
    neighborhoodId: 'merkez',
    name: 'Ana Cadde Konteyneri',
    type: 'standard_waste',
    locationKey: 'merkez-main-street',
    locationLabel: 'Ana Cadde',
    fillRate: 68,
    condition: 72,
    odorLevel: 48,
    maintenanceNeed: 30,
    lastCollectedDayOffset: 1,
    x: 0.48,
    y: 0.42,
  },
  {
    id: 'merkez-municipality-recycling',
    neighborhoodId: 'merkez',
    name: 'Belediye Önü Geri Dönüşüm',
    type: 'recycling',
    locationKey: 'merkez-municipality-front',
    locationLabel: 'Belediye Önü',
    fillRate: 38,
    condition: 86,
    odorLevel: 12,
    maintenanceNeed: 12,
    lastCollectedDayOffset: 1,
  },
  {
    id: 'merkez-market-organic',
    neighborhoodId: 'merkez',
    name: 'Esnaf Arka Sokak Organik',
    type: 'organic',
    locationKey: 'merkez-back-alley',
    locationLabel: 'Esnaf Arka Sokak',
    fillRate: 62,
    condition: 69,
    odorLevel: 58,
    maintenanceNeed: 34,
    lastCollectedDayOffset: 1,
  },
  {
    id: 'merkez-square-park-bin',
    neighborhoodId: 'merkez',
    name: 'Meydan Kenarı Park Kutusu',
    type: 'park_bin',
    locationKey: 'merkez-square-edge',
    locationLabel: 'Meydan Kenarı',
    fillRate: 54,
    condition: 78,
    odorLevel: 32,
    maintenanceNeed: 22,
    lastCollectedDayOffset: 1,
  },
  {
    id: 'cumhuriyet-site-waste',
    neighborhoodId: 'cumhuriyet',
    name: 'Site Girişi Konteyneri',
    type: 'standard_waste',
    locationKey: 'cumhuriyet-site-entry',
    locationLabel: 'Site Girişi',
    fillRate: 52,
    condition: 80,
    odorLevel: 30,
    maintenanceNeed: 18,
    lastCollectedDayOffset: 1,
  },
  {
    id: 'cumhuriyet-side-street',
    neighborhoodId: 'cumhuriyet',
    name: 'Ara Sokak Konteyneri',
    type: 'standard_waste',
    locationKey: 'cumhuriyet-side-street',
    locationLabel: 'Ara Sokak',
    fillRate: 58,
    condition: 74,
    odorLevel: 36,
    maintenanceNeed: 25,
    lastCollectedDayOffset: 1,
  },
  {
    id: 'cumhuriyet-garden-organic',
    neighborhoodId: 'cumhuriyet',
    name: 'Site Bahçesi Organik',
    type: 'organic',
    locationKey: 'cumhuriyet-garden',
    locationLabel: 'Site Bahçesi',
    fillRate: 45,
    condition: 82,
    odorLevel: 34,
    maintenanceNeed: 16,
    lastCollectedDayOffset: 1,
  },
  {
    id: 'cumhuriyet-recycling-point',
    neighborhoodId: 'cumhuriyet',
    name: 'Geri Dönüşüm Noktası',
    type: 'recycling',
    locationKey: 'cumhuriyet-recycling',
    locationLabel: 'Geri Dönüşüm Noktası',
    fillRate: 32,
    condition: 88,
    odorLevel: 8,
    maintenanceNeed: 10,
    lastCollectedDayOffset: 1,
  },
  {
    id: 'sanayi-factory-industrial',
    neighborhoodId: 'sanayi',
    name: 'Fabrika Çıkışı Endüstriyel',
    type: 'industrial_waste',
    locationKey: 'sanayi-factory-exit',
    locationLabel: 'Fabrika Çıkışı',
    fillRate: 68,
    condition: 62,
    odorLevel: 46,
    maintenanceNeed: 46,
    lastCollectedDayOffset: 2,
  },
  {
    id: 'sanayi-yard-waste',
    neighborhoodId: 'sanayi',
    name: 'Operasyon Avlusu Konteyneri',
    type: 'standard_waste',
    locationKey: 'sanayi-yard',
    locationLabel: 'Operasyon Avlusu',
    fillRate: 60,
    condition: 63,
    odorLevel: 38,
    maintenanceNeed: 36,
    lastCollectedDayOffset: 2,
  },
  {
    id: 'sanayi-market-line',
    neighborhoodId: 'sanayi',
    name: 'Pazar Hattı Atık',
    type: 'market_waste',
    locationKey: 'sanayi-market-line',
    locationLabel: 'Pazar Hattı',
    fillRate: 54,
    condition: 61,
    odorLevel: 50,
    maintenanceNeed: 37,
    lastCollectedDayOffset: 2,
  },
  {
    id: 'sanayi-recycling-yard',
    neighborhoodId: 'sanayi',
    name: 'Hurda Alanı Geri Dönüşüm',
    type: 'recycling',
    locationKey: 'sanayi-scrap-yard',
    locationLabel: 'Hurda Alanı',
    fillRate: 40,
    condition: 66,
    odorLevel: 22,
    maintenanceNeed: 35,
    lastCollectedDayOffset: 2,
  },
  {
    id: 'istasyon-platform-exit',
    neighborhoodId: 'istasyon',
    name: 'Peron Çıkışı Konteyneri',
    type: 'standard_waste',
    locationKey: 'istasyon-platform-exit',
    locationLabel: 'Peron Çıkışı',
    fillRate: 61,
    condition: 76,
    odorLevel: 38,
    maintenanceNeed: 22,
    lastCollectedDayOffset: 1,
  },
  {
    id: 'istasyon-waiting-park-bin',
    neighborhoodId: 'istasyon',
    name: 'Bekleme Alanı Park Kutusu',
    type: 'park_bin',
    locationKey: 'istasyon-waiting-area',
    locationLabel: 'Bekleme Alanı',
    fillRate: 57,
    condition: 73,
    odorLevel: 29,
    maintenanceNeed: 20,
    lastCollectedDayOffset: 1,
  },
  {
    id: 'istasyon-taxi-stop',
    neighborhoodId: 'istasyon',
    name: 'Taksi Durağı Konteyneri',
    type: 'standard_waste',
    locationKey: 'istasyon-taxi-stop',
    locationLabel: 'Taksi Durağı',
    fillRate: 49,
    condition: 79,
    odorLevel: 28,
    maintenanceNeed: 18,
    lastCollectedDayOffset: 1,
  },
  {
    id: 'istasyon-buffet-organic',
    neighborhoodId: 'istasyon',
    name: 'Büfe Çevresi Organik',
    type: 'organic',
    locationKey: 'istasyon-buffet',
    locationLabel: 'Büfe Çevresi',
    fillRate: 55,
    condition: 70,
    odorLevel: 43,
    maintenanceNeed: 26,
    lastCollectedDayOffset: 1,
  },
  {
    id: 'yesilvadi-main-park',
    neighborhoodId: 'yesilvadi',
    name: 'Ana Park Kutusu',
    type: 'park_bin',
    locationKey: 'yesilvadi-main-park',
    locationLabel: 'Ana Park',
    fillRate: 44,
    condition: 84,
    odorLevel: 20,
    maintenanceNeed: 12,
    lastCollectedDayOffset: 1,
  },
  {
    id: 'yesilvadi-playground',
    neighborhoodId: 'yesilvadi',
    name: 'Oyun Alanı Park Kutusu',
    type: 'park_bin',
    locationKey: 'yesilvadi-playground',
    locationLabel: 'Oyun Alanı',
    fillRate: 48,
    condition: 82,
    odorLevel: 22,
    maintenanceNeed: 15,
    lastCollectedDayOffset: 1,
  },
  {
    id: 'yesilvadi-recycling-gate',
    neighborhoodId: 'yesilvadi',
    name: 'Park Girişi Geri Dönüşüm',
    type: 'recycling',
    locationKey: 'yesilvadi-park-gate',
    locationLabel: 'Park Girişi',
    fillRate: 28,
    condition: 90,
    odorLevel: 6,
    maintenanceNeed: 8,
    lastCollectedDayOffset: 1,
  },
  {
    id: 'yesilvadi-walkway-organic',
    neighborhoodId: 'yesilvadi',
    name: 'Yürüyüş Yolu Organik',
    type: 'organic',
    locationKey: 'yesilvadi-walkway',
    locationLabel: 'Yürüyüş Yolu',
    fillRate: 36,
    condition: 85,
    odorLevel: 24,
    maintenanceNeed: 10,
    lastCollectedDayOffset: 1,
  },
];

const CONTAINER_TYPES: ContainerType[] = [
  'standard_waste',
  'recycling',
  'organic',
  'market_waste',
  'industrial_waste',
  'park_bin',
];

const CONTAINER_UNIT_STATUSES = [
  'normal',
  'needs_collection',
  'overflowing',
  'needs_maintenance',
  'disabled',
] as const;

function isRecord(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function buildSeedUnit(def: SeedUnitDef, currentDay: number): ContainerUnit {
  return normalizeContainerUnit({
    id: def.id,
    neighborhoodId: def.neighborhoodId,
    name: def.name,
    type: def.type,
    location: {
      locationKey: def.locationKey,
      locationLabel: def.locationLabel,
      mapZone: def.neighborhoodId,
      x: def.x,
      y: def.y,
    },
    capacity: def.capacity ?? 100,
    fillRate: def.fillRate,
    condition: def.condition,
    odorLevel: def.odorLevel,
    maintenanceNeed: def.maintenanceNeed,
    overflowRisk: 'low',
    lastCollectedDay: Math.max(1, currentDay - def.lastCollectedDayOffset),
    status: 'normal',
    complaintPressure: 0,
    tags: def.tags,
  });
}

export function createInitialContainerState(currentDay = 1): ContainerState {
  const day = Math.max(1, currentDay);
  const units = SEED_UNIT_DEFS.map((def) => buildSeedUnit(def, day));

  return {
    units,
    aggregates: recomputeContainerAggregates(units, day),
    /** İlk gün sonu tick’i için bir gün geride başlar (idempotency). */
    lastProcessedDay: Math.max(0, day - 1),
  };
}

function parseContainerUnit(
  raw: Record<string, unknown>,
  currentDay: number,
): ContainerUnit | null {
  const neighborhoodId = normalizeContainerNeighborhoodId(
    typeof raw.neighborhoodId === 'string' ? raw.neighborhoodId : null,
  );

  if (
    !neighborhoodId ||
    typeof raw.id !== 'string' ||
    typeof raw.name !== 'string' ||
    typeof raw.type !== 'string' ||
    !CONTAINER_TYPES.includes(raw.type as ContainerType)
  ) {
    return null;
  }

  const locationRaw = isRecord(raw.location) ? raw.location : {};
  const mapZone = requireContainerNeighborhoodId(
    typeof locationRaw.mapZone === 'string' ? locationRaw.mapZone : neighborhoodId,
    neighborhoodId,
  );

  const unit: ContainerUnit = {
    id: raw.id,
    neighborhoodId,
    name: raw.name,
    type: raw.type as ContainerType,
    location: {
      locationKey:
        typeof locationRaw.locationKey === 'string'
          ? locationRaw.locationKey
          : `${neighborhoodId}-${raw.id}`,
      locationLabel:
        typeof locationRaw.locationLabel === 'string'
          ? locationRaw.locationLabel
          : raw.name,
      mapZone,
      x: typeof locationRaw.x === 'number' ? locationRaw.x : undefined,
      y: typeof locationRaw.y === 'number' ? locationRaw.y : undefined,
    },
    capacity: typeof raw.capacity === 'number' ? raw.capacity : 100,
    fillRate: typeof raw.fillRate === 'number' ? raw.fillRate : 0,
    condition: typeof raw.condition === 'number' ? raw.condition : 100,
    odorLevel: typeof raw.odorLevel === 'number' ? raw.odorLevel : 0,
    maintenanceNeed:
      typeof raw.maintenanceNeed === 'number' ? raw.maintenanceNeed : 0,
    overflowRisk: 'low',
    lastCollectedDay:
      typeof raw.lastCollectedDay === 'number'
        ? raw.lastCollectedDay
        : currentDay,
    status:
      typeof raw.status === 'string' &&
      CONTAINER_UNIT_STATUSES.includes(
        raw.status as (typeof CONTAINER_UNIT_STATUSES)[number],
      )
        ? (raw.status as ContainerUnit['status'])
        : 'normal',
    complaintPressure:
      typeof raw.complaintPressure === 'number' ? raw.complaintPressure : 0,
    linkedEventIds: Array.isArray(raw.linkedEventIds)
      ? raw.linkedEventIds.filter((id): id is string => typeof id === 'string')
      : undefined,
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter((tag): tag is string => typeof tag === 'string')
      : undefined,
  };

  return normalizeContainerUnit(unit);
}

export function normalizePersistedContainerState(
  raw: unknown,
  currentDay: number,
): ContainerState {
  const day = Math.max(1, currentDay);

  if (!isRecord(raw) || !Array.isArray(raw.units)) {
    return createInitialContainerState(day);
  }

  const units: ContainerUnit[] = [];
  for (const item of raw.units) {
    if (!isRecord(item)) {
      continue;
    }
    const unit = parseContainerUnit(item, day);
    if (unit) {
      units.push(unit);
    }
  }

  if (units.length === 0) {
    return createInitialContainerState(day);
  }

  const lastProcessedDay =
    typeof raw.lastProcessedDay === 'number' ? raw.lastProcessedDay : day;

  const dayModifiers = isRecord(raw.dayModifiers)
    ? {
        isMarketDay:
          typeof raw.dayModifiers.isMarketDay === 'boolean'
            ? raw.dayModifiers.isMarketDay
            : undefined,
        weatherId:
          typeof raw.dayModifiers.weatherId === 'string'
            ? raw.dayModifiers.weatherId
            : undefined,
      }
    : undefined;

  return {
    units,
    aggregates: recomputeContainerAggregates(units, lastProcessedDay),
    lastProcessedDay,
    dayModifiers,
  };
}
