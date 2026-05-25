import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

export type ProgressionIconName = ComponentProps<typeof Ionicons>['name'];

export type ProgressionNodeHint = 'core' | 'comingSoon';

export type ProgressionNode = {
  id: string;
  title: string;
  description: string;
  requiredXp: number;
  featureKey?: string;
  icon: ProgressionIconName;
  statusHint?: ProgressionNodeHint;
};

export type ProgressionBranch = {
  id: string;
  title: string;
  description: string;
  color: string;
  mutedColor: string;
  icon: ProgressionIconName;
  nodes: ProgressionNode[];
};

export const CAREER_ROLE_BADGE = 'Başlangıç Birimi';

export const CAREER_SUMMARY_DESCRIPTION =
  'Şu an temizlik operasyonları, temel olay yönetimi ve günlük raporlama yetkilerine sahipsin.';

/** XP ile açılan oyun özellikleri — roadmap node featureKey ile eşleşir. */
export const PROGRESSION_MILESTONE_KEYS = [
  'social-media',
  'advisor-report',
  'risk-map',
  'recycling',
  'vehicle-maintenance',
  'infrastructure',
] as const;

export type ProgressionMilestoneKey = (typeof PROGRESSION_MILESTONE_KEYS)[number];

export const PROGRESSION_BRANCHES: ProgressionBranch[] = [
  {
    id: 'operations',
    title: 'Operasyon Dalı',
    description: 'Günlük operasyon gücünü ve olay yönetimini genişletir.',
    color: '#1A8F8A',
    mutedColor: '#E6F5F4',
    icon: 'construct-outline',
    nodes: [
      {
        id: 'ops-daily-events',
        title: 'Günlük Olay Yönetimi',
        description: 'Aktif olayları görür, önceliklendirir ve karar verirsin.',
        requiredXp: 0,
        icon: 'calendar-outline',
        statusHint: 'core',
      },
      {
        id: 'ops-priority-queue',
        title: 'Öncelik Kuyruğu',
        description: 'Kritik olayları otomatik üst sıraya taşır.',
        requiredXp: 25,
        icon: 'list-outline',
      },
      {
        id: 'ops-multi-district',
        title: 'Çoklu Mahalle Operasyonu',
        description: 'Aynı günde birden fazla mahallede koordinasyon yaparsın.',
        requiredXp: 120,
        icon: 'map-outline',
        statusHint: 'comingSoon',
      },
      {
        id: 'ops-crisis-priority',
        title: 'Kriz Önceliklendirme',
        description: 'Şehir çapında krizleri tek panelden yönetirsin.',
        requiredXp: 200,
        icon: 'flash-outline',
        statusHint: 'comingSoon',
      },
    ],
  },
  {
    id: 'risk',
    title: 'Risk Dalı',
    description: 'Riskleri erken gör, tekrarlayan sorunları önle.',
    color: '#E89B2E',
    mutedColor: '#FDF4E6',
    icon: 'warning-outline',
    nodes: [
      {
        id: 'risk-basic-score',
        title: 'Temel Risk Skoru',
        description: 'Şehir risk göstergesini canlı takip edersin.',
        requiredXp: 0,
        icon: 'speedometer-outline',
        statusHint: 'core',
      },
      {
        id: 'risk-map',
        title: 'Mahalle Risk Haritası',
        description: 'Mahalle bazında risk yoğunluğunu haritada görürsün.',
        requiredXp: 180,
        featureKey: 'risk-map',
        icon: 'navigate-outline',
      },
      {
        id: 'risk-repeat-complaints',
        title: 'Tekrarlayan Şikayet Algılama',
        description: 'Aynı konudaki şikayetleri otomatik gruplar.',
        requiredXp: 220,
        icon: 'repeat-outline',
        statusHint: 'comingSoon',
      },
      {
        id: 'risk-early-warning',
        title: 'Kriz Erken Uyarı',
        description: 'Risk eşiği aşılmadan önce uyarı alırsın.',
        requiredXp: 400,
        icon: 'notifications-outline',
        statusHint: 'comingSoon',
      },
    ],
  },
  {
    id: 'communications',
    title: 'İletişim Dalı',
    description: 'Halk algısı ve medya baskısını yönet.',
    color: '#7B5BB8',
    mutedColor: '#F0EBFA',
    icon: 'chatbubbles-outline',
    nodes: [
      {
        id: 'comms-advisor-brief',
        title: 'Danışman Brifingi',
        description: 'Operasyon danışmanından günlük strateji özeti alırsın.',
        requiredXp: 0,
        icon: 'clipboard-outline',
        statusHint: 'core',
      },
      {
        id: 'comms-social-media',
        title: 'Sosyal Medya Takibi',
        description: 'Olayların sosyal medya baskısını görmeye başlarsın.',
        requiredXp: 50,
        featureKey: 'social-media',
        icon: 'logo-twitter',
      },
      {
        id: 'comms-advisor-report',
        title: 'Danışman Raporu',
        description: 'Gün sonu danışman analiz raporuna erişirsin.',
        requiredXp: 100,
        featureKey: 'advisor-report',
        icon: 'document-text-outline',
      },
      {
        id: 'comms-local-media',
        title: 'Yerel Medya Tepkisi',
        description: 'Yerel basının olaylara tepkisini izlersin.',
        requiredXp: 140,
        icon: 'newspaper-outline',
        statusHint: 'comingSoon',
      },
      {
        id: 'comms-public-perception',
        title: 'Halk Algısı Yönetimi',
        description: 'Algı trendlerine göre iletişim önerileri alırsın.',
        requiredXp: 300,
        icon: 'people-outline',
        statusHint: 'comingSoon',
      },
    ],
  },
  {
    id: 'personnel',
    title: 'Personel Dalı',
    description: 'Ekip moralini ve vardiya verimliliğini güçlendir.',
    color: '#4F5BB8',
    mutedColor: '#EBEEF8',
    icon: 'people-outline',
    nodes: [
      {
        id: 'staff-morale',
        title: 'Personel Morali',
        description: 'Ekip moralini operasyon kararlarına bağlarsın.',
        requiredXp: 0,
        icon: 'heart-outline',
        statusHint: 'core',
      },
      {
        id: 'staff-shift-tracking',
        title: 'Vardiya Takibi',
        description: 'Vardiya doluluk ve yorgunluk riskini görürsün.',
        requiredXp: 80,
        icon: 'time-outline',
        statusHint: 'comingSoon',
      },
      {
        id: 'staff-training',
        title: 'Eğitim Programı',
        description: 'Personel eğitim planlarıyla verimi artırırsın.',
        requiredXp: 280,
        icon: 'school-outline',
        statusHint: 'comingSoon',
      },
      {
        id: 'staff-overtime',
        title: 'Fazla Mesai Kontrolü',
        description: 'Mesai maliyetini ve yıpranmayı dengede tutarsın.',
        requiredXp: 320,
        icon: 'timer-outline',
        statusHint: 'comingSoon',
      },
    ],
  },
  {
    id: 'logistics',
    title: 'Lojistik Dalı',
    description: 'Araç filosu ve operasyon kapasitesini optimize et.',
    color: '#5B8FD4',
    mutedColor: '#EBF2FA',
    icon: 'bus-outline',
    nodes: [
      {
        id: 'log-vehicle-status',
        title: 'Araç Durumu',
        description: 'Filo durumunu ve müsait araçları takip edersin.',
        requiredXp: 0,
        icon: 'car-outline',
        statusHint: 'core',
      },
      {
        id: 'log-maintenance',
        title: 'Araç Bakım Planlama',
        description: 'Bakım planıyla arıza riskini düşürürsün.',
        requiredXp: 350,
        featureKey: 'vehicle-maintenance',
        icon: 'build-outline',
      },
      {
        id: 'log-route-impact',
        title: 'Rota Etkisi',
        description: 'Rota değişikliklerinin operasyon etkisini görürsün.',
        requiredXp: 420,
        icon: 'git-branch-outline',
        statusHint: 'comingSoon',
      },
      {
        id: 'log-capacity',
        title: 'Operasyon Kapasitesi',
        description: 'Günlük kapasite tavanını planlarsın.',
        requiredXp: 500,
        icon: 'bar-chart-outline',
        statusHint: 'comingSoon',
      },
    ],
  },
  {
    id: 'strategy',
    title: 'Strateji Dalı',
    description: 'Uzun vadeli şehir yatırımları ve kampanyalar.',
    color: '#3BAF7A',
    mutedColor: '#E8F7F0',
    icon: 'trending-up-outline',
    nodes: [
      {
        id: 'strat-recycling',
        title: 'Geri Dönüşüm Kampanyaları',
        description: 'Sürdürülebilirlik kampanyalarını yönetirsin.',
        requiredXp: 250,
        featureKey: 'recycling',
        icon: 'leaf-outline',
      },
      {
        id: 'strat-sponsors',
        title: 'Sponsor Fırsatları',
        description: 'Özel sektör destekli projeleri değerlendirirsin.',
        requiredXp: 150,
        icon: 'ribbon-outline',
        statusHint: 'comingSoon',
      },
      {
        id: 'strat-infrastructure',
        title: 'Uzun Vadeli Altyapı Projeleri',
        description: 'Çok günlük altyapı yatırımlarını planlarsın.',
        requiredXp: 550,
        featureKey: 'infrastructure',
        icon: 'business-outline',
      },
      {
        id: 'strat-equity',
        title: 'Bölgesel Hizmet Adaleti',
        description: 'Mahalleler arası hizmet dengesini izlersin.',
        requiredXp: 480,
        icon: 'scale-outline',
        statusHint: 'comingSoon',
      },
    ],
  },
];

