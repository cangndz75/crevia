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
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  trend: number[];
  /** Mahalle kimliği — kısa karakter etiketi. */
  identityTagline?: string;
};

export type SocialDecisionAction = {
  id: string;
  label: string;
  subtitle: string;
  effectLabel: string;
  color: 'teal' | 'amber' | 'muted';
  icon: SocialOutcomeIcon;
};

export type HotSocialTopicVisualTone =
  | 'crisis'
  | 'complaint'
  | 'misinformation'
  | 'gratitude'
  | 'service'
  | 'environment'
  | 'question';

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
  visualTone?: HotSocialTopicVisualTone;
  /** activeTopics kaynağı topic id — quick action için */
  topicId?: string;
  neighborhoodId?: string;
  topicType?: string;
  severity?: string;
  isMockFallback?: boolean;
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
  delta: number;
  timeAgo: string;
  icon: SocialOutcomeIcon;
};

export type LiveMentionCategory =
  | 'complaint'
  | 'praise'
  | 'opportunity'
  | 'crisis'
  | 'rumor'
  | 'question'
  | 'neutral';

export type LiveMention = {
  id: string;
  avatarInitials: string;
  name: string;
  neighborhood: string;
  timeAgo: string;
  category: LiveMentionCategory;
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

export const CATEGORY_LABELS: Record<LiveMentionCategory, string> = {
  complaint: 'Şikayet',
  praise: 'Teşekkür',
  opportunity: 'Fırsat',
  crisis: 'Kriz',
  rumor: 'Söylenti',
  question: 'Soru',
  neutral: 'Gündem',
};

export const RISK_LABELS: Record<NeighborhoodSocialRisk['riskLevel'], string> =
  {
    critical: 'Kritik',
    high: 'Yüksek Risk',
    medium: 'Orta Risk',
    low: 'Düşük Risk',
  };

// ─── Mock data ───────────────────────────────────────────────────────────────

export const MOCK_SOCIAL_PULSE: SocialPulseScreenData = {
  summary: {
    score: 64,
    maxScore: 100,
    statusLabel: 'Dengede',
    description: 'Topluluğun nabzı istikrarlı.',
    trendDelta: 18,
    conversationVolume: '2.8K',
    satisfactionPercent: 64,
    weeklyTrend: [44, 48, 52, 50, 56, 60, 64],
  },

  neighborhoods: [
    {
      id: 'merkez',
      name: 'Merkez',
      score: 66,
      riskLevel: 'high',
      trend: [60, 62, 64, 65, 66],
    },
    {
      id: 'cumhuriyet',
      name: 'Cumhuriyet',
      score: 62,
      riskLevel: 'medium',
      trend: [58, 59, 60, 61, 62],
    },
    {
      id: 'sanayi',
      name: 'Sanayi',
      score: 59,
      riskLevel: 'medium',
      trend: [55, 56, 57, 58, 59],
    },
    {
      id: 'yildiztepe',
      name: 'Yıldıztepe',
      score: 32,
      riskLevel: 'low',
      trend: [30, 31, 31, 32, 32],
    },
  ],

  hotTopic: {
    id: 'hot-1',
    badge: 'Günün Sosyal Krizi',
    remainingTime: '1 gün kaldı',
    title: 'Merkez Mahallesi Kriz Baskısı',
    description:
      'Krizle ilgili paylaşımlar hızlanıyor, kamuoyu baskısı artıyor.',
    neighborhood: 'Merkez',
    interactions: '2.8K',
    comments: '642 yorum',
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
        icon: 'megaphone-outline',
      },
      {
        id: 'deploy',
        label: 'Ekip Yönlendir',
        subtitle: 'Müdahale başlat',
        effectLabel: '+Çözüm, −Kaynak',
        color: 'amber',
        icon: 'people-outline',
      },
      {
        id: 'silent',
        label: 'Sessiz Kal',
        subtitle: 'Risk devam eder',
        effectLabel: '+Risk',
        color: 'muted',
        icon: 'volume-mute-outline',
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
      delta: 18,
      timeAgo: '1 gün önce',
      icon: 'megaphone-outline',
    },
    {
      id: 'o2',
      label: 'Ekip Yönlendirildi',
      delta: 22,
      timeAgo: '3 gün önce',
      icon: 'people-outline',
    },
    {
      id: 'o3',
      label: 'Krize Müdahale',
      delta: 31,
      timeAgo: '1 hafta önce',
      icon: 'construct-outline',
    },
    {
      id: 'o4',
      label: 'Sessiz Kalındı',
      delta: -8,
      timeAgo: '2 hafta önce',
      icon: 'volume-mute-outline',
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

  activeMentionCount: 240,

  tipText:
    'İpucu: Hızlı ve şeffaf iletişim, krizlerin etkisini azaltır.',
};
