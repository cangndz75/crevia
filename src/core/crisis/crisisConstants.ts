import type { CrisisAccessMode, CrisisRiskLevel } from './crisisTypes';

export const MAX_RECENT_CRISIS_SIGNALS = 5;
export const MIN_DAYS_BETWEEN_CRISIS_INCIDENTS = 2;
export const CRISIS_SCORE_DAILY_DECAY = 5;
export const CRISIS_SCORE_GOOD_DAY_EXTRA_DECAY = 4;

export const CRISIS_SCORE_STABLE_MAX = 34;
export const CRISIS_SCORE_WATCH_MAX = 59;
export const CRISIS_SCORE_ELEVATED_MAX = 79;

export const CRISIS_INCIDENT_FORMING_THRESHOLD = 68;
export const CRISIS_INCIDENT_COMBINED_RISK_THRESHOLD = 56;
export const CRISIS_INCIDENT_ACTIVE_THRESHOLD = 82;

export const CRISIS_SEASON_DAY1_SCORE_CAP = 79;

export const CRISIS_RISK_LABELS: Record<CrisisRiskLevel, string> = {
  stable: 'Dengeli',
  watch: 'İzlemede',
  elevated: 'Kritik eşik yaklaşıyor',
  critical: 'Kriz eşiği',
};

export const CRISIS_ACCESS_COPY: Record<CrisisAccessMode, string> = {
  inactive: 'Kriz Masası pilotta aktif değil.',
  limited_preview: 'Sınırlı gündemde kriz sinyalleri dar kapsamda izlenir.',
  active: 'Kriz Masası aktif. Çoklu mahalle ve operasyon baskıları izleniyor.',
};

export const CRISIS_UI_COPY = {
  hubTitle: 'Kriz Masası',
  hubSubtitle: 'Çoklu mahalle ve operasyon baskısı',
  hubFooter: 'Ece bu sinyalleri günlük analizde dikkate alır.',
  reportTitle: 'Kriz Masası Değerlendirmesi',
  reportFooter: 'Yarınki plan kriz sinyallerine göre yeniden şekillenir.',
  impactPrefix: 'Krize etkisi:',
  limitedImpactLine: 'Sınırlı gündemde kriz sinyali dar kapsamda izlenir.',
} as const;

export const CRISIS_FORBIDDEN_WORDS = [
  'xp',
  'premium',
  'satın al',
  'kilitli',
  'paywall',
] as const;

export const CRISIS_INCIDENT_TEMPLATES = {
  multi_district_pressure: {
    id: 'multi_district_pressure',
    title: 'Çoklu Mahalle Baskısı',
    summary: 'Birden fazla mahallede operasyon sinyalleri aynı anda yükseldi.',
    domain: 'districts' as const,
  },
  vehicle_container_chain: {
    id: 'vehicle_container_chain',
    title: 'Filo ve Konteyner Zinciri',
    summary: 'Araç baskısı ile konteyner yoğunluğu aynı hatta birleşiyor.',
    domain: 'vehicles' as const,
  },
  social_response_gap: {
    id: 'social_response_gap',
    title: 'Sosyal Tepki Açığı',
    summary: 'Mahalle tepkisi saha çözüm hızının önüne geçebilir.',
    domain: 'social' as const,
  },
  assignment_coordination_risk: {
    id: 'assignment_coordination_risk',
    title: 'Saha Koordinasyon Riski',
    summary:
      'Atama uyumu ve günlük plan aynı hedefte birleşmezse kriz büyüyebilir.',
    domain: 'assignments' as const,
  },
} as const;

export const CRISIS_SIGNAL_COPY = {
  multiDistrict: {
    title: 'Çoklu mahalle baskısı yükseliyor.',
    summary: 'Aktif ve gündemdeki mahallelerde baskı birlikte artıyor.',
  },
  vehicleContainerChain: {
    title: 'Araç ve konteyner sinyalleri aynı anda zorlanıyor.',
    summary: 'Filo ve konteyner hattı koordinasyon riski taşıyor.',
  },
  socialGap: {
    title: 'Sosyal tepki ile saha gecikmesi birleşebilir.',
    summary: 'Mahalle iletişimi saha hızının önüne geçebilir.',
  },
  assignmentWeak: {
    title: 'Atama uyumu zayıf kalırsa kriz riski artabilir.',
    summary: 'Saha koordinasyonu günlük planla uyumlu tutulmalı.',
  },
  planConflict: {
    title: 'Günlük plan ile saha baskısı çelişiyor.',
    summary: 'Plan odağı ile olay yoğunluğu aynı hizada değil.',
  },
} as const;
