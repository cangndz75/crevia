import type { OfflineResumePhase } from './offlineResumeTypes';

export const OFFLINE_RESUME_DOCS_PATH = 'docs/crevia-offline-resume-robustness.md';

export const OFFLINE_RESUME_EXPECTED_SAVE_VERSION = 25;

export const OFFLINE_RESUME_KNOWN_BACKLOG = [
  'eventFamilySelectionEngine full pack gating — V1.1 backlog',
  'HubMainOperationSeasonCard Reference Home wiring — polish backlog unless Day 8+ loop blocked',
  'verify:soft-launch-review Freeze not recommended — Release Candidate cleanup',
  'verify:post-launch-telemetry-readiness cascade FAIL — Release Candidate cleanup',
] as const;

export const OFFLINE_RESUME_NON_GOALS = [
  'Yeni gameplay sistemi açma',
  'SAVE_VERSION bump (zorunlu değilse)',
  'persist shape değiştirme (zorunlu değilse)',
  'applyDecision / generateDailyEventSet / dayPipeline rewrite',
  'Pack caps artırma veya Day 1-7 injection açma',
  'Yeni route / büyük UI redesign',
] as const;

export const OFFLINE_RESUME_UI_SURFACES = [
  'HubScreen',
  'DecisionResultScreen',
  'EndOfDayReportView',
  'MapScreen',
  'SocialPulseScreen',
  'PostPilotEventContextChip',
  'OperationalResourcesDetailSheet',
] as const;

export const OFFLINE_RESUME_PHASE_LABELS: Record<OfflineResumePhase, string> = {
  day1_tutorial: 'Day 1 tutorial resume',
  pilot_day2_7: 'Day 2-7 pilot resume',
  day7_day8_transition: 'Day 7 → Day 8 transition',
  post_pilot_light: 'Day 8+ post-pilot light',
  post_pilot_full: 'Day 8+ full main operation',
  surface_resume: 'Map / Social / Report surface resume',
  offline_no_network: 'Offline / no network fallback',
  hydration: 'Persist hydrate safety',
  content_pack_recovery: 'contentPackMeta recovery',
  idempotency: 'Restart idempotency',
  derived_presentation: 'Derived presentation fallback',
};
