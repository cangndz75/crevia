import type {
  EventContentCategory,
  EventContentDecisionBlueprint,
  EventContentProfile,
  EventNarrativeTone,
} from './eventContentTypes';

function bp(
  partial: Omit<EventContentDecisionBlueprint, 'strategyLabel'> & {
    strategyLabel?: string;
  },
): EventContentDecisionBlueprint {
  const strategy =
    partial.strategyLabel ??
    (partial.intent === 'dispatch_team'
      ? 'Hızlı çözüm'
      : partial.intent === 'permanent_fix'
        ? 'Kalıcı çözüm'
        : partial.intent === 'save_resources' || partial.intent === 'monitor'
          ? 'Kaynak korur'
          : partial.intent === 'communicate' || partial.intent === 'coordinate'
            ? 'Sosyal rahatlama'
            : 'Dengeli plan');
  return { ...partial, strategyLabel: strategy };
}

function profile(
  base: Omit<EventContentProfile, 'decisionBlueprints' | 'fieldNoteTemplates'> & {
    decisions: EventContentDecisionBlueprint[];
    fieldNoteTemplates?: string[];
  },
): EventContentProfile {
  return {
    ...base,
    fieldNoteTemplates:
      base.fieldNoteTemplates && base.fieldNoteTemplates.length > 0
        ? base.fieldNoteTemplates
        : base.descriptionTemplates,
    decisionBlueprints: base.decisions,
  };
}

const WASTE_DECISIONS: EventContentDecisionBlueprint[] = [
  bp({
    id: 'fast_dispatch',
    intent: 'dispatch_team',
    title: 'Hızlı toplama ekibi gönder',
    description: 'Ekstra ekip ile doluluk baskısını hemen düşür.',
    shortTradeoff: 'Hızlı rahatlama, personel/araç yükü artar',
    riskHint: 'Moral ve rota yükü yükselir',
    recommendedForPriority: ['operation_stability'],
  }),
  bp({
    id: 'reroute',
    intent: 'reroute',
    title: 'Rotayı yeniden sırala',
    description: 'Toplama sırasını optimize et, görünür müdahaleyi geciktirme.',
    shortTradeoff: 'Operasyonel denge, orta etki',
    riskHint: 'Gecikme sosyal baskıyı büyütebilir',
    recommendedForPriority: ['operation_stability', 'resource_protection'],
  }),
  bp({
    id: 'inform',
    intent: 'communicate',
    title: 'Mahalleye bilgilendirme yap',
    description: 'Vatandaşa plan ve süre paylaş, beklentiyi yönet.',
    shortTradeoff: 'Sosyal baskı azalır, saha etkisi sınırlı',
    riskHint: 'Fiziksel baskı kısa süre kalabilir',
    recommendedForPriority: ['public_relief'],
  }),
  bp({
    id: 'capacity',
    intent: 'permanent_fix',
    title: 'Kapasiteyi kalıcı artır',
    description: 'Ek konteyner veya sık toplama planıyla kalıcı rahatlama.',
    shortTradeoff: 'Bütçe düşer, uzun vadede iyi',
    riskHint: 'Kısa vadede kaynak baskısı',
    recommendedForPriority: ['resource_protection'],
    discouragedForPriority: ['public_relief'],
  }),
];

