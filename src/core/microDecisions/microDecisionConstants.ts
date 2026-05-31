import type {
  MicroDecisionAccessMode,
  MicroDecisionDomain,
  MicroDecisionType,
} from './microDecisionTypes';

export const MICRO_DECISION_DAILY_LIMITS = {
  pilot_day_1_2: 0,
  pilot_day_3_7: 1,
  limited: 1,
  full: 2,
  full_active_crisis: 2,
} as const;

export const MICRO_DECISION_MAX_ACTIVE = 2;
export const MICRO_DECISION_EXPIRE_AFTER_DAYS = 1;
export const MICRO_DECISION_MAX_HISTORY = 20;

export const MICRO_DECISION_TYPE_LABELS: Record<MicroDecisionType, string> = {
  advisor_warning: 'Ece’nin Uyarısı',
  field_update: 'Saha Bildirimi',
  crisis_threshold: 'Kriz Eşiği',
  district_representative: 'Mahalle Temsilcisi',
  operation_opportunity: 'Operasyon Fırsatı',
};

export const MICRO_DECISION_FORBIDDEN_WORDS = [
  'xp',
  'premium',
  'satın al',
  'kilitli',
] as const;

export const ADVISOR_WARNING_SUMMARIES = [
  'Ece bir sinyali beklenenden hızlı yükselirken yakaladı.',
  'Ece bugünkü plan ile saha sinyali arasında küçük bir çelişki görüyor.',
] as const;

export const FIELD_UPDATE_SUMMARIES = [
  'Saha ekibi bölgedeki yükün beklenenden yüksek olduğunu bildirdi.',
  'Atama sahada çalışıyor ama araç baskısı artabilir.',
] as const;

export const CRISIS_THRESHOLD_SUMMARIES = [
  'Araç ve konteyner sinyalleri aynı hatta birleşiyor.',
  'Çoklu mahalle baskısı kriz eşiğine yaklaşabilir.',
] as const;

export const DISTRICT_REP_SUMMARIES = [
  'Mahalle temsilcisi aynı konunun tekrarlandığını bildirdi.',
  'Bölgeden gelen geri bildirim plan odağını etkileyebilir.',
] as const;

export const OPERATION_OPPORTUNITY_SUMMARIES = [
  'Rota üzerinde kısa süreli operasyon fırsatı oluştu.',
  'Doğru hamleyle yarına taşınacak baskı azaltılabilir.',
] as const;

export const OPTION_LABELS = {
  preventive: 'Önleyici Hamle Yap',
  keepPlan: 'Planı Koru',
  monitor: 'İzlemeye Al',
  extraResource: 'Ek Kaynak Ayır',
  publicComms: 'Halk İletişimini Öne Al',
  routeSupport: 'Rota Desteği Kullan',
  maintenanceFocus: 'Bakım Odağına Çek',
  balanced: 'Dengeli Devam Et',
  crisisCoord: 'Kriz Koordinasyonu Başlat',
  rebalanceAssignment: 'Saha Atamasını Yeniden Dengele',
  informRep: 'Temsilciye Bilgi Ver',
  inspectionTeam: 'Denetim Ekibi Yönlendir',
  seizeOpportunity: 'Fırsatı Değerlendir',
  continueTask: 'Göreve Devam Et',
} as const;

export const MICRO_DECISION_FOOTER_NOTES = {
  default:
    'Bu karar günlük planın küçük bir sapmasını temsil eder.',
  keepPlan:
    'Planı korumak güvenli, ama risk yarına taşınabilir.',
  advisor:
    'Ece bu sinyali operasyon analizinde izlemeye aldı.',
} as const;

export const PILOT_LIMITED_TYPES: MicroDecisionType[] = [
  'advisor_warning',
  'field_update',
];

export const LIMITED_BLOCKED_TYPES: MicroDecisionType[] = ['crisis_threshold'];

export const ALL_MICRO_DECISION_TYPES: MicroDecisionType[] = [
  'advisor_warning',
  'field_update',
  'crisis_threshold',
  'district_representative',
  'operation_opportunity',
];

export const ACCESS_MODE_DOMAINS: Record<
  MicroDecisionAccessMode,
  MicroDecisionDomain[]
> = {
  inactive: [],
  pilot_limited: ['personnel', 'vehicles', 'assignments', 'planning'],
  limited: [
    'personnel',
    'vehicles',
    'containers',
    'districts',
    'social',
    'assignments',
    'planning',
  ],
  full: [
    'personnel',
    'vehicles',
    'containers',
    'districts',
    'social',
    'crisis',
    'assignments',
    'planning',
    'season',
  ],
};

export function getMaxDailyDecisionsForAccess(
  accessMode: MicroDecisionAccessMode,
  hasActiveCrisis: boolean,
): number {
  if (accessMode === 'inactive') return MICRO_DECISION_DAILY_LIMITS.pilot_day_1_2;
  if (accessMode === 'pilot_limited') return MICRO_DECISION_DAILY_LIMITS.pilot_day_3_7;
  if (accessMode === 'limited') return MICRO_DECISION_DAILY_LIMITS.limited;
  if (hasActiveCrisis) return MICRO_DECISION_DAILY_LIMITS.full_active_crisis;
  return MICRO_DECISION_DAILY_LIMITS.full;
}
