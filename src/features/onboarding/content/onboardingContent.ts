export const ADVISOR = {
  name: 'Deniz Erdem',
  role: 'Kentsel Operasyon Danışmanı',
  initials: 'DE',
} as const;

export const PLAYER_START_ROLE = 'Temizlik ve Çevre Operasyon Sorumlusu';

export type OnboardingStep = {
  id: string;
  title: string;
  /** Teal vurgulu ikinci satır (varsa) */
  titleAccent?: string;
  body: string;
  footnote?: string;
  footnoteLead?: string;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Crevia’ya',
    titleAccent: 'Hoş Geldin',
    body: 'Bu şehirde her gün yeni bir operasyon başlar. Şikayetler, krizler, fırsatlar ve saha ekipleri aynı anda yönetilmek zorunda.',
    footnote: 'sınırlı kaynaklarla en doğru kararları vermek.',
    footnoteLead: 'Görevin,',
  },
  {
    id: 'role',
    title: 'İlk Görevin:',
    titleAccent: 'Temizlik ve Çevre Operasyon Sorumlusu',
    body: 'Bugün sahadaki temizlik olaylarından, vatandaş şikayetlerinden ve ekiplerin günlük yükünden sen sorumlusun.',
    footnote: 'Birini yükseltirken diğerini riske atabilirsin.',
    footnoteLead: 'Denge,',
  },
  {
    id: 'advisor',
    title: 'Danışmanın:',
    titleAccent: 'Deniz Erdem',
    body: 'Ben Deniz. Sana her gün saha raporlarını, riskleri ve kararlarının olası etkilerini aktaracağım. Ama unutma, kararı ben değil sen vereceksin.',
  },
  {
    id: 'events',
    title: 'Her Olay Bir',
    titleAccent: 'Zincirin Başlangıcı',
    body: 'Basit görünen bir konteyner şikayeti, ertesi gün sosyal medya baskısına veya mahalle güven kaybına dönüşebilir.',
    footnote: 'Görünürlük yüksek olaylara öncelik ver.',
    footnoteLead: 'İpucu:',
  },
];

export const ROLE_METRIC_CHIPS = [
  'Halk Memnuniyeti',
  'Bütçe',
  'Personel Morali',
] as const;

export const SAMPLE_EVENT_CARD = {
  title: 'Konteyner Taşması',
  district: 'Merkez Mahallesi',
  risk: 'Orta',
  visibility: 'Yüksek',
} as const;

export type TutorialDecision = {
  id: string;
  title: string;
  description: string;
  outcome: string;
};

export const TUTORIAL_EVENT = {
  title: 'Konteyner Taşması',
  district: 'Merkez Mahallesi',
  description:
    'Merkez Mahallesi’nde ana cadde üzerindeki bir konteynerin taştığı bildirildi. Bölge yaya trafiğinin yoğun olduğu bir noktada.',
  risk: 'Orta',
  visibility: 'Yüksek',
  repeatRisk: 'Orta',
  advisorNote:
    'Bu olay tek başına büyük bir kriz değil. Ama Merkez Mahallesi’nde görünürlük yüksek. Geç müdahale edilirse sosyal medya tepkisine dönüşebilir.',
  advisorGreeting:
    'Günaydın. İlk günün sakin başlamayacak gibi görünüyor. Merkez Mahallesi’nden görünürlüğü yüksek bir temizlik şikayeti geldi.',
  closingMessage:
    'İyi. Crevia’da doğru karar her zaman en ucuz ya da en hızlı karar değildir. Şimdi gerçek güne başlayabiliriz.',
} as const;

export const TUTORIAL_DECISIONS: TutorialDecision[] = [
  {
    id: 'extra-crew',
    title: 'Ek temizlik ekibi gönder',
    description:
      'Hızlı müdahale sağlar. Personel yükünü artırır. Bütçe etkisi orta.',
    outcome:
      'Sorun hızlıca çözüldü. Halk memnuniyeti yükseldi ancak ekipler güne daha yoğun başladı.',
  },
  {
    id: 'normal-route',
    title: 'Normal toplama rotasına ekle',
    description:
      'Maliyet düşüktür. Çözüm gecikebilir. Tekrar şikayet riski vardır.',
    outcome:
      'Bütçe korundu ama bölgede memnuniyetsizlik tamamen kapanmadı. Bu konu yarın tekrar karşına çıkabilir.',
  },
  {
    id: 'container-plan',
    title: 'Konteyner ve dezenfeksiyon planı başlat',
    description:
      'Daha maliyetlidir. Kalıcı çözüm etkisi yüksektir. Mahalle güvenini artırabilir.',
    outcome:
      'Daha pahalı bir karar verdin ama mahallede güven etkisi oluştu. Uzun vadeli risk azaldı.',
  },
];

export const OFFLINE_COPY = {
  title: 'Bağlantı Gerekli',
  body: 'Crevia şehir operasyon verilerini senkronize etmek için internet bağlantısına ihtiyaç duyar. Bağlantını kontrol edip tekrar dene.',
  retryLabel: 'Tekrar Dene',
} as const;