const SOCIAL_DECISIONS: EventContentDecisionBlueprint[] = [
  bp({
    id: 'publish',
    intent: 'communicate',
    title: 'Açıklama yayınla',
    description: 'Resmi açıklama ile söylentiyi sınırla.',
    shortTradeoff: 'Sosyal baskı azalır, saha etkisi az',
    riskHint: 'Görünür müdahale eksik kalabilir',
    recommendedForPriority: ['public_relief', 'resource_protection'],
  }),
  bp({
    id: 'visible_team',
    intent: 'dispatch_team',
    title: 'Görünür saha müdahalesi yap',
    description: 'Ekip sahada görünsün, güven sinyali ver.',
    shortTradeoff: 'Halk rahatlar, ekip yorulur',
    riskHint: 'Personel ve araç yükü artar',
    recommendedForPriority: ['public_relief', 'operation_stability'],
  }),
  bp({
    id: 'coordinate_rep',
    intent: 'coordinate',
    title: 'Temsilciyle koordine ol',
    description: 'Muhtar/esnaf hattı üzerinden güven köprüsü kur.',
    shortTradeoff: 'Dengeli, güven etkisi',
    riskHint: 'Sonuç gecikebilir',
    recommendedForPriority: ['public_relief'],
  }),
  bp({
    id: 'wait',
    intent: 'monitor',
    title: 'Sessiz kal ve izle',
    description: 'Kaynak koru, tepkiyi ölç.',
    shortTradeoff: 'Kaynak korur, sosyal risk büyüyebilir',
    riskHint: 'Görünürlük kaybı',
    discouragedForPriority: ['public_relief'],
    recommendedForPriority: ['resource_protection'],
  }),
];

const VEHICLE_DECISIONS: EventContentDecisionBlueprint[] = [
  bp({
    id: 'route_support',
    intent: 'reroute',
    title: 'Rota desteği ver',
    description: 'Öncelikli hatlara ek destek planla.',
    shortTradeoff: 'Akış toparlanır, filo yüklenir',
    riskHint: 'Bakım ihtiyacı artabilir',
    recommendedForPriority: ['operation_stability'],
  }),
  bp({
    id: 'standby',
    intent: 'inspect',
    title: 'Bakım aracını hazır beklet',
    description: 'Arıza riskine karşı hazır tut.',
    shortTradeoff: 'Risk azalır, kaynak bağlar',
    riskHint: 'Bütçe ve bekleme maliyeti',
    recommendedForPriority: ['operation_stability', 'resource_protection'],
  }),
  bp({
    id: 'defer',
    intent: 'delay',
    title: 'Düşük öncelikli işleri ertele',
    description: 'Kritik hattı koru, diğerlerini kaydır.',
    shortTradeoff: 'Kaynak korur, bazı mahalleler bekler',
    riskHint: 'Memnuniyet dalgalanır',
    recommendedForPriority: ['resource_protection'],
  }),
  bp({
    id: 'watch',
    intent: 'monitor',
    title: 'Sadece izle',
    description: 'Veri topla, müdahaleyi ertele.',
    shortTradeoff: 'Minimum kaynak, risk kalır',
    riskHint: 'Yoğunluk büyüyebilir',
    discouragedForPriority: ['operation_stability'],
  }),
];

const PERSONNEL_DECISIONS: EventContentDecisionBlueprint[] = [
  bp({
    id: 'rotate',
    intent: 'coordinate',
    title: 'Ekip rotasyonu yap',
    description: 'Yükü dengele, lider ekibi öne al.',
    shortTradeoff: 'Moral korunur, tempo düşer',
    riskHint: 'Operasyon hızı azalır',
    recommendedForPriority: ['resource_protection', 'operation_stability'],
  }),
  bp({
    id: 'rest_block',
    intent: 'save_resources',
    title: 'Kısa dinlenme bloğu ver',
    description: '30-60 dk nefes arası planla.',
    shortTradeoff: 'Moral toparlanır, gecikme riski',
    riskHint: 'Bekleyen iş birikebilir',
    recommendedForPriority: ['resource_protection'],
  }),
  bp({
    id: 'motivate',
    intent: 'communicate',
    title: 'Saha lideriyle moral konuşması',
    description: 'Görünür takdir ve net öncelik ver.',
    shortTradeoff: 'Hızlı moral, sürdürülebilirlik sınırlı',
    riskHint: 'Yorgunluk devam edebilir',
    recommendedForPriority: ['public_relief'],
  }),
  bp({
    id: 'push',
    intent: 'dispatch_team',
    title: 'Tempoyu koru, ek vardiya',
    description: 'Günü güçlü kapat, yorgunluğu kabul et.',
    shortTradeoff: 'Operasyon hızlanır, yıpranma artar',
    riskHint: 'Ertesi gün düşüş',
    recommendedForPriority: ['operation_stability'],
    discouragedForPriority: ['resource_protection'],
  }),
];

