export type PrivacyPolicyTextPackStatus =
  | 'draft'
  | 'ready_for_legal_review'
  | 'blocked_by_missing_privacy_url'
  | 'ready_for_publish';

export type PrivacyPolicyTextLocale = 'tr' | 'en';

export type PrivacyPolicyTextAppliesTo =
  | 'app'
  | 'sentry'
  | 'analytics'
  | 'revenuecat'
  | 'store_purchase'
  | 'local_save'
  | 'support_contact';

export type PrivacyPolicyTextSectionStatus = 'draft' | 'ready_for_review' | 'needs_manual_check';

export type PrivacyPolicyTextSection = {
  id: string;
  titleTR: string;
  titleEN: string;
  bodyTR: string;
  bodyEN: string;
  dataCategories: string[];
  appliesTo: PrivacyPolicyTextAppliesTo[];
  status: PrivacyPolicyTextSectionStatus;
  legalReviewRequired: boolean;
};

export type PrivacyPolicyDataSafetyCollected =
  | 'yes'
  | 'no'
  | 'conditional'
  | 'pending_manual_review';

export type PrivacyPolicyDataSafetyPurpose =
  | 'app_functionality'
  | 'analytics'
  | 'crash_diagnostics'
  | 'purchases'
  | 'support';

export type PrivacyPolicyDataSafetyItem = {
  category: string;
  collected: PrivacyPolicyDataSafetyCollected;
  purpose: PrivacyPolicyDataSafetyPurpose[];
  linkedToUser: 'yes' | 'no' | 'pending_manual_review';
  sharedWithThirdParties: 'yes' | 'no' | 'service_provider_only' | 'pending_manual_review';
  encryptedInTransit: 'yes' | 'no' | 'platform_default' | 'pending_manual_review';
  userCanRequestDeletion: 'yes' | 'no' | 'support_contact' | 'pending_manual_review';
  notesTR: string;
  notesEN: string;
  sourceSystem: string;
};

export type PrivacyPolicySdkDisclosureStatus = 'present' | 'pending' | 'not_used';

export type PrivacyPolicySdkDisclosureItem = {
  id: string;
  name: string;
  codeIntegration: PrivacyPolicySdkDisclosureStatus;
  envOrDashboard: PrivacyPolicySdkDisclosureStatus;
  dataCollected: string[];
  prohibited: string[];
  notesTR: string;
  notesEN: string;
};

export type PrivacyPolicyTextFalseClaimFinding = {
  phrase: string;
  fieldId: string;
  severity: 'blocker' | 'warning';
};

export type PrivacyPolicyTextManualReviewItem = {
  id: string;
  platform: 'apple' | 'google' | 'both' | 'legal';
  note: string;
  lastChecked: string;
};

export type PrivacyPolicyTextBlocker = {
  id: string;
  title: string;
  message: string;
};

export type PrivacyPolicyTextPack = {
  packId: string;
  status: PrivacyPolicyTextPackStatus;
  localeCoverage: 'tr' | 'en' | 'tr_en';
  sections: PrivacyPolicyTextSection[];
  dataUseMatrix: PrivacyPolicyDataSafetyItem[];
  sdkDisclosureMatrix: PrivacyPolicySdkDisclosureItem[];
  storeDataSafetyChecklist: string[];
  storeDisclosureCopyTR: string;
  storeDisclosureCopyEN: string;
  falseClaimFindings: PrivacyPolicyTextFalseClaimFinding[];
  manualReviewItems: PrivacyPolicyTextManualReviewItem[];
  copyGuardPassed: boolean;
  privacyUrlStatus: 'placeholder' | 'pending_publish';
  legalReviewStatus: 'pending';
  dataSafetyFormStatus: 'pending_manual_review';
  blockerSummary: PrivacyPolicyTextBlocker[];
  nextActions: string[];
  fakePassGuard: true;
  docsPath: string;
};

export type PrivacyPolicyTextAuditResult = PrivacyPolicyTextPack;
