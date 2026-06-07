import type { ManualLaunchEasBuildChecklistItem } from './manualLaunchEvidenceTypes';

export const MANUAL_LAUNCH_EVIDENCE_LOG_DOCS_SECTION = 'Evidence log model';

/** Blocker cannot close unless ALL listed evidence types are `verified`. */
export const BLOCKER_EVIDENCE_CLOSE_REQUIREMENTS: Record<
  string,
  { requiredVerifiedTypes: string[]; manualNoteOnlyInternalOk: boolean }
> = {
  sentry_dashboard_smoke_test: {
    requiredVerifiedTypes: ['dashboard_event'],
    manualNoteOnlyInternalOk: false,
  },
  sentry_dsn_set: {
    requiredVerifiedTypes: ['build_log', 'manual_note'],
    manualNoteOnlyInternalOk: true,
  },
  iap_sandbox_purchase_test: {
    requiredVerifiedTypes: ['purchase_log'],
    manualNoteOnlyInternalOk: false,
  },
  iap_restore_test: {
    requiredVerifiedTypes: ['purchase_log'],
    manualNoteOnlyInternalOk: false,
  },
  privacy_url_published: {
    requiredVerifiedTypes: ['url'],
    manualNoteOnlyInternalOk: false,
  },
  store_screenshots_captured: {
    requiredVerifiedTypes: ['screenshot', 'store_console'],
    manualNoteOnlyInternalOk: false,
  },
  app_store_metadata_entered: {
    requiredVerifiedTypes: ['store_console'],
    manualNoteOnlyInternalOk: false,
  },
  play_store_metadata_entered: {
    requiredVerifiedTypes: ['store_console'],
    manualNoteOnlyInternalOk: false,
  },
  revenuecat_public_keys: {
    requiredVerifiedTypes: ['store_console', 'manual_note'],
    manualNoteOnlyInternalOk: false,
  },
  analytics_dashboard_created: {
    requiredVerifiedTypes: ['dashboard_event', 'screenshot'],
    manualNoteOnlyInternalOk: false,
  },
};

export const SENTRY_SMOKE_PASS_CRITERIA = [
  'Event visible in Sentry dashboard',
  'No PII in payload',
  'No raw save JSON',
  'No full event body',
  'Screen breadcrumb present',
  'Environment tag present',
] as const;

export const IAP_SANDBOX_PASS_CRITERIA = [
  'Purchase succeeds on sandbox account',
  'Entitlement unlocks full access',
  'Restore works after reinstall',
  'Failed/cancelled purchase does not crash app',
  'Product id matches store + RevenueCat offering',
] as const;

export const INTERNAL_DEVICE_TEST_BATCH_IDS = [
  'idt.day1_first_session',
  'idt.day1_decision_result',
  'idt.day5_mid_event_resume',
  'idt.day7_day8_transition',
  'idt.day8_pack_origin_event',
  'idt.day8_pack_origin_decision_result',
  'idt.day8_report_resume',
  'idt.hub_resume_after_report',
  'idt.map_reaction',
  'idt.operational_resources_detail',
  'idt.social_pulse_mention_cap',
  'idt.iap_offer_screen',
  'idt.iap_sandbox_purchase',
  'idt.iap_restore_sandbox',
  'idt.sentry_crash_smoke',
  'idt.sentry_dashboard_visible',
  'idt.large_text_smoke',
  'idt.low_end_android_performance',
  'idt.offline_launch',
  'idt.privacy_store_metadata_check',
] as const;

export const DEVICE_TEST_BLOCKER_LINKS: Record<string, string[]> = {
  'idt.day1_first_session': ['day1_first_session_smoke'],
  'idt.day8_pack_origin_event': ['day8_pack_origin_event_smoke'],
  'idt.day8_report_resume': ['report_before_close_resume_smoke'],
  'idt.iap_sandbox_purchase': ['iap_sandbox_purchase_test'],
  'idt.iap_restore_sandbox': ['iap_restore_test'],
  'idt.sentry_crash_smoke': ['crash_test_smoke', 'sentry_dashboard_smoke_test'],
  'idt.sentry_dashboard_visible': ['sentry_dashboard_smoke_test'],
  'idt.large_text_smoke': ['large_text_smoke'],
  'idt.low_end_android_performance': ['low_end_android_smoke'],
  'idt.map_reaction': ['map_reaction_smoke'],
};

