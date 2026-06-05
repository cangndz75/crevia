import type { CreviaSoftLaunchReviewArea } from './softLaunchReviewTypes';

export const SOFT_LAUNCH_REVIEW_DOCS_PATH = 'docs/crevia-soft-launch-readiness-review.md';

export const SOFT_LAUNCH_REVIEW_AREAS: readonly CreviaSoftLaunchReviewArea[] = [
  'first_ten_minutes',
  'pilot_days_1_7',
  'day8_open_ended_operation',
  'district_runtime_systems',
  'route_field_resource_systems',
  'result_report_carryover',
  'content_coverage',
  'analytics',
  'iap_monetization',
  'performance_selectors',
  'save_migration_offline',
  'release_store_readiness',
] as const;

export const SOFT_LAUNCH_REVIEW_AREA_LABELS: Record<CreviaSoftLaunchReviewArea, string> = {
  first_ten_minutes: 'A. İlk 10 Dakika',
  pilot_days_1_7: 'B. Pilot Gün 1–7',
  day8_open_ended_operation: 'C. Gün 8+ Açık Uçlu Operasyon',
  district_runtime_systems: 'D. District Runtime Sistemleri',
  route_field_resource_systems: 'E. Rota / Saha / Kaynak',
  result_report_carryover: 'F. Sonuç / Rapor / Carry-over',
  content_coverage: 'G. Content Coverage',
  analytics: 'H. Analytics',
  iap_monetization: 'I. IAP / Monetization',
  performance_selectors: 'J. Performance / Selectors',
  save_migration_offline: 'K. Save / Migration / Offline',
  release_store_readiness: 'L. Release / Store Readiness',
};

export const SOFT_LAUNCH_REVIEW_MIN_FAMILIES = 80;
export const SOFT_LAUNCH_REVIEW_MIN_VARIANTS = 300;

export const SOFT_LAUNCH_REVIEW_PLAYER_FACING_LEGACY_TERMS = [
  '14 günlük sezon',
  'sezon finali',
  'sezon sonu',
  '14 gün bitti',
  'oyun sonu',
  'oyun bitti',
  'yeni sezona başla',
] as const;

export const SOFT_LAUNCH_REVIEW_IAP_BLOCKER_IDS = [
  'launch.missing_revenuecat_keys',
  'launch.manual_smoke_pending',
  'launch.store_setup_pending',
] as const;

export const SOFT_LAUNCH_REVIEW_RECOMMENDED_PROMPTS = [
  'Crevia Real Device Playtest Pass — 4 profil checklist ile iOS/Android smoke test logla.',
  'Crevia IAP Sandbox Smoke Test Pass — EAS dev build üzerinde purchase/restore matrix tamamla.',
  'Crevia Store Listing & Privacy Pass — App Store / Play metinleri ve data safety formu.',
  'Crevia Performance Selector Pass Aşama 3 — kalan broad selector risklerini daralt.',
  'Crevia No-New-System Freeze — yalnızca bugfix, polish ve store hazırlığı patch’leri.',
] as const;