const OPPORTUNITY_DECISIONS: EventContentDecisionBlueprint[] = [
  bp({
    id: 'accept_help',
    intent: 'coordinate',
    title: 'Gönüllü desteğini kabul et',
    description: 'Mahalle desteğini plana dahil et.',
    shortTradeoff: 'Düşük maliyet, koordinasyon gerekir',
    riskHint: 'Standart dışı süreç',
    recommendedForPriority: ['public_relief'],
  }),
  bp({
    id: 'partner',
    intent: 'communicate',
    title: 'Ortak bilgilendirme yap',
    description: 'Esnaf/okul hattıyla ortak mesaj.',
    shortTradeoff: 'Güven artar, zaman alır',
    riskHint: 'Mesaj uyumsuzluğu',
    recommendedForPriority: ['public_relief'],
  }),
  bp({
    id: 'pilot_test',
    intent: 'inspect',
    title: 'Küçük pilot uygula',
    description: 'Düşük riskli deneme ile öğren.',
    shortTradeoff: 'Dengeli öğrenme',
    riskHint: 'Sonuç belirsiz',
    recommendedForPriority: ['resource_protection'],
  }),
  bp({
    id: 'decline',
    intent: 'save_resources',
    title: 'Teşekkür et, ertele',
    description: 'Kaynakları kritik işlere sakla.',
    shortTradeoff: 'Kaynak korur, fırsat kaçar',
    riskHint: 'İlişki zayıflayabilir',
    recommendedForPriority: ['resource_protection'],
  }),
];

const PERMANENT_DECISIONS: EventContentDecisionBlueprint[] = [
  bp({
    id: 'invest',
    intent: 'permanent_fix',
    title: 'Kalıcı kapasite yatırımı',
    description: 'Uzun vadeli düzenleme onayla.',
    shortTradeoff: 'Bütçe yükü, kalıcı rahatlama',
    riskHint: 'Kısa vadede baskı sürebilir',
    recommendedForPriority: ['resource_protection'],
  }),
  bp({
    id: 'plan_board',
    intent: 'communicate',
    title: 'Mahalle panosu kur',
    description: 'Şeffaf plan ve iletişim noktası.',
    shortTradeoff: 'Güven artar, uygulama gerekir',
    riskHint: 'Eylem gecikirse güven düşer',
    recommendedForPriority: ['public_relief'],
  }),
  bp({
    id: 'route_perm',
    intent: 'reroute',
    title: 'Kalıcı rota revizyonu',
    description: 'Haftalık planı yeniden yaz.',
    shortTradeoff: 'Operasyonel kazanım',
    riskHint: 'Geçiş süreci zor',
    recommendedForPriority: ['operation_stability'],
  }),
  bp({
    id: 'phase',
    intent: 'monitor',
    title: 'Aşamalı uygula',
    description: 'Önce pilot mahalle, sonra yay.',
    shortTradeoff: 'Kaynak kontrollü',
    riskHint: 'Bekleyen mahalleler',
    recommendedForPriority: ['resource_protection'],
  }),
];

