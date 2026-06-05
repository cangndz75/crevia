import type { CreviaSecretFindingKind } from './secretHygieneTypes';

export type CreviaSecretRotationStatus =
  | 'not_required'
  | 'required_pending'
  | 'revoked_pending_verification'
  | 'rotated_pending_verification'
  | 'verified_closed'
  | 'blocked_unknown_exposure';

export type CreviaSecretExposureSeverity = 'blocker' | 'high' | 'medium' | 'low';

export type CreviaSecretRotationHealthStatus = 'PASS' | 'WARN' | 'BLOCKED';

export type CreviaSecretExposureRecord = {
  id: string;
  findingKind: CreviaSecretFindingKind;
  sourceFile: string;
  sourceArea: 'source' | 'docs' | 'env' | 'historical' | 'unknown';
  detectedBy: string;
  detectedAtLabel: string;
  rawValueStored: false;
  rawValueMasked: false;
  provider: string;
  rotationRequired: boolean;
  rotationStatus: CreviaSecretRotationStatus;
  manualActionRequired: boolean;
  launchBlocking: boolean;
  notes: string;
};

export type CreviaSecretRotationAction = {
  id: string;
  provider: string;
  actionLabel: string;
  completed: boolean;
  manualOnly: boolean;
};

export type CreviaSecretRotationEvidence = {
  exposureId: string;
  provider: string;
  actionType: 'revoked' | 'rotated' | 'reviewed_not_secret' | 'false_positive';
  confirmedBy: string;
  confirmationDateLabel: string;
  evidenceNote: string;
  dashboardReferencePlaceholder: string;
  rawKeyIncluded: false;
  verifiedByAudit: boolean;
  manualOnly: boolean;
};

export type CreviaSecretClosureBlocker = {
  id: string;
  title: string;
  message: string;
  recommendation: string;
};

export type CreviaSecretClosureWarning = {
  id: string;
  title: string;
  message: string;
  recommendation: string;
};

export type CreviaSecretRotationClosureResult = {
  health: CreviaSecretRotationHealthStatus;
  exposureRecords: CreviaSecretExposureRecord[];
  rotationActions: CreviaSecretRotationAction[];
  evidence: CreviaSecretRotationEvidence[];
  blockers: CreviaSecretClosureBlocker[];
  warnings: CreviaSecretClosureWarning[];
  nextActions: string[];
  currentTreeSanitized: boolean;
  rotationRequired: boolean;
  rotationEvidencePresent: boolean;
  rotationVerifiedClosed: boolean;
  closureCanProceed: boolean;
  publicRepoExposureFlag: boolean;
  exposureCount: number;
  pendingRotationCount: number;
  docsPath: string;
};
