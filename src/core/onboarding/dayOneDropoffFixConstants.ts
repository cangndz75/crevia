import type { DayOneDropoffAuditAreaId } from './dayOneDropoffFixTypes';
import type { FirstTenMinutesSystemKey } from './firstTenMinutesTypes';

export const DAY_ONE_DROPOFF_FIX_DOCS_PATH = 'docs/crevia-day-one-dropoff-fix-pass.md';

export const DAY_ONE_HUB_MAX_FEATURED_CARDS = 2;

export const DAY_ONE_RESULT_MAX_ECHO_LINES = 0;

export const DAY_ONE_REPORT_MAX_SYSTEM_LINES = 1;

export const DAY_ONE_DROPOFF_FORBIDDEN_COPY = [
  'sezon finali',
  '14 gün bitti',
  '14 günlük sezon',
  'oyun sonu',
  'oyun bitti',
  'premium',
  'satın al',
  'kilitli',
  'panik',
  'alarm',
  'çöktü',
  'başarısız oldun',
  'gerçek zamanlı gps',
  'canlı takip',
  'kesin rota',
  'resmi belediye uygulaması',
] as const;

export const DAY_ONE_ADVANCED_SYSTEM_KEYS: readonly FirstTenMinutesSystemKey[] = [
  'operation_era',
  'story_chain',
  'district_operation_action',
  'crisis_desk',
  'crisis_actions',
  'resource_fatigue_deep',
  'profile_career_showcase',
  'devtools_debug',
  'main_operation_season',
  'post_pilot_preview',
] as const;

export const DAY_ONE_DROPOFF_AUDIT_AREAS: readonly {
  id: DayOneDropoffAuditAreaId;
  label: string;
}[] = [
  { id: 'hub_day1_card_count', label: 'Hub Day 1 card count' },
  { id: 'hub_day1_cta_clarity', label: 'Hub Day 1 CTA clarity' },
  { id: 'first_event_discoverability', label: 'First event discoverability' },
  { id: 'inspect_explanation_density', label: 'Inspect screen explanation density' },
  { id: 'plan_option_clarity', label: 'Plan screen option clarity' },
  { id: 'dispatch_assignment_clarity', label: 'Dispatch assignment clarity' },
  { id: 'field_micro_decision_clarity', label: 'Field micro decision clarity' },
  { id: 'result_impact_clarity', label: 'Result screen impact clarity' },
  { id: 'report_day1_density', label: 'Report Day 1 density' },
  { id: 'tomorrow_preview_clarity', label: 'Tomorrow preview clarity' },
  { id: 'forbidden_early_systems_visibility', label: 'Forbidden early systems visibility' },
  { id: 'text_overflow_guard', label: 'Text overflow / numberOfLines guard' },
  { id: 'scroll_fatigue_risk', label: 'Scroll fatigue risk' },
  { id: 'duplicate_hint_copy_risk', label: 'Duplicate hint/copy risk' },
  { id: 'safe_area_small_screen_risk', label: 'Safe area / small screen risk' },
] as const;

export const DAY_ONE_FIX_ONLY_ALLOWED_SCOPES = [
  'bugfix',
  'layout_overflow_fix',
  'typo_copy_fix',
  'false_claim_copy_fix',
  'performance_selector_fix',
  'verification_only',
  'documentation_only',
] as const;

export const DAY_ONE_LAYOUT_GUARD_FILES = [
  'src/features/hub/components/HubReferenceHome.tsx',
  'src/features/events/utils/eventResultPresentation.ts',
  'src/features/reports/utils/endOfDayReportPresentation.ts',
] as const;
