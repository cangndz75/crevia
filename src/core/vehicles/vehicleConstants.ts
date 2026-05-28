import type {
  VehicleCategory,
  VehicleDecisionAction,
  VehicleNeighborhoodId,
  VehicleOperationalStatus,
} from './vehicleTypes';

type VehicleDecisionActionWithVehicle = Exclude<VehicleDecisionAction, 'none'>;

export type VehicleDailyMetricDeltas = {
  workload: number;
  fuelOrCharge: number;
  condition: number;
  maintenanceNeed: number;
  routeEfficiency: number;
  breakdownRisk: number;
};

export const VEHICLE_NEIGHBORHOOD_IDS: readonly VehicleNeighborhoodId[] = [
  'merkez',
  'cumhuriyet',
  'sanayi',
  'istasyon',
  'yesilvadi',
] as const;

export const VEHICLE_CATEGORIES: readonly VehicleCategory[] = [
  'garbage_truck',
  'small_response',
  'maintenance_vehicle',
  'inspection_vehicle',
  'utility_pickup',
] as const;

export const VEHICLE_OPERATIONAL_STATUSES: readonly VehicleOperationalStatus[] =
  [
    'available',
    'assigned',
    'maintenance',
    'broken',
    'resting',
  ] as const;

export const VEHICLE_METRIC_MIN = 0;
export const VEHICLE_METRIC_MAX = 100;

export const VEHICLE_CONDITION_THRESHOLDS = {
  good: 75,
  worn: 55,
  risky: 35,
  critical: 35,
} as const;

export const VEHICLE_WORKLOAD_THRESHOLDS = {
  low: 30,
  moderate: 55,
  high: 75,
  critical: 90,
} as const;

export const VEHICLE_BREAKDOWN_RISK_THRESHOLDS = {
  low: 20,
  elevated: 45,
  high: 70,
  critical: 85,
} as const;

export const VEHICLE_CRITICAL_AGGREGATE = {
  conditionMax: 35,
  breakdownRiskMin: 70,
  maintenanceNeedMin: 75,
} as const;

export const VEHICLE_DEFAULT_DAY_MODIFIERS = {
  routePressure: 0,
  maintenancePressure: 0,
  fuelPressure: 0,
} as const;

/** Gün sonu status bazlı metrik deltaları (0-100 clamp öncesi). */
export const VEHICLE_DAILY_STATUS_DELTAS: Record<
  VehicleOperationalStatus,
  VehicleDailyMetricDeltas
> = {
  available: {
    workload: -6,
    fuelOrCharge: -2,
    condition: -1,
    maintenanceNeed: 2,
    routeEfficiency: -1,
    breakdownRisk: 1,
  },
  assigned: {
    workload: 10,
    fuelOrCharge: -8,
    condition: -4,
    maintenanceNeed: 7,
    routeEfficiency: -3,
    breakdownRisk: 5,
  },
  maintenance: {
    workload: -10,
    fuelOrCharge: -1,
    condition: 8,
    maintenanceNeed: -14,
    routeEfficiency: 2,
    breakdownRisk: -10,
  },
  broken: {
    workload: -5,
    fuelOrCharge: 0,
    condition: 0,
    maintenanceNeed: 0,
    routeEfficiency: -2,
    breakdownRisk: 0,
  },
  resting: {
    workload: -12,
    fuelOrCharge: 3,
    condition: 2,
    maintenanceNeed: -4,
    routeEfficiency: 1,
    breakdownRisk: -3,
  },
};

/** routePressure / maintenancePressure / fuelPressure → çarpan (0 baskı = 1.0). */
export const VEHICLE_DAY_MODIFIER_LIMITS = {
  min: 0.8,
  max: 1.25,
  neutral: 1,
  span: 0.25,
} as const;

export const VEHICLE_BREAKDOWN_LIMITS = {
  conditionMax: 20,
  breakdownRiskMin: 90,
} as const;

/** Bakımdan çıkış eşikleri — otomatik bakıma alma yok, sadece recovery. */
export const VEHICLE_RECOVERY_LIMITS = {
  maintenanceNeedMax: 35,
  conditionMin: 60,
} as const;

