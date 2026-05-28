export type PilotCompletionGrade =
  | 'excellent'
  | 'strong'
  | 'steady'
  | 'fragile';

export type PilotManagementStyle =
  | 'public_first'
  | 'operator'
  | 'resource_guardian'
  | 'balanced_coordinator'
  | 'crisis_responder';

export type PilotPreviewUnlockStatus = 'completed' | 'locked' | 'soon';

export type PilotPreviewUnlockItem = {
  id: string;
  title: string;
  text: string;
  iconName?: string;
  status: PilotPreviewUnlockStatus;
  tag?: string;
};

export type PilotCompletionSummary = {
  isCompleted: boolean;
  day: number;
  grade: PilotCompletionGrade;
  gradeLabel: string;
  title: string;
  subtitle: string;
  score: number;

  managementStyle: PilotManagementStyle;
  managementStyleLabel: string;
  managementStyleText: string;

  bestNeighborhoodName?: string;
  strongestMetricLabel?: string;
  weakestMetricLabel?: string;

  completedGoals: number;
  failedGoals: number;
  fulfilledPriorities: number;
  partialPriorities: number;
  failedPriorities: number;

  butterflyCount: number;
  carryOverCount: number;

  unlockedPreviewItems: PilotPreviewUnlockItem[];

  nextChapterText: string;
};

export const PILOT_COMPLETION_PAYMENT_BANNED_WORDS = [
  'satın al',
  'premium',
  'abone',
  'paket',
  'teklif',
  '₺',
  'paywall',
  'iap',
] as const;

export const MAIN_OPERATION_PREVIEW_ROUTE = '/events/main-operation-preview';
