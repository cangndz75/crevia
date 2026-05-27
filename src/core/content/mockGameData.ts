import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import { GameState } from '@/core/models/GameState';
import { colors } from '@/ui/theme/colors';

export const mockGameData: GameState = {
  city: {
    name: 'Crevia',
    day: 12,
    department: 'Temizlik İşleri',
    publicSatisfaction: 68,
    budget: 124_500,
    morale: 72,
    riskScore: 45,
    maxRiskScore: 100,
  },
  player: {
    xp: 2840,
    xpToNextLevel: 4000,
    authorityPoints: 14_200,
    level: 3,
    title: 'Temizlik İşleri',
    role: 'Operasyon Şefi',
    notificationCount: 3,
    streakDays: 6,
  },
  cityPulse: [
    {
      id: 'satisfaction',
      label: 'Halk Memnuniyeti',
      value: '68%',
      progress: 0.68,
      color: colors.success,
      mutedColor: colors.successMuted,
      icon: 'happy',
      trendLabel: 'Memnuniyet',
      trendValue: '+3%',
      trendTone: 'success',
      variant: 'ring',
    },
    {
      id: 'budget',
      label: 'Bütçe Durumu',
      value: '₺124.500',
      progress: 0.62,
      color: colors.secondary,
      mutedColor: colors.secondaryMuted,
      icon: 'cash',
      trendLabel: 'Bütçe',
      trendValue: '+8.500',
      trendTone: 'success',
      variant: 'icon',
    },
    {
      id: 'morale',
      label: 'Personel Morali',
      value: '72%',
      progress: 0.72,
      color: colors.purple,
      mutedColor: colors.purpleMuted,
      icon: 'people',
      trendLabel: 'Moral',
      trendValue: '-2%',
      trendTone: 'danger',
      variant: 'icon',
    },
    {
      id: 'risk',
      label: 'Risk Skoru',
      value: '45/100',
      progress: 0.45,
      color: colors.warning,
      mutedColor: colors.warningMuted,
      icon: 'alert',
      trendLabel: 'Risk',
      trendValue: 'Yüksek',
      trendTone: 'danger',
      variant: 'icon',
    },
  ],
  dailyMissions: [
    {
      id: 'solve-events',
      title: '3 Olayı Çöz',
      description: 'Gün içinde 3 aktif olayı başarıyla sonuçlandır.',
      icon: 'check',
      current: 3,
      target: 3,
      xpReward: 50,
      budgetReward: 5000,
      status: 'completed',
    },
    {
      id: 'lower-risk',
      title: 'Risk Skorunu 40 Altına Düşür',
      description: 'Risk defterindeki tehditleri azaltarak skoru düşür.',
      icon: 'shield',
      current: 45,
      target: 40,
      xpReward: 75,
      budgetReward: 7500,
      status: 'active',
    },
    {
      id: 'raise-satisfaction',
      title: 'Halk Memnuniyetini %70’e Çıkar',
      description: 'Vatandaş memnuniyetini yükseltmek için olumlu kararlar al.',
      icon: 'happy',
      current: 68,
      target: 70,
      xpReward: 100,
      status: 'pending',
    },
  ],
  events: [
    {
      id: 'container-overflow',
      title: 'Konteyner Taşması',
      category: 'Temizlik',
      riskLevel: 'high',
      district: 'Çankaya',
      contextTag: 'Acil müdahale',
      urgencyHours: 2,
      delayHint: true,
      filterTags: ['urgent', 'crisis'],
      description:
        'Konteynerler taştı, koku yayılıyor. Mahalle sakinleri sosyal medyada paylaşım yapıyor.',
      previewEffects: {
        publicSatisfaction: -8,
        risk: 12,
        xp: 20,
        budget: -8500,
      },
      decisions: [
        {
          id: 'send-extra-team',
          title: 'Ek Ekip Gönder',
          description:
            '2 ek ekip ve özel temizlik aracı yönlendir. Sorun hızlı çözülür ama maliyet artar.',
          style: 'bold',
          recommended: true,
          effects: {
            publicSatisfaction: 12,
            budget: -8000,
            morale: -3,
            risk: -15,
            xp: 15,
          },
        },
        {
          id: 'redirect-team',
          title: 'Mevcut Ekibi Yönlendir',
          description:
            'Rotayı değiştir ve mevcut ekibi gönder. Ucuz ama personel yorulur.',
          style: 'balanced',
          effects: {
            publicSatisfaction: 5,
            budget: -2000,
            morale: -8,
            risk: -5,
            xp: 8,
          },
        },
        {
          id: 'schedule-tomorrow',
          title: 'Yarın Sabah Programla',
          description:
            'Maliyeti düşür ama vatandaş tepkisi artabilir.',
          style: 'risky',
          delayHint: true,
          effects: {
            publicSatisfaction: -8,
            budget: -1000,
            morale: 2,
            risk: 10,
            xp: 3,
          },
        },
      ],
    },
    {
      id: 'park-fire-risk',
      title: 'Park Yangını Riski',
      category: 'Temizlik',
      riskLevel: 'medium',
      district: 'Ormanpark Mah.',
      contextTag: 'Saha uyarısı',
      urgencyHours: 6,
      filterTags: ['urgent'],
      description:
        'Kuru ot birikimi ve çöp yığınları yangın riskini artırıyor. Önleyici temizlik planı gerekli.',
      previewEffects: {
        publicSatisfaction: -4,
        risk: 6,
        xp: 12,
      },
      decisions: [
        {
          id: 'clear-zone',
          title: 'Risk Bölgesini Temizle',
          description: 'Ekip ve sulama desteğiyle alanı güvenli hale getir.',
          style: 'bold',
          recommended: true,
          effects: {
            publicSatisfaction: 6,
            budget: -4500,
            morale: -2,
            risk: -10,
            xp: 10,
          },
        },
      ],
    },
    {
      id: 'flood-warning',
      title: 'Su Baskını Uyarısı',
      category: 'Altyapı',
      riskLevel: 'low',
      district: 'Yıldırım Mah.',
      contextTag: 'Hava uyarısı',
      urgencyHours: 8,
      description:
        'Yağış sonrası mazgir tıkanıklığı bildirildi. Önleyici müdahale ile hasar önlenebilir.',
      previewEffects: {
        publicSatisfaction: -2,
        risk: 4,
        xp: 10,
      },
      decisions: [
        {
          id: 'drain-team',
          title: 'Drenaj Ekibi Gönder',
          description: 'Hızlı müdahale ile su birikimini önle.',
          style: 'balanced',
          recommended: true,
          effects: {
            publicSatisfaction: 5,
            budget: -3000,
            morale: 0,
            risk: -8,
            xp: 8,
          },
        },
      ],
    },
    {
      id: 'road-collapse',
      title: 'Yol Çökme Tehlikesi',
      category: 'Altyapı',
      riskLevel: 'medium',
      district: 'Sanayi Mah.',
      contextTag: 'Güvenlik önceliği',
      urgencyHours: 10,
      filterTags: ['crisis'],
      description:
        'Yağmur sonrası yol kenarında çökme belirtileri görüldü. Bölge hâlâ trafiğe açık; fen işleri keşif raporu bekliyor.',
      previewEffects: {
        publicSatisfaction: -5,
        risk: 8,
        xp: 15,
      },
      decisions: [
        {
          id: 'close-road',
          title: 'Yolu Geçici Kapat',
          description:
            'Trafiği keserek güvenliği sağla. Vatandaşlar gecikmeden şikâyet edebilir.',
          style: 'cautious',
          recommended: true,
          effects: {
            publicSatisfaction: -5,
            budget: -3000,
            morale: 0,
            risk: -20,
            xp: 10,
          },
        },
        {
          id: 'inspect-team',
          title: 'Keşif Ekibi Gönder',
          description:
            'Önce teknik rapor al, sonra müdahale et. Dengeli ama risk penceresi açık kalır.',
          style: 'balanced',
          effects: {
            publicSatisfaction: 2,
            budget: -1500,
            morale: -2,
            risk: -8,
            xp: 6,
          },
        },
      ],
    },
  ],
  featuredEventId: 'container-overflow',
  eventOpportunity: {
    id: 'volunteer-support',
    title: 'Mahalle Gönüllüleri Destek Veriyor',
    description:
      'Vatandaşlar temizlik ve çevre düzenlemesi için destek olmaya hazır.',
    xpReward: 15,
  },
  solvedEvents: [
    { id: 'tree-fall', title: 'Ağaç Devrilme Riski', xpEarned: 10 },
    { id: 'water-outage', title: 'Su Kesintisi Şikayeti', xpEarned: 8 },
  ],
  eventAdvisor: {
    body:
      'Önce yüksek riskli operasyonu çözmek, ardından bütçe dostu seçeneklere dönmek bugünkü dengeyi korur. Sosyal baskı artıyorsa iletişim kararını erteleme.',
    attribution: '— Prof. Dr. İlker Karahan',
    tokenCost: 25,
  },
  risks: [
    {
      id: 'staff-fatigue',
      title: 'Personel Yorgunluğu',
      subtitle: 'Moral düşüşü',
      severity: 'high',
      description:
        'Personel fazla mesai yapıyor. Moral düşüşü ve hata riski artıyor; vardiya planı gözden geçirilmeli.',
      probability: 65,
      cost: 3000,
      actionLabel: 'Özel İzin Ver',
      icon: 'people',
    },
    {
      id: 'vehicle-breakdown',
      title: 'Araç Arıza Riski',
      subtitle: 'Filo bakımı',
      severity: 'medium',
      description:
        '2 kamyon bakım tarihini geçti. Sahada arıza olursa toplama rotaları aksayabilir.',
      probability: 45,
      cost: 8500,
      actionLabel: 'Bakım Planla',
      icon: 'vehicle',
    },
    {
      id: 'social-pressure',
      title: 'Sosyal Medya Baskısı',
      subtitle: 'İtibar riski',
      severity: 'critical',
      description:
        'Aktif olayla bağlantılı viral paylaşımlar artıyor. Basın ofisi hızlı yanıt bekliyor.',
      probability: 78,
      cost: 1500,
      actionLabel: 'Açıklama Yayınla',
      icon: 'megaphone',
    },
    {
      id: 'overflow-odor',
      title: 'Koku Şikayeti Dalgası',
      subtitle: 'Halk baskısı',
      severity: 'high',
      description:
        'Çankaya hattında konteyner taşması sonrası koku şikayetleri 3 katına çıktı.',
      probability: 58,
      cost: 6000,
      actionLabel: 'Acil Ekip Gönder',
      icon: 'alert',
    },
    {
      id: 'budget-overrun',
      title: 'Bütçe Aşımı Riski',
      subtitle: 'Finansal baskı',
      severity: 'medium',
      description:
        'Ay sonu harcamaları planlananın %12 üzerinde. Ek harcama onayı gerekebilir.',
      probability: 40,
      cost: 12000,
      actionLabel: 'Harcama Dondur',
      icon: 'document',
    },
  ],
  abilities: [
    {
      id: 'cleaning',
      title: 'Temizlik İşleri',
      description:
        'Temel operasyon yetkisi. Tüm alt yetkilerin kilidini açar ve günlük görevleri yönetmeni sağlar.',
      parentId: null,
      status: 'unlocked',
      level: 1,
      maxLevel: 3,
      upgradeCostXp: 1200,
      icon: 'cleaning',
    },
    {
      id: 'route-edit',
      title: 'Rota Düzenleme',
      description:
        'Lojistik optimizasyonu sayesinde yakıt tüketimini düşürür ve operasyonel verimliliği artırır.',
      parentId: 'cleaning',
      status: 'unlocked',
      level: 2,
      maxLevel: 4,
      upgradeCostXp: 2500,
      icon: 'route',
    },
    {
      id: 'extra-staff',
      title: 'Ek Personel Talebi',
      description:
        'Yoğun günlerde geçici personel talep etmeni sağlar. Moral ve bütçe dengesini etkiler.',
      parentId: 'cleaning',
      status: 'unlocked',
      level: 1,
      maxLevel: 3,
      upgradeCostXp: 1800,
      icon: 'people',
    },
    {
      id: 'vehicle-maintenance',
      title: 'Araç Bakım Planı',
      description:
        'Filo bakımını önceden planlayarak arıza riskini azaltır. Uzun vadede bütçe tasarrufu sağlar.',
      parentId: 'cleaning',
      status: 'locked',
      level: 0,
      maxLevel: 3,
      upgradeCostXp: 3200,
      icon: 'vehicle',
    },
    {
      id: 'social-response',
      title: 'Sosyal Medya Yanıtı',
      description:
        'Kriz anlarında resmi hesaplardan hızlı açıklama yayınlama yetkisi verir.',
      parentId: 'extra-staff',
      status: 'locked',
      level: 0,
      maxLevel: 2,
      upgradeCostXp: 2100,
      icon: 'megaphone',
    },
    {
      id: 'parks',
      title: 'Park ve Bahçeler',
      description:
        'Yeşil alan bakım rotalarını yönetir. Halk memnuniyetine düzenli katkı sağlar.',
      parentId: 'route-edit',
      status: 'locked',
      level: 0,
      maxLevel: 3,
      upgradeCostXp: 2800,
      icon: 'park',
    },
    {
      id: 'public-works',
      title: 'Fen İşleri',
      description:
        'Yol ve altyapı müdahalelerini koordine etmeni sağlar. Yüksek maliyetli kararlar açar.',
      parentId: 'vehicle-maintenance',
      status: 'locked',
      level: 0,
      maxLevel: 2,
      upgradeCostXp: 4500,
      icon: 'works',
    },
    {
      id: 'zoning',
      title: 'Zabıta Koordinasyonu',
      description:
        'Zabıta ekipleriyle ortak operasyon planlaması yapmanı sağlar.',
      parentId: 'parks',
      status: 'locked',
      level: 0,
      maxLevel: 2,
      upgradeCostXp: 3600,
      icon: 'shield',
    },
    {
      id: 'transport',
      title: 'Ulaşım Entegrasyonu',
      description:
        'Toplu taşıma hatlarıyla senkronize temizlik programı oluşturur.',
      parentId: 'public-works',
      status: 'locked',
      level: 0,
      maxLevel: 2,
      upgradeCostXp: 5000,
      icon: 'transport',
    },
  ],
  riskSummary: {
    total: 45,
    activeThreats: 5,
    critical: 1,
  },
  operationsBrief: {
    motto:
      'Sahanın nabzını tut. Kuyruk soğumasın — önce tehlike, sonra tablo düzelir.',
    livePulse: [
      {
        id: 'north-collection',
        status: 'steady',
        headline: 'Kuzey toplama hattı',
        detail: '3 ekip aktif · gecikme raporu yok.',
      },
      {
        id: 'cankaya-line',
        status: 'watch',
        headline: 'Çankaya yoğunluğu',
        detail: 'Konteyner sonrası bölge sıcak; vardiya çıkışı izleniyor.',
      },
      {
        id: 'press-monitor',
        status: 'hot',
        headline: 'Basın & sosyal akış',
        detail: 'Aktif olayla bağlı paylaşım hızı yükseliyor.',
      },
      {
        id: 'fleet',
        status: 'watch',
        headline: 'Filo durumu',
        detail: '2 araç bakım gecikmesinde; yarın aksama riski var.',
      },
    ],
    advisor: {
      eyebrow: 'Danışman notu',
      body:
        'Çankaya hattını stabilize etmeden memnuniyet toparlamak zor. Önce kritik sosyal baskıyı düşür, ardından risk defterinden filo ve moral kalemlerine dön.',
      attribution: 'Strateji ofisi · gün özeti simülasyonu',
    },
  },
  dailyReport: {
    day: 12,
    title: 'Gün 12 Tamamlandı',
    stats: [
      { label: 'XP', value: '+45 XP', tone: 'positive' },
      { label: 'Halk Memnuniyeti', value: '+3%', tone: 'positive' },
      { label: 'Bütçe', value: '-12000₺', tone: 'negative' },
      { label: 'Personel Morali', value: '-5%', tone: 'negative' },
      { label: 'Risk Skoru', value: '+8', tone: 'negative' },
    ],
    rewardTitle: 'Enerjik Lider',
    rewardDescription: 'Bugün zorlu kararları yönettin.',
  },
  pilot: createDefaultPilotState(),
};

