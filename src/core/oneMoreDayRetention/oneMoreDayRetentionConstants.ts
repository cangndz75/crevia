import type {
  OneMoreDayRetentionHookKind,
  OneMoreDayRetentionSourceKind,
} from './oneMoreDayRetentionTypes';

export const ONE_MORE_DAY_MAX_HOOKS = 2;
export const ONE_MORE_DAY_LINE_MAX = 120;
export const ONE_MORE_DAY_TITLE_MAX = 48;
export const ONE_MORE_DAY_ACCESSIBILITY_MAX = 180;

export const ONE_MORE_DAY_ALLOWED_SOURCE_KINDS: OneMoreDayRetentionSourceKind[] = [
  'portfolio_defer_risk',
  'daily_capacity_portfolio',
  'decision_consequence',
  'tomorrow_risk',
  'carry_over',
  'butterfly_effect',
  'district_personality',
  'district_memory',
  'city_archive',
  'story_chain',
  'map_gameplay_binding',
  'report_summary',
  'fallback',
];

export const ONE_MORE_DAY_COPY: Record<OneMoreDayRetentionHookKind, string[]> = {
  deferred_signal: [
    'Sectigin sinyal kaybolmadi; yarin yeniden okunabilir.',
    'Bugunku erteleme, yarinki onceligi sekillendirebilir.',
  ],
  tomorrow_priority: [
    'Yarin ilk kontrol bu bolgeden baslayabilir.',
    'Bir sonraki gun icin en net oncelik burada gorunuyor.',
  ],
  recovery_opportunity: [
    'Toparlanma firsati yarin hala degerli olabilir.',
    'Kucuk bir takip hamlesi olumlu izi guclendirebilir.',
  ],
  memory_trace: [
    'Bugunku karar sehir hafizasinda iz birakabilir.',
    'Kararin etkisini bir sonraki gunde okumak mumkun.',
  ],
  district_follow_up: [
    'Bu mahalleyi yarin yeniden kontrol etmek iyi olur.',
    'Mahalle sinyali yarin daha net okunabilir.',
  ],
  resource_pressure: [
    'Kaynak dengesini yarin erken okumak avantaj saglar.',
    'Yarin ilk planda kaynak baskisini tekrar kontrol et.',
  ],
  route_pressure: [
    'Rota baskisini yarin ilk kontrolde izlemek iyi olur.',
    'Yarin rota dengesini erken okumak avantaj saglar.',
  ],
  social_watch: [
    'Yarin bu bolgede guven etkisini izlemek iyi olur.',
    'Sosyal sinyali yarin sakin bir kontrolle oku.',
  ],
  safe_continue: [
    'Sehir sakin; yarin yeni odagi secebilirsin.',
    'Bugun iyi kapandi. Yarin yeni sinyalleri okuyacaksin.',
  ],
  achievement_momentum: [
    'Bugunku karar yarin daha net bir planla devam edebilir.',
    'Gunu kapattin; yarin odagi daha net secebilirsin.',
  ],
  fallback: [
    'Bir sonraki gun daha net bir planla baslayabilirsin.',
    'Yarin sehir sinyallerini biraz daha net okuyacaksin.',
  ],
};
