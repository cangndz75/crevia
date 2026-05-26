import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { PilotDistrictId } from '@/core/models/DistrictProfile';

export type OnboardingStepId = 'welcome' | 'region' | 'events' | 'roadmap';

export type OnboardingStepMeta = {
  id: OnboardingStepId;
  title: string;
  titleLines?: string[];
  body: string;
};

export const ONBOARDING_STEPS: OnboardingStepMeta[] = [
  {
    id: 'welcome',
    title: 'Mahalle seninle şekilleniyor',
    titleLines: ['Mahalle seninle', 'şekilleniyor'],
    body: 'Pilot Bölge Hizmet Koordinatörü olarak mahalle hizmetlerini dengele, vatandaş taleplerini yönet ve kararlarının etkisini gör.',
  },
  {
    id: 'region',
    title: 'Pilot bölgeni seç',
    body: 'Başlangıç deneyimi, mahallenin karakterine, ilk olaylara ve karar baskısına göre değişir.',
  },
  {
    id: 'events',
    title: 'Olay kartlarıyla karar ver',
    titleLines: ['Olay kartlarıyla', 'karar ver'],
    body: 'Şikayetler, fırsatlar ve saha aksaklıkları arasında seçim yap. Her karar mahalleyi farklı etkiler.',
  },
  {
    id: 'roadmap',
    title: '7 günde fark yarat',
    body: 'Kararların kelebek etkisi yaratır. Mahalle güveni, ekip morali ve hizmet dengesi her gün yeniden şekillenir.',
  },
];

export const WELCOME_PILLS = [
  { id: 'pilot', label: 'Pilot Bölge', icon: 'location-outline' as const },
  { id: 'service', label: 'Mahalle Hizmetleri', icon: 'business-outline' as const },
];

export type FloatingMetricData = {
  id: string;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  accent: string;
  accentMuted: string;
  icon: keyof typeof Ionicons.glyphMap;
  position: 'tl' | 'tr' | 'bl' | 'br';
};

export const WELCOME_METRICS: FloatingMetricData[] = [
  {
    id: 'sat',
    label: 'Halk Memnuniyeti',
    value: '86%',
    trend: '+6%',
    trendUp: true,
    accent: '#3BAF7A',
    accentMuted: '#E8F7F0',
    icon: 'happy-outline',
    position: 'tl',
  },
  {
    id: 'budget',
    label: 'Bütçe',
    value: '₺3.42M',
    trend: '+120K',
    trendUp: true,
    accent: '#5B8FD4',
    accentMuted: '#EBF2FA',
    icon: 'cash-outline',
    position: 'tr',
  },
  {
    id: 'morale',
    label: 'Personel Morali',
    value: '78%',
    trend: '-3%',
    trendUp: false,
    accent: '#7B5BB8',
    accentMuted: '#F0EBFA',
    icon: 'people-outline',
    position: 'bl',
  },
  {
    id: 'risk',
    label: 'Operasyon Riski',
    value: 'Düşük',
    trend: '+1%',
    trendUp: false,
    accent: '#F59E0B',
    accentMuted: '#FEF3C7',
    icon: 'shield-outline',
    position: 'br',
  },
];

export const WELCOME_CHARACTERS = [
  {
    id: 'muhtar',
    label: 'Muhtar',
    roleIcon: 'ribbon-outline' as const,
    assetKey: 'muhtar' as const,
  },
  {
    id: 'saha',
    label: 'Saha Şefi',
    roleIcon: 'construct-outline' as const,
    assetKey: 'sahaSefi' as const,
  },
  {
    id: 'citizen',
    label: 'Vatandaş',
    roleIcon: 'people-outline' as const,
    assetKey: 'vatandas' as const,
  },
] as const;

export type RegionCardData = {
  id: PilotDistrictId;
  title: string;
  badges: { label: string; icon: keyof typeof Ionicons.glyphMap }[];
  description: string;
  recommended?: boolean;
  metrics: {
    socialRisk: { label: string; value: string; tone: 'low' | 'mid' | 'high' };
    staffPace: { label: string; value: string; tone: 'low' | 'mid' | 'high' };
    difficulty: { label: string; value: string; tone: 'low' | 'mid' | 'high' };
  };
};

export const REGION_CARDS: RegionCardData[] = [
  {
    id: 'central',
    title: 'Merkez Pilot Bölge',
    recommended: true,
    badges: [
      { label: 'Dengeli', icon: 'scale-outline' },
      { label: 'Orta Hizmet', icon: 'eye-outline' },
    ],
    description:
      'Esnaf canlı, yollar düzenli. Hizmet yükü dengeli bir merkez.',
    metrics: {
      socialRisk: { label: 'Sosyal Risk', value: 'Düşük', tone: 'low' },
      staffPace: { label: 'Personel Temposu', value: 'Orta', tone: 'mid' },
      difficulty: { label: 'Operasyon Zorluğu', value: 'Düşük', tone: 'low' },
    },
  },
  {
    id: 'cumhuriyet',
    title: 'Cumhuriyet Mahallesi',
    badges: [
      { label: 'Sosyal Baskı', icon: 'megaphone-outline' },
      { label: 'Hızlı Tepki', icon: 'flash-outline' },
    ],
    description:
      'Vatandaş talepleri yoğun, olayları hızlı çözüme bağlaman gerekir.',
    metrics: {
      socialRisk: { label: 'Sosyal Risk', value: 'Yüksek', tone: 'high' },
      staffPace: { label: 'Personel Temposu', value: 'Yüksek', tone: 'high' },
      difficulty: { label: 'Operasyon Zorluğu', value: 'Orta', tone: 'mid' },
    },
  },
  {
    id: 'industrial_market',
    title: 'Sanayi & Pazar Bölgesi',
    badges: [
      { label: 'Operasyon', icon: 'bus-outline' },
      { label: 'Rota Baskısı', icon: 'navigate-outline' },
    ],
    description:
      'Araç trafiği yoğun, temizlik ve koordinasyon ön planda olacak.',
    metrics: {
      socialRisk: { label: 'Sosyal Risk', value: 'Orta', tone: 'mid' },
      staffPace: { label: 'Personel Temposu', value: 'Orta', tone: 'mid' },
      difficulty: { label: 'Operasyon Zorluğu', value: 'Yüksek', tone: 'high' },
    },
  },
];

