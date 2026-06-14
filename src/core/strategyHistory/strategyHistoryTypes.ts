import type { DominantStrategyPattern } from '@/core/dominantStrategyDetector/dominantStrategyDetectorTypes';
import type {
  FollowUpExecutionKind,
  FollowUpExecutionStatus,
} from '@/core/followUpExecution/followUpExecutionTypes';

export type StrategyDecisionTone = 'positive' | 'neutral' | 'cautious' | 'negative';

export type StrategyDecisionHistoryRecord = {
  id: string;
  day: number;
  eventId: string;
  decisionId: string;
  decisionLabel: string;
  selectedDecisionKind?: string;
  districtId?: string;
  districtName?: string;
  domainTags: string[];
  tone: StrategyDecisionTone;
  sourceIds: string[];
  createdAt: string;
};

export type StrategyOperationChoiceRecord = {
  id: string;
  day: number;
  operationId: string;
  choiceId: string;
  choiceLabel: string;
  districtId?: string;
  districtName?: string;
  domainTags: string[];
  sourceIds: string[];
  createdAt: string;
};

export type StrategyPortfolioChoiceRecord = {
  id: string;
  day: number;
  itemId: string;
  itemKind: string;
  decision: 'select' | 'defer' | 'ignore';
  districtId?: string;
  districtName?: string;
  domainTags: string[];
  sourceIds: string[];
  createdAt: string;
};

export type StrategyFollowUpExecutionRecord = {
  id: string;
  day: number;
  actionId: string;
  kind: FollowUpExecutionKind;
  status: FollowUpExecutionStatus;
  districtId?: string;
  districtName?: string;
  sourceIds: string[];
  createdAt: string;
};

export type StrategyDominantSurface = 'hub' | 'report' | 'ece';

export type StrategyDominantSurfacedRecord = {
  id: string;
  day: number;
  pattern: DominantStrategyPattern;
  surface: StrategyDominantSurface;
  sourceIds: string[];
  createdAt: string;
};

export type StrategyHistoryStateV1 = {
  decisionHistory: StrategyDecisionHistoryRecord[];
  operationChoiceHistory: StrategyOperationChoiceRecord[];
  portfolioChoiceHistory: StrategyPortfolioChoiceRecord[];
  followUpExecutionHistory: StrategyFollowUpExecutionRecord[];
  dominantStrategySurfacedHistory: StrategyDominantSurfacedRecord[];
  lastPrunedDay: number | null;
};
