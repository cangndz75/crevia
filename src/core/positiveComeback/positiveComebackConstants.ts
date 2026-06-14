import type {
  PositiveComebackKind,
  PositiveComebackSourceKind,
} from './positiveComebackTypes';
import { mergeCopyPools } from '@/core/contentVarietyQuality';
import { POSITIVE_COMEBACK_COPY_EXPANSION } from './positiveComebackCopyExpansion';

export const POSITIVE_COMEBACK_MAX_CANDIDATES = 3;
export const POSITIVE_COMEBACK_LINE_MAX = 100;
export const POSITIVE_COMEBACK_BENEFIT_LINE_MAX = 110;
export const POSITIVE_COMEBACK_TITLE_MAX = 48;
export const POSITIVE_COMEBACK_ACCESSIBILITY_MAX = 160;

export const POSITIVE_COMEBACK_ALLOWED_SOURCE_KINDS: PositiveComebackSourceKind[] = [
  'reward_comeback',
  'daily_capacity_portfolio',
  'follow_up_action',
  'one_more_day_retention',
  'portfolio_defer_risk',
  'city_memory_visibility',
  'decision_consequence',
  'carry_over',
  'butterfly_effect',
  'district_personality',
  'district_trust',
  'district_memory',
  'city_archive',
  'story_chain',
  'social_pulse',
  'container_network',
  'operational_resource',
  'authority_gameplay_expansion',
  'ece_strategy_line',
  'fallback',
];

export const POSITIVE_COMEBACK_KIND_PRIORITY_BASE: Record<PositiveComebackKind, number> = {
  trust_recovery: 78,
  resource_relief: 76,
  social_support: 72,
  district_recovery: 80,
  container_improvement: 70,
  route_relief: 68,
  follow_up_success: 74,
  memory_positive_trace: 66,
  opportunity_window: 82,
  safe_momentum: 40,
  fallback: 20,
};

export const POSITIVE_COMEBACK_KIND_TITLES: Record<PositiveComebackKind, string> = {
  trust_recovery: 'Güven toparlanması',
  resource_relief: 'Kaynak rahatlaması',
  social_support: 'Sosyal destek',
  district_recovery: 'Mahalle toparlanması',
  container_improvement: 'Konteyner hattı',
  route_relief: 'Rota rahatlaması',
  follow_up_success: 'Takip fırsatı',
  memory_positive_trace: 'Olumlu karar izi',
  opportunity_window: 'Toparlanma penceresi',
  safe_momentum: 'Sakin momentum',
  fallback: 'Denge fırsatı',
};

export const POSITIVE_COMEBACK_KIND_BADGES: Record<PositiveComebackKind, string> = {
  trust_recovery: 'Güven',
  resource_relief: 'Kaynak',
  social_support: 'Sosyal',
  district_recovery: 'Toparlanma',
  container_improvement: 'Konteyner',
  route_relief: 'Rota',
  follow_up_success: 'Takip',
  memory_positive_trace: 'Hafıza',
  opportunity_window: 'Fırsat',
  safe_momentum: 'Momentum',
  fallback: 'Denge',
};

export const POSITIVE_COMEBACK_BENEFIT_LINES: Record<PositiveComebackKind, string[]> = {
  trust_recovery: [
    'Düşük maliyetli takip güven etkisini yumuşatabilir.',
    'Bugün küçük bir güven hamlesi değerli.',
    'Sakin yaklaşım olumlu iz bırakabilir.',
  ],
  resource_relief: [
    'Düşük maliyetli dengeleme yarınki baskıyı azaltabilir.',
    'Bugün küçük takip hamlesi değerli.',
    'Kaynağı doğru yerde kullanmak olumlu geri dönüş sağlayabilir.',
  ],
  social_support: [
    'Görünür ve sakin takip sosyal desteği güçlendirebilir.',
    'Bugün küçük bir iletişim hamlesi değerli.',
    'Sosyal tepkiyi sakinleştirmek toparlanma fırsatı doğurabilir.',
  ],
  district_recovery: [
    'Bugün küçük takip hamlesi değerli.',
    'Düşük maliyetli iyileşme fırsatı.',
    'Toparlanma penceresi kısa ama değerli.',
  ],
  container_improvement: [
    'Hat takibi çevre baskısını yumuşatabilir.',
    'Bugün küçük kontrol hamlesi değerli.',
    'Tek noktayı değil, hattı takip etmek olumlu sonuç verebilir.',
  ],
  route_relief: [
    'Küçük rota düzeltmesi operasyon alanını genişletebilir.',
    'Bugün sakin rota kararı yarınki hattı rahatlatabilir.',
    'Düşük maliyetli rota kontrolü değerli.',
  ],
  follow_up_success: [
    'Düşük maliyetli takip şehir hafızasında olumlu görünür.',
    'Bugün küçük takip hamlesi değerli.',
    'Dün izlemeye bıraktığın konu bugün fırsata dönebilir.',
  ],
  memory_positive_trace: [
    'Bu iz doğru takip edilirse olumlu yönde güçlenebilir.',
    'Önceki karar bu kez iyi bir fırsata bağlanıyor.',
    'Karar hafızası bu bölgede toparlanmaya açık.',
  ],
  opportunity_window: [
    'Bu fırsat bugün daha değerli.',
    'Küçük hamleyle büyük baskı oluşmadan yön verebilirsin.',
    'Toparlanma penceresi kapanmadan takip etmek iyi olur.',
  ],
  safe_momentum: [
    'Bugün küçük bir iyiye gidiş yakalanabilir.',
    'Sakin ilerleme şehirde olumlu momentum yaratabilir.',
    'Her gün kriz değildir; bugün denge kurmak da başarı.',
  ],
  fallback: [
    'Küçük iyileşmeler uzun vadede şehir hissini güçlendirir.',
    'Sakin ilerleme şehirde olumlu momentum yaratabilir.',
  ],
};