export function getEventById(id: string) {
  return mockGameData.events.find((event) => event.id === id);
}

export function getFeaturedEvent() {
  return (
    mockGameData.events.find((e) => e.id === mockGameData.featuredEventId) ??
    mockGameData.events[0]
  );
}

export function getActiveEventsExcludingFeatured() {
  const { featuredEventId, events } = mockGameData;
  return events.filter((e) => e.id !== featuredEventId);
}

export function getCriticalEventCount() {
  return mockGameData.events.filter(
    (e) => e.riskLevel === 'critical' || e.riskLevel === 'high',
  ).length;
}

export function formatUrgencyLabel(hours: number) {
  return `${hours} saat kaldı`;
}

export { formatCurrency } from '@/core/utils/gameFormatters';

export function getRiskLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    critical: 'Kritik',
  };
  return labels[level] ?? level;
}

export function getRiskChipTone(
  level: string,
): 'success' | 'warning' | 'danger' | 'info' {
  switch (level) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
      return 'danger';
    case 'critical':
      return 'danger';
    default:
      return 'info';
  }
}

export function formatDecisionEffects(effects: {
  publicSatisfaction: number;
  budget: number;
  morale: number;
  risk: number;
  xp: number;
}): string {
  const parts = [
    `Halk ${effects.publicSatisfaction >= 0 ? '+' : ''}${effects.publicSatisfaction}`,
    `Bütçe ${effects.budget}`,
    `Moral ${effects.morale >= 0 ? '+' : ''}${effects.morale}`,
    `Risk ${effects.risk >= 0 ? '+' : ''}${effects.risk}`,
    `XP +${effects.xp}`,
  ];
  return parts.join(', ');
}

export function getCompletedMissionCount() {
  return mockGameData.dailyMissions.filter((m) => m.status === 'completed')
    .length;
}

export function getRiskSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    critical: 'Kritik',
  };
  return labels[severity] ?? severity;
}

export function getAbilityById(id: string) {
  return mockGameData.abilities.find((a) => a.id === id);
}

export function getAbilityChildren(parentId: string | null) {
  return mockGameData.abilities.filter((a) => a.parentId === parentId);
}

export function formatAuthorityPoints(points: number) {
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1).replace('.0', '')}k`;
  }
  return String(points);
}

export function getRiskSeverityColor(severity: string): string {
  switch (severity) {
    case 'low':
      return colors.success;
    case 'medium':
      return colors.warning;
    case 'high':
      return colors.warning;
    case 'critical':
      return '#C43E38';
    default:
      return colors.textSecondary;
  }
}