function wasteProfiles(): EventContentProfile[] {
  return [
    profile({
      id: 'waste_sanayi_line',
      category: 'waste_container',
      titleTemplates: ['Sanayi’de konteyner hattı baskı veriyor'],
      descriptionTemplates: [
        'Kooperatif çevresindeki doluluk esnaf saatleriyle çakıştı. Gecikme ertesi güne ağır rota yükü bırakabilir.',
      ],
      fieldNoteTemplates: ['Esnaf temsilcisi sabah saatlerinde ikinci kez aradı.'],
      citizenVoiceTemplates: ['“Burada iş durmaz, toplama da durmamalı.”'],
      allowedNeighborhoods: ['sanayi'],
      preferredNeighborhoodArchetypes: ['industrial_pressure'],
      tags: ['waste', 'container', 'sanayi'],
      narrativeTone: 'operational',
      baseSeverity: 'high',
      decisions: WASTE_DECISIONS,
      variationRules: { avoidRepeatWithinDays: 2 },
    }),
    profile({
      id: 'waste_merkez_visible',
      category: 'waste_container',
      titleTemplates: ['Merkez’de görünür atık birikimi tepki çekiyor'],
      descriptionTemplates: [
        'Çarşı çevresindeki birikim kısa sürede görünür oldu. Müdahale gecikirse sosyal gündem büyüyebilir.',
      ],
      fieldNoteTemplates: ['Sosyal medyada 3 paylaşım daha geldi.'],
      allowedNeighborhoods: ['merkez'],
      preferredNeighborhoodArchetypes: ['civic_center'],
      preferredPriorityKeys: ['public_relief'],
      tags: ['waste', 'merkez', 'social'],
      narrativeTone: 'political',
      baseSeverity: 'high',
      decisions: WASTE_DECISIONS,
    }),
    profile({
      id: 'waste_yesilvadi_park',
      category: 'waste_container',
      titleTemplates: ['Yeşilvadi’de park çevresi koku şikayeti'],
      descriptionTemplates: [
        'Park hattındaki küçük birikim hassasiyet nedeniyle hızlı fark edildi.',
      ],
      fieldNoteTemplates: ['Park gönüllüsü sabah yürüyüşünde bildirdi.'],
      allowedNeighborhoods: ['yesilvadi'],
      preferredNeighborhoodArchetypes: ['green_residential'],
      tags: ['waste', 'park', 'odor'],
      narrativeTone: 'community',
      baseSeverity: 'medium',
      decisions: WASTE_DECISIONS,
    }),
    profile({
      id: 'waste_istasyon_transit',
      category: 'waste_container',
      titleTemplates: ['İstasyon geçiş hattında atık yoğunluğu'],
      descriptionTemplates: [
        'Geçiş saatlerinde oluşan yoğunluk konteynerleri erken dolduruyor.',
      ],
      fieldNoteTemplates: ['Hat sürücüsü rota gecikmesi bildirdi.'],
      allowedNeighborhoods: ['istasyon'],
      preferredNeighborhoodArchetypes: ['transit_crossroads'],
      tags: ['waste', 'transit'],
      narrativeTone: 'urgent',
      baseSeverity: 'medium',
      decisions: WASTE_DECISIONS,
    }),
    profile({
      id: 'waste_cumhuriyet_school',
      category: 'waste_container',
      titleTemplates: ['Cumhuriyet’te okul çevresi temizlik talebi'],
      descriptionTemplates: [
        'Veli grubu okul çıkışı saatinde temiz sokak bekliyor.',
      ],
      fieldNoteTemplates: ['Okul gönüllüsü öğleden önce aradı.'],
      allowedNeighborhoods: ['cumhuriyet'],
      preferredNeighborhoodArchetypes: ['starter_residential'],
      tags: ['waste', 'school'],
      narrativeTone: 'community',
      baseSeverity: 'medium',
      decisions: WASTE_DECISIONS,
      variationRules: { excludeDay1Tutorial: true },
    }),
  ];
}

