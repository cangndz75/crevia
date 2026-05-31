import type { GameplayImpactDomain, GameplayImpactMagnitude } from './gameplayImpactTypes';

export const IMPACT_DELTA_LIMITS: Record<GameplayImpactMagnitude, { min: number; max: number }> = {
  tiny: { min: 1, max: 2 },
  small: { min: 3, max: 4 },
  medium: { min: 5, max: 7 },
  strong: { min: 8, max: 10 },
};

export const MAX_SINGLE_DOMAIN_DELTA = 10;
export const MAX_TOTAL_DAILY_RISK_DELTA = 16;
export const MAX_TOTAL_DAILY_IMPROVEMENT_DELTA = 16;

export const PILOT_IMPACT_MULTIPLIER = 0.65;
export const LIMITED_IMPACT_MULTIPLIER = 0.8;
export const FULL_MAIN_IMPACT_MULTIPLIER = 1;
export const CRISIS_IMPACT_MULTIPLIER = 1.15;

export const BALANCE_COPY = {
  noticeableImprovement: 'Belirgin iyileşme',
  slightImprovement: 'Hafif iyileşme',
  monitored: 'İzlemeye alındı',
  pressureIncreased: 'Baskı arttı',
  carryOverRisk: 'Yarına risk taşıyor',
  carryOverPlanKeep:
    'Bu seçim bugünkü kaynak dengesini korudu, ancak sorun yarına taşınabilir.',
  carryOverMonitor:
    'İzlemeye alınan sinyal yarın daha yüksek baskı olarak dönebilir.',
  carryOverLowResource:
    'Düşük kaynak çözümü maliyeti sınırladı, tekrar riskini artırdı.',
  preventiveTradeoff:
    'Önleyici hamle filo riskini düşürdü; yüksek kapasite esnekliği sınırlı kaldı.',
  rapidResponseReport:
    'Bugün hızlı müdahale saha tepkisini güçlendirdi, personel baskısını artırdı.',
  restRotationReport:
    'Bugünkü müdahale hızı sınırlı kaldı, yarınki personel baskısı düştü.',
  preventiveMaintenanceReport:
    'Önleyici bakım filo riskini düşürdü, yüksek kapasite esnekliği sınırlı kaldı.',
  lowResourceReport:
    'Düşük kaynak çözümü bugünü hafifletti, sorun yarına taşınabilir.',
  strongFitReport: 'Güçlü saha uyumu ilgili sinyali belirgin toparladı.',
  weakFitReport: 'Zayıf atama operasyon baskısını artırdı.',
  crisisPreventiveReduced: 'Önleyici hamle kriz eşiğini düşürdü.',
  crisisMonitorCarry: 'İzlemeye alınan sinyal yarına taşınabilir.',
  eceLevel1Cautious:
    'Bu karar bugünü rahatlatabilir ama yarına küçük risk taşıyabilir.',
  eceLevel2LowResource:
    'Düşük kaynak seçimi konteyner baskısını tam kapatmaz; yarın aynı sinyali tekrar görebiliriz.',
  eceLevel3Tradeoff:
    'Hızlı müdahale sosyal baskıyı bugün düşürür, fakat personel yorgunluğu sezon hedefini yavaşlatabilir.',
} as const;

export const DOMAIN_IMPACT_LABELS: Record<
  GameplayImpactDomain,
  { improve: string; worsen: string }
> = {
  personnel: {
    improve: 'Personel baskısı belirgin düştü',
    worsen: 'Personel baskısı arttı',
  },
  vehicles: {
    improve: 'Araç riski belirgin düştü',
    worsen: 'Araç baskısı arttı',
  },
  containers: {
    improve: 'Konteyner baskısı belirgin düştü',
    worsen: 'Konteyner etkisi yarına taşındı',
  },
  districts: {
    improve: 'Mahalle baskısı belirgin düştü',
    worsen: 'Mahalle baskısı arttı',
  },
  social: {
    improve: 'Sosyal baskı belirgin düştü',
    worsen: 'Sosyal baskı arttı',
  },
  crisis: {
    improve: 'Kriz eşiği belirgin düştü',
    worsen: 'Kriz baskısı arttı',
  },
  assignments: {
    improve: 'Saha ataması dengesi iyileşti',
    worsen: 'Atama baskısı arttı',
  },
  overall: {
    improve: 'Operasyon dengesi belirgin iyileşti',
    worsen: 'Operasyon baskısı arttı',
  },
  season: {
    improve: 'Sezon hedefi desteklendi',
    worsen: 'Sezon hedefi zorlandı',
  },
  planning: {
    improve: 'Plan dengesi korundu',
    worsen: 'Plan riski izlemeye alındı',
  },
};
