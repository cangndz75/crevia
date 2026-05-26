import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { PilotDistrictId } from '@/core/models/DistrictProfile';

export const ADVISOR = {
  name: 'Deniz Erdem',
  role: 'Saha Şefi',
  initials: 'DE',
} as const;

export const PLAYER_START_ROLE = 'Temizlik ve Çevre Operasyon Sorumlusu';

export type OnboardingStepId = 'welcome' | 'region' | 'events' | 'roadmap';

export type OnboardingStep = {
  id: OnboardingStepId;
  title: string;
  body: string;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Mahalle seninle şekilleniyor',
    body: 'Pilot bölgede mahalle hizmet koordinatörü olarak şikayetleri, fırsatları ve saha operasyonlarını yöneteceksin.',
  },
  {
    id: 'region',
    title: 'Pilot bölgeni seç',
    body: 'Başlangıç deneyimi mahalle karakterine ve karar baskısına göre değişir.',
  },
  {
    id: 'events',
    title: 'Olay kartlarıyla karar ver',
    body: 'Şikayetler, fırsatlar ve saha aksaklıkları arasında seçim yap. Her karar mahalleyi farklı etkiler.',
  },
  {
    id: 'roadmap',
    title: '7 günde fark yarat',
    body: 'Kararların kelebek etkisi yaratır. Mahalle güveni, ekip morali ve hizmet dengesi her gün yeniden şekillenir.',
  },
];

export const WELCOME_TAGS = [
  { id: 'pilot', label: 'Pilot Bölge', icon: 'location-outline' as const },
  { id: 'service', label: 'Mahalle Hizmetleri', icon: 'business-outline' as const },
];

export type FloatingMetric = {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  color: string;
  muted: string;
  icon: keyof typeof Ionicons.glyphMap;
  position: 'tl' | 'tr' | 'bl' | 'br';
};

export const WELCOME_FLOATING_METRICS: FloatingMetric[] = [
  {
    id: 'sat',
    label: 'Halk Memnuniyeti',
    value: '86%',
    trend: '+6%',
    trendUp: true,
    color: '#3BAF7A',
    muted: '#E8F7F0',
    icon: 'happy-outline',
    position: 'tl',
  },
  {
    id: 'budget',
    label: 'Bütçe',
    value: '₺3,42M',
    trend: '+120K',
    trendUp: true,
    color: '#5B8FD4',
    muted: '#EBF2FA',
    icon: 'cash-outline',
    position: 'tr',
  },
  {
    id: 'morale',
    label: 'Personel Morali',
    value: '78%',
    trend: '-3%',
    trendUp: false,
    color: '#7B5BB8',
    muted: '#F0EBFA',
    icon: 'people-outline',
    position: 'bl',
  },
  {
    id: 'risk',
    label: 'Operasyon Riski',
    value: 'Düşük',
    trend: '+1%',
    trendUp: false,
    color: '#F59E0B',
    muted: '#FEF3C7',
    icon: 'shield-outline',
    position: 'br',
  },
];

export const WELCOME_CHARACTERS = [
  { id: 'muhtar', label: 'Muhtar', emoji: '👴', role: 'mahalle' },
  { id: 'chief', label: 'Saha Şefi', emoji: '👷', role: 'saha' },
  { id: 'citizen', label: 'Vatandaş', emoji: '👩', role: 'halk' },
] as const;

export type RegionOption = {
  id: PilotDistrictId;
  title: string;
  tags: { label: string; icon: keyof typeof Ionicons.glyphMap }[];
  description: string;
  recommended?: boolean;
  stats: {
    socialRisk: { label: string; value: string; tone: 'low' | 'mid' | 'high' };
    staffPace: { label: string; value: string; tone: 'low' | 'mid' | 'high' };
    difficulty: { label: string; value: string; tone: 'low' | 'mid' | 'high' };
  };
};

