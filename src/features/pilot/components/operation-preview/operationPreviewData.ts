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
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'success' | 'info' | 'warning';
};

export type SystemCardItem = {
  id: string;
  title: string;
  description: string;
  tag: string;
  /** Kart durumu — kilit / yakında / önizleme */
  statusTag: string;
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
    description: 'Pilot bölge başarıyla tamamlandı.',
    icon: 'flag',
    tone: 'success',
  },
  {
    id: 'report-ready',
    label: '7 Günlük Rapor Hazır',
    description: 'Günlük operasyon raporu hazır.',
    icon: 'document-text',
    tone: 'info',
  },
  {
    id: 'authority-tracking',
    label: 'Yetki İzleniyor',
    description: 'Üst yönetim değerlendirmesi bekleniyor.',
    icon: 'shield-checkmark',
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
    id: 'city-scale',
    title: 'Şehir Ölçeği',
    statusLabel: 'Yakında',
    state: 'locked',
    icon: 'lock-closed',
  },
];

export const SYSTEM_CARDS: SystemCardItem[] = [
  {
    id: 'city-map',
    title: 'Şehir Haritası',
    description:
      'Pilot tamamlandı; şehir haritası ana operasyon açılışında.',
    tag: 'Şehir',
    statusTag: 'Önizleme',
    icon: 'map-outline',
    emphasis: true,
    locked: true,
  },
  {
    id: 'neighborhoods',
    title: 'Çoklu Mahalle Yönetimi',
    description: 'Farklı karakterde mahalleleri aynı anda yönet.',
    tag: 'Strateji',
    statusTag: 'Yakında',
    icon: 'grid-outline',
    emphasis: true,
    locked: true,
  },
  {
    id: 'butterfly',
    title: 'Kelebek Etkisi',
    description:
      'Pilot kararlarının yankıları kayıt altında; ana operasyonla büyür.',
    tag: 'Etki',
    statusTag: 'Pilotla hazırlandı',
    icon: 'git-branch-outline',
    locked: false,
  },
  {
    id: 'vehicles',
    title: 'Araç ve Rota',
    description: 'Filo, rota ve bakım kararlarını optimize et. Pilot tamamlandı.',
    tag: 'Operasyon',
    statusTag: 'Kilitli',
    icon: 'car-outline',
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
