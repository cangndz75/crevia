import type {
  PersonnelAssignmentType,
  ResponseApproachType,
  VehicleAssignmentType,
} from './assignmentTypes';
import type { AssignmentOption } from './assignmentTypes';

export const MAX_ASSIGNMENTS_STORED = 30;
export const MAX_ASSIGNMENT_REPORT_LINES = 3;

export const COMPATIBILITY_THRESHOLDS = {
  weakMax: 44,
  balancedMax: 74,
} as const;

export const ASSIGNMENT_UI_FORBIDDEN_WORDS = [
  'xp',
  'premium',
  'kilitli',
  'satın al',
  'paywall',
] as const;

export const PERSONNEL_ASSIGNMENT_OPTIONS: Record<
  PersonnelAssignmentType,
  AssignmentOption
> = {
  balanced_team: {
    id: 'balanced_team',
    label: 'Dengeli Ekip',
    shortLabel: 'Dengeli',
    description: 'Genel görevlerde güvenli sonuç verir.',
    upside: 'Genel görevlerde güvenli sonuç verir.',
    tradeoff: 'Özel uzmanlık bonusu sınırlıdır.',
    tone: 'balanced',
    sourceTags: ['personnel', 'balanced'],
  },
  field_response_team: {
    id: 'field_response_team',
    label: 'Saha Müdahale Ekibi',
    shortLabel: 'Saha',
    description: 'Acil olaylarda hızlı tepki verir.',
    upside: 'Acil olaylarda hızlı tepki verir.',
    tradeoff: 'Personel yorgunluğu artabilir.',
    tone: 'warning',
    sourceTags: ['personnel', 'field'],
  },
  technical_team: {
    id: 'technical_team',
    label: 'Teknik Ekip',
    shortLabel: 'Teknik',
    description: 'Bakım, araç ve konteyner sorunlarında güçlüdür.',
    upside: 'Bakım, araç ve konteyner sorunlarında güçlüdür.',
    tradeoff: 'Sosyal tepkiyi tek başına azaltmaz.',
    tone: 'positive',
    sourceTags: ['personnel', 'technical'],
  },
  public_relations_team: {
    id: 'public_relations_team',
    label: 'Halk İletişim Ekibi',
    shortLabel: 'Halk',
    description: 'Sosyal tepkiyi ve mahalle gerilimini azaltır.',
    upside: 'Sosyal tepkiyi ve mahalle gerilimini azaltır.',
    tradeoff: 'Teknik çözüm gücü sınırlıdır.',
    tone: 'positive',
    sourceTags: ['personnel', 'social'],
  },
  inspection_team: {
    id: 'inspection_team',
    label: 'Denetim Ekibi',
    shortLabel: 'Denetim',
    description: 'Gizli riskleri ve mahalle baskısını daha iyi okur.',
    upside: 'Gizli riskleri ve mahalle baskısını daha iyi okur.',
    tradeoff: 'Anlık çözüm etkisi daha düşüktür.',
    tone: 'balanced',
    sourceTags: ['personnel', 'inspection'],
  },
};

export const VEHICLE_ASSIGNMENT_OPTIONS: Record<
  VehicleAssignmentType,
  AssignmentOption
> = {
  standard_truck: {
    id: 'standard_truck',
    label: 'Standart Kamyon',
    shortLabel: 'Standart',
    description: 'Dengeli saha kapasitesi sağlar.',
    upside: 'Dengeli saha kapasitesi sağlar.',
    tradeoff: 'Dar sokak veya özel bakımda güçlü değildir.',
    tone: 'balanced',
    sourceTags: ['vehicles', 'standard'],
  },
  high_capacity_vehicle: {
    id: 'high_capacity_vehicle',
    label: 'Yüksek Kapasiteli Araç',
    shortLabel: 'Kapasite',
    description: 'Atık ve konteyner yoğunluğunda güçlüdür.',
    upside: 'Atık ve konteyner yoğunluğunda güçlüdür.',
    tradeoff: 'Araç bakım baskısı artabilir.',
    tone: 'warning',
    sourceTags: ['vehicles', 'capacity'],
  },
  compact_service_vehicle: {
    id: 'compact_service_vehicle',
    label: 'Küçük Servis Aracı',
    shortLabel: 'Servis',
    description: 'Merkez ve dar sokak müdahalelerinde çeviktir.',
    upside: 'Merkez ve dar sokak müdahalelerinde çeviktir.',
    tradeoff: 'Yüksek hacimli sorunlarda kapasitesi sınırlıdır.',
    tone: 'balanced',
    sourceTags: ['vehicles', 'compact'],
  },
  maintenance_vehicle: {
    id: 'maintenance_vehicle',
    label: 'Bakım Aracı',
    shortLabel: 'Bakım',
    description: 'Konteyner, bakım ve teknik olaylarda güçlüdür.',
    upside: 'Konteyner, bakım ve teknik olaylarda güçlüdür.',
    tradeoff: 'Toplama kapasitesi sınırlıdır.',
    tone: 'positive',
    sourceTags: ['vehicles', 'maintenance'],
  },
  route_support_vehicle: {
    id: 'route_support_vehicle',
    label: 'Rota Destek Aracı',
    shortLabel: 'Rota',
    description: 'Rota, gecikme ve İstasyon tipi olaylarda etkilidir.',
    upside: 'Rota, gecikme ve İstasyon tipi olaylarda etkilidir.',
    tradeoff: 'Konteyner hacmini doğrudan azaltmaz.',
    tone: 'balanced',
    sourceTags: ['vehicles', 'route'],
  },
};

