import type Ionicons from '@expo/vector-icons/Ionicons';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SocialOutcomeIcon = keyof typeof Ionicons.glyphMap;

export type SocialPulseSummary = {
  score: number;
  maxScore: number;
  statusLabel: string;
  description: string;
  trendDelta: number;
  conversationVolume: string;
  satisfactionPercent: number;
  weeklyTrend: number[];
};

export type NeighborhoodSocialRisk = {
  id: string;
  name: string;
  score: number;
  riskLevel: 'high' | 'medium' | 'low';
  trend: number[];
};

export type SocialDecisionAction = {
  id: string;
  label: string;
  subtitle: string;
  effectLabel: string;
  color: 'teal' | 'amber' | 'muted';
};

export type HotSocialTopic = {
  id: string;
  badge: string;
  remainingTime: string;
  title: string;
  description: string;
  neighborhood: string;
  interactions: string;
  comments: string;
  riskChips: { label: string; value: string }[];
  actions: SocialDecisionAction[];
};

export type SocialSideTopic = {
  id: string;
  variant: 'rumor' | 'praise';
  title: string;
  text: string;
  metricLabel: string;
  metricValue: string;
  ctaLabel: string;
};

export type SocialOutcomeItem = {
  id: string;
  label: string;
  description: string;
  delta: number;
  icon: SocialOutcomeIcon;
};

export type LiveMention = {
  id: string;
  avatarInitials: string;
  name: string;
  neighborhood: string;
  timeAgo: string;
  category: 'complaint' | 'praise' | 'opportunity' | 'crisis';
  text: string;
  likes: number;
  comments: number;
};

export type SocialPulseScreenData = {
  summary: SocialPulseSummary;
  neighborhoods: NeighborhoodSocialRisk[];
  hotTopic: HotSocialTopic;
  sideTopics: [SocialSideTopic, SocialSideTopic];
  outcomes: SocialOutcomeItem[];
  mentions: LiveMention[];
  activeMentionCount: number;
  tipText: string;
};

// ─── Category helpers ────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<LiveMention['category'], string> = {
  complaint: 'Şikayet',
  praise: 'Takdir',
  opportunity: 'Fırsat',
  crisis: 'Kriz',
};

export const RISK_LABELS: Record<NeighborhoodSocialRisk['riskLevel'], string> =
  {
    high: 'Yüksek Risk',
    medium: 'Orta Risk',
    low: 'Düşük Risk',
  };

// ─── Mock data ───────────────────────────────────────────────────────────────

