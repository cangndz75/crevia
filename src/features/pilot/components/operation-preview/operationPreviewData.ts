import type Ionicons from '@expo/vector-icons/Ionicons';

export type RoadmapStepState = 'completed' | 'next' | 'locked' | 'goal';

export type RoadmapStep = {
  id: string;
  title: string;
  statusLabel: string;
  state: RoadmapStepState;
  icon: keyof typeof Ionicons.glyphMap;
};

export type StatusChipItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'success' | 'info' | 'warning';
};

export type SystemCardItem = {
  id: string;
  title: string;
  description: string;
  tag: string;
  icon: keyof typeof Ionicons.glyphMap;
  emphasis?: boolean;
  locked: boolean;
};

export type LegacyMetricItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'green' | 'gold' | 'blue' | 'cream';
};

export const STATUS_CHIPS: StatusChipItem[] = [
  {
    id: 'pilot-done',
    label: 'Pilot Tamamlandı',
    icon: 'flag',
    tone: 'success',
  },
  {
    id: 'report-ready',
    label: '7 Günlük Rapor Hazır',
    icon: 'document-text',
    tone: 'info',
  },
  {
    id: 'main-locked',
    label: 'Ana Operasyon Kilitli',
    icon: 'lock-closed',
    tone: 'warning',
  },
];

export const ROADMAP_STEPS: RoadmapStep[] = [
  {
    id: 'pilot',
    title: 'Pilot Bölge',
    statusLabel: 'Tamamlandı',
    state: 'completed',
    icon: 'checkmark-circle',
  },
  {
    id: 'city-map',
    title: 'Şehir Haritası',
    statusLabel: 'Sıradaki Kilit',
    state: 'next',
    icon: 'map',
  },
  {
    id: 'neighborhoods',
    title: 'Çoklu Mahalle',
    statusLabel: 'Yakında',
    state: 'locked',
    icon: 'business',
  },
  {
    id: 'main-op',
    title: 'Ana Operasyon',
    statusLabel: 'Geniş Mod',
    state: 'goal',
    icon: 'planet',
  },
];

export const SYSTEM_CARDS: SystemCardItem[] = [
  {
    id: 'city-map',
    title: 'Şehir Haritası',
    description: 'Tek bölgeden tüm şehir ağına geç.',
    tag: 'Şehir',
    icon: 'map-outline',
    emphasis: true,
    locked: true,
  },
  {
    id: 'neighborhoods',
    title: 'Çoklu Mahalle Yönetimi',
    description: 'Farklı karakterde mahalleleri aynı anda yönet.',
    tag: 'Strateji',
    icon: 'grid-outline',
    emphasis: true,
    locked: true,
  },
  {
    id: 'butterfly',
    title: 'Kelebek Etkisi',
    description: 'Küçük kararların uzun vadeli sonuçlarını takip et.',
    tag: 'Etki',
    icon: 'git-branch-outline',
    locked: true,
  },
  {
    id: 'vehicles',
    title: 'Araç ve Rota',
    description: 'Filo, rota ve bakım kararlarını optimize et.',
    tag: 'Operasyon',
    icon: 'car-outline',
    locked: true,
  },
  {
    id: 'staff',
    title: 'Personel Yönetimi',
    description: 'Moral, yorgunluk ve vardiya dengesini yönet.',
    tag: 'Ekip',
    icon: 'people-outline',
    locked: true,
  },
  {
    id: 'social',
    title: 'Sosyal Medya Baskısı',
    description: 'Krizleri yönet, halk algısını koru.',
    tag: 'Algı',
    icon: 'megaphone-outline',
    locked: true,
  },
];

export const LEGACY_METRICS: LegacyMetricItem[] = [
  { id: 'trust', label: 'Halk Güveni', icon: 'happy-outline', tone: 'green' },
  {
    id: 'budget',
    label: 'Bütçe Disiplini',
    icon: 'cash-outline',
    tone: 'gold',
  },
  {
    id: 'morale',
    label: 'Personel Morali',
    icon: 'people-outline',
    tone: 'blue',
  },
  {
    id: 'risk',
    label: 'Risk Hafızası',
    icon: 'shield-outline',
    tone: 'cream',
  },
];

export const HERO_STATUS_ROWS = [
  { id: 'pilot', label: 'Pilot Bölge', value: 'Tamamlandı', tone: 'success' as const },
  {
    id: 'map',
    label: 'Şehir Haritası',
    value: 'Kilitli',
    tone: 'locked' as const,
  },
  {
    id: 'main',
    label: 'Ana Operasyon',
    value: 'Hazırlanıyor',
    tone: 'pending' as const,
  },
];
