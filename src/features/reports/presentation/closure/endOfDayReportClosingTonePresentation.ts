import type { GameMetrics } from '@/core/models/GameMetrics';

export type EndOfDayClosingToneId =
  | 'balanced_closure'
  | 'trust_recovered'
  | 'resource_pressure'
  | 'maintenance_risk'
  | 'neighborhood_softened'
  | 'hard_day_controlled'
  | 'partial_success'
  | 'tomorrow_risk'
  | 'streak_strong'
  | 'strategic_progress';

export type EndOfDayClosingToneChipTone = 'positive' | 'neutral' | 'warning' | 'mixed';

export type EndOfDayClosingTonePresentation = {
  id: EndOfDayClosingToneId;
  heroTitle: string;
  heroSummary: string;
  statusBadge: string;
  badgeTone: EndOfDayClosingToneChipTone;
  chipAccents: string[];
  ctaSubtext: string;
};

export type ClosingToneSignalInput = {
  day: number;
  successScore: number;
  metrics: GameMetrics;
  trustDelta?: number | null;
  resourcePressureHigh?: boolean;
  maintenanceRiskHigh?: boolean;
  socialPulseScore?: number;
  tomorrowRiskHigh?: boolean;
  periodGoalProgress?: boolean;
  streakDays?: number;
};

const TONE_COPY: Record<
  EndOfDayClosingToneId,
  Omit<EndOfDayClosingTonePresentation, 'id' | 'chipAccents'>
> = {
  balanced_closure: {
    heroTitle: 'Mahalleler dengede',
    heroSummary: 'Bugün şehir ritmi korundu; kaynak ve güven birlikte izlendi.',
    statusBadge: 'Dengeli kapanış',
    badgeTone: 'neutral',
    ctaSubtext: 'Yarın aynı dengeyi sürdürmek için önceliği net tut.',
  },
  trust_recovered: {
    heroTitle: 'Güven toparlandı',
    heroSummary: 'Saha kararların mahallede görünür etki bıraktı.',
    statusBadge: 'Güven yükseldi',
    badgeTone: 'positive',
    ctaSubtext: 'Kazanımı korurken ekip temposunu da izle.',
  },
  resource_pressure: {
    heroTitle: 'Kaynak baskısı büyüdü',
    heroSummary: 'Hızlı müdahaleler bugün bütçeyi zorladı; yarın seçimler daralabilir.',
    statusBadge: 'Kaynak baskısı',
    badgeTone: 'warning',
    ctaSubtext: 'Yarın ilk iş kaynak dengesini kontrol et.',
  },
  maintenance_risk: {
    heroTitle: 'Bakım riski büyüdü',
    heroSummary: 'Hazırlık sinyalleri yükseldi; müdahale zinciri yarına taşınabilir.',
    statusBadge: 'Hazırlık baskısı',
    badgeTone: 'warning',
    ctaSubtext: 'Yarın bakım baskısını erken kontrol et.',
  },
  neighborhood_softened: {
    heroTitle: 'Şehir nefes aldı',
    heroSummary: 'Mahalle tepkisi yumuşadı; görünür hizmet etkisi hissedildi.',
    statusBadge: 'Mahalle tepkisi',
    badgeTone: 'positive',
    ctaSubtext: 'Momentumu korumak için ritmi dağıtma.',
  },
  hard_day_controlled: {
    heroTitle: 'Zor gün kontrollü kapandı',
    heroSummary: 'Baskı yüksekti ama kararlar günü dağıtmadan kapattı.',
    statusBadge: 'Kontrollü kapanış',
    badgeTone: 'mixed',
    ctaSubtext: 'Yarın öncelikleri sadeleştirerek toparlan.',
  },
  partial_success: {
    heroTitle: 'Kısmi başarı',
    heroSummary: 'Bazı alanlar toparlandı, bazıları yarına risk taşıyor.',
    statusBadge: 'Karma sonuç',
    badgeTone: 'mixed',
    ctaSubtext: 'Kazanımı koru, zayıf noktaya odaklan.',
  },
  tomorrow_risk: {
    heroTitle: 'Yarın risk taşıyor',
    heroSummary: 'Bugün kontrollü kapandı ama yarına baskı sinyali kaldı.',
    statusBadge: 'Yarına risk',
    badgeTone: 'warning',
    ctaSubtext: 'Yarın ilk bakış risk sinyallerine gitsin.',
  },
  streak_strong: {
    heroTitle: 'Seri güçlendi',
    heroSummary: 'Üst üste günlerde tutarlı yönetim çizgisi oluştu.',
    statusBadge: 'Seri güçlü',
    badgeTone: 'positive',
    ctaSubtext: 'Tempoyu sürdürmek için ekibe nefes ver.',
  },
  strategic_progress: {
    heroTitle: 'Stratejik ilerleme',
    heroSummary: 'Dönem hedeflerine anlamlı bir adım atıldı.',
    statusBadge: 'Gündem ilerlemesi',
    badgeTone: 'positive',
    ctaSubtext: 'Hedef çizgisini yarın da koru.',
  },
};

