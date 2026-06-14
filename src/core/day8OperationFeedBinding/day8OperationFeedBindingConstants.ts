import { mergeCopyPools } from '@/core/contentVarietyQuality';

import { DAY8_OPERATION_FEED_BINDING_COPY_EXPANSION } from './day8OperationFeedBindingCopyExpansion';
import type {
  Day8OperationFeedBiasKind,
  Day8OperationFeedBindingSourceKind,
} from './day8OperationFeedBindingTypes';

export const DAY8_OPERATION_FEED_BINDING_MIN_DAY = 8;
export const DAY8_OPERATION_FEED_BINDING_MAX_BIASES = 4;
export const DAY8_OPERATION_FEED_BINDING_MAX_FEED_BINDINGS = 3;
export const DAY8_OPERATION_FEED_BINDING_SCORE_BOOST_MAX = 20;
export const DAY8_OPERATION_FEED_BINDING_TOTAL_BOOST_MAX = 25;
export const DAY8_OPERATION_FEED_BINDING_PRIORITY_MAX = 100;
export const DAY8_OPERATION_FEED_BINDING_REASON_MAX = 110;
export const DAY8_OPERATION_FEED_BINDING_BADGE_MAX = 24;
export const DAY8_OPERATION_FEED_BINDING_ACCESSIBILITY_MAX = 160;
export const DAY8_OPERATION_FEED_BINDING_SAFE_WATCH_BOOST_MAX = 2;

export const DAY8_OPERATION_FEED_BINDING_ALLOWED_SOURCE_KINDS: Day8OperationFeedBindingSourceKind[] = [
  'day8_strategic_content',
  'city_rhythm_director',
  'district_neglect_recovery',
  'positive_comeback',
  'follow_up_action',
  'city_memory_visibility',
  'portfolio_defer_risk',
  'daily_capacity_portfolio',
  'one_more_day_retention',
  'ece_strategy_line',
  'authority_gameplay_expansion',
  'event_gameplay_variety',
  'district_personality',
  'map_gameplay_binding',
  'fallback',
];

export const DAY8_OPERATION_FEED_BIAS_BADGES: Record<Day8OperationFeedBiasKind, string> = {
  district_neglect_bias: 'Mahalle',
  district_recovery_bias: 'Toparlanma',
  positive_comeback_bias: 'Toparlanma',
  follow_up_bias: 'Takip',
  memory_trace_bias: 'Hafıza',
  resource_pressure_bias: 'Kaynak',
  route_pressure_bias: 'Rota',
  container_pressure_bias: 'Kaynak',
  social_trust_bias: 'Güven',
  defer_risk_bias: 'Kaynak',
  city_rhythm_bias: 'Ritim',
  safe_watch_bias: 'Ritim',
  fallback: 'Ritim',
};

export const DAY8_OPERATION_FEED_BIAS_DOMAIN_TAGS: Record<Day8OperationFeedBiasKind, string[]> = {
  district_neglect_bias: ['district_trust', 'social', 'district'],
  district_recovery_bias: ['resource_recovery', 'district', 'comeback'],
  positive_comeback_bias: ['comeback', 'resource_recovery', 'opportunity'],
  follow_up_bias: ['follow_up', 'carry_over'],
  memory_trace_bias: ['memory', 'carry_over', 'story'],
  resource_pressure_bias: ['resource', 'operational_resource', 'resource_pressure'],
  route_pressure_bias: ['route', 'transport', 'vehicles'],
  container_pressure_bias: ['container', 'logistics', 'container_network'],
  social_trust_bias: ['social', 'district_trust', 'trust'],
  defer_risk_bias: ['tomorrow_risk', 'defer', 'resource'],
  city_rhythm_bias: ['general', 'strategic'],
  safe_watch_bias: ['general'],
  fallback: [],
};