export const VEHICLE_CATEGORY_LABELS: Record<VehicleCategory, string> = {
  garbage_truck: 'Çöp Toplama Aracı',
  small_response: 'Küçük Müdahale Aracı',
  maintenance_vehicle: 'Bakım Aracı',
  inspection_vehicle: 'Denetim Aracı',
  utility_pickup: 'Hizmet Pickup',
};

export const VEHICLE_STATUS_LABELS: Record<VehicleOperationalStatus, string> = {
  available: 'Müsait',
  assigned: 'Görevde',
  maintenance: 'Bakımda',
  broken: 'Arızalı',
  resting: 'Dinleniyor',
};

export const VEHICLE_DECISION_INTENSITY_LIMITS = {
  low: 0.85,
  normal: 1,
  urgent: 1.15,
  heavy: 1.2,
  min: 0.85,
  max: 1.2,
} as const;

export const VEHICLE_DECISION_ACTION_DELTAS: Record<
  Exclude<VehicleDecisionAction, 'none'>,
  VehicleDailyMetricDeltas
> = {
  dispatch_collection: {
    workload: 14,
    fuelOrCharge: -9,
    condition: -3,
    routeEfficiency: -2,
    maintenanceNeed: 5,
    breakdownRisk: 4,
  },
  dispatch_response: {
    workload: 9,
    fuelOrCharge: -6,
    condition: -2,
    routeEfficiency: -1,
    maintenanceNeed: 3,
    breakdownRisk: 2,
  },
  prioritize_route: {
    workload: 7,
    fuelOrCharge: -5,
    condition: -2,
    routeEfficiency: 6,
    maintenanceNeed: 2,
    breakdownRisk: 2,
  },
  maintenance: {
    workload: 8,
    fuelOrCharge: -5,
    condition: -2,
    routeEfficiency: 0,
    maintenanceNeed: 2,
    breakdownRisk: 1,
  },
  permanent_solution: {
    workload: 12,
    fuelOrCharge: -7,
    condition: -3,
    routeEfficiency: 3,
    maintenanceNeed: 4,
    breakdownRisk: 3,
  },
  add_capacity: {
    workload: 10,
    fuelOrCharge: -7,
    condition: -2,
    routeEfficiency: 2,
    maintenanceNeed: 3,
    breakdownRisk: 2,
  },
  monitor: {
    workload: 6,
    fuelOrCharge: -4,
    condition: -1,
    routeEfficiency: 1,
    maintenanceNeed: 1,
    breakdownRisk: 1,
  },
};

export const VEHICLE_ACTION_CATEGORY_PRIORITY: Record<
  VehicleDecisionAction,
  readonly VehicleCategory[]
> = {
  dispatch_collection: ['garbage_truck', 'utility_pickup'],
  dispatch_response: ['small_response', 'utility_pickup'],
  prioritize_route: ['garbage_truck', 'small_response'],
  maintenance: ['maintenance_vehicle', 'utility_pickup'],
  permanent_solution: [
    'maintenance_vehicle',
    'utility_pickup',
    'garbage_truck',
  ],
  add_capacity: ['utility_pickup', 'garbage_truck'],
  monitor: ['inspection_vehicle', 'small_response'],
  none: [],
};

