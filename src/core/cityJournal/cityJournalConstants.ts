import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import type {
  CityJournalLiteEntryKind,
  CityJournalLiteEntryTone,
  CityJournalLitePriority,
  CityJournalLiteSourceKind,
} from './cityJournalTypes';

export const CITY_JOURNAL_LITE_TITLE = 'Şehir Günlüğü';

export const CITY_JOURNAL_LITE_REPORT_LABEL = 'Günlüğe işlendi';

export const CITY_JOURNAL_LITE_EMPTY_DAY1 =
  'Şehir günlüğü henüz oluşuyor; ilk operasyon izleri birkaç gün içinde belirecek.';

export const CITY_JOURNAL_LITE_EMPTY_EARLY =
  'İlk operasyon izleri oluşuyor; kararların şehirde küçük bir kayıt bırakmaya başladı.';

export const CITY_JOURNAL_LITE_EMPTY_FALLBACK =
  'Son şehir izi henüz netleşmedi; bir sonraki gün sonu raporuyla güncellenecek.';

export const CITY_JOURNAL_LITE_SUMMARY_RECENT =
  'Son operasyon izleri şehir günlüğünde tutuluyor.';

export const CITY_JOURNAL_LITE_MAX_COPY_LENGTH = 118;

export const CITY_JOURNAL_LITE_HUB_MAX_ENTRIES = 2;

export const CITY_JOURNAL_LITE_REPORT_MAX_ENTRIES = 3;

export const CITY_JOURNAL_LITE_PROFILE_MAX_ENTRIES = 5;

export const CITY_JOURNAL_LITE_MAP_MAX_ENTRIES = 1;

export const CITY_JOURNAL_LITE_DISTRICT_IDS: readonly MapDistrictId[] = [
  'cumhuriyet',
  'merkez',
  'sanayi',
  'istasyon',
  'yesilvadi',
] as const;

export const CITY_JOURNAL_LITE_FORBIDDEN_WORDS = [
  'pack',
  'metadata',
  'runtime',
  'activation',
  'candidate',
  'variant',
  'premium',
  'kilitli',
  'satın al',
  'kaçırma',
  'ödül kazan',
  'ceza',
  'başarısız oldun',
  'panik',
  'felaket',
  'viral',
  'trend oldu',
  'district_pack_one',
  'vehicle_route_pack_one',
  'container_environment_pack_one',
] as const;

export const CITY_JOURNAL_LITE_ENTRY_KINDS: readonly CityJournalLiteEntryKind[] = [
  'route_balanced',
  'container_followup',
  'social_trust_recovered',
  'district_trust_shift',
  'resource_pressure_noted',
  'crisis_prevented',
  'operation_scope_expanded',
  'recovery_momentum',
  'visible_service_improved',
  'carry_over_created',
  'carry_over_resolved',
  'main_operation_started',
  'fallback',
] as const;

export const CITY_JOURNAL_KIND_PRIORITY: Record<CityJournalLiteEntryKind, number> = {
  main_operation_started: 1,
  carry_over_resolved: 2,
  carry_over_created: 3,
  recovery_momentum: 4,
  crisis_prevented: 5,
  social_trust_recovered: 6,
  district_trust_shift: 7,
  route_balanced: 8,
  container_followup: 9,
  visible_service_improved: 10,
  resource_pressure_noted: 11,
  operation_scope_expanded: 12,
  fallback: 99,
};

export const CITY_JOURNAL_SOURCE_PRIORITY: Record<CityJournalLiteSourceKind, number> = {
  main_operation_feel: 1,
  carry_over: 2,
  tomorrow_risk: 3,
  decision_impact: 4,
  district_memory: 5,
  content_pack: 6,
  daily_report: 7,
  city_echo: 8,
  fallback: 9,
};

export const CITY_JOURNAL_KIND_DEFAULT_TONE: Record<CityJournalLiteEntryKind, CityJournalLiteEntryTone> = {
  route_balanced: 'recovery',
  container_followup: 'watch',
  social_trust_recovered: 'positive',
  district_trust_shift: 'watch',
  resource_pressure_noted: 'watch',
  crisis_prevented: 'recovery',
  operation_scope_expanded: 'operation',
  recovery_momentum: 'recovery',
  visible_service_improved: 'positive',
  carry_over_created: 'watch',
  carry_over_resolved: 'positive',
  main_operation_started: 'operation',
  fallback: 'neutral',
};

export const CITY_JOURNAL_KIND_DEFAULT_PRIORITY: Record<CityJournalLiteEntryKind, CityJournalLitePriority> = {
  main_operation_started: 'high',
  carry_over_resolved: 'high',
  carry_over_created: 'medium',
  recovery_momentum: 'medium',
  crisis_prevented: 'medium',
  social_trust_recovered: 'medium',
  district_trust_shift: 'medium',
  route_balanced: 'medium',
  container_followup: 'medium',
  visible_service_improved: 'medium',
  resource_pressure_noted: 'low',
  operation_scope_expanded: 'medium',
  fallback: 'low',
};

export type CityJournalCopyFragment = (districtName: string) => string;

export const CITY_JOURNAL_ENTRY_FRAGMENTS: Record<
  Exclude<CityJournalLiteEntryKind, 'main_operation_started' | 'fallback'>,
  CityJournalCopyFragment
> = {
  route_balanced: (d) => `${d} rotası dengelendi.`,
  container_followup: (d) => `${d} konteyner çevresi yarına taşındı.`,
  social_trust_recovered: (d) => `${d}'te sosyal güven toparlandı.`,
  district_trust_shift: (d) => `${d} mahalle güveni kayda geçti.`,
  resource_pressure_noted: (d) => `${d} kaynak dengesi izleme notuna alındı.`,
  crisis_prevented: (d) => `${d} hattında önleyici takip kayda geçti.`,
  operation_scope_expanded: (d) => `${d} ana operasyon kapsamına girdi.`,
  recovery_momentum: (d) => `${d} toparlanma ivmesi günlüğe işlendi.`,
  visible_service_improved: (d) => `${d}'de görünür hizmet etkisi güçlendi.`,
  carry_over_created: (d) => `${d} hattından yarına taşınan iz kayda geçti.`,
  carry_over_resolved: (d) => `${d} hattındaki taşınan iz kapanışa yaklaştı.`,
};

export const CITY_JOURNAL_MAIN_OPERATION_FRAGMENT =
  'Ana operasyon daha geniş mahalle kapsamıyla başladı.';

export const CITY_JOURNAL_PACK_FRAGMENTS: Record<
  'route' | 'container' | 'district' | 'social' | 'environment',
  CityJournalCopyFragment
> = {
  route: (d) => `${d} rotası izleme notuna alındı.`,
  container: (d) => `${d} konteyner çevresi takipte kaldı.`,
  district: (d) => `${d}'de mahalle dengesi günlüğe işlendi.`,
  social: (d) => `${d}'te sosyal güven çizgisi günlüğe işlendi.`,
  environment: (d) => `${d}'de çevre hassasiyeti gündeme geldi.`,
};

export const CITY_JOURNAL_OPENING_DAY = 8;

export const CITY_JOURNAL_PILOT_MAX_DAY = 7;

export const CITY_JOURNAL_EARLY_MAX_DAY = 3;
