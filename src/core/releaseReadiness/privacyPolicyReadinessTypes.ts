export type CreviaPrivacyPolicyHealthStatus = 'PASS' | 'WARN' | 'BLOCKED';

export type CreviaPrivacyCollectedStatus = 'yes' | 'no' | 'pending';

export type CreviaPrivacyConfidence = 'high' | 'medium' | 'low' | 'pending';

export type CreviaPrivacyPolicySectionId =
  | 'introduction'
  | 'what_crevia_is'
  | 'data_we_collect'
  | 'data_we_do_not_collect'
  | 'analytics_data'
  | 'purchase_payment_data'
  | 'crash_logging_data'
  | 'device_technical_data'
  | 'how_data_is_used'
  | 'third_party_services'
  | 'data_sharing'
  | 'data_retention'
  | 'children_privacy'
  | 'user_rights_contact'
  | 'international_note'
  | 'policy_changes'
  | 'contact_support';

export type CreviaPrivacyPolicySection = {
  id: CreviaPrivacyPolicySectionId;
  titleTr: string;
  titleEn: string;
  summaryTr: string;
  summaryEn: string;
};

export type CreviaPrivacyDataCategory = {
  id: string;
  label: string;
  collected: CreviaPrivacyCollectedStatus;
  source: string;
  purpose: string;
  linkedToUser: boolean | 'pending';
  usedForTracking: boolean | 'pending';
  sharedWithThirdParty: boolean | 'pending';
  thirdPartyProcessor: string;
  retentionNote: string;
  disclosureNote: string;
  confidence: CreviaPrivacyConfidence;
  actionNeeded: string;
};

export type CreviaPrivacyDataUsagePurpose =
  | 'analytics'
  | 'app_functionality'
  | 'purchase_entitlement'
  | 'diagnostics'
  | 'support'
  | 'not_collected';

export type CreviaPrivacyThirdPartyProcessor = {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'pending' | 'not_used';
  dataTypes: string[];
  notes: string;
};

export type CreviaAppStorePrivacyAnswerDraft = {
  dataCategory: string;
  collected: CreviaPrivacyCollectedStatus;
  linkedToUser: boolean | 'pending';
  usedForTracking: boolean | 'pending';
  purpose: string;
  notes: string;
  confidence: CreviaPrivacyConfidence;
  needsManualConfirmation: boolean;
};

export type CreviaGooglePlayDataSafetyField =
  | boolean
  | 'pending'
  | 'not_applicable';

export type CreviaGooglePlayDataSafetyAnswerDraft = {
  dataType: string;
  collected: CreviaPrivacyCollectedStatus;
  shared: CreviaGooglePlayDataSafetyField;
  processedEphemerally: CreviaGooglePlayDataSafetyField;
  requiredOrOptional: 'required' | 'optional' | 'not_applicable';
  purpose: string;
  encryptedInTransit: CreviaGooglePlayDataSafetyField;
  userCanRequestDeletion: CreviaGooglePlayDataSafetyField;
  notes: string;
  needsManualConfirmation: boolean;
};

export type CreviaPrivacyPolicyBlocker = {
  id: string;
  title: string;
  message: string;
};

export type CreviaPrivacyPolicyWarning = {
  id: string;
  title: string;
  message: string;
};

export type CreviaPrivacyPolicyReadinessMode =
  | 'internal_device_test'
  | 'iap_sandbox_test'
  | 'launch_candidate'
  | 'soft_launch_candidate';

export type CreviaPrivacyPolicyReadinessResult = {
  health: CreviaPrivacyPolicyHealthStatus;
  mode: CreviaPrivacyPolicyReadinessMode;
  sections: CreviaPrivacyPolicySection[];
  dataCategories: CreviaPrivacyDataCategory[];
  thirdPartyProcessors: CreviaPrivacyThirdPartyProcessor[];
  appStoreAnswers: CreviaAppStorePrivacyAnswerDraft[];
  googlePlayAnswers: CreviaGooglePlayDataSafetyAnswerDraft[];
  blockers: CreviaPrivacyPolicyBlocker[];
  warnings: CreviaPrivacyPolicyWarning[];
  privacyDraftDocsPresent: boolean;
  dataSafetyDraftDocsPresent: boolean;
  publishedPrivacyUrlIsPlaceholder: boolean;
  appStoreDraftComplete: boolean;
  googlePlayDraftComplete: boolean;
  riskyWordingScanPassed: boolean;
  thirdPartyConfirmationPending: boolean;
  legalReviewPending: boolean;
  nextActions: string[];
};

export type RunPrivacyPolicyReadinessAuditOptions = {
  mode?: CreviaPrivacyPolicyReadinessMode;
};