export const EVIDENCE_PRIORITY_MISSING = [
  'evidence.eas_internal_build',
  'evidence.sentry_dashboard_smoke',
  'evidence.iap_sandbox_purchase',
  'evidence.iap_restore',
  'evidence.day8_pack_origin',
  'evidence.large_text_smoke',
  'evidence.store_screenshots',
  'evidence.privacy_url',
] as const;

function easItem(
  partial: ManualLaunchEasBuildChecklistItem,
): ManualLaunchEasBuildChecklistItem {
  return partial;
}

export function buildEasInternalBuildChecklistTemplate(
  repoSignals: { easJson: boolean; appJson: boolean; sentryPlugin: boolean },
): ManualLaunchEasBuildChecklistItem[] {
  return [
    easItem({
      id: 'eas_cli_ready',
      title: 'EAS CLI ready',
      status: repoSignals.easJson ? 'pending' : 'blocked',
      evidenceRequired: ['manual_note'],
      nextAction: 'Install EAS CLI; confirm eas.json project id.',
      blocksInternalDeviceTest: false,
    }),
    easItem({
      id: 'eas_project_config_ready',
      title: 'EAS project config ready',
      status: repoSignals.easJson ? 'pending' : 'blocked',
      evidenceRequired: ['build_log'],
      nextAction: 'Verify eas.json + app.json bundle identifiers.',
      blocksInternalDeviceTest: true,
    }),
    easItem({
      id: 'ios_internal_profile_ready',
      title: 'iOS internal profile ready',
      status: 'pending',
      evidenceRequired: ['build_log'],
      nextAction: 'Configure internal distribution profile in EAS.',
      blocksInternalDeviceTest: true,
    }),
    easItem({
      id: 'android_internal_profile_ready',
      title: 'Android internal profile ready',
      status: 'pending',
      evidenceRequired: ['build_log'],
      nextAction: 'Configure internal APK/AAB profile in EAS.',
      blocksInternalDeviceTest: true,
    }),
    easItem({
      id: 'env_sentry_dsn_set',
      title: 'EXPO_PUBLIC_SENTRY_DSN set on internal build',
      status: 'pending',
      evidenceRequired: ['build_log', 'manual_note'],
      nextAction: 'Set DSN in EAS env for internal profile.',
      blocksInternalDeviceTest: false,
    }),
    easItem({
      id: 'env_crash_reporting_enabled',
      title: 'EXPO_PUBLIC_CRASH_REPORTING_ENABLED=true',
      status: 'pending',
      evidenceRequired: ['build_log'],
      nextAction: 'Enable crash reporting flag on internal build.',
      blocksInternalDeviceTest: false,
    }),
    easItem({
      id: 'revenuecat_keys_set_if_testing_iap',
      title: 'RevenueCat keys set (if testing IAP)',
      status: 'pending',
      evidenceRequired: ['build_log', 'manual_note'],
      nextAction: 'Set EXPO_PUBLIC_REVENUECAT_IOS/ANDROID on internal profile.',
      blocksInternalDeviceTest: true,
    }),
    easItem({
      id: 'build_version_recorded',
      title: 'Build version recorded',
      status: 'pending',
      evidenceRequired: ['build_log'],
      nextAction: 'Record app version in evidence log after build.',
      blocksInternalDeviceTest: false,
    }),
    easItem({
      id: 'build_number_recorded',
      title: 'Build number recorded',
      status: 'pending',
      evidenceRequired: ['build_log'],
      nextAction: 'Record iOS buildNumber / Android versionCode.',
      blocksInternalDeviceTest: false,
    }),
    easItem({
      id: 'internal_distribution_ready',
      title: 'Internal distribution ready',
      status: 'pending',
      evidenceRequired: ['build_log', 'url'],
      nextAction: 'EAS internal install link or TestFlight internal track.',
      blocksInternalDeviceTest: true,
    }),
    easItem({
      id: 'tester_device_registered_or_distribution_ready',
      title: 'Tester device registered or distribution ready',
      status: 'pending',
      evidenceRequired: ['manual_note'],
      nextAction: 'Register test devices or share internal install link.',
      blocksInternalDeviceTest: true,
    }),
  ];
}