function socialProfiles(): EventContentProfile[] {
  return [
    profile({
      id: 'social_merkez_viral',
      category: 'social_pressure',
      titleTemplates: ['Merkez’de sosyal medya yankısı hızlandı'],
      descriptionTemplates: [
        'Çarşı görünürlüğü nedeniyle küçük şikayet geniş kitleye ulaştı.',
      ],
      advisorLineTemplates: ['Geciken açıklama Merkez’de hızla büyür.'],
      allowedNeighborhoods: ['merkez'],
      tags: ['social', 'media'],
      narrativeTone: 'political',
      baseSeverity: 'high',
      decisions: SOCIAL_DECISIONS,
    }),
    profile({
      id: 'social_yesilvadi_env',
      category: 'social_pressure',
      titleTemplates: ['Yeşilvadi’de çevre hassasiyeti uyarısı'],
      descriptionTemplates: [
        'Park ve yürüyüş hattında koku/gürültü şikayeti toplandı.',
      ],
      allowedNeighborhoods: ['yesilvadi'],
      tags: ['social', 'environment'],
      narrativeTone: 'community',
      baseSeverity: 'medium',
      decisions: SOCIAL_DECISIONS,
    }),
    profile({
      id: 'social_cumhuriyet_parents',
      category: 'social_pressure',
      titleTemplates: ['Cumhuriyet’te veli grubu baskısı'],
      descriptionTemplates: [
        'Mahalle grubu okul ve sokak düzeni için net süre istiyor.',
      ],
      allowedNeighborhoods: ['cumhuriyet'],
      tags: ['social', 'parents'],
      narrativeTone: 'community',
      baseSeverity: 'medium',
      decisions: SOCIAL_DECISIONS,
    }),
    profile({
      id: 'social_sanayi_trades',
      category: 'social_pressure',
      titleTemplates: ['Sanayi esnaf grubundan yoğun talep'],
      descriptionTemplates: [
        'Kooperatif hattı gecikince esnaf saatleri risk altında.',
      ],
      allowedNeighborhoods: ['sanayi'],
      tags: ['social', 'trades'],
      narrativeTone: 'urgent',
      baseSeverity: 'high',
      decisions: SOCIAL_DECISIONS,
    }),
    profile({
      id: 'social_istasyon_crowd',
      category: 'social_pressure',
      titleTemplates: ['İstasyon’da yolcu yoğunluğu tepkisi'],
      descriptionTemplates: [
        'Geçiş kalabalığı geçici kirlilik ve gürültü şikayeti doğurdu.',
      ],
      allowedNeighborhoods: ['istasyon'],
      tags: ['social', 'crowd'],
      narrativeTone: 'urgent',
      baseSeverity: 'medium',
      decisions: SOCIAL_DECISIONS,
    }),
  ];
}

function vehicleProfiles(): EventContentProfile[] {
  return [
    profile({
      id: 'vehicle_sanayi_route',
      category: 'vehicle_route',
      titleTemplates: ['Sanayi rotasında sıkışma riski'],
      descriptionTemplates: [
        'Ağır hatlar üst üste bindi; toplama gecikmesi filoyu zorluyor.',
      ],
      allowedNeighborhoods: ['sanayi'],
      tags: ['vehicle', 'route'],
      narrativeTone: 'operational',
      baseSeverity: 'high',
      decisions: VEHICLE_DECISIONS,
    }),
    profile({
      id: 'vehicle_istasyon_flow',
      category: 'vehicle_route',
      titleTemplates: ['İstasyon akışında rota darboğazı'],
      descriptionTemplates: [
        'Geçiş saatlerinde araçlar yavaşlıyor, şikayetler artıyor.',
      ],
      allowedNeighborhoods: ['istasyon'],
      tags: ['vehicle', 'flow'],
      narrativeTone: 'urgent',
      baseSeverity: 'medium',
      decisions: VEHICLE_DECISIONS,
    }),
    profile({
      id: 'vehicle_merkez_access',
      category: 'vehicle_route',
      titleTemplates: ['Merkez’de dar sokak erişim sorunu'],
      descriptionTemplates: [
        'Çarşı içi erişim gecikince görünür şikayet oluşuyor.',
      ],
      allowedNeighborhoods: ['merkez'],
      tags: ['vehicle', 'access'],
      narrativeTone: 'political',
      baseSeverity: 'medium',
      decisions: VEHICLE_DECISIONS,
    }),
    profile({
      id: 'vehicle_fleet_maintenance',
      category: 'vehicle_route',
      titleTemplates: ['Filo bakım riski yükseldi'],
      descriptionTemplates: [
        'Yoğun gün sonrası araçlar bakım eşiğine yaklaştı.',
      ],
      tags: ['vehicle', 'maintenance'],
      narrativeTone: 'warning',
      baseSeverity: 'medium',
      decisions: VEHICLE_DECISIONS,
      variationRules: { requiresSubsystem: 'vehicle' },
    }),
    profile({
      id: 'vehicle_fuel_opt',
      category: 'vehicle_route',
      titleTemplates: ['Rota optimizasyonu fırsatı'],
      descriptionTemplates: [
        'Yakıt ve süre tasarrufu için hat birleştirme önerildi.',
      ],
      tags: ['vehicle', 'fuel'],
      narrativeTone: 'opportunity',
      baseSeverity: 'low',
      decisions: VEHICLE_DECISIONS,
      preferredPriorityKeys: ['resource_protection'],
    }),
  ];
}