const CHIP_ACCENTS: Record<EndOfDayClosingToneId, string[]> = {
  balanced_closure: ['Güven dengede', 'Kaynak izlendi', 'Şehir nabzı stabil'],
  trust_recovered: ['Güven +', 'Mahalle fark etti', 'Saha etkisi'],
  resource_pressure: ['Kaynak -', 'Bütçe baskısı', 'Tempo yüksek'],
  maintenance_risk: ['Hazırlık düşük', 'Bakım baskısı', 'Zincir riski'],
  neighborhood_softened: ['Tepki yumuşadı', 'Görünür hizmet', 'Sosyal nabız +'],
  hard_day_controlled: ['Baskı yüksek', 'Kontrol korundu', 'Yarın toparlanma'],
  partial_success: ['Kısmi kazanım', 'Tradeoff var', 'Seçici odak'],
  tomorrow_risk: ['Risk sinyali', 'Baskı taşındı', 'Erken kontrol'],
  streak_strong: ['Tutarlı çizgi', 'Ekip ritmi', 'Seri devam'],
  strategic_progress: ['Hedef ilerledi', 'Gündem net', 'Strateji tuttu'],
};

function clampLine(text: string, max = 120): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export function resolveEndOfDayClosingToneId(
  input: ClosingToneSignalInput,
): EndOfDayClosingToneId {
  const {
    day,
    successScore,
    metrics,
    trustDelta = 0,
    resourcePressureHigh = false,
    maintenanceRiskHigh = false,
    socialPulseScore = metrics.publicSatisfaction,
    tomorrowRiskHigh = false,
    periodGoalProgress = false,
    streakDays = 0,
  } = input;

  if (periodGoalProgress && day >= 8) return 'strategic_progress';
  if (streakDays >= 3 && successScore >= 65) return 'streak_strong';
  if (tomorrowRiskHigh && successScore < 70) return 'tomorrow_risk';
  if (maintenanceRiskHigh) return 'maintenance_risk';
  if (resourcePressureHigh || metrics.budget < 45_000) return 'resource_pressure';
  if (trustDelta != null && trustDelta >= 4) return 'trust_recovered';
  if (socialPulseScore >= 62 && trustDelta != null && trustDelta >= 2) {
    return 'neighborhood_softened';
  }
  if (successScore < 45) return 'hard_day_controlled';
  if (successScore >= 55 && successScore < 72) return 'partial_success';
  if (successScore >= 82) return 'trust_recovered';
  return 'balanced_closure';
}

export function buildEndOfDayClosingTonePresentation(
  input: ClosingToneSignalInput,
): EndOfDayClosingTonePresentation {
  const id = resolveEndOfDayClosingToneId(input);
  const copy = TONE_COPY[id];
  return {
    id,
    heroTitle: copy.heroTitle,
    heroSummary: clampLine(copy.heroSummary),
    statusBadge: copy.statusBadge,
    badgeTone: copy.badgeTone,
    chipAccents: CHIP_ACCENTS[id].slice(0, 3),
    ctaSubtext: copy.ctaSubtext,
  };
}