const DAY8_OPERATION_FEED_BIAS_COPY_BASE: Record<Day8OperationFeedBiasKind, string[]> = {
  district_neglect_bias: [
    'Bugünkü ritim bu mahalleyi öne çıkarıyor.',
    'Ertelenen mahalle sinyali bu seçimde etkili.',
    'Mahalle ihmal uyarısı operasyon listesini şekillendiriyor.',
  ],
  district_recovery_bias: [
    'Toparlanma fırsatı bu operasyonu daha değerli yapıyor.',
    'İyileşme penceresi bu seçimi öne taşıyor.',
    'Mahalle toparlanması bugün bu operasyonda okunuyor.',
  ],
  positive_comeback_bias: [
    'Olumlu dönüş penceresi bu operasyonu güçlendiriyor.',
    'Küçük kazanım fırsatı bu seçimde öne çıkıyor.',
    'Toparlanma ivmesi bu operasyonu daha anlamlı kılıyor.',
  ],
  follow_up_bias: [
    'Bu operasyon küçük takip etkisi taşıyor.',
    'Dünkü kararın takibi bu seçimi öne çıkarıyor.',
    'Takip hamlesi bu operasyonla uyumlu görünüyor.',
  ],
  memory_trace_bias: [
    'Şehir hafızası bu bölgeyi yeniden görünür yaptı.',
    'Hafıza izi bu operasyonu bugün daha anlamlı kılıyor.',
    'Geçmiş karar yankısı bu seçimi öne taşıyor.',
  ],
  resource_pressure_bias: [
    'Kaynak baskısı bu operasyon seçiminde etkili.',
    'Kapasiteyi doğru yere koymak için bu seçim öne çıkıyor.',
    'Kaynak dengesi bugün bu operasyonu öne taşıyor.',
  ],
  route_pressure_bias: [
    'Ertelenen rota baskısı bu seçimde etkili.',
    'Rota yükü bu operasyonu bugün daha değerli yapıyor.',
    'Ulaşım baskısı bu seçimi öne çıkarıyor.',
  ],
  container_pressure_bias: [
    'Konteyner hattı baskısı bu seçimde etkili.',
    'Hat izleme ihtiyacı bu operasyonu öne taşıyor.',
    'Lojistik baskısı bugün bu seçimi güçlendiriyor.',
  ],
  social_trust_bias: [
    'Güven hassasiyeti bu operasyonu bugün öne çıkarıyor.',
    'Sosyal nabız bu seçimi daha anlamlı kılıyor.',
    'Görünür takip ihtiyacı bu operasyonu öne taşıyor.',
  ],
  defer_risk_bias: [
    'Ertelenen risk bu seçimde etkili.',
    'Yarın büyüyebilecek baskı bu operasyonu öne taşıyor.',
    'Erteleme maliyeti bu seçimi güçlendiriyor.',
  ],
  city_rhythm_bias: [
    'Bugünkü şehir ritmi bu operasyonu öne çıkarıyor.',
    'Günün dengesi bu seçimi daha anlamlı kılıyor.',
    'Şehir ritmi operasyon listesini yönlendiriyor.',
  ],
  safe_watch_bias: [
    'Sakin izleme gününde bu operasyon yeterli görünüyor.',
    'Bugün aşırı zorlamadan bu seçim uyumlu.',
    'Düşük baskılı günde bu operasyon dengeli bir seçim.',
  ],
  fallback: ['Operasyon listesi mevcut sinyallere göre sıralanıyor.'],
};

export const DAY8_OPERATION_FEED_BIAS_COPY = mergeCopyPools(
  DAY8_OPERATION_FEED_BIAS_COPY_BASE,
  DAY8_OPERATION_FEED_BINDING_COPY_EXPANSION,
);

export const DAY8_OPERATION_FEED_FAKE_CLAIM_PATTERNS = [
  /kesin\s+(kayboldu|toparland|çöktü)/i,
  /mutlaka\s+(kaybet|kazan)/i,
  /tamamen\s+(ihmal|çöktü)/i,
];

export const DAY8_OPERATION_FEED_FORCED_SELECTION_PATTERNS = [
  /\bseçildi\b/i,
  /\bsecildi\b/i,
  /\bselected\b/i,
  /\bforced\b/i,
  /\bzorla\s+seç/i,
];

export const DAY8_OPERATION_FEED_PRESENTATION_ONLY_COPY: Record<Day8OperationFeedBiasKind, string[]> = {
  district_neglect_bias: [
    'Bu operasyon bugün mahalle odağı için stratejik öneri olarak öne çıkıyor.',
    'Mahalle sinyali bu operasyonu bugün izlemeye değer kılıyor.',
  ],
  district_recovery_bias: [
    'Toparlanma fırsatı bu operasyonu bugün stratejik öneri yapıyor.',
    'İyileşme penceresi bu operasyonu odak adayı gösteriyor.',
  ],
  positive_comeback_bias: [
    'Olumlu dönüş penceresi bu operasyonu bugün önerilen odak yapıyor.',
    'Küçük kazanım fırsatı bu operasyonu stratejik öneri olarak işaretliyor.',
  ],
  follow_up_bias: [
    'Bu operasyon küçük takip etkisi taşıyan bir öneri olarak görünüyor.',
    'Takip hamlesi bu operasyonla uyumlu bir odak adayı.',
  ],
  memory_trace_bias: [
    'Şehir hafızası bu operasyonu bugün yeniden görünür bir öneri yapıyor.',
    'Hafıza izi bu operasyonu stratejik odak adayı gösteriyor.',
  ],
  resource_pressure_bias: [
    'Kaynak baskısı bu operasyonu bugün önerilen odak yapıyor.',
    'Kapasite dengesi bu operasyonu stratejik öneri olarak işaretliyor.',
  ],
  route_pressure_bias: [
    'Rota baskısı bu operasyonu bugün önerilen odak yapıyor.',
    'Ulaşım sinyali bu operasyonu stratejik öneri olarak gösteriyor.',
  ],
  container_pressure_bias: [
    'Konteyner hattı bu operasyonu bugün önerilen odak yapıyor.',
    'Lojistik sinyali bu operasyonu stratejik öneri olarak işaretliyor.',
  ],
  social_trust_bias: [
    'Güven hassasiyeti bu operasyonu bugün önerilen odak yapıyor.',
    'Sosyal nabız bu operasyonu stratejik öneri olarak gösteriyor.',
  ],
  defer_risk_bias: [
    'Ertelenen risk bu operasyonu bugün önerilen odak yapıyor.',
    'Erteleme maliyeti bu operasyonu stratejik öneri olarak işaretliyor.',
  ],
  city_rhythm_bias: [
    'Bugünkü şehir ritmi bu operasyonu önerilen odak yapıyor.',
    'Günün dengesi bu operasyonu stratejik öneri olarak gösteriyor.',
  ],
  safe_watch_bias: [
    'Sakin günde bu operasyon dengeli bir öneri olarak görünüyor.',
    'Düşük baskılı günde bu operasyon izleme odak adayı.',
  ],
  fallback: ['Operasyon listesi mevcut sinyallere göre sıralanıyor.'],
};