function personnelProfiles(): EventContentProfile[] {
  return [
    profile({
      id: 'personnel_fatigue',
      category: 'personnel_morale',
      titleTemplates: ['Saha ekibinde yorgunluk sinyali'],
      descriptionTemplates: [
        'Üst üste yoğun günler moral ve tempo düşürdü.',
      ],
      tags: ['personnel', 'fatigue'],
      narrativeTone: 'warning',
      baseSeverity: 'medium',
      decisions: PERSONNEL_DECISIONS,
      variationRules: { requiresSubsystem: 'personnel' },
    }),
    profile({
      id: 'personnel_coordination',
      category: 'personnel_morale',
      titleTemplates: ['Koordinasyon baskısı arttı'],
      descriptionTemplates: [
        'Saha sorumlusu eşzamanlı talepleri zor yönetiyor.',
      ],
      tags: ['personnel', 'coordination'],
      narrativeTone: 'operational',
      baseSeverity: 'medium',
      decisions: PERSONNEL_DECISIONS,
    }),
    profile({
      id: 'personnel_morale_drop',
      category: 'personnel_morale',
      titleTemplates: ['Gün sonu moral düşüşü'],
      descriptionTemplates: [
        'Ekip günü yüksek tempoda kapattı, dinlenme ihtiyacı belirgin.',
      ],
      tags: ['personnel', 'morale'],
      narrativeTone: 'calm',
      baseSeverity: 'medium',
      decisions: PERSONNEL_DECISIONS,
    }),
    profile({
      id: 'personnel_rest_window',
      category: 'personnel_morale',
      titleTemplates: ['Dinlendirme fırsatı'],
      descriptionTemplates: [
        'Kısa nefes arası planlanırsa ertesi gün toparlanma mümkün.',
      ],
      tags: ['personnel', 'rest'],
      narrativeTone: 'calm',
      baseSeverity: 'low',
      decisions: PERSONNEL_DECISIONS,
      preferredPriorityKeys: ['resource_protection'],
    }),
    profile({
      id: 'personnel_misassign',
      category: 'personnel_morale',
      titleTemplates: ['Yanlış ekip atama riski'],
      descriptionTemplates: [
        'Uzmanlık uyumsuz görev moral ve verimi düşürüyor.',
      ],
      tags: ['personnel', 'assignment'],
      narrativeTone: 'warning',
      baseSeverity: 'medium',
      decisions: PERSONNEL_DECISIONS,
    }),
  ];
}

