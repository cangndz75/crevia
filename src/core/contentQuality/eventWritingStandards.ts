import type { EventWritingQualityLayer, EventWritingStandardDefinition } from './contentQualityTypes';

export const EVENT_WRITING_FORBIDDEN_WORDS = [
  'premium',
  'satın al',
  'paywall',
  'kilitli',
  'rank up',
  'xp',
] as const;

export const EVENT_WRITING_LAYER_ORDER: EventWritingQualityLayer[] = [
  'district_context',
  'concrete_scene',
  'affected_actor',
  'operational_domain',
  'short_term_gain',
  'trade_off',
  'carry_over',
  'echo',
];

export const EVENT_WRITING_LAYER_WEIGHTS: Record<EventWritingQualityLayer, number> = {
  district_context: 15,
  concrete_scene: 15,
  affected_actor: 10,
  operational_domain: 10,
  short_term_gain: 10,
  trade_off: 15,
  carry_over: 15,
  echo: 10,
};

export const EVENT_WRITING_STANDARDS: EventWritingStandardDefinition[] = [
  {
    layer: 'district_context',
    title: 'Mahalle bağlamı',
    description: 'Olayın geçtiği yer net ve somut olmalı; belirsiz “şehirde” ifadeleri yetersiz.',
    passExamples: [
      "Cumhuriyet'te",
      'Sanayi hattında',
      'İstasyon çevresinde',
      'Yeşilvadi sokağında',
      'Merkez pilot bölgede',
    ],
    failExamples: ['şehirde', 'bazı bölgelerde', 'bir mahallede'],
    requiredForSoftLaunch: true,
  },
  {
    layer: 'concrete_scene',
    title: 'Somut saha problemi',
    description: 'Oyuncu sahneyi gözünde canlandırmalı; soyut “sorun var” yeterli değil.',
    passExamples: [
      'gece bırakılan iri atıklar konteyner çevresini kapattı',
      'sabah saatlerinde yolu dar buluyor',
      'rota sıkışması ekip temposunu düşürdü',
    ],
    failExamples: ['temizlik sorunu var', 'operasyon zor', 'sorun büyüdü'],
    requiredForSoftLaunch: true,
  },
  {
    layer: 'affected_actor',
    title: 'Etkilenen aktör',
    description: 'Esnaf, apartman, sürücü, ekip veya vatandaş gibi aktör belirtilmeli.',
    passExamples: ['esnaf', 'apartman görevlileri', 'sürücüler', 'saha ekibi', 'vatandaş'],
    failExamples: ['sorun var', 'durum kötü'],
    requiredForSoftLaunch: true,
  },
  {
    layer: 'operational_domain',
    title: 'Operasyon domain’i',
    description: 'Konteyner, araç, ekip, sosyal nabız veya kriz sinyali gibi domain okunmalı.',
    passExamples: [
      'konteyner baskısı',
      'araç yorgunluğu',
      'ekip temposu',
      'sosyal nabız',
      'kriz sinyali',
      'rota yükü',
    ],
    failExamples: ['sorun', 'durum', 'iş'],
    requiredForSoftLaunch: true,
  },
  {
    layer: 'short_term_gain',
    title: 'Kısa vadeli kazanç',
    description: 'Bugün ne düzelir? Net bugünkü etki dili.',
    passExamples: ['şikayet bugün düşer', 'yol sabah açılır', 'görünür baskı azalır'],
    failExamples: ['ileride düzelir', 'zamanla toparlanır'],
    requiredForSoftLaunch: true,
  },
  {
    layer: 'trade_off',
    title: 'Trade-off',
    description: 'Kararın bedeli veya alternatif maliyeti açık olmalı.',
    passExamples: [
      'ama araç yorgunluğu artar',
      'fakat sosyal etki geç toparlanır',
      'buna karşılık ekip temposu düşer',
    ],
    failExamples: ['en iyi seçenek', 'tek doğru karar'],
    requiredForSoftLaunch: true,
  },
  {
    layer: 'carry_over',
    title: 'Carry-over',
    description: 'Yarına taşan etki veya risk dili.',
    passExamples: [
      'yarın konteyner baskısı azalır',
      'ertesi gün rota riski kalır',
      'sonraki gün ekip yorgunluğu',
    ],
    failExamples: ['bugün biter', 'sadece bu gün'],
    requiredForSoftLaunch: true,
  },
  {
    layer: 'echo',
    title: 'Echo',
    description: 'Sosyal nabız, Ece veya rapor yüzeyine geri dönüş.',
    passExamples: [
      'Sosyal Nabız’da yankılanır',
      'raporda yarına risk olarak döner',
      'Ece kaynak yükünü uyarır',
    ],
    failExamples: ['sonuç görülmez', 'başka etki yok'],
    requiredForSoftLaunch: false,
  },
];

export const GOLDEN_EVENT_WRITING_EXAMPLE = {
  id: 'golden-cumhuriyet-bulk-waste',
  title: 'Cumhuriyet konteyner çevresi iri atık',
  description:
    "Cumhuriyet'te gece bırakılan iri atıklar konteyner çevresini kapattı. Esnaf sabah saatlerinde yolu dar buluyor. Hızlı ekip gönderirsen şikayet düşer ama araç yorgunluğu artar. Önleyici rota yaparsan bugün daha az görünür sonuç alırsın ama yarın konteyner baskısı azalır. Sosyal Nabız'da yankılanır; raporda yarına risk olarak döner.",
  districtId: 'cumhuriyet',
  day: 2,
  source: 'pilot' as const,
};

export const GENERIC_EVENT_WRITING_FAIL_EXAMPLE = {
  id: 'sample-generic-city',
  title: 'Şehir sorunu',
  description: 'Şehirde temizlik sorunu var.',
  source: 'unknown' as const,
};

export const MEDIUM_EVENT_WRITING_WARN_EXAMPLE = {
  id: 'sample-medium-neighborhood',
  title: 'Mahalle şikayeti',
  description:
    "Merkez'de sabah şikayetleri arttı. Ekip gönderirsen bugün rahatlarsın ancak rota yükü artabilir.",
  districtId: 'merkez',
  day: 3,
  source: 'pilot' as const,
};
