import type {
  SeasonEndCategory,
  SeasonEndRating,
  SeasonEndTone,
} from './seasonEndTypes';

export const SEASON_END_FORBIDDEN_WORDS = [
  'premium',
  'satın al',
  'kilitli',
] as const;

export const SEASON_END_RATING_THRESHOLDS = {
  excellentMin: 85,
  strongMin: 70,
  steadyMin: 55,
  strainedMin: 40,
} as const;

export const SEASON_END_CATEGORY_WEIGHTS: Record<
  Exclude<SeasonEndCategory, 'social_trust'>,
  number
> = {
  season_goals: 0.25,
  city_balance: 0.2,
  operational_resources: 0.15,
  assignments: 0.15,
  crisis_management: 0.15,
  district_coverage: 0.1,
};

export const SEASON_END_CATEGORY_META: Record<
  SeasonEndCategory,
  { title: string; iconKey: string }
> = {
  city_balance: { title: 'Şehir Dengesi', iconKey: 'city_balance' },
  district_coverage: { title: 'Mahalle Kapsamı', iconKey: 'district_scope' },
  operational_resources: {
    title: 'Saha Kaynakları',
    iconKey: 'operational_resources',
  },
  assignments: { title: 'Saha Atamaları', iconKey: 'assignment' },
  crisis_management: { title: 'Kriz Yönetimi', iconKey: 'crisis' },
  social_trust: { title: 'Sosyal Güven', iconKey: 'social_pulse' },
  season_goals: { title: 'Milestone Hedefleri', iconKey: 'season_goal' },
};

export const SEASON_END_RATING_LABELS: Record<SeasonEndRating, string> = {
  excellent: 'Üst düzey dönem',
  strong: 'Güçlü dönem',
  steady: 'Dengeli dönem',
  strained: 'Zorlayıcı dönem',
  critical: 'Kritik dönem',
};

export const SEASON_END_UI_COPY = {
  evaluationTitle: 'Dönemsel Operasyon Değerlendirmesi',
  evaluationSubtitle:
    'Operasyon devam ediyor; bu özet son dönemdeki kararlarının etkisini gösterir.',
  detailTitle: 'Operasyon Dönemi Özeti',
  detailClose: 'Operasyona Devam Et',
  detailCta: 'Detayları Gör',
  footerNote:
    'Bu değerlendirme operasyon kariyerini kapatmaz; sonraki yetkiler XP, authority, ünvan ve kaynak istikrarıyla açılır.',
  completedDayPrefix: 'Değerlendirilen operasyon günü',
} as const;

export function getSeasonEndToneFromRating(rating: SeasonEndRating): SeasonEndTone {
  switch (rating) {
    case 'excellent':
    case 'strong':
      return 'positive';
    case 'steady':
      return 'neutral';
    case 'strained':
      return 'warning';
    case 'critical':
      return 'critical';
    default:
      return 'neutral';
  }
}

export function formatSeasonEndRatingLabel(rating: SeasonEndRating): string {
  return SEASON_END_RATING_LABELS[rating];
}

export function getSeasonEndRatingFromScore(score: number): SeasonEndRating {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s >= SEASON_END_RATING_THRESHOLDS.excellentMin) return 'excellent';
  if (s >= SEASON_END_RATING_THRESHOLDS.strongMin) return 'strong';
  if (s >= SEASON_END_RATING_THRESHOLDS.steadyMin) return 'steady';
  if (s >= SEASON_END_RATING_THRESHOLDS.strainedMin) return 'strained';
  return 'critical';
}