export const TUTORIAL_EVENT = {
  chip: 'OLAY KARTI',
  time: '09:20',
  title: 'Pazar Sonrası Yoğunluk',
  description:
    'Pazar alanında temizlik gecikti. Esnaf ve vatandaşlar sabah yoğunluğundan önce müdahale bekliyor.',
  advisorName: 'Saha Şefi',
  advisorTip: 'Hızlı çözüm güven kazandırır ama ekibi yorabilir.',
  swipeHint: 'Kartı kaydırarak diğer olaylara göz at',
};

export type EventDecisionOption = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'mint' | 'blue' | 'orange';
};

export const EVENT_DECISIONS: EventDecisionOption[] = [
  {
    id: 'fast',
    title: 'Hızlı Müdahale',
    subtitle: 'Hemen ekip yönlendir, hızlı çöz.',
    icon: 'flash-outline',
    tone: 'mint',
  },
  {
    id: 'planned',
    title: 'Planlı Çözüm',
    subtitle: 'Programı düzenle, kalıcı çözüm üret.',
    icon: 'calendar-outline',
    tone: 'blue',
  },
  {
    id: 'partial',
    title: 'Kısmi Müdahale',
    subtitle: 'Geçici müdahale ile durumu idare et.',
    icon: 'shield-outline',
    tone: 'orange',
  },
];

export const EVENT_FLOATING_STATS: FloatingMetricData[] = [
  {
    id: 'sat-e',
    label: 'Halk Memnuniyeti',
    value: '86%',
    trend: '+6%',
    trendUp: true,
    accent: '#3BAF7A',
    accentMuted: '#E8F7F0',
    icon: 'happy-outline',
    position: 'tl',
  },
  {
    id: 'budget-e',
    label: 'Bütçe',
    value: '₺3.42M',
    trend: '-120K',
    trendUp: false,
    accent: '#5B8FD4',
    accentMuted: '#EBF2FA',
    icon: 'cash-outline',
    position: 'tr',
  },
  {
    id: 'morale-e',
    label: 'Personel Morali',
    value: '78%',
    trend: '-3%',
    trendUp: false,
    accent: '#7B5BB8',
    accentMuted: '#F0EBFA',
    icon: 'people-outline',
    position: 'bl',
  },
  {
    id: 'risk-e',
    label: 'Operasyon Riski',
    value: 'Düşük',
    trend: '+1%',
    trendUp: false,
    accent: '#F59E0B',
    accentMuted: '#FEF3C7',
    icon: 'shield-outline',
    position: 'br',
  },
];

export const ROADMAP_DAYS = [
  { id: '1', day: 1, label: 'Öğren', icon: 'school-outline' as const },
  { id: '2', day: 2, label: 'Şikayet', icon: 'chatbubble-outline' as const },
  { id: '3', day: 3, label: 'Kaynak', icon: 'bus-outline' as const },
  { id: '4', day: 4, label: 'Sosyal Baskı', icon: 'megaphone-outline' as const },
  { id: '5', day: 5, label: 'Fırsat', icon: 'ribbon-outline' as const },
  { id: '6', day: 6, label: 'Kelebek Etkisi', icon: 'infinite-outline' as const },
  { id: '7', day: 7, label: 'Final Raporu', icon: 'document-text-outline' as const },
];

export const ROADMAP_HIGHLIGHT_DAY = 4;

export const OUTCOME_SUMMARY = {
  title: 'Pilot Bölge Sonucu',
  status: 'Bölge pozitif döndü!',
  stats: [
    { icon: 'pulse-outline' as const, label: 'Mahalle Nabzı', value: 'Kontrollü', positive: true },
    { icon: 'heart-outline' as const, label: 'Güven', value: '+12', positive: true },
    { icon: 'shield-outline' as const, label: 'Risk', value: '-8', positive: true },
  ],
  mapBadge: 'Pilot sonrası ilçe geneline açıl',
  progress: 0.78,
};

export const OUTCOME_MINI_CARDS = [
  {
    id: 'opportunity',
    title: 'Fırsat Kartı',
    subtitle: 'Gençlik Merkezi',
    detail: '+ Güven',
    badge: '+5',
    badgeTone: 'lavender' as const,
    icon: 'sparkles-outline' as const,
  },
  {
    id: 'risk',
    title: 'Risk Uyarısı',
    subtitle: 'Trafik Yoğunluğu',
    detail: 'Memnuniyet',
    badge: '-3',
    badgeTone: 'orange' as const,
    icon: 'warning-outline' as const,
  },
  {
    id: 'xp',
    title: 'Seviye İlerlemesi',
    subtitle: '650 / 900 XP',
    detail: 'Seviye',
    badge: '4',
    badgeTone: 'primary' as const,
    icon: 'trophy-outline' as const,
    level: 4,
    progress: 650 / 900,
  },
] as const;
