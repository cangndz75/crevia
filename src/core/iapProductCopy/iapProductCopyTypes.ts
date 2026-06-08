export type IapProductCopyPackStatus =
  | 'draft'
  | 'ready_for_dashboard_entry'
  | 'blocked_by_missing_product_setup'
  | 'ready_for_review';

export type IapProductCopyLocale = 'tr' | 'en';

export type IapProductCopyTarget =
  | 'app_store_product_name'
  | 'app_store_product_description'
  | 'play_product_name'
  | 'play_product_description'
  | 'revenuecat_offering_display'
  | 'paywall_title'
  | 'paywall_subtitle'
  | 'benefit_bullet'
  | 'restore_copy'
  | 'purchase_success'
  | 'purchase_cancelled'
  | 'purchase_failed'
  | 'review_note';

export type IapProductCopyClaimRisk = 'low' | 'medium' | 'high';

export type IapProductCopyItemStatus = 'draft' | 'ready_for_review' | 'needs_manual_check';

export type IapProductCopyItem = {
  id: string;
  locale: IapProductCopyLocale;
  target: IapProductCopyTarget;
  text: string;
  tone: string;
  claimRisk: IapProductCopyClaimRisk;
  requiresManualStoreCheck: boolean;
  status: IapProductCopyItemStatus;
};

export type IapProductCopyOfferScreenCopy = {
  titleOptionsTR: string[];
  titleOptionsEN: string[];
  subtitleTR: string;
  subtitleEN: string;
};

export type IapProductCopyRestoreCopy = {
  ctaTR: string;
  ctaEN: string;
  helperTR: string;
  helperEN: string;
  accountNoteTR: string;
  accountNoteEN: string;
};

export type IapProductCopyPurchaseStateCopy = {
  successTR: string[];
  successEN: string[];
  cancelledTR: string[];
  cancelledEN: string[];
  failedTR: string[];
  failedEN: string[];
};

export type IapProductCopyReviewNotes = {
  tr: string;
  en: string;
};

export type IapProductCopyFalsePressureFinding = {
  phrase: string;
  fieldId: string;
  severity: 'blocker' | 'warning';
};

export type IapProductCopyTrustChecklistItem = {
  id: string;
  rule: string;
  status: 'required' | 'documented';
};

export type IapProductCopyManualSetupBlocker = {
  id: string;
  title: string;
  message: string;
};

export type IapProductCopyPack = {
  packId: string;
  status: IapProductCopyPackStatus;
  positioningTR: string;
  positioningEN: string;
  productCopyItems: IapProductCopyItem[];
  offerScreenCopy: IapProductCopyOfferScreenCopy;
  restoreCopy: IapProductCopyRestoreCopy;
  purchaseStateCopy: IapProductCopyPurchaseStateCopy;
  reviewNotes: IapProductCopyReviewNotes;
  falsePressureFindings: IapProductCopyFalsePressureFinding[];
  trustChecklist: IapProductCopyTrustChecklistItem[];
  manualSetupBlockers: IapProductCopyManualSetupBlocker[];
  copyGuardPassed: boolean;
  productSetupPending: true;
  sandboxPending: true;
  restoreTestPending: true;
  blockerSummary: IapProductCopyManualSetupBlocker[];
  nextActions: string[];
  fakePassGuard: true;
  docsPath: string;
};

export type IapProductCopyAuditResult = IapProductCopyPack;
