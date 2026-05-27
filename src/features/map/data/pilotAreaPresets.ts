import { colors } from '@/ui/theme/colors';

import type {
  MapFilterId,
  MapPin,
  PilotAreaId,
  PilotAreaPreset,
  PilotDayEvent,
} from '../types/map';

const MERKEZ_REGION = 'central' as const;
const CUMHURIYET_REGION = 'cumhuriyet' as const;
const SANAYI_REGION = 'industrial_market' as const;

function pin(
  partial: Omit<MapPin, 'color' | 'icon'> & { color?: string; icon?: string },
): MapPin {
  const severity = partial.severity ?? 'medium';
  const color =
    partial.color ??
    (severity === 'critical' || severity === 'high'
      ? colors.danger
      : severity === 'medium'
        ? colors.warning
        : colors.success);
  return {
    ...partial,
    color,
    icon: partial.icon ?? 'alert-circle',
  };
}

function buildDayEvents(
  base: Omit<PilotDayEvent, 'day'>[],
): Record<number, PilotDayEvent> {
  return Object.fromEntries(base.map((e, i) => [i + 1, { ...e, day: i + 1 }]));
}

// ---------------------------------------------------------------------------
// Merkez Pilot Bölge
// ---------------------------------------------------------------------------

const merkezPins: Record<MapFilterId, MapPin[]> = {
  events: [
    pin({ id: 'm-ev1', type: 'event', label: 'Meydan temizlik', x: 0.42, y: 0.38, regionId: MERKEZ_REGION, severity: 'low', icon: 'leaf' }),
    pin({ id: 'm-ev2', type: 'event', label: 'Konteyner doluluk', x: 0.52, y: 0.44, regionId: MERKEZ_REGION, severity: 'medium', icon: 'trash' }),
    pin({ id: 'm-ev3', type: 'event', label: 'Hizmet noktası', x: 0.48, y: 0.32, regionId: MERKEZ_REGION, severity: 'low', icon: 'business' }),
  ],
  risk: [
    pin({ id: 'm-rk1', type: 'risk', label: 'Ana cadde', x: 0.45, y: 0.4, regionId: MERKEZ_REGION, severity: 'medium', icon: 'warning' }),
    pin({ id: 'm-rk2', type: 'risk', label: 'Meydan çevresi', x: 0.5, y: 0.35, regionId: MERKEZ_REGION, severity: 'low', icon: 'warning' }),
  ],
  crews: [
    pin({ id: 'm-cr1', type: 'crew', label: 'Ekip 1', x: 0.44, y: 0.36, regionId: MERKEZ_REGION, icon: 'people', color: colors.purple }),
    pin({ id: 'm-cr2', type: 'crew', label: 'Ekip 2', x: 0.54, y: 0.42, regionId: MERKEZ_REGION, icon: 'people', color: colors.purple }),
  ],
  vehicles: [
    pin({ id: 'm-vh1', type: 'vehicle', label: 'Hizmet', x: 0.46, y: 0.38, regionId: MERKEZ_REGION, icon: 'car', color: colors.secondary }),
    pin({ id: 'm-vh2', type: 'vehicle', label: 'Temizlik', x: 0.52, y: 0.4, regionId: MERKEZ_REGION, icon: 'car', color: colors.secondary }),
  ],
  containers: [
    pin({ id: 'm-cn1', type: 'container', label: '%62', x: 0.48, y: 0.4, regionId: MERKEZ_REGION, severity: 'medium', value: '62', icon: 'trash' }),
    pin({ id: 'm-cn2', type: 'container', label: '%45', x: 0.42, y: 0.44, regionId: MERKEZ_REGION, severity: 'medium', value: '45', icon: 'trash' }),
  ],
};

