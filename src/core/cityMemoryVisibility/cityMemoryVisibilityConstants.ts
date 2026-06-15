import { mergeCopyPools } from '@/core/contentVarietyQuality';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';

import { CITY_MEMORY_VISIBILITY_COPY_EXPANSION } from './cityMemoryVisibilityCopyExpansion';
import type {
  CityMemoryVisibilityKind,
  CityMemoryVisibilitySourceKind,
} from './cityMemoryVisibilityTypes';

export const CITY_MEMORY_VISIBILITY_LINE_MAX = 110;
export const CITY_MEMORY_VISIBILITY_SHORT_MAX = 72;
export const CITY_MEMORY_VISIBILITY_ACCESSIBILITY_MAX = 160;
export const CITY_MEMORY_VISIBILITY_MAX_TRACES = 3;
export const CITY_MEMORY_VISIBILITY_PRIORITY_MAX = 100;

export const CITY_MEMORY_VISIBILITY_EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;

export const CITY_MEMORY_TECHNICAL_TOKEN_PATTERN = /\b[a-z]+_[a-z_]+\b/;

export const CITY_MEMORY_VISIBILITY_SOURCE_PRIORITY: CityMemoryVisibilitySourceKind[] = [
  'decision_consequence',
  'carry_over',
  'butterfly_effect',
  'city_archive',
  'district_memory',
  'story_chain',
  'one_more_day_retention',
  'portfolio_defer_risk',
  'map_gameplay_binding',
  'active_operation_map_binding',
  'ece_strategy_line',
  'district_personality',
  'fallback',
];

export const CITY_MEMORY_VISIBILITY_KIND_LABELS: Record<CityMemoryVisibilityKind, string> = {
  decision_trace: 'Karar izi',
  district_trace: 'Mahalle hafizasi',
  story_chain_trace: 'Hikaye zinciri',
  carry_over_trace: 'Devam eden etki',
  butterfly_trace: 'Kucuk etki',
  report_memory_note: 'Rapor notu',
  map_memory_hint: 'Harita izi',
  hub_continuation_hint: 'Devam odağı',
  ece_memory_hint: 'Ece hafiza notu',
  safe_summary: 'Sehir sinyali',
  fallback: 'Hafiza',
};

const CITY_MEMORY_VISIBILITY_COPY_PACK_BASE: Record<
  CityMemoryVisibilityKind,
  readonly string[]
> = {
  decision_trace: [
    'Bugunku karar sehirde kucuk bir iz birakabilir.',
    'Bu karar sonraki gunlerde tekrar okunabilir.',
    'Sonuc sadece kapanis ekraninda kalmayabilir.',
  ],
  district_trace: [
    'Bu mahalle onceki kararlarla yeniden anlam kazaniyor.',
    'Bolge sinyali gecmis kararlarla birlikte okunmali.',
    'Bu mahalledeki izler tek gunluk gorunmuyor.',
  ],
  story_chain_trace: [
    'Bu olay zinciri sehir hafizasinda ilerliyor.',
    'Ayni hikaye farkli bir mahallede tekrar ses verebilir.',
    'Bu zincir sonraki gunlerde yeniden acilabilir.',
  ],
  carry_over_trace: [
    'Onceki kararin etkisi bugune tasınmis olabilir.',
    'Dunku secim bugunku onceligi etkiliyor.',
    'Bu iz kisa vadeli ama takip edilmeye deger.',
  ],
  butterfly_trace: [
    'Kucuk kararlar sehirde beklenmedik izler birakabilir.',
    'Bu etki dogrudan gorunmese de sonraki sinyalleri etkileyebilir.',
    'Sehir bazen kucuk kararlari daha sonra hatirlar.',
  ],
  map_memory_hint: [
    'Haritadaki bu iz, onceki kararin sehirdeki karsiligi.',
    'Bu nokta sadece konum degil, karar hafizasi tasiyor.',
    'Bolgeyi haritada tekrar okumak iyi olur.',
  ],
  hub_continuation_hint: [
    'Devam odağı, sehir hafizasindaki en net izi takip ediyor.',
    'Bugun bu izi okumak yarinki karari kolaylastirabilir.',
    'Sehir hafizasi sana yeni oncelik veriyor.',
  ],
  report_memory_note: [
    'Rapor, sehir hafizasindaki son izi ozetliyor.',
    'Bugunun sonucu sehirde kisa bir iz birakmis olabilir.',
    'Yarin bu izi tekrar okuyacagiz.',
  ],
  ece_memory_hint: [
    'Ece, sehir hafizasindaki izi kisa bir notla hatirlatiyor.',
    'Bu iz bugunku kararlarla birlikte okunmali.',
    'Sehir hafizasi sakin ama takip edilmeye deger.',
  ],
  safe_summary: [
    'Sehir sinyalleri sakin; yeni izler raporda netlesecek.',
    'Bugun hafiza sakin, aktif odağa devam et.',
    'Yeni kararlar sehir hafizasini zamanla sekillendirir.',
  ],
  fallback: [
    'Bugunku kararin etkisini raporda goreceksin.',
    'Sehir hafizasi ilk gunlerde sakin ilerler.',
    'Kararlarin izi zamanla daha net okunur.',
  ],
};

export const CITY_MEMORY_VISIBILITY_COPY_PACK = mergeCopyPools(
  CITY_MEMORY_VISIBILITY_COPY_PACK_BASE as Record<CityMemoryVisibilityKind, string[]>,
  CITY_MEMORY_VISIBILITY_COPY_EXPANSION as Partial<Record<CityMemoryVisibilityKind, string[]>>,
);
