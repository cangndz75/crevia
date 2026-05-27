import type { ProgressionIconName } from '@/core/content/progressionRoadmap';

export type AuthorityTheme = 'teal' | 'purple' | 'gold';

export type AuthorityDisplayStatus = 'active' | 'soon' | 'locked';

export type AuthorityGridDefinition = {
  id: string;
  title: string;
  nodeId: string;
  theme: AuthorityTheme;
  icon: ProgressionIconName;
};

export type WeeklyUnlockDefinition = {
  id: string;
  title: string;
  description: string;
  nodeId: string;
  theme: AuthorityTheme;
  icon: ProgressionIconName;
};

export const BADGE_COLLECTION_TOTAL = 30;

/** Ana yetki grid'i — tasarım spesifikasyonu ile hizalı */
export const AUTHORITY_GRID_DEFINITIONS: AuthorityGridDefinition[] = [
  {
    id: 'risk-map',
    title: 'Mahalle Risk Haritası',
    nodeId: 'risk-map',
    theme: 'teal',
    icon: 'map-outline',
  },
  {
    id: 'social-media',
    title: 'Sosyal Medya Takibi',
    nodeId: 'comms-social-media',
    theme: 'purple',
    icon: 'heart-outline',
  },
  {
    id: 'vehicle-planning',
    title: 'Araç Planlama',
    nodeId: 'log-maintenance',
    theme: 'gold',
    icon: 'bus-outline',
  },
  {
    id: 'community',
    title: 'Topluluk Katılımı',
    nodeId: 'comms-public-perception',
    theme: 'gold',
    icon: 'people-outline',
  },
  {
    id: 'environment',
    title: 'Çevre İzleme',
    nodeId: 'strat-recycling',
    theme: 'teal',
    icon: 'leaf-outline',
  },
  {
    id: 'education',
    title: 'Eğitim Koordinasyonu',
    nodeId: 'staff-training',
    theme: 'purple',
    icon: 'school-outline',
  },
];

export const WEEKLY_UNLOCK_DEFINITIONS: WeeklyUnlockDefinition[] = [
  {
    id: 'first-response',
    title: 'İlk Müdahale',
    description: 'Acil durumları hızlı yönetme yetkisi.',
    nodeId: 'ops-priority-queue',
    theme: 'teal',
    icon: 'medkit-outline',
  },
  {
    id: 'data-literacy',
    title: 'Veri Okuryazarlığı',
    description: 'Verileri yorumla, içgörü üret.',
    nodeId: 'risk-basic-score',
    theme: 'purple',
    icon: 'bar-chart-outline',
  },
];

export const STATUS_LABELS: Record<AuthorityDisplayStatus, string> = {
  active: 'Aktif',
  soon: 'Yakında',
  locked: 'Kilitli',
};