const merkezDayEvents = buildDayEvents([
  { theme: 'Öğrenme', mainEventTitle: 'İlk saha görünümü', mainEventDescription: 'Haritayı keşfet, ekip ve olay mantığını öğren.', activeOperationTitle: 'Meydan Temizlik Kontrolü', pinMultiplier: 0.7, prominentFilter: 'events' },
  { theme: 'Şikayet Baskısı', mainEventTitle: 'Küçük şikayet artışı', mainEventDescription: 'Ana cadde çevresinde birkaç yeni bildirim.', activeOperationTitle: 'Meydan Temizlik Kontrolü', pinMultiplier: 0.85, prominentFilter: 'events' },
  { theme: 'Kaynak Baskısı', mainEventTitle: 'Ekip planı sıkışıyor', mainEventDescription: 'İki ekibin görev yükü artıyor.', activeOperationTitle: 'Ana Cadde Kontrolü', pinMultiplier: 1, prominentFilter: 'crews' },
  { theme: 'Sosyal Baskı', mainEventTitle: 'Görünürlük riski', mainEventDescription: 'Meydan çevresi daha fazla dikkat çekiyor.', activeOperationTitle: 'Görünür Hizmet Rotası', pinMultiplier: 1, prominentFilter: 'risk' },
  { theme: 'Fırsat', mainEventTitle: 'İyileştirme fırsatı', mainEventDescription: 'Hizmet noktası çevresinde hızlı kazanım mümkün.', activeOperationTitle: 'Hizmet Noktası Denetimi', pinMultiplier: 1, prominentFilter: 'events' },
  { theme: 'Kelebek Etkisi', mainEventTitle: 'Önceki kararın etkisi', mainEventDescription: 'Dünkü müdahale meydan riskini düşürdü.', activeOperationTitle: 'Meydan Temizlik Kontrolü', warningText: 'Önceki kararın bu bölgede olumlu etki yarattı.', pinMultiplier: 1, prominentFilter: 'risk' },
  { theme: 'Final', mainEventTitle: 'Pilot bölge özeti', mainEventDescription: 'Merkez pilot bölgesindeki 7 günlük performans.', activeOperationTitle: 'Günlük Operasyon Özeti', pinMultiplier: 0.9, prominentFilter: 'events' },
]);

// ---------------------------------------------------------------------------
// Cumhuriyet Mahallesi
// ---------------------------------------------------------------------------

const cumhuriyetPins: Record<MapFilterId, MapPin[]> = {
  events: [
    pin({ id: 'c-ev1', type: 'event', label: 'Ara sokak çöp', x: 0.18, y: 0.62, regionId: CUMHURIYET_REGION, severity: 'high', icon: 'alert-circle' }),
    pin({ id: 'c-ev2', type: 'social', label: 'Sosyal medya', x: 0.28, y: 0.68, regionId: CUMHURIYET_REGION, severity: 'high', icon: 'megaphone' }),
    pin({ id: 'c-ev3', type: 'event', label: 'Okul çevresi', x: 0.22, y: 0.72, regionId: CUMHURIYET_REGION, severity: 'medium', icon: 'school' }),
    pin({ id: 'c-ev4', type: 'event', label: 'Park koku', x: 0.32, y: 0.65, regionId: CUMHURIYET_REGION, severity: 'medium', icon: 'leaf' }),
    pin({ id: 'c-ev5', type: 'event', label: 'Çağrı merkezi', x: 0.15, y: 0.7, regionId: CUMHURIYET_REGION, severity: 'high', icon: 'call' }),
  ],
  risk: [
    pin({ id: 'c-rk1', type: 'risk', label: 'Şikayet yayılımı', x: 0.2, y: 0.64, regionId: CUMHURIYET_REGION, severity: 'high', icon: 'warning' }),
    pin({ id: 'c-rk2', type: 'risk', label: 'Park / okul', x: 0.3, y: 0.7, regionId: CUMHURIYET_REGION, severity: 'medium', icon: 'warning' }),
  ],
  crews: [
    pin({ id: 'c-cr1', type: 'crew', label: 'Ekip 1', x: 0.18, y: 0.62, regionId: CUMHURIYET_REGION, icon: 'people', color: colors.purple }),
    pin({ id: 'c-cr2', type: 'crew', label: 'Ekip 2', x: 0.28, y: 0.68, regionId: CUMHURIYET_REGION, icon: 'people', color: colors.purple }),
    pin({ id: 'c-cr3', type: 'crew', label: 'Ekip 3', x: 0.24, y: 0.74, regionId: CUMHURIYET_REGION, icon: 'people', color: colors.purple }),
  ],
  vehicles: [
    pin({ id: 'c-vh1', type: 'vehicle', label: 'Hizmet', x: 0.2, y: 0.64, regionId: CUMHURIYET_REGION, icon: 'car', color: colors.secondary }),
    pin({ id: 'c-vh2', type: 'vehicle', label: 'Temizlik', x: 0.26, y: 0.7, regionId: CUMHURIYET_REGION, icon: 'car', color: colors.secondary }),
    pin({ id: 'c-vh3', type: 'vehicle', label: 'Park bakım', x: 0.3, y: 0.66, regionId: CUMHURIYET_REGION, icon: 'car', color: colors.secondary }),
  ],
  containers: [
    pin({ id: 'c-cn1', type: 'container', label: '%88', x: 0.16, y: 0.66, regionId: CUMHURIYET_REGION, severity: 'high', value: '88', icon: 'trash' }),
    pin({ id: 'c-cn2', type: 'container', label: '%72', x: 0.24, y: 0.72, regionId: CUMHURIYET_REGION, severity: 'medium', value: '72', icon: 'trash' }),
    pin({ id: 'c-cn3', type: 'container', label: '%91', x: 0.32, y: 0.68, regionId: CUMHURIYET_REGION, severity: 'critical', value: '91', icon: 'trash' }),
  ],
};

