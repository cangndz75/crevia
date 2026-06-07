export type StoreScreenshotNarrativePackStatus =
  | 'draft'
  | 'ready_for_capture'
  | 'blocked_by_missing_screens'
  | 'ready_for_store_review';

export type StoreScreenshotNarrativeLocaleCoverage = 'tr' | 'en' | 'tr_en';

export type StoreScreenshotNarrativeTargetStore = 'app_store' | 'google_play' | 'both';

export type StoreScreenshotNarrativeCaptureStatus = 'pending' | 'captured' | 'verified';

export type StoreScreenshotNarrativeItem = {
  id: string;
  order: number;
  screenKey: string;
  titleTR: string;
  titleEN: string;
  subtitleTR: string;
  subtitleEN: string;
  playerPromise: string;
  screenshotGoal: string;
  requiredGameState: string;
  requiredSurface: string;
  captureNotes: string;
  safeAreaNotes: string;
  forbiddenElements: string[];
  storeComplianceNotes: string;
  evidenceRequired: string[];
  captureStatus: StoreScreenshotNarrativeCaptureStatus;
  blocksStoreSubmission: boolean;
  optional?: boolean;
};

export type StoreScreenshotNarrativeCaptureScenario = {
  id: string;
  title: string;
  targetDayRange: string;
  description: string;
  screenshotIds: string[];
  devToolsPresetNote?: string;
};

export type StoreScreenshotNarrativeCaptionGuideline = {
  id: string;
  rule: string;
};

export type StoreScreenshotNarrativeDeviceMatrixEntry = {
  id: string;
  platform: 'ios' | 'android';
  label: string;
  storeSizeNotes: string;
  safeAreaNotes: string;
  trCopyLengthNote: string;
  enCopyLengthNote: string;
  cropRisk: string;
};

export type StoreScreenshotNarrativeBlocker = {
  id: string;
  title: string;
  message: string;
};

export type StoreScreenshotNarrativePack = {
  packId: string;
  status: StoreScreenshotNarrativePackStatus;
  localeCoverage: StoreScreenshotNarrativeLocaleCoverage;
  targetStores: StoreScreenshotNarrativeTargetStore;
  screenshots: StoreScreenshotNarrativeItem[];
  captureScenarios: StoreScreenshotNarrativeCaptureScenario[];
  captionGuidelines: StoreScreenshotNarrativeCaptionGuideline[];
  deviceMatrix: StoreScreenshotNarrativeDeviceMatrixEntry[];
  blockerSummary: StoreScreenshotNarrativeBlocker[];
  nextActions: string[];
  fakePassGuard: true;
  copyGuardPassed: boolean;
  requiredScreenshotCount: number;
  pendingCaptureCount: number;
  verifiedCaptureCount: number;
  docsPath: string;
};

export type StoreScreenshotNarrativeAuditResult = StoreScreenshotNarrativePack & {
  falseClaimViolations: string[];
};
