import type { OperationPhaseKey } from '@/features/events/utils/operationPhaseTransitionPresentation';

export type OperationPortfolioTone =
  | 'neutral'
  | 'positive'
  | 'warning'
  | 'critical'
  | 'locked';

export type OperationPortfolioSlotEmphasis = 'primary' | 'secondary' | 'compact';

export type OperationPortfolioChipTone =
  | 'teal'
  | 'gold'
  | 'amber'
  | 'sage'
  | 'neutral'
  | 'warning';

export type OperationPortfolioChip = {
  id: string;
  label: string;
  tone: OperationPortfolioChipTone;
};

export type OperationPortfolioSlotCta = {
  label: string;
  route: string;
  eventId?: string;
  phaseKey?: OperationPhaseKey;
  enabled: boolean;
};

export type OperationPortfolioSlotPresentation = {
  id: string;
  emphasis: OperationPortfolioSlotEmphasis;
  operationName: string;
  operationTypeLabel: string;
  districtLabel?: string;
  riskLabel: string;
  riskTone: OperationPortfolioTone;
  priorityBadge: string;
  priorityTone: OperationPortfolioChipTone;
  resourceChips: OperationPortfolioChip[];
  districtSensitivityChip?: OperationPortfolioChip;
  deferRiskLine: string;
  deferRiskChip?: OperationPortfolioChip;
  cta: OperationPortfolioSlotCta;
  tone: OperationPortfolioTone;
  accessibilityLabel: string;
};

export type OperationPortfolioPendingSignal = {
  id: string;
  label: string;
  tone: OperationPortfolioTone;
};

export type OperationPortfolioHeroPresentation = {
  dayLabel: string;
  boardTitle: string;
  portfolioTone: string;
  portfolioToneId: OperationPortfolioTone;
  summaryLine: string;
  operationCountLabel: string;
  cta: OperationPortfolioSlotCta;
};

export type OperationPortfolioCapacityPresentation = {
  visible: boolean;
  meterRatio: number;
  meterLabel: string;
  chips: OperationPortfolioChip[];
  summaryLine: string;
};

export type OperationPortfolioConflictSignal = {
  id: string;
  line: string;
  tone: OperationPortfolioTone;
};

export type OperationPortfolioConflictPresentation = {
  visible: boolean;
  badgeCount: number;
  signals: OperationPortfolioConflictSignal[];
};

export type OperationPortfolioSuggestedPlanPresentation = {
  visible: boolean;
  advisorLabel: string;
  recommendationLine: string;
  chips: OperationPortfolioChip[];
  cta: OperationPortfolioSlotCta;
};

export type OperationPortfolioOutcomePreviewChip = {
  id: string;
  label: string;
  tone: OperationPortfolioChipTone;
};

export type OperationPortfolioOutcomePreviewPresentation = {
  visible: boolean;
  tonePreview: string;
  chips: OperationPortfolioOutcomePreviewChip[];
  balanceRatio: number;
  balanceLeftLabel: string;
  balanceRightLabel: string;
};

export type OperationPortfolioHubAlignment = {
  hubTodayFocus?: string;
  hubPrimaryOperationTitle?: string;
  hubPrimaryEventId?: string;
  boardPrimaryEventId?: string;
  alignedWithHub: boolean;
  alignmentNote?: string;
};

export type OperationPortfolioBoardPresentation = {
  isVisible: boolean;
  isDay1: boolean;
  isRichDay: boolean;
  hero: OperationPortfolioHeroPresentation;
  primarySlot: OperationPortfolioSlotPresentation | null;
  secondarySlots: OperationPortfolioSlotPresentation[];
  pendingSignals: OperationPortfolioPendingSignal[];
  capacity: OperationPortfolioCapacityPresentation;
  conflicts: OperationPortfolioConflictPresentation;
  suggestedPlan: OperationPortfolioSuggestedPlanPresentation;
  outcomePreview: OperationPortfolioOutcomePreviewPresentation;
  hubAlignment: OperationPortfolioHubAlignment;
  collectStrings: () => string[];
};