const cumhuriyetDayEvents = buildDayEvents([
  { theme: 'Öğrenme', mainEventTitle: 'Mahalle saha görünümü', mainEventDescription: 'Cumhuriyet’teki şikayet akışını tanı.', activeOperationTitle: 'Ara Sokak Şikayet Müdahalesi', pinMultiplier: 0.75, prominentFilter: 'events' },
  { theme: 'Şikayet Baskısı', mainEventTitle: 'Şikayetler hızla artıyor', mainEventDescription: 'Ara sokak ve site önü bildirimleri yoğunlaşıyor.', activeOperationTitle: 'Ara Sokak Şikayet Müdahalesi', pinMultiplier: 1.1, prominentFilter: 'events' },
  { theme: 'Kaynak Baskısı', mainEventTitle: 'Ekip temposu yükseldi', mainEventDescription: 'Üç ekip aynı anda farklı noktalarda.', activeOperationTitle: 'Öncelikli Şikayet Rotası', pinMultiplier: 1, prominentFilter: 'crews' },
  { theme: 'Sosyal Baskı', mainEventTitle: 'Sosyal medya baskısı', mainEventDescription: 'Vatandaş paylaşımları görünürlüğü artırıyor.', activeOperationTitle: 'Sosyal Görünürlük Müdahalesi', pinMultiplier: 1.15, prominentFilter: 'risk' },
  { theme: 'Fırsat', mainEventTitle: 'Memnuniyet fırsatı', mainEventDescription: 'Park çevresinde hızlı iyileştirme şansı.', activeOperationTitle: 'Park Çevresi Temizlik', pinMultiplier: 1, prominentFilter: 'events' },
  { theme: 'Kelebek Etkisi', mainEventTitle: 'Kararın etkisi', mainEventDescription: 'Önceki müdahale okul çevresinde risk oluşturdu.', activeOperationTitle: 'Okul Çevresi Denetimi', warningText: 'Önceki kararın bu bölgede yeni bir risk oluşturdu.', pinMultiplier: 1.1, prominentFilter: 'risk' },
  { theme: 'Final', mainEventTitle: 'Mahalle performans özeti', mainEventDescription: 'Cumhuriyet pilot sürecinin genel tablosu.', activeOperationTitle: 'Haftalık Memnuniyet Değerlendirmesi', pinMultiplier: 1, prominentFilter: 'events' },
]);