function opportunityProfiles(): EventContentProfile[] {
  return [
    profile({
      id: 'opp_volunteer',
      category: 'opportunity',
      titleTemplates: ['Mahalle gönüllüsü destek teklifi'],
      descriptionTemplates: [
        'Düşük maliyetli destek hattı açılabilir.',
      ],
      tags: ['opportunity', 'volunteer'],
      narrativeTone: 'opportunity',
      baseSeverity: 'low',
      decisions: OPPORTUNITY_DECISIONS,
    }),
    profile({
      id: 'opp_trades_coord',
      category: 'opportunity',
      titleTemplates: ['Esnaf koordinasyon fırsatı'],
      descriptionTemplates: [
        'Çarşı esnafı ortak saat düzenine açık.',
      ],
      allowedNeighborhoods: ['merkez', 'sanayi'],
      tags: ['opportunity', 'trades'],
      narrativeTone: 'opportunity',
      baseSeverity: 'low',
      decisions: OPPORTUNITY_DECISIONS,
    }),
    profile({
      id: 'opp_school_info',
      category: 'opportunity',
      titleTemplates: ['Okul çevresi bilgilendirme fırsatı'],
      descriptionTemplates: [
        'Veli grubu planlı iletişime hazır.',
      ],
      allowedNeighborhoods: ['cumhuriyet'],
      tags: ['opportunity', 'school'],
      narrativeTone: 'community',
      baseSeverity: 'low',
      decisions: OPPORTUNITY_DECISIONS,
    }),
    profile({
      id: 'opp_park_campaign',
      category: 'opportunity',
      titleTemplates: ['Park temizlik gönüllü kampanyası'],
      descriptionTemplates: [
        'Yeşilvadi gönüllüleri kısa kampanya öneriyor.',
      ],
      allowedNeighborhoods: ['yesilvadi'],
      tags: ['opportunity', 'park'],
      narrativeTone: 'community',
      baseSeverity: 'low',
      decisions: OPPORTUNITY_DECISIONS,
    }),
    profile({
      id: 'opp_route_suggest',
      category: 'opportunity',
      titleTemplates: ['Rota iyileştirme önerisi'],
      descriptionTemplates: [
        'Saha ekibi daha kısa hat önerdi.',
      ],
      tags: ['opportunity', 'route'],
      narrativeTone: 'opportunity',
      baseSeverity: 'low',
      decisions: OPPORTUNITY_DECISIONS,
      preferredPriorityKeys: ['operation_stability'],
    }),
  ];
}

function permanentProfiles(): EventContentProfile[] {
  return [
    profile({
      id: 'perm_container_cap',
      category: 'permanent_solution',
      titleTemplates: ['Konteyner kapasite düzenlemesi'],
      descriptionTemplates: [
        'Kalıcı kapasite planı uzun vadeli rahatlama sağlayabilir.',
      ],
      tags: ['permanent', 'container'],
      narrativeTone: 'calm',
      baseSeverity: 'medium',
      decisions: PERMANENT_DECISIONS,
      futureHook: {
        triggerTag: 'capacity_plan',
        possibleFollowUpTitle: 'Kapasite planı takibi',
        delayDays: 2,
        severityShift: 'down',
      },
    }),
    profile({
      id: 'perm_route_plan',
      category: 'permanent_solution',
      titleTemplates: ['Kalıcı rota planı taslağı'],
      descriptionTemplates: [
        'Haftalık plan revizyonu operasyon yükünü düşürebilir.',
      ],
      tags: ['permanent', 'route'],
      narrativeTone: 'operational',
      baseSeverity: 'medium',
      decisions: PERMANENT_DECISIONS,
    }),
    profile({
      id: 'perm_info_board',
      category: 'permanent_solution',
      titleTemplates: ['Mahalle bilgilendirme panosu'],
      descriptionTemplates: [
        'Şeffaf iletişim güveni artırır.',
      ],
      tags: ['permanent', 'communication'],
      narrativeTone: 'community',
      baseSeverity: 'low',
      decisions: PERMANENT_DECISIONS,
    }),
    profile({
      id: 'perm_trades_hours',
      category: 'permanent_solution',
      titleTemplates: ['Esnaf saat düzenlemesi'],
      descriptionTemplates: [
        'Ortak saatler toplama çakışmasını azaltır.',
      ],
      allowedNeighborhoods: ['merkez', 'sanayi'],
      tags: ['permanent', 'trades'],
      narrativeTone: 'community',
      baseSeverity: 'low',
      decisions: PERMANENT_DECISIONS,
    }),
    profile({
      id: 'perm_park_care',
      category: 'permanent_solution',
      titleTemplates: ['Park bakım planı'],
      descriptionTemplates: [
        'Düzenli bakım Yeşilvadi prestijini korur.',
      ],
      allowedNeighborhoods: ['yesilvadi'],
      tags: ['permanent', 'park'],
      narrativeTone: 'calm',
      baseSeverity: 'low',
      decisions: PERMANENT_DECISIONS,
    }),
  ];
}