export const VEHICLE_DECISION_KEYWORDS = {
  maintenance: [
    'bakım',
    'bakim',
    'tamir',
    'onarım',
    'onarim',
    'servis',
    'arıza',
    'ariza',
    'ekipman kontrolü',
    'ekipman kontrolu',
    'maintenance',
    'repair',
  ],
  permanent_solution: [
    'kalıcı çözüm',
    'kalici cozum',
    'kalıcı',
    'kalici',
    'altyapı',
    'altyapi',
    'yenile',
    'düzenleme',
    'duzenleme',
    'iyileştirme',
    'iyilestirme',
    'planlı çalışma',
    'planli calisma',
    'permanent',
  ],
  add_capacity: [
    'ek araç',
    'ek arac',
    'takviye',
    'kapasite',
    'pickup',
    'destek aracı',
    'destek araci',
    'ilave',
    'add capacity',
  ],
  dispatch_collection: [
    'çöp',
    'cop',
    'atık',
    'atik',
    'konteyner',
    'toplama',
    'taşma',
    'tasma',
    'koku',
    'pazar yeri',
    'temizlik aracı',
    'temizlik araci',
    'çöp aracı',
    'cop araci',
    'waste',
    'collect',
    'overflow',
  ],
  prioritize_route: [
    'rota',
    'önceliklendir',
    'onceliklendir',
    'yönlendir',
    'yonlendir',
    'optimize',
    'güzergah',
    'guzergah',
    'yoğun bölge',
    'yogun bolge',
    'route',
    'prioritize',
  ],
  dispatch_response: [
    'hızlı müdahale',
    'hizli mudahale',
    'saha ekibi gönder',
    'saha ekibi gonder',
    'olay yerine',
    'yerinde müdahale',
    'yerinde mudahale',
    'küçük ekip',
    'kucuk ekip',
    'acil ekip',
    'field response',
  ],
  monitor: [
    'denetim',
    'kontrol',
    'izle',
    'gözlem',
    'gozlem',
    'devriye',
    'saha kontrolü',
    'saha kontrolu',
    'sahada takip',
    'saha gözlemi',
    'saha gozlemi',
    'inspect',
    'patrol',
  ],
  none: [
    'iletişim',
    'iletisim',
    'duyuru',
    'açıklama',
    'aciklama',
    'bilgilendir',
    'sosyal medya',
    'toplantı',
    'toplanti',
    'muhtar görüşmesi',
    'muhtar gorusmesi',
    'kayıt aç',
    'kayit ac',
    'communication',
    'announce',
  ],
} as const;

export const VEHICLE_EVENT_RELEVANCE_KEYWORDS = [
  'çöp',
  'cop',
  'atık',
  'atik',
  'konteyner',
  'araç',
  'arac',
  'rota',
  'saha',
  'bakım',
  'bakim',
  'temizlik',
  'toplama',
  'waste',
  'vehicle',
  'dispatch',
  'taşma',
  'tasma',
  'koku',
  'pickup',
  'truck',
] as const;

export const VEHICLE_DECISION_UNAVAILABLE_TEXT: Partial<
  Record<VehicleDecisionActionWithVehicle, string>
> & { default: string } = {
  dispatch_collection: 'Uygun çöp toplama aracı müsait değil.',
  maintenance: 'Bakım aracı müsait değil.',
  monitor: 'Denetim aracı müsait değil.',
  dispatch_response: 'Uygun müdahale aracı müsait değil.',
  prioritize_route: 'Rota için uygun araç müsait değil.',
  permanent_solution: 'Kalıcı çözüm için uygun araç müsait değil.',
  add_capacity: 'Kapasite takviyesi için uygun araç müsait değil.',
  default: 'Bu karar için uygun araç müsait değil.',
};

export const VEHICLE_PREVIEW_SHOW_THRESHOLDS = {
  workloadDelta: 8,
  fuelDelta: -6,
  maintenanceDelta: 3,
} as const;

export const VEHICLE_PREVIEW_RISK_THRESHOLDS = {
  high: {
    currentBreakdownRisk: 55,
    currentMaintenanceNeed: 65,
    currentCondition: 45,
    projectedBreakdownRisk: 65,
    projectedMaintenanceNeed: 70,
  },
  medium: {
    projectedWorkload: 60,
    projectedFuel: 35,
    projectedCondition: 60,
    maintenanceDelta: 4,
  },
} as const;

export const VEHICLE_DECISION_INTENSITY_KEYWORDS = {
  low: [
    'iletişim',
    'iletisim',
    'bilgilendir',
    'açıklama',
    'aciklama',
    'cautious',
    'communication',
    'resource_saving',
  ],
  urgent: [
    'hızlı',
    'hizli',
    'acil',
    'fast',
    'risky',
    'bold',
    'urgent',
    'critical',
  ],
  heavy: [
    'kalıcı',
    'kalici',
    'permanent',
    'altyapı',
    'altyapi',
    'planned',
    'ağır',
    'agir',
  ],
} as const;
