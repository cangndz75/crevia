import type { NeighborhoodIdentity, NeighborhoodIdentityId } from './neighborhoodIdentityTypes';

export const CANONICAL_NEIGHBORHOOD_IDS: readonly NeighborhoodIdentityId[] = [
  'merkez',
  'cumhuriyet',
  'sanayi',
  'istasyon',
  'yesilvadi',
] as const;

export const DEFAULT_NEIGHBORHOOD_ID: NeighborhoodIdentityId = 'cumhuriyet';

export const NEIGHBORHOOD_IDENTITIES: Record<
  NeighborhoodIdentityId,
  NeighborhoodIdentity
> = {
  cumhuriyet: {
    id: 'cumhuriyet',
    name: 'Cumhuriyet Mahallesi',
    shortName: 'Cumhuriyet',
    archetype: 'starter_residential',
    tagline: 'Dengeli başlangıç',
    description:
      'Pilot mahallesi; aileler, okul çevresi ve düzenli sokaklar. Öğretici ve dengeli bir tempo.',
    playerHint:
      'Küçük aksaklıklar erken fark edilir; net iletişimle memnuniyet hızlı toparlanır.',
    socialChipLabel: 'Dengeli başlangıç',
    mapCharacterLine: 'Öğretici ve dengeli pilot mahalle',
    visualTone: 'blue',
    iconName: 'home-outline',
    representative: {
      name: 'Ayşe Öğretmen',
      role: 'Mahalle gönüllüsü',
      quote:
        'Burada küçük aksaklıklar bile güveni etkiler, ama doğru iletişim hızlı toparlar.',
      avatarKey: 'rep_cumhuriyet',
    },
    strengths: ['Topluluk uyumu', 'Şikayetler çözüme açık'],
    vulnerabilities: [
      'Görünür temizlik sorunları hızlı fark edilir',
      'Memnuniyet düşüşü erken uyarı verir',
    ],
    sensitivities: {
      social_visibility: 48,
      waste_pressure: 52,
      traffic_flow: 42,
      maintenance_need: 48,
      public_expectation: 58,
      budget_sensitivity: 38,
      personnel_load: 42,
      crisis_spread: 40,
    },
    eventBias: {
      waste: 0.5,
      social: 0.52,
      vehicle: 0.45,
      personnel: 0.42,
      maintenance: 0.48,
      traffic: 0.4,
      budget: 0.38,
    },
    goalBias: {
      publicSatisfaction: 0.55,
      operationRisk: 0.45,
      budget: 0.4,
      personnelMorale: 0.48,
      containerPressure: 0.5,
      socialPulse: 0.52,
      vehicleRisk: 0.45,
    },
    reportTone: {
      good: 'Cumhuriyet’te topluluk uyumu korundu; küçük aksaklıklar hızlı toparlandı.',
      warning:
        'Cumhuriyet’te görünür temizlik ve memnuniyet sinyalleri dikkat istedi.',
      critical:
        'Cumhuriyet’te güven algısı zayıfladı; iletişim ve görünür müdahale öncelikli.',
    },
  },
  merkez: {
    id: 'merkez',
    name: 'Merkez',
    shortName: 'Merkez',
    archetype: 'civic_center',
    tagline: 'Görünürlük yüksek',
    description:
      'Belediye görünürlüğü ve sosyal yankı yüksek; küçük hatalar büyük görünür.',
    playerHint:
      'Merkez’de herkes görür — geciken karar sosyal baskıyı büyütür.',
    socialChipLabel: 'Görünürlük yüksek',
    mapCharacterLine: 'Çarşı görünürlüğü yüksek',
    visualTone: 'violet',
    iconName: 'storefront-outline',
    representative: {
      name: 'Murat Esnaf',
      role: 'Çarşı temsilcisi',
      quote: 'Merkez’de herkes görür, herkes konuşur. Geciken karar büyür.',
      avatarKey: 'rep_merkez',
    },
    strengths: ['Hızlı müdahalede pozitif geri dönüş'],
    vulnerabilities: ['Sosyal görünürlük yüksek', 'Kriz yayılımı hızlı'],
    sensitivities: {
      social_visibility: 92,
      waste_pressure: 55,
      traffic_flow: 68,
      maintenance_need: 50,
      public_expectation: 72,
      budget_sensitivity: 48,
      personnel_load: 52,
      crisis_spread: 88,
    },
    eventBias: {
      waste: 0.52,
      social: 0.88,
      vehicle: 0.5,
      personnel: 0.45,
      maintenance: 0.48,
      traffic: 0.62,
      budget: 0.42,
    },
    goalBias: {
      publicSatisfaction: 0.82,
      operationRisk: 0.55,
      budget: 0.45,
      personnelMorale: 0.48,
      containerPressure: 0.5,
      socialPulse: 0.85,
      vehicleRisk: 0.48,
    },
    reportTone: {
      good: 'Merkez’de görünürlük yüksek kaldı; iletişim kararları sosyal baskıyı sınırladı.',
      warning:
        'Merkez’de sosyal yankı arttı; görünür olaylara hızlı yanıt gerekti.',
      critical:
        'Merkez’de kriz algısı hızla yayıldı; öncelikli iletişim ve müdahale şart.',
    },
  },
  sanayi: {
    id: 'sanayi',
    name: 'Sanayi',
    shortName: 'Sanayi',
    archetype: 'industrial_pressure',
    tagline: 'Operasyon baskısı',
    description:
      'Atık, konteyner, araç ve rota yükü yoğun; hızlı çözüm işe yarar ama yıpratıcıdır.',
    playerHint:
      'Sanayi hedeflerinde araç ve atık baskısı daha belirgin olur.',
    socialChipLabel: 'Operasyon baskısı',
    mapCharacterLine: 'Rota ve atık baskısı',
    visualTone: 'orange',
    iconName: 'construct-outline',
    representative: {
      name: 'Nermin Usta',
      role: 'Sanayi kooperatif temsilcisi',
      quote: 'Burada iş durmaz. Geciken toplama ertesi güne iki kat yük bindirir.',
      avatarKey: 'rep_sanayi',
    },
    strengths: ['Net operasyonel müdahale hızlı sonuç verir'],
    vulnerabilities: [
      'Araç ve konteyner yükü',
      'Bütçe ve personel baskısı',
    ],
    sensitivities: {
      social_visibility: 52,
      waste_pressure: 90,
      traffic_flow: 58,
      maintenance_need: 78,
      public_expectation: 55,
      budget_sensitivity: 68,
      personnel_load: 72,
      crisis_spread: 55,
    },
    eventBias: {
      waste: 0.9,
      social: 0.48,
      vehicle: 0.85,
      personnel: 0.65,
      maintenance: 0.8,
      traffic: 0.55,
      budget: 0.58,
    },
    goalBias: {
      publicSatisfaction: 0.48,
      operationRisk: 0.62,
      budget: 0.58,
      personnelMorale: 0.62,
      containerPressure: 0.88,
      socialPulse: 0.45,
      vehicleRisk: 0.85,
    },
    reportTone: {
      good: 'Sanayi’de operasyon yükü kontrol altında; toplama ve filo dengede kaldı.',
      warning:
        'Sanayi’de operasyon yükü arttı; araç ve konteyner takibi kritik kaldı.',
      critical:
        'Sanayi’de atık ve filo baskısı kritik; ertelenen müdahale yükü katladı.',
    },
  },
  istasyon: {
    id: 'istasyon',
    name: 'İstasyon',
    shortName: 'İstasyon',
    archetype: 'transit_crossroads',
    tagline: 'Akış dalgalı',
    description:
      'Geçiş bölgesi; gün içi kalabalık değişken, trafik ve akış şikayetleri dalgalı.',
    playerHint:
      'Rota ve akış kararları İstasyon’da tüm mahalleleri etkileyebilir.',
    socialChipLabel: 'Akış dalgalı',
    mapCharacterLine: 'Trafik ve geçiş yoğunluğu',
    visualTone: 'slate',
    iconName: 'bus-outline',
    representative: {
      name: 'Selim Şoför',
      role: 'Hat sürücüsü',
      quote: 'İstasyon’da bir gecikme sadece bir sokağı değil, bütün akışı etkiler.',
      avatarKey: 'rep_istasyon',
    },
    strengths: ['Doğru rota planıyla hızlı toparlanır'],
    vulnerabilities: [
      'Geçici yoğunluk',
      'Akış bozulması ve görünür kirlilik',
    ],
    sensitivities: {
      social_visibility: 58,
      waste_pressure: 58,
      traffic_flow: 88,
      maintenance_need: 52,
      public_expectation: 60,
      budget_sensitivity: 50,
      personnel_load: 55,
      crisis_spread: 62,
    },
    eventBias: {
      waste: 0.55,
      social: 0.52,
      vehicle: 0.72,
      personnel: 0.5,
      maintenance: 0.5,
      traffic: 0.88,
      budget: 0.45,
    },
    goalBias: {
      publicSatisfaction: 0.5,
      operationRisk: 0.75,
      budget: 0.48,
      personnelMorale: 0.52,
      containerPressure: 0.55,
      socialPulse: 0.5,
      vehicleRisk: 0.78,
    },
    reportTone: {
      good: 'İstasyon’da akış dalgaları yönetildi; rota koordinasyonu işe yaradı.',
      warning:
        'İstasyon’da trafik ve geçiş yoğunluğu arttı; akış kararları gecikti.',
      critical:
        'İstasyon’da akış tıkandı; gecikmeler birden fazla hatta yansıdı.',
    },
  },
  yesilvadi: {
    id: 'yesilvadi',
    name: 'Yeşilvadi',
    shortName: 'Yeşilvadi',
    archetype: 'green_residential',
    tagline: 'Çevre hassas',
    description:
      'Parklar ve sakin sokaklar; koku, park temizliği ve çevre beklentisi yüksek.',
    playerHint:
      'Küçük ihmal prestij kaybettirir; park ve koku sinyallerine erken bak.',
    socialChipLabel: 'Çevre hassas',
    mapCharacterLine: 'Park ve çevre hassasiyeti',
    visualTone: 'green',
    iconName: 'leaf-outline',
    representative: {
      name: 'Elif Peyzajcı',
      role: 'Park gönüllüsü',
      quote:
        'Yeşilvadi sakin görünür ama çevre hassasiyeti yüksektir. Küçük ihmal çabuk fark edilir.',
      avatarKey: 'rep_yesilvadi',
    },
    strengths: ['İyi yönetimde memnuniyet yüksek kalır'],
    vulnerabilities: ['Koku ve park temizliği', 'Çevre hassasiyeti'],
    sensitivities: {
      social_visibility: 55,
      waste_pressure: 42,
      traffic_flow: 40,
      maintenance_need: 65,
      public_expectation: 85,
      budget_sensitivity: 45,
      personnel_load: 42,
      crisis_spread: 48,
    },
    eventBias: {
      waste: 0.42,
      social: 0.58,
      vehicle: 0.48,
      personnel: 0.4,
      maintenance: 0.68,
      traffic: 0.42,
      budget: 0.4,
    },
    goalBias: {
      publicSatisfaction: 0.78,
      operationRisk: 0.48,
      budget: 0.42,
      personnelMorale: 0.45,
      containerPressure: 0.45,
      socialPulse: 0.72,
      vehicleRisk: 0.48,
    },
    reportTone: {
      good: 'Yeşilvadi’de çevre hassasiyeti korundu; park temizliği algısı olumlu kaldı.',
      warning:
        'Yeşilvadi’de çevre ve park sinyalleri dikkat istedi; küçük ihmal fark edildi.',
      critical:
        'Yeşilvadi’de prestij kaybı riski arttı; koku ve park temizliği öncelikli.',
    },
  },
};