export const COMING_SOON_SYSTEMS = [
  {
    id: 'cs-social-pressure',
    title: 'Sosyal Medya Baskısı',
    description: 'Olayların dijital yankısını anlık takip et.',
    icon: 'pulse-outline' as ProgressionIconName,
  },
  {
    id: 'cs-risk-map',
    title: 'Mahalle Risk Haritası',
    description: 'Risk yoğunluğunu harita üzerinde gör.',
    icon: 'map-outline' as ProgressionIconName,
  },
  {
    id: 'cs-recycling',
    title: 'Geri Dönüşüm Kampanyaları',
    description: 'Sürdürülebilirlik hedeflerini yönet.',
    icon: 'leaf-outline' as ProgressionIconName,
  },
  {
    id: 'cs-vehicle-maint',
    title: 'Araç Bakım Planlama',
    description: 'Filo bakımını proaktif planla.',
    icon: 'build-outline' as ProgressionIconName,
  },
  {
    id: 'cs-training',
    title: 'Personel Eğitim Programı',
    description: 'Ekip yetkinliğini uzun vadede artır.',
    icon: 'school-outline' as ProgressionIconName,
  },
  {
    id: 'cs-infrastructure',
    title: 'Uzun Vadeli Altyapı',
    description: 'Şehir altyapısına çok günlük yatırım yap.',
    icon: 'business-outline' as ProgressionIconName,
  },
] as const;

export function getAllRoadmapNodes(): ProgressionNode[] {
  return PROGRESSION_BRANCHES.flatMap((b) => b.nodes);
}

export function getProgressionMilestones(): {
  id: string;
  title: string;
  xpRequired: number;
}[] {
  return getAllRoadmapNodes()
    .filter(
      (n): n is ProgressionNode & { featureKey: string } =>
        Boolean(n.featureKey) && n.statusHint !== 'comingSoon',
    )
    .sort((a, b) => a.requiredXp - b.requiredXp)
    .map((n) => ({
      id: n.featureKey,
      title: n.title,
      xpRequired: n.requiredXp,
    }));
}
