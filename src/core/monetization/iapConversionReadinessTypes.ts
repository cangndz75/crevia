export type CreviaIapConversionReadinessSeverity = 'pass' | 'warn' | 'fail';

export type CreviaIapConversionReadinessFinding = {
  id: string;
  area: CreviaIapConversionReadinessArea;
  severity: CreviaIapConversionReadinessSeverity;
  title: string;
  message: string;
  recommendation: string;
};

export type CreviaIapConversionReadinessArea =
  | 'offer_value_proposition'
  | 'limited_full_clarity'
  | 'purchase_cta_safety'
  | 'restore_cta_visibility'
  | 'product_metadata_pending'
  | 'revenuecat_disabled_failsafe'
  | 'paywall_pressure_wording'
  | 'false_claim_wording'
  | 'iap_metadata_consistency'
  | 'privacy_purchase_consistency'
  | 'day7_offer_transition'
  | 'day8_limited_playable'
  | 'full_unlock_messaging';

export type CreviaIapConversionReadinessResult = {
  health: 'PASS' | 'WARN' | 'FAIL';
  checkedCount: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  findings: CreviaIapConversionReadinessFinding[];
  offerFrictionRisks: string[];
  copyGuardPassed: boolean;
  limitedModePlayable: boolean;
  restoreCtaPresent: boolean;
  productMetadataPendingSafe: boolean;
  storeMetadataConsistent: boolean;
  privacyConsistent: boolean;
  freezeCompliant: boolean;
  nextSteps: string[];
  docsPath: string;
};

export type CreviaIapConversionSoftLaunchFindings = {
  readinessPassPresent: boolean;
  offerCopyGuardPass: boolean;
  limitedModePlayable: boolean;
  restoreCtaPresent: boolean;
  productMetadataPendingSafe: boolean;
  paywallPressureGuardPass: boolean;
};
