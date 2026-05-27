import { createId } from '@/core/game/createId';
import {
  DEFAULT_DISTRICT_TYPE,
  getDistrictProfile,
} from '@/core/districts/districtProfiles';
import {
  DISTRICT_EVENT_WEIGHT_ORDER,
  FALLBACK_EVENT_TYPE,
  getDistrictEventWeights,
} from '@/core/districts/districtEventRules';
import type {
  CalculateDistrictEventSeverityParams,
  CreateDistrictEventParams,
  DistrictBonusHints,
  DistrictEvent,
  DistrictEventType,
  DistrictType,
} from '@/core/districts/types';
import type { EventSeverity } from '@/core/xp/types';

const SEVERITY_THRESHOLDS = {
  critical: 85,
  high: 65,
  medium: 40,
} as const;

/** Pilot / harita id → mahalle karakter tipi (XP modülünden bağımsız). */
const DISTRICT_ID_ALIASES: Record<string, DistrictType> = {
  merkez: 'merkez',
  central: 'merkez',
  cumhuriyet: 'cumhuriyet',
  sanayi: 'sanayi',
  industrial_market: 'pazar',
  sanayipazar: 'pazar',
  pazar: 'pazar',
  yesilpark: 'yesilpark',
  istasyon: 'istasyon',
};

export function resolveDistrictType(
  districtId?: string,
  districtType?: DistrictType,
): DistrictType {
  if (districtType) {
    return districtType;
  }
  if (!districtId) {
    return DEFAULT_DISTRICT_TYPE;
  }
  const normalized = districtId.trim().toLowerCase().replace(/[\s_-]+/g, '');
  return DISTRICT_ID_ALIASES[normalized] ?? DEFAULT_DISTRICT_TYPE;
}

