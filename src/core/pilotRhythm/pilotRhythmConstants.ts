import type { PilotThemeDefinition } from './pilotRhythmTypes';

export const PILOT_THEME_FORBIDDEN_WORDS = [
  'kilitli',
  'premium',
  'satın al',
  'paywall',
  'rank up',
  'xp',
] as const;

export const PILOT_THEME_DEFINITIONS: PilotThemeDefinition[] = [
  {
    day: 1,
    id: 'pilot-theme-day-1-first-response',
    title: 'İlk Saha Müdahalesi',
    shortTitle: 'İlk Saha',
    domain: 'first_response',
    tone: 'learning',
    hubHeadline: 'Bugün temel saha akışı öğreniliyor',
    hubSummary:
      'Merkez’de küçük bir operasyon sinyali var. İncele, planla ve sahada sonucu gör.',
    eventGuidance: 'Önce akışı tamamla; hız ikinci planda.',
    planGuidance: 'Tek odak: karar zincirini net görmek.',
    dispatchGuidance: 'Kısa yönlendirme yeterli.',
    fieldGuidance: 'Sahada sonucu gör ve merkeze dön.',
    reportHeadline: 'İlk saha müdahalesi tamamlandı',
    reportSummary:
      'Bugün temel karar akışı öğretildi; metrikler sade tutuldu.',
    advisorHint: 'Bugün amaç hızlı kazanmak değil, karar akışını net görmek.',
    unlockedSignals: ['basic_operation', 'field_response', 'daily_plan'],
    hiddenSignals: [
      'social_pulse',
      'crisis_desk',
      'container_cluster',
      'district_balance',
      'main_operation_preview',
    ],
    emphasisTags: ['Akış'],
    maxVisibleThemeLines: 2,
  },
  {
    day: 2,
    id: 'pilot-theme-day-2-container-pressure',
    title: 'Konteyner Baskısı',
    shortTitle: 'Konteyner',
    domain: 'container_pressure',
    tone: 'operational',
    hubHeadline: 'Konteyner çevresinde ilk görünür baskı',
    hubSummary:
      'Mahalledeki temizlik noktaları kararlarının kısa ve yarına taşan etkisini gösterecek.',
    eventGuidance: 'Konteyner hattında görünür şikayet öncelikli.',
    planGuidance: 'Önleyici rota yarını rahatlatır.',
    dispatchGuidance: 'Konteyner noktasına hızlı müdahale planla.',
    fieldGuidance: 'Saha sonucu mahalle algısına yansır.',
    reportHeadline: 'Konteyner baskısı günü',
    reportSummary:
      'Konteyner kararları bugünkü görünür şikayeti ve yarınki baskıyı birlikte etkiledi.',
    advisorHint:
      'Konteyner olaylarında hızlı çözüm bugünü rahatlatır; önleyici rota yarını etkiler.',
    unlockedSignals: ['container', 'neighborhood_pressure'],
    hiddenSignals: ['crisis_desk', 'main_operation_unlock'],
    emphasisTags: ['Konteyner', 'Mahalle'],
    maxVisibleThemeLines: 2,
  },
  {
    day: 3,
    id: 'pilot-theme-day-3-resource-fatigue',
    title: 'Kaynak Dayanıklılığı',
    shortTitle: 'Kaynak',
    domain: 'resource_fatigue',
    tone: 'caution',
    hubHeadline: 'Araç ve ekip yükü görünür hale geliyor',
    hubSummary:
      'Aynı kaynağı tekrar kullanmak bugünü hızlandırabilir ama yarına yorgunluk bırakabilir.',
    eventGuidance: 'Araç ve ekip yükünü kararda hisset.',
    planGuidance: 'Kaynak temposunu yarına taşımayı düşün.',
    dispatchGuidance: 'Rota yükü ekip temposunu etkiler.',
    fieldGuidance: 'Saha sonucu kaynak bandını günceller.',
    reportHeadline: 'Kaynak dayanıklılığı günü',
    reportSummary:
      'Bugün araç ve ekip yükü kararların yarına nasıl taşındığını gösterdi.',
    advisorHint:
      'Bugün kararın sadece mahalleyi değil, ekip ve araç temposunu da etkiler.',
    unlockedSignals: ['vehicle', 'personnel', 'resource_band'],
    hiddenSignals: ['social_spike', 'crisis_active'],
    emphasisTags: ['Araç', 'Ekip'],
    maxVisibleThemeLines: 2,
  },
  {
    day: 4,
    id: 'pilot-theme-day-4-social-pulse',
    title: 'Sosyal Nabız',
    shortTitle: 'Sosyal Nabız',
    domain: 'social_pulse',
    tone: 'social',
    hubHeadline: 'Halk algısı operasyona dahil oluyor',
    hubSummary:
      'Sorun küçük olsa bile görünürlüğü yüksekse sosyal tepki büyüyebilir.',
    eventGuidance: 'Görünürlük yüksek olaylara dikkat.',
    planGuidance: 'Sosyal Nabız etkisini plana yansıt.',
    dispatchGuidance: 'Şikayet ve takdir sinyallerini oku.',
    fieldGuidance: 'Saha çözümü algıyı yumuşatır veya sertleştirir.',
    reportHeadline: 'Sosyal nabız günü',
    reportSummary:
      'Halk algısı bugünkü kararların görünürlüğünü ve yarınki nabzı şekillendirdi.',
    advisorHint: 'Bugün saha çözümü kadar vatandaşın bunu nasıl gördüğü de önemli.',
    unlockedSignals: ['social_pulse', 'complaint_visibility'],
    hiddenSignals: ['crisis_desk_active'],
    emphasisTags: ['Sosyal', 'Görünürlük'],
    maxVisibleThemeLines: 2,
  },
  {
    day: 5,
    id: 'pilot-theme-day-5-district-balance',
    title: 'Mahalle Dengesi',
    shortTitle: 'Mahalle Dengesi',
    domain: 'district_balance',
    tone: 'strategic',
    hubHeadline: 'Öncelik verdiğin mahalle diğerlerini etkiler',
    hubSummary:
      'Bir bölgede hızlı sonuç almak başka bir bölgede bekleme hissi yaratabilir.',
    eventGuidance: 'Mahalle kıyası ve öncelik çatışmasını oku.',
    planGuidance: 'Tek mahalleye aşırı yük verme.',
    dispatchGuidance: 'Bölgesel adalet dengesini koru.',
    fieldGuidance: 'Saha sonucu komşu mahalle algısına taşar.',
    reportHeadline: 'Mahalle dengesi günü',
    reportSummary:
      'Öncelik verilen mahalle ile bekleyen bölgeler arasındaki denge bugün görünür oldu.',
    advisorHint:
      'Bugün iyi karar sadece bir mahalleyi değil, şehir dengesini de düşünür.',
    unlockedSignals: ['district_balance', 'neighborhood_compare'],
    hiddenSignals: [],
    emphasisTags: ['Mahalle', 'Denge'],
    maxVisibleThemeLines: 2,
  },
  {
    day: 6,
    id: 'pilot-theme-day-6-crisis-signal',
    title: 'Kriz Öncesi Sinyal',
    shortTitle: 'Kriz Sinyali',
    domain: 'crisis_signal',
    tone: 'caution',
    hubHeadline: 'Bazı riskler krize dönüşmeden okunabilir',
    hubSummary:
      'Sosyal tepki, kaynak yükü ve mahalle baskısı aynı anda yükselirse önlem gerekir.',
    eventGuidance: 'Risk birleşimini erken oku; panik dili kullanma.',
    planGuidance: 'Önleyici müdahale bugün riski kesebilir.',
    dispatchGuidance: 'Kriz eşiğine yaklaşan sinyalleri izle.',
    fieldGuidance: 'Saha sonucu risk bandını düşürür veya yükseltir.',
    reportHeadline: 'Kriz öncesi sinyal günü',
    reportSummary:
      'Birleşen risk sinyalleri bugün önleyici kararlarla yönetildi; operasyon hâlâ kontrol bandında.',
    advisorHint:
      'Henüz kriz değil; ama doğru plan bugün riski büyümeden kesebilir.',
    unlockedSignals: ['crisis_signal', 'risk_blend'],
    hiddenSignals: [],
    emphasisTags: ['Risk', 'Önlem'],
    maxVisibleThemeLines: 2,
  },
  {
    day: 7,
    id: 'pilot-theme-day-7-pilot-final',
    title: 'Pilot Finali',
    shortTitle: 'Pilot Finali',
    domain: 'pilot_final',
    tone: 'transition',
    hubHeadline: 'Pilot tamamlanıyor, ana operasyon ufukta',
    hubSummary:
      'Bugünkü kararlar pilot tarzını ve ana operasyon hazırlığını görünür kılacak.',
    eventGuidance: 'Son pilot kararları tarzını yansıtır.',
    planGuidance: 'Ana operasyon kapsamı yaklaşır; satış dili yok.',
    dispatchGuidance: 'Değerlendirme ve geçiş tonu.',
    fieldGuidance: 'Saha sonucu pilot özeti besler.',
    reportHeadline: 'Pilot finali',
    reportSummary:
      'Yedi günlük yönetim tarzı netleşti; ana operasyon önizlemesi gündeme gelir.',
    advisorHint:
      'Bugün sadece sonucu değil, 7 günlük yönetim tarzını da değerlendireceğiz.',
    unlockedSignals: ['pilot_recap', 'main_operation_preview', 'authority_style'],
    hiddenSignals: [],
    emphasisTags: ['Pilot', 'Ana Operasyon'],
    maxVisibleThemeLines: 2,
  },
];

export function getPilotThemeDefinitionByDay(day: number): PilotThemeDefinition | undefined {
  return PILOT_THEME_DEFINITIONS.find((d) => d.day === day);
}
