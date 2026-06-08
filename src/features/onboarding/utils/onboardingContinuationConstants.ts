import type { OnboardingStarterDecisionId } from '@/core/onboarding/onboardingStarterDecision';

import type {
  OnboardingContinuationStepMeta,
  OnboardingDecisionStyle,
  OnboardingDistrictOption,
  OnboardingPilotDistrictId,
} from './onboardingContinuationTypes';

export const ONBOARDING_CONTINUATION_STEPS: OnboardingContinuationStepMeta[] = [
  {
    id: 'region',
    title: 'Pilot bölgeni seç',
    body: 'İlk operasyon hissi, seçtiğin mahallenin temposuna göre şekillenir.',
    primaryLabel: 'Karar yaklaşımını seç',
  },
  {
    id: 'decision',
    title: 'Karar ver',
    body: 'İlk operasyon tarzını seç. Ece bu seçimin etkisini sana açıklayacak.',
    primaryLabel: 'Ece brifingine geç',
  },
  {
    id: 'ece_briefing',
    title: 'Ece operasyon brifingi',
    titleLines: ['Ece operasyon', 'brifingi'],
    body: 'Seçiminin ne anlama geldiğini kısa bir danışman notuyla oku.',
    primaryLabel: 'İlk saha brifingine geç',
  },
  {
    id: 'field_briefing',
    title: 'İlk saha brifingi',
    body: 'Mahallenin bugünkü odağını ve dikkat noktasını gör.',
    primaryLabel: 'İlk etkiyi gör',
  },
  {
    id: 'first_impact',
    title: 'İlk etkin hazır',
    body: 'Seçtiğin yaklaşım ilk operasyon izini oluşturdu.',
    primaryLabel: 'Şehir tepkisini gör',
  },
  {
    id: 'city_reaction',
    title: 'Şehir tepki verdi',
    body: 'İlk kararın mahallede küçük ama görünür bir iz bıraktı.',
    primaryLabel: "Merkez'e geç",
  },
  {
    id: 'center_unlocked',
    title: 'Merkez açıldı',
    body: 'Günlük operasyon akışını artık buradan takip edeceksin.',
    primaryLabel: "Merkez'e git",
  },
];

export const ONBOARDING_DISTRICT_OPTIONS: OnboardingDistrictOption[] = [
  {
    id: 'merkez',
    gameDistrictId: 'central',
    title: 'Merkez Pilot Bölge',
    recommended: true,
    badges: [
      { label: 'Dengeli', icon: 'scale-outline' },
      { label: 'Başlangıç dostu', icon: 'school-outline' },
    ],
    description: 'Dengeli hizmet yüküyle karar etkilerini net gösteren başlangıç alanı.',
    metrics: {
      socialRisk: { label: 'Sosyal Risk', value: 'Düşük', tone: 'low' },
      staffPace: { label: 'Personel Temposu', value: 'Orta', tone: 'mid' },
      difficulty: { label: 'Operasyon Zorluğu', value: 'Düşük', tone: 'low' },
    },
  },
  {
    id: 'cumhuriyet',
    gameDistrictId: 'cumhuriyet',
    title: 'Cumhuriyet Mahallesi',
    badges: [
      { label: 'Halk beklentisi', icon: 'people-outline' },
      { label: 'Görünür hizmet', icon: 'eye-outline' },
    ],
    description: 'Halk beklentisi yüksek, görünür hizmet etkisi güçlü bir mahalle.',
    metrics: {
      socialRisk: { label: 'Sosyal Risk', value: 'Orta', tone: 'mid' },
      staffPace: { label: 'Personel Temposu', value: 'Yüksek', tone: 'high' },
      difficulty: { label: 'Operasyon Zorluğu', value: 'Yüksek', tone: 'high' },
    },
  },
  {
    id: 'sanayi',
    gameDistrictId: 'industrial_market',
    title: 'Sanayi Bölgesi',
    badges: [
      { label: 'Rota', icon: 'map-outline' },
      { label: 'Araç temposu', icon: 'car-outline' },
    ],
    description: 'Rota, araç ve vardiya yoğunluğunun daha hızlı göründüğü alan.',
    metrics: {
      socialRisk: { label: 'Sosyal Risk', value: 'Orta', tone: 'mid' },
      staffPace: { label: 'Personel Temposu', value: 'Yüksek', tone: 'high' },
      difficulty: { label: 'Operasyon Zorluğu', value: 'Orta/Yüksek', tone: 'high' },
    },
  },
  {
    id: 'istasyon',
    gameDistrictId: 'central',
    title: 'İstasyon Bölgesi',
    badges: [
      { label: 'Akış', icon: 'swap-horizontal-outline' },
      { label: 'Saat baskısı', icon: 'time-outline' },
    ],
    description: 'Transfer, akış ve saat baskısının operasyon temposunu belirlediği bölge.',
    metrics: {
      socialRisk: { label: 'Sosyal Risk', value: 'Orta', tone: 'mid' },
      staffPace: { label: 'Personel Temposu', value: 'Orta', tone: 'mid' },
      difficulty: { label: 'Operasyon Zorluğu', value: 'Yüksek', tone: 'high' },
    },
  },
  {
    id: 'yesilvadi',
    gameDistrictId: 'central',
    title: 'Yeşilvadi Bölgesi',
    badges: [
      { label: 'Çevre', icon: 'leaf-outline' },
      { label: 'Sakin tempo', icon: 'shield-checkmark-outline' },
    ],
    description: 'Çevre düzeni, konteyner hassasiyeti ve sakin hizmet dengesi öne çıkar.',
    metrics: {
      socialRisk: { label: 'Sosyal Risk', value: 'Düşük/Orta', tone: 'mid' },
      staffPace: { label: 'Personel Temposu', value: 'Orta', tone: 'mid' },
      difficulty: { label: 'Operasyon Zorluğu', value: 'Orta', tone: 'mid' },
    },
  },
];

export const ONBOARDING_DECISION_STYLE_BY_ID: Record<
  OnboardingStarterDecisionId,
  OnboardingDecisionStyle
> = {
  fast: 'fast_response',
  planned: 'planned_solution',
  partial: 'partial_intervention',
};

export const ONBOARDING_FALLBACK_DISTRICT_ID: OnboardingPilotDistrictId = 'merkez';
export const ONBOARDING_FALLBACK_DECISION_STYLE: OnboardingDecisionStyle = 'fast_response';
