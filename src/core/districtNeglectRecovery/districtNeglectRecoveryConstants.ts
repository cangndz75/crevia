import type {
  DistrictNeglectBand,
  DistrictNeglectRecoveryDayPolicy,
  DistrictNeglectRecoveryKind,
  DistrictNeglectRecoverySourceKind,
  DistrictRecoveryBand,
} from './districtNeglectRecoveryTypes';

export const DISTRICT_NEGLECT_RECOVERY_MAX_INTERNAL_SIGNALS = 4;
export const DISTRICT_NEGLECT_RECOVERY_MAX_PRESENTATION_SIGNALS = 3;
export const DISTRICT_NEGLECT_RECOVERY_LINE_MAX = 110;
export const DISTRICT_NEGLECT_RECOVERY_SHORT_MAX = 72;
export const DISTRICT_NEGLECT_RECOVERY_TITLE_MAX = 48;
export const DISTRICT_NEGLECT_RECOVERY_ACCESSIBILITY_MAX = 160;

export const DISTRICT_NEGLECT_RECOVERY_ALLOWED_SOURCE_KINDS: DistrictNeglectRecoverySourceKind[] =
  [
    'district_personality',
    'district_trust',
    'district_memory',
    'city_archive',
    'story_chain',
    'decision_consequence',
    'carry_over',
    'butterfly_effect',
    'daily_capacity_portfolio',
    'portfolio_defer_risk',
    'one_more_day_retention',
    'follow_up_action',
    'positive_comeback',
    'city_memory_visibility',
    'ece_strategy_line',
    'social_pulse',
    'map_gameplay_binding',
    'active_operation_map_binding',
    'authority_gameplay_expansion',
    'fallback',
  ];

export const DISTRICT_NEGLECT_RECOVERY_KIND_TITLES: Record<DistrictNeglectRecoveryKind, string> = {
  neglect_watch: 'Mahalle takibi',
  neglect_warning: 'Bölge önceliği',
  trust_fragility: 'Güven hassasiyeti',
  social_cooling: 'Sosyal nabız',
  route_backlog: 'Rota baskısı',
  container_backlog: 'Konteyner hattı',
  recovery_window: 'Toparlanma fırsatı',
  recovery_progress: 'Olumlu iz',
  positive_momentum: 'Olumlu momentum',
  safe_watch: 'Sakin izleme',
  fallback: 'Bölge sinyali',
};

export const DISTRICT_NEGLECT_RECOVERY_KIND_BADGES: Record<DistrictNeglectRecoveryKind, string> = {
  neglect_watch: 'Takip',
  neglect_warning: 'Öncelik',
  trust_fragility: 'Güven',
  social_cooling: 'Sosyal',
  route_backlog: 'Rota',
  container_backlog: 'Konteyner',
  recovery_window: 'Fırsat',
  recovery_progress: 'İz',
  positive_momentum: 'Momentum',
  safe_watch: 'İzleme',
  fallback: 'Bölge',
};

export const DISTRICT_NEGLECT_RECOVERY_NEGLECT_LABELS: Record<DistrictNeglectBand, string | undefined> =
  {
    none: undefined,
    watch: 'İzleniyor',
    rising: 'Biriyor',
    high: 'Öncelikli',
  };

export const DISTRICT_NEGLECT_RECOVERY_RECOVERY_LABELS: Record<DistrictRecoveryBand, string | undefined> =
  {
    none: undefined,
    possible: 'Fırsat',
    active: 'Toparlanıyor',
    strong: 'Güçlü iz',
  };

