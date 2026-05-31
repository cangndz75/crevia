import type { CrisisActionType } from './crisisActionTypes';

export const CRISIS_ACTION_DAILY_LIMIT = 1;
export const CRISIS_ACTION_EXPIRE_AFTER_DAYS = 1;
export const CRISIS_ACTION_MAX_HISTORY = 20;
export const CRISIS_ACTION_PREVENTIVE_SCORE_THRESHOLD = 55;

export const CRISIS_ACTION_ACCESS_COPY = {
  inactive: 'Kriz aksiyonları pilotta aktif değil.',
  limited_preview: 'Sınırlı gündemde kriz aksiyonları tam kapsamda kullanılmaz.',
  active: 'Kriz Masası aksiyonu hazır.',
} as const;

export const CRISIS_ACTION_UI_COPY = {
  hubTitle: 'Kriz Hamlesi',
  hubSubtitle: 'Kritik eşik için özel aksiyon',
  sheetTitle: 'Kriz Masası Hamlesi',
  sheetSubtitle: 'Günde bir özel hamle seç',
  ctaSelect: 'Hamleyi Seç',
  ctaApply: 'Bu Hamleyi Uygula',
  selectedLabel: 'Hamle seçildi',
  recommendedBadge: 'Önerilen',
  reportTitle: 'Kriz Hamlesi',
  reportFooter: 'Kriz hamlesi yarınki planı da etkiler.',
  sheetFooter:
    'Seçilen hamle gün sonunda uygulanır. Kaynak ve sinyal etkisini raporda görürsün.',
} as const;

export const CRISIS_ACTION_REPORT_LINES: Record<CrisisActionType, string> = {
  crisis_coordination:
    'Kriz koordinasyonu şehir baskısını düşürdü, ancak ekip ve filo üzerinde ek yük oluşturdu.',
  public_briefing: 'Halk açıklaması mahalle gerilimini yumuşattı.',
  field_rebalance: 'Saha dengeleme zayıf atama riskini azalttı.',
  preventive_maintenance:
    'Önleyici bakım araç ve konteyner zincirini kırdı.',
  monitor_only: 'İzlemeye alınan kriz sinyali yarına taşınabilir.',
};

export const CRISIS_ACTION_DEFINITIONS: Record<
  CrisisActionType,
  {
    label: string;
    summary: string;
    tradeoff: string;
    iconKey: string;
  }
> = {
  crisis_coordination: {
    label: 'Kriz Koordinasyonu Başlat',
    summary: 'Çoklu sinyalleri tek kriz planında toplar.',
    tradeoff: 'Personel ve araç baskısı artabilir.',
    iconKey: 'shield',
  },
  public_briefing: {
    label: 'Halk Açıklaması Yap',
    summary: 'Sosyal tepkiyi ve mahalle gerilimini yumuşatır.',
    tradeoff: 'Saha çözümü daha yavaş ilerleyebilir.',
    iconKey: 'megaphone',
  },
  field_rebalance: {
    label: 'Saha Atamalarını Yeniden Dengele',
    summary: 'Zayıf atama uyumunu toparlar.',
    tradeoff: 'Mevcut görev akışı kısa süreli yavaşlayabilir.',
    iconKey: 'people',
  },
  preventive_maintenance: {
    label: 'Önleyici Bakım Planı',
    summary: 'Araç ve konteyner zincirindeki kriz riskini düşürür.',
    tradeoff: 'Bugünkü yüksek kapasite esnekliği azalabilir.',
    iconKey: 'construct',
  },
  monitor_only: {
    label: 'İzlemeye Al',
    summary: 'Kaynak kullanmadan sinyali takip eder.',
    tradeoff: 'Risk yarına taşınabilir.',
    iconKey: 'eye',
  },
};

export const ALL_CRISIS_ACTION_TYPES: CrisisActionType[] = [
  'crisis_coordination',
  'public_briefing',
  'field_rebalance',
  'preventive_maintenance',
  'monitor_only',
];