export const RESPONSE_APPROACH_OPTIONS: Record<
  ResponseApproachType,
  AssignmentOption
> = {
  balanced_response: {
    id: 'balanced_response',
    label: 'Dengeli Çözüm',
    shortLabel: 'Dengeli',
    description: 'Riskleri dengeli yönetir.',
    upside: 'Riskleri dengeli yönetir.',
    tradeoff: 'Belirgin bir alanda yüksek bonus vermez.',
    tone: 'balanced',
    sourceTags: ['approach', 'balanced'],
  },
  rapid_response: {
    id: 'rapid_response',
    label: 'Hızlı Müdahale',
    shortLabel: 'Hızlı',
    description: 'Bugünkü baskıyı hızlı düşürür.',
    upside: 'Bugünkü baskıyı hızlı düşürür.',
    tradeoff: 'Personel ve araç baskısını artırabilir.',
    tone: 'warning',
    sourceTags: ['approach', 'rapid'],
  },
  lasting_fix: {
    id: 'lasting_fix',
    label: 'Kalıcı Çözüm',
    shortLabel: 'Kalıcı',
    description: 'Yarına taşınan riski azaltır.',
    upside: 'Yarına taşınan riski azaltır.',
    tradeoff: 'Bugünkü sonuç daha yavaş gelebilir.',
    tone: 'positive',
    sourceTags: ['approach', 'lasting'],
  },
  low_resource: {
    id: 'low_resource',
    label: 'Düşük Kaynak',
    shortLabel: 'Düşük',
    description: 'Operasyon kaynağını korur.',
    upside: 'Operasyon kaynağını korur.',
    tradeoff: 'Sorunun tekrar etme riski artabilir.',
    tone: 'balanced',
    sourceTags: ['approach', 'low_resource'],
  },
  public_first: {
    id: 'public_first',
    label: 'Halk Odaklı',
    shortLabel: 'Halk',
    description: 'Sosyal tepkiyi ve mahalle gerilimini azaltır.',
    upside: 'Sosyal tepkiyi ve mahalle gerilimini azaltır.',
    tradeoff: 'Saha maliyeti ve işlem süresi artabilir.',
    tone: 'positive',
    sourceTags: ['approach', 'public'],
  },
};

export const ASSIGNMENT_CATEGORY_TAGS = {
  container: ['container', 'waste', 'konteyner', 'atık', 'bin'],
  social: ['social', 'sosyal', 'citizen', 'halk', 'community', 'public'],
  vehicle: ['vehicle', 'araç', 'route', 'rota', 'fleet', 'filo'],
  personnel: ['personnel', 'personel', 'staff', 'ekip', 'team'],
  crisis: ['crisis', 'kriz', 'emergency', 'acil'],
} as const;

export const ASSIGNMENT_COPY = {
  panelTitle: 'Saha Ataması',
  panelSubtitle: 'Ekip, araç ve müdahale yaklaşımı',
  editTitle: 'Atamayı Düzenle',
  confirmLabel: 'Atamayı Onayla',
  updateLabel: 'Atamayı Güncelle',
  editLabel: 'Düzenle',
  day1CtaLabel: 'Önerilen Atamayı Onayla',
  reportTitle: 'Saha Atama Dengesi',
  reportFooter:
    'Yarınki atamalar günlük planla birlikte yeniden şekillenir.',
  day1ReportLine:
    'Bugün temel atama akışı tanıtıldı. Detaylı atama etkileri sonraki günlerde daha belirginleşir.',
  impactPreviewTitle: 'Saha atama etkisi',
  fieldSummaryTitle: 'Sahaya çıkan ekip',
  personnelSectionTitle: 'Personel grubu',
  vehicleSectionTitle: 'Araç grubu',
  approachSectionTitle: 'Müdahale yaklaşımı',
  statusDraft: 'Taslak atama',
  statusConfirmed: 'Atama onaylandı',
  statusDispatched: 'Sahaya yönlendirildi',
  statusProcessed: 'Atama işlendi',
  dispatchBlocked: 'Sahaya yönlendirmek için atamayı onayla.',
} as const;

export const DEFAULT_ASSIGNMENT_BY_CATEGORY: Record<
  string,
  {
    personnel: PersonnelAssignmentType;
    vehicle: VehicleAssignmentType;
    approach: ResponseApproachType;
  }
> = {
  container: {
    personnel: 'technical_team',
    vehicle: 'maintenance_vehicle',
    approach: 'balanced_response',
  },
  social: {
    personnel: 'public_relations_team',
    vehicle: 'compact_service_vehicle',
    approach: 'public_first',
  },
  vehicle: {
    personnel: 'field_response_team',
    vehicle: 'route_support_vehicle',
    approach: 'balanced_response',
  },
  personnel: {
    personnel: 'balanced_team',
    vehicle: 'standard_truck',
    approach: 'balanced_response',
  },
  crisis: {
    personnel: 'balanced_team',
    vehicle: 'standard_truck',
    approach: 'balanced_response',
  },
  default: {
    personnel: 'balanced_team',
    vehicle: 'standard_truck',
    approach: 'balanced_response',
  },
};