// ---------------------------------------------------------------------------
// Sanayi & Pazar Bölgesi
// ---------------------------------------------------------------------------

const sanayiPins: Record<MapFilterId, MapPin[]> = {
  events: [
    pin({ id: 's-ev1', type: 'event', label: 'Pazar sonrası atık', x: 0.68, y: 0.58, regionId: SANAYI_REGION, severity: 'high', icon: 'trash' }),
    pin({ id: 's-ev2', type: 'event', label: 'Konteyner taşması', x: 0.72, y: 0.64, regionId: SANAYI_REGION, severity: 'critical', icon: 'alert-circle' }),
    pin({ id: 's-ev3', type: 'event', label: 'Rota gecikmesi', x: 0.78, y: 0.6, regionId: SANAYI_REGION, severity: 'medium', icon: 'car' }),
    pin({ id: 's-ev4', type: 'event', label: 'Esnaf talebi', x: 0.65, y: 0.68, regionId: SANAYI_REGION, severity: 'medium', icon: 'storefront' }),
    pin({ id: 's-ev5', type: 'event', label: 'Araç kapasite', x: 0.75, y: 0.7, regionId: SANAYI_REGION, severity: 'high', icon: 'speedometer' }),
  ],
  risk: [
    pin({ id: 's-rk1', type: 'risk', label: 'Pazar atığı', x: 0.7, y: 0.6, regionId: SANAYI_REGION, severity: 'high', icon: 'warning' }),
    pin({ id: 's-rk2', type: 'risk', label: 'Rota gecikmesi', x: 0.76, y: 0.66, regionId: SANAYI_REGION, severity: 'medium', icon: 'warning' }),
    pin({ id: 's-rk3', type: 'risk', label: 'Konteyner kapasite', x: 0.68, y: 0.72, regionId: SANAYI_REGION, severity: 'critical', icon: 'warning' }),
  ],
  crews: [
    pin({ id: 's-cr1', type: 'crew', label: 'Ekip 1', x: 0.66, y: 0.58, regionId: SANAYI_REGION, icon: 'people', color: colors.purple }),
    pin({ id: 's-cr2', type: 'crew', label: 'Ekip 2', x: 0.72, y: 0.64, regionId: SANAYI_REGION, icon: 'people', color: colors.purple }),
    pin({ id: 's-cr3', type: 'crew', label: 'Ekip 3', x: 0.78, y: 0.6, regionId: SANAYI_REGION, icon: 'people', color: colors.purple }),
    pin({ id: 's-cr4', type: 'crew', label: 'Ekip 4', x: 0.7, y: 0.7, regionId: SANAYI_REGION, icon: 'people', color: colors.purple }),
  ],
  vehicles: [
    pin({ id: 's-vh1', type: 'vehicle', label: 'Çöp toplama', x: 0.68, y: 0.6, regionId: SANAYI_REGION, icon: 'car', color: colors.secondary }),
    pin({ id: 's-vh2', type: 'vehicle', label: 'Hizmet', x: 0.74, y: 0.64, regionId: SANAYI_REGION, icon: 'car', color: colors.secondary }),
    pin({ id: 's-vh3', type: 'vehicle', label: 'Rota destek', x: 0.8, y: 0.62, regionId: SANAYI_REGION, icon: 'car', color: colors.warning }),
    pin({ id: 's-vh4', type: 'vehicle', label: 'Bakım', x: 0.72, y: 0.72, regionId: SANAYI_REGION, icon: 'car', color: colors.warning }),
  ],
  containers: [
    pin({ id: 's-cn1', type: 'container', label: '%98', x: 0.7, y: 0.6, regionId: SANAYI_REGION, severity: 'critical', value: '98', icon: 'trash' }),
    pin({ id: 's-cn2', type: 'container', label: '%96', x: 0.76, y: 0.66, regionId: SANAYI_REGION, severity: 'critical', value: '96', icon: 'trash' }),
    pin({ id: 's-cn3', type: 'container', label: '%93', x: 0.68, y: 0.72, regionId: SANAYI_REGION, severity: 'critical', value: '93', icon: 'trash' }),
    pin({ id: 's-cn4', type: 'container', label: '%81', x: 0.78, y: 0.68, regionId: SANAYI_REGION, severity: 'high', value: '81', icon: 'trash' }),
  ],
};