export const MOCK_SOCIAL_PULSE: SocialPulseScreenData = {
  summary: {
    score: 68,
    maxScore: 100,
    statusLabel: 'Dengede',
    description: 'Topluluğun nabzı istikrarlı.',
    trendDelta: 5,
    conversationVolume: '2.8K',
    satisfactionPercent: 71,
    weeklyTrend: [52, 55, 60, 58, 63, 66, 68],
  },

  neighborhoods: [
    {
      id: 'merkez',
      name: 'Merkez',
      score: 78,
      riskLevel: 'low',
      trend: [70, 72, 74, 76, 78],
    },
    {
      id: 'cumhuriyet',
      name: 'Cumhuriyet',
      score: 58,
      riskLevel: 'medium',
      trend: [62, 60, 58, 57, 58],
    },
    {
      id: 'sanayi',
      name: 'Sanayi',
      score: 52,
      riskLevel: 'medium',
      trend: [56, 54, 53, 51, 52],
    },
    {
      id: 'istasyon',
      name: 'İstasyon',
      score: 41,
      riskLevel: 'high',
      trend: [50, 48, 45, 42, 41],
    },
    {
      id: 'yesilvadi',
      name: 'Yeşilvadi',
      score: 33,
      riskLevel: 'high',
      trend: [44, 40, 38, 35, 33],
    },
  ],

  hotTopic: {
    id: 'hot-1',
    badge: 'Kriz Alarmı',
    remainingTime: '3 saat kaldı',
    title: 'Merkez Mahallesi Su Tahliyesi Sorunu',
    description:
      'Yoğun yağış sonrası cadde ve sokaklarda su birikintileri oluştu. Kötü koku ve sivrisinek şikayetleri artıyor.',
    neighborhood: 'Merkez Mahallesi',
    interactions: '2.8K',
    comments: '642',
    riskChips: [
      { label: 'Risk', value: 'Yüksek' },
      { label: 'Yayılma', value: 'Hızlı' },
    ],
    actions: [
      {
        id: 'explain',
        label: 'Açıklama Yap',
        subtitle: 'Halkı bilgilendir',
        effectLabel: '+Güven',
        color: 'teal',
      },
      {
        id: 'deploy',
        label: 'Ekip Yönlendir',
        subtitle: 'Müdahale başlat',
        effectLabel: '+Çözüm, −Kaynak',
        color: 'amber',
      },
      {
        id: 'silent',
        label: 'Sessiz Kal',
        subtitle: 'Risk devam eder',
        effectLabel: '+Risk',
        color: 'muted',
      },
    ],
  },

  sideTopics: [
    {
      id: 'rumor-1',
      variant: 'rumor',
      title: 'Söylenti / Yanlış Bilgi',
      text: '"Şebeke suyu kirli, içmeyin" iddiası yayılıyor.',
      metricLabel: 'Yayılma Hızı',
      metricValue: '%72',
      ctaLabel: 'Doğrula ve Bilgilendir',
    },
    {
      id: 'praise-1',
      variant: 'praise',
      title: 'Halktan Takdir',
      text: 'Temizlik ekiplerine teşekkür yağıyor.',
      metricLabel: 'Takdir Puanı',
      metricValue: '+1.250',
      ctaLabel: 'Teşekkür Et ve Paylaş',
    },
  ],

  outcomes: [
    {
      id: 'o1',
      label: 'Açıklama Yapıldı',
      description: 'Halk bilgilendirildi',
      delta: 18,
      icon: 'megaphone-outline',
    },
    {
      id: 'o2',
      label: 'Ekip Yönlendirildi',
      description: 'Müdahale başlatıldı',
      delta: 12,
      icon: 'people-outline',
    },
    {
      id: 'o3',
      label: 'Sessiz Kalındı',
      description: 'Risk yükseldi',
      delta: -5,
      icon: 'volume-mute-outline',
    },
    {
      id: 'o4',
      label: 'Düzenleme Yapıldı',
      description: 'Süreç iyileşti',
      delta: 20,
      icon: 'construct-outline',
    },
  ],

  mentions: [
    {
      id: 'm1',
      avatarInitials: 'AY',
      name: 'Ayşe Yılmaz',
      neighborhood: 'Merkez',
      timeAgo: '12 dk',
      category: 'complaint',
      text: 'Sokağımızda biriken sulardan geçemiyoruz, çocuklar okula gidemedi.',
      likes: 24,
      comments: 8,
    },
    {
      id: 'm2',
      avatarInitials: 'MK',
      name: 'Mehmet Kaya',
      neighborhood: 'İstasyon',
      timeAgo: '28 dk',
      category: 'praise',
      text: 'Belediye temizlik ekipleri dün gece boyunca çalıştı, teşekkürler!',
      likes: 56,
      comments: 12,
    },
    {
      id: 'm3',
      avatarInitials: 'FD',
      name: 'Fatma Demir',
      neighborhood: 'Cumhuriyet',
      timeAgo: '45 dk',
      category: 'crisis',
      text: 'Alt geçit tamamen su altında, acil müdahale lazım.',
      likes: 41,
      comments: 15,
    },
  ],

  activeMentionCount: 1247,

  tipText:
    'İpucu: Hızlı ve şeffaf iletişim, krizlerin etkisini azaltır ve halk güvenini artırır.',
};