export const REGION_OPTIONS: RegionOption[] = [
  {
    id: 'central',
    title: 'Merkez Pilot Bölge',
    recommended: true,
    tags: [
      { label: 'Dengeli', icon: 'scale-outline' },
      { label: 'Görünür Hizmet', icon: 'eye-outline' },
    ],
    description:
      'Görünür şikayetler ve dengeli kaynak baskısı. İlk gün için önerilen başlangıç.',
    stats: {
      socialRisk: { label: 'Sosyal Risk', value: 'Düşük', tone: 'low' },
      staffPace: { label: 'Personel Temposu', value: 'Orta', tone: 'mid' },
      difficulty: { label: 'Operasyon Zorluğu', value: 'Orta', tone: 'mid' },
    },
  },
  {
    id: 'cumhuriyet',
    title: 'Cumhuriyet Mahallesi',
    tags: [
      { label: 'Yoğun Şikayet', icon: 'chatbubble-outline' },
      { label: 'Hızlı Tepki', icon: 'flash-outline' },
    ],
    description:
      'Sosyal baskı daha erken yükselir. Hızlı kararlar güven kazandırır.',
    stats: {
      socialRisk: { label: 'Sosyal Risk', value: 'Yüksek', tone: 'high' },
      staffPace: { label: 'Personel Temposu', value: 'Yoğun', tone: 'high' },
      difficulty: { label: 'Operasyon Zorluğu', value: 'Yüksek', tone: 'high' },
    },
  },
  {
    id: 'industrial_market',
    title: 'Sanayi & Pazar Bölgesi',
    tags: [
      { label: 'Lojistik', icon: 'bus-outline' },
      { label: 'Kaynak Baskısı', icon: 'wallet-outline' },
    ],
    description:
      'Araç ve ekip planlaması kritik. Bütçe kararları daha belirleyici.',
    stats: {
      socialRisk: { label: 'Sosyal Risk', value: 'Orta', tone: 'mid' },
      staffPace: { label: 'Personel Temposu', value: 'Düşük', tone: 'low' },
      difficulty: { label: 'Operasyon Zorluğu', value: 'Orta', tone: 'mid' },
    },
  },
];

export const TUTORIAL_EVENT = {
  title: 'Pazar Sonrası Yoğunluk',
  time: '09:20',
  description:
    'Pazar alanı çevresinde temizlik gecikmesi bildirildi. Yoğun yaya trafiği olan bölge.',
  advisorTip: 'Hızlı çözüm güven kazandırır ama ekibi yorabilir.',
};

export type TutorialDecisionOption = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'success' | 'info' | 'warning';
};

export const TUTORIAL_DECISION_OPTIONS: TutorialDecisionOption[] = [
  {
    id: 'fast',
    title: 'Hızlı Müdahale',
    description: 'Ekibi hemen yönlendir, hızlı çöz.',
    icon: 'flash-outline',
    tone: 'success',
  },
  {
    id: 'planned',
    title: 'Planlı Çözüm',
    description: 'Programa al, kalıcı çözüm üret.',
    icon: 'calendar-outline',
    tone: 'info',
  },
  {
    id: 'partial',
    title: 'Kısmi Müdahale',
    description: 'Geçici müdahale ile durumu yönet.',
    icon: 'shield-outline',
    tone: 'warning',
  },
];

export const ROADMAP_DAYS = [
  { id: '1', label: 'Öğren', icon: 'school-outline' as const },
  { id: '2', label: 'Şikayet', icon: 'chatbubble-outline' as const },
  { id: '3', label: 'Kaynak', icon: 'bus-outline' as const },
  { id: '4', label: 'Sosyal Baskı', icon: 'megaphone-outline' as const },
  { id: '5', label: 'Fırsat', icon: 'ribbon-outline' as const },
  { id: '6', label: 'Kelebek Etkisi', icon: 'infinite-outline' as const },
  { id: '7', label: 'Final Raporu', icon: 'document-text-outline' as const },
];

export const OFFLINE_COPY = {
  title: 'Bağlantı Gerekli',
  body: 'Crevia şehir operasyon verilerini senkronize etmek için internet bağlantısına ihtiyaç duyar. Bağlantını kontrol edip tekrar dene.',
  retryLabel: 'Tekrar Dene',
} as const;