function extraProfiles(): EventContentProfile[] {
  return [
    profile({
      id: 'noise_merkez_night',
      category: 'noise',
      titleTemplates: ['Merkez’de gece gürültü şikayeti'],
      descriptionTemplates: ['Çarşı kapanışı sonrası gürültü şikayetleri arttı.'],
      allowedNeighborhoods: ['merkez'],
      tags: ['noise'],
      narrativeTone: 'urgent',
      baseSeverity: 'medium',
      decisions: SOCIAL_DECISIONS,
    }),
    profile({
      id: 'market_sanayi_vendor',
      category: 'market_vendor',
      titleTemplates: ['Sanayi pazar hattı düzeni'],
      descriptionTemplates: ['Tezgah yoğunluğu toplama saatini zorluyor.'],
      allowedNeighborhoods: ['sanayi'],
      tags: ['market'],
      narrativeTone: 'operational',
      baseSeverity: 'medium',
      decisions: WASTE_DECISIONS,
    }),
    profile({
      id: 'maint_yesilvadi',
      category: 'maintenance',
      titleTemplates: ['Yeşilvadi bakım hattı talebi'],
      descriptionTemplates: ['Park ekipmanı ve çevre bakımı planlanmalı.'],
      allowedNeighborhoods: ['yesilvadi'],
      tags: ['maintenance'],
      narrativeTone: 'calm',
      baseSeverity: 'low',
      decisions: PERMANENT_DECISIONS,
    }),
    profile({
      id: 'sidewalk_istasyon',
      category: 'sidewalk_occupation',
      titleTemplates: ['İstasyon kaldırım işgali'],
      descriptionTemplates: ['Geçiş yolu daraldı, akış yavaşladı.'],
      allowedNeighborhoods: ['istasyon'],
      tags: ['sidewalk'],
      narrativeTone: 'urgent',
      baseSeverity: 'medium',
      decisions: VEHICLE_DECISIONS,
    }),
    profile({
      id: 'citizen_cumhuriyet',
      category: 'citizen_complaint',
      titleTemplates: ['Cumhuriyet’te mahalle şikayeti'],
      descriptionTemplates: ['Sakin sokaklarda küçük sorun hızlı büyüyor.'],
      allowedNeighborhoods: ['cumhuriyet'],
      tags: ['citizen'],
      narrativeTone: 'community',
      baseSeverity: 'medium',
      decisions: SOCIAL_DECISIONS,
    }),
  ];
}

export const EVENT_CONTENT_PROFILES: EventContentProfile[] = [
  ...wasteProfiles(),
  ...socialProfiles(),
  ...vehicleProfiles(),
  ...personnelProfiles(),
  ...opportunityProfiles(),
  ...permanentProfiles(),
  ...extraProfiles(),
];

export const EVENT_CONTENT_PROFILE_BY_ID: Record<string, EventContentProfile> =
  Object.fromEntries(EVENT_CONTENT_PROFILES.map((p) => [p.id, p]));

export function getEventContentProfileById(
  id: string,
): EventContentProfile | undefined {
  return EVENT_CONTENT_PROFILE_BY_ID[id];
}