function clampMetric(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function eventSpecificPressure(
  eventType: DistrictEventType,
  profile: ReturnType<typeof getDistrictProfile>,
): number {
  switch (eventType) {
    case 'social_media_complaint':
      return profile.socialMediaSensitivity * 0.25;
    case 'route_delay':
      return profile.trafficDensity * 0.25;
    case 'vehicle_breakdown_risk':
      return profile.vehicleDependency * 0.25;
    case 'waste_overflow':
      return profile.wastePressure * 0.25;
    case 'staff_fatigue_pressure':
      return profile.staffLoadPressure * 0.25;
    case 'public_trust_drop':
      return profile.publicTrustSensitivity * 0.25;
    case 'park_cleanliness':
      return profile.complaintSensitivity * 0.2;
    case 'market_crowding':
      return profile.trafficDensity * 0.2;
    case 'sidewalk_blocked':
      return profile.trafficDensity * 0.18;
    case 'noise_complaint':
      return profile.complaintSensitivity * 0.18;
    case 'delayed_collection':
      return profile.wastePressure * 0.18;
    default:
      return profile.baseRisk * 0.1;
  }
}

export function calculateDistrictEventSeverity(
  params: CalculateDistrictEventSeverityParams,
): EventSeverity {
  const { districtProfile, eventType, currentRisk, day, activeEventCount } =
    params;

  const riskScore =
    districtProfile.baseRisk * 0.35 +
    clampMetric(currentRisk) * 0.35 +
    Math.max(1, day) * 3 +
    Math.max(0, activeEventCount) * 5 +
    eventSpecificPressure(eventType, districtProfile);

  if (riskScore >= SEVERITY_THRESHOLDS.critical) {
    return 'critical';
  }
  if (riskScore >= SEVERITY_THRESHOLDS.high) {
    return 'high';
  }
  if (riskScore >= SEVERITY_THRESHOLDS.medium) {
    return 'medium';
  }
  return 'low';
}

export function pickWeightedEventType(
  districtType: DistrictType,
  randomFn: () => number = Math.random,
): DistrictEventType {
  const weights = getDistrictEventWeights(districtType);
  const entries = DISTRICT_EVENT_WEIGHT_ORDER.filter(
    (type) => (weights[type] ?? 0) > 0,
  ).map((type) => [type, weights[type]!] as const);

  if (entries.length === 0) {
    return FALLBACK_EVENT_TYPE;
  }

  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (total <= 0) {
    return FALLBACK_EVENT_TYPE;
  }

  let roll = randomFn() * total;
  for (const [type, weight] of entries) {
    roll -= weight;
    if (roll <= 0) {
      return type;
    }
  }

  return entries[entries.length - 1]![0];
}

type EventTemplate = {
  title: string | ((districtName: string) => string);
  description: string;
  tags: string[];
  bonusHints: DistrictBonusHints;
};

const EVENT_TEMPLATES: Record<DistrictEventType, EventTemplate> = {
  waste_overflow: {
    title: (name) => `${name} Bölgesinde Konteyner Taşması`,
    description:
      'Konteyner kapasitesi aşıldı; çevre kirliliği ve şikayet riski artıyor.',
    tags: ['atık', 'konteyner'],
    bonusHints: { trafficReduced: true },
  },
  delayed_collection: {
    title: (name) => `${name} Bölgesinde Çöp Toplama Gecikti`,
    description:
      'Toplama rotası gecikti; mahallede birikim ve koku şikayetleri başlayabilir.',
    tags: ['atık', 'rota'],
    bonusHints: { resolvedQuickly: true },
  },
  sidewalk_blocked: {
    title: (name) => `${name} Kaldırımında Geçiş Engeli`,
    description:
      'Yaya geçişi kısıtlandı; esnaf ve vatandaş akışı etkileniyor.',
    tags: ['kaldırım', 'geçiş'],
    bonusHints: { trafficReduced: true, crowdControlled: true },
  },
  market_crowding: {
    title: () => 'Pazar Yoğunluğu Kaldırımı Zorluyor',
    description:
      'Yoğun saatlerde yapılan yükleme, yaya akışını ve esnaf düzenini etkiliyor.',
    tags: ['yoğunluk', 'kaldırım', 'esnaf'],
    bonusHints: { trafficReduced: true, crowdControlled: true },
  },
  vehicle_breakdown_risk: {
    title: () => 'Sanayi Rotasında Araç Arıza Riski',
    description:
      'Araç yükü ve rota uzunluğu arıza ihtimalini yükseltiyor.',
    tags: ['araç', 'rota', 'operasyon'],
    bonusHints: { vehicleBreakdownPrevented: true, trafficReduced: true },
  },
  noise_complaint: {
    title: (name) => `${name} Bölgesinde Gürültü Şikayeti`,
    description:
      'Gece veya sabah saatlerinde artan gürültü şikayetleri kayda geçti.',
    tags: ['gürültü', 'şikayet'],
    bonusHints: { socialRiskPrevented: true },
  },
  social_media_complaint: {
    title: (name) => `${name} Şikayeti Sosyal Medyada Büyüyor`,
    description:
      'Mahalle sakinleri şikayeti dijital kanallarda paylaşmaya başladı.',
    tags: ['sosyal medya', 'algı'],
    bonusHints: { socialRiskPrevented: true, publicTrustProtected: true },
  },
  park_cleanliness: {
    title: () => 'Yeşilpark’ta Temizlik Hassasiyeti',
    description:
      'Park alanında temizlik beklentisi yükseldi; aile kullanımı etkilenebilir.',
    tags: ['park', 'temizlik', 'çevre'],
    bonusHints: { parkOrderProtected: true, publicTrustProtected: true },
  },
  route_delay: {
    title: (name) => `${name} Rota Gecikmesi`,
    description:
      'Ekip rotasında gecikme oluştu; müdahale süresi uzayabilir.',
    tags: ['rota', 'gecikme'],
    bonusHints: { trafficReduced: true, resolvedQuickly: true },
  },
  staff_fatigue_pressure: {
    title: (name) => `${name} Ekibinde Yorgunluk Baskısı`,
    description:
      'Personel yükü arttı; moralsizlik ve hata riski yükseliyor.',
    tags: ['personel', 'yorgunluk'],
    bonusHints: { resolvedQuickly: true },
  },
  public_trust_drop: {
    title: (name) => `${name} Mahalle Güveni Zayıflıyor`,
    description:
      'Görünür hizmet eksikliği kamu güvenini zayıflatıyor.',
    tags: ['güven', 'algı'],
    bonusHints: { publicTrustProtected: true },
  },
};

function resolveTitle(
  template: EventTemplate,
  districtName: string,
): string {
  return typeof template.title === 'function'
    ? template.title(districtName)
    : template.title;
}

export function createDistrictEvent(params: CreateDistrictEventParams): DistrictEvent {
  const districtType = resolveDistrictType(undefined, params.districtType);
  const profile = getDistrictProfile(districtType);
  const eventType =
    params.eventType ??
    pickWeightedEventType(districtType, params.randomFn ?? Math.random);

  const template = EVENT_TEMPLATES[eventType];
  const severity = calculateDistrictEventSeverity({
    districtProfile: profile,
    eventType,
    currentRisk: params.currentRisk,
    day: params.day,
    activeEventCount: params.activeEventCount,
  });

  const safeDay = Math.max(1, Math.floor(params.day));

  return {
    id: createId(`event_day${safeDay}_${districtType}_${eventType}`),
    day: safeDay,
    districtType,
    districtName: profile.name,
    type: eventType,
    severity,
    title: resolveTitle(template, profile.name),
    description: template.description,
    tags: [...profile.tags, ...template.tags],
    xpDistrictType: districtType,
    districtBonusHints: { ...template.bonusHints },
  };
}
