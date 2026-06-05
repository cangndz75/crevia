export type CreviaSecretHygieneHealthStatus = 'PASS' | 'WARN' | 'BLOCKED';

export type CreviaSecretFindingSeverity = 'blocker' | 'high' | 'medium' | 'low';

export type CreviaSecretFindingKind =
  | 'revenuecat_public_key'
  | 'revenuecat_secret_key'
  | 'generic_api_key'
  | 'eas_secret_value'
  | 'store_shared_secret'
  | 'placeholder_safe'
  | 'suspicious_token'
  | 'docs_real_key_value';

export type CreviaSecretScanFinding = {
  id: string;
  kind: CreviaSecretFindingKind;
  severity: CreviaSecretFindingSeverity;
  filePath: string;
  title: string;
  message: string;
  recommendation: string;
  rotationRequired: boolean;
};

export type CreviaSecretSanitizationAction = {
  filePath: string;
  description: string;
  replacementPlaceholder: string;
  applied: boolean;
};

export type CreviaSecretRotationRequirement = {
  provider: string;
  reason: string;
  manualAction: string;
  resolved: boolean;
};

export type CreviaSecretHygieneResult = {
  health: CreviaSecretHygieneHealthStatus;
  findings: CreviaSecretScanFinding[];
  blockerCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  sanitizationActions: CreviaSecretSanitizationAction[];
  rotationRequirements: CreviaSecretRotationRequirement[];
  currentTreeSanitized: boolean;
  rotationPending: boolean;
  scannedFileCount: number;
  scannedDocCount: number;
  docsPath: string;
};