const sanayiDayEvents = buildDayEvents([
  { theme: 'Öğrenme', mainEventTitle: 'Operasyon hattı tanıtımı', mainEventDescription: 'Pazar ve sanayi rotasını haritada izle.', activeOperationTitle: 'Pazar Sonrası Atık Toplama', pinMultiplier: 0.8, prominentFilter: 'events' },
  { theme: 'Şikayet Baskısı', mainEventTitle: 'Esnaf baskısı', mainEventDescription: 'Erken temizlik talepleri artıyor.', activeOperationTitle: 'Pazar Sonrası Atık Toplama', pinMultiplier: 1, prominentFilter: 'events' },
  { theme: 'Kaynak Baskısı', mainEventTitle: 'Araç ve rota baskısı', mainEventDescription: 'Toplama kapasitesi sınıra yaklaşıyor.', activeOperationTitle: 'Rota ve Araç Planı', pinMultiplier: 1.1, prominentFilter: 'vehicles' },
  { theme: 'Sosyal Baskı', mainEventTitle: 'Görünür gecikme riski', mainEventDescription: 'Pazar çevresinde algı bozulabilir.', activeOperationTitle: 'Pazar Görünürlük Rotası', pinMultiplier: 1, prominentFilter: 'risk' },
  { theme: 'Fırsat', mainEventTitle: 'Kapasite iyileştirme', mainEventDescription: 'Yeni rota ile verim artırılabilir.', activeOperationTitle: 'Optimize Toplama Rotası', pinMultiplier: 1, prominentFilter: 'containers' },
  { theme: 'Kelebek Etkisi', mainEventTitle: 'Karar zinciri', mainEventDescription: 'Önceki rota planı gecikmeyi artırdı.', activeOperationTitle: 'Acil Konteyner Müdahalesi', warningText: 'Önceki kararın bu bölgede rota gecikmesi oluşturdu.', pinMultiplier: 1.15, prominentFilter: 'risk' },
  { theme: 'Final', mainEventTitle: 'Operasyon özeti', mainEventDescription: 'Sanayi & Pazar bölgesi 7 günlük tablo.', activeOperationTitle: 'Haftalık Operasyon Raporu', pinMultiplier: 1, prominentFilter: 'containers' },
]);

// ---------------------------------------------------------------------------
// Presets export
// ---------------------------------------------------------------------------

