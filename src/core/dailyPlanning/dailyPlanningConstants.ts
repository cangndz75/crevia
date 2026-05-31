import { KNOWN_DISTRICT_IDS } from '@/core/operations/operationSignalConstants';

import type {
  DailyContainerFocus,
  DailyPersonnelFocus,
  DailyPlanOption,
  DailyPlanStatus,
  DailyVehicleFocus,
} from './dailyPlanningTypes';

export const DEFAULT_OPERATION_FOCUS_POINTS = 5;

export const DEFAULT_DISTRICT_FOCUS_FALLBACK =
  KNOWN_DISTRICT_IDS[0] ?? 'merkez';

export const MAX_PLAN_REPORT_LINES = 3;

export const DAILY_PLAN_UI_FORBIDDEN_WORDS = [
  'xp',
  'premium',
  'kilitli',
  'satın al',
  'paywall',
] as const;

export const DAILY_PERSONNEL_FOCUS_OPTIONS: Record<
  DailyPersonnelFocus,
  DailyPlanOption
> = {
  balanced_shift: {
    id: 'balanced_shift',
    label: 'Dengeli Vardiya',
    shortLabel: 'Dengeli',
    description: 'Ekip dengesi korunur.',
    upside: 'Ekip dengesi korunur.',
    tradeoff: 'Özel bir alanda güçlü bonus vermez.',
    tone: 'balanced',
    cost: 1,
    sourceTags: ['personnel', 'balanced'],
  },
  rapid_response: {
    id: 'rapid_response',
    label: 'Hızlı Müdahale',
    shortLabel: 'Hızlı',
    description: 'Acil olaylarda saha tepkisi güçlenir.',
    upside: 'Acil olaylarda saha tepkisi güçlenir.',
    tradeoff: 'Personel yorgunluğu artabilir.',
    tone: 'warning',
    cost: 2,
    sourceTags: ['personnel', 'rapid'],
  },
  rest_rotation: {
    id: 'rest_rotation',
    label: 'Dinlendirme Rotasyonu',
    shortLabel: 'Dinlenme',
    description: 'Yarınki personel baskısı azalır.',
    upside: 'Yarınki personel baskısı azalır.',
    tradeoff: 'Bugünkü hızlı müdahale kapasitesi sınırlanır.',
    tone: 'positive',
    cost: 2,
    sourceTags: ['personnel', 'rest'],
  },
  field_inspection: {
    id: 'field_inspection',
    label: 'Saha Denetimi',
    shortLabel: 'Denetim',
    description: 'Gizli mahalle riskleri daha erken fark edilir.',
    upside: 'Gizli mahalle riskleri daha erken fark edilir.',
    tradeoff: 'Anlık müdahale gücü sınırlı kalabilir.',
    tone: 'balanced',
    cost: 2,
    sourceTags: ['personnel', 'inspection'],
  },
};

export const DAILY_VEHICLE_FOCUS_OPTIONS: Record<
  DailyVehicleFocus,
  DailyPlanOption
> = {
  ready_fleet: {
    id: 'ready_fleet',
    label: 'Filo Hazır',
    shortLabel: 'Hazır',
    description: 'Araçlar standart operasyona hazır tutulur.',
    upside: 'Araçlar standart operasyona hazır tutulur.',
    tradeoff: 'Bakım riskini özel olarak düşürmez.',
    tone: 'balanced',
    cost: 1,
    sourceTags: ['vehicles', 'ready'],
  },
  preventive_maintenance: {
    id: 'preventive_maintenance',
    label: 'Önleyici Bakım',
    shortLabel: 'Bakım',
    description: 'Araç bakım riski düşer.',
    upside: 'Araç bakım riski düşer.',
    tradeoff: 'Bugünkü yüksek kapasite esnekliği azalır.',
    tone: 'positive',
    cost: 2,
    sourceTags: ['vehicles', 'maintenance'],
  },
  high_capacity: {
    id: 'high_capacity',
    label: 'Yüksek Kapasite',
    shortLabel: 'Kapasite',
    description: 'Büyük müdahalelerde filo etkisi artar.',
    upside: 'Büyük müdahalelerde filo etkisi artar.',
    tradeoff: 'Bakım riski yükselebilir.',
    tone: 'warning',
    cost: 2,
    sourceTags: ['vehicles', 'capacity'],
  },
  route_check: {
    id: 'route_check',
    label: 'Rota Kontrolü',
    shortLabel: 'Rota',
    description: 'Gecikme ve rota baskısı azalır.',
    upside: 'Gecikme ve rota baskısı azalır.',
    tradeoff: 'Kapasite artışı sağlamaz.',
    tone: 'balanced',
    cost: 2,
    sourceTags: ['vehicles', 'route'],
  },
};

