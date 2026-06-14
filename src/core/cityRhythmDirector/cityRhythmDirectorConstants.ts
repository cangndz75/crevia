import { mergeCopyPools } from '@/core/contentVarietyQuality';

import { CITY_RHYTHM_COPY_EXPANSION } from './cityRhythmDirectorCopyExpansion';
import type {
  CityRhythmIntensity,
  CityRhythmKind,
  CityRhythmSlotKind,
  CityRhythmSourceKind,
} from './cityRhythmDirectorTypes';

export const CITY_RHYTHM_DIRECTOR_MAX_INTERNAL_SLOTS = 4;
export const CITY_RHYTHM_DIRECTOR_MAX_PRESENTATION_SLOTS = 3;
export const CITY_RHYTHM_DIRECTOR_LINE_MAX = 110;
export const CITY_RHYTHM_DIRECTOR_TITLE_MAX = 48;
export const CITY_RHYTHM_DIRECTOR_ACCESSIBILITY_MAX = 160;

export const CITY_RHYTHM_DIRECTOR_ALLOWED_SOURCE_KINDS: CityRhythmSourceKind[] = [
  'day8_strategic_content',
  'district_neglect_recovery',
  'positive_comeback',
  'follow_up_action',
  'city_memory_visibility',
  'one_more_day_retention',
  'portfolio_defer_risk',
  'daily_capacity_portfolio',
  'ece_strategy_line',
  'authority_gameplay_expansion',
  'event_gameplay_variety',
  'decision_consequence',
  'carry_over',
  'butterfly_effect',
  'district_personality',
  'fallback',
];

export const CITY_RHYTHM_KIND_TITLES: Record<CityRhythmKind, string> = {
  calm_watch_day: 'Sakin izleme günü',
  strategic_pressure_day: 'Stratejik baskı günü',
  recovery_window_day: 'Toparlanma penceresi',
  neglect_attention_day: 'Mahalle dikkat günü',
  resource_strain_day: 'Kaynak baskısı günü',
  social_trust_day: 'Güven ve sosyal nabız',
  memory_echo_day: 'Hafıza yankısı günü',
  follow_up_day: 'Takip günü',
  mixed_city_day: 'Karışık şehir günü',
  fallback: 'Gün ritmi',
};

export const CITY_RHYTHM_KIND_BADGES: Record<CityRhythmKind, string> = {
  calm_watch_day: 'Sakin',
  strategic_pressure_day: 'Baskı',
  recovery_window_day: 'Fırsat',
  neglect_attention_day: 'Mahalle',
  resource_strain_day: 'Kaynak',
  social_trust_day: 'Güven',
  memory_echo_day: 'Hafıza',
  follow_up_day: 'Takip',
  mixed_city_day: 'Dengeli',
  fallback: 'Ritim',
};

export const CITY_RHYTHM_INTENSITY_LABELS: Record<CityRhythmIntensity, string> = {
  low: 'Düşük yoğunluk',
  medium: 'Orta yoğunluk',
  high: 'Yüksek yoğunluk',
};

export const CITY_RHYTHM_SLOT_TITLES: Record<CityRhythmSlotKind, string> = {
  primary_focus: 'Günün odağı',
  secondary_focus: 'İkinci sinyal',
  recovery_balance: 'Toparlanma dengesi',
  memory_echo: 'Hafıza yankısı',
  follow_up_hint: 'Takip notu',
  safe_watch: 'Güvenli izleme',
};

export const CITY_RHYTHM_RISK_KINDS: CityRhythmKind[] = [
  'strategic_pressure_day',
  'neglect_attention_day',
  'resource_strain_day',
];

export const CITY_RHYTHM_POSITIVE_KINDS: CityRhythmKind[] = [
  'recovery_window_day',
  'follow_up_day',
  'calm_watch_day',
];

export const CITY_RHYTHM_FAKE_CLAIM_PATTERNS = [
  /kesin\s+(kayboldu|toparland|çöktü)/i,
  /mutlaka\s+(kaybet|kazan)/i,
  /tamamen\s+(ihmal|çöktü)/i,
];

const CITY_RHYTHM_COPY_BASE: Record<CityRhythmKind, string[]> = {
  calm_watch_day: [
    'Bugün şehir daha sakin; en net sinyali izlemek yeterli olabilir.',
    'Her sinyal operasyon istemiyor; bugün doğru izleme de strateji.',
    'Bugün ritim düşük, kapasiteyi koruyarak ilerlemek mantıklı.',
  ],
  strategic_pressure_day: [
    'Bugün şehir birkaç baskıyı aynı anda gösteriyor.',
    'Öncelik seçimi bugün operasyon kadar önemli.',
    'Bugünün ritmi, hangi sinyali erteleyeceğini de belirleyecek.',
  ],
  recovery_window_day: [
    'Bugün toparlanma fırsatlarını kaçırmamak değerli.',
    'Şehir sadece risk değil, iyiye dönüş penceresi de gösteriyor.',
    'Küçük takip hamlesi bugün olumlu iz bırakabilir.',
  ],
  neglect_attention_day: [
    'Bir mahalle bugün daha dikkatli okunmak istiyor.',
    'Ertelenen bölge sinyali bugünün ritmini etkiliyor.',
    'Mahalle takibi bugün stratejik öncelik haline geliyor.',
  ],
  resource_strain_day: [
    'Kaynak ve rota yükü bugünün kararını belirginleştiriyor.',
    'Bugün kapasiteyi doğru yere koymak kritik.',
    'Araç, ekip ve kaynak sinyali birlikte okunmalı.',
  ],
  social_trust_day: [
    'Sosyal güven hassasiyeti bugünün ritmini belirliyor.',
    'Bugün görünür takip güven etkisini yumuşatabilir.',
    'Vatandaş nabzı operasyon kararına eşlik ediyor.',
  ],
  memory_echo_day: [
    'Şehir hafızası bugün eski izleri yeniden öne çıkarıyor.',
    'Bugünkü karar, önceki izlerle birlikte okunmalı.',
    'Hafıza izi bugünün önceliğini şekillendiriyor.',
  ],
  follow_up_day: [
    'Bugün küçük takip hamleleri ana karar kadar değerli.',
    'Her ilerleme büyük operasyon istemez; doğru takip yeterli olabilir.',
    'Takip aksiyonu bugünün ritmini sakinleştirebilir.',
  ],
  mixed_city_day: [
    'Bugün şehir tek sinyal değil, karışık bir gündem gösteriyor.',
    'Risk, hafıza ve fırsatı birlikte okumak gerekiyor.',
    'Bugünün ritmi dengeli ama dikkat istiyor.',
  ],
  fallback: [
    'Bugün için yeterli ritim kaynağı yok; güvenli izleme öneriliyor.',
    'Şehir yeni fazda; ilk sinyali sakin okumak yeterli.',
    'Bugünün ritmi düşük veriyle güvenli şekilde kuruluyor.',
  ],
};

export const CITY_RHYTHM_COPY = mergeCopyPools(
  CITY_RHYTHM_COPY_BASE,
  CITY_RHYTHM_COPY_EXPANSION,
);