export const pilotAreaPresets: Record<PilotAreaId, PilotAreaPreset> = {
  merkez: {
    id: 'merkez',
    districtId: MERKEZ_REGION,
    name: 'Merkez Pilot Bölge',
    shortName: 'Merkez',
    description: 'Dengeli başlangıç pilot bölgesi. Harita ve ekip mantığını öğrenmek için ideal.',
    character: 'Düşük sosyal risk, orta personel temposu, düşük operasyon zorluğu.',
    population: 12450,
    socialRisk: 'Düşük',
    staffTempo: 'Orta',
    operationDifficulty: 'Düşük',
    themeColor: colors.primary,
    mapFocusLabel: 'Pilot Odak: Merkez Pilot Bölge',
    activeEventCount: 3,
    riskDensity: 42,
    activeCrewCount: 2,
    activeVehicleCount: 2,
    containerCriticalCount: 0,
    defaultOperation: 'Meydan Temizlik Kontrolü',
    recommendedAction: 'İlk saha kontrolünü başlat',
    filterDescriptions: {
      events: 'Merkez Pilot Bölge’deki günlük olayları ve saha sinyallerini izle.',
      risk: 'Merkez’de hizmet gecikmesi ve görünürlük risklerini takip et.',
      crews: 'Merkez’e atanmış ekiplerini ve görevlerini yönet.',
      vehicles: 'Merkez hattındaki araç durumunu kontrol et.',
      containers: 'Ana cadde çevresindeki konteyner doluluğunu izle.',
    },
    mapFocus: { scale: 1.18, translateX: 0, translateY: -12 },
    dayEvents: merkezDayEvents,
    pinsByFilter: merkezPins,
    crews: [
      { id: 'mc1', name: 'Ekip 1', status: 'active', efficiency: 78, task: 'Meydan temizliği', location: 'Merkez', avatar: '👷' },
      { id: 'mc2', name: 'Ekip 2', status: 'active', efficiency: 71, task: 'Ana cadde kontrolü', location: 'Merkez', avatar: '👷‍♂️' },
    ],
    tasks: [
      { id: 'mt1', name: 'Meydan temizliği', location: 'Merkez · Ekip 1', crew: 'Ekip 1', progress: 68, canReassign: false },
      { id: 'mt2', name: 'Ana cadde kontrolü', location: 'Merkez · Ekip 2', crew: 'Ekip 2', progress: 55, canReassign: false },
    ],
    vehicles: [
      { id: 'mv1', name: 'Araç 01', type: 'Hizmet Aracı', status: 'ready', capacity: 100, location: 'Merkez' },
      { id: 'mv2', name: 'Araç 02', type: 'Küçük Temizlik', status: 'on_duty', capacity: 85, location: 'Merkez' },
    ],
    containers: [
      { id: 'mcnt1', address: 'Atatürk Meydanı No:1', district: 'Merkez', fillPercentage: 62, status: 'normal' },
      { id: 'mcnt2', address: 'Ana Cadde No:12', district: 'Merkez', fillPercentage: 45, status: 'normal' },
    ],
    containerSummary: {
      averageFill: 54,
      empty: 42,
      normal: 88,
      full: 24,
      critical: 2,
      delayedCollection: 3,
    },
    riskSummary: {
      highRiskPoints: 2,
      activeThreatCount: 1,
      earlyWarningCount: 2,
      featuredRisk: {
        title: 'Ana cadde hizmet gecikmesi',
        description: 'Meydan çevresinde görünürlük riski düşük ama ana cadde temposu izlenmeli.',
        probability: 42,
      },
    },
    routeInfo: {
      title: 'Meydan → Ana Cadde',
      distance: '2.1 km',
      eta: '12 dk',
      progress: 58,
      avgEta: '12 dk',
      completion: '%58',
    },
  },

  cumhuriyet: {
    id: 'cumhuriyet',
    districtId: CUMHURIYET_REGION,
    name: 'Cumhuriyet Mahallesi',
    shortName: 'Cumhuriyet',
    description: 'Vatandaş talepleri yoğun; şikayetler hızlı görünür olur.',
    character: 'Yüksek sosyal risk, yüksek personel temposu, orta operasyon zorluğu.',
    population: 9870,
    socialRisk: 'Yüksek',
    staffTempo: 'Yüksek',
    operationDifficulty: 'Orta',
    themeColor: colors.purple,
    mapFocusLabel: 'Pilot Odak: Cumhuriyet Mahallesi',
    activeEventCount: 6,
    riskDensity: 58,
    activeCrewCount: 3,
    activeVehicleCount: 3,
    containerCriticalCount: 2,
    defaultOperation: 'Ara Sokak Şikayet Müdahalesi',
    recommendedAction: 'Şikayetleri öncelik sırasına al',
    filterDescriptions: {
      events: 'Cumhuriyet’te büyüyen vatandaş şikayetlerini ve görünür riskleri takip et.',
      risk: 'Şikayet yayılımı ve memnuniyet risklerini izle.',
      crews: 'Cumhuriyet’e atanmış ekiplerini canlı takip et.',
      vehicles: 'Mahalle hattındaki hizmet araçlarını yönet.',
      containers: 'Site önü ve ara sokak konteynerlerini kontrol et.',
    },
    mapFocus: { scale: 1.22, translateX: 28, translateY: 18 },
    dayEvents: cumhuriyetDayEvents,
    pinsByFilter: cumhuriyetPins,
    crews: [
      { id: 'cc1', name: 'Ekip 1', status: 'active', efficiency: 72, task: 'Ara sokak şikayetleri', location: 'Cumhuriyet', avatar: '👷' },
      { id: 'cc2', name: 'Ekip 2', status: 'enroute', efficiency: 65, task: 'Park çevresi', location: 'Cumhuriyet', avatar: '👷‍♀️' },
      { id: 'cc3', name: 'Ekip 3', status: 'active', efficiency: 80, task: 'Okul çevresi', location: 'Cumhuriyet', avatar: '🧑‍🔧' },
    ],
    tasks: [
      { id: 'ct1', name: 'Ara sokak müdahalesi', location: 'Cumhuriyet · Ekip 1', crew: 'Ekip 1', progress: 45, canReassign: true },
      { id: 'ct2', name: 'Park temizliği', location: 'Cumhuriyet · Ekip 2', crew: 'Ekip 2', progress: 62, canReassign: false },
      { id: 'ct3', name: 'Okul çevresi', location: 'Cumhuriyet · Ekip 3', crew: 'Ekip 3', progress: 38, canReassign: true },
    ],
    vehicles: [
      { id: 'cv1', name: 'Araç 01', type: 'Hizmet Aracı', status: 'on_duty', capacity: 78, location: 'Cumhuriyet' },
      { id: 'cv2', name: 'Araç 02', type: 'Küçük Temizlik', status: 'on_duty', capacity: 82, location: 'Cumhuriyet' },
      { id: 'cv3', name: 'Araç 03', type: 'Park Bakım', status: 'ready', capacity: 90, location: 'Cumhuriyet' },
    ],
    containers: [
      { id: 'ccnt1', address: 'Site Önü No:8', district: 'Cumhuriyet', fillPercentage: 91, status: 'critical' },
      { id: 'ccnt2', address: 'Ara Sokak No:14', district: 'Cumhuriyet', fillPercentage: 88, status: 'full' },
      { id: 'ccnt3', address: 'Park Kenarı No:3', district: 'Cumhuriyet', fillPercentage: 72, status: 'full' },
    ],
    containerSummary: {
      averageFill: 68,
      empty: 28,
      normal: 64,
      full: 38,
      critical: 8,
      delayedCollection: 9,
    },
    riskSummary: {
      highRiskPoints: 5,
      activeThreatCount: 4,
      earlyWarningCount: 3,
      featuredRisk: {
        title: 'Vatandaş şikayetleri hızla yayılıyor',
        description: 'Park ve okul çevresinde memnuniyet riski artıyor; sosyal medya baskısı yüksek.',
        probability: 58,
      },
    },
    routeInfo: {
      title: 'Ara Sokak → Park',
      distance: '3.8 km',
      eta: '18 dk',
      progress: 52,
      avgEta: '18 dk',
      completion: '%52',
    },
  },

  sanayiPazar: {
    id: 'sanayiPazar',
    districtId: SANAYI_REGION,
    name: 'Sanayi & Pazar Bölgesi',
    shortName: 'Sanayi & Pazar',
    description: 'Araç trafiği yoğun; konteyner, rota ve pazar sonrası temizlik baskısı yüksek.',
    character: 'Orta sosyal risk, orta personel temposu, yüksek operasyon zorluğu.',
    population: 6780,
    socialRisk: 'Orta',
    staffTempo: 'Orta',
    operationDifficulty: 'Yüksek',
    themeColor: colors.hubGold,
    mapFocusLabel: 'Pilot Odak: Sanayi & Pazar Bölgesi',
    activeEventCount: 5,
    riskDensity: 64,
    activeCrewCount: 4,
    activeVehicleCount: 4,
    containerCriticalCount: 3,
    defaultOperation: 'Pazar Sonrası Atık Toplama',
    recommendedAction: 'Rota ve araç planını güncelle',
    filterDescriptions: {
      events: 'Pazar ve sanayi hattındaki operasyon yoğunluğunu kontrol et.',
      risk: 'Pazar sonrası atık ve rota gecikmesi risklerini izle.',
      crews: 'Sanayi & Pazar’a atanmış ekipleri ve rotaları yönet.',
      vehicles: 'Toplama ve rota araçlarının kapasitesini takip et.',
      containers: 'Pazar sonrası kritik konteyner noktalarını yönet.',
    },
    mapFocus: { scale: 1.22, translateX: -32, translateY: 14 },
    dayEvents: sanayiDayEvents,
    pinsByFilter: sanayiPins,
    crews: [
      { id: 'sc1', name: 'Ekip 1', status: 'active', efficiency: 70, task: 'Pazar temizliği', location: 'Sanayi & Pazar', avatar: '👷' },
      { id: 'sc2', name: 'Ekip 2', status: 'enroute', efficiency: 58, task: 'Sanayi atık noktaları', location: 'Sanayi & Pazar', avatar: '👷‍♂️' },
      { id: 'sc3', name: 'Ekip 3', status: 'active', efficiency: 75, task: 'Rota destek', location: 'Sanayi & Pazar', avatar: '👷‍♀️' },
      { id: 'sc4', name: 'Ekip 4', status: 'enroute', efficiency: 62, task: 'Konteyner kontrol', location: 'Sanayi & Pazar', avatar: '🧑‍🔧' },
    ],
    tasks: [
      { id: 'st1', name: 'Pazar sonrası toplama', location: 'Sanayi & Pazar · Ekip 1', crew: 'Ekip 1', progress: 41, canReassign: true },
      { id: 'st2', name: 'Sanayi atık hattı', location: 'Sanayi & Pazar · Ekip 2', crew: 'Ekip 2', progress: 55, canReassign: true },
      { id: 'st3', name: 'Rota destek', location: 'Sanayi & Pazar · Ekip 3', crew: 'Ekip 3', progress: 48, canReassign: false },
    ],
    vehicles: [
      { id: 'sv1', name: 'Araç 01', type: 'Çöp Toplama', status: 'on_duty', capacity: 72, location: 'Sanayi & Pazar' },
      { id: 'sv2', name: 'Araç 02', type: 'Hizmet Aracı', status: 'on_duty', capacity: 88, location: 'Sanayi & Pazar' },
      { id: 'sv3', name: 'Araç 03', type: 'Rota Destek', status: 'on_duty', capacity: 65, location: 'Sanayi & Pazar' },
      { id: 'sv4', name: 'Araç 04', type: 'Mini Kamyonet', status: 'maintenance', capacity: 38, location: 'Sanayi & Pazar' },
    ],
    containers: [
      { id: 'scnt1', address: 'Pazar Alanı No:1', district: 'Sanayi & Pazar', fillPercentage: 98, status: 'critical' },
      { id: 'scnt2', address: 'Sanayi Girişi No:45', district: 'Sanayi & Pazar', fillPercentage: 96, status: 'critical' },
      { id: 'scnt3', address: 'Esnaf Hattı No:210', district: 'Sanayi & Pazar', fillPercentage: 93, status: 'critical' },
      { id: 'scnt4', address: 'Servis Güzergahı No:8', district: 'Sanayi & Pazar', fillPercentage: 81, status: 'full' },
    ],
    containerSummary: {
      averageFill: 78,
      empty: 18,
      normal: 52,
      full: 64,
      critical: 12,
      delayedCollection: 14,
    },
    riskSummary: {
      highRiskPoints: 6,
      activeThreatCount: 4,
      earlyWarningCount: 3,
      featuredRisk: {
        title: 'Pazar sonrası atık birikimi',
        description: 'Sanayi girişinde rota gecikmesi ve konteyner kapasitesi kritik seviyeye yaklaşıyor.',
        probability: 64,
      },
    },
    routeInfo: {
      title: 'Pazar → Sanayi Girişi',
      distance: '6.4 km',
      eta: '23 dk',
      progress: 64,
      avgEta: '23 dk',
      completion: '%64',
    },
  },
};