export const DAILY_CONTAINER_FOCUS_OPTIONS: Record<
  DailyContainerFocus,
  DailyPlanOption
> = {
  standard_collection: {
    id: 'standard_collection',
    label: 'Standart Toplama',
    shortLabel: 'Standart',
    description: 'Günlük konteyner dengesi korunur.',
    upside: 'Günlük konteyner dengesi korunur.',
    tradeoff: 'Kritik noktaları özel olarak çözmez.',
    tone: 'balanced',
    cost: 1,
    sourceTags: ['containers', 'standard'],
  },
  intensive_collection: {
    id: 'intensive_collection',
    label: 'Yoğun Toplama',
    shortLabel: 'Yoğun',
    description: 'Doluluk baskısı düşer.',
    upside: 'Doluluk baskısı düşer.',
    tradeoff: 'Araç ve personel baskısı artabilir.',
    tone: 'warning',
    cost: 2,
    sourceTags: ['containers', 'intensive'],
  },
  cleanliness_maintenance: {
    id: 'cleanliness_maintenance',
    label: 'Temizlik Bakımı',
    shortLabel: 'Temizlik',
    description: 'Koku ve sosyal tepki riski azalır.',
    upside: 'Koku ve sosyal tepki riski azalır.',
    tradeoff: 'Doluluk baskısını hızlı düşürmeyebilir.',
    tone: 'positive',
    cost: 2,
    sourceTags: ['containers', 'cleanliness'],
  },
  risk_inspection: {
    id: 'risk_inspection',
    label: 'Riskli Nokta İncelemesi',
    shortLabel: 'Risk',
    description: 'Gizli konteyner sorunları daha erken görünür.',
    upside: 'Gizli konteyner sorunları daha erken görünür.',
    tradeoff: 'Bugünkü toplama etkisi sınırlı kalabilir.',
    tone: 'balanced',
    cost: 2,
    sourceTags: ['containers', 'inspection'],
  },
};

export const DAILY_PLAN_STATUS_LABELS: Record<DailyPlanStatus, string> = {
  unplanned: 'Plan bekleniyor',
  suggested: 'Plan önerildi',
  confirmed: 'Plan onaylandı',
  processed: 'Plan işlendi',
};

export const DAILY_PLANNING_COPY = {
  hubTitle: 'Bugünün Operasyon Planı',
  hubSubtitle: 'Mahalle, ekip, filo ve konteyner odağı',
  editTitle: 'Operasyon Planını Düzenle',
  confirmLabel: 'Planı Onayla',
  updateLabel: 'Planı Güncelle',
  editLabel: 'Düzenle',
  reportTitle: 'Bugünkü Planın Etkisi',
  reportFooter: 'Yarınki plan sinyallere göre yeniden şekillenir.',
  focusPointsLabel: (used: number, total: number) =>
    `Odak kullanımı ${used}/${total}`,
  overBudgetWarning:
    'Odak kapasitesi aşıldı. Daha dengeli bir plan seç.',
  day1ReportLine:
    'Bugün temel planlama akışı tanıtıldı. Detaylı plan etkileri sonraki günlerde daha belirginleşir.',
  postPilotReportLine:
    'Pilot sonrası sınırlı gündemde plan odağı mahalle sinyallerini daha görünür hale getirdi.',
  impactPreviewTitle: 'Günlük plan etkisi',
  districtSectionTitle: 'Mahalle odağı',
  personnelSectionTitle: 'Personel odağı',
  vehicleSectionTitle: 'Araç odağı',
  containerSectionTitle: 'Konteyner odağı',
} as const;