export const DISTRICT_NEGLECT_RECOVERY_COPY: Record<DistrictNeglectRecoveryKind, string[]> = {
  neglect_watch: [
    'Bu mahalle kısa bir takip kontrolü isteyebilir.',
    'Bölge sinyali sakin ama izlemeye değer.',
    'Bu alanı bugün küçük notla takipte tutmak iyi olur.',
  ],
  neglect_warning: [
    'Bu mahallede ertelenen sinyal birikmeye başlamış olabilir.',
    'Bölgeyi uzun süre pas geçmek yarınki baskıyı artırabilir.',
    'Bu mahalle artık yalnızca izleme değil, öncelik isteyebilir.',
  ],
  trust_fragility: [
    'Güven hassasiyeti bu bölgede daha dikkatli okunmalı.',
    'Küçük iletişim hamlesi güven etkisini yumuşatabilir.',
    'Bu bölgede sosyal etkiyi geç okumamak önemli.',
  ],
  social_cooling: [
    'Sosyal nabız burada soğumadan takip edilmeli.',
    'Vatandaş tepkisi büyümeden küçük kontrol değerli olabilir.',
    'Bu bölgede görünür takip güveni koruyabilir.',
  ],
  route_backlog: [
    'Rota baskısı bu mahallede birikmeye açık.',
    'Araç ve ekip hattını erken okumak bu bölgeyi rahatlatabilir.',
    'Bu mahallede rota yükü küçük kontrolden fayda görebilir.',
  ],
  container_backlog: [
    'Konteyner hattı burada takip gerektirebilir.',
    'Tek nokta değil, bölge hattı birlikte okunmalı.',
    'Çevre baskısı büyümeden kısa kontrol iyi olur.',
  ],
  recovery_window: [
    'Bu mahallede toparlanma fırsatı var.',
    'Küçük takip hamlesi bu bölgeyi yeniden dengeleyebilir.',
    'Bölge doğru hamleyle olumlu iz bırakabilir.',
  ],
  recovery_progress: [
    'Bu mahallede olumlu iz güçlenmeye başlamış olabilir.',
    'Toparlanma sinyali küçük takip hamlesiyle korunabilir.',
    'Bölgedeki iyiye gidiş dikkatli takip ister.',
  ],
  positive_momentum: [
    'Bu bölgede küçük ama değerli bir olumlu momentum var.',
    'Şehir bu mahallede sadece risk değil, fırsat da gösteriyor.',
    'Doğru takip burada güvenli ilerleme sağlayabilir.',
  ],
  safe_watch: [
    'Bu mahalle bugün izleme modunda kalabilir.',
    'Bölge sakin; kapasiteyi daha acil sinyale ayırabilirsin.',
    'Bugün bu mahalle için kısa takip yeterli olabilir.',
  ],
  fallback: [
    'Mahalle sinyalleri sakin; yeni izler raporda netleşir.',
    'Bugün belirgin ihmal ya da toparlanma sinyali yok.',
    'Bölge takibi için yeni kaynak bekleniyor.',
  ],
};

export const DISTRICT_NEGLECT_RECOVERY_CONFLICT_COPY: string[] = [
  'Bu mahallede hem baskı hem toparlanma fırsatı birlikte okunmalı.',
  'Bölgede risk sinyali var; küçük takip hamlesi dengeyi koruyabilir.',
  'Mahalle hem izlemeyi hem fırsatı aynı anda isteyebilir.',
];

export const DISTRICT_NEGLECT_RECOVERY_FAKE_NEGLECT_PATTERNS = [
  /kesin ihmal/i,
  /ihmal edildi/i,
  /terk edildi/i,
  /suçlu/i,
  /başarısız/i,
];

export const DISTRICT_NEGLECT_RECOVERY_FAKE_RECOVERY_PATTERNS = [
  /kesin toparlandı/i,
  /tamamen düzeldi/i,
  /sorun kalmadı/i,
  /mükemmel/i,
];

export const DISTRICT_NEGLECT_RECOVERY_KIND_PRIORITY: Record<DistrictNeglectRecoveryKind, number> = {
  neglect_warning: 82,
  trust_fragility: 78,
  route_backlog: 76,
  container_backlog: 74,
  social_cooling: 72,
  neglect_watch: 68,
  positive_momentum: 80,
  recovery_progress: 76,
  recovery_window: 74,
  safe_watch: 42,
  fallback: 20,
};

export function resolveNeglectBand(score: number): DistrictNeglectBand {
  if (score < 20) return 'none';
  if (score < 40) return 'watch';
  if (score < 65) return 'rising';
  return 'high';
}

export function resolveRecoveryBand(score: number): DistrictRecoveryBand {
  if (score < 20) return 'none';
  if (score < 40) return 'possible';
  if (score < 65) return 'active';
  return 'strong';
}

export function resolveDistrictNeglectRecoveryDayPolicy(day: number): DistrictNeglectRecoveryDayPolicy {
  if (day <= 1) return 'day_1';
  if (day <= 7) return 'day_2_7';
  if (day <= 9) return 'day_8_plus';
  return 'day_10_plus';
}