const POSITIVE_COMEBACK_COPY_BASE: Record<PositiveComebackKind, string[]> = {
  trust_recovery: [
    'Bu bölgede güveni yeniden güçlendirmek için küçük bir pencere var.',
    'Doğru takip hamlesi güven etkisini yumuşatabilir.',
    'Hassas bölgede sakin yaklaşım olumlu iz bırakabilir.',
    'Güven sinyali toparlanmaya açık görünüyor.',
  ],
  resource_relief: [
    'Kaynak baskısı doğru öncelikle yumuşayabilir.',
    'Küçük dengeleme yarınki operasyon alanını rahatlatabilir.',
    'Bugün düşük maliyetli hamle, yarınki baskıyı azaltabilir.',
    'Kaynağı doğru yerde kullanmak olumlu geri dönüş sağlayabilir.',
  ],
  social_support: [
    'Görünür ve sakin takip sosyal desteği güçlendirebilir.',
    'Vatandaş nabzı küçük bir güven hamlesine açık.',
    'Bu bölgede iletişim tonu olumlu etki yaratabilir.',
    'Sosyal tepkiyi sakinleştirmek toparlanma fırsatı doğurabilir.',
  ],
  district_recovery: [
    'Bu mahallede toparlanma fırsatı var.',
    'Bölgeyi küçük takip hamlesiyle yeniden dengeleyebilirsin.',
    'Bu alan doğru hamleyle olumlu iz bırakabilir.',
    'Toparlanma penceresi kısa ama değerli.',
  ],
  container_improvement: [
    'Konteyner hattında küçük iyileştirme çevre baskısını yumuşatabilir.',
    'Tek noktayı değil, hattı takip etmek olumlu sonuç verebilir.',
    'Ağ kontrolü bu bölgede rahatlama yaratabilir.',
    'Konteyner sinyali toparlanmaya açık.',
  ],
  route_relief: [
    'Rota baskısı küçük kontrolle yumuşayabilir.',
    'Araç ve ekip kararını sakinleştirmek yarınki hattı rahatlatabilir.',
    'Rota hattını erken okumak olumlu etki yaratabilir.',
    'Küçük rota düzeltmesi operasyon alanını genişletebilir.',
  ],
  follow_up_success: [
    'Küçük takip hamlesi olumlu bir iz yaratabilir.',
    'Dün izlemeye bıraktığın konu bugün fırsata dönebilir.',
    'Takip aksiyonu bu bölgede güvenli bir toparlanma sağlayabilir.',
    'Düşük maliyetli takip şehir hafızasında olumlu görünür.',
  ],
  memory_positive_trace: [
    'Şehir hafızasında olumlu bir iz oluşabilir.',
    'Önceki karar bu kez iyi bir fırsata bağlanıyor.',
    'Bu iz doğru takip edilirse olumlu yönde güçlenebilir.',
    'Karar hafızası bu bölgede toparlanmaya açık.',
  ],
  opportunity_window: [
    'Bu fırsat bugün daha değerli.',
    'Küçük hamleyle büyük baskı oluşmadan yön verebilirsin.',
    'Toparlanma penceresi kapanmadan takip etmek iyi olur.',
    'Şehir bugün sadece risk değil, fırsat da gösteriyor.',
  ],
  safe_momentum: [
    'Bugün küçük bir iyiye gidiş yakalanabilir.',
    'Sakin ilerleme şehirde olumlu momentum yaratabilir.',
    'Her gün kriz değildir; bugün denge kurmak da başarı.',
    'Küçük iyileşmeler uzun vadede şehir hissini güçlendirir.',
  ],
  fallback: [
    'Bugün küçük bir iyiye gidiş yakalanabilir.',
    'Sakin ilerleme şehirde olumlu momentum yaratabilir.',
    'Her gün kriz değildir; bugün denge kurmak da başarı.',
  ],
};

export const POSITIVE_COMEBACK_COPY = mergeCopyPools(
  POSITIVE_COMEBACK_COPY_BASE,
  POSITIVE_COMEBACK_COPY_EXPANSION,
);

export const POSITIVE_COMEBACK_FAKE_RECOVERY_PATTERNS = [
  /\btoparland[ıi]\b/i,
  /\bduzeldi\b/i,
  /\bkesin\b/i,
  /\bkaybedersin\b/i,
  /\bfırsat kaçtı\b/i,
  /\bfirsat kacti\b/i,
  /\bbölge düzeldi\b/i,
  /\bbolge duzeldi\b/i,
  /\bödül\b/i,
  /\bodul\b/i,
];

export const AUTHORITY_POSITIVE_COMEBACK_PERMISSIONS = {
  resource_relief: 'resource_pressure_summary',
  trust_recovery: 'district_trust_preview',
  memory_positive_trace: 'district_memory_trace_preview',
  opportunity_window: 'advisor_specialist_notes_preview',
} as const;