export const DAY8_STRATEGIC_CONTENT_TO_BIAS: Record<string, Day8OperationFeedBiasKind> = {
  district_neglect_focus: 'district_neglect_bias',
  district_recovery_focus: 'district_recovery_bias',
  positive_comeback_focus: 'positive_comeback_bias',
  follow_up_focus: 'follow_up_bias',
  memory_trace_focus: 'memory_trace_bias',
  resource_pressure_focus: 'resource_pressure_bias',
  route_pressure_focus: 'route_pressure_bias',
  container_pressure_focus: 'container_pressure_bias',
  social_trust_focus: 'social_trust_bias',
  defer_risk_focus: 'defer_risk_bias',
  safe_watch_focus: 'safe_watch_bias',
};

export const CITY_RHYTHM_TO_BIAS: Record<string, Day8OperationFeedBiasKind | Day8OperationFeedBiasKind[]> = {
  neglect_attention_day: 'district_neglect_bias',
  recovery_window_day: ['district_recovery_bias', 'positive_comeback_bias'],
  resource_strain_day: ['resource_pressure_bias', 'route_pressure_bias'],
  social_trust_day: 'social_trust_bias',
  memory_echo_day: 'memory_trace_bias',
  follow_up_day: 'follow_up_bias',
  calm_watch_day: 'safe_watch_bias',
  mixed_city_day: 'city_rhythm_bias',
};

export const DISTRICT_NEGLECT_TO_BIAS: Record<string, Day8OperationFeedBiasKind> = {
  neglect_warning: 'district_neglect_bias',
  neglect_watch: 'district_neglect_bias',
  trust_fragility: 'social_trust_bias',
  social_cooling: 'social_trust_bias',
  route_backlog: 'route_pressure_bias',
  container_backlog: 'container_pressure_bias',
  recovery_window: 'district_recovery_bias',
  recovery_progress: 'district_recovery_bias',
};

export const POSITIVE_COMEBACK_TO_BIAS: Record<string, Day8OperationFeedBiasKind | Day8OperationFeedBiasKind[]> = {
  district_recovery: 'district_recovery_bias',
  trust_recovery: 'social_trust_bias',
  opportunity_window: 'positive_comeback_bias',
  resource_relief: 'resource_pressure_bias',
  route_relief: 'route_pressure_bias',
  container_improvement: 'container_pressure_bias',
  memory_positive_trace: 'memory_trace_bias',
};

export const FOLLOW_UP_TO_BIAS: Record<string, Day8OperationFeedBiasKind> = {
  support_recovery: 'district_recovery_bias',
  reinforce_trust: 'social_trust_bias',
  review_route: 'route_pressure_bias',
  check_container_line: 'container_pressure_bias',
  rebalance_resource: 'resource_pressure_bias',
  capture_memory_trace: 'memory_trace_bias',
  prepare_tomorrow: 'follow_up_bias',
};

export const PORTFOLIO_DEFER_TO_BIAS: Record<string, Day8OperationFeedBiasKind> = {
  trust_may_drop: 'social_trust_bias',
  social_reaction_may_grow: 'social_trust_bias',
  route_may_strain: 'route_pressure_bias',
  resource_cost_may_rise: 'resource_pressure_bias',
  opportunity_may_expire: 'positive_comeback_bias',
  memory_trace_may_harden: 'memory_trace_bias',
};

export const DAILY_CAPACITY_TO_BIAS: Record<string, Day8OperationFeedBiasKind> = {
  district_pressure: 'district_neglect_bias',
  recovery_opportunity: 'district_recovery_bias',
  positive_opportunity: 'positive_comeback_bias',
  follow_up_candidate: 'follow_up_bias',
  resource_pressure: 'resource_pressure_bias',
  route_pressure: 'route_pressure_bias',
  container_pressure: 'container_pressure_bias',
  social_pressure: 'social_trust_bias',
};

export const AUTHORITY_PERMISSION_BY_BIAS: Partial<Record<Day8OperationFeedBiasKind, string>> = {
  resource_pressure_bias: 'portfolio_cost_explanation',
  defer_risk_bias: 'tomorrow_priority_reason',
  district_neglect_bias: 'district_context_detail',
  district_recovery_bias: 'district_context_detail',
  route_pressure_bias: 'map_layer_detail',
  container_pressure_bias: 'map_layer_detail',
  memory_trace_bias: 'district_context_detail',
  city_rhythm_bias: 'ece_analysis_depth',
};
